import { describe, expect, it } from 'vitest';
import {
  LOOKBACK,
  MISSED_SCHEDULE_HOURS,
  WORKFLOW,
  evaluate,
  scheduledRuns,
} from './routine-vault-run-check.mjs';

type RunExtra = { event?: string; headBranch?: string; url?: string };

const run = (createdAt: string, conclusion: string | undefined, extra: RunExtra = {}) => ({
  createdAt,
  conclusion,
  event: 'schedule',
  headBranch: 'main',
  url: `https://github.com/JW-Incorporated/swift2/actions/runs/${createdAt}`,
  ...extra,
});

const NOW = '2026-09-12T18:00:00Z';

describe('scheduledRuns', () => {
  it('keeps only event=schedule runs, newest first', () => {
    const runs = [
      run('2026-09-10T16:07:00Z', 'success', { event: 'workflow_dispatch' }),
      run('2026-09-09T16:07:00Z', 'failure'),
      run('2026-09-11T16:07:00Z', 'success'),
    ];
    const out = scheduledRuns(runs);
    expect(out.map((r: { createdAt: string }) => r.createdAt)).toEqual([
      '2026-09-11T16:07:00Z',
      '2026-09-09T16:07:00Z',
    ]);
  });

  it('handles an empty/undefined list', () => {
    expect(scheduledRuns(undefined)).toEqual([]);
    expect(scheduledRuns([])).toEqual([]);
  });
});

describe('evaluate', () => {
  it('reports no-data when there is no scheduled run at all', () => {
    const result = evaluate({ runs: [run('2026-09-10T00:00:00Z', 'success', { event: 'workflow_dispatch' })], now: NOW });
    expect(result.status).toBe('no-data');
  });

  it('reports missed-schedule when the newest scheduled run is too old', () => {
    const result = evaluate({
      runs: [run('2026-09-10T16:07:00Z', 'success')],
      now: NOW, // ~25.9h... make it clearly over 26h
    });
    // 2026-09-10T16:07 -> 2026-09-12T18:00 is well over 26h (~49h)
    expect(result.status).toBe('missed-schedule');
    expect(result.reason).toContain('16:07 UTC cron appears to have been skipped');
  });

  it('does not report healthy when a failure sits within the lookback window even alongside recent successes', () => {
    const result = evaluate({
      runs: [
        run('2026-09-12T16:07:00Z', 'success'),
        run('2026-09-11T16:07:00Z', 'success'),
        run('2026-09-10T16:07:00Z', 'failure'), // outside default lookback slice? still within 5 -> check below
      ],
      now: NOW,
    });
    // With LOOKBACK=5 all three are considered, so a failure among them should NOT be healthy.
    expect(result.status).toBe('failing');
  });

  it('reports healthy with a clean run history', () => {
    const result = evaluate({
      runs: [
        run('2026-09-12T16:07:00Z', 'success'),
        run('2026-09-11T16:07:00Z', 'success'),
        run('2026-09-10T16:07:00Z', 'success'),
      ],
      now: NOW,
    });
    expect(result.status).toBe('healthy');
  });

  it('reports failing when any of the last LOOKBACK scheduled runs failed', () => {
    const result = evaluate({
      runs: [
        run('2026-09-12T16:07:00Z', 'success'),
        run('2026-09-11T16:07:00Z', 'failure'),
        run('2026-09-10T16:07:00Z', 'failure'),
        run('2026-09-09T16:07:00Z', 'failure'),
        run('2026-09-08T16:07:00Z', 'failure'),
      ],
      now: NOW,
    });
    expect(result.status).toBe('failing');
    expect(result.failures.length).toBe(4);
    expect(result.reason).toContain('4 of the last 5 scheduled run(s)');
  });

  it('ignores failures older than LOOKBACK', () => {
    const runs = [];
    // 6 successes at the front (within lookback), one old failure beyond it.
    for (let i = 0; i < 6; i++) {
      runs.push(run(`2026-09-${String(12 - i).padStart(2, '0')}T16:07:00Z`, 'success'));
    }
    runs.push(run('2026-09-01T16:07:00Z', 'failure'));
    const result = evaluate({ runs, now: NOW });
    expect(result.status).toBe('healthy');
  });

  it('reports pending when the newest scheduled runs have no conclusion yet', () => {
    const result = evaluate({
      runs: [run('2026-09-12T16:07:00Z', undefined)],
      now: NOW,
    });
    expect(result.status).toBe('pending');
  });

  it('never confuses a workflow_dispatch run with a scheduled one for cadence purposes', () => {
    // Only a workflow_dispatch success recently; the last SCHEDULED run is
    // older than the grace window, so this must alarm on the missed
    // schedule rather than being fooled into "healthy" by the dispatch run.
    const result = evaluate({
      runs: [
        run('2026-09-12T00:00:00Z', 'success', { event: 'workflow_dispatch' }),
        run('2026-09-10T16:07:00Z', 'failure', { event: 'schedule' }),
      ],
      now: NOW,
    });
    expect(result.status).toBe('missed-schedule');
  });
});

describe('module constants', () => {
  it('are the documented values', () => {
    expect(WORKFLOW).toBe('routine-vault-run.yml');
    expect(LOOKBACK).toBe(5);
    expect(MISSED_SCHEDULE_HOURS).toBe(26);
  });
});
