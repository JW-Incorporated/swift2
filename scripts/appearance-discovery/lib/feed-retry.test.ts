import { describe, expect, it, vi } from 'vitest';
import { fetchAllFeeds, splitFailures } from './feed-retry.mjs';

const transient = (msg: string) => Object.assign(new Error(msg), { transient: true });
const chans = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

describe('fetchAllFeeds', () => {
  it('404 then 200 succeeds on the retry pass', async () => {
    const calls: Record<string, number> = {};
    const fetchOne = vi.fn(async (c: { name: string }) => {
      calls[c.name] = (calls[c.name] ?? 0) + 1;
      if (calls[c.name] === 1) throw transient(`${c.name}: feed HTTP 404`);
      return { ok: c.name };
    });
    const sleep = vi.fn(async () => {});
    const r = await fetchAllFeeds({ channels: chans, fetchOne, sleep, jitter: () => 0 });
    expect(r.failures).toEqual([]);
    expect(r.results.size).toBe(3);
  });

  it('persistent 404 is reported as a failure after 3 attempts', async () => {
    const fetchOne = vi.fn(async (c: { name: string }) => {
      throw transient(`${c.name}: feed HTTP 404`);
    });
    const sleep = vi.fn(async () => {});
    const r = await fetchAllFeeds({ channels: chans, fetchOne, sleep, jitter: () => 0 });
    expect(r.failures).toHaveLength(3);
    expect(fetchOne).toHaveBeenCalledTimes(9);
  });

  it('sleeps once per pass, not per channel, and only retries failures', async () => {
    const fetchOne = vi.fn(async (c: { name: string }) => {
      if (c.name !== 'A') return { ok: true };
      throw transient('A: feed HTTP 404');
    });
    const sleep = vi.fn(async () => {});
    const r = await fetchAllFeeds({
      channels: chans,
      fetchOne,
      sleep,
      delaysMs: [10, 30],
      jitter: () => 0,
    });
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([10, 30]);
    expect(fetchOne).toHaveBeenCalledTimes(3 + 1 + 1);
    expect(r.failures.map((f) => f.channel.name)).toEqual(['A']);
  });

  it('does not retry non-transient failures', async () => {
    const fetchOne = vi.fn(async () => {
      throw new Error('A: feed parsed to 0 entries');
    });
    const sleep = vi.fn(async () => {});
    const r = await fetchAllFeeds({ channels: [chans[0]], fetchOne, sleep });
    expect(sleep).not.toHaveBeenCalled();
    expect(fetchOne).toHaveBeenCalledTimes(1);
    expect(r.failures).toHaveLength(1);
  });

  describe('playlist fallback', () => {
    const http = (status: number) =>
      Object.assign(new Error(`feed HTTP ${status}`), { status, transient: status !== 403 });
    const run = (status: number, fallbackOne: () => Promise<unknown>) =>
      fetchAllFeeds({
        channels: [chans[0]],
        fetchOne: vi.fn(async () => {
          throw http(status);
        }),
        fallbackOne,
        sleep: vi.fn(async () => {}),
        jitter: () => 0,
      });

    it.each([404, 500])('is tried once after a %i and recovers the channel', async (status) => {
      const fallbackOne = vi.fn(async () => ({ ok: 'pl' }));
      const r = await run(status, fallbackOne);
      expect(fallbackOne).toHaveBeenCalledTimes(1);
      expect(r.failures).toEqual([]);
      expect(r.fallbackUsed).toEqual([chans[0]]);
    });

    it('is not tried after a 403', async () => {
      const fallbackOne = vi.fn(async () => ({ ok: 'pl' }));
      const r = await run(403, fallbackOne);
      expect(fallbackOne).not.toHaveBeenCalled();
      expect(r.failures).toHaveLength(1);
    });

    it('is not tried when the channel feed succeeds', async () => {
      const fallbackOne = vi.fn();
      const r = await fetchAllFeeds({
        channels: chans,
        fetchOne: async () => ({ ok: true }),
        fallbackOne,
        sleep: async () => {},
      });
      expect(fallbackOne).not.toHaveBeenCalled();
      expect(r.fallbackUsed).toEqual([]);
    });

    it('reports the ORIGINAL failure when the fallback also fails', async () => {
      const r = await run(
        404,
        vi.fn(async () => {
          throw http(500);
        }),
      );
      expect(r.failures).toHaveLength(1);
      expect(r.failures[0].error.status).toBe(404);
      expect(r.fallbackUsed).toEqual([]);
    });
  });
});

describe('splitFailures (exit logic input)', () => {
  const f = (error: object) => ({ channel: { name: 'X' }, error: Object.assign(new Error('e'), error) });
  it('all ok: nothing to report', () => {
    expect(splitFailures([])).toEqual({ outage: [], fatal: [] });
  });
  it('some ok, some 404/5xx: outage only, no fatal', () => {
    const r = splitFailures([f({ status: 404 }), f({ status: 503 })]);
    expect(r.outage).toHaveLength(2);
    expect(r.fatal).toHaveLength(0);
  });
  it('all upstream-failed: outage only, no fatal', () => {
    const r = splitFailures([f({ status: 404 }), f({ status: 500 }), f({ status: 404 })]);
    expect(r.fatal).toHaveLength(0);
  });
  it('one non-upstream error (parse, DNS, 403, 429) stays fatal', () => {
    for (const bad of [{}, { status: 403 }, { status: 429 }, { transient: true }]) {
      const r = splitFailures([f({ status: 404 }), f(bad)]);
      expect(r.outage).toHaveLength(1);
      expect(r.fatal).toHaveLength(1);
    }
  });
});
