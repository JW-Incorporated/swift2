import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  COOLDOWN_BASE_MS,
  COOLDOWN_MAX_MS,
  GLOBAL_KEY,
  coolingDown,
  cooldownMs,
  jitterMs,
  loadSourceState,
  pickFeeds,
  recordRun,
  saveSourceState,
} from './awareness-rotation.mjs';

type Row = {
  source: string;
  last_fetched_at: string | null;
  cooldown_until: string | null;
  strikes: number;
};
const NOW = new Date('2026-10-01T12:00:00.000Z');
const minutes = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const feeds = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, url: `u/${id}` }));
const ids = (picked: { id: string }[]) => picked.map((f) => f.id);
const stateOf = (rows: Partial<Row>[]) =>
  new Map(rows.map((r) => [r.source as string, { strikes: 0, ...r } as Row]));
const toState = (rows: Row[]) => new Map(rows.map((r) => [r.source, r]));

describe('feed rotation (persisted cursor)', () => {
  it('starts from the top of the list when nothing is remembered', () => {
    expect(ids(pickFeeds(feeds, new Map(), { now: NOW, budget: 2 }))).toEqual(['a', 'b']);
  });

  it('takes never-fetched feeds first, then the least recently fetched', () => {
    const state = stateOf([
      { source: 'a', last_fetched_at: minutes(-10) },
      { source: 'b', last_fetched_at: minutes(-90) },
      { source: 'c', last_fetched_at: minutes(-30) },
    ]);
    expect(ids(pickFeeds(feeds, state, { now: NOW, budget: 4 }))).toEqual(['d', 'e', 'b', 'c']);
  });

  it('walks the whole list and wraps round when each run records what it asked', () => {
    let state = new Map<string, Row>();
    const seen: string[] = [];
    for (let run = 0; run < 5; run += 1) {
      const now = new Date(NOW.getTime() + run * 20 * 60_000);
      const picked = pickFeeds(feeds, state, { now, budget: 2 });
      seen.push(...ids(picked));
      const rows = recordRun(
        state,
        picked.map((f: { id: string }) => ({ id: f.id, status: 200, skipped: false })),
        now,
      );
      state = new Map([...state, ...toState(rows)]);
    }
    expect(seen.slice(0, 5)).toEqual(['a', 'b', 'c', 'd', 'e']); // each feed once before any repeats
    expect(seen.slice(5)).toHaveLength(5);
    for (const feed of feeds)
      expect(seen.filter((id) => id === feed.id).length).toBeLessThanOrEqual(2);
  });

  it('never picks more than the budget, and none for a zero budget', () => {
    expect(pickFeeds(feeds, new Map(), { now: NOW, budget: 1 })).toHaveLength(1);
    expect(pickFeeds(feeds, new Map(), { now: NOW, budget: 0 })).toEqual([]);
  });
});

describe('cooldown', () => {
  it('doubles from 30 minutes per consecutive failure and caps at 6 hours', () => {
    expect(cooldownMs(0)).toBe(0);
    expect(cooldownMs(1)).toBe(COOLDOWN_BASE_MS);
    expect(cooldownMs(2)).toBe(2 * COOLDOWN_BASE_MS);
    expect(cooldownMs(3)).toBe(4 * COOLDOWN_BASE_MS);
    expect(cooldownMs(20)).toBe(COOLDOWN_MAX_MS);
  });

  it('skips a feed that is cooling down and takes it again once the cooldown has passed', () => {
    const recent = ['b', 'c', 'd', 'e'].map((source) => ({
      source,
      last_fetched_at: minutes(-20),
    }));
    const state = stateOf([
      { source: 'a', last_fetched_at: minutes(-200), cooldown_until: minutes(15), strikes: 1 },
      ...recent,
    ]);
    expect(ids(pickFeeds(feeds, state, { now: NOW, budget: 2 }))).toEqual(['b', 'c']);
    const later = new Date(NOW.getTime() + 16 * 60_000);
    expect(coolingDown(state, 'a', later)).toBe(false);
    expect(ids(pickFeeds(feeds, state, { now: later, budget: 2 }))).toEqual(['a', 'b']);
  });

  it('a 429 puts the feed and the whole lane on cooldown; the next runs make no requests', () => {
    const rows = recordRun(
      new Map(),
      [
        { id: 'a', status: 429, skipped: false },
        { id: 'b', status: null, skipped: true },
      ],
      NOW,
    );
    const byKey = new Map(rows.map((r: Row) => [r.source, r]));
    expect([...byKey.keys()].sort()).toEqual(['*global*', 'a']); // the skipped feed is untouched
    expect(byKey.get('a')).toMatchObject({ strikes: 1, cooldown_until: minutes(30) });
    expect(byKey.get(GLOBAL_KEY)).toMatchObject({ strikes: 1, cooldown_until: minutes(30) });
    const state = toState(rows);
    expect(
      pickFeeds(feeds, state, { now: new Date(NOW.getTime() + 20 * 60_000), budget: 2 }),
    ).toEqual([]);
    expect(
      ids(pickFeeds(feeds, state, { now: new Date(NOW.getTime() + 31 * 60_000), budget: 2 })),
    ).toEqual(['b', 'c']);
  });

  it('consecutive 429s lengthen the lane cooldown; a success clears every strike', () => {
    const first = toState(recordRun(new Map(), [{ id: 'a', status: 429, skipped: false }], NOW));
    const later = new Date(NOW.getTime() + 40 * 60_000);
    const second = toState(recordRun(first, [{ id: 'b', status: 429, skipped: false }], later));
    expect(second.get(GLOBAL_KEY)?.strikes).toBe(2);
    expect(Date.parse(second.get(GLOBAL_KEY)?.cooldown_until as string)).toBe(
      later.getTime() + 2 * COOLDOWN_BASE_MS,
    );
    const healed = toState(
      recordRun(
        second,
        [{ id: 'a', status: 200, skipped: false }],
        new Date(later.getTime() + 3 * 3_600_000),
      ),
    );
    expect(healed.get(GLOBAL_KEY)).toMatchObject({ strikes: 0, cooldown_until: null });
    expect(healed.get('a')).toMatchObject({ strikes: 0, cooldown_until: null });
  });

  it('a lane where every request failed (403s) cools down too, but a mixed non-429 run does not', () => {
    const blocked = recordRun(new Map(), [{ id: 'a', status: 403, skipped: false }], NOW);
    expect(blocked.find((r: Row) => r.source === GLOBAL_KEY)?.strikes).toBe(1);
    const mixed = recordRun(
      new Map(),
      [
        { id: 'a', status: 200, skipped: false },
        { id: 'b', status: 403, skipped: false },
      ],
      NOW,
    );
    expect(mixed.find((r: Row) => r.source === GLOBAL_KEY)?.strikes).toBe(0);
    expect(mixed.find((r: Row) => r.source === 'b')?.strikes).toBe(1);
  });

  it('records nothing for a run that asked for nothing', () => {
    expect(recordRun(new Map(), [], NOW)).toEqual([]);
    expect(recordRun(new Map(), [{ id: 'a', status: null, skipped: true }], NOW)).toEqual([]);
  });
});

describe('persistence and jitter', () => {
  it('loads state keyed by source, and degrades to empty when the table is missing', async () => {
    const ok = {
      from: () => ({
        select: async () => ({
          data: [{ source: 'a', last_fetched_at: null, cooldown_until: null, strikes: 0 }],
          error: null,
        }),
      }),
    };
    expect([...(await loadSourceState(ok)).keys()]).toEqual(['a']);
    const missing = {
      from: () => ({ select: async () => ({ data: null, error: { message: 'no table' } }) }),
    };
    expect((await loadSourceState(missing)).size).toBe(0);
  });

  it('upserts rows by source and never throws on a failed write', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    await saveSourceState({ from: () => ({ upsert }) }, [{ source: 'a' }]);
    expect(upsert).toHaveBeenCalledWith([{ source: 'a' }], { onConflict: 'source' });
    await saveSourceState({ from: () => ({ upsert }) }, []);
    expect(upsert).toHaveBeenCalledTimes(1);
    const boom = {
      from: () => ({
        upsert: async () => {
          throw new Error('down');
        },
      }),
    };
    await expect(saveSourceState(boom, [{ source: 'a' }])).resolves.toBeUndefined();
  });

  it('jitters the start inside [0, max)', () => {
    expect(jitterMs(() => 0, 90_000)).toBe(0);
    expect(jitterMs(() => 0.5, 90_000)).toBe(45_000);
    expect(jitterMs(() => 0.999999, 90_000)).toBeLessThan(90_000);
    expect(jitterMs(() => 0.5, 0)).toBe(0);
  });
});
