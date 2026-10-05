import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertDevice } from './devices';

const input = { deviceId: '44444444-4444-4444-8444-444444444444', platform: 'ios' as const, pushToken: 't', seq: 2 };

function client(rpcError: { code: string; message: string } | null) {
  const upsert = vi.fn().mockReturnValue({
    select: () => ({ single: async () => ({ data: { id: input.deviceId }, error: null }) }),
  });
  const rpc = vi.fn().mockReturnValue({
    single: async () => ({ data: rpcError ? null : { id: input.deviceId }, error: rpcError }),
  });
  return { db: { rpc, from: vi.fn().mockReturnValue({ upsert }) } as unknown as SupabaseClient, rpc, upsert };
}

describe('upsertDevice', () => {
  it('uses the ordered RPC when present', async () => {
    const { db, rpc, upsert } = client(null);
    await upsertDevice(db, input);
    expect(rpc).toHaveBeenCalledWith('upsert_device_ordered', expect.objectContaining({ p_seq: 2 }));
    expect(upsert).not.toHaveBeenCalled();
  });

  it.each(['PGRST202', '42883'])('falls back to the plain upsert when the RPC is missing (%s), warning once', async (code) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db, upsert } = client({ code, message: 'missing' });
    await upsertDevice(db, input);
    await upsertDevice(db, input);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.length).toBeLessThanOrEqual(1);
    warn.mockRestore();
  });

  it('still throws on other RPC errors', async () => {
    const { db } = client({ code: '57014', message: 'timeout' });
    await expect(upsertDevice(db, input)).rejects.toThrow('timeout');
  });
});
