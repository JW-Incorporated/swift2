// One UI WP0.4b: the watchdog record's single SecureStore JSON key. Local only
// (no network). A new nativeBuildVersion or OTA update id changes `buildKey`,
// which resets the record (see decideMount).
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { parseRecord, type WatchdogRecord } from './watchdog';

export const WATCHDOG_KEY = 'longlive_watchdog_v1';

export function currentBuildKey(): string {
  return `${Application.nativeBuildVersion ?? '?'}:${Updates.updateId ?? 'embedded'}`;
}

export async function loadWatchdogRecord(): Promise<WatchdogRecord | null> {
  try {
    return parseRecord(await SecureStore.getItemAsync(WATCHDOG_KEY));
  } catch {
    return null;
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

/** Re-enabling the override in Diagnostics starts the watchdog from scratch. */
export async function clearWatchdogRecord(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(WATCHDOG_KEY);
  } catch {
    // nothing to clear
  }
}
