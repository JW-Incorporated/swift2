import { describe, expect, it } from 'vitest';
import { isoDaysAgo, buildRunCounts, buildReport } from './fleet-telemetry-snapshot.mjs';

describe('isoDaysAgo', () => {
  it('returns a full ISO timestamp N days before the given date, preserving time-of-day', () => {
    expect(isoDaysAgo(new Date('2026-08-31T12:34:56.000Z'), 30)).toBe('2026-08-01T12:34:56.000Z');
  });

  it('crosses a year boundary correctly', () => {
    expect(isoDaysAgo(new Date('2026-01-15T00:00:00.000Z'), 30)).toBe('2025-12-16T00:00:00.000Z');
  });

  it('returns the same instant for 0 days', () => {
    expect(isoDaysAgo(new Date('2026-08-31T12:00:00.000Z'), 0)).toBe('2026-08-31T12:00:00.000Z');
  });
});

describe('buildRunCounts', () => {
  it('maps workflow totals to a name->count object', () => {
    expect(buildRunCounts([{ name: 'ci', totalCount: 5 }, { name: 'watchdog', totalCount: 12 }])).toEqual({
      ci: 5,
      watchdog: 12,
    });
  });

  it('drops workflows with zero runs this window', () => {
    expect(buildRunCounts([{ name: 'ci', totalCount: 5 }, { name: 'idle-workflow', totalCount: 0 }])).toEqual({
      ci: 5,
    });
  });

  it('returns an empty object for an empty input', () => {
    expect(buildRunCounts([])).toEqual({});
  });
});

describe('buildReport', () => {
  it('renders total runs, open PRs, and a sorted-descending workflow table with no previous snapshot', () => {
    const report = buildReport({
      month: '2026-08',
      sinceIso: '2026-08-01T08:17:00.000Z',
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
      sinceIso: '2026-08-01T08:17:00.000Z',
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
      sinceIso: '2026-08-01T08:17:00.000Z',
      runCounts: { ci: 8, 'new-workflow': 2 },
      openPrCount: 1,
      previous: { runCounts: { ci: 5 }, openPrCount: 1 },
    });
    expect(report).toContain('| new-workflow | 2 | — |');
  });

  it('still shows a workflow that had runs last time but zero this time, with a negative delta', () => {
    const report = buildReport({
      month: '2026-09',
      sinceIso: '2026-08-01T08:17:00.000Z',
      runCounts: { ci: 8 },
      openPrCount: 1,
      previous: { runCounts: { ci: 5, 'retired-workflow': 20 }, openPrCount: 1 },
    });
    expect(report).toContain('| retired-workflow | 0 | -20 |');
  });
});
