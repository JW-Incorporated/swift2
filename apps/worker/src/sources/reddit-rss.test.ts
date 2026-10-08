import { describe, expect, it, vi } from 'vitest';
import { fetchPostComments, fetchSubredditRss, redditRssAdapter } from './reddit-rss';
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

// Captured shape from a real `curl -A "<descriptive UA>"
// .../r/TaylorSwift/comments/<id>/<slug>/.rss?limit=20&sort=top` on
// 2026-08-25 (trimmed to the post entry + two comment entries; the real
// response had 20 comment entries after the post). Confirms: first entry is
// the post itself ("t3_..."), comments follow ("t1_..."), comment bodies
// arrive as escaped HTML wrapped in Reddit's SC_OFF/SC_ON markers.
const REAL_COMMENTS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Taylor Swift Performance - The Icon Sessions at the Grammy Museum. : TaylorSwift</title>
  <entry>
    <author><name>/u/VVantaBuddy</name></author>
    <content type="html">&lt;table&gt;post body table, never used&lt;/table&gt;</content>
    <id>t3_1vxjjby</id>
    <link href="https://www.reddit.com/r/TaylorSwift/comments/1vxjjby/taylor_swift_performance_the_icon_sessions_at_the/" />
    <updated>2026-08-24T23:45:57+00:00</updated>
    <title>Taylor Swift Performance - The Icon Sessions at the Grammy Museum.</title>
  </entry>
  <entry>
    <author><name>/u/thelifeofafangirl</name></author>
    <content type="html">&lt;!-- SC_OFF --&gt;&lt;div class=&quot;md&quot;&gt;&lt;p&gt;WAKE THE FCK UP ITS SURPRISE SONG OCLOCK&lt;/p&gt; &lt;/div&gt;&lt;!-- SC_ON --&gt;</content>
    <id>t1_p5ptlr3</id>
    <link href="https://www.reddit.com/r/TaylorSwift/comments/1vxjjby/taylor_swift_performance_the_icon_sessions_at_the/p5ptlr3/"/>
    <updated>2026-08-25T01:21:40+00:00</updated>
    <title>/u/thelifeofafangirl on Taylor Swift Performance - The Icon Sessions at the Grammy Museum.</title>
  </entry>
  <entry>
    <author><name>/u/VVantaBuddy</name></author>
    <content type="html">&lt;!-- SC_OFF --&gt;&lt;div class=&quot;md&quot;&gt;&lt;p&gt;i miss The Eras Tour piano so much! &lt;/p&gt; &lt;p&gt;the idea of mashing up I Knew It, I Knew You x august x All Too Well is genius. i got chills, literal chills.&lt;/p&gt; &lt;/div&gt;&lt;!-- SC_ON --&gt;</content>
    <id>t1_p5pe6rz</id>
    <link href="https://www.reddit.com/r/TaylorSwift/comments/1vxjjby/taylor_swift_performance_the_icon_sessions_at_the/p5pe6rz/"/>
    <updated>2026-08-24T23:57:52+00:00</updated>
    <title>/u/VVantaBuddy on Taylor Swift Performance - The Icon Sessions at the Grammy Museum.</title>
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

describe('fetchPostComments', () => {
  const POST_URL =
    'https://www.reddit.com/r/TaylorSwift/comments/1vxjjby/taylor_swift_performance_the_icon_sessions_at_the/';

  it('parses a real-shaped comment feed: skips the post entry, returns hashed-author comment bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(REAL_COMMENTS_FEED));
    const comments = await fetchPostComments(POST_URL, 15, fetchImpl);
    expect(comments).toHaveLength(2); // post entry ("t3_...") excluded
    expect(comments[0]!.id).toBe('t1_p5ptlr3');
    expect(comments[0]!.body).toBe('WAKE THE FCK UP ITS SURPRISE SONG OCLOCK');
    expect(comments[0]!.author).not.toBe('/u/thelifeofafangirl');
    expect(comments[0]!.author).toMatch(/^[0-9a-f]{16}$/);
    expect(comments[1]!.body).toContain('mashing up I Knew It, I Knew You x august x All Too Well');
  });

  it('requests the post permalink with .rss?limit=N&sort=top appended', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(REAL_COMMENTS_FEED));
    await fetchPostComments(POST_URL, 10, fetchImpl);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(`${POST_URL}.rss?limit=10&sort=top`);
    expect(init.headers['User-Agent']).toMatch(/Swift2KnowledgeEngine/);
  });

  it('caps the requested and returned count at MAX_COMMENTS_PER_POST even if a caller asks for more', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(REAL_COMMENTS_FEED));
    await fetchPostComments(POST_URL, 500, fetchImpl);
    const [url] = fetchImpl.mock.calls[0]!;
    expect(url).toContain('limit=15'); // MAX_COMMENTS_PER_POST, not the caller's 500
  });

  it('backs off on 429 — returns empty, never retries (best-effort enrichment)', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('rate limited', 429));
    const comments = await fetchPostComments(POST_URL, 15, fetchImpl);
    expect(comments).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('degrades to empty on a non-429 non-2xx rather than throwing — a dead thread must not fail the whole story', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('gone', 404));
    const comments = await fetchPostComments(POST_URL, 15, fetchImpl);
    expect(comments).toEqual([]);
  });

  it('drops a comment with an empty body (e.g. [removed]/[deleted] rendering blank) rather than storing nothing useful', async () => {
    const emptyBodyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><author><name>/u/x</name></author><content type="html"></content><id>t3_abc</id><link href="https://www.reddit.com/r/TaylorSwift/comments/abc/x/" /></entry>
  <entry><author><name>/u/deleted</name></author><content type="html">&lt;!-- SC_OFF --&gt;&lt;div class=&quot;md&quot;&gt;&lt;/div&gt;&lt;!-- SC_ON --&gt;</content><id>t1_empty</id><link href="https://www.reddit.com/r/TaylorSwift/comments/abc/x/empty/" /></entry>
</feed>`;
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(emptyBodyFeed));
    const comments = await fetchPostComments(POST_URL, 15, fetchImpl);
    expect(comments).toEqual([]);
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
