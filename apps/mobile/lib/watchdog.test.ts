import { describe, expect, it, vi } from 'vitest';
import {
  beginAttempt,
  createWriteQueue,
  decideMount,
  freshRecord,
  markReady,
  markReloading,
  parseDomFailureMode,
  parseRecord,
  recordStrike,
  shouldMountDom,
  startAttempt,
  truncateReason,
  type WatchdogRecord,
} from './watchdog';

const KEY = '42:embedded';


// One simulated launch: decide, begin attempt, then apply an outcome.
function launch(
  rec: WatchdogRecord | null,
  outcome: 'ready' | 'fail' | 'abandon' | 'background',
  key = KEY,
) {
  const d = decideMount(rec, key, 1);
  if (d.fallbackActive) return { d, rec: d.record, clear: d.clearOverride };
  let r = beginAttempt(d.record, 2);
  if (outcome === 'background') r = { ...r, backgrounded: true };
  if (outcome === 'ready') r = markReady(r, 3);
  let clear = false;
  if (outcome === 'fail') {
    const s = recordStrike(r, 'boom', 3);
    r = s.record;
    clear = s.clearOverride;
  }
  return { d, rec: r, clear };
}

describe('record transitions', () => {
  it('a process kill mid-reload is a failed attempt next launch, not a clean one; the replacement ready clears it', () => {
    const ready = launch(null, 'ready').rec;
    const reloading = markReloading(ready, 5);
    expect(reloading.state).toBe('attempting');
    expect(reloading.backgrounded).toBe(false);
    const next = decideMount(reloading, KEY, 6);
    expect(next.record.strikes).toBe(1);
    expect(next.record.lastReason).toBe('abandoned-before-ready');
    expect(markReady(reloading, 7).state).toBe('ready');
    expect(markReloading(freshRecord(KEY, 1), 2).state).toBe('idle');
  });

  it('a kill while backgrounded mid-reload is merely abandoned', () => {
    const reloading = { ...markReloading(launch(null, 'ready').rec, 5), backgrounded: true };
    const next = decideMount(reloading, KEY, 6);
    expect(next.record.strikes).toBe(0);
    expect(next.record.abandonedStreak).toBe(1);
  });

  it('an attempt that died in the foreground before ready is a strike', () => {
    const l1 = launch(null, 'abandon');
    expect(l1.rec.state).toBe('attempting');
    const l2 = launch(l1.rec, 'abandon');
    expect(l2.d.record.strikes).toBe(1);
    expect(l2.d.record.lastReason).toBe('abandoned-before-ready');
    expect(l2.d.fallbackActive).toBe(false);
    expect(l2.d.clearOverride).toBe(false);
  });

  it('an attempt backgrounded before ready is abandoned, not a strike', () => {
    const l1 = launch(null, 'background');
    const l2 = launch(l1.rec, 'abandon');
    expect(l2.d.record.strikes).toBe(0);
    expect(l2.d.record.backgrounded).toBe(false);
    expect(l2.d.fallbackActive).toBe(false);
  });

  it('abandon streak 1 stays idle; streak 2 is a strike and resets the streak', () => {
    const l1 = launch(null, 'background');
    const l2 = launch(l1.rec, 'background');
    expect(l2.d.record.abandonedStreak).toBe(1);
    expect(l2.d.record.strikes).toBe(0);
    const l3 = launch(l2.rec, 'abandon');
    expect(l3.d.record.strikes).toBe(1);
    expect(l3.d.record.lastReason).toBe('abandoned-repeated');
    expect(l3.d.record.abandonedStreak).toBe(0);
    expect(l3.d.fallbackActive).toBe(false);
  });

  it('stale markers mount the DOM on at most 4 launches before the native fallback; ready resets the streak', () => {
    const rec = launch(null, 'background').rec; // DOM launch 1
    let l = launch(rec, 'background'); // DOM launch 2
    expect(l.d.fallbackActive).toBe(false);
    l = launch(l.rec, 'background'); // DOM launch 3 (decides strike 1)
    expect(l.d.record.strikes).toBe(1);
    expect(l.d.fallbackActive).toBe(false);
    l = launch(l.rec, 'background'); // DOM launch 4
    expect(l.d.fallbackActive).toBe(false);
    l = launch(l.rec, 'background'); // launch 5: strike 2 -> native
    expect(l.d.clearOverride).toBe(true);
    expect(l.d.fallbackActive).toBe(true);
    const ready = launch(launch(null, 'background').rec, 'ready');
    expect(ready.d.record.abandonedStreak).toBe(1);
    expect(launch(ready.rec, 'ready').d.record.abandonedStreak).toBe(0);
  });

  it('a strike resets the abandon streak', () => {
    const rec = { ...beginAttempt(freshRecord(KEY, 0), 1), abandonedStreak: 1 };
    expect(recordStrike(rec, 'x', 2).record.abandonedStreak).toBe(0);
  });

  it('two foreground kills before ready clear the override and owe a fallback launch', () => {
    const l1 = launch(null, 'abandon');
    const l2 = launch(l1.rec, 'abandon');
    const l3 = launch(l2.rec, 'abandon');
    expect(l3.d.clearOverride).toBe(true);
    expect(l3.d.fallbackActive).toBe(true);
    expect(l3.rec.fallbackLaunchesRemaining).toBe(1);
    const l4 = launch(l3.rec, 'ready');
    expect(l4.d.fallbackActive).toBe(true);
    expect(launch(l4.rec, 'ready').d.fallbackActive).toBe(false);
  });

  it('strike 1 keeps the override; strike 2 clears it and owes one fallback launch', () => {
    const l1 = launch(null, 'fail');
    expect(l1.clear).toBe(false);
    expect(l1.rec.strikes).toBe(1);
    const l2 = launch(l1.rec, 'fail');
    expect(l2.clear).toBe(true);
    expect(l2.rec.fallbackLaunchesRemaining).toBe(1);
  });

  it('a clean (ready) launch breaks the crash streak', () => {
    const l1 = launch(null, 'fail');
    const l2 = launch(l1.rec, 'ready');
    const l3 = launch(l2.rec, 'fail');
    expect(l3.rec.strikes).toBe(1);
    expect(l3.clear).toBe(false);
  });

  it('consecutive crash launches (ready then crash) still reach strike 2', () => {
    const l1 = launch(null, 'fail');
    expect(launch(l1.rec, 'fail').clear).toBe(true);
  });

  it('recovers after the fallback launch and may try the DOM again', () => {
    const l2 = launch(launch(null, 'fail').rec, 'fail');
    const l3 = launch(l2.rec, 'ready');
    expect(l3.d.fallbackActive).toBe(true);
    expect(shouldMountDom(true, l3.d)).toBe(false);
    const l4 = launch(l3.rec, 'ready');
    expect(l4.d.fallbackActive).toBe(false);
    expect(l4.d.record.strikes).toBe(0);
    expect(shouldMountDom(true, l4.d)).toBe(true);
    expect(shouldMountDom(false, l4.d)).toBe(false);
  });

  it('a new buildKey resets strikes and fallback', () => {
    const l2 = launch(launch(null, 'fail').rec, 'fail');
    const d = decideMount(l2.rec, '43:embedded', 9);
    expect(d.fallbackActive).toBe(false);
    expect(d.record).toEqual(freshRecord('43:embedded', 9));
  });

  it('truncates reasons to 120 chars', () => {
    expect(truncateReason('y'.repeat(500))).toHaveLength(120);
    expect(recordStrike(freshRecord(KEY, 0), 'z'.repeat(500), 1).record.lastReason).toHaveLength(120);
  });
});

function deferred() {
  let resolve!: (v: boolean) => void;
  const promise = new Promise<boolean>((res) => (resolve = res));
  return { promise, resolve };
}

describe('serialized record writes', () => {
  it('persists in issue order even when completions are delayed, so ready cannot erase a strike', async () => {
    const persisted: string[] = [];
    const gates = [deferred(), deferred()];
    let call = 0;
    const write = createWriteQueue(async (rec) => {
      const gate = gates[call];
      call += 1;
      const ok = await gate.promise;
      if (ok) persisted.push(rec.state);
      return ok;
    });
    const attempt = beginAttempt(freshRecord(KEY, 0), 1);
    const ready = markReady(attempt, 2);
    const struck = recordStrike(ready, 'webview-terminated', 3).record;
    const p1 = write(ready);
    const p2 = write(struck);
    await new Promise((r) => setTimeout(r, 0));
    expect(call).toBe(1);
    gates[0].resolve(true);
    await p1;
    gates[1].resolve(true);
    await p2;
    expect(persisted).toEqual(['ready', 'failed']);
  });

  it('markReady never overwrites a recorded strike', () => {
    const struck = recordStrike(beginAttempt(freshRecord(KEY, 0), 1), 'boom', 2).record;
    expect(markReady(struck, 3)).toBe(struck);
  });

  it('retries a failed ready write once, in its own turn, then reports failure', async () => {
    const save = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const write = createWriteQueue(save);
    const rec = markReady(beginAttempt(freshRecord(KEY, 0), 1), 2);
    expect(await write(rec, 1)).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    const failing = createWriteQueue(vi.fn().mockResolvedValue(false));
    expect(await failing(rec, 1)).toBe(false);
  });
});

describe('fail-closed attempt write', () => {
  it('returns null (mount native) when the write fails, the attempt when it lands', async () => {
    const d = decideMount(null, KEY, 1);
    const ok = vi.fn().mockResolvedValue(true);
    expect((await startAttempt(d, 2, ok))?.state).toBe('attempting');
    expect(ok).toHaveBeenCalledWith(expect.objectContaining({ state: 'attempting' }));
    expect(await startAttempt(d, 2, vi.fn().mockResolvedValue(false))).toBeNull();
  });
});

describe('persistence helpers', () => {
  it('round-trips a record and rejects garbage (override re-enable then sees no record)', () => {
    const r = recordStrike(freshRecord(KEY, 5), 'boom', 6).record;
    expect(parseRecord(JSON.stringify(r))).toEqual(r);
    expect(parseRecord(null)).toBeNull();
    expect(parseRecord('{nope')).toBeNull();
    const { abandonedStreak: _a, ...legacy } = r;
    expect(parseRecord(JSON.stringify(legacy))?.abandonedStreak).toBe(0);
    expect(parseRecord(JSON.stringify({ ...r, v: 2 }))).toBeNull();
    // After clearWatchdogRecord the stored value is null -> fresh launch, no fallback owed.
    expect(decideMount(parseRecord(null), KEY, 1).fallbackActive).toBe(false);
  });

  it('parses the force-failure tri-state, defaulting to off', () => {
    expect(parseDomFailureMode('throw')).toBe('throw');
    expect(parseDomFailureMode('hang')).toBe('hang');
    expect(parseDomFailureMode('true')).toBe('off');
    expect(parseDomFailureMode(null)).toBe('off');
  });
});
