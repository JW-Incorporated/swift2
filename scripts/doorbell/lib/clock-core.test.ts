import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLOCK_LIVE } from '../../marjorie/lib/chat-inbox.mjs';
import {
  GIVE_UP_MS, clockDispatch, clockLiveFrom, clockTick, dueRows, matches, nextFires, parseCommit, parseCron, parseSchedule, policyProblems, readRemote, runsSinceRequest,
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

  it('reads the time again before dispatching, so a slow run list never fires past 10 minutes (Codex R1 #3)', async () => {
    const h = harness();
    await clockTick({ rows: [ops], handled: new Map(), now: SLOT + 5_000, currentTime: () => SLOT + 11 * 60_000, live: true, ...h });
    expect(h.sent).toEqual([]);
    expect(h.logs.join('\n')).toContain('gave up');
  });

  it('runs due rows side by side, so a slow one blocks no other (Codex R1 #3)', async () => {
    const other = row('other-routine.yml', '18 * * * *');
    let release: () => void = () => {};
    const slow = new Promise<void>((resolve) => {
      release = resolve;
    });
    const sent: string[] = [];
    const runsSince = async (workflow: string) => {
      if (workflow === ops.workflow) await slow;
      return { ok: true, status: 200, data: { total_count: 0 } };
    };
    const dispatch = async (r: { key: string }) => {
      sent.push(r.key);
      return { ok: true, status: 204, data: null };
    };
    const tick = clockTick({ rows: [ops, other], handled: new Map(), now: SLOT + 5_000, live: true, runsSince, dispatch });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sent).toEqual([other.key]);
    release();
    await tick;
    expect(sent).toEqual([other.key, ops.key]);
  });

  it('dispatches nothing once CLOCK_LIVE goes off during the tick', async () => {
    let on = true;
    const h = harness();
    const runsSince = async (workflow: string, slot: number) => {
      on = false;
      return h.runsSince(workflow, slot);
    };
    await clockTick({ rows: [ops], handled: new Map(), now: SLOT + 5_000, live: () => on, runsSince, dispatch: h.dispatch, log: h.log });
    expect(h.sent).toEqual([]);
  });
});

describe('the policy a table from main must meet (Codex R1 #1)', () => {
  const pinned = parseSchedule(readFileSync('scripts/doorbell/schedule.json', 'utf8'));
  const T = at('2026-09-14T18:00:00Z');
  const table = (rows: unknown[]) => parseSchedule({ rows });
  const inputsOf = (workflow: string) => pinned.find((p: { workflow: string }) => p.workflow === workflow).inputs;

  it('the pinned table meets it, and so does a changed cron for a pinned workflow', () => {
    expect(policyProblems(pinned, pinned, T)).toEqual([]);
    expect(policyProblems(table([{ workflow: 'routine-marjorie-ops.yml', cron: '48 * * * *' }]), pinned, T)).toEqual([]);
  });

  it('refuses a workflow the pinned table does not dispatch, or different inputs', () => {
    expect(policyProblems(table([{ workflow: 'routine-marjorie-chat.yml', cron: '0 * * * *' }]), pinned, T)[0]).toContain('not in the pinned table');
    expect(policyProblems(table([{ workflow: 'output-sampling.yml', cron: '12 9 * * 1', inputs: { dry_run: true } }]), pinned, T)[0]).toContain('inputs differ');
  });

  it('refuses a row more often than every 5 minutes, and more than 40 dispatches in an hour', () => {
    expect(policyProblems(table([{ workflow: 'routine-marjorie-ops.yml', cron: '* * * * *' }]), pinned, T)[0]).toContain('every 5 minutes');
    const busy = ['a11y.yml', 'cie-scan.yml', 'routine-marjorie-ops.yml', 'e2e.yml'].map((w) => ({ workflow: w, cron: '*/5 * * * *', inputs: inputsOf(w) }));
    expect(policyProblems(table(busy), pinned, T).join(' ')).toContain('dispatches in one hour');
  });

  it("reads one commit of main's sha and date, and nothing malformed", () => {
    expect(parseCommit({ sha: 'a'.repeat(40), commit: { committer: { date: '2026-09-14T18:00:00Z' } } })).toEqual({ sha: 'a'.repeat(40), date: T });
    expect(parseCommit({ sha: '../x', commit: { committer: { date: '2026-09-14T18:00:00Z' } } })).toBeNull();
    expect(parseCommit({ sha: 'a'.repeat(40) })).toBeNull();
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
    const pinned = parseSchedule(source);
    const T = at('2026-09-14T18:00:00Z');
    expect(readRemote(source, inbox, pinned, T)).toMatchObject({ ok: true, live: false });
    expect(readRemote(source, 'no flag here', pinned, T)).toMatchObject({ ok: false });
    expect(readRemote('{', inbox, pinned, T)).toMatchObject({ ok: false });
  });
});
