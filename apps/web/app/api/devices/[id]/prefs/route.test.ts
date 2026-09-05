import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, PUT, validatePrefsUpdate } from './route';

const DEVICE_A = '11111111-1111-4111-8111-111111111111';

function get(id: string, ip = '10.1.0.1'): Promise<Response> {
  return GET(
    new Request(`http://localhost/api/devices/${id}/prefs`, {
      headers: { 'x-forwarded-for': ip },
    }),
    { params: Promise.resolve({ id }) },
  );
}

function put(id: string, body: unknown, ip = '10.1.0.1'): Promise<Response> {
  return PUT(
    new Request(`http://localhost/api/devices/${id}/prefs`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('validatePrefsUpdate', () => {
  it('accepts an empty body (no-op update)', () => {
    const result = validatePrefsUpdate({});
    expect(result.ok).toBe(true);
  });

  it('accepts a settings-only patch', () => {
    const result = validatePrefsUpdate({ settings: { masterEnabled: false } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.settings?.masterEnabled).toBe(false);
  });

  it('rejects a non-boolean masterEnabled', () => {
    const result = validatePrefsUpdate({ settings: { masterEnabled: 'nope' } });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-numeric dailyCap', () => {
    const result = validatePrefsUpdate({ settings: { dailyCap: 'three' } });
    expect(result.ok).toBe(false);
  });

  it('accepts a valid steady-category prefs entry', () => {
    const result = validatePrefsUpdate({ prefs: [{ category: 'song_drop', cadence: 'daily' }] });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.input.prefs).toEqual([{ category: 'song_drop', cadence: 'daily' }]);
  });

  it('accepts a valid fun-category prefs entry (monthly)', () => {
    const result = validatePrefsUpdate({
      prefs: [{ category: 'lyric_of_day', cadence: 'monthly' }],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects instant cadence for a fun category', () => {
    const result = validatePrefsUpdate({
      prefs: [{ category: 'lyric_of_day', cadence: 'instant' }],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects monthly cadence for a steady category', () => {
    const result = validatePrefsUpdate({ prefs: [{ category: 'song_drop', cadence: 'monthly' }] });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown category', () => {
    const result = validatePrefsUpdate({
      prefs: [{ category: 'not_a_category', cadence: 'daily' }],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-object body', () => {
    const result = validatePrefsUpdate('nope');
    expect(result.ok).toBe(false);
  });
});

describe('GET /api/devices/:id/prefs', () => {
  it('rejects a non-UUID id with 400', async () => {
    const res = await get('not-a-uuid', '10.2.1.1');
    expect(res.status).toBe(400);
  });

  it('degrades to 503 when the service-role key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await get(DEVICE_A, '10.2.1.2');
    expect(res.status).toBe(503);
  });

  it('rate-limits after the per-IP burst window', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const ip = '10.2.1.3';
    for (let i = 0; i < 40; i++) {
      const res = await get(DEVICE_A, ip);
      expect(res.status).toBe(503); // unconfigured env, but past validation
    }
    const limited = await get(DEVICE_A, ip);
    expect(limited.status).toBe(429);
  });

  it('returns 404 when the device does not exist', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const fromMock = vi.fn().mockReturnValue({ select });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ from: fromMock }),
    }));
    vi.resetModules();
    const mod = await import('./route');
    const res = await mod.GET(
      new Request(`http://localhost/api/devices/${DEVICE_A}/prefs`, {
        headers: { 'x-forwarded-for': '10.2.1.4' },
      }),
      { params: Promise.resolve({ id: DEVICE_A }) },
    );
    expect(res.status).toBe(404);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('synthesizes default cadences for categories with no persisted row', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const deviceMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: DEVICE_A,
        master_enabled: true,
        snooze_until: null,
        daily_cap: 3,
        quiet_start: 22,
        quiet_end: 8,
        digest_hour: 9,
      },
      error: null,
    });
    const deviceEq = vi.fn().mockReturnValue({ maybeSingle: deviceMaybeSingle });
    const deviceSelect = vi.fn().mockReturnValue({ eq: deviceEq });

    // notification_prefs: only one persisted row (song_drop -> daily), the
    // rest of the categories should fall back to DEFAULT_CADENCE.
    const prefsEq = vi.fn().mockResolvedValue({
      data: [{ device_id: DEVICE_A, category: 'song_drop', cadence: 'daily' }],
      error: null,
    });
    const prefsSelect = vi.fn().mockReturnValue({ eq: prefsEq });

    const fromMock = vi.fn((table: string) => {
      if (table === 'devices') return { select: deviceSelect };
      if (table === 'notification_prefs') return { select: prefsSelect };
      throw new Error(`unexpected table ${table}`);
    });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ from: fromMock }),
    }));
    vi.resetModules();
    const mod = await import('./route');
    const res = await mod.GET(
      new Request(`http://localhost/api/devices/${DEVICE_A}/prefs`, {
        headers: { 'x-forwarded-for': '10.2.1.5' },
      }),
      { params: Promise.resolve({ id: DEVICE_A }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings.masterEnabled).toBe(true);
    const songDrop = json.prefs.find((p: { category: string }) => p.category === 'song_drop');
    expect(songDrop.cadence).toBe('daily'); // persisted, not the instant default
    const awardNews = json.prefs.find((p: { category: string }) => p.category === 'award_news');
    expect(awardNews.cadence).toBe('weekly'); // spec §4 default, no persisted row
    const lyric = json.prefs.find((p: { category: string }) => p.category === 'lyric_of_day');
    expect(lyric.cadence).toBe('off'); // fun category default
    vi.doUnmock('@supabase/supabase-js');
  });
});

describe('PUT /api/devices/:id/prefs', () => {
  it('rejects an invalid body with 400 and never reaches Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const res = await put(
      DEVICE_A,
      { prefs: [{ category: 'song_drop', cadence: 'monthly' }] },
      '10.2.1.6',
    );
    expect(res.status).toBe(400);
  });

  it('degrades to 503 when the service-role key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await put(DEVICE_A, { settings: { masterEnabled: false } }, '10.2.1.7');
    expect(res.status).toBe(503);
  });

  it('writes a settings patch and a prefs upsert, then returns the round-tripped state', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    const deviceMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: DEVICE_A,
        master_enabled: false,
        snooze_until: null,
        daily_cap: 3,
        quiet_start: 22,
        quiet_end: 8,
        digest_hour: 9,
      },
      error: null,
    });
    const deviceEq = vi.fn().mockReturnValue({ maybeSingle: deviceMaybeSingle });
    const deviceSelect = vi.fn().mockReturnValue({ eq: deviceEq });

    const prefsEq = vi.fn().mockResolvedValue({
      data: [{ device_id: DEVICE_A, category: 'song_drop', cadence: 'weekly' }],
      error: null,
    });
    const prefsSelect = vi.fn().mockReturnValue({ eq: prefsEq });

    const fromMock = vi.fn((table: string) => {
      if (table === 'devices') return { update: updateMock, select: deviceSelect };
      if (table === 'notification_prefs') return { upsert: upsertMock, select: prefsSelect };
      throw new Error(`unexpected table ${table}`);
    });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ from: fromMock }),
    }));
    vi.resetModules();
    const mod = await import('./route');
    const res = await mod.PUT(
      new Request(`http://localhost/api/devices/${DEVICE_A}/prefs`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.2.1.8' },
        body: JSON.stringify({
          settings: { masterEnabled: false },
          prefs: [{ category: 'song_drop', cadence: 'weekly' }],
        }),
      }),
      { params: Promise.resolve({ id: DEVICE_A }) },
    );
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ master_enabled: false }));
    expect(upsertMock).toHaveBeenCalledWith(
      [expect.objectContaining({ device_id: DEVICE_A, category: 'song_drop', cadence: 'weekly' })],
      { onConflict: 'device_id,category' },
    );
    const json = await res.json();
    expect(json.settings.masterEnabled).toBe(false);
    const songDrop = json.prefs.find((p: { category: string }) => p.category === 'song_drop');
    expect(songDrop.cadence).toBe('weekly');
    vi.doUnmock('@supabase/supabase-js');
  });

  it('returns 404 when the device does not exist', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEq });
    const fromMock = vi.fn().mockReturnValue({ select, update: updateMock });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ from: fromMock }),
    }));
    vi.resetModules();
    const mod = await import('./route');
    const res = await mod.PUT(
      new Request(`http://localhost/api/devices/${DEVICE_A}/prefs`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.2.1.9' },
        body: JSON.stringify({ settings: { masterEnabled: false } }),
      }),
      { params: Promise.resolve({ id: DEVICE_A }) },
    );
    expect(res.status).toBe(404);
    vi.doUnmock('@supabase/supabase-js');
  });
});
