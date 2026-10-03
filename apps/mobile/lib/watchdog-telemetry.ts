// One UI WP2.14: category-only watchdog telemetry. A report rides the existing
// strict `[diag]` schema (apps/web/app/api/feedback/diag.ts): fixed stage names
// from an enum, no free text, no device id or push token. At most MAX_PENDING
// reports wait in storage; each (kind, buildKey) is reported once, ever (the
// `sent` list remembers it). Pure: storage and network are injected.
import { buildDiagPayload, type DiagEnv, type DiagPayload } from './diagnostics';
import { WATCHDOG_REASONS, type WatchdogReason } from './watchdog-policy';

export const MAX_PENDING = 3;
const MAX_SENT = 6;
export const REPORT_KINDS = ['watchdog-fallback', 'watchdog-quarantine'] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export interface PendingReport {
  kind: ReportKind;
  category: WatchdogReason;
  buildKey: string;
  env: DiagEnv;
}

export interface ReportState {
  pending: PendingReport[];
  sent: string[];
}

const keyOf = (kind: string, buildKey: string): string => `${kind}@${buildKey}`;
const str = (v: unknown): v is string => typeof v === 'string' && v.length <= 80;

/** Defensive parse: anything malformed is dropped, never thrown. */
export function parseReportState(raw: string | null): ReportState {
  const empty: ReportState = { pending: [], sent: [] };
  if (!raw) return empty;
  try {
    const o = JSON.parse(raw) as { pending?: unknown; sent?: unknown };
    const pending = (Array.isArray(o.pending) ? o.pending : []).filter(
      (p): p is PendingReport =>
        !!p &&
        (REPORT_KINDS as readonly unknown[]).includes(p.kind) &&
        (WATCHDOG_REASONS as readonly unknown[]).includes(p.category) &&
        str(p.buildKey) &&
        !!p.env &&
        str(p.env.model) && str(p.env.os) && str(p.env.build) && str(p.env.updateId),
    );
    const sent = (Array.isArray(o.sent) ? o.sent : []).filter(str);
    return { pending: pending.slice(-MAX_PENDING), sent: sent.slice(-MAX_SENT) };
  } catch {
    return empty;
  }
}

/** Adds a report unless that (kind, buildKey) is already pending or was already sent. */
export function enqueueReport(state: ReportState, report: PendingReport): ReportState {
  const k = keyOf(report.kind, report.buildKey);
  if (state.sent.includes(k) || state.pending.some((p) => keyOf(p.kind, p.buildKey) === k)) return state;
  return { ...state, pending: [...state.pending, report].slice(-MAX_PENDING) };
}

/** The `[diag]` body: two fixed point stages (kind, `wd-<category>`), nothing else. */
export function reportPayload(r: PendingReport): DiagPayload {
  const point = (stage: string) => ({ stage, count: 1, totalMs: 0, maxMs: 0, firstStartMs: 0 });
  return buildDiagPayload(r.env, {
    launch: 'unknown',
    stages: [point(r.kind), point(`wd-${r.category}`)],
    slowestDownloads: [],
  });
}

export interface TelemetryDeps {
  load: () => Promise<string | null>;
  save: (raw: string) => Promise<void>;
  send: (p: DiagPayload) => Promise<{ ok: boolean }>;
  env: () => DiagEnv;
}

export function createTelemetry(deps: TelemetryDeps) {
  let tail: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.then(fn, fn);
    tail = run.catch(() => undefined);
    return run;
  };
  const read = async (): Promise<ReportState> => parseReportState(await deps.load().catch(() => null));
  const write = (s: ReportState) => deps.save(JSON.stringify(s)).catch(() => undefined);

  async function flushNow(enabled: boolean): Promise<void> {
    let state = await read();
    if (state.pending.length === 0) return;
    if (!enabled) return write({ ...state, pending: [] });
    for (const p of state.pending) {
      const res = await deps.send(reportPayload(p)).catch(() => ({ ok: false }));
      if (!res.ok) break;
      state = {
        pending: state.pending.filter((q) => q !== p),
        sent: [...state.sent, keyOf(p.kind, p.buildKey)].slice(-MAX_SENT),
      };
      await write(state);
    }
  }

  return {
    /** Sends what is pending when online (next launch at the latest); drops it when reports are off. */
    flush: (enabled: boolean) => serial(() => flushNow(enabled)),
    /** Enqueues one report (deduped) and tries to send it straight away. */
    report: (kind: ReportKind, category: WatchdogReason, buildKey: string, enabled: boolean) =>
      serial(async () => {
        if (!enabled) return;
        const next = enqueueReport(await read(), { kind, category, buildKey, env: deps.env() });
        await write(next);
        await flushNow(true);
      }),
  };
}
