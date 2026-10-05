// Offline art cache (#5074): era covers and first-party primary moment images are downloaded into the app's document
// directory so the shared-UI WebView can show them with no network. Pure logic over an injected `ArtFs` port (the
// expo-file-system wiring lives in art-cache-fs.ts). The DOM reads `art-map.js` (`globalThis.__swift2ArtMap`, abs url ->
// file:// uri) and falls back to the remote URL on a miss or an <img> error, so any failure here is today's behaviour.
import { MAGIC_BYTES, MIN_THIRD_PARTY_BYTES, hasImageMagic, isImageType } from './art-image-guard';
export { collectArtUrls } from './art-cache-urls';

export const ART_DIR_NAME = 'swift2-art-v1';
export const MANIFEST_NAME = 'manifest.json';
export const MAP_NAME = 'art-map.js';
/** Steady-state cap on the cached art; on-disk may exceed it by up to SESSION_BUDGET_BYTES until the next launch's sweep. */
export const CAP_BYTES = 40 * 1024 * 1024;
/** Declared bytes reserved per session (a failed download keeps its reservation): no download starts past this. */
export const SESSION_BUDGET_BYTES = 10 * 1024 * 1024;
export const CONCURRENCY = 2;
/** Per-item ceiling, judged on the HEAD Content-Length (items with no valid length are skipped). */
export const MAX_ITEM_BYTES = 5 * 1024 * 1024;
/** A finished file may exceed its declared length by this much before it is discarded unmapped. */
export const SLACK_BYTES = 4096;
/** Recently viewed eras whose third-party art stays referenced besides the current one (#5112). */
export const MRU_ERAS = 2;

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
  /** HEAD the url: HTTP status (0 = failed), Content-Length in bytes (null when missing/invalid) and Content-Type. */
  head(url: string): Promise<ArtHead>;
  /** The first `count` bytes of a stored file, or null when unreadable. */
  readHead(name: string, count: number): Uint8Array | null;
  /** Streams the body to `name`; must stop, delete the partial file and reject as soon as more than `maxBytes` arrive, or when the body ends short of `minBytes`. */
  download(url: string, name: string, maxBytes: number, minBytes?: number): Promise<void>;
  move(from: string, to: string): Promise<void>;
  uri(name: string): string;
}

export interface ArtHead {
  status: number;
  length: number | null;
  type: string | null;
}

/** What a run may keep and fetch: the base set (covers + first-party), an era's URLs, and which URLs get the placeholder guard. */
export interface ArtContext {
  base: string[];
  eraUrls: (eraId: string) => string[];
  /** Third-party URLs: HEAD must say image/* and >= 2 KB, and the downloaded bytes must carry an image magic number. */
  strict: (url: string) => boolean;
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

function parseMru(text: string | null): string[] {
  try {
    const raw = (JSON.parse(text ?? 'null') as { mru?: unknown } | null)?.mru;
    return Array.isArray(raw) ? raw.filter((e): e is string => typeof e === 'string').slice(0, MRU_ERAS + 1) : [];
  } catch {
    return [];
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const total = (entries: ArtEntries) => Object.values(entries).reduce((n, e) => n + e.size, 0);

export function createArtCache(fs: ArtFs, now: () => number = Date.now) {
  let running: Promise<ArtSyncResult | null> | null = null;
  let swept = false;
  const blockedHosts = new Set<string>(); // answered 429 this session: no more requests to them
  const rejected = new Set<string>(); // failed the placeholder guard or HEAD this session: not retried
  let sessionUsed = 0; // bandwidth reserved this process; shared by every run (era flipping cannot re-spend it); a failed download keeps its reservation

  async function run(urls: string[], version: string, ctx: ArtContext, era?: string): Promise<ArtSyncResult> {
    fs.ensureDir();
    const manifestText = fs.readText(MANIFEST_NAME);
    if (!swept) {
      // First run of this process only: the DOM's boot map may still point at files the previous run dropped, so
      // deletion waits for the next launch. This sweep removes anything the manifest does not list (stray .tmp too).
      swept = true;
      const keep = new Set([MANIFEST_NAME, MAP_NAME, ...Object.values(parseEntries(manifestText)).map((e) => e.file)]);
      for (const n of fs.list()) if (!keep.has(n)) fs.remove(n);
    } else {
      for (const n of fs.list()) if (n.endsWith('.tmp')) fs.remove(n);
    }
    const stamp = now();
    // Eviction reference set: base (covers + first-party) + the MRU eras' primary images, current era first.
    let mru = parseMru(manifestText);
    if (era !== undefined) mru = [era, ...mru.filter((e) => e !== era)].slice(0, MRU_ERAS + 1);
    const rank = new Map<string, number>(); // 0 = base/current era; older MRU eras sort older in the LRU
    for (const u of ctx.base) rank.set(u, 0);
    mru.forEach((id, i) => {
      for (const u of ctx.eraUrls(id)) if (!rank.has(u)) rank.set(u, i);
    });
    const referenced = new Set(rank.keys());
    const stampOf = (url: string) => stamp - (rank.get(url) ?? 0);
    const entries: ArtEntries = {};
    for (const [url, e] of Object.entries(parseEntries(manifestText))) {
      if (fs.size(e.file) === null) continue; // file gone: re-download if still referenced
      // contentVersion is only ever changed by a successful re-fetch below, never relabelled here.
      entries[url] = referenced.has(url) ? { ...e, lastUsed: stampOf(url) } : e;
    }
    let evicted = 0;
    const drop = (url: string) => {
      delete entries[url];
      evicted += 1;
    };
    for (const url of Object.keys(entries)) if (!referenced.has(url)) drop(url);

    // Missing art first, then entries cached under an older content version (the old file stays mapped until the new one lands).
    const ordered = [...new Set(urls)];
    const queue = [...ordered.filter((u) => !entries[u]), ...ordered.filter((u) => entries[u] && entries[u]!.contentVersion !== version)];
    let disk = total(entries); // bytes on disk plus in-flight reservations; a failed download releases its own
    let downloaded = 0;
    const worker = async () => {
      for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
        if (sessionUsed >= SESSION_BUDGET_BYTES) return;
        const host = hostOf(url);
        if (blockedHosts.has(host) || rejected.has(url)) continue;
        const strict = ctx.strict(url);
        let declared: number | null = null;
        try {
          const head = await fs.head(url);
          if (head.status === 429) blockedHosts.add(host);
          else if (head.status === 405 || head.status === 501 || (strict && !isImageType(head.type))) rejected.add(url);
          else declared = head.length;
        } catch {
          // Unknown length: skipped below.
        }
        if (declared !== null && declared > MAX_ITEM_BYTES) rejected.add(url);
        if (declared === null || !Number.isFinite(declared) || declared <= 0 || declared > MAX_ITEM_BYTES) continue;
        if (strict && declared < MIN_THIRD_PARTY_BYTES) {
          rejected.add(url);
          continue;
        }
        // Check-and-reserve happens in one tick, so two workers can never both claim the last of the budget.
        if (sessionUsed + declared > SESSION_BUDGET_BYTES || disk + declared > CAP_BYTES) continue;
        sessionUsed += declared;
        disk += declared;
        const file = artFileName(url);
        const tmp = `${file}.tmp`;
        try {
          const limit = Math.min(MAX_ITEM_BYTES, declared + SLACK_BYTES);
          await fs.download(url, tmp, limit, Math.max(1, declared - SLACK_BYTES));
          const size = fs.size(tmp);
          if (size === null || size <= 0 || size > limit || size < declared - SLACK_BYTES) {
            fs.remove(tmp);
            disk -= declared;
            continue;
          }
          const magic = fs.readHead(tmp, MAGIC_BYTES);
          if (!magic || !hasImageMagic(magic)) {
            rejected.add(url);
            fs.remove(tmp);
            disk -= declared;
            continue;
          }
          await fs.move(tmp, file);
          const old = entries[url];
          disk += size - declared - (old ? old.size : 0);
          downloaded += 1;
          entries[url] = { file, size, lastUsed: stampOf(url), contentVersion: version };
        } catch {
          disk -= declared;
          try {
            fs.remove(tmp);
          } catch {
            // Best-effort: the next start sweeps stray .tmp files.
          }
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    // Safety net (a manifest already over the cap): LRU, ties go to the earlier-inserted (older) entry.
    const lru = Object.keys(entries)
      .map((url, i) => ({ url, i }))
      .sort((a, b) => entries[a.url]!.lastUsed - entries[b.url]!.lastUsed || a.i - b.i);
    for (const { url } of lru) {
      if (total(entries) <= CAP_BYTES) break;
      drop(url);
    }

    fs.writeText(MANIFEST_NAME, JSON.stringify({ v: 1, entries, mru }));
    const map: Record<string, string> = {};
    for (const [url, e] of Object.entries(entries)) map[url] = fs.uri(e.file);
    const source = artMapSource(map);
    if (fs.readText(MAP_NAME) !== source) fs.writeText(MAP_NAME, source);
    return { downloaded, evicted, entries: Object.keys(entries).length, bytes: total(entries) };
  }

  const NO_ERAS: ArtContext = { base: [], eraUrls: () => [], strict: () => false };
  function start(job: () => Promise<ArtSyncResult>): Promise<ArtSyncResult | null> {
    const p = job().then(
      (r) => r,
      () => null,
    );
    running = p;
    void p.then(() => {
      if (running === p) running = null;
    });
    return p;
  }

  return {
    /** One sync at a time; resolves null on any failure (never rejects). `ctx` keeps recently viewed eras' art from being evicted. */
    sync(urls: string[], version: string, ctx?: ArtContext): Promise<ArtSyncResult | null> {
      if (running) return running;
      const c = ctx ?? { ...NO_ERAS, base: urls };
      return start(() => run(urls, version, c));
    },
    /** Lower-priority era run: the current era's art first, then the other MRU eras'. Waits for a run in flight; never rejects. */
    async syncEra(eraId: string, version: string, ctx: ArtContext): Promise<ArtSyncResult | null> {
      if (running) await running;
      if (running) return running;
      const others = parseMru(fs.readText(MANIFEST_NAME)).filter((e) => e !== eraId).slice(0, MRU_ERAS);
      const queue = [eraId, ...others].flatMap((id) => ctx.eraUrls(id));
      return start(() => run(queue, version, ctx, eraId));
    },
  };
}
