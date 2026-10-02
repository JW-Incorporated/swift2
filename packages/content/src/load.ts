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
 * version's `manifest.json` (skipped entirely when a fully validated copy of
 * that exact version is cached — `bundleVersion` is a content hash, so equal
 * version means identical bundle; no conditional headers are ever sent), then
 * fetch every file the manifest lists,
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
 * That is the default, and what build-time callers want. Installed apps opt
 * out with `unknownEnumPolicy: 'drop'` and `dataErrorFallback: 'last-good'`
 * (docs/decisions.md 2026-10-01): a bundle published after the app's JS must
 * degrade, not blank the app.
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
import {
  assertSchemaVersionSupported,
  CURRENT_SCHEMA_VERSION,
  isSchemaVersionSupported,
} from './compat';
import { pruneUnknownEnumValues, type PruneResult } from './forward-compat';

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
  /**
   * `'reject'` (default): an unknown enum value or manifest entry fails the load.
   * `'drop'` (installed apps): unknown enum values are pruned via
   * `pruneUnknownEnumValues` and manifest entries with no schema in this build
   * are skipped; both are listed on `skipped`. See docs/decisions.md 2026-10-01.
   */
  unknownEnumPolicy?: 'reject' | 'drop';
  /**
   * `'throw'` (default): a data error always throws. `'last-good'`: a data
   * error (see `isDataError`) serves the cached last-good bundle with
   * `source: 'last-good-after-data-error'` and the error on `dataError`;
   * still throws when nothing is cached.
   */
  dataErrorFallback?: 'throw' | 'last-good';
}

export type BundleFiles = Record<string, unknown>;

export type LoadSource =
  'network' | 'cache-etag' | 'offline-last-good' | 'last-good-after-data-error';

export interface LoadedBundle {
  manifest: Manifest;
  /** Manifest entry name -> the file's content, already zod-validated. */
  files: BundleFiles;
  source: LoadSource;
  /** True when this bundle was served from the last-good cache (transport failure, or a data error under `dataErrorFallback: 'last-good'`), not freshly confirmed current. */
  stale: boolean;
  /** The data error that made this load fall back (`source: 'last-good-after-data-error'` only). */
  dataError?: Error;
  /** Manifest entries left out under `unknownEnumPolicy: 'drop'` (no schema in this build, or the whole file held an unknown value). */
  skipped?: string[];
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

/** Same manifest-entry-name -> schema mapping the OS-010 fixture test uses (`content:<eraId>` prefix -> the per-era content file schema; everything else keyed directly into `contentBundleSchemas`). Undefined when this build has no schema for `name`. */
function lookupSchema(name: string): z.ZodTypeAny | undefined {
  if (name.startsWith('content:')) return contentBundleSchemas.content;
  return (contentBundleSchemas as Record<string, z.ZodTypeAny>)[name];
}

function schemaForManifestEntry(name: string): z.ZodTypeAny {
  const schema = lookupSchema(name);
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

/** A problem in data the server actually returned (never a transport failure) — the only errors `dataErrorFallback: 'last-good'` may absorb. */
export function isDataError(err: unknown): err is Error {
  return (
    err instanceof SchemaVersionMismatchError ||
    err instanceof BundleIntegrityError ||
    err instanceof SyntaxError ||
    err instanceof z.ZodError
  );
}

/**
 * Load the content bundle, validating everything against `schema.ts` before
 * returning it. See module doc for the full flow and fallback behavior.
 */
export async function loadBundle(options: LoadBundleOptions): Promise<LoadedBundle> {
  try {
    return await loadBundleStrict(options);
  } catch (err) {
    if (options.dataErrorFallback !== 'last-good' || !isDataError(err)) throw err;
    const lastGood = await fetchLastGoodBundle(
      options.storage ?? new MemoryStorageAdapter(),
      options.baseUrl,
    );
    const readable = lastGood && revalidateLastGood(lastGood, options);
    if (!readable) throw err;
    return {
      manifest: lastGood.manifest,
      files: readable.files,
      source: 'last-good-after-data-error',
      stale: true,
      dataError: err,
      ...(readable.skipped.length ? { skipped: readable.skipped } : {}),
    };
  }
}

/**
 * The cache outlives OTA updates, so a last-good record may have been written
 * by a different JS build. Re-check it against THIS build (schema window and
 * every file, same rules as a network load) before serving it; null = unusable.
 */
function revalidateLastGood(
  record: CachedBundleRecord,
  options: LoadBundleOptions,
): { files: BundleFiles; skipped: string[] } | null {
  const schemaVersion = options.schemaVersion ?? SUPPORTED_SCHEMA_VERSION;
  if (!isSchemaVersionSupported(record.manifest?.schemaVersion, schemaVersion)) return null;
  if (!record.files || typeof record.files !== 'object') return null;
  const dropUnknown = options.unknownEnumPolicy === 'drop';
  const files: BundleFiles = {};
  const skipped: string[] = [];
  for (const [name, value] of Object.entries(record.files)) {
    const schema = lookupSchema(name);
    if (!schema) {
      if (!dropUnknown) return null;
      skipped.push(name);
      continue;
    }
    const result = validateEntry(schema, value, dropUnknown);
    if (result.kind === 'invalid') return null;
    if (result.kind === 'drop-file') skipped.push(name);
    else files[name] = result.data;
  }
  return { files, skipped };
}

/** Parse one entry against `schema`; under `dropUnknown`, prune unknown enum values first. Mutates `value`. */
function validateEntry(schema: z.ZodTypeAny, value: unknown, dropUnknown: boolean): PruneResult {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { kind: 'ok', data: parsed.data, removed: 0 };
  if (!dropUnknown) return { kind: 'invalid', issues: parsed.error.issues };
  return pruneUnknownEnumValues(schema, value);
}

/**
 * Re-checks a cached bundle before the warm shortcut returns it: manifest
 * parses and its schemaVersion is supported, every manifest entry is present in
 * the files record, and each passes the same schema the network path applies
 * (strict, no pruning — pruned loads are never marked complete). sha256 is NOT
 * recomputed, matching the previous 304 shortcut. Null = unusable, so the
 * caller falls through to a network load.
 */
function readWarmCache(
  manifestRaw: string,
  filesRaw: string,
  schemaVersion: number,
): { manifest: Manifest; files: BundleFiles } | null {
  try {
    const manifest = manifestSchema.parse(JSON.parse(manifestRaw));
    if (!isSchemaVersionSupported(manifest.schemaVersion, schemaVersion)) return null;
    const files = JSON.parse(filesRaw) as BundleFiles;
    if (!files || typeof files !== 'object') return null;
    for (const name of Object.keys(manifest.files)) {
      const schema = lookupSchema(name);
      if (!schema || !(name in files)) return null;
      if (!schema.safeParse(files[name]).success) return null;
    }
    return { manifest, files };
  } catch {
    return null;
  }
}

async function loadBundleStrict(options: LoadBundleOptions): Promise<LoadedBundle> {
  const { baseUrl } = options;
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined);
  const storage = options.storage ?? new MemoryStorageAdapter();
  const schemaVersion = options.schemaVersion ?? SUPPORTED_SCHEMA_VERSION;
  const dropUnknown = options.unknownEnumPolicy === 'drop';

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
  // Key name `etag:` and source value 'cache-etag' are kept deliberately: existing
  // installs already hold this key, and renaming the source would break callers.
  const completeKey = keyFor(baseUrl, `etag:${bundleVersion}`);
  const filesCacheKey = keyFor(baseUrl, `files:${bundleVersion}`);

  let manifest: Manifest;

  // `bundleVersion` is the bundle's content hash and its URL directory is
  // immutable, so a fully validated cached copy of this exact version needs no
  // manifest or file downloads. Plain requests only: a conditional header
  // (If-None-Match) would force a CORS preflight from the app's opaque origin.
  // Any truthy marker counts, including a legacy ETag string: the previous code
  // wrote it only after the whole bundle was fetched and validated, and '' for
  // pruned loads. An unreadable cache falls through to the network load.
  if (await storeGet(storage, completeKey)) {
    const cachedRaw = await storeGet(storage, manifestCacheKey);
    const cachedFilesRaw = await storeGet(storage, filesCacheKey);
    if (cachedRaw && cachedFilesRaw) {
      const warm = readWarmCache(cachedRaw, cachedFilesRaw, schemaVersion);
      if (warm) return { ...warm, source: 'cache-etag', stale: false };
    }
  }

  try {
    const manifestRes = await transportFetch(fetchImpl, manifestUrl);

    if (manifestRes.ok) {
      const manifestRaw = await readJson<unknown>(manifestRes);
      manifest = manifestSchema.parse(manifestRaw);
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
  const skipped: string[] = [];
  let pruned = false;
  try {
    for (const [name, entry] of Object.entries(manifest.files)) {
      if (dropUnknown && !lookupSchema(name)) {
        // A catalogue added after this build; nothing here could read it.
        skipped.push(name);
        continue;
      }
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
      const result = validateEntry(schema, JSON.parse(text), dropUnknown);
      if (result.kind === 'invalid') {
        throw new BundleIntegrityError(
          name,
          `schema validation failed: ${JSON.stringify(result.issues)}`,
        );
      }
      if (result.kind === 'drop-file') {
        pruned = true;
        skipped.push(name);
      } else {
        if (result.removed > 0) pruned = true;
        files[name] = result.data;
      }
    }
  } catch (err) {
    return fallbackOrRethrow(
      err,
      'Failed to fetch a bundle file and no offline last-good bundle is cached',
    );
  }

  // Only now — once the manifest AND every file it lists have been fetched
  // and validated together — persist the cache atomically, so a future warm
  // load can never find the complete marker without its matching files. The
  // marker is cleared first and set LAST, so a failed write mid-way leaves it unset.
  await storeSet(storage, completeKey, '');
  await storeSet(storage, manifestCacheKey, JSON.stringify(manifest));
  // A pruned load is never marked complete: once a newer build (that knows the
  // new values) is running, the warm shortcut must not keep serving pruned
  // files. '' clears a marker an earlier full load stored (storeGet: '' = absent).
  const partial = pruned || skipped.length > 0;
  await storeSet(storage, filesCacheKey, JSON.stringify(files));
  await storeSet(storage, keyFor(baseUrl, 'last-good'), JSON.stringify({ manifest, files }));
  if (!partial) await storeSet(storage, completeKey, '1');

  return {
    manifest,
    files,
    source: 'network',
    stale: false,
    ...(skipped.length ? { skipped } : {}),
  };
}
