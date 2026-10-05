import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMapStorage } from './reader-modules';
import { createWriteCoalescer } from './storage-sync';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const failed = { ok: false, error: { code: 'failed', message: 'x' } };
const invalid = { ok: false, error: { code: 'invalid', message: 'x' } };
const good = { ok: true, value: null };

function rig(call: ReturnType<typeof vi.fn>, log = vi.fn()) {
  // eslint-disable-next-line prefer-const -- late-bound: the callback needs the binding assigned below
  let local!: ReturnType<typeof createMapStorage>;
  const sync = createWriteCoalescer({ call } as never, () => local.snapshot(), log);
  local = createMapStorage({}, sync.push);
  return { local, sync, log };
}

describe('snapshot write coalescer', () => {
  it('3 pushes produce 1 write containing all keys', async () => {
    const call = vi.fn().mockResolvedValue(good);
    const { local } = rig(call);
    local.set('a', '1');
    local.set('b', '2');
    local.set('c', '3');
    await vi.advanceTimersByTimeAsync(250);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith('storage.write', { entries: { a: '1', b: '2', c: '3' } });
  });

  it('invalid: not retried, one diag, and the next push resends the earlier keys too', async () => {
    const call = vi.fn().mockResolvedValueOnce(invalid).mockResolvedValue(good);
    const { local, log } = rig(call);
    local.set('a', '1');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(call).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
    local.set('b', '2');
    await vi.advanceTimersByTimeAsync(250);
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[1]).toEqual(['storage.write', { entries: { a: '1', b: '2' } }]);
  });

  it('transport failure retries the latest snapshot with backoff', async () => {
    const call = vi.fn().mockResolvedValueOnce(failed).mockRejectedValueOnce(new Error('net')).mockResolvedValue(good);
    const { local } = rig(call);
    local.set('a', '1');
    await vi.advanceTimersByTimeAsync(250);
    expect(call).toHaveBeenCalledTimes(1);
    local.set('b', '2');
    await vi.advanceTimersByTimeAsync(499);
    expect(call).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(call).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(call).toHaveBeenCalledTimes(3);
    expect(call.mock.calls[2]).toEqual(['storage.write', { entries: { a: '1', b: '2' } }]);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(call).toHaveBeenCalledTimes(3);
  });

  it('keeps one write in flight', async () => {
    let release!: (v: unknown) => void;
    const call = vi
      .fn()
      .mockImplementationOnce(() => new Promise((r) => (release = r)))
      .mockResolvedValue(good);
    const { local, sync } = rig(call);
    local.set('a', '1');
    await vi.advanceTimersByTimeAsync(250);
    local.set('b', '1');
    sync.flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(call).toHaveBeenCalledTimes(1);
    release(good);
    await vi.advanceTimersByTimeAsync(250);
    expect(call.mock.calls.map((c) => c[1])).toEqual([{ entries: { a: '1' } }, { entries: { a: '1', b: '1' } }]);
  });

  it('gives up after bounded retries', async () => {
    const call = vi.fn().mockResolvedValue(failed);
    const { local } = rig(call);
    local.set('a', '1');
    await vi.advanceTimersByTimeAsync(120_000);
    expect(call).toHaveBeenCalledTimes(7);
  });
});
