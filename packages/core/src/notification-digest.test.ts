import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatchDueDigests, enqueueForDigest } from './notification-digest';
import * as sender from './notification-sender';

afterEach(() => {
  vi.restoreAllMocks();
});

// Same minimal fluent Supabase fake pattern as notification-router.test.ts,
// extended with `upsert`/`delete` since the digest engine needs both.
function makeFakeDb(fixture: {
  digestQueue: Array<{ device_id: string; event_id: string; cadence: string; category: string; scheduled_for: string }>;
  devices: Array<Record<string, unknown>>;
  events: Array<{ id: string; title: string }>;
  deliveries?: Array<Record<string, unknown>>;
}) {
  const insertedDeliveries: Array<Record<string, unknown>> = [];
  const deletedDigestQueueKeys: string[] = [];
  const upsertedDigestQueue: Array<Record<string, unknown>> = [];

  function queryBuilder(table: string) {
    const state: {
      filters: Array<(row: Record<string, unknown>) => boolean>;
      countOnly: boolean;
      deleteDeviceId?: string;
    } = { filters: [], countOnly: false };

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
    api.eq = ((col: string, val: unknown) => {
      if (table === 'digest_queue' && col === 'device_id') state.deleteDeviceId = val as string;
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.in = ((col: string, vals: unknown[]) => {
      state.filters.push((row) => vals.includes(row[col]));
      return api;
    }) as (...args: unknown[]) => unknown;
    api.is = ((col: string, val: unknown) => {
      state.filters.push((row) => row[col] === val);
      return api;
    }) as (...args: unknown[]) => unknown;
    api.limit = (() => api) as (...args: unknown[]) => unknown;
    api.then = ((resolve: (v: unknown) => void) => {
      resolve(runQuery());
    }) as (...args: unknown[]) => unknown;

    function source(): Array<Record<string, unknown>> {
      if (table === 'digest_queue') return fixture.digestQueue as unknown as Array<Record<string, unknown>>;
      if (table === 'devices') return fixture.devices;
      if (table === 'events') return fixture.events as unknown as Array<Record<string, unknown>>;
      if (table === 'deliveries') return (fixture.deliveries ?? []) as Array<Record<string, unknown>>;
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

    api.upsert = ((row: Record<string, unknown>) => {
      if (table === 'digest_queue') upsertedDigestQueue.push(row);
      return Promise.resolve({ data: null, error: null });
    }) as (...args: unknown[]) => unknown;

    api.delete = (() => {
      const delApi: Record<string, unknown> = {};
      delApi.eq = (col: string, val: unknown) => {
        if (table === 'digest_queue' && col === 'device_id') state.deleteDeviceId = val as string;
        return delApi;
      };
      delApi.in = (col: string, vals: unknown[]) => {
        if (table === 'digest_queue' && col === 'event_id' && state.deleteDeviceId) {
          for (const eventId of vals) deletedDigestQueueKeys.push(`${state.deleteDeviceId}:${eventId}`);
        }
        return Promise.resolve({ data: null, error: null });
      };
      return delApi;
    }) as (...args: unknown[]) => unknown;

    return api;
  }

  return {
    from: vi.fn((table: string) => queryBuilder(table)),
    _insertedDeliveries: insertedDeliveries,
    _deletedDigestQueueKeys: deletedDigestQueueKeys,
    _upsertedDigestQueue: upsertedDigestQueue,
  } as unknown as SupabaseClient & {
    _insertedDeliveries: Array<Record<string, unknown>>;
    _deletedDigestQueueKeys: string[];
    _upsertedDigestQueue: Array<Record<string, unknown>>;
  };
}

function device(overrides: Record<string, unknown> = {}) {
  return {
    id: 'device-1',
    push_token: 'token-1',
    tz: 'America/Los_Angeles',
    digest_hour: 9,
    master_enabled: true,
    ...overrides,
  };
}

describe('dispatchDueDigests', () => {
  it('NON-NEGOTIABLE: a device with 4 categories queued on Daily gets exactly ONE merged push, never 4', async () => {
    const now = new Date('2026-01-15T20:00:00Z'); // 12:00 PST — within send window
    const db = makeFakeDb({
      digestQueue: [
        { device_id: 'device-1', event_id: 'evt-1', cadence: 'daily', category: 'song_drop', scheduled_for: '2026-01-15T17:00:00Z' },
        { device_id: 'device-1', event_id: 'evt-2', cadence: 'daily', category: 'official_merch', scheduled_for: '2026-01-15T17:00:00Z' },
        { device_id: 'device-1', event_id: 'evt-3', cadence: 'daily', category: 'relationship_news', scheduled_for: '2026-01-15T17:00:00Z' },
        { device_id: 'device-1', event_id: 'evt-4', cadence: 'daily', category: 'award_news', scheduled_for: '2026-01-15T17:00:00Z' },
      ],
      devices: [device()],
      events: [
        { id: 'evt-1', title: 'New song' },
        { id: 'evt-2', title: 'New merch' },
        { id: 'evt-3', title: 'Relationship update' },
        { id: 'evt-4', title: 'Award nomination' },
      ],
    });

    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([{ ok: true, deviceId: 'device-1' }]);

    const result = await dispatchDueDigests(db, now);

    expect(result.digestsSent).toBe(1); // exactly one digest, not 4
    expect(sendSpy).toHaveBeenCalledTimes(1); // exactly one FCM send call
    expect(sendSpy.mock.calls[0]?.[0]).toHaveLength(1); // exactly one push in that batch
    expect(db._insertedDeliveries).toHaveLength(1); // exactly one delivery logged
    expect(db._insertedDeliveries[0]).toMatchObject({ device_id: 'device-1', kind: 'digest' });
    // All 4 queued rows are cleared by the one merged send.
    expect(db._deletedDigestQueueKeys).toHaveLength(4);

    // The merged body actually mentions every category, not just one.
    const body = (sendSpy.mock.calls[0]?.[0] as unknown as Array<{ body: string }>)[0]?.body ?? '';
    expect(body).toMatch(/new song/);
    expect(body).toMatch(/merch restock/);
    expect(body).toMatch(/relationship update/);
    expect(body).toMatch(/award update/);
    expect(body).toMatch(/Manage notifications/);
  });

  it('a device with rows due under BOTH daily and weekly gets two separate pushes, not merged together', async () => {
    const now = new Date('2026-01-16T20:00:00Z'); // Friday, 12:00 PST
    const db = makeFakeDb({
      digestQueue: [
        { device_id: 'device-1', event_id: 'evt-1', cadence: 'daily', category: 'song_drop', scheduled_for: '2026-01-16T17:00:00Z' },
        { device_id: 'device-1', event_id: 'evt-2', cadence: 'weekly', category: 'fan_merch', scheduled_for: '2026-01-16T17:00:00Z' },
      ],
      devices: [device()],
      events: [
        { id: 'evt-1', title: 'New song' },
        { id: 'evt-2', title: 'Fan merch' },
      ],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([{ ok: true, deviceId: 'device-1' }]);

    const result = await dispatchDueDigests(db, now);
    expect(result.digestsSent).toBe(2);
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it('holds (does not drop) a digest whose device local time is outside the 8am-9pm send window', async () => {
    const now = new Date('2026-01-15T10:00:00Z'); // 02:00 PST — before send window
    const db = makeFakeDb({
      digestQueue: [
        { device_id: 'device-1', event_id: 'evt-1', cadence: 'daily', category: 'song_drop', scheduled_for: '2026-01-15T08:00:00Z' },
      ],
      devices: [device()],
      events: [{ id: 'evt-1', title: 'New song' }],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchDueDigests(db, now);
    expect(result.digestsSent).toBe(0);
    expect(result.digestsHeldOutsideSendWindow).toBe(1);
    expect(sendSpy).not.toHaveBeenCalled();
    // Rows are NOT cleared — they stay queued for the next tick.
    expect(db._deletedDigestQueueKeys).toHaveLength(0);
  });

  it('skips a master-off device without sending or clearing its queue', async () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const db = makeFakeDb({
      digestQueue: [
        { device_id: 'device-1', event_id: 'evt-1', cadence: 'daily', category: 'song_drop', scheduled_for: '2026-01-15T17:00:00Z' },
      ],
      devices: [device({ master_enabled: false })],
      events: [{ id: 'evt-1', title: 'New song' }],
    });
    const sendSpy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await dispatchDueDigests(db, now);
    expect(result.digestsSkippedMasterOff).toBe(1);
    expect(sendSpy).not.toHaveBeenCalled();
  });
});

describe('enqueueForDigest', () => {
  it('computes scheduled_for via nextDigestOccurrence and upserts idempotently', async () => {
    const db = makeFakeDb({ digestQueue: [], devices: [], events: [] });
    await enqueueForDigest(db, {
      deviceId: 'device-1',
      eventId: 'evt-1',
      category: 'song_drop',
      cadence: 'daily',
      tz: 'America/Los_Angeles',
      digestHour: 9,
      now: new Date('2026-01-15T16:00:00Z'),
    });
    expect(db._upsertedDigestQueue).toHaveLength(1);
    expect(db._upsertedDigestQueue[0]).toMatchObject({
      device_id: 'device-1',
      event_id: 'evt-1',
      cadence: 'daily',
      category: 'song_drop',
      scheduled_for: '2026-01-15T17:00:00.000Z',
    });
  });
});
