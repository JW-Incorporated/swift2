import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STUCK_MINUTES, stuckRuns } from './status-unstick.mjs';

const NOW = Date.parse('2026-10-21T15:00:00Z');
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const run = (over: Record<string, unknown> = {}) => ({
  databaseId: 1,
  status: 'waiting',
  createdAt: ago(STUCK_MINUTES + 1),
  url: 'https://example.invalid/1',
  ...over,
});

describe('stuckRuns', () => {
  // The bug in issue #6151: this exact run held marjorie-status-render for 15 days.
  it('names an unstarted run that is past the age floor', () => {
    expect(stuckRuns([run({ databaseId: 37513543784, createdAt: ago(21_600) })], { now: NOW })).toEqual([
      { id: 37513543784, status: 'waiting', ageMinutes: 21_600, url: 'https://example.invalid/1' },
    ]);
  });

  it('counts every unstarted state GitHub reports', () => {
    const runs = [
      run({ databaseId: 1, status: 'waiting' }),
      run({ databaseId: 2, status: 'queued' }),
      run({ databaseId: 3, status: 'pending' }),
    ];
    expect(stuckRuns(runs, { now: NOW }).map((r) => r.id)).toEqual([1, 2, 3]);
  });

  // Cancelling a render that is doing real work would be the bug, not the fix:
  // GitHub's own timeout-minutes already ends a job that overruns.
  it('never touches a run that has started, however old', () => {
    expect(stuckRuns([run({ status: 'in_progress', createdAt: ago(5000) })], { now: NOW })).toEqual([]);
    expect(stuckRuns([run({ status: 'completed', createdAt: ago(5000) })], { now: NOW })).toEqual([]);
  });

  it('leaves a run young enough to be legitimately queued behind a render', () => {
    expect(stuckRuns([run({ createdAt: ago(STUCK_MINUTES - 1) })], { now: NOW })).toEqual([]);
  });

  it('never cancels the run doing the cancelling', () => {
    expect(stuckRuns([run({ databaseId: 42 })], { now: NOW, selfRunId: '42' })).toEqual([]);
    expect(stuckRuns([run({ databaseId: 42 })], { now: NOW, selfRunId: 42 })).toEqual([]);
    expect(stuckRuns([run({ databaseId: 42 })], { now: NOW, selfRunId: undefined })).toHaveLength(1);
  });

  it('reports the oldest first and survives junk rows', () => {
    const runs = [
      run({ databaseId: 1, createdAt: ago(60) }),
      null,
      { status: 'waiting' },
      run({ databaseId: 2, createdAt: ago(900) }),
      run({ databaseId: 3, createdAt: 'not a date' }),
      run({ databaseId: 4.5 }),
      run({ databaseId: 5, url: undefined }),
    ];
    expect(stuckRuns(runs as never, { now: NOW }).map((r) => r.id)).toEqual([2, 1, 5]);
    expect(stuckRuns(runs as never, { now: NOW }).at(-1)?.url).toBe('');
    expect(stuckRuns(null as never, { now: NOW })).toEqual([]);
  });
});

describe('marjorie-status.yml watch job', () => {
  const yml = readFileSync('.github/workflows/marjorie-status.yml', 'utf8').replace(/\r\n/g, '\n');
  const watch = yml.slice(yml.indexOf('\n  watch:'), yml.indexOf('\n  render:'));

  it('exists, with only the rights it needs to cancel a starved run', () => {
    expect(watch).toMatch(/permissions:\n {6}contents: read\n {6}actions: write/);
    expect(watch).not.toContain('issues: write');
    expect(watch).not.toMatch(/secrets\./);
  });

  // The two properties that stop the watcher from being starved by the same
  // mechanism it exists to clear.
  it('stays out of the render group, holds no environment, and lets the newest watcher win', () => {
    expect(watch).toMatch(/concurrency:\n {6}group: marjorie-status-watch\n {6}cancel-in-progress: true/);
    expect(watch).not.toContain('marjorie-status-render\n');
    expect(watch).not.toContain('environment:');
  });

  it('checks both workflows that take the render group and cancels through the evaluator', () => {
    expect(watch).toContain('for WF in marjorie-status.yml routine-marjorie-brief.yml; do');
    expect(watch).toContain('for STATE in waiting queued pending; do');
    expect(watch).toContain('node scripts/marjorie/status-unstick.mjs evaluate');
    expect(watch).toContain('SELF_RUN_ID: ${{ github.run_id }}');
    expect(watch).toContain('gh run cancel');
    expect(watch).toContain('force-cancel');
    // A run it could not clear is loud: the page cannot re-render until it goes.
    expect(watch).toContain('::error::');
  });

  it('runs on every hourly trigger, never on an issue comment, and only from main', () => {
    expect(watch).toContain("if: github.event_name != 'issue_comment' && github.ref == 'refs/heads/main'");
  });
});
