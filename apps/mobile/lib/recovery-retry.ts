// Recovery screen Retry: one human tap = one fresh DOM attempt. Writes an `idle` watchdog
// record (strikes cleared, fallbackCycles kept but never above the quarantine bound minus one,
// so the next fallback cycle still escalates to quarantine instead of overflowing the strict
// parse and resetting) and reloads the JS bundle once. Never called automatically.
import * as Updates from 'expo-updates';
import { heldTaps } from './recovery-pending-taps';
import { freshRecord, type WatchdogRecord } from './watchdog';
import { QUARANTINE_AFTER_FALLBACK_CYCLES } from './watchdog-policy';
import { currentBuildKey, loadWatchdogRecord, saveWatchdogRecord } from './watchdog-store';

export type RetryOutcome = 'reload-requested' | 'save-failed' | 'reload-failed';

export function retryRecord(prev: WatchdogRecord | null | 'corrupt', buildKey: string, now: number): WatchdogRecord {
  const base = prev && prev !== 'corrupt' && prev.buildKey === buildKey ? prev : freshRecord(buildKey, now);
  return {
    ...base,
    state: 'idle',
    strikes: 0,
    fallbackCycles: Math.min(base.fallbackCycles, QUARANTINE_AFTER_FALLBACK_CYCLES - 1),
    fallbackLaunchesRemaining: 0,
    backgrounded: false,
    abandonedStreak: 0,
    at: now,
  };
}

export async function retryDomAttempt(now: () => number = Date.now): Promise<RetryOutcome> {
  try {
    const record = retryRecord(await loadWatchdogRecord(), currentBuildKey(), now());
    if (!(await saveWatchdogRecord(record))) return 'save-failed';
  } catch {
    return 'save-failed';
  }
  await heldTaps.persist();
  try {
    await Updates.reloadAsync();
    return 'reload-requested';
  } catch {
    return 'reload-failed';
  }
}
