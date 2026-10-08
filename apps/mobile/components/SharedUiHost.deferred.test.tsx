// @vitest-environment jsdom
// The real SharedUiHost + useDeferredBundleRefresh + createDeferredRefresh: cache-first render, the bundle refresh
// gated on the DOM ready signal (or the 6 s bound), and the teardown flush. Stand-ins: native modules, the DOM
// component (AppReader stub exposing the props the host hands it), the content loader and the on-disk cache lookup.
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));

const h = vi.hoisted(() => ({
  cached: true,
  load: (async () => ({})) as (...a: unknown[]) => Promise<unknown>,
  interactions: [] as Array<{ fn: () => void; cancelled: boolean }>,
  reader: null as null | Record<string, (...a: never[]) => unknown>,
}));

vi.mock('react-native', async () => {
  const React = await import('react');
  return {
    View: (p: { children?: unknown }) => React.createElement('div', null, p.children as never),
    Platform: { OS: 'ios' },
    PixelRatio: { getFontScale: () => 1 },
    StyleSheet: { create: (s: unknown) => s },
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) },
    BackHandler: { addEventListener: () => ({ remove: () => undefined }), exitApp: () => undefined },
    Linking: {},
    Share: {},
    InteractionManager: {
      runAfterInteractions: (fn: () => void) => {
        const t = { fn, cancelled: false };
        h.interactions.push(t);
        return { cancel: () => void (t.cancelled = true) };
      },
    },
  };
});
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
vi.mock('expo-secure-store', () => ({ getItemAsync: async () => null, setItemAsync: async () => undefined, deleteItemAsync: async () => undefined }));
vi.mock('expo-file-system', () => ({ File: class {}, Directory: class {}, Paths: { document: { uri: 'file:///doc' } } }));
vi.mock('../lib/use-keyboard-inset', () => ({ useKeyboardInset: () => 0 }));
vi.mock('expo-clipboard', () => ({}));
vi.mock('expo-haptics', () => ({}));
vi.mock('expo-notifications', () => ({}));
vi.mock('expo-device', () => ({}));
vi.mock('expo-application', () => ({}));
vi.mock('expo-constants', () => ({ default: { expoConfig: {} } }));
vi.mock('../lib/notification-host-ports', () => ({ createExpoNotificationDeps: () => ({}) }));
vi.mock('../lib/share-card-ports', () => ({ shareCardPorts: {} }));
vi.mock('../lib/speed-test-runtime', () => ({ speedTest: { isOn: () => false, onChange: () => () => undefined } }));
vi.mock('../lib/use-notification-taps', () => ({ notificationTapGate: { bindHost: () => () => undefined } }));
vi.mock('../lib/dom-reader-config', () => ({
  lastGoodSource: () => (h.cached ? { scriptUri: 'file:///doc/c.v2.js?v=1', jsonUri: 'file:///doc/c.json' } : null),
}));
vi.mock('../lib/content-bundle', async (orig) => ({ ...(await orig<object>()), loadContentBundle: (...a: unknown[]) => h.load(...a) }));
vi.mock('../dom/SharedUiTest', () => ({ default: () => null }));
vi.mock('../dom/AppReader', async () => {
  const React = await import('react');
  return {
    default: (p: Record<string, (...a: never[]) => unknown>) => {
      h.reader = p;
      return React.createElement('div', { 'data-testid': 'dom-reader' });
    },
  };
});

import { REFRESH_DEFER_TIMEOUT_MS } from '../lib/deferred-bundle-refresh';
import { SharedUiHost } from './SharedUiHost';

const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(async () => undefined), protocol: vi.fn() };
const bundle = { manifest: { bundleVersion: 'v-fresh' } };
let load = vi.fn(async (..._a: unknown[]) => bundle as unknown);
const mount = () => render(<SharedUiHost onSignal={vi.fn()} watch={watch} forceFailure="off" />);
const settle = () => act(async () => void (await vi.advanceTimersByTimeAsync(0)));
const token = async () => await (h.reader!.bridgeHello as () => Promise<string>)();
const handshake = () => act(async () => void (await (h.reader!.bridge as (e: unknown, t: string) => Promise<unknown>)({ v: 1, id: 'r1', kind: 'evt', type: 'ready', payload: { v: 1 }, ts: 1 } as never, await token())));
const domReady = () => act(async () => void (await (h.reader!.onReady as (t: string) => Promise<void>)(await token())));
const contentVersions = () => ((h.reader!.inbox as unknown as Array<{ type: string }>) ?? []).filter((e) => e.type === 'contentVersion');

beforeEach(() => {
  vi.useFakeTimers();
  h.cached = true;
  load = vi.fn(async (..._a: unknown[]) => bundle as unknown);
  h.load = (...a) => load(...a);
  h.interactions.length = 0;
  h.reader = null;
});
afterEach(() => vi.useRealTimers());

describe('SharedUiHost startup with a disk cache', () => {
  it('renders the DOM reader from the cache before any refresh, and does not start the refresh until the DOM is ready', async () => {
    mount();
    await settle();
    expect(screen.getByTestId('dom-reader')).toBeTruthy();
    expect(h.reader!.cacheUri).toBe('file:///doc/c.v2.js?v=1');
    expect(load).not.toHaveBeenCalled();
    expect(h.interactions).toHaveLength(0);
    await act(async () => void (await vi.advanceTimersByTimeAsync(REFRESH_DEFER_TIMEOUT_MS - 1)));
    expect(load).not.toHaveBeenCalled();
  });

  it('after onReady the refresh waits for interactions to settle, then loads once and emits the fresh version', async () => {
    mount();
    await settle();
    await handshake();
    await domReady();
    expect(watch.ready).toHaveBeenCalled();
    expect(h.interactions).toHaveLength(1);
    expect(load).not.toHaveBeenCalled();
    await act(async () => h.interactions[0]!.fn());
    expect(load).toHaveBeenCalledTimes(1);
    await settle();
    expect(JSON.stringify(contentVersions())).toContain('v-fresh');
    await act(async () => void (await vi.advanceTimersByTimeAsync(REFRESH_DEFER_TIMEOUT_MS * 2)));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('a DOM that never becomes ready: the 6 s bound starts the refresh', async () => {
    mount();
    await settle();
    await act(async () => void (await vi.advanceTimersByTimeAsync(REFRESH_DEFER_TIMEOUT_MS - 1)));
    expect(load).not.toHaveBeenCalled();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('teardown before ready flushes the refresh once (a poisoned cache is still replaced), with no timer left behind', async () => {
    const view = mount();
    await settle();
    expect(load).not.toHaveBeenCalled();
    view.unmount();
    expect(load).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('SharedUiHost startup without a cache', () => {
  it('loads at once and mounts the reader only after the cache exists', async () => {
    h.cached = false;
    let resolve!: (b: unknown) => void;
    load = vi.fn(() => new Promise<unknown>((r) => void (resolve = r)));
    mount();
    await settle();
    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('dom-reader')).toBeNull();
    h.cached = true;
    await act(async () => resolve(bundle));
    await settle();
    expect(screen.getByTestId('dom-reader')).toBeTruthy();
  });
});
