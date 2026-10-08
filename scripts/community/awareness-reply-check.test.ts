import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { formatDropped, keepReplyable } from './awareness-reply-check.mjs';

const cand = (id: string, score: number) => ({
  subreddit: 'TaylorSwift',
  score,
  post: { id, permalink: `https://www.reddit.com/r/TaylorSwift/comments/${id}/t/` },
});
const opts = { perSubScanCap: 5, remainingToday: {}, runCap: 6 };
const deps = (fetchThread: unknown) => ({
  fetchThread,
  fetchImpl: undefined,
  sleep: async () => {},
  pacingMs: 0,
});

describe('keepReplyable', () => {
  it('stops checking after a 403 or 429 but leaves every lead delivered as unknown', async () => {
    for (const error of ['HTTP 403', 'HTTP 429']) {
      const fetchThread = vi.fn(async () => ({ state: 'unknown', error }));
      const res = await keepReplyable([cand('a', 3), cand('b', 2)], opts, deps(fetchThread));
      expect(fetchThread).toHaveBeenCalledTimes(1);
      expect(res.kept).toHaveLength(2);
      expect([...res.replyStates.values()]).toEqual(['unknown', 'unknown']);
    }
  });

  it('a 404, bad URL or network error marks only that thread unknown and keeps checking', async () => {
    const answers: Record<string, { state: string; error?: string }> = {
      a: { state: 'unknown', error: 'HTTP 404' },
      b: { state: 'unknown', error: 'bad permalink' },
      c: { state: 'locked' },
      d: { state: 'ok' },
    };
    const fetchThread = vi.fn(async (link: string) => answers[/comments\/(\w+)/.exec(link)![1]!]);
    const res = await keepReplyable(
      [cand('a', 4), cand('b', 3), cand('c', 2), cand('d', 1)],
      opts,
      deps(fetchThread),
    );
    expect(fetchThread).toHaveBeenCalledTimes(4);
    expect(res.dropped).toEqual({ locked: 1 });
    expect(res.kept.map((c: { post: { id: string } }) => c.post.id)).toEqual(['a', 'b', 'd']);
    expect(res.replyStates.get('a')).toBe('unknown');
    expect(res.replyStates.get('d')).toBe('ok');
  });

  it('formats drop counts', () => {
    expect(formatDropped({})).toBe('none');
    expect(formatDropped({ locked: 2, 'no-comment': 1 })).toBe('locked=2 no-comment=1');
  });
});
