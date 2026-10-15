import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchClownReports, dispatchDueDigests } from './notification-digest';
import { makeReproDb } from './notification-router-repro-db.test-helper';

type Row = Record<string, unknown>;

const START = Date.parse('2026-10-15T17:00:00.000Z');
const device = {
  id: 'device-1',
  push_token: 'ExponentPushToken[device-1]',
  tz: 'America/Los_Angeles',
  digest_hour: 9,
  master_enabled: true,
  platform: 'ios',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function acceptPushes(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const messages = JSON.parse(init.body as string) as unknown[];
    return new Response(
      JSON.stringify({ data: messages.map(() => ({ status: 'ok' })) }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function digestTables(): Record<string, Row[]> {
  return {
    ops_switches: [{ name: 'PUSH_FREEZE', enabled: false }],
    devices: [device],
    events: [
      {
        id: 'event-1',
        title: 'Real story',
        expires_at: '2026-11-01T00:00:00.000Z',
      },
    ],
    digest_queue: [
      {
        device_id: 'device-1',
        event_id: 'event-1',
        cadence: 'daily',
        category: 'tour_news',
        scheduled_for: '2026-10-15T16:00:00.000Z',
      },
    ],
    deliveries: [],
  };
}

describe('digest post-send persistence failures', () => {
  it('freezes and halts when the delivery ledger insert fails', async () => {
    const tables = digestTables();
    const db = makeReproDb(tables, { insert: new Set(['deliveries']) });
    acceptPushes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await dispatchDueDigests(db, new Date(START));

    expect(result).toMatchObject({ digestsSent: 1, freezeEngaged: true, halted: true });
    expect(tables.ops_switches).toContainEqual(
      expect.objectContaining({ name: 'PUSH_FREEZE', enabled: true }),
    );
  });

  it('sends only once across repeated ticks when the digest sent marker fails', async () => {
    const tables = digestTables();
    const db = makeReproDb(tables, { upsert: new Set(['digest_queue']) });
    const fetchMock = acceptPushes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const results = [];

    for (let tick = 0; tick < 6; tick++) {
      results.push(await dispatchDueDigests(db, new Date(START + tick * 15 * 60 * 1000)));
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({ digestsSent: 1, freezeEngaged: true, halted: true });
    expect(results[0]?.errors).toContain(
      'digest_queue sent marker failed: simulated digest_queue upsert failure',
    );
  });

  it('freezes and halts when a Clown Report cannot be logged', async () => {
    const tables: Record<string, Row[]> = {
      ops_switches: [{ name: 'PUSH_FREEZE', enabled: false }],
      notification_prefs: [
        { device_id: 'device-1', category: 'easter_egg', cadence: 'weekly' },
      ],
      devices: [device],
      deliveries: [],
      live_theory: [
        { claim: 'A theory', name: 'Theory', heat: 10, outcome: 'pending' },
      ],
    };
    const db = makeReproDb(tables, { insert: new Set(['deliveries']) });
    acceptPushes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await dispatchClownReports(db, new Date('2026-10-16T17:00:00.000Z'));

    expect(result).toMatchObject({ clownReportsSent: 1, freezeEngaged: true, halted: true });
  });
});
