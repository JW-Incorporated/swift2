import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  BLOCKED_KEY,
  aboutBlockedRecently,
  cachedAbout,
  eligibilityRank,
  fetchSubAbout,
  fetchThreadReplyState,
  parseThreadReplyState,
  threadJsonUrl,
  imageCommentsLabel,
  loadAboutCache,
  parseAbout,
  resolveImageComments,
  saveAbout,
} from './awareness-eligibility.mjs';

const about = (data: Record<string, unknown>) => ({ kind: 't5', data });

describe('about.json image-comment eligibility', () => {
  it('reads comment_contribution_settings.allowed_media_types: static means images are allowed', () => {
    expect(
      parseAbout(
        about({
          comment_contribution_settings: {
            allowed_media_types: ['giphy', 'static', 'animated', 'expression'],
          },
        }),
      ).imageComments,
    ).toBe('image');
  });

  it('marks a sub text-only when the media list exists but has no static images', () => {
    expect(
      parseAbout(about({ comment_contribution_settings: { allowed_media_types: ['giphy'] } }))
        .imageComments,
    ).toBe('text_only');
    expect(
      parseAbout(about({ comment_contribution_settings: { allowed_media_types: [] } }))
        .imageComments,
    ).toBe('text_only');
  });

  it('never guesses text-only from a missing or null field, and ignores allow_images (image POSTS)', () => {
    expect(parseAbout(about({})).imageComments).toBe('unknown');
    expect(
      parseAbout(about({ comment_contribution_settings: { allowed_media_types: null } }))
        .imageComments,
    ).toBe('unknown');
    expect(parseAbout(about({ allow_images: false })).imageComments).toBe('unknown');
    expect(parseAbout(null).imageComments).toBe('unknown');
  });

  it('flags NSFW subs', () => {
    expect(parseAbout(about({ over18: true })).over18).toBe(true);
    expect(parseAbout(about({ over18: false })).over18).toBe(false);
  });

  it('lets a pinned config value override the live reading', () => {
    expect(resolveImageComments({ imageComments: 'text_only' }, { imageComments: 'image' })).toBe(
      'text_only',
    );
    expect(resolveImageComments({ imageComments: null }, { imageComments: 'image' })).toBe('image');
    expect(resolveImageComments({}, undefined)).toBe('unknown');
  });

  it('degrades a blocked or failing request to unknown instead of throwing', async () => {
    const blocked = vi.fn(async () => new Response('blocked', { status: 403 }));
    expect(await fetchSubAbout('TaylorSwift', { fetchImpl: blocked })).toEqual({
      imageComments: 'unknown',
      over18: false,
      error: 'HTTP 403',
    });
    const broken = vi.fn(async () => {
      throw new Error('network down');
    });
    expect((await fetchSubAbout('TaylorSwift', { fetchImpl: broken })).imageComments).toBe(
      'unknown',
    );
  });

  it('requests the public about.json with a User-Agent', async () => {
    const ok = vi.fn(
      async () =>
        new Response(
          JSON.stringify(
            about({ comment_contribution_settings: { allowed_media_types: ['static'] } }),
          ),
          { status: 200 },
        ),
    );
    expect((await fetchSubAbout('swifties', { fetchImpl: ok })).imageComments).toBe('image');
    const [url, init] = ok.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/r/swifties/about.json');
    expect(init.headers['User-Agent']).toMatch(/Swift2Awareness/);
  });

  it('labels and orders states: image first, text-only last', () => {
    expect(imageCommentsLabel('text_only')).toContain('text-only sub');
    expect(imageCommentsLabel('unknown')).toContain('unverified');
    expect(
      ['text_only', 'unknown', 'image'].sort((a, b) => eligibilityRank(a) - eligibilityRank(b)),
    ).toEqual(['image', 'unknown', 'text_only']);
  });
});

describe('about.json cache', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  const row = (sub: string, hoursOld: number, imageComments = 'image') => ({
    sub,
    image_comments: imageComments,
    over18: false,
    fetched_at: new Date(now.getTime() - hoursOld * 3_600_000).toISOString(),
  });

  it('serves a reading for a week, then asks again', () => {
    const cache = new Map([
      ['A', row('A', 24 * 6)],
      ['B', row('B', 24 * 8)],
    ]);
    expect(cachedAbout(cache, 'A', now)).toEqual({ imageComments: 'image', over18: false });
    expect(cachedAbout(cache, 'B', now)).toBeNull();
    expect(cachedAbout(cache, 'C', now)).toBeNull();
  });

  it('remembers a block for half a day', () => {
    expect(
      aboutBlockedRecently(new Map([[BLOCKED_KEY, row(BLOCKED_KEY, 11, 'unknown')]]), now),
    ).toBe(true);
    expect(
      aboutBlockedRecently(new Map([[BLOCKED_KEY, row(BLOCKED_KEY, 13, 'unknown')]]), now),
    ).toBe(false);
    expect(aboutBlockedRecently(new Map(), now)).toBe(false);
  });

  it('saves a good reading under the sub and a blocked one under the blocked key', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const db = { from: () => ({ upsert }) };
    await saveAbout(db, 'TaylorSwift', { imageComments: 'image', over18: false }, now);
    await saveAbout(
      db,
      'TaylorSwift',
      { imageComments: 'unknown', over18: false, error: 'HTTP 403' },
      now,
    );
    expect(upsert.mock.calls[0][0]).toMatchObject({ sub: 'TaylorSwift', image_comments: 'image' });
    expect(upsert.mock.calls[1][0]).toMatchObject({ sub: BLOCKED_KEY, image_comments: 'unknown' });
  });

  it('reads an unreadable cache table as empty', async () => {
    const db = {
      from: () => ({ select: async () => ({ data: null, error: { message: 'no table' } }) }),
    };
    expect((await loadAboutCache(db)).size).toBe(0);
  });

  it('labels an unverified sub with the post-the-text fallback', () => {
    expect(imageCommentsLabel('unknown')).toBe(
      "🖼️ image replies unverified — if there's no image button, post the text",
    );
  });
});

const thread = (data: Record<string, unknown>) => [
  { data: { children: [{ kind: 't3', data }] } },
  { data: { children: [] } },
];
const PERMALINK = 'https://www.reddit.com/r/TaylorSwift/comments/abc123/rank_the_eras/';

describe('thread.json reply-ability', () => {
  it('reads locked, archived, restricted and quarantined threads as unreplyable', () => {
    expect(parseThreadReplyState(thread({ locked: true })).state).toBe('locked');
    expect(parseThreadReplyState(thread({ archived: true })).state).toBe('archived');
    expect(parseThreadReplyState(thread({ subreddit_type: 'restricted' })).state).toBe(
      'no-comment',
    );
    expect(parseThreadReplyState(thread({ subreddit_type: 'private' })).state).toBe('no-comment');
    expect(parseThreadReplyState(thread({ quarantine: true })).state).toBe('no-comment');
  });

  it('an open thread in a public sub is ok; an unreadable body is unknown', () => {
    expect(
      parseThreadReplyState(thread({ locked: false, archived: false, subreddit_type: 'public' }))
        .state,
    ).toBe('ok');
    expect(parseThreadReplyState({}).state).toBe('unknown');
    expect(parseThreadReplyState(null).state).toBe('unknown');
  });

  it('builds the anonymous thread JSON url and refuses other hosts', () => {
    expect(threadJsonUrl(PERMALINK)).toBe(
      'https://www.reddit.com/r/TaylorSwift/comments/abc123/rank_the_eras.json?raw_json=1&limit=1',
    );
    expect(threadJsonUrl('https://example.com/x/')).toBeNull();
  });

  it('fetches anonymously and parses; a 403 or a network error degrades to unknown', async () => {
    const ok = vi.fn(
      async () => new Response(JSON.stringify(thread({ locked: true })), { status: 200 }),
    );
    expect((await fetchThreadReplyState(PERMALINK, { fetchImpl: ok as never })).state).toBe(
      'locked',
    );
    const headers = (
      ok.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    )[1].headers;
    expect(Object.keys(headers).some((h) => /authorization/i.test(h))).toBe(false);
    const blocked = await fetchThreadReplyState(PERMALINK, {
      fetchImpl: (async () => new Response('no', { status: 403 })) as never,
    });
    expect(blocked).toEqual({ state: 'unknown', error: 'HTTP 403' });
    const down = await fetchThreadReplyState(PERMALINK, {
      fetchImpl: (async () => {
        throw new Error('boom');
      }) as never,
    });
    expect(down).toEqual({ state: 'unknown', error: 'boom' });
  });
});
