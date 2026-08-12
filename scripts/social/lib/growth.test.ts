import { describe, expect, it } from 'vitest';
import { countPostsOn, countPostsByPlatformSince, computeDeltas, buildSnapshot, findSeriesGaps, recentGaps } from './growth.mjs';

describe('countPostsOn', () => {
  it('counts only items posted on the given UTC date', () => {
    const items = [
      { postedAt: '2026-07-17T10:00:00Z' },
      { postedAt: '2026-07-17T23:59:00Z' },
      { postedAt: '2026-07-18T00:01:00Z' },
    ];
    expect(countPostsOn(items, '2026-07-17')).toBe(2);
  });

  it('returns 0 for an empty list', () => {
    expect(countPostsOn([], '2026-07-17')).toBe(0);
  });
});

describe('computeDeltas', () => {
  it('subtracts previous from today per platform', () => {
    const today = { x: 340, instagram: 1200, facebook: 89 };
    const previous = { x: 335, instagram: 1182, facebook: 89 };
    expect(computeDeltas(today, previous)).toEqual({ x: 5, instagram: 18, facebook: 0 });
  });

  it('is null for a platform missing from the prior snapshot (day one)', () => {
    expect(computeDeltas({ x: 340 }, undefined)).toEqual({ x: null });
    expect(computeDeltas({ x: 340 }, {})).toEqual({ x: null });
  });

  it('is null for a platform that failed to fetch today (non-number)', () => {
    expect(computeDeltas({ x: null }, { x: 335 })).toEqual({ x: null });
  });
});

describe('countPostsByPlatformSince', () => {
  // The exact shape of the 2026-08-11 bug: everything posts at ~23:00 UTC and
  // the snapshot runs at 11:05 UTC the next morning. `countPostsOn(date)`
  // reads 0; the rolling window reads the truth.
  const nightlyCadence = [
    { platform: 'x', postedAt: '2026-08-10T23:35:07Z' },
    { platform: 'instagram', postedAt: '2026-08-10T23:00:12Z' },
  ];

  it('counts last nights posts that "today so far" misses entirely', () => {
    expect(countPostsOn(nightlyCadence, '2026-08-11')).toBe(0);
    expect(countPostsByPlatformSince(nightlyCadence, '2026-08-11T11:05:00Z')).toEqual({
      total: 2,
      x: 1,
      instagram: 1,
      facebook: 0,
    });
  });

  it('splits per platform so a dark X is visible behind an active Instagram', () => {
    const igOnly = [
      { platform: 'instagram', postedAt: '2026-08-10T23:00:00Z' },
      { platform: 'instagram', postedAt: '2026-08-11T02:00:00Z' },
    ];
    expect(countPostsByPlatformSince(igOnly, '2026-08-11T11:05:00Z')).toMatchObject({ total: 2, x: 0, instagram: 2 });
  });

  it('counts a Facebook cross-post as its own published post', () => {
    const items = [{ platform: 'instagram', postedAt: '2026-08-11T02:00:00Z', facebookPostId: '123_456' }];
    expect(countPostsByPlatformSince(items, '2026-08-11T11:05:00Z')).toEqual({
      total: 2,
      x: 0,
      instagram: 1,
      facebook: 1,
    });
  });

  it('excludes anything outside the window, in either direction', () => {
    const items = [
      { platform: 'x', postedAt: '2026-08-10T10:00:00Z' }, // >24h before
      { platform: 'x', postedAt: '2026-08-11T23:00:00Z' }, // after `now`
    ];
    expect(countPostsByPlatformSince(items, '2026-08-11T11:05:00Z')).toEqual({ total: 0, x: 0, instagram: 0, facebook: 0 });
  });

  it('ignores an unparseable postedAt rather than counting NaN', () => {
    expect(countPostsByPlatformSince([{ platform: 'x', postedAt: 'nonsense' }], '2026-08-11T11:05:00Z').total).toBe(0);
  });

  it('returns all zeros for an empty list', () => {
    expect(countPostsByPlatformSince([], '2026-08-11T11:05:00Z')).toEqual({ total: 0, x: 0, instagram: 0, facebook: 0 });
  });
});

describe('buildSnapshot', () => {
  it('shapes the snapshot object', () => {
    expect(buildSnapshot({ date: '2026-07-17', followers: { x: 340 }, postsToday: 2 })).toEqual({
      date: '2026-07-17',
      followers: { x: 340 },
      postsToday: 2,
    });
  });

  it('includes the rolling 24h window when given one', () => {
    const postsLast24h = { total: 2, x: 1, instagram: 1, facebook: 0 };
    expect(buildSnapshot({ date: '2026-08-11', followers: { x: 0 }, postsToday: 0, postsLast24h })).toEqual({
      date: '2026-08-11',
      followers: { x: 0 },
      postsToday: 0,
      postsLast24h,
    });
  });
});

describe('findSeriesGaps', () => {
  // The real hole this was written for: 20 files 07-18..08-11, missing
  // 07-30 and 07-31 (repo-wide Actions outage) and 08-02..08-04 (three
  // green runs whose auto-merge PRs sat unmerged for 7-9 days).
  const real = [
    '2026-07-18', '2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22',
    '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26', '2026-07-27',
    '2026-07-28', '2026-07-29', '2026-08-01', '2026-08-05', '2026-08-06',
    '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11',
  ];

  it('finds every missing day in the real 2026-07/08 series', () => {
    expect(findSeriesGaps(real, '2026-08-11')).toEqual([
      '2026-07-30', '2026-07-31', '2026-08-02', '2026-08-03', '2026-08-04',
    ]);
  });

  it('returns nothing for a continuous series', () => {
    expect(findSeriesGaps(['2026-08-09', '2026-08-10', '2026-08-11'], '2026-08-11')).toEqual([]);
  });

  it('counts a missing today as a gap (the workflow ran but nothing landed)', () => {
    expect(findSeriesGaps(['2026-08-09', '2026-08-10'], '2026-08-11')).toEqual(['2026-08-11']);
  });

  it('starts at the first snapshot, not at some fixed epoch', () => {
    expect(findSeriesGaps(['2026-08-10', '2026-08-11'], '2026-08-11')).toEqual([]);
  });

  it('handles month and duplicate boundaries', () => {
    expect(findSeriesGaps(['2026-07-30', '2026-07-30', '2026-08-02'], '2026-08-02')).toEqual(['2026-07-31', '2026-08-01']);
  });

  it('is empty for an empty directory', () => {
    expect(findSeriesGaps([], '2026-08-11')).toEqual([]);
  });
});

describe('recentGaps', () => {
  const gaps = ['2026-07-30', '2026-07-31', '2026-08-02', '2026-08-03', '2026-08-04'];

  it('picks out only gaps inside the last 7 days', () => {
    expect(recentGaps(gaps, '2026-08-08')).toEqual(['2026-08-02', '2026-08-03', '2026-08-04']);
  });

  it('is empty once every gap has aged out — history, not an alarm', () => {
    expect(recentGaps(gaps, '2026-08-11')).toEqual([]);
  });

  it('includes the boundary day itself', () => {
    expect(recentGaps(['2026-08-05'], '2026-08-11')).toEqual(['2026-08-05']);
  });
});

describe('buildSnapshot seriesGaps', () => {
  it('records the gaps in the file so the hole outlives the Action log', () => {
    const snapshot = buildSnapshot({
      date: '2026-08-11',
      followers: { x: 0 },
      postsToday: 0,
      seriesGaps: ['2026-07-30', '2026-07-31'],
    });
    expect(snapshot.seriesGaps).toEqual(['2026-07-30', '2026-07-31']);
  });

  it('omits the field entirely when the series is whole', () => {
    const snapshot = buildSnapshot({ date: '2026-08-11', followers: { x: 0 }, postsToday: 0, seriesGaps: [] });
    expect('seriesGaps' in snapshot).toBe(false);
  });
});
