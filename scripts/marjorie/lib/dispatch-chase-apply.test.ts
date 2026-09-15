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
    const pendingHaPrs = [{ number: 75, headRef: 'marjorie/chase-ha-2', url: 'https://github.com/owner/repo/pull/75', body: '<!-- marjorie-chase-pr: issues=2 -->', actionsText: '## #10 🟡 [DECIDE] #2\n<!-- marjorie-chase: 96h issue=2 -->' }];
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
    expect(calls).toContainEqual(['gh', 'pr', 'merge', '75', '--repo', 'owner/repo', '--squash', '--auto', '--delete-branch']);
    expect(calls).toContainEqual(['gh', 'issue', 'comment', '2', '--repo', 'owner/repo', '--body', expect.stringContaining('ha=10 pr=75')]);
  });

  it('fails closed on an existing pending reservation conflict without merging either PR', async () => {
    const pendingHaPrs = [70, 71].map((number) => ({ number, headRef: 'marjorie/chase-ha-2', url: `https://pr/${number}`, body: '<!-- marjorie-chase-pr: issues=2 -->', actionsText: '## #10 🟡 [DECIDE] #2\n<!-- marjorie-chase: 96h issue=2 -->' }));
    const calls: string[][] = [];
    const result = await applyDispatchChase('owner/repo', {
      exec: async (command: string, args: string[]) => { calls.push([command, ...args]); return { stdout: '' }; },
      fetchState: async () => ({ ...state(97), pendingHaPrs }),
    });
    expect(result.status).toBe('pending-reservation-conflict');
    expect(calls.some((call) => call.slice(0, 3).join(' ') === 'gh pr merge')).toBe(false);
  });
});
