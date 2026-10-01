import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  awarenessEnabled,
  buildAwarenessRow,
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

function entry(id: string, title: string, hours: number) {
  return `<entry><id>t3_${id}</id><link href="https://www.reddit.com/r/X/comments/${id}/t/" /><title>${title}</title><updated>${hoursAgo(hours)}</updated></entry>`;
}
const atom = (entries: string[]) =>
  `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join('')}</feed>`;

function feeds(bySub: Record<string, string[]>) {
  return vi.fn(async (url: string) => {
    const sub = /\/r\/([^/]+)\//.exec(String(url))?.[1] ?? '';
    return new Response(atom(bySub[sub] ?? []), { status: 200 });
  });
}

const config = {
  defaults: { maxAgeHours: 48, perSubScanCapPerRun: 2, perSubDailyCandidateCap: 4, feedLimit: 25 },
  subs: [
    { name: 'TaylorSwift', tier: 1 },
    { name: 'swifties', tier: 1 },
    { name: 'Spicy', tier: 3 },
  ],
};
const aboutOk = async (name: string) =>
  name === 'Spicy'
    ? { imageComments: 'unknown', over18: true }
    : { imageComments: name === 'swifties' ? 'text_only' : 'image', over18: false };

function fakeSupabase({
  known = [] as string[],
  todayCounts = [] as string[],
  fbLeads = [] as unknown[],
  fbExisting = [] as unknown[],
} = {}) {
  const inserted: { rows: unknown }[] = [];
  return {
    inserted,
    from(table: string) {
      void table;
      const ctx: { platform?: string; kind?: string } = {};
      const builder: Record<string, unknown> = {
        select: () => builder,
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
    const supabase = fakeSupabase({ known: ['seen1'] });
    const fetchImpl = feeds({
      TaylorSwift: [
        entry('a1', 'Rank the eras from best to worst', 5),
        entry('a2', 'When did folklore come out', 8),
        entry('a3', 'Easter egg theory about the album', 9),
        entry('old', 'Rank the eras again', 70),
        entry('seen1', 'Which era is best', 3),
        entry('mega', 'Weekly Discussion Thread era talk', 3),
        entry('pers', 'Travis engagement news reaction', 2),
        entry('none', 'Taylor Swift and the Fall Months', 2),
      ],
      swifties: [entry('b1', '10 years ago today, nostalgia hit', 6)],
      Spicy: [entry('c1', 'Rank the eras', 1)],
    });
    const result = await runAwarenessScan({
      supabase,
      config,
      catalog,
      fetchImpl: fetchImpl as never,
      fetchAbout: aboutOk,
      now: NOW,
      sleep: async () => {},
      warn: () => {},
    });
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
    expect(subs.TaylorSwift.unseen).toBe(3);
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

  it('honours the per-sub daily candidate budget already used today', async () => {
    const supabase = fakeSupabase({
      todayCounts: ['TaylorSwift', 'TaylorSwift', 'TaylorSwift', 'TaylorSwift'],
    });
    const fetchImpl = feeds({
      TaylorSwift: [entry('a1', 'Rank the eras', 5)],
      swifties: [entry('b1', 'Rank the eras', 5)],
    });
    const result = await runAwarenessScan({
      supabase,
      config,
      catalog,
      fetchImpl: fetchImpl as never,
      fetchAbout: aboutOk,
      now: NOW,
      sleep: async () => {},
      warn: () => {},
    });
    expect(result.rows.map((r: { community: string }) => r.community)).toEqual(['swifties']);
  });

  it('dry-run writes nothing and works without a database', async () => {
    const fetchImpl = feeds({ TaylorSwift: [entry('a1', 'Rank the eras', 5)] });
    const result = await runAwarenessScan({
      supabase: null,
      config,
      catalog,
      fetchImpl: fetchImpl as never,
      fetchAbout: aboutOk,
      now: NOW,
      sleep: async () => {},
      warn: () => {},
      dryRun: true,
    });
    expect(result).toMatchObject({ kept: 1, inserted: 0 });
  });

  it('a blocked feed is a logged skip, not a failure', async () => {
    const warn = vi.fn();
    const fetchImpl = vi.fn(async () => new Response('blocked', { status: 403 }));
    const result = await runAwarenessScan({
      supabase: null,
      config,
      catalog,
      fetchImpl: fetchImpl as never,
      fetchAbout: aboutOk,
      now: NOW,
      sleep: async () => {},
      warn,
      dryRun: true,
    });
    expect(result.kept).toBe(0);
    expect(warn).toHaveBeenCalled();
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
