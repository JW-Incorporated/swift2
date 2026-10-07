import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { analyzeFrame, dedupeByHash, hamming, rejectReason } from './frame-quality.mjs';
import { blocky, solid } from './frame-fixtures';

describe('frame-quality', () => {
  it('accepts a sharp, mid-luminance HD frame', async () => {
    expect(rejectReason(await analyzeFrame(await blocky(1)))).toBeNull();
  });

  it('drops near-black, near-white, flat, undersized and letterboxed frames', async () => {
    expect(rejectReason(await analyzeFrame(await solid(1280, 720, 2)))).toBe('near-black');
    expect(rejectReason(await analyzeFrame(await solid(1280, 720, 252)))).toBe('near-white');
    expect(rejectReason(await analyzeFrame(await blocky(1, 1280, 720, { flat: true })))).toMatch(/flat/);
    expect(rejectReason(await analyzeFrame(await blocky(1, 640, 360)))).toMatch(/too small/);
    expect(rejectReason(await analyzeFrame(await blocky(1, 1280, 720, { bars: true })))).toMatch(/letterboxed/);
  });

  it('drops a blurry frame', async () => {
    const blurred = await sharp(await blocky(2)).blur(40).jpeg().toBuffer();
    expect(rejectReason(await analyzeFrame(blurred))).toMatch(/blurry|flat/);
  });

  it('dedupes near-identical frames but keeps different ones', async () => {
    const a = await analyzeFrame(await blocky(1));
    const recompressed = await analyzeFrame(await sharp(await blocky(1)).jpeg({ quality: 60 }).toBuffer());
    const other = await analyzeFrame(await blocky(9));
    expect(hamming(a.hash, recompressed.hash)).toBeLessThanOrEqual(6);
    const kept = dedupeByHash([
      { hash: a.hash, n: 1 },
      { hash: recompressed.hash, n: 2 },
      { hash: other.hash, n: 3 },
    ]);
    expect(kept.map((k) => k.n)).toEqual([1, 3]);
  });

  it('counts already-known hashes as duplicates', async () => {
    const a = await analyzeFrame(await blocky(1));
    expect(dedupeByHash([{ hash: a.hash }], { known: [a.hash] })).toEqual([]);
  });
});
