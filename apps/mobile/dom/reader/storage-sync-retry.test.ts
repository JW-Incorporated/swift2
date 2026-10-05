import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWriteCoalescer } from './storage-sync';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const failed = { ok: false, error: { code: 'failed', message: 'x' } };
const good = { ok: true, value: null };

describe('write coalescer durability', () => {
  it('a failed write is retried with nothing lost, and newer changes win over the requeued batch', async () => {
    const call = vi.fn().mockResolvedValueOnce(failed).mockResolvedValue(good);
    const sync = createWriteCoalescer({ call } as never);
    sync.push({ set: ['a', '1'] });
    sync.push({ set: ['b', '1'] });
    await vi.advanceTimersByTimeAsync(250);
    expect(call).toHaveBeenCalledTimes(1);
    sync.push({ set: ['b', '2'] });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[1]).toEqual(['storage.write', { set: { b: '2', a: '1' } }]);
  });

  it('keeps one write in flight: a second batch waits for the first to resolve', async () => {
    let release!: (v: unknown) => void;
    const call = vi
      .fn()
      .mockImplementationOnce(() => new Promise((r) => (release = r)))
      .mockResolvedValue(good);
    const sync = createWriteCoalescer({ call } as never);
    sync.push({ set: ['a', '1'] });
    await vi.advanceTimersByTimeAsync(250);
    sync.push({ set: ['b', '1'] });
    sync.flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(call).toHaveBeenCalledTimes(1);
    release(good);
    await vi.advanceTimersByTimeAsync(250);
    expect(call.mock.calls.map((c) => c[1])).toEqual([{ set: { a: '1' } }, { set: { b: '1' } }]);
  });

  it('an invalid (too large) answer is not retried and logs once', async () => {
    const log = vi.fn();
    const call = vi.fn(async () => ({ ok: false, error: { code: 'invalid', message: 'x' } }));
    const sync = createWriteCoalescer({ call } as never, log);
    sync.push({ set: ['a', '1'] });
    await vi.advanceTimersByTimeAsync(20_000);
    sync.push({ set: ['b', '1'] });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('gives up after bounded retries', async () => {
    const call = vi.fn(async () => failed);
    const sync = createWriteCoalescer({ call } as never);
    sync.push({ set: ['a', '1'] });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(call).toHaveBeenCalledTimes(7);
  });
});
