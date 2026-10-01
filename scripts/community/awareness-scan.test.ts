import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  awarenessEnabled,
  buildAwarenessRow,
  dailyCapFor,
  groupByCommunity,
  runAwarenessScan,
  utcDayStart,
} from './awareness-scan.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { adoptFacebookLeads } from './awareness-facebook.mjs';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const catalog = {
  eras: [
    { id: 'folklore', name: 'folklore' },
    { id: 'tloas', name: 'tloas' },
  ],
  moments: [],
};

function entry(id: string, title: string, hours: number, sub = 'X') {
  return `<entry><id>t3_${id}</id><link href="https://www.reddit.com/r/${sub}/comments/${id}/t/" /><title>${title}</title><updated>${hoursAgo(hours)}</updated></entry>`;
}
const atom = (entries: string[]) =>
  `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join('')}</feed>`;

/** Serves a sub listing by /r/<sub>/ and every search.rss with `search`. */
function feeds(bySub: Record<string, string[]>, search: string[] = []) {
  return vi.fn(async (url: string) => {
    if (String(url).includes('/search.rss')) return new Response(atom(search), { status: 200 });
    const sub = /\/r\/([^/]+)\//.exec(String(url))?.[1] ?? '';
    return new Response(atom(bySub[sub] ?? []), { status: 200 });
  });
}

const config = {
  defaults: {
    maxAgeHours: 48,
    perSubScanCapPerRun: 2,
    perSubDailyDeliveryCap: 3,
    feedLimit: 25,
    feedRequestsPerRun: 6,
    pacingMs: 0,
  },
  excluded: [{ name: 'SwiftlyNSFW' }],
  search: { queries: ['"taylor swift"'], blockSubs: ['Fauxmoi'] },
  subs: [
    { name: 'TaylorSwift', tier: 1, always: true, dailyCap: 4 },
    { name: 'swifties', tier: 1, always: true, dailyCap: 4 },
    { name: 'Spicy', tier: 3 },
  ],
};
const aboutOk = async (name: string) =>
  name === 'Spicy'
    ? { imageComments: 'unknown', over18: true }
    : { imageComments: name === 'swifties' ? 'text_only' : 'image', over18: false };
const run = (over: Record<string, unknown>) =>
  runAwarenessScan({
    config,
    catalog,
    fetchAbout: aboutOk,
    now: NOW,
    sleep: async () => {},
    random: () => 0,
    ...over,
  });

function fakeSupabase({
  known = [] as string[],
  todayCounts = [] as string[],
  fbLeads = [] as unknown[],
  fbExisting = [] as unknown[],
  cache = [] as unknown[],
} = {}) {
  const inserted: { rows: unknown }[] = [];
  const upserts: unknown[] = [];
  return {
    inserted,
    upserts,
    from(table: string) {
      const ctx: { platform?: string; kind?: string } = {};
      const builder: Record<string, unknown> = {
        select: () =>
          table === 'awareness_sub_cache' ? Promise.resolve({ data: cache, error: null }) : builder,
        eq: (col: string, val: string) => {
          if (col === 'platform') ctx.platform = val;
          if (col === 'kind') ctx.kind = val;
          return builder;
        },
        not: () =>
          Promise.resolve({ data: known.map((thread_id) => ({ thread_id })), error: null }),
        gte: () => {
          if (ctx.platform === 'facebook')
            return Promise.resolve({
              data: ctx.kind === 'awareness_reply' ? fbExisting : fbLeads,
              error: null,
            });
          return Promise.resolve({
            data: todayCounts.map((community) => ({ community })),
            error: null,
          });
        },
        insert: (rows: unknown) => {
          inserted.push({ rows });
          return Promise.resolve({ error: null });
        },
        upsert: (row: unknown) => {
          upserts.push(row);
          return Promise.resolve({ error: null });
        },
      };
      return builder;
    },
  };
}

describe('awareness scan', () => {
  it('is on unless explicitly switched off', () => {
    expect(awarenessEnabled({})).toBe(true);
    expect(awarenessEnabled({ AWARENESS_LANE_ENABLED: 'false' })).toBe(false);
    expect(awarenessEnabled({ AWARENESS_LANE_ENABLED: 'true' })).toBe(true);
  });

  it('finds fitting fresh threads, applies filters and caps, skips NSFW subs, and inserts awareness rows', async () => {
    const supabase = fakeSupabase({
      known: ['seen1'],
      cache: [
        { sub: 'Spicy', image_comments: 'unknown', over18: true, fetched_at: hoursAgo(5) },
        { sub: 'swifties', image_comments: 'text_only', over18: false, fetched_at: hoursAgo(5) },
      ],
    });
    const fetchImpl = feeds({
      TaylorSwift: [
        entry('a1', 'Rank the eras from best to worst', 5, 'TaylorSwift'),
        entry('a2', 'When did folklore come out', 8, 'TaylorSwift'),
        entry('a3', 'Easter egg theory about the album', 9, 'TaylorSwift'),
        entry('old', 'Rank the eras again', 70, 'TaylorSwift'),
        entry('seen1', 'Which era is best', 3, 'TaylorSwift'),
        entry('mega', 'Weekly Discussion Thread era talk', 3, 'TaylorSwift'),
        entry('pers', 'Travis engagement news reaction', 2, 'TaylorSwift'),
        entry('none', 'Taylor Swift and the Fall Months', 2, 'TaylorSwift'),
      ],
      swifties: [entry('b1', '10 years ago today, nostalgia hit', 6, 'swifties')],
      Spicy: [entry('c1', 'Rank the eras', 1, 'Spicy')],
    });
    const result = await run({ supabase, fetchImpl: fetchImpl as never });
    const subs = Object.fromEntries(
      result.perSub.map((s: { subreddit: string }) => [s.subreddit, s]),
    );
    expect(subs.Spicy.skipped).toBe('over18');
    expect(subs.TaylorSwift.rejected).toMatchObject({
      'too-old': 1,
      megathread: 1,
      'personal-life': 1,
      'no-fit': 1,
    });
    expect(result.kept).toBe(3); // 2 from TaylorSwift (per-sub run cap) + 1 from swifties
    const rows = supabase.inserted[0].rows as {
      community: string;
      kind: string;
      status: string;
      image_comments: string;
      image_ref: string;
      thread_id: string;
    }[];
    expect(rows.every((r) => r.kind === 'awareness_reply' && r.status === 'new')).toBe(true);
    expect(rows.filter((r) => r.community === 'TaylorSwift')).toHaveLength(2);
    expect(rows.find((r) => r.community === 'swifties')?.image_comments).toBe('text_only');
    expect(rows.some((r) => r.thread_id === 'seen1')).toBe(false);
    expect(rows.every((r) => /^(era|moment):/.test(r.image_ref))).toBe(true);
  });

  it('stays inside the request budget and rotates the optional sources between slots', async () => {
    const many = {
      ...config,
      subs: [...config.subs, ...['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({ name, tier: 2 }))],
    };
    const seen: string[][] = [];
    for (const hour of [0, 3, 6]) {
      const fetchImpl = feeds({});
      const result = await run({
        config: many,
        fetchImpl: fetchImpl as never,
        now: new Date(`2026-10-01T0${hour}:30:00Z`),
        dryRun: true,
      });
      expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(6);
      expect(result.perSource.map((s: { source: string }) => s.source)).toContain(
        'sub:TaylorSwift',
      );
      seen.push(result.perSource.map((s: { source: string }) => s.source));
    }
    expect(new Set(seen.flat()).size).toBeGreaterThan(6);
  });

  it('finds threads outside the fan subs through search RSS, with the strict Taylor filter and blocked subs', async () => {
    const fetchImpl = feeds({}, [
      entry('s1', 'Which Taylor Swift era is the best?', 4, 'popculturechat'),
      entry('s2', 'Best red lipstick ranking', 4, 'MakeupAddiction'),
      entry('s3', 'Taylor Swift era rankings', 4, 'Fauxmoi'),
      entry('s4', 'Taylor Swift era rankings', 4, 'SomeNSFWsub'),
    ]);
    const result = await run({
      fetchImpl: fetchImpl as never,
      dryRun: true,
      now: new Date('2026-10-01T03:30:00Z'),
    });
    expect(result.rows.map((r: { community: string }) => r.community)).toEqual(['popculturechat']);
    expect(result.rows[0].image_comments).toBe('unknown');
  });

  it('honours the per-sub daily budget already used today (4 + 1 for the big subs)', async () => {
    const supabase = fakeSupabase({
      todayCounts: ['TaylorSwift', 'TaylorSwift', 'TaylorSwift', 'TaylorSwift', 'TaylorSwift'],
    });
    const fetchImpl = feeds({
      TaylorSwift: [entry('a1', 'Rank the eras', 5, 'TaylorSwift')],
      swifties: [entry('b1', 'Rank the eras', 5, 'swifties')],
    });
    const result = await run({ supabase, fetchImpl: fetchImpl as never });
    expect(result.rows.map((r: { community: string }) => r.community)).toEqual(['swifties']);
    expect(dailyCapFor({ dailyCap: 4 }, config.defaults)).toBe(4);
    expect(dailyCapFor(undefined, config.defaults)).toBe(3);
  });

  it('caches a successful about.json reading and does not re-fetch it next run', async () => {
    const supabase = fakeSupabase();
    const fetchAbout = vi.fn(aboutOk);
    const fetchImpl = feeds({ TaylorSwift: [entry('a1', 'Rank the eras', 5, 'TaylorSwift')] });
    await run({ supabase, fetchImpl: fetchImpl as never, fetchAbout });
    expect(fetchAbout).toHaveBeenCalledTimes(1);
    expect(supabase.upserts[0]).toMatchObject({
      sub: 'TaylorSwift',
      image_comments: 'image',
      over18: false,
    });

    const cached = fakeSupabase({
      cache: [
        {
          sub: 'TaylorSwift',
          image_comments: 'text_only',
          over18: false,
          fetched_at: hoursAgo(24),
        },
      ],
    });
    const again = vi.fn(aboutOk);
    const result = await run({
      supabase: cached,
      fetchImpl: fetchImpl as never,
      fetchAbout: again,
    });
    expect(again).not.toHaveBeenCalled();
    expect(
      result.perSub.find((s: { subreddit: string }) => s.subreddit === 'TaylorSwift').imageComments,
    ).toBe('text_only');
  });

  it('remembers a blocked about.json so CI does not spend a request on it every run', async () => {
    const supabase = fakeSupabase();
    const blocked = vi.fn(async () => ({
      imageComments: 'unknown',
      over18: false,
      error: 'HTTP 403',
    }));
    const fetchImpl = feeds({ TaylorSwift: [entry('a1', 'Rank the eras', 5, 'TaylorSwift')] });
    await run({ supabase, fetchImpl: fetchImpl as never, fetchAbout: blocked });
    expect(supabase.upserts[0]).toMatchObject({ sub: '*blocked*', image_comments: 'unknown' });
    const next = fakeSupabase({
      cache: [
        { sub: '*blocked*', image_comments: 'unknown', over18: false, fetched_at: hoursAgo(3) },
      ],
    });
    const spy = vi.fn(async () => ({ imageComments: 'unknown', over18: false, error: 'HTTP 403' }));
    await run({ supabase: next, fetchImpl: fetchImpl as never, fetchAbout: spy });
    expect(spy).not.toHaveBeenCalled();
  });

  it('dry-run writes nothing and works without a database', async () => {
    const fetchImpl = feeds({ TaylorSwift: [entry('a1', 'Rank the eras', 5, 'TaylorSwift')] });
    const result = await run({ supabase: null, fetchImpl: fetchImpl as never, dryRun: true });
    expect(result).toMatchObject({ kept: 1, inserted: 0 });
  });

  it('a blocked feed is skipped, not a failure, and the run stops after repeated blocks', async () => {
    const fetchImpl = vi.fn(async () => new Response('blocked', { status: 429 }));
    const result = await run({ fetchImpl: fetchImpl as never, dryRun: true });
    expect(result.kept).toBe(0);
    expect(result.requests.aborted).toBe(true);
    expect(fetchImpl.mock.calls.length).toBeLessThan(6);
  });

  it('groups posts by community, dropping blocked subs', () => {
    const post = (id: string, sub: string) => ({
      id,
      rank: 1,
      permalink: `https://www.reddit.com/r/${sub}/comments/${id}/x/`,
    });
    const groups = groupByCommunity(
      [
        {
          source: { kind: 'search' },
          posts: [post('1', 'Music'), post('2', 'Fauxmoi'), post('3', 'Music')],
        },
        {
          source: { kind: 'sub', sub: { name: 'TaylorSwift' } },
          posts: [post('4', 'TaylorSwift')],
        },
      ],
      config,
    );
    expect([...groups.keys()]).toEqual(['Music', 'TaylorSwift']);
    expect(groups.get('Music')?.size).toBe(2);
  });

  it('shapes the lead row with no comment text and the sub image state', () => {
    const row = buildAwarenessRow({
      subreddit: 'TaylorSwift',
      post: {
        id: 'a1',
        title: 'Rank the eras',
        permalink: 'https://www.reddit.com/r/TaylorSwift/comments/a1/x/',
        rank: 2,
      },
      types: ['ranking'],
      ageHours: 5.2,
      imageRef: 'era:folklore',
      imageComments: 'unknown',
    });
    expect(row).toMatchObject({
      platform: 'reddit',
      kind: 'awareness_reply',
      thread_id: 'a1',
      image_ref: 'era:folklore',
      image_comments: 'unknown',
      thread_type: 'ranking',
      status: 'new',
    });
    expect(row.context).toContain('no bodies stored');
    expect(utcDayStart(NOW)).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('Facebook adoption', () => {
  it('adopts recent screened export leads that fit once, capped, with unknown image support', async () => {
    const leads = ['one', 'two', 'three', 'four', 'five'].map((w) => ({
      community: 'facebook:vault',
      locator: `Vault — ${w} rank the eras`,
      title: null,
    }));
    leads.push({
      community: 'facebook:vault',
      locator: 'Vault — my dog at the beach',
      title: null,
    });
    const supabase = fakeSupabase({ fbLeads: leads, fbExisting: [{ locator: leads[0].locator }] });
    const rows = await adoptFacebookLeads(supabase, { catalog, now: NOW, cap: 3 });
    expect(rows).toHaveLength(3);
    expect(
      rows.every(
        (r: { kind: string; image_comments: string; platform: string }) =>
          r.kind === 'awareness_reply' &&
          r.image_comments === 'unknown' &&
          r.platform === 'facebook',
      ),
    ).toBe(true);
    expect(rows.some((r: { locator: string }) => r.locator === leads[0].locator)).toBe(false);
    expect(rows.some((r: { locator: string }) => r.locator.includes('dog'))).toBe(false);
  });
});
