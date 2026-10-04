'use dom';

// One UI WP0.5b: the real era stream, moment detail and bottom nav inside the
// DOM host. The webview is READ-ONLY over the native disk cache: the host
// passes a file:// URI + version token (config, not content, C6); the bundle is
// read here, turned into a ReaderSnapshot with packages/content (C6), poured
// into the shims, and only THEN are the web components required (their
// module-level constants derive from the filled arrays).
import './reader-spike.css';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { UI_PACKAGE_VERSION, type Envelope, type Insets } from '@swift2/ui';
import { installNavigateSubscriber, type NavigateDeps } from './bridge/navigate-subscriber';
import { useExpoBridge } from './bridge/transport-expo';
import { countPlaceholders, createProbe, checkMarkers } from './spike/probe';
import { probeScript, readLocalText } from './spike/read-local';
import { describeSnapshotSafe, snapshotFromEnvelope } from './spike/snapshot';
import { fill } from './spike/shims/fill';
import { installStorageShim } from './spike/storage-shim';
import { loadReader, type ReaderProps } from './spike/reader-modules';
import { setImageLoadListener } from './spike/image-listener';

export interface ReaderSpikeProps {
  /** file:// URI of the native `last-good` cache file. */
  cacheUri?: string;
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
function insetsFromQuery(): ReaderSpikeProps['insets'] {
  const raw = new URLSearchParams(window.location.search).get('inset');
  if (!raw) return undefined;
  const [top = 0, right = 0, bottom = 0, left = 0] = raw.split(',').map((n) => Number(n) || 0);
  return { top, right, bottom, left };
}

type Probe = ReturnType<typeof createProbe>;

type BackFn = () => 'handled' | 'exit';
type MountProps = Required<Pick<ReaderSpikeProps, 'inbox' | 'bridge'>> & {
  onFatal: (reason: string) => void;
  onInsets: (insets: Insets) => void;
  onContentVersion: (token: string) => void;
  navigateDeps: NavigateDeps;
  backRef: { current: BackFn | null };
};

/** Renders nothing: sends `ready` after mount, subscribes the native events and the back responder, drains the inbox. Mounted only where a native host supplies `bridge`. */
function ExpoBridgeMount({ inbox, bridge, onFatal, onInsets, onContentVersion, navigateDeps, backRef }: MountProps) {
  useExpoBridge({ inbox, bridge }, { onFatal }, (client) => {
    const offs = [
      client.on('insets', onInsets),
      client.on('contentVersion', (e) => onContentVersion(e.token)),
      client.handle('back', () => backRef.current?.() ?? 'exit'),
      installNavigateSubscriber(client, navigateDeps),
    ];
    return () => offs.forEach((off) => off());
  });
  return null;
}

export default function ReaderSpike(props: ReaderSpikeProps) {
  const { cacheUri, versionToken = '', devLoader } = props;
  const [hostInsets, setHostInsets] = useState<Insets | undefined>();
  const insets = hostInsets ?? props.insets ?? (devLoader ? insetsFromQuery() : undefined);
  const backRef = useRef<BackFn | null>(null);
  // A native-to-DOM navigate rewrites the page query and remounts the reader, which re-reads its deep link.
  const [readerKey, setReaderKey] = useState(0);
  const navigateDeps = useRef<NavigateDeps>({
    replaceUrl: (relative) => window.history.replaceState(null, '', relative),
    remount: () => setReaderKey((k) => k + 1),
  }).current;
  const [Reader, setReader] = useState<ComponentType<ReaderProps> | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const started = useRef(false);
  const probeRef = useRef<Probe>(createProbe(versionToken));
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
      if (cacheUri && e.filename === cacheUri) return; // the <script> probe of the JSON cache
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
      try {
        probe.report.storage.localStorage = installStorageShim(window).includes('localStorage')
          ? 'shimmed'
          : 'present';
        let text: string | null = null;
        if (devLoader) text = await devLoader();
        else if (cacheUri) {
          const read = await readLocalText(cacheUri);
          probe.attempts(read.attempts);
          text = read.text;
        }
        if (!text) throw new Error('bundle cache unreadable');
        const { core, extensions, version } = snapshotFromEnvelope(text, { eraVideoFeed });
        probe.report.version = version;
        const described = await describeSnapshotSafe(core, extensions);
        probe.report.snapshot = described.snapshot;
        if (described.error) probe.report.error = described.error;
        fill(core);
        const reader = loadReader(core, extensions);
        setReader(() => reader);
        void checkMarkers(version, probe);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        probe.report.error = message;
        setFailed(message);
        await propsRef.current.reportProbe(probe.json());
        void propsRef.current.reportError(`reader-spike: ${message}`);
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
        if (cacheUri) probe.report.read.script = (await probeScript(cacheUri)) ? 'ok' : 'fail';
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
      onInsets={setHostInsets}
      onContentVersion={(token) => {
        if (!probeRef.current.report.version) probeRef.current.report.version = token;
      }}
      navigateDeps={navigateDeps}
      backRef={backRef}
    />
  ) : null;

  const view = failed ? (
    <div style={{ padding: 16, color: '#fff' }}>Reader unavailable: {failed}</div>
  ) : !Reader ? (
    <div data-swift2-ui={UI_PACKAGE_VERSION} style={{ padding: 16, color: '#fff' }}>
      Loading...
    </div>
  ) : (
    <Reader key={readerKey} registerBack={(fn) => void (backRef.current = fn)} />
  );
  return (
    <>
      {bridgeMount}
      {view}
    </>
  );
}
