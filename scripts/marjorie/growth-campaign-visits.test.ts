import { describe, expect, it } from 'vitest';
// @ts-expect-error untyped mjs
import { fetchCampaignVisits, summarizeCampaignVisits } from './lib/growth-campaign-visits.mjs';
// @ts-expect-error untyped mjs
import { socialSummary } from './lib/growth-data.mjs';

const win = { startMs: Date.parse('2026-10-03T23:59:59.999Z'), endMs: Date.parse('2026-10-10T23:59:59.999Z'), start: '', end: '' };

function fakeDb(result: { data?: unknown; error?: unknown }) {
  const calls: Array<[string, ...unknown[]]> = [];
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'like', 'gt', 'lte']) q[m] = (...a: unknown[]) => { calls.push([m, ...a]); return m === 'lte' ? Promise.resolve(result) : q; };
  return { db: { from: (t: string) => { calls.push(['from', t]); return q; } }, calls };
}

describe('first-party campaign visits (#4719)', () => {
  it('sums usage_daily days per family, ignoring other scopes', () => {
    const rows = summarizeCampaignVisits([
      { scope: 'utm-visit:thread', call_count: 3 }, { scope: 'utm-visit:thread', call_count: 4 },
      { scope: 'utm-visit:mood', call_count: 1 }, { scope: 'clown-chat:u1', call_count: 99 }, { scope: 'utm-visit:bad', call_count: 'x' },
    ]);
    expect(rows).toEqual([{ campaign: 'thread', pageviews: 7, visitors: null }, { campaign: 'mood', pageviews: 1, visitors: null }]);
  });

  it('queries exactly the 7 UTC days of the window', async () => {
    const { db, calls } = fakeDb({ data: [{ scope: 'utm-visit:launch', call_count: 2 }] });
    const out = await fetchCampaignVisits(db, win);
    expect(out.rows).toEqual([{ campaign: 'launch', pageviews: 2, visitors: null }]);
    expect(calls).toContainEqual(['gt', 'usage_date', '2026-10-03']);
    expect(calls).toContainEqual(['lte', 'usage_date', '2026-10-10']);
  });

  it('degrades: no client or a failed read is null with a reason; an empty week is a real zero', async () => {
    expect((await fetchCampaignVisits(null, win)).rows).toBeNull();
    const failed = await fetchCampaignVisits(fakeDb({ error: new Error('boom') }).db, win);
    expect(failed.rows).toBeNull();
    expect(failed.note).toMatch(/boom/);
    expect((await fetchCampaignVisits(fakeDb({ data: [] }).db, win)).rows).toEqual([]);
    expect((await fetchCampaignVisits(fakeDb({ error: new Error('relation does not exist') }).db, win)).rows).toEqual([]);
  });

  it('socialSummary reads first-party rows when Vercel traffic is null; zero stays 0, uncollected stays null', () => {
    const posted = [{ platform: 'x', postedAt: '2026-10-08T00:00:00Z', campaign: 'thread:a:b' }];
    const w = { startMs: Date.parse('2026-10-03T00:00:00Z'), endMs: Date.parse('2026-10-10T00:00:00Z') };
    const none = { traffic: null, trafficNote: 'n' };
    const got = socialSummary(posted, [], none, w, { rows: [{ campaign: 'thread', pageviews: 5, visitors: null }], note: 'first-party' });
    expect(got.byCampaign.thread).toMatchObject({ pageviews: 5, visitors: null });
    expect(got.visitsNote).toBe('first-party');
    const zero = socialSummary(posted, [], none, w, { rows: [], note: 'first-party' });
    expect(zero.byCampaign.thread).toMatchObject({ pageviews: 0, visitors: null });
    const failed = socialSummary(posted, [], none, w, { rows: null, note: 'Campaign visits not collected: boom' });
    expect(failed.byCampaign.thread).toMatchObject({ pageviews: null, visitors: null });
    expect(failed.visitsNote).toMatch(/boom/);
  });
});
