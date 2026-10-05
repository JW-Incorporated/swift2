// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({ os: 'android', saveDelay: 0, saved: [] as { state: string; strikes: number; fallbackLaunchesRemaining: number }[], mark: vi.fn(), stored: null as unknown, loadDelay: 0, saveFail: false, reportsRaw: null as string | null, send: vi.fn(async (..._a: unknown[]) => ({ ok: true })) }));
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
    if (h.saveFail && r.state === 'attempting') return false;
    h.saved.push(r as never);
    return true;
  },
  loadReportsRaw: async () => h.reportsRaw,
  saveReportsRaw: async (raw: string) => void (h.reportsRaw = raw),
}));
vi.mock('./diagnostics-override', () => ({
  getForceDomFailure: async () => 'off',
  setForceSharedUi: async () => undefined,
}));
vi.mock('./dom-reader-config', () => ({ lastGoodSource: () => ({ scriptUri: 'x', jsonUri: 'y' }) }));
vi.mock('./content-bundle', () => ({ loadContentBundle: async () => ({}) }));
vi.mock('./diagnostics-send', () => ({ sendDiagReport: (...a: unknown[]) => h.send(...a) }));
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
    h.saveFail = false;
    h.os = 'android';
    h.mark.mockClear();
    h.send.mockClear();
    h.reportsRaw = null;
  });
  afterEach(() => vi.useRealTimers());

  it('inputs still unread at the bound: DOM mounts from the compiled default (never native for latency); a late OFF applies next launch', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.mount).toBe('dom');
    expect(h.mark).toHaveBeenCalledWith('mount-pending-expired', expect.stringMatching(/ms$/));
    rerender({ i: inputs({ sharedUi: false }) });
    await flush();
    expect(result.current.mount).toBe('dom');
    const next = renderHook(() => useDomMount(inputs({ sharedUi: false })));
    await flush();
    expect(next.result.current.mount).toBe('native');
    expect(next.result.current.nativeReason).toBe('flag-off');
  });

  it('default-on mounts DOM inside the bound', async () => {
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(result.current.mount).toBe('dom');
  });

  it.each([2000, 10_000, 1e9])('a watchdog-record read taking %i ms still mounts DOM at the bound; nothing is persisted until it resolves, then ONE record', async (delay) => {
    h.loadDelay = delay;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 300); });
    expect(result.current.mount).toBe('dom');
    expect(result.current.nativeReason).toBeNull();
    expect(h.saved).toHaveLength(0);
    act(() => result.current.watch.ready());
    if (delay < 1e9) {
      await act(async () => { await vi.advanceTimersByTimeAsync(delay); });
      expect(result.current.mount).toBe('dom');
      expect(h.saved).toHaveLength(1);
      expect(h.saved[0].state).toBe('ready');
    }
  });

  it('a slow record that later reports quarantine: the DOM stays this launch, the quarantine record is kept for the next', async () => {
    h.stored = { v: 1, fallbackCycles: 2, buildKey: '1:embedded', state: 'quarantined', strikes: 0, lastReason: 'x', fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: 1 };
    h.loadDelay = 4000;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 700); });
    expect(result.current.mount).toBe('dom');
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(result.current.mount).toBe('dom');
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0].state).toBe('quarantined');
    expect(decideMount(h.saved[0] as never, '1:embedded', Date.now()).record.state).toBe('quarantined');
  });

  it('a slow record that reports a strike-free ready launch folds ready into the one record', async () => {
    h.loadDelay = 3000;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.mount).toBe('dom');
    act(() => result.current.watch.ready());
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0].state).toBe('ready');
  });

  it('an owed fallback with the inputs unread at the bound is honoured natively (decision ready), not pending-expired', async () => {
    h.stored = { v: 1, fallbackCycles: 0, buildKey: '1:embedded', state: 'fallback', strikes: 0, lastReason: 'x', fallbackLaunchesRemaining: 1, backgrounded: false, abandonedStreak: 0, at: 1 };
    const { result } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('watchdog-fallback');
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

  it('an attempt write that never settles mounts the DOM on the in-memory attempt after the bound (never Recovery)', async () => {
    h.saveDelay = 1e9;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(result.current.mount).toBe('dom');
    expect(result.current.nativeReason).toBeNull();
  });

  it('an attempt write that lands after the bound records a real attempt (the DOM is mounting); a strike then persists in order', async () => {
    h.saveDelay = 3500;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(result.current.mount).toBe('dom');
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(h.saved.at(-1)?.state).toBe('attempting');
    await act(async () => { result.current.watch.error('boom'); await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.mount).toBe('native');
    expect(h.saved.at(-1)?.strikes).toBe(1);
  });

  it('a slow attempt write that lands after ready cannot regress it: the serialized queue persists attempting, then ready', async () => {
    h.saveDelay = 3500;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(result.current.mount).toBe('dom');
    act(() => result.current.watch.ready());
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(h.saved.map((r) => r.state)).toEqual(['attempting', 'ready']);
  });

  it('a write failure detected AFTER the DOM mounted does not flip to native (diag mark only)', async () => {
    h.saveDelay = 3500;
    h.saveFail = true;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(result.current.mount).toBe('dom');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(result.current.mount).toBe('dom');
    expect(h.mark).toHaveBeenCalledWith('watchdog-attempt-late-save-failed');
  });

  it('late prev=quarantined: quarantine is persisted (not regressed) and the next launch goes native', async () => {
    const q = { v: 1, fallbackCycles: 2, buildKey: '1:embedded', state: 'quarantined', strikes: 0, lastReason: 'x', fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: 1 };
    h.stored = q;
    h.loadDelay = 3000;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    act(() => result.current.watch.ready());
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(result.current.mount).toBe('dom');
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0].state).toBe('quarantined');
    h.stored = h.saved[0];
    h.loadDelay = 0;
    const next = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(next.result.current.mount).toBe('native');
    expect(next.result.current.nativeReason).toBe('quarantine');
  });

  it('late prev=attempting (the last launch died): the strike is folded in and the DOM stays', async () => {
    h.stored = { v: 1, fallbackCycles: 0, buildKey: '1:embedded', state: 'attempting', strikes: 0, lastReason: '', fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: 1 };
    h.loadDelay = 3000;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(result.current.mount).toBe('dom');
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0].strikes).toBe(1);
  });

  it('a strike folded in when the late record resolves is reported exactly once', async () => {
    h.stored = { v: 1, fallbackCycles: 0, buildKey: '1:embedded', state: 'attempting', strikes: 1, lastReason: '', fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: 1 };
    h.loadDelay = 3000;
    renderHook(() => useDomMount(inputs({ watchdogReports: true })));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    expect(h.send).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(h.send).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('late corrupt record: a reset record is written, the DOM stays', async () => {
    h.stored = 'corrupt';
    h.loadDelay = 3000;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(result.current.mount).toBe('dom');
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0].strikes).toBe(0);
  });

  it('inputs, record and the bound all landing together mount once: exactly one attempt write', async () => {
    h.loadDelay = PENDING_MAX_MS;
    const { result } = renderHook(() => useDomMount(inputs()));
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 200); });
    expect(result.current.mount).toBe('dom');
    expect(h.saved.filter((r) => r.state === 'attempting')).toHaveLength(1);
  });

  it('an attempt write that FAILS (not slow) still fails closed to native', async () => {
    h.saveFail = true;
    const { result } = renderHook(() => useDomMount(inputs()));
    await flush();
    await flush();
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('attempt-failed');
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
