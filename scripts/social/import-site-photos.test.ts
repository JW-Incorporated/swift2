import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { normalize } from './import-site-photos.mjs';
import { validatePhotoEntry } from './lib/photo-library.mjs';
import { altFor, buildEntry, enumerateSitePhotoRefs, exclusionReason, normalizeSiteUrl, selectCandidates, siteEntryId } from './lib/site-photos.mjs';

const era = {
  default: {
    eraSlug: 'lover',
    items: [
      {
        title: '🌈 Calm Down video',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        moment: {
          sources: [{ url: 'https://news.example.com/article.jpg' }],
          photos: [
            { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Eras_Tour.jpg/330px-Eras_Tour.jpg', credit: 'Ronald Woan (CC BY-SA 2.0)', caption: 'Eras Tour, Arlington.', kind: 'primary' },
            { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Eras_Tour.jpg', caption: 'Same photo, original URL.', kind: 'archival' },
            { url: 'https://media.gettyimages.com/id/1/photo/x.jpg', caption: 'Getty comp', kind: 'primary' },
            { url: 'https://i.ytimg.com/vi/abc/maxresdefault.jpg', caption: 'Video', kind: 'primary' },
            { url: 'https://cdn.shopify.com/s/files/tee.jpg', caption: 'Tee', kind: 'primary' },
            { url: 'https://example.com/other-person.jpg', caption: 'Brendon Urie', kind: 'reference' },
            { url: 'https://upload.wikimedia.org/wikipedia/en/c/cd/Taylor_Swift_-_Lover.png', caption: 'Cover.', kind: 'primary' },
            { url: 'https://example.com/ok-watermark-free.jpg', caption: 'Lover album cover art', kind: 'primary' },
            { url: 'https://example.com/photo-watermark.jpg', caption: 'Stage.', kind: 'primary' },
            { url: 'https://example.com/clean.png', caption: 'A clean photo.' },
          ],
        },
        products: [{ imageUrl: 'https://example.com/product.jpg' }],
      },
    ],
  },
};
const relationships = { RELATIONSHIPS: [{ id: 'rel', name: 'Someone', image: { url: 'https://example.com/portrait.jpg', alt: 'p' } }] };
const runway = { RUNWAY_LOOKS: [{ eraId: 'debut', name: 'Curls', images: [{ url: 'https://example.com/look.jpg', caption: 'A look.', kind: 'primary' }] }] };

const refs = enumerateSitePhotoRefs([
  { file: 'content/lover.mjs', mod: era },
  { file: 'lenses/relationships.mjs', mod: relationships },
  { file: 'lenses/runway-looks.mjs', mod: runway },
]);

describe('enumerateSitePhotoRefs', () => {
  it('collects photos[]/images[] urls and thumbnailUrl, with era and caption context', () => {
    const urls = refs.map((r) => r.url);
    expect(urls).toContain('https://example.com/thumb.jpg');
    expect(urls).toContain('https://example.com/look.jpg');
    expect(refs.find((r) => r.url.endsWith('clean.png'))).toMatchObject({ era: 'lover', caption: 'A clean photo.' });
    expect(refs.find((r) => r.url.endsWith('look.jpg'))?.era).toBe('debut');
  });

  it('never collects merch products, source links or relationship portraits', () => {
    const urls = refs.map((r) => r.url);
    expect(urls).not.toContain('https://example.com/product.jpg');
    expect(urls).not.toContain('https://news.example.com/article.jpg');
    expect(urls).not.toContain('https://example.com/portrait.jpg');
  });
});

describe('exclusionReason', () => {
  const reason = (url: string, extra = {}) => exclusionReason({ url, caption: 'A photo.', kind: 'primary', ...extra });
  it('excludes Getty comps, merch hosts and YouTube thumbnails', () => {
    expect(reason('https://media.gettyimages.com/id/1/photo/x.jpg')).toBe('getty-or-stock-comp-host');
    expect(reason('https://c8.alamy.com/x.jpg')).toBe('getty-or-stock-comp-host');
    expect(reason('https://cdn.shopify.com/a.jpg')).toBe('merch-or-product-host');
    expect(reason('https://m.media-amazon.com/a.jpg')).toBe('merch-or-product-host');
    expect(reason('https://i.ytimg.com/vi/a/hq.jpg')).toBe('youtube-thumbnail');
  });
  it('excludes non-Taylor kinds, cover art, watermark hints and extension-less urls', () => {
    expect(reason('https://example.com/a.jpg', { kind: 'reference' })).toBe('not-taylor-kind');
    expect(reason('https://example.com/a.jpg', { kind: 'dress' })).toBe('not-taylor-kind');
    expect(reason('https://upload.wikimedia.org/wikipedia/en/c/cd/Lover.png')).toBe('album-cover-art');
    expect(reason('https://example.com/a.jpg', { caption: 'Official album cover art' })).toBe('non-photo-cover-art-or-graphic');
    expect(reason('https://example.com/a-watermark.jpg')).toBe('watermark-hint-in-url');
    expect(reason('https://example.com/img/comp/a.jpg')).toBe('watermark-hint-in-url');
    expect(reason('https://example.com/a')).toBe('no-image-extension');
  });
  it('accepts an ordinary press photo and a kind-less thumbnail', () => {
    expect(reason('https://www.billboard.com/a.jpg')).toBeNull();
    expect(exclusionReason({ url: 'https://example.com/t.jpg', title: 'Eras Tour' })).toBeNull();
  });
});

describe('selectCandidates', () => {
  it('dedupes a Wikimedia thumbnail against its original and honours the existing library', () => {
    expect(normalizeSiteUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Eras_Tour.jpg/330px-Eras_Tour.jpg')).toBe('https://upload.wikimedia.org/wikipedia/commons/a/ab/Eras_Tour.jpg');
    const { candidates, excluded } = selectCandidates(refs, { libraryUrls: new Set(['https://example.com/clean.png']) });
    const urls = candidates.map((c) => c.url);
    expect(urls.filter((u) => u.includes('Eras_Tour')).length).toBe(1);
    expect(urls).not.toContain('https://example.com/clean.png');
    expect(excluded['duplicate-url']).toBe(1);
    expect(excluded['already-in-library']).toBe(1);
    expect(excluded['getty-or-stock-comp-host']).toBe(1);
    expect(excluded['youtube-thumbnail']).toBe(1);
  });
});

describe('buildEntry', () => {
  it('produces a library entry that passes validatePhotoEntry, omitting credit when the seed has none', () => {
    const [withCredit] = refs.filter((r) => r.credit);
    const entry = buildEntry({ ...withCredit, url: normalizeSiteUrl(withCredit.url) }, 'jpg');
    expect(validatePhotoEntry(entry)).toEqual([]);
    expect(entry).toMatchObject({ credit: 'Ronald Woan (CC BY-SA 2.0)', tags: ['lover', 'site-photo'] });
    const bare = buildEntry(refs.find((r) => r.url.endsWith('clean.png'))!, 'png');
    expect(validatePhotoEntry(bare)).toEqual([]);
    expect('credit' in bare).toBe(false);
  });
  it('ids are stable per era + url and alt text is concise', () => {
    const ref = { url: 'https://example.com/a.jpg', era: 'red' };
    expect(siteEntryId(ref)).toBe(siteEntryId({ ...ref }));
    expect(siteEntryId(ref)).toMatch(/^site-red-[0-9a-f]{10}$/);
    expect(altFor({ caption: 'word '.repeat(80) }).length).toBeLessThanOrEqual(201);
    expect(altFor({ title: '🌈 Calm Down video' })).toBe('Taylor Swift: Calm Down video');
  });
});

describe('normalize', () => {
  const make = (w: number, h: number, channels: 3 | 4 = 3) =>
    sharp({ create: { width: w, height: h, channels, background: channels === 4 ? { r: 255, g: 0, b: 0, alpha: 0.5 } : { r: 200, g: 100, b: 50 } } });
  it('caps the long edge at 2048, never upscales, and re-encodes opaque images as JPEG', async () => {
    const big = await normalize(await make(4000, 3000).png().toBuffer());
    expect([big.width, big.height]).toEqual([2048, 1536]);
    expect(big.ext).toBe('jpg');
    const small = await normalize(await make(900, 600).webp().toBuffer());
    expect([small.width, small.height]).toEqual([900, 600]);
    expect(small.ext).toBe('jpg');
  });
  it('keeps PNG only for real transparency and strips metadata', async () => {
    const alpha = await normalize(await make(1000, 1000, 4).png().toBuffer());
    expect(alpha.ext).toBe('png');
    const tagged = await normalize(await make(1000, 800).withMetadata({ exif: { IFD0: { Copyright: 'x' } } }).jpeg().toBuffer());
    expect((await sharp(tagged.out).metadata()).exif).toBeUndefined();
  });
});
