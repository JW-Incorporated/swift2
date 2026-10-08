import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { dedupeCandidates, looksAiGenerated, mergeCandidates, normalizeSourceUrl } from './photo-source-common.mjs';
import { dHash, findNearDuplicate, hammingDistance } from './perceptual-hash.mjs';
import { fetchCandidates } from '../import-photo-library.mjs';

const c = (id: string, sourceUrl = `https://x.example/${id}.jpg`, source = `https://p.example/${id}`) => ({ id, sourceUrl, source });

describe('normalizeSourceUrl', () => {
  it('ignores scheme, www, query, hash, trailing slash and percent-encoding', () => {
    expect(normalizeSourceUrl('http://www.A.example/x%20y/?q=1#h')).toBe(normalizeSourceUrl('https://a.example/x y'));
  });
});

describe('looksAiGenerated', () => {
  it('flags AI markers but not words that merely contain ai', () => {
    expect(looksAiGenerated('AI generated Taylor')).toBe(true);
    expect(looksAiGenerated('x', 'ai aigenerated')).toBe(true);
    expect(looksAiGenerated('Taylor Swift Eras Tour Chicago')).toBe(false);
  });
});

describe('dedupeCandidates / mergeCandidates', () => {
  it('drops repeated ids and image URLs, but keeps two candidates sharing a source page', () => {
    const out = dedupeCandidates([c('a'), c('a'), c('b', 'https://x.example/a.jpg'), c('d', 'https://x.example/d.jpg', 'https://p.example/a')]);
    expect(out.map((x) => x.id)).toEqual(['a', 'd']);
  });
  it('merge skips known ids and round-robins so one big source cannot starve the others', () => {
    const big = Array.from({ length: 10 }, (_, i) => c(`w${i}`));
    const small = [c('p1'), c('p2')];
    const merged = mergeCandidates([small, big], { known: new Set(['w0']), max: 5 });
    expect(merged.map((x) => x.id)).toEqual(['p1', 'w1', 'p2', 'w2', 'w3']);
  });
});

describe('perceptual near-duplicate detection', () => {
  const photo = (w: number, quality: number, shift = 0) =>
    sharp({ create: { width: w, height: Math.round(w * 0.66), channels: 3, background: { r: 30, g: 60, b: 120 } } })
      .composite([
        { input: { create: { width: Math.round(w / 3), height: Math.round(w / 3), channels: 3, background: { r: 240, g: 200, b: 40 } } }, left: Math.round(w / 8) + shift, top: Math.round(w / 10) },
      ])
      .jpeg({ quality })
      .toBuffer();

  it('matches the same picture recompressed at another size, not a different picture', async () => {
    const [a, b, other] = await Promise.all([photo(1200, 90), photo(1100, 60), photo(1200, 90, 300)]);
    const ha = (await dHash(a))!;
    expect(hammingDistance(ha, (await dHash(b))!)).toBeLessThanOrEqual(4);
    expect(hammingDistance(ha, (await dHash(other))!)).toBeGreaterThan(4);
    expect(findNearDuplicate(ha, [{ hash: (await dHash(b))!, id: 'b' }])?.id).toBe('b');
  });
  it('returns null for undecodable bytes and finds no duplicate for a null hash', async () => {
    expect(await dHash(Buffer.from('not an image'))).toBeNull();
    expect(findNearDuplicate(null, [{ hash: '0'.repeat(16), id: 'z' }])).toBeUndefined();
  });
});

describe('importer: minLongEdge + near-duplicate skipping', () => {
  const png = (w: number, h: number, color: number) => sharp({ create: { width: w, height: h, channels: 3, background: { r: color, g: 0, b: 0 } } }).png().toBuffer();
  const run = async (candidates: object[], bodies: Record<string, Buffer>, hashImpl?: (b: Buffer) => Promise<string | null>) => {
    const fetchImpl = (async (url: string) => new Response(bodies[url] as unknown as BodyInit, { status: 200 })) as unknown as typeof fetch;
    return fetchCandidates(candidates, { write: false, photosDir: `${process.env.TEMP ?? '/tmp'}/photo-import-test`, seenHashes: new Map(), fetchImpl, sleepImpl: async () => {}, ...(hashImpl ? { hashImpl } : {}) });
  };

  it('rejects an image under its minLongEdge (real bytes, not claimed metadata) and keeps one that meets it', async () => {
    const small = await png(600, 400, 10);
    const big = await png(1200, 800, 20);
    const result = await run(
      [
        { id: 'small', sourceUrl: 'https://a/small.png', mediaPath: '/social/library/photos/small.png', minLongEdge: 1080 },
        { id: 'big', sourceUrl: 'https://a/big.png', mediaPath: '/social/library/photos/big.png', minLongEdge: 1080 },
      ],
      { 'https://a/small.png': small, 'https://a/big.png': big },
    );
    expect(result.failed.map((f: { id: string }) => f.id)).toEqual(['small']);
    expect(result.failed[0].reason).toMatch(/600px, under the 1080px minimum/);
  });

  it('skips a candidate whose perceptual hash is near an earlier one, with a distinct sha256', async () => {
    const a = await png(1200, 800, 10);
    const b = await png(1200, 800, 11);
    const result = await run(
      [
        { id: 'first', sourceUrl: 'https://a/1.png', mediaPath: '/social/library/photos/first.png' },
        { id: 'second', sourceUrl: 'https://a/2.png', mediaPath: '/social/library/photos/second.png' },
      ],
      { 'https://a/1.png': a, 'https://a/2.png': b },
      async () => '00ff00ff00ff00ff',
    );
    expect(result.skippedDuplicates).toEqual([{ id: 'second', duplicateOf: 'first' }]);
  });
});
