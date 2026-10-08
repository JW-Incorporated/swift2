// @vitest-environment jsdom
// Perf: an unchanged host re-render must hand the Expo DOM component referentially-equal props,
// otherwise Expo DOM re-marshals them across the webview boundary on every host render.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const readerProps = vi.hoisted(() => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  return [] as Record<string, unknown>[];
});

vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
  BackHandler: { addEventListener: () => ({ remove() {} }), exitApp() {} },
  Linking: { openURL: async () => {} },
  Platform: { OS: 'ios' },
  PixelRatio: { getFontScale: () => 1 },
  Share: { share: async () => ({}) },
  StyleSheet: { create: <T,>(s: T) => s },
  View: 'div',
}));
vi.mock('expo-clipboard', () => ({}));
vi.mock('expo-haptics', () => ({}));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('../dom/AppReader', () => ({
  default: (props: Record<string, unknown>) => {
    readerProps.push(props);
    return null;
  },
}));
vi.mock('../dom/SharedUiTest', () => ({ default: () => null }));
vi.mock('../lib/diagnostics-override', () => ({ getUseTestPage: async () => false }));
vi.mock('../lib/art-cache-fs', () => ({ noteArtEra: () => undefined }));
vi.mock('../lib/use-deferred-bundle-refresh', () => ({
  useDeferredBundleRefresh: (
    _t: unknown,
    setSource: (s: unknown) => void,
    setToken: (t: string) => void,
  ) => {
    setTimeout(() => {
      setSource({ cache: null });
      setToken('v1');
    }, 0);
    return () => {};
  },
}));
vi.mock('../lib/use-content-adoption', () => {
  const adoption = {
    epochStarted() {},
    navReady() {},
    route() {},
    readerReady() {},
  };
  return { useContentAdoption: () => adoption };
});
vi.mock('../lib/use-keyboard-inset', () => ({ useKeyboardInset: () => 0 }));
vi.mock('../lib/speed-test-runtime', () => ({
  speedTest: { isOn: () => false, onChange: () => () => {} },
}));
vi.mock('../lib/notification-host-ports', () => ({ createExpoNotificationDeps: () => ({}) }));
vi.mock('../lib/share-card-ports', () => ({ shareCardPorts: {} }));
vi.mock('../lib/host-storage-file', () => ({ createFileHostStorage: () => ({}) }));
vi.mock('../lib/app-handlers', () => ({
  createAppHandlersFor: () => ({}),
  createLiveApiDeps: () => ({}),
}));

vi.mock('../lib/ui-deps', () => ({ createUiDeps: () => ({}) }));
vi.mock('../lib/use-notification-taps', () => ({
  notificationTapGate: {},
}));

import { SharedUiHost } from './SharedUiHost';

describe('SharedUiHost prop stability', () => {
  let root: ReturnType<typeof createRoot> | null = null;
  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    readerProps.length = 0;
  });

  it('re-render with unchanged inputs passes referentially-equal DOM props', async () => {
    const host = document.createElement('div');
    const watch = { protocol() {}, ready() {}, fail() {} } as never;
    const onSignal = vi.fn();
    const el = createElement(SharedUiHost, { onSignal, watch, forceFailure: 'off' });
    root = createRoot(host);
    await act(async () => {
      root!.render(el);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(readerProps.length).toBeGreaterThan(0);
    const before = readerProps.length;
    const first = readerProps[before - 1]!;
    await act(async () => {
      root!.render(createElement(SharedUiHost, { onSignal, watch, forceFailure: 'off' }));
    });
    const last = readerProps[readerProps.length - 1]!;
    expect(readerProps.length).toBeGreaterThan(before);
    for (const key of [
      'dom',
      'onReady',
      'reportError',
      'reportProbe',
      'reportImageLoad',
      'bridge',
    ]) {
      expect(last[key], key).toBe(first[key]);
    }
  });
});
