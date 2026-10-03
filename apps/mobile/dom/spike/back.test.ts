import { describe, expect, it, vi } from 'vitest';
import { hardwareBackHandled } from './back';

describe('hardwareBackHandled', () => {
  it('lets the press through (no swallow) while the reader is loading or failed', () => {
    const ping = vi.fn();
    expect(hardwareBackHandled(false, ping)).toBe(false);
    expect(ping).not.toHaveBeenCalled();
  });

  it('consumes the press and nudges the reader once it is ready', () => {
    const ping = vi.fn();
    expect(hardwareBackHandled(true, ping)).toBe(true);
    expect(ping).toHaveBeenCalledTimes(1);
  });
});
