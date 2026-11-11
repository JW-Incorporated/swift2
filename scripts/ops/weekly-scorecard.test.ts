import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildScorecard, countSeedChanges, loadSources, writeWeeklyScorecard } from './weekly-scorecard.mjs';

const now = new Date('2026-10-19T09:23:00.000Z');
const start = '2026-10-12T09:23:00.000Z';
const dirs: string[] = [];

function fixture() {
  return {
    start, end: now.toISOString(),
    timelines: [{ story_id: 'story-1', first_public_at: '2026-10-18T10:00:00Z', detected_at: '2026-10-18T10:05:00Z',
      classified_at: '2026-10-18T10:10:00Z', verified_at: '2026-10-18T10:15:00Z', on_site_at: '2026-10-18T10:30:00Z',
      push_at: '2026-10-18T10:35:00Z', social_at: '2026-10-18T10:45:00Z' }],
    decisions: [{ class: 'critical_breaking', watch_item: { story_id: 'story-1' } }],
    llm: [{ calls: 3, input_tokens: 10, output_tokens: 5, est_cost_usd: 0.25 }],
    theories: [{ id: 'candidate-1' }], liveTheories: [{ id: 'live-1', promoted_to: 'seed-1' }],
    currentItems: [{ id: 'item-1', image_url: 'https://example.com/image.jpg', quality_hold_reason: null }],
    leads: [{ id: 'lead-1', platform: 'reddit', url: 'https://reddit.com/r/test/comments/1', locator: null }],
    ledgers: [{ id: 'post-1', lead_id: 'lead-1', platform: 'reddit' }],
    outcomes: [{ post_ledger_id: 'post-1', platform: 'reddit', score: 5, replies: 2, horizon: '24h' },
      { post_ledger_id: 'post-1', platform: 'reddit', score: 7, replies: 2, horizon: '7d' }],
    budget: { routines: [{ totalTurns: 12 }] },
    news: { rows: [{ events: 10, hit_48h: 0.9, hit_1h_critical: 1, window_start: start, generated_at: now.toISOString() }] },
    voice: [{ week: '2026-W42', sampled: 20, scored: 20, mean: 4.2, p10: 3.4 }],
    seedChanges: { fanMade: 2, matched: 3, matchedWithLiveAffiliate: 1 },
  };
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('weekly scorecard', () => {
  it('populates all 11 goals from readable sources', () => {
    const report = buildScorecard(fixture(), now);
    expect(report.entries.map((row) => row.goal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(report.entries.every((row) => row.value !== 'not measurable yet')).toBe(true);
    expect(report.entries[0].value).toMatchObject({ eligible: 1, siteShare: 1, pushShare: 1, socialShare: 1 });
    expect(report.operations).toEqual({ routineTurns: 12, llmCalls: 3, estimatedCostUsd: 0.25 });
  });

  it('does not count missing delivery timestamps as on-time and averages an even median', () => {
    const data = fixture();
    data.timelines[0].push_at = null as never;
    data.outcomes.unshift({ post_ledger_id: 'post-1', platform: 'reddit', score: 3, replies: 0, horizon: '24h' });
    const report = buildScorecard(data, now);
    expect(report.entries[0].value).toMatchObject({ pushShare: 0 });
    expect(report.entries[7].value).toBe(4);
  });

  it('uses explicit reasons when a downstream metric has no eligible rows yet', () => {
    const data = fixture();
    data.news = { rows: [] };
    data.voice = [];
    data.outcomes = [];
    const report = buildScorecard(data, now);
    for (const goal of [2, 6, 8, 9]) {
      expect(report.entries[goal - 1]).toMatchObject({ value: 'not measurable yet' });
      expect(report.entries[goal - 1].reason).toBeTruthy();
    }
  });

  it('fails red and writes no file when a source is unreadable', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'weekly-scorecard-'));
    dirs.push(dir);
    const outputPath = path.join(dir, 'scorecard.json');
    await expect(writeWeeklyScorecard({
      outputPath, now, client: {} as never,
      sourceLoader: async () => { throw new Error('story_timeline unreadable: relation does not exist'); },
    })).rejects.toThrow('story_timeline unreadable');
    await expect(readFile(outputPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('pages every table read and matches in-window stories to decisions made before the window', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'weekly-scorecard-'));
    dirs.push(dir);
    await mkdir(path.join(dir, 'docs/ops/dashboard'), { recursive: true });
    await writeFile(path.join(dir, 'docs/ops/dashboard/budget.json'), '{"routines":[]}');
    await writeFile(path.join(dir, 'docs/ops/AFFILIATE-COVERAGE.md'), '');

    const rows = {
      story_timeline: [{ story_id: 'story-1', first_public_at: '2026-10-18T10:00:00Z' }],
      watch_decision: [{ class: 'critical_breaking', decided_at: '2026-10-01T10:00:00Z',
        watch_item: { story_id: 'story-1' } }],
      llm_usage: Array.from({ length: 2500 }, (_, index) => ({ calls: 1, created_at: start, caller: `caller-${index}` })),
      fan_theory_candidate: [], live_theory: [], current_item: [], engagement_lead: [],
      community_post_ledger: [], community_outcome: [],
    };
    const ranges = new Map<string, number[][]>();
    const filters = new Map<string, string[]>();
    const orders = new Map<string, string[][]>();
    const client = { from(table: keyof typeof rows) {
      const pageOrders: string[] = [];
      const query = {
        select() { return query; },
        gte(column: string) { filters.set(table, [...(filters.get(table) ?? []), `gte:${column}`]); return query; },
        lte(column: string) { filters.set(table, [...(filters.get(table) ?? []), `lte:${column}`]); return query; },
        order(column: string, options: { ascending: boolean }) {
          expect(options).toEqual({ ascending: true });
          pageOrders.push(column);
          return query;
        },
        range(pageStart: number, pageEnd: number) {
          ranges.set(table, [...(ranges.get(table) ?? []), [pageStart, pageEnd]]);
          orders.set(table, [...(orders.get(table) ?? []), [...pageOrders]]);
          return Promise.resolve({ data: rows[table].slice(pageStart, pageEnd + 1), error: null });
        },
      };
      return query;
    } };

    const data = await loadSources({
      client: client as never, now, root: dir, runGit: async () => ({ stdout: '' }),
    });
    expect(data.llm).toHaveLength(2500);
    expect(ranges.get('llm_usage')).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
    const expectedOrders = {
      story_timeline: ['story_id'], watch_decision: ['id'], llm_usage: ['id'], fan_theory_candidate: ['id'],
      live_theory: ['id'], current_item: ['id'], engagement_lead: ['id'], community_post_ledger: ['id'],
      community_outcome: ['post_ledger_id', 'horizon'],
    };
    for (const [table, expected] of Object.entries(expectedOrders)) {
      expect(orders.get(table)?.every((pageOrder) => JSON.stringify(pageOrder) === JSON.stringify(expected))).toBe(true);
    }
    expect(filters.get('watch_decision')).toBeUndefined();
    expect(buildScorecard({ ...fixture(), timelines: data.timelines, decisions: data.decisions }, now).entries[0].value)
      .toMatchObject({ eligible: 1 });
    await expect(loadSources({
      client: client as never, now, root: dir,
      runGit: async () => { throw new Error('fatal: bad revision'); },
    })).rejects.toThrow('seed diffs unreadable: fatal: bad revision');
  });

  it('counts only added seed rows and matches wrapped affiliate products', () => {
    const diff = [
      '+    discoveredAt: \'2026-10-18T00:00:00Z\',',
      '+        discoveredAt: \'provenance timestamp\',',
      '+          item: \'Wrapped Dress\',',
      '+          matchTier: \'exact\',',
      ' unchanged matchTier: close',
    ].join('\n');
    const affiliate = '| Wrapped Dress | shop.example | awin | wrapped | awin link | source |  |';
    expect(countSeedChanges(diff, affiliate)).toEqual({ fanMade: 1, matched: 1, matchedWithLiveAffiliate: 1 });
  });
});
