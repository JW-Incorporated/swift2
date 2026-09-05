import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './top-of-feed-photo.mjs';

const moment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'k',
  title: 't',
  texts: { snippet: '' },
  category: 'business',
  images: [],
  raw: { year: 2026, month: 1, day: 1 },
  ...over,
});

describe('top-of-feed-photo check', () => {
  it('ignores non-moment items', async () => {
    expect(await check([{ type: 'track', era: 'x', raw: {} }])).toEqual([]);
  });

  it('flags the newest photo-less moment in an era', async () => {
    const m = moment({ key: 'newest', title: 'Newest page', raw: { year: 2026, month: 9, day: 1 } });
    const f = await check([m]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.top-of-feed-photo');
    expect(f[0].severity).toBe('P1');
    expect(f[0].title).toMatch(/no photo \(position 1 of 1\)/);
  });

  it('does not flag a moment with a real photo', async () => {
    const m = moment({
      key: 'has-photo',
      raw: { year: 2026, month: 9, day: 1, moment: { photos: [{ url: 'https://example.com/a.jpg' }] } },
    });
    expect(await check([m])).toEqual([]);
  });

  it('does not flag a moment with a photosReviewed reason recorded', async () => {
    const m = moment({
      key: 'reviewed-sparse',
      raw: { year: 2026, month: 9, day: 1, photosReviewed: 'residence privacy redline (L1)' },
    });
    expect(await check([m])).toEqual([]);
  });

  it('flags a moment even with photosReviewed if the string is blank/whitespace', async () => {
    const m = moment({
      key: 'blank-reason',
      raw: { year: 2026, month: 9, day: 1, photosReviewed: '   ' },
    });
    const f = await check([m]);
    expect(f).toHaveLength(1);
  });

  it('only considers the N newest moments per era (N = CONFIG.topOfFeed.count, default 10)', async () => {
    // 11 moments, newest-first by date; the 11th (oldest) should not be flagged.
    const moments = Array.from({ length: 11 }, (_, i) =>
      moment({ key: `m${i}`, raw: { year: 2026, month: 1, day: i + 1 } }),
    );
    const f = await check(moments);
    // 10 newest (days 2..11 → wait, day 11 doesn't exist; use days offset) — flags exactly 10.
    expect(f).toHaveLength(10);
    const flaggedKeys = new Set(f.map((x: { itemRef: { key: string } }) => x.itemRef.key));
    expect(flaggedKeys.has('m0')).toBe(false); // oldest (day 1) is the 11th newest — excluded
  });

  it('scores eras independently', async () => {
    const a = moment({ key: 'era-a', era: 'folklore', raw: { year: 2020, month: 7, day: 24 } });
    const b = moment({ key: 'era-b', era: 'evermore', raw: { year: 2020, month: 12, day: 11 } });
    const f = await check([a, b]);
    expect(f).toHaveLength(2);
  });
});
