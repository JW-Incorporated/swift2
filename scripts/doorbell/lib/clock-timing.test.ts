import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain mjs
import { createClock } from './clock.mjs';
// @ts-expect-error plain mjs
import { covered, parseSchedule } from './clock-core.mjs';

const START = Date.parse('2026-09-14T18:00:00Z');
const rows = parseSchedule({ rows: [{ workflow: 'bot-chat-poll.yml', cron: '*/5 * * * *', inputs: {} }] });
const res = (body: unknown, time: number) => ({ ok: true, status: 200, headers: { get: () => new Date(time).toUTCString() }, json: async () => body, text: async () => String(body) });
afterEach(() => vi.useRealTimers());

describe('clock dispatch boundaries', () => {
  it('serves twelve slots under two minutes without doubling when GET latency varies', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START - 1_000);
    const posts: number[] = [];
    let reads = 0;
    const fetchImpl = vi.fn(async (_url: string, options: { method?: string }) => {
      if (!options.method) return res('export const CLOCK_LIVE = true;', Date.now());
      if (options.method === 'POST') { posts.push(Date.now()); return { ok: true, status: 204, headers: { get: () => null } }; }
      reads += 1;
      await new Promise((resolve) => setTimeout(resolve, reads % 2 ? 1_000 : 200));
      return res({ total_count: 0, workflow_runs: [] }, Date.now());
    });
    const clock = createClock({ githubToken: 'fixture', fetchImpl, rows });
    clock.start();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    clock.stop();
    expect(posts).toHaveLength(12);
    posts.forEach((at, i) => {
      expect(at - (START + i * 300_000)).toBeGreaterThanOrEqual(0);
      expect(at - (START + i * 300_000)).toBeLessThan(120_000);
      if (i) expect(at - posts[i - 1]).toBeGreaterThanOrEqual(300_000);
    });
  });

  it('does not send a superseded slot or send after stop while a GET is pending', async () => {
    for (const stop of [false, true]) {
      let time = START;
      let release!: () => void;
      const fetchImpl = vi.fn((_url: string, opts: { method?: string }) => {
        if (!opts.method) return Promise.resolve(res('export const CLOCK_LIVE = true;', time));
        return new Promise((resolve) => { release = () => resolve(res({ total_count: 0, workflow_runs: [] }, time)); });
      });
      const clock = createClock({ githubToken: 'fixture', fetchImpl, rows, now: () => time, processStartMs: START });
      await clock.refresh();
      const pending = clock.tick();
      if (stop) clock.stop(); else time += 300_000;
      release();
      await pending;
      expect(fetchImpl.mock.calls.filter(([, opts]) => opts.method === 'POST')).toHaveLength(0);
    }
  });

  it('treats malformed run records as unreadable and never treats a feature run as coverage', () => {
    for (const run of [{}, null, { head_branch: 'main', event: 'schedule', created_at: 'invalid' }]) {
      expect(covered({ ok: true, date: new Date(START).toUTCString(), data: { total_count: 1, workflow_runs: [run] } }, START, 300_000, START)).toBeNull();
    }
    expect(covered({ ok: true, date: new Date(START).toUTCString(), data: { total_count: 1, workflow_runs: [{ head_branch: 'feature/x', event: 'workflow_dispatch', created_at: new Date(START).toISOString() }] } }, START, 300_000, START)).toBe(false);
  });

  it('main can turn it off independently of any broken remote schedule', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('schedule.json')) throw new Error('broken table');
      return res('export const CLOCK_LIVE = false;\n// unrelated broken table', START);
    });
    const clock = createClock({ githubToken: 'fixture', fetchImpl, rows, now: () => START, processStartMs: START });
    await clock.refresh(); await clock.tick();
    expect(clock.state().live).toBe(false);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
