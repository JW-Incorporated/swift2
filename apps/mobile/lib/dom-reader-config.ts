// One UI WP0.5b: the only things the RN host hands the ReaderSpike webview.
// A cache-file URI and a version token are config, never content (C6). The URI
// mirrors vault-storage.ts's `cacheFile('<key>')` naming for the loader's
// `last-good` record (packages/content load.ts `keyFor(baseUrl, 'last-good')`).
import * as FileSystem from 'expo-file-system';
import { contentBaseUrl, lastGoodScriptName, writeLastGoodTwin } from './vault-storage';

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

/** The native last-good cache as the DOM needs it, or null when none is on disk yet. Launch-path cheap: the twin is judged
 * valid by size/mtime only (never reads either big file); an invalid one is rebuilt right after this returns. */
export function lastGoodSource(): LastGoodSource | null {
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');
  const key = lastGoodCacheKey(contentBaseUrl());
  const json = new FileSystem.File(dir, cacheFileName(key));
  const script = new FileSystem.File(dir, lastGoodScriptName(key));
  if (!json.exists) return null;
  const valid =
    script.exists &&
    script.size > json.size &&
    (json.modificationTime ?? 0) <= (script.modificationTime ?? 0);
  if (valid) return { scriptUri: `${script.uri}?v=${script.modificationTime}`, jsonUri: json.uri };
  setTimeout(() => {
    try {
      writeLastGoodTwin(key, json.textSync());
      console.warn('[last-good-twin] rebuilt');
    } catch (e) {
      console.warn('[last-good-twin] rebuild failed', e instanceof Error ? e.message : String(e));
    }
  }, 0);
  return { scriptUri: `${script.uri}?v=${Date.now()}`, jsonUri: json.uri };
}
