/**
 * `packages/content` loader (OS-013, `docs/specs/2026-09-05-one-source-three-
 * surfaces.md` §2 + §6). One way to load the published content bundle on any
 * runtime: web (build time, no persistent storage) and mobile (persistent
 * cache via an injected `StorageAdapter`, OS-015).
 *
 * Wire format on `baseUrl` (published by `scripts/build-content-bundle.mjs`,
 * OS-011/OS-012):
 *
 *   <baseUrl>/current.json                     { bundleVersion }   (short TTL)
 *   <baseUrl>/<bundleVersion>/manifest.json     Manifest (see schema.ts)
 *   <baseUrl>/<bundleVersion>/<entry.path>      one validated file per manifest entry
 *
 * Flow: fetch `current.json` to learn the current `bundleVersion`, fetch that
 * version's `manifest.json` (conditionally, with `If-None-Match` against a
 * previously-stored ETag — a 304 short-circuits straight to the cached,
 * already-validated bundle), then fetch every file the manifest lists,
 * verifying byte length + sha256 against the manifest entry before parsing it
 * against its zod schema.
 *
 * Stale-while-revalidate fallback is deliberately narrow: it only fires when
 * the *transport* fails (the fetch call itself throws — DNS/offline/timeout —
 * or the server returns a non-2xx/non-304 status). It never fires for a
 * problem in the *data* the server actually returned: a malformed JSON body,
 * a manifest/file that fails its zod schema, or a byte-length/sha256
 * mismatch always throws (`BundleIntegrityError`) even when a last-good
 * bundle is cached, because serving old content in place of a real,
 * reachable, but corrupted/broken publish would hide a genuine bug rather
 * than paper over a connectivity blip. A `schemaVersion` the loader doesn't
 * support likewise always throws `SchemaVersionMismatchError` — never
 * silently falls back.
 *
 * The manifest/etag/files/last-good cache entries are only written once the
 * *entire* bundle (every listed file) has been fetched and validated, all in
 * one batch — so a later run never finds a manifest+etag cached without a
 * matching validated file set (which would otherwise make a legitimate
 * server 304 look like corrupted local state).
 */
import { z } from 'zod';
import { contentBundleSchemas, manifestSchema, type Manifest } from './schema';
import { MemoryStorageAdapter, type StorageAdapter } from './cache';
import { createHash } from './hash';
import { assertSchemaVersionSupported, CURRENT_SCHEMA_VERSION } from './compat';

/** Re-exported for anyone importing `SUPPORTED_SCHEMA_VERSION` from `./load` directly. Delegates to `./compat`'s `CURRENT_SCHEMA_VERSION` (OS-041) — the single source of truth for the schemaVersion this loader build targets, including its N-1 compatibility window. */
export const SUPPORTED_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

const pointerSchema = z.object({
  bundleVersion: z.string().min(1),
});

/** Minimal subset of the standard `Response` shape the loader needs — satisfied by the global `fetch` in browsers, Node 18+, and Expo, and trivially fakeable in tests. */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers: { get(name: string): string | null };
}

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<FetchResponseLike>;

export interface LoadBundleOptions {
  /** Where the bundle is published, e.g. `https://www.longlivets.com/content` or a Supabase Storage bucket URL. No trailing slash required. */
  baseUrl: string;
  /** Injectable fetch implementation. Defaults to `globalThis.fetch`. */
  fetch?: FetchLike;
  /** Injectable storage adapter. Defaults to an in-memory adapter (durable for this process only). Pass a real adapter (e.g. `expo-file-system`-backed on mobile) to persist a last-good bundle across app restarts. */
  storage?: StorageAdapter;
  /** Schema version this loader build supports. Defaults to `SUPPORTED_SCHEMA_VERSION`; override only in tests. */
  schemaVersion?: number;
}

export type BundleFiles = Record<string, unknown>;

export type LoadSource = 'network' | 'cache-etag' | 'offline-last-good';

export interface LoadedBundle {
  manifest: Manifest;
  /** Manifest entry name -> the file's content, already zod-validated. */
  files: BundleFiles;
  source: LoadSource;
  /** True when this bundle was served from the last-good offline cache because the transport (network/server) was unreachable, not because it was freshly confirmed current. */
  stale: boolean;
}

export class BundleLoadError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BundleLoadError';
  }
}

export class SchemaVersionMismatchError extends Error {
  constructor(
    readonly found: number,
    readonly supported: number,
    cause?: unknown,
  ) {
    super(
      `Content bundle schemaVersion ${found} is not supported by this build (this loader ` +
        `supports schemaVersion ${supported}, plus its N-1 window per OS-041's compatibility ` +
        `policy — see ./compat.ts). Ship a build whose packages/content loader understands ` +
        `schemaVersion ${found} before publishing a bundle at that version.` +
        (cause instanceof Error ? ` (${cause.message})` : ''),
    );
    this.name = 'SchemaVersionMismatchError';
  }
}

export class BundleIntegrityError extends Error {
  constructor(
    readonly fileName: string,
    detail: string,
  ) {
    super(`Content bundle file "${fileName}" failed integrity check: ${detail}`);
    this.name = 'BundleIntegrityError';
  }
}

/**
 * Marks a failure as transport-level (unreachable server, network throw, or a
 * non-2xx/non-304 HTTP status) — the ONLY category of failure that may fall
 * back to a cached last-good bundle. Anything else (JSON parse errors, zod
 * validation, integrity mismatches, schema version mismatches) is a data
 * problem with a genuinely reachable response and must never be silently
 * papered over by stale-while-revalidate.
 */
class TransportError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TransportError';
  }
}

/** Same manifest-entry-name -> schema mapping the OS-010 fixture test uses (`content:<eraId>` prefix -> the per-era content file schema; everything else keyed directly into `contentBundleSchemas`). */
function schemaForManifestEntry(name: string): z.ZodTypeAny {
  if (name.startsWith('content:')) return contentBundleSchemas.content;
  const schema = (contentBundleSchemas as Record<string, z.ZodTypeAny>)[name];
  if (!schema) {
    throw new BundleLoadError(
      `No schema mapped for manifest entry "${name}" — update schemaForManifestEntry() in load.ts.`,
    );
  }
  return schema;
}

const CACHE_KEY_PREFIX = '@swift2/content:v1:';
const keyFor = (baseUrl: string, suffix: string) => `${CACHE_KEY_PREFIX}${baseUrl}:${suffix}`;

interface CachedBundleRecord {
  manifest: Manifest;
  files: BundleFiles;
}

async function storeGet(storage: StorageAdapter, key: string): Promise<string | null> {
  return (await storage.getItem(key)) ?? null;
}

async function storeSet(storage: StorageAdapter, key: string, value: string): Promise<void> {
  await storage.setItem(key, value);
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function fetchLastGoodBundle(
  storage: StorageAdapter,
  baseUrl: string,
): Promise<CachedBundleRecord | null> {
  const raw = await storeGet(storage, keyFor(baseUrl, 'last-good'));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedBundleRecord;
  } catch {
    return null;
  }
}

/** Calls `fetchImpl`, converting a network-level throw (offline, DNS, timeout) into a `TransportError` so callers can distinguish it from a data problem in an otherwise-successful response. */
async function transportFetch(
  fetchImpl: FetchLike,
  url: string,
  init?: { headers?: Record<string, string> },
): Promise<FetchResponseLike> {
  try {
    return await fetchImpl(url, init);
  } catch (err) {
    throw new TransportError(`Network request to ${url} failed`, err);
  }
}

/** Reads and JSON-parses a response body. A malformed body is a DATA problem (the server was reached, it just returned garbage) — never converted to `TransportError`, so it is never masked by the stale-while-revalidate fallback. */
async function readJson<T>(res: FetchResponseLike): Promise<T> {
  const text = await res.text();
  return JSON.parse(text) as T;
}

/**
 * Load the content bundle, validating everything against `schema.ts` before
 * returning it. See module doc for the full flow and fallback behavior.
 */
export async function loadBundle(options: LoadBundleOptions): Promise<LoadedBundle> {
  const { baseUrl } = options;
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined);
  const storage = options.storage ?? new MemoryStorageAdapter();
  const schemaVersion = options.schemaVersion ?? SUPPORTED_SCHEMA_VERSION;

  if (!fetchImpl) {
    throw new BundleLoadError(
      'No fetch implementation available — pass one via loadBundle({ fetch })',
    );
  }

  /** Transport-only fallback: only reached for `TransportError` (see module doc). Any other error propagates to the caller untouched. */
  async function fallbackOrRethrow(err: unknown, contextMessage: string): Promise<LoadedBundle> {
    if (!(err instanceof TransportError)) throw err;
    const lastGood = await fetchLastGoodBundle(storage, baseUrl);
    if (lastGood) {
      return {
        manifest: lastGood.manifest,
        files: lastGood.files,
        source: 'offline-last-good',
        stale: true,
      };
    }
    throw new BundleLoadError(contextMessage, err);
  }

  let bundleVersion: string;
  try {
    const pointerRes = await transportFetch(fetchImpl, joinUrl(baseUrl, 'current.json'));
    if (!pointerRes.ok) {
      throw new TransportError(`Fetching current.json failed with HTTP ${pointerRes.status}`);
    }
    const pointerRaw = await readJson<unknown>(pointerRes);
    bundleVersion = pointerSchema.parse(pointerRaw).bundleVersion;
  } catch (err) {
    return fallbackOrRethrow(
      err,
      'Failed to load current.json and no offline last-good bundle is cached',
    );
  }

  const manifestUrl = joinUrl(baseUrl, `${bundleVersion}/manifest.json`);
  const manifestCacheKey = keyFor(baseUrl, `manifest:${bundleVersion}`);
  const etagKey = keyFor(baseUrl, `etag:${bundleVersion}`);
  const filesCacheKey = keyFor(baseUrl, `files:${bundleVersion}`);

  let manifest: Manifest;
  let manifestEtagToStore: string | undefined;

  try {
    const storedEtag = await storeGet(storage, etagKey);
    const headers: Record<string, string> = {};
    if (storedEtag) headers['If-None-Match'] = storedEtag;

    const manifestRes = await transportFetch(fetchImpl, manifestUrl, { headers });

    if (manifestRes.status === 304) {
      const cachedRaw = await storeGet(storage, manifestCacheKey);
      const cachedFilesRaw = await storeGet(storage, filesCacheKey);
      if (!cachedRaw || !cachedFilesRaw) {
        // The server thinks we already have this exact manifest+files (we
        // sent its own previously-issued ETag back to it), but our local
        // cache doesn't actually have them — a genuine local-state bug, not
        // a connectivity problem, so this must NOT be silently treated as
        // "offline, serve last-good"; it needs to surface as an error.
        throw new BundleLoadError(
          'Server returned 304 Not Modified for a cached ETag, but no matching manifest/files ' +
            'are cached locally — local cache state is inconsistent with the stored ETag.',
        );
      }
      manifest = manifestSchema.parse(JSON.parse(cachedRaw));
      // A 304 means this exact bundleVersion's manifest and files are unchanged
      // since we last validated them — return the cached files directly instead
      // of re-fetching and re-validating every file over the network.
      return {
        manifest,
        files: JSON.parse(cachedFilesRaw) as BundleFiles,
        source: 'cache-etag',
        stale: false,
      };
    } else if (manifestRes.ok) {
      const manifestRaw = await readJson<unknown>(manifestRes);
      manifest = manifestSchema.parse(manifestRaw);
      manifestEtagToStore =
        manifestRes.headers.get('etag') ?? manifestRes.headers.get('ETag') ?? undefined;
    } else {
      throw new TransportError(`Fetching manifest.json failed with HTTP ${manifestRes.status}`);
    }
  } catch (err) {
    return fallbackOrRethrow(
      err,
      'Failed to load manifest.json and no offline last-good bundle is cached',
    );
  }

  if (manifest.schemaVersion !== schemaVersion) {
    try {
      assertSchemaVersionSupported(manifest, schemaVersion);
    } catch (err) {
      throw new SchemaVersionMismatchError(manifest.schemaVersion, schemaVersion, err);
    }
  }

  const files: BundleFiles = {};
  try {
    for (const [name, entry] of Object.entries(manifest.files)) {
      const fileRes = await transportFetch(
        fetchImpl,
        joinUrl(baseUrl, `${bundleVersion}/${entry.path}`),
      );
      if (!fileRes.ok) {
        throw new TransportError(`Fetching "${entry.path}" failed with HTTP ${fileRes.status}`);
      }
      const text = await fileRes.text();
      const byteLength = new TextEncoder().encode(text).length;
      if (byteLength !== entry.bytes) {
        throw new BundleIntegrityError(name, `expected ${entry.bytes} bytes, got ${byteLength}`);
      }
      const actualHash = await createHash(text);
      if (actualHash !== entry.sha256) {
        throw new BundleIntegrityError(
          name,
          `sha256 mismatch (expected ${entry.sha256}, got ${actualHash})`,
        );
      }
      const schema = schemaForManifestEntry(name);
      const parsed = schema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        throw new BundleIntegrityError(
          name,
          `schema validation failed: ${JSON.stringify(parsed.error.issues)}`,
        );
      }
      files[name] = parsed.data;
    }
  } catch (err) {
    return fallbackOrRethrow(
      err,
      'Failed to fetch a bundle file and no offline last-good bundle is cached',
    );
  }

  // Only now — once the manifest AND every file it lists have been fetched
  // and validated together — persist the cache atomically, so a future 304
  // can never find a manifest+etag on disk without its matching files.
  await storeSet(storage, manifestCacheKey, JSON.stringify(manifest));
  if (manifestEtagToStore) await storeSet(storage, etagKey, manifestEtagToStore);
  await storeSet(storage, filesCacheKey, JSON.stringify(files));
  await storeSet(storage, keyFor(baseUrl, 'last-good'), JSON.stringify({ manifest, files }));

  return { manifest, files, source: 'network', stale: false };
}
