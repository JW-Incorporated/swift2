import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rec: null as unknown, saved: [] as unknown[], saveOk: true, slowFirst: false, reload: vi.fn(async () => {}), enabled: false, check: vi.fn(), fetch: vi.fn(), calls: [] as string[] }));
vi.mock('expo-updates', () => ({
  get isEnabled() {
    return h.enabled;
  },
  checkForUpdateAsync: () => h.check(),
  fetchUpdateAsync: () => h.fetch(),
  reloadAsync: () => h.reload(),
}));
vi.mock('./watchdog-store', () => ({
  currentBuildKey: () => '7:u1',
  loadWatchdogRecord: async () => h.rec,
  saveWatchdogRecord: async (r: unknown) => {
    if (h.slowFirst) {
      h.slowFirst = false;
      await new Promise((res) => setTimeout(res, 20));
    }
    h.calls.push('write');
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
  h.enabled = false;
  h.calls = [];
  h.check.mockReset().mockImplementation(async () => (h.calls.push('check'), { isAvailable: true }));
  h.fetch.mockReset().mockImplementation(async () => void h.calls.push('fetch'));
  h.reload.mockImplementation(async () => void h.calls.push('reload'));
});

afterEach(() => {
  vi.useRealTimers();
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

  it('rejected reload leaves the persisted record idle (not a dead end)', async () => {
    h.reload.mockRejectedValue(new Error('x'));
    expect(await retryDomAttempt()).toBe('reload-failed');
    expect(h.saved.at(-1)).toMatchObject({ state: 'idle' });
  });
});

describe('retryDomAttempt OTA', () => {
  beforeEach(() => {
    h.enabled = true;
    vi.useFakeTimers();
  });

  it('enabled + available: check, fetch, then reload, reporting progress', async () => {
    const phases: string[] = [];
    expect(await retryDomAttempt(Date.now, (p) => phases.push(p))).toBe('reload-requested');
    expect(h.calls).toEqual(['write', 'check', 'fetch', 'reload']);
    expect(phases).toEqual(['checking', 'downloading']);
  });

  it('no update available: check then reload, no fetch', async () => {
    h.check.mockResolvedValue({ isAvailable: false });
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it('check throws: reload anyway', async () => {
    h.check.mockRejectedValue(new Error('net'));
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it('fetch throws: reload anyway', async () => {
    h.fetch.mockRejectedValue(new Error('net'));
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it('check never resolves: reload at 8 s', async () => {
    h.check.mockReturnValue(new Promise(() => {}));
    const p = retryDomAttempt();
    await vi.advanceTimersByTimeAsync(7900);
    expect(h.reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(await p).toBe('reload-requested');
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('fetch never resolves: reload 30 s after fetch starts (38 s worst case)', async () => {
    h.check.mockImplementation(() => new Promise((r) => setTimeout(() => r({ isAvailable: true }), 8000 - 1)));
    h.fetch.mockReturnValue(new Promise(() => {}));
    const p = retryDomAttempt();
    await vi.advanceTimersByTimeAsync(37900 - 1);
    expect(h.reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(await p).toBe('reload-requested');
  });

  it('isEnabled false: no check, straight reload', async () => {
    h.enabled = false;
    expect(await retryDomAttempt()).toBe('reload-requested');
    expect(h.check).not.toHaveBeenCalled();
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it('reloadAsync throws after OTA: reload-failed and the record is idle', async () => {
    h.reload.mockRejectedValue(new Error('x'));
    expect(await retryDomAttempt()).toBe('reload-failed');
    expect(h.saved.at(-1)).toMatchObject({ state: 'idle' });
  });
});
