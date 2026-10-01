import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { assignBeatPhotos, buildPhotoLedger, eraAvailability, photoIdOf } from './photo-ledger.mjs';
import { canonicalPhotoId, selectSocialPhoto, validatePhotoEntry } from './photo-library.mjs';
import { checkPhotoReuse } from './photo-reuse.mjs';
import { isIgAspect } from './photo-dimensions.mjs';
import { PORTRAIT_CANVAS, WIDE_CANVAS, renderVariant, variantEntry, variantMediaPath, variantPlan } from './photo-variants.mjs';

const original = {
  id: 'red-inglewood-2023-2',
  mediaPath: '/social/library/photos/taylor-red-inglewood-2023-2.jpg',
  credit: 'Paolo Villanueva (CC BY 2.0), via Wikimedia Commons',
  source: 'https://commons.wikimedia.org/wiki/File:Red.jpg',
  alt: 'Taylor Swift performing the Red set.',
  tags: ['red', 'eras-tour'],
};
const variant = variantEntry(original, PORTRAIT_CANVAS);
const inRange = { ...original, id: 'lover-ok', mediaPath: '/social/library/photos/lover-ok.jpg', tags: ['lover'] };
const library = [original, variant, inRange];
const igUsable = new Set([variant.id, inRange.id]); // the original is outside the window

describe('variantPlan (aspect math)', () => {
  it('returns null for every in-window ratio, including the exact edges', () => {
    expect(variantPlan(1080, 1350)).toBeNull(); // 0.8
    expect(variantPlan(1910, 1000)).toBeNull(); // 1.91
    expect(variantPlan(1000, 1000)).toBeNull();
  });
  it('pads tall photos onto 4:5 and very wide photos onto 1.91:1', () => {
    expect(variantPlan(1000, 2000)).toBe(PORTRAIT_CANVAS);
    expect(variantPlan(790, 1000)).toBe(PORTRAIT_CANVAS);
    expect(variantPlan(3000, 1000)).toBe(WIDE_CANVAS);
    expect(variantPlan(1920, 1000)).toBe(WIDE_CANVAS);
  });
  it('both canvases are themselves Instagram-sized', () => {
    expect([PORTRAIT_CANVAS, WIDE_CANVAS].map((c) => [c.width, c.height])).toEqual([[1080, 1350], [1080, 566]]);
    expect(isIgAspect(PORTRAIT_CANVAS.width, PORTRAIT_CANVAS.height)).toBe(true);
    expect(isIgAspect(WIDE_CANVAS.width, WIDE_CANVAS.height)).toBe(true);
  });
  it('rejects nonsense dimensions', () => {
    expect(variantPlan(0, 100)).toBeNull();
    expect(variantPlan(100, Number.NaN)).toBeNull();
  });
});

describe('variant naming and entry', () => {
  it('names the file with a predictable suffix and a .jpg extension whatever the source format', () => {
    expect(variantMediaPath('/social/library/photos/a.png', '-ig45')).toBe('/social/library/photos/a-ig45.jpg');
    expect(variant.mediaPath).toBe('/social/library/photos/taylor-red-inglewood-2023-2-ig45.jpg');
  });
  it('keeps credit/source/alt/tags verbatim and links back with variantOf', () => {
    expect(variant).toMatchObject({ id: 'red-inglewood-2023-2-ig45', credit: original.credit, source: original.source, alt: original.alt, tags: original.tags, variantOf: original.id });
    expect(validatePhotoEntry(variant)).toEqual([]);
  });
  it('rejects a malformed or self-referencing variantOf', () => {
    expect(validatePhotoEntry({ ...variant, variantOf: ' ' })).not.toEqual([]);
    expect(validatePhotoEntry({ ...variant, variantOf: variant.id })).not.toEqual([]);
  });
});

describe('renderVariant (padding output)', () => {
  const fixture = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#c33' } }).jpeg().toBuffer();
  it('pads a tall photo onto 1080x1350 as a JPEG under 1 MB', async () => {
    const out = await renderVariant(await fixture(600, 1600), PORTRAIT_CANVAS);
    const meta = await sharp(out.buffer).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([1080, 1350, 'jpeg']);
    expect(out.buffer.byteLength).toBeLessThanOrEqual(1_000_000);
  });
  it('pads a very wide photo onto 1080x566', async () => {
    const meta = await sharp((await renderVariant(await fixture(3000, 1000), WIDE_CANVAS)).buffer).metadata();
    expect([meta.width, meta.height]).toEqual([1080, 566]);
  });
  it('never crops or upscales: the original sits centred at its own size over a darkened backdrop', async () => {
    const src = await sharp({ create: { width: 400, height: 1000, channels: 3, background: '#ffffff' } }).jpeg({ quality: 100 }).toBuffer();
    const { data, info } = await sharp((await renderVariant(src, PORTRAIT_CANVAS, { qualities: [100] })).buffer).raw().toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => data[(y * info.width + x) * info.channels];
    expect(px(540, 675)).toBeGreaterThan(240); // centre: the photo itself, untouched white
    expect(px(540, 675 - 499)).toBeGreaterThan(240); // its top edge row is inside the photo (1000 tall, centred)
    expect(px(10, 10)).toBeLessThan(160); // outside the photo: the backdrop is the darkened blur
  });
  it('steps quality down until the cap is met', async () => {
    const noisy = await sharp({ create: { width: 1200, height: 2400, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).jpeg({ quality: 95 }).toBuffer();
    const loose = await renderVariant(noisy, PORTRAIT_CANVAS, { maxBytes: 10_000_000 });
    const tight = await renderVariant(noisy, PORTRAIT_CANVAS, { maxBytes: Math.floor(loose.buffer.byteLength / 2) });
    expect(tight.quality).toBeLessThan(loose.quality);
  });
});

describe('original + variant are ONE photo', () => {
  it('canonicalPhotoId maps a variant to its original and leaves originals alone', () => {
    expect(canonicalPhotoId(variant)).toBe(original.id);
    expect(canonicalPhotoId(original)).toBe(original.id);
  });
  it('photoIdOf resolves either binding (photoId or media path) to the original id', () => {
    expect(photoIdOf({ photoId: variant.id }, library)).toBe(original.id);
    expect(photoIdOf({ media: [variant.mediaPath] }, library)).toBe(original.id);
    expect(photoIdOf({ photoId: original.id }, library)).toBe(original.id);
  });
  const posted = (data: object) => [{ file: 'a.json', data: { campaign: 'earlier', platform: 'instagram', ...data } }];
  it('L001: shipping the original makes the variant a reuse', () => {
    const draft = { photoId: variant.id, campaign: 'later', media: [variant.mediaPath] };
    expect(checkPhotoReuse('draft.json', draft, [], posted({ photoId: original.id, media: [original.mediaPath] }), library)).toHaveLength(1);
  });
  it('L001: shipping the variant makes the original a reuse', () => {
    const draft = { photoId: original.id, campaign: 'later', media: [original.mediaPath] };
    expect(checkPhotoReuse('draft.json', draft, [], posted({ photoId: variant.id, media: [variant.mediaPath] }), library)).toHaveLength(1);
  });
  it('L001: a variant queued under another campaign blocks the original', () => {
    const draft = { photoId: original.id, campaign: 'later' };
    const queued = [{ file: 'q.json', data: { photoId: variant.id, campaign: 'other' } }];
    expect(checkPhotoReuse('draft.json', draft, queued, [], library)).toHaveLength(1);
  });
  it('the IG and X halves of ONE campaign may still split original/variant (not reuse)', () => {
    const draft = { photoId: variant.id, campaign: 'pair' };
    const queued = [{ file: 'x.json', data: { photoId: original.id, campaign: 'pair', platform: 'x' } }];
    expect(checkPhotoReuse('draft.json', draft, queued, [], library)).toEqual([]);
  });
  it('the ledger holds both once either is used, and counts the pair once', () => {
    const ledger = buildPhotoLedger(library, { posted: posted({ photoId: original.id }) }, { igUsable });
    expect(ledger.eligible.map((e) => e.id)).toEqual(['lover-ok']);
    expect(ledger.total).toBe(2);
    const viaVariant = buildPhotoLedger(library, { posted: posted({ photoId: variant.id }) }, { igUsable });
    expect(viaVariant.eligible.map((e) => e.id)).toEqual(['lover-ok']);
  });
  it('selectSocialPhoto counts the original\'s history against the variant when given the full library', () => {
    const history = [{ photoId: original.id, media: [original.mediaPath], postedAt: '2026-09-01T00:00:00Z' }];
    const pool = [variant, inRange];
    expect(selectSocialPhoto(pool, history, { allPhotos: library })).toMatchObject({ id: 'lover-ok', reused: false });
    expect(selectSocialPhoto([variant], history, { allPhotos: library })).toMatchObject({ id: variant.id, reused: true, useCount: 1 });
    expect(selectSocialPhoto([variant], history)).toMatchObject({ reused: false }); // without allPhotos the link is invisible — callers must pass it
  });
});

describe('Instagram halves prefer the IG-ready variant', () => {
  it('an out-of-window original is never drawable; its variant is, and names the original for X', () => {
    const ledger = buildPhotoLedger(library, {}, { igUsable });
    expect(ledger.eligible.map((e) => e.id).sort()).toEqual(['lover-ok', variant.id]);
    expect(ledger.igBlockedUnused).toBe(0);
    const [{ photo }] = assignBeatPhotos([{ date: '2026-10-01', hintId: variant.id }], ledger);
    expect(photo).toMatchObject({ photoId: variant.id, media: [variant.mediaPath], mediaCredit: original.credit, variantOf: original.id, xOriginal: { photoId: original.id, media: [original.mediaPath] } });
  });
  it('an original with no drawable variant still counts as IG-blocked', () => {
    const ledger = buildPhotoLedger([original, inRange], {}, { igUsable: new Set([inRange.id]) });
    expect(ledger.igBlockedUnused).toBe(1);
  });
  it('era totals count each photograph once, not original + variant', () => {
    const ledger = buildPhotoLedger(library, {}, { igUsable });
    expect(eraAvailability(library, ledger).red).toMatchObject({ total: 1, unused: 1, exhausted: false });
    const used = buildPhotoLedger(library, { posted: [{ file: 'p.json', data: { photoId: variant.id } }] }, { igUsable });
    expect(eraAvailability(library, used).red).toMatchObject({ total: 1, unused: 0, exhausted: true });
  });
});
