import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { normalizePhoto } from './normalize-photo.mjs';
import { blocky } from './frame-fixtures';

describe('normalizePhoto', () => {
  it('caps the long edge at 2048 and never upscales', async () => {
    const big = await blocky(1, 3000, 2000);
    const meta = await sharp(await normalizePhoto(big, '/social/library/photos/x.jpg')).metadata();
    expect([meta.width, meta.height]).toEqual([2048, 1365]);
    const small = await normalizePhoto(await blocky(1, 1280, 720), '/social/library/photos/y.jpg');
    expect((await sharp(small).metadata()).width).toBe(1280);
  });

  it('caps portrait photos on the height edge', async () => {
    const meta = await sharp(await normalizePhoto(await blocky(1, 2000, 3000), '/social/library/photos/p.jpg')).metadata();
    expect(meta.height).toBe(2048);
  });

  it('strips EXIF metadata and keeps the format matching the extension', async () => {
    const withExif = await sharp(await blocky(1, 1280, 720)).withExif({ IFD0: { Copyright: 'someone' } }).jpeg().toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const meta = await sharp(await normalizePhoto(withExif, '/social/library/photos/e.jpg')).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.format).toBe('jpeg');
    const png = await normalizePhoto(await sharp(await blocky(1, 800, 600)).png().toBuffer(), '/social/library/photos/z.png');
    expect((await sharp(png).metadata()).format).toBe('png');
  });

  it('passes unknown extensions through untouched', async () => {
    const bytes = Buffer.from('not-an-image');
    expect(await normalizePhoto(bytes, '/social/library/photos/a.gif')).toBe(bytes);
  });
});
