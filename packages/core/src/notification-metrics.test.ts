import { describe, expect, it } from 'vitest';
import {
  computeMetrics,
  computeMuteRateByCategory,
  computeOpenRateByCategory,
  markDeliveryOpened,
  MUTE_RATE_FLAG_THRESHOLD,
  type DeliveryMetricsRow,
  type DeviceMetricsRow,
  type PrefUpdateRow,
} from './notification-metrics';

describe('computeOpenRateByCategory', () => {
  it('computes an open rate per category, omitting categories never sent', () => {
    const deliveries: DeliveryMetricsRow[] = [
      {
        deviceId: 'd1',
        category: 'song_drop',
        sentAt: '2026-01-01T00:00:00Z',
        openedAt: '2026-01-01T00:05:00Z',
      },
      { deviceId: 'd2', category: 'song_drop', sentAt: '2026-01-01T00:00:00Z', openedAt: null },
      {
        deviceId: 'd1',
        category: 'official_merch',
        sentAt: '2026-01-01T00:00:00Z',
        openedAt: null,
      },
    ];
    const result = computeOpenRateByCategory(deliveries);
    expect(result).toEqual([
      { category: 'official_merch', sent: 1, opened: 0, openRate: 0 },
      { category: 'song_drop', sent: 2, opened: 1, openRate: 0.5 },
    ]);
  });

  it('never fabricates a rate for a category with zero deliveries', () => {
    expect(computeOpenRateByCategory([])).toEqual([]);
  });
});

describe('computeMuteRateByCategory', () => {
  it('flags a category whose mute-within-1h rate exceeds the threshold', () => {
    const deliveries: DeliveryMetricsRow[] = Array.from({ length: 100 }, (_, i) => ({
      deviceId: `d${i}`,
      category: 'song_drop',
      sentAt: '2026-01-01T00:00:00Z',
      openedAt: null,
    }));
    // 3 of 100 devices mute within the hour — 3% > 2% threshold.
    const prefUpdates: PrefUpdateRow[] = [
      { deviceId: 'd0', category: 'song_drop', cadence: 'off', updatedAt: '2026-01-01T00:10:00Z' },
      { deviceId: 'd1', category: 'song_drop', cadence: 'off', updatedAt: '2026-01-01T00:20:00Z' },
      { deviceId: 'd2', category: 'song_drop', cadence: 'off', updatedAt: '2026-01-01T00:59:00Z' },
    ];
    const result = computeMuteRateByCategory(deliveries, prefUpdates);
    expect(result).toEqual([
      { category: 'song_drop', sent: 100, mutedWithin1h: 3, muteRate: 0.03, flagged: true },
    ]);
    expect(0.03).toBeGreaterThan(MUTE_RATE_FLAG_THRESHOLD);
  });

  it('does not flag a category at or under the 2% threshold', () => {
    const deliveries: DeliveryMetricsRow[] = Array.from({ length: 100 }, (_, i) => ({
      deviceId: `d${i}`,
      category: 'official_merch',
      sentAt: '2026-01-01T00:00:00Z',
      openedAt: null,
    }));
    const prefUpdates: PrefUpdateRow[] = [
      {
        deviceId: 'd0',
        category: 'official_merch',
        cadence: 'off',
        updatedAt: '2026-01-01T00:10:00Z',
      },
      {
        deviceId: 'd1',
        category: 'official_merch',
        cadence: 'off',
        updatedAt: '2026-01-01T00:10:00Z',
      },
    ];
    const result = computeMuteRateByCategory(deliveries, prefUpdates);
    expect(result[0]).toMatchObject({ muteRate: 0.02, flagged: false });
  });

  it('a mute that happened MORE than 1h after the send does not count', () => {
    const deliveries: DeliveryMetricsRow[] = [
      { deviceId: 'd1', category: 'song_drop', sentAt: '2026-01-01T00:00:00Z', openedAt: null },
    ];
    const prefUpdates: PrefUpdateRow[] = [
      { deviceId: 'd1', category: 'song_drop', cadence: 'off', updatedAt: '2026-01-01T02:00:00Z' },
    ];
    const result = computeMuteRateByCategory(deliveries, prefUpdates);
    expect(result[0]).toMatchObject({ mutedWithin1h: 0, muteRate: 0 });
  });

  it('a mute that happened BEFORE the send does not count (pre-existing off, not a reaction)', () => {
    const deliveries: DeliveryMetricsRow[] = [
      { deviceId: 'd1', category: 'song_drop', sentAt: '2026-01-01T00:00:00Z', openedAt: null },
    ];
    const prefUpdates: PrefUpdateRow[] = [
      { deviceId: 'd1', category: 'song_drop', cadence: 'off', updatedAt: '2025-12-31T23:00:00Z' },
    ];
    const result = computeMuteRateByCategory(deliveries, prefUpdates);
    expect(result[0]).toMatchObject({ mutedWithin1h: 0 });
  });

  it('a mute for a DIFFERENT device never counts against this one', () => {
    const deliveries: DeliveryMetricsRow[] = [
      { deviceId: 'd1', category: 'song_drop', sentAt: '2026-01-01T00:00:00Z', openedAt: null },
    ];
    const prefUpdates: PrefUpdateRow[] = [
      { deviceId: 'd2', category: 'song_drop', cadence: 'off', updatedAt: '2026-01-01T00:10:00Z' },
    ];
    const result = computeMuteRateByCategory(deliveries, prefUpdates);
    expect(result[0]).toMatchObject({ mutedWithin1h: 0 });
  });
});

describe('computeMetrics', () => {
  it('assembles the full payload, reporting hasData=false for zero devices', () => {
    const result = computeMetrics([], [], [], new Date('2026-01-01T00:00:00Z'));
    expect(result.hasData).toBe(false);
    expect(result.optInRate).toBeNull();
    expect(result.masterOffRate).toBeNull();
    expect(result.flaggedCategories).toEqual([]);
  });

  it('computes optInRate and masterOffRate from device rows', () => {
    const devices: DeviceMetricsRow[] = [
      { id: 'd1', masterEnabled: true, pushToken: 'tok-1' },
      { id: 'd2', masterEnabled: false, pushToken: 'tok-2' },
      { id: 'd3', masterEnabled: true, pushToken: null },
    ];
    const result = computeMetrics(devices, [], [], new Date('2026-01-01T00:00:00Z'));
    expect(result.totalDevices).toBe(3);
    expect(result.devicesWithToken).toBe(2);
    expect(result.optInRate).toBeCloseTo(2 / 3);
    expect(result.devicesMasterOff).toBe(1);
    expect(result.masterOffRate).toBeCloseTo(1 / 3);
    expect(result.hasData).toBe(true);
  });

  it('surfaces flaggedCategories for any category over the mute threshold', () => {
    const devices: DeviceMetricsRow[] = Array.from({ length: 100 }, (_, i) => ({
      id: `d${i}`,
      masterEnabled: true,
      pushToken: 'tok',
    }));
    const deliveries: DeliveryMetricsRow[] = Array.from({ length: 100 }, (_, i) => ({
      deviceId: `d${i}`,
      category: 'award_news',
      sentAt: '2026-01-01T00:00:00Z',
      openedAt: null,
    }));
    const prefUpdates: PrefUpdateRow[] = Array.from({ length: 5 }, (_, i) => ({
      deviceId: `d${i}`,
      category: 'award_news',
      cadence: 'off',
      updatedAt: '2026-01-01T00:05:00Z',
    }));
    const result = computeMetrics(
      devices,
      deliveries,
      prefUpdates,
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(result.flaggedCategories).toEqual(['award_news']);
  });
});

describe('markDeliveryOpened', () => {
  function makeFakeDeliveriesDb(initial: { delivery_token: string; opened_at: string | null }[]) {
    const rows = initial.map((r) => ({ ...r, id: r.delivery_token }));
    return {
      from: (table: string) => {
        if (table !== 'deliveries') throw new Error(`unexpected table ${table}`);
        let matchToken: string | null = null;
        let pendingUpdate: { opened_at: string } | null = null;
        const api: Record<string, (...args: unknown[]) => unknown> = {};
        api.select = () => api;
        api.eq = ((col: string, val: unknown) => {
          if (col === 'delivery_token') matchToken = val as string;
          return api;
        }) as (...args: unknown[]) => unknown;
        api.is = () => {
          if (pendingUpdate) {
            const row = rows.find((r) => r.delivery_token === matchToken);
            if (row && !row.opened_at) row.opened_at = pendingUpdate.opened_at;
          }
          return Promise.resolve({ error: null });
        };
        api.maybeSingle = () => {
          const row = rows.find((r) => r.delivery_token === matchToken) ?? null;
          return Promise.resolve({ data: row, error: null });
        };
        api.update = ((patch: { opened_at: string }) => {
          pendingUpdate = patch;
          return api;
        }) as (...args: unknown[]) => unknown;
        return api;
      },
      _rows: rows,
    };
  }

  it('records the open and returns alreadyOpened=false the first time', async () => {
    const db = makeFakeDeliveriesDb([{ delivery_token: 'tok-1', opened_at: null }]);
    const result = await markDeliveryOpened(
      db as unknown as import('@supabase/supabase-js').SupabaseClient,
      'tok-1',
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(result).toEqual({ ok: true, alreadyOpened: false });
    expect(db._rows[0]?.opened_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('is idempotent: a second call reports alreadyOpened=true and does not overwrite the timestamp', async () => {
    const db = makeFakeDeliveriesDb([
      { delivery_token: 'tok-1', opened_at: '2026-01-01T00:00:00.000Z' },
    ]);
    const result = await markDeliveryOpened(
      db as unknown as import('@supabase/supabase-js').SupabaseClient,
      'tok-1',
      new Date('2026-01-02T00:00:00Z'),
    );
    expect(result).toEqual({ ok: true, alreadyOpened: true });
    expect(db._rows[0]?.opened_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('reports not_found for an unknown delivery token', async () => {
    const db = makeFakeDeliveriesDb([]);
    const result = await markDeliveryOpened(
      db as unknown as import('@supabase/supabase-js').SupabaseClient,
      'unknown-token',
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });
});
