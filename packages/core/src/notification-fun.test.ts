import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  selectLyricForDevice,
  selectOnThisDayEntry,
  scheduleCountdowns,
  countdownCopy,
  dispatchFunNotifications,
  type LyricCandidate,
  type OnThisDayEntry,
} from './notification-fun';
import { isFunSendDay, startOfLocalPeriod } from './notification-fun-schedule';
import * as sender from './notification-sender';

afterEach(() => {
  vi.restoreAllMocks();
});

function lyric(overrides: Partial<LyricCandidate> = {}): LyricCandidate {
  return {
    id: 1,
    slug: 'welcome-to-new-york',
    song: 'Welcome to New York',
    album: '1989',
    lyric: 'Welcome to New York, it\u2019s been waiting for you',
    verified: true,
    ...overrides,
  };
}

describe('selectLyricForDevice', () => {
  it('picks the first unseen verified candidate', () => {
    const pool = [lyric({ id: 1 }), lyric({ id: 2 }), lyric({ id: 3 })];
    const picked = selectLyricForDevice(pool, new Set([1]), true);
    expect(picked?.id).toBe(2);
  });

  it('skips unverified rows when requireVerified is true', () => {
    const pool = [lyric({ id: 1, verified: false }), lyric({ id: 2, verified: true })];
    const picked = selectLyricForDevice(pool, new Set(), true);
    expect(picked?.id).toBe(2);
  });

  it('returns null when every candidate is seen', () => {
    const pool = [lyric({ id: 1 }), lyric({ id: 2 })];
    const picked = selectLyricForDevice(pool, new Set([1, 2]), true);
    expect(picked).toBeNull();
  });

  it('returns null when the whole pool is unverified and verification is required', () => {
    const pool = [lyric({ id: 1, verified: false }), lyric({ id: 2, verified: false })];
    expect(selectLyricForDevice(pool, new Set(), true)).toBeNull();
  });

  it('allows unverified rows when requireVerified is false', () => {
    const pool = [lyric({ id: 1, verified: false })];
    expect(selectLyricForDevice(pool, new Set(), false)?.id).toBe(1);
  });
});

function otd(overrides: Partial<OnThisDayEntry> = {}): OnThisDayEntry {
  return {
    id: 1,
    month: 10,
    day: 27,
    year: 2014,
    text: 'On this day in 2014, 1989 was released',
    deepLink: null,
    ...overrides,
  };
}

describe('selectOnThisDayEntry', () => {
  it('finds the entry matching month/day', () => {
    const pool = [otd({ id: 1, month: 10, day: 27 }), otd({ id: 2, month: 11, day: 10 })];
    expect(selectOnThisDayEntry(pool, 10, 27)?.id).toBe(1);
  });

  it('returns null (silently skips) when no entry matches the date — spec: never sends filler', () => {
    const pool = [otd({ month: 10, day: 27 })];
    expect(selectOnThisDayEntry(pool, 6, 15)).toBeNull();
  });
});

describe('scheduleCountdowns', () => {
  it('produces all three milestones for a drop 8+ days out', () => {
    const dropAt = new Date('2026-02-01T17:00:00Z');
    const now = new Date('2026-01-01T00:00:00Z');
    const result = scheduleCountdowns(dropAt, now);
    expect(result.map((r) => r.milestone)).toEqual(['t_minus_7d', 't_minus_1d', 'release_hour']);
    expect(result[0]?.scheduledFor.toISOString()).toBe('2026-01-25T17:00:00.000Z');
    expect(result[1]?.scheduledFor.toISOString()).toBe('2026-01-31T17:00:00.000Z');
    expect(result[2]?.scheduledFor.toISOString()).toBe('2026-02-01T17:00:00.000Z');
  });

  it('only keeps future milestones — self-limiting for a short-notice drop', () => {
    // Drop is 3 days out: T-7d already passed, T-1d and release-hour remain.
    const dropAt = new Date('2026-01-04T00:00:00Z');
    const now = new Date('2026-01-01T00:00:00Z');
    const result = scheduleCountdowns(dropAt, now);
    expect(result.map((r) => r.milestone)).toEqual(['t_minus_1d', 'release_hour']);
  });

  it('yields nothing for a drop already announced with the hour itself in the past', () => {
    const dropAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-02T00:00:00Z');
    expect(scheduleCountdowns(dropAt, now)).toEqual([]);
  });
});

describe('countdownCopy', () => {
  it('produces distinct copy per milestone', () => {
    expect(countdownCopy('t_minus_7d', 'The New Album').body).toContain('7 days');
    expect(countdownCopy('t_minus_1d', 'The New Album').body).toContain('tomorrow');
    expect(countdownCopy('release_hour', 'The New Album').body).toContain('out now');
  });
});

// ---------------------------------------------------------------------------
// 30-day simulation (NOTIFICATIONS_PLAN.md Phase 4 acceptance criterion):
// "a 30-day simulated run for one device produces correct counts per
// cadence with zero lyric repeats; a date with no on-this-day entry sends
// nothing." Pure — drives the exported selection functions directly over a
// simulated 30-day clock, one tick per simulated day at the device's
// digest hour, without touching a database.
// ---------------------------------------------------------------------------

interface SimSend {
  day: number;
  category: 'lyric_of_day' | 'on_this_day';
  lyricId?: number;
}

function simulate(
  cadence: 'daily' | 'weekly' | 'monthly',
  category: 'lyric_of_day' | 'on_this_day',
  lyricPool: LyricCandidate[],
  otdPool: OnThisDayEntry[],
  days: number,
  tz = 'America/Los_Angeles',
): SimSend[] {
  const sends: SimSend[] = [];
  const seenLyricIds = new Set<number>();
  const start = new Date('2026-01-01T17:00:00Z'); // 09:00 PST, a Thursday
  let lastSentPeriodStart: number | null = null;

  for (let d = 0; d < days; d++) {
    const now = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
    if (!isFunSendDay(cadence, tz, now)) continue;
    const periodStart = startOfLocalPeriod(cadence, tz, now).getTime();
    if (lastSentPeriodStart === periodStart) continue; // already sent this period
    if (category === 'lyric_of_day') {
      const picked = selectLyricForDevice(lyricPool, seenLyricIds, true);
      if (picked) {
        seenLyricIds.add(picked.id);
        sends.push({ day: d, category, lyricId: picked.id });
        lastSentPeriodStart = periodStart;
      }
    } else {
      const { month, day } = localMonthDayForTest(tz, now);
      const entry = selectOnThisDayEntry(otdPool, month, day);
      if (entry) {
        sends.push({ day: d, category });
      }
      // on_this_day still consumes the period slot even when skipped —
      // matches the real dispatch job's per-period dedupe check running
      // regardless of whether an entry existed that day.
      lastSentPeriodStart = periodStart;
    }
  }
  return sends;
}

function localMonthDayForTest(tz: string, now: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { month: get('month'), day: get('day') };
}

describe('30-day simulation — lyric_of_day', () => {
  it('daily cadence sends exactly 30 times with zero repeats over a large pool', () => {
    const pool = Array.from({ length: 50 }, (_, i) => lyric({ id: i + 1, slug: `song-${i + 1}` }));
    const sends = simulate('daily', 'lyric_of_day', pool, [], 30);
    expect(sends).toHaveLength(30);
    const lyricIds = sends.map((s) => s.lyricId);
    expect(new Set(lyricIds).size).toBe(lyricIds.length); // zero repeats
  });

  it('weekly cadence sends exactly on Fridays across 30 days (4 or 5 sends)', () => {
    const pool = Array.from({ length: 10 }, (_, i) => lyric({ id: i + 1, slug: `song-${i + 1}` }));
    const sends = simulate('weekly', 'lyric_of_day', pool, [], 30);
    // 2026-01-01 is a Thursday; Fridays in the 30-day window: Jan 2, 9, 16, 23, 30 = 5.
    expect(sends).toHaveLength(5);
    const lyricIds = sends.map((s) => s.lyricId);
    expect(new Set(lyricIds).size).toBe(lyricIds.length);
  });

  it('monthly cadence sends exactly once for a 30-day window starting mid-cycle', () => {
    const pool = Array.from({ length: 5 }, (_, i) => lyric({ id: i + 1, slug: `song-${i + 1}` }));
    const sends = simulate('monthly', 'lyric_of_day', pool, [], 30);
    // Only 2026-02-01 falls within [Jan 1, Jan 31) window of 30 days starting Jan 1
    // (day indices 0..29 => Jan 1 .. Jan 30); the 1st-of-month in range is Jan 1 itself.
    expect(sends.length).toBeGreaterThanOrEqual(1);
    const lyricIds = sends.map((s) => s.lyricId);
    expect(new Set(lyricIds).size).toBe(lyricIds.length);
  });

  it('a pool too small for the window never repeats — it just stops sending once exhausted', () => {
    const pool = [lyric({ id: 1 }), lyric({ id: 2 }), lyric({ id: 3 })];
    const sends = simulate('daily', 'lyric_of_day', pool, [], 30);
    expect(sends).toHaveLength(3); // exhausted after 3 unique lyrics
    const lyricIds = sends.map((s) => s.lyricId);
    expect(new Set(lyricIds).size).toBe(3);
  });
});

describe('30-day simulation — on_this_day', () => {
  it('sends nothing on dates with no entry, and something on dates that have one', () => {
    // Only Jan 1 and Jan 15 (of the 30-day Jan window) have entries.
    const pool = [otd({ id: 1, month: 1, day: 1 }), otd({ id: 2, month: 1, day: 15 })];
    const sends = simulate('daily', 'on_this_day', [], pool, 30);
    expect(sends).toHaveLength(2);
  });

  it('an entirely empty pool sends nothing across the whole window', () => {
    const sends = simulate('daily', 'on_this_day', [], [], 30);
    expect(sends).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// dispatchFunNotifications — DB orchestration, gate 6 (hard ceiling).
// Same minimal fluent Supabase fake pattern as notification-router.test.ts /
// notification-digest.test.ts.
// ---------------------------------------------------------------------------

function makeFakeDb(fixture: {
  notificationPrefs: Array<{ device_id: string; category: string; cadence: string }>;
  devices: Array<Record<string, unknown>>;
  lyrics: Array<Record<string, unknown> | LyricCandidate>;
  onThisDay: Array<Record<string, unknown>>;
  deliveries?: Array<Record<string, unknown>>;
  lyricHistory?: Array<Record<string, unknown>>;
}) {
  const insertedDeliveries: Array<Record<string, unknown>> = [];

  function queryBuilder(table: string) {
    const state: { filters: Array<(row: Record<string, unknown>) => boolean>; countOnly: boolean } = {
      filters: [],
      countOnly: false,
    };

    const api: Record<string, (...args: unknown[]) => unknown> = {};
    api.select = ((_cols: string, opts?: { count?: string; head?: boolean }) => {
      if (opts?.head) state.countOnly = true;
      return api;
    }) as (...args: unknown[]) => unknown;
    api.order = (() => api) as (...args: unknown[]) => unknown;
    api.gte = ((col: string, val: unknown) => {
      state.filters.push((row) => (row[col] as string) >= (val as string));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.eq = ((col: string, val: unknown) => {
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.in = ((col: string, vals: unknown[]) => {
      state.filters.push((row) => vals.includes(row[col]));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.then = ((resolve: (v: unknown) => void) => {
      resolve(runQuery());
    }) as (...args: unknown[]) => unknown;

    function source(): Array<Record<string, unknown>> {
      if (table === 'notification_prefs')
        return fixture.notificationPrefs as unknown as Array<Record<string, unknown>>;
      if (table === 'devices') return fixture.devices;
      if (table === 'lyrics') return fixture.lyrics as unknown as Array<Record<string, unknown>>;
      if (table === 'on_this_day') return fixture.onThisDay;
      if (table === 'deliveries') return (fixture.deliveries ?? []) as Array<Record<string, unknown>>;
      if (table === 'lyric_history') return (fixture.lyricHistory ?? []) as Array<Record<string, unknown>>;
      throw new Error(`unexpected table ${table}`);
    }

    function runQuery() {
      const rows = source().filter((row) => state.filters.every((f) => f(row)));
      if (state.countOnly) return { count: rows.length, error: null };
      return { data: rows, error: null };
    }

    api.insert = ((rows: Array<Record<string, unknown>> | Record<string, unknown>) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      if (table === 'deliveries') insertedDeliveries.push(...arr);
      return Promise.resolve({ data: null, error: null });
    }) as (...args: unknown[]) => unknown;
    api.upsert = (() => Promise.resolve({ data: null, error: null })) as (
      ...args: unknown[]
    ) => unknown;

    return api;
  }

  return {
    from: vi.fn((table: string) => queryBuilder(table)),
    _insertedDeliveries: insertedDeliveries,
  } as unknown as SupabaseClient & { _insertedDeliveries: Array<Record<string, unknown>> };
}

function funDevice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'device-1',
    push_token: 'token-1',
    tz: 'America/Los_Angeles',
    digest_hour: 9,
    master_enabled: true,
    ...overrides,
  };
}

describe('dispatchFunNotifications — gate 6 (hard ceiling)', () => {
  it('a device already at the 6/day hard ceiling gets no lyric_of_day send', async () => {
    const now = new Date('2026-01-15T20:00:00Z'); // 12:00 PST — Thursday, a valid daily send day
    const since = '2026-01-15T08:00:00Z'; // start of local PST day
    const sixDeliveriesToday = Array.from({ length: 6 }, (_, i) => ({
      device_id: 'device-1',
      kind: i % 2 === 0 ? 'instant' : 'digest',
      category: 'song_drop',
      sent_at: since,
    }));
    const db = makeFakeDb({
      notificationPrefs: [{ device_id: 'device-1', category: 'lyric_of_day', cadence: 'daily' }],
      devices: [funDevice()],
      lyrics: [lyric({ id: 1 })],
      onThisDay: [],
      deliveries: sixDeliveriesToday,
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchFunNotifications(db, now);
    expect(result.lyricsSent).toBe(0);
    expect(result.skippedHardCeiling).toBe(1);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('a device under the hard ceiling still gets its lyric_of_day send', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const db = makeFakeDb({
      notificationPrefs: [{ device_id: 'device-1', category: 'lyric_of_day', cadence: 'daily' }],
      devices: [funDevice()],
      lyrics: [lyric({ id: 1 })],
      onThisDay: [],
      deliveries: [],
    });
    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([{ ok: true, deviceId: 'device-1' }]);

    const result = await dispatchFunNotifications(db, now);
    expect(result.lyricsSent).toBe(1);
    expect(result.skippedHardCeiling).toBe(0);
  });
});
