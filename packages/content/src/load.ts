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
 * The version-keyed manifest/files/complete-marker entries are only written
 * by a FULL load, once the *entire* bundle has been fetched and validated (marker
 * cleared first, set last). A partial (pruned/skipped) load writes only
 * last-good, so it can never clobber a full load of the same version.
 */
import { z } from 'zod';
import { manifestSchema, type Manifest } from './schema';
import { MemoryStorageAdapter } from './cache';
import { assertSchemaVersionSupported } from './compat';
import { beginStage } from './timing';
import {
  BundleLoadError,
  isDataError,
  LOAD_SOURCE,
  SchemaVersionMismatchError,
  SUPPORTED_SCHEMA_VERSION,
  TransportError,
  type FetchLike,
  type LoadBundleOptions,
  type LoadedBundle,
} from './load-types';
import { DEFAULT_REQUEST_TIMEOUT_MS, joinUrl, readJson, transportFetch } from './load-transport';
import {
  fetchLastGoodBundle,
  persistFullLoad,
  persistPartialLoad,
  readCompleteCache,
  readLastGoodVersion,
  readReusableBundle,
  revalidateLastGood,
} from './load-cache';
import { fetchBundleFiles } from './load-files';

export {
  BundleIntegrityError,
  BundleLoadError,
  isDataError,
  LOAD_SOURCE,
  SchemaVersionMismatchError,
  SUPPORTED_SCHEMA_VERSION,
} from './load-types';
export type {
  BundleFiles,
  FetchLike,
  FetchResponseLike,
  LoadBundleOptions,
  LoadedBundle,
  LoadSource,
} from './load-types';

const pointerSchema = z.object({
  bundleVersion: z.string().min(1),
});

/**
 * Load the content bundle, validating everything against `schema.ts` before
 * returning it. See module doc for the full flow and fallback behavior.
 */
export async function loadBundle(options: LoadBundleOptions): Promise<LoadedBundle> {
  const endTotal = beginStage('load-total');
  try {
    const loaded = await loadBundleStrict(options);
    endTotal(loaded.source);
    return loaded;
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
      source: LOAD_SOURCE.lastGoodAfterDataError,
      stale: true,
      dataError: err,
      ...(readable.skipped.length ? { skipped: readable.skipped } : {}),
    };
  }
}

async function loadBundleStrict(options: LoadBundleOptions): Promise<LoadedBundle> {
  const { baseUrl } = options;
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined);
  const storage = options.storage ?? new MemoryStorageAdapter();
  const schemaVersion = options.schemaVersion ?? SUPPORTED_SCHEMA_VERSION;
  const dropUnknown = options.unknownEnumPolicy === 'drop';
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

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
        source: LOAD_SOURCE.offlineLastGood,
        stale: true,
      };
    }
    throw new BundleLoadError(contextMessage, err);
  }

  let bundleVersion: string;
  const endPointer = beginStage('pointer');
  try {
    const pointerRes = await transportFetch(
      fetchImpl,
      joinUrl(baseUrl, 'current.json'),
      undefined,
      requestTimeoutMs,
    );
    if (!pointerRes.ok) {
      throw new TransportError(`Fetching current.json failed with HTTP ${pointerRes.status}`);
    }
    const pointerRaw = await readJson<unknown>(pointerRes);
    bundleVersion = pointerSchema.parse(pointerRaw).bundleVersion;
    endPointer();
  } catch (err) {
    return fallbackOrRethrow(
      err,
      'Failed to load current.json and no offline last-good bundle is cached',
    );
  }

  const manifestUrl = joinUrl(baseUrl, `${bundleVersion}/manifest.json`);

  const warm = await readCompleteCache(storage, baseUrl, bundleVersion, schemaVersion);
  if (warm) {
    // WP0.1 diagnostics classify a warm load by manifest detail '304'; keep that signal.
    beginStage('manifest')('304');
    return { ...warm, source: 'cache-etag', stale: false };
  }

  let manifest: Manifest;

  const endManifest = beginStage('manifest');
  try {
    const manifestRes = await transportFetch(fetchImpl, manifestUrl, undefined, requestTimeoutMs);

    if (manifestRes.ok) {
      const manifestRaw = await readJson<unknown>(manifestRes);
      manifest = manifestSchema.parse(manifestRaw);
      endManifest('200');
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

  const startedFrom = await readLastGoodVersion(storage, baseUrl);
  const reusable = await readReusableBundle(storage, baseUrl);
  let files: LoadedBundle['files'];
  let skipped: string[];
  let pruned: boolean;
  try {
    ({ files, skipped, pruned } = await fetchBundleFiles({
      manifest,
      bundleVersion,
      baseUrl,
      fetchImpl,
      requestTimeoutMs,
      dropUnknown,
      reusable,
    }));
  } catch (err) {
    return fallbackOrRethrow(
      err,
      'Failed to fetch a bundle file and no offline last-good bundle is cached',
    );
  }

  const partial = pruned || skipped.length > 0;
  const endDiskWrite = beginStage('disk-write');
  if (partial) {
    await persistPartialLoad(storage, baseUrl, manifest, files);
    endDiskWrite();
    return {
      manifest,
      files,
      source: 'network',
      stale: false,
      ...(skipped.length ? { skipped } : {}),
    };
  }

  await persistFullLoad(
    storage,
    baseUrl,
    bundleVersion,
    manifest,
    files,
    startedFrom,
  );
  endDiskWrite();


  return {
    manifest,
    files,
    source: 'network',
    stale: false,
    ...(skipped.length ? { skipped } : {}),
  };
}
