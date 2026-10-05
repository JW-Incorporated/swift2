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
import { resErr, toWebPath, UI_PACKAGE_VERSION, type BridgeClient, type Envelope, type Insets } from '@swift2/ui';
import type { NavigateDeps } from './bridge/navigate-subscriber';
import { backFromDomPath, currentDomUrl, setDomPath } from './bridge/dom-path';
import { showDomPath } from './bridge/dom-path-commit';
import { createNavigateDom, installReaderBridge } from './bridge/reader-nav';
import type { ReaderControls } from './bridge/reader-controls';
import { useExpoBridge } from './bridge/transport-expo';
import { countPlaceholders, createProbe, checkMarkers } from './reader/probe';
import { readLocalText, unreadableMessage, type ReadAttempt } from './reader/read-local';
import { scheduleSnapshotHash } from './reader/deferred-hash';
import { snapshotFromEnvelope } from './reader/snapshot';
import { fill } from './reader/shims/fill';
import { installStorageShim } from './reader/storage-shim';
import { loadReader, type ReaderProps } from './reader/reader-modules';
import { setImageLoadListener } from './reader/image-listener';
import { applyKeyboardInset } from './keyboard-inset';

export interface AppReaderProps {
  /** file:// URI of the `last-good` cache's `.js` twin (script-loaded, `?v=` cache-busted). */
  cacheUri?: string;
  /** file:// URI of the `last-good` cache `.json`, for the XHR/fetch fallbacks. */
  cacheJsonUri?: string;
  /** Web/dev seed for the probe version; on device the host sends it as the `contentVersion` event. */
  versionToken?: string;
  /** Web/dev only: on device the host sends `insets` events (the DOM is the sole inset owner). */
  insets?: Insets;
  onReady: () => Promise<void>;
  reportError: (message: string) => Promise<void>;
  reportProbe: (json: string) => Promise<void>;
  /** Speed test mode (#4896): one call per loaded image; `visible` = inside the viewport. */
  reportImageLoad?: (visible: boolean) => Promise<void>;
  /** Speed test mode is running: only then are image loads measured and reported. */
  speedTestOn?: boolean;
  /** Bridge (WP2.3): sequenced native-to-DOM queue, re-delivered whole on each render. */
  inbox?: Envelope[];
  /** Bridge native action: posts one envelope; may resolve with the reply (`res`, `readyAck`). Absent on web/dev. */
  bridge?: (env: Envelope) => Promise<unknown>;
  /** The DOM client's own protocol fatal (a watchdog strike in every phase, unlike reportError). */
  reportProtocolFatal?: (reason: string) => Promise<void>;
  /** Web/dev only (index.web.ts): supplies the cache envelope text where no native cache exists. */
  devLoader?: () => Promise<string>;
  dom?: import('expo/dom').DOMProps;
  ref?: React.Ref<object>;
}

/** Dev/web only: ?inset=top,right,bottom,left simulates the native safe-area insets. */
function insetsFromQuery(): AppReaderProps['insets'] {
  const raw = new URLSearchParams(window.location.search).get('inset');
  if (!raw) return undefined;
  const [top = 0, right = 0, bottom = 0, left = 0] = raw.split(',').map((n) => Number(n) || 0);
  return { top, right, bottom, left };
}

type Probe = ReturnType<typeof createProbe>;

const ZERO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
/** The in-DOM web path: `/` plus the query (deep link), or an allow-listed legal path (dom-path.ts). */
const getPath = () => currentDomUrl();

type BackFn = () => 'handled' | 'exit';
type ReaderClient = Pick<BridgeClient, 'call' | 'sendDiag'>;
type MountProps = Required<Pick<AppReaderProps, 'inbox' | 'bridge'>> & {
  onFatal: (reason: string) => void;
  onInsets: (insets: Insets) => void;
  onContentVersion: (token: string) => void;
  navigateDeps: NavigateDeps;
  backRef: { current: BackFn | null };
  onClient: (client: ReaderClient) => void;
};

/** Web/dev (no native host): the bridge calls the adapter makes fail closed. */
const NO_BRIDGE: ReaderClient = { call: (async () => resErr('failed', 'no bridge')) as ReaderClient['call'], sendDiag: () => {} };

/** Renders nothing: sends `ready` after mount, subscribes the native events and the back responder, drains the inbox, and shares its client (the adapter uses the same one). Mounted only where a native host supplies `bridge`. */
function ExpoBridgeMount({ inbox, bridge, onFatal, onInsets, onContentVersion, navigateDeps, backRef, onClient }: MountProps) {
  const client = useExpoBridge({ inbox, bridge }, { onFatal }, (c) =>
    installReaderBridge(c, { onInsets, onContentVersion, back: () => (backFromDomPath() ? 'handled' : (backRef.current?.() ?? 'exit')), nav: navigateDeps }),
  );
  useEffect(() => onClient(client), [client]);
  return null;
}

export default function AppReader(props: AppReaderProps) {
  const { cacheUri, cacheJsonUri, versionToken = '', devLoader } = props;
  const [hostInsets, setHostInsets] = useState<Insets | undefined>();
  const insets = hostInsets ?? props.insets ?? (devLoader ? insetsFromQuery() : undefined);
  const backRef = useRef<BackFn | null>(null);
  const [bridgeClient, setBridgeClient] = useState<ReaderClient | null>(null);
  const client = props.bridge ? bridgeClient : NO_BRIDGE;
  const clientRef = useRef(client);
  clientRef.current = client;
  // A native-to-DOM navigate is applied through the reader store (ReaderBridge installs the applier) (the reader never re-keys), so open overlays survive.
  const applierRef = useRef<((search: string) => Promise<boolean>) | null>(null);
  const navigateDeps = useRef<NavigateDeps>({
    replaceUrl: (relative) => window.history.replaceState(window.history.state, '', relative),
    setPath: (path) => showDomPath(path),
    apply: (search) => (applierRef.current ? applierRef.current(search) : Promise.reject(new Error('reader not mounted'))),
  }).current;
  const controls = useMemo<Omit<ReaderControls, 'slottedModes'>>(
    () => ({
      registerBack: (fn) => void (backRef.current = fn),
      setApplier: (fn) => void (applierRef.current = fn),
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

  useEffect(() => {
    // The host page is a full-height flex root with a non-scrolling body; the reader scrolls the window like the site.
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root') ?? document.body.firstElementChild;
    if (root instanceof HTMLElement) {
      root.style.display = 'block';
      root.style.height = 'auto';
    }
  }, []);

  useEffect(() => {
    if (!insets) return;
    const s = document.documentElement.style;
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      s.setProperty(`--safe-${side}`, `${insets[side]}px`);
    }
  }, [insets?.top, insets?.right, insets?.bottom, insets?.left]);

  useEffect(() => {
    if (!props.speedTestOn) return;
    setImageLoadListener((visible) => void propsRef.current.reportImageLoad?.(visible));
    return () => setImageLoadListener(null);
  }, [props.speedTestOn]);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (cacheUri && e.filename === cacheUri) return; // the <script> twin of the JSON cache
      void propsRef.current.reportError(`error: ${e.message}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      void propsRef.current.reportError(`unhandledrejection: ${String(e.reason)}`);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [cacheUri]);

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
        const reader = loadReader(core, extensions);
        setReader(() => reader);
        void checkMarkers(version, probe);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        probe.report.error = message;
        setFailed(message);
        await propsRef.current.reportProbe(probe.json());
        const unreadable = message === 'bundle cache unreadable' && !devLoader;
        void propsRef.current.reportError(
          unreadable ? unreadableMessage(readAttempts, !!cacheUri) : `reader-spike: ${message}`,
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (!Reader) return;
    const probe = probeRef.current;
    const errored = new WeakSet<EventTarget>();
    // img load/error do not bubble, so listen in the capture phase.
    const onImgError = (e: Event) => void errored.add(e.target as EventTarget);
    document.addEventListener('error', onImgError, true);
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        probe.report.firstPaintMs = Math.round(performance.now());
        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        probe.report.heapMb = mem ? Math.round(mem.usedJSHeapSize / 1048576) : null;
        await propsRef.current.reportProbe(probe.json());
        await propsRef.current.onReady();
        if (snapRef.current) {
          const { core, extensions } = snapRef.current;
          scheduleSnapshotHash(core, extensions, probe, () => propsRef.current.reportProbe(probe.json()));
        }
        // Sample once the first screen has settled, then again later: lazy images that had not finished are reported as pending, not dropped.
        for (const ms of [4000, 12000]) {
          setTimeout(() => {
            const imgs = Array.from(document.images).map((i) => ({
              src: i.currentSrc || i.src,
              complete: i.complete,
              naturalWidth: i.naturalWidth,
              errored: errored.has(i),
            }));
            probe.report.placeholders = countPlaceholders(imgs);
            void propsRef.current.reportProbe(probe.json());
          }, ms);
        }
      }),
    );
    return () => document.removeEventListener('error', onImgError, true);
  }, [Reader]);

  const bridgeMount = props.bridge ? (
    <ExpoBridgeMount
      inbox={props.inbox ?? []}
      bridge={props.bridge}
      onFatal={(reason) => void propsRef.current.reportProtocolFatal?.(reason)}
      onInsets={(i) => {
        setHostInsets(i);
        applyKeyboardInset(i.keyboard ?? 0);
      }}
      onContentVersion={(token) => {
        if (!probeRef.current.report.version) probeRef.current.report.version = token;
      }}
      navigateDeps={navigateDeps}
      backRef={backRef}
      onClient={setBridgeClient}
    />
  ) : null;

  const view = failed ? (
    <div style={{ padding: 16, color: '#fff' }}>Reader unavailable: {failed}</div>
  ) : !Reader || !client ? (
    <div data-swift2-ui={UI_PACKAGE_VERSION} style={{ minHeight: '100vh', background: 'var(--era-bg)' }} />
  ) : (
    <Reader client={client} insets={insets ?? ZERO_INSETS} controls={controls} navigateDom={navigateDom} getPath={getPath} />
  );
  return (
    <>
      {bridgeMount}
      {view}
    </>
  );
}
