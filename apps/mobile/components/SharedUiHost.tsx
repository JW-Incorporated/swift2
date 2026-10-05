// One UI WP0.4/0.5b: native host for the 'use dom' pages. Under the C4 override
// it mounts AppReader (the production DOM reader, D2); the WP0.4 test page stays
// reachable through the Diagnostics "test page" toggle. Records the watchdog
// signals (launch attempted / ready / DOM-side errors / webview process death)
// through `onSignal` and forwards them to the WP0.4b watchdog via `watch`.
// Supplying onContentProcessDidTerminate / onRenderProcessGone REPLACES the expo wrapper's
// auto-reload; policy is ours (lib/watchdog.ts, lib/watchdog-gate.ts): a crash before ready or a repeat
// within RELOAD_WINDOW_MS is a strike that unmounts this host; the first crash after ready re-keys the mount.
// The webview reads the native disk cache itself: only a cache URI and version token cross the bridge (C6).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Platform, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Envelope, Insets, WebPath } from '@swift2/ui';
import AppReader from '../dom/AppReader';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes';
import SharedUiTest from '../dom/SharedUiTest';
import { setLatestProbeJson, withNativeTiming } from '../dom/reader/probe';
import { eraColors } from '../lib/theme';
import { sharedUiDomProps } from '../lib/shared-ui-dom-props';
import { resetNativeTheme, setNativeTheme } from '../lib/native-theme-store';
import { createAppHandlersFor, createLiveApiDeps } from '../lib/app-handlers';
import { createBackHandler, createContentVersionEmitter, createInsetsEmitter } from '../lib/bridge-handlers-ui';
import { createBridgeHost, type BridgeHost } from '../lib/bridge-host';
import { newBridgeToken } from '../lib/bridge-token';
import { createProbePublisher } from '../lib/probe-publisher';
import { useContentAdoption } from '../lib/use-content-adoption';
import { useDeferredBundleRefresh } from '../lib/use-deferred-bundle-refresh';
import { createBridgeLink, createDomHostHandlers, sameInbox, type DomSignal } from '../lib/dom-host-handlers';
import { createRunWhenActive } from '../lib/run-when-active';
import { setProbeJson } from '../lib/dom-probe-store';
import { noteImageLoaded } from '../lib/image-marks';
import { createExpoNotificationDeps } from '../lib/notification-host-ports';
import type { RouteFlags } from '../lib/routes';
import { resolveDestination } from '../lib/destination-resolver';
import { useSpeedOn } from '../lib/use-speed-on';
import { createTapBinder, createTapTarget, disposeEpoch, releaseBeforeStrike, type TapBinder } from '../lib/tap-bind-epoch';
import { createUiDeps } from '../lib/ui-deps';
import { createFileHostStorage } from '../lib/host-storage-file';
import { shareCardPorts } from '../lib/share-card-ports';
import { notificationTapGate } from '../lib/use-notification-taps';
import type { LastGoodSource } from '../lib/dom-reader-config';
import { getUseTestPage } from '../lib/diagnostics-override';
import type { DomFailureMode } from '../lib/watchdog';
import type { DomWatch } from '../lib/watchdog-gate';

const SITE_FALLBACK = 'https://www.longlivets.com';

interface ReaderSource {
  cache: LastGoodSource | null;
}

// One per process: every epoch's bridge host shares the cached blob.
const hostStorage = createFileHostStorage();

export function SharedUiHost({
  onSignal,
  watch,
  forceFailure,
  siteUrl,
  getRouteFlags,
  presentNativeRoute,
  onDomNavigator,
}: {
  onSignal: DomSignal;
  watch: DomWatch;
  forceFailure: DomFailureMode;
  /** UI bridge `navigate` inputs (H4/D1 wires them from App.tsx); defaults: production site, DEFAULT_ROUTE_FLAGS. */
  siteUrl?: string;
  getRouteFlags?: () => RouteFlags;
  /** The D-7 presenter. Absent: a native-route `navigate` answers `failed`. */
  presentNativeRoute?: (path: WebPath) => unknown;
  /** Receives the live epoch's native-to-DOM navigator (null when the epoch ends), for native screens that hand a path to the DOM. */
  onDomNavigator?: (fn: ((path: string) => Promise<boolean>) | null) => void;
}) {
  const [testPage, setTestPage] = useState<boolean | null>(null);
  const [source, setSource] = useState<ReaderSource | null>(null);
  const [contentToken, setContentToken] = useState('');
  const [inbox, setInbox] = useState<Envelope[]>([]);
  // One bridge host + link per epoch; the DOM page is keyed by the epoch so it re-handshakes with every new host.
  const [session, setSession] = useState<{ epoch: number; link: ReturnType<typeof createBridgeLink>; binder: TapBinder; token: string } | null>(null);
  const [generation, setGeneration] = useState(0);
  const epochRef = useRef(0);
  const hostRef = useRef<BridgeHost | null>(null);
  const activeDeferral = useRef(
    createRunWhenActive({
      state: () => AppState.currentState,
      subscribe: (cb) => {
        const sub = AppState.addEventListener('change', cb);
        return () => sub.remove();
      },
    }),
  ).current;
  useEffect(() => () => activeDeferral.cancel(), []);
  const emitRef = useRef<{ insets: (i: Insets) => void; version: (t: string) => void } | null>(null);
  const navRef = useRef({ siteUrl, getRouteFlags, presentNativeRoute, onDomNavigator });
  navRef.current = { siteUrl, getRouteFlags, presentNativeRoute, onDomNavigator };
  const launchedAt = useRef(0);
  const nativeMs = useRef<number | null>(null);
  const probe = useRef(createProbePublisher({ nativeMs: () => nativeMs.current, withNativeTiming, sinks: [setProbeJson, setLatestProbeJson] })).current;
  const insets = useSafeAreaInsets();
  const speedOn = useSpeedOn();

  useEffect(() => {
    launchedAt.current = Date.now();
    onSignal('dom-launch-attempted');
    void getUseTestPage().then(setTestPage);
  }, []);

  const domReady = useDeferredBundleRefresh(testPage, setSource, setContentToken);
  const adoption = useContentAdoption(testPage, { bump: () => setGeneration((g) => g + 1), onSignal, setSource, watch });

  const handlers = useMemo(
    () =>
      createDomHostHandlers({
        onSignal,
        watch: session ? releaseBeforeStrike(watch, session.binder) : watch,
        bridge: session?.link.bridge,
        bridgeClosed: session?.link.isClosed,
        reload: () => setGeneration((g) => g + 1),
        // Epoch fence: a crash closes the epoch synchronously, before React commits the re-key.
        isCurrent: session ? () => epochRef.current === session.epoch : undefined,
        invalidate: () => void (epochRef.current += 1),
        whenActive: (fn) => activeDeferral.run(fn),
        token: session?.token ?? '',
        onProbe: probe.publish,
        onImageLoad: noteImageLoaded,
      }),
    [session],
  );

  useEffect(() => {
    const epoch = ++epochRef.current;
    adoption.epochStarted();
    const ref: { host?: BridgeHost; binder?: TapBinder; target?: ReturnType<typeof createTapTarget> } = {};
    const link = createBridgeLink(() => {
      const next = ref.host?.inbox() ?? [];
      setInbox((prev) => (sameInbox(prev, next) ? prev : next));
    });
    const uiDeps = createUiDeps({
      linking: Linking,
      share: Share,
      cards: shareCardPorts,
      clipboard: Clipboard,
      haptics: Haptics,
      hostStorage,
      platformOS: Platform.OS,
      log: onSignal,
      siteUrl: navRef.current.siteUrl,
      getPresenter: () => navRef.current.presentNativeRoute,
    });
    const host = createBridgeHost({
      handlers: createAppHandlersFor(onSignal, { ui: uiDeps, api: createLiveApiDeps(), notifications: createExpoNotificationDeps() }),
      send: link.send,
      now: Date.now,
      scheduler: { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
      onBeforeShutdown: () => ref.binder?.release(),
      onReadyAgain: () => ref.binder?.readyAgain(),
      onNavReady: () => {
        ref.binder?.navReady();
        adoption.navReady((p) => ref.target?.navigateDom(p) ?? Promise.resolve(false), (snap) => void ref.host?.emit('restore', { snap }));
      },
      onRoute: (path, busy, engaged, snap) => epochRef.current === epoch && adoption.route(path, busy, engaged, snap),
      onNavigated: (e) => ref.target?.onNavigated(e),
      onTheme: setNativeTheme,
      onProtocolFatal: (reason) => {
        if (epochRef.current !== epoch) return;
        onSignal('bridge-protocol-fatal', reason.slice(0, 200));
        link.dispose();
        watch.protocol();
      },
      onSignal,
    });
    const destination = (p: string) => resolveDestination(p, { isHostRoute, siteUrl: navRef.current.siteUrl ?? SITE_FALLBACK });
    const target = createTapTarget({
      host,
      onGiveUp: () => onSignal('bridge-nav-gave-up'),
      onRejected: (p) => onSignal('bridge-nav-rejected', p.slice(0, 120)),
      canonicalize: (p) => destination(p).path,
      isReaderPath: (p) => destination(p).kind === 'dom',
      openElsewhere: async (p) => {
        if (isHostRoute(p)) {
          const r = navRef.current.presentNativeRoute?.(p as WebPath);
          return r === 'applied' || r === 'noop';
        }
        await Linking.openURL(new URL(p, navRef.current.siteUrl ?? SITE_FALLBACK).toString());
        return true;
      },
    });
    // A tap/deep-link/native navigation reaching this epoch outranks a pending state restore (content adoption).
    const gateTarget = { ...target, emit: ((t: 'navigate', p: never) => (adoption.userNavigated(), target.emit(t, p))) as typeof target.emit, navigateDom: (p: string) => (adoption.userNavigated(), target.navigateDom(p)) };
    const binder = createTapBinder({ gate: notificationTapGate, host: gateTarget, onReadinessLoss: () => setGeneration((g) => g + 1), onNavUnbound: () => onSignal('bridge-nav-unbound') });
    ref.target = target;
    navRef.current.onDomNavigator?.((p) => (adoption.userNavigated(), target.navigateDom(p)));
    ref.binder = binder;
    ref.host = host;
    hostRef.current = host;
    emitRef.current = {
      insets: createInsetsEmitter((i) => void host.emit('insets', i)),
      version: createContentVersionEmitter((e) => void host.emit('contentVersion', e)),
    };
    link.attach(host);
    setInbox([]);
    setSession({ epoch, link, binder, token: newBridgeToken() });
    return () => {
      navRef.current.onDomNavigator?.(null);
      hostRef.current = null;
      emitRef.current = null;
      disposeEpoch(binder, host, link);
      resetNativeTheme();
      setSession(null);
      setInbox([]);
    };
  }, [generation]);

  // Hardware back: DOM first over the bridge (a `back` command), then native exit. Before the DOM is ready the press falls through.
  useEffect(() => {
    const host = hostRef.current;
    if (testPage !== false || !session || !host) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', createBackHandler(host, () => BackHandler.exitApp()));
    return () => sub.remove();
  }, [testPage, session]);

  // The DOM is the sole inset owner: native only reports. The host holds these until `ready`, then flushes.
  useEffect(() => {
    emitRef.current?.insets(insets);
  }, [session, insets.top, insets.right, insets.bottom, insets.left]);

  useEffect(() => {
    if (contentToken) emitRef.current?.version(contentToken);
  }, [session, contentToken]);

  useEffect(() => {
    if (forceFailure === 'throw' && source) if (session) void handlers.reportError('forced DOM failure', session.token);
  }, [forceFailure, source, session]);

  // Memoized so an unchanged host render hands the Expo DOM component referentially-equal props (no re-marshal).
  const dom = useMemo(() => sharedUiDomProps(handlers), [handlers]);
  const domReadyRef = useRef(domReady);
  domReadyRef.current = domReady;
  const onReadyReal = useMemo(
    () => async (token: string) => {
      await handlers.onReady(token);
      nativeMs.current = Date.now() - launchedAt.current;
      if (probe.raw()) probe.publish(probe.raw()!);
      domReadyRef.current();
      session?.binder.firstPaint();
      adoption.readerReady();
    },
    [handlers, session, probe, adoption],
  );
  const onReadyNoop = useCallback(async () => {}, []);

  return (
    <View style={testPage ? styles.test : styles.fill}>
      {testPage === true ? (
        <SharedUiTest
          dom={dom}
          bridgeHello={handlers.bridgeHello}
          onReady={handlers.onReady}
          reportError={handlers.reportError}
          forceFailure={forceFailure}
        />
      ) : testPage === false && source && session ? (
        <AppReader
          key={session.epoch}
          dom={dom}
          cacheUri={source.cache?.scriptUri}
          cacheJsonUri={source.cache?.jsonUri}
          artMapUri={source.cache?.artMapUri}
          inbox={inbox}
          bridge={handlers.bridge}
          bridgeHello={handlers.bridgeHello}
          reportProtocolFatal={handlers.reportProtocolFatal}
          onReady={forceFailure === 'off' ? onReadyReal : onReadyNoop}
          reportError={handlers.reportError}
          reportProbe={handlers.reportProbe}
          speedTestOn={speedOn}
          reportImageLoad={handlers.reportImageLoad}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: eraColors.bg },
  test: { flex: 1, backgroundColor: eraColors.bg, justifyContent: 'center', padding: 24 },
});
