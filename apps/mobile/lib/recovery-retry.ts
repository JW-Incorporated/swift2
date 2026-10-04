// Recovery screen Retry: one human tap = one fresh DOM attempt. Writes an `idle` watchdog
// record (strikes cleared, fallbackCycles kept so quarantine accounting survives) and reloads
// the JS bundle once. Never called automatically, so there is no unattended reload loop.
import * as Updates from 'expo-updates';
import { freshRecord, type WatchdogRecord } from './watchdog';
import { currentBuildKey, loadWatchdogRecord, saveWatchdogRecord } from './watchdog-store';

export function retryRecord(prev: WatchdogRecord | null | 'corrupt', buildKey: string, now: number): WatchdogRecord {
  const base = prev && prev !== 'corrupt' && prev.buildKey === buildKey ? prev : freshRecord(buildKey, now);
  return { ...base, state: 'idle', strikes: 0, fallbackLaunchesRemaining: 0, backgrounded: false, abandonedStreak: 0, at: now };
}

export async function retryDomAttempt(now: () => number = Date.now): Promise<void> {
  const record = retryRecord(await loadWatchdogRecord(), currentBuildKey(), now());
  await saveWatchdogRecord(record);
  await Updates.reloadAsync();
}
