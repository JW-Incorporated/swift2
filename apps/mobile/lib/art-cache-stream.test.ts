import { describe, expect, it } from 'vitest';
import { MAX_ITEM_BYTES, createArtCache } from './art-cache';
import { MB, entriesOf, fakeFs, u, type Fake } from './art-cache.test-kit';

const ctx = (base: string[], strict: (url: string) => boolean = () => false) => ({ base, eraUrls: () => [], strict });
const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(12 - b.length).fill(0)]);
const ascii = (s: string, at: number) => {
  const out = new Uint8Array(12);
  [...s].forEach((c, i) => (out[at + i] = c.charCodeAt(0)));
  return out;
};
const sync = (f: Fake, urls: string[], strict?: (url: string) => boolean) => createArtCache(f.fs, () => 1000).sync(urls, 'v1', ctx(urls, strict));

describe('streamed size cap', () => {
  it('rejects an oversized body behind a lying HEAD Content-Length and never indexes it', async () => {
    const f = fakeFs(() => MAX_ITEM_BYTES + 1, () => 1000);
    const r = await sync(f, [u(1)]);
    expect(r?.downloaded).toBe(0);
    expect(Object.keys(entriesOf(f))).toEqual([]);
    expect(f.log.some((l) => l.startsWith('abort '))).toBe(true);
    expect([...f.files.keys()].some((n) => n.endsWith('.tmp'))).toBe(false);
  });

  it('never downloads when the HEAD length is missing', async () => {
    const f = fakeFs(() => 10 * MB, () => null);
    const r = await sync(f, [u(1)]);
    expect(r?.downloaded).toBe(0);
    expect(f.downloads).toEqual([]);
    expect(Object.keys(entriesOf(f))).toEqual([]);
  });

  it('passes the stream limit, bounded by the per-item ceiling', async () => {
    const seen: number[] = [];
    const f = fakeFs(() => MB);
    const inner = f.fs.download;
    f.fs.download = (url, name, max) => (seen.push(max), inner(url, name, max));
    await sync(f, [u(1)]);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBeLessThanOrEqual(MAX_ITEM_BYTES);
  });

  it('removes the partial file and indexes nothing when a download fails midway', async () => {
    const f = fakeFs();
    const r = await sync(f, [`${u('FAIL')}`]);
    expect(r?.downloaded).toBe(0);
    expect(Object.keys(entriesOf(f))).toEqual([]);
    expect([...f.files.keys()].some((n) => n.endsWith('.tmp'))).toBe(false);
  });
});

describe('image type check for first-party art', () => {
  it('rejects first-party non-image bytes and does not index them', async () => {
    const f = fakeFs(() => MB, undefined, { bytesOf: () => ascii('<html><body>', 0) });
    const r = await sync(f, [u(1)]);
    expect(r?.downloaded).toBe(0);
    expect(Object.keys(entriesOf(f))).toEqual([]);
    expect(f.files.has(`${u(1)}.tmp`)).toBe(false);
  });

  const valid: Array<[string, Uint8Array]> = [
    ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0)],
    ['png', bytes(0x89, 0x50, 0x4e, 0x47)],
    ['gif', ascii('GIF89a', 0)],
    ['webp', (() => { const b = ascii('RIFF', 0); 'WEBP'.split('').forEach((c, i) => (b[8 + i] = c.charCodeAt(0))); return b; })()],
    ['avif', (() => { const b = ascii('ftyp', 4); 'avif'.split('').forEach((c, i) => (b[8 + i] = c.charCodeAt(0))); return b; })()],
  ];
  for (const [name, head] of valid) {
    it(`accepts a first-party ${name}`, async () => {
      const f = fakeFs(() => MB, undefined, { bytesOf: () => head });
      const r = await sync(f, [u(1)]);
      expect(r?.downloaded).toBe(1);
      expect(Object.keys(entriesOf(f))).toEqual([u(1)]);
    });
  }
});
