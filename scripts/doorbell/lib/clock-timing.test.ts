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
  it('serves hundreds of slots without accumulating varied GET latency', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START - 1_000);
    const posts: number[] = [];
    let reads = 0;
    const fetchImpl = vi.fn(async (_url: string, options: { method?: string }) => {
      if (!options.method) return res('export const CLOCK_LIVE = true;', Date.now());
      if (options.method === 'POST') { posts.push(Date.now()); return { ok: true, status: 204, headers: { get: () => null } }; }
      reads += 1;
      await new Promise((resolve) => setTimeout(resolve, [14_000, 300, 8_000, 1_200][reads % 4]));
      return res({ total_count: 0, workflow_runs: [] }, Date.now());
    });
    const clock = createClock({ githubToken: 'fixture', fetchImpl, rows });
    clock.start();
    await vi.advanceTimersByTimeAsync(20 * 60 * 60_000);
    clock.stop();
    expect(posts).toHaveLength(240);
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

  it('cancels a boundary wait on stop without posting the next slot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const runs = { total_count: 0, workflow_runs: [] };
    const fetchImpl = vi.fn(async (_url: string, opts: { method?: string }) => {
      if (!opts.method) return res('export const CLOCK_LIVE = true;', Date.now());
      if (opts.method === 'POST') return { ok: true, status: 204, headers: { get: () => null } };
      return res(runs, Date.now());
    });
    const clock = createClock({ githubToken: 'fixture', fetchImpl, rows, processStartMs: START });
    await clock.refresh();
    vi.setSystemTime(START + 14_000);
    await clock.tick();
    vi.setSystemTime(START + 305_000);
    const waiting = clock.tick();
    await vi.advanceTimersByTimeAsync(0);
    clock.stop();
    await waiting;
    expect(fetchImpl.mock.calls.filter(([, opts]) => opts.method === 'POST')).toHaveLength(1);
  });

  it.each(['coverage', 'live-off', 'backward'])('fails closed when %s changes during a boundary wait', async (change) => {
    vi.useFakeTimers();
    let time = START;
    let live = true;
    const posts: number[] = [];
    const fetchImpl = vi.fn(async (_url: string, opts: { method?: string }) => {
      if (!opts.method) return res(`export const CLOCK_LIVE = ${live};`, time);
      if (opts.method === 'POST') { posts.push(time); return { ok: true, status: 204, headers: { get: () => null } }; }
      const coveredRun = change === 'coverage' && time > START + 300_000
        ? [{ head_branch: 'main', event: 'schedule', created_at: new Date(START + 300_000).toISOString() }]
        : [];
      return res({ total_count: coveredRun.length, workflow_runs: coveredRun }, time);
    });
    const clock = createClock({ githubToken: 'fixture', fetchImpl, rows, now: () => time, processStartMs: START });
    await clock.refresh();
    time = START + 14_000;
    await clock.tick();
    time = START + 305_000;
    const waiting = clock.tick();
    await vi.advanceTimersByTimeAsync(0);
    if (change === 'live-off') { live = false; await clock.refresh(); }
    if (change === 'backward') time = START + 304_000;
    else time = START + 314_000;
    await vi.advanceTimersByTimeAsync(9_000);
    await waiting;
    expect(posts).toHaveLength(1);
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
