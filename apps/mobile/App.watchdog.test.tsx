// @vitest-environment jsdom
// W6 closure proof, end to end through the REAL App: useDomMount (real watchdog gate + store over an in-memory
// expo-secure-store), real DomHostMount/SharedUiHost (real bridge host/link/handlers/tap binder), real
// useNotificationTaps + process-wide tap gate + ingest, real useNativeOverlay presenter, real useNativeScreenState and
// route resolution. Stand-ins: native modules, the DOM component (AppReader: a stub that speaks the bridge the way the
// DOM does), and the screens/overlay Modal (stubs that expose the state they were handed).
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../web/node_modules/react-dom'));

const h = vi.hoisted(() => ({
  store: new Map<string, string>(),
  tapListener: null as null | ((r: unknown) => void),
  reader: null as null | Record<string, (...a: never[]) => unknown>,
  overlay: null as null | { state: { phase: string; seq: number }; presenter: { opened: (n: number) => unknown; getState: () => { phase: string; route: unknown } } },
  nav: null as null | { inboxOpen: boolean },
}));

vi.mock('react-native', async () => {
  const React = await import('react');
  const el = (tag: string) => (p: { children?: unknown; testID?: string }) => React.createElement(tag, { 'data-testid': p.testID }, p.children as never);
  return {
    View: el('div'),
    Platform: { OS: 'android' },
    StyleSheet: { create: (s: unknown) => s, hairlineWidth: 1 },
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) },
    BackHandler: { addEventListener: () => ({ remove: () => undefined }), exitApp: () => undefined },
    Linking: { openURL: async () => undefined, getInitialURL: async () => null, addEventListener: () => ({ remove: () => undefined }) },
    Share: { share: async () => ({}) },
    InteractionManager: { runAfterInteractions: (fn: () => void) => ({ cancel: () => void fn }) },
  };
});
vi.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: (p: { children?: unknown }) => p.children }));
vi.mock('./lib/use-keyboard-inset', () => ({ useKeyboardInset: () => 0 }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: { children?: unknown }) => p.children,
  SafeAreaView: (p: { children?: unknown }) => p.children,
  initialWindowMetrics: null,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: () => null }));
vi.mock('expo-system-ui', () => ({ setBackgroundColorAsync: async () => undefined }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => h.store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void h.store.set(k, v),
  deleteItemAsync: async (k: string) => void h.store.delete(k),
}));
vi.mock('expo-application', () => ({ nativeBuildVersion: '1' }));
vi.mock('expo-updates', () => ({ updateId: null }));
vi.mock('expo-constants', () => ({ default: { expoConfig: {} } }));
vi.mock('expo-device', () => ({ isDevice: true }));
vi.mock('expo-file-system', () => ({ File: class {}, Directory: class {}, Paths: { document: { uri: 'file:///doc' } } }));
vi.mock('expo-clipboard', () => ({}));
vi.mock('expo-haptics', () => ({}));
vi.mock('expo-screen-orientation', () => ({}));
vi.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: async () => null,
  clearLastNotificationResponseAsync: async () => undefined,
  addNotificationResponseReceivedListener: (cb: (r: unknown) => void) => {
    h.tapListener = cb;
    return { remove: () => void (h.tapListener = null) };
  },
}));
vi.mock('react-native-webview', () => ({ WebView: () => null }));
vi.mock('./components/SiteShell', () => ({ SITE_URL: 'https://www.longlivets.com' }));
vi.mock('./lib/orientation-lock', () => ({ lockPhonesToPortrait: async () => undefined }));
vi.mock('./lib/ensure-device-registered', () => ({ ensureDeviceRegistered: async () => undefined }));
vi.mock('./lib/notification-actions', () => ({ registerNotificationActions: async () => undefined }));
vi.mock('./lib/notification-host-ports', () => ({ createExpoNotificationDeps: () => ({}) }));
vi.mock('./lib/share-card-ports', () => ({ shareCardPorts: {} }));
vi.mock('./lib/speed-test-runtime', () => ({ installSpeedTest: () => undefined, speedTest: { isOn: () => false, onChange: () => () => undefined } }));
vi.mock('./lib/diagnostics-send', () => ({ sendDiagReport: async () => ({ ok: true }) }));
vi.mock('./lib/app-config', async (orig) => ({
  ...(await orig<typeof import('./lib/app-config')>()),
  loadAppConfig: async () => ({}),
  loadLaunchFlags: async () => ({ sharedUi: null, watchdogReports: null }),
}));
vi.mock('./lib/dom-reader-config', () => ({ lastGoodSource: () => ({ scriptUri: 'file:///doc/c.v2.js?v=1', jsonUri: 'file:///doc/c.json' }) }));
vi.mock('./lib/content-bundle', async (orig) => ({ ...(await orig<object>()), loadContentBundle: async () => ({ manifest: { bundleVersion: 'v1' } }) }));
vi.mock('./components/DiagHotCorner', () => ({ DiagHotCorner: () => null }));
vi.mock('./components/UpdateRequiredScreen', () => ({ UpdateRequiredScreen: () => null }));
vi.mock('./dom/SharedUiTest', () => ({ default: () => null }));
vi.mock('./components/NativeScreenRouter', async () => {
  const React = await import('react');
  return {
    NativeScreenRouter: (p: { nav: { inboxOpen: boolean } }) => {
      h.nav = p.nav;
      return React.createElement('div', { 'data-testid': 'native-surface', 'data-inbox': String(p.nav.inboxOpen) });
    },
  };
});
vi.mock('./components/NativeOverlayHost', async () => {
  const React = await import('react');
  return {
    NativeOverlayHost: (p: NonNullable<typeof h.overlay>) => {
      h.overlay = p;
      return React.createElement('div', { 'data-testid': 'overlay', 'data-phase': p.state.phase });
    },
  };
});
// The DOM component: the production AppReader is a 'use dom' webview. This stub is what it asks of its native host.
vi.mock('./dom/AppReader', async () => {
  const React = await import('react');
  return {
    default: (p: Record<string, (...a: never[]) => unknown>) => {
      h.reader = p;
      React.useEffect(() => () => void (h.reader = null), []);
      return React.createElement('div', { 'data-testid': 'dom-reader' });
    },
  };
});

import App from './App';
import { registerRoutes } from './dom/slots/routes';
import { notificationTapGate } from './lib/use-notification-taps';
import { beginAttempt, decideMount, recordStrike, shouldMountDom, type WatchdogRecord } from './lib/watchdog';

const env = (id: string, kind: 'evt' | 'cmd', type: string, payload: unknown) => ({ v: 1, id, kind, type, payload, ts: 1 });
const token = async () => await (h.reader!.bridgeHello as () => Promise<string>)();
const bridge = (e: unknown) => act(async () => void (await (h.reader!.bridge as (e: unknown, t: string) => Promise<unknown>)(e as never, await token()).catch(() => undefined)));
const tapResponse = (id: string, deepLink: string) => ({ notification: { date: 1, request: { identifier: id, content: { data: { deepLink } } } } });

/** Mount the App on the DOM host and run the DOM side of the handshake up to a bound tap target. */
async function mountDomApp() {
  render(<App />);
  await vi.waitFor(() => expect(h.reader).not.toBeNull());
  await bridge(env('r1', 'evt', 'ready', { v: 1 }));
  await act(async () => void (await (h.reader!.onReady as (t: string) => Promise<void>)(await token())));
  await bridge(env('r2', 'evt', 'navReady', {}));
}

beforeEach(() => {
  h.store.clear();
  h.reader = null;
  h.overlay = null;
  h.nav = null;
  registerRoutes({ slice: 'closure-test', nativeRoutes: [{ id: 'closure-test:nr', match: '/closure-native' }] });
});
afterEach(() => {
  notificationTapGate.setNativeNavigator(null);
});

describe('App: a DOM protocol fatal strikes the real watchdog and falls back to native', () => {
  it('mounts the DOM host first (default-on), no native surface yet', async () => {
    await mountDomApp();
    expect(screen.getByTestId('dom-reader')).toBeTruthy();
    expect(screen.queryByTestId('native-surface')).toBeNull();
  });

  it('DOM-reported protocol fatal: surface switches to native, the open overlay clears, a queued tap opens a native screen', async () => {
    await mountDomApp();
    // an overlay is open over the DOM host (opened through the real bridge navigate -> presenter path)
    await bridge(env('1700000000000', 'cmd', 'navigate', { path: '/closure-native', replace: false }));
    await vi.waitFor(() => expect(h.overlay!.state.phase).toBe('opening'));
    await act(async () => void h.overlay!.presenter.opened(h.overlay!.state.seq));
    expect(screen.getByTestId('overlay').getAttribute('data-phase')).toBe('open');
    // a tap arrives while the DOM host is bound: it is sent over the bridge and stays unacked
    await act(async () => h.tapListener!(tapResponse('n1', '/inbox')));
    await vi.waitFor(() => expect(notificationTapGate.size()).toBe(1));
    expect(screen.queryByTestId('native-surface')).toBeNull();

    await act(async () => void (await (h.reader!.reportProtocolFatal as (r: string, t: string) => Promise<void>)('ready-failed' as never, await token())));

    await vi.waitFor(() => expect(screen.getByTestId('native-surface')).toBeTruthy());
    expect(screen.queryByTestId('dom-reader')).toBeNull();
    expect(screen.queryByTestId('overlay')).toBeNull();
    expect(h.overlay!.presenter.getState()).toMatchObject({ phase: 'idle', route: null });
    await vi.waitFor(() => expect(screen.getByTestId('native-surface').getAttribute('data-inbox')).toBe('true'));
    await vi.waitFor(() => expect(notificationTapGate.size()).toBe(0));
    // the strike is persisted: the next launch starts from a fallback record, not a fresh attempt
    expect(JSON.parse(h.store.get('longlive_watchdog_v1')!)).toMatchObject({ strikes: 1, lastReason: 'protocol-fatal' });
  });

  it('a protocol version the host cannot speak (host-detected fatal) falls back the same way', async () => {
    render(<App />);
    await vi.waitFor(() => expect(h.reader).not.toBeNull());
    await bridge(env('r1', 'evt', 'ready', { v: 99 }));
    await vi.waitFor(() => expect(screen.getByTestId('native-surface')).toBeTruthy());
    expect(screen.queryByTestId('dom-reader')).toBeNull();
  });
});

describe('App: a quarantined build never mounts the DOM host, and taps open natively at once', () => {
  it('launch with a quarantined record: native surface, no DOM reader, the tap is never queued', async () => {
    let record: WatchdogRecord | null = null;
    for (const launch of [1, 2, 3, 4, 5, 6]) {
      const d = decideMount(record, '1:embedded', launch);
      record = d.record;
      if (shouldMountDom(true, d)) record = recordStrike(beginAttempt(record, launch), 'ready-timeout', launch).record;
    }
    expect(decideMount(record, '1:embedded', Date.now()).record.state).toBe('quarantined');
    h.store.set('longlive_watchdog_v1', JSON.stringify(record));
    render(<App />);
    await vi.waitFor(() => expect(screen.getByTestId('native-surface')).toBeTruthy());
    expect(h.reader).toBeNull();
    await vi.waitFor(() => expect(h.tapListener).not.toBeNull());
    await act(async () => h.tapListener!(tapResponse('q1', '/inbox')));
    await vi.waitFor(() => expect(screen.getByTestId('native-surface').getAttribute('data-inbox')).toBe('true'));
    expect(notificationTapGate.size()).toBe(0);
  });
});
