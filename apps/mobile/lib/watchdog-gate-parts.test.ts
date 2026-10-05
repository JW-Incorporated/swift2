import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) },
}));

import { reconcileLateRecord } from './watchdog-gate-parts';
import { decideMount, freshRecord, type WatchdogRecord } from './watchdog';

const KEY = '1:embedded';

describe('reconcileLateRecord', () => {
  it('folds a held in-launch strike as a failed launch: strikes preserved, no fallback owed, reason still reported', async () => {
    const prev: WatchdogRecord = { ...freshRecord(KEY, 1), state: 'idle', strikes: 1 };
    const d = decideMount(prev, KEY, 2);
    const late = { current: { held: true, ready: false, strike: 'dom-error: x' as string | null } };
    const recordRef = { current: null as WatchdogRecord | null };
    const onFolded = vi.fn();
    let persisted: WatchdogRecord | null = null;
    const write = async (source: WatchdogRecord | ((c: WatchdogRecord | null) => WatchdogRecord)) => {
      persisted = typeof source === 'function' ? source(null) : source;
      return true;
    };
    reconcileLateRecord(prev, d, late, recordRef, write, onFolded);
    await Promise.resolve();
    expect(persisted).toMatchObject({ state: 'failed', strikes: 1, fallbackLaunchesRemaining: 0, lastReason: 'dom-error: x' });
    expect(recordRef.current).toBe(persisted);
    expect(onFolded).toHaveBeenCalledWith('dom-error: x', persisted);
  });
});
