import { describe, expect, it } from 'vitest';
import {
  CAP_BYTES,
  MANIFEST_NAME,
  MAP_NAME,
  SESSION_BUDGET_BYTES,
  artFileName,
  artMapSource,
  collectArtUrls,
  createArtCache,
  hashUrl,
  type ArtFs,
} from './art-cache';

const ORIGIN = 'https://www.longlivets.com';
const MB = 1024 * 1024;

function fakeFs(sizeOf: (url: string) => number = () => 1 * MB) {
  const files = new Map<string, { text?: string; size: number }>();
  const log: string[] = [];
  let active = 0;
  let maxActive = 0;
  const fs: ArtFs = {
    ensureDir: () => void log.push('ensureDir'),
    list: () => [...files.keys()],
    readText: (n) => files.get(n)?.text ?? null,
    writeText: (n, text) => void files.set(n, { text, size: text.length }),
    size: (n) => files.get(n)?.size ?? null,
    remove: (n) => void (files.delete(n), log.push(`rm ${n}`)),
    async download(url, name) {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      if (url.includes('FAIL')) throw new Error('net');
      files.set(name, { size: sizeOf(url) });
      log.push(`dl ${name}`);
    },
    async move(from, to) {
      files.set(to, files.get(from)!);
      files.delete(from);
      log.push(`mv ${from}>${to}`);
    },
    uri: (n) => `file:///art/${n}`,
  };
  return { fs, files, log, maxActive: () => maxActive };
}

const u = (n: number | string) => `${ORIGIN}/eras/${n}.png`;
const entriesOf = (f: ReturnType<typeof fakeFs>) =>
  JSON.parse(f.files.get(MANIFEST_NAME)!.text!).entries as Record<string, { file: string; size: number }>;

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

  it('sweeps stray .tmp files at start and does not re-download cached art', async () => {
    const f = fakeFs();
    f.files.set('stale.png.tmp', { size: 5 });
    const cache = createArtCache(f.fs);
    await cache.sync([u(1)], 'v1');
    expect(f.files.has('stale.png.tmp')).toBe(false);
    const before = f.log.filter((l) => l.startsWith('dl')).length;
    const r = await cache.sync([u(1)], 'v2');
    expect(f.log.filter((l) => l.startsWith('dl')).length).toBe(before);
    expect(r?.downloaded).toBe(0);
    expect(entriesOf(f)[u(1)]!.file).toBe(artFileName(u(1)));
  });

  it('evicts entries the current bundle no longer references', async () => {
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    await cache.sync([u(1), u(2)], 'v1');
    const r = await cache.sync([u(2)], 'v2');
    expect(r).toMatchObject({ evicted: 1, entries: 1 });
    expect(f.files.has(artFileName(u(1)))).toBe(false);
    expect(Object.keys(entriesOf(f))).toEqual([u(2)]);
    expect(f.files.get(MAP_NAME)!.text).not.toContain('/eras/1.png');
  });

  it('enforces the hard cap by LRU (oldest lastUsed first)', async () => {
    const f = fakeFs(() => 8 * MB);
    let t = 0;
    const cache = createArtCache(f.fs, () => ++t);
    const urls = [1, 2, 3, 4, 5].map(u);
    // Each session pulls one more 8 MB file, staying under its own budget; five files is exactly the 40 MB cap.
    for (let n = 1; n <= 5; n++) await cache.sync(urls.slice(0, n), 'v');
    expect((await cache.sync(urls, 'v'))!.bytes).toBe(CAP_BYTES);
    // A sixth file pushes past the cap: the least-recently-used entries go, the new file survives.
    const six = [...urls, u(6)];
    const r = await cache.sync(six, 'v');
    expect(r!.bytes).toBeLessThanOrEqual(CAP_BYTES);
    expect(r!.evicted).toBeGreaterThan(0);
    const kept = Object.keys(entriesOf(f));
    expect(kept).toContain(u(6));
    expect(kept).not.toContain(u(1));
  });

  it('stops starting downloads once the session budget is spent', async () => {
    const f = fakeFs(() => 6 * MB);
    const urls = [1, 2, 3, 4, 5, 6].map(u);
    const r = await createArtCache(f.fs).sync(urls, 'v1');
    expect(r!.downloaded).toBeLessThan(urls.length);
    expect(r!.bytes).toBeLessThanOrEqual(SESSION_BUDGET_BYTES + 2 * 6 * MB); // sizes are unknown up front: at most one in-flight file per worker overshoots
    const r2 = await createArtCache(f.fs).sync(urls, 'v1');
    expect(r2!.entries).toBeGreaterThan(r!.entries);
  });

  it('uses at most two concurrent downloads', async () => {
    const f = fakeFs(() => 100);
    await createArtCache(f.fs).sync([1, 2, 3, 4, 5].map(u), 'v1');
    expect(f.maxActive()).toBe(2);
  });

  it('a failed download leaves no entry and no .tmp; the rest still land', async () => {
    const f = fakeFs(() => 100);
    const r = await createArtCache(f.fs).sync([`${ORIGIN}/FAIL.png`, u(2)], 'v1');
    expect(r).toMatchObject({ downloaded: 1, entries: 1 });
    expect([...f.files.keys()].some((k) => k.endsWith('.tmp'))).toBe(false);
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
