// Speed test mode (#4896) — the orchestration, with every side effect injected
// so the state machine (enable -> N launches -> auto-off + summary) is unit-tested.
import type { DiagEnv, DiagPayload, TimingSummary } from './diagnostics';
import { IMAGE_WINDOW_MS } from './image-marks';
import {
  DEFAULT_LAUNCHES,
  isActive,
  launchMetric,
  launchReport,
  parseState,
  recordLaunch,
  startRun,
  summaryReport,
  type LaunchResult,
  type SpeedState,
  type Ui,
} from './speed-test';

export interface ControllerDeps {
  store: { load(): Promise<string | null>; save(raw: string | null): Promise<void> };
  send(payload: DiagPayload): Promise<{ ok: boolean }>;
  env(): DiagEnv;
  /** The CURRENT launch's summary (its `launch` is cold or warm). */
  summary(): TimingSummary;
  ui(): Ui;
  imagesBy(ms: number): number;
  /** ms since the current launch's T0. */
  elapsed(): number;
  /** Run `fn` after `ms`; returns a cancel function. */
  schedule(fn: () => void, ms: number): () => void;
  rand?: () => number;
}

interface Pending {
  kind: 'cold' | 'warm';
  summary: TimingSummary;
  ms: number;
  anchor: 'native' | 'js';
  ui: Ui;
  img: number | null;
  cancel: () => void;
}

export function createSpeedTestController(deps: ControllerDeps) {
  let pending: Pending | null = null;
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };

  const load = async (): Promise<SpeedState | null> => parseState(await deps.store.load());
  const save = (s: SpeedState | null): Promise<void> => deps.store.save(s ? JSON.stringify(s) : null);

  async function finish(p: Pending): Promise<void> {
    p.cancel();
    const state = await load();
    if (!isActive(state)) return;
    const result: LaunchResult = {
      k: p.kind,
      ms: p.ms,
      ui: p.ui,
      anchor: p.anchor,
      img: p.img,
    };
    // A failed send never stalls the run: the launch still counts and the summary carries it.
    await deps.send(launchReport(deps.env(), p.summary, state, result)).catch(() => undefined);
    const next = recordLaunch(state, result);
    await save(next);
    if (next.remaining === 0) await deps.send(summaryReport(deps.env(), next)).catch(() => undefined);
  }

  // Frozen synchronously: a resume right after a background must not reset the marks first.
  const freeze = (p: Pending): Pending => ({ ...p, img: p.kind === 'cold' ? deps.imagesBy(IMAGE_WINDOW_MS) : null });

  const api = {
    state: load,

    async enable(total: number = DEFAULT_LAUNCHES): Promise<SpeedState> {
      const s = startRun(total, deps.rand);
      await save(s);
      return s;
    },

    async disable(): Promise<void> {
      pending?.cancel();
      pending = null;
      await save(null);
    },

    /** Called after first-era-paint (cold) or resume-paint (warm). Cold waits for the T+10 s image window. */
    onPaint(kind: 'cold' | 'warm'): Promise<void> {
      return serial(async () => {
        const summary = deps.summary();
        if (summary.launch !== kind) return;
        if (!isActive(await load())) return;
        const metric = launchMetric(summary, kind);
        if (!metric) return;
        const stale = pending;
        pending = null;
        if (stale) await finish(freeze(stale));
        const p: Pending = {
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
