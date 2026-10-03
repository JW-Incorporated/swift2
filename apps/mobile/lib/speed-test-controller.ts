// Speed test mode (#4896) — the orchestration, with every side effect injected
// so the state machine (enable -> N launches -> auto-off + summary) is unit-tested.
//
// Invariants:
// - Every state/outbox mutation runs through one promise chain (`serial`), and a
//   held launch carries its run id, so a stale finish can never resurrect,
//   overwrite or double-count a disabled or newer run.
// - Reports go to a persisted outbox first and are only removed once the server
//   accepted them (or answered with a permanent 4xx), so a 429/network failure
//   is retried on later launches/foregrounds with backoff and a bounded number
//   of attempts. The run is not "complete" while its summary is still queued.
// - After the first load everything is answered from memory: with the mode off
//   and nothing queued a paint does no storage work at all.
import type { DiagEnv, DiagPayload, TimingSummary } from './diagnostics';
import { IMAGE_WINDOW_MS } from './image-marks';
import {
  DEFAULT_LAUNCHES,
  MAX_TRIES,
  backoffMs,
  capOutbox,
  isActive,
  launchMetric,
  launchReport,
  parseOutbox,
  parseState,
  recordLaunch,
  startRun,
  summaryReport,
  type LaunchResult,
  type OutboxEntry,
  type SpeedState,
  type Ui,
} from './speed-test';

export interface ControllerDeps {
  store: { load(): Promise<string | null>; save(raw: string | null): Promise<void> };
  outbox: { load(): Promise<string[]>; save(entries: string[]): Promise<void> };
  send(payload: DiagPayload): Promise<{ ok: boolean; status?: number }>;
  env(): DiagEnv;
  /** The CURRENT launch's summary (its `launch` is cold or warm). */
  summary(): TimingSummary;
  ui(): Ui;
  imagesBy(ms: number): number;
  /** ms since the current launch's T0. */
  elapsed(): number;
  /** Epoch ms. */
  now(): number;
  /** Run `fn` after `ms`; returns a cancel function. */
  schedule(fn: () => void, ms: number): () => void;
  rand?: () => number;
}

interface Pending {
  run: string;
  kind: 'cold' | 'warm';
  summary: TimingSummary;
  ms: number;
  anchor: 'native' | 'js';
  ui: Ui;
  img: number | null;
  cancel: () => void;
}

interface Cache {
  state: SpeedState | null;
  outbox: OutboxEntry[];
}

// A 4xx other than 429/408 will never succeed on retry (the schema rejected it).
const permanent = (status?: number): boolean =>
  status !== undefined && status >= 400 && status < 500 && status !== 429 && status !== 408;

export function createSpeedTestController(deps: ControllerDeps) {
  let cache: Cache | null = null;
  let pending: Pending | null = null;
  let drainP: Promise<void> | null = null;
  let chain: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const notify = (): void => listeners.forEach((fn) => fn());

  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };

  async function ensure(): Promise<Cache> {
    if (!cache) {
      const state = parseState(await deps.store.load());
      const outbox = parseOutbox(await deps.outbox.load());
      cache = { state, outbox };
      notify();
    }
    return cache;
  }

  async function saveState(c: Cache, s: SpeedState | null): Promise<void> {
    c.state = s;
    await deps.store.save(s ? JSON.stringify(s) : null);
    notify();
  }

  const saveOutbox = (c: Cache): Promise<void> =>
    deps.outbox.save(c.outbox.map((e) => JSON.stringify(e)));

  /** Queue the finished launch (and, on the last one, the summary), count it, and start sending. */
  async function finish(p: Pending): Promise<void> {
    p.cancel();
    const c = await ensure();
    const state = c.state;
    if (!isActive(state) || state.run !== p.run) return;
    const result: LaunchResult = { k: p.kind, ms: p.ms, ui: p.ui, anchor: p.anchor, img: p.img };
    const next = recordLaunch(state, result);
    const queued: OutboxEntry[] = [
      { p: launchReport(deps.env(), p.summary, state, result), tries: 0, next: 0 },
    ];
    if (next.remaining === 0) queued.push({ p: summaryReport(deps.env(), next), tries: 0, next: 0 });
    c.outbox = capOutbox([...c.outbox, ...queued]);
    await saveOutbox(c);
    await saveState(c, next);
    void api.drain();
  }

  // Frozen synchronously: a resume right after a background must not reset the marks first.
  const freeze = (p: Pending): Pending => ({
    ...p,
    img: p.kind === 'cold' ? deps.imagesBy(IMAGE_WINDOW_MS) : null,
  });

  async function drainLoop(): Promise<void> {
  await null; // lets drain() store the promise before the synchronous find -> clear below
  try {
    const c = await serial(ensure);
    for (;;) {
      const e = c.outbox.find((x) => x.next <= deps.now());
      if (!e) return; // no await between this find and the finally clearing drainP
      const r = await deps.send(e.p).catch(() => ({ ok: false, status: undefined as number | undefined }));
      await serial(async () => {
        const i = c.outbox.indexOf(e);
        if (i < 0) return;
        if (r.ok || permanent(r.status) || e.tries + 1 >= MAX_TRIES) c.outbox.splice(i, 1);
        else {
          e.tries += 1;
          e.next = deps.now() + backoffMs(e.tries);
        }
        await saveOutbox(c);
        notify();
      });
    }
  } finally {
    drainP = null;
  }
}

  const api = {
    /** Load persisted state once (called at startup) so later paints are answered from memory. */
    init: (): Promise<void> => serial(async () => void (await ensure())),

    state: (): Promise<SpeedState | null> => serial(async () => (await ensure()).state),

    /** Sync, from memory: the mode is running. */
    isOn: (): boolean => cache !== null && isActive(cache.state),

    /** Reports still queued for sending (retries on the next launch/foreground). */
    queued: (): number => cache?.outbox.length ?? 0,

    onChange(fn: () => void): () => void {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },

    enable(total: number = DEFAULT_LAUNCHES): Promise<SpeedState> {
      return serial(async () => {
        const c = await ensure();
        pending?.cancel();
        pending = null;
        const s = startRun(total, deps.rand);
        await saveState(c, s);
        return s;
      });
    },

    disable(): Promise<void> {
      return serial(async () => {
        const c = await ensure();
        pending?.cancel();
        pending = null;
        await saveState(c, null);
      });
    },

    /** Called after first-era-paint (cold) or resume-paint (warm). Cold waits for the T+10 s image window. */
    onPaint(kind: 'cold' | 'warm'): Promise<void> {
      // Mode off and nothing queued: no storage work, no allocation.
      if (cache && !isActive(cache.state) && cache.outbox.length === 0) return Promise.resolve();
      return serial(async () => {
        const c = await ensure();
        if (!isActive(c.state)) {
          if (c.outbox.length > 0) void api.drain();
          return;
        }
        const summary = deps.summary();
        if (summary.launch !== kind) return;
        const metric = launchMetric(summary, kind);
        if (!metric) return;
        const stale = pending;
        pending = null;
        if (stale) await finish(freeze(stale));
        const p: Pending = {
          run: c.state.run,
          kind,
          summary,
          ms: metric.ms,
          anchor: metric.anchor,
          ui: deps.ui(),
          img: null,
          cancel: () => undefined,
        };
        if (kind === 'warm') return finish(p);
        p.cancel = deps.schedule(() => void api.flush(), Math.max(0, IMAGE_WINDOW_MS - deps.elapsed()));
        pending = p;
      });
    },

    /** Send the held cold report now (T+10 s reached, or the app is going to the background). */
    flush(): Promise<void> {
      const p = pending ? freeze(pending) : null;
      pending = null;
      return serial(async () => {
        if (p) await finish(p);
      });
    },

    /** Try the queued reports that are due. Resolves when none are left due. */
    drain(): Promise<void> {
      if (!drainP) drainP = drainLoop();
      return drainP;
    },

    /** Foreground hook: retry whatever is queued. */
    retry(): Promise<void> {
      if (cache && cache.outbox.length === 0) return Promise.resolve();
      return api.drain();
    },
  };
  return api;
}

export type SpeedTestController = ReturnType<typeof createSpeedTestController>;

/** Warm = resume from background in the SAME process; a new process is always cold. */
export function createLaunchTracker(deps: { beginWarm(): void; onResumed(): void; onBackground(): void }) {
  // Starts 'active' on purpose: a process that begins in the background is still a cold launch.
  let prev = 'active';
  return {
    change(next: string): void {
      const wasBackground = prev === 'background';
      prev = next;
      if (next === 'background') deps.onBackground();
      else if (next === 'active' && wasBackground) {
        deps.beginWarm();
        deps.onResumed();
      }
    },
  };
}
