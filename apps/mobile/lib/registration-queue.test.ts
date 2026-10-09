import { describe, expect, it, vi } from 'vitest';
import { enqueueRegistration } from './registration-queue';

const w = { deviceId: 'd', platform: 'ios' as const, pushToken: null };

describe('enqueueRegistration', () => {
  it('a rejected local phase does not wedge the tail', async () => {
    const send = vi.fn(async () => undefined);
    const bad = enqueueRegistration(async () => Promise.reject(new Error('boom')), send, { supersede: false });
    await expect(bad).rejects.toThrow('boom');
    await expect(enqueueRegistration(async () => ({ write: w, result: 'next' }), send, { supersede: true })).resolves.toBe('next');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('a rejected send does not wedge the tail', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('net')).mockResolvedValue(undefined);
    await expect(enqueueRegistration(async () => ({ write: w, result: 1 }), send, { supersede: false })).rejects.toThrow('net');
    await expect(enqueueRegistration(async () => ({ write: w, result: 2 }), send, { supersede: false })).resolves.toBe(2);
  });

  it('a superseded op never sends', async () => {
    const send = vi.fn(async () => undefined);
    let release!: () => void;
    const stale = enqueueRegistration(
      () => new Promise<{ write: typeof w; result: string }>((r) => (release = () => r({ write: w, result: 'stale' }))),
      send,
      { supersede: false },
    );
    const fresh = enqueueRegistration(async () => ({ write: null, result: 'fresh' }), send, { supersede: true });
    await new Promise((r) => setTimeout(r, 5));
    release();
    await Promise.all([stale, fresh]);
    expect(send).not.toHaveBeenCalled();
  });
});
