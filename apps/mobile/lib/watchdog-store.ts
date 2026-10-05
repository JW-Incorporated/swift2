// One UI WP0.4b: the watchdog record's single SecureStore JSON key. Local only
// (no network). A new nativeBuildVersion or OTA update id changes `buildKey`,
// which resets the record (see decideMount).
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { readRecord, type WatchdogRecord } from './watchdog';

export const WATCHDOG_KEY = 'longlive_watchdog_v1';

export function currentBuildKey(): string {
  return `${Application.nativeBuildVersion ?? '?'}:${Updates.updateId ?? 'embedded'}`;
}

/** null = nothing stored; 'corrupt' = unreadable or failed the strict parse (the caller mounts native and resets). */
export async function loadWatchdogRecord(): Promise<WatchdogRecord | null | 'corrupt'> {
  try {
    return readRecord(await SecureStore.getItemAsync(WATCHDOG_KEY));
  } catch {
    return 'corrupt';
  }
}

/** True when the write landed; callers about to mount the DOM host fail closed on false. */
export async function saveWatchdogRecord(record: WatchdogRecord): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(WATCHDOG_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** WP2.14: pending category-only watchdog reports (watchdog-telemetry.ts); small, one key. */
export const WATCHDOG_REPORTS_KEY = 'longlive_watchdog_reports_v1';

export const loadReportsRaw = (): Promise<string | null> => SecureStore.getItemAsync(WATCHDOG_REPORTS_KEY);
export const saveReportsRaw = (raw: string): Promise<void> => SecureStore.setItemAsync(WATCHDOG_REPORTS_KEY, raw);

/** Wipes the stored record so the watchdog starts from scratch. */
export async function clearWatchdogRecord(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(WATCHDOG_KEY);
  } catch {
    // nothing to clear
  }
}
