import { describe, expect, it } from 'vitest';
import {
  isDue,
  isValidScheduledAt,
  selectDuePosts,
  summarizeQueueStatus,
  utcDateOnly,
  isGenericEraArt,
  repeatsRecentIgMedia,
  eraArtGuardReason,
  isStaleDue,
  recentInstagramPosts,
  countPostedToday,
  bodyHash,
  findPostedDuplicate,
  missingCredsFor,
  needsMediaPreflight,
  mediaUrlsFor,
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

describe('isValidScheduledAt', () => {
  it('is true for a real ISO timestamp', () => {
    expect(isValidScheduledAt(item())).toBe(true);
  });

  it('is false for a missing scheduledAt', () => {
    expect(isValidScheduledAt({ platform: 'x', body: 'hi' })).toBe(false);
  });

  it('is false for a malformed scheduledAt string', () => {
    expect(isValidScheduledAt(item({ scheduledAt: 'not-a-date' }))).toBe(false);
    expect(isValidScheduledAt(item({ scheduledAt: 'TBD' }))).toBe(false);
  });

  it('is false for null/undefined item', () => {
    expect(isValidScheduledAt(null)).toBe(false);
    expect(isValidScheduledAt(undefined)).toBe(false);
  });
});

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

  // Regression: a malformed scheduledAt used to feed NaN into this
  // comparison, which is always false — meaning the item was never "due"
  // (and never "stale" either), so it just sat in the queue invisibly
  // forever. isValidScheduledAt() must be checked upstream before this.
  it('is false (not true!) for an invalid scheduledAt — never silently "due"', () => {
    expect(isDue(item({ scheduledAt: 'garbage' }), now)).toBe(false);
  });
});

describe('selectDuePosts', () => {
  // These two exercise due-ness filtering and ordering, so they pass
  // Infinity: the default cap is a pacing floor (see MAX_POSTS_PER_RUN) and
  // would otherwise truncate the very thing being asserted.
  it('excludes not-yet-due items but keeps unapproved ones', () => {
    const items = [item({ approvedBy: undefined }), item({ scheduledAt: '2099-01-01T00:00:00Z' }), item()];
    expect(selectDuePosts(items, now, new Map(), Infinity)).toHaveLength(2);
  });

  it('orders by scheduledAt ascending', () => {
    const later = item({ scheduledAt: '2026-07-17T19:00:00Z', body: 'later' });
    const earlier = item({ scheduledAt: '2026-07-17T10:00:00Z', body: 'earlier' });
    const selected = selectDuePosts([later, earlier], now, new Map(), Infinity);
    expect(selected.map((i) => i.body)).toEqual(['earlier', 'later']);
  });

  it('caps at MAX_POSTS_PER_RUN', () => {
    const items = Array.from({ length: MAX_POSTS_PER_RUN + 3 }, (_, i) => item({ body: `${i}` }));
    expect(selectDuePosts(items, now, new Map())).toHaveLength(MAX_POSTS_PER_RUN);
  });

  // Regression: 2026-08-26, four appearance-discovery X drafts scheduled
  // within 3.6 seconds of each other all published in the SAME run, 1.2s
  // apart on the live timeline. The per-run cap is the only thing that
  // paces a batch that lands already-overdue, so it must stay at 1 — the
  // 30-minute run interval is then the floor on spacing between two posts.
  it('never selects more than one post in a single run by default', () => {
    expect(MAX_POSTS_PER_RUN).toBe(1);
    const burst = Array.from({ length: 4 }, (_, i) => item({ platform: 'x', body: `${i}`, scheduledAt: `2026-07-17T09:07:4${i}.000Z` }));
    expect(selectDuePosts(burst, now, new Map())).toHaveLength(1);
  });

  it('respects the per-platform daily budget already used', () => {
    const items = [item({ platform: 'x' }), item({ platform: 'instagram' })];
    const postedToday = new Map([['x', MAX_POSTS_PER_PLATFORM_PER_DAY]]);
    const selected = selectDuePosts(items, now, postedToday);
    expect(selected).toHaveLength(1);
    expect(selected[0].platform).toBe('instagram');
  });

  it('an explicit maxPerRun overrides the default cap (post-queue.mjs passes Infinity)', () => {
    const items = Array.from({ length: MAX_POSTS_PER_RUN + 3 }, (_, i) => item({ body: `${i}` }));
    expect(selectDuePosts(items, now, new Map(), Infinity)).toHaveLength(items.length);
    expect(selectDuePosts(items, now, new Map(), 1)).toHaveLength(1);
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

  // 2026-08-12 (the Taylor-photo standard, PR #2043): era art is banned
  // OUTRIGHT at post time — declared, undeclared, fresh, or repeated. The
  // old declared-fallback path is the loophole that produced 17/17 era-tile
  // IG posts, so there is deliberately no way back through this guard.
  it('blocks era art with no mediaKind tag, even if never used before', () => {
    const reason = eraArtGuardReason(igItem('/eras/red.png'), []);
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/banned outright/i);
  });

  it('blocks DECLARED era art too — the declared-fallback loophole is closed', () => {
    const recent = [posted('/eras/folklore.png', '2026-08-01T00:00:00Z')];
    const reason = eraArtGuardReason(igItem('/eras/red.png', { mediaKind: 'era-art' }), recent);
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/banned outright/i);
  });

  it('blocks era art anywhere in the media array, not just the tile', () => {
    const item = { platform: 'instagram', media: ['/social/library/photos/taylor-debut-cma-2006.jpg', '/eras/red.png'] };
    expect(eraArtGuardReason(item, [])).not.toBeNull();
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

describe('recentInstagramPosts', () => {
  const posted = (media, postedAt, platform = 'instagram') => ({ platform, media: [media], postedAt });

  it('filters to Instagram only and sorts oldest-to-newest', () => {
    const all = [
      posted('/eras/red.png', '2026-08-02T00:00:00Z'),
      posted('/eras/lover.png', '2026-08-01T00:00:00Z', 'x'),
      posted('/eras/folklore.png', '2026-08-01T00:00:00Z'),
    ];
    expect(recentInstagramPosts(all).map((p) => p.media[0])).toEqual(['/eras/folklore.png', '/eras/red.png']);
  });

  it('respects the `n` cutoff, dropping the oldest first', () => {
    const all = [posted('/a.png', '2026-08-01T00:00:00Z'), posted('/b.png', '2026-08-02T00:00:00Z'), posted('/c.png', '2026-08-03T00:00:00Z')];
    expect(recentInstagramPosts(all, 2).map((p) => p.media[0])).toEqual(['/b.png', '/c.png']);
  });
});

describe('countPostedToday', () => {
  const now = new Date('2026-08-11T20:00:00Z');

  it('counts only items posted on the same UTC day, per platform', () => {
    const all = [
      { platform: 'x', postedAt: '2026-08-11T01:00:00Z' },
      { platform: 'x', postedAt: '2026-08-11T05:00:00Z' },
      { platform: 'instagram', postedAt: '2026-08-11T10:00:00Z' },
      { platform: 'x', postedAt: '2026-08-10T23:59:00Z' }, // yesterday, excluded
    ];
    const counts = countPostedToday(all, now);
    expect(counts.get('x')).toBe(2);
    expect(counts.get('instagram')).toBe(1);
  });

  it('is an empty map for no posted items', () => {
    expect(countPostedToday([], now).size).toBe(0);
  });
});

describe('bodyHash', () => {
  it('is stable for the same text', () => {
    expect(bodyHash('hello world')).toBe(bodyHash('hello world'));
  });

  it('differs for different text', () => {
    expect(bodyHash('hello world')).not.toBe(bodyHash('hello world!'));
  });

  it('handles undefined/null without throwing', () => {
    expect(() => bodyHash(undefined)).not.toThrow();
    expect(bodyHash(undefined)).toBe(bodyHash(null));
  });
});

describe('findPostedDuplicate', () => {
  it('finds a match by same platform + same campaign', () => {
    const posted = [{ platform: 'x', campaign: 'launch-day', body: 'original text', url: 'https://x.com/1' }];
    const dup = findPostedDuplicate({ platform: 'x', campaign: 'launch-day', body: 'different rewording' }, posted);
    expect(dup).toBeDefined();
    expect(dup!.url).toBe('https://x.com/1');
  });

  it('finds a match by identical body when campaigns differ or are absent', () => {
    const posted = [{ platform: 'x', body: 'the exact same text' }];
    expect(findPostedDuplicate({ platform: 'x', body: 'the exact same text' }, posted)).toBeDefined();
  });

  it('does not match across platforms even with the same campaign', () => {
    const posted = [{ platform: 'instagram', campaign: 'launch-day', body: 'ig body' }];
    expect(findPostedDuplicate({ platform: 'x', campaign: 'launch-day', body: 'x body' }, posted)).toBeUndefined();
  });

  it('does not match a genuinely different post (different campaign AND different body)', () => {
    const posted = [{ platform: 'x', campaign: 'launch-day', body: 'original text' }];
    expect(findPostedDuplicate({ platform: 'x', campaign: 'other-day', body: 'unrelated text' }, posted)).toBeUndefined();
  });
});

describe('missingCredsFor', () => {
  it('lists missing X credentials', () => {
    const env = { X_API_KEY: 'k' };
    const missing = missingCredsFor('x', env);
    expect(missing).toContain('X_API_KEY_SECRET');
    expect(missing).toContain('X_ACCESS_TOKEN');
    expect(missing).toContain('X_ACCESS_TOKEN_SECRET');
    expect(missing).not.toContain('X_API_KEY');
  });

  it('is empty when all X credentials are present', () => {
    const env = { X_API_KEY: 'k', X_API_KEY_SECRET: 's', X_ACCESS_TOKEN: 't', X_ACCESS_TOKEN_SECRET: 'ts' };
    expect(missingCredsFor('x', env)).toEqual([]);
  });

  it('lists missing Instagram credentials', () => {
    expect(missingCredsFor('instagram', {})).toEqual(['IG_ACCESS_TOKEN', 'IG_BUSINESS_ACCOUNT_ID']);
  });

  it('is empty (not an error) for an unrecognized platform', () => {
    expect(missingCredsFor('facebook', {})).toEqual([]);
  });
});

describe('needsMediaPreflight', () => {
  it('is true for an Instagram item with media', () => {
    expect(needsMediaPreflight({ platform: 'instagram', media: ['/a.png'] })).toBe(true);
  });

  it('is true for an X item with media', () => {
    expect(needsMediaPreflight({ platform: 'x', media: ['/a.png'] })).toBe(true);
  });

  it('is false for an X item with no media', () => {
    expect(needsMediaPreflight({ platform: 'x', body: 'hi' })).toBe(false);
  });
});

describe('mediaUrlsFor', () => {
  it('joins the base URL with each media path', () => {
    expect(mediaUrlsFor({ media: ['/a.png', '/b.png'] }, 'https://example.com')).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
  });

  it('is an empty array for no media', () => {
    expect(mediaUrlsFor({}, 'https://example.com')).toEqual([]);
  });
});
