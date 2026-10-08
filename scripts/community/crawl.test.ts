import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  isEnabled,
  heatTierCount,
  hashAuthor,
  probeHomeRelay,
  fetchFullTree,
  crawlSubreddit,
  fetchCrawlWatchlist,
  YEAR_LIMIT,
} from './crawl.mjs';

describe('isEnabled', () => {
  it('is false when unset, "false", or "0"', () => {
    expect(isEnabled(undefined)).toBe(false);
    expect(isEnabled('')).toBe(false);
    expect(isEnabled('false')).toBe(false);
    expect(isEnabled('0')).toBe(false);
  });

  it('is true for "true" or any other truthy string', () => {
    expect(isEnabled('true')).toBe(true);
    expect(isEnabled('yes')).toBe(true);
  });
});

describe('heatTierCount', () => {
  it('is the top 20%, rounded up', () => {
    expect(heatTierCount(100)).toBe(20);
    expect(heatTierCount(25)).toBe(5);
    expect(heatTierCount(1)).toBe(1);
    expect(heatTierCount(0)).toBe(0);
  });
});

describe('hashAuthor', () => {
  it('never returns the raw handle', () => {
    const hashed = hashAuthor('some_reddit_user');
    expect(hashed).not.toBe('some_reddit_user');
    expect(hashed).not.toContain('some_reddit_user');
  });

  it('is deterministic for the same input', () => {
    expect(hashAuthor('same_user')).toBe(hashAuthor('same_user'));
  });

  it('is null for a missing author (deleted/redacted)', () => {
    expect(hashAuthor(null)).toBeNull();
    expect(hashAuthor(undefined)).toBeNull();
  });
});

describe('probeHomeRelay', () => {
  it('is false when no relay URL is configured (no secret provisioned yet)', async () => {
    expect(await probeHomeRelay('')).toBe(false);
    expect(await probeHomeRelay(undefined)).toBe(false);
  });

  it('is true when the relay answers with a non-5xx status', async () => {
    const fetchImpl = vi.fn(async () => new Response('ok', { status: 200 }));
    expect(await probeHomeRelay('http://relay:8888', { fetchImpl })).toBe(true);
  });

  it('is false when the relay 5xxs or throws', async () => {
    const fetchImpl500 = vi.fn(async () => new Response('err', { status: 502 }));
    expect(await probeHomeRelay('http://relay:8888', { fetchImpl: fetchImpl500 })).toBe(false);

    const fetchImplThrow = vi.fn(async () => {
      throw new Error('connection refused');
    });
    expect(await probeHomeRelay('http://relay:8888', { fetchImpl: fetchImplThrow })).toBe(false);
  });
});

describe('fetchFullTree', () => {
  it('always sleeps a randomized 1-11s before the request (mandatory pacing rule)', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html></html>', { status: 200 }));
    let capturedDelay = -1;
    const sleepImpl = async (ms: number) => {
      capturedDelay = ms;
    };
    const random = () => 0.5; // mid-range -> deterministic pacing value

    await fetchFullTree('http://relay:8888', 'TaylorSwift', 'abc123', {
      fetchImpl,
      sleepImpl,
      random,
    });

    expect(capturedDelay).toBeGreaterThanOrEqual(1_000);
    expect(capturedDelay).toBeLessThanOrEqual(11_000);
  });

  it('degrades to zero comments on 429 without retrying', async () => {
    const fetchImpl = vi.fn(async () => new Response('rate limited', { status: 429 }));
    const result = await fetchFullTree('http://relay:8888', 'TaylorSwift', 'abc123', {
      fetchImpl,
      sleepImpl: async () => {},
      random: () => 0,
    });
    expect(result).toEqual({ comments: [], status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(1); // never retried in-run
  });

  it('degrades to zero comments on 403 without retrying', async () => {
    const fetchImpl = vi.fn(async () => new Response('forbidden', { status: 403 }));
    const result = await fetchFullTree('http://relay:8888', 'TaylorSwift', 'abc123', {
      fetchImpl,
      sleepImpl: async () => {},
      random: () => 0,
    });
    expect(result).toEqual({ comments: [], status: 403 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('degrades to zero comments on a network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const result = await fetchFullTree('http://relay:8888', 'TaylorSwift', 'abc123', {
      fetchImpl,
      sleepImpl: async () => {},
      random: () => 0,
    });
    expect(result).toEqual({ comments: [], status: null });
  });

  it('parses a real shreddit comment tree on success', async () => {
    const html =
      '<shreddit-comment author="alice" score="12" depth="0"><div class="rtjson-content"><div>Hello there</div></div></shreddit-comment>';
    const fetchImpl = vi.fn(async () => new Response(html, { status: 200 }));
    const result = await fetchFullTree('http://relay:8888', 'TaylorSwift', 'abc123', {
      fetchImpl,
      sleepImpl: async () => {},
      random: () => 0,
    });
    expect(result.status).toBe(200);
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]).toMatchObject({
      author: 'alice',
      score: '12',
      depth: 0,
      body: 'Hello there',
    });
  });
});

function atomFeed(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join('')}</feed>`;
}

function postEntry(id: string, rank: number) {
  return `<entry>
    <id>t3_${id}</id>
    <link href="https://www.reddit.com/r/TaylorSwift/comments/${id}/some_post/" />
    <title>Post ${id}</title>
    <updated>2026-01-0${rank}T00:00:00.000Z</updated>
  </entry>`;
}

describe('crawlSubreddit', () => {
  it('marks every post depth=partial when the relay is unreachable', async () => {
    const postFeed = atomFeed([postEntry('p1', 1), postEntry('p2', 2)]);
    const commentFeed = atomFeed([]); // no comments needed for this assertion
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('/comments/')) return new Response(commentFeed, { status: 200 });
      return new Response(postFeed, { status: 200 });
    });

    const result = await crawlSubreddit(
      { id: 'reddit:TaylorSwift', name: 'TaylorSwift' },
      { relayReachable: false, relayUrl: '', budgetRemaining: 10, fetchImpl },
    );

    expect(result.posts).toHaveLength(2);
    expect(result.posts.every((p: { depth: string }) => p.depth === 'partial')).toBe(true);
    expect(result.relayUsed).toBe(0);
  });

  it('uses the relay only for the heat tier and stops at the budget', async () => {
    // 5 posts -> heat tier = ceil(5*0.2) = 1 (only rank 1 is "hot")
    const entries = [1, 2, 3, 4, 5].map((n) => postEntry(`p${n}`, n));
    const postFeed = atomFeed(entries);
    const relayHtml =
      '<shreddit-comment author="bob" score="5" depth="0"><div class="rtjson-content"><div>Full tree comment</div></div></shreddit-comment>';

    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('svc/shreddit')) return new Response(relayHtml, { status: 200 });
      if (String(url).includes('/comments/')) return new Response(atomFeed([]), { status: 200 });
      return new Response(postFeed, { status: 200 });
    });

    const result = await crawlSubreddit(
      { id: 'reddit:TaylorSwift', name: 'TaylorSwift' },
      {
        relayReachable: true,
        relayUrl: 'http://relay:8888',
        budgetRemaining: 10,
        fetchImpl,
        sleepImpl: async () => {},
        random: () => 0,
      },
    );

    expect(result.relayUsed).toBe(1); // only the single heat-tier post used the relay
    const heatPost = result.posts.find((p: { rank: number }) => p.rank === 1);
    expect(heatPost.depth).toBe('full');
    const otherPost = result.posts.find((p: { rank: number }) => p.rank === 2);
    expect(otherPost.depth).toBe('partial');
  });

  it('hashes every comment author, never storing the raw handle', async () => {
    const postFeed = atomFeed([postEntry('p1', 1)]);
    const relayHtml =
      '<shreddit-comment author="realname123" score="1" depth="0"><div class="rtjson-content"><div>hi</div></div></shreddit-comment>';
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('svc/shreddit')) return new Response(relayHtml, { status: 200 });
      return new Response(postFeed, { status: 200 });
    });

    const result = await crawlSubreddit(
      { id: 'reddit:TaylorSwift', name: 'TaylorSwift' },
      {
        relayReachable: true,
        relayUrl: 'http://relay:8888',
        budgetRemaining: 10,
        fetchImpl,
        sleepImpl: async () => {},
        random: () => 0,
      },
    );

    const comment = result.posts[0].comments[0];
    expect(comment.author).not.toBe('realname123');
    expect(comment.author).toMatch(/^[0-9a-f]{16}$/);
  });

  it('never exceeds the caller-provided relay budget across posts', async () => {
    const entries = [1, 2, 3, 4, 5].map((n) => postEntry(`p${n}`, n));
    // Force ALL 5 posts into the heat tier by using a tiny total (heatTierCount
    // would normally be 1 of 5) — instead assert the budget=0 short-circuit.
    const postFeed = atomFeed(entries);
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('svc/shreddit'))
        throw new Error('relay should not be called when budget is 0');
      if (String(url).includes('/comments/')) return new Response(atomFeed([]), { status: 200 });
      return new Response(postFeed, { status: 200 });
    });

    const result = await crawlSubreddit(
      { id: 'reddit:TaylorSwift', name: 'TaylorSwift' },
      { relayReachable: true, relayUrl: 'http://relay:8888', budgetRemaining: 0, fetchImpl },
    );

    expect(result.relayUsed).toBe(0);
  });
});

describe('fetchCrawlWatchlist', () => {
  it('queries only crawl=true reddit rows', async () => {
    const rows = [{ id: 'reddit:TaylorSwift', name: 'TaylorSwift' }];
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows };
    };
    const result = await fetchCrawlWatchlist({ query } as unknown as { query: typeof query });
    expect(result).toEqual(rows);
    expect(capturedSql).toMatch(/crawl = true/);
    expect(capturedSql).toMatch(/platform = 'reddit'/);
  });
});

describe('YEAR_LIMIT', () => {
  it("is RSS's real documented ceiling, not an arbitrary number", () => {
    expect(YEAR_LIMIT).toBe(100);
  });
});
