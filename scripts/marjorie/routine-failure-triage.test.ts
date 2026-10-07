import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { COMMENT_MARKER, FAILURE_LABELS, adoptionFooter, buildFailureIssue, failingJobStep, failureMarker, dayOf, mentionsUrl, shouldComment, sweep, triage } from './routine-failure-triage.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseMarker } from './lib/loop-asks.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { selectPending } from './lib/loop-queue.mjs';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const WF = 'routine-austin-build';
const URL1 = 'https://github.com/o/r/actions/runs/111';
const RUN_RE = /https:\/\/github\.com\/o\/r\/actions\/runs\/111(?![0-9])/;
const BOT = { login: 'github-actions[bot]' };
const LOG = ['run / Run Claude\tRun Claude\t2026-10-05T11:00:00.1Z error_max_turns reached', 'run / Run Claude\tRun Claude\t2026-10-05T11:00:01.1Z CLAUDE_CODE_OAUTH_TOKEN=abc123', 'run / Run Claude\tRun Claude\t2026-10-05T11:00:02.1Z done'].join('\n');

const CANCELLED = { jobs: [{ id: 77, databaseId: 77, name: 'run', conclusion: 'cancelled', steps: [{ name: 'Run Claude', conclusion: 'cancelled' }] }] };
const JOBS = { jobs: [{ name: 'run / Run Claude', conclusion: 'failure', steps: [{ name: 'Set up job', conclusion: 'success' }, { name: 'Run Claude', conclusion: 'failure' }] }] };
type Fake = { open?: unknown[]; tree?: unknown[]; comments?: unknown[]; log?: string; jobs?: unknown; annotations?: unknown; annotationsError?: boolean; runsToday?: number };
function fakeGh({ open = [], tree = [], comments = [], log = LOG, jobs = JOBS, annotations = [], annotationsError = false, runsToday = 0 }: Fake = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const p = args[1];
      if (p.includes('/check-runs/')) {
        if (annotationsError) throw new Error('404');
        return { stdout: JSON.stringify(annotations) };
      }
      if (p.includes('/actions/workflows/')) return { stdout: JSON.stringify({ total_count: runsToday }) };
      if (/issues\/\d+\/comments/.test(p)) return { stdout: JSON.stringify(comments) };
      if (p.includes('labels=desk%3Atree')) return { stdout: JSON.stringify(tree) };
      return { stdout: JSON.stringify(open) };
    }
    if (args[0] === 'run') return { stdout: args.includes('--json') ? JSON.stringify(jobs) : log };
    if (args[0] === 'issue' && args[1] === 'create') return { stdout: 'https://github.com/o/r/issues/5200\n' };
    return { stdout: '' };
  });
  return { gh, calls };
}
const verbs = (calls: string[][]) => calls.filter((c) => c[0] !== 'api').map((c) => c.slice(0, 2).join(' '));
const quiet = () => vi.spyOn(console, 'log').mockImplementation(() => {});
const issueRow = (n: number, body: string, title = 'x', labels = ['routine-failure', 'desk:ops']) => ({ number: n, title, html_url: `https://github.com/o/r/issues/${n}`, user: BOT, state: 'open', created_at: '2026-10-05T06:00:00Z', closed_at: null, labels: labels.map((name) => ({ name })), body });

describe('job and step names', () => {
  it('names the first failing job and step, never log text', () => {
    expect(failingJobStep(JOBS)).toEqual({ job: 'run / Run Claude', step: 'Run Claude' });
    expect(failingJobStep({ jobs: [{ name: 'a', conclusion: 'success', steps: [] }] })).toEqual({ job: null, step: null });
  });
});

describe('issue body', () => {
  const issue = buildFailureIssue({ workflow: WF, runUrl: URL1, conclusion: 'failure', job: 'run / Run Claude', step: 'Run Claude', day: '2026-10-05' });
  it('carries the labels, the dedupe marker and a loop-ask marker Marjorie’s queue reads', () => {
    expect(issue.labels).toEqual(['desk:ops', 'marjorie-filed', 'routine-failure']);
    expect(FAILURE_LABELS).toEqual(issue.labels);
    expect(issue.title).toBe(`routine failure: ${WF} 2026-10-05`);
    expect(issue.body).toContain(`<!-- routine-failure: ${WF} 2026-10-05 -->`);
    expect(parseMarker(issue.body).key).toBe(`routine-failure-${WF}-2026-10-05`);
    expect(issue.body).toMatch(RUN_RE);
    expect(issue.body).toContain('REROUTE');
    expect(issue.body).toContain('`run / Run Claude` / `Run Claude`');
    expect(issue.body).toContain('read the logs via the run URL');
    expect(issue.body).not.toContain('```');
  });
  it('lands in the pending queue for Marjorie once the workflow token filed it', () => {
    const items = selectPending('marjorie', [{ number: 5200, url: 'u', title: issue.title, body: issue.body, author: BOT, labels: issue.labels.map((name: string) => ({ name })), state: 'OPEN', createdAt: '2026-10-05T06:00:00Z' }], {}, { now: NOW });
    expect(items.map((i: { number: number }) => i.number)).toEqual([5200]);
  });
});

describe('triage', () => {
  it('files one labelled issue then dispatches Marjorie with the issue number', async () => {
    const { gh, calls } = fakeGh();
    const log = quiet();
    const res = await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    log.mockRestore();
    expect(res).toEqual({ action: 'filed', number: 5200 });
    const create = calls.find((c) => c[0] === 'issue' && c[1] === 'create') as string[];
    expect(create.filter((a, i) => create[i - 1] === '--label')).toEqual(['desk:ops', 'marjorie-filed', 'routine-failure']);
    expect(create.join('\n')).not.toContain('abc123');
    expect(create.join('\n')).not.toContain('error_max_turns');
    expect(calls.find((c) => c[0] === 'workflow')).toEqual(['workflow', 'run', 'routine-marjorie-ask-response.yml', '--repo', 'JW-Incorporated/swift2', '--ref', 'main', '-f', 'issue_number=5200']);
  });
  it('comments the new run URL on today’s open issue instead of filing another, without dispatching again', async () => {
    const { gh, calls } = fakeGh({ open: [issueRow(5100, `body ${failureMarker(WF, '2026-10-05')} run https://github.com/o/r/actions/runs/100`)] });
    const log = quiet();
    const res = await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'timed_out' }, { gh, now: NOW });
    log.mockRestore();
    expect(res).toEqual({ action: 'commented', number: 5100 });
    expect(verbs(calls)).toEqual(['run view', 'issue comment']);
    expect(calls.find((c) => c[1] === 'comment')?.join(' ')).toMatch(RUN_RE);
  });
  it('matches a whole run URL only: run 111 is not run 1111', () => {
    expect(mentionsUrl('see https://github.com/o/r/actions/runs/1111', URL1)).toBe(false);
    expect(mentionsUrl('see https://github.com/o/r/actions/runs/111.', URL1)).toBe(true);
  });
  it('does not repeat a run URL it already recorded', async () => {
    const { gh, calls } = fakeGh({ open: [issueRow(5100, `${failureMarker(WF, '2026-10-05')} ${URL1}`)] });
    const log = quiet();
    await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    log.mockRestore();
    expect(verbs(calls)).toEqual(['run view']);
  });
  it('a different workflow or a different day files a new issue', async () => {
    const { gh, calls } = fakeGh({ open: [issueRow(5100, `${failureMarker('routine-laura-a11y-walk', '2026-10-05')} ${failureMarker(WF, '2026-10-04')}`)] });
    const log = quiet();
    expect((await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW })).action).toBe('filed');
    log.mockRestore();
    expect(verbs(calls)).toContain('issue create');
  });
  it('adopts Tree’s desk:tree receipt rather than filing a second issue, and moves it to desk:ops', async () => {
    const receipt = issueRow(5150, '## Tree daily draft did not finish', 'tree: daily draft run failed 2026-10-05', ['desk:tree']);
    const { gh, calls } = fakeGh({ tree: [receipt] });
    const log = quiet();
    const res = await triage({ workflow: 'routine-tree-daily-draft', runId: '112', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    log.mockRestore();
    expect(res).toEqual({ action: 'adopted', number: 5150 });
    expect(verbs(calls)).not.toContain('issue create');
    const edit = calls.find((c) => c[1] === 'edit') as string[];
    expect(edit.filter((a, i) => edit[i - 1] === '--add-label')).toEqual(FAILURE_LABELS);
    expect(edit.filter((a, i) => edit[i - 1] === '--remove-label')).toEqual(['desk:tree']);
    expect(edit.join('\n')).toContain(adoptionFooter('routine-tree-daily-draft', '2026-10-05'));
    expect(calls.find((c) => c[0] === 'workflow')?.slice(-1)).toEqual(['issue_number=5150']);
  });
  it('skips successes, its own runs and plain cancellations; a cancelled max-turns run is triaged', async () => {
    const q = quiet();
    for (const [workflow, conclusion] of [[WF, 'success'], [WF, 'skipped'], ['bot-failure-triage', 'failure']]) {
      const { gh, calls } = fakeGh();
      expect((await triage({ workflow, runId: '1', runUrl: URL1, conclusion }, { gh, now: NOW })).action).toBe('skipped');
      expect(calls).toEqual([]);
    }
    const plain = fakeGh({ jobs: CANCELLED, annotations: [{ message: 'The operation was canceled.' }] });
    expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'cancelled' }, { gh: plain.gh, now: NOW })).action).toBe('skipped');
    q.mockRestore();
  });
  it('a cancelled run whose job annotation says it exceeded the maximum execution time is triaged', async () => {
    const { gh, calls } = fakeGh({ jobs: CANCELLED, annotations: [{ message: 'The operation was canceled.' }, { message: 'The job running on runner X has exceeded the maximum execution time of 45 minutes.' }] });
    const q = quiet();
    expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'cancelled' }, { gh, now: NOW })).action).toBe('filed');
    q.mockRestore();
    expect(calls.some((c) => c[0] === 'api' && c[1] === 'repos/JW-Incorporated/swift2/check-runs/77/annotations')).toBe(true);
    expect(calls.some((c) => c.includes('--log-failed'))).toBe(false);
  });
  it('a cancelled run with empty or unreadable annotations is skipped with a warning naming the run URL', async () => {
    for (const fake of [{ annotations: [] }, { annotationsError: true }]) {
      const { gh } = fakeGh({ jobs: CANCELLED, ...fake });
      const q = quiet();
      expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'cancelled' }, { gh, now: NOW })).action).toBe('skipped');
      const warned = q.mock.calls.some((c) => String(c[0]).startsWith('::warning::') && RUN_RE.test(String(c[0])));
      q.mockRestore();
      expect(warned).toBe(true);
    }
  });
  it('comments on today’s CLOSED issue instead of filing a new one, and never reopens it', async () => {
    const closed = { ...issueRow(5100, `${failureMarker(WF, '2026-10-05')} earlier run`), state: 'closed' };
    const { gh, calls } = fakeGh({ open: [closed] });
    const q = quiet();
    expect(await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW })).toEqual({ action: 'commented', number: 5100 });
    q.mockRestore();
    expect(verbs(calls)).not.toContain('issue create');
    expect(verbs(calls)).not.toContain('issue reopen');
    expect(calls.some((c) => c[0] === 'api' && c[1].includes('state=all'))).toBe(true);
  });
  it('does not comment within an hour of the last triage comment, or after five', async () => {
    const recent = { body: `x ${COMMENT_MARKER}`, created_at: new Date(NOW - 10 * 60_000).toISOString() };
    const { gh, calls } = fakeGh({ open: [issueRow(5100, failureMarker(WF, '2026-10-05'))], comments: [recent] });
    const q = quiet();
    await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    q.mockRestore();
    expect(verbs(calls)).not.toContain('issue comment');
    const old = { body: COMMENT_MARKER, created_at: new Date(NOW - 3 * 3_600_000).toISOString() };
    expect(shouldComment([old], NOW)).toBe(true);
    expect(shouldComment([recent], NOW)).toBe(false);
    expect(shouldComment(Array(5).fill(old), NOW)).toBe(false);
    expect(shouldComment([], NOW)).toBe(true);
  });
  it('has its own daily dispatch cap: a failure issue past six today is filed but not dispatched (the listing includes the new one)', async () => {
    const six = Array.from({ length: 7 }, (_, i) => issueRow(5000 + i, failureMarker('routine-other-' + i, '2026-10-05'), 'routine failure: routine-other-' + i + ' 2026-10-05'));
    const { gh, calls } = fakeGh({ open: six, runsToday: 99 });
    const q = quiet();
    await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    q.mockRestore();
    expect(verbs(calls)).toContain('issue create');
    expect(calls.find((c) => c[0] === 'workflow')).toBeUndefined();
    const fresh = fakeGh({ runsToday: 99 });
    const q2 = quiet();
    await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh: fresh.gh, now: NOW });
    q2.mockRestore();
    expect(fresh.calls.find((c) => c[0] === 'workflow')).toBeDefined();
  });
  it('the cap counts only this script’s own issues, not other routine-failure-labelled ones', async () => {
    const adopted = Array.from({ length: 7 }, (_, i) => issueRow(5000 + i, failureMarker('routine-other-' + i, '2026-10-05'), 'tree: daily draft run failed 2026-10-05'));
    const { gh, calls } = fakeGh({ open: adopted });
    const q = quiet();
    await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    q.mockRestore();
    expect(calls.find((c) => c[0] === 'workflow')).toBeDefined();
  });
  it('routine-ops-fix failures are labelled ops-fix:stuck and never dispatched', async () => {
    const { gh, calls } = fakeGh();
    const q = quiet();
    expect((await triage({ workflow: 'routine-ops-fix', runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW })).action).toBe('filed');
    q.mockRestore();
    const create = calls.find((c) => c[0] === 'issue' && c[1] === 'create') as string[];
    expect(create.filter((a, i) => create[i - 1] === '--label')).toContain('ops-fix:stuck');
    expect(calls.find((c) => c[0] === 'workflow')).toBeUndefined();
  });
  it('never throws when GitHub is down', async () => {
    const gh = vi.fn(async () => { throw new Error('boom'); });
    const q = quiet();
    expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW })).action).toBe('skipped');
    q.mockRestore();
  });
});

describe('sweep', () => {
  const run = (id: number, over: Record<string, unknown> = {}) => ({ id, path: `.github/workflows/${WF}.yml`, html_url: `https://github.com/o/r/actions/runs/${id}`, head_branch: 'main', conclusion: 'failure', updated_at: '2026-10-05T11:30:00Z', ...over });
  function sweepGh(runs: unknown[]) {
    const open: unknown[] = [];
    const fake = fakeGh({ open });
    const gh = vi.fn(async (args: string[]) => {
      if (args[0] === 'api' && args[1].includes('/actions/runs?')) {
        fake.calls.push(args);
        return { stdout: JSON.stringify({ workflow_runs: runs }) };
      }
      const res = await fake.gh(args);
      if (args[0] === 'issue' && args[1] === 'create') open.push(issueRow(5200, args[args.indexOf('--body') + 1], args[args.indexOf('--title') + 1]));
      return res;
    });
    return { gh, calls: fake.calls };
  }
  it('picks up a failed run that no workflow_run event announced (bot-dispatched)', async () => {
    const { gh, calls } = sweepGh([run(111, { actor: BOT, event: 'workflow_dispatch' })]);
    const q = quiet();
    const res = await sweep({ gh, now: NOW });
    q.mockRestore();
    expect(res).toEqual([{ action: 'filed', number: 5200 }]);
    expect(calls.filter((c) => c[0] === 'workflow')).toHaveLength(1);
    expect(calls.find((c) => c[1]?.includes?.('/actions/runs?'))?.[1]).toMatch(/branch=main&created=%3E%3D2026-10-05T06:00:00Z/);
  });
  it('sweep plus workflow_run (either order) and a repeat sweep give one issue and one dispatch', async () => {
    const { gh, calls } = sweepGh([run(111)]);
    const q = quiet();
    await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW });
    expect((await sweep({ gh, now: NOW })).map((r: { action: string }) => r.action)).toEqual(['commented']);
    expect((await sweep({ gh, now: NOW + 1_800_000 })).map((r: { action: string }) => r.action)).toEqual(['commented']);
    q.mockRestore();
    expect(calls.filter((c) => c[0] === 'issue' && c[1] === 'create')).toHaveLength(1);
    expect(calls.filter((c) => c[1] === 'comment' && String(c.at(-1)).includes(COMMENT_MARKER))).toHaveLength(0);
    expect(calls.filter((c) => c[0] === 'workflow')).toHaveLength(1);
  });
  it('a run failing 23:59 and triaged by workflow_run at 00:00:30 is the same issue the 00:17 sweep finds', async () => {
    const { gh, calls } = sweepGh([run(111, { updated_at: '2026-10-05T23:59:00Z' })]);
    const q = quiet();
    await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'failure', day: dayOf('2026-10-05T23:59:00Z', 0) }, { gh, now: Date.parse('2026-10-06T00:00:30Z') });
    await sweep({ gh, now: Date.parse('2026-10-06T00:17:00Z') });
    q.mockRestore();
    expect(calls.filter((c) => c[0] === 'issue' && c[1] === 'create')).toHaveLength(1);
    expect(calls.filter((c) => c[0] === 'workflow')).toHaveLength(1);
  });
  it('lists runs created up to 6h back but only triages those completed in the last 2h, and follows pages', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => run(1000 + i, { conclusion: 'success' }));
    const old = run(5, { updated_at: '2026-10-05T08:00:00Z' });
    const fresh = run(6, { path: '.github/workflows/routine-laura-a11y-walk.yml', updated_at: '2026-10-05T11:45:00Z' });
    const calls: string[][] = [];
    const gh = vi.fn(async (args: string[]) => {
      calls.push(args);
      if (args[0] === 'api' && args[1].includes('status=failure&')) return { stdout: JSON.stringify({ workflow_runs: args[1].endsWith('page=1') ? page1 : [old, fresh] }) };
      if (args[0] === 'api' && args[1].includes('/actions/runs?')) return { stdout: '{}' };
      return fakeGh().gh(args);
    });
    const q = quiet();
    const res = await sweep({ gh, now: NOW });
    q.mockRestore();
    expect(res).toHaveLength(1);
    expect(calls.some((c) => c[1]?.includes?.('status=failure&') && c[1].endsWith('page=2'))).toBe(true);
    expect(calls.filter((c) => c[0] === 'issue' && c[1] === 'create').length).toBe(1);
  });
  it('ignores non-main, successful, non-routine and its own runs', async () => {
    const { gh, calls } = sweepGh([run(1, { head_branch: 'feature/x' }), run(2, { conclusion: 'success' }), run(3, { path: '.github/workflows/ci.yml' }), run(4, { path: '.github/workflows/bot-failure-triage.yml' }), run(5, { path: '.github/workflows/routine-template.yml' })]);
    const q = quiet();
    expect(await sweep({ gh, now: NOW })).toEqual([]);
    q.mockRestore();
    expect(verbs(calls)).toEqual([]);
  });
  it('routine-ops-fix failures found by the sweep are labelled ops-fix:stuck and never dispatched', async () => {
    const { gh, calls } = sweepGh([run(9, { path: '.github/workflows/routine-ops-fix.yml' })]);
    const q = quiet();
    await sweep({ gh, now: NOW });
    q.mockRestore();
    expect(calls.find((c) => c[0] === 'workflow')).toBeUndefined();
    expect((calls.find((c) => c[0] === 'issue' && c[1] === 'create') as string[]).includes('ops-fix:stuck')).toBe(true);
  });
});

describe('workflow wiring', () => {
  const root = path.resolve(__dirname, '../..');
  const text = readFileSync(path.join(root, '.github/workflows/bot-failure-triage.yml'), 'utf8');
  const routines = readdirSync(path.join(root, '.github/workflows')).filter((f) => f.startsWith('routine-') && f.endsWith('.yml') && f !== 'routine-template.yml' && f !== 'bot-failure-triage.yml').map((f) => f.replace(/\.yml$/, '')).sort();
  it('listens to every routine workflow and never to itself', () => {
    const listed = [...text.matchAll(/^ {6}- (routine-[a-z0-9-]+)\s*$/gm)].map((m) => m[1]).sort();
    expect(listed.filter((n: string) => n !== 'routine-ops-fix')).toEqual(routines.filter((n: string) => n !== 'routine-ops-fix'));
    expect(listed).toContain('routine-ops-fix');
    expect(text).toMatch(/^ {2}group: bot-failure-triage$/m);
    expect(listed).not.toContain('bot-failure-triage');
  });
  it('also runs the sweep on a schedule and by hand, and only filters workflow_run events', () => {
    expect(text).toContain('cron: "11,41 * * * *"');
    expect(text).toMatch(/^ {2}workflow_dispatch:/m);
    expect(text).toContain("github.event_name != 'workflow_run' || (github.event.workflow_run.head_branch == 'main'");
    expect(text).toContain('routine-failure-triage.mjs --sweep');
  });
  it('is also dispatched by bot-chat-poll (primary) and watchdog (backup) via the one throttled clock script', () => {
    const poll = readFileSync(path.join(root, '.github/workflows/bot-chat-poll.yml'), 'utf8');
    expect(poll).toMatch(/if: always\(\)\n {8}env:\n {10}GH_TOKEN: \$\{\{ github.token \}\}\n {10}REPO: \$\{\{ github.repository \}\}\n {8}run: node scripts\/ops\/clock-dispatch.mjs/);
    expect(poll).toMatch(/^ {2}actions: write/m);
    const wd = readFileSync(path.join(root, '.github/workflows/watchdog.yml'), 'utf8');
    const job = wd.slice(wd.indexOf('  triage-sweep-dispatch:'));
    expect(job).toContain("if: github.event_name == 'schedule'");
    expect(job).toMatch(/permissions:\n {6}contents: read.*\n {6}actions: write\n/);
    expect(job).not.toContain('needs:');
    expect(job).toContain('run: node scripts/ops/clock-dispatch.mjs');
  });
  it('uses least privilege and never interpolates event data inside run:', () => {
    expect(text).toMatch(/permissions:\n {2}contents: read\n {2}issues: write\n {2}actions: write/);
    const runs = text.split('\n').filter((l) => /^\s+run:/.test(l));
    for (const r of runs) expect(r).not.toContain('${{');
  });
});
