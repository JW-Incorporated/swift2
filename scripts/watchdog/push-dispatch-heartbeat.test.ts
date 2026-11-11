import { describe, expect, it, vi } from 'vitest';
import { checkPushDispatchHeartbeat, thresholdFromScheduler } from './push-dispatch-heartbeat.mjs';

const NOW = new Date('2026-10-15T20:00:00.000Z');
const schedule = { intervalMinutes: 15, thresholdMinutes: 45 };
const env = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture-key' };

function response(rows: unknown, ok = true, status = 200) {
  return { ok, status, json: vi.fn().mockResolvedValue(rows) } as unknown as Response;
}

function invalidJsonResponse() {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
  } as unknown as Response;
}

describe('push dispatch heartbeat watchdog', () => {
  it('uses three times the configured 15-minute dispatch interval', () => {
    expect(
      thresholdFromScheduler({
        crons: [{ path: '/api/notifications/dispatch', schedule: '*/15 * * * *' }],
      }),
    ).toEqual({ intervalMinutes: 15, thresholdMinutes: 45 });
  });

  it('applies the 30-minute threshold floor', () => {
    expect(
      thresholdFromScheduler({
        crons: [{ path: '/api/notifications/dispatch', schedule: '*/5 * * * *' }],
      }),
    ).toEqual({ intervalMinutes: 5, thresholdMinutes: 30 });
  });

  it('reports not live yet when PUSH_FREEZE exists but the heartbeat has never been written', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ name: 'PUSH_FREEZE' }]));
    const result = await checkPushDispatchHeartbeat({
      fetchImpl,
      env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(0);
    expect(result.line).toBe('push-dispatch-heartbeat: NOT LIVE YET — no heartbeat row; no alert.');
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://example.invalid/rest/v1/ops_switches?select=name&name=eq.PUSH_FREEZE&limit=1',
      expect.objectContaining({
        headers: { apikey: 'fixture-key', Authorization: 'Bearer fixture-key' },
      }),
    );
  });

  it('alerts unknown when neither the heartbeat nor seeded PUSH_FREEZE row exists', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response([])), env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('watchdog may be reading the wrong database');
  });

  it('reports a fresh heartbeat', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response([{ updated_at: '2026-10-15T19:30:00.000Z' }])),
      env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(0);
    expect(result.line).toBe('push-dispatch-heartbeat: OK — last tick 2026-10-15T19:30:00.000Z (30.0m ago).');
  });

  it('alerts when the heartbeat is older than three cron intervals', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response([{ updated_at: '2026-10-15T19:14:00.000Z' }])),
      env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(1);
    expect(result.line).toBe(
      'push-dispatch-heartbeat: STALE — last tick 2026-10-15T19:14:00.000Z (46.0m ago; threshold 45m).',
    );
    expect(result.body).toContain('Last authorized tick: **2026-10-15T19:14:00.000Z**');
  });

  it('raises a distinct unknown alert on a database read error', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response(null, false, 503)), env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toBe('push-dispatch-heartbeat: UNKNOWN — database returned HTTP 503.');
    expect(result.body).toContain('status is **unknown**');
  });

  it('reports unknown when the database request throws', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockRejectedValue(new Error('network down')), env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('database request failed (network down)');
  });

  it('reports unknown when the database body is not valid JSON', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(invalidJsonResponse()), env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('database response was not valid JSON');
  });

  it('reports unknown when the database body is not an array', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response({ updated_at: '2026-10-15T19:30:00.000Z' })),
      env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('database response was not an array');
  });

  it('reports unknown when the heartbeat timestamp is invalid', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response([{ updated_at: 'not-a-date' }])), env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('heartbeat row has an invalid updated_at');
  });

  it('reports unknown when the heartbeat is more than five minutes in the future', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response([{ updated_at: '2026-10-15T20:06:00.000Z' }])),
      env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('heartbeat updated_at is in the future');
  });

  it('reports unknown when database credentials are missing', async () => {
    const result = await checkPushDispatchHeartbeat({ env: {}, now: NOW, ...schedule });

    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured');
  });
});
