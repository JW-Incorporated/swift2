import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchDueCountdowns, dispatchFunNotifications } from './notification-fun';
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

function baseTables(): Record<string, Row[]> {
  return {
    ops_switches: [{ name: 'PUSH_FREEZE', enabled: false }],
    devices: [device],
    deliveries: [],
  };
}

describe('fun post-send persistence failures', () => {
  it('freezes after one on-this-day push when its delivery log cannot be written', async () => {
    const tables: Record<string, Row[]> = {
      ...baseTables(),
      notification_prefs: [
        { device_id: 'device-1', category: 'on_this_day', cadence: 'daily' },
      ],
      lyrics: [],
      on_this_day: [
        {
          id: 1,
          month: 10,
          day: 15,
          year: 2010,
          text: 'Speak Now era moment',
          deep_link: null,
        },
      ],
    };
    const db = makeReproDb(tables, { insert: new Set(['deliveries']) });
    const fetchMock = acceptPushes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const results = [];

    for (let tick = 0; tick < 8; tick++) {
      results.push(await dispatchFunNotifications(db, new Date(START + tick * 15 * 60 * 1000)));
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({
      onThisDaySent: 1,
      freezeEngaged: true,
      halted: true,
    });
    expect(tables['ops_switches']).toContainEqual(
      expect.objectContaining({ name: 'PUSH_FREEZE', enabled: true }),
    );
  });

  it('halts the lyric pass when either post-send record fails', async () => {
    const tables = {
      ...baseTables(),
      notification_prefs: [
        { device_id: 'device-1', category: 'lyric_of_day', cadence: 'daily' },
      ],
      lyrics: [
        {
          id: 1,
          slug: 'song',
          song: 'Song',
          album: 'Album',
          lyric: 'Short verified line',
          verified: true,
        },
      ],
      on_this_day: [],
      lyric_history: [],
    };
    const db = makeReproDb(tables, { insert: new Set(['deliveries']) });
    acceptPushes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await dispatchFunNotifications(db, new Date(START));

    expect(result).toMatchObject({ lyricsSent: 1, freezeEngaged: true, halted: true });
    expect(result.errors).toContain('lyric delivery log failed: simulated deliveries insert failure');
  });

  it('freezes after one countdown when both sent marker and delivery log writes fail', async () => {
    const tables = {
      ...baseTables(),
      events: [{ id: 'drop-1', title: 'Album' }],
      countdown_sends: [
        {
          device_id: 'device-1',
          event_id: 'drop-1',
          milestone: 't_minus_1d',
          scheduled_for: '2026-10-15T16:00:00.000Z',
          sent_at: null,
        },
      ],
    };
    const db = makeReproDb(tables, {
      update: new Set(['countdown_sends']),
      insert: new Set(['deliveries']),
    });
    const fetchMock = acceptPushes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const results = [];

    for (let tick = 0; tick < 4; tick++) {
      results.push(await dispatchDueCountdowns(db, new Date(START + tick * 15 * 60 * 1000)));
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({ sent: 1, freezeEngaged: true, halted: true });
    expect(results[0]?.errors).toEqual(
      expect.arrayContaining([
        'countdown sent marker failed: simulated countdown_sends update failure',
        'countdown delivery log failed: simulated deliveries insert failure',
      ]),
    );
  });
});
