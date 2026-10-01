import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { createFeedFetcher, MAX_STRIKES } from './awareness-fetch.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildFeeds,
  communityFromPermalink,
  isBlockedSub,
  searchFeedUrl,
  subFeedUrl,
} from './awareness-sources.mjs';

const feed = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><id>t3_a</id><link href="https://www.reddit.com/r/X/comments/a/t/" /><title>T</title><updated>2026-10-01T00:00:00Z</updated></entry></feed>`;
const ok = () => new Response(feed, { status: 200 });

describe('budgeted feed fetcher', () => {
  it('spaces requests with exponential backoff after a 429 and skips (never retries) the blocked source', async () => {
    const sleeps: number[] = [];
    const responses = [new Response('', { status: 429 }), ok(), ok()];
    const fetchImpl = vi.fn(async () => responses.shift() as Response);
    const fetcher = createFeedFetcher({
      budget: 6,
      pacingMs: 1000,
      fetchImpl: fetchImpl as never,
      sleep: async (ms: number) => void sleeps.push(ms),
    });
    expect((await fetcher.get('u1', 'a')).posts).toEqual([]); // 429: skipped, not retried
    expect((await fetcher.get('u2', 'b')).posts).toHaveLength(1);
    await fetcher.get('u3', 'c');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([2000, 1000]); // doubled after the strike, back to base after a success
    expect(fetcher.stats()).toMatchObject({ rateLimited: 1, used: 3 });
  });

  it('never exceeds the per-run request budget', async () => {
    const fetchImpl = vi.fn(async () => ok());
    const fetcher = createFeedFetcher({
      budget: 2,
      pacingMs: 0,
      fetchImpl: fetchImpl as never,
      sleep: async () => {},
    });
    await fetcher.get('1', 'a');
    await fetcher.get('2', 'b');
    expect((await fetcher.get('3', 'c')).skipped).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it(`aborts the run after ${MAX_STRIKES} consecutive failures`, async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 }));
    const fetcher = createFeedFetcher({
      budget: 10,
      pacingMs: 0,
      fetchImpl: fetchImpl as never,
      sleep: async () => {},
    });
    for (let i = 0; i < 6; i += 1) await fetcher.get(String(i), 'x');
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_STRIKES);
    expect(fetcher.stats().aborted).toBe(true);
  });

  it('stops after the first failure when the scan asks for strict skip-on-429 (maxStrikes 1)', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 }));
    const fetcher = createFeedFetcher({
      budget: 2,
      pacingMs: 0,
      maxStrikes: 1,
      fetchImpl: fetchImpl as never,
      sleep: async () => {},
    });
    expect((await fetcher.get('u1', 'a')).posts).toEqual([]);
    expect((await fetcher.get('u2', 'b')).skipped).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetcher.stats()).toMatchObject({ aborted: true, rateLimited: 1, skipped: 1 });
  });

  it('tries the home relay once on a block, with 1-11s pacing, and only when configured', async () => {
    const urls: string[] = [];
    const sleeps: number[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      urls.push(String(url));
      return String(url).startsWith('https://relay.test/')
        ? ok()
        : new Response('', { status: 429 });
    });
    const fetcher = createFeedFetcher({
      budget: 6,
      pacingMs: 0,
      relayUrl: 'https://relay.test/',
      fetchImpl: fetchImpl as never,
      sleep: async (ms: number) => void sleeps.push(ms),
      random: () => 0.5,
    });
    const res = await fetcher.get('https://www.reddit.com/r/X/hot/.rss', 'x');
    expect(res.via).toBe('relay');
    expect(urls).toEqual([
      'https://www.reddit.com/r/X/hot/.rss',
      'https://relay.test/https://www.reddit.com/r/X/hot/.rss',
    ]);
    expect(sleeps.at(-1)).toBeGreaterThanOrEqual(1000);
    expect(sleeps.at(-1)).toBeLessThanOrEqual(12000);
    const noRelay = createFeedFetcher({
      budget: 6,
      pacingMs: 0,
      fetchImpl: (async () => new Response('', { status: 429 })) as never,
      sleep: async () => {},
    });
    expect((await noRelay.get('u', 'x')).via).toBeNull();
  });
});

describe('source selection', () => {
  const config = {
    subs: [...['A', 'B', 'C'].map((name) => ({ name }))],
    search: { queries: ['q1', 'q2'], blockSubs: ['Fauxmoi'] },
    excluded: [{ name: 'SwiftlyNSFW' }],
  };

  it('builds one feed per sub and sort, then one per search query, neighbours being different subs', () => {
    const feeds = buildFeeds(config, 10);
    expect(feeds.map((f: { id: string }) => f.id)).toEqual([
      'sub:A:hot',
      'sub:B:hot',
      'sub:C:hot',
      'sub:A:new',
      'sub:B:new',
      'sub:C:new',
      'search:0',
      'search:1',
    ]);
    expect(feeds[3].url).toBe('https://www.reddit.com/r/A/new/.rss?limit=10');
    expect(feeds[3].source.sub.name).toBe('A');
  });

  it('builds subreddit and Reddit-wide search RSS URLs', () => {
    expect(subFeedUrl('TaylorSwift', 'hot', 25)).toBe(
      'https://www.reddit.com/r/TaylorSwift/hot/.rss?limit=25',
    );
    const url = new URL(searchFeedUrl('"taylor swift"', 25));
    expect(url.pathname).toBe('/search.rss');
    expect(url.searchParams.get('q')).toBe('"taylor swift"');
    expect(url.searchParams.get('sort')).toBe('new');
    expect(url.searchParams.get('t')).toBe('day');
  });

  it('reads the community from a permalink and blocks NSFW, excluded and listed subs', () => {
    expect(communityFromPermalink('https://www.reddit.com/r/Music/comments/abc/x/')).toBe('Music');
    expect(communityFromPermalink('nope')).toBeNull();
    expect(isBlockedSub('SwiftlyNSFW', config)).toBe(true);
    expect(isBlockedSub('fauxmoi', config)).toBe(true);
    expect(isBlockedSub('SomeNsfwSub', config)).toBe(true);
    expect(isBlockedSub('popculturechat', config)).toBe(false);
  });
});
