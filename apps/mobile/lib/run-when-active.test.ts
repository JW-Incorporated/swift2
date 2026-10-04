import { describe, expect, it, vi } from 'vitest';
import { createRunWhenActive } from './run-when-active';

function harness(initial: string) {
  let state = initial;
  const listeners = new Set<(s: string) => void>();
  const d = createRunWhenActive({
    state: () => state,
    subscribe: (cb) => (listeners.add(cb), () => void listeners.delete(cb)),
  });
  return { d, listeners, set: (s: string) => { state = s; for (const l of [...listeners]) l(s); } };
}

describe('createRunWhenActive', () => {
  it('runs at once while active', () => {
    const fn = vi.fn();
    harness('active').d.run(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('background -> active: runs once on the first active, then unsubscribes', () => {
    const h = harness('background');
    const fn = vi.fn();
    h.d.run(fn);
    h.d.run(fn);
    expect(fn).not.toHaveBeenCalled();
    h.set('inactive');
    expect(fn).not.toHaveBeenCalled();
    h.set('active');
    h.set('active');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(h.listeners.size).toBe(0);
    expect(h.d.pending()).toBe(false);
  });

  it('background -> unmount: cancel drops the pending run and the listener', () => {
    const h = harness('background');
    const fn = vi.fn();
    h.d.run(fn);
    h.d.cancel();
    h.set('active');
    expect(fn).not.toHaveBeenCalled();
    expect(h.listeners.size).toBe(0);
  });
});
