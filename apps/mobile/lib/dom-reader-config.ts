// One UI WP0.5b: the only things the RN host hands the ReaderSpike webview.
// A cache-file URI and a version token are config, never content (C6). The URI
// mirrors vault-storage.ts's `cacheFile('<key>')` naming for the loader's
// `last-good` record (packages/content load.ts `keyFor(baseUrl, 'last-good')`).
import * as FileSystem from 'expo-file-system';
import { contentBaseUrl, lastGoodScriptName, lastGoodScriptSource } from './vault-storage';

const CACHE_KEY_PREFIX = '@swift2/content:v1:';

export function lastGoodCacheKey(baseUrl: string): string {
  return `${CACHE_KEY_PREFIX}${baseUrl}:last-good`;
}

export function cacheFileName(key: string): string {
  return `${encodeURIComponent(key)}.json`;
}

/** file:// URI of the `.js` twin of the native last-good cache (what the DOM loads via <script src>), or null when no
 * cache is on disk yet. A `.json` written before the twin existed is backfilled once, on first launch after the OTA. */
export function lastGoodCacheUri(): string | null {
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');
  const key = lastGoodCacheKey(contentBaseUrl());
  const json = new FileSystem.File(dir, cacheFileName(key));
  const script = new FileSystem.File(dir, lastGoodScriptName(key));
  if (!json.exists) return null;
  if (!script.exists) {
    try {
      script.write(lastGoodScriptSource(json.textSync()));
    } catch {
      return null;
    }
  }
  return script.uri;
}
