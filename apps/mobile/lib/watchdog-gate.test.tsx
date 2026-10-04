// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({ getForceSharedUi: vi.fn(async () => false), saved: [] as { state: string; strikes: number; fallbackLaunchesRemaining: number }[], mark: vi.fn(), stored: null as unknown, loadDelay: 0 }));
vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) },
  Platform: { OS: 'ios' },
}));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '1:embedded',
  loadWatchdogRecord: async () => {
    if (h.loadDelay) await new Promise((r) => setTimeout(r, h.loadDelay));
    return h.stored;
  },
  saveWatchdogRecord: async (r: never) => {
    h.saved.push(r);
    return true;
  },
  loadReportsRaw: async () => null,
  saveReportsRaw: async () => undefined,
}));
vi.mock('./diagnostics-override', () => ({
  getForceSharedUi: h.getForceSharedUi,
  getForceDomFailure: async () => 'off',
  setForceSharedUi: async () => undefined,
}));
vi.mock('./diagnostics-send', () => ({ sendDiagReport: async () => ({ ok: true }) }));
vi.mock('./diagnostics', () => ({ diagCollector: { mark: h.mark, elapsed: () => 0 }, setMountInfo: () => undefined }));

import { act, renderHook } from '@testing-library/react';
import { PENDING_MAX_MS } from './watchdog-policy';
import { useDomMount, type LaunchInputs } from './watchdog-gate';

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });
const inputs = (p: Partial<LaunchInputs> = {}): LaunchInputs => ({ override: false, sharedUi: null, watchdogReports: null, ...p });

describe('useDomMount slow storage (iPhone cold launch)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.saved.length = 0;
    h.stored = null;
    h.loadDelay = 0;
    h.mark.mockClear();
    h.getForceSharedUi.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('override ON resolving after the pending bound still upgrades native to DOM', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.mount).toBe('native');
    rerender({ i: inputs({ override: true }) });
    await flush();
    expect(result.current.mount).toBe('dom');
    expect(result.current.nativeReason).toBeNull();
  });

  it('a late input that wants DOM (cached on or default-on, no override) upgrades native to DOM', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.nativeReason).toBe('pending-expired');
    expect(h.mark).toHaveBeenCalledWith('mount-pending-expired', expect.any(String));
    rerender({ i: inputs() });
    await flush();
    expect(result.current.mount).toBe('dom');
    expect(h.mark).toHaveBeenCalledWith('mount-late-upgrade', expect.any(String));
  });

  it('default-on mounts DOM without reading the SecureStore override on the launch path', async () => {
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(result.current.mount).toBe('dom');
    expect(h.getForceSharedUi).not.toHaveBeenCalled();
  });

  it('a slow watchdog-record read past the bound still upgrades to DOM when the record arrives', async () => {
    h.loadDelay = PENDING_MAX_MS + 300;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.mount).toBe('native');
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(result.current.mount).toBe('dom');
  });

  it('an explicit cached OFF stays native and a late OFF does not upgrade', async () => {
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

  it('override ON inside the bound mounts DOM with no expiry mark', async () => {
    const { result } = renderHook(() => useDomMount(inputs({ override: true })));
    await flush();
    expect(result.current.mount).toBe('dom');
    expect(h.mark).not.toHaveBeenCalledWith('mount-pending-expired', expect.anything());
  });

  it('reports why native mounts for each local cause', async () => {
    const off = renderHook(() => useDomMount(inputs({ sharedUi: false })));
    await flush();
    expect(off.result.current.nativeReason).toBe('flag-off');
  });

  it('expiry then late override with an owed fallback: the override does not skip it; the owed launch is consumed', async () => {
    h.stored = { v: 1, fallbackCycles: 0, buildKey: '1:embedded', state: 'fallback', strikes: 0, lastReason: 'x', fallbackLaunchesRemaining: 1, backgrounded: false, abandonedStreak: 0, at: 1 };
    h.loadDelay = PENDING_MAX_MS + 200;
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 300); });
    expect(h.saved.map((r) => r.fallbackLaunchesRemaining)).toEqual([1]);
    rerender({ i: inputs({ override: true }) });
    await flush();
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('watchdog-fallback');
    expect(h.saved.some((r) => r.state === 'attempting')).toBe(false);
    expect(h.saved.at(-1)).toMatchObject({ state: 'fallback', fallbackLaunchesRemaining: 0 });
  });

  it('late upgrade then a DOM error strikes once and reports dom-strike', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    rerender({ i: inputs({ override: true }) });
    await flush();
    expect(result.current.mount).toBe('dom');
    await act(async () => { result.current.watch.error('boom'); await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('dom-strike');
    expect(h.saved.at(-1)?.strikes).toBe(1);
  });
});
