import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain JavaScript module
import {
  BREAKER_429_LIMIT,
  MAX_LOADS_PER_HOUR,
  MIN_LOAD_INTERVAL_MS,
  RedditCircuitOpen,
  createPagePacer,
  loadPage,
} from './pacing.mjs';

describe('home Reddit pacing', () => {
  it('keeps page loads at least six seconds apart', async () => {
    let clock = 0;
    const sleeps: number[] = [];
    const pacer = createPagePacer({
      now: () => clock,
      sleep: async (ms: number) => {
        sleeps.push(ms);
        clock += ms;
      },
    });
    await pacer.beforeLoad();
    await pacer.beforeLoad();
    expect(sleeps).toEqual([MIN_LOAD_INTERVAL_MS]);
  });

  it('never schedules more than 300 loads inside one rolling hour', async () => {
    let clock = 0;
    const pacer = createPagePacer({
      now: () => clock,
      sleep: async (ms: number) => {
        clock += ms;
      },
      minIntervalMs: 0,
    });
    for (let i = 0; i <= MAX_LOADS_PER_HOUR; i += 1) await pacer.beforeLoad();
    expect(clock).toBe(60 * 60 * 1_000);
  });

  it('enforces the hourly cap across runs from persisted timestamps', async () => {
    let clock = 3_000_000;
    const existing = Array.from({ length: MAX_LOADS_PER_HOUR }, () => clock);
    const pacer = createPagePacer({
      now: () => clock,
      sleep: async (ms: number) => {
        clock += ms;
      },
      initialLoads: existing,
    });
    await pacer.beforeLoad();
    expect(clock).toBe(3_000_000 + 60 * 60 * 1_000);
  });

  it('backs off exponentially and opens the breaker on the third 429', async () => {
    let clock = 0;
    const sleeps: number[] = [];
    const pacer = createPagePacer({
      now: () => clock,
      sleep: async (ms: number) => {
        sleeps.push(ms);
        clock += ms;
      },
      minIntervalMs: 0,
      backoffBaseMs: 10,
    });
    const responses = Array.from({ length: BREAKER_429_LIMIT }, () => ({
      status: () => 429,
      headers: () => ({}),
    }));
    const page = { goto: vi.fn(async () => responses.shift()) };
    await expect(
      loadPage(page, 'https://www.reddit.com/r/example/new/', pacer),
    ).rejects.toBeInstanceOf(RedditCircuitOpen);
    expect(sleeps).toEqual([10, 20]);
    expect(page.goto).toHaveBeenCalledTimes(BREAKER_429_LIMIT);
    expect(pacer.stats().circuitOpen).toBe(true);
  });
});
