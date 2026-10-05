// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({
  saved: [] as { state: string }[],
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
  loadWatchdogRecord: async () => null,
  saveWatchdogRecord: async (r: { state: string }) => {
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
import { useDomMount, type GateDeps, type LaunchInputs } from './watchdog-gate';

const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
const inputs: LaunchInputs = { override: false, sharedUi: true, watchdogReports: null };
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => (resolve = res));
  return { promise, resolve };
};

describe('useDomMount awaiting-content (offline first launch)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.saved.length = 0;
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
    expect(h.saved.some((r) => r.state === 'attempting')).toBe(false);
    expect(h.monitor).not.toHaveBeenCalled();
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
    expect(h.saved.some((r) => r.state === 'attempting')).toBe(false);
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
