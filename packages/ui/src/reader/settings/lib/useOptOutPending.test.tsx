// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { OPT_OUT_POLL_MS, useOptOutPending } from './useOptOutPending';
import type { SettingsDriver } from './driver';

const driver = (optOutPending?: () => Promise<boolean>) => ({ kind: 'native', optOutPending }) as unknown as SettingsDriver;
const tick = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

describe('useOptOutPending', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is derived from the persisted flag on mount (survives reopening Settings)', async () => {
    const { result } = renderHook(() => useOptOutPending(driver(async () => true)));
    await tick(0);
    expect(result.current.pending).toBe(true);
  });

  it('clears by itself when a background retry lands (poll while pending)', async () => {
    let flag = true;
    const d = driver(async () => flag);
    const { result } = renderHook(() => useOptOutPending(d));
    await tick(0);
    expect(result.current.pending).toBe(true);
    flag = false;
    await tick(OPT_OUT_POLL_MS);
    expect(result.current.pending).toBe(false);
  });

  it('re-reads when the page returns to the foreground', async () => {
    let flag = true;
    const d = driver(async () => flag);
    const { result } = renderHook(() => useOptOutPending(d));
    await tick(0);
    flag = false;
    await act(async () => void window.dispatchEvent(new Event('focus')));
    expect(result.current.pending).toBe(false);
  });

  it('is a permanent no-op for hosts without the flag (the website)', async () => {
    const { result } = renderHook(() => useOptOutPending(driver(undefined)));
    await tick(OPT_OUT_POLL_MS * 2);
    expect(result.current.pending).toBe(false);
    expect(await result.current.refresh()).toBe(false);
  });
});
