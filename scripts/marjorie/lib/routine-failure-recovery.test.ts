import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildFailureIssue, failureMarker } from '../routine-failure-triage.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { COMMENT_MARKER } from './routine-failure-keys.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { RECOVERY_MARKER, failingRunIds, filedFailure, latestDecisiveRun, recover } from './routine-failure-recovery.mjs';

type Issue = { number: number; title: string; body: string; labels: Array<{ name: string }>; created_at: string; pull_request?: object };
type Run = { id?: number; event?: string; conclusion: string; created_at: string; html_url: string };

const runUrl = (id: number) => `https://github.com/o/r/actions/runs/${id}`;
const filed = (number: number, workflow: string, day: string, failRun = 1, seq = 1): Issue => {
  const i = buildFailureIssue({ workflow, runUrl: runUrl(failRun), conclusion: 'failure', job: null, step: null, day, seq });
  return { number, title: i.title, body: i.body, labels: i.labels.map((name: string) => ({ name })), created_at: `${day}T12:00:00Z` };
};
const run = (conclusion: string, created_at: string, id = 9, event = 'schedule'): Run => ({ id, event, conclusion, created_at, html_url: runUrl(id) });

type Fake = {
  issues: Issue[];
  comments?: Record<number, Array<{ body: string }>>;
  failing?: Record<number, Run | 'error'>;
  runs?: Record<string, Run[] | 'error'>;
};
function fakeGh({ issues, comments = {}, failing = {}, runs = {} }: Fake) {
  const calls: string[][] = [];
  const gh = async (args: string[]) => {
    calls.push(args);
    const p = args[1] ?? '';
    if (args[0] === 'api' && p.startsWith('repos/o/r/issues?')) {
      const q = new URLSearchParams(p.split('?')[1]);
      expect(q.get('labels')).toBe('routine-failure');
      expect(q.get('state')).toBe('open');
      return { stdout: JSON.stringify(Number(q.get('page')) === 1 ? issues : []) };
    }
    const c = /^repos\/o\/r\/issues\/(\d+)\/comments/.exec(p);
    if (args[0] === 'api' && c) return { stdout: JSON.stringify(comments[Number(c[1])] ?? []) };
    const one = /^repos\/o\/r\/actions\/runs\/(\d+)$/.exec(p);
    if (args[0] === 'api' && one) {
      const r = failing[Number(one[1])] ?? run('failure', '2026-10-28T11:00:00Z', Number(one[1]));
      if (r === 'error') throw new Error('HTTP 404');
      return { stdout: JSON.stringify(r) };
    }
    const m = /^repos\/o\/r\/actions\/workflows\/([^/]+)\.yml\/runs\?branch=main&status=completed&event=([a-z_]+)&/.exec(p);
    if (args[0] === 'api' && m) {
      const r = runs[`${m[1]} ${m[2]}`];
      if (r === 'error') throw new Error('HTTP 404');
      return { stdout: JSON.stringify({ workflow_runs: r ?? [] }) };
    }
    if (args[0] === 'issue' && args[1] === 'close') return { stdout: '' };
    throw new Error(`unexpected gh ${args.join(' ')}`);
  };
  return { gh, calls, closes: () => calls.filter((x) => x[0] === 'issue' && x[1] === 'close') };
}
const quiet = { repo: 'o/r', log: () => {}, warn: () => {} };

describe('filedFailure', () => {
  it('matches exactly what triage files, including a later same-day sequence', () => {
    expect(filedFailure(filed(1, 'routine-news-triage', '2026-10-28'))).toEqual({ workflow: 'routine-news-triage', day: '2026-10-28', seq: 1 });
    expect(filedFailure(filed(2, 'routine-news-triage', '2026-10-28', 1, 2))).toEqual({ workflow: 'routine-news-triage', day: '2026-10-28', seq: 2 });
  });

  it('rejects an adopted Tree receipt (marker but a different title)', () => {
    const i = filed(1, 'routine-tree-daily-draft', '2026-10-28');
    expect(filedFailure({ ...i, title: 'tree: daily draft run failed 2026-10-28' })).toBeNull();
  });

  it('rejects a missing label, a missing marker, or a title naming another workflow/day/sequence', () => {
    const i = filed(1, 'routine-news-triage', '2026-10-28');
    expect(filedFailure({ ...i, labels: [{ name: 'desk:ops' }] })).toBeNull();
    expect(filedFailure({ ...i, body: 'no marker here' })).toBeNull();
    expect(filedFailure({ ...i, title: 'routine failure: routine-vault-run 2026-10-28' })).toBeNull();
    expect(filedFailure({ ...i, title: 'routine failure: routine-news-triage 2026-10-27' })).toBeNull();
    expect(filedFailure({ ...i, title: 'routine failure: routine-news-triage 2026-10-28 (2)' })).toBeNull();
    expect(filedFailure({ ...i, body: failureMarker('routine-news-triage', '2026-10-28'), title: 'Something else' })).toBeNull();
  });
});

describe('helpers', () => {
  it('latestDecisiveRun skips skipped/neutral runs but stops at a cancelled one', () => {
    expect(latestDecisiveRun([run('skipped', 'a'), run('success', 'b')])!.created_at).toBe('b');
    expect(latestDecisiveRun([run('cancelled', 'a'), run('success', 'b')])!.conclusion).toBe('cancelled');
    expect(latestDecisiveRun([])).toBeNull();
  });

  it('failingRunIds reads the body and only triage’s own repeat-failure comments', () => {
    const comments = [{ body: `Another failure today — ${runUrl(5)}\n\n${COMMENT_MARKER}` }, { body: `someone links ${runUrl(6)}` }];
    expect(failingRunIds(`Run: ${runUrl(4)}`, comments)).toEqual(['4', '5']);
  });
});

describe('recover', () => {
  const WF = 'routine-news-triage';

  it('closes an issue whose failing event has a newer green run of the same event, naming it in one line', async () => {
    const { gh, closes } = fakeGh({ issues: [filed(10, WF, '2026-10-28')], runs: { [`${WF} schedule`]: [run('success', '2026-10-29T01:00:00Z', 77)] } });
    const out = await recover({ ...quiet, gh });
    expect(out).toEqual([{ number: 10, workflow: WF, action: 'closed', runs: [runUrl(77)] }]);
    const c = closes()[0]!;
    expect(c.slice(0, 7)).toEqual(['issue', 'close', '10', '--repo', 'o/r', '--reason', 'completed']);
    const comment = c[c.indexOf('--comment') + 1]!;
    expect(comment.split('\n')[0]).toMatch(/^Recovered: `routine-news-triage` ran green .*schedule .*actions\/runs\/77/);
    expect(comment).toContain(RECOVERY_MARKER);
  });

  it('a green manual dispatch never closes an issue for a failing schedule', async () => {
    const { gh, closes } = fakeGh({
      issues: [filed(10, WF, '2026-10-28')],
      runs: { [`${WF} workflow_dispatch`]: [run('success', '2026-10-29T01:00:00Z', 70, 'workflow_dispatch')], [`${WF} schedule`]: [run('failure', '2026-10-28T20:00:00Z', 71)] },
    });
    expect((await recover({ ...quiet, gh }))[0]).toMatchObject({ action: 'kept', reason: 'latest schedule run failure' });
    expect(closes()).toHaveLength(0);
  });

  it('needs every failing event recovered, and keeps the issue when a failing run is unreadable', async () => {
    const twoEvents = filed(10, WF, '2026-10-28', 1);
    const comments = { 10: [{ body: `Another failure today — ${runUrl(2)}\n\n${COMMENT_MARKER}` }] };
    const failing = { 2: run('failure', '2026-10-28T13:00:00Z', 2, 'workflow_dispatch') };
    const { gh } = fakeGh({ issues: [twoEvents], comments, failing, runs: { [`${WF} schedule`]: [run('success', '2026-10-29T01:00:00Z', 77)] } });
    expect((await recover({ ...quiet, gh }))[0]).toMatchObject({ action: 'kept', reason: 'latest workflow_dispatch run missing' });

    const { gh: gh2, closes } = fakeGh({ issues: [filed(11, WF, '2026-10-28', 3)], failing: { 3: 'error' }, runs: { [`${WF} schedule`]: [run('success', '2026-10-29T01:00:00Z')] } });
    expect((await recover({ ...quiet, gh: gh2 }))[0]).toMatchObject({ action: 'kept', reason: 'failing run 3 unreadable' });
    expect(closes()).toHaveLength(0);
  });

  it('dry run reports would-close and never closes', async () => {
    const { gh, closes } = fakeGh({ issues: [filed(10, WF, '2026-10-28')], runs: { [`${WF} schedule`]: [run('success', '2026-10-29T01:00:00Z')] } });
    expect((await recover({ ...quiet, gh, dryRun: true }))[0]!.action).toBe('would-close');
    expect(closes()).toHaveLength(0);
  });

  it('keeps the issue when the latest same-event run failed, was cancelled, or predates the failure', async () => {
    const { gh, closes } = fakeGh({
      issues: [filed(1, 'routine-a', '2026-10-28'), filed(2, 'routine-b', '2026-10-28'), filed(3, 'routine-c', '2026-10-28')],
      runs: {
        'routine-a schedule': [run('failure', '2026-10-30T00:00:00Z'), run('success', '2026-10-29T00:00:00Z')],
        'routine-b schedule': [run('cancelled', '2026-10-30T00:00:00Z'), run('success', '2026-10-29T00:00:00Z')],
        'routine-c schedule': [run('success', '2026-10-28T10:00:00Z')],
      },
    });
    expect((await recover({ ...quiet, gh })).map((r: { action: string }) => r.action)).toEqual(['kept', 'kept', 'kept']);
    expect(closes()).toHaveLength(0);
  });

  it('caches one runs lookup per workflow+event across issues', async () => {
    const { gh, calls, closes } = fakeGh({
      issues: [filed(2, 'routine-x', '2026-10-28'), filed(1, 'routine-x', '2026-10-27')],
      runs: { 'routine-x schedule': [run('skipped', '2026-11-02T00:00:00Z'), run('success', '2026-11-01T00:00:00Z')] },
    });
    await recover({ ...quiet, gh });
    expect(closes().map((c) => c[2])).toEqual(['2', '1']);
    expect(calls.filter((c) => String(c[1]).includes('/actions/workflows/'))).toHaveLength(1);
  });

  it('never touches issues it did not file, and survives a runs-list error', async () => {
    const receipt = { ...filed(5, 'routine-tree-daily-draft', '2026-10-28'), title: 'tree: daily draft run failed 2026-10-28' };
    const other = { number: 6, title: 'CI: something', body: 'plain', labels: [{ name: 'routine-failure' }], created_at: '2026-10-01T00:00:00Z' };
    const { gh, closes } = fakeGh({
      issues: [receipt, other, filed(7, 'routine-gone', '2026-10-28')],
      runs: { 'routine-tree-daily-draft schedule': [run('success', '2026-11-01T00:00:00Z')], 'routine-gone schedule': 'error' },
    });
    const warns: string[] = [];
    expect(await recover({ ...quiet, gh, warn: (m: string) => warns.push(m) })).toEqual([]);
    expect(closes()).toHaveLength(0);
    expect(warns[0]).toMatch(/routine-gone/);
  });
});
