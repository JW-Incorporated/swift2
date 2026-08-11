import { describe, expect, it } from 'vitest';
import {
  isDue,
  selectDuePosts,
  summarizeQueueStatus,
  utcDateOnly,
  isGenericEraArt,
  repeatsRecentIgMedia,
  eraArtGuardReason,
  isStaleDue,
  MAX_POSTS_PER_RUN,
  MAX_POSTS_PER_PLATFORM_PER_DAY,
} from './queue.mjs';

const now = new Date('2026-07-17T20:00:00Z');

function item(overrides = {}) {
  return {
    platform: 'x',
    body: 'hello',
    scheduledAt: '2026-07-17T18:00:00Z',
    approvedBy: 'joey',
    approvedAt: '2026-07-17T17:00:00Z',
    ...overrides,
  };
}

describe('isDue', () => {
  // Approval stopped gating posting 2026-07-25 (see docs/decisions.md).
  it('does not require an approval', () => {
    expect(isDue(item({ approvedBy: undefined, approvedAt: undefined }), now)).toBe(true);
  });

  it('is false when scheduled in the future', () => {
    expect(isDue(item({ scheduledAt: '2026-07-18T00:00:00Z' }), now)).toBe(false);
  });

  it('is true when due', () => {
    expect(isDue(item(), now)).toBe(true);
  });
});

describe('selectDuePosts', () => {
  it('excludes not-yet-due items but keeps unapproved ones', () => {
    const items = [item({ approvedBy: undefined }), item({ scheduledAt: '2099-01-01T00:00:00Z' }), item()];
    expect(selectDuePosts(items, now, new Map())).toHaveLength(2);
  });

  it('orders by scheduledAt ascending', () => {
    const later = item({ scheduledAt: '2026-07-17T19:00:00Z', body: 'later' });
    const earlier = item({ scheduledAt: '2026-07-17T10:00:00Z', body: 'earlier' });
    const selected = selectDuePosts([later, earlier], now, new Map());
    expect(selected.map((i) => i.body)).toEqual(['earlier', 'later']);
  });

  it('caps at MAX_POSTS_PER_RUN', () => {
    const items = Array.from({ length: MAX_POSTS_PER_RUN + 3 }, (_, i) => item({ body: `${i}` }));
    expect(selectDuePosts(items, now, new Map())).toHaveLength(MAX_POSTS_PER_RUN);
  });

  it('respects the per-platform daily budget already used', () => {
    const items = [item({ platform: 'x' }), item({ platform: 'instagram' })];
    const postedToday = new Map([['x', MAX_POSTS_PER_PLATFORM_PER_DAY]]);
    const selected = selectDuePosts(items, now, postedToday);
    expect(selected).toHaveLength(1);
    expect(selected[0].platform).toBe('instagram');
  });
});

describe('utcDateOnly', () => {
  it('extracts the UTC calendar date', () => {
    expect(utcDateOnly('2026-07-17T23:59:00Z')).toBe('2026-07-17');
  });
});

describe('isGenericEraArt', () => {
  it('matches an era-cover path', () => {
    expect(isGenericEraArt('/eras/tloas.png')).toBe(true);
    expect(isGenericEraArt('/eras/the-life-of-a-showgirl.png')).toBe(true);
  });

  it('does not match a dedicated photo path', () => {
    expect(isGenericEraArt('/social/2026-08-06-haim-cameo.png')).toBe(false);
  });

  it('does not match non-string/undefined media', () => {
    expect(isGenericEraArt(undefined)).toBe(false);
    expect(isGenericEraArt(42)).toBe(false);
  });
});

describe('repeatsRecentIgMedia', () => {
  const posted = (media, postedAt) => ({ platform: 'instagram', media: [media], postedAt });

  it('flags a media path that appears in the recent posted list', () => {
    const recent = [posted('/social/2026-08-01-thing.png', '2026-08-01T00:00:00Z')];
    expect(repeatsRecentIgMedia('/social/2026-08-01-thing.png', recent)).toBe(true);
  });

  it('does not flag a path that has not recently been used', () => {
    const recent = [posted('/social/2026-08-01-thing.png', '2026-08-01T00:00:00Z')];
    expect(repeatsRecentIgMedia('/social/other.png', recent)).toBe(false);
  });

  it('only looks back `lookback` items, oldest dropped first', () => {
    const recent = [posted('/eras/tloas.png', '2026-07-01T00:00:00Z'), posted('/eras/folklore.png', '2026-08-01T00:00:00Z')];
    expect(repeatsRecentIgMedia('/eras/tloas.png', recent, 1)).toBe(false);
    expect(repeatsRecentIgMedia('/eras/folklore.png', recent, 1)).toBe(true);
  });

  it('is false for an empty/undefined media path', () => {
    expect(repeatsRecentIgMedia(undefined, [])).toBe(false);
    expect(repeatsRecentIgMedia('', [])).toBe(false);
  });
});

describe('eraArtGuardReason', () => {
  const igItem = (media, extra = {}) => ({ platform: 'instagram', media: [media], ...extra });
  const posted = (media, postedAt) => ({ platform: 'instagram', media: [media], postedAt });

  it('passes a real (non-era-art) photo, declared or not, however often reused', () => {
    const recent = [posted('/social/2026-08-01-thing.png', '2026-08-01T00:00:00Z')];
    expect(eraArtGuardReason(igItem('/social/2026-08-01-thing.png'), recent)).toBeNull();
  });

  it('blocks era art with no mediaKind: "era-art" tag, even if never used before', () => {
    const reason = eraArtGuardReason(igItem('/eras/red.png'), []);
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/undeclared/i);
  });

  it('passes declared era art that is not among the recent posts', () => {
    const recent = [posted('/eras/folklore.png', '2026-08-01T00:00:00Z')];
    expect(eraArtGuardReason(igItem('/eras/red.png', { mediaKind: 'era-art' }), recent)).toBeNull();
  });

  it('blocks declared era art that repeats within the lookback window', () => {
    const recent = [posted('/eras/red.png', '2026-08-01T00:00:00Z')];
    const reason = eraArtGuardReason(igItem('/eras/red.png', { mediaKind: 'era-art' }), recent);
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/repeat/i);
  });

  it('respects a custom lookback window', () => {
    const recent = [posted('/eras/red.png', '2026-07-01T00:00:00Z'), posted('/eras/folklore.png', '2026-08-01T00:00:00Z')];
    expect(eraArtGuardReason(igItem('/eras/red.png', { mediaKind: 'era-art' }), recent, 1)).toBeNull();
  });

  it('applies to X items with era-art media too, not just Instagram', () => {
    const reason = eraArtGuardReason({ platform: 'x', media: ['/eras/red.png'] }, []);
    expect(reason).not.toBeNull();
  });

  it('is null when the item has no media at all', () => {
    expect(eraArtGuardReason({ platform: 'x', body: 'hello' }, [])).toBeNull();
  });
});

describe('isStaleDue', () => {
  const now = new Date('2026-08-11T12:00:00Z');

  it('is false just under the 48h threshold', () => {
    expect(isStaleDue({ scheduledAt: '2026-08-09T13:00:00Z' }, now)).toBe(false);
  });

  it('is true at/over the 48h threshold', () => {
    expect(isStaleDue({ scheduledAt: '2026-08-09T12:00:00Z' }, now)).toBe(true);
    expect(isStaleDue({ scheduledAt: '2026-08-01T00:00:00Z' }, now)).toBe(true);
  });

  it('respects a custom maxAgeHours', () => {
    expect(isStaleDue({ scheduledAt: '2026-08-11T11:00:00Z' }, now, 2)).toBe(false);
    expect(isStaleDue({ scheduledAt: '2026-08-11T09:00:00Z' }, now, 2)).toBe(true);
  });

  it('is false for an item not yet due (future scheduledAt)', () => {
    expect(isStaleDue({ scheduledAt: '2099-01-01T00:00:00Z' }, now)).toBe(false);
  });
});

describe('summarizeQueueStatus', () => {
  it('is all zeros for an empty queue', () => {
    expect(summarizeQueueStatus([], now)).toEqual({ total: 0, scheduled: 0, due: 0, awaitingApproval: 0 });
  });

  it('splits still-scheduled from due, regardless of approval', () => {
    const items = [item(), item({ approvedBy: undefined, approvedAt: undefined }), item({ scheduledAt: '2099-01-01T00:00:00Z' })];
    expect(summarizeQueueStatus(items, now)).toEqual({ total: 3, scheduled: 1, due: 2, awaitingApproval: 0 });
  });
});
