import { describe, expect, it } from 'vitest';
import {
  SPEED_COLD_BAR_MS,
  SPEED_WARM_BAR_MS,
  parseDiagReport,
} from '../../web/app/api/feedback/diag';
import {
  COLD_BAR_MS,
  WARM_BAR_MS,
  launchMetric,
  launchReport,
  newRunId,
  panelLines,
  parseState,
  recordLaunch,
  startRun,
  summarizeRun,
  summaryReport,
  type LaunchResult,
} from './speed-test';

const env = { model: 'Pixel 10 Pro', os: 'android 16', build: '1.0.0 (18)', updateId: 'embedded' };
const r = (k: 'cold' | 'warm', ms: number, extra: Partial<LaunchResult> = {}): LaunchResult => ({
  k,
  ms,
  ui: 'shared',
  anchor: 'native',
  img: k === 'cold' ? 4 : null,
  ...extra,
});
const stage = (name: string, totalMs: number, firstStartMs: number) => ({
  stage: name,
  count: 1,
  totalMs,
  maxMs: totalMs,
  firstStartMs,
});

describe('bar', () => {
  it('matches the server and PLAN.md WP0.2 (cold 2.5 s, warm 1 s)', () => {
    expect(COLD_BAR_MS).toBe(2500);
    expect(WARM_BAR_MS).toBe(1000);
    expect(SPEED_COLD_BAR_MS).toBe(COLD_BAR_MS);
    expect(SPEED_WARM_BAR_MS).toBe(WARM_BAR_MS);
  });
});

const many = (k: 'cold' | 'warm', n: number, ms: number) => Array.from({ length: n }, () => r(k, ms));

describe('summarizeRun pass/fail math', () => {
  it('passes at exactly the bar with worst-of-5 per kind and reports the worst of each kind', () => {
    const s = summarizeRun([...many('cold', 4, 2100), r('cold', 2500), ...many('warm', 4, 400), r('warm', 1000)]);
    expect(s).toEqual({ worstCold: 2500, worstWarm: 1000, verdict: 'PASS' });
  });
  it('is INCOMPLETE below 5 cold or 5 warm, even when every launch is under the bar', () => {
    expect(summarizeRun([r('cold', 100), ...many('warm', 9, 100)]).verdict).toBe('INCOMPLETE');
    expect(summarizeRun([...many('cold', 4, 100), ...many('warm', 6, 100)]).verdict).toBe('INCOMPLETE');
    expect(summarizeRun([...many('cold', 5, 100), ...many('warm', 5, 100)]).verdict).toBe('PASS');
  });
  it('fails when either kind is over', () => {
    expect(summarizeRun([...many('cold', 5, 1), r('cold', 2500.1), ...many('warm', 5, 1)]).verdict).toBe('FAIL');
    expect(summarizeRun([...many('cold', 5, 1), ...many('warm', 5, 1), r('warm', 1000.1)]).verdict).toBe('FAIL');
  });
  it('is incomplete without both kinds, and FAIL still wins over incomplete', () => {
    expect(summarizeRun([r('cold', 1000)])).toEqual({ worstCold: 1000, worstWarm: null, verdict: 'INCOMPLETE' });
    expect(summarizeRun([r('warm', 5000)]).verdict).toBe('FAIL');
    expect(summarizeRun([]).verdict).toBe('INCOMPLETE');
  });
});

describe('run state', () => {
  it('starts with N remaining, a hex run id, and counts down to inactive', () => {
    const s = startRun(2, () => 0.5);
    expect(s).toEqual({ v: 1, run: '88888888', total: 2, remaining: 2, results: [] });
    const a = recordLaunch(s, r('cold', 1));
    expect(a.remaining).toBe(1);
    const b = recordLaunch(a, r('warm', 1));
    expect(b.remaining).toBe(0);
    expect(recordLaunch(b, r('warm', 2))).toBe(b);
    expect(newRunId()).toMatch(/^[0-9a-f]{8}$/);
  });
  it('clamps the launch count', () => {
    expect(startRun(0).total).toBe(1);
    expect(startRun(999).total).toBe(30);
  });
  it('round-trips through storage and rejects anything malformed', () => {
    const s = recordLaunch(startRun(3), r('cold', 1234.5));
    expect(parseState(JSON.stringify(s))).toEqual(s);
    expect(parseState(null)).toBeNull();
    expect(parseState('{')).toBeNull();
    expect(parseState(JSON.stringify({ ...s, remaining: 5 }))).toBeNull();
    expect(parseState(JSON.stringify({ ...s, run: 'ZZZZ' }))).toBeNull();
    expect(parseState(JSON.stringify({ ...s, results: [{ k: 'hot', ms: 1 }] }))).toBeNull();
  });
  it('describes the panel state', () => {
    expect(panelLines(null)).toEqual(['Speed test: off']);
    expect(panelLines(startRun(10, () => 0))[0]).toBe('Speed test: ON, run 00000000');
    const done = recordLaunch(startRun(1, () => 0), r('cold', 3000));
    expect(panelLines(done)[0]).toContain('FAIL');
  });
});

describe('launchMetric', () => {
  it('cold = native lead + first-era-paint when the native anchor exists', () => {
    const summary = {
      launch: 'cold' as const,
      stages: [stage('first-era-paint', 0, 770.7), stage('native-lead', 640, 0)],
      slowestDownloads: [],
    };
    expect(launchMetric(summary, 'cold')).toEqual({ ms: 1410.7, anchor: 'native' });
  });
  it('cold falls back to JS start -> paint, labelled js', () => {
    const summary = { launch: 'cold' as const, stages: [stage('first-era-paint', 0, 770.7)], slowestDownloads: [] };
    expect(launchMetric(summary, 'cold')).toEqual({ ms: 770.7, anchor: 'js' });
  });
  it('warm = resume -> resume-paint; null when the paint mark is missing', () => {
    const warm = { launch: 'warm' as const, stages: [stage('resume-paint', 0, 85.04)], slowestDownloads: [] };
    expect(launchMetric(warm, 'warm')).toEqual({ ms: 85, anchor: 'js' });
    expect(launchMetric({ launch: 'warm', stages: [], slowestDownloads: [] }, 'warm')).toBeNull();
    expect(launchMetric(warm, 'cold')).toBeNull();
  });
});

describe('reports against the server schema', () => {
  const summary = {
    launch: 'cold' as const,
    stages: [stage('first-era-paint', 0, 770.7), stage('first-image-paint', 0, 900), stage('native-lead', 640, 0)],
    slowestDownloads: [],
  };
  it('a launch report carries the run id, index, ui, anchor and image count and validates', () => {
    const state = recordLaunch(startRun(10, () => 0.1), r('cold', 1000));
    const p = launchReport(env, summary, state, r('warm', 90, { img: null, ui: 'native', anchor: 'js' }));
    expect(p.diag.speed).toEqual({ run: state.run, kind: 'launch', index: 2, total: 10, ui: 'native', anchor: 'js' });
    const withImg = launchReport(env, summary, state, r('cold', 1400));
    expect(withImg.diag.speed?.images10s).toBe(4);
    expect(withImg.diag.timings['at:first-image-paint']).toBe(900);
    const parsed = parseDiagReport(withImg.diag);
    expect(parsed.ok).toBe(true);
  });
  it('the summary validates with empty timings and carries every launch', () => {
    let state = startRun(2, () => 0.3);
    state = recordLaunch(recordLaunch(state, r('cold', 1800)), r('warm', 600));
    const p = summaryReport(env, state);
    expect(p.diag.timings).toEqual({});
    expect(p.diag.speed).toMatchObject({ kind: 'summary', index: 2, total: 2, anchor: 'native' });
    expect(p.diag.speed?.launches).toEqual([
      { k: 'cold', ms: 1800 },
      { k: 'warm', ms: 600 },
    ]);
    expect(parseDiagReport(p.diag).ok).toBe(true);
  });
});
