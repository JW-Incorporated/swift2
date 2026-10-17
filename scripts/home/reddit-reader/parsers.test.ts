import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs modules
import { parseThreadJson } from './parsers.mjs';
// @ts-expect-error plain .mjs modules
import { parseDiscoveryFeed, selectTopThreads } from './sources.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(path.join(here, 'fixtures', name), 'utf8');

describe('Reddit public data parsing', () => {
  it('parses score, comment count, age, and top-level plus first replies', () => {
    const parsed = parseThreadJson(JSON.parse(fixture('thread.json')), {
      now: new Date('2026-10-17T14:00:00Z'),
    });
    expect(parsed.post).toMatchObject({
      id: 'abc123',
      subreddit: 'TaylorSwift',
      score: 321,
      numComments: 45,
      ageHours: 2,
      locked: false,
      archived: false,
    });
    expect(parsed.comments).toEqual([
      expect.objectContaining({ author: null, body: 'Top-level thought', score: 12, depth: 0 }),
      expect.objectContaining({ author: null, body: 'First reply', score: 4, depth: 1 }),
    ]);
  });

  it('parses RSS discovery and caps detail candidates at 20', async () => {
    const source = { subreddit: 'TaylorSwift', theory: false };
    const [post] = await parseDiscoveryFeed(fixture('discovery.xml'), source);
    expect(post).toMatchObject({ id: 'abc123', subreddit: 'TaylorSwift', rank: 1 });
    const posts = Array.from({ length: 25 }, (_, index) => ({
      ...post,
      id: `post${index}`,
      rank: index + 1,
    }));
    expect(selectTopThreads(posts, 20)).toHaveLength(20);
    expect(() => selectTopThreads(posts, 21)).toThrow(/1 to 20/);
  });
});
