// One UI WP0.1 — load-stage timing collector + `[diag]` report builder.
// Pure (no native imports) so it is unit-testable; the device facts live in
// diagnostics-env.ts. A report is posted to a PUBLIC GitHub issue, so it
// carries only model, OS, build, update id and timings — never a device id,
// push token or personal data.
import { setLoadTimingSink, type LoadTimingEvent } from '@swift2/content';
import { markFirstPaint } from './launch-defer';

export interface DiagMark {
  stage: string;
  detail?: string;
  /** Offset (ms) from launch T0 when the stage began. */
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

/**
 * `startMs` is always an offset from `origin` (T0 = the collector's creation,
 * i.e. the earliest JS point, since index.ts imports this module first-ish):
 * Hermes' performance.now() is not JS-start-relative, so raw readings are huge.
 */
export function createTimingCollector(now: () => number = defaultNow, origin: number = now()) {
  let marks: DiagMark[] = [];
  // A new JS runtime is a cold launch; beginLaunch('warm') flips it on resume from background.
  let launch: LaunchKind = 'cold';
  const push = (m: DiagMark) => {
    if (marks.length < MAX_MARKS) marks.push(m);
  };
  return {
    /** Sink for packages/content's load-stage events (same clock as `now`). */
    record(event: LoadTimingEvent): void {
      push({ ...event, startMs: event.startMs - origin });
    },
    /** An instant mark (app start, provider wiring, first paint ...). */
    mark(stage: string, detail?: string): void {
      push({ stage, ...(detail ? { detail } : {}), startMs: now() - origin, durationMs: 0 });
    },
    /** Start a timed stage; call the returned function when it finishes. */
    start(stage: string, detail?: string): () => void {
      const t0 = now();
      return () =>
        push({ stage, ...(detail ? { detail } : {}), startMs: t0 - origin, durationMs: now() - t0 });
    },
    marks(): readonly DiagMark[] {
      return marks;
    },
    /** A span measured elsewhere (e.g. the native lead before JS started), recorded at offset 0. */
    note(stage: string, durationMs: number): void {
      push({ stage, startMs: 0, durationMs });
    },
    /** Start a fresh launch: drop the previous launch's marks and re-anchor T0 to now. */
    beginLaunch(kind: LaunchKind): void {
      marks = [];
      origin = now();
      launch = kind;
    },
    elapsed(): number {
      return now() - origin;
    },
    reset(): void {
      marks = [];
    },
    summary(): TimingSummary {
      return summarizeMarks(marks, launch);
    },
  };
}

export type TimingCollector = ReturnType<typeof createTimingCollector>;

export function summarizeMarks(marks: readonly DiagMark[], launch: LaunchKind = 'unknown'): TimingSummary {
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
  return { launch, stages: [...byStage.values()], slowestDownloads };
}

const round = (n: number): number => Math.round(n * 10) / 10;
const clamp = (n: number): number => Math.min(600_000, Math.max(0, round(n)));
const safeText = (s: string, max: number): string =>
  s.replace(/[^A-Za-z0-9 ,._()-]/g, '').slice(0, max).trim() || 'unknown';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DIAG_PREFIX = '[diag]';

/** Stage names /api/feedback accepts (apps/web/app/api/feedback/diag.ts — keep in sync). */
const REPORT_STAGES = [
  'app-start', 'config', 'app-first-render', 'pointer', 'manifest', 'download', 'hash',
  'parse', 'validate', 'disk-write', 'load-total', 'provider-wiring', 'first-era-paint',
  'resume-paint', 'first-image-paint', 'native-lead',
];

/** Instant marks (no duration) — keep equal to POINT_STAGES in apps/web/app/api/feedback/diag.ts (a test pins them). */
export const POINT_STAGES = [
  'app-start', 'app-first-render', 'provider-wiring', 'first-era-paint', 'resume-paint', 'first-image-paint',
];

/** True when the stage is a point mark shown by its `at` offset only; any other stage keeps its duration even at 0 ms. */
export function isPointStage(s: StageSummary): boolean {
  return POINT_STAGES.includes(s.stage) && s.maxMs === 0;
}

/** Speed test mode metadata (#4896); the server validates it against an exact schema (apps/web/app/api/feedback/diag.ts). */
export interface DiagSpeed {
  run: string;
  kind: 'launch' | 'summary';
  index: number;
  total: number;
  ui: 'native' | 'shared' | 'unknown';
  anchor: 'native' | 'js';
  images10s?: number;
  launches?: { k: 'cold' | 'warm'; ms: number }[];
}

export interface DiagPayload {
  message: typeof DIAG_PREFIX;
  diag: {
    model: string;
    os: string;
    build: string;
    updateId: string;
    launch: LaunchKind;
    timings: Record<string, number>;
    speed?: DiagSpeed;
  };
}

/**
 * The structured `[diag]` request body. The server validates it against an
 * exact schema and rebuilds the comment itself, so this is a strict whitelist:
 * coarse device facts (charset-sanitised) plus numeric timings under known
 * stage names (`<stage>` = total ms, `at:<stage>` = first start ms).
 */
export function buildDiagPayload(env: DiagEnv, summary: TimingSummary, speed?: DiagSpeed): DiagPayload {
  const timings: Record<string, number> = {};
  for (const s of summary.stages) {
    if (!REPORT_STAGES.includes(s.stage)) continue;
    timings[s.stage] = clamp(s.totalMs);
    timings[`at:${s.stage}`] = clamp(s.firstStartMs);
  }
  for (const d of summary.slowestDownloads) {
    const name = d.file.replace(/[^A-Za-z0-9:_.-]/g, '').slice(0, 40);
    if (name) timings[`download:${name}`] = clamp(d.ms);
  }
  if (Object.keys(timings).length === 0 && speed?.kind !== 'summary') timings['app-start'] = 0;
  return {
    message: DIAG_PREFIX,
    diag: {
      model: safeText(env.model, 40),
      os: safeText(env.os, 20),
      build: safeText(env.build, 20),
      updateId: UUID_RE.test(env.updateId) ? env.updateId : 'embedded',
      launch: summary.launch,
      timings,
      ...(speed ? { speed } : {}),
    },
  };
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

/** The current launch's mount choice, written by the watchdog gate and read by the Diagnostics panel. */
export interface MountInfo {
  mount: string;
  reason: string | null;
  source: string | null;
}

let mountInfo: MountInfo = { mount: 'pending', reason: null, source: null };

export function setMountInfo(info: MountInfo): void {
  mountInfo = info;
}

export function getMountInfo(): MountInfo {
  return mountInfo;
}

let installed = false;

const markedOnce = new Set<string>();

let paintListener: ((stage: string, detail?: string) => void) | null = null;

/** Notified after each first-era-paint (cold) / resume-paint (warm) mark; the Speed test mode hook. */
export function setPaintListener(fn: ((stage: string, detail?: string) => void) | null): void {
  paintListener = fn;
}

/** Instant mark recorded at most once per launch; a no-op until diagnostics are installed. */
export function diagMarkOnce(stage: string, detail?: string): void {
  if (!installed || markedOnce.has(stage)) return;
  markedOnce.add(stage);
  diagCollector.mark(stage, detail);
  if (stage === 'first-era-paint') markFirstPaint();
  if (stage === 'first-era-paint' || stage === 'resume-paint') paintListener?.(stage, detail);
}

/** Resume from background: a warm launch gets its own marks, re-anchored to the resume. */
export function beginWarmLaunch(): void {
  diagCollector.beginLaunch('warm');
  markedOnce.clear();
}

/**
 * ms from native app start to the collector's T0 (JS start), from RN's
 * performance.rnStartupTiming when the platform provides it; null otherwise
 * (the report then measures JS start -> paint and says so).
 */
export function nativeLeadMs(perf: unknown, originNow: number): number | null {
  try {
    const start = (perf as { rnStartupTiming?: { startTime?: unknown } } | undefined)?.rnStartupTiming?.startTime;
    if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) return null;
    const lead = originNow - start;
    return lead >= 0 && lead <= 120_000 ? lead : null;
  } catch {
    return null;
  }
}

/** Route packages/content load-stage events into `diagCollector`, once, and mark app start. */
export function installDiagnostics(): void {
  if (installed) return;
  installed = true;
  setLoadTimingSink((e) => diagCollector.record(e));
  diagCollector.mark('app-start');
  const lead = nativeLeadMs((globalThis as { performance?: unknown }).performance, defaultNow() - diagCollector.elapsed());
  if (lead !== null) diagCollector.note('native-lead', lead);
}
