import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './rumor-lifecycle.mjs';

// Fixed clock so the age thresholds are deterministic.
const NOW = Date.parse('2026-07-20T00:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString().slice(0, 10);

function item(rumors: unknown[]) {
  return [
    {
      type: 'content',
      file: 'x.mjs',
      era: 'midnights',
      key: 'k',
      title: 'A moment',
      raw: { moment: { rumors } },
    },
  ];
}

describe('rumor-lifecycle', () => {
  it('flags a rumor that has never been re-checked', async () => {
    const f = await check(item([{ claim: 'c', status: 'unconfirmed', reportedOn: daysAgo(3) }]), { now: NOW });
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/never re-checked/);
  });

  it('escalates a never-checked rumor once it is also old', async () => {
    const fresh = await check(item([{ claim: 'c', status: 'unconfirmed', reportedOn: daysAgo(3) }]), { now: NOW });
    const old = await check(item([{ claim: 'c', status: 'unconfirmed', reportedOn: daysAgo(30) }]), { now: NOW });
    expect(fresh[0].severity).toBe('P2');
    expect(old[0].severity).toBe('P1');
  });

  it('proposes faded for a claim that is old AND has gone quiet', async () => {
    const f = await check(
      item([{ claim: 'c', status: 'unconfirmed', reportedOn: daysAgo(60), lastCheckedOn: daysAgo(30) }]),
      { now: NOW },
    );
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/gone quiet/);
  });

  it('flags an overdue re-check without proposing faded when the claim is recent', async () => {
    const f = await check(
      item([{ claim: 'c', status: 'unconfirmed', reportedOn: daysAgo(25), lastCheckedOn: daysAgo(22) }]),
      { now: NOW },
    );
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/re-check overdue/);
  });

  it('says nothing about a recently checked claim', async () => {
    const f = await check(
      item([{ claim: 'c', status: 'unconfirmed', reportedOn: daysAgo(10), lastCheckedOn: daysAgo(2) }]),
      { now: NOW },
    );
    expect(f).toEqual([]);
  });

  // Resolved claims stay on the page as a record but are never work again —
  // otherwise the queue grows without bound and the Rumor Desk drowns.
  it.each(['confirmed', 'debunked', 'faded'])('never re-queues a %s claim', async (status) => {
    const f = await check(
      item([{ claim: 'c', status, reportedOn: daysAgo(400), lastCheckedOn: daysAgo(400) }]),
      { now: NOW },
    );
    expect(f).toEqual([]);
  });

  it('ignores items with no rumors', async () => {
    expect(await check(item([]), { now: NOW })).toEqual([]);
    expect(await check([{ type: 'content', file: 'x', era: 'e', key: 'k', title: 't', raw: {} }], { now: NOW })).toEqual([]);
  });

  it('does not crash on malformed entries', async () => {
    const f = await check(item([null, 'nope', { status: 'unconfirmed' }]), { now: NOW });
    expect(Array.isArray(f)).toBe(true);
  });
});

// ── Moment-level confidence (the page banner) ──────────────────────────────
// Added 2026-07-21. Wyatt: "I don't think Lex will be reading all articles
// every night, might make sense to add that to Karen or someone else's scope
// to explicitly check if the banner status is still accurate."
describe('moment-level confidence staleness', () => {
  const NOW = Date.parse('2026-07-21T00:00:00Z');
  const item = (confidence: string | undefined, accessed: string[]) => ({
    type: 'moment',
    file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
    era: 'the-life-of-a-showgirl',
    key: 'k',
    title: 'The wedding gown: a custom Dior Haute Couture',
    raw: { moment: { confidence, sources: accessed.map((a) => ({ accessed_at: a })) } },
  });

  const bannerFindings = async (it: unknown) =>
    (await check([it as never], { now: NOW })).filter((f: { itemRef: { field: string } }) => f.itemRef.field === 'confidence');

  it('flags the real case: a sub-confirmed banner whose newest source is old', async () => {
    // #1022 — gown page framed "Reported — not confirmed", sources 2026-07-09.
    const found = await bannerFindings(item('reputable_reporting', ['2026-06-01', '2026-05-02']));
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe('P1');
    expect(found[0].evidence).toContain('not-confirmed banner');
  });

  it('stays quiet when someone has looked recently', async () => {
    expect(await bannerFindings(item('reputable_reporting', ['2026-07-18']))).toEqual([]);
  });

  it('uses the NEWEST source, not the oldest — one fresh check is enough', async () => {
    expect(await bannerFindings(item('reputable_reporting', ['2019-01-01', '2026-07-20']))).toEqual([]);
  });

  it('ignores confirmed pages — they render no banner to go stale', async () => {
    expect(await bannerFindings(item('confirmed', ['2020-01-01']))).toEqual([]);
    expect(await bannerFindings(item(undefined, ['2020-01-01']))).toEqual([]);
  });

  it('flags a sub-confirmed page with no accessed_at at all', async () => {
    const found = await bannerFindings(item('plausible', []));
    expect(found).toHaveLength(1);
    expect(found[0].evidence).toContain('no evidence anyone has ever re-verified');
  });
});
