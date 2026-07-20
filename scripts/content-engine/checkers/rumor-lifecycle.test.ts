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
