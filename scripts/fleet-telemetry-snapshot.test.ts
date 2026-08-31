import { describe, expect, it } from 'vitest';
import { isoDaysAgo, bucketRunsByWorkflow, buildReport } from './fleet-telemetry-snapshot.mjs';

describe('isoDaysAgo', () => {
  it('returns a YYYY-MM-DD string N days before the given date', () => {
    expect(isoDaysAgo(new Date('2026-08-31T12:00:00Z'), 30)).toBe('2026-08-01');
  });

  it('crosses a year boundary correctly', () => {
    expect(isoDaysAgo(new Date('2026-01-15T00:00:00Z'), 30)).toBe('2025-12-16');
  });

  it('returns the same date for 0 days', () => {
    expect(isoDaysAgo(new Date('2026-08-31T12:00:00Z'), 0)).toBe('2026-08-31');
  });
});

describe('bucketRunsByWorkflow', () => {
  const since = '2026-08-01';

  it('counts runs on/after the cutoff, grouped by workflow name', () => {
    const runs = [
      { name: 'ci', created_at: '2026-08-05T00:00:00Z' },
      { name: 'ci', created_at: '2026-08-10T00:00:00Z' },
      { name: 'watchdog', created_at: '2026-08-02T00:00:00Z' },
    ];
    expect(bucketRunsByWorkflow(runs, since)).toEqual({ ci: 2, watchdog: 1 });
  });

  it('excludes runs strictly before the cutoff', () => {
    const runs = [
      { name: 'ci', created_at: '2026-07-31T23:59:59Z' },
      { name: 'ci', created_at: '2026-08-01T00:00:00Z' },
    ];
    expect(bucketRunsByWorkflow(runs, since)).toEqual({ ci: 1 });
  });

  it('falls back to path when name is missing, and unknown when both are missing', () => {
    const runs = [
      { path: '.github/workflows/foo.yml', created_at: '2026-08-05T00:00:00Z' },
      { created_at: '2026-08-05T00:00:00Z' },
    ];
    expect(bucketRunsByWorkflow(runs, since)).toEqual({
      '.github/workflows/foo.yml': 1,
      unknown: 1,
    });
  });

  it('returns an empty object for an empty run list', () => {
    expect(bucketRunsByWorkflow([], since)).toEqual({});
  });
});

describe('buildReport', () => {
  it('renders total runs, open PRs, and a sorted-descending workflow table with no previous snapshot', () => {
    const report = buildReport({
      month: '2026-08',
      sinceIso: '2026-08-01',
      runCounts: { ci: 5, watchdog: 12 },
      openPrCount: 3,
      previous: null,
    });
    expect(report).toContain('# Fleet telemetry snapshot — 2026-08');
    expect(report).toContain('**Open PRs:** 3');
    expect(report).toContain('**Total workflow runs, last 30 days:** 17');
    // watchdog (12) sorts before ci (5)
    const watchdogIdx = report.indexOf('| watchdog |');
    const ciIdx = report.indexOf('| ci |');
    expect(watchdogIdx).toBeGreaterThan(-1);
    expect(watchdogIdx).toBeLessThan(ciIdx);
    // No previous snapshot: deltas are all em-dash, no "vs. previous" on PR line
    expect(report).toContain('| watchdog | 12 | — |');
    expect(report).not.toContain('vs. previous snapshot)');
  });

  it('computes signed deltas against a previous snapshot', () => {
    const report = buildReport({
      month: '2026-09',
      sinceIso: '2026-08-01',
      runCounts: { ci: 8, watchdog: 10 },
      openPrCount: 5,
      previous: { runCounts: { ci: 5, watchdog: 12 }, openPrCount: 3 },
    });
    expect(report).toContain('**Open PRs:** 5 (Δ +2 vs. previous snapshot)');
    expect(report).toContain('| ci | 8 | +3 |');
    expect(report).toContain('| watchdog | 10 | -2 |');
  });

  it('marks a workflow new since the previous snapshot with an em-dash delta', () => {
    const report = buildReport({
      month: '2026-09',
      sinceIso: '2026-08-01',
      runCounts: { ci: 8, 'new-workflow': 2 },
      openPrCount: 1,
      previous: { runCounts: { ci: 5 }, openPrCount: 1 },
    });
    expect(report).toContain('| new-workflow | 2 | — |');
  });
});
