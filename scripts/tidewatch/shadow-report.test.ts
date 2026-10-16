import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { planActions } from './actions/plan.mjs';
// @ts-expect-error plain .mjs module
import { disagreementMetric } from './route.mjs';
// @ts-expect-error plain .mjs module
import { main as postMain } from './shadow-report-post.mjs';
// @ts-expect-error plain .mjs module
import { computeReport, enrichSpotCheck, evaluateAlerts, loadRouting, main, renderMarkdown } from './shadow-report.mjs';

const routing = await loadRouting();
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const config = JSON.parse(await readFile(path.join(ROOT, 'config/tidewatch.json'), 'utf8'));
const NOW = new Date('2026-10-18T12:00:00Z');
const START = '2026-10-16T02:49:00Z';
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

const rumor = { jev: { q_class: { type: 'choice', optionId: 'rumor_or_unconfirmed', probabilities: { rumor_or_unconfirmed: 0.9 } } } };
const agree = { jev: { q_class: { type: 'choice', optionId: 'general_news', probabilities: { general_news: 0.9 } } } };

let seq = 0;
const row = (overrides: Record<string, unknown> = {}) => ({
  id: `d${seq++}`, class: 'normal_news', confidence: 1, decider: 'jev', answers: agree,
  decided_at: hoursAgo(1),
  watch_item: { source: 'news', source_ref: 'story-1', item_key: 'news:story-1', excerpt: 'A headline' },
  ...overrides,
});
const run = (startedHoursAgo: number, minutes = 3, conclusion = 'success') => ({
  created_at: hoursAgo(startedHoursAgo), run_started_at: hoursAgo(startedHoursAgo), status: 'completed',
  conclusion, updated_at: new Date(NOW.getTime() - startedHoursAgo * 3600_000 + minutes * 60_000).toISOString(),
});
const hourlyRuns = (n: number) => Array.from({ length: n }, (_, i) => run(0.5 + i));

describe('computeReport', () => {
  it('counts decisions, classes, the 500 projection and day progress', () => {
    const rows = [
      ...Array.from({ length: 10 }, () => row()),
      row({ class: 'rumor', decided_at: hoursAgo(30) }),
      row({ decided_at: '2026-10-10T00:00:00Z' }),
    ];
    const report = computeReport({ routing, rows, runs: hourlyRuns(24), now: NOW, config, start: START });
    expect(report.decisions).toMatchObject({ total: 11, last24h: 10, remaining: 489 });
    expect(report.decisions.projectedGateDate).toBe('2026-12-06');
    expect(report.days.elapsed).toBe(2.4);
    expect(report.classes.h24).toEqual({ normal_news: 10 });
    expect(report.classes.cumulative).toEqual({ normal_news: 10, rumor: 1 });
  });

  it('reports the gate as reached and n/a with no recent rate', () => {
    const many = Array.from({ length: 500 }, () => row({ decided_at: hoursAgo(40) }));
    expect(computeReport({ routing, rows: many, runs: [], now: NOW, config, start: START }).decisions.projectedGateDate).toBe('reached');
    const idle = [row({ decided_at: hoursAgo(40) })];
    expect(computeReport({ routing, rows: idle, runs: [], now: NOW, config, start: START }).decisions.projectedGateDate).toMatch(/^n\/a/);
  });

  it('counts sweeps and flags fewer than 22 or any over 5 minutes', () => {
    const ok = computeReport({ routing, rows: [], runs: hourlyRuns(23), now: NOW, config, start: START });
    expect(ok.sweeps).toMatchObject({ started24h: 23, succeeded24h: 23, failed24h: 0 });
    expect(ok.flags).toEqual([]);
    const bad = computeReport({ routing, rows: [], runs: [...hourlyRuns(20), run(21, 6, 'failure')], now: NOW, config, start: START });
    expect(bad.sweeps).toMatchObject({ started24h: 21, failed24h: 1 });
    expect(bad.sweeps.maxDurationMin).toBe(6);
    expect(bad.flags.join(' ')).toContain('only 21 sweeps');
    expect(bad.flags.join(' ')).toContain('slowest sweep 6.0 min');
  });

  it('does not flag the sweep count while still inside the first day', () => {
    const early = computeReport({ routing, rows: [], runs: hourlyRuns(5), now: new Date('2026-10-16T12:00:00Z'), config, start: START });
    expect(early.sweeps.warmingUp).toBe(true);
    expect(early.flags).toEqual([]);
  });

  it('aggregates disagreement exactly like route.mjs disagreementMetric', () => {
    const rows = [
      row({ answers: rumor }), row({ answers: rumor }),
      ...Array.from({ length: 18 }, () => row()),
      row({ answers: {} }),
      row({ class: 'not_a_class' }),
    ];
    const expected = disagreementMetric(rows.slice(0, 21)
      .map((r) => planActions(r.class, r.answers, r.confidence, null, config)));
    const report = computeReport({ routing, rows, runs: [], now: NOW, config, start: START });
    expect(report.disagreement.cumulative).toEqual(expected);
    expect(expected).toEqual({ count: 2, total: 20, rate: 0.1, stop: false });
    const stopped = computeReport({ routing, rows: [...rows, row({ answers: rumor })], runs: [], now: NOW, config, start: START });
    expect(stopped.disagreement.cumulative.stop).toBe(true);
    expect(stopped.flags.join(' ')).toContain('disagreement');
  });

  it('derives the haiku fallback rate and builds the critical spot-check list', () => {
    const rows = [
      row({ decider: 'haiku' }), row(),
      row({ class: 'critical_breaking', watch_item: { source: 'official', source_ref: 'ref-9', item_key: 'k', excerpt: 'Big news\nnow' } }),
      row({ class: 'critical_breaking', decided_at: hoursAgo(30) }),
    ];
    const report = computeReport({ routing, rows, runs: [], now: NOW, config, start: START });
    expect(report.fallback.h24).toMatchObject({ count: 1, total: 3 });
    expect(report.spotCheck).toHaveLength(1);
    expect(report.spotCheck[0]).toMatchObject({ class: 'critical_breaking', headline: 'Big news now', source: 'official:ref-9' });
  });
});

describe('renderMarkdown', () => {
  it('truncates the spot-check list with +N more under the limit', () => {
    const rows = Array.from({ length: 60 }, () => row({ class: 'critical_breaking', watch_item: { source: 'news', source_ref: 's', item_key: 'k', excerpt: 'x'.repeat(200) } }));
    const report = computeReport({ routing, rows, runs: [], now: NOW, config, start: START });
    const short = renderMarkdown(report, { maxChars: 1900 });
    expect(short.length).toBeLessThanOrEqual(1900);
    expect(short).toMatch(/\+\d+ more/);
    expect(renderMarkdown(report)).not.toMatch(/\+\d+ more/);
  });
});

describe('evaluateAlerts', () => {
  const base = (rows: unknown[], runs: unknown[]) => computeReport({ routing, rows, runs, now: NOW, config, start: START });
  const nowMs = NOW.getTime();

  it('fires no-run when nothing started in 2h', () => {
    const { fresh } = evaluateAlerts(base([], [run(3)]), {}, nowMs);
    expect(fresh.map((a: { key: string }) => a.key)).toEqual(['no-run']);
    expect(evaluateAlerts(base([], [run(1)]), {}, nowMs).triggered).toEqual([]);
  });

  it('fires on cumulative disagreement above 10% with at least 50 decisions', () => {
    const mk = (bad: number, good: number) => [...Array.from({ length: bad }, () => row({ answers: rumor })), ...Array.from({ length: good }, () => row())];
    expect(evaluateAlerts(base(mk(10, 40), [run(1)]), {}, nowMs).fresh.map((a: { key: string }) => a.key)).toEqual(['disagreement']);
    expect(evaluateAlerts(base(mk(5, 45), [run(1)]), {}, nowMs).triggered).toEqual([]);
    expect(evaluateAlerts(base(mk(10, 30), [run(1)]), {}, nowMs).triggered).toEqual([]);
  });

  it('fires on 3 failed sweeps in 6h', () => {
    const runs = [run(0.5), run(1.5, 3, 'failure'), run(2.5, 3, 'failure'), run(3.5, 3, 'timed_out')];
    expect(evaluateAlerts(base([], runs), {}, nowMs).fresh.map((a: { key: string }) => a.key)).toEqual(['failures']);
    expect(evaluateAlerts(base([], runs.slice(0, 3)), {}, nowMs).triggered).toEqual([]);
  });

  it('suppresses a repeat inside 6h and re-fires after', () => {
    const report = base([], [run(3)]);
    expect(evaluateAlerts(report, { 'no-run': hoursAgo(5) }, nowMs).fresh).toEqual([]);
    expect(evaluateAlerts(report, { 'no-run': hoursAgo(5) }, nowMs).triggered).toHaveLength(1);
    expect(evaluateAlerts(report, { 'no-run': hoursAgo(7) }, nowMs).fresh).toHaveLength(1);
  });
});

function fakeClient(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const name of ['select', 'eq', 'gte', 'order']) chain[name] = () => chain;
  chain.range = async () => ({ data: rows, error: null });
  return { from: () => chain };
}

describe('main', () => {
  const deps = (over: Record<string, unknown> = {}) => ({
    client: fakeClient([row({ class: 'critical_breaking' })]), config, now: NOW,
    fetchRuns: async () => hourlyRuns(23), log: vi.fn(), writeFile: vi.fn(async () => {}),
    appendFile: vi.fn(async () => {}), env: { GITHUB_STEP_SUMMARY: 'summary.md' }, ...over,
  });

  it('writes the summary, the JSON report and a payload within the Discord limit', async () => {
    const d = deps();
    const result = await main([], d);
    expect(result.payload.text.length).toBeLessThanOrEqual(1900);
    expect(d.appendFile).toHaveBeenCalledTimes(1);
    expect(d.writeFile).toHaveBeenCalledTimes(2);
  });

  it('alert mode writes a payload only for a fresh alert', async () => {
    const quiet = deps();
    expect((await main(['--alert'], quiet)).payload).toBeNull();
    expect(quiet.writeFile).toHaveBeenCalledTimes(1);

    const stale = deps({ fetchRuns: async () => [run(5)], state: {} });
    const { payload } = await main(['--alert'], stale);
    expect(payload.text).toContain('No tidewatch run started');
    expect(payload.stateUpdate).toEqual({ 'no-run': NOW.toISOString() });

    const repeat = deps({ fetchRuns: async () => [run(5)], state: { 'no-run': hoursAgo(1) } });
    expect((await main(['--alert'], repeat)).payload).toBeNull();
  });
});

describe('shadow-report-post', () => {
  const payload = { text: 'hello', stateUpdate: { 'no-run': 'T' } };
  const env = { DISCORD_MARJORIE_WEBHOOK_URL: 'https://example.invalid/hook' };

  it('posts through the Marjorie helper and records the alert state', async () => {
    const post = vi.fn(async () => ({ ok: true }));
    const write = vi.fn(async () => {});
    const result = await postMain(['--state-file', 's.json'], { payload, env, post, state: { old: 'x' }, writeFile: write, log: vi.fn() });
    expect(result.posted).toBe(true);
    expect(post).toHaveBeenCalledWith('hello', { webhook: env.DISCORD_MARJORIE_WEBHOOK_URL });
    expect(JSON.parse(write.mock.calls[0][1] as string)).toEqual({ old: 'x', 'no-run': 'T' });
  });

  it('does not post when TIDEWATCH_REPORT_POST_ENABLED is exactly false, nor without a payload', async () => {
    const post = vi.fn(async () => ({ ok: true }));
    const off = await postMain([], { payload, env: { ...env, TIDEWATCH_REPORT_POST_ENABLED: 'false' }, post, log: vi.fn() });
    expect(off.posted).toBe(false);
    expect((await postMain([], { payload: null, env, post, log: vi.fn() })).posted).toBe(false);
    expect(post).not.toHaveBeenCalled();
    const on = await postMain([], { payload, env: { ...env, TIDEWATCH_REPORT_POST_ENABLED: '' }, post, log: vi.fn() });
    expect(on.posted).toBe(true);
  });

  it('fails loudly, without recording state, when Discord refuses', async () => {
    const write = vi.fn(async () => {});
    await expect(postMain(['--state-file', 's.json'], { payload, env, post: async () => ({ ok: false, error: 'HTTP 500' }), writeFile: write, state: {}, log: vi.fn() }))
      .rejects.toThrow('Discord post failed');
    expect(write).not.toHaveBeenCalled();
  });
});

describe('enrichSpotCheck', () => {
  const table = (rows: unknown[]) => ({ select: () => ({ in: async () => ({ data: rows, error: null }) }) });
  const item = (over: Record<string, unknown> = {}) => ({ class: 'critical_breaking', decidedAt: hoursAgo(1), headline: 'summary', source: 'news:s1', sourceName: 'news', ref: 's1', itemKey: 'news:s1', ...over });

  it('adds the readable headline and source link from the news tables, and renders them', async () => {
    const client = { from: (name: string) => table(name === 'news_story'
      ? [{ id: 's1', canonical_title: 'Real headline' }]
      : [{ id: 'r1', story_id: 's1', url: 'https://example.com/a', title: 'Raw' }]) };
    const [out] = await enrichSpotCheck(client, [item()], 'o/r');
    expect(out).toMatchObject({ headline: 'Real headline', url: 'https://example.com/a' });
    const report = { generatedAt: NOW.toISOString(), flags: [], decisions: { total: 1, gate: 500, projectedGateDate: 'x', last24h: 1 }, days: { elapsed: 1, gate: 7 },
      sweeps: { started24h: 1, succeeded24h: 1, failed24h: 0, maxDurationMin: 1, warmingUp: false }, disagreement: { h24: { rate: 0, count: 0, total: 0 }, cumulative: { rate: 0, count: 0, total: 0 } },
      fallback: { h24: { rate: 0, count: 0, total: 0 }, cumulative: { rate: 0, count: 0, total: 0 } }, classes: { h24: {}, cumulative: {} }, spotCheck: [out] };
    expect(renderMarkdown(report)).toContain('Real headline [news:s1] <https://example.com/a>');
  });

  it('derives youtube and issue links from the item key and survives a failing lookup', async () => {
    const boom = { from: () => { throw new Error('down'); } };
    const out = await enrichSpotCheck(boom, [item({ sourceName: 'youtube', itemKey: 'yt:abc_1' }), item({ sourceName: 'official', itemKey: 'issue:42' })], 'o/r');
    expect(out[0].url).toBe('https://www.youtube.com/watch?v=abc_1');
    expect(out[1].url).toBe('https://github.com/o/r/issues/42');
  });
});
