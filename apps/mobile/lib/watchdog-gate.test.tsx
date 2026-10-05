// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({ os: 'android', saveDelay: 0, saved: [] as { state: string; strikes: number; fallbackLaunchesRemaining: number }[], mark: vi.fn(), stored: null as unknown, loadDelay: 0 }));
vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) },
  Platform: { get OS() { return h.os; } },
}));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '1:embedded',
  loadWatchdogRecord: async () => {
    if (h.loadDelay) await new Promise((r) => setTimeout(r, h.loadDelay));
    return h.stored;
  },
  saveWatchdogRecord: async (r: { state: string }) => {
    if (h.saveDelay && r.state === 'attempting') await new Promise((res) => setTimeout(res, h.saveDelay));
    h.saved.push(r as never);
    return true;
  },
  loadReportsRaw: async () => null,
  saveReportsRaw: async () => undefined,
}));
vi.mock('./diagnostics-override', () => ({
  getForceDomFailure: async () => 'off',
  setForceSharedUi: async () => undefined,
}));
vi.mock('./dom-reader-config', () => ({ lastGoodSource: () => ({ scriptUri: 'x', jsonUri: 'y' }) }));
vi.mock('./content-bundle', () => ({ loadContentBundle: async () => ({}) }));
vi.mock('./diagnostics-send', () => ({ sendDiagReport: async () => ({ ok: true }) }));
vi.mock('./diagnostics', () => ({ diagCollector: { mark: h.mark, elapsed: () => 0 }, setMountInfo: () => undefined }));

import { act, renderHook } from '@testing-library/react';
import { PENDING_MAX_MS } from './watchdog-policy';
import { useDomMount, type LaunchInputs } from './watchdog-gate';
import { decideMount } from './watchdog';

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });
const inputs = (p: Partial<LaunchInputs> = {}): LaunchInputs => ({ sharedUi: null, sharedUiIos: null, watchdogReports: null, ...p });

describe('useDomMount slow storage (iPhone cold launch)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.saved.length = 0;
    h.stored = null;
    h.loadDelay = 0;
    h.saveDelay = 0;
    h.os = 'android';
    h.mark.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('pending expiry is terminal: inputs wanting DOM after the bound keep native this launch, the next launch mounts DOM', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('pending-expired');
    expect(h.mark).toHaveBeenCalledWith('mount-pending-expired', expect.stringMatching(/ms$/));
    rerender({ i: inputs() });
    await flush();
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('pending-expired');
    expect(h.mark).not.toHaveBeenCalledWith('mount-late-upgrade', expect.anything());
    const next = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(next.result.current.mount).toBe('dom');
  });

  it('default-on mounts DOM inside the bound', async () => {
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(result.current.mount).toBe('dom');
  });

  it('a slow watchdog-record read past the bound stays native this launch', async () => {
    h.loadDelay = PENDING_MAX_MS + 300;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 500); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('pending-expired');
  });

  it('an explicit cached OFF stays native and a late OFF stays native', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    rerender({ i: inputs({ sharedUi: false }) });
    await flush();
    expect(result.current.mount).toBe('native');
    const early = renderHook(() => useDomMount(inputs({ sharedUi: false })));
    await flush();
    expect(early.result.current.mount).toBe('native');
    expect(early.result.current.nativeReason).toBe('flag-off');
  });

  it('a failed watchdog-record read fails closed to native', async () => {
    h.stored = 'corrupt';
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(result.current.mount).toBe('native');
  });

  it('reports why native mounts for each local cause', async () => {
    const off = renderHook(() => useDomMount(inputs({ sharedUi: false })));
    await flush();
    expect(off.result.current.nativeReason).toBe('flag-off');
  });

  it('timer firing during the attempt write still mounts DOM with an attempting record (commit latch)', async () => {
    h.saveDelay = PENDING_MAX_MS + 200;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(h.mark).toHaveBeenCalledWith('mount-pending-expired', expect.any(String));
    expect(result.current.mount).toBe('pending');
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(result.current.mount).toBe('dom');
    expect(result.current.nativeReason).toBeNull();
    expect(h.saved.at(-1)?.state).toBe('attempting');
  });

  it('Android cache-miss mounts DOM; iOS cache-miss is native flag-off; enabling the iOS key mounts DOM', async () => {
    const a = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(a.result.current.mount).toBe('dom');
    h.os = 'ios';
    const i = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(i.result.current.mount).toBe('native');
    expect(i.result.current.nativeReason).toBe('flag-off');
    const on = renderHook(() => useDomMount(inputs({ sharedUiIos: true })));
    await flush();
    expect(on.result.current.mount).toBe('dom');
    const stale = renderHook(() => useDomMount(inputs({ sharedUi: true })));
    await flush();
    expect(stale.result.current.mount).toBe('native');
  });

  it('pending expiry with the decision ready writes the refunded record (owed fallback launch not consumed)', async () => {
    h.stored = { v: 1, fallbackCycles: 0, buildKey: '1:embedded', state: 'fallback', strikes: 0, lastReason: 'x', fallbackLaunchesRemaining: 1, backgrounded: false, abandonedStreak: 0, at: 1 };
    renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0]).toMatchObject({ state: 'fallback', fallbackLaunchesRemaining: 1 });
  });

  it('an attempt write that never settles mounts native (attempt-failed) within the bound', async () => {
    h.saveDelay = 1e9;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('attempt-failed');
  });

  it('an attempt write that settles after the bound is rolled back: no attempting record persists, no false strike next launch', async () => {
    h.saveDelay = 3500;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('attempt-failed');
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(result.current.mount).toBe('native');
    const last = h.saved.at(-1)!;
    expect(last.state).toBe('idle');
    expect(last.strikes).toBe(0);
    expect(decideMount(last as never, '1:embedded', Date.now()).record.strikes).toBe(0);
  });

  it('an owed fallback is honoured: native, no attempt, launch consumed', async () => {
    h.stored = { v: 1, fallbackCycles: 0, buildKey: '1:embedded', state: 'fallback', strikes: 0, lastReason: 'x', fallbackLaunchesRemaining: 1, backgrounded: false, abandonedStreak: 0, at: 1 };
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('watchdog-fallback');
    expect(h.saved.some((r) => r.state === 'attempting')).toBe(false);
    expect(h.saved.at(-1)).toMatchObject({ state: 'fallback', fallbackLaunchesRemaining: 0 });
  });

  it('a DOM error strikes once and reports dom-strike', async () => {
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(result.current.mount).toBe('dom');
    await act(async () => { result.current.watch.error('boom'); await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('dom-strike');
    expect(h.saved.at(-1)?.strikes).toBe(1);
  });
});
