import { describe, expect, it, vi } from 'vitest';
import { apiUsageDailyDb } from './api-usage-daily';

function fakeSupabase(callCount: number | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: callCount === null ? null : { call_count: callCount }, error: null });
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const from = vi.fn().mockReturnValue({ select });
  const rpc = vi.fn().mockResolvedValue({ error: null });
  return { from, rpc, eq1, eq2, select } as unknown as import('@supabase/supabase-js').SupabaseClient & {
    from: typeof from;
    rpc: typeof rpc;
    eq1: typeof eq1;
  };
}

describe('apiUsageDailyDb', () => {
  it('reads todaysCallCount scoped by both scope and usage_date', async () => {
    const db = fakeSupabase(42);
    const usageDb = apiUsageDailyDb(db, 'gnews');
    const count = await usageDb.todaysCallCount();
    expect(count).toBe(42);
    expect(db.from).toHaveBeenCalledWith('usage_daily');
    expect(db.eq1).toHaveBeenCalledWith('scope', 'gnews');
  });

  it('returns 0 when no row exists yet for today', async () => {
    const db = fakeSupabase(null);
    const usageDb = apiUsageDailyDb(db, 'gnews');
    expect(await usageDb.todaysCallCount()).toBe(0);
  });

  it('increments via the scoped RPC with p_scope set', async () => {
    const db = fakeSupabase(0);
    const usageDb = apiUsageDailyDb(db, 'gnews');
    await usageDb.incrementToday();
    expect(db.rpc).toHaveBeenCalledWith('increment_usage_daily', { p_scope: 'gnews' });
  });

  it('a different scope stays isolated from another scope\'s counter', async () => {
    const db = fakeSupabase(5);
    await apiUsageDailyDb(db, 'gnews').incrementToday();
    await apiUsageDailyDb(db, 'some-other-vendor').incrementToday();
    expect(db.rpc).toHaveBeenNthCalledWith(1, 'increment_usage_daily', { p_scope: 'gnews' });
    expect(db.rpc).toHaveBeenNthCalledWith(2, 'increment_usage_daily', { p_scope: 'some-other-vendor' });
  });
});
