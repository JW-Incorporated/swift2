import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateRegistration } from './route';

const DEVICE = '33333333-3333-4333-8333-333333333333';
let ipCounter = 0;

// Stateful stand-in for the `upsert_device_ordered` SQL function (same rule as the migration).
function fakeDb() {
  const row: { push_token: string | null; register_seq: number | null } = { push_token: null, register_seq: null };
  const rpc = vi.fn((_name: string, a: { p_push_token: string | null; p_seq: number | null }) => {
    if (a.p_seq === null || row.register_seq === null || row.register_seq < a.p_seq) {
      row.push_token = a.p_push_token;
      row.register_seq = a.p_seq ?? row.register_seq;
    }
    return {
      single: async () => ({
        data: { id: DEVICE, platform: 'ios', tz: 'UTC', last_seen_at: '2026-01-01T00:00:00Z', push_token: row.push_token },
        error: null,
      }),
    };
  });
  return { row, rpc };
}

async function setup() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
  const db = fakeDb();
  vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc: db.rpc }) }));
  vi.resetModules();
  const mod = await import('./route');
  const post = (body: unknown) =>
    mod.POST(
      new Request('http://localhost/api/devices/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.0.${++ipCounter}` },
        body: JSON.stringify({ deviceId: DEVICE, platform: 'ios', ...(body as object) }),
      }),
    );
  return { db, post };
}

afterEach(() => {
  vi.doUnmock('@supabase/supabase-js');
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('validateRegistration seq', () => {
  it('passes a valid seq through and omits it when absent', () => {
    const withSeq = validateRegistration({ deviceId: DEVICE, platform: 'ios', seq: 5 });
    expect(withSeq.ok && withSeq.input.seq).toBe(5);
    const without = validateRegistration({ deviceId: DEVICE, platform: 'ios' });
    expect(without.ok && without.input.seq).toBeUndefined();
  });

  it.each([-1, 1.5, '7', Number.NaN])('rejects invalid seq %s', (seq) => {
    expect(validateRegistration({ deviceId: DEVICE, platform: 'ios', seq }).ok).toBe(false);
  });
});

describe('POST /api/devices/register ordering', () => {
  it('a stale register arriving after a newer unregister leaves the token null (200, no error)', async () => {
    const { db, post } = await setup();
    expect((await post({ pushToken: 'tok', seq: 1 })).status).toBe(200);
    expect((await post({ pushToken: null, seq: 3 })).status).toBe(200);
    const stale = await post({ pushToken: 'tok-late', seq: 2 });
    expect(stale.status).toBe(200);
    expect(db.row.push_token).toBeNull();
    expect(db.row.register_seq).toBe(3);
  });

  it('old clients without seq still write unconditionally', async () => {
    const { db, post } = await setup();
    await post({ pushToken: 'a' });
    expect(db.row.push_token).toBe('a');
    await post({ pushToken: null });
    expect(db.row.push_token).toBeNull();
    expect(db.rpc).toHaveBeenLastCalledWith('upsert_device_ordered', expect.objectContaining({ p_seq: null }));
  });

  it('conflicting writes with an equal seq keep the first applied row', async () => {
    const { db, post } = await setup();
    await post({ pushToken: 'first', seq: 6 });
    await post({ pushToken: 'second', seq: 6 });
    expect(db.row).toEqual({ push_token: 'first', register_seq: 6 });
  });

  it('duplicate requests with the same seq are idempotent', async () => {
    const { db, post } = await setup();
    const results = await Promise.all([post({ pushToken: 'x', seq: 4 }), post({ pushToken: 'x', seq: 4 })]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(db.row).toEqual({ push_token: 'x', register_seq: 4 });
  });
});
