import { describe, expect, it, vi } from 'vitest';
import { fetchSubredditRss, redditRssAdapter } from './reddit-rss';
import type { NewsSourceRow } from './types';

// Captured shape from a real `curl -A "<descriptive UA>" .../r/TaylorSwift/new/.rss`
// on 2026-08-24 (trimmed to one entry) — Reddit serves Atom, not RSS 2.0.
const REAL_ATOM_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>newest submissions : TaylorSwift</title>
  <entry>
    <author><name>/u/Actual-Possible1794</name></author>
    <id>t3_1vwslqu</id>
    <link href="https://www.reddit.com/r/TaylorSwift/comments/1vwslqu/thoughts_on_starlight/" />
    <title>Thoughts on Starlight by Taylor Swift</title>
    <content type="html">&lt;div&gt;full self-post body that must never be stored&lt;/div&gt;</content>
    <updated>2026-08-24T04:23:26+00:00</updated>
  </entry>
</feed>`;

function textResponse(body: string, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, text: async () => body } as unknown as Response;
}

describe('fetchSubredditRss', () => {
  it('parses a real-shaped Atom feed: title/permalink/hashed author, no body text', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(REAL_ATOM_FEED));
    const items = await fetchSubredditRss('TaylorSwift', 'new', fetchImpl);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.title).toBe('Thoughts on Starlight by Taylor Swift');
    expect(item.url).toBe('https://www.reddit.com/r/TaylorSwift/comments/1vwslqu/thoughts_on_starlight/');
    expect(item.author).not.toBe('/u/Actual-Possible1794');
    expect(item.author).toMatch(/^[0-9a-f]{16}$/);
    expect(item.snippet).toBe(''); // never the self-post body
    expect(item.snippet).not.toContain('full self-post body');
  });

  it('sends a descriptive User-Agent — a default UA gets a real 403 from Reddit', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(REAL_ATOM_FEED));
    await fetchSubredditRss('TaylorSwift', 'new', fetchImpl);
    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init.headers['User-Agent']).toMatch(/Swift2KnowledgeEngine/);
  });

  it('builds the top/day feed url when sort is top-day', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('<feed xmlns="http://www.w3.org/2005/Atom"></feed>'));
    await fetchSubredditRss('SwiftlyNeutral', 'top-day', fetchImpl);
    const [url] = fetchImpl.mock.calls[0]!;
    expect(url).toContain('/r/SwiftlyNeutral/top/.rss?t=day');
  });

  it('backs off on 429 — returns empty, never retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('rate limited', 429));
    const items = await fetchSubredditRss('TaylorSwift', 'new', fetchImpl);
    expect(items).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no retry-storm
  });

  it('throws on a non-429 non-2xx so run-cycle can log+isolate it', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('gone', 404));
    await expect(fetchSubredditRss('NotARealSub', 'new', fetchImpl)).rejects.toThrow(/404/);
  });
});

describe('redditRssAdapter', () => {
  it('is disabled in one place via REDDIT_RSS_ENABLED=false, without touching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.stubEnv('REDDIT_RSS_ENABLED', 'false');
    const source: NewsSourceRow = {
      id: '1',
      name: 'r/TaylorSwift',
      sourceType: 'reddit_rss',
      config: { subreddit: 'TaylorSwift' },
    };
    const items = await redditRssAdapter.fetch(source);
    expect(items).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    fetchSpy.mockRestore();
  });

  it('throws a descriptive error when config.subreddit is missing', async () => {
    vi.stubEnv('REDDIT_RSS_ENABLED', 'true');
    const source: NewsSourceRow = { id: '1', name: 'Reddit', sourceType: 'reddit_rss', config: {} };
    await expect(redditRssAdapter.fetch(source)).rejects.toThrow(/config\.subreddit/);
    vi.unstubAllEnvs();
  });
});
