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
// terminate/render-gone before ready or a repeat within RELOAD_WINDOW_MS of a
// post-ready reload) is a strike: strike 1 mounts native for this launch;
// strike 2 (consecutive) makes the next launch native too.

import { QUARANTINE_AFTER_FALLBACK_CYCLES, escalate, quarantinedDecision } from './watchdog-policy';
import { truncateReason } from './watchdog-monitor';

export { READY_TIMEOUT_MS, MAX_REASON_CHARS, RELOAD_WINDOW_MS, truncateReason, createAttemptMonitor } from './watchdog-monitor';
export type { AttemptMonitor, AttemptMonitorOptions, CrashOutcome, Scheduler } from './watchdog-monitor';

export const STRIKES_TO_FALLBACK = 2;
export const FALLBACK_LAUNCHES = 1;
export const ABANDONED_TO_STRIKE = 2;

export type WatchdogState = 'idle' | 'attempting' | 'ready' | 'failed' | 'fallback' | 'quarantined';

export interface WatchdogRecord {
  v: 1;
  /** WP2.14: fallback cycles (2 strikes each) within this buildKey; QUARANTINE_AFTER_FALLBACK_CYCLES of them quarantines the build. */
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


const STATES: WatchdogState[] = ['idle', 'attempting', 'ready', 'failed', 'fallback', 'quarantined'];

export function freshRecord(buildKey: string, now: number): WatchdogRecord {
  return { v: 1, fallbackCycles: 0, buildKey, state: 'idle', strikes: 0, lastReason: '', fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: now };
}

const inRange = (v: unknown, max: number): v is number => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= max;

/**
 * Strict parse of the persisted JSON. Anything malformed or out of range (a
 * counter that is negative, huge or not an integer, an unknown state, a
 * non-string buildKey) is null; use readRecord to tell that from "no record".
 */
export function parseRecord(raw: string | null): WatchdogRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Record<string, unknown>;
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    if (r.v !== 1 || typeof r.buildKey !== 'string' || !STATES.includes(r.state as WatchdogState)) return null;
    if (!inRange(r.strikes, STRIKES_TO_FALLBACK) || !inRange(r.fallbackLaunchesRemaining, FALLBACK_LAUNCHES)) return null;
    if (typeof r.at !== 'number' || !Number.isFinite(r.at)) return null;
    if (r.fallbackCycles !== undefined && !inRange(r.fallbackCycles, QUARANTINE_AFTER_FALLBACK_CYCLES)) return null;
    if (r.abandonedStreak !== undefined && !inRange(r.abandonedStreak, ABANDONED_TO_STRIKE)) return null;
    if (r.backgrounded !== undefined && typeof r.backgrounded !== 'boolean') return null;
    if (r.lastReason !== undefined && typeof r.lastReason !== 'string') return null;
    return {
      v: 1,
      buildKey: r.buildKey,
      state: r.state as WatchdogState,
      strikes: r.strikes,
      fallbackLaunchesRemaining: r.fallbackLaunchesRemaining,
      at: r.at,
      fallbackCycles: (r.fallbackCycles as number | undefined) ?? 0,
      backgrounded: (r.backgrounded as boolean | undefined) ?? false,
      abandonedStreak: (r.abandonedStreak as number | undefined) ?? 0,
      lastReason: truncateReason((r.lastReason as string | undefined) ?? ''),
    };
  } catch {
    return null;
  }
}

/** null = nothing stored (first launch); 'corrupt' = something stored that failed the strict parse. */
export function readRecord(raw: string | null): WatchdogRecord | null | 'corrupt' {
  if (raw === null) return null;
  return parseRecord(raw) ?? 'corrupt';
}

export interface MountDecision {
  /** True while a fallback launch is owed: mount native whatever the flags say. */
  fallbackActive: boolean;
  /** The normalised record to persist for this launch. */
  record: WatchdogRecord;
}

/** Launch-time gate: folds the previous launch's outcome into the record. */
export function decideMount(
  record: WatchdogRecord | null | 'corrupt',
  buildKey: string,
  now: number,
): MountDecision {
  // A stored record we cannot trust is never a licence for the DOM host: native
  // this launch, record reset, the next launch starts clean.
  if (record === 'corrupt') {
    return { fallbackActive: true, record: freshRecord(buildKey, now) };
  }
  if (!record || record.buildKey !== buildKey) {
    return { fallbackActive: false, record: freshRecord(buildKey, now) };
  }
  if (record.state === 'quarantined') return quarantinedDecision(record, now);
  if (record.fallbackLaunchesRemaining > 0) {
    return {
      fallbackActive: true,
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
    return { fallbackActive: s.fellBack, record: s.record };
  }
  let abandonedStreak = record.abandonedStreak;
  if (record.state === 'attempting' && record.backgrounded) {
    abandonedStreak += 1;
    if (abandonedStreak >= ABANDONED_TO_STRIKE) {
      const s = recordStrike(record, 'abandoned-repeated', now);
      return { fallbackActive: s.fellBack, record: s.record };
    }
  }
  // 'ready' = the last launch ran clean: the streak is over.
  if (record.state === 'ready') abandonedStreak = 0;
  const strikes = record.state === 'ready' ? 0 : record.strikes;
  return {
    fallbackActive: false,
    record: { ...record, state: 'idle', strikes, backgrounded: false, abandonedStreak, at: now },
  };
}

/** The mount predicate: shared UI wanted by flag, and no fallback owed. */
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
): Promise<WatchdogRecord | null> {
  const attempt = beginAttempt(decision.record, now);
  if (!(await save(attempt))) return null;
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

/** A post-ready webview reload is an unresolved attempt again: if the process dies mid-reload the next launch counts it as abandoned/failed, not clean. */
export const markReloading = (r: WatchdogRecord, now: number): WatchdogRecord =>
  r.state === 'ready' ? { ...r, state: 'attempting', backgrounded: false, at: now } : r;

/** Monotonic within a launch: ready never overwrites a recorded strike/fallback. */
export const markReady = (r: WatchdogRecord, now: number): WatchdogRecord =>
  r.state === 'attempting' ? { ...r, state: 'ready', fallbackCycles: 0, at: now } : r;

export function recordStrike(
  r: WatchdogRecord,
  reason: string,
  now: number,
): { record: WatchdogRecord; fellBack: boolean } {
  const strikes = r.strikes + 1;
  const fallback = strikes >= STRIKES_TO_FALLBACK;
  return {
    fellBack: fallback,
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
