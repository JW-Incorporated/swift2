import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  apiSearchUrl,
  connectRedditApi,
  createRedditApi,
  mapListing,
  oauthRequests,
  redditAuthFromEnv,
  userAgentFor,
} from './awareness-reddit-api.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { runAwarenessScan } from './awareness-scan.mjs';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const secondsAgo = (h: number) => Math.floor((NOW.getTime() - h * 3_600_000) / 1000);
const SECRET = 'sekrit-value-123';
const TOKEN = 'tok-abc-789';
const json = (body: unknown, headers: Record<string, string> = {}, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const post = (id: string, title: string, hours: number, sub: string, extra = {}) => ({
  kind: 't3',
  data: {
    id,
    title,
    permalink: `/r/${sub}/comments/${id}/t/`,
    url: `https://www.reddit.com/r/${sub}/comments/${id}/t/`,
    author: 'someone',
    created_utc: secondsAgo(hours),
    over_18: false,
    locked: false,
    archived: false,
    ...extra,
  },
});
const listing = (...children: unknown[]) => ({ data: { children } });

describe('redditAuthFromEnv', () => {
  it('needs both secrets; username is optional', () => {
    expect(redditAuthFromEnv({})).toBeNull();
    expect(redditAuthFromEnv({ REDDIT_CLIENT_ID: 'a' })).toBeNull();
    expect(redditAuthFromEnv({ REDDIT_CLIENT_ID: 'a', REDDIT_CLIENT_SECRET: ' ' })).toBeNull();
    expect(
      redditAuthFromEnv({
        REDDIT_CLIENT_ID: 'a',
        REDDIT_CLIENT_SECRET: 'b',
        REDDIT_USERNAME: 'me',
      }),
    ).toEqual({ clientId: 'a', clientSecret: 'b', username: 'me' });
  });

  it('builds the descriptive User-Agent from the username var or the default', () => {
    expect(userAgentFor('Joey')).toBe('longlive-awareness/1.0 (by u/Joey)');
    expect(userAgentFor('u/Joey')).toBe('longlive-awareness/1.0 (by u/Joey)');
    expect(userAgentFor(undefined)).toBe('longlive-awareness/1.0 (by u/longlivets)');
    expect(userAgentFor('')).toBe('longlive-awareness/1.0 (by u/longlivets)');
  });
});

describe('listing mapping', () => {
  it('maps JSON listings to the RSS candidate shape and drops NSFW and non-link children', () => {
    const posts = mapListing(
      listing(
        post('a', 'Rank the eras', 3, 'TaylorSwift', { locked: true }),
        post('b', 'NSFW thing', 3, 'X', { over_18: true }),
        { kind: 't1', data: { id: 'c' } },
        post('d', 'Second', 4, 'swifties'),
      ),
      { rankOffset: 25 },
    );
    expect(posts.map((p: { id: string }) => p.id)).toEqual(['a', 'd']);
    expect(posts[0]).toMatchObject({
      id: 'a',
      title: 'Rank the eras',
      permalink: 'https://www.reddit.com/r/TaylorSwift/comments/a/t/',
      author: 'someone',
      locked: true,
      archived: false,
      rank: 26,
    });
    expect(posts[0].createdAt).toBe(new Date(secondsAgo(3) * 1000).toISOString());
    expect(posts[1].rank).toBe(27);
    expect(mapListing(null)).toEqual([]);
  });

  it('builds the search URL with type=link, sort=new, t=day', () => {
    const url = new URL(apiSearchUrl('"taylor swift"', 25));
    expect(url.origin + url.pathname).toBe('https://oauth.reddit.com/search');
    expect(url.searchParams.get('type')).toBe('link');
    expect(url.searchParams.get('sort')).toBe('new');
    expect(url.searchParams.get('t')).toBe('day');
  });

  it('plans hot + new for every sub and one request per search query', () => {
    const reqs = oauthRequests({
      subs: [{ name: 'A' }, { name: 'B' }],
      search: { queries: ['q1', 'q2'] },
    });
    expect(reqs.map((r: { label: string }) => r.label)).toEqual([
      'sub:A/hot',
      'sub:A/new',
      'sub:B/hot',
      'sub:B/new',
      'search:0',
      'search:1',
    ]);
  });
});

describe('createRedditApi', () => {
  const make = (fetchImpl: unknown, over = {}) =>
    createRedditApi({
      clientId: 'cid',
      clientSecret: SECRET,
      username: 'Joey',
      pacingMs: 10,
      fetchImpl: fetchImpl as never,
      sleep: async () => {},
      ...over,
    });

  it('gets an app-only token with Basic auth and the descriptive User-Agent, then calls oauth.reddit.com with Bearer', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/api/v1/access_token')) return json({ access_token: TOKEN });
      return json(listing(post('a', 'Rank the eras', 3, 'TaylorSwift')));
    });
    const api = make(fetchImpl);
    expect(await api.authenticate()).toEqual({ ok: true });
    const res = await api.get('https://oauth.reddit.com/r/TaylorSwift/hot?limit=25', 'x');
    expect(res).toMatchObject({ via: 'oauth', status: 200 });
    expect(res.posts).toHaveLength(1);
    const [tokenCall, listCall] = calls;
    expect(tokenCall.url).toBe('https://www.reddit.com/api/v1/access_token');
    expect(tokenCall.init.method).toBe('POST');
    expect(tokenCall.init.body).toBe('grant_type=client_credentials');
    const headers = tokenCall.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from(`cid:${SECRET}`).toString('base64')}`);
    expect(headers['User-Agent']).toBe('longlive-awareness/1.0 (by u/Joey)');
    expect((listCall.init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('reports a failed token request without leaking the secret or token, and then makes no API calls', async () => {
    const fetchImpl = vi.fn(async () => json({ error: 'invalid_grant' }, {}, 401));
    const api = make(fetchImpl);
    const auth = await api.authenticate();
    expect(auth.ok).toBe(false);
    expect(JSON.stringify(auth)).not.toContain(SECRET);
    expect((await api.get('https://oauth.reddit.com/x', 'x')).skipped).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('on 429 waits the Retry-After time, retries once, and counts both requests against the budget', async () => {
    const sleeps: number[] = [];
    const responses = [
      json({ access_token: TOKEN }),
      json({}, { 'retry-after': '7' }, 429),
      json(listing(post('a', 'Rank the eras', 3, 'TaylorSwift'))),
    ];
    const fetchImpl = vi.fn(async () => responses.shift() as Response);
    const api = make(fetchImpl, { sleep: async (ms: number) => void sleeps.push(ms) });
    await api.authenticate();
    const res = await api.get('https://oauth.reddit.com/x', 'x');
    expect(res.posts).toHaveLength(1);
    expect(sleeps).toEqual([7000]);
    expect(api.stats()).toMatchObject({ used: 2, rateLimited: 1, aborted: false });
  });

  it('gives up on a source that stays rate-limited and aborts the run after repeated failures', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      String(url).includes('access_token')
        ? json({ access_token: TOKEN })
        : json({}, { 'x-ratelimit-reset': '1' }, 429),
    );
    const api = make(fetchImpl);
    await api.authenticate();
    for (let i = 0; i < 6; i += 1) await api.get('https://oauth.reddit.com/x', 'x');
    expect(api.stats().aborted).toBe(true);
    expect(fetchImpl.mock.calls.length).toBeLessThan(10);
  });

  it('sleeps until x-ratelimit-reset when the remaining allowance is spent', async () => {
    const sleeps: number[] = [];
    const responses = [
      json({ access_token: TOKEN }),
      json(listing(), { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '12' }),
      json(listing()),
    ];
    const api = make(
      vi.fn(async () => responses.shift() as Response),
      { sleep: async (ms: number) => void sleeps.push(ms) },
    );
    await api.authenticate();
    await api.get('https://oauth.reddit.com/a', 'a');
    await api.get('https://oauth.reddit.com/b', 'b');
    expect(sleeps).toEqual([12000]);
  });

  it('never exceeds the request budget', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      String(url).includes('access_token') ? json({ access_token: TOKEN }) : json(listing()),
    );
    const api = make(fetchImpl, { budget: 2 });
    await api.authenticate();
    await api.get('https://oauth.reddit.com/1', 'a');
    await api.get('https://oauth.reddit.com/2', 'b');
    expect((await api.get('https://oauth.reddit.com/3', 'c')).skipped).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3); // token + 2 requests
  });

  it('reads comment_contribution_settings.allowed_media_types from /about', async () => {
    const about = (types: string[] | undefined, over18 = false) =>
      json({ data: { over18, comment_contribution_settings: { allowed_media_types: types } } });
    const responses = [
      json({ access_token: TOKEN }),
      about(['static', 'animated']),
      about(['animated']),
      about(undefined, true),
      json({}, {}, 403),
    ];
    const api = make(vi.fn(async () => responses.shift() as Response));
    await api.authenticate();
    expect(await api.about('A')).toEqual({ imageComments: 'image', over18: false });
    expect(await api.about('B')).toEqual({ imageComments: 'text_only', over18: false });
    expect(await api.about('C')).toEqual({ imageComments: 'unknown', over18: true });
    expect(await api.about('D')).toMatchObject({
      imageComments: 'unknown',
      error: 'about r/D: HTTP 403',
    });
  });

  it('connectRedditApi falls back to anonymous without credentials or when the token fails', async () => {
    expect(await connectRedditApi(null)).toEqual({ api: null, auth: 'anonymous', authError: null });
    const failing = await connectRedditApi(
      { clientId: 'a', clientSecret: SECRET },
      { fetchImpl: (async () => json({}, {}, 401)) as never, sleep: async () => {} },
    );
    expect(failing).toMatchObject({ api: null, auth: 'anonymous', authError: 'token HTTP 401' });
  });
});

describe('awareness scan with Reddit credentials', () => {
  const config = {
    defaults: {
      maxAgeHours: 48,
      perSubScanCapPerRun: 2,
      perSubDailyDeliveryCap: 3,
      feedLimit: 25,
      feedRequestsPerRun: 6,
      pacingMs: 0,
      authedRequestsPerRun: 40,
      authedPacingMs: 0,
    },
    excluded: [],
    search: { queries: ['"taylor swift"'], blockSubs: ['Fauxmoi'] },
    subs: [
      { name: 'TaylorSwift', tier: 1, always: true, dailyCap: 4 },
      { name: 'swifties', tier: 1, always: true, dailyCap: 4 },
      { name: 'SwiftlyNeutral', tier: 1 },
      { name: 'popheads', tier: 2, requireTaylor: 'strict' },
    ],
  };
  const catalog = { eras: [{ id: 'folklore', name: 'folklore' }], moments: [] };
  const redditAuth = { clientId: 'cid', clientSecret: SECRET, username: 'Joey' };
  const run = (fetchImpl: unknown, over: Record<string, unknown> = {}) =>
    runAwarenessScan({
      config,
      catalog,
      fetchImpl: fetchImpl as never,
      now: NOW,
      sleep: async () => {},
      random: () => 0,
      dryRun: true,
      redditAuth,
      ...over,
    });

  function api() {
    const urls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      const u = String(url);
      urls.push(u);
      if (u.includes('/api/v1/access_token')) return json({ access_token: TOKEN });
      if (u.includes('/about'))
        return json({
          data: {
            over18: false,
            comment_contribution_settings: { allowed_media_types: ['static'] },
          },
        });
      if (u.includes('/search')) {
        return json(
          listing(post('s1', 'Which Taylor Swift era is the best?', 4, 'popculturechat')),
        );
      }
      const sub = /\/r\/([^/]+)\//.exec(u)?.[1] ?? '';
      return json(
        listing(
          post(`${sub}-1`, 'Rank the eras from best to worst', 5, sub),
          post(`${sub}-2`, 'When did folklore come out', 8, sub),
        ),
      );
    });
    return { fetchImpl, urls };
  }

  it('uses oauth.reddit.com for every sub (hot + new), every search query and /about, and reports auth: oauth', async () => {
    const { fetchImpl, urls } = api();
    const result = await run(fetchImpl);
    expect(result.auth).toBe('oauth');
    expect(result.requests.used).toBeLessThanOrEqual(40);
    expect(urls.some((u) => u.includes('.rss'))).toBe(false);
    for (const sub of ['TaylorSwift', 'swifties', 'SwiftlyNeutral', 'popheads']) {
      expect(urls).toContain(`https://oauth.reddit.com/r/${sub}/hot?limit=25&raw_json=1`);
      expect(urls).toContain(`https://oauth.reddit.com/r/${sub}/new?limit=25&raw_json=1`);
      expect(urls).toContain(`https://oauth.reddit.com/r/${sub}/about?raw_json=1`);
    }
    expect(urls.some((u) => u.startsWith('https://oauth.reddit.com/search?'))).toBe(true);
    expect(urls.some((u) => u.includes('/r/popculturechat/about'))).toBe(true);
    expect(result.perSource).toHaveLength(9); // 4 subs x (hot, new) + 1 search
    expect(result.rows.length).toBeGreaterThan(3);
    expect(result.rows.every((r: { image_comments: string }) => r.image_comments === 'image')).toBe(
      true,
    );
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });

  it('falls back to the anonymous RSS path when the token request is refused', async () => {
    const urls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      urls.push(String(url));
      if (String(url).includes('access_token')) return json({}, {}, 401);
      return new Response(
        '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>',
        {
          status: 200,
        },
      );
    });
    const result = await run(fetchImpl, {
      fetchAbout: async () => ({ imageComments: 'unknown', over18: false }),
    });
    expect(result.auth).toBe('anonymous');
    expect(result.authError).toBe('token HTTP 401');
    expect(urls.filter((u) => u.includes('oauth.reddit.com'))).toEqual([]);
    expect(result.requests.used).toBeLessThanOrEqual(6);
  });

  it('is the unchanged anonymous path when no credentials are given', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>', {
          status: 200,
        }),
    );
    const result = await run(fetchImpl, {
      redditAuth: null,
      fetchAbout: async () => ({ imageComments: 'unknown', over18: false }),
    });
    expect(result.auth).toBe('anonymous');
    expect(result.authError).toBeNull();
    expect(fetchImpl.mock.calls.every((c) => String(c[0]).includes('.rss'))).toBe(true);
  });

  it('skips a rate-limited listing after backoff and still finishes the run', async () => {
    const sleeps: number[] = [];
    let first = true;
    const { fetchImpl: base } = api();
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('/r/TaylorSwift/hot') && first) {
        first = false;
        return json({}, { 'retry-after': '3' }, 429);
      }
      return base(url);
    });
    const result = await run(fetchImpl, { sleep: async (ms: number) => void sleeps.push(ms) });
    expect(result.auth).toBe('oauth');
    expect(sleeps).toContain(3000);
    expect(result.requests.rateLimited).toBe(1);
    expect(result.rows.length).toBeGreaterThan(3);
  });
});
