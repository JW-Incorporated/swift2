/** Cache-key and last-good helpers for `load.ts` (split out for the 300-line limit). */
import type { z } from 'zod';
import type { Manifest } from './schema';
import { lookupSchema } from './validation-contract';
import type { StorageAdapter } from './cache';
import { isSchemaVersionSupported } from './compat';
import { pruneUnknownEnumValues, type PruneResult } from './forward-compat';
import { lastGoodJson, readWarmCache, SCHEMA_FINGERPRINT, type WarmBundle } from './warm-cache';
import { SUPPORTED_SCHEMA_VERSION, type BundleFiles, type LoadBundleOptions } from './load-types';

export const CACHE_KEY_PREFIX = '@swift2/content:v1:';
export const keyFor = (baseUrl: string, suffix: string) => `${CACHE_KEY_PREFIX}${baseUrl}:${suffix}`;

export interface CachedBundleRecord {
  manifest: Manifest;
  files: BundleFiles;
}

export async function storeGet(storage: StorageAdapter, key: string): Promise<string | null> {
  return (await storage.getItem(key)) ?? null;
}

export async function storeSet(storage: StorageAdapter, key: string, value: string): Promise<void> {
  await storage.setItem(key, value);
}

export async function fetchLastGoodBundle(
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

/** Parse one entry against `schema`; under `dropUnknown`, prune unknown enum values first. Mutates `value`. */
export function validateEntry(
  schema: z.ZodTypeAny,
  value: unknown,
  dropUnknown: boolean,
): PruneResult {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { kind: 'ok', data: parsed.data, removed: 0 };
  if (!dropUnknown) return { kind: 'invalid', issues: parsed.error.issues };
  return pruneUnknownEnumValues(schema, value);
}

/**
 * The cache outlives OTA updates, so a last-good record may have been written
 * by a different JS build. Re-check it against THIS build (schema window and
 * every file, same rules as a network load) before serving it; null = unusable.
 */
export function revalidateLastGood(
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

const completeKeyFor = (baseUrl: string, bundleVersion: string) =>
  // Key name `etag:` and source value 'cache-etag' are kept deliberately: existing
  // installs already hold this key, and renaming the source would break callers.
  // The fingerprint is part of both keys so a build with different schemas never
  // sees files an older build's zod parse may have stripped (#4800).
  keyFor(baseUrl, `etag:${bundleVersion}:${SCHEMA_FINGERPRINT}`);
const filesKeyFor = (baseUrl: string, bundleVersion: string) =>
  keyFor(baseUrl, `files:${bundleVersion}:${SCHEMA_FINGERPRINT}`);

/**
 * `bundleVersion` is the bundle's content hash and its URL directory is
 * immutable, so a fully validated cached copy of this exact version needs no
 * manifest or file downloads. Plain requests only: a conditional header
 * (If-None-Match) would force a CORS preflight from the app's opaque origin.
 * Any truthy marker counts, including a legacy ETag string: the previous code
 * wrote it only after the whole bundle was fetched and validated, and '' for
 * pruned loads. An unreadable cache falls through to the network load (null).
 */
export async function readCompleteCache(
  storage: StorageAdapter,
  baseUrl: string,
  bundleVersion: string,
  schemaVersion: number,
): Promise<WarmBundle | null> {
  if (!(await storeGet(storage, completeKeyFor(baseUrl, bundleVersion)))) return null;
  const cachedRaw = await storeGet(storage, keyFor(baseUrl, `manifest:${bundleVersion}`));
  const cachedFilesRaw = await storeGet(storage, filesKeyFor(baseUrl, bundleVersion));
  if (!cachedRaw || !cachedFilesRaw) return null;
  const schemaFpKey = keyFor(baseUrl, `schemafp:${bundleVersion}`);
  // The fingerprint says this build's schemas already validated these bytes.
  const trusted = (await storeGet(storage, schemaFpKey)) === SCHEMA_FINGERPRINT;
  const warm = readWarmCache(cachedRaw, cachedFilesRaw, schemaVersion, lookupSchema, trusted);
  if (warm && !trusted) {
    try {
      await storeSet(storage, schemaFpKey, SCHEMA_FINGERPRINT);
    } catch {
      // best effort: the next warm launch just validates again
    }
  }
  return warm;
}

/** A partial (pruned/skipped) load writes ONLY last-good: it never touches the version-keyed manifest/files/marker trio, so an overlapping full load of the same version can never be overwritten by pruned data. */
export async function persistPartialLoad(
  storage: StorageAdapter,
  baseUrl: string,
  manifest: Manifest,
  files: BundleFiles,
): Promise<void> {
  await storeSet(storage, keyFor(baseUrl, 'last-good'), JSON.stringify({ manifest, files }));
}

/**
 * Full load — once the manifest AND every file it lists have been fetched and
 * validated together — persist the cache so a warm load can never find the
 * complete marker without its matching files: the marker is cleared first and
 * set LAST, so a failed write mid-way leaves it unset.
 */
export async function persistFullLoad(
  storage: StorageAdapter,
  baseUrl: string,
  bundleVersion: string,
  manifest: Manifest,
  files: BundleFiles,
): Promise<void> {
  const completeKey = completeKeyFor(baseUrl, bundleVersion);
  const schemaFpKey = keyFor(baseUrl, `schemafp:${bundleVersion}`);
  const manifestJson = JSON.stringify(manifest);
  const filesJson = JSON.stringify(files);
  await storeSet(storage, completeKey, '');
  await storeSet(storage, keyFor(baseUrl, `manifest:${bundleVersion}`), manifestJson);
  await storeSet(storage, filesKeyFor(baseUrl, bundleVersion), filesJson);
  await storeSet(storage, keyFor(baseUrl, 'last-good'), lastGoodJson(manifestJson, filesJson));
  const previousFp = await storeGet(storage, schemaFpKey);
  await storeSet(storage, schemaFpKey, SCHEMA_FINGERPRINT);
  await storeSet(storage, completeKey, '1');
  if (previousFp && previousFp !== SCHEMA_FINGERPRINT) {
    // The previous build's version-keyed entries (several MB) can never be read again.
    for (const stale of [`etag:${bundleVersion}:${previousFp}`, `files:${bundleVersion}:${previousFp}`]) {
      try {
        await storage.removeItem?.(keyFor(baseUrl, stale));
      } catch {
        // best effort: leftover bytes are harmless
      }
    }
  }
}
