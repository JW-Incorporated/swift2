// One UI WP0.5b: the only things the RN host hands the ReaderSpike webview.
// A cache-file URI and a version token are config, never content (C6). The URI
// mirrors vault-storage.ts's `cacheFile('<key>')` naming for the loader's
// `last-good` record (packages/content load.ts `keyFor(baseUrl, 'last-good')`).
import * as FileSystem from 'expo-file-system';
import { contentBaseUrl } from './vault-storage';

const CACHE_KEY_PREFIX = '@swift2/content:v1:';

export function lastGoodCacheKey(baseUrl: string): string {
  return `${CACHE_KEY_PREFIX}${baseUrl}:last-good`;
}

export function cacheFileName(key: string): string {
  return `${encodeURIComponent(key)}.json`;
}

/** file:// URI of the native last-good cache file, or null when none is on disk yet. */
export function lastGoodCacheUri(): string | null {
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');
  const file = new FileSystem.File(dir, cacheFileName(lastGoodCacheKey(contentBaseUrl())));
  return file.exists ? file.uri : null;
}
