// Shared file-system-backed `StorageAdapter` (OS-013's `@swift2/content`
// contract) + published-bundle base URL.
import * as FileSystem from 'expo-file-system';
import type { StorageAdapter } from '@swift2/content';

/**
 * Where the published bundle lives. Same convention as the web
 * (`apps/web/next.config.*` writes to `public/content/`, mirrored to
 * Supabase Storage by OS-012's publish job) — mobile reads the public,
 * CDN-fronted URL directly since it has no build-time filesystem to bake
 * content into. Overridable via `EXPO_PUBLIC_CONTENT_BASE_URL` for local
 * dev against a non-production deploy (mirrors `apps/web/lib/vault.ts`'s
 * `VAULT_FALLBACK_BASE_URL` escape hatch).
 */
export function contentBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_CONTENT_BASE_URL ?? 'https://www.longlivets.com/content'
  ).replace(/\/+$/, '');
}

// expo-file-system's directory constants moved from top-level exports
// (`FileSystem.documentDirectory`) to the `Paths` namespace across SDK
// majors; `Paths.document` (a `Directory`, not a bare string) is the
// current SDK 57 shape. One JSON blob per cache key, one file per key,
// under a dedicated subdirectory so a manual "clear cache" never has to
// guess which files are ours.
const CACHE_DIR = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');

function cacheFile(key: string): FileSystem.File {
  // Cache keys are `@swift2/content:v1:<baseUrl>:<suffix>` (see load.ts) —
  // safe as a filename once ':' and '/' (from the baseUrl) are escaped, so
  // two different baseUrls (prod vs a dev override) never collide on disk.
  const safeName = encodeURIComponent(key);
  return new FileSystem.File(CACHE_DIR, `${safeName}.json`);
}

let sweptStrayTemps = false;

/** Once per process: a kill mid-write leaves a `.tmp` beside the cache files; nothing reads those, so drop them. */
function sweepStrayTemps(): void {
  if (sweptStrayTemps) return;
  sweptStrayTemps = true;
  try {
    for (const entry of CACHE_DIR.list()) {
      if (!entry.name.endsWith('.tmp')) continue;
      try {
        new FileSystem.File(CACHE_DIR, entry.name).delete();
      } catch {
        // best effort
      }
    }
  } catch {
    // best effort: a stray temp is harmless, only wasted space
  }
}

/** Temp file then move over the target (same pattern as art-cache): a kill mid-write leaves the previous file intact, never truncated JSON. */
function writeAtomically(key: string, value: string): void {
  const tmp = new FileSystem.File(CACHE_DIR, `${encodeURIComponent(key)}.json.tmp`);
  try {
    tmp.write(value);
    tmp.moveSync(cacheFile(key), { overwrite: true });
  } catch (e) {
    try {
      if (tmp.exists) tmp.delete();
    } catch {
      // best effort
    }
    throw e;
  }
}

const LAST_GOOD_SUFFIX = ':last-good';

/** The `.js` twin of a last-good cache file: the JSON document as a JS object literal (JSON is valid JS), so the DOM
 * webview loads it with <script src> (exempt from the file:// origin rules that block fetch/XHR in WKWebView on iOS)
 * and gets the parsed object with no second JSON.parse. U+2028/U+2029 stay escaped for older engines. A document with a
 * `__proto__` key keeps the old string-literal form (an object literal would set the prototype, JSON.parse would not).
 * The reader accepts both forms, so twins written by older builds still load. */
export function lastGoodScriptSource(jsonText: string): string {
  const id = `globalThis.__swift2LastGoodId="${contentId(jsonText)}";`;
  // JSON.stringify only ever emits the literal key text, never an escaped form like "__proto__", so this substring test is sufficient.
  if (jsonText.includes('"__proto__"')) return `globalThis.__swift2LastGood=${JSON.stringify(jsonText)};${id}`;
  const literal = jsonText.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `globalThis.__swift2LastGood=${literal};${id}`;
}

/** FNV-1a 32-bit over the JSON text + its length: the twin's content id, also the `?v=` cache-buster. */
export function contentId(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return `${(h >>> 0).toString(16)}-${text.length}`;
}

/** Atomic twin write: temp file, then move over the target (a reader sees the old or the new twin, never a partial one). */
export function writeLastGoodTwin(key: string, jsonText: string): void {
  if (!CACHE_DIR.exists) CACHE_DIR.create({ intermediates: true });
  const name = lastGoodScriptName(key);
  const tmp = new FileSystem.File(CACHE_DIR, `${name}.tmp`);
  tmp.write(lastGoodScriptSource(jsonText));
  tmp.moveSync(new FileSystem.File(CACHE_DIR, name), { overwrite: true });
  const legacy = new FileSystem.File(CACHE_DIR, legacyLastGoodScriptName(key));
  if (legacy.exists) legacy.delete();
}

/** Same as `writeLastGoodTwin` but with the async read-side/move APIs (`File.write` has no async form in SDK 57), for a rebuild that must not hold the RN thread. */
export async function writeLastGoodTwinAsync(key: string, jsonText: string): Promise<void> {
  if (!CACHE_DIR.exists) CACHE_DIR.create({ intermediates: true });
  const name = lastGoodScriptName(key);
  const tmp = new FileSystem.File(CACHE_DIR, `${name}.tmp`);
  tmp.write(lastGoodScriptSource(jsonText));
  await tmp.move(new FileSystem.File(CACHE_DIR, name), { overwrite: true });
  const legacy = new FileSystem.File(CACHE_DIR, legacyLastGoodScriptName(key));
  if (legacy.exists) legacy.delete();
}

/** The current (object-literal) twin. Versioned in the filename so a legacy string-form twin never passes as current. */
export function lastGoodScriptName(key: string): string {
  return `${encodeURIComponent(key)}.v2.js`;
}

/** The string-literal twin written by older builds: still readable by the DOM, migrated to v2 after first paint. */
export function legacyLastGoodScriptName(key: string): string {
  return `${encodeURIComponent(key)}.js`;
}

/** `StorageAdapter` (packages/content/src/cache.ts) backed by expo-file-system, so a bundle validated once survives
 * an app restart — the loader's `TransportError` fallback (offline, no network) can then serve last-good from disk
 * instead of only from the in-memory default. */
export function expoFileSystemStorageAdapter(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      const file = cacheFile(key);
      if (!file.exists) return null;
      try {
        return file.textSync();
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      if (!CACHE_DIR.exists) CACHE_DIR.create({ intermediates: true });
      sweepStrayTemps();
      writeAtomically(key, value);
      if (key.endsWith(LAST_GOOD_SUFFIX)) {
        try {
          writeLastGoodTwin(key, value);
        } catch (e) {
          console.warn('[last-good-twin] write failed', e instanceof Error ? e.message : String(e));
        }
      }
    },
    removeItem(key: string): void {
      const file = cacheFile(key);
      if (file.exists) file.delete();
      if (key.endsWith(LAST_GOOD_SUFFIX)) {
        for (const name of [lastGoodScriptName(key), legacyLastGoodScriptName(key)]) {
          const twin = new FileSystem.File(CACHE_DIR, name);
          if (twin.exists) twin.delete();
        }
      }
    },
  };
}
