// One UI WP0.1 — load-stage timing collector + `[diag]` report builder.
// Pure (no native imports) so it is unit-testable; the device facts live in
// diagnostics-env.ts. A report is posted to a PUBLIC GitHub issue, so it
// carries only model, OS, build, update id and timings — never a device id,
// push token or personal data.
import { setLoadTimingSink, type LoadTimingEvent } from '@swift2/content';

export interface DiagMark {
  stage: string;
  detail?: string;
  /** Clock reading (ms) when the stage began; app-start is ~0 on Hermes. */
  startMs: number;
  /** 0 for an instant mark. */
  durationMs: number;
}

export type LaunchKind = 'cold' | 'warm' | 'unknown';

export interface StageSummary {
  stage: string;
  count: number;
  totalMs: number;
  maxMs: number;
  firstStartMs: number;
}

export interface TimingSummary {
  launch: LaunchKind;
  stages: StageSummary[];
  slowestDownloads: { file: string; ms: number }[];
}

export interface DiagEnv {
  model: string;
  os: string;
  build: string;
  updateId: string;
}

const MAX_MARKS = 500;

function defaultNow(): number {
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  return typeof perf?.now === 'function' ? perf.now() : Date.now();
}

export function createTimingCollector(now: () => number = defaultNow) {
  let marks: DiagMark[] = [];
  const push = (m: DiagMark) => {
    if (marks.length < MAX_MARKS) marks.push(m);
  };
  return {
    /** Sink for packages/content's load-stage events. */
    record(event: LoadTimingEvent): void {
      push({ ...event });
    },
    /** An instant mark (app start, provider wiring, first paint ...). */
    mark(stage: string, detail?: string): void {
      push({ stage, ...(detail ? { detail } : {}), startMs: now(), durationMs: 0 });
    },
    /** Start a timed stage; call the returned function when it finishes. */
    start(stage: string, detail?: string): () => void {
      const startMs = now();
      return () =>
        push({ stage, ...(detail ? { detail } : {}), startMs, durationMs: now() - startMs });
    },
    marks(): readonly DiagMark[] {
      return marks;
    },
    reset(): void {
      marks = [];
    },
    summary(): TimingSummary {
      return summarizeMarks(marks);
    },
  };
}

export type TimingCollector = ReturnType<typeof createTimingCollector>;

/** Cold = the loader had to download a bundle (manifest 200); warm = served from cache (manifest 304). */
export function launchKindOf(marks: readonly DiagMark[]): LaunchKind {
  const manifest = marks.find((m) => m.stage === 'manifest');
  if (manifest?.detail === '304') return 'warm';
  if (manifest?.detail === '200') return 'cold';
  return 'unknown';
}

export function summarizeMarks(marks: readonly DiagMark[]): TimingSummary {
  const byStage = new Map<string, StageSummary>();
  for (const m of marks) {
    const s = byStage.get(m.stage);
    if (s) {
      s.count += 1;
      s.totalMs += m.durationMs;
      s.maxMs = Math.max(s.maxMs, m.durationMs);
      s.firstStartMs = Math.min(s.firstStartMs, m.startMs);
    } else {
      byStage.set(m.stage, {
        stage: m.stage,
        count: 1,
        totalMs: m.durationMs,
        maxMs: m.durationMs,
        firstStartMs: m.startMs,
      });
    }
  }
  const slowestDownloads = marks
    .filter((m) => m.stage === 'download' && m.detail)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5)
    .map((m) => ({ file: String(m.detail), ms: m.durationMs }));
  return { launch: launchKindOf(marks), stages: [...byStage.values()], slowestDownloads };
}

const round = (n: number): number => Math.round(n * 10) / 10;
const clip = (s: string, n: number): string => s.slice(0, n);

export const DIAG_PREFIX = '[diag]';
const MAX_REPORT_CHARS = 4500;

/** The `[diag]` feedback message: a fixed whitelist of fields, compact JSON. */
export function buildDiagMessage(env: DiagEnv, summary: TimingSummary): string {
  const stages = summary.stages.map((s) => ({
    stage: clip(s.stage, 40),
    n: s.count,
    totalMs: round(s.totalMs),
    maxMs: round(s.maxMs),
    atMs: round(s.firstStartMs),
  }));
  const render = (st: typeof stages, slow: TimingSummary['slowestDownloads']): string =>
    `${DIAG_PREFIX} ${JSON.stringify({
      model: clip(env.model, 60),
      os: clip(env.os, 60),
      build: clip(env.build, 60),
      updateId: clip(env.updateId, 60),
      launch: summary.launch,
      stages: st,
      slowestDownloads: slow.map((d) => ({ file: clip(d.file, 60), ms: round(d.ms) })),
    })}`;
  let message = render(stages, summary.slowestDownloads);
  if (message.length > MAX_REPORT_CHARS) message = render(stages, []);
  while (message.length > MAX_REPORT_CHARS && stages.length > 1) {
    stages.pop();
    message = render(stages, []);
  }
  return message;
}

/** Counts rapid taps; `tap()` is true on the tap that reaches `taps` within `windowMs` of each other. */
export function createTapUnlock(opts: { taps?: number; windowMs?: number; now?: () => number } = {}) {
  const { taps = 7, windowMs = 2000, now = defaultNow } = opts;
  let count = 0;
  let last = 0;
  return {
    tap(): boolean {
      const t = now();
      count = count > 0 && t - last <= windowMs ? count + 1 : 1;
      last = t;
      if (count >= taps) {
        count = 0;
        return true;
      }
      return false;
    },
  };
}

/** The process-wide collector the app uses. */
export const diagCollector: TimingCollector = createTimingCollector();

let installed = false;

/** Route packages/content load-stage events into `diagCollector`, once, and mark app start. */
export function installDiagnostics(): void {
  if (installed) return;
  installed = true;
  setLoadTimingSink((e) => diagCollector.record(e));
  diagCollector.mark('app-start');
}
