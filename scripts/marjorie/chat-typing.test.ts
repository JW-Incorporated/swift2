import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { TYPING_CAP_MS, TYPING_INTERVAL_MS, start, stopReason } from './chat-typing.mjs';

const ENV = { DISCORD_BOT_TOKEN: 'sekret-token', GITHUB_RUN_ID: '42' };
const WORKING = [
  { name: 'context', status: 'completed', conclusion: 'success' },
  { name: 'run / agent', status: 'in_progress', conclusion: null },
  { name: 'post', status: 'queued', conclusion: null },
];

type Res = { status: number; ok: boolean; json: () => Promise<unknown> };
const res = (status: number, body: unknown = {}): Res => ({ status, ok: status >= 200 && status < 300, json: async () => body });

/** A virtual clock: sleeping advances it, so a 20-minute cap runs instantly. */
function harness(over: { fetchImpl?: (url: string, init: { method: string; headers: Record<string, string> }) => Promise<Res>; listJobs?: (id: string) => unknown } = {}) {
  let now = 0;
  const sleeps: number[] = [];
  const calls: Array<{ at: number; url: string; init: { method: string; headers: Record<string, string> } }> = [];
  const deps = {
    env: ENV,
    nowImpl: () => now,
    sleepImpl: async (ms: number) => {
      sleeps.push(ms);
      now += ms;
    },
    fetchImpl: async (url: string, init: { method: string; headers: Record<string, string> }) => {
      calls.push({ at: now, url, init });
      return (over.fetchImpl ?? (async () => res(204)))(url, init);
    },
    listJobs: over.listJobs ?? (() => WORKING),
  };
  return { deps, sleeps, calls, clock: () => now };
}

const flags = { 'channel-id': '111', 'stop-job': 'post' };
afterEach(() => vi.restoreAllMocks());

describe('stopReason', () => {
  it('keeps going while the agent works', () => {
    expect(stopReason(WORKING, 'post')).toBeNull();
  });
  it.each(['in_progress', 'completed'])('stops once the stop job is %s', (status) => {
    expect(stopReason([...WORKING.slice(0, 2), { name: 'post', status, conclusion: null }], 'post')).toBe('post job started');
  });
  it('watches the named job, so Tree stops on deliver and not post', () => {
    const jobs = [...WORKING, { name: 'deliver', status: 'in_progress', conclusion: null }];
    expect(stopReason(jobs, 'post')).toBeNull();
    expect(stopReason(jobs, 'deliver')).toBe('deliver job started');
  });
  it.each(['failure', 'cancelled', 'timed_out'])('stops when the agent job %s', (conclusion) => {
    expect(stopReason([{ name: 'run / agent', status: 'completed', conclusion }], 'post')).toBe(`run job ${conclusion}`);
    expect(stopReason([{ name: 'run', status: 'completed', conclusion }], 'post')).toBe(`run job ${conclusion}`);
  });
  it('ignores an unrelated failed job', () => {
    expect(stopReason([{ name: 'running-late', status: 'completed', conclusion: 'failure' }], 'post')).toBeNull();
  });
});

describe('chat-typing start', () => {
  it('posts to the channel every 8 s with the bot token', async () => {
    const h = harness();
    let polls = 0;
    h.deps.listJobs = () => {
      polls += 1;
      return polls > 4 ? [{ name: 'post', status: 'in_progress', conclusion: null }] : WORKING;
    };
    expect(await start(flags, h.deps)).toBe(0);
    expect(h.calls.map((c) => c.at)).toEqual([0, 8000, 16000, 24000]);
    expect(h.calls[0].url).toBe('https://discord.com/api/v10/channels/111/typing');
    expect(h.calls[0].init).toEqual({ method: 'POST', headers: { Authorization: 'Bot sekret-token' } });
    expect(TYPING_INTERVAL_MS).toBe(8000);
  });

  it('types in the reply thread when there is one', async () => {
    const first = harness();
    let n = 0;
    first.deps.listJobs = () => (n++ ? [{ name: 'post', status: 'in_progress' }] : WORKING);
    await start({ ...flags, 'thread-id': '999' }, first.deps);
    expect(first.calls).toHaveLength(1);
    expect(first.calls[0].url).toContain('/channels/999/typing');
  });

  it('stops without a single call when the post job already started', async () => {
    const h = harness({ listJobs: () => [{ name: 'post', status: 'in_progress' }] });
    expect(await start(flags, h.deps)).toBe(0);
    expect(h.calls).toHaveLength(0);
  });

  it('stops when the agent job fails', async () => {
    let n = 0;
    const h = harness({ listJobs: () => (n++ < 2 ? WORKING : [{ name: 'run / agent', status: 'completed', conclusion: 'failure' }]) });
    await start(flags, h.deps);
    expect(h.calls).toHaveLength(2);
  });

  it.each([401, 403, 404])('exits cleanly at once on a %i, without retrying or logging the token', async (status) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const h = harness({ fetchImpl: async () => res(status) });
    expect(await start(flags, h.deps)).toBe(0);
    expect(h.calls).toHaveLength(1);
    expect(h.sleeps).toEqual([]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).toContain(String(status));
    expect(JSON.stringify(log.mock.calls)).not.toContain('sekret-token');
  });

  it('backs off for retry_after on a 429, then carries on', async () => {
    const answers = [res(429, { retry_after: 20 }), res(204), res(204)];
    let n = 0;
    let polls = 0;
    const h = harness({
      fetchImpl: async () => answers[n++] ?? res(204),
      listJobs: () => (++polls > 3 ? [{ name: 'post', status: 'in_progress' }] : WORKING),
    });
    await start(flags, h.deps);
    expect(h.sleeps).toEqual([20000, 8000, 8000]);
    expect(h.calls.map((c) => c.at)).toEqual([0, 20000, 28000]);
  });

  it('never waits less than the cadence nor more than a minute on a 429', async () => {
    let polls = 0;
    const h = harness({ fetchImpl: async () => res(429, { retry_after: 0.5 }), listJobs: () => (++polls > 2 ? [{ name: 'run', conclusion: 'failure' }] : WORKING) });
    await start(flags, h.deps);
    expect(h.sleeps[0]).toBe(8000);
    let p2 = 0;
    const big = harness({ fetchImpl: async () => res(429, { retry_after: 900 }), listJobs: () => (++p2 > 1 ? [{ name: 'run', conclusion: 'failure' }] : WORKING) });
    await start(flags, big.deps);
    expect(big.sleeps[0]).toBe(60000);
  });

  it('stops for good at the 20-minute cap', async () => {
    const h = harness();
    expect(await start(flags, h.deps)).toBe(0);
    expect(h.clock()).toBeGreaterThanOrEqual(TYPING_CAP_MS);
    expect(h.clock()).toBeLessThan(TYPING_CAP_MS + TYPING_INTERVAL_MS);
    expect(h.calls).toHaveLength(TYPING_CAP_MS / TYPING_INTERVAL_MS);
  });

  it('gives up after five failed calls in a row, not a retry storm', async () => {
    const h = harness({ fetchImpl: async () => res(500) });
    expect(await start(flags, h.deps)).toBe(0);
    expect(h.calls).toHaveLength(5);
    const rejects = harness({ fetchImpl: async () => Promise.reject(new Error('network')) });
    expect(await start(flags, rejects.deps)).toBe(0);
    expect(rejects.calls).toHaveLength(5);
  });

  it('keeps typing when the job read fails, until the cap', async () => {
    const h = harness({
      listJobs: () => {
        throw new Error('gh down');
      },
    });
    await start(flags, h.deps);
    expect(h.calls).toHaveLength(TYPING_CAP_MS / TYPING_INTERVAL_MS);
  });

  it('does nothing without a target, token or run id', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const h = harness();
    expect(await start({}, h.deps)).toBe(0);
    expect(await start(flags, { ...h.deps, env: { GITHUB_RUN_ID: '42' } })).toBe(0);
    expect(await start(flags, { ...h.deps, env: { DISCORD_BOT_TOKEN: 'x' } })).toBe(0);
    expect(h.calls).toHaveLength(0);
    expect(log).toHaveBeenCalledTimes(3);
  });
});
