import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  selectInstagramPostsForMetrics,
  postMetricsLocation,
  buildPostMetricRecord,
  readPostMetrics,
  aggregateEngagement,
  buildEngagementSummary,
  renderEngagement,
} from './post-metrics.mjs';

const NOW = '2026-09-12T00:00:00Z';

function igItem(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'instagram',
    platformPostId: '18123851338802013',
    campaign: 'thread:lensId:angle',
    postedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('selectInstagramPostsForMetrics', () => {
  it('selects an Instagram post inside the 30-day window with a platformPostId', () => {
    expect(selectInstagramPostsForMetrics([igItem()], { now: NOW })).toHaveLength(1);
  });

  it('excludes X posts (metered spend, not built here)', () => {
    const item = igItem({ platform: 'x', platformPostId: '2080072891907887425' });
    expect(selectInstagramPostsForMetrics([item], { now: NOW })).toHaveLength(0);
  });

  it('excludes an Instagram post with no recorded platformPostId (legacy posted/ items)', () => {
    const item = igItem({ platformPostId: undefined });
    expect(selectInstagramPostsForMetrics([item], { now: NOW })).toHaveLength(0);
  });

  it('excludes a post older than the window', () => {
    const item = igItem({ postedAt: '2026-07-01T00:00:00Z' });
    expect(selectInstagramPostsForMetrics([item], { now: NOW })).toHaveLength(0);
  });

  it('excludes a post dated after now (clock skew, not a real posted item yet)', () => {
    const item = igItem({ postedAt: '2026-09-13T00:00:00Z' });
    expect(selectInstagramPostsForMetrics([item], { now: NOW })).toHaveLength(0);
  });

  it('respects a custom windowDays', () => {
    const item = igItem({ postedAt: '2026-08-20T00:00:00Z' }); // 23 days back from NOW
    expect(selectInstagramPostsForMetrics([item], { now: NOW, windowDays: 30 })).toHaveLength(1);
    expect(selectInstagramPostsForMetrics([item], { now: NOW, windowDays: 7 })).toHaveLength(0);
  });

  it('returns [] for an empty/undefined input list', () => {
    expect(selectInstagramPostsForMetrics([], { now: NOW })).toEqual([]);
    expect(selectInstagramPostsForMetrics(undefined, { now: NOW })).toEqual([]);
  });
});

describe('postMetricsLocation', () => {
  it('derives yearMonth from postedAt (not today) and postId from platformPostId', () => {
    const item = igItem({ postedAt: '2026-07-21T14:34:24.120Z', platformPostId: '18123851338802013' });
    expect(postMetricsLocation(item)).toEqual({ yearMonth: '2026-07', postId: '18123851338802013' });
  });
});

describe('buildPostMetricRecord', () => {
  it('carries campaign/platform/postedAt alongside the fetched counts', () => {
    const item = igItem({ campaign: 'thread:fashion:interactive-challenge' });
    const record = buildPostMetricRecord(item, { like_count: 12, comments_count: 3, fetchedAt: NOW });
    expect(record).toEqual({
      postId: '18123851338802013',
      platform: 'instagram',
      campaign: 'thread:fashion:interactive-challenge',
      postedAt: '2026-09-01T00:00:00Z',
      like_count: 12,
      comments_count: 3,
      fetchedAt: NOW,
    });
  });

  it('nulls out a missing campaign and missing counts rather than writing undefined', () => {
    const item = igItem({ campaign: undefined });
    const record = buildPostMetricRecord(item, { like_count: undefined, comments_count: undefined, fetchedAt: NOW });
    expect(record.campaign).toBeNull();
    expect(record.like_count).toBeNull();
    expect(record.comments_count).toBeNull();
  });
});

describe('readPostMetrics', () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('returns [] when the posts directory does not exist yet', () => {
    expect(readPostMetrics(path.join(tmpdir(), 'nonexistent-posts-metrics-dir'))).toEqual([]);
  });

  it('reads every YYYY-MM/postId.json record across month directories', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'post-metrics-'));
    mkdirSync(path.join(dir, '2026-07'));
    mkdirSync(path.join(dir, '2026-08'));
    writeFileSync(path.join(dir, '2026-07', '111.json'), JSON.stringify({ postId: '111', like_count: 1, comments_count: 0 }));
    writeFileSync(path.join(dir, '2026-08', '222.json'), JSON.stringify({ postId: '222', like_count: 2, comments_count: 1 }));
    const records = readPostMetrics(dir);
    expect(records.map((r: { postId: string }) => r.postId).sort()).toEqual(['111', '222']);
  });

  it('skips a malformed file rather than throwing', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'post-metrics-'));
    mkdirSync(path.join(dir, '2026-07'));
    writeFileSync(path.join(dir, '2026-07', 'broken.json'), '{ not json');
    writeFileSync(path.join(dir, '2026-07', 'ok.json'), JSON.stringify({ postId: 'ok' }));
    expect(readPostMetrics(dir)).toEqual([{ postId: 'ok' }]);
  });
});

describe('aggregateEngagement', () => {
  it('sums like_count/comments_count per campaign and per pillar (pillarOf, not reimplemented)', () => {
    const records = [
      { campaign: 'thread:lensId:angle-a', like_count: 10, comments_count: 2 },
      { campaign: 'thread:lensId:angle-b', like_count: 5, comments_count: 1 },
      { campaign: 'mood:carousel', like_count: 3, comments_count: 0 },
    ];
    const { byCampaign, byPillar, totalPosts } = aggregateEngagement(records);
    expect(totalPosts).toBe(3);
    expect(byCampaign['thread:lensId:angle-a']).toEqual({ posts: 1, like_count: 10, comments_count: 2 });
    expect(byCampaign['thread:lensId:angle-b']).toEqual({ posts: 1, like_count: 5, comments_count: 1 });
    // thread:'s arity is 3 (thread:<lensId>:<angle>) — a well-formed 3-segment
    // campaign is its own pillar, distinct from a same-lens different-angle one.
    expect(byPillar['thread:lensId:angle-a']).toEqual({ posts: 1, like_count: 10, comments_count: 2 });
    expect(byPillar['thread:lensId:angle-b']).toEqual({ posts: 1, like_count: 5, comments_count: 1 });
    expect(byPillar['mood:carousel']).toEqual({ posts: 1, like_count: 3, comments_count: 0 });
  });

  it('collapses a dated/variant campaign beyond the arity into its pillar family', () => {
    const records = [
      { campaign: 'thread:lensId:angle:2026-09-01', like_count: 10, comments_count: 2 },
      { campaign: 'thread:lensId:angle:2026-09-08', like_count: 5, comments_count: 1 },
    ];
    const { byPillar } = aggregateEngagement(records);
    expect(byPillar['thread:lensId:angle']).toEqual({ posts: 2, like_count: 15, comments_count: 3 });
  });

  it('buckets a campaign pillarOf does not recognize under (unrecognized), not dropped', () => {
    const records = [{ campaign: 'era-deep-cut-folklore-surprise', like_count: 4, comments_count: 1 }];
    const { byPillar, byCampaign } = aggregateEngagement(records);
    expect(byPillar['(unrecognized)']).toEqual({ posts: 1, like_count: 4, comments_count: 1 });
    expect(byCampaign['era-deep-cut-folklore-surprise']).toEqual({ posts: 1, like_count: 4, comments_count: 1 });
  });

  it('buckets a missing campaign under (none) for byCampaign and (unrecognized) for byPillar', () => {
    const records = [{ campaign: null, like_count: 1, comments_count: 1 }];
    const { byCampaign, byPillar } = aggregateEngagement(records);
    expect(byCampaign['(none)']).toEqual({ posts: 1, like_count: 1, comments_count: 1 });
    expect(byPillar['(unrecognized)']).toEqual({ posts: 1, like_count: 1, comments_count: 1 });
  });

  it('treats a missing like_count/comments_count as 0, not NaN', () => {
    const records = [{ campaign: 'mood:x' }, { campaign: 'mood:x', like_count: 2, comments_count: 1 }];
    const { byPillar } = aggregateEngagement(records);
    expect(byPillar['mood:x']).toEqual({ posts: 2, like_count: 2, comments_count: 1 });
  });

  it('returns empty buckets and totalPosts 0 for no records', () => {
    expect(aggregateEngagement([])).toEqual({ totalPosts: 0, byCampaign: {}, byPillar: {} });
    expect(aggregateEngagement(undefined)).toEqual({ totalPosts: 0, byCampaign: {}, byPillar: {} });
  });

  it('treats a campaign literally named __proto__/constructor as a plain bucket key, never the object prototype', () => {
    const records = [
      { campaign: '__proto__', like_count: 1, comments_count: 1 },
      { campaign: 'constructor', like_count: 2, comments_count: 2 },
    ];
    const { byCampaign, byPillar } = aggregateEngagement(records);
    expect(byCampaign['__proto__']).toEqual({ posts: 1, like_count: 1, comments_count: 1 });
    expect(byCampaign['constructor']).toEqual({ posts: 1, like_count: 2, comments_count: 2 });
    expect(Object.getPrototypeOf(byCampaign)).toBeNull();
    expect(typeof byCampaign.hasOwnProperty).not.toBe('function');
    // byPillar gets the same null-prototype fix, even though pillarOf's own
    // arity logic never lets a bucket key collapse to a bare "__proto__" —
    // it always keeps the family prefix (e.g. "mood:__proto__").
    expect(Object.getPrototypeOf(byPillar)).toBeNull();
  });
});

describe('buildEngagementSummary', () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('reads a posts directory straight into an aggregated summary', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'post-metrics-'));
    mkdirSync(path.join(dir, '2026-09'));
    writeFileSync(path.join(dir, '2026-09', '111.json'), JSON.stringify({ campaign: 'launch:feature-x', like_count: 7, comments_count: 2 }));
    expect(buildEngagementSummary(dir)).toEqual({
      totalPosts: 1,
      byCampaign: { 'launch:feature-x': { posts: 1, like_count: 7, comments_count: 2 } },
      byPillar: { 'launch:feature-x': { posts: 1, like_count: 7, comments_count: 2 } },
    });
  });
});

describe('renderEngagement', () => {
  it('renders the honest empty sentence for an undefined/empty summary', () => {
    expect(renderEngagement(undefined)).toBe('**Engagement by pillar (30d):** no Instagram post metrics on file yet for this window');
    expect(renderEngagement({ byPillar: {} })).toBe('**Engagement by pillar (30d):** no Instagram post metrics on file yet for this window');
  });

  it('renders pillars sorted by like_count descending', () => {
    const summary = {
      byPillar: {
        'mood:x': { posts: 1, like_count: 3, comments_count: 1 },
        'thread:y': { posts: 2, like_count: 15, comments_count: 4 },
      },
    };
    const out = renderEngagement(summary);
    expect(out).toBe('**Engagement by pillar (30d):** thread:y — 15 likes/4 comments (2 posts) · mood:x — 3 likes/1 comments (1 post)');
  });

  it('pluralizes post correctly for a single post', () => {
    const summary = { byPillar: { 'mood:x': { posts: 1, like_count: 3, comments_count: 1 } } };
    expect(renderEngagement(summary)).toContain('(1 post)');
  });
});
