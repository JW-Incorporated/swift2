import { describe, expect, it } from 'vitest';
import { mapPool } from './pool';

describe('mapPool', () => {
  it('caps concurrency and keeps results index-aligned', async () => {
    let inFlight = 0;
    let peak = 0;
    const out = await Promise.all(
      mapPool([0, 1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 5 - (n % 3)));
        inFlight--;
        return n * 2;
      }).slots,
    );
    expect(peak).toBe(3);
    expect(out.map((r) => (r.ok ? r.value : null))).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
  });

  it('records failures without rejecting and starts nothing new afterwards', async () => {
    const started: number[] = [];
    const out = await Promise.all(
      mapPool([0, 1, 2, 3], 1, async (n) => {
        started.push(n);
        if (n === 1) throw new Error('boom');
        return n;
      }).slots,
    );
    expect(started).toEqual([0, 1]);
    expect(out[0]).toEqual({ ok: true, value: 0 });
    expect(out[1]).toMatchObject({ ok: false });
    expect(out[2]).toMatchObject({ ok: false });
  });

  it('lets a consumer read a decisive failure while a later item is still hung', async () => {
    const { slots } = mapPool([0, 1], 2, async (n) => {
      if (n === 1) return new Promise<number>(() => {});
      throw new Error('first');
    });
    expect(await slots[0]).toMatchObject({ ok: false });
  });

  it('stop() launches nothing further and resolves unstarted slots', async () => {
    const started: number[] = [];
    const { slots, stop } = mapPool([0, 1, 2, 3], 1, async (n) => {
      started.push(n);
      return n;
    });
    stop();
    stop();
    const out = await Promise.all(slots);
    expect(started.length).toBeLessThan(4);
    expect(out[3]).toMatchObject({ ok: false });
  });

  it('handles an empty list', async () => {
    expect(await Promise.all(mapPool([], 5, async () => 1).slots)).toEqual([]);
  });
});
