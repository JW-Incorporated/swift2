import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { admin: true, count: 0 as number | null, countError: false, insertError: null as null | { code: string } };
const insert = vi.fn(async () => ({ error: state.insertError }));
vi.mock('../../../lib/supabase-server', () => ({
  supabaseAdmin: () =>
    state.admin
      ? {
          from: () => ({
            select: () => ({
              eq: async () => ({ count: state.count, error: state.countError ? { code: 'x' } : null }),
            }),
            insert,
          }),
        }
      : null,
}));

import { claimWatchdogReport, WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY } from './watchdog-dedupe';

const report = { platform: 'ios', buildKey: '42:embedded', category: 'protocol' } as const;

describe('claimWatchdogReport', () => {
  beforeEach(() => {
    Object.assign(state, { admin: true, count: 0, countError: false, insertError: null });
    insert.mockClear();
  });

  it('first claim of a day+buildKey+category is new and inserts the UTC day', async () => {
    expect(await claimWatchdogReport(report, new Date('2026-10-04T23:59:00Z'))).toBe('new');
    expect(insert).toHaveBeenCalledWith({ day: '2026-10-04', build_key: '42:embedded', category: 'protocol' });
  });

  it('a unique-violation is a duplicate', async () => {
    state.insertError = { code: '23505' };
    expect(await claimWatchdogReport(report)).toBe('duplicate');
  });

  it('the durable global daily cap blocks before inserting', async () => {
    state.count = WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY;
    expect(await claimWatchdogReport(report)).toBe('capped');
    expect(insert).not.toHaveBeenCalled();
  });

  it('fails open when unconfigured or on storage errors', async () => {
    state.admin = false;
    expect(await claimWatchdogReport(report)).toBe('new');
    state.admin = true;
    state.countError = true;
    expect(await claimWatchdogReport(report)).toBe('new');
    state.countError = false;
    state.insertError = { code: '08006' };
    expect(await claimWatchdogReport(report)).toBe('new');
  });
});
