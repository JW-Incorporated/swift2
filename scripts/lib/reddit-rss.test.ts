import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { fetchSubredditPosts } from './reddit-rss.mjs';

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function atomFeed(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join('')}</feed>`;
}

function linkPostEntry({ id, title, permalink, createdAt, outboundUrl }: { id: string; title: string; permalink: string; createdAt: string; outboundUrl: string }) {
  return `<entry>
    <id>t3_${id}</id>
    <link href="${permalink}" />
    <title>${escapeXml(title)}</title>
    <updated>${createdAt}</updated>
    <content type="html">${escapeXml(`<span><a href="${outboundUrl}">[link]</a></span>`)}</content>
  </entry>`;
}

describe('reddit-rss', () => {
  it('parses link posts, using the embedded outbound URL rather than the permalink', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([
      linkPostEntry({ id: 'abc123', title: 'A shop find', permalink: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/abc123/a_shop_find/', createdAt: '2026-08-30T00:00:00.000Z', outboundUrl: 'https://www.etsy.com/listing/7' }),
    ]), { status: 200 }));

    const { posts, status } = await fetchSubredditPosts('TaylorSwiftMerch', { sort: 'top', time: 'week', fetchImpl });

    expect(status).toBe(200);
    expect(posts).toEqual([{
      id: 'abc123',
      title: 'A shop find',
      permalink: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/abc123/a_shop_find/',
      url: 'https://www.etsy.com/listing/7',
      createdAt: '2026-08-30T00:00:00.000Z',
      rank: 1,
    }]);
  });

  it('falls back to the permalink as the outbound URL for self-text posts (Reddit\'s own [link] tag points at the post itself)', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([
      linkPostEntry({ id: 'selftext1', title: 'Signed evermore price?', permalink: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/selftext1/signed_evermore_price/', createdAt: '2026-08-30T00:00:00.000Z', outboundUrl: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/selftext1/signed_evermore_price/' }),
    ]), { status: 200 }));

    const { posts } = await fetchSubredditPosts('TaylorSwiftMerch', { fetchImpl });

    expect(posts).toEqual([expect.objectContaining({
      id: 'selftext1',
      url: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/selftext1/signed_evermore_price/',
    })]);
  });

  it('falls back to the permalink when the [link] span is missing from content entirely', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([`<entry>
      <id>t3_nolink1</id>
      <link href="https://www.reddit.com/r/TaylorSwiftMerch/comments/nolink1/no_link_here/" />
      <title>No link span at all</title>
      <updated>2026-08-30T00:00:00.000Z</updated>
      <content type="html">${escapeXml('<div class="md"><p>just text, no [link] span</p></div>')}</content>
    </entry>`]), { status: 200 }));

    const { posts } = await fetchSubredditPosts('TaylorSwiftMerch', { fetchImpl });

    expect(posts).toEqual([expect.objectContaining({
      id: 'nolink1',
      url: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/nolink1/no_link_here/',
    })]);
  });

  it('records 1-based feed position as rank across multiple posts', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([
      linkPostEntry({ id: 'first', title: 'First', permalink: 'https://www.reddit.com/r/x/comments/first/', createdAt: '2026-08-30T00:00:00.000Z', outboundUrl: 'https://www.etsy.com/listing/1' }),
      linkPostEntry({ id: 'second', title: 'Second', permalink: 'https://www.reddit.com/r/x/comments/second/', createdAt: '2026-08-30T00:00:01.000Z', outboundUrl: 'https://www.etsy.com/listing/2' }),
    ]), { status: 200 }));

    const { posts } = await fetchSubredditPosts('x', { fetchImpl });

    expect(posts.map((post: { id: string; rank: number }) => [post.id, post.rank])).toEqual([['first', 1], ['second', 2]]);
  });

  it('drops entries whose atom id is not a t3_ post id (defends against malformed/unexpected feed content)', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([`<entry>
      <id>t1_commentnotpost</id>
      <link href="https://www.reddit.com/r/x/comments/foo/" />
      <title>A comment, not a post</title>
      <updated>2026-08-30T00:00:00.000Z</updated>
      <content type="html">comment body</content>
    </entry>`]), { status: 200 }));

    const { posts } = await fetchSubredditPosts('x', { fetchImpl });

    expect(posts).toEqual([]);
  });

  it('backs off on 429 without retrying and returns zero posts', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 }));

    const { posts, status } = await fetchSubredditPosts('x', { fetchImpl });

    expect(status).toBe(429);
    expect(posts).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws with the HTTP status attached for a non-429 failure (e.g. 403) so callers can count/log it', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 }));

    await expect(fetchSubredditPosts('x', { fetchImpl })).rejects.toMatchObject({ status: 403 });
  });

  it('builds the feed URL with sort/time/limit and a descriptive User-Agent', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([]), { status: 200 }));

    await fetchSubredditPosts('TaylorSwiftMerch', { sort: 'top', time: 'week', limit: 50, fetchImpl });

    const [url, options] = fetchImpl.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(String(url)).toBe('https://www.reddit.com/r/TaylorSwiftMerch/top/.rss?limit=50&t=week');
    expect(options.headers['User-Agent']).toMatch(/Swift2FanmadeDiscovery/);
  });
});
