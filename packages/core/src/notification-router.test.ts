import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatchPendingEvents } from './notification-router';
import * as sender from './notification-sender';

afterEach(() => {
  vi.restoreAllMocks();
});

// A minimal fluent Supabase-query-builder fake. Each method returns `this`
// (further chaining) except the ones the router actually `await`s, which
// resolve with `{ data, error }` (or `{ count, error }` for the head-count
// call). Backed by an in-memory fixture keyed by table name so each test
// only has to describe its fixture data, not the query mechanics.
function makeFakeDb(fixture: {
  events: Array<Record<string, unknown>>;
  notificationPrefs: Array<{ device_id: string; category: string; cadence: string }>;
  devices: Array<Record<string, unknown>>;
  deliveries: Array<{ device_id: string; category: string; kind: string; sent_at: string }>;
}) {
  const insertedDeliveries: Array<Record<string, unknown>> = [];
  const clearedTokenDeviceIds: string[] = [];

  function queryBuilder(table: string) {
    const state: { filters: Array<(row: Record<string, unknown>) => boolean>; countOnly: boolean } =
      {
        filters: [],
        countOnly: false,
      };

    const api: Record<string, (...args: unknown[]) => unknown> = {};
    api.select = ((_cols: string, opts?: { count?: string; head?: boolean }) => {
      if (opts?.head) state.countOnly = true;
      return api;
    }) as (...args: unknown[]) => unknown;
    api.lte = ((col: string, val: unknown) => {
      state.filters.push((row) => (row[col] as string) <= (val as string));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.gte = ((col: string, val: unknown) => {
      state.filters.push((row) => (row[col] as string) >= (val as string));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.is = ((col: string, val: unknown) => {
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.not = (() => {
      // Router's `.not('id', 'in', subquery)` excludes events that already
      // have a delivery row — this fixture's `deliveries` fixture never
      // carries `event_id`, so it's a no-op filter (every fixture in these
      // tests seeds `events` with rows that have no prior delivery anyway).
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
    api.limit = (() => api) as (...args: unknown[]) => unknown;
    api.then = ((resolve: (v: unknown) => void) => {
      // Makes `api` awaitable directly (router does `await db.from(...).select...`).
      resolve(runQuery());
    }) as (...args: unknown[]) => unknown;

    function source(): Array<Record<string, unknown>> {
      if (table === 'events') return fixture.events;
      if (table === 'notification_prefs')
        return fixture.notificationPrefs as unknown as Array<Record<string, unknown>>;
      if (table === 'devices') return fixture.devices;
      if (table === 'deliveries')
        return fixture.deliveries as unknown as Array<Record<string, unknown>>;
      throw new Error(`unexpected table ${table}`);
    }

    function runQuery() {
      const rows = source().filter((row) => state.filters.every((f) => f(row)));
      if (state.countOnly) return { count: rows.length, error: null };
      return { data: rows, error: null };
    }

    // insert/update are terminal actions, not filtered reads.
    api.insert = ((rows: Array<Record<string, unknown>> | Record<string, unknown>) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      if (table === 'deliveries') insertedDeliveries.push(...arr);
      return Promise.resolve({ data: null, error: null });
    }) as (...args: unknown[]) => unknown;
    api.update = ((patch: Record<string, unknown>) => ({
      in: (_col: string, vals: string[]) => {
        if (table === 'devices' && 'push_token' in patch) clearedTokenDeviceIds.push(...vals);
        return Promise.resolve({ data: null, error: null });
      },
    })) as (...args: unknown[]) => unknown;

    return api;
  }

  return {
    from: vi.fn((table: string) => queryBuilder(table)),
    _insertedDeliveries: insertedDeliveries,
    _clearedTokenDeviceIds: clearedTokenDeviceIds,
  } as unknown as SupabaseClient & {
    _insertedDeliveries: Array<Record<string, unknown>>;
    _clearedTokenDeviceIds: string[];
  };
}

function device(overrides: Record<string, unknown> = {}) {
  return {
    id: 'device-1',
    push_token: 'token-1',
    master_enabled: true,
    snooze_until: null,
    daily_cap: 3,
    quiet_start: 22,
    quiet_end: 8,
    tz: 'America/Los_Angeles',
    ...overrides,
  };
}

describe('dispatchPendingEvents', () => {
  it('ACCEPTANCE: a song_drop event delivers to an opted-in device once', async () => {
    const now = new Date('2026-01-15T20:00:00Z'); // 12:00 PST, outside quiet hours
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-1',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
    });

    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([{ ok: true, deviceId: 'device-1' }]);

    const result = await dispatchPendingEvents(db, now);
    expect(result.sent).toBe(1);
    expect(db._insertedDeliveries).toHaveLength(1);
    expect(db._insertedDeliveries[0]).toMatchObject({
      device_id: 'device-1',
      event_id: 'evt-1',
      kind: 'instant',
      category: 'song_drop',
    });
  });

  it('ACCEPTANCE: a device NOT opted into instant for this category never receives it', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-1',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'daily' }], // not instant
      devices: [device()],
      deliveries: [],
    });
    const spy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchPendingEvents(db, now);
    expect(result.sent).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('ACCEPTANCE: a device already at its daily cap receives nothing further that day', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const since = new Date('2026-01-15T08:00:00Z').toISOString(); // start of local PST day
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-1',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device({ daily_cap: 2 })],
      deliveries: [
        { device_id: 'device-1', category: 'album_news', kind: 'instant', sent_at: since },
        { device_id: 'device-1', category: 'tour_news', kind: 'instant', sent_at: since },
      ],
    });
    const spy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchPendingEvents(db, now);
    expect(result.sent).toBe(0);
    expect(result.skippedDailyCap).toBe(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('ACCEPTANCE: a quiet-hours event is held (queues), not sent or dropped', async () => {
    const now = new Date('2026-01-15T07:00:00Z'); // 23:00 PST prior day -> inside 22-8 quiet hours
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-1',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
    });
    const spy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const held = await dispatchPendingEvents(db, now);
    expect(held.sent).toBe(0);
    expect(held.held).toBe(1);
    expect(spy).not.toHaveBeenCalled();

    // Re-running the dispatch after quiet hours end (same event, still no
    // delivery row logged) delivers it — "queue and deliver at quiet-hours
    // end" without a separate digest_queue table (Phase 3 scope).
    const afterQuietHours = new Date('2026-01-15T20:00:00Z'); // noon PST
    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([{ ok: true, deviceId: 'device-1' }]);
    const delivered = await dispatchPendingEvents(db, afterQuietHours);
    expect(delivered.sent).toBe(1);
  });

  it('prunes a device push_token on an FCM invalid-token response', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-1',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
    });
    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: false, deviceId: 'device-1', invalidToken: true, error: 'HTTP 404 UNREGISTERED' },
    ]);

    const result = await dispatchPendingEvents(db, now);
    expect(result.sendFailures).toBe(1);
    expect(db._clearedTokenDeviceIds).toEqual(['device-1']);
  });
});
