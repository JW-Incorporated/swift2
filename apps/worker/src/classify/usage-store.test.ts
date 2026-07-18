import { describe, expect, it } from 'vitest';
import { UsageStore, type UsageDb } from './usage-store';

function fakeDb(
  initialCount: number,
  opts: { todaysCallCountThrows?: boolean; incrementThrows?: boolean } = {},
): UsageDb & { incrementCalls: number } {
  let count = initialCount;
  const db = {
    incrementCalls: 0,
    async todaysCallCount() {
      if (opts.todaysCallCountThrows) throw new Error('db unreachable');
      return count;
    },
    async incrementToday() {
      if (opts.incrementThrows) throw new Error('db unreachable');
      db.incrementCalls++;
      count++;
    },
  };
  return db;
}

describe('UsageStore', () => {
  it('seeds the in-process count from the persisted total at create()', async () => {
    const db = fakeDb(98, {});
    const store = await UsageStore.create(db, 100);
    expect(await store.reserve()).toBe(true); // 98 -> 99, still under 100
    expect(await store.reserve()).toBe(true); // 99 -> 100, still allowed (the call that hits the cap)
    expect(await store.reserve()).toBe(false); // now at 100, cap reached
  });

  it('starts from 0 when the persisted total is unreachable at startup', async () => {
    const db = fakeDb(0, { todaysCallCountThrows: true });
    const store = await UsageStore.create(db, 2);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(false);
  });

  it('the in-process floor still caps a run even if the durable increment keeps failing', async () => {
    const db = fakeDb(0, { incrementThrows: true });
    const store = await UsageStore.create(db, 2);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(false); // still enforced locally despite every persist failing
  });

  it('cumulative cap holds across what would be separate process runs (re-create from the same db)', async () => {
    const db = fakeDb(0, {});
    const cycle1 = await UsageStore.create(db, 100);
    for (let i = 0; i < 60; i++) await cycle1.reserve();
    expect(db.incrementCalls).toBe(60);

    // A fresh process/UsageStore, same underlying db — must NOT reset to 0.
    const cycle2 = await UsageStore.create(db, 100);
    let allowed = 0;
    for (let i = 0; i < 60; i++) {
      if (await cycle2.reserve()) allowed++;
    }
    expect(allowed).toBe(40); // only 40 remained of the 100/day cap
  });
});
