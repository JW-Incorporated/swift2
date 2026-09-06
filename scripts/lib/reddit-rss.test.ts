import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  fetchSubredditPosts,
  topPosts,
  postComments,
  parseRedditEmail,
  parseShredditComments,
} from './reddit-rss.mjs';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function atomFeed(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join('')}</feed>`;
}

function linkPostEntry({
  id,
  title,
  permalink,
  createdAt,
  outboundUrl,
}: {
  id: string;
  title: string;
  permalink: string;
  createdAt: string;
  outboundUrl: string;
}) {
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
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            linkPostEntry({
              id: 'abc123',
              title: 'A shop find',
              permalink: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/abc123/a_shop_find/',
              createdAt: '2026-08-30T00:00:00.000Z',
              outboundUrl: 'https://www.etsy.com/listing/7',
            }),
          ]),
          { status: 200 },
        ),
    );

    const { posts, status } = await fetchSubredditPosts('TaylorSwiftMerch', {
      sort: 'top',
      time: 'week',
      fetchImpl,
    });

    expect(status).toBe(200);
    expect(posts).toEqual([
      {
        id: 'abc123',
        title: 'A shop find',
        permalink: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/abc123/a_shop_find/',
        url: 'https://www.etsy.com/listing/7',
        createdAt: '2026-08-30T00:00:00.000Z',
        rank: 1,
      },
    ]);
  });

  it("falls back to the permalink as the outbound URL for self-text posts (Reddit's own [link] tag points at the post itself)", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            linkPostEntry({
              id: 'selftext1',
              title: 'Signed evermore price?',
              permalink:
                'https://www.reddit.com/r/TaylorSwiftMerch/comments/selftext1/signed_evermore_price/',
              createdAt: '2026-08-30T00:00:00.000Z',
              outboundUrl:
                'https://www.reddit.com/r/TaylorSwiftMerch/comments/selftext1/signed_evermore_price/',
            }),
          ]),
          { status: 200 },
        ),
    );

    const { posts } = await fetchSubredditPosts('TaylorSwiftMerch', { fetchImpl });

    expect(posts).toEqual([
      expect.objectContaining({
        id: 'selftext1',
        url: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/selftext1/signed_evermore_price/',
      }),
    ]);
  });

  it('falls back to the permalink when the [link] span is missing from content entirely', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            `<entry>
      <id>t3_nolink1</id>
      <link href="https://www.reddit.com/r/TaylorSwiftMerch/comments/nolink1/no_link_here/" />
      <title>No link span at all</title>
      <updated>2026-08-30T00:00:00.000Z</updated>
      <content type="html">${escapeXml('<div class="md"><p>just text, no [link] span</p></div>')}</content>
    </entry>`,
          ]),
          { status: 200 },
        ),
    );

    const { posts } = await fetchSubredditPosts('TaylorSwiftMerch', { fetchImpl });

    expect(posts).toEqual([
      expect.objectContaining({
        id: 'nolink1',
        url: 'https://www.reddit.com/r/TaylorSwiftMerch/comments/nolink1/no_link_here/',
      }),
    ]);
  });

  it('records 1-based feed position as rank across multiple posts', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            linkPostEntry({
              id: 'first',
              title: 'First',
              permalink: 'https://www.reddit.com/r/x/comments/first/',
              createdAt: '2026-08-30T00:00:00.000Z',
              outboundUrl: 'https://www.etsy.com/listing/1',
            }),
            linkPostEntry({
              id: 'second',
              title: 'Second',
              permalink: 'https://www.reddit.com/r/x/comments/second/',
              createdAt: '2026-08-30T00:00:01.000Z',
              outboundUrl: 'https://www.etsy.com/listing/2',
            }),
          ]),
          { status: 200 },
        ),
    );

    const { posts } = await fetchSubredditPosts('x', { fetchImpl });

    expect(posts.map((post: { id: string; rank: number }) => [post.id, post.rank])).toEqual([
      ['first', 1],
      ['second', 2],
    ]);
  });

  it('drops entries whose atom id is not a t3_ post id (defends against malformed/unexpected feed content)', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            `<entry>
      <id>t1_commentnotpost</id>
      <link href="https://www.reddit.com/r/x/comments/foo/" />
      <title>A comment, not a post</title>
      <updated>2026-08-30T00:00:00.000Z</updated>
      <content type="html">comment body</content>
    </entry>`,
          ]),
          { status: 200 },
        ),
    );

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

    await fetchSubredditPosts('TaylorSwiftMerch', {
      sort: 'top',
      time: 'week',
      limit: 50,
      fetchImpl,
    });

    const [url, options] = fetchImpl.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(String(url)).toBe('https://www.reddit.com/r/TaylorSwiftMerch/top/.rss?limit=50&t=week');
    expect(options.headers['User-Agent']).toMatch(/Swift2FanmadeDiscovery/);
  });
});

describe('topPosts', () => {
  it('always requests sort=top, defaulting limit to 25 when unspecified', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([]), { status: 200 }));

    await topPosts('TaylorSwift', { time: 'day', fetchImpl });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(String(url)).toBe('https://www.reddit.com/r/TaylorSwift/top/.rss?limit=25&t=day');
  });

  it('returns posts/status in the same shape as fetchSubredditPosts', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            linkPostEntry({
              id: 'top1',
              title: 'Top post',
              permalink: 'https://www.reddit.com/r/x/comments/top1/',
              createdAt: '2026-08-30T00:00:00.000Z',
              outboundUrl: 'https://www.reddit.com/r/x/comments/top1/',
            }),
          ]),
          { status: 200 },
        ),
    );

    const { posts, status } = await topPosts('x', { fetchImpl });

    expect(status).toBe(200);
    expect(posts).toEqual([expect.objectContaining({ id: 'top1' })]);
  });
});

describe('postComments', () => {
  function commentEntry({
    id,
    author,
    body,
    createdAt,
  }: {
    id: string;
    author: string;
    body: string;
    createdAt: string;
  }) {
    return `<entry>
      <id>${id}</id>
      <author><name>${escapeXml(author)}</name></author>
      <updated>${createdAt}</updated>
      <content type="html">${escapeXml(body)}</content>
    </entry>`;
  }

  it('drops the post entry (t3_) and returns only comment entries (t1_)', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            `<entry><id>t3_root</id><title>The post</title><updated>2026-08-30T00:00:00.000Z</updated></entry>`,
            commentEntry({
              id: 't1_c1',
              author: 'fan_one',
              body: 'first take',
              createdAt: '2026-08-30T00:01:00.000Z',
            }),
            commentEntry({
              id: 't1_c2',
              author: 'fan_two',
              body: 'second take',
              createdAt: '2026-08-30T00:02:00.000Z',
            }),
          ]),
          { status: 200 },
        ),
    );

    const { comments, status } = await postComments(
      'https://www.reddit.com/r/x/comments/root/a_post/',
      15,
      { fetchImpl },
    );

    expect(status).toBe(200);
    expect(comments).toEqual([
      {
        id: 't1_c1',
        author: 'fan_one',
        body: 'first take',
        publishedAt: '2026-08-30T00:01:00.000Z',
      },
      {
        id: 't1_c2',
        author: 'fan_two',
        body: 'second take',
        publishedAt: '2026-08-30T00:02:00.000Z',
      },
    ]);
  });

  it('requests the permalink + .rss?limit=N&sort=top, adding a trailing slash if missing', async () => {
    const fetchImpl = vi.fn(async () => new Response(atomFeed([]), { status: 200 }));

    await postComments('https://www.reddit.com/r/x/comments/root/a_post', 10, { fetchImpl });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(String(url)).toBe(
      'https://www.reddit.com/r/x/comments/root/a_post/.rss?limit=10&sort=top',
    );
  });

  it('backs off on 429 without retrying and returns zero comments', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 }));

    const { comments, status } = await postComments(
      'https://www.reddit.com/r/x/comments/root/a_post/',
      15,
      { fetchImpl },
    );

    expect(status).toBe(429);
    expect(comments).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws with the HTTP status attached for a non-429 failure', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 }));

    await expect(
      postComments('https://www.reddit.com/r/x/comments/root/a_post/', 15, { fetchImpl }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('drops comment entries with an empty body after trimming', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          atomFeed([
            commentEntry({
              id: 't1_empty',
              author: 'ghost',
              body: '   ',
              createdAt: '2026-08-30T00:00:00.000Z',
            }),
          ]),
          { status: 200 },
        ),
    );

    const { comments } = await postComments(
      'https://www.reddit.com/r/x/comments/root/a_post/',
      15,
      { fetchImpl },
    );

    expect(comments).toEqual([]);
  });
});

describe('parseRedditEmail', () => {
  function rawEmail({
    subject,
    textBody,
    htmlBody,
  }: {
    subject: string;
    textBody?: string;
    htmlBody?: string;
  }) {
    if (htmlBody && textBody) {
      const boundary = 'BOUNDARY123';
      return [
        `From: noreply@reddit.com`,
        `Subject: ${subject}`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        textBody,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        htmlBody,
        '',
        `--${boundary}--`,
      ].join('\r\n');
    }
    return [
      `From: noreply@reddit.com`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      '',
      textBody ?? '',
    ].join('\r\n');
  }

  it('classifies a reply-to-us email and extracts the comment permalink', () => {
    const raw = rawEmail({
      subject: 'u/marjorieswift00 replied to your comment',
      textBody:
        'Someone replied: https://www.reddit.com/r/TaylorSwift/comments/abc123/some_thread/def456/',
    });

    const result = parseRedditEmail(raw);

    expect(result.kind).toBe('reply_to_us');
    expect(result.postIds).toEqual(['abc123']);
    expect(result.links[0]).toContain('/r/TaylorSwift/comments/abc123/');
  });

  it('classifies a trending/digest email', () => {
    const raw = rawEmail({
      subject: 'Trending in r/TaylorSwift today',
      textBody: 'Check out https://www.reddit.com/r/TaylorSwift/comments/xyz789/hot_thread/',
    });

    const result = parseRedditEmail(raw);

    expect(result.kind).toBe('digest');
    expect(result.postIds).toEqual(['xyz789']);
  });

  it('falls back to alert for anything that is neither a reply nor a digest', () => {
    const raw = rawEmail({
      subject: 'New post from a user you follow',
      textBody: 'https://www.reddit.com/r/TaylorSwift/comments/follow01/a_post/',
    });

    const result = parseRedditEmail(raw);

    expect(result.kind).toBe('alert');
    expect(result.postIds).toEqual(['follow01']);
  });

  it('prefers HTML links when both text and HTML parts are present, and dedupes', () => {
    const raw = rawEmail({
      subject: 'New reply to your post',
      textBody: 'plain text version, no link here',
      htmlBody:
        '<a href="https://www.reddit.com/r/TaylorSwift/comments/htmllink/a_post/">view</a><a href="https://www.reddit.com/r/TaylorSwift/comments/htmllink/a_post/">view again</a>',
    });

    const result = parseRedditEmail(raw);

    expect(result.postIds).toEqual(['htmllink']);
    expect(result.links).toHaveLength(1);
  });

  it('handles quoted-printable encoded bodies', () => {
    const raw = [
      'From: noreply@reddit.com',
      'Subject: New reply to your comment',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'See https://www.reddit.com/r/TaylorSwift/comments/qp1234/a=\r\n_post/',
    ].join('\r\n');

    const result = parseRedditEmail(raw);

    expect(result.postIds).toEqual(['qp1234']);
  });

  it('handles base64-encoded HTML bodies (Gmail commonly encodes the html part this way — regression test for a collectParts bug where the raw header block was passed to contentTypeOf/decodePart instead of the parsed header map, silently dropping every base64 part)', () => {
    const html = '<a href="https://www.reddit.com/r/TaylorSwift/comments/b64test/a_post/">view</a>';
    const encoded = Buffer.from(html, 'utf8').toString('base64');
    const raw = [
      'From: noreply@reddit.com',
      'Subject: New reply to your post',
      'Content-Type: multipart/alternative; boundary="B1"',
      '',
      '--B1',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'no link here',
      '--B1',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encoded,
      '--B1--',
    ].join('\r\n');

    const result = parseRedditEmail(raw);

    expect(result.postIds).toEqual(['b64test']);
    expect(result.links).toEqual(['https://www.reddit.com/r/TaylorSwift/comments/b64test/a_post/']);
  });

  it('handles a preamble before the first boundary (RFC 2046 allows arbitrary preamble text)', () => {
    const raw = [
      'From: noreply@reddit.com',
      'Subject: New reply to your comment',
      'Content-Type: multipart/alternative; boundary="B2"',
      '',
      'This is a multi-part message in MIME format.',
      '--B2',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'https://www.reddit.com/r/TaylorSwift/comments/preamble01/a_post/',
      '--B2--',
    ].join('\r\n');

    const result = parseRedditEmail(raw);

    expect(result.postIds).toEqual(['preamble01']);
  });

  it('handles a nested multipart/mixed wrapping a multipart/alternative (real Gmail-relayed shape)', () => {
    const raw = [
      'From: noreply@redditmail.com',
      'Subject: u/someuser replied to your comment',
      'Content-Type: multipart/mixed; boundary="outer"',
      '',
      '--outer',
      'Content-Type: multipart/alternative; boundary="inner"',
      '',
      '--inner',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'plain text, no link',
      '--inner',
      'Content-Type: text/html; charset=UTF-8',
      '',
      '<a href="https://www.reddit.com/r/TaylorSwift/comments/nested01/a_post/">view</a>',
      '--inner--',
      '--outer--',
    ].join('\r\n');

    const result = parseRedditEmail(raw);

    expect(result.postIds).toEqual(['nested01']);
  });

  it('returns no post ids and kind=alert for an email with no reddit links', () => {
    const raw = rawEmail({ subject: 'Welcome to Reddit', textBody: 'Thanks for signing up.' });

    const result = parseRedditEmail(raw);

    expect(result.kind).toBe('alert');
    expect(result.links).toEqual([]);
    expect(result.postIds).toEqual([]);
  });
});

describe('parseShredditComments', () => {
  function shredditComment({
    author,
    score,
    depth,
    body,
  }: {
    author: string;
    score: string;
    depth: number;
    body: string;
  }) {
    return `<shreddit-comment author="${author}" score="${score}" depth="${depth}" thingid="t1_x">
      <div class="rtjson-content-wrapper">
        <div class="md rtjson-content"><p>${body}</p></div>
      </div>
    </shreddit-comment>`;
  }

  it('extracts author/score/depth/body from shreddit-comment blocks in document order', () => {
    const html = `<div id="comment-tree">
      ${shredditComment({ author: 'fan_a', score: '42', depth: 0, body: 'top level take' })}
      ${shredditComment({ author: 'fan_b', score: '7', depth: 1, body: 'a reply' })}
    </div>`;

    const results = parseShredditComments(html);

    expect(results).toEqual([
      { author: 'fan_a', score: '42', depth: 0, body: 'top level take' },
      { author: 'fan_b', score: '7', depth: 1, body: 'a reply' },
    ]);
  });

  it('decodes HTML entities and collapses whitespace in the extracted body', () => {
    const html = shredditComment({
      author: 'fan_c',
      score: '3',
      depth: 0,
      body: 'Taylor &amp; Travis   confirmed?',
    });

    const results = parseShredditComments(html);

    expect(results[0].body).toBe('Taylor & Travis confirmed?');
  });

  it('skips fragments with no author attribute (not a real comment node)', () => {
    const html = `<div class="wrapper-with-no-author"><span>filler</span></div>${shredditComment({ author: 'fan_d', score: '1', depth: 0, body: 'real comment' })}`;

    const results = parseShredditComments(html);

    expect(results).toHaveLength(1);
    expect(results[0].author).toBe('fan_d');
  });

  it('returns body: null when a comment block has no locatable body markup', () => {
    const html = `<shreddit-comment author="fan_e" score="0" depth="0" thingid="t1_y"></shreddit-comment>`;

    const results = parseShredditComments(html);

    expect(results).toEqual([{ author: 'fan_e', score: '0', depth: 0, body: null }]);
  });

  it('returns an empty array for HTML with no shreddit-comment blocks at all', () => {
    expect(parseShredditComments('<div>nothing here</div>')).toEqual([]);
  });
});
