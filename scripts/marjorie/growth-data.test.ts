import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { collect, parseArgs, readJsonTree } from './growth-data.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { followerDeltas, postsSummary, weekWindow, trafficSection, contentSummary, socialSummary } from './lib/growth-data.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { keywordsOf, referencesIssue, textMatches, timeSensitiveCoverage, treeAsksSummary } from './lib/growth-coverage.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { fetchTraffic, NO_TOKEN_NOTE } from './lib/growth-traffic.mjs';

const NOW = Date.parse('2026-09-30T12:00:00Z');
const win = weekWindow(undefined, NOW);
const H = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe('weekWindow', () => {
  it('is 7 days ending now, or the end of --week-ending', () => {
    expect(win.endMs - win.startMs).toBe(7 * 24 * H);
    expect(weekWindow('2026-09-27', NOW).end).toBe('2026-09-27T23:59:59.999Z');
    expect(() => weekWindow('nope', NOW)).toThrow(/bad --week-ending/);
  });
});

describe('followerDeltas', () => {
  const snap = (date: string, x: number | null, instagram: number | null) => ({ date, followers: { x, instagram, facebook: 10 } });
  it('deltas per platform against the newest snapshot at or before the window start', () => {
    const out = followerDeltas([snap('2026-09-22', 1, 3), snap('2026-09-30', 2, 7)], win);
    expect(out.partial).toBe(false);
    expect(out.platforms.x).toEqual({ start: 1, end: 2, delta: 1 });
    expect(out.platforms.instagram.delta).toBe(4);
    expect(out.platforms.facebook.delta).toBe(0);
  });
  it('flags a young series as partial and uses the oldest in-window snapshot', () => {
    const out = followerDeltas([snap('2026-09-27', 1, 3), snap('2026-09-30', 1, 5)], win);
    expect(out.partial).toBe(true);
    expect(out.startDate).toBe('2026-09-27');
    expect(out.platforms.instagram.delta).toBe(2);
  });
  it('null, never 0, when a platform is missing or there is one snapshot', () => {
    expect(followerDeltas([snap('2026-09-22', null, 3), snap('2026-09-30', 2, 5)], win).platforms.x.delta).toBeNull();
    expect(followerDeltas([snap('2026-09-30', 2, 5)], win).platforms.instagram.delta).toBeNull();
    expect(followerDeltas([], win).endDate).toBeNull();
  });
});

describe('postsSummary', () => {
  const post = (platform: string, ago: number, extra = {}) => ({ platform, postedAt: iso(NOW - ago * H), campaign: `c-${ago}`, ...extra });
  it('counts this week vs the week before and sums engagement', () => {
    const posted = [post('x', 10), post('instagram', 30), post('x', 24 * 8)];
    const metrics = [{ platform: 'instagram', campaign: 'c-30', postedAt: posted[1].postedAt, like_count: 4, comments_count: 1 }];
    const out = postsSummary(posted, metrics, win);
    expect(out.thisWeek.total).toBe(2);
    expect(out.previousWeek.total).toBe(1);
    expect(out.items).toHaveLength(2);
    expect(out.engagement).toMatchObject({ measuredPosts: 1, likes: 4, comments: 1, top: { campaign: 'c-30' } });
  });
  it('an empty week is zeros, not an error', () => {
    const out = postsSummary([], [], win);
    expect(out.thisWeek.total).toBe(0);
    expect(out.engagement.top).toBeNull();
  });
});

describe('time-sensitive coverage', () => {
  const issue = (number: number, title: string, createdAgoH: number, extra = {}) => ({ number, title, state: 'OPEN', createdAt: iso(NOW - createdAgoH * H), closedAt: null, ...extra });
  it('extracts quoted phrases first, proper nouns otherwise, never "Taylor Swift"', () => {
    expect(keywordsOf("intake: Taylor Swift's 'Patient Zero' single cover art draws backlash")).toEqual({ mode: 'phrase', words: ['patient zero'] });
    const w = keywordsOf('intake: Taylor Swift extends VMAs record, dedicates Video of the Year');
    expect(w.mode).toBe('words');
    expect(w.words).toContain('vmas');
    expect(w.words).not.toContain('taylor');
    expect(textMatches('Patient Zero is out', { mode: 'phrase', words: ['patient zero'] })).toBe(true);
    expect(textMatches('only vmas here', w)).toBe(false);
  });
  it('classifies covered / site-only / social-only / pending / late / missed', () => {
    const issues = [
      issue(1, "intake: 'Alpha Song' drops", 100, { state: 'CLOSED', closedAt: iso(NOW - 90 * H) }),
      issue(2, "intake: 'Beta Song' drops", 100, { state: 'CLOSED', closedAt: iso(NOW - 90 * H) }),
      issue(3, "intake: 'Gamma Song' drops", 100),
      issue(4, "intake: 'Delta Song' drops", 10),
      issue(5, "intake: 'Epsilon Song' drops", 120),
      issue(6, "intake: 'Zeta Song' drops", 120, { state: 'CLOSED', closedAt: iso(NOW - 10 * H) }),
      issue(8, "intake: 'Iota Song' drops", 100),
      { number: 7, title: 'codify: not an event', state: 'OPEN', createdAt: iso(NOW - 5 * H) },
    ];
    const posted = [
      { platform: 'x', postedAt: iso(NOW - 80 * H), body: 'alpha song is here', campaign: 'a' },
      { platform: 'x', postedAt: iso(NOW - 60 * H), body: 'gamma song is here', campaign: 'g' },
      { platform: 'x', postedAt: iso(NOW - 20 * H), body: 'epsilon song, late', campaign: 'e' },
      { platform: 'x', postedAt: iso(NOW - 40 * H), body: 'iota song, late', campaign: 'i' },
    ];
    const out = timeSensitiveCoverage(issues, posted, win);
    const status = Object.fromEntries(out.items.map((e: { number: number; status: string }) => [e.number, e.status]));
    expect(status).toEqual({ 1: 'covered', 2: 'site-only', 3: 'social-only', 4: 'pending', 5: 'late', 6: 'late', 8: 'late' });
    expect(out.items.find((e: { number: number }) => e.number === 7)).toBeUndefined();
    expect(out.coverageHours).toBe(48);
  });
  it('counts a merged PR that references the intake issue as verified site coverage', () => {
    const issues = [issue(1, "intake: 'Alpha Song' drops", 100), issue(2, "intake: 'Beta Song' drops", 100, { state: 'CLOSED', closedAt: iso(NOW - 90 * H) }), issue(3, "intake: 'Gamma Song' drops", 100)];
    const prs = [
      { number: 50, title: 'content: alpha', body: 'Closes #1', mergedAt: iso(NOW - 80 * H) },
      { number: 51, title: 'unrelated', body: 'mentions #11 only', mergedAt: iso(NOW - 70 * H) },
      { number: 52, title: 'x', body: '', mergedAt: iso(NOW - 60 * H), closingIssuesReferences: [{ number: 3 }] },
    ];
    const out = timeSensitiveCoverage(issues, [], win, prs);
    const by = Object.fromEntries(out.items.map((e: { number: number }) => [e.number, e]));
    expect(by[1]).toMatchObject({ status: 'site-only', siteSource: 'pr-merged', siteStateUnverified: false, mergedPR: { number: 50, hoursAfter: 20 } });
    expect(by[2]).toMatchObject({ siteSource: 'issue-closed', siteStateUnverified: true });
    expect(by[3]).toMatchObject({ siteSource: 'pr-merged', siteStateUnverified: false });
    expect(out.siteStateUnverified).toBe(1);
    expect(referencesIssue(prs[1], 1)).toBe(false);
  });
  it('flags every site verdict unverified when the PR list could not be read', () => {
    const out = timeSensitiveCoverage([issue(1, "intake: 'Alpha Song' drops", 10)], [], win, null);
    expect(out.items[0].siteStateUnverified).toBe(true);
    expect(out.siteStateUnverified).toBe(1);
  });
  it('carries over still-open events from the prior week but not closed ones', () => {
    const old = (n: number, state: string) => issue(n, `intake: 'Old ${n}' news`, 24 * 9, { state });
    const out = timeSensitiveCoverage([old(1, 'OPEN'), old(2, 'CLOSED')], [], win);
    expect(out.items.map((e: { number: number }) => e.number)).toEqual([1]);
    expect(out.items[0]).toMatchObject({ carriedOver: true, status: 'missed' });
  });
});

describe('treeAsksSummary', () => {
  const ask = (number: number, ageDays: number, state = 'OPEN', closedAgoH?: number) => ({
    number, title: `Tree → Marjorie: ask ${number}`, state, labels: [{ name: 'desk:ops' }, { name: 'tree-filed' }],
    createdAt: iso(NOW - ageDays * 24 * H), closedAt: closedAgoH ? iso(NOW - closedAgoH * H) : null,
  });
  it('reports open asks oldest-first with age, plus opened/closed this week', () => {
    const out = treeAsksSummary({ treeFiled: [ask(3, 1), ask(1, 16), ask(2, 20, 'CLOSED', 5)], marjorieFiledForTree: [] }, win);
    expect(out.fromTree).toMatchObject({ open: 2, oldestOpenDays: 16, openedInWindow: 1, closedInWindow: 1 });
    expect(out.fromTree.items.map((i: { number: number }) => i.number)).toEqual([1, 3]);
    expect(out.fromTree.items[0].title).toBe('ask 1');
    expect(out.toTree).toMatchObject({ open: 0, oldestOpenDays: null });
  });
});

describe('traffic', () => {
  const ctx = { token: 'tok_SECRET', projectId: 'prj_1', teamId: 'team_1', win };
  const respond = (data: unknown, ok = true, status = 200) => ({ ok, status, json: async () => ({ version: 1, query: {}, data }) });
  function fakeApi() {
    const urls: string[] = [];
    const fetchImpl = vi.fn(async (url: URL, init: { headers: { authorization: string } }) => {
      urls.push(String(url));
      expect(init.headers.authorization).toBe('Bearer tok_SECRET');
      const u = new URL(String(url));
      if (u.pathname.endsWith('/count')) {
        return respond(Number(u.searchParams.get('since')) < win.startMs ? { pageviews: 20, visitors: 15 } : { pageviews: 50, visitors: 39 });
      }
      const by = u.searchParams.get('by');
      return respond(by === 'requestPath'
        ? [{ requestPath: '/', pageviews: 30, visitors: 25 }, { requestPath: 'Others', pageviews: 3, visitors: 3 }, { requestPath: '/eras/folklore', pageviews: 12, visitors: 9 }]
        : [{ referrerHostname: 'google.com', pageviews: 5, visitors: 5 }, { referrerHostname: '', pageviews: 40, visitors: 30 }]);
    });
    return { fetchImpl, urls };
  }
  it('is null with a reason when there is no token, project or the API fails — never an estimate', async () => {
    expect(trafficSection().traffic).toBeNull();
    expect(await fetchTraffic({ ...ctx, token: undefined })).toEqual({ traffic: null, trafficNote: NO_TOKEN_NOTE });
    expect((await fetchTraffic({ ...ctx, projectId: undefined })).traffic).toBeNull();
    const bad = await fetchTraffic({ ...ctx, fetchImpl: (async () => respond({}, false, 403)) as never });
    expect(bad.traffic).toBeNull();
    expect(bad.trafficNote).toMatch(/HTTP 403/);
    const odd = await fetchTraffic({ ...ctx, fetchImpl: (async () => respond({ nope: 1 })) as never });
    expect(odd.traffic).toBeNull();
  });
  it('never leaks the token into the note when a request throws with it in the message', async () => {
    const out = await fetchTraffic({ ...ctx, fetchImpl: (async () => { throw new Error('boom tok_SECRET'); }) as never });
    expect(out.traffic).toBeNull();
    expect(JSON.stringify(out)).not.toContain('tok_SECRET');
  });
  it('collects this week, the prior week and top paths/referrers from the documented endpoints', async () => {
    const { fetchImpl, urls } = fakeApi();
    const out = await fetchTraffic({ ...ctx, fetchImpl: fetchImpl as never });
    expect(out.traffic).toMatchObject({ source: 'vercel-web-analytics', visitors: 39, pageviews: 50, previousWeek: { visitors: 15, pageviews: 20 } });
    expect(out.traffic.topPaths).toEqual([{ path: '/', pageviews: 30, visitors: 25 }, { path: '/eras/folklore', pageviews: 12, visitors: 9 }]);
    expect(out.traffic.topReferrers[0]).toEqual({ referrer: '(direct)', pageviews: 40, visitors: 30 });
    expect(urls.every((u) => u.startsWith('https://api.vercel.com/v1/query/web-analytics/visits/'))).toBe(true);
    expect(urls.every((u) => u.includes('projectId=prj_1') && u.includes('teamId=team_1'))).toBe(true);
    expect(urls.some((u) => u.includes('/aggregate?') && u.includes('by=requestPath'))).toBe(true);
  });
  it('collect() passes VERCEL_TOKEN from env only, and without a token reports null with the reason', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'growth-traffic-'));
    const gh = vi.fn(async () => ({ stdout: '[]' }));
    const fetchContent = vi.fn(async () => []);
    const { fetchImpl } = fakeApi();
    const withToken = await collect({ root, nowMs: NOW, gh, fetchContent, env: { VERCEL_TOKEN: 'tok_SECRET', VERCEL_PROJECT_ID: 'prj_1' }, fetchImpl });
    expect(withToken.traffic).toMatchObject({ visitors: 39 });
    expect(JSON.stringify(withToken)).not.toContain('tok_SECRET');
    const without = await collect({ root, nowMs: NOW, gh, fetchContent, env: {}, fetchImpl });
    expect(without.traffic).toBeNull();
    expect(without.trafficNote).toBe(NO_TOKEN_NOTE);
  });
});

describe('contentSummary', () => {
  it('maps merged content PRs to eras', () => {
    const erasTouched = (files: string[]) => ({ eras: files.some((f) => f.includes('folklore')) ? ['folklore'] : [], unmapped: [] });
    const out = contentSummary([{ pr: { number: 9, title: 'vault: x', mergedAt: 'm' }, files: ['supabase/seed/content/folklore.mjs'] }], erasTouched);
    expect(out).toEqual({ mergedContentPRs: 1, items: [{ number: 9, title: 'vault: x', mergedAt: 'm', eras: ['folklore'], files: 1 }] });
  });
});

describe('collect + CLI helpers', () => {
  function fixtureRoot() {
    const root = mkdtempSync(path.join(tmpdir(), 'growth-data-'));
    for (const d of ['social/metrics/posts/2026-09', 'social/posted', 'social/state']) mkdirSync(path.join(root, d), { recursive: true });
    writeFileSync(path.join(root, 'social/metrics/2026-09-22.json'), JSON.stringify({ date: '2026-09-22', followers: { x: 0, instagram: 3, facebook: 10 } }));
    writeFileSync(path.join(root, 'social/metrics/2026-09-30.json'), JSON.stringify({ date: '2026-09-30', followers: { x: 0, instagram: 4, facebook: 10 } }));
    writeFileSync(path.join(root, 'social/metrics/posts/2026-09/1.json'), JSON.stringify({ postId: '1', platform: 'instagram', postedAt: iso(NOW - 5 * H), like_count: 2, comments_count: 0 }));
    writeFileSync(path.join(root, 'social/metrics/posts/2026-09/bad.json'), '{not json');
    writeFileSync(path.join(root, 'social/posted/a.json'), JSON.stringify({ platform: 'instagram', postedAt: iso(NOW - 5 * H), campaign: 'c', body: 'hi' }));
    writeFileSync(path.join(root, 'social/state/event-status.json'), JSON.stringify({ mode: 'normal' }));
    return root;
  }

  it('assembles every section offline with --no-gh and says GitHub was skipped', async () => {
    const out = await collect({ root: fixtureRoot(), nowMs: NOW, noGh: true, env: {} });
    expect(out.followers.platforms.instagram.delta).toBe(1);
    expect(out.posts.thisWeek.total).toBe(1);
    expect(out.posts.engagement.likes).toBe(2);
    expect(out.eventStatus).toEqual({ mode: 'normal' });
    expect(out.traffic).toBeNull();
    expect(out.warnings.join(' ')).toMatch(/--no-gh/);
  });

  it('a GitHub outage in one section becomes a warning, not a crash', async () => {
    const gh = vi.fn(async () => { throw new Error('HTTP 502'); });
    const fetchContent = vi.fn(async () => { throw new Error('gh pr list failed'); });
    const out = await collect({ root: fixtureRoot(), nowMs: NOW, gh, fetchContent, env: {} });
    expect(out.timeSensitive.events).toBe(0);
    expect(out.warnings.filter((w: string) => /HTTP 502|gh pr list failed/.test(w)).length).toBeGreaterThanOrEqual(3);
    expect(out.followers.platforms.instagram.end).toBe(4);
  });

  it('reads json recursively and skips unreadable files; parses flags', () => {
    expect(readJsonTree(path.join(fixtureRoot(), 'social/metrics')).length).toBe(3);
    expect(parseArgs(['--week-ending', '2026-09-27', '--no-gh'])).toEqual({ 'week-ending': '2026-09-27', 'no-gh': true });
  });
});

describe('social.byCampaign (S3)', () => {
  const posted = [
    { platform: 'instagram', postedAt: iso(NOW - 2 * 24 * H), campaign: 'thread:love-story:quiz-poll:2026-09' },
    { platform: 'x', postedAt: iso(NOW - 3 * 24 * H), campaign: 'thread:fashion:quiz' },
    { platform: 'instagram', postedAt: iso(NOW - 1 * 24 * H), campaign: 'mood:chip-poll' },
    { platform: 'instagram', postedAt: iso(NOW - 20 * 24 * H), campaign: 'thread:old:x' },
  ];
  const postMetrics = [
    { postedAt: iso(NOW - 2 * 24 * H), campaign: 'thread:love-story:quiz-poll:2026-09', like_count: 4, comments_count: 1, reach: 300, saved: 7, shares: 2 },
    { postedAt: iso(NOW - 1 * 24 * H), campaign: 'mood:chip-poll', like_count: 1, comments_count: 0, reach: null },
  ];
  const traffic = { traffic: { topCampaigns: [{ campaign: 'thread', visitors: 12, pageviews: 20 }, { campaign: 'launch', visitors: 3, pageviews: 3 }] }, trafficNote: 'n' };

  it('joins posts, Instagram insights and site visits per campaign family; uncollected figures stay null', () => {
    const out = socialSummary(posted, postMetrics, traffic, win);
    expect(out.byCampaign.thread).toEqual({ posts: 2, measuredPosts: 1, reach: 300, saved: 7, shares: 2, likes: 4, comments: 1, visitors: 12, pageviews: 20 });
    expect(out.byCampaign.mood).toMatchObject({ posts: 1, reach: null, visitors: 0, pageviews: 0 });
    expect(out.byCampaign.launch).toMatchObject({ posts: 0, visitors: 3 });
    expect(out.visitsNote).toMatch(/utmMedium=social/);
  });
  it('leaves visits null (not 0) and says why when traffic or the campaign query was unavailable', () => {
    const none = socialSummary(posted, postMetrics, { traffic: null, trafficNote: 'Traffic not collected: no token' }, win);
    expect(none.byCampaign.thread).toMatchObject({ visitors: null, pageviews: null });
    expect(none.visitsNote).toBe('Traffic not collected: no token');
    const failed = socialSummary(posted, postMetrics, { traffic: { topCampaigns: null, campaignNote: 'Campaign visits not collected: HTTP 403' } }, win);
    expect(failed.byCampaign.thread.visitors).toBeNull();
    expect(failed.visitsNote).toMatch(/HTTP 403/);
  });
  it('fetchTraffic asks for utmCampaign filtered to social links, and degrades only that section on failure', async () => {
    const urls: string[] = [];
    const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
    const make = (campaignFails: boolean) => async (url: URL) => {
      const u = new URL(String(url));
      urls.push(String(url));
      if (u.pathname.endsWith('/count')) return ok({ pageviews: 5, visitors: 4 });
      const by = u.searchParams.get('by');
      if (by === 'utmCampaign') return campaignFails ? { ok: false, status: 403, json: async () => ({}) } : ok([{ utmCampaign: 'thread', pageviews: 9, visitors: 6 }, { utmCampaign: 'Others', pageviews: 1, visitors: 1 }]);
      return ok(by === 'requestPath' ? [{ requestPath: '/', pageviews: 5, visitors: 4 }] : []);
    };
    const ctx = { token: 'tok_SECRET', projectId: 'prj_1', win };
    const good = await fetchTraffic({ ...ctx, fetchImpl: make(false) as never });
    expect(good.traffic.topCampaigns).toEqual([{ campaign: 'thread', pageviews: 9, visitors: 6 }]);
    const call = new URL(urls.find((u) => u.includes('by=utmCampaign')) as string);
    expect(call.searchParams.get('filter')).toBe("utmMedium eq 'social'");
    const degraded = await fetchTraffic({ ...ctx, fetchImpl: make(true) as never });
    expect(degraded.traffic).toMatchObject({ visitors: 4, topCampaigns: null });
    expect(degraded.traffic.campaignNote).toMatch(/HTTP 403/);
    expect(JSON.stringify(degraded)).not.toContain('tok_SECRET');
  });
});
