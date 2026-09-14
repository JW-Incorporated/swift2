import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { createClock, loadPinned, untilTick } from './clock.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseSchedule } from './clock-core.mjs';

const RAW = 'https://raw.githubusercontent.com/JW-Incorporated/swift2/main';
const RUNS = 'https://api.github.com/repos/JW-Incorporated/swift2/actions/workflows';
const table = { rows: [{ workflow: 'bot-chat-poll.yml', cron: '*/5 * * * *', inputs: {} }] };
const inbox = (live: boolean) => `export const DOORBELL_LIVE = false;\nexport const CLOCK_LIVE = ${live};\n`;

function res(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) };
}
function network({ live = true, rawStatus = 200, runs = 0 } = {}) {
  const calls: Array<{ key: string; auth: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url.split('?')[0]}`;
    calls.push({ key, auth: init.headers?.Authorization || '', body: init.body ? JSON.parse(init.body) : null });
    if (url === `${RAW}/scripts/doorbell/schedule.json`) return res(rawStatus, table);
    if (url === `${RAW}/scripts/marjorie/lib/chat-inbox.mjs`) return res(rawStatus, inbox(live));
    if (url.startsWith(`${RUNS}/bot-chat-poll.yml/runs?`)) return res(200, { total_count: runs });
    return res(204, null);
  });
  return { fetchImpl, calls };
}

afterEach(() => {
  vi.useRealTimers();
});

async function run({ live = true, rawStatus = 200, runs = 0, pinnedLive = false } = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-14T18:04:30Z'));
  const { fetchImpl, calls } = network({ live, rawStatus, runs });
  const lines: string[] = [];
  const clock = createClock({ githubToken: 'github-secret', fetchImpl, log: (l: string) => lines.push(l), pinned: { rows: parseSchedule(table), live: pinnedLive } });
  clock.start();
  await vi.advanceTimersByTimeAsync(35_000); // 18:05:05, the first tick
  clock.stop();
  return { calls, lines, clock };
}

describe('createClock', () => {
  it('ticks 5 s past each minute', () => {
    expect(untilTick(Date.parse('2026-09-14T18:04:30Z'))).toBe(35_000);
    expect(untilTick(Date.parse('2026-09-14T18:05:02Z'))).toBe(3_000);
    expect(untilTick(Date.parse('2026-09-14T18:05:05Z'))).toBe(60_000);
  });

  it("picks up CLOCK_LIVE from main and fires the 18:05 slot: a run check, then a dispatch on the key", async () => {
    const { calls, lines } = await run();
    const github = calls.filter((c) => c.key.includes('api.github.com'));
    expect(github.map((c) => c.key)).toEqual([`GET ${RUNS}/bot-chat-poll.yml/runs`, `POST ${RUNS}/bot-chat-poll.yml/dispatches`]);
    expect(github.every((c) => c.auth === 'Bearer github-secret')).toBe(true);
    expect(github[1].body).toEqual({ ref: 'main', inputs: {} });
    expect(calls.filter((c) => c.key.includes('raw.githubusercontent')).every((c) => c.auth === '')).toBe(true);
    expect(lines.join('\n')).not.toContain('github-secret');
  });

  it('keeps its pinned copy when main cannot be read, so a pinned CLOCK_LIVE=false fires nothing', async () => {
    const { calls, lines, clock } = await run({ rawStatus: 503 });
    expect(calls.some((c) => c.key.includes('api.github.com'))).toBe(false);
    expect(lines.some((l) => l.includes('reading main failed'))).toBe(true);
    expect(clock.state().live).toBe(false);
  });

  it('does not double a slot that already has a run', async () => {
    const { calls } = await run({ runs: 1 });
    expect(calls.some((c) => c.key.endsWith('/dispatches'))).toBe(false);
  });

  it('starts from this checkout: the committed table and CLOCK_LIVE', () => {
    const pinned = loadPinned();
    expect(pinned.rows.length).toBe(parseSchedule(readFileSync('scripts/doorbell/schedule.json', 'utf8')).length);
    expect(pinned.live).toBe(false);
  });
});
