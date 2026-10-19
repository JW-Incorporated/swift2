import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { createRequestPacer, MIN_REQUEST_DELAY_MS } from './pacing.mjs';

describe('Reddit request pacing', () => {
  it('waits at least six seconds plus jitter between requests', async () => {
    let clock = 1_000;
    const waits: number[] = [];
    const sleep = vi.fn(async (ms: number) => {
      waits.push(ms);
      clock += ms;
    });
    const pacer = createRequestPacer({
      delayMs: 6_000,
      jitterMs: 1_500,
      random: () => 0.5,
      now: () => clock,
      sleep,
    });

    await pacer.beforeRequest();
    await pacer.beforeRequest();
    await pacer.beforeRequest();

    expect(waits).toEqual([6_750, 6_750]);
  });

  it('refuses a configured delay below the two-second floor', () => {
    expect(() => createRequestPacer({ delayMs: MIN_REQUEST_DELAY_MS - 1 })).toThrow(
      /at least 2000ms/,
    );
  });
});
