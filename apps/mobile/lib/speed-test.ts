// Speed test mode (#4896) — pure state, math and report builders. A tester
// flips one switch in Diagnostics; the next N launches each send a `[diag]`
// timing report with no taps, then a summary. State lives in SecureStore
// (speed-test-store.ts) like the other diagnostics switches.
import {
  buildDiagPayload,
  type DiagEnv,
  type DiagPayload,
  type DiagSpeed,
  type TimingSummary,
} from './diagnostics';

/** PLAN.md §WP0.2 bar: cold launch to eras <= 2.5 s (worst), warm <= 1 s. Mirrors apps/web/app/api/feedback/diag.ts. */
export const COLD_BAR_MS = 2500;
export const WARM_BAR_MS = 1000;
export const DEFAULT_LAUNCHES = 10;
export const MAX_LAUNCHES = 30;
/** PLAN §WP0.2 is worst-of-5: PASS needs at least this many cold AND warm launches. */
export const MIN_PER_KIND = 5;

export type Ui = 'native' | 'shared' | 'unknown';

export interface LaunchResult {
  k: 'cold' | 'warm';
  ms: number;
  ui: Ui;
  anchor: 'native' | 'js';
  /** Images loaded by T+10 s (cold launches only). */
  img: number | null;
}

export interface SpeedState {
  v: 1;
  run: string;
  total: number;
  remaining: number;
  results: LaunchResult[];
}

export const isActive = (s: SpeedState | null): s is SpeedState => s !== null && s.remaining > 0;

export function newRunId(rand: () => number = Math.random): string {
  let id = '';
  for (let i = 0; i < 8; i++) id += Math.floor(rand() * 16).toString(16);
  return id;
}

export function startRun(total: number = DEFAULT_LAUNCHES, rand?: () => number): SpeedState {
  const n = Math.min(MAX_LAUNCHES, Math.max(1, Math.floor(total)));
  return { v: 1, run: newRunId(rand), total: n, remaining: n, results: [] };
}

export function recordLaunch(s: SpeedState, r: LaunchResult): SpeedState {
  if (s.remaining <= 0) return s;
  return { ...s, remaining: s.remaining - 1, results: [...s.results, r] };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parseResult(r: unknown): LaunchResult | null {
  if (!isRecord(r)) return null;
  const { k, ms, ui, anchor, img } = r;
  if (k !== 'cold' && k !== 'warm') return null;
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0 || ms > 600_000) return null;
  if (ui !== 'native' && ui !== 'shared' && ui !== 'unknown') return null;
  if (anchor !== 'native' && anchor !== 'js') return null;
  if (img !== null && !(typeof img === 'number' && Number.isInteger(img) && img >= 0 && img <= 500)) return null;
  return { k, ms, ui, anchor, img };
}

/** Strict read of the stored state; anything malformed is "no run" (never throws). */
export function parseState(raw: string | null): SpeedState | null {
  if (!raw) return null;
  try {
    const o: unknown = JSON.parse(raw);
    if (!isRecord(o) || o.v !== 1 || typeof o.run !== 'string' || !/^[0-9a-f]{8}$/.test(o.run)) return null;
    const { total, remaining, results } = o;
    if (typeof total !== 'number' || !Number.isInteger(total) || total < 1 || total > MAX_LAUNCHES) return null;
    if (typeof remaining !== 'number' || !Number.isInteger(remaining) || remaining < 0) return null;
    if (!Array.isArray(results) || results.length > total || remaining + results.length !== total) return null;
    const parsed = results.map(parseResult);
    if (parsed.some((r) => r === null)) return null;
    return { v: 1, run: o.run, total, remaining, results: parsed as LaunchResult[] };
  } catch {
    return null;
  }
}

export type Verdict = 'PASS' | 'FAIL' | 'INCOMPLETE';

export function summarizeRun(results: readonly LaunchResult[]): {
  worstCold: number | null;
  worstWarm: number | null;
  verdict: Verdict;
} {
  const worst = (k: 'cold' | 'warm'): number | null => {
    const ms = results.filter((r) => r.k === k).map((r) => r.ms);
    return ms.length ? Math.max(...ms) : null;
  };
  const worstCold = worst('cold');
  const worstWarm = worst('warm');
  const count = (k: 'cold' | 'warm'): number => results.filter((r) => r.k === k).length;
  const over = (worstCold ?? 0) > COLD_BAR_MS || (worstWarm ?? 0) > WARM_BAR_MS;
  const short = count('cold') < MIN_PER_KIND || count('warm') < MIN_PER_KIND;
  const verdict = over ? 'FAIL' : short ? 'INCOMPLETE' : 'PASS';
  return { worstCold, worstWarm, verdict };
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * The per-launch headline number. Cold = native lead (when RN reports the
 * native app start) + JS start -> first-era-paint; without a native anchor it is
 * JS start -> paint and `anchor` says so. Warm = resume -> resume-paint.
 */
export function launchMetric(
  summary: TimingSummary,
  kind: 'cold' | 'warm',
): { ms: number; anchor: 'native' | 'js' } | null {
  const stage = (name: string) => summary.stages.find((s) => s.stage === name);
  if (kind === 'warm') {
    const paint = stage('resume-paint');
    return paint ? { ms: round1(paint.firstStartMs), anchor: 'js' } : null;
  }
  const paint = stage('first-era-paint');
  if (!paint) return null;
  const lead = stage('native-lead');
  return lead
    ? { ms: round1(lead.totalMs + paint.firstStartMs), anchor: 'native' }
    : { ms: round1(paint.firstStartMs), anchor: 'js' };
}

export function launchReport(
  env: DiagEnv,
  summary: TimingSummary,
  state: SpeedState,
  result: LaunchResult,
): DiagPayload {
  const speed: DiagSpeed = {
    run: state.run,
    kind: 'launch',
    index: state.results.length + 1,
    total: state.total,
    ui: result.ui,
    anchor: result.anchor,
    ...(result.img !== null ? { images10s: result.img } : {}),
  };
  return buildDiagPayload(env, summary, speed);
}

/** The single end-of-run report; the server recomputes worst/verdict from `launches`. */
export function summaryReport(env: DiagEnv, state: SpeedState): DiagPayload {
  const last = state.results[state.results.length - 1];
  const speed: DiagSpeed = {
    run: state.run,
    kind: 'summary',
    index: state.results.length,
    total: state.total,
    ui: last?.ui ?? 'unknown',
    anchor: state.results.every((r) => r.anchor === 'native') ? 'native' : 'js',
    launches: state.results.map((r) => ({ k: r.k, ms: r.ms })),
  };
  return buildDiagPayload(env, { launch: 'unknown', stages: [], slowestDownloads: [] }, speed);
}

export interface OutboxEntry {
  p: DiagPayload;
  tries: number;
  /** Earliest epoch ms for the next send attempt. */
  next: number;
}

export const MAX_OUTBOX = 8;
export const MAX_TRIES = 8;

/** 1 min, 2 min, 4 min ... capped at 1 h. */
export const backoffMs = (tries: number): number => Math.min(30_000 * 2 ** tries, 3_600_000);

export function parseOutbox(raws: readonly string[]): OutboxEntry[] {
  const out: OutboxEntry[] = [];
  for (const raw of raws) {
    try {
      const o: unknown = JSON.parse(raw);
      if (!isRecord(o) || !isRecord(o.p) || o.p.message !== '[diag]' || !isRecord(o.p.diag)) continue;
      if (!isRecord(o.p.diag.speed)) continue;
      if (typeof o.tries !== 'number' || !Number.isInteger(o.tries) || o.tries < 0) continue;
      if (typeof o.next !== 'number' || !Number.isFinite(o.next)) continue;
      out.push({ p: o.p as unknown as DiagPayload, tries: o.tries, next: o.next });
    } catch {
      // an unreadable entry is dropped, never thrown
    }
  }
  return out.slice(-MAX_OUTBOX);
}

const isSummary = (e: OutboxEntry): boolean => e.p.diag.speed?.kind === 'summary';

/** Append, then keep at most MAX_OUTBOX entries: oldest launch reports go first, a summary is never evicted. */
export function capOutbox(entries: OutboxEntry[]): OutboxEntry[] {
  const out = [...entries];
  while (out.length > MAX_OUTBOX) {
    const i = out.findIndex((e) => !isSummary(e));
    out.splice(i === -1 ? 0 : i, 1);
  }
  return out;
}

export function panelLines(s: SpeedState | null, pendingSends = 0): string[] {
  const queued = pendingSends > 0 ? [`${pendingSends} report(s) waiting to be sent (retries on next launch).`] : [];
  if (!s) return ['Speed test: off', ...queued];
  if (s.remaining > 0) {
    return [
      `Speed test: ON, run ${s.run}`,
      `${s.results.length} of ${s.total} launches done. Force-stop and reopen, or background and resume.`,
      ...queued,
    ];
  }
  const r = summarizeRun(s.results);
  const f = (n: number | null): string => (n === null ? 'n/a' : `${Math.round(n)} ms`);
  return [
    `Speed test done, run ${s.run}: ${r.verdict}`,
    `Worst cold ${f(r.worstCold)}, worst warm ${f(r.worstWarm)}`,
    ...queued,
  ];
}
