import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { fetchAwarenessCounts, summarizeAwareness } from './lib/growth-awareness.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { buildGrowthData, weekWindow } from './lib/growth-data.mjs';

const win = weekWindow('2026-10-04', 0);

function fakeSupabase(
  result: { data?: unknown; error?: unknown },
  seen: Record<string, unknown> = {},
) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (col: string, val: string) => {
      seen[col] = val;
      return builder;
    },
    gte: (col: string, val: string) => {
      seen[`gte:${col}`] = val;
      return builder;
    },
    lte: (col: string, val: string) => {
      seen[`lte:${col}`] = val;
      return Promise.resolve(result);
    },
  };
  return { from: () => builder };
}

describe('awareness growth numbers', () => {
  it('counts delivered / posted / skipped / open for the cohort', () => {
    const rows = [
      { status: 'posted' },
      { status: 'posted' },
      { status: 'skipped_by_founder' },
      { status: 'delivered' },
    ];
    expect(summarizeAwareness(rows)).toMatchObject({
      delivered: 4,
      posted: 2,
      skipped: 1,
      open: 1,
    });
    expect(summarizeAwareness([])).toMatchObject({ delivered: 0, posted: 0, skipped: 0, open: 0 });
  });

  it('queries awareness leads by Discord delivery time inside the week window', async () => {
    const seen: Record<string, unknown> = {};
    const out = await fetchAwarenessCounts(
      fakeSupabase({ data: [{ status: 'posted' }, { status: 'delivered' }] }, seen),
      win,
    );
    expect(out).toMatchObject({ delivered: 2, posted: 1, skipped: 0, open: 1 });
    expect(seen.kind).toBe('awareness_reply');
    expect(seen['gte:discord_delivered_at']).toBe(win.start);
    expect(seen['lte:discord_delivered_at']).toBe(win.end);
  });

  it('reads a not-yet-migrated schema as zeros and rethrows real errors', async () => {
    const pending = await fetchAwarenessCounts(
      fakeSupabase({ error: { message: 'column "kind" does not exist' } }),
      win,
    );
    expect(pending.delivered).toBe(0);
    await expect(
      fetchAwarenessCounts(fakeSupabase({ error: { message: 'boom' } }), win),
    ).rejects.toMatchObject({ message: 'boom' });
  });

  it('is carried into the growth data as `awareness` (null when not collected)', () => {
    const base = {
      win,
      series: [],
      posted: [],
      postMetrics: [],
      content: { mergedContentPRs: 0, items: [] },
      coverage: [],
      treeAsks: [],
      eventStatus: null,
    };
    expect(
      buildGrowthData({ ...base, awareness: { delivered: 3, posted: 1, skipped: 1, open: 1 } })
        .awareness,
    ).toMatchObject({ delivered: 3 });
    expect(buildGrowthData(base).awareness).toBeNull();
  });
});
