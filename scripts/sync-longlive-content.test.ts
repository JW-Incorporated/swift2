import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import {
  addItem,
  buildOutputSource,
  imagesFrom,
  significanceFrom,
  threadIdsFrom,
} from './sync-longlive-content.mjs';

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
      {
        url: 'https://example.com/b.jpg',
        credit: 'Getty Images',
        caption: undefined,
        kind: 'archival',
      },
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

  it('carries a valid significance through end to end, and omits it when absent', () => {
    const byEra = {};
    addItem(byEra, {}, 'debut', {
      ...base,
      year: 2026,
      month: 7,
      day: 3,
      significance: 'defining',
    });
    addItem(byEra, {}, 'debut', { ...base, title: 'Routine item', year: 2026, month: 7, day: 4 });
    expect(byEra.debut[0].significance).toBe('defining');
    expect(byEra.debut[1].significance).toBeUndefined();
  });
});

describe('threadIdsFrom', () => {
  it('passes through known LensIds', () => {
    expect(threadIdsFrom(['taylors-version', 'easter-eggs'])).toEqual([
      'taylors-version',
      'easter-eggs',
    ]);
  });

  it('drops unknown values (typo-guard) rather than passing them through', () => {
    expect(threadIdsFrom(['taylors-version', 'not-a-real-thread'])).toEqual(['taylors-version']);
  });

  it('returns undefined for a non-array, an empty array, or all-invalid input', () => {
    expect(threadIdsFrom(null)).toBeUndefined();
    expect(threadIdsFrom(undefined)).toBeUndefined();
    expect(threadIdsFrom([])).toBeUndefined();
    expect(threadIdsFrom(['nope'])).toBeUndefined();
  });
});

describe('significanceFrom', () => {
  it('passes through the two valid values', () => {
    expect(significanceFrom('defining')).toBe('defining');
    expect(significanceFrom('notable')).toBe('notable');
  });

  it('returns undefined (routine) for anything else rather than guessing', () => {
    expect(significanceFrom('major')).toBeUndefined();
    expect(significanceFrom(null)).toBeUndefined();
    expect(significanceFrom(undefined)).toBeUndefined();
    expect(significanceFrom('')).toBeUndefined();
  });
});

describe('buildOutputSource', () => {
  // Regression coverage for a real bug (docs/decisions.md, 2026-07-18):
  // addItem() computed `significance` correctly, but the writer had no
  // `lines.push` line for it, so it never reached the generated file — only
  // caught by checking the live site, not by any test, because every
  // existing test stopped at the intermediate addItem() object instead of
  // the actual emitted source text. This test asserts on the real string
  // buildOutputSource returns, the same text that gets written to disk.
  it('emits every optional field addItem() can produce — not just significance', () => {
    // Found in review (2026-07-18): the original version of this test only
    // covered significance + threadIds despite its name claiming "every
    // optional field" — it would still have passed if the writer lost
    // support for slug, images, sources, video, or relatedIds. One fully
    // populated item, checked against every field addItem() accepts.
    const byEra = {};
    addItem(byEra, {}, 'debut', {
      slug: 'a-defining-moment',
      year: 2026,
      month: 7,
      day: 3,
      category: 'relationship',
      title: 'A defining moment',
      snippet: 'A snippet.',
      sourceUrl: 'https://example.com/source',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      significance: 'defining',
      threadIds: ['taylors-version'],
      video: { youtubeId: 'abc123', title: 'A video' },
      relatedIds: ['moment:some-other-item'],
    });
    const source = buildOutputSource(byEra);
    expect(source).toContain('slug: "a-defining-moment"');
    expect(source).toContain('significance: "defining"');
    expect(source).toContain('threadIds: ["taylors-version"]');
    expect(source).toContain('images: [{ url: "https://example.com/thumb.jpg"');
    expect(source).toContain('sources: [{ name:');
    expect(source).toContain('video: { youtubeId: "abc123", title: "A video" }');
    expect(source).toContain('relatedIds: ["moment:some-other-item"]');
  });

  it('omits a significance value for a routine item rather than emitting a falsy one', () => {
    const byEra = {};
    addItem(byEra, {}, 'debut', {
      year: 2026,
      month: 7,
      day: 4,
      category: 'sighting',
      title: 'A routine moment',
      snippet: 'A snippet.',
    });
    const source = buildOutputSource(byEra);
    // The VaultRawItem type declaration always mentions the field name
    // (`significance?: 'defining' | 'notable';`) — that's expected on every
    // output regardless of data. What must NOT appear is a per-item value
    // assignment, which esc() always double-quotes, unlike the single-quoted
    // type declaration — that distinction is what this checks.
    expect(source).not.toContain('significance: "');
  });

  it('declares significance on the generated VaultRawItem type, not just the values', () => {
    const source = buildOutputSource({});
    expect(source).toContain("significance?: 'defining' | 'notable';");
  });
});
