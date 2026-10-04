// One UI WP0.5b: the only things the RN host hands the ReaderSpike webview.
// A cache-file URI and a version token are config, never content (C6). The URI
// mirrors vault-storage.ts's `cacheFile('<key>')` naming for the loader's
// `last-good` record (packages/content load.ts `keyFor(baseUrl, 'last-good')`).
import * as FileSystem from 'expo-file-system';
import { contentBaseUrl, contentId, lastGoodScriptName, lastGoodScriptSource, writeLastGoodTwin } from './vault-storage';

const CACHE_KEY_PREFIX = '@swift2/content:v1:';

export function lastGoodCacheKey(baseUrl: string): string {
  return `${CACHE_KEY_PREFIX}${baseUrl}:last-good`;
}

export function cacheFileName(key: string): string {
  return `${encodeURIComponent(key)}.json`;
}

export interface LastGoodSource {
  /** The `.js` twin (loaded via <script src>), cache-busted with `?v=<content id>`. */
  scriptUri: string;
  /** The `.json` itself, for the XHR/fetch fallbacks. */
  jsonUri: string;
}

/** The native last-good cache as the DOM needs it, or null when none is on disk yet. The `.js` twin is validated against
 * the current `.json` (full-content match) and regenerated when missing, stale or truncated. */
export function lastGoodSource(): LastGoodSource | null {
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');
  const key = lastGoodCacheKey(contentBaseUrl());
  const json = new FileSystem.File(dir, cacheFileName(key));
  const script = new FileSystem.File(dir, lastGoodScriptName(key));
  if (!json.exists) return null;
  try {
    const text = json.textSync();
    let valid = false;
    try {
      valid = script.exists && script.textSync() === lastGoodScriptSource(text);
    } catch {
      valid = false;
    }
    if (!valid) writeLastGoodTwin(key, text);
    return { scriptUri: `${script.uri}?v=${contentId(text)}`, jsonUri: json.uri };
  } catch {
    return null;
  }
}
