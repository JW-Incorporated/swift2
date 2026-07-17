import { describe, expect, it } from 'vitest';
import { CONTENT, build, type RawItem } from './content';
import { formatMonthYear } from './format';
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
  // The regression test WS1 (#369) never got, per #682's acceptance criteria:
  // a hand-curated item may never mask a day-precision date behind the bare
  // month form of that same date ('June 2006' on date '2006-06-19'). If your
  // new item fails here: show the day (the formatFullDate() form) when the
  // date is researched to the day, or use an editorial period label
  // ('Spring 2007', 'Late 2012') when it isn't — see the dateLabel rule on
  // RAW in content.ts. Vault-synced items are exempt: their generator
  // encodes month-only precision as a placeholder day-01 date plus a month
  // label on purpose (scripts/sync-longlive-content.mjs), which this rule
  // would misread as masking.
  it('no curated item masks a day-precision date behind a month-only label (#682)', () => {
    const curated = CONTENT.filter((c) => !c.id.startsWith('vault-'));
    expect(curated.length).toBeGreaterThan(0);
    for (const item of curated) {
      // Only day-shaped dates can mask day precision; partial forms
      // (YYYY-MM, YYYY) are honestly month/year-precision and a month label
      // on them is correct.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue;
      expect(item.dateLabel, `${item.id} (${item.date})`).not.toBe(formatMonthYear(item.date));
    }
  });

  it('known #682 offenders render their researched day-level dates', () => {
    const byId = new Map(CONTENT.map((c) => [c.id, c]));
    expect(byId.get('debut-tim-mcgraw')?.dateLabel).toBe('June 19, 2006');
    expect(byId.get('red-begin-again')?.dateLabel).toBe('October 1, 2012');
    // Period moments keep their editorial labels — their dates are
    // representative placeholders, not researched days.
    expect(byId.get('debut-cowboy-boots')?.dateLabel).toBe('Spring 2007');
    expect(byId.get('folklore-cardigan')?.dateLabel).toBe('Summer 2020');
  });

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
