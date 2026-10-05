import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { admin: true, data: { verdict: 'new', n: 1, sources: 1 } as unknown, error: null as null | { code: string }, throws: false };
const rpc = vi.fn(async (..._args: unknown[]) => {
  if (state.throws) throw new Error('net');
  return { data: state.data, error: state.error };
});
vi.mock('../../../lib/supabase-server', () => ({ supabaseAdmin: () => (state.admin ? { rpc } : null) }));

import { hashIp } from './feedback-quota';
import { claimWatchdogReport, WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY } from './watchdog-dedupe';

const report = { platform: 'ios', buildKey: '42:embedded', category: 'protocol' } as const;
const NEW = { verdict: 'new', n: 1, sources: 1 };

// Mirrors claim_watchdog_report (20261004220000) so the threshold semantics are pinned in one place.
function fakeClaim() {
  const ips = new Set<string>();
  const row = { n: 0, sources: 0, last: 1 };
  return (hash: string) => {
    const fresh = row.n === 0;
    row.n += 1;
    const sourceAdded = !ips.has(hash);
    if (sourceAdded) {
      ips.add(hash);
      if (!fresh) row.sources += 1;
    }
    if (fresh) {
      row.sources = 1;
      return { verdict: 'new', n: 1, sources: 1 };
    }
    const hit = ([5, 25, 100].includes(row.n) || (sourceAdded && [3, 10].includes(row.sources))) && row.n > row.last;
    if (hit) row.last = row.n;
    return { verdict: hit ? 'escalate' : 'duplicate', n: row.n, sources: row.sources };
  };
}

describe('watchdog durable dedupe client', () => {
  beforeEach(() => {
    Object.assign(state, { admin: true, data: NEW, error: null, throws: false });
    rpc.mockClear();
  });

  it('claims through one RPC with the UTC day, the cap and the hashed IP', async () => {
    expect(await claimWatchdogReport(report, '1.2.3.4', new Date('2026-10-04T23:59:00Z'))).toEqual(NEW);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('claim_watchdog_report', {
      p_day: '2026-10-04',
      p_build_key: '42:embedded',
      p_category: 'protocol',
      p_max: WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY,
      p_ip_hash: hashIp('1.2.3.4'),
    });
  });

  it('maps duplicate, capped and escalate outcomes with their counts', async () => {
    state.data = { verdict: 'duplicate', n: 2, sources: 1 };
    expect(await claimWatchdogReport(report, 'ip')).toEqual({ verdict: 'duplicate', n: 2, sources: 1 });
    state.data = { verdict: 'capped', n: 1, sources: 1 };
    expect((await claimWatchdogReport(report, 'ip')).verdict).toBe('capped');
    state.data = { verdict: 'escalate', n: 5, sources: 4 };
    expect(await claimWatchdogReport(report, 'ip')).toEqual({ verdict: 'escalate', n: 5, sources: 4 });
  });

  it('an rpc error, throw, bad shape (incl. the old text return) or missing config falls back to the new-shape default', async () => {
    state.admin = false;
    expect(await claimWatchdogReport(report, 'ip')).toEqual(NEW);
    state.admin = true;
    state.error = { code: 'x' };
    expect(await claimWatchdogReport(report, 'ip')).toEqual(NEW);
    state.error = null;
    state.throws = true;
    expect(await claimWatchdogReport(report, 'ip')).toEqual(NEW);
    state.throws = false;
    for (const bad of ['duplicate', 'weird', { verdict: 'weird' }, null]) {
      state.data = bad;
      expect(await claimWatchdogReport(report, 'ip')).toEqual(NEW);
    }
  });
});

describe('claim_watchdog_report threshold semantics', () => {
  it('a forged first report plus 5 genuine distinct sources escalates with counts', () => {
    const claim = fakeClaim();
    expect(claim('forged').verdict).toBe('new');
    const out = ['a', 'b', 'c', 'd', 'e'].map((h) => claim(h));
    expect(out.map((o) => o.verdict)).toEqual(['duplicate', 'escalate', 'duplicate', 'escalate', 'duplicate']);
    expect(out[1]).toMatchObject({ n: 3, sources: 3 });
    expect(out[3]).toMatchObject({ n: 5, sources: 5 });
  });

  it('the same IP repeated raises n but not sources, and each threshold fires once', () => {
    const claim = fakeClaim();
    const verdicts = Array.from({ length: 30 }, () => claim('same'));
    expect(verdicts.every((v) => v.sources === 1)).toBe(true);
    const fired = verdicts.map((v, i) => (v.verdict === 'escalate' ? i + 1 : 0)).filter(Boolean);
    expect(fired).toEqual([5, 25]);
  });

  it('3 sources escalate once; repeats from one source escalate only at n=5; a 4th source is a duplicate', () => {
    const claim = fakeClaim();
    expect(claim('a').verdict).toBe('new');
    expect(claim('b').verdict).toBe('duplicate');
    expect(claim('c')).toMatchObject({ verdict: 'escalate', n: 3, sources: 3 });
    const repeats = Array.from({ length: 10 }, () => claim('a'));
    const fired = repeats.map((v, i) => (v.verdict === 'escalate' ? i + 4 : 0)).filter(Boolean);
    expect(fired).toEqual([5]);
    expect(claim('d')).toMatchObject({ verdict: 'duplicate', sources: 4 });
  });
});
