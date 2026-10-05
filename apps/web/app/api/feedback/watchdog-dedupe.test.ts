import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { admin: true, data: 'new' as unknown, error: null as null | { code: string }, throws: false };
const rpc = vi.fn(async (..._args: unknown[]) => {
  if (state.throws) throw new Error('net');
  return { data: state.data, error: state.error };
});
vi.mock('../../../lib/supabase-server', () => ({ supabaseAdmin: () => (state.admin ? { rpc } : null) }));

import { claimWatchdogReport, finishWatchdogReport, WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY } from './watchdog-dedupe';

const report = { platform: 'ios', buildKey: '42:embedded', category: 'protocol' } as const;

describe('watchdog durable dedupe client', () => {
  beforeEach(() => {
    Object.assign(state, { admin: true, data: 'new', error: null, throws: false });
    rpc.mockClear();
  });

  it('claims through one RPC with the UTC day and the cap', async () => {
    expect(await claimWatchdogReport(report, new Date('2026-10-04T23:59:00Z'))).toBe('new');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      'claim_watchdog_report',
      expect.objectContaining({
        p_day: '2026-10-04',
        p_build_key: '42:embedded',
        p_category: 'protocol',
        p_max_per_day: WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY,
      }),
    );
  });

  it('maps duplicate and capped outcomes', async () => {
    state.data = 'duplicate';
    expect(await claimWatchdogReport(report)).toBe('duplicate');
    state.data = 'capped';
    expect(await claimWatchdogReport(report)).toBe('capped');
  });

  it('fails open when unconfigured, on RPC error, on a throw, or on an unknown value', async () => {
    state.admin = false;
    expect(await claimWatchdogReport(report)).toBe('new');
    state.admin = true;
    state.error = { code: 'x' };
    expect(await claimWatchdogReport(report)).toBe('new');
    state.error = null;
    state.throws = true;
    expect(await claimWatchdogReport(report)).toBe('new');
    state.throws = false;
    state.data = 'weird';
    expect(await claimWatchdogReport(report)).toBe('new');
  });

  it('finish marks posted or releases, and never throws', async () => {
    await finishWatchdogReport(report, true, new Date('2026-10-04T00:00:00Z'));
    expect(rpc).toHaveBeenCalledWith(
      'finish_watchdog_report',
      expect.objectContaining({ p_posted: true, p_day: '2026-10-04' }),
    );
    await finishWatchdogReport(report, false);
    expect(rpc).toHaveBeenLastCalledWith('finish_watchdog_report', expect.objectContaining({ p_posted: false }));
    state.throws = true;
    await expect(finishWatchdogReport(report, false)).resolves.toBeUndefined();
  });
});
