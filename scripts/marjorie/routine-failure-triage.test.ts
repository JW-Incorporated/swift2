import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { FAILURE_LABELS, adoptionFooter, buildFailureIssue, failureMarker, parseFailedLog, redact, triage } from './routine-failure-triage.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseMarker } from './lib/loop-asks.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { selectPending } from './lib/loop-queue.mjs';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const WF = 'routine-austin-build';
const URL1 = 'https://github.com/o/r/actions/runs/111';
const BOT = { login: 'github-actions[bot]' };
const LOG = ['run / Run Claude\tRun Claude\t2026-10-05T11:00:00.1Z error_max_turns reached', 'run / Run Claude\tRun Claude\t2026-10-05T11:00:01.1Z CLAUDE_CODE_OAUTH_TOKEN=abc123', 'run / Run Claude\tRun Claude\t2026-10-05T11:00:02.1Z done'].join('\n');

type Fake = { open?: unknown[]; tree?: unknown[]; comments?: unknown[]; log?: string; runsToday?: number };
function fakeGh({ open = [], tree = [], comments = [], log = LOG, runsToday = 0 }: Fake = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const p = args[1];
      if (p.includes('/actions/workflows/')) return { stdout: JSON.stringify({ total_count: runsToday }) };
      if (/issues\/\d+\/comments/.test(p)) return { stdout: JSON.stringify(comments) };
      if (p.includes('labels=desk%3Atree')) return { stdout: JSON.stringify(tree) };
      return { stdout: JSON.stringify(open) };
    }
    if (args[0] === 'run') return { stdout: log };
    if (args[0] === 'issue' && args[1] === 'create') return { stdout: 'https://github.com/o/r/issues/5200\n' };
    return { stdout: '' };
  });
  return { gh, calls };
}
const verbs = (calls: string[][]) => calls.filter((c) => c[0] !== 'api').map((c) => c.slice(0, 2).join(' '));
const quiet = () => vi.spyOn(console, 'log').mockImplementation(() => {});
const issueRow = (n: number, body: string, title = 'x', labels = ['routine-failure', 'desk:ops']) => ({ number: n, title, html_url: `https://github.com/o/r/issues/${n}`, user: BOT, state: 'open', created_at: '2026-10-05T06:00:00Z', closed_at: null, labels: labels.map((name) => ({ name })), body });

describe('log parsing and redaction', () => {
  it('withholds lines that mention a token, secret, key or password', () => {
    expect(redact(['all fine', 'Authorization: token ghp_x', 'SECRET=1', 'api_key set', 'Password: x'])).toEqual(['all fine', ...Array(4).fill('[line withheld: matched a secret-like word]')]);
  });
  it('finds the failing step and keeps only the last 30 stripped lines', () => {
    const many = Array.from({ length: 50 }, (_, i) => `job\tstep one\t2026-10-05T11:00:00.0Z line ${i}`).join('\n');
    const { failingStep, tail } = parseFailedLog(many);
    expect(failingStep).toBe('job / step one');
    expect(tail).toHaveLength(30);
    expect(tail[29]).toBe('line 49');
  });
  it('an empty log has no step and no lines', () => {
    expect(parseFailedLog('')).toEqual({ failingStep: null, tail: [] });
  });
});

describe('issue body', () => {
  const issue = buildFailureIssue({ workflow: WF, runUrl: URL1, conclusion: 'failure', failingStep: 'run / Run Claude', tail: ['a', 'b'], day: '2026-10-05' });
  it('carries the labels, the dedupe marker and a loop-ask marker Marjorie’s queue reads', () => {
    expect(issue.labels).toEqual(['desk:ops', 'marjorie-filed', 'routine-failure']);
    expect(FAILURE_LABELS).toEqual(issue.labels);
    expect(issue.title).toBe(`routine failure: ${WF} 2026-10-05`);
    expect(issue.body).toContain(`<!-- routine-failure: ${WF} 2026-10-05 -->`);
    expect(parseMarker(issue.body).key).toBe(`routine-failure-${WF}-2026-10-05`);
    expect(issue.body).toContain(URL1);
    expect(issue.body).toContain('REROUTE');
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
    expect(calls.find((c) => c[0] === 'workflow')).toEqual(['workflow', 'run', 'routine-marjorie-ask-response.yml', '--repo', 'JW-Incorporated/swift2', '--ref', 'main', '-f', 'issue_number=5200']);
  });
  it('comments the new run URL on today’s open issue instead of filing another, without dispatching again', async () => {
    const { gh, calls } = fakeGh({ open: [issueRow(5100, `body ${failureMarker(WF, '2026-10-05')} run https://github.com/o/r/actions/runs/100`)] });
    const log = quiet();
    const res = await triage({ workflow: WF, runId: '111', runUrl: URL1, conclusion: 'timed_out' }, { gh, now: NOW });
    log.mockRestore();
    expect(res).toEqual({ action: 'commented', number: 5100 });
    expect(verbs(calls)).toEqual(['run view', 'issue comment']);
    expect(calls.find((c) => c[1] === 'comment')?.join(' ')).toContain(URL1);
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
    for (const [workflow, conclusion] of [[WF, 'success'], [WF, 'skipped'], ['routine-failure-triage', 'failure']]) {
      const { gh, calls } = fakeGh();
      expect((await triage({ workflow, runId: '1', runUrl: URL1, conclusion }, { gh, now: NOW })).action).toBe('skipped');
      expect(calls).toEqual([]);
    }
    const plain = fakeGh({ log: 'job\tstep\t2026-10-05T11:00:00Z cancelled by user' });
    expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'cancelled' }, { gh: plain.gh, now: NOW })).action).toBe('skipped');
    const capped = fakeGh();
    expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'cancelled' }, { gh: capped.gh, now: NOW })).action).toBe('filed');
    q.mockRestore();
  });
  it('never throws when GitHub is down', async () => {
    const gh = vi.fn(async () => { throw new Error('boom'); });
    const q = quiet();
    expect((await triage({ workflow: WF, runId: '1', runUrl: URL1, conclusion: 'failure' }, { gh, now: NOW })).action).toBe('skipped');
    q.mockRestore();
  });
});

describe('workflow wiring', () => {
  const root = path.resolve(__dirname, '../..');
  const text = readFileSync(path.join(root, '.github/workflows/routine-failure-triage.yml'), 'utf8');
  const routines = readdirSync(path.join(root, '.github/workflows')).filter((f) => f.startsWith('routine-') && f.endsWith('.yml') && f !== 'routine-template.yml' && f !== 'routine-failure-triage.yml').map((f) => f.replace(/\.yml$/, '')).sort();
  it('listens to every routine workflow and never to itself', () => {
    const listed = [...text.matchAll(/^ {6}- (routine-[a-z0-9-]+)\s*$/gm)].map((m) => m[1]).sort();
    expect(listed).toEqual(routines);
    expect(listed).not.toContain('routine-failure-triage');
  });
  it('uses least privilege and never interpolates event data inside run:', () => {
    expect(text).toMatch(/permissions:\n {2}contents: read\n {2}issues: write\n {2}actions: write/);
    const runs = text.split('\n').filter((l) => /^\s+run:/.test(l));
    for (const r of runs) expect(r).not.toContain('${{');
  });
});
