'use dom';

// One UI H4/D2: the production DOM-host reader (was ReaderSpike): packages/ui ReaderRoot with the slot
// registry, the app HostAdapter and the bridge. The webview is READ-ONLY over the native disk cache: the host
// passes a file:// URI + version token (config, not content, C6); the bundle is
// read here, turned into a ReaderSnapshot with packages/content (C6), poured
// into the shims, and only THEN are the web components required (their
// module-level constants derive from the filled arrays).
import './reader-spike.css';
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { ReaderSnapshotCore, ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { toWebPath, UI_PACKAGE_VERSION, type Envelope, type Insets, type ReaderSnap } from '@swift2/ui';
import type { NavigateDeps } from './bridge/navigate-subscriber';
import { currentDomUrl, DOM_PATH_EVENT, setDomPath } from './bridge/dom-path';
import { showDomPath } from './bridge/dom-path-commit';
import { createNavigateDom } from './bridge/reader-nav';
import type { ReaderControls } from './bridge/reader-controls';
import { ExpoBridgeMount, NO_BRIDGE, type BackFn, type ReaderClient } from './bridge/expo-bridge-mount';
import { createNativeCalls } from './bridge/native-calls';
import { createProbe, checkMarkers } from './reader/probe';
import { readLocalText, unreadableMessage, type ReadAttempt } from './reader/read-local';
import { useDomEnvironment } from './reader/use-dom-environment';
import { useFirstPaintReport } from './reader/use-first-paint-report';
import { snapshotFromEnvelope } from './reader/snapshot';
import { fill } from './reader/shims/fill';
import { installStorageShim } from './reader/storage-shim';
import { loadReader, type ReaderProps } from './reader/reader-modules';
import { loadStorageSeed } from './reader/storage-sync';
import { applyKeyboardInset } from './keyboard-inset';
import { loadArtMap } from './reader/art-map';
import { insetsFromQuery } from './reader/insets-query';

export interface AppReaderProps {
  /** file:// URI of the `last-good` cache's `.js` twin (script-loaded, `?v=` cache-busted). */
  cacheUri?: string;
  /** file:// URI of the `last-good` cache `.json`, for the XHR/fetch fallbacks. */
  cacheJsonUri?: string;
  artMapUri?: string;
  /** Web/dev seed for the probe version; on device the host sends it as the `contentVersion` event. */
  versionToken?: string;
  /** Native OS (react-native Platform.OS), set by the host; labels in-app feedback. */
  platform?: string;
  /** Web/dev only: on device the host sends `insets` events (the DOM is the sole inset owner). */
  insets?: Insets;
  /** Native actions below take the per-epoch bridge token (from `bridgeHello`) as their LAST arg; the token never travels as a prop. */
  onReady: (token: string) => Promise<void>;
  reportError: (message: string, token: string) => Promise<void>;
  reportProbe: (json: string, token: string) => Promise<void>;
  /** Speed test mode (#4896): one call per loaded image; `visible` = inside the viewport. */
  reportImageLoad?: (visible: boolean, token: string) => Promise<void>;
  /** Speed test mode is running: only then are image loads measured and reported. */
  speedTestOn?: boolean;
  /** Bridge (WP2.3): sequenced native-to-DOM queue, re-delivered whole on each render. */
  inbox?: Envelope[];
  /** Bridge native action: posts one envelope; may resolve with the reply (`res`, `readyAck`). Absent on web/dev. */
  bridge?: (env: Envelope, token: string) => Promise<unknown>;
  /** Native action returning the per-epoch bridge token; absent on web/dev (calls then carry ''). */
  bridgeHello?: () => Promise<string>;
  /** The DOM client's own protocol fatal (a watchdog strike in every phase, unlike reportError). */
  reportProtocolFatal?: (reason: string, token: string) => Promise<void>;
  /** Web/dev only (index.web.ts): supplies the cache envelope text where no native cache exists. */
  devLoader?: () => Promise<string>;
  dom?: import('expo/dom').DOMProps;
  ref?: React.Ref<object>;
}

type Probe = ReturnType<typeof createProbe>;

const ZERO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
/** The in-DOM web path: `/` plus the query (deep link), or an allow-listed legal path (dom-path.ts). */
const getPath = () => currentDomUrl();

export default function AppReader(props: AppReaderProps) {
  const { cacheUri, cacheJsonUri, versionToken = '', devLoader } = props;
  const [hostInsets, setHostInsets] = useState<Insets | undefined>();
  const insets = hostInsets ?? props.insets ?? (devLoader ? insetsFromQuery() : undefined);
  const backRef = useRef<BackFn | null>(null);
  const [bridgeClient, setBridgeClient] = useState<ReaderClient | null>(null);
  const client = props.bridge ? bridgeClient : NO_BRIDGE;
  const clientRef = useRef(client);
  clientRef.current = client;
  const clientWaiters = useRef<((c: ReaderClient) => void)[]>([]);
  useEffect(() => {
    if (!client) return;
    for (const w of clientWaiters.current.splice(0)) w(client);
  }, [client]);
  // A native-to-DOM navigate is applied through the reader store (ReaderBridge installs the applier) (the reader never re-keys), so open overlays survive.
  const applierRef = useRef<((search: string) => Promise<boolean>) | null>(null);
  const restorerRef = useRef<((snap: ReaderSnap) => void) | null>(null);
  const onRestore = useRef((snap: ReaderSnap) => restorerRef.current?.(snap)).current;
  const navigateDeps = useRef<NavigateDeps>({
    replaceUrl: (relative) => {
      window.history.replaceState(window.history.state, '', relative);
      window.dispatchEvent(new Event(DOM_PATH_EVENT));
    },
    setPath: (path) => showDomPath(path),
    apply: (search) => (applierRef.current ? applierRef.current(search) : Promise.reject(new Error('reader not mounted'))),
  }).current;
  const controls = useMemo<Omit<ReaderControls, 'slottedModes'>>(
    () => ({
      registerBack: (fn) => void (backRef.current = fn),
      setApplier: (fn) => void (applierRef.current = fn),
      setRestorer: (fn) => void (restorerRef.current = fn),
      openNative: async (path) => {
        const web = toWebPath(path);
        const c = clientRef.current;
        if (!web || !c) return false;
        try {
          return (await c.call('navigate', { path: web, replace: false })).ok;
        } catch {
          return false;
        }
      },
      diag: (stage, detail) => clientRef.current?.sendDiag(stage, detail),
      lastSlotted: { current: 'era' },
    }),
    [],
  );
  const navigateDom = useMemo(
    () =>
      createNavigateDom({
        replaceUrl: navigateDeps.replaceUrl,
        setPath: (path) => void setDomPath(path),
        applier: () => applierRef.current,
        openNative: controls.openNative,
      }),
    [],
  );
  const [Reader, setReader] = useState<ComponentType<ReaderProps> | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const started = useRef(false);
  const probeRef = useRef<Probe>(createProbe(versionToken));
  const snapRef = useRef<{ core: ReaderSnapshotCore; extensions: ReaderSnapshotExtensions } | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const native = useRef(createNativeCalls(propsRef)).current;

  useDomEnvironment(native, insets, props.speedTestOn, cacheUri);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const probe = probeRef.current;
    void (async () => {
      let readAttempts: ReadAttempt[] = [];
      try {
        probe.report.storage.localStorage = installStorageShim(window).includes('localStorage')
          ? 'shimmed'
          : 'present';
        let input: string | object | null = null;
        const tRead = performance.now();
        if (devLoader) input = await devLoader();
        else if (cacheUri) {
          void loadArtMap(props.artMapUri); // optional and async: never gates the first paint
          const read = await readLocalText({ scriptUri: cacheUri, jsonUri: cacheJsonUri ?? '' });
          probe.attempts(read.attempts);
          readAttempts = read.attempts;
          input = read.parsed ?? read.text;
        }
        if (!input) throw new Error('bundle cache unreadable');
        const readMs = Math.round(performance.now() - tRead);
        const { core, extensions, version, timings } = snapshotFromEnvelope(input, { eraVideoFeed });
        probe.report.timings = { readMs, ...timings };
        probe.report.version = version;
        snapRef.current = { core, extensions };
        fill(core);
        // The persisted `local` blob must be in the adapter's Map before the reader's first read (never a re-rendering prop).
        const live = clientRef.current ?? (await new Promise<ReaderClient>((res) => void clientWaiters.current.push(res)));
        const seed = await loadStorageSeed(live, (d) => live.sendDiag('storage-sync', d));
        const reader = loadReader(core, extensions, seed);
        setReader(() => reader);
        void checkMarkers(version, probe);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        probe.report.error = message;
        setFailed(message);
        await native.reportProbe(probe.json());
        const unreadable = message === 'bundle cache unreadable' && !devLoader;
        void native.reportError(
          unreadable ? unreadableMessage(readAttempts, !!cacheUri) : `reader-spike: ${message}`,
        );
      }
    })();
  }, []);

  useFirstPaintReport(Reader, native, probeRef, snapRef);

  const bridgeMount = props.bridge ? (
    <ExpoBridgeMount
      inbox={props.inbox ?? []}
      bridge={props.bridge}
      bridgeHello={props.bridgeHello}
      onFatal={(reason) => void native.reportProtocolFatal(reason)}
      onInsets={(i) => {
        setHostInsets(i);
        applyKeyboardInset(i.keyboard ?? 0);
      }}
      onContentVersion={(token) => {
        if (!probeRef.current.report.version) probeRef.current.report.version = token;
      }}
      navigateDeps={navigateDeps}
      onRestore={onRestore}
      backRef={backRef}
      onClient={setBridgeClient}
    />
  ) : null;

  const view = failed ? (
    <div style={{ padding: 16, color: '#fff' }}>Reader unavailable: {failed}</div>
  ) : !Reader || !client ? (
    <div data-swift2-ui={UI_PACKAGE_VERSION} style={{ minHeight: '100vh', background: 'var(--era-bg)' }} />
  ) : (
    <Reader client={client} insets={insets ?? ZERO_INSETS} controls={controls} navigateDom={navigateDom} getPath={getPath} platform={props.platform} />
  );
  return (
    <>
      {bridgeMount}
      {view}
    </>
  );
}
