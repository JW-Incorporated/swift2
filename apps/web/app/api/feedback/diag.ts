// One UI WP0.1 / C2: strict, server-side handling of `[diag]` device timing
// reports. The endpoint is public and unauthenticated, so a report is NEVER
// posted as client text: the structured payload is validated against an exact
// schema (known keys, charsets, ranges) and the GitHub comment is rebuilt from
// the validated values only, via a fixed template. Residual risk accepted:
// anyone can post fake numbers in this fixed format.

/** The tracking issue `[diag]` reports are appended to. Hardcoded on purpose — an env var would be prod infra. */
export const DIAG_ISSUE_NUMBER = 4791;
export const DIAG_PREFIX = '[diag]';
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
] as const;

const MAX_TIMINGS = 60;
const MAX_DOWNLOAD_KEYS = 10;
const MAX_MS = 600_000;
const TEXT_RE = /^[A-Za-z0-9 ,._()-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOWNLOAD_KEY_RE = /^download:[A-Za-z0-9:_.-]{1,40}$/;
const TOP_KEYS = ['model', 'os', 'build', 'updateId', 'launch', 'timings'];

export interface DiagReport {
  model: string;
  os: string;
  build: string;
  updateId: string;
  launch: 'cold' | 'warm';
  timings: Record<string, number>;
}

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
  const { model, os, build, updateId, launch, timings } = raw;
  if (!text(model, 40) || !text(os, 20) || !text(build, 20)) return { ok: false };
  if (typeof updateId !== 'string' || !(updateId === 'embedded' || UUID_RE.test(updateId))) {
    return { ok: false };
  }
  if (launch !== 'cold' && launch !== 'warm') return { ok: false };
  if (!isObject(timings)) return { ok: false };
  const keys = Object.keys(timings);
  if (keys.length === 0 || keys.length > MAX_TIMINGS) return { ok: false };
  if (keys.filter((k) => k.startsWith('download:')).length > MAX_DOWNLOAD_KEYS) return { ok: false };
  const out: Record<string, number> = {};
  for (const key of keys) {
    const v = timings[key];
    if (!timingKeyOk(key) || typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > MAX_MS) {
      return { ok: false };
    }
    out[key] = v;
  }
  return { ok: true, report: { model, os, build, updateId, launch, timings: out } };
}

/** Fixed-template comment body built only from validated values. */
export function diagCommentFrom(r: DiagReport): string {
  const ms = (n: number): string => n.toFixed(1);
  const order = (k: string): number => {
    const stage = k.startsWith('at:') ? k.slice(3) : k;
    const i = (DIAG_STAGES as readonly string[]).indexOf(stage);
    return (i === -1 ? DIAG_STAGES.length : i) * 2 + (k.startsWith('at:') ? 1 : 0);
  };
  const keys = Object.keys(r.timings).sort((a, b) => order(a) - order(b) || a.localeCompare(b));
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
    '',
    '| Timing | ms |',
    '|---|---|',
    ...keys.map((k) => `| \`${k}\` | ${ms(r.timings[k])} |`),
    '',
    '<!-- diag:v1 -->',
  ].join('\n');
}
