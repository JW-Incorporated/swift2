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
  // #682/#717 regression, post-migration form: the legacy curated items now
  // live in the seed vault (consolidation stage 2a, 2026-07-19), keeping
  // their old ids as SLUGS. Their researched day-level labels and editorial
  // period labels must survive the pipeline (the migration's day-detection +
  // the seed dateLabel override) — an id-based lookup would silently pass on
  // `undefined`, so this asserts the items exist first.
  it('known #682/#717 items keep their researched or editorial date labels through the vault', () => {
    const bySlug = new Map(CONTENT.filter((c) => c.slug).map((c) => [c.slug, c]));
    const expectLabel = (slug: string, label: string) => {
      const item = bySlug.get(slug);
      expect(item, `migrated item with slug "${slug}" is missing from CONTENT`).toBeDefined();
      expect(item?.dateLabel).toBe(label);
    };
    expectLabel('debut-tim-mcgraw', 'June 19, 2006');
    expectLabel('red-begin-again', 'October 1, 2012');
    // Period moments keep their editorial labels — their dates are
    // representative placeholders, not researched days.
    expectLabel('debut-cowboy-boots', 'Spring 2007');
    expectLabel('folklore-cardigan', 'Summer 2020');
    // #717: these three aesthetic moments carried release-adjacent placeholder
    // dates, so day-level labels implied precision nobody researched — Joey
    // moved them to editorial period labels.
    expectLabel('red-snl', 'Fall 2012');
    expectLabel('ttpd-typewriter', 'Spring 2024');
    expectLabel('tloas-sequins', 'Fall 2025');
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
