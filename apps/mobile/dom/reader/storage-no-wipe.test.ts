import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMapStorage } from './reader-modules';
import { createWriteCoalescer, LOAD_RETRY_MS, recoverStorage } from './storage-sync';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const failed = { ok: false, error: { code: 'failed', message: 'x' } };

function boot(loads: unknown[]) {
  const writes: Array<Record<string, unknown>> = [];
  const call = vi.fn(async (type: string, payload: Record<string, unknown>) => {
    if (type === 'storage.write') {
      writes.push(payload);
      return { ok: true, value: null };
    }
    return loads.shift() ?? failed;
  });
  // eslint-disable-next-line prefer-const -- late-bound: the callback needs the binding assigned below
  let local!: ReturnType<typeof createMapStorage>;
  const sync = createWriteCoalescer({ call } as never, () => local.snapshot());
  local = createMapStorage({}, sync.push);
  recoverStorage({ call } as never, local, sync);
  return { local, writes };
}

describe('a failed seed load never wipes the saved blob', () => {
  it('no storage.write is sent for the epoch, but memory still works', async () => {
    const { local, writes } = boot([failed]);
    local.set('feedback-draft', 'hi');
    await vi.advanceTimersByTimeAsync(LOAD_RETRY_MS + 5000);
    expect(writes).toEqual([]);
    expect(local.get('feedback-draft')).toBe('hi');
  });

  it('a successful retry merges: loaded base, then in-memory changes key by key', async () => {
    const { local, writes } = boot([{ ok: true, value: { entries: { fav: '1', outbox: 'q', drop: 'z' } } }]);
    local.set('fav', '2');
    local.set('new', 'n');
    local.remove('drop');
    await vi.advanceTimersByTimeAsync(LOAD_RETRY_MS + 1);
    await vi.advanceTimersByTimeAsync(500);
    expect(writes).toEqual([{ entries: { fav: '2', outbox: 'q', new: 'n' } }]);
  });

  it('a successful retry with no changes since writes nothing', async () => {
    const { writes } = boot([{ ok: true, value: { entries: { a: '1' } } }]);
    await vi.advanceTimersByTimeAsync(LOAD_RETRY_MS + 5000);
    expect(writes).toEqual([]);
  });

  it('the normal path (no recovery) still sends a snapshot', async () => {
    const call = vi.fn(async () => ({ ok: true, value: null }));
    // eslint-disable-next-line prefer-const -- late-bound
    let s!: ReturnType<typeof createMapStorage>;
    const sync = createWriteCoalescer({ call } as never, () => s.snapshot());
    s = createMapStorage({ a: '1' }, sync.push);
    s.set('b', '2');
    await vi.advanceTimersByTimeAsync(300);
    expect(call).toHaveBeenCalledWith('storage.write', { entries: { a: '1', b: '2' } });
  });

  it('an intentionally emptied map is sent flagged allowEmpty', async () => {
    const call = vi.fn(async () => ({ ok: true, value: null }));
    // eslint-disable-next-line prefer-const -- late-bound
    let s!: ReturnType<typeof createMapStorage>;
    const sync = createWriteCoalescer({ call } as never, () => s.snapshot());
    s = createMapStorage({ a: '1' }, sync.push);
    s.remove('a');
    await vi.advanceTimersByTimeAsync(300);
    expect(call).toHaveBeenCalledWith('storage.write', { entries: {}, allowEmpty: true });
  });
});
