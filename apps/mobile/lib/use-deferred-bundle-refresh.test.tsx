// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../web/node_modules/react'));

const h = vi.hoisted(() => ({
  listeners: new Set<(s: string) => void>(),
  removed: vi.fn(),
  load: vi.fn(),
  cache: null as unknown,
}));
vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_: string, fn: (s: string) => void) => {
      h.listeners.add(fn);
      return { remove: () => (h.listeners.delete(fn), h.removed()) };
    },
  },
  InteractionManager: { runAfterInteractions: (fn: () => void) => (queueMicrotask(fn), { cancel: () => undefined }) },
}));
vi.mock('./content-bundle', () => ({ loadContentBundle: h.load }));
vi.mock('./dom-reader-config', () => ({ lastGoodSource: () => h.cache }));
vi.mock('./diagnostics', () => ({ diagMarkOnce: () => undefined }));
vi.mock('./art-cache-fs', () => ({ startArtSync: () => undefined, artMapUri: () => undefined }));

import { act, renderHook } from '@testing-library/react';
import { MIN_INTERVAL_MS } from './foreground-refresh';
import { useDeferredBundleRefresh } from './use-deferred-bundle-refresh';

const bundle = (v: string) => ({ manifest: { bundleVersion: v } });
const emit = (s: string) => act(async () => void h.listeners.forEach((fn) => fn(s)));
const flush = () => act(async () => void (await vi.advanceTimersByTimeAsync(0)));

function mount() {
  const setSource = vi.fn();
  const setContentToken = vi.fn();
  const view = renderHook(() => useDeferredBundleRefresh(false, setSource, setContentToken));
  return { setSource, setContentToken, view };
}

describe('useDeferredBundleRefresh AppState wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.listeners.clear();
    h.removed.mockClear();
    h.load.mockReset();
    h.cache = { uri: 'file:///cache' };
  });
  afterEach(() => vi.useRealTimers());

  it('defers the launch refresh until the DOM is ready, and a foreground before that does nothing', async () => {
    h.load.mockResolvedValue(bundle('v1'));
    const m = mount();
    await emit('active');
    expect(h.load).not.toHaveBeenCalled();
    act(() => m.view.result.current());
    await flush();
    expect(h.load).toHaveBeenCalledTimes(1);
    expect(m.setContentToken).toHaveBeenCalledWith('v1');
  });

  it('launch offline then foreground online runs exactly one more refresh and adopts the new version', async () => {
    h.load.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(bundle('v2'));
    const m = mount();
    act(() => m.view.result.current());
    await flush();
    expect(m.setContentToken).not.toHaveBeenCalled();
    await act(async () => void (await vi.advanceTimersByTimeAsync(10_000)));
    await emit('active');
    await emit('active');
    await flush();
    expect(h.load).toHaveBeenCalledTimes(2);
    expect(m.setContentToken).toHaveBeenCalledWith('v2');
  });

  it('rapid foregrounds after a successful check are debounced, then allowed after the floor', async () => {
    h.load.mockResolvedValue(bundle('v1'));
    const m = mount();
    act(() => m.view.result.current());
    await flush();
    await emit('active');
    await emit('background');
    await emit('active');
    expect(h.load).toHaveBeenCalledTimes(1);
    await act(async () => void (await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS)));
    await emit('active');
    await flush();
    expect(h.load).toHaveBeenCalledTimes(2);
  });

  it('cleanup removes the AppState listener and later foregrounds are ignored', async () => {
    h.load.mockResolvedValue(bundle('v1'));
    const m = mount();
    act(() => m.view.result.current());
    await flush();
    m.view.unmount();
    expect(h.removed).toHaveBeenCalledTimes(1);
    expect(h.listeners.size).toBe(0);
    await act(async () => void (await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS)));
    await emit('active');
    expect(h.load).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe on the test page', () => {
    renderHook(() => useDeferredBundleRefresh(true, vi.fn(), vi.fn()));
    expect(h.listeners.size).toBe(0);
  });
});
