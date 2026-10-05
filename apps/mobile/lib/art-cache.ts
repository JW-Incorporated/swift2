// Offline art cache (#5074): era covers and first-party primary moment images are downloaded into the app's document
// directory so the shared-UI WebView can show them with no network. Pure logic over an injected `ArtFs` port (the
// expo-file-system wiring lives in art-cache-fs.ts). The DOM reads `art-map.js` (`globalThis.__swift2ArtMap`, abs url ->
// file:// uri) and falls back to the remote URL on a miss or an <img> error, so any failure here is today's behaviour.
export const ART_DIR_NAME = 'swift2-art-v1';
export const MANIFEST_NAME = 'manifest.json';
export const MAP_NAME = 'art-map.js';
/** Hard cap on the cached art. */
export const CAP_BYTES = 40 * 1024 * 1024;
/** Downloads stop starting once a session has pulled this many bytes. */
export const SESSION_BUDGET_BYTES = 10 * 1024 * 1024;
export const CONCURRENCY = 2;

export interface ArtEntry {
  file: string;
  size: number;
  lastUsed: number;
  contentVersion: string;
}
export type ArtEntries = Record<string, ArtEntry>;

export interface ArtFs {
  ensureDir(): void;
  list(): string[];
  readText(name: string): string | null;
  /** Atomic: a reader sees the old or the new text, never a partial one. */
  writeText(name: string, text: string): void;
  size(name: string): number | null;
  remove(name: string): void;
  download(url: string, name: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
  uri(name: string): string;
}

export interface ArtSyncResult {
  downloaded: number;
  evicted: number;
  entries: number;
  bytes: number;
}

/** FNV-1a 32-bit over the URL text (+ its length), hex. */
export function hashUrl(url: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) h = Math.imul(h ^ url.charCodeAt(i), 0x01000193);
  return `${(h >>> 0).toString(16).padStart(8, '0')}${url.length.toString(36)}`;
}

export function artFileName(url: string): string {
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    // Not absolute: take the text as-is.
  }
  const ext = /\.(png|jpe?g|webp|avif|gif|svg)$/i.exec(path)?.[1]?.toLowerCase() ?? 'img';
  return `${hashUrl(url)}.${ext}`;
}

/** The absolute first-party URL, or null (third-party, protocol-relative, not a string). */
function firstParty(url: unknown, origin: string): string | null {
  if (typeof url !== 'string' || !url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return `${origin}${url}`;
  return url.startsWith(`${origin}/`) ? url : null;
}

/** Era covers + first-party primary moment images of a loaded bundle (`files` is manifest key -> validated content). */
export function collectArtUrls(files: Record<string, unknown>, origin: string): string[] {
  const out = new Set<string>();
  const add = (u: unknown) => {
    const abs = firstParty(u, origin);
    if (abs) out.add(abs);
  };
  const eras = files.eras;
  if (Array.isArray(eras)) for (const e of eras) add((e as { image?: unknown } | null)?.image);
  for (const [key, file] of Object.entries(files)) {
    if (!key.startsWith('content:')) continue;
    const items = (file as { items?: unknown } | null)?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const images = (it as { images?: unknown } | null)?.images;
      if (!Array.isArray(images)) continue;
      for (const im of images as Array<{ kind?: unknown; url?: unknown } | null>) if (im?.kind === 'primary') add(im.url);
    }
  }
  return [...out];
}

/** `art-map.js`: one classic-script statement; U+2028/U+2029 stay escaped for older engines. */
export function artMapSource(map: Record<string, string>): string {
  const literal = JSON.stringify(map).replace(new RegExp('[\u2028\u2029]', 'g'), (c) => '\\u' + c.charCodeAt(0).toString(16));
  return `globalThis.__swift2ArtMap=${literal};`;
}

function parseEntries(text: string | null): ArtEntries {
  if (!text) return {};
  try {
    const raw = (JSON.parse(text) as { entries?: Record<string, Partial<ArtEntry>> } | null)?.entries ?? {};
    const out: ArtEntries = {};
    for (const [url, e] of Object.entries(raw)) {
      if (e && typeof e.file === 'string' && typeof e.size === 'number' && typeof e.lastUsed === 'number') {
        out[url] = { file: e.file, size: e.size, lastUsed: e.lastUsed, contentVersion: String(e.contentVersion ?? '') };
      }
    }
    return out;
  } catch {
    return {};
  }
}

const total = (entries: ArtEntries) => Object.values(entries).reduce((n, e) => n + e.size, 0);

export function createArtCache(fs: ArtFs, now: () => number = Date.now) {
  let running: Promise<ArtSyncResult | null> | null = null;

  async function run(urls: string[], version: string): Promise<ArtSyncResult> {
    fs.ensureDir();
    const names = fs.list();
    for (const n of names) if (n.endsWith('.tmp')) fs.remove(n);
    const stamp = now();
    const referenced = new Set(urls);
    const entries: ArtEntries = {};
    for (const [url, e] of Object.entries(parseEntries(fs.readText(MANIFEST_NAME)))) {
      if (fs.size(e.file) === null) continue; // file gone: re-download if still referenced
      entries[url] = referenced.has(url) ? { ...e, lastUsed: stamp, contentVersion: version } : e;
    }
    let evicted = 0;
    const drop = (url: string) => {
      fs.remove(entries[url]!.file);
      delete entries[url];
      evicted += 1;
    };
    for (const url of Object.keys(entries)) if (!referenced.has(url)) drop(url);

    const queue = urls.filter((u) => !entries[u]);
    let pulled = 0;
    let downloaded = 0;
    const worker = async () => {
      for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
        if (pulled >= SESSION_BUDGET_BYTES) return;
        const file = artFileName(url);
        const tmp = `${file}.tmp`;
        try {
          await fs.download(url, tmp);
          const size = fs.size(tmp) ?? 0;
          if (size <= 0 || size > CAP_BYTES) {
            fs.remove(tmp);
            continue;
          }
          await fs.move(tmp, file);
          pulled += size;
          downloaded += 1;
          entries[url] = { file, size, lastUsed: stamp, contentVersion: version };
        } catch {
          try {
            fs.remove(tmp);
          } catch {
            // Best-effort: the next start sweeps stray .tmp files.
          }
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    // LRU under the hard cap (ties: the earlier-inserted entry, i.e. the older one, goes first).
    const lru = Object.keys(entries)
      .map((url, i) => ({ url, i }))
      .sort((a, b) => entries[a.url]!.lastUsed - entries[b.url]!.lastUsed || a.i - b.i);
    for (const { url } of lru) {
      if (total(entries) <= CAP_BYTES) break;
      drop(url);
    }

    const keep = new Set([MANIFEST_NAME, MAP_NAME, ...Object.values(entries).map((e) => e.file)]);
    for (const n of fs.list()) if (!keep.has(n)) fs.remove(n);
    fs.writeText(MANIFEST_NAME, JSON.stringify({ v: 1, entries }));
    const map: Record<string, string> = {};
    for (const [url, e] of Object.entries(entries)) map[url] = fs.uri(e.file);
    const source = artMapSource(map);
    if (fs.readText(MAP_NAME) !== source) fs.writeText(MAP_NAME, source);
    return { downloaded, evicted, entries: Object.keys(entries).length, bytes: total(entries) };
  }

  return {
    /** One sync at a time; resolves null on any failure (never rejects). */
    sync(urls: string[], version: string): Promise<ArtSyncResult | null> {
      if (running) return running;
      const p = run(urls, version).then(
        (r) => r,
        () => null,
      );
      running = p;
      void p.then(() => {
        if (running === p) running = null;
      });
      return p;
    },
  };
}
