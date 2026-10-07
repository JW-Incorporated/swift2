// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({
  saved: [] as { state: string }[],
  stored: null as unknown,
  loadDelay: 0,
  delayState: null as string | null,
  saveDelay: 0,
  mark: vi.fn(),
  monitor: vi.fn(),
  appListener: null as null | ((s: string) => void),
}));
vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, fn: (s: string) => void) => {
      h.appListener = fn;
      return { remove: () => undefined };
    },
  },
  Platform: { OS: 'ios' },
}));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '1:embedded',
  loadWatchdogRecord: async () => {
    if (h.loadDelay) await new Promise((r) => setTimeout(r, h.loadDelay));
    return h.stored;
  },
  saveWatchdogRecord: async (r: { state: string }) => {
    if (h.delayState === r.state) await new Promise((res) => setTimeout(res, h.saveDelay));
    h.saved.push(r);
    return true;
  },
  loadReportsRaw: async () => null,
  saveReportsRaw: async () => undefined,
}));
vi.mock('./watchdog', async (orig) => {
  const actual = await orig<typeof import('./watchdog')>();
  return {
    ...actual,
    createAttemptMonitor: (...a: Parameters<typeof actual.createAttemptMonitor>) => {
      h.monitor();
      return actual.createAttemptMonitor(...a);
    },
  };
});
vi.mock('./diagnostics-override', () => ({
  getForceDomFailure: async () => 'off',
  setForceSharedUi: async () => undefined,
}));
vi.mock('./diagnostics-send', () => ({ sendDiagReport: async () => ({ ok: true }) }));
vi.mock('./dom-reader-config', () => ({ lastGoodSource: () => null }));
vi.mock('./content-bundle', () => ({ loadContentBundle: async () => ({}) }));
vi.mock('./diagnostics', () => ({
  diagCollector: { mark: h.mark, elapsed: () => 0 },
  setMountInfo: () => undefined,
}));

import { act, renderHook } from '@testing-library/react';
import { PENDING_MAX_MS } from './watchdog-policy';
import { useDomMount, type LaunchInputs } from './watchdog-gate';
import type { GateDeps } from './watchdog-gate-content';

const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
const inputs: LaunchInputs = { sharedUi: true, sharedUiIos: true, watchdogReports: null };
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => (resolve = res));
  return { promise, resolve };
};

describe('useDomMount awaiting-content (offline first launch)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.saved.length = 0;
    h.stored = null;
    h.loadDelay = 0;
    h.delayState = null;
    h.saveDelay = 0;
    h.mark.mockClear();
    h.monitor.mockClear();
    h.appListener = null;
  });
  afterEach(() => vi.useRealTimers());

  it('no cache: awaits, writes no attempt, creates no monitor, and the pending bound cannot flip it', async () => {
    const d = deferred();
    const deps: GateDeps = { hasLocalContent: () => false, loadContent: () => d.promise };
    const { result } = renderHook(() => useDomMount(inputs, deps));
    await flush();
    expect(result.current.mount).toBe('awaiting-content');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 1000);
    });
    expect(result.current.mount).toBe('awaiting-content');
    expect(h.saved).toHaveLength(0);
    expect(h.monitor).not.toHaveBeenCalled();
  });

  it('no cache with a prior attempting record: nothing is written while awaiting; exactly one bounded write lands once content resolves', async () => {
    h.stored = {
      v: 1,
      fallbackCycles: 0,
      buildKey: '1:embedded',
      state: 'attempting',
      strikes: 0,
      lastReason: '',
      fallbackLaunchesRemaining: 0,
      backgrounded: false,
      abandonedStreak: 0,
      at: 1,
    };
    const d = deferred();
    const { result } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => false, loadContent: () => d.promise }),
    );
    await flush();
    expect(result.current.mount).toBe('awaiting-content');
    expect(h.saved).toHaveLength(0);
    await act(async () => {
      d.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(h.saved).toHaveLength(1);
    expect(h.saved[0].state).toBe('attempting');
  });

  it('unmount before the load resolves: no write, no monitor', async () => {
    const d = deferred();
    const { unmount } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => false, loadContent: () => d.promise }),
    );
    await flush();
    unmount();
    await act(async () => {
      d.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(h.saved).toHaveLength(0);
    expect(h.monitor).not.toHaveBeenCalled();
  });

  it('unmount before the load rejects, then Retry / foreground: nothing re-runs', async () => {
    let reject!: (e: Error) => void;
    const load = vi.fn(() => new Promise<void>((_, rej) => (reject = rej)));
    const { result, unmount } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => false, loadContent: load }),
    );
    await flush();
    unmount();
    await act(async () => {
      reject(new Error('offline'));
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      result.current.retryContent();
      h.appListener?.('active');
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(h.saved).toHaveLength(0);
  });

  it('no cache + storage resolving at 2 s: awaiting-content, never native, no expiry mark', async () => {
    h.loadDelay = 2000;
    const { result } = renderHook(() =>
      useDomMount(inputs, {
        hasLocalContent: () => false,
        loadContent: () => new Promise<void>(() => undefined),
      }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(result.current.mount).toBe('awaiting-content');
    expect(h.mark).not.toHaveBeenCalledWith('mount-pending-expired', expect.anything());
  });

  it('no cache + inputs resolving at 2 s: awaiting-content, never native, no expiry mark', async () => {
    const deps: GateDeps = {
      hasLocalContent: () => false,
      loadContent: () => new Promise<void>(() => undefined),
    };
    const { result, rerender } = renderHook(
      ({ i }: { i: LaunchInputs | null }) => useDomMount(i, deps),
      { initialProps: { i: null as LaunchInputs | null } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.mount).toBe('pending');
    rerender({ i: inputs });
    await flush();
    expect(result.current.mount).toBe('awaiting-content');
    expect(h.mark).not.toHaveBeenCalledWith('mount-pending-expired', expect.anything());
  });

  it('cache present + slow storage: DOM mounts at the bound, never native for latency', async () => {
    h.loadDelay = 2000;
    const { result } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => true, loadContent: vi.fn() }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(result.current.mount).toBe('dom');
    expect(result.current.nativeReason).toBeNull();
  });

  it('unmount while the attempt save is in flight: the attempt is un-recorded, nothing mounts', async () => {
    h.delayState = 'attempting';
    h.saveDelay = 100;
    const d = deferred();
    const { unmount } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => false, loadContent: () => d.promise }),
    );
    await flush();
    await act(async () => {
      d.resolve();
      await vi.advanceTimersByTimeAsync(10);
    });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(h.saved.at(-1)?.state).not.toBe('attempting');
    expect(h.monitor).not.toHaveBeenCalled();
  });

  it('fallback path: native mounts without awaiting the launch write, which still lands', async () => {
    h.stored = {
      v: 1,
      fallbackCycles: 0,
      buildKey: '1:embedded',
      state: 'fallback',
      strikes: 0,
      lastReason: 'x',
      fallbackLaunchesRemaining: 1,
      backgrounded: false,
      abandonedStreak: 0,
      at: 1,
    };
    h.delayState = 'fallback';
    h.saveDelay = 100;
    const { result } = renderHook(() =>
      useDomMount(inputs, {
        hasLocalContent: () => false,
        loadContent: () => new Promise<void>(() => undefined),
      }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(h.saved).toHaveLength(0);
    expect(result.current.mount).toBe('native');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(h.saved.at(-1)?.state).toBe('fallback');
  });

  it('load resolves: one attempt is started and the DOM mounts', async () => {
    const d = deferred();
    const { result } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => false, loadContent: () => d.promise }),
    );
    await flush();
    await act(async () => {
      d.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.mount).toBe('dom');
    expect(h.saved.filter((r) => r.state === 'attempting')).toHaveLength(1);
    expect(h.monitor).toHaveBeenCalledTimes(1);
    expect(h.mark).toHaveBeenCalledWith('first-download-ms', expect.any(String));
  });

  it('load rejects: stays, flags failed, Retry re-invokes the load, success then mounts DOM', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
    const { result } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => false, loadContent: load }),
    );
    await flush();
    expect(result.current.mount).toBe('awaiting-content');
    expect(result.current.contentFailed).toBe(true);
    expect(h.saved).toHaveLength(0);
    await act(async () => {
      result.current.retryContent();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current.mount).toBe('dom');
  });

  it('auto-retries once when the app returns to the foreground', async () => {
    const load = vi.fn().mockRejectedValue(new Error('offline'));
    renderHook(() => useDomMount(inputs, { hasLocalContent: () => false, loadContent: load }));
    await flush();
    await act(async () => {
      h.appListener?.('active');
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(load).toHaveBeenCalledTimes(2);
    await act(async () => {
      h.appListener?.('active');
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('cache present: existing path unchanged, no load', async () => {
    const load = vi.fn();
    const { result } = renderHook(() =>
      useDomMount(inputs, { hasLocalContent: () => true, loadContent: load }),
    );
    await flush();
    expect(result.current.mount).toBe('dom');
    expect(load).not.toHaveBeenCalled();
    expect(h.saved.filter((r) => r.state === 'attempting')).toHaveLength(1);
  });
});
