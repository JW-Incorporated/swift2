import { describe, expect, it, vi } from 'vitest';
import { isBusy, setBusy, subscribeBusy } from './busy-signal';

describe('busy signal', () => {
  it('is busy while any key is set, notifies only on a real change, and unsubscribes', () => {
    const fn = vi.fn();
    const off = subscribeBusy(fn);
    expect(isBusy()).toBe(false);
    setBusy('a', true);
    setBusy('a', true);
    setBusy('b', true);
    setBusy('a', false);
    expect(isBusy()).toBe(true);
    setBusy('b', false);
    expect(isBusy()).toBe(false);
    expect(fn).toHaveBeenCalledTimes(4);
    off();
    setBusy('a', true);
    expect(fn).toHaveBeenCalledTimes(4);
    setBusy('a', false);
  });
});
