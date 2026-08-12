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
  seedItemToInput,
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

  // THIRD occurrence of the bug this describe block was created for. On
  // 2026-07-18 the writer lost `significance`. On 2026-07-20 it lost the
  // entire rumor lifecycle set — sourceTier, lastCheckedOn and resolution were
  // added to the type, the normalizer, the validator AND the UI the same day,
  // but not to the writer, so they were dropped on the way to the built vault
  // and rendered nowhere for a full day. rumorsFrom() was correct throughout,
  // which is exactly why a unit test on it cannot catch this.
  it('emits the rumor lifecycle fields, not just the six original ones', () => {
    const byEra = {};
    addItem(byEra, {}, 'debut', {
      slug: 'a-resolved-rumor',
      year: 2026,
      month: 7,
      day: 3,
      category: 'relationship',
      title: 'A resolved rumor',
      snippet: 'A snippet.',
      rumors: [
        {
          claim: 'A claim that later resolved.',
          reportedBy: 'Daily Mail',
          reportedOn: '2026-06-30',
          status: 'debunked',
          url: 'https://example.com/report',
          sourceTier: 'tabloid',
          lastCheckedOn: '2026-07-20',
          resolution: {
            on: '2026-07-03',
            url: 'https://example.com/debunk',
            outlet: 'The Hollywood Reporter',
            note: 'Reported the day of.',
          },
        },
      ],
    });
    const source = buildOutputSource(byEra);
    expect(source).toContain('sourceTier: "tabloid"');
    expect(source).toContain('lastCheckedOn: "2026-07-20"');
    expect(source).toContain('resolution: { on: "2026-07-03"');
    expect(source).toContain('outlet: "The Hollywood Reporter"');
    // A settled claim whose citation is dropped renders as "Debunked" backed
    // by nothing — the precise failure the resolution field exists to prevent.
    expect(source).toContain('https://example.com/debunk');
  });
});


describe('socialPost survives the whole chain (issue #1074)', () => {
  // This field vanished on its first build, and the useful part is WHERE.
  // types.ts, the addItem() normalizer, validate-content.mjs, the serializer
  // and the UI were all correct — but the seed-side CALLER never passed
  // `socialPost` into addItem(), so the vault got nothing. Fourth time this
  // repo has lost a field in exactly one link of that chain (significance,
  // moment cross-links, rumor lifecycle, now this).
  //
  // A test on addItem() alone cannot catch a caller bug, and a test on the
  // caller alone cannot catch a serializer bug. So: assert the emitted SOURCE
  // TEXT, from a seed-shaped input, through both accepted placements.

  const seedItem = (placement: 'item' | 'moment') => {
    const post = {
      platform: 'instagram',
      shortcode: 'C_wtAOKOW1z',
      label: 'The endorsement post itself.',
      postedOn: '2024-09-10',
    };
    return {
      year: 2024,
      month: 9,
      day: 10,
      category: 'business',
      title: 'An endorsement',
      snippet: 'A snippet.',
      ...(placement === 'item' ? { socialPost: post } : { socialPost: undefined }),
      ...(placement === 'moment' ? { socialPost: post } : {}),
    };
  };

  it('emits the post into the generated source', () => {
    const byEra = {};
    addItem(byEra, {}, 'tortured-poets', seedItem('item'));
    const out = buildOutputSource(byEra);
    expect(out).toContain('socialPost:');
    expect(out).toContain('C_wtAOKOW1z');
    expect(out).toContain('platform: "instagram"');
    expect(out).toContain('postedOn: "2024-09-10"');
  });

  it('omits postedOn when absent rather than emitting undefined', () => {
    const byEra = {};
    addItem(byEra, {}, 'tortured-poets', {
      ...seedItem('item'),
      socialPost: {
        platform: 'instagram',
        shortcode: 'AAA',
        label: 'No date known.',
      },
    });
    const out = buildOutputSource(byEra);
    expect(out).toContain('shortcode: "AAA"');
    expect(out).not.toContain('postedOn: undefined');
  });

  it('drops a malformed post rather than emitting a broken embed src', () => {
    // A full permalink instead of the bare id is the easy authoring mistake,
    // and it produces a working-looking seed whose iframe 404s.
    const byEra = {};
    addItem(byEra, {}, 'tortured-poets', {
      ...seedItem('item'),
      socialPost: {
        platform: 'instagram',
        shortcode: 'https://www.instagram.com/p/C_wtAOKOW1z/',
        label: 'Full url, not a shortcode.',
      },
    });
    expect(buildOutputSource(byEra)).not.toContain('socialPost:');
  });

  it('drops a post with no label — the label is all a reader sees', () => {
    const byEra = {};
    addItem(byEra, {}, 'tortured-poets', {
      ...seedItem('item'),
      socialPost: { platform: 'instagram', shortcode: 'AAA', label: '   ' },
    });
    expect(buildOutputSource(byEra)).not.toContain('socialPost:');
  });

  it('drops an unsupported platform', () => {
    const byEra = {};
    addItem(byEra, {}, 'tortured-poets', {
      ...seedItem('item'),
      socialPost: { platform: 'tiktok', shortcode: 'AAA', label: 'Not supported yet.' },
    });
    expect(buildOutputSource(byEra)).not.toContain('socialPost:');
  });
});

describe('video survives the whole chain at either placement (issue #846)', () => {
  // Same failure class as socialPost above, and the reason the test goes
  // through seedItemToInput() rather than calling addItem() directly: the
  // video type, addItem() and the serializer were ALL already correct, and 3
  // real `moment.video` clips (the-life-of-a-showgirl.mjs) still rendered
  // nowhere — because the seed-side CALLER read only `item.video`, never
  // `item.moment.video`. A test on addItem()/buildOutputSource() alone passes
  // both before and after the fix; only exercising the projection catches it.

  const base = {
    year: 2025,
    month: 10,
    day: 3,
    category: 'music',
    title: 'The Fate of Ophelia',
    snippet: 'A snippet.',
  };
  const clip = { youtubeId: 'ko70cExuzZM', title: 'Taylor Swift - The Fate of Ophelia (Official Music Video)' };
  const emit = (item: Record<string, unknown>) => {
    const byEra = {};
    addItem(byEra, {}, 'the-life-of-a-showgirl', seedItemToInput(item));
    return buildOutputSource(byEra);
  };

  it('forwards a video authored at the item level', () => {
    expect(emit({ ...base, video: clip })).toContain('video: { youtubeId: "ko70cExuzZM"');
  });

  it('forwards a video authored on the moment (the #846 bug)', () => {
    expect(emit({ ...base, moment: { video: clip } })).toContain('video: { youtubeId: "ko70cExuzZM"');
  });

  it('prefers the item-level video when both are present', () => {
    const out = emit({
      ...base,
      video: { youtubeId: 'ITEMLEVEL', title: 'Item' },
      moment: { video: { youtubeId: 'MOMENTLEVEL', title: 'Moment' } },
    });
    expect(out).toContain('youtubeId: "ITEMLEVEL"');
    expect(out).not.toContain('MOMENTLEVEL');
  });

  it('emits no video row when neither placement has one', () => {
    expect(emit({ ...base })).not.toContain('video:');
  });
});
