import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markFirstPaint, resetFirstPaintForTests, runAfterFirstPaint } from './launch-defer';

beforeEach(() => {
  vi.useFakeTimers();
  resetFirstPaintForTests();
});
afterEach(() => vi.useRealTimers());

describe('runAfterFirstPaint', () => {
  it('does not run before first paint, runs once after it', () => {
    const fn = vi.fn();
    runAfterFirstPaint(fn);
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    markFirstPaint();
    markFirstPaint();
    vi.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(20_000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs after the fallback when no paint arrives', () => {
    const fn = vi.fn();
    runAfterFirstPaint(fn, 500);
    vi.advanceTimersByTime(499);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs on the next tick when registered after paint, and cancel prevents it', () => {
    markFirstPaint();
    const fn = vi.fn();
    const cancelled = vi.fn();
    runAfterFirstPaint(fn);
    runAfterFirstPaint(cancelled)();
    vi.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
  });
});
