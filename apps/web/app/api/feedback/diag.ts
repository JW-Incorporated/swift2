// One UI WP0.1 / C2: strict, server-side handling of `[diag]` device timing
// reports. The endpoint is public and unauthenticated, so a report is NEVER
// posted as client text: the structured payload is validated against an exact
// schema (known keys, charsets, ranges) and the GitHub comment is rebuilt from
// the validated values only, via a fixed template. Residual risk accepted:
// anyone can post fake numbers in this fixed format.

/** The tracking issue `[diag]` reports are appended to. Hardcoded on purpose — an env var would be prod infra. */
export const DIAG_ISSUE_NUMBER = 4791;
export const DIAG_PREFIX = '[diag]';
/** Issue #4791 lives in this repo only, so the comment URL never follows FEEDBACK_REPO. */
export const DIAG_REPO = 'JW-Incorporated/swift2';
export const MAX_DIAG_BYTES = 4096;

export const DIAG_STAGES = [
  'app-start',
  'config',
  'app-first-render',
  'pointer',
  'manifest',
  'download',
  'hash',
  'parse',
  'validate',
  'disk-write',
  'load-total',
  'provider-wiring',
  'first-era-paint',
  'resume-paint',
  'first-image-paint',
  'native-lead',
] as const;

/** Instant marks (no duration): reported by `at:` offset only. Mirrors apps/mobile/lib/diagnostics.ts POINT_STAGES (a test pins them equal). */
export const POINT_STAGES = [
  'app-start',
  'app-first-render',
  'provider-wiring',
  'first-era-paint',
  'resume-paint',
  'first-image-paint',
] as const;

/** Speed test mode (#4896). The bar is PLAN.md §WP0.2; mobile's speed-test.ts mirrors it (a test pins them equal). */
export const SPEED_COLD_BAR_MS = 2500;
export const SPEED_WARM_BAR_MS = 1000;
export const MAX_SPEED_LAUNCHES = 30;
const SPEED_KEYS = ['run', 'kind', 'index', 'total', 'ui', 'anchor', 'images10s', 'launches'];
const RUN_RE = /^[0-9a-f]{8}$/;

export interface SpeedMeta {
  run: string;
  kind: 'launch' | 'summary';
  index: number;
  total: number;
  ui: 'native' | 'shared' | 'unknown';
  anchor: 'native' | 'js';
  images10s?: number;
  launches?: { k: 'cold' | 'warm'; ms: number }[];
}

const MAX_TIMINGS = 60;
const MAX_DOWNLOAD_KEYS = 10;
const MAX_MS = 600_000;
const TEXT_RE = /^[A-Za-z0-9 ,._()-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOWNLOAD_KEY_RE = /^download:[A-Za-z0-9:_.-]{1,40}$/;
const TOP_KEYS = ['model', 'os', 'build', 'updateId', 'launch', 'timings', 'speed'];

export interface DiagReport {
  model: string;
  os: string;
  build: string;
  updateId: string;
  launch: 'cold' | 'warm' | 'unknown';
  timings: Record<string, number>;
  speed?: SpeedMeta;
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function parseSpeed(raw: unknown): SpeedMeta | null {
  if (!isObject(raw) || Object.keys(raw).some((k) => !SPEED_KEYS.includes(k))) return null;
  const { run, kind, index, total, ui, anchor, images10s, launches } = raw;
  if (typeof run !== 'string' || !RUN_RE.test(run)) return null;
  if (kind !== 'launch' && kind !== 'summary') return null;
  if (!isInt(total, 1, MAX_SPEED_LAUNCHES) || !isInt(index, 1, total)) return null;
  if (ui !== 'native' && ui !== 'shared' && ui !== 'unknown') return null;
  if (anchor !== 'native' && anchor !== 'js') return null;
  const meta: SpeedMeta = { run, kind, index, total, ui, anchor };
  if (images10s !== undefined) {
    if (kind !== 'launch' || !isInt(images10s, 0, 500)) return null;
    meta.images10s = images10s;
  }
  if (kind === 'summary') {
    if (!Array.isArray(launches) || launches.length < 1 || launches.length > MAX_SPEED_LAUNCHES) return null;
    meta.launches = [];
    for (const l of launches) {
      if (!isObject(l) || Object.keys(l).some((k) => k !== 'k' && k !== 'ms')) return null;
      if ((l.k !== 'cold' && l.k !== 'warm') || typeof l.ms !== 'number') return null;
      if (!Number.isFinite(l.ms) || l.ms < 0 || l.ms > MAX_MS) return null;
      meta.launches.push({ k: l.k, ms: l.ms });
    }
  } else if (launches !== undefined) {
    return null;
  }
  return meta;
}

/** Worst cold/warm and PASS/FAIL against the §WP0.2 bar, recomputed server-side from the raw launches. */
export function speedVerdict(launches: { k: 'cold' | 'warm'; ms: number }[]) {
  const worst = (k: 'cold' | 'warm'): number | null => {
    const ms = launches.filter((l) => l.k === k).map((l) => l.ms);
    return ms.length ? Math.max(...ms) : null;
  };
  const cold = worst('cold');
  const warm = worst('warm');
  const over = (cold ?? 0) > SPEED_COLD_BAR_MS || (warm ?? 0) > SPEED_WARM_BAR_MS;
  const verdict = over ? 'FAIL' : cold === null || warm === null ? 'INCOMPLETE' : 'PASS';
  return { cold, warm, verdict };
}

const SPEED_WINDOW_MS = 24 * 60 * 60_000;
const SPEED_MAX_PER_RUN = MAX_SPEED_LAUNCHES + 1;
const SPEED_GLOBAL_MAX = 300;
const MAX_TRACKED_RUNS = 500;
const speedSeen = new Map<string, number[]>();
let speedGlobal: number[] = [];

/**
 * Flood guard for Speed test mode (in-memory, per server instance, best effort,
 * same posture as watchdogAllowed): at most one report per launch plus the
 * summary per run id per 24 h, and SPEED_GLOBAL_MAX across all run ids (defeats
 * run-id rotation by a stuck device). Returns false when over either cap.
 */
export function speedAllowed(run: string, now: number = Date.now()): boolean {
  speedGlobal = speedGlobal.filter((t) => now - t < SPEED_WINDOW_MS);
  if (speedGlobal.length >= SPEED_GLOBAL_MAX) return false;
  const recent = (speedSeen.get(run) ?? []).filter((t) => now - t < SPEED_WINDOW_MS);
  if (recent.length >= SPEED_MAX_PER_RUN) {
    speedSeen.set(run, recent);
    return false;
  }
  if (!speedSeen.has(run) && speedSeen.size >= MAX_TRACKED_RUNS) {
    speedSeen.delete(speedSeen.keys().next().value as string);
  }
  speedSeen.set(run, [...recent, now]);
  speedGlobal.push(now);
  return true;
}

export const resetSpeedAllowed = (): void => {
  speedSeen.clear();
  speedGlobal = [];
};

export function isDiagMessage(message: string): boolean {
  return message.startsWith(DIAG_PREFIX);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const text = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= max && TEXT_RE.test(v);

function timingKeyOk(key: string): boolean {
  const stage = key.startsWith('at:') ? key.slice(3) : key;
  return (DIAG_STAGES as readonly string[]).includes(stage) || DOWNLOAD_KEY_RE.test(key);
}

/** Validate the `diag` payload. Returns the report or a short fixed error (never echoes client text). */
export function parseDiagReport(raw: unknown): { ok: true; report: DiagReport } | { ok: false } {
  if (!isObject(raw) || JSON.stringify(raw).length > MAX_DIAG_BYTES) return { ok: false };
  if (Object.keys(raw).some((k) => !TOP_KEYS.includes(k))) return { ok: false };
  const { model, os, build, updateId, launch, timings, speed: rawSpeed } = raw;
  const speed = rawSpeed === undefined ? undefined : parseSpeed(rawSpeed);
  if (speed === null) return { ok: false };
  if (!text(model, 40) || !text(os, 20) || !text(build, 20)) return { ok: false };
  if (typeof updateId !== 'string' || !(updateId === 'embedded' || UUID_RE.test(updateId))) {
    return { ok: false };
  }
  if (launch !== 'cold' && launch !== 'warm' && launch !== 'unknown') return { ok: false };
  if (!isObject(timings)) return { ok: false };
  const keys = Object.keys(timings);
  if (keys.length > MAX_TIMINGS || (keys.length === 0 && speed?.kind !== 'summary')) return { ok: false };
  if (keys.filter((k) => k.startsWith('download:')).length > MAX_DOWNLOAD_KEYS) return { ok: false };
  const out: Record<string, number> = {};
  for (const key of keys) {
    const v = timings[key];
    if (!timingKeyOk(key) || typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > MAX_MS) {
      return { ok: false };
    }
    out[key] = v;
  }
  return {
    ok: true,
    report: { model, os, build, updateId, launch, timings: out, ...(speed ? { speed } : {}) },
  };
}

/** Fixed-template comment body built only from validated values. */
export function diagCommentFrom(r: DiagReport): string {
  const ms = (n: number): string => n.toFixed(1);
  const order = (k: string): number => {
    const stage = k.startsWith('at:') ? k.slice(3) : k;
    const i = (DIAG_STAGES as readonly string[]).indexOf(stage);
    return (i === -1 ? DIAG_STAGES.length : i) * 2 + (k.startsWith('at:') ? 1 : 0);
  };
  // Only the fixed point-mark stages drop their duration row; a timed stage measuring 0 ms keeps it.
  const isPoint = (k: string): boolean =>
    (POINT_STAGES as readonly string[]).includes(k) && r.timings[k] === 0 && `at:${k}` in r.timings;
  const keys = Object.keys(r.timings)
    .filter((k) => !isPoint(k))
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  const s = r.speed;
  const speedRows = s
    ? [
        `| Speed test | run \`${s.run}\`, ${s.kind === 'summary' ? 'summary of' : `launch ${s.index} of`} ${s.kind === 'summary' ? s.index : s.total} |`,
        `| UI | ${s.ui} |`,
        `| Clock starts at | ${s.anchor === 'native' ? 'native process start' : 'JS start (native lead unavailable)'} |`,
        ...(s.images10s !== undefined ? [`| Images loaded by T+10 s | ${s.images10s} |`] : []),
      ]
    : [];
  let body: string[] = [
    '| Timing | ms |',
    '|---|---|',
    ...keys.map((k) => `| \`${k}\` | ${ms(r.timings[k])} |`),
  ];
  if (s?.kind === 'summary' && s.launches) {
    const v = speedVerdict(s.launches);
    const worst = (n: number | null): string => (n === null ? 'n/a' : ms(n));
    body = [
      '| Launch | Kind | ms |',
      '|---|---|---|',
      ...s.launches.map((l, i) => `| ${i + 1} | ${l.k} | ${ms(l.ms)} |`),
      '',
      '| Result | Value |',
      '|---|---|',
      `| Worst cold (bar ${SPEED_COLD_BAR_MS}) | ${worst(v.cold)} |`,
      `| Worst warm (bar ${SPEED_WARM_BAR_MS}) | ${worst(v.warm)} |`,
      `| Verdict | **${v.verdict}** |`,
    ];
  }
  return [
    '**[diag] device timing report**',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Model | \`${r.model}\` |`,
    `| OS | \`${r.os}\` |`,
    `| Build | \`${r.build}\` |`,
    `| Update id | \`${r.updateId}\` |`,
    `| Launch | ${r.launch} |`,
    ...speedRows,
    '',
    ...body,
    '',
    '<!-- diag:v1 -->',
  ].join('\n');
}
