import { describe, expect, it } from 'vitest';
import { isDue, selectDuePosts, summarizeQueueStatus, utcDateOnly, MAX_POSTS_PER_RUN, MAX_POSTS_PER_PLATFORM_PER_DAY } from './queue.mjs';

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

describe('summarizeQueueStatus', () => {
  it('is all zeros for an empty queue', () => {
    expect(summarizeQueueStatus([], now)).toEqual({ total: 0, scheduled: 0, due: 0, awaitingApproval: 0 });
  });

  it('splits still-scheduled from due, regardless of approval', () => {
    const items = [item(), item({ approvedBy: undefined, approvedAt: undefined }), item({ scheduledAt: '2099-01-01T00:00:00Z' })];
    expect(summarizeQueueStatus(items, now)).toEqual({ total: 3, scheduled: 1, due: 2, awaitingApproval: 0 });
  });
});
