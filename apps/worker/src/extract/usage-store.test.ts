import { describe, expect, it } from 'vitest';
import { ExtractUsageStore, JUDGE_DAILY_CAP, JUDGE_PER_RUN_CAP, WRITER_DAILY_CAP, WRITER_PER_RUN_CAP, type UsageDb } from './usage-store';

function fakeDb(initialCount: number, opts: { throws?: boolean } = {}): UsageDb & { incrementCalls: number } {
  let count = initialCount;
  const db = {
    incrementCalls: 0,
    async todaysCallCount() {
      return count;
    },
    async incrementToday() {
      if (opts.throws) throw new Error('db unreachable');
      db.incrementCalls++;
      count++;
    },
  };
  return db;
}

describe('ExtractUsageStore', () => {
  it('enforces the per-run cap even when the daily cap has room', async () => {
    const db = fakeDb(0);
    const store = await ExtractUsageStore.create(db, 2, 600); // perRunCap=2
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(false); // run cap hit, daily nowhere close
  });

  it('enforces the daily cap even when the run cap has room', async () => {
    const db = fakeDb(599);
    const store = await ExtractUsageStore.create(db, 150, 600); // dailyCap=600, seeded at 599
    expect(await store.reserve()).toBe(true); // 599 -> 600
    expect(await store.reserve()).toBe(false); // daily cap hit, run cap nowhere close
  });

  it('the in-process floor still caps a run even if the durable increment keeps failing', async () => {
    const db = fakeDb(0, { throws: true });
    const store = await ExtractUsageStore.create(db, 2, 600);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(true);
    expect(await store.reserve()).toBe(false);
  });

  it('the writer budget is 40 per run and 150 per day', async () => {
    expect([WRITER_PER_RUN_CAP, WRITER_DAILY_CAP]).toEqual([40, 150]);
    const perRun = await ExtractUsageStore.create(fakeDb(0), WRITER_PER_RUN_CAP, WRITER_DAILY_CAP);
    for (let i = 0; i < 40; i++) expect(await perRun.reserve()).toBe(true);
    expect(await perRun.reserve()).toBe(false);
    const daily = await ExtractUsageStore.create(fakeDb(149), WRITER_PER_RUN_CAP, WRITER_DAILY_CAP);
    expect(await daily.reserve()).toBe(true);
    expect(await daily.reserve()).toBe(false);
  });

  it('the judge budget is 100 per run and 400 per day, separate from the extract caps', async () => {
    expect([JUDGE_PER_RUN_CAP, JUDGE_DAILY_CAP]).toEqual([100, 400]);
    const perRun = await ExtractUsageStore.create(fakeDb(0), JUDGE_PER_RUN_CAP, JUDGE_DAILY_CAP);
    for (let i = 0; i < 100; i++) expect(await perRun.reserve()).toBe(true);
    expect(await perRun.reserve()).toBe(false);
    const daily = await ExtractUsageStore.create(fakeDb(399), JUDGE_PER_RUN_CAP, JUDGE_DAILY_CAP);
    expect(await daily.reserve()).toBe(true);
    expect(await daily.reserve()).toBe(false);
  });

  it('cumulative daily cap holds across separate process runs (re-create from the same db)', async () => {
    const db = fakeDb(0);
    const cycle1 = await ExtractUsageStore.create(db, 150, 5);
    for (let i = 0; i < 150; i++) await cycle1.reserve();
    expect(db.incrementCalls).toBe(5); // capped by dailyCap=5, not perRunCap=150

    const cycle2 = await ExtractUsageStore.create(db, 150, 5);
    expect(await cycle2.reserve()).toBe(false); // daily cap already spent
  });
});
