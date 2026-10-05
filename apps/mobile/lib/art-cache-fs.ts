// expo-file-system wiring for the offline art cache (art-cache.ts) plus the one entry the host calls. Art lives in its own
// directory, never alongside the content-cache twin files (#5091 reworks those writes separately).
import * as FileSystem from 'expo-file-system';
import { InteractionManager } from 'react-native';
import { ART_DIR_NAME, MAP_NAME, collectArtUrls, createArtCache, type ArtFs } from './art-cache';
import { diagMarkOnce } from './diagnostics';
import { SITE_URL } from './site-url';

const HEAD_TIMEOUT_MS = 10_000;
// Per-process cache-buster for the map twin: deterministic, no file stat on the startup path (a missing file is just a script error).
const BOOT_TOKEN = Date.now();

const dir = () => new FileSystem.Directory(FileSystem.Paths.document, ART_DIR_NAME);
const file = (name: string) => new FileSystem.File(dir(), name);

export function expoArtFs(): ArtFs {
  return {
    ensureDir() {
      const d = dir();
      if (!d.exists) d.create({ intermediates: true });
    },
    list: () => dir().list().map((e) => e.name),
    readText(name) {
      const f = file(name);
      return f.exists ? f.textSync() : null;
    },
    writeText(name, text) {
      const tmp = file(`${name}.tmp`);
      tmp.write(text);
      tmp.moveSync(file(name), { overwrite: true });
    },
    size(name) {
      const f = file(name);
      return f.exists ? f.size : null;
    },
    remove(name) {
      const f = file(name);
      if (f.exists) f.delete();
    },
    async headLength(url) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), HEAD_TIMEOUT_MS);
      try {
        const res = await fetch(url, { method: 'HEAD', signal: ctl.signal });
        const n = res.ok ? Number(res.headers.get('content-length')) : NaN;
        return Number.isInteger(n) && n > 0 ? n : null;
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    },
    async download(url, name) {
      await FileSystem.File.downloadFileAsync(url, file(name), { idempotent: true });
    },
    move: (from, to) => file(from).move(file(to), { overwrite: true }),
    uri: (name) => file(name).uri,
  };
}

/** The art map's script URI for the DOM. Never stats the disk and never throws; a map that does not exist yet just fails to load. */
export function artMapUri(): string | undefined {
  try {
    return `${file(MAP_NAME).uri}?v=${BOOT_TOKEN}`;
  } catch {
    return undefined;
  }
}

const cache = createArtCache(expoArtFs());

/** After a content load: once interactions settle, sync the art for that bundle. Fire-and-forget, never throws. */
export function startArtSync(files: Record<string, unknown>, version: string): void {
  try {
    InteractionManager.runAfterInteractions(() => {
      void cache.sync(collectArtUrls(files, SITE_URL), version).then((r) => {
        if (r) diagMarkOnce('art-cache-sync', `entries=${r.entries} dl=${r.downloaded} ev=${r.evicted} bytes=${r.bytes}`);
      });
    });
  } catch {
    // Art is an optimisation: the DOM falls back to the remote URL.
  }
}
