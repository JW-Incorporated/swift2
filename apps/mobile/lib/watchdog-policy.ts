// One UI WP2.14: default-on rules for the watchdog. Pure (no RN/Expo/network
// imports) so every path is unit-testable with a fake clock. watchdog.ts keeps
// the record/monitor mechanics; this file holds the policy layered on top.
import type { MountDecision, Scheduler, WatchdogRecord } from './watchdog';

/**
 * Fallback CYCLES (each = 2 strikes) within one buildKey before this build is
 * quarantined from the DOM path: worst case 4 failed launches per build
 * (Fable's ruling: a false quarantine persists until the next OTA, which costs
 * more than 4 bad launches once).
 */
export const QUARANTINE_AFTER_FALLBACK_CYCLES = 2;
/** Longest the neutral pending screen may show before native mounts (fail open, never blank). */
export const PENDING_MAX_MS = 1500;

/**
 * Strike 2 owes a fallback launch. The QUARANTINE_AFTER_FALLBACK_CYCLES-th fallback in one
 * buildKey becomes `quarantined`: native until the buildKey changes or the
 * Diagnostics reset. A ready launch zeroes fallbackCycles (markReady).
 */
export function escalate(r: WatchdogRecord): WatchdogRecord {
  if (r.state !== 'fallback') return r;
  const fallbackCycles = r.fallbackCycles + 1;
  if (fallbackCycles < QUARANTINE_AFTER_FALLBACK_CYCLES) return { ...r, fallbackCycles };
  return { ...r, state: 'quarantined', fallbackCycles, fallbackLaunchesRemaining: 0 };
}

/**
 * The pending bound can fire before the launch decision resolves; native then
 * mounts with no attempt made. That must not spend an owed fallback launch, so
 * the persisted record keeps the previous remaining count.
 */
export function refundExpiredFallback(
  prev: WatchdogRecord | null | 'corrupt',
  decided: WatchdogRecord,
  expired: boolean,
): WatchdogRecord {
  if (!expired || !prev || prev === 'corrupt' || prev.buildKey !== decided.buildKey) return decided;
  if (decided.fallbackLaunchesRemaining >= prev.fallbackLaunchesRemaining) return decided;
  return { ...decided, state: prev.state, strikes: prev.strikes, fallbackLaunchesRemaining: prev.fallbackLaunchesRemaining };
}

/** A quarantined record keeps the DOM path off on every launch; nothing is consumed. */
export function quarantinedDecision(record: WatchdogRecord, now: number): MountDecision {
  return { fallbackActive: true, record: { ...record, backgrounded: false, at: now } };
}

export type WantSource = 'quarantine' | 'cache' | 'default';

export interface WantInputs {
  quarantined: boolean;
  /** Last-good cached remote `sharedUi`, or null when none was cached. */
  cachedSharedUi: boolean | null;
  /** Compiled DEFAULT_ROUTE_FLAGS.sharedUi. */
  defaultSharedUi: boolean;
}

/** Precedence: quarantine > cache > default. The network result never enters here. */
export function resolveWantsDom(i: WantInputs): { wantsDom: boolean; source: WantSource } {
  if (i.quarantined) return { wantsDom: false, source: 'quarantine' };
  if (i.cachedSharedUi !== null) return { wantsDom: i.cachedSharedUi, source: 'cache' };
  return { wantsDom: i.defaultSharedUi, source: 'default' };
}

/** Why the current mount is native (never free text; shown in Diagnostics). */
export type NativeReason = 'pending-expired' | 'quarantine' | 'watchdog-fallback' | 'flag-off' | 'attempt-failed' | 'dom-strike';

/** Local cause of a native mount once the launch decision resolved without an attempt. */
export function nativeReasonFor(want: { wantsDom: boolean; source: WantSource }, fallbackActive: boolean): NativeReason {
  if (want.source === 'quarantine') return 'quarantine';
  if (!want.wantsDom) return 'flag-off';
  return fallbackActive ? 'watchdog-fallback' : 'flag-off';
}

/** Diagnostics line: which UI is mounted and why. */
export function mountLine(mount: string, reason: string | null, source: string | null): string {
  if (mount === 'dom') return `Mount: shared UI (${source ?? 'unknown'})`;
  if (mount === 'native') return `Mount: native (${reason ?? 'unknown'})`;
  return `Mount: ${mount}`;
}

/** Bound on the pending screen: after `ms` the caller mounts native. Returns the cancel function. */
export function armPendingBound(scheduler: Scheduler, onExpire: () => void, ms: number = PENDING_MAX_MS): () => void {
  const handle = scheduler.setTimeout(onExpire, ms);
  return () => scheduler.clearTimeout(handle);
}

/** Reason categories only (never free text): what telemetry and Diagnostics may carry. */
export const WATCHDOG_REASONS = [
  'ready-timeout',
  'dom-error',
  'webview-terminated',
  'webview-render-gone',
  'abandoned',
  'protocol',
] as const;

export type WatchdogReason = (typeof WATCHDOG_REASONS)[number];

export function reasonCategory(reason: string): WatchdogReason {
  if (reason.startsWith('ready-timeout')) return 'ready-timeout';
  if (reason.startsWith('webview-terminated')) return 'webview-terminated';
  if (reason.startsWith('webview-render-gone')) return 'webview-render-gone';
  if (reason.startsWith('abandoned')) return 'abandoned';
  if (reason.startsWith('protocol')) return 'protocol';
  return 'dom-error';
}

export function watchdogLines(r: WatchdogRecord | null): string[] {
  if (!r) return ['Watchdog: no record'];
  return [
    `Watchdog state: ${r.state}`,
    `Quarantined: ${r.state === 'quarantined' ? 'yes' : 'no'}`,
    `Strikes: ${r.strikes}`,
    `Fallback cycles: ${r.fallbackCycles} of ${QUARANTINE_AFTER_FALLBACK_CYCLES}`,
    `Last reason: ${r.lastReason || 'none'}`,
    `Fallback launches remaining: ${r.fallbackLaunchesRemaining}`,
  ];
}
