// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({ saved: [] as unknown[], mark: vi.fn() }));
vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) },
  Platform: { OS: 'ios' },
}));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '1:embedded',
  loadWatchdogRecord: async () => null,
  saveWatchdogRecord: async (r: unknown) => {
    h.saved.push(r);
    return true;
  },
  loadReportsRaw: async () => null,
  saveReportsRaw: async () => undefined,
}));
vi.mock('./diagnostics-override', () => ({
  getForceDomFailure: async () => 'off',
  setForceSharedUi: async () => undefined,
}));
vi.mock('./diagnostics-send', () => ({ sendDiagReport: async () => ({ ok: true }) }));
vi.mock('./diagnostics', () => ({ diagCollector: { mark: h.mark }, setMountInfo: () => undefined }));

import { act, renderHook } from '@testing-library/react';
import { PENDING_MAX_MS } from './watchdog-policy';
import { useDomMount, type LaunchInputs } from './watchdog-gate';

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });
const inputs = (p: Partial<LaunchInputs> = {}): LaunchInputs => ({ override: false, sharedUi: null, watchdogReports: null, ...p });

describe('useDomMount slow storage (iPhone cold launch)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.saved.length = 0;
    h.mark.mockClear();
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

  it('without the override a late input stays native, with reason pending-expired', async () => {
    const { result, rerender } = renderHook(({ i }: { i: LaunchInputs | null }) => useDomMount(i), { initialProps: { i: null as LaunchInputs | null } });
    await act(async () => { await vi.advanceTimersByTimeAsync(PENDING_MAX_MS + 100); });
    rerender({ i: inputs({ sharedUi: true }) });
    await flush();
    expect(result.current.mount).toBe('native');
    expect(result.current.nativeReason).toBe('pending-expired');
    expect(h.mark).toHaveBeenCalledWith('mount-pending-expired', expect.any(String));
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
    const def = renderHook(() => useDomMount(inputs()));
    await flush();
    expect(def.result.current.nativeReason).toBe('flag-off');
  });
});
