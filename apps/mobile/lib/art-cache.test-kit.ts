import { MANIFEST_NAME, artFileName, type ArtFs } from './art-cache';

export const ORIGIN = 'https://www.longlivets.com';
export const MB = 1024 * 1024;

export type Entry = { file: string; size: number; lastUsed: number; contentVersion: string };

/** `sizeOf` = bytes a download actually writes; `declaredOf` = the HEAD Content-Length (null = missing). */
export const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

export interface FakeOpts {
  typeOf?: (url: string) => string | null;
  statusOf?: (url: string) => number;
  /** First bytes of a downloaded file (default: a JPEG header). */
  bytesOf?: (url: string) => Uint8Array;
}

export function fakeFs(sizeOf: (url: string) => number = () => 1 * MB, declaredOf: (url: string) => number | null = sizeOf, o: FakeOpts = {}) {
  const files = new Map<string, { text?: string; size: number }>();
  const log: string[] = [];
  const downloads: string[] = [];
  const heads: string[] = [];
  const urlOfFile = new Map<string, string>();
  let active = 0;
  let maxActive = 0;
  const fs: ArtFs = {
    ensureDir: () => void log.push('ensureDir'),
    list: () => [...files.keys()],
    readText: (n) => files.get(n)?.text ?? null,
    writeText: (n, text) => void files.set(n, { text, size: text.length }),
    size: (n) => files.get(n)?.size ?? null,
    remove: (n) => void (files.delete(n), log.push(`rm ${n}`)),
    async head(url) {
      heads.push(url);
      return { status: o.statusOf?.(url) ?? 200, length: declaredOf(url), type: o.typeOf ? o.typeOf(url) : 'image/png' };
    },
    readHead: (n) => (urlOfFile.has(n) ? (o.bytesOf?.(urlOfFile.get(n)!) ?? JPEG) : null),
    async download(url, name) {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      if (url.includes('FAIL')) throw new Error('net');
      files.set(name, { size: sizeOf(url) });
      urlOfFile.set(name, url);
      log.push(`dl ${name}`);
      downloads.push(url);
    },
    async move(from, to) {
      urlOfFile.set(to, urlOfFile.get(from)!);
      files.set(to, files.get(from)!);
      files.delete(from);
      log.push(`mv ${from}>${to}`);
    },
    uri: (n) => `file:///art/${n}`,
  };
  return { fs, files, log, downloads, heads, maxActive: () => maxActive };
}

export type Fake = ReturnType<typeof fakeFs>;
export const u = (n: number | string) => `${ORIGIN}/eras/${n}.png`;
export const entriesOf = (f: Fake) => JSON.parse(f.files.get(MANIFEST_NAME)!.text!).entries as Record<string, Entry>;

/** Pre-seed the on-disk cache: each url gets a file of `size` bytes and a manifest entry. */
export function seed(f: Fake, items: Array<{ url: string; size: number; version?: string; lastUsed?: number }>) {
  const entries: Record<string, Entry> = {};
  for (const it of items) {
    const file = artFileName(it.url);
    f.files.set(file, { size: it.size });
    entries[it.url] = { file, size: it.size, lastUsed: it.lastUsed ?? 1, contentVersion: it.version ?? 'v1' };
  }
  f.files.set(MANIFEST_NAME, { text: JSON.stringify({ v: 1, entries }), size: 1 });
}

export const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => u(`s${n}`));
