import { describe, expect, it } from 'vitest';
import { countPostsOn, computeDeltas, buildSnapshot } from './growth.mjs';

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

describe('buildSnapshot', () => {
  it('shapes the snapshot object', () => {
    expect(buildSnapshot({ date: '2026-07-17', followers: { x: 340 }, postsToday: 2 })).toEqual({
      date: '2026-07-17',
      followers: { x: 340 },
      postsToday: 2,
    });
  });
});
