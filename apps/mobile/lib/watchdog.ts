// One UI WP0.4b: minimal DOM-reader watchdog. Pure (no RN/Expo/network imports)
// so every rule is unit-testable with a fake clock. Persistence lives in
// watchdog-store.ts, the React wiring in watchdog-gate.ts.
//
// Rules: one persisted record per buildKey. A launch that records an attempt
// and never reaches `ready` is a strike if it died in the foreground
// ('abandoned-before-ready'); if the app was backgrounded first it is merely
// ABANDONED (the OS may have reaped it); 2 consecutive abandons are a strike
// ('abandoned-repeated'), so a stale or lost `backgrounded` marker cannot keep
// the DOM host alive forever. Bound: worst case 4 launches before the native
// fallback (2 abandoned -> strike 1, 2 more -> strike 2 -> fallback). A
// double-failed ready save costs at most one false strike, which the next
// ready launch clears. A failure (ready-timeout, DOM error before ready, webview
// terminate/render-gone) is a strike: strike 1 mounts native for this launch;
// strike 2 (consecutive) also clears the C4 override and makes the next launch
// native too.

import { escalate, quarantinedDecision } from './watchdog-policy';

export const READY_TIMEOUT_MS = 10_000;
export const STRIKES_TO_FALLBACK = 2;
export const FALLBACK_LAUNCHES = 1;
export const ABANDONED_TO_STRIKE = 2;
export const MAX_REASON_CHARS = 120;

export type WatchdogState = 'idle' | 'attempting' | 'ready' | 'failed' | 'fallback' | 'quarantined';

export interface WatchdogRecord {
  v: 1;
  /** WP2.14: fallbacks owed within this buildKey; QUARANTINE_AFTER of them quarantines the build. */
  fallbackCycles: number;
  buildKey: string;
  state: WatchdogState;
  strikes: number;
  lastReason: string;
  fallbackLaunchesRemaining: number;
  /** True once the app was backgrounded during an unresolved attempt. */
  backgrounded: boolean;
  /** Consecutive launches abandoned (backgrounded) before ready. */
  abandonedStreak: number;
  at: number;
}

export type DomFailureMode = 'off' | 'throw' | 'hang';

export function parseDomFailureMode(raw: string | null | undefined): DomFailureMode {
  return raw === 'throw' || raw === 'hang' ? raw : 'off';
}

export const truncateReason = (s: string): string => s.slice(0, MAX_REASON_CHARS);

const STATES: WatchdogState[] = ['idle', 'attempting', 'ready', 'failed', 'fallback', 'quarantined'];

export function freshRecord(buildKey: string, now: number): WatchdogRecord {
  return { v: 1, fallbackCycles: 0, buildKey, state: 'idle', strikes: 0, lastReason: '', fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: now };
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
    return {
      ...(r as WatchdogRecord),
      fallbackCycles: Number.isInteger(r.fallbackCycles) ? (r.fallbackCycles as number) : 0,
      backgrounded: typeof r.backgrounded === 'boolean' ? r.backgrounded : false,
      abandonedStreak: Number.isInteger(r.abandonedStreak) ? (r.abandonedStreak as number) : 0,
      lastReason: truncateReason(String(r.lastReason ?? '')),
    };
  } catch {
    return null;
  }
}

export interface MountDecision {
  /** True while a fallback launch is owed: mount native whatever the flags say. */
  fallbackActive: boolean;
  /** True when this decision itself reached strike 2: clear the C4 override. */
  clearOverride: boolean;
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
    return { fallbackActive: false, clearOverride: false, record: freshRecord(buildKey, now) };
  }
  if (record.state === 'quarantined') return quarantinedDecision(record, now);
  if (record.fallbackLaunchesRemaining > 0) {
    return {
      fallbackActive: true,
      clearOverride: false,
      record: {
        ...record,
        state: 'fallback',
        strikes: 0,
        fallbackLaunchesRemaining: record.fallbackLaunchesRemaining - 1,
        backgrounded: false,
        abandonedStreak: 0,
        at: now,
      },
    };
  }
  // 'attempting' in the foreground = the last launch died before ready: a strike.
  // 'attempting' after backgrounding = abandoned; the 2nd in a row is a strike.
  if (record.state === 'attempting' && !record.backgrounded) {
    const s = recordStrike(record, 'abandoned-before-ready', now);
    return { fallbackActive: s.clearOverride, clearOverride: s.clearOverride, record: s.record };
  }
  let abandonedStreak = record.abandonedStreak;
  if (record.state === 'attempting' && record.backgrounded) {
    abandonedStreak += 1;
    if (abandonedStreak >= ABANDONED_TO_STRIKE) {
      const s = recordStrike(record, 'abandoned-repeated', now);
      return { fallbackActive: s.clearOverride, clearOverride: s.clearOverride, record: s.record };
    }
  }
  // 'ready' = the last launch ran clean: the streak is over.
  if (record.state === 'ready') abandonedStreak = 0;
  const strikes = record.state === 'ready' ? 0 : record.strikes;
  return {
    fallbackActive: false,
    clearOverride: false,
    record: { ...record, state: 'idle', strikes, backgrounded: false, abandonedStreak, at: now },
  };
}

/** The mount predicate: shared UI wanted by flag or override, and no fallback owed. */
export function shouldMountDom(wantsDom: boolean, decision: MountDecision): boolean {
  return wantsDom && !decision.fallbackActive;
}

export const beginAttempt = (r: WatchdogRecord, now: number): WatchdogRecord => ({
  ...r,
  state: 'attempting',
  backgrounded: false,
  at: now,
});

/** Awaits the attempt write; null = it failed, so the caller must mount native (fail closed). */
export async function startAttempt(
  decision: MountDecision,
  now: number,
  save: (r: WatchdogRecord) => Promise<boolean>,
  stillWanted: () => boolean = () => true,
): Promise<WatchdogRecord | null> {
  const attempt = beginAttempt(decision.record, now);
  if (!(await save(attempt))) return null;
  if (!stillWanted()) {
    // The flag flipped off mid-flow: nothing mounted, so un-record the attempt (no strike).
    await save(decision.record);
    return null;
  }
  return attempt;
}

/**
 * Every record write goes through one in-order chain, so the last write issued
 * is the last persisted. A failed write is retried `retries` times in place
 * (inside its own turn, so a retry can never land after a later write).
 */
export function createWriteQueue(save: (r: WatchdogRecord) => Promise<boolean>) {
  let tail: Promise<unknown> = Promise.resolve();
  return (record: WatchdogRecord, retries = 0): Promise<boolean> => {
    const run = async (): Promise<boolean> => {
      for (let i = 0; i <= retries; i += 1) if (await save(record)) return true;
      return false;
    };
    const result = tail.then(run, run);
    tail = result;
    return result;
  };
}

/** Monotonic within a launch: ready never overwrites a recorded strike/fallback. */
export const markReady = (r: WatchdogRecord, now: number): WatchdogRecord =>
  r.state === 'attempting' ? { ...r, state: 'ready', fallbackCycles: 0, at: now } : r;

export function recordStrike(
  r: WatchdogRecord,
  reason: string,
  now: number,
): { record: WatchdogRecord; clearOverride: boolean } {
  const strikes = r.strikes + 1;
  const fallback = strikes >= STRIKES_TO_FALLBACK;
  return {
    clearOverride: fallback,
    record: escalate({
      ...r,
      state: fallback ? 'fallback' : 'failed',
      strikes,
      lastReason: truncateReason(reason),
      fallbackLaunchesRemaining: fallback ? FALLBACK_LAUNCHES : r.fallbackLaunchesRemaining,
      backgrounded: false,
      abandonedStreak: 0,
      at: now,
    }),
  };
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
    protocolFatal() {
      strike('protocol-fatal');
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
