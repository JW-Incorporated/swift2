import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rec: null as unknown, saved: [] as unknown[], saveOk: true, slowFirst: false, reload: vi.fn(async () => {}) }));
vi.mock('expo-updates', () => ({ reloadAsync: () => h.reload() }));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '7:u1',
  loadWatchdogRecord: async () => h.rec,
  saveWatchdogRecord: async (r: unknown) => {
    if (h.slowFirst) {
      h.slowFirst = false;
      await new Promise((res) => setTimeout(res, 20));
    }
    h.saved.push(r);
    return h.saveOk;
  },
}));

import { retryDomAttempt, retryRecord } from './recovery-retry';
import { currentWatchdogWriter } from './watchdog-writer';
import { decideMount, freshRecord, recordStrike, readRecord, type WatchdogRecord } from './watchdog';

beforeEach(() => {
  h.saved = [];
  h.saveOk = true;
  h.reload.mockReset().mockResolvedValue(undefined);
});

describe('retryRecord', () => {
  it('keeps in-bound strikes and fallbackCycles, clamping both below their bounds', () => {
    const r = retryRecord({ ...freshRecord('k', 1), state: 'fallback', strikes: 2, fallbackCycles: 1, fallbackLaunchesRemaining: 1 }, 'k', 5);
    expect(r).toMatchObject({ state: 'idle', strikes: 1, fallbackCycles: 1, fallbackLaunchesRemaining: 0, at: 5 });
  });

  it('a realistic Retry loop from fresh reaches quarantine within 3 Retry taps and every stored record parses', () => {
    let r: WatchdogRecord | null = null;
    for (let tap = 1; tap <= 3; tap++) {
      r = recordStrike(retryRecord(r, 'k', tap), 'boom', tap).record;
      expect(readRecord(JSON.stringify(r))).not.toBe('corrupt');
    }
    expect(r?.state).toBe('quarantined');
    expect(r?.fallbackCycles).toBe(2);
  });

  it('from quarantined, Retry + ONE strike -> quarantined again, parseable, not reset', () => {
    const quarantined: WatchdogRecord = { ...freshRecord('k', 1), state: 'quarantined', strikes: 2, fallbackCycles: 2 };
    const retried = retryRecord(quarantined, 'k', 2);
    expect(retried).toMatchObject({ state: 'idle', strikes: 1, fallbackCycles: 1 });
    const r = recordStrike(retried, 'boom', 3).record;
    expect(r.state).toBe('quarantined');
    expect(r.fallbackCycles).toBe(2);
    const stored = readRecord(JSON.stringify(r));
    expect(stored).not.toBe('corrupt');
    expect(decideMount(stored, 'k', 4).fallbackActive).toBe(true);
  });
});

describe('retryDomAttempt', () => {
  it('saves then reloads once', async () => {
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.saved).toHaveLength(1);
    expect(h.reload).toHaveBeenCalledTimes(1);
  });
  it('Retry writes AFTER a pending strike write and reloads only once the queue has settled', async () => {
    h.slowFirst = true;
    const strike = { ...freshRecord('7:u1', 1), state: 'fallback' as const, strikes: 2 };
    void currentWatchdogWriter().write(strike);
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.saved).toHaveLength(2);
    expect(h.saved[0]).toBe(strike);
    expect(h.saved[1]).toMatchObject({ state: 'idle' });
    expect(h.reload).toHaveBeenCalledTimes(1);
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
