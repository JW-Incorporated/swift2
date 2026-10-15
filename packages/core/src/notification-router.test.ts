import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatchPendingEvents } from './notification-router';
import * as sender from './notification-sender';

const EVENT_COLUMNS =
  'id,category,tier,title,body,deep_link,available_at,expires_at,killed_at';

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
  deliveries: Array<Record<string, unknown> & { kind: string }>;
  opsSwitches?: Array<{ name: string; enabled: boolean }>;
  opsSwitchError?: { message: string };
  maxRowsPerPage?: number;
}) {
  const insertedDeliveries: Array<Record<string, unknown>> = [];
  const clearedTokenDeviceIds: string[] = [];
  const deliveryRanges: Array<[number, number]> = [];
  const eventRanges: Array<[number, number]> = [];

  function queryBuilder(table: string) {
    const state: {
      filters: Array<(row: Record<string, unknown>) => boolean>;
      countOnly: boolean;
      selectedColumns: string | null;
    } = { filters: [], countOnly: false, selectedColumns: null };

    const api: Record<string, (...args: unknown[]) => unknown> = {};
    api.select = ((_cols: string, opts?: { count?: string; head?: boolean }) => {
      state.selectedColumns = _cols;
      if (opts?.head) state.countOnly = true;
      return api;
    }) as (...args: unknown[]) => unknown;
    api.lte = ((col: string, val: unknown) => {
      if (table === 'events' && state.selectedColumns === EVENT_COLUMNS) {
        expect(col).toBe('available_at');
        expect(val).toEqual(expect.any(String));
      }
      state.filters.push((row) => (row[col] as string) <= (val as string));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.gte = ((col: string, val: unknown) => {
      state.filters.push((row) => (row[col] as string) >= (val as string));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.is = ((col: string, val: unknown) => {
      if (table === 'events' && state.selectedColumns === EVENT_COLUMNS) {
        expect(col).toBe('killed_at');
        expect(val).toBeNull();
      }
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.not = ((...args: unknown[]) => {
      throw new Error(`unexpected PostgREST not filter: ${JSON.stringify(args)}`);
    }) as (...args: unknown[]) => unknown;
    api.eq = ((col: string, val: unknown) => {
      if (table === 'deliveries' && state.selectedColumns === 'event_id') {
        expect(col).toBe('kind');
        expect(val).toBe('instant');
      }
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.in = ((col: string, vals: unknown[]) => {
      state.filters.push((row) => vals.includes(row[col]));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.limit = (() => api) as (...args: unknown[]) => unknown;
    api.order = ((col: string, opts: { ascending?: boolean }) => {
      if (table === 'deliveries' && state.selectedColumns === 'event_id') {
        expect(col).toBe('id');
        expect(opts).toEqual({ ascending: true });
      }
      return api;
    }) as (...args: unknown[]) => unknown;
    api.range = (async (from: number, to: number) => {
      if (table === 'deliveries' && state.selectedColumns === 'event_id') {
        expect(to - from + 1).toBe(1_000);
        deliveryRanges.push([from, to]);
      } else if (table === 'events' && state.selectedColumns === EVENT_COLUMNS) {
        expect(to - from + 1).toBe(200);
        eventRanges.push([from, to]);
      } else {
        throw new Error(`unexpected range query on ${table}`);
      }
      return runQuery([from, to]);
    }) as (...args: unknown[]) => unknown;
    api.maybeSingle = (async () => {
      const result = runQuery();
      if (result.error) return result;
      return { data: result.data?.[0] ?? null, error: null };
    }) as (...args: unknown[]) => unknown;
    api.then = ((resolve: (v: unknown) => void) => {
      // Makes `api` awaitable directly (router does `await db.from(...).select...`).
      resolve(runQuery());
    }) as (...args: unknown[]) => unknown;

    function source(): Array<Record<string, unknown>> {
      if (table === 'ops_switches')
        return (fixture.opsSwitches ?? [
          { name: 'PUSH_FREEZE', enabled: false },
        ]) as Array<Record<string, unknown>>;
      if (table === 'events') return fixture.events;
      if (table === 'notification_prefs')
        return fixture.notificationPrefs as unknown as Array<Record<string, unknown>>;
      if (table === 'devices') return fixture.devices;
      if (table === 'deliveries')
        return fixture.deliveries as unknown as Array<Record<string, unknown>>;
      throw new Error(`unexpected table ${table}`);
    }

    function runQuery(range?: [number, number]) {
      if (table === 'ops_switches' && fixture.opsSwitchError) {
        return { data: null, error: fixture.opsSwitchError };
      }
      let rows = source().filter((row) => state.filters.every((f) => f(row)));
      if (state.countOnly) return { count: rows.length, error: null };
      if (table === 'deliveries' && state.selectedColumns === 'event_id') {
        rows = [...rows].sort((a, b) => Number(a.id) - Number(b.id));
      }
      if (range) {
        const [from, to] = range;
        const maxRows = fixture.maxRowsPerPage ?? Number.POSITIVE_INFINITY;
        rows = rows.slice(from, Math.min(to + 1, from + maxRows));
      }
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
    _deliveryRanges: deliveryRanges,
    _eventRanges: eventRanges,
  } as unknown as SupabaseClient & {
    _insertedDeliveries: Array<Record<string, unknown>>;
    _clearedTokenDeviceIds: string[];
    _deliveryRanges: Array<[number, number]>;
    _eventRanges: Array<[number, number]>;
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
  it('sends nothing and logs why when PUSH_FREEZE is on', async () => {
    const db = makeFakeDb({
      events: [],
      notificationPrefs: [],
      devices: [],
      deliveries: [],
      opsSwitches: [{ name: 'PUSH_FREEZE', enabled: true }],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await dispatchPendingEvents(db);

    expect(result.sent).toBe(0);
    expect(sendSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'notification-router: PUSH_FREEZE is on; dispatch skipped',
    );
  });

  it('fails safe and sends nothing when PUSH_FREEZE cannot be read', async () => {
    const db = makeFakeDb({
      events: [],
      notificationPrefs: [],
      devices: [],
      deliveries: [],
      opsSwitchError: { message: 'unavailable' },
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await dispatchPendingEvents(db);

    expect(result.sent).toBe(0);
    expect(result.errors).toContain(
      'PUSH_FREEZE could not be read; dispatch skipped: unavailable',
    );
    expect(sendSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'notification-router: PUSH_FREEZE could not be read; dispatch skipped: unavailable',
    );
  });

  it('excludes instant-delivered events while paging deliveries and pending events', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const event = (id: string, category: string, title: string) => ({
      id,
      category,
      tier: 1,
      title,
      body: 'Body',
      deep_link: 'https://x',
      available_at: new Date(now.getTime() - 1000).toISOString(),
      expires_at: null,
      killed_at: null,
    });
    const db = makeFakeDb({
      events: [
        event('delivered-event', 'album_news', 'Already delivered'),
        event('countdown-event', 'song_drop', 'Countdown only'),
        event('undelivered-event', 'tour_news', 'Undelivered'),
      ],
      notificationPrefs: [
        { device_id: 'device-1', category: 'album_news', cadence: 'instant' },
        { device_id: 'device-1', category: 'song_drop', cadence: 'instant' },
        { device_id: 'device-1', category: 'tour_news', cadence: 'instant' },
      ],
      devices: [device()],
      deliveries: [
        {
          id: 1,
          event_id: 'delivered-event',
          device_id: 'old-device',
          category: 'album_news',
          kind: 'instant',
          sent_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          event_id: 'countdown-event',
          device_id: 'old-device',
          category: 'countdowns',
          kind: 'fun',
          sent_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 3,
          event_id: 'unrelated-event',
          device_id: 'old-device',
          category: 'album_news',
          kind: 'instant',
          sent_at: '2025-01-01T00:00:00Z',
        },
      ],
      maxRowsPerPage: 1,
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockImplementation(async (batch) =>
      batch.map(({ deviceId }) => ({ ok: true, deviceId, deliveryToken: `token-${deviceId}` })),
    );

    const result = await dispatchPendingEvents(db, now);

    expect(result.eventsConsidered).toBe(2);
    expect(result.sent).toBe(2);
    expect(sendSpy.mock.calls.map(([batch]) => batch[0]?.title)).toEqual([
      'Countdown only',
      'Undelivered',
    ]);
    expect(db._deliveryRanges).toEqual([
      [0, 999],
      [1, 1000],
      [2, 1001],
    ]);
    expect(db._eventRanges).toEqual([
      [0, 199],
      [1, 200],
      [2, 201],
      [3, 202],
    ]);
  });

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

    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'device-1', deliveryToken: 'test-token-1' },
    ]);

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

  it('ACCEPTANCE (Phase 6): a platform=web device is routed through sendPushBatch with platform=web, same pipeline as ios/android', async () => {
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
      notificationPrefs: [{ device_id: 'web-device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [
        device({
          id: 'web-device-1',
          push_token: JSON.stringify({
            endpoint: 'https://fcm.googleapis.com/fcm/send/xyz',
            keys: { p256dh: 'p', auth: 'a' },
          }),
          platform: 'web',
        }),
      ],
      deliveries: [],
    });

    const spy = vi
      .spyOn(sender, 'sendPushBatch')
      .mockResolvedValue([{ ok: true, deviceId: 'web-device-1', deliveryToken: 'test-token-web' }]);

    const result = await dispatchPendingEvents(db, now);
    expect(result.sent).toBe(1);
    expect(spy.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({ deviceId: 'web-device-1', platform: 'web' }),
    ]);
    expect(db._insertedDeliveries[0]).toMatchObject({
      device_id: 'web-device-1',
      delivery_token: 'test-token-web',
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
    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'device-1', deliveryToken: 'test-token-1' },
    ]);
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

  it('ACCEPTANCE (Phase 5): a device already at the 6/day hard ceiling receives nothing further, even under its per-category daily cap', async () => {
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
      // Well under the per-category instant daily cap (0 of 3 song_drop
      // instant sends today) — daily_cap would clear this send.
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device({ daily_cap: 3 })],
      // 6 total deliveries today across every kind (digest/fun mostly, not
      // song_drop) — the device-wide 6/day floor, not the per-category cap.
      deliveries: [
        { device_id: 'device-1', category: 'album_news', kind: 'digest', sent_at: since },
        { device_id: 'device-1', category: 'tour_news', kind: 'digest', sent_at: since },
        { device_id: 'device-1', category: 'lyric_of_day', kind: 'fun', sent_at: since },
        { device_id: 'device-1', category: 'on_this_day', kind: 'fun', sent_at: since },
        { device_id: 'device-1', category: 'countdowns', kind: 'fun', sent_at: since },
        { device_id: 'device-1', category: 'award_news', kind: 'instant', sent_at: since },
      ],
    });
    const spy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchPendingEvents(db, now);
    expect(result.sent).toBe(0);
    expect(result.skippedHardCeiling).toBe(1);
    expect(result.skippedDailyCap).toBe(0); // NOT the per-category cap gate
    expect(spy).not.toHaveBeenCalled();
  });
});
