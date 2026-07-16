import { describe, expect, it } from 'vitest';
import { CONTENT, build, dayPrecisionLabel, type RawItem } from './content';
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

describe('dayPrecisionLabel (#682 — WS1 day-precision relapse)', () => {
  it('upgrades a month-only label to the full date it already carries', () => {
    expect(dayPrecisionLabel('2006-06-19', 'June 2006')).toBe('June 19, 2006');
    expect(dayPrecisionLabel('2012-10-01', 'October 2012')).toBe('October 1, 2012');
  });

  it('preserves a deliberate editorial period label', () => {
    expect(dayPrecisionLabel('2007-04-01', 'Spring 2007')).toBe('Spring 2007');
    expect(dayPrecisionLabel('2011-02-01', '2011 Tour')).toBe('2011 Tour');
    expect(dayPrecisionLabel('2012-11-01', 'Late 2012')).toBe('Late 2012');
  });

  it('preserves a label whose month differs from the date (never "corrects" editorial intent)', () => {
    expect(dayPrecisionLabel('2020-12-11', 'November 2020')).toBe('November 2020');
  });

  it('preserves the label when the date is unparseable', () => {
    expect(dayPrecisionLabel('unknown', 'June 2006')).toBe('June 2006');
    expect(dayPrecisionLabel('2006-13-40', 'June 2006')).toBe('June 2006');
  });

  it('build() derives day labels only when asked — the vault path stays verbatim', () => {
    const item = raw({ date: '2012-10-22', dateLabel: 'October 2012' });
    const [derived] = build('red', [item], { deriveDayLabels: true });
    expect(derived.dateLabel).toBe('October 22, 2012');
    // Without the flag (the vault-synced path), a month label may legitimately
    // sit on a placeholder day-01 date — it must never be "upgraded" there.
    const [verbatim] = build('red', [raw({ date: '2014-11-01', dateLabel: 'November 2014' })]);
    expect(verbatim.dateLabel).toBe('November 2014');
  });
});

describe('CONTENT dataset invariants', () => {
  // The regression test WS1 (#369) never got, per #682's acceptance criteria:
  // a hand-curated item may never render a label that is merely the month
  // form of its own day-precision date. If build() ever stops deriving
  // curated labels (the #682 relapse mechanism), this goes red.
  it('no curated item masks a day-precision date behind a month-only label (#682)', () => {
    const curated = CONTENT.filter((c) => !c.id.startsWith('vault-'));
    expect(curated.length).toBeGreaterThan(0);
    for (const item of curated) {
      expect(item.dateLabel, `${item.id} (${item.date})`).not.toBe(formatMonthYear(item.date));
    }
  });

  it('known #682 offenders now render their researched day-level dates', () => {
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
