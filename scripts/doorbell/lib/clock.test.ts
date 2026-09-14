import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { createClock, loadPinned, untilTick } from './clock.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseSchedule } from './clock-core.mjs';

const RAW = 'https://raw.githubusercontent.com/JW-Incorporated/swift2';
const COMMIT = 'https://api.github.com/repos/JW-Incorporated/swift2/commits/main';
const RUNS = 'https://api.github.com/repos/JW-Incorporated/swift2/actions/workflows';
const table = { rows: [{ workflow: 'bot-chat-poll.yml', cron: '*/5 * * * *', inputs: { clock: true } }] };
const pinnedRows = parseSchedule(table);
const inbox = (live: boolean) => `export const DOORBELL_LIVE = false;\nexport const CLOCK_LIVE = ${live};\n`;

type Main = { sha: string; date: string; live: boolean; table?: unknown };
type Call = { key: string; url: string; auth: string; body: unknown };

function res(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) };
}
function network({ main = { sha: 'a'.repeat(40), date: '2026-09-14T18:00:00Z', live: true } as Main, headStatus = 200, runs = 0 } = {}) {
  const calls: Call[] = [];
  const state = { main };
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) => {
    calls.push({ key: `${init.method || 'GET'} ${url.split('?')[0]}`, url, auth: init.headers?.Authorization || '', body: init.body ? JSON.parse(init.body) : null });
    const m = state.main;
    if (url === COMMIT) return res(headStatus, { sha: m.sha, commit: { committer: { date: m.date } } });
    if (url === `${RAW}/${m.sha}/scripts/doorbell/schedule.json`) return res(200, m.table ?? table);
    if (url === `${RAW}/${m.sha}/scripts/marjorie/lib/chat-inbox.mjs`) return res(200, inbox(m.live));
    if (url.startsWith(`${RUNS}/bot-chat-poll.yml/runs?`)) return res(200, { total_count: runs });
    return res(204, null);
  });
  return { fetchImpl, calls, state };
}
function clockOn(net: ReturnType<typeof network>, over: Record<string, unknown> = {}) {
  const lines: string[] = [];
  const clock = createClock({ githubToken: 'github-secret', fetchImpl: net.fetchImpl, log: (l: string) => lines.push(l), pinned: { rows: pinnedRows, live: false }, ...over });
  return { clock, lines };
}
/** Start at 18:04:30 and run to 18:05:05, the first tick. */
async function firstTick(net: ReturnType<typeof network>, over: Record<string, unknown> = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-14T18:04:30Z'));
  const { clock, lines } = clockOn(net, over);
  clock.start();
  await vi.advanceTimersByTimeAsync(35_000);
  clock.stop();
  return { clock, lines };
}
const actions = (calls: Call[]) => calls.filter((c) => c.key.includes('/actions/'));

afterEach(() => {
  vi.useRealTimers();
});

describe('createClock', () => {
  it('ticks 5 s past each minute', () => {
    expect(untilTick(Date.parse('2026-09-14T18:04:30Z'))).toBe(35_000);
    expect(untilTick(Date.parse('2026-09-14T18:05:02Z'))).toBe(3_000);
    expect(untilTick(Date.parse('2026-09-14T18:05:05Z'))).toBe(60_000);
  });

  it('takes CLOCK_LIVE from one commit of main and fires the 18:05 slot: a run check, then a dispatch on the key', async () => {
    const net = network();
    const { lines } = await firstTick(net);
    expect(actions(net.calls).map((c) => c.key)).toEqual([`GET ${RUNS}/bot-chat-poll.yml/runs`, `POST ${RUNS}/bot-chat-poll.yml/dispatches`]);
    expect(actions(net.calls).every((c) => c.auth === 'Bearer github-secret')).toBe(true);
    expect(actions(net.calls)[1].body).toEqual({ ref: 'main', inputs: { clock: 'true' } });
    const reads = net.calls.filter((c) => !c.key.includes('/actions/'));
    expect(reads.map((c) => c.url)).toEqual([COMMIT, `${RAW}/${'a'.repeat(40)}/scripts/doorbell/schedule.json`, `${RAW}/${'a'.repeat(40)}/scripts/marjorie/lib/chat-inbox.mjs`]);
    expect(reads.every((c) => c.auth === '')).toBe(true);
    expect(lines.join('\n')).not.toContain('github-secret');
  });

  it('keeps its pinned copy when main cannot be read, so a pinned CLOCK_LIVE=false fires nothing', async () => {
    const net = network({ headStatus: 503 });
    const { clock, lines } = await firstTick(net);
    expect(actions(net.calls)).toEqual([]);
    expect(lines.some((l) => l.includes('commit lookup failed'))).toBe(true);
    expect(clock.state().live).toBe(false);
  });

  it('does not double a slot that already has a run', async () => {
    const net = network({ runs: 1 });
    await firstTick(net);
    expect(net.calls.some((c) => c.key.endsWith('/dispatches'))).toBe(false);
  });

  it('refuses a table from main outside the pinned policy (Codex R1 #1)', async () => {
    const net = network({ main: { sha: 'b'.repeat(40), date: '2026-09-14T18:00:00Z', live: true, table: { rows: [{ workflow: 'social-poster.yml', cron: '* * * * *', inputs: {} }] } } });
    const { clock, lines } = await firstTick(net);
    expect(clock.state().live).toBe(false);
    expect(actions(net.calls)).toEqual([]);
    expect(lines.some((l) => l.includes('was not applied'))).toBe(true);
  });

  it('reads main one refresh at a time and never rolls back to an older commit (Codex R1 #4)', async () => {
    const net = network({ main: { sha: 'c'.repeat(40), date: '2026-09-14T18:10:00Z', live: true } });
    const { clock, lines } = clockOn(net);
    await Promise.all([clock.refresh(), clock.refresh()]);
    expect(net.calls.filter((c) => c.url === COMMIT)).toHaveLength(1);
    expect(clock.state().live).toBe(true);
    net.state.main = { sha: 'd'.repeat(40), date: '2026-09-14T18:00:00Z', live: false };
    await clock.refresh();
    expect(clock.state().live).toBe(true);
    expect(lines.some((l) => l.includes('older than the table already applied'))).toBe(true);
  });

  it('never starts a slot twice across a restart, even before GitHub lists the run (Codex R1 #2)', async () => {
    const stateDir = mkdtempSync(join(tmpdir(), 'clock-state-'));
    const net = network({ runs: 0 });
    await firstTick(net, { stateDir });
    expect(net.calls.filter((c) => c.key.endsWith('/dispatches'))).toHaveLength(1);
    const { clock } = clockOn(net, { stateDir });
    expect(clock.state().handled.size).toBe(1);
    clock.start();
    await vi.advanceTimersByTimeAsync(60_000); // 18:06:05, still inside the 18:05 slot's window
    clock.stop();
    expect(net.calls.filter((c) => c.key.endsWith('/dispatches'))).toHaveLength(1);
  });

  it('starts from this checkout: the committed table and CLOCK_LIVE', () => {
    const pinned = loadPinned();
    expect(pinned.rows.find((r: { workflow: string }) => r.workflow === 'bot-chat-poll.yml')?.inputs).toEqual({ clock: true });
    expect(pinned.live).toBe(false);
  });
});
