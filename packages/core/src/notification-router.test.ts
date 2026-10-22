import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatchPendingEvents } from './notification-router';
import * as sender from './notification-sender';

const EVENT_COLUMNS =
  'id,category,tier,title,body,deep_link,created_at,available_at,expires_at,killed_at,target_device_ids';

afterEach(() => {
  vi.unstubAllGlobals();
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
  deliveryInsertError?: { message: string };
  opsSwitchWriteError?: { message: string };
}) {
  const insertedDeliveries: Array<Record<string, unknown>> = [];
  const clearedTokenDeviceIds: string[] = [];
  const deliveryPageIds: string[][] = [];
  const prefCategories: string[] = [];
  const opsSwitchWrites: Array<Record<string, unknown>> = [];

  function queryBuilder(table: string) {
    const state: {
      filters: Array<(row: Record<string, unknown>) => boolean>;
      countOnly: boolean;
      selectedColumns: string | null;
      limit: number | null;
      orders: Array<{ column: string; ascending: boolean }>;
    } = { filters: [], countOnly: false, selectedColumns: null, limit: null, orders: [] };

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
      if (table === 'events' && col === 'created_at') {
        state.filters.push(
          (row) => ((row.created_at ?? row.available_at) as string) >= (val as string),
        );
      } else {
        state.filters.push((row) => (row[col] as string) >= (val as string));
      }
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
    api.or = ((filter: string) => {
      if (table !== 'events' || state.selectedColumns !== EVENT_COLUMNS) {
        throw new Error(`unexpected or filter on ${table}`);
      }
      if (filter.startsWith('expires_at.is.null,expires_at.gt.')) {
        const now = filter.slice('expires_at.is.null,expires_at.gt.'.length);
        expect(now).toEqual(expect.any(String));
        state.filters.push(
          (row) => row.expires_at === null || (row.expires_at as string) > now,
        );
        return api;
      }
      const match = filter.match(
        /^available_at\.lt\.(.+),and\(available_at\.eq\.(.+),id\.gt\.(.+)\)$/,
      );
      if (!match) throw new Error(`unexpected event cursor: ${filter}`);
      const availableAt = match[1]!;
      const sameAvailableAt = match[2]!;
      const id = match[3]!;
      expect(availableAt).toBe(sameAvailableAt);
      state.filters.push(
        (row) =>
          (row.available_at as string) < availableAt ||
          ((row.available_at as string) === availableAt && (row.id as string) > id),
      );
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
      if (table === 'notification_prefs' && col === 'category') prefCategories.push(val as string);
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.in = ((col: string, vals: unknown[]) => {
      if (table === 'deliveries' && state.selectedColumns === 'event_id') {
        expect(col).toBe('event_id');
        expect(vals).toEqual(vals.filter((value): value is string => typeof value === 'string'));
        deliveryPageIds.push(vals as string[]);
      }
      state.filters.push((row) => vals.includes(row[col]));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.limit = ((limit: number) => {
      if (table === 'events' && state.selectedColumns === EVENT_COLUMNS) {
        expect(limit).toBe(200);
      }
      state.limit = limit;
      return api;
    }) as (...args: unknown[]) => unknown;
    api.order = ((col: string, opts: { ascending?: boolean }) => {
      if (table === 'events' && state.selectedColumns === EVENT_COLUMNS) {
        if (state.orders.length === 0) {
          expect(col).toBe('available_at');
          expect(opts).toEqual({ ascending: false });
        } else if (state.orders.length === 1) {
          expect(col).toBe('id');
          expect(opts).toBeUndefined();
        } else {
          throw new Error('unexpected event ordering');
        }
      }
      state.orders.push({ column: col, ascending: opts?.ascending ?? true });
      return api;
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

    function runQuery() {
      if (table === 'ops_switches' && fixture.opsSwitchError) {
        return { data: null, error: fixture.opsSwitchError };
      }
      let rows = source().filter((row) => state.filters.every((f) => f(row)));
      if (state.countOnly) return { count: rows.length, error: null };
      if (state.orders.length > 0) {
        rows = [...rows].sort((a, b) => {
          for (const { column, ascending } of state.orders) {
            if (a[column] === b[column]) continue;
            const comparison = String(a[column]).localeCompare(String(b[column]));
            return ascending ? comparison : -comparison;
          }
          return 0;
        });
      }
      if (state.limit !== null) rows = rows.slice(0, state.limit);
      return { data: rows, error: null };
    }

    // insert/update are terminal actions, not filtered reads.
    api.insert = ((rows: Array<Record<string, unknown>> | Record<string, unknown>) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      if (table === 'deliveries') {
        if (fixture.deliveryInsertError) {
          return Promise.resolve({ data: null, error: fixture.deliveryInsertError });
        }
        insertedDeliveries.push(...arr);
        fixture.deliveries.push(
          ...(arr as Array<Record<string, unknown> & { kind: string }>),
        );
      }
      return Promise.resolve({ data: null, error: null });
    }) as (...args: unknown[]) => unknown;
    api.upsert = ((rows: Array<Record<string, unknown>> | Record<string, unknown>) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      if (table === 'ops_switches') {
        opsSwitchWrites.push(...arr);
        return Promise.resolve({ data: null, error: fixture.opsSwitchWriteError ?? null });
      }
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
    _deliveryPageIds: deliveryPageIds,
    _prefCategories: prefCategories,
    _opsSwitchWrites: opsSwitchWrites,
  } as unknown as SupabaseClient & {
    _insertedDeliveries: Array<Record<string, unknown>>;
    _clearedTokenDeviceIds: string[];
    _deliveryPageIds: string[][];
    _prefCategories: string[];
    _opsSwitchWrites: Array<Record<string, unknown>>;
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

  it('skips expired events before the pending-event cap', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const event = (id: string, expires_at: string | null) => ({
      id,
      category: id,
      tier: 1,
      title: id,
      body: 'Body',
      deep_link: 'https://x',
      available_at: new Date(now.getTime() - 1000).toISOString(),
      expires_at,
      killed_at: null,
    });
    const db = makeFakeDb({
      events: [
        ...Array.from({ length: 200 }, (_, index) =>
          event(`expired-${index}`, new Date(now.getTime() - 1000).toISOString()),
        ),
        ...Array.from({ length: 50 }, (_, index) => event(`fresh-${index}`, null)),
      ],
      notificationPrefs: [],
      devices: [],
      deliveries: [],
    });

    const result = await dispatchPendingEvents(db, now);

    expect(result.eventsConsidered).toBe(50);
  });

  it('caps eligible events newest-first without treating another device delivery as event completion', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const events = Array.from({ length: 250 }, (_, index) => {
      const id = `fresh-${String(index).padStart(3, '0')}`;
      return {
        id,
        category: id,
        tier: 1,
        title: id,
        body: 'Body',
        deep_link: 'https://x',
        available_at: new Date(now.getTime() - (250 - index) * 1000).toISOString(),
        expires_at: null,
        killed_at: null,
      };
    });
    const db = makeFakeDb({
      events,
      notificationPrefs: [],
      devices: [],
      deliveries: [
        ...Array.from({ length: 10 }, (_, index) => ({
          event_id: `fresh-${String(249 - index).padStart(3, '0')}`,
          kind: 'instant',
        })),
        { event_id: 'fresh-239', kind: 'fun' },
      ],
    });

    const result = await dispatchPendingEvents(db, now);

    expect(result.eventsConsidered).toBe(200);
    expect(db._prefCategories).toHaveLength(200);
    expect(db._prefCategories[0]).toBe('fresh-249');
    expect(db._prefCategories[199]).toBe('fresh-050');
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

  it('routes a correction only to its delivery-log-derived target devices through the governor', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const db = makeFakeDb({
      events: [
        {
          id: 'correction-1',
          category: 'correction',
          tier: 1,
          title: 'Correction',
          body: 'An earlier update was retracted.',
          deep_link: '/',
          target_device_ids: ['device-1', 'device-2'],
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [
        { device_id: 'device-3', category: 'correction', cadence: 'instant' },
      ],
      devices: [
        device({ id: 'device-1', push_token: 'token-1' }),
        device({ id: 'device-2', push_token: 'token-2' }),
        device({ id: 'device-3', push_token: 'token-3' }),
      ],
      deliveries: [
        { id: 'delivery-1', event_id: 'original-1', device_id: 'device-1', kind: 'instant', category: 'album_news', sent_at: new Date(now.getTime() - 60_000).toISOString() },
        { id: 'delivery-2', event_id: 'original-1', device_id: 'device-2', kind: 'instant', category: 'album_news', sent_at: new Date(now.getTime() - 60_000).toISOString() },
      ],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'device-1', deliveryToken: 'correction-token-1' },
      { ok: true, deviceId: 'device-2', deliveryToken: 'correction-token-2' },
    ]);

    const result = await dispatchPendingEvents(db, now);

    expect(result.sent).toBe(2);
    expect(sendSpy.mock.calls[0]?.[0].map((input) => input.deviceId)).toEqual([
      'device-1',
      'device-2',
    ]);
    expect(db._prefCategories).not.toContain('correction');
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

  it('keeps a quiet-hours hold deliverable after another device received the event', async () => {
    const createdAt = '2026-10-15T06:45:00.000Z';
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-quiet',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          created_at: createdAt,
          available_at: '2026-10-15T06:50:00.000Z',
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [
        { device_id: 'device-la', category: 'song_drop', cadence: 'instant' },
        { device_id: 'device-london', category: 'song_drop', cadence: 'instant' },
      ],
      devices: [
        device({ id: 'device-la', tz: 'America/Los_Angeles' }),
        device({ id: 'device-london', tz: 'Europe/London' }),
      ],
      deliveries: [],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockImplementation(async (inputs) =>
      inputs.map((input) => ({
        ok: true as const,
        deviceId: input.deviceId,
        deliveryToken: `token-${input.deviceId}`,
      })),
    );

    const duringQuietHours = await dispatchPendingEvents(
      db,
      new Date('2026-10-15T07:00:00.000Z'),
    );
    const afterQuietHours = await dispatchPendingEvents(
      db,
      new Date('2026-10-15T16:00:00.000Z'),
    );

    expect(duringQuietHours).toMatchObject({ sent: 1, held: 1 });
    expect(afterQuietHours).toMatchObject({ sent: 1, skippedAlreadyDelivered: 1 });
    expect(sendSpy.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({ deviceId: 'device-london' }),
    ]);
    expect(sendSpy.mock.calls[1]?.[0]).toEqual([
      expect.objectContaining({ deviceId: 'device-la' }),
    ]);
  });

  it('releases a pre-quiet event at quiet-hours end, measured from the hold end', async () => {
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-edge',
          category: 'song_drop',
          tier: 1,
          title: 'Late news',
          body: 'Held overnight',
          deep_link: 'https://x',
          created_at: '2026-10-16T04:50:00.000Z',
          available_at: '2026-10-16T04:55:00.000Z',
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'device-1', deliveryToken: 'held-token' },
    ]);

    const held = await dispatchPendingEvents(db, new Date('2026-10-16T05:10:00.000Z'));
    const released = await dispatchPendingEvents(db, new Date('2026-10-16T15:15:00.000Z'));

    expect(held).toMatchObject({ held: 1, sent: 0 });
    expect(released).toMatchObject({ sent: 1, skippedStale: 0 });
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('never sends a 25-day-old event instantly and leaves the event untouched', async () => {
    const now = new Date('2026-10-15T20:00:00.000Z');
    const staleEvent = {
      id: 'evt-old',
      category: 'song_drop',
      tier: 1,
      title: 'Old song',
      body: 'Long past',
      deep_link: 'https://x',
      created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      available_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      expires_at: null,
      killed_at: null,
    };
    const db = makeFakeDb({
      events: [staleEvent],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchPendingEvents(db, now);

    expect(result).toMatchObject({ eventsConsidered: 0, sent: 0, skippedStale: 0 });
    expect(sendSpy).not.toHaveBeenCalled();
    expect(staleEvent).toMatchObject({ id: 'evt-old', killed_at: null });
  });

  it('does not roll a stale Instant event into a digest after the daily cap', async () => {
    const now = new Date('2026-10-15T20:00:00.000Z');
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-stale',
          category: 'song_drop',
          tier: 1,
          title: 'Old song',
          body: 'Too late',
          deep_link: 'https://x',
          created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          available_at: new Date(now.getTime() - 23.9 * 60 * 60 * 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device({ daily_cap: 1 })],
      deliveries: [
        {
          device_id: 'device-1',
          event_id: 'prior',
          category: 'album_news',
          kind: 'instant',
          sent_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        },
      ],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchPendingEvents(db, now);

    expect(result).toMatchObject({ skippedStale: 1, skippedDailyCap: 0, enqueuedToDigest: 0 });
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('bounds a 250-event backlog and skips stale devices before count queries', async () => {
    const now = new Date('2026-10-15T18:00:00.000Z');
    const devices = ['A', 'B', 'C', 'D', 'E'].map((id) =>
      device({ id, push_token: `ExponentPushToken[${id}]` }),
    );
    const events = Array.from({ length: 250 }, (_, index) => {
      const availableAt = new Date(now.getTime() - (index + 1) * 3 * 60 * 60 * 1000);
      return {
        id: `evt-${String(index).padStart(3, '0')}`,
        category: 'song_drop',
        tier: 1,
        title: 'News',
        body: 'Body',
        deep_link: 'https://x',
        created_at: new Date(availableAt.getTime() - 5 * 60 * 1000).toISOString(),
        available_at: availableAt.toISOString(),
        expires_at: null,
        killed_at: null,
      };
    });
    const notificationPrefs = devices.map(({ id }) => ({
      device_id: id as string,
      category: 'song_drop',
      cadence: 'instant',
    }));
    const deliveredDb = makeFakeDb({
      events,
      notificationPrefs,
      devices,
      deliveries: events.flatMap((event) =>
        devices.map(({ id }) => ({
          device_id: id,
          event_id: event.id,
          category: 'song_drop',
          kind: 'instant',
          sent_at: event.available_at,
        })),
      ),
    });

    await dispatchPendingEvents(deliveredDb, now);
    expect(deliveredDb.from).toHaveBeenCalledTimes(29);

    const staleDb = makeFakeDb({ events, notificationPrefs, devices, deliveries: [] });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const messages = JSON.parse(init.body as string) as unknown[];
        return new Response(
          JSON.stringify({ data: messages.map(() => ({ status: 'ok' })) }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    );

    await dispatchPendingEvents(staleDb, now);
    expect(staleDb.from).toHaveBeenCalledTimes(97);
  });

  it('engages PUSH_FREEZE and stops after a provider-accepted send cannot be logged', async () => {
    const now = new Date('2026-10-15T20:00:00.000Z');
    const event = (id: string, ageMinutes: number) => ({
      id,
      category: 'song_drop',
      tier: 1,
      title: id,
      body: 'Body',
      deep_link: 'https://x',
      created_at: new Date(now.getTime() - ageMinutes * 60 * 1000).toISOString(),
      available_at: new Date(now.getTime() - (ageMinutes - 5) * 60 * 1000).toISOString(),
      expires_at: null,
      killed_at: null,
    });
    const db = makeFakeDb({
      events: [event('newer', 10), event('older', 20)],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
      deliveryInsertError: { message: 'simulated write failure' },
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'device-1', deliveryToken: 'provider-accepted' },
    ]);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await dispatchPendingEvents(db, now);

    expect(result).toMatchObject({
      eventsConsidered: 1,
      sent: 1,
      freezeEngaged: true,
      halted: true,
    });
    expect(result.errors).toContain('delivery log insert failed: simulated write failure');
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(db._opsSwitchWrites).toEqual([
      expect.objectContaining({ name: 'PUSH_FREEZE', enabled: true }),
    ]);
  });

  it('halts even when the PUSH_FREEZE write also fails', async () => {
    const now = new Date('2026-10-15T20:00:00.000Z');
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-1',
          category: 'song_drop',
          tier: 1,
          title: 'New song',
          body: 'Out now',
          deep_link: 'https://x',
          created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          available_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [{ device_id: 'device-1', category: 'song_drop', cadence: 'instant' }],
      devices: [device()],
      deliveries: [],
      deliveryInsertError: { message: 'ledger read only' },
      opsSwitchWriteError: { message: 'switch read only' },
    });
    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'device-1', deliveryToken: 'provider-accepted' },
    ]);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await dispatchPendingEvents(db, now);

    expect(result).toMatchObject({ sent: 1, freezeEngaged: false, halted: true });
    expect(result.errors).toContain('PUSH_FREEZE engage failed: switch read only');
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

  it('ACCEPTANCE (D5): a baby_watch event reaches the opted-in device once and the not-opted-in device never', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const db = makeFakeDb({
      events: [
        {
          id: 'evt-bw',
          category: 'baby_watch',
          tier: 1,
          title: 'Official announcement',
          body: 'Confirmed',
          deep_link: 'https://x',
          available_at: new Date(now.getTime() - 1000).toISOString(),
          expires_at: null,
          killed_at: null,
        },
      ],
      notificationPrefs: [
        { device_id: 'opted-in', category: 'baby_watch', cadence: 'instant' },
        { device_id: 'opted-out', category: 'baby_watch', cadence: 'off' },
      ],
      devices: [
        device({ id: 'opted-in', push_token: 'token-in' }),
        device({ id: 'opted-out', push_token: 'token-out' }),
        device({ id: 'no-row', push_token: 'token-none' }),
      ],
      deliveries: [],
    });
    const spy = vi
      .spyOn(sender, 'sendPushBatch')
      .mockResolvedValue([{ ok: true, deviceId: 'opted-in', deliveryToken: 'tok-in' }]);

    const result = await dispatchPendingEvents(db, now);

    expect(result.sent).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toEqual([expect.objectContaining({ deviceId: 'opted-in' })]);
    expect(db._insertedDeliveries.map((d) => d.device_id)).toEqual(['opted-in']);
  });
});
