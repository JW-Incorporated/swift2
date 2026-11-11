import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs modules
import { parseThreadJson } from './parsers.mjs';
// @ts-expect-error plain .mjs modules
import { awarenessRows, buildHomeCrawlBundle } from './writers.mjs';
// @ts-expect-error plain .mjs modules
import { acceptHomeBundle } from '../../community/crawl-bundle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

describe('home Reddit crawl bundle', () => {
  it('keeps metrics and a privacy-safe depth-bearing comment tree', () => {
    const payload = JSON.parse(readFileSync(path.join(here, 'fixtures', 'thread.json'), 'utf8'));
    const parsed = parseThreadJson(payload, { now: new Date('2026-10-17T14:00:00Z') });
    parsed.post.rank = 1;
    const bundle = acceptHomeBundle(buildHomeCrawlBundle([parsed], '2026-10-17T14:00:00.000Z'));
    const post = bundle.subreddits[0].posts[0];
    expect(post).toMatchObject({ score: 321, numComments: 45, ageHours: 2, depth: 'partial' });
    expect(post.comments.map((comment: { depth: number }) => comment.depth)).toEqual([0, 1]);
    expect(post.comments.every((comment: { author: null }) => comment.author === null)).toBe(true);
  });

  it('puts score, comment count, and creation time on engagement leads', () => {
    const [row] = awarenessRows(
      [
        {
          subreddit: 'TaylorSwift',
          post: {
            id: 'abc123',
            title: 'Favorite era?',
            permalink: 'https://www.reddit.com/r/TaylorSwift/comments/abc123/favorite_era/',
            rank: 1,
            score: 321,
            numComments: 45,
            createdAt: '2026-10-17T12:00:00.000Z',
          },
          types: ['ranking'],
          ageHours: 2,
          imageRef: 'era:tloas',
          imageComments: 'unknown',
        },
      ],
      '2026-10-17T14:00:00.000Z',
    );
    expect(row).toMatchObject({
      score: 321,
      num_comments: 45,
      thread_created_at: '2026-10-17T12:00:00.000Z',
      last_scored_at: '2026-10-17T14:00:00.000Z',
    });
  });
});
