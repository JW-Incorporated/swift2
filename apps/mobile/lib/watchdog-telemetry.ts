// One UI WP2.14: category-only watchdog telemetry, DEFAULT OFF (on only when the
// remote config explicitly sets `watchdogReports: true`). A report is the
// minimal `[watchdog]` shape {platform, buildKey, category}: no device model,
// OS version, update id field or timings, and no free text. A device reports a
// given buildKey+category at most once PER INSTALL (#4874: the persisted `sent`
// marks do not expire; a new build has a new buildKey). History is bounded to
// the most recent MAX_SENT marks (older ones evict), and clearing app data
// resets it; the server dedupes durably regardless. MAX_PENDING wait in storage. Pure: storage, network, clock and platform are injected.
import { WATCHDOG_REASONS, type WatchdogReason } from './watchdog-policy';

export const MAX_PENDING = 3;
const MAX_SENT = 50;
export const WATCHDOG_PREFIX = '[watchdog]';

export type ReportPlatform = 'ios' | 'android';

export interface PendingReport {
  category: WatchdogReason;
  buildKey: string;
}

export interface SentMark {
  buildKey: string;
  category?: WatchdogReason;
  at: number;
}

export interface ReportState {
  pending: PendingReport[];
  sent: SentMark[];
}

export interface WatchdogPayload {
  message: typeof WATCHDOG_PREFIX;
  watchdog: { platform: ReportPlatform; buildKey: string; category: WatchdogReason };
}

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 80;

/** Defensive parse: anything malformed is dropped, never thrown. */
export function parseReportState(raw: string | null): ReportState {
  const empty: ReportState = { pending: [], sent: [] };
  if (!raw) return empty;
  try {
    const o = JSON.parse(raw) as { pending?: unknown; sent?: unknown };
    const pending = (Array.isArray(o.pending) ? o.pending : [])
      .filter(
        (p): p is PendingReport =>
          !!p && (WATCHDOG_REASONS as readonly unknown[]).includes(p.category) && str(p.buildKey),
      )
      .map((p) => ({ category: p.category, buildKey: p.buildKey }));
    const sent = (Array.isArray(o.sent) ? o.sent : [])
      .filter((s): s is SentMark => !!s && str(s.buildKey) && Number.isFinite(s.at))
      .map((s) =>
        (WATCHDOG_REASONS as readonly unknown[]).includes(s.category)
          ? { buildKey: s.buildKey, category: s.category, at: s.at }
          : { buildKey: s.buildKey, at: s.at },
      );
    return { pending: pending.slice(-MAX_PENDING), sent: sent.slice(-MAX_SENT) };
  } catch {
    return empty;
  }
}

/** A legacy mark (no category, written before #4874) covers the whole buildKey. */
const alreadySent = (state: ReportState, r: PendingReport): boolean =>
  state.sent.some((s) => s.buildKey === r.buildKey && (s.category === undefined || s.category === r.category));

/** Adds a report unless that buildKey+category is already pending or is in this install's recent sent history. */
export function enqueueReport(state: ReportState, report: PendingReport): ReportState {
  if (alreadySent(state, report) || state.pending.some((p) => p.buildKey === report.buildKey && p.category === report.category))
    return state;
  return { ...state, pending: [...state.pending, report].slice(-MAX_PENDING) };
}

export const reportPayload = (r: PendingReport, platform: ReportPlatform): WatchdogPayload => ({
  message: WATCHDOG_PREFIX,
  watchdog: { platform, buildKey: r.buildKey, category: r.category },
});

export interface TelemetryDeps {
  load: () => Promise<string | null>;
  save: (raw: string) => Promise<void>;
  send: (p: WatchdogPayload) => Promise<{ ok: boolean }>;
  platform: () => ReportPlatform;
  now: () => number;
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
      const res = await deps.send(reportPayload(p, deps.platform())).catch(() => ({ ok: false }));
      if (!res.ok) break;
      const now = deps.now();
      state = {
        pending: state.pending.filter((q) => q !== p),
        sent: [...state.sent, { buildKey: p.buildKey, category: p.category, at: now }].slice(-MAX_SENT),
      };
      await write(state);
    }
  }

  return {
    /** Sends what is pending when online (next launch at the latest); drops it when reports are off. */
    flush: (enabled: boolean) => serial(() => flushNow(enabled)),
    /** Enqueues one report (once per buildKey+category per install) and tries to send it straight away. */
    report: (category: WatchdogReason, buildKey: string, enabled: boolean) =>
      serial(async () => {
        if (!enabled) return;
        await write(enqueueReport(await read(), { category, buildKey }));
        await flushNow(true);
      }),
  };
}
