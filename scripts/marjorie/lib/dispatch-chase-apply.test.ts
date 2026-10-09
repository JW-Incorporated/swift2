import { describe, expect, it } from 'vitest';
import {
  allocatePendingHumanActionNumber, applyDispatchChase, checkPendingHumanActionNumber,
  prependHumanActions,
} from './dispatch-chase-apply.mjs';

const NOW = Date.parse('2026-09-15T12:00:00Z');
const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString();
const state = (hours: number, number = 2) => ({
  now: NOW, openActions: '## #9 🟡 [DECIDE] Existing (~2 min)', doneActions: '- #8 · done', pendingHaPrs: [], prs: [],
  issues: [{ number, title: 'Need a decision', createdAt: ago(hours + 1), updatedAt: ago(hours), comments: [], labels: [] }],
});
describe('dispatch chase apply', () => {
  it('files the first action into an empty v2 ledger and updates its count', () => {
    const result = prependHumanActions('# Human actions\n\n<!-- ha-format: 2 -->\n\n> **0 open.**\n', ['## #10 🟡 [DECIDE] First']);
    expect(result).toContain('> **1 open.**');
    expect(result).toMatch(/open\.\*\*\n\n## #10/);
  });
  it('allocates and validates against main, done, and every pending PR head', () => {
    const pendingHaPrs = [{ actionsText: '## #12 🟡 [DECIDE] Pending\n<!-- marjorie-chase: 96h issue=2 -->' }];
    expect(allocatePendingHumanActionNumber({ openActions: '## #10 🟡 [DECIDE] Open', doneActions: '- #11 · done', pendingHaPrs })).toBe(13);
    expect(checkPendingHumanActionNumber({ number: 12, openActions: '', doneActions: '', pendingHaPrs }).valid).toBe(true);
    expect(checkPendingHumanActionNumber({ number: 12, openActions: '## #12 🟡 [DECIDE] Landed', doneActions: '', pendingHaPrs }).valid).toBe(false);
  });

  it('recollects state, nudges from the fresh plan, and never uses a real command in the test', async () => {
    const calls: string[][] = [];
    const exec = async (command: string, args: string[]) => { calls.push([command, ...args]); return { stdout: '[]' }; };
    const result = await applyDispatchChase('owner/repo', { exec, fetchState: async () => state(49) });
    expect(result.status).toBe('no-human-actions');
    expect(calls).toContainEqual(['gh', 'issue', 'comment', '2', '--repo', 'owner/repo', '--body', expect.stringContaining('marjorie-chase: 48h')]);
  });

  it('files one deterministic combined PR, validates its number, and stamps each source issue', async () => {
    const calls: string[][] = [];
    let fetches = 0;
    const exec = async (command: string, args: string[]) => {
      calls.push([command, ...args]);
      if (command === 'git' && args[0] === 'ls-remote') throw new Error('missing branch');
      if (command !== 'gh') return { stdout: '' };
      if (args[0] === 'pr' && args[1] === 'create') return { stdout: 'https://github.com/owner/repo/pull/75\n' };
      if (args[0] === 'pr' && args[1] === 'view') return { stdout: JSON.stringify({ number: 75, url: 'https://github.com/owner/repo/pull/75', headRefName: 'marjorie/chase-ha-2' }) };
      return { stdout: '' };
    };
    let written = '';
    const pendingHaPrs = [{ number: 75, headRef: 'marjorie/chase-ha-2', safeChaseHead: true, headSha: 'a'.repeat(40), url: 'https://github.com/owner/repo/pull/75', body: '<!-- marjorie-chase-pr: issues=2 -->', actionsText: '## #10 🟡 [DECIDE] #2\n<!-- marjorie-chase: 96h issue=2 -->' }];
    const result = await applyDispatchChase('owner/repo', {
      exec, fetchState: async () => (++fetches === 1 ? state(97) : { ...state(97), pendingHaPrs }), readFileImpl: async () => '# Human actions\n\n> **1 open.**\n\n## #9 🟡 [DECIDE] Existing',
      writeFileImpl: async (_file: string, value: string) => { written = value; },
    });
    expect(result).toMatchObject({ status: 'resumed', branch: 'marjorie/chase-ha-2' });
    expect(fetches).toBe(2);
    const prView = calls.findIndex((call) => call.slice(0, 3).join(' ') === 'gh pr view');
    expect(calls.slice(prView + 1)).toContainEqual(['git', 'checkout', '--detach', 'origin/main']);
    expect(written).toContain('## #10');
    expect(written.indexOf('## #10')).toBeLessThan(written.indexOf('## #9'));
    expect(written).toContain('> **2 open.**');
    expect(calls).toContainEqual(['gh', 'pr', 'merge', '75', '--repo', 'owner/repo', '--squash', '--auto', '--delete-branch', '--match-head-commit', 'a'.repeat(40)]);
    expect(calls).toContainEqual(['gh', 'issue', 'comment', '2', '--repo', 'owner/repo', '--body', expect.stringContaining('ha=10 pr=75')]);
  });

  it('fails closed on an existing pending reservation conflict without merging either PR', async () => {
    const pendingHaPrs = [70, 71].map((number) => ({ number, headRef: 'marjorie/chase-ha-2', safeChaseHead: true, headSha: 'a'.repeat(40), url: `https://pr/${number}`, body: '<!-- marjorie-chase-pr: issues=2 -->', actionsText: '## #10 🟡 [DECIDE] #2\n<!-- marjorie-chase: 96h issue=2 -->' }));
    const calls: string[][] = [];
    const result = await applyDispatchChase('owner/repo', {
      exec: async (command: string, args: string[]) => { calls.push([command, ...args]); return { stdout: '' }; },
      fetchState: async () => ({ ...state(97), pendingHaPrs }),
    });
    expect(result.status).toBe('pending-reservation-conflict');
    expect(calls.some((call) => call.slice(0, 3).join(' ') === 'gh pr merge')).toBe(false);
  });
});

it('resumes an existing PR after a crash without creating another one', async () => {
  const calls: string[][] = [];
  const pendingHaPrs = [{ number: 75, headRef: 'marjorie/chase-ha-2', safeChaseHead: true, headSha: 'a'.repeat(40),
    url: 'https://github.com/owner/repo/pull/75', body: '<!-- marjorie-chase-pr: issues=2 -->',
    actionsText: '## #10 Decision\n<!-- marjorie-chase: 96h issue=2 -->\n\n## #9 Older decision\n<!-- marjorie-chase: 96h issue=1 -->' }];
  const result = await applyDispatchChase('owner/repo', {
    fetchState: async () => ({ ...state(97), pendingHaPrs }),
    exec: async (cmd: string, args: string[]) => { calls.push([cmd, ...args]); return { stdout: '' }; },
  });
  expect(result.status).toBe('resumed');
  expect(calls.some((call) => call.slice(0, 3).join(' ') === 'gh pr create')).toBe(false);
  expect(calls.filter((call) => call.slice(0, 3).join(' ') === 'gh issue comment')).toHaveLength(1);
  expect(calls.some((call) => call.slice(0, 3).join(' ') === 'gh pr merge')).toBe(true);
});
it('does not merge a pending chase PR with extra files or a foreign head', async () => {
  const calls: string[][] = [];
  const result = await applyDispatchChase('owner/repo', {
    fetchState: async () => ({ ...state(97), pendingHaPrs: [{ number: 75, headRef: 'marjorie/chase-ha-2', safeChaseHead: false,
      body: '<!-- marjorie-chase-pr: issues=2 -->', actionsText: '## #10 Decision\n<!-- marjorie-chase: 96h issue=2 -->' }] }),
    exec: async (cmd: string, args: string[]) => { calls.push([cmd, ...args]); return { stdout: '' }; },
  });
  expect(result.status).toBe('pending-reservation-conflict');
  expect(calls.some((call) => call[0] === 'gh')).toBe(false);
});

it('closes a safe chase PR with a confirmed closed source and resumes another pending PR', async () => {
  const calls: string[][] = [];
  const makePending = (pr: number, issue: number, ha: number) => ({
    number: pr, headRef: `marjorie/chase-ha-${issue}`, safeChaseHead: true, headSha: String(pr).repeat(20),
    url: `https://github.com/owner/repo/pull/${pr}`, body: `<!-- marjorie-chase-pr: issues=${issue} -->`,
    actionsText: `## #${ha} Decision\n<!-- marjorie-chase: 96h issue=${issue} -->`,
  });
  const pendingHaPrs = [makePending(75, 2, 10), makePending(76, 3, 11)];
  const open = state(97, 3);
  const result = await applyDispatchChase('owner/repo', {
    fetchState: async () => ({ ...open, pendingHaPrs }),
    exec: async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args]);
      if (cmd === 'gh' && args[0] === 'api') return { stdout: JSON.stringify({ number: 2, state: 'closed' }) };
      return { stdout: '' };
    },
  });
  expect(result.status).toBe('resumed');
  expect(calls).toContainEqual(['gh', 'pr', 'close', '75', '--repo', 'owner/repo']);
  expect(calls.some((call) => call[0] === 'gh' && call[1] === 'issue' && call[3] === '2')).toBe(false);
  expect(calls).toContainEqual(['gh', 'pr', 'merge', '76', '--repo', 'owner/repo', '--squash', '--auto', '--delete-branch', '--match-head-commit', String(76).repeat(20)]);
});

it('fails closed when an absent source is still open or unreadable', async () => {
  const pending = { number: 75, headRef: 'marjorie/chase-ha-2', safeChaseHead: true, headSha: 'a'.repeat(40),
    url: 'https://github.com/owner/repo/pull/75', body: '<!-- marjorie-chase-pr: issues=2 -->',
    actionsText: '## #10 Decision\n<!-- marjorie-chase: 96h issue=2 -->' };
  for (const apiResult of [{ stdout: JSON.stringify({ state: 'open', labels: [] }) }, new Error('unreadable')]) {
    const calls: string[][] = [];
    const result = await applyDispatchChase('owner/repo', {
      fetchState: async () => ({ ...state(97, 3), pendingHaPrs: [pending] }),
      exec: async (cmd: string, args: string[]) => {
        calls.push([cmd, ...args]);
        if (cmd === 'gh' && args[0] === 'api') {
          if (apiResult instanceof Error) throw apiResult;
          return apiResult;
        }
        return { stdout: '' };
      },
    });
    expect(['pending-source-missing', 'pending-source-unreadable']).toContain(result.status);
    expect(calls.some((call) => call[0] === 'gh' && call[1] === 'pr')).toBe(false);
  }
});
