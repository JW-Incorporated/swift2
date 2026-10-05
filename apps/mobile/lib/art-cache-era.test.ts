import { describe, expect, it } from 'vitest';
import { CAP_BYTES, MANIFEST_NAME, createArtCache, artFileName } from './art-cache';
import { artContext } from './art-era-sync';
import { MB, ORIGIN, entriesOf, fakeFs, seed, u } from './art-cache.test-kit';

const tp = (era: string, n: number, host = 'img.example.com') => `https://${host}/${era}/${n}.jpg`;
const content = (urls: string[]) => ({ items: [{ images: urls.map((url) => ({ kind: 'primary', url })) }] });
const bundle = (eras: Record<string, string[]>) => ({
  eras: [{ image: '/eras/a.png' }],
  ...Object.fromEntries(Object.entries(eras).map(([id, urls]) => [`content:${id}`, content(urls)])),
});
const mruOf = (f: ReturnType<typeof fakeFs>) => JSON.parse(f.files.get(MANIFEST_NAME)!.text!).mru as string[];

describe('syncEra', () => {
  it('fetches the current era first, then the other MRU eras', async () => {
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    await cache.syncEra('a', 'v1', artContext(bundle({ a: [tp('a', 1), tp('a', 2)] }), ORIGIN));
    f.downloads.length = 0;
    await cache.syncEra('b', 'v1', artContext(bundle({ a: [tp('a', 1), tp('a', 3)], b: [tp('b', 1), tp('b', 2)] }), ORIGIN));
    expect(f.downloads.slice(0, 2).sort()).toEqual([tp('b', 1), tp('b', 2)]);
    expect(f.downloads[2]).toBe(tp('a', 3));
    expect(mruOf(f)).toEqual(['b', 'a']);
  });

  it('keeps the current era plus the last 2 (MRU of 2) and drops older eras', async () => {
    const files = bundle({ a: [tp('a', 1)], b: [tp('b', 1)], c: [tp('c', 1)], d: [tp('d', 1)] });
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    for (const id of ['a', 'b', 'c', 'd']) await cache.syncEra(id, 'v1', artContext(files, ORIGIN));
    expect(mruOf(f)).toEqual(['d', 'c', 'b']);
    expect(Object.keys(entriesOf(f)).sort()).toEqual([tp('b', 1), tp('c', 1), tp('d', 1)]);
  });

  it('MRU eras third-party art survives a base sync and is not evicted as unreferenced', async () => {
    const files = bundle({ a: [tp('a', 1)], b: [tp('b', 1)] });
    const f = fakeFs();
    const cache = createArtCache(f.fs);
    const ctx = artContext(files, ORIGIN);
    await cache.syncEra('a', 'v1', ctx);
    await cache.syncEra('b', 'v1', ctx);
    const r = await cache.sync(ctx.base, 'v1', ctx);
    expect(r?.evicted).toBe(0);
    expect(Object.keys(entriesOf(f))).toEqual(expect.arrayContaining([tp('a', 1), tp('b', 1)]));
    // Without era context the same base sync would drop them.
    const r2 = await createArtCache(f.fs).sync(ctx.base, 'v1');
    expect(r2?.evicted).toBe(2);
  });

  it('respects the 40 MB cap', async () => {
    const f = fakeFs(() => 4 * MB);
    const urls = [1, 2, 3].map((n) => tp('a', n));
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => u(`s${n}`));
    seed(f, base.map((url) => ({ url, size: 4 * MB })));
    const ctx = { ...artContext(bundle({ a: urls }), ORIGIN), base };
    const r = await createArtCache(f.fs).syncEra('a', 'v1', ctx);
    expect(f.downloads).toHaveLength(1);
    expect(r!.bytes).toBeLessThanOrEqual(CAP_BYTES);
  });

  it('keeps first-party era art under the same rules (no placeholder guard)', async () => {
    const f = fakeFs(() => 1000, () => 1000, { typeOf: () => null, bytesOf: () => new Uint8Array(12) });
    await createArtCache(f.fs).syncEra('a', 'v1', artContext(bundle({ a: ['/m/1.jpg'] }), ORIGIN));
    expect(f.downloads).toEqual([`${ORIGIN}/m/1.jpg`]);
  });
});

describe('placeholder guard (third-party)', () => {
  const run = async (f: ReturnType<typeof fakeFs>, url: string) => {
    const cache = createArtCache(f.fs);
    const r = await cache.syncEra('a', 'v1', artContext(bundle({ a: [url] }), ORIGIN));
    return { cache, r };
  };

  it('rejects a HEAD under 2 KB without downloading', async () => {
    const f = fakeFs(() => 1000, () => 1000);
    const { r } = await run(f, tp('a', 1));
    expect(f.downloads).toHaveLength(0);
    expect(r!.entries).toBe(0);
  });

  it('rejects a non-image content-type without downloading', async () => {
    const f = fakeFs(() => 50_000, () => 50_000, { typeOf: () => 'text/html; charset=utf-8' });
    const { r } = await run(f, tp('a', 1));
    expect(f.downloads).toHaveLength(0);
    expect(r!.entries).toBe(0);
  });

  it('discards a download whose bytes are not JPEG/PNG/WebP/GIF, and does not retry it this session', async () => {
    const f = fakeFs(() => 50_000, () => 50_000, { bytesOf: () => new TextEncoder().encode('<html><body>') });
    const { cache, r } = await run(f, tp('a', 1));
    expect(f.downloads).toHaveLength(1);
    expect(r!.entries).toBe(0);
    expect(f.files.has(artFileName(tp('a', 1)))).toBe(false);
    expect(f.files.has(`${artFileName(tp('a', 1))}.tmp`)).toBe(false);
    await cache.syncEra('a', 'v1', artContext(bundle({ a: [tp('a', 1)] }), ORIGIN));
    expect(f.downloads).toHaveLength(1);
  });

  it.each([
    ['PNG', [0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['GIF', [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]],
    ['WebP', [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
  ])('accepts %s magic bytes', async (_n, bytes) => {
    const f = fakeFs(() => 50_000, () => 50_000, { bytesOf: () => new Uint8Array(bytes) });
    const { r } = await run(f, tp('a', 1));
    expect(r!.entries).toBe(1);
  });
});

describe('429 backoff', () => {
  it('skips a host for the rest of the session after a 429', async () => {
    const wiki = 'upload.wikimedia.org';
    const f = fakeFs(() => 50_000, () => 50_000, { statusOf: (url) => (url.includes(wiki) ? 429 : 200) });
    const cache = createArtCache(f.fs);
    const urls = [1, 2, 3, 4, 5].map((n) => tp('a', n, wiki));
    await cache.syncEra('a', 'v1', artContext(bundle({ a: [...urls, tp('a', 9)] }), ORIGIN));
    const headsBefore = f.heads.filter((h) => h.includes(wiki)).length;
    expect(headsBefore).toBeLessThanOrEqual(2); // only the two in-flight workers ever asked
    expect(f.downloads).toEqual([tp('a', 9)]);
    await cache.syncEra('b', 'v1', artContext(bundle({ a: [], b: [tp('b', 1, wiki)] }), ORIGIN));
    expect(f.heads.filter((h) => h.includes(wiki)).length).toBe(headsBefore);
  });
});
