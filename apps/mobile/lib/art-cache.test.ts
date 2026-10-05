import { describe, expect, it } from 'vitest';
import {
  CAP_BYTES,
  MANIFEST_NAME,
  MAP_NAME,
  MAX_ITEM_BYTES,
  SESSION_BUDGET_BYTES,
  SLACK_BYTES,
  artFileName,
  artMapSource,
  collectArtUrls,
  createArtCache,
  hashUrl,
  type ArtFs,
} from './art-cache';

const ORIGIN = 'https://www.longlivets.com';
const MB = 1024 * 1024;

type Entry = { file: string; size: number; lastUsed: number; contentVersion: string };

/** `sizeOf` = bytes a download actually writes; `declaredOf` = the HEAD Content-Length (null = missing). */
function fakeFs(sizeOf: (url: string) => number = () => 1 * MB, declaredOf: (url: string) => number | null = sizeOf) {
  const files = new Map<string, { text?: string; size: number }>();
  const log: string[] = [];
  const downloads: string[] = [];
  let active = 0;
  let maxActive = 0;
  const fs: ArtFs = {
    ensureDir: () => void log.push('ensureDir'),
    list: () => [...files.keys()],
    readText: (n) => files.get(n)?.text ?? null,
    writeText: (n, text) => void files.set(n, { text, size: text.length }),
    size: (n) => files.get(n)?.size ?? null,
    remove: (n) => void (files.delete(n), log.push(`rm ${n}`)),
    headLength: async (url) => declaredOf(url),
    async download(url, name) {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      if (url.includes('FAIL')) throw new Error('net');
      files.set(name, { size: sizeOf(url) });
      log.push(`dl ${name}`);
      downloads.push(url);
    },
    async move(from, to) {
      files.set(to, files.get(from)!);
      files.delete(from);
      log.push(`mv ${from}>${to}`);
    },
    uri: (n) => `file:///art/${n}`,
  };
  return { fs, files, log, downloads, maxActive: () => maxActive };
}

type Fake = ReturnType<typeof fakeFs>;
const u = (n: number | string) => `${ORIGIN}/eras/${n}.png`;
const entriesOf = (f: Fake) => JSON.parse(f.files.get(MANIFEST_NAME)!.text!).entries as Record<string, Entry>;

/** Pre-seed the on-disk cache: each url gets a file of `size` bytes and a manifest entry. */
function seed(f: Fake, items: Array<{ url: string; size: number; version?: string; lastUsed?: number }>) {
  const entries: Record<string, Entry> = {};
  for (const it of items) {
    const file = artFileName(it.url);
    f.files.set(file, { size: it.size });
    entries[it.url] = { file, size: it.size, lastUsed: it.lastUsed ?? 1, contentVersion: it.version ?? 'v1' };
  }
  f.files.set(MANIFEST_NAME, { text: JSON.stringify({ v: 1, entries }), size: 1 });
}

const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => u(`s${n}`));

describe('url hashing + file names', () => {
  it('is deterministic, distinct per url, and keeps the extension', () => {
    expect(hashUrl(u(1))).toBe(hashUrl(u(1)));
    expect(hashUrl(u(1))).not.toBe(hashUrl(u(2)));
    expect(artFileName(u(1))).toBe(`${hashUrl(u(1))}.png`);
    expect(artFileName(`${ORIGIN}/x/y.JPG?z=1`)).toMatch(/\.jpg$/);
    expect(artFileName(`${ORIGIN}/x/noext`)).toMatch(/\.img$/);
  });
});

describe('collectArtUrls', () => {
  it('takes era covers and first-party primary images only', () => {
    const files = {
      eras: [{ image: '/eras/a.png' }, { image: 'https://cdn.example.com/b.png' }, { image: `${ORIGIN}/eras/c.png` }],
      'content:a': {
        items: [
          { images: [{ kind: 'primary', url: '/m/1.jpg' }, { kind: 'reference', url: '/m/2.jpg' }] },
          { images: [{ kind: 'primary', url: 'https://third.party/3.jpg' }, { kind: 'primary', url: '//evil/4.jpg' }] },
          { images: [{ kind: 'primary', url: '/m/1.jpg' }] },
        ],
      },
      merch: [{ imageUrl: '/merch/1.png' }],
      'content:bad': null,
    };
    expect(collectArtUrls(files, ORIGIN).sort()).toEqual([`${ORIGIN}/eras/a.png`, `${ORIGIN}/eras/c.png`, `${ORIGIN}/m/1.jpg`]);
    expect(collectArtUrls({ eras: 'nope' }, ORIGIN)).toEqual([]);
  });
});

describe('artMapSource', () => {
  it('is a single globalThis assignment of the url->uri map', () => {
    const src = artMapSource({ [u(1)]: 'file:///a.png' });
    expect(src.startsWith('globalThis.__swift2ArtMap=')).toBe(true);
    const g = {} as { __swift2ArtMap?: unknown };
    new Function('globalThis', src)(g);
    expect(g.__swift2ArtMap).toEqual({ [u(1)]: 'file:///a.png' });
    expect(artMapSource({ a: ' ' })).not.toContain(' ');
  });
});

describe('createArtCache.sync', () => {
  it('downloads to .tmp then moves into place (atomic), and writes manifest + map', async () => {
    const f = fakeFs();
    const r = await createArtCache(f.fs, () => 10).sync([u(1)], 'v1');
    const name = artFileName(u(1));
    expect(f.log.indexOf(`dl ${name}.tmp`)).toBeLessThan(f.log.indexOf(`mv ${name}.tmp>${name}`));
    expect(f.files.has(`${name}.tmp`)).toBe(false);
    expect(r).toMatchObject({ downloaded: 1, entries: 1, bytes: MB });
    expect(entriesOf(f)[u(1)]).toMatchObject({ file: name, size: MB, contentVersion: 'v1' });
    expect(f.files.get(MAP_NAME)!.text).toBe(artMapSource({ [u(1)]: `file:///art/${name}` }));
  });

  it('sweeps stray .tmp files at start and does not re-download cached art of the same version', async () => {
    const f = fakeFs();
    f.files.set('stale.png.tmp', { size: 5 });
    const cache = createArtCache(f.fs);
    await cache.sync([u(1)], 'v1');
    expect(f.files.has('stale.png.tmp')).toBe(false);
    const r = await cache.sync([u(1)], 'v1');
    expect(f.downloads).toHaveLength(1);
    expect(r?.downloaded).toBe(0);
    expect(entriesOf(f)[u(1)]!.file).toBe(artFileName(u(1)));
  });

  it('evicts entries the current bundle no longer references', async () => {
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    await cache.sync([u(1), u(2)], 'v1');
    const r = await cache.sync([u(2)], 'v1');
    expect(r).toMatchObject({ evicted: 1, entries: 1 });
    expect(f.files.has(artFileName(u(1)))).toBe(false);
    expect(Object.keys(entriesOf(f))).toEqual([u(2)]);
    expect(f.files.get(MAP_NAME)!.text).not.toContain('/eras/1.png');
  });

  it('a manifest already over the cap is trimmed by LRU (ties: the older entry goes first)', async () => {
    const f = fakeFs();
    seed(f, [1, 2, 3].map((n) => ({ url: u(n), size: 15 * MB })));
    const r = await createArtCache(f.fs).sync([u(1), u(2), u(3)], 'v1');
    expect(r!.bytes).toBeLessThanOrEqual(CAP_BYTES);
    expect(Object.keys(entriesOf(f))).toEqual([u(2), u(3)]);
    expect(f.files.has(artFileName(u(1)))).toBe(false);
  });

  it('never starts a download that would break the disk cap, even with transfers in flight', async () => {
    const f = fakeFs(() => 4 * MB);
    seed(f, nine.map((url) => ({ url, size: 4 * MB })));
    const r = await createArtCache(f.fs).sync([...nine, u('a'), u('b')], 'v1');
    // 36 MB cached: one more 4 MB item fits in 40 MB; the other is skipped, not allowed to overshoot.
    expect(f.downloads).toHaveLength(1);
    expect(r!.bytes).toBeLessThanOrEqual(CAP_BYTES);
  });

  it('never overshoots the session budget under concurrency 2', async () => {
    const f = fakeFs(() => 4 * MB);
    const urls = [1, 2, 3, 4, 5, 6].map(u);
    const r = await createArtCache(f.fs).sync(urls, 'v1');
    // Two in flight fit (8 MB); a third would make 12 MB, so it is never started.
    expect(r!.downloaded).toBe(2);
    expect(f.downloads).toHaveLength(2);
    expect(r!.bytes).toBeLessThanOrEqual(SESSION_BUDGET_BYTES);
    const r2 = await createArtCache(f.fs).sync(urls, 'v1');
    expect(r2!.entries).toBe(4);
  });

  it('reserves declared sizes: items fill the budget up to the limit, never past it', async () => {
    const f = fakeFs(() => 3 * MB);
    const r = await createArtCache(f.fs).sync([1, 2, 3, 4, 5, 6].map(u), 'v1');
    expect(r!.downloaded).toBe(3);
    expect(r!.bytes).toBe(9 * MB);
  });

  it('uses at most two concurrent downloads', async () => {
    const f = fakeFs(() => 100);
    await createArtCache(f.fs).sync([1, 2, 3, 4, 5].map(u), 'v1');
    expect(f.maxActive()).toBe(2);
  });

  it('skips items with a missing, invalid or oversized declared length without downloading', async () => {
    const declared: Record<string, number | null> = {
      [u('none')]: null,
      [u('zero')]: 0,
      [u('nan')]: NaN,
      [u('big')]: MAX_ITEM_BYTES + 1,
      [u('ok')]: 1000,
    };
    const f = fakeFs(() => 1000, (url) => declared[url] ?? null);
    const r = await createArtCache(f.fs).sync(Object.keys(declared), 'v1');
    expect(f.downloads).toEqual([u('ok')]);
    expect(r!.entries).toBe(1);
  });

  it('a file larger than declared + slack is deleted and not mapped; within slack it is kept', async () => {
    const f = fakeFs((url) => (url === u('liar') ? 2000 + SLACK_BYTES + 1 : 2000 + SLACK_BYTES), () => 2000);
    await createArtCache(f.fs).sync([u('liar'), u('fine')], 'v1');
    expect(Object.keys(entriesOf(f))).toEqual([u('fine')]);
    expect(f.files.has(artFileName(u('liar')))).toBe(false);
    expect([...f.files.keys()].some((k) => k.endsWith('.tmp'))).toBe(false);
    expect(f.files.get(MAP_NAME)!.text).not.toContain('liar');
  });

  it('a failed download keeps its session reservation (bandwidth was spent)', async () => {
    const f = fakeFs(() => 4 * MB);
    const r = await createArtCache(f.fs).sync([`${ORIGIN}/FAIL.png`, u(2), u(3), u(4)], 'v1');
    // FAIL reserved 4 MB and u(2) 4 MB: a third 4 MB item no longer fits the 10 MB budget.
    expect(r).toMatchObject({ downloaded: 1, entries: 1 });
    expect([...f.files.keys()].some((k) => k.endsWith('.tmp'))).toBe(false);
  });

  it('a failed download releases its disk reservation', async () => {
    const f = fakeFs(() => 4 * MB);
    seed(f, nine.map((url) => ({ url, size: 4 * MB })));
    const cache = createArtCache(f.fs);
    // 36 MB on disk. FAIL holds 4 MB while in flight, so u('b') cannot start (it would overshoot) and is skipped.
    const first = await cache.sync([...nine, `${ORIGIN}/FAIL.png`, u('b')], 'v1');
    expect(first!.downloaded).toBe(0);
    expect(f.downloads).toEqual([]);
    // Once FAIL has failed its reservation is released, so the next sync fits u('b') exactly under the cap.
    const second = await cache.sync([...nine, u('b')], 'v1');
    expect(second!.downloaded).toBe(1);
    expect(second!.bytes).toBe(CAP_BYTES);
  });

  it('never rejects: a throwing fs resolves null', async () => {
    const f = fakeFs();
    f.fs.ensureDir = () => {
      throw new Error('disk');
    };
    expect(await createArtCache(f.fs).sync([u(1)], 'v1')).toBeNull();
  });

  it('drops manifest entries whose file is gone and re-downloads them', async () => {
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    await cache.sync([u(1)], 'v1');
    f.files.delete(artFileName(u(1)));
    const r = await cache.sync([u(1)], 'v1');
    expect(r!.downloaded).toBe(1);
  });
});

describe('createArtCache.sync: content version revalidation', () => {
  it('re-downloads entries cached under an older version, keeping the old file mapped until the new one lands', async () => {
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    await cache.sync([u(1)], 'v1');
    const name = artFileName(u(1));
    f.log.length = 0;
    const r = await cache.sync([u(1)], 'v2');
    expect(r!.downloaded).toBe(1);
    expect(entriesOf(f)[u(1)]!.contentVersion).toBe('v2');
    // The new bytes arrive as .tmp and are moved over the old file: the old one is never removed first.
    expect(f.log).not.toContain(`rm ${name}`);
    expect(f.log.indexOf(`dl ${name}.tmp`)).toBeLessThan(f.log.indexOf(`mv ${name}.tmp>${name}`));
    expect(f.files.get(MAP_NAME)!.text).toContain(name);
  });

  it('never relabels a stale entry with the new version without re-fetching it', async () => {
    const f = fakeFs(() => MB, (url) => (url === u(1) ? null : MB));
    seed(f, [
      { url: u(1), size: MB, version: 'v1' },
      { url: u(2), size: MB, version: 'v1' },
    ]);
    const r = await createArtCache(f.fs).sync([u(1), u(2)], 'v2');
    const e = entriesOf(f);
    expect(e[u(1)]!.contentVersion).toBe('v1'); // HEAD failed: old file stays mapped and still stale
    expect(e[u(2)]!.contentVersion).toBe('v2');
    expect(f.files.get(MAP_NAME)!.text).toContain(artFileName(u(1)));
    expect(r!.entries).toBe(2);
    // The next sync retries only the still-stale one.
    const g = fakeFs();
    seed(g, [
      { url: u(1), size: MB, version: 'v1' },
      { url: u(2), size: MB, version: 'v2' },
    ]);
    await createArtCache(g.fs).sync([u(1), u(2)], 'v2');
    expect(g.downloads).toEqual([u(1)]);
  });

  it('a failed re-download leaves the old entry mapped under its old version', async () => {
    const f = fakeFs();
    const url = `${ORIGIN}/FAIL.png`;
    seed(f, [{ url, size: MB, version: 'v1' }]);
    await createArtCache(f.fs).sync([url], 'v2');
    const e = entriesOf(f)[url]!;
    expect(e.contentVersion).toBe('v1');
    expect(f.files.has(e.file)).toBe(true);
    expect(f.files.get(MAP_NAME)!.text).toContain(e.file);
  });

  it('a too-large replacement is discarded and the old file stays mapped', async () => {
    const f = fakeFs(() => 3 * MB, () => MB);
    seed(f, [{ url: u(1), size: MB, version: 'v1' }]);
    await createArtCache(f.fs).sync([u(1)], 'v2');
    const e = entriesOf(f)[u(1)]!;
    expect(e).toMatchObject({ size: MB, contentVersion: 'v1' });
    expect(f.files.get(e.file)!.size).toBe(MB);
  });

  it('downloads missing art before refreshing stale art', async () => {
    const f = fakeFs();
    seed(f, [{ url: u(1), size: MB, version: 'v1' }]);
    await createArtCache(f.fs).sync([u(1), u(2)], 'v2');
    expect(f.downloads).toEqual([u(2), u(1)]);
  });

  it('counts the old file against the disk cap while its replacement is in flight', async () => {
    const f = fakeFs(() => 4 * MB);
    seed(f, nine.map((url) => ({ url, size: 4 * MB })));
    // 36 MB on disk, all stale: replacing one needs old + new = 4 MB extra at a time, so only one fits at once.
    const r = await createArtCache(f.fs).sync(nine, 'v2');
    expect(r!.bytes).toBeLessThanOrEqual(CAP_BYTES);
    expect(r!.downloaded).toBeGreaterThan(0);
  });
});
