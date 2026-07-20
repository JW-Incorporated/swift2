import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import {
  addItem,
  buildOutputSource,
  confidenceFrom,
  imagesFrom,
  productsFrom,
  rumorsFrom,
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

describe('productsFrom', () => {
  const dress = {
    brand: 'Polo Ralph Lauren',
    item: 'Striped Silk-Blend Day Dress',
    retailer: 'ralphlauren.com',
    url: 'https://www.ralphlauren.com/some-dress',
  };

  it('passes a well-formed product through, omitting absent price/inStock', () => {
    expect(productsFrom([dress])).toEqual([
      { ...dress, price: undefined, inStock: undefined },
    ]);
  });

  it('carries price and an explicit inStock: false', () => {
    expect(productsFrom([{ ...dress, price: '$319.99', inStock: false }])).toEqual([
      { ...dress, price: '$319.99', inStock: false },
    ]);
  });

  it('normalizes inStock: true to omitted (only sold-out is exceptional)', () => {
    expect(productsFrom([{ ...dress, inStock: true }])?.[0].inStock).toBeUndefined();
  });

  it('drops rows missing any required field or with a non-https url', () => {
    expect(
      productsFrom([
        { ...dress, brand: '' },
        { ...dress, item: undefined },
        { ...dress, retailer: '   ' },
        { ...dress, url: 'ralphlauren.com/no-protocol' },
        // https-only, same rule validate-content.mjs enforces loudly — the
        // two layers must never drift (review 2026-07-19).
        { ...dress, url: 'http://www.ralphlauren.com/some-dress' },
        null,
        'nope',
      ]),
    ).toBeUndefined();
  });

  it('returns undefined for a non-array or empty array (field omitted)', () => {
    expect(productsFrom(null)).toBeUndefined();
    expect(productsFrom(undefined)).toBeUndefined();
    expect(productsFrom([])).toBeUndefined();
  });

  it('carries isAlternative: true and its altNote through', () => {
    expect(
      productsFrom([{ ...dress, isAlternative: true, altNote: 'Similar silhouette, not the exact piece.' }]),
    ).toEqual([
      { ...dress, isAlternative: true, altNote: 'Similar silhouette, not the exact piece.' },
    ]);
  });

  it('drops altNote when isAlternative is not true (never a stray note on an exact item)', () => {
    const row = productsFrom([{ ...dress, altNote: 'stray note' }])?.[0];
    expect(row?.isAlternative).toBeUndefined();
    expect(row?.altNote).toBeUndefined();
  });

  it('drops isAlternative when altNote is missing (fails closed, same as the validator hard-erroring on it)', () => {
    expect(productsFrom([{ ...dress, isAlternative: true }])?.[0].isAlternative).toBeUndefined();
  });
});

describe('confidenceFrom', () => {
  it('passes through the shared confidence values', () => {
    expect(confidenceFrom('reputable_reporting')).toBe('reputable_reporting');
    expect(confidenceFrom('official')).toBe('official');
  });

  it('returns undefined (confirmed fact, no banner) for anything else', () => {
    expect(confidenceFrom('rumored')).toBeUndefined();
    expect(confidenceFrom(null)).toBeUndefined();
    expect(confidenceFrom(undefined)).toBeUndefined();
  });
});

describe('rumorsFrom', () => {
  const valid = {
    claim: 'A castle is reportedly being built inside the venue.',
    reportedBy: 'TMZ',
    reportedOn: '2026-06-30',
    status: 'unconfirmed',
    url: 'https://example.com/report',
  };

  it('passes a fully-attributed rumor through, keeping an optional note', () => {
    expect(rumorsFrom([{ ...valid, note: 'An estimate.' }])).toEqual([
      { ...valid, note: 'An estimate.' },
    ]);
  });

  it('drops an entry missing any honesty-critical field (fail closed)', () => {
    expect(rumorsFrom([{ ...valid, claim: '  ' }])).toBeUndefined();
    expect(rumorsFrom([{ ...valid, reportedBy: undefined }])).toBeUndefined();
    expect(rumorsFrom([{ ...valid, reportedOn: 'June 30' }])).toBeUndefined();
    expect(rumorsFrom([{ ...valid, status: 'maybe' }])).toBeUndefined();
    expect(rumorsFrom([{ ...valid, url: '' }])).toBeUndefined();
  });

  it('returns undefined for a non-array, an empty array, or non-object junk', () => {
    expect(rumorsFrom(null)).toBeUndefined();
    expect(rumorsFrom([])).toBeUndefined();
    expect(rumorsFrom([null, 'nope'])).toBeUndefined();
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
      products: [
        {
          brand: 'Polo Ralph Lauren',
          item: 'Striped Silk-Blend Day Dress',
          retailer: 'ralphlauren.com',
          url: 'https://www.ralphlauren.com/some-dress',
          price: '$319.99',
          inStock: false,
        },
      ],
      confidence: 'reputable_reporting',
      rumors: [
        {
          claim: 'A reported claim.',
          reportedBy: 'TMZ',
          reportedOn: '2026-06-30',
          status: 'unconfirmed',
          url: 'https://example.com/report',
          note: 'An estimate.',
        },
      ],
    });
    const source = buildOutputSource(byEra);
    expect(source).toContain('slug: "a-defining-moment"');
    expect(source).toContain('significance: "defining"');
    expect(source).toContain('threadIds: ["taylors-version"]');
    expect(source).toContain('images: [{ url: "https://example.com/thumb.jpg"');
    expect(source).toContain('sources: [{ name:');
    expect(source).toContain('video: { youtubeId: "abc123", title: "A video" }');
    expect(source).toContain('relatedIds: ["moment:some-other-item"]');
    expect(source).toContain(
      'products: [{ brand: "Polo Ralph Lauren", item: "Striped Silk-Blend Day Dress", retailer: "ralphlauren.com", url: "https://www.ralphlauren.com/some-dress", price: "$319.99", inStock: false }]',
    );
    expect(source).toContain('confidence: "reputable_reporting"');
    expect(source).toContain(
      '{ claim: "A reported claim.", reportedBy: "TMZ", reportedOn: "2026-06-30", status: "unconfirmed", url: "https://example.com/report", note: "An estimate." },',
    );
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

  it('declares products on the generated VaultRawItem type and imports the Product type', () => {
    const source = buildOutputSource({});
    expect(source).toContain('products?: Product[];');
    expect(source).toMatch(/import type \{.*Product.*\} from '\.\/types';/);
  });
});
