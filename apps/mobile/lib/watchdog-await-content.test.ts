import { describe, expect, it, vi } from 'vitest';
import {
  classifyContentFailure,
  contentFailureKind,
  createContentWaiter,
  createRetryScheduler,
  retryDelayMs,
} from './watchdog-await-content';

const transport = (cause: string) => Object.assign(new Error('Network request to x failed'), { cause: new Error(cause) });

describe('classifyContentFailure', () => {
  it('bare transport failure is offline', () => {
    expect(classifyContentFailure(transport('Network request failed'))).toBe('offline');
  });
  it('timeout anywhere in the cause chain is a timeout', () => {
    expect(classifyContentFailure(transport('Request timed out after 30000ms'))).toBe('timeout');
  });
  it('HTTP failures are server-side', () => {
    expect(classifyContentFailure(new Error('Fetching current.json failed with HTTP 503'))).toBe('server');
  });
  it('anything unrecognised gets the generic server copy, never raw text', () => {
    expect(classifyContentFailure(new Error('weird'))).toBe('server');
    expect(classifyContentFailure(undefined)).toBe('server');
  });
  it('the waiter records the class before flipping failed', async () => {
    const seen: string[] = [];
    const w = createContentWaiter(
      () => Promise.reject(transport('Network request failed')),
      (f) => f && seen.push(contentFailureKind()),
      () => false,
    );
    void w.run();
    await Promise.resolve();
    await Promise.resolve();
    expect(seen).toEqual(['offline']);
  });
});

describe('retry backoff', () => {
  it('schedule is 5s, 15s, 30s, then 60s', () => {
    expect([0, 1, 2, 3, 4, 50].map(retryDelayMs)).toEqual([5000, 15000, 30000, 60000, 60000, 60000]);
  });

  it('fires on the schedule with fake timers and never stacks timers', () => {
    vi.useFakeTimers();
    const retry = vi.fn();
    const s = createRetryScheduler(retry);
    s.arm();
    s.arm();
    vi.advanceTimersByTime(4999);
    expect(retry).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(retry).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(15000);
    expect(retry).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(30000);
    expect(retry).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(60000 * 3);
    expect(retry).toHaveBeenCalledTimes(6);
    s.disarm();
    vi.useRealTimers();
  });

  it('disarm (background / retry underway) stops all further retries', () => {
    vi.useFakeTimers();
    const retry = vi.fn();
    const s = createRetryScheduler(retry);
    s.arm();
    vi.advanceTimersByTime(5000);
    s.disarm();
    vi.advanceTimersByTime(10 * 60_000);
    expect(retry).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('a retry while the waiter is not parked starts no overlapping load', async () => {
    let calls = 0;
    let rejectLoad: (e: unknown) => void = () => undefined;
    const w = createContentWaiter(
      () => (calls++, new Promise((_, rej) => (rejectLoad = rej))),
      () => undefined,
      () => false,
    );
    void w.run();
    await Promise.resolve();
    w.retry();
    w.retry();
    await Promise.resolve();
    expect(calls).toBe(1);
    rejectLoad(new Error('x'));
    await Promise.resolve();
    await Promise.resolve();
    w.retry();
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toBe(2);
  });
});
