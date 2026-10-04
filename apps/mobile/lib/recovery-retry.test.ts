import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rec: null as unknown, saved: [] as unknown[], saveOk: true, reload: vi.fn(async () => {}), persist: vi.fn(async () => {}) }));
vi.mock('expo-updates', () => ({ reloadAsync: () => h.reload() }));
vi.mock('./recovery-pending-taps', () => ({ heldTaps: { persist: () => h.persist() } }));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '7:u1',
  loadWatchdogRecord: async () => h.rec,
  saveWatchdogRecord: async (r: unknown) => (h.saved.push(r), h.saveOk),
}));

import { retryDomAttempt, retryRecord } from './recovery-retry';
import { decideMount, freshRecord, recordStrike, readRecord, type WatchdogRecord } from './watchdog';

beforeEach(() => {
  h.saved = [];
  h.saveOk = true;
  h.reload.mockReset().mockResolvedValue(undefined);
  h.persist.mockClear();
});

describe('retryRecord', () => {
  it('clears strikes, keeps in-bound fallbackCycles', () => {
    const r = retryRecord({ ...freshRecord('k', 1), state: 'fallback', strikes: 2, fallbackCycles: 1, fallbackLaunchesRemaining: 1 }, 'k', 5);
    expect(r).toMatchObject({ state: 'idle', strikes: 0, fallbackCycles: 1, fallbackLaunchesRemaining: 0, at: 5 });
  });

  it('retry from a quarantined record (cycles 2) -> two strikes -> quarantined again, parseable, not reset', () => {
    const quarantined: WatchdogRecord = { ...freshRecord('k', 1), state: 'quarantined', fallbackCycles: 2 };
    let r = retryRecord(quarantined, 'k', 2);
    expect(r.fallbackCycles).toBe(1);
    r = recordStrike(r, 'boom', 3).record;
    r = recordStrike(r, 'boom', 4).record;
    expect(r.state).toBe('quarantined');
    expect(r.fallbackCycles).toBe(2);
    const stored = readRecord(JSON.stringify(r));
    expect(stored).not.toBe('corrupt');
    expect(decideMount(stored, 'k', 5).fallbackActive).toBe(true);
  });
});

describe('retryDomAttempt', () => {
  it('saves then reloads once', async () => {
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.saved).toHaveLength(1);
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(h.persist).toHaveBeenCalledTimes(1);
  });
  it('a failed write does not reload', async () => {
    h.saveOk = false;
    expect(await retryDomAttempt()).toBe('save-failed');
    expect(h.reload).not.toHaveBeenCalled();
  });
  it('a rejected reload reports reload-failed', async () => {
    h.reload.mockRejectedValue(new Error('x'));
    expect(await retryDomAttempt()).toBe('reload-failed');
  });
});
