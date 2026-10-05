import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMapStorage } from './reader-modules';
import { createWriteCoalescer, loadStorageSeed } from './storage-sync';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('persistent local storage (DOM side)', () => {
  it('set, then a relaunch (new Map seeded from the native blob) still has the value', () => {
    let blob: Record<string, string> = {};
    const first = createMapStorage({}, () => void (blob = first.snapshot()));
    first.set('visited', 'yes');
    first.set('gone', 'x');
    first.remove('gone');
    const second = createMapStorage(blob);
    expect(second.get('visited')).toBe('yes');
    expect(second.get('gone')).toBeNull();
  });

  it('5 sets in 100 ms produce one storage.write', () => {
    const call = vi.fn(async () => ({ ok: true, value: null }));
    // eslint-disable-next-line prefer-const -- late-bound: the callback needs the binding assigned below
    let s!: ReturnType<typeof createMapStorage>;
    const sync = createWriteCoalescer({ call } as never, () => s.snapshot());
    s = createMapStorage({}, sync.push);
    for (let i = 0; i < 5; i++) {
      s.set(`k${i}`, String(i));
      vi.advanceTimersByTime(20);
    }
    expect(call).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('load failure (error reply or throw) gives an empty seed and logs', async () => {
    const log = vi.fn();
    const errReply = vi.fn(async () => ({ ok: false, error: { code: 'failed', message: 'x' } }));
    const thrower = vi.fn(async () => {
      throw new Error('boom');
    });
    expect(await loadStorageSeed({ call: errReply } as never, log)).toEqual({});
    expect(await loadStorageSeed({ call: thrower } as never, log)).toEqual({});
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('load success seeds from entries', async () => {
    const call = vi.fn(async () => ({ ok: true, value: { entries: { a: '1' } } }));
    expect(await loadStorageSeed({ call } as never)).toEqual({ a: '1' });
  });
});
