// One UI WP0.4b: minimal DOM-reader watchdog. Pure (no RN/Expo/network imports)
// so every rule is unit-testable with a fake clock. Persistence lives in
// watchdog-store.ts, the React wiring in watchdog-gate.ts.
//
// Rules: one persisted record per buildKey. A launch that records an attempt
// and then never reaches `ready` (killed/backgrounded) is ABANDONED, not a
// strike. A failure (ready-timeout, DOM error before ready, webview
// terminate/render-gone) is a strike: strike 1 mounts native for this launch;
// strike 2 (consecutive) also clears the C4 override and makes the next launch
// native too.

export const READY_TIMEOUT_MS = 10_000;
export const STRIKES_TO_FALLBACK = 2;
export const FALLBACK_LAUNCHES = 1;
export const MAX_REASON_CHARS = 120;

export type WatchdogState = 'idle' | 'attempting' | 'ready' | 'failed' | 'fallback';

export interface WatchdogRecord {
  v: 1;
  buildKey: string;
  state: WatchdogState;
  strikes: number;
  lastReason: string;
  fallbackLaunchesRemaining: number;
  at: number;
}

export type DomFailureMode = 'off' | 'throw' | 'hang';

export function parseDomFailureMode(raw: string | null | undefined): DomFailureMode {
  return raw === 'throw' || raw === 'hang' ? raw : 'off';
}

export const truncateReason = (s: string): string => s.slice(0, MAX_REASON_CHARS);

const STATES: WatchdogState[] = ['idle', 'attempting', 'ready', 'failed', 'fallback'];

export function freshRecord(buildKey: string, now: number): WatchdogRecord {
  return { v: 1, buildKey, state: 'idle', strikes: 0, lastReason: '', fallbackLaunchesRemaining: 0, at: now };
}

/** Defensive parse of the persisted JSON; anything malformed is null (treated as no record). */
export function parseRecord(raw: string | null): WatchdogRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Partial<WatchdogRecord>;
    const ok =
      r.v === 1 &&
      typeof r.buildKey === 'string' &&
      STATES.includes(r.state as WatchdogState) &&
      Number.isInteger(r.strikes) &&
      Number.isInteger(r.fallbackLaunchesRemaining) &&
      typeof r.at === 'number';
    if (!ok) return null;
    return { ...(r as WatchdogRecord), lastReason: truncateReason(String(r.lastReason ?? '')) };
  } catch {
    return null;
  }
}

export interface MountDecision {
  /** True while a fallback launch is owed: mount native whatever the flags say. */
  fallbackActive: boolean;
  /** The normalised record to persist for this launch. */
  record: WatchdogRecord;
}

/** Launch-time gate: folds the previous launch's outcome into the record. */
export function decideMount(
  record: WatchdogRecord | null,
  buildKey: string,
  now: number,
): MountDecision {
  if (!record || record.buildKey !== buildKey) {
    return { fallbackActive: false, record: freshRecord(buildKey, now) };
  }
  if (record.fallbackLaunchesRemaining > 0) {
    return {
      fallbackActive: true,
      record: {
        ...record,
        state: 'fallback',
        strikes: 0,
        fallbackLaunchesRemaining: record.fallbackLaunchesRemaining - 1,
        at: now,
      },
    };
  }
  // 'attempting' = the last launch never resolved (abandoned): no strike.
  // 'ready' = the last launch ran clean: the streak is over.
  const strikes = record.state === 'ready' ? 0 : record.strikes;
  return { fallbackActive: false, record: { ...record, state: 'idle', strikes, at: now } };
}

/** The mount predicate: shared UI wanted by flag or override, and no fallback owed. */
export function shouldMountDom(wantsDom: boolean, decision: MountDecision): boolean {
  return wantsDom && !decision.fallbackActive;
}

export const beginAttempt = (r: WatchdogRecord, now: number): WatchdogRecord => ({
  ...r,
  state: 'attempting',
  at: now,
});

/** Awaits the attempt write; null = it failed, so the caller must mount native (fail closed). */
export async function startAttempt(
  decision: MountDecision,
  now: number,
  save: (r: WatchdogRecord) => Promise<boolean>,
): Promise<WatchdogRecord | null> {
  const attempt = beginAttempt(decision.record, now);
  return (await save(attempt)) ? attempt : null;
}

export const markReady = (r: WatchdogRecord, now: number): WatchdogRecord => ({
  ...r,
  state: 'ready',
  at: now,
});

export function recordStrike(
  r: WatchdogRecord,
  reason: string,
  now: number,
): { record: WatchdogRecord; clearOverride: boolean } {
  const strikes = r.strikes + 1;
  const fallback = strikes >= STRIKES_TO_FALLBACK;
  return {
    clearOverride: fallback,
    record: {
      ...r,
      state: fallback ? 'fallback' : 'failed',
      strikes,
      lastReason: truncateReason(reason),
      fallbackLaunchesRemaining: fallback ? FALLBACK_LAUNCHES : r.fallbackLaunchesRemaining,
      at: now,
    },
  };
}

export function watchdogLines(r: WatchdogRecord | null): string[] {
  if (!r) return ['Watchdog: no record'];
  return [
    `Watchdog state: ${r.state}`,
    `Strikes: ${r.strikes}`,
    `Last reason: ${r.lastReason || 'none'}`,
    `Fallback launches remaining: ${r.fallbackLaunchesRemaining}`,
  ];
}

export interface Scheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface AttemptMonitorOptions {
  scheduler: Scheduler;
  now: () => number;
  active: boolean;
  onReady: () => void;
  onStrike: (reason: string) => void;
  timeoutMs?: number;
}

/**
 * One launch's ready-timeout + signal accounting. `ready` is idempotent;
 * `error` only strikes before ready; crashes strike at the event even after
 * ready; at most one strike per launch. The timeout is paused while the app
 * is backgrounded (an attempt that never returns is abandoned next launch).
 */
export function createAttemptMonitor(opts: AttemptMonitorOptions) {
  const { scheduler, now, onReady, onStrike } = opts;
  let remaining = opts.timeoutMs ?? READY_TIMEOUT_MS;
  let handle: unknown = null;
  let startedAt = 0;
  let readySeen = false;
  let struck = false;

  const stopTimer = () => {
    if (handle !== null) scheduler.clearTimeout(handle);
    handle = null;
  };
  const strike = (reason: string) => {
    if (struck) return;
    struck = true;
    stopTimer();
    onStrike(truncateReason(reason));
  };
  const startTimer = () => {
    startedAt = now();
    handle = scheduler.setTimeout(() => {
      handle = null;
      if (!readySeen) strike('ready-timeout');
    }, remaining);
  };
  if (opts.active) startTimer();

  return {
    ready() {
      if (readySeen || struck) return;
      readySeen = true;
      stopTimer();
      onReady();
    },
    error(message: string) {
      if (readySeen) return;
      strike(`dom-error: ${message}`);
    },
    crashed(kind: 'terminated' | 'render-gone') {
      strike(`webview-${kind}`);
    },
    setActive(active: boolean) {
      if (readySeen || struck) return;
      if (!active && handle !== null) {
        remaining = Math.max(0, remaining - (now() - startedAt));
        stopTimer();
      } else if (active && handle === null) {
        startTimer();
      }
    },
    dispose: stopTimer,
  };
}

export type AttemptMonitor = ReturnType<typeof createAttemptMonitor>;
