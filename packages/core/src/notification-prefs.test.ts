import { describe, expect, it, vi } from 'vitest';
import { getDevicePrefs, updateDevicePrefs } from './notification-prefs';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

function fakeDevicesRow() {
  return {
    id: DEVICE_ID,
    master_enabled: true,
    snooze_until: null,
    daily_cap: 3,
    quiet_start: 22,
    quiet_end: 8,
    digest_hour: 9,
  };
}

describe('getDevicePrefs', () => {
  it('returns null when the device does not exist', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const db = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    const result = await getDevicePrefs(db, DEVICE_ID);
    expect(result).toBeNull();
  });

  it('synthesizes defaults for every category with no persisted row', async () => {
    const deviceMaybeSingle = vi.fn().mockResolvedValue({ data: fakeDevicesRow(), error: null });
    const deviceEq = vi.fn().mockReturnValue({ maybeSingle: deviceMaybeSingle });
    const deviceSelect = vi.fn().mockReturnValue({ eq: deviceEq });

    const prefsEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const prefsSelect = vi.fn().mockReturnValue({ eq: prefsEq });

    const db = {
      from: vi.fn((table: string) =>
        table === 'devices' ? { select: deviceSelect } : { select: prefsSelect },
      ),
    } as unknown as SupabaseClient;

    const result = await getDevicePrefs(db, DEVICE_ID);
    expect(result).not.toBeNull();
    expect(result?.prefs).toHaveLength(13); // 10 steady + 3 fun categories
    const songDrop = result?.prefs.find((p) => p.category === 'song_drop');
    expect(songDrop?.cadence).toBe('instant'); // spec §4 default
    const fanMerch = result?.prefs.find((p) => p.category === 'fan_merch');
    expect(fanMerch?.cadence).toBe('weekly');
    const onThisDay = result?.prefs.find((p) => p.category === 'on_this_day');
    expect(onThisDay?.cadence).toBe('off');
  });

  it('prefers a persisted cadence over the category default', async () => {
    const deviceMaybeSingle = vi.fn().mockResolvedValue({ data: fakeDevicesRow(), error: null });
    const deviceEq = vi.fn().mockReturnValue({ maybeSingle: deviceMaybeSingle });
    const deviceSelect = vi.fn().mockReturnValue({ eq: deviceEq });

    const prefsEq = vi.fn().mockResolvedValue({
      data: [{ device_id: DEVICE_ID, category: 'song_drop', cadence: 'off' }],
      error: null,
    });
    const prefsSelect = vi.fn().mockReturnValue({ eq: prefsEq });

    const db = {
      from: vi.fn((table: string) =>
        table === 'devices' ? { select: deviceSelect } : { select: prefsSelect },
      ),
    } as unknown as SupabaseClient;

    const result = await getDevicePrefs(db, DEVICE_ID);
    const songDrop = result?.prefs.find((p) => p.category === 'song_drop');
    expect(songDrop?.cadence).toBe('off'); // persisted row wins over the 'instant' default
  });

  it('throws on a Supabase error rather than swallowing it', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const db = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    await expect(getDevicePrefs(db, DEVICE_ID)).rejects.toThrow('boom');
  });
});

describe('updateDevicePrefs', () => {
  it('updates devices columns and upserts prefs rows by (device_id, category)', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    const deviceMaybeSingle = vi.fn().mockResolvedValue({
      data: { ...fakeDevicesRow(), master_enabled: false },
      error: null,
    });
    const deviceEq = vi.fn().mockReturnValue({ maybeSingle: deviceMaybeSingle });
    const deviceSelect = vi.fn().mockReturnValue({ eq: deviceEq });

    const prefsEq = vi.fn().mockResolvedValue({
      data: [{ device_id: DEVICE_ID, category: 'song_drop', cadence: 'weekly' }],
      error: null,
    });
    const prefsSelect = vi.fn().mockReturnValue({ eq: prefsEq });

    const db = {
      from: vi.fn((table: string) =>
        table === 'devices'
          ? { update: updateMock, select: deviceSelect }
          : { upsert: upsertMock, select: prefsSelect },
      ),
    } as unknown as SupabaseClient;

    const result = await updateDevicePrefs(db, DEVICE_ID, {
      settings: { masterEnabled: false },
      prefs: [{ category: 'song_drop', cadence: 'weekly' }],
    });

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ master_enabled: false }));
    expect(upsertMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          device_id: DEVICE_ID,
          category: 'song_drop',
          cadence: 'weekly',
        }),
      ],
      { onConflict: 'device_id,category' },
    );
    expect(result?.settings.masterEnabled).toBe(false);
  });

  it('skips the devices update call when settings is empty', async () => {
    const updateMock = vi.fn();
    const deviceMaybeSingle = vi.fn().mockResolvedValue({ data: fakeDevicesRow(), error: null });
    const deviceEq = vi.fn().mockReturnValue({ maybeSingle: deviceMaybeSingle });
    const deviceSelect = vi.fn().mockReturnValue({ eq: deviceEq });
    const prefsEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const prefsSelect = vi.fn().mockReturnValue({ eq: prefsEq });

    const db = {
      from: vi.fn((table: string) =>
        table === 'devices'
          ? { update: updateMock, select: deviceSelect }
          : { select: prefsSelect },
      ),
    } as unknown as SupabaseClient;

    await updateDevicePrefs(db, DEVICE_ID, {});
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('surfaces a settings-update error', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: { message: 'update failed' } });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq });
    const db = {
      from: vi.fn().mockReturnValue({ update: updateMock }),
    } as unknown as SupabaseClient;

    await expect(
      updateDevicePrefs(db, DEVICE_ID, { settings: { masterEnabled: true } }),
    ).rejects.toThrow('update failed');
  });

  it('surfaces a prefs-upsert error', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'upsert failed' } });
    const db = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    } as unknown as SupabaseClient;

    await expect(
      updateDevicePrefs(db, DEVICE_ID, { prefs: [{ category: 'song_drop', cadence: 'daily' }] }),
    ).rejects.toThrow('upsert failed');
  });
});
