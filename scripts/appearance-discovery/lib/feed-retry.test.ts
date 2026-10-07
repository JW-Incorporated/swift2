import { describe, expect, it, vi } from 'vitest';
import { fetchAllFeeds } from './feed-retry.mjs';

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
});
