// One UI WP2.14: default-on rules for the watchdog. Pure (no RN/Expo/network
// imports) so every path is unit-testable with a fake clock. watchdog.ts keeps
// the record/monitor mechanics; this file holds the policy layered on top.
import type { MountDecision, Scheduler, WatchdogRecord } from './watchdog';

/** Fallback cycles within one buildKey before this build is quarantined from the DOM path. */
export const QUARANTINE_AFTER = 2;
/** Longest the neutral pending screen may show before native mounts (fail open, never blank). */
export const PENDING_MAX_MS = 1500;

/**
 * Strike 2 owes a fallback launch. The QUARANTINE_AFTER-th fallback in one
 * buildKey becomes `quarantined`: native until the buildKey changes or the
 * Diagnostics reset. A ready launch zeroes fallbackCycles (markReady).
 */
export function escalate(r: WatchdogRecord): WatchdogRecord {
  if (r.state !== 'fallback') return r;
  const fallbackCycles = r.fallbackCycles + 1;
  if (fallbackCycles < QUARANTINE_AFTER) return { ...r, fallbackCycles };
  return { ...r, state: 'quarantined', fallbackCycles, fallbackLaunchesRemaining: 0 };
}

/** A quarantined record keeps the DOM path off on every launch; nothing is consumed. */
export function quarantinedDecision(record: WatchdogRecord, now: number): MountDecision {
  return { fallbackActive: true, clearOverride: false, record: { ...record, backgrounded: false, at: now } };
}

export type WantSource = 'quarantine' | 'override' | 'cache' | 'default';

export interface WantInputs {
  quarantined: boolean;
  /** C4 "Force shared UI (this device)". */
  override: boolean;
  /** Last-good cached remote `sharedUi`, or null when none was cached. */
  cachedSharedUi: boolean | null;
  /** Compiled DEFAULT_ROUTE_FLAGS.sharedUi. */
  defaultSharedUi: boolean;
}

/** Precedence: quarantine > override > cache > default. The network result never enters here. */
export function resolveWantsDom(i: WantInputs): { wantsDom: boolean; source: WantSource } {
  if (i.quarantined) return { wantsDom: false, source: 'quarantine' };
  if (i.override) return { wantsDom: true, source: 'override' };
  if (i.cachedSharedUi !== null) return { wantsDom: i.cachedSharedUi, source: 'cache' };
  return { wantsDom: i.defaultSharedUi, source: 'default' };
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
    `Fallback cycles: ${r.fallbackCycles} of ${QUARANTINE_AFTER}`,
    `Last reason: ${r.lastReason || 'none'}`,
    `Fallback launches remaining: ${r.fallbackLaunchesRemaining}`,
  ];
}
