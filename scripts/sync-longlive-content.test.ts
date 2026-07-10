import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import { addItem, imagesFrom } from './sync-longlive-content.mjs';

describe('imagesFrom', () => {
  it('maps thumbnail_url to the primary image', () => {
    expect(imagesFrom('https://example.com/a.jpg', null)).toEqual([
      { url: 'https://example.com/a.jpg', kind: 'primary' },
    ]);
  });

  it('maps moment.photos to archival entries after the primary, carrying credit', () => {
    expect(
      imagesFrom('https://example.com/a.jpg', [
        { url: 'https://example.com/b.jpg', credit: 'Getty Images' },
      ]),
    ).toEqual([
      { url: 'https://example.com/a.jpg', kind: 'primary' },
      { url: 'https://example.com/b.jpg', credit: 'Getty Images', caption: undefined, kind: 'archival' },
    ]);
  });

  it('respects an explicit valid photo kind and coerces unknown kinds to archival', () => {
    const out = imagesFrom(null, [
      { url: 'https://example.com/r.jpg', kind: 'reference' },
      { url: 'https://example.com/x.jpg', kind: 'totally-real' },
    ]);
    expect(out?.map((i) => i.kind)).toEqual(['reference', 'archival']);
  });

  it('de-dupes by url, keeping the primary first and merging the photo credit/caption in', () => {
    expect(
      imagesFrom('https://example.com/a.jpg', [
        { url: 'https://example.com/a.jpg', credit: 'Big Machine Records', caption: 'Album art' },
        { url: 'https://example.com/a.jpg', credit: 'Someone Else' },
      ]),
    ).toEqual([
      {
        url: 'https://example.com/a.jpg',
        credit: 'Big Machine Records',
        caption: 'Album art',
        kind: 'primary',
      },
    ]);
  });

  it('drops malformed photo entries (no url / blank url / non-object)', () => {
    expect(
      imagesFrom(null, [null, {}, { url: '   ' }, { credit: 'Getty' }, 'nope']),
    ).toBeUndefined();
  });

  it('returns undefined when there is no imagery at all (field omitted -> era-art fallback)', () => {
    expect(imagesFrom(null, null)).toBeUndefined();
    expect(imagesFrom('', [])).toBeUndefined();
  });
});

describe('addItem date precision', () => {
  const base = { category: 'music', title: 'Test Item', snippet: 'A snippet.' };

  it('uses a real calendar date + full-precision dateLabel when day is given', () => {
    const byEra = {};
    addItem(byEra, {}, 'debut', { ...base, year: 2026, month: 7, day: 9 });
    const item = byEra.debut[0];
    expect(item.date).toBe('2026-07-09');
    expect(item.dateLabel).toBe('July 9, 2026');
  });

  it('falls back to month-only precision when day is absent', () => {
    const byEra = {};
    addItem(byEra, {}, 'debut', { ...base, year: 2026, month: 7 });
    const item = byEra.debut[0];
    expect(item.date).toBe('2026-07-01');
    expect(item.dateLabel).toBe('July 2026');
  });

  it('treats an out-of-range or non-integer day as absent rather than guessing', () => {
    const byEra = {};
    addItem(byEra, {}, 'debut', { ...base, year: 2026, month: 7, day: 32 });
    addItem(byEra, {}, 'debut', { ...base, title: 'Test Item 2', year: 2026, month: 7, day: 4.5 });
    expect(byEra.debut[0].dateLabel).toBe('July 2026');
    expect(byEra.debut[1].dateLabel).toBe('July 2026');
  });
});
