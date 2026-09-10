import { describe, expect, it } from 'vitest';
import {
  isoDaysAgo,
  buildRunCounts,
  buildReport,
  isRoutineWorkflow,
  median,
  aggregateRoutineUsage,
  renderRoutineUsageSection,
} from './fleet-telemetry-snapshot.mjs';

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

  it('renders a routine usage telemetry section when routineUsage is provided', () => {
    const report = buildReport({
      month: '2026-09',
      sinceIso: '2026-08-01T08:17:00.000Z',
      runCounts: { ci: 8 },
      openPrCount: 1,
      previous: null,
      routineUsage: [
        { routineName: 'routine-news-triage', runCount: 3, totalTurns: 30, medianTurns: 10, totalDurationMs: 180000, totalCostUsd: 0.9 },
      ],
    });
    expect(report).toContain('## Routine usage telemetry');
    expect(report).toContain('| routine-news-triage | 3 | 30 | 10 | 3m | $0.90 |');
    expect(report).toContain('LIST-PRICE EQUIVALENT');
  });

  it('omits a routine row but still renders the section header with an empty array', () => {
    const report = buildReport({
      month: '2026-09',
      sinceIso: '2026-08-01T08:17:00.000Z',
      runCounts: { ci: 8 },
      openPrCount: 1,
      previous: null,
    });
    expect(report).toContain('## Routine usage telemetry');
    expect(report).toContain('No `routine-usage` artifacts found in this window');
  });
});

describe('isRoutineWorkflow', () => {
  it('matches routine-* workflow names', () => {
    expect(isRoutineWorkflow('routine-news-triage')).toBe(true);
    expect(isRoutineWorkflow('routine-vault-run')).toBe(true);
  });

  it('excludes the reusable routine-template workflow', () => {
    expect(isRoutineWorkflow('routine-template')).toBe(false);
  });

  it('excludes non-routine workflow names', () => {
    expect(isRoutineWorkflow('ci')).toBe(false);
    expect(isRoutineWorkflow('watchdog')).toBe(false);
  });

  it('handles non-string input', () => {
    expect(isRoutineWorkflow(undefined)).toBe(false);
    expect(isRoutineWorkflow(null)).toBe(false);
  });
});

describe('median', () => {
  it('returns null for an empty array', () => {
    expect(median([])).toBeNull();
  });

  it('returns the middle value for an odd-length array', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('averages the two middle values for an even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('aggregateRoutineUsage', () => {
  it('groups records by routine name and sums/averages fields', () => {
    const records = [
      { routineName: 'routine-news-triage', numTurns: 10, durationMs: 60000, totalCostUsd: 0.3 },
      { routineName: 'routine-news-triage', numTurns: 20, durationMs: 120000, totalCostUsd: 0.6 },
      { routineName: 'routine-vault-run', numTurns: 5, durationMs: 30000, totalCostUsd: 0.1 },
    ];
    const result = aggregateRoutineUsage(records);
    expect(result).toEqual([
      {
        routineName: 'routine-news-triage',
        runCount: 2,
        totalTurns: 30,
        medianTurns: 15,
        totalDurationMs: 180000,
        totalCostUsd: 0.8999999999999999,
      },
      {
        routineName: 'routine-vault-run',
        runCount: 1,
        totalTurns: 5,
        medianTurns: 5,
        totalDurationMs: 30000,
        totalCostUsd: 0.1,
      },
    ]);
  });

  it('excludes non-finite fields from their aggregate instead of treating them as zero', () => {
    const records = [
      { routineName: 'routine-news-triage', numTurns: null, durationMs: null, totalCostUsd: null },
    ];
    const result = aggregateRoutineUsage(records);
    expect(result[0].totalTurns).toBe(0);
    expect(result[0].medianTurns).toBeNull();
    expect(result[0].totalCostUsd).toBeNull();
  });

  it('drops records with no routineName', () => {
    expect(aggregateRoutineUsage([{ numTurns: 1 }, null, undefined])).toEqual([]);
  });

  it('returns an empty array for an empty or missing input', () => {
    expect(aggregateRoutineUsage([])).toEqual([]);
    expect(aggregateRoutineUsage()).toEqual([]);
  });
});

describe('renderRoutineUsageSection', () => {
  it('renders a table row per routine with the list-price caveat', () => {
    const section = renderRoutineUsageSection([
      { routineName: 'routine-news-triage', runCount: 2, totalTurns: 30, medianTurns: 15, totalDurationMs: 180000, totalCostUsd: 0.9 },
    ]);
    expect(section).toContain('LIST-PRICE EQUIVALENT');
    expect(section).toContain('not a real billed dollar amount');
    expect(section).toContain('| routine-news-triage | 2 | 30 | 15 | 3m | $0.90 |');
  });

  it('renders an em-dash for a null cost or median', () => {
    const section = renderRoutineUsageSection([
      { routineName: 'x', runCount: 1, totalTurns: 0, medianTurns: null, totalDurationMs: 0, totalCostUsd: null },
    ]);
    expect(section).toContain('| x | 1 | 0 | — | 0m | — |');
  });

  it('renders a no-artifacts message for an empty array', () => {
    expect(renderRoutineUsageSection([])).toContain('No `routine-usage` artifacts found in this window');
  });
});
