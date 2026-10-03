// WP0.5b: what the spike learns on a device. Plain data + pure helpers so the
// recorder and the placeholder counter are unit-testable; ReaderSpike fills it
// in and sends it over the bridge as one JSON string (never content).
export type Tri = 'ok' | 'fail' | 'n/a';

export interface ProbeReport {
  version: string;
  read: { fetch: Tri; xhr: Tri; script: Tri };
  storage: { localStorage: 'present' | 'shimmed'; indexedDB: 'present' | 'absent' | 'throws' };
  /** The persistence adapter actually in use: real localStorage, else IndexedDB, else the in-memory shim. */
  adapter: 'memory-shim' | 'localStorage' | 'indexedDB';
  marker: { localStorage: 'hit' | 'miss'; indexedDB: 'hit' | 'miss' | 'n/a' };
  snapshot: { hash: string; items: number; eras: number } | null;
  /** Webview clock: performance.now() at first paint inside the DOM page. */
  firstPaintMs: number | null;
  /** Native clock, stamped by the host (not the webview): dom-launch-attempted to onReady. */
  nativeLaunchToReadyMs?: number | null;
  heapMb: number | null;
  placeholders: Record<string, { total: number; bad: number; pending: number }> | null;
  error: string | null;
}

export function createProbe(version = '') {
  const report: ProbeReport = {
    version,
    read: { fetch: 'n/a', xhr: 'n/a', script: 'n/a' },
    storage: { localStorage: 'present', indexedDB: 'absent' },
    adapter: 'memory-shim',
    marker: { localStorage: 'miss', indexedDB: 'n/a' },
    snapshot: null,
    firstPaintMs: null,
    heapMb: null,
    placeholders: null,
    error: null,
  };
  return {
    report,
    attempts(list: { method: 'fetch' | 'xhr'; ok: boolean }[]) {
      for (const a of list) report.read[a.method] = a.ok ? 'ok' : 'fail';
    },
    json: () => JSON.stringify(report),
  };
}

/** Host side: stamp the native-clock launch->ready delta into the probe JSON without altering any other field. */
export function withNativeTiming(json: string, ms: number | null): string {
  if (ms === null) return json;
  try {
    return JSON.stringify({ ...(JSON.parse(json) as ProbeReport), nativeLaunchToReadyMs: ms });
  } catch {
    return json;
  }
}

let latestRaw: string | null = null;

export function setLatestProbeJson(json: string): void {
  latestRaw = json;
}

/** The exact JSON last published by the probe (what the panel exports verbatim). */
export function latestProbeJson(): string | null {
  return latestRaw;
}

export function probeLines(r: ProbeReport | null): string[] {
  if (!r) return ['Reader spike: no probe yet.'];
  const ph = r.placeholders
    ? Object.entries(r.placeholders).map(([h, v]) => `${h} ${v.bad}/${v.total}${v.pending ? ` (+${v.pending} pending)` : ''}`).join(', ') || 'none'
    : 'pending';
  return [
    `Bundle: ${r.version.slice(0, 12) || 'none'}`,
    `Read: fetch ${r.read.fetch}, xhr ${r.read.xhr}, script ${r.read.script}`,
    `Storage: localStorage ${r.storage.localStorage}, indexedDB ${r.storage.indexedDB}, adapter ${r.adapter}`,
    `Marker: localStorage ${r.marker.localStorage}, indexedDB ${r.marker.indexedDB}`,
    r.snapshot
      ? `Snapshot: ${r.snapshot.hash.slice(0, 12)} (${r.snapshot.items} items, ${r.snapshot.eras} eras)`
      : 'Snapshot: none',
    `Webview first paint ms: ${r.firstPaintMs ?? '-'}, heap ${r.heapMb ?? '-'} MB`,
    `Native launch->ready ms: ${r.nativeLaunchToReadyMs ?? '-'}`,
    `Placeholder images (bad/total): ${ph}`,
    ...(r.error ? [`Error: ${r.error}`] : []),
  ];
}

export interface ImgSample {
  src: string;
  complete: boolean;
  naturalWidth: number;
  errored?: boolean;
}

/** Per-host count of images that are tiny (hotlink placeholder, naturalWidth <= 2) or errored; unfinished loads are reported as `pending`, not dropped. */
export function countPlaceholders(imgs: ImgSample[]): Record<string, { total: number; bad: number; pending: number }> {
  const out: Record<string, { total: number; bad: number; pending: number }> = {};
  for (const img of imgs) {
    let host = 'invalid';
    try {
      host = new URL(img.src).host || 'local';
    } catch {
      // keep 'invalid'
    }
    const slot = (out[host] ??= { total: 0, bad: 0, pending: 0 });
    if (!img.errored && !img.complete) {
      slot.pending += 1;
      continue;
    }
    slot.total += 1;
    if (img.errored || img.naturalWidth <= 2) slot.bad += 1;
  }
  return out;
}

const MARKER_KEY = 'wp05-marker';

function idb<T>(run: (db: IDBDatabase) => IDBRequest<T>): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('wp05-probe', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('kv');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = run(open.result);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
  });
}

/** Version-marker persistence check, recorded only: reads the previous launch's marker, then writes this one. */
export async function checkMarkers(version: string, probe: ReturnType<typeof createProbe>) {
  const r = probe.report;
  let lsWorks = false;
  try {
    r.marker.localStorage = window.localStorage.getItem(MARKER_KEY) === version ? 'hit' : 'miss';
    window.localStorage.setItem(MARKER_KEY, version);
    lsWorks = r.storage.localStorage === 'present';
  } catch {
    r.marker.localStorage = 'miss';
  }
  let idbWorks = false;
  try {
    if (typeof indexedDB === 'undefined') return;
    r.storage.indexedDB = 'present';
    const prev = await idb((db) => db.transaction('kv').objectStore('kv').get(MARKER_KEY));
    r.marker.indexedDB = prev === version ? 'hit' : 'miss';
    await idb((db) => db.transaction('kv', 'readwrite').objectStore('kv').put(version, MARKER_KEY));
    idbWorks = true;
  } catch {
    r.storage.indexedDB = 'throws';
  } finally {
    r.adapter = lsWorks ? 'localStorage' : idbWorks ? 'indexedDB' : 'memory-shim';
  }
}
