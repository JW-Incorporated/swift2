import { describe, expect, it, vi } from 'vitest';
import { checkPushDispatchHeartbeat, thresholdFromScheduler } from './push-dispatch-heartbeat.mjs';

const NOW = new Date('2026-10-15T20:00:00.000Z');
const schedule = { intervalMinutes: 15, thresholdMinutes: 45 };
const env = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture-key' };

function response(rows: unknown, ok = true, status = 200) {
  return { ok, status, json: vi.fn().mockResolvedValue(rows) } as unknown as Response;
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

  it('reports not live yet without alerting when the key has never been written', async () => {
    const result = await checkPushDispatchHeartbeat({
      fetchImpl: vi.fn().mockResolvedValue(response([])), env, now: NOW, ...schedule,
    });

    expect(result.exitCode).toBe(0);
    expect(result.line).toBe('push-dispatch-heartbeat: NOT LIVE YET — no heartbeat row; no alert.');
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
});
