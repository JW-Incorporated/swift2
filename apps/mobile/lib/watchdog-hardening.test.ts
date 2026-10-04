import { describe, expect, it, vi } from 'vitest';
import {
  READY_TIMEOUT_MS,
  createAttemptMonitor,
  decideMount,
  freshRecord,
  parseRecord,
  readRecord,
  type WatchdogRecord,
} from './watchdog';
import { QUARANTINE_AFTER_FALLBACK_CYCLES, refundExpiredFallback } from './watchdog-policy';
import { runDrill } from './watchdog-drill';

const KEY = '42:embedded';

describe('backward wall clock', () => {
  function clock() {
    let wall = 1_000_000;
    let timerAt = 0;
    let fn: (() => void) | null = null;
    const onStrike = vi.fn();
    const m = createAttemptMonitor({
      now: () => wall,
      active: true,
      onReady: vi.fn(),
      onStrike,
      scheduler: {
        setTimeout: (f, ms) => {
          fn = f;
          timerAt = ms;
          return 1;
        },
        clearTimeout: () => {
          fn = null;
        },
      },
    });
    return { m, onStrike, setWall: (w: number) => (wall = w), armedMs: () => (fn ? timerAt : null) };
  }

  it('clock stepping back 2 h while backgrounded never lengthens the timeout past READY_TIMEOUT_MS', () => {
    const c = clock();
    c.setWall(1_000_000 + 4_000);
    c.m.setActive(false);
    c.setWall(1_000_000 - 2 * 3_600_000);
    c.m.setActive(true);
    const armed = c.armedMs();
    expect(armed).not.toBeNull();
    expect(armed as number).toBeLessThanOrEqual(READY_TIMEOUT_MS);
    expect(armed as number).toBeGreaterThan(0);
  });

  it('a negative delta counts as zero elapsed (remaining stays at the original timeout)', () => {
    const c = clock();
    c.setWall(1_000_000 - 3_600_000);
    c.m.setActive(false);
    c.m.setActive(true);
    expect(c.armedMs()).toBe(READY_TIMEOUT_MS);
  });

  it('a NaN clock reading cannot grow or break the remainder', () => {
    const c = clock();
    c.setWall(Number.NaN);
    c.m.setActive(false);
    c.m.setActive(true);
    expect(c.armedMs()).toBe(READY_TIMEOUT_MS);
  });
});

describe('corrupt record', () => {
  const good = (): WatchdogRecord => ({ ...freshRecord(KEY, 1), state: 'failed', strikes: 1 });
  const withField = (k: string, v: unknown) => JSON.stringify({ ...good(), [k]: v });

  it.each([
    ['strikes', -2147483648],
    ['strikes', 2147483647],
    ['strikes', 3],
    ['strikes', 1.5],
    ['strikes', '1'],
    ['strikes', null],
    ['fallbackLaunchesRemaining', -1],
    ['fallbackLaunchesRemaining', 1e21],
    ['fallbackLaunchesRemaining', 2],
    ['fallbackCycles', -1],
    // eslint-disable-next-line no-loss-of-precision -- deliberate: beyond MAX_SAFE_INTEGER must be rejected
    ['fallbackCycles', 9007199254740993],
    ['fallbackCycles', QUARANTINE_AFTER_FALLBACK_CYCLES + 1],
    ['abandonedStreak', 99],
    ['state', 'bogus'],
    ['state', 7],
    ['buildKey', 42],
    ['buildKey', null],
    ['backgrounded', 'yes'],
    ['lastReason', { a: 1 }],
    ['at', 'now'],
    ['v', 2],
  ])('%s = %j is rejected by the parse', (k, v) => {
    expect(parseRecord(withField(k, v))).toBeNull();
    expect(readRecord(withField(k, v))).toBe('corrupt');
  });

  it('non-object JSON and garbage are corrupt, only absent storage is "no record"', () => {
    for (const raw of ['[]', '7', '"x"', 'null', '{nope', '']) expect(readRecord(raw)).toBe('corrupt');
    expect(readRecord(null)).toBeNull();
  });

  it('a valid record round-trips', () => {
    const r = good();
    expect(readRecord(JSON.stringify(r))).toEqual(r);
  });

  it('safe default: native this launch, record reset, the next launch is clean', () => {
    const d = decideMount('corrupt', KEY, 9);
    expect(d.fallbackActive).toBe(true);
    expect(d.record).toEqual(freshRecord(KEY, 9));
    expect(decideMount(d.record, KEY, 10).fallbackActive).toBe(false);
  });
});

describe('quarantine bound', () => {
  it('worst case is exactly 4 failed launches per build (2 fallback cycles x 2 strikes), then native with no attempt', () => {
    expect(QUARANTINE_AFTER_FALLBACK_CYCLES).toBe(2);
    const rows = runDrill('hang', { launches: 12 });
    expect(rows.filter((r) => r.outcome === 'strike')).toHaveLength(4);
    const firstQuarantined = rows.findIndex((r) => r.state === 'quarantined');
    expect(rows.slice(firstQuarantined + 1).every((r) => r.skipped && r.mount === 'native')).toBe(true);
  });
});

describe('expired pending bound', () => {
  const owed: WatchdogRecord = { ...freshRecord(KEY, 1), state: 'fallback', strikes: 2, fallbackLaunchesRemaining: 1 };

  it('does not spend an owed fallback launch when the bound fired before the decision', () => {
    const d = decideMount(owed, KEY, 5);
    expect(d.record.fallbackLaunchesRemaining).toBe(0);
    const persisted = refundExpiredFallback(owed, d.record, true);
    expect(persisted.fallbackLaunchesRemaining).toBe(1);
    expect(decideMount(persisted, KEY, 6).fallbackActive).toBe(true);
  });

  it('is a no-op when not expired, with no owed launch, or for another buildKey', () => {
    const d = decideMount(owed, KEY, 5);
    expect(refundExpiredFallback(owed, d.record, false)).toBe(d.record);
    const idle = decideMount(freshRecord(KEY, 1), KEY, 5);
    expect(refundExpiredFallback(freshRecord(KEY, 1), idle.record, true)).toBe(idle.record);
    expect(refundExpiredFallback('corrupt', d.record, true)).toBe(d.record);
    expect(refundExpiredFallback(null, d.record, true)).toBe(d.record);
  });
});
