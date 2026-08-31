import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isCooldownEligible, runCooldownPass } from './notification-cooldown';
import * as sender from './notification-sender';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isCooldownEligible (pure gates)', () => {
  const now = new Date('2026-09-30T00:00:00Z');

  it('is never eligible without at least one instant pref', () => {
    expect(
      isCooldownEligible(false, [{ sentAt: '2026-01-01T00:00:00Z', openedAt: null }], now),
    ).toBe(false);
  });

  it('is not eligible for a device with no delivery history older than 30 days (fresh install)', () => {
    expect(
      isCooldownEligible(true, [{ sentAt: '2026-09-29T00:00:00Z', openedAt: null }], now),
    ).toBe(false);
  });

  it('is not eligible when the device opened a notification within the last 30 days', () => {
    expect(
      isCooldownEligible(
        true,
        [
          { sentAt: '2026-01-01T00:00:00Z', openedAt: null },
          { sentAt: '2026-09-20T00:00:00Z', openedAt: '2026-09-25T00:00:00Z' },
        ],
        now,
      ),
    ).toBe(false);
  });

  it('ACCEPTANCE: a seeded stale device (old deliveries, zero opens in 30d) is eligible', () => {
    expect(
      isCooldownEligible(
        true,
        [
          { sentAt: '2026-08-01T00:00:00Z', openedAt: null },
          { sentAt: '2026-08-15T00:00:00Z', openedAt: null },
        ],
        now,
      ),
    ).toBe(true);
  });

  it('an open exactly at the 30-day cutoff still counts as recent (not eligible)', () => {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isCooldownEligible(
        true,
        [
          { sentAt: '2026-01-01T00:00:00Z', openedAt: null },
          { sentAt: cutoff, openedAt: cutoff },
        ],
        now,
      ),
    ).toBe(false);
  });
});

function makeFakeDb(fixture: {
  prefs: Array<{ device_id: string; category: string; cadence: string }>;
  devices: Array<{ id: string; push_token: string | null; master_enabled: boolean }>;
  deliveries: Array<{ device_id: string; sent_at: string; opened_at: string | null }>;
}) {
  const prefUpdates: Array<{ device_id: string }> = [];
  const insertedDeliveries: Array<Record<string, unknown>> = [];

  function queryBuilder(table: string) {
    const state: { filters: Array<(row: Record<string, unknown>) => boolean> } = { filters: [] };
    const api: Record<string, (...args: unknown[]) => unknown> = {};
    api.select = (() => api) as (...args: unknown[]) => unknown;
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
        return fixture.prefs as unknown as Array<Record<string, unknown>>;
      if (table === 'devices') return fixture.devices as unknown as Array<Record<string, unknown>>;
      if (table === 'deliveries')
        return fixture.deliveries as unknown as Array<Record<string, unknown>>;
      throw new Error(`unexpected table ${table}`);
    }

    function runQuery() {
      const rows = source().filter((row) => state.filters.every((f) => f(row)));
      return { data: rows, error: null };
    }

    api.insert = ((row: Record<string, unknown>) => {
      if (table === 'deliveries') insertedDeliveries.push(row);
      return Promise.resolve({ data: null, error: null });
    }) as (...args: unknown[]) => unknown;

    api.update = ((patch: Record<string, unknown>) => ({
      eq: (col1: string, val1: unknown) => ({
        eq: (col2: string) => {
          if (
            table === 'notification_prefs' &&
            col1 === 'device_id' &&
            col2 === 'cadence' &&
            'cadence' in patch
          ) {
            prefUpdates.push({ device_id: val1 as string });
          }
          return Promise.resolve({ data: null, error: null });
        },
      }),
    })) as (...args: unknown[]) => unknown;

    return api;
  }

  return {
    from: vi.fn((table: string) => queryBuilder(table)),
    _prefUpdates: prefUpdates,
    _insertedDeliveries: insertedDeliveries,
  } as unknown as SupabaseClient & {
    _prefUpdates: Array<{ device_id: string }>;
    _insertedDeliveries: Array<Record<string, unknown>>;
  };
}

describe('runCooldownPass', () => {
  it('ACCEPTANCE: downgrades a seeded stale device and sends exactly one notice push', async () => {
    const now = new Date('2026-09-30T00:00:00Z');
    const db = makeFakeDb({
      prefs: [{ device_id: 'stale-device', category: 'song_drop', cadence: 'instant' }],
      devices: [{ id: 'stale-device', push_token: 'token-1', master_enabled: true }],
      deliveries: [
        { device_id: 'stale-device', sent_at: '2026-08-01T00:00:00Z', opened_at: null },
        { device_id: 'stale-device', sent_at: '2026-08-15T00:00:00Z', opened_at: null },
      ],
    });
    vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([
      { ok: true, deviceId: 'stale-device', deliveryToken: 'test-token-1' },
    ]);

    const result = await runCooldownPass(db, now);

    expect(result.devicesDowngraded).toBe(1);
    expect(result.noticesSent).toBe(1);
    expect(db._prefUpdates).toEqual([{ device_id: 'stale-device' }]);
    expect(db._insertedDeliveries).toHaveLength(1);
    expect(db._insertedDeliveries[0]).toMatchObject({ device_id: 'stale-device', kind: 'fun' });
  });

  it('never downgrades an engaged device (opened a notification within 30 days)', async () => {
    const now = new Date('2026-09-30T00:00:00Z');
    const db = makeFakeDb({
      prefs: [{ device_id: 'engaged-device', category: 'song_drop', cadence: 'instant' }],
      devices: [{ id: 'engaged-device', push_token: 'token-2', master_enabled: true }],
      deliveries: [
        {
          device_id: 'engaged-device',
          sent_at: '2026-09-25T00:00:00Z',
          opened_at: '2026-09-25T00:05:00Z',
        },
      ],
    });
    const spy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([]);

    const result = await runCooldownPass(db, now);

    expect(result.devicesDowngraded).toBe(0);
    expect(result.noticesSent).toBe(0);
    expect(db._prefUpdates).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('never downgrades a fresh device with no delivery history older than 30 days', async () => {
    const now = new Date('2026-09-30T00:00:00Z');
    const db = makeFakeDb({
      prefs: [{ device_id: 'fresh-device', category: 'song_drop', cadence: 'instant' }],
      devices: [{ id: 'fresh-device', push_token: 'token-3', master_enabled: true }],
      deliveries: [{ device_id: 'fresh-device', sent_at: '2026-09-29T00:00:00Z', opened_at: null }],
    });

    const result = await runCooldownPass(db, now);

    expect(result.devicesDowngraded).toBe(0);
    expect(db._prefUpdates).toEqual([]);
  });
});
