import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { triage } from './routine-failure-triage.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { recover } from './lib/routine-failure-recovery.mjs';

// One in-memory repo shared by triage and recovery: fail → recovery closes → fail again the same day.
type Issue = { number: number; title: string; body: string; labels: Array<{ name: string }>; state: 'open' | 'closed'; created_at: string; closed_at: string | null; user: { login: string } };
type Run = { id: number; event: string; conclusion: string; created_at: string; updated_at: string; html_url: string; path: string; head_branch: string };

const WF = 'routine-news-triage';
const at = (hhmm: string) => `2026-10-28T${hhmm}:00Z`;

function fakeRepo() {
  let clock = Date.parse(at('00:00'));
  const issues: Issue[] = [];
  const comments = new Map<number, Array<{ body: string; created_at: string }>>();
  const runs: Run[] = [];
  const dispatches: string[] = [];
  const iso = () => new Date(clock).toISOString();
  const json = (v: unknown) => ({ stdout: JSON.stringify(v) });
  const gh = async (args: string[]) => {
    const p = (args[1] ?? '').replace(/^\//, '');
    if (args[0] === 'api') {
      if (p.startsWith('repos/o/r/issues?')) {
        const q = new URLSearchParams(p.split('?')[1]);
        if (Number(q.get('page')) > 1) return json([]);
        const want = q.get('labels')!.split(',');
        const state = q.get('state');
        return json(issues.filter((i) => want.every((l) => i.labels.some((x) => x.name === l)) && (state === 'all' || i.state === state)).slice().reverse());
      }
      const c = /^repos\/o\/r\/issues\/(\d+)\/comments/.exec(p);
      if (c) return json(comments.get(Number(c[1])) ?? []);
      if (p.includes('/check-runs/')) return json([]);
      const one = /^repos\/o\/r\/actions\/runs\/(\d+)$/.exec(p);
      if (one) return json(runs.find((r) => r.id === Number(one[1])));
      const list = /^repos\/o\/r\/actions\/workflows\/([^/]+)\.yml\/runs\?branch=main&status=completed&event=([a-z_]+)/.exec(p);
      if (list) return json({ workflow_runs: runs.filter((r) => r.path.endsWith(`${list[1]}.yml`) && r.event === list[2]).slice().reverse() });
      if (p.includes('/actions/workflows/')) return json({ total_count: 0 });
      throw new Error(`unexpected api ${p}`);
    }
    if (args[0] === 'run') return json({ jobs: [{ name: 'run', conclusion: 'failure', steps: [{ name: 'Run Claude', conclusion: 'failure' }] }] });
    if (args[0] === 'label') return json({});
    if (args[0] === 'issue') {
      const flag = (f: string) => args[args.indexOf(f) + 1]!;
      if (args[1] === 'create') {
        const number = 5000 + issues.length;
        const labels = args.flatMap((a, i) => (args[i - 1] === '--label' ? [{ name: a }] : []));
        issues.push({ number, title: flag('--title'), body: flag('--body'), labels, state: 'open', created_at: iso(), closed_at: null, user: { login: 'github-actions[bot]' } });
        return { stdout: `https://github.com/o/r/issues/${number}\n` };
      }
      const n = Number(args[2]);
      if (args[1] === 'comment' || args[1] === 'close') {
        const body = args[1] === 'comment' ? flag('--body') : flag('--comment');
        comments.set(n, [...(comments.get(n) ?? []), { body, created_at: iso() }]);
      }
      if (args[1] === 'close') Object.assign(issues.find((i) => i.number === n)!, { state: 'closed', closed_at: iso() });
      return { stdout: '' };
    }
    if (args[0] === 'workflow' && args[1] === 'run') {
      dispatches.push(args[args.length - 1]!);
      return { stdout: '' };
    }
    throw new Error(`unexpected gh ${args.join(' ')}`);
  };
  const addRun = (id: number, conclusion: string, hhmm: string) => {
    clock = Date.parse(at(hhmm));
    const r = { id, event: 'schedule', conclusion, created_at: at(hhmm), updated_at: at(hhmm), html_url: `https://github.com/o/r/actions/runs/${id}`, path: `.github/workflows/${WF}.yml`, head_branch: 'main' };
    runs.push(r);
    return r;
  };
  const fail = (r: Run) => triage({ workflow: WF, runId: String(r.id), runUrl: r.html_url, conclusion: 'failure', day: '2026-10-28', updatedAt: r.updated_at }, { repo: 'o/r', gh, now: clock, log: () => {} });
  const sweepRecover = (hhmm: string) => {
    clock = Date.parse(at(hhmm));
    return recover({ repo: 'o/r', gh, log: () => {}, warn: () => {} });
  };
  return { issues, dispatches, addRun, fail, sweepRecover };
}

describe('fail → recover → fail again the same day', () => {
  it('files a visible follow-up issue and notifies Marjorie exactly once per failure', async () => {
    const repo = fakeRepo();
    const first = repo.addRun(1, 'failure', '10:00');
    expect((await repo.fail(first)).action).toBe('filed');
    expect(repo.dispatches).toEqual(['issue_number=5000']);

    repo.addRun(2, 'success', '11:00');
    expect((await repo.sweepRecover('11:10')).map((r: { action: string }) => r.action)).toEqual(['closed']);
    expect(repo.issues[0]!.state).toBe('closed');

    // The sweep's 2h window re-triages the 10:00 failure after the close: already recorded, nothing new.
    expect(await repo.fail(first)).toEqual({ action: 'commented', number: 5000 });
    expect(repo.issues).toHaveLength(1);

    const again = repo.addRun(3, 'failure', '14:00');
    expect(await repo.fail(again)).toEqual({ action: 'filed', number: 5001 });
    const followUp = repo.issues[1]!;
    expect(followUp).toMatchObject({ state: 'open', title: `routine failure: ${WF} 2026-10-28 (2)` });
    expect(followUp.body).toContain('#5000');
    expect(repo.dispatches).toEqual(['issue_number=5000', 'issue_number=5001']);

    // Re-triaging the 14:00 failure is a no-op; recovery keeps #5001 open while the latest run is red.
    expect(await repo.fail(again)).toEqual({ action: 'commented', number: 5001 });
    expect((await repo.sweepRecover('14:30'))).toEqual([{ number: 5001, workflow: WF, action: 'kept', reason: 'latest schedule run failure' }]);
    expect(repo.issues).toHaveLength(2);
    expect(repo.dispatches).toHaveLength(2);

    repo.addRun(4, 'success', '15:00');
    expect((await repo.sweepRecover('15:10')).map((r: { number: number; action: string }) => [r.number, r.action])).toEqual([[5001, 'closed']]);
  });
});
