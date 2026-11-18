import { describe, expect, it } from 'vitest';
import { buildFailureIssue, failureMarker } from '../routine-failure-triage.mjs';
import { RECOVERY_MARKER, filedFailure, latestDecisiveRun, recover } from './routine-failure-recovery.mjs';

type Issue = { number: number; title: string; body: string; labels: Array<{ name: string }>; created_at: string; pull_request?: object };
type Run = { conclusion: string; created_at: string; updated_at?: string; html_url: string };

const filed = (number: number, workflow: string, day: string, createdAt = `${day}T12:00:00Z`): Issue => {
  const i = buildFailureIssue({ workflow, runUrl: 'https://x/runs/1', conclusion: 'failure', job: null, step: null, day });
  return { number, title: i.title, body: i.body, labels: i.labels.map((name: string) => ({ name })), created_at: createdAt };
};
const run = (conclusion: string, created_at: string, id = 9): Run => ({ conclusion, created_at, updated_at: created_at, html_url: `https://github.com/o/r/actions/runs/${id}` });

function fakeGh(issues: Issue[], runs: Record<string, Run[] | 'error'>) {
  const calls: string[][] = [];
  const gh = async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api' && args[1]!.startsWith('repos/o/r/issues?')) {
      const q = new URLSearchParams(args[1]!.split('?')[1]);
      expect(q.get('labels')).toBe('routine-failure');
      expect(q.get('state')).toBe('open');
      return { stdout: JSON.stringify(Number(q.get('page')) === 1 ? issues : []) };
    }
    const m = /^repos\/o\/r\/actions\/workflows\/([^/]+)\.yml\/runs\?branch=main&status=completed/.exec(args[1] ?? '');
    if (args[0] === 'api' && m) {
      const r = runs[m[1]!];
      if (r === 'error') throw new Error('HTTP 404');
      return { stdout: JSON.stringify({ workflow_runs: r ?? [] }) };
    }
    if (args[0] === 'issue' && args[1] === 'close') return { stdout: '' };
    throw new Error(`unexpected gh ${args.join(' ')}`);
  };
  return { gh, calls, closes: () => calls.filter((c) => c[0] === 'issue' && c[1] === 'close') };
}
const quiet = { repo: 'o/r', log: () => {}, warn: () => {} };

describe('filedFailure', () => {
  it('matches exactly what triage files', () => {
    expect(filedFailure(filed(1, 'routine-news-triage', '2026-10-28'))).toEqual({ workflow: 'routine-news-triage', day: '2026-10-28' });
  });

  it('rejects an adopted Tree receipt (marker but a different title)', () => {
    const i = filed(1, 'routine-tree-daily-draft', '2026-10-28');
    expect(filedFailure({ ...i, title: 'tree: daily draft run failed 2026-10-28' })).toBeNull();
  });

  it('rejects a missing label, a missing marker, or a title naming another workflow/day', () => {
    const i = filed(1, 'routine-news-triage', '2026-10-28');
    expect(filedFailure({ ...i, labels: [{ name: 'desk:ops' }] })).toBeNull();
    expect(filedFailure({ ...i, body: 'no marker here' })).toBeNull();
    expect(filedFailure({ ...i, title: 'routine failure: routine-vault-run 2026-10-28' })).toBeNull();
    expect(filedFailure({ ...i, title: 'routine failure: routine-news-triage 2026-10-27' })).toBeNull();
    expect(filedFailure({ ...i, body: failureMarker('routine-news-triage', '2026-10-28'), title: 'Something else' })).toBeNull();
  });
});

describe('latestDecisiveRun', () => {
  it('skips skipped/neutral runs but stops at a cancelled one', () => {
    expect(latestDecisiveRun([run('skipped', 'a'), run('success', 'b')])!.created_at).toBe('b');
    expect(latestDecisiveRun([run('cancelled', 'a'), run('success', 'b')])!.conclusion).toBe('cancelled');
    expect(latestDecisiveRun([])).toBeNull();
  });
});

describe('recover', () => {
  it('closes an issue whose workflow has a newer green run, with a one-line comment naming the run', async () => {
    const { gh, closes } = fakeGh([filed(10, 'routine-news-triage', '2026-10-28')], { 'routine-news-triage': [run('success', '2026-10-29T01:00:00Z', 77)] });
    const out = await recover({ ...quiet, gh });
    expect(out).toEqual([{ number: 10, workflow: 'routine-news-triage', action: 'closed', run: 'https://github.com/o/r/actions/runs/77' }]);
    expect(closes()).toHaveLength(1);
    const c = closes()[0]!;
    expect(c.slice(0, 6)).toEqual(['issue', 'close', '10', '--repo', 'o/r', '--reason']);
    const comment = c[c.indexOf('--comment') + 1]!;
    expect(comment.split('\n')[0]).toMatch(/^Recovered: `routine-news-triage` ran green .*actions\/runs\/77/);
    expect(comment).toContain(RECOVERY_MARKER);
  });

  it('dry run reports would-close and never closes', async () => {
    const { gh, closes } = fakeGh([filed(10, 'routine-news-triage', '2026-10-28')], { 'routine-news-triage': [run('success', '2026-10-29T01:00:00Z')] });
    const out = await recover({ ...quiet, gh, dryRun: true });
    expect(out[0]!.action).toBe('would-close');
    expect(closes()).toHaveLength(0);
  });

  it('keeps the issue when the latest decisive run failed, was cancelled, or predates the issue', async () => {
    const { gh, closes } = fakeGh(
      [filed(1, 'routine-a', '2026-10-28'), filed(2, 'routine-b', '2026-10-28'), filed(3, 'routine-c', '2026-10-28')],
      {
        'routine-a': [run('failure', '2026-10-30T00:00:00Z'), run('success', '2026-10-29T00:00:00Z')],
        'routine-b': [run('cancelled', '2026-10-30T00:00:00Z'), run('success', '2026-10-29T00:00:00Z')],
        'routine-c': [run('success', '2026-10-28T11:00:00Z')],
      },
    );
    const out = await recover({ ...quiet, gh });
    expect(out.map((r: { action: string }) => r.action)).toEqual(['kept', 'kept', 'kept']);
    expect(closes()).toHaveLength(0);
  });

  it('closes every open issue of a recovered workflow with one runs lookup', async () => {
    const { gh, calls, closes } = fakeGh(
      [filed(2, 'routine-x', '2026-10-28'), filed(1, 'routine-x', '2026-10-27')],
      { 'routine-x': [run('skipped', '2026-11-02T00:00:00Z'), run('success', '2026-11-01T00:00:00Z')] },
    );
    await recover({ ...quiet, gh });
    expect(closes().map((c) => c[2])).toEqual(['2', '1']);
    expect(calls.filter((c) => String(c[1]).includes('/actions/workflows/'))).toHaveLength(1);
  });

  it('never touches issues it did not file, and survives a runs-list error', async () => {
    const receipt = { ...filed(5, 'routine-tree-daily-draft', '2026-10-28'), title: 'tree: daily draft run failed 2026-10-28' };
    const other = { number: 6, title: 'CI: something', body: 'plain', labels: [{ name: 'routine-failure' }], created_at: '2026-10-01T00:00:00Z' };
    const { gh, closes } = fakeGh([receipt, other, filed(7, 'routine-gone', '2026-10-28')], {
      'routine-tree-daily-draft': [run('success', '2026-11-01T00:00:00Z')],
      'routine-gone': 'error',
    });
    const warns: string[] = [];
    const out = await recover({ ...quiet, gh, warn: (m: string) => warns.push(m) });
    expect(out).toEqual([]);
    expect(closes()).toHaveLength(0);
    expect(warns[0]).toMatch(/routine-gone/);
  });
});
