// Shared file-system-backed `StorageAdapter` (OS-013's `@swift2/content`
// contract) + published-bundle base URL — split out of `vault.ts` so
// `era-stream-data.ts` (OS-032) can read the SAME on-disk cache and base URL
// convention without a second copy of the expo-file-system wiring drifting
// out of sync with the Vault reader.
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

const LAST_GOOD_SUFFIX = ':last-good';

/** The `.js` twin of a last-good cache file: the JSON document as a JS string literal, so the DOM webview can load it
 * with <script src> (exempt from the file:// origin rules that block fetch/XHR in WKWebView on iOS). */
export function lastGoodScriptSource(jsonText: string): string {
  return `globalThis.__swift2LastGood=${JSON.stringify(jsonText)};globalThis.__swift2LastGoodId="${contentId(jsonText)}";`;
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
}

export function lastGoodScriptName(key: string): string {
  return `${encodeURIComponent(key)}.js`;
}

/** `StorageAdapter` (packages/content/src/cache.ts) backed by expo-file-system, so a bundle validated once survives
 * an app restart — the loader's `TransportError` fallback (offline, no network) can then serve last-good from disk
 * instead of only from the in-memory default. Shared by `vault.ts` (Tier 0/1) and `era-stream-data.ts` (OS-032) so
 * both read the same on-disk cache for the same bundle, rather than each keeping a separate copy warm. */
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
      const file = cacheFile(key);
      // Twin first: a crash between the writes may leave the DOM newer than native, never older.
      if (key.endsWith(LAST_GOOD_SUFFIX)) {
        writeLastGoodTwin(key, value);
      }
      file.write(value);
    },
    removeItem(key: string): void {
      const file = cacheFile(key);
      if (file.exists) file.delete();
      if (key.endsWith(LAST_GOOD_SUFFIX)) {
        const twin = new FileSystem.File(CACHE_DIR, lastGoodScriptName(key));
        if (twin.exists) twin.delete();
      }
    },
  };
}
