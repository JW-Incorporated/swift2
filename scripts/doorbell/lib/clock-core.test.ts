import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLOCK_LIVE } from '../../marjorie/lib/chat-inbox.mjs';
import {
  GIVE_UP_MS, clockDispatch, clockLiveFrom, clockTick, dueRows, matches, nextFires, parseCron, parseSchedule, readRemote, runsSinceRequest,
  // @ts-expect-error — plain .mjs module, no type declarations
} from './clock-core.mjs';

const at = (iso: string) => Date.parse(iso);
const cronAt = (expr: string, iso: string) => matches(parseCron(expr), at(iso));
const row = (workflow: string, cron: string, inputs = {}) => parseSchedule({ rows: [{ workflow, cron, inputs }] })[0];

function harness({ total = 0, listOk = true, dispatchOk = true } = {}) {
  const lists: number[] = [];
  const sent: string[] = [];
  const logs: string[] = [];
  return {
    lists, sent, logs,
    runsSince: async (_workflow: string, slot: number) => {
      lists.push(slot);
      return listOk ? { ok: true, status: 200, data: { total_count: total } } : { ok: false, status: 502, data: null };
    },
    dispatch: async (r: { key: string }) => {
      sent.push(r.key);
      return dispatchOk ? { ok: true, status: 204, data: null } : { ok: false, status: 500, data: null };
    },
    log: (line: string) => logs.push(line),
  };
}

describe('cron matching (UTC)', () => {
  it('handles steps, lists and ranges', () => {
    expect(cronAt('*/5 * * * *', '2026-09-14T18:05:00Z')).toBe(true);
    expect(cronAt('*/5 * * * *', '2026-09-14T18:03:00Z')).toBe(false);
    expect(cronAt('5,35 * * * *', '2026-09-14T18:35:00Z')).toBe(true);
    expect(cronAt('17 */6 * * *', '2026-09-14T12:17:00Z')).toBe(true);
    expect(cronAt('17 */6 * * *', '2026-09-14T13:17:00Z')).toBe(false);
    expect(cronAt('40 13,21 * * *', '2026-09-14T21:40:00Z')).toBe(true);
    expect(cronAt('0 9-17/4 * * *', '2026-09-14T13:00:00Z')).toBe(true);
  });

  it('handles days of the week and of the month (2026-09-14 is a Monday)', () => {
    expect(cronAt('0 10 * * 1', '2026-09-14T10:00:00Z')).toBe(true);
    expect(cronAt('0 10 * * 1', '2026-09-15T10:00:00Z')).toBe(false);
    expect(cronAt('20 18 * * 2,5', '2026-09-15T18:20:00Z')).toBe(true);
    expect(cronAt('0 16 * * 0', '2026-09-13T16:00:00Z')).toBe(true);
    expect(cronAt('0 16 * * 7', '2026-09-13T16:00:00Z')).toBe(true);
    expect(cronAt('17 15 1 1,4,7,10 *', '2026-10-01T15:17:00Z')).toBe(true);
    expect(cronAt('17 15 1 1,4,7,10 *', '2026-09-01T15:17:00Z')).toBe(false);
  });

  it('matches either day field when both are restricted, as POSIX cron does', () => {
    expect(cronAt('0 0 1 * 1', '2026-09-14T00:00:00Z')).toBe(true);
    expect(cronAt('0 0 1 * 1', '2026-10-01T00:00:00Z')).toBe(true);
    expect(cronAt('0 0 1 * 1', '2026-09-15T00:00:00Z')).toBe(false);
  });

  it('rejects malformed crons', () => {
    for (const bad of ['* * * *', '60 * * * *', '*/0 * * * *', 'MON * * * *', '5-1 * * * *', '* * 0 * *']) expect(() => parseCron(bad), bad).toThrow();
  });
});

describe('clockTick', () => {
  const ops = row('routine-marjorie-ops.yml', '18 * * * *');
  const SLOT = at('2026-09-14T18:18:00Z');

  it('fires a due row once for its slot, and again at the next slot', async () => {
    const poll = row('bot-chat-poll.yml', '*/5 * * * *');
    const h = harness();
    const handled = new Map();
    const base = at('2026-09-14T18:05:00Z');
    for (const seconds of [5, 35, 65, 125, 305, 365]) await clockTick({ rows: [poll], handled, now: base + seconds * 1000, live: true, ...h });
    expect(h.sent).toEqual([poll.key, poll.key]);
    expect(h.lists).toEqual([base, base + 300_000]);
  });

  it('skips a slot that any run already covers, and a restart does not re-fire it', async () => {
    const h = harness({ total: 1 });
    await clockTick({ rows: [ops], handled: new Map(), now: SLOT + 5_000, live: true, ...h });
    await clockTick({ rows: [ops], handled: new Map(), now: SLOT + 125_000, live: true, ...h });
    expect(h.sent).toEqual([]);
    expect(h.logs.every((l) => l.includes('already has a run'))).toBe(true);
  });

  it('asks for runs created since a minute before the slot, one result', () => {
    expect(runsSinceRequest('routine-marjorie-ops.yml', SLOT)).toEqual({
      method: 'GET',
      url: 'https://api.github.com/repos/JW-Incorporated/swift2/actions/workflows/routine-marjorie-ops.yml/runs?created=%3E%3D2026-09-14T18%3A17%3A00Z&per_page=1',
    });
  });

  it('retries a failed dispatch every minute and gives up 10 minutes past the slot', async () => {
    const h = harness({ dispatchOk: false });
    const handled = new Map();
    for (let minute = 0; minute <= 12; minute += 1) await clockTick({ rows: [ops], handled, now: SLOT + 5_000 + minute * 60_000, live: true, ...h });
    expect(h.sent).toHaveLength(10);
    expect(h.logs.filter((l) => l.includes('gave up'))).toHaveLength(1);
    expect(GIVE_UP_MS).toBe(600_000);
  });

  it('never dispatches blind when the run list fails', async () => {
    const h = harness({ listOk: false });
    await clockTick({ rows: [ops], handled: new Map(), now: SLOT + 5_000, live: true, ...h });
    expect(h.sent).toEqual([]);
    expect(h.logs[0]).toContain('retrying next minute');
  });

  it('does nothing while CLOCK_LIVE is off, and a slot older than 10 minutes is never due', async () => {
    const h = harness();
    await clockTick({ rows: [ops], handled: new Map(), now: SLOT + 5_000, live: false, ...h });
    expect([...h.lists, ...h.sent]).toEqual([]);
    expect(dueRows([ops], new Map(), SLOT + GIVE_UP_MS + 60_000)).toEqual([]);
  });

  it('dispatches on main with every input as a string', () => {
    expect(clockDispatch(row('output-sampling.yml', '12 9 * * 1', { dry_run: false })).body).toEqual({ ref: 'main', inputs: { dry_run: 'false' } });
  });
});

describe('the table and CLOCK_LIVE', () => {
  const source = readFileSync('scripts/doorbell/schedule.json', 'utf8');

  it('lists the next 10 fires, soonest first (--check)', () => {
    const fires = nextFires(parseSchedule(source), at('2026-09-14T18:03:30Z'));
    expect(fires).toHaveLength(10);
    expect(fires[0]).toMatchObject({ at: at('2026-09-14T18:05:00Z'), workflow: 'bot-chat-poll.yml' });
    expect(fires.map((f: { at: number }) => f.at)).toEqual([...fires.map((f: { at: number }) => f.at)].sort((a, b) => a - b));
  });

  it('rejects a malformed table', () => {
    expect(() => parseSchedule({ rows: [{ workflow: '../x.yml', cron: '* * * * *' }] })).toThrow();
    expect(() => parseSchedule({ rows: [{ workflow: 'a.yml', cron: '* * * * *', inputs: { x: {} } }] })).toThrow();
    expect(() => parseSchedule({ rows: [{ workflow: 'a.yml', cron: '* * * * *' }, { workflow: 'a.yml', cron: '* * * * *' }] })).toThrow();
    expect(() => parseSchedule({ rows: [] })).toThrow();
  });

  it("reads CLOCK_LIVE from chat-inbox.mjs's own text, as the host does from main", () => {
    const inbox = readFileSync('scripts/marjorie/lib/chat-inbox.mjs', 'utf8');
    expect(clockLiveFrom(inbox)).toBe(CLOCK_LIVE);
    expect(CLOCK_LIVE).toBe(false);
    expect(readRemote(source, inbox)).toMatchObject({ ok: true, live: false });
    expect(readRemote(source, 'no flag here')).toMatchObject({ ok: false });
    expect(readRemote('{', inbox)).toMatchObject({ ok: false });
  });
});
