// Recovery screen Retry: one human tap = one fresh DOM attempt. Writes an `idle` watchdog
// record (strikes and fallbackCycles kept but never above their bound minus one,
// so the next fallback cycle still escalates to quarantine instead of overflowing the strict
// parse and resetting) and reloads the JS bundle once. Never called automatically.
import * as Updates from 'expo-updates';
import { STRIKES_TO_FALLBACK, freshRecord, type WatchdogRecord } from './watchdog';
import { QUARANTINE_AFTER_FALLBACK_CYCLES } from './watchdog-policy';
import { currentBuildKey, loadWatchdogRecord } from './watchdog-store';
import { currentWatchdogWriter } from './watchdog-writer';
import { persistRetainedLink } from './retained-link';

export type RetryOutcome = 'reload-requested' | 'save-failed' | 'reload-failed';

export function retryRecord(prev: WatchdogRecord | null | 'corrupt', buildKey: string, now: number): WatchdogRecord {
  const base = prev && prev !== 'corrupt' && prev.buildKey === buildKey ? prev : freshRecord(buildKey, now);
  return {
    ...base,
    state: 'idle',
    strikes: Math.min(base.strikes, STRIKES_TO_FALLBACK - 1),
    fallbackCycles: Math.min(base.fallbackCycles, QUARANTINE_AFTER_FALLBACK_CYCLES - 1),
    fallbackLaunchesRemaining: 0,
    backgrounded: false,
    abandonedStreak: 0,
    at: now,
  };
}

/** Ahead of a deliberate full reload from a healthy mounted host: persist the record idle, exactly as Retry does. False = do not reload (record not ready, or the write failed). The monitor is never armed. */
export async function prepareIdleReload(now: () => number = Date.now): Promise<boolean> {
  try {
    const writer = currentWatchdogWriter();
    await writer.settled();
    const prev = await loadWatchdogRecord();
    if (!prev || prev === 'corrupt' || prev.state !== 'ready') return false;
    if (!(await writer.write(retryRecord(prev, currentBuildKey(), now()), 1))) return false;
    await writer.settled();
    return true;
  } catch {
    return false;
  }
}

export const OTA_CHECK_TIMEOUT_MS = 8000;
export const OTA_FETCH_TIMEOUT_MS = 30000;

export type RetryPhase = 'checking' | 'downloading';

function raceTimeout<T>(work: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

// Best effort: a pending OTA may be the very fix for the failure that brought the user here.
// Any throw or timeout falls through to the reload.
async function fetchPendingUpdate(onPhase?: (phase: RetryPhase) => void): Promise<void> {
  try {
    if (!Updates.isEnabled) return;
    onPhase?.('checking');
    const check = await raceTimeout(Updates.checkForUpdateAsync(), OTA_CHECK_TIMEOUT_MS);
    if (!check?.isAvailable) return;
    onPhase?.('downloading');
    await raceTimeout(Updates.fetchUpdateAsync(), OTA_FETCH_TIMEOUT_MS);
  } catch {
    // proceed to reload
  }
}

export async function retryDomAttempt(now: () => number = Date.now, onPhase?: (phase: RetryPhase) => void): Promise<RetryOutcome> {
  try {
    const writer = currentWatchdogWriter();
    await writer.settled();
    const record = retryRecord(await loadWatchdogRecord(), currentBuildKey(), now());
    if (!(await writer.write(record, 1))) return 'save-failed';
    await writer.settled();
  } catch {
    return 'save-failed';
  }
  await fetchPendingUpdate(onPhase);
  await persistRetainedLink();
  try {
    await Updates.reloadAsync();
    return 'reload-requested';
  } catch {
    return 'reload-failed';
  }
}
