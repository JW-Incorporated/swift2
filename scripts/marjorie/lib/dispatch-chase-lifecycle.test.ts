import { describe, expect, it } from 'vitest';
import { applyDispatchChase } from './dispatch-chase-apply.mjs';
import { evaluateDispatchChase } from './dispatch-chase.mjs';
import { resolveChaseAction } from './chase-action.mjs';
import { renderDispatchedLine } from './brief-sections.mjs';

const BASE = Date.parse('2026-09-15T12:00:00Z');
const ago = (now: number, hours: number) => new Date(now - hours * 3_600_000).toISOString();
const ISSUE = 4324;
type Comment = { body: string; viewerDidAuthor?: boolean; author?: { login: string; type: string }; createdAt?: string };
type IssueFixture = { number: number; title: string; createdAt: string; updatedAt: string; comments: Comment[]; labels: string[]; state: string };
type PrFixture = { number: number; body: string; createdAt: string; updatedAt: string; comments: Comment[]; labels: string[] };

class ChaseBackend {
  issues: IssueFixture[] = [
    { number: ISSUE, title: 'Stale bug', createdAt: ago(BASE, 100), updatedAt: ago(BASE, 49), comments: [], labels: ['marjorie-filed'], state: 'OPEN' },
  ];
  prs: PrFixture[] = [{ number: 90, body: `Fixes #${ISSUE}`, createdAt: ago(BASE, 61), updatedAt: ago(BASE, 49), comments: [], labels: ['austin-built'] }];
  openActions = '# Human actions\n\n<!-- ha-format: 2 -->\n\n> **0 open.**\n';
  doneActions = '';
  pendingHaPrs: Array<Record<string, unknown>> = [];
  stagedActions = '';
  nextPr = 700;
  calls: string[][] = [];

  snapshot(now: number) {
    return structuredClone({ now, issues: this.issues, prs: this.prs, openActions: this.openActions,
      doneActions: this.doneActions, pendingHaPrs: this.pendingHaPrs });
  }

  async exec(command: string, args: string[]) {
    this.calls.push([command, ...args]);
    if (command === 'git' && args[0] === 'ls-remote') throw new Error('no remote chase branch');
    if (command !== 'gh') return { stdout: '' };
    if (args[0] === 'issue' && args[1] === 'comment') {
      const issue = this.issues.find((item) => item.number === Number(args[2]));
      issue?.comments.push({ body: args[args.indexOf('--body') + 1], viewerDidAuthor: true });
    } else if (args[0] === 'pr' && args[1] === 'comment') {
      const pr = this.prs.find((item) => item.number === Number(args[2]));
      pr?.comments.push({ body: args[args.indexOf('--body') + 1], viewerDidAuthor: true });
    } else if (args[0] === 'pr' && args[1] === 'create') {
      const branch = args[args.indexOf('--head') + 1];
      const body = args[args.indexOf('--body') + 1];
      this.pendingHaPrs = [{ number: this.nextPr, headRef: branch, headSha: 'a'.repeat(40), safeChaseHead: true,
        url: `https://github.com/owner/repo/pull/${this.nextPr}`, body, actionsText: this.stagedActions }];
      return { stdout: `https://github.com/owner/repo/pull/${this.nextPr}\n` };
    } else if (args[0] === 'pr' && args[1] === 'view') {
      const pr = this.pendingHaPrs[0];
      return { stdout: JSON.stringify({ number: pr.number, url: pr.url, headRefName: pr.headRef }) };
    } else if (args[0] === 'pr' && args[1] === 'merge') {
      this.openActions = String(this.pendingHaPrs[0].actionsText);
      this.pendingHaPrs = [];
    }
    return { stdout: '' };
  }

  nudgeCommentCount() {
    return this.issues.reduce((count, issue) => count + issue.comments.filter((comment) => comment.body.includes('marjorie-chase: 48h')).length, 0)
      + this.prs.reduce((count, pr) => count + pr.comments.filter((comment) => comment.body.includes('marjorie-chase: 48h')).length, 0);
  }
}

function briefEntry(item: ReturnType<ChaseBackend['snapshot']>['issues'][number], chase: ReturnType<typeof evaluateDispatchChase>['items'][number]) {
  return { ...item, chase };
}

describe('dispatch chase lifecycle', () => {
  it('carries nudge, HA, defer, holder, and brief state through repeated sweeps', async () => {
    const backend = new ChaseBackend();
    const apply = (now: number) => applyDispatchChase('owner/repo', {
      exec: backend.exec.bind(backend), fetchState: async () => backend.snapshot(now),
      readFileImpl: async () => backend.openActions,
      writeFileImpl: async (_file: string, value: string) => { backend.stagedActions = value; },
    });

    const first = evaluateDispatchChase(backend.snapshot(BASE));
    expect(first.items.find((item) => item.number === ISSUE)?.verdict).toBe('stale-48');
    expect(first.items.find((item) => item.number === ISSUE)?.holder).toBe('Austin PR #90 awaiting review');
    expect(first.nudges[0].targets).toHaveLength(2);
    await apply(BASE);
    expect(backend.nudgeCommentCount()).toBe(2);
    await apply(BASE);
    expect(backend.nudgeCommentCount()).toBe(2);

    const repeated = evaluateDispatchChase(backend.snapshot(BASE));
    expect(repeated.nudges).toHaveLength(0);
    expect(renderDispatchedLine(repeated.items.map((item) => briefEntry(item.issue, item)), BASE)).toContain('stalled 2d+:');

    const at97 = BASE + 48 * 3_600_000;
    const beforeHa = evaluateDispatchChase(backend.snapshot(at97));
    expect(beforeHa.humanActions).toHaveLength(1);
    await apply(at97);
    expect(backend.calls.filter((call) => call[0] === 'gh' && call[1] === 'pr' && call[2] === 'create')).toHaveLength(1);

    const afterHa = evaluateDispatchChase(backend.snapshot(at97));
    expect(afterHa.humanActions).toHaveLength(0);
    await apply(at97);
    expect(backend.calls.filter((call) => call[0] === 'gh' && call[1] === 'pr' && call[2] === 'create')).toHaveLength(1);

    const action = resolveChaseAction({
      context: { bot: 'marjorie', already: null, message_id: '900000000000000001',
        url: 'https://discord.com/channels/900000000000000002/900000000000000003/900000000000000001',
        text: 'defer', replying_to: { text: `HA #1 for issue #${ISSUE}` } },
      issues: backend.issues, openMd: backend.openActions, doneMd: '',
    });
    expect(action).toMatchObject({ ok: true, action: 'defer', haOutcome: 'skip', issue: ISSUE });
    backend.doneActions = `- #1 · 2026-09-17 · skip · [DECIDE] #${ISSUE} has had no activity for 4 days · by chat · <!-- marjorie-chase: 96h issue=${ISSUE} -->`;
    backend.openActions = '# Human actions\n\n<!-- ha-format: 2 -->\n\n> **0 open.**\n';
    backend.issues[0].labels.push('deferred');

    const held = evaluateDispatchChase(backend.snapshot(at97));
    expect(held.items.find((item) => item.number === ISSUE)?.verdict).toBe('held');
    const heldBrief = renderDispatchedLine(held.items.map((item) => briefEntry(item.issue, item)), at97);
    expect(heldBrief).not.toContain('stalled 2d+:');
    expect(heldBrief).toContain(`held: #${ISSUE}`);
  });
});
