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
        {
          routineName: 'routine-news-triage',
          runCount: 3,
          recordsWithData: 3,
          partial: false,
          totalTurns: 30,
          medianTurns: 10,
          totalDurationMs: 180000,
          totalCostUsd: 0.9,
        },
      ],
    });
    expect(report).toContain('## Routine usage telemetry');
    expect(report).toContain('| routine-news-triage | 3 | 3/3 | 30 | 10 | 3m | $0.90 |');
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
        recordsWithData: 2,
        partial: false,
        totalTurns: 30,
        medianTurns: 15,
        totalDurationMs: 180000,
        totalCostUsd: 0.8999999999999999,
      },
      {
        routineName: 'routine-vault-run',
        runCount: 1,
        recordsWithData: 1,
        partial: false,
        totalTurns: 5,
        medianTurns: 5,
        totalDurationMs: 30000,
        totalCostUsd: 0.1,
      },
    ]);
  });

  it('excludes non-finite fields from their aggregate instead of treating them as zero, and marks the row partial', () => {
    const records = [
      { routineName: 'routine-news-triage', numTurns: null, durationMs: null, totalCostUsd: null },
    ];
    const result = aggregateRoutineUsage(records);
    expect(result[0].totalTurns).toBe(0);
    expect(result[0].medianTurns).toBeNull();
    expect(result[0].totalCostUsd).toBeNull();
    expect(result[0].recordsWithData).toBe(0);
    expect(result[0].partial).toBe(true);
  });

  it('drops records with no routineName', () => {
    expect(aggregateRoutineUsage([{ numTurns: 1 }, null, undefined])).toEqual([]);
  });

  it('returns an empty array for an empty or missing input', () => {
    expect(aggregateRoutineUsage([])).toEqual([]);
    expect(aggregateRoutineUsage()).toEqual([]);
  });

  // Codex review round 1, finding 2 — reproduced exactly as reported: a
  // routine literally named `constructor` used to resolve `{}`'s inherited
  // `Object.prototype.constructor` instead of creating a fresh accumulator
  // entry, then crashed reading `.turns` off it. Must not throw, and must
  // aggregate the `constructor`-named routine like any other name.
  it('does not crash on a routine named "constructor" (prototype pollution via plain-object accumulator)', () => {
    expect(() => aggregateRoutineUsage([{ routineName: 'constructor', numTurns: 1, durationMs: 1000, totalCostUsd: 0.01 }])).not.toThrow();
    const result = aggregateRoutineUsage([{ routineName: 'constructor', numTurns: 1, durationMs: 1000, totalCostUsd: 0.01 }]);
    expect(result).toEqual([
      {
        routineName: 'constructor',
        runCount: 1,
        recordsWithData: 1,
        partial: false,
        totalTurns: 1,
        medianTurns: 1,
        totalDurationMs: 1000,
        totalCostUsd: 0.01,
      },
    ]);
  });

  it('does not crash on other Object.prototype-shadowing routine names', () => {
    for (const name of ['__proto__', 'hasOwnProperty', 'toString', 'valueOf']) {
      expect(() => aggregateRoutineUsage([{ routineName: name, numTurns: 1, durationMs: 1, totalCostUsd: 0.01 }])).not.toThrow();
    }
  });

  // Codex review round 1, finding 3 — a mix of one complete run and one run
  // with an upstream lookup/download/parse failure (`incomplete: true`, all
  // metrics null) must show up as a PARTIAL row, not silently sum as if both
  // runs fully reported.
  it('flags a routine partial when some records are incomplete (lookup/download/parse failure)', () => {
    const records = [
      { routineName: 'routine-vault-run', numTurns: 50, durationMs: 300000, totalCostUsd: 1.2 },
      { routineName: 'routine-vault-run', numTurns: null, durationMs: null, totalCostUsd: null, incomplete: true, reason: 'lookup-failed' },
    ];
    const result = aggregateRoutineUsage(records);
    expect(result).toHaveLength(1);
    expect(result[0].runCount).toBe(2);
    expect(result[0].recordsWithData).toBe(1);
    expect(result[0].partial).toBe(true);
    // The lower-bound totals still come from the run that DID report.
    expect(result[0].totalTurns).toBe(50);
    expect(result[0].totalCostUsd).toBe(1.2);
  });

  it('is not partial when every record for a routine is complete', () => {
    const records = [
      { routineName: 'routine-vault-run', numTurns: 50, durationMs: 300000, totalCostUsd: 1.2 },
      { routineName: 'routine-vault-run', numTurns: 40, durationMs: 200000, totalCostUsd: 0.9 },
    ];
    expect(aggregateRoutineUsage(records)[0].partial).toBe(false);
  });

  it('skips a record whose routineName is not a non-empty string, without throwing', () => {
    const records = [
      { routineName: '', numTurns: 1 },
      { routineName: 123, numTurns: 1 },
      { routineName: null, numTurns: 1 },
      { numTurns: 1 },
    ];
    expect(() => aggregateRoutineUsage(records)).not.toThrow();
    expect(aggregateRoutineUsage(records)).toEqual([]);
  });
});

describe('renderRoutineUsageSection', () => {
  it('renders a table row per routine with the list-price caveat and a coverage column', () => {
    const section = renderRoutineUsageSection([
      {
        routineName: 'routine-news-triage',
        runCount: 2,
        recordsWithData: 2,
        partial: false,
        totalTurns: 30,
        medianTurns: 15,
        totalDurationMs: 180000,
        totalCostUsd: 0.9,
      },
    ]);
    expect(section).toContain('LIST-PRICE EQUIVALENT');
    expect(section).toContain('not a real billed dollar amount');
    // Exact row match proves this complete row carries no partial marker
    // (the section's explanatory caption text separately mentions "PARTIAL"
    // by design, so a substring check on the whole section would be wrong).
    expect(section).toContain('| routine-news-triage | 2 | 2/2 | 30 | 15 | 3m | $0.90 |');
  });

  it('marks a partial row with a visible warning instead of rendering it identically to a complete row', () => {
    const section = renderRoutineUsageSection([
      {
        routineName: 'routine-vault-run',
        runCount: 2,
        recordsWithData: 1,
        partial: true,
        totalTurns: 50,
        medianTurns: 50,
        totalDurationMs: 300000,
        totalCostUsd: 1.2,
      },
    ]);
    expect(section).toContain('| routine-vault-run | 2 | 1/2 ⚠️ PARTIAL | 50 | 50 | 5m | $1.20 |');
  });

  it('renders an em-dash for a null cost or median', () => {
    const section = renderRoutineUsageSection([
      { routineName: 'x', runCount: 1, recordsWithData: 1, partial: false, totalTurns: 0, medianTurns: null, totalDurationMs: 0, totalCostUsd: null },
    ]);
    expect(section).toContain('| x | 1 | 1/1 | 0 | — | 0m | — |');
  });

  it('renders a no-artifacts message for an empty array', () => {
    expect(renderRoutineUsageSection([])).toContain('No `routine-usage` artifacts found in this window');
  });
});
