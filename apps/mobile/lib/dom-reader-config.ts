// One UI WP0.5b: the only things the RN host hands the ReaderSpike webview.
// A cache-file URI and a version token are config, never content (C6). The URI
// mirrors vault-storage.ts's `cacheFile('<key>')` naming for the loader's
// `last-good` record (packages/content load.ts `keyFor(baseUrl, 'last-good')`).
import * as FileSystem from 'expo-file-system';
import { InteractionManager } from 'react-native';
import { artMapUri } from './art-cache-fs';
import { contentBaseUrl, lastGoodScriptName, legacyLastGoodScriptName, writeLastGoodTwin, writeLastGoodTwinAsync } from './vault-storage';

/** Hard fallback for the legacy->v2 migration: normally it runs once interactions settle after launch (the host and
 * bridge are off-limits to this file, so InteractionManager stands in for the DOM `ready` signal). */
const MIGRATE_FALLBACK_MS = 8000;

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
  /** The offline art map twin (#5074), when one has been written. */
  artMapUri?: string;
}

/** The native last-good cache as the DOM needs it, or null when none is on disk yet. Launch-path cheap: the twin is judged
 * valid by size/mtime only (never reads either big file); an invalid one is rebuilt right after this returns. */
export function lastGoodSource(): LastGoodSource | null {
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');
  const key = lastGoodCacheKey(contentBaseUrl());
  const json = new FileSystem.File(dir, cacheFileName(key));
  const script = new FileSystem.File(dir, lastGoodScriptName(key));
  if (!json.exists) return null;
  const isValid = (f: FileSystem.File) =>
    f.exists && f.size > json.size && (json.modificationTime ?? 0) <= (f.modificationTime ?? 0);
  const art = artMapUri();
  if (isValid(script)) return { scriptUri: `${script.uri}?v=${script.modificationTime}`, jsonUri: json.uri, artMapUri: art };
  // A valid legacy (string-form) twin is still handed to the DOM this launch; the v2 rebuild waits until after first paint.
  const legacy = new FileSystem.File(dir, legacyLastGoodScriptName(key));
  const useLegacy = isValid(legacy);
  const warnFail = (e: unknown) => console.warn('[last-good-twin] rebuild failed', e instanceof Error ? e.message : String(e));
  if (useLegacy) {
    let started = false;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const migrate = () => {
      if (started) return;
      started = true;
      if (fallback !== undefined) clearTimeout(fallback);
      json
        .text()
        .then((text) => writeLastGoodTwinAsync(key, text))
        .then(() => console.warn('[last-good-twin] migrated to v2'), warnFail);
    };
    InteractionManager.runAfterInteractions(migrate);
    if (!started) fallback = setTimeout(migrate, MIGRATE_FALLBACK_MS);
  } else {
    setTimeout(() => {
      try {
        writeLastGoodTwin(key, json.textSync());
        console.warn('[last-good-twin] rebuilt');
      } catch (e) {
        warnFail(e);
      }
    }, 0);
  }
  if (useLegacy) return { scriptUri: `${legacy.uri}?v=${legacy.modificationTime}`, jsonUri: json.uri, artMapUri: art };
  return { scriptUri: `${script.uri}?v=${Date.now()}`, jsonUri: json.uri, artMapUri: art };
}
