import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module
import { awarenessRows, buildHomeCrawlBundle, selectAwarenessCandidates } from './writers.mjs';

const now = new Date('2026-10-15T18:00:00.000Z');
const post = {
  id: 'fixture01',
  title: 'A Taylor Swift easter egg theory',
  permalink:
    'https://www.reddit.com/r/TaylorSwiftTheories/comments/fixture01/a_sanitized_theory_thread/',
  subreddit: 'TaylorSwiftTheories',
  score: 321,
  numComments: 27,
  createdAt: '2026-10-15T12:00:00.000Z',
  ageHours: 6,
  rank: 1,
};

const config = {
  defaults: { maxAgeHours: 48, perSubScanCapPerRun: 2 },
  excluded: [],
  search: { blockSubs: [] },
  subs: [{ name: 'TaylorSwiftTheories', tier: 1, imageComments: null }],
};

describe('home Reddit writers', () => {
  it('writes existing engagement_lead fields for score, num_comments, and age', () => {
    const candidates = selectAwarenessCandidates([post], {
      config,
      catalog: { eras: [{ id: 'folklore', name: 'folklore' }], moments: [] },
      now,
    });
    const rows = awarenessRows(candidates, now.toISOString());
    expect(rows[0]).toMatchObject({
      thread_id: 'fixture01',
      score: 321,
      num_comments: 27,
      thread_created_at: '2026-10-15T12:00:00.000Z',
      last_scored_at: now.toISOString(),
    });
    expect(rows[0].context).toContain('about 6h old');
  });

  it('builds the existing crawl shape with a comment tree and no usernames', () => {
    const bundle = buildHomeCrawlBundle(
      [
        {
          post,
          body: 'Transient and deliberately absent from the bundle.',
          comments: [
            { author: null, body: 'Sanitized root.', score: 4, depth: 0, publishedAt: null },
            { author: null, body: 'Sanitized reply.', score: 2, depth: 1, publishedAt: null },
          ],
        },
      ],
      now.toISOString(),
    );
    const stored = bundle.subreddits[0].posts[0];
    expect(stored).not.toHaveProperty('body');
    expect(stored.comments.map((comment: { depth: number }) => comment.depth)).toEqual([0, 1]);
    expect(stored.comments.every((comment: { author: null }) => comment.author === null)).toBe(
      true,
    );
  });
});
