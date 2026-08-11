import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderCardPng, SIZES } from './card-render.mjs';
import { eraPalette, listEraIds } from './era-palette.mjs';

const BRAND = eraPalette(null);

describe('renderCardPng', () => {
  it('renders a text-variant card at the requested portrait size', async () => {
    const png = await renderCardPng({
      variant: 'text',
      palette: BRAND,
      width: SIZES.portrait.width,
      height: SIZES.portrait.height,
      eyebrow: 'The Threads',
      headline: 'Feral about a bridge',
      kicker: 'Tell it how you feel. Get the song.',
    });
    expect(Buffer.isBuffer(png)).toBe(true);
    const meta = await sharp(png).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
  });

  it('renders a square text card with an era palette and watermark icon', async () => {
    const png = await renderCardPng({
      variant: 'text',
      palette: eraPalette('midnights'),
      width: SIZES.square.width,
      height: SIZES.square.height,
      headline: 'The Clue Web',
      icon: 'sparkles',
    });
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1080);
  });

  it('renders a quote card', async () => {
    const png = await renderCardPng({
      variant: 'quote',
      palette: eraPalette('lover'),
      width: SIZES.portrait.width,
      height: SIZES.portrait.height,
      eyebrow: 'Fan theory',
      headline: 'The garden proposal was never a surprise to the string lights guy',
      kicker: 'r/TaylorSwift',
    });
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
  });

  it('renders a photo card from a local image and keeps the result well under the 1.5MB library budget', async () => {
    const png = await renderCardPng({
      variant: 'photo',
      palette: eraPalette('folklore'),
      width: SIZES.portrait.width,
      height: SIZES.portrait.height,
      eyebrow: 'The Threads',
      headline: 'A cabin in the woods',
      kicker: 'The isolated folklore aesthetic',
      photoDataUri: `data:image/jpeg;base64,${TINY_JPEG_BASE64}`,
      credit: 'Test fixture',
    });
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
    expect(png.length).toBeLessThan(1.5 * 1024 * 1024);
  });

  it('rejects a missing headline', async () => {
    await expect(
      renderCardPng({ variant: 'text', palette: BRAND, width: 1080, height: 1350 }),
    ).rejects.toThrow(/headline/);
  });

  it('rejects an unknown variant', async () => {
    await expect(
      renderCardPng({ variant: 'nope', palette: BRAND, width: 1080, height: 1350, headline: 'x' }),
    ).rejects.toThrow(/Unknown variant/);
  });

  it('rejects a photo variant with no photo supplied', async () => {
    await expect(
      renderCardPng({ variant: 'photo', palette: BRAND, width: 1080, height: 1350, headline: 'x' }),
    ).rejects.toThrow(/photoDataUri/);
  });
});

describe('eraPalette', () => {
  it('resolves every real era id to a distinct accent color', () => {
    const accents = new Set(listEraIds().map((id) => eraPalette(id).accent));
    expect(accents.size).toBe(listEraIds().length);
  });

  it('falls back to the brand default when no era id is given', () => {
    expect(eraPalette(null).id).toBeNull();
    expect(eraPalette(undefined).accent).toBe('#ffd45e');
  });

  it('throws on an unknown era id', () => {
    expect(() => eraPalette('not-a-real-era')).toThrow(/Unknown era id/);
  });
});

// 1x1 white JPEG, smallest possible valid fixture — real photo variants are
// exercised visually (see scripts/social/IMAGES.md), this just proves the
// photo pipeline (data URI in -> PNG out, size-budgeted) works end to end
// without a network fetch in the test suite.
const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
