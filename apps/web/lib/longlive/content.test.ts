import { describe, expect, it } from 'vitest';
import { CONTENT, build, type RawItem } from './content';
import {
  hasRealPrimaryImage,
  isEraArtFallback,
  primaryImage,
  primaryImageRef,
  type ImageRef,
} from './types';

/** Minimal RawItem factory — only image fields vary across these tests. */
function raw(partial: Partial<RawItem> = {}): RawItem {
  return {
    id: 'red-test-moment',
    date: '2012-10-22',
    dateLabel: 'October 2012',
    title: 'Test moment',
    summary: 'A test moment.',
    body: ['A test moment.'],
    tags: ['Music'],
    ...partial,
  };
}

describe('build() image normalization', () => {
  it('normalizes an item with no image at all to a single era-art primary', () => {
    const [item] = build('red', [raw()]);
    expect(item.images).toEqual([{ url: '/eras/red.png', kind: 'primary' }]);
  });

  it('normalizes a legacy single `image` string to a one-entry primary gallery', () => {
    const [item] = build('red', [raw({ image: '/custom/photo.png' })]);
    expect(item.images).toEqual([{ url: '/custom/photo.png', kind: 'primary' }]);
    // The legacy field itself does not survive normalization.
    expect('image' in item).toBe(false);
  });

  it('passes an explicit `images` gallery through verbatim (no fallback appended)', () => {
    const images: ImageRef[] = [
      { url: 'https://example.com/real.jpg', kind: 'primary', credit: 'Getty Images' },
      { url: 'https://example.com/cover.png', kind: 'archival', caption: 'Single cover' },
      { url: 'https://example.com/similar.jpg', kind: 'reference' },
    ];
    const [item] = build('red', [raw({ images })]);
    expect(item.images).toEqual(images);
  });

  it('ignores an EMPTY explicit `images` array and falls back to the legacy path', () => {
    const [item] = build('red', [raw({ images: [], image: '/custom/photo.png' })]);
    expect(item.images).toEqual([{ url: '/custom/photo.png', kind: 'primary' }]);
  });

  it('stamps the eraId and keeps the rest of the item intact', () => {
    const [item] = build('red', [raw()]);
    expect(item.eraId).toBe('red');
    expect(item.title).toBe('Test moment');
  });
});

describe('primary image helpers', () => {
  it('primaryImageRef prefers the primary entry regardless of order', () => {
    const [item] = build('red', [
      raw({
        images: [
          { url: 'https://example.com/cover.png', kind: 'archival' },
          { url: 'https://example.com/real.jpg', kind: 'primary' },
        ],
      }),
    ]);
    expect(primaryImageRef(item)?.url).toBe('https://example.com/real.jpg');
    expect(primaryImage(item)).toBe('https://example.com/real.jpg');
  });

  it('primaryImageRef falls back to the first image when no primary exists', () => {
    const [item] = build('red', [
      raw({ images: [{ url: 'https://example.com/cover.png', kind: 'archival' }] }),
    ]);
    expect(primaryImageRef(item)?.url).toBe('https://example.com/cover.png');
  });

  it('distinguishes a REAL primary photo from the era-art fallback', () => {
    const [fallback] = build('red', [raw()]);
    const [real] = build('red', [
      raw({ images: [{ url: 'https://example.com/real.jpg', kind: 'primary' }] }),
    ]);
    const [archivalOnly] = build('red', [
      raw({ images: [{ url: 'https://example.com/cover.png', kind: 'archival' }] }),
    ]);
    expect(isEraArtFallback('/eras/red.png')).toBe(true);
    expect(isEraArtFallback('https://example.com/real.jpg')).toBe(false);
    expect(hasRealPrimaryImage(fallback)).toBe(false);
    expect(hasRealPrimaryImage(real)).toBe(true);
    expect(hasRealPrimaryImage(archivalOnly)).toBe(false);
  });
});

describe('CONTENT dataset invariants', () => {
  it('every item (curated + synced) carries a non-empty images gallery', () => {
    expect(CONTENT.length).toBeGreaterThan(0);
    for (const item of CONTENT) {
      expect(item.images.length, item.id).toBeGreaterThan(0);
      for (const img of item.images) {
        expect(img.url, item.id).toBeTruthy();
        expect(['primary', 'reference', 'archival'], item.id).toContain(img.kind);
      }
    }
  });
});
