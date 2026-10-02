// WP0.5b: what the spike learns on a device. Plain data + pure helpers so the
// recorder and the placeholder counter are unit-testable; ReaderSpike fills it
// in and sends it over the bridge as one JSON string (never content).
export type Tri = 'ok' | 'fail' | 'n/a';

export interface ProbeReport {
  version: string;
  read: { fetch: Tri; xhr: Tri; script: Tri };
  storage: { localStorage: 'present' | 'shimmed'; indexedDB: 'present' | 'absent' | 'throws' };
  marker: { localStorage: 'hit' | 'miss'; indexedDB: 'hit' | 'miss' | 'n/a' };
  snapshot: { hash: string; items: number; eras: number } | null;
  firstPaintMs: number | null;
  heapMb: number | null;
  placeholders: Record<string, { total: number; bad: number }> | null;
  error: string | null;
}

export function createProbe(version = '') {
  const report: ProbeReport = {
    version,
    read: { fetch: 'n/a', xhr: 'n/a', script: 'n/a' },
    storage: { localStorage: 'present', indexedDB: 'absent' },
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

export function probeLines(r: ProbeReport | null): string[] {
  if (!r) return ['Reader spike: no probe yet.'];
  const ph = r.placeholders
    ? Object.entries(r.placeholders).map(([h, v]) => `${h} ${v.bad}/${v.total}`).join(', ') || 'none'
    : 'pending';
  return [
    `Bundle: ${r.version.slice(0, 12) || 'none'}`,
    `Read: fetch ${r.read.fetch}, xhr ${r.read.xhr}, script ${r.read.script}`,
    `Storage: localStorage ${r.storage.localStorage}, indexedDB ${r.storage.indexedDB}`,
    `Marker: localStorage ${r.marker.localStorage}, indexedDB ${r.marker.indexedDB}`,
    r.snapshot
      ? `Snapshot: ${r.snapshot.hash.slice(0, 12)} (${r.snapshot.items} items, ${r.snapshot.eras} eras)`
      : 'Snapshot: none',
    `First paint: ${r.firstPaintMs ?? '-'} ms, heap ${r.heapMb ?? '-'} MB`,
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

/** Per-host count of images that are tiny (hotlink placeholder, naturalWidth <= 2) or errored. Unfinished loads are skipped. */
export function countPlaceholders(imgs: ImgSample[]): Record<string, { total: number; bad: number }> {
  const out: Record<string, { total: number; bad: number }> = {};
  for (const img of imgs) {
    if (!img.errored && !img.complete) continue;
    let host = 'invalid';
    try {
      host = new URL(img.src).host || 'local';
    } catch {
      // keep 'invalid'
    }
    const slot = (out[host] ??= { total: 0, bad: 0 });
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
  try {
    r.marker.localStorage = window.localStorage.getItem(MARKER_KEY) === version ? 'hit' : 'miss';
    window.localStorage.setItem(MARKER_KEY, version);
  } catch {
    r.marker.localStorage = 'miss';
  }
  try {
    if (typeof indexedDB === 'undefined') return;
    r.storage.indexedDB = 'present';
    const prev = await idb((db) => db.transaction('kv').objectStore('kv').get(MARKER_KEY));
    r.marker.indexedDB = prev === version ? 'hit' : 'miss';
    await idb((db) => db.transaction('kv', 'readwrite').objectStore('kv').put(version, MARKER_KEY));
  } catch {
    r.storage.indexedDB = 'throws';
  }
}
