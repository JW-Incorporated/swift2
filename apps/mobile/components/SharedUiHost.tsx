// One UI WP0.4/0.5b: native host for the 'use dom' pages. Under the C4 override
// it mounts ReaderSpike (the real era stream, WP0.5b); the WP0.4 test page stays
// reachable through the Diagnostics "test page" toggle. Records the watchdog
// signals (launch attempted / ready / DOM-side errors / webview process death)
// through `onSignal` and forwards them to the WP0.4b watchdog via `watch`.
// Supplying onContentProcessDidTerminate / onRenderProcessGone REPLACES the
// expo wrapper's auto-reload; this host never reloads or shows its own error
// screen. A crash is a watchdog strike, and the strike unmounts this host in
// favour of the native screens (lib/watchdog-gate.ts).
// The webview reads the native disk cache itself: only a cache URI and a
// version token cross the bridge (C6), never content.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Linking, Platform, Share, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Envelope, Insets, WebPath } from '@swift2/ui';
import ReaderSpike from '../dom/ReaderSpike';
import SharedUiTest from '../dom/SharedUiTest';
import { setLatestProbeJson, withNativeTiming } from '../dom/spike/probe';
import { createWiredHandlers } from '../lib/app-handlers';
import { createBackHandler, createContentVersionEmitter, createInsetsEmitter } from '../lib/bridge-handlers-ui';
import { createBridgeHost, type BridgeHost } from '../lib/bridge-host';
import { loadContentBundle } from '../lib/content-bundle';
import { createBridgeLink, createDomHostHandlers, sameInbox, type DomSignal } from '../lib/dom-host-handlers';
import { setProbeJson } from '../lib/dom-probe-store';
import { noteImageLoaded } from '../lib/image-marks';
import { DEFAULT_ROUTE_FLAGS, type RouteFlags } from '../lib/routes';
import { speedTest } from '../lib/speed-test-runtime';
import { createUiDeps } from '../lib/ui-deps';
import { lastGoodCacheUri } from '../lib/dom-reader-config';
import { getUseTestPage } from '../lib/diagnostics-override';
import type { DomFailureMode } from '../lib/watchdog';
import type { DomWatch } from '../lib/watchdog-gate';

interface ReaderSource {
  cacheUri: string | null;
}

export function SharedUiHost({
  onSignal,
  watch,
  forceFailure,
  siteUrl,
  getRouteFlags,
  presentNativeRoute,
}: {
  onSignal: DomSignal;
  watch: DomWatch;
  forceFailure: DomFailureMode;
  /** UI bridge `navigate` inputs (H4/D1 wires them from App.tsx); defaults: production site, DEFAULT_ROUTE_FLAGS. */
  siteUrl?: string;
  getRouteFlags?: () => RouteFlags;
  /** The D-7 presenter. Absent: a native-route `navigate` answers `failed`. */
  presentNativeRoute?: (path: WebPath) => unknown;
}) {
  const [testPage, setTestPage] = useState<boolean | null>(null);
  const [source, setSource] = useState<ReaderSource | null>(null);
  const [contentToken, setContentToken] = useState('');
  const [inbox, setInbox] = useState<Envelope[]>([]);
  // One bridge host + link per epoch; the DOM page is keyed by the epoch so it re-handshakes with every new host.
  const [session, setSession] = useState<{ epoch: number; link: ReturnType<typeof createBridgeLink> } | null>(null);
  const epochRef = useRef(0);
  const hostRef = useRef<BridgeHost | null>(null);
  const emitRef = useRef<{ insets: (i: Insets) => void; version: (t: string) => void } | null>(null);
  const navRef = useRef({ siteUrl, getRouteFlags, presentNativeRoute });
  navRef.current = { siteUrl, getRouteFlags, presentNativeRoute };
  const launchedAt = useRef(0);
  const nativeMs = useRef<number | null>(null);
  const rawProbe = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const [speedOn, setSpeedOn] = useState(speedTest.isOn());
  useEffect(() => {
    const sync = () => setSpeedOn(speedTest.isOn());
    sync();
    return speedTest.onChange(sync);
  }, []);

  useEffect(() => {
    launchedAt.current = Date.now();
    onSignal('dom-launch-attempted');
    void getUseTestPage().then(setTestPage);
  }, []);

  useEffect(() => {
    if (testPage !== false) return;
    // Cache-first: render from what is on disk now (offline relaunch), refresh in the background.
    const cached = lastGoodCacheUri();
    if (cached) setSource({ cacheUri: cached });
    void loadContentBundle()
      .then((bundle) => {
        setContentToken(bundle.manifest.bundleVersion);
        if (!cached) setSource({ cacheUri: lastGoodCacheUri() });
      })
      .catch(() => {
        if (!cached) setSource({ cacheUri: null });
      });
  }, [testPage]);

  const handlers = useMemo(
    () =>
      createDomHostHandlers({
        onSignal,
        watch,
        bridge: session?.link.bridge,
        bridgeClosed: session?.link.isClosed,
      }),
    [session],
  );

  useEffect(() => {
    const epoch = ++epochRef.current;
    const ref: { host?: BridgeHost } = {};
    const link = createBridgeLink(() => {
      const next = ref.host?.inbox() ?? [];
      setInbox((prev) => (sameInbox(prev, next) ? prev : next));
    });
    const uiDeps = createUiDeps({
      linking: Linking,
      share: Share,
      haptics: Haptics,
      platformOS: Platform.OS,
      log: onSignal,
      siteUrl: navRef.current.siteUrl,
      getFlags: () => navRef.current.getRouteFlags?.() ?? DEFAULT_ROUTE_FLAGS,
      getPresenter: () => navRef.current.presentNativeRoute,
    });
    const host = createBridgeHost({
      handlers: createWiredHandlers(onSignal, { ui: uiDeps }),
      send: link.send,
      now: Date.now,
      scheduler: { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
      onProtocolFatal: (reason) => {
        onSignal('bridge-protocol-fatal', reason.slice(0, 200));
        link.dispose();
        watch.protocol();
      },
      onSignal,
    });
    ref.host = host;
    hostRef.current = host;
    emitRef.current = {
      insets: createInsetsEmitter((i) => void host.emit('insets', i)),
      version: createContentVersionEmitter((e) => void host.emit('contentVersion', e)),
    };
    link.attach(host);
    setInbox([]);
    setSession({ epoch, link });
    return () => {
      hostRef.current = null;
      emitRef.current = null;
      host.dispose();
      link.dispose();
      setSession(null);
      setInbox([]);
    };
  }, []);

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
    if (forceFailure === 'throw' && source) void handlers.reportError('forced DOM failure');
  }, [forceFailure, source]);

  const publishProbe = (json: string) => {
    const merged = withNativeTiming(json, nativeMs.current);
    rawProbe.current = json;
    setProbeJson(merged);
    setLatestProbeJson(merged);
  };

  const dom = {
    onContentProcessDidTerminate: handlers.onContentProcessDidTerminate,
    onRenderProcessGone: handlers.onRenderProcessGone,
  };

  return (
    <View style={testPage ? styles.test : styles.fill}>
      {testPage === true ? (
        <SharedUiTest
          dom={dom}
          onReady={handlers.onReady}
          reportError={handlers.reportError}
          forceFailure={forceFailure}
        />
      ) : testPage === false && source && session ? (
        <ReaderSpike
          key={session.epoch}
          dom={dom}
          cacheUri={source.cacheUri ?? undefined}
          inbox={inbox}
          bridge={handlers.bridge}
          reportProtocolFatal={handlers.reportProtocolFatal}
          onReady={
            forceFailure === 'off'
              ? async () => {
                  nativeMs.current = Date.now() - launchedAt.current;
                  if (rawProbe.current) publishProbe(rawProbe.current);
                  await handlers.onReady();
                }
              : async () => {}
          }
          reportError={handlers.reportError}
          reportProbe={async (json) => publishProbe(json)}
          speedTestOn={speedOn}
          reportImageLoad={async (visible) => noteImageLoaded(visible)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0b0b0f' },
  test: { flex: 1, backgroundColor: '#0b0b0f', justifyContent: 'center', padding: 24 },
});
