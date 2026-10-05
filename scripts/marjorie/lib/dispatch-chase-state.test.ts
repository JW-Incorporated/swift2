import { describe, expect, it } from 'vitest';
import { fetchDispatchChaseState } from './dispatch-chase-state.mjs';

const at = '2026-09-10T12:00:00Z';
const row = (number: number) => ({ number, title: `Item ${number}`, created_at: at, updated_at: at, labels: [], assignees: [] });
const files = async (name: string) => name === 'HUMAN-ACTIONS.md' ? 'open actions' : 'done actions';

describe('dispatch chase snapshot', () => {
  it('collects all comment pages and full linked PR activity without unrelated PR reads', async () => {
    const calls: string[] = [];
    const ghImpl = async (args: string[]) => {
      const endpoint = args[1]; calls.push(endpoint);
      let rows: unknown[] = [];
      if (endpoint.includes('labels=marjorie-filed')) rows = [row(7)];
      else if (endpoint.includes('/pulls?')) rows = [{ ...row(20), body: 'Closes #7' }, { ...row(21), body: 'Fixes #999' }];
      else if (endpoint.includes('/issues/7/comments')) rows = endpoint.endsWith('page=1')
        ? Array.from({ length: 100 }, () => ({ body: 'outside activity', created_at: at, user: { login: 'builder', type: 'User' } }))
        : [{ body: '<!-- marjorie-chase: 48h -->', created_at: '2026-09-14T12:00:00Z', updated_at: '2026-09-14T13:00:00Z', user: { login: 'claude[bot]', type: 'Bot' } }];
      else if (endpoint.includes('/timeline')) rows = [{ event: 'commented', created_at: '2026-09-15T12:00:00Z' }, { event: 'assigned', created_at: at }];
      else if (endpoint.includes('/commits')) rows = [{ commit: { committer: { date: at } } }];
      else if (endpoint.includes('/reviews')) rows = [{ body: 'review', submitted_at: at, user: { login: 'reviewer', type: 'User' } }];
      return { stdout: JSON.stringify(rows), capExhausted: false };
    };
    const state = await fetchDispatchChaseState('owner/repo', { now: 123, ghImpl, readFileImpl: files });
    expect(state.issues[0].comments).toHaveLength(101);
    expect(state.issues[0].comments[100].updatedAt).toBe('2026-09-14T13:00:00Z');
    expect(state.issues[0].events).toEqual([{ createdAt: at }]);
    expect(state.prs.map((p: { number: number }) => p.number)).toEqual([20]);
    expect(state.prs[0].commits).toEqual([{ committedDate: at }]);
    expect(state.prs[0].reviews[0].author.login).toBe('reviewer');
    expect(calls.filter((call) => call.includes('/21/'))).toEqual(['repos/owner/repo/pulls/21/files?per_page=100&page=1']);
    expect(state.openActions).toBe('open actions');
    expect(state.doneActions).toBe('done actions');
    expect(state.now).toBe(123);
  });

  it('refuses truncated or malformed history instead of making a stale verdict', async () => {
    await expect(fetchDispatchChaseState('owner/repo', { ghImpl: async () => ({ stdout: '[]', capExhausted: true }), readFileImpl: files })).rejects.toThrow('incomplete');
    await expect(fetchDispatchChaseState('owner/repo', { ghImpl: async () => ({ stdout: '{}' }), readFileImpl: files })).rejects.toThrow('invalid history');
    await expect(fetchDispatchChaseState('owner/repo', { ghImpl: async () => ({ stdout: JSON.stringify(Array.from({ length: 100 }, () => row(7))) }), readFileImpl: files })).rejects.toThrow('page cap');
  });

  it('fails closed when archived human actions cannot be read', async () => {
    await expect(fetchDispatchChaseState('owner/repo', {
      ghImpl: async () => ({ stdout: '[]' }), readFileImpl: async () => { throw new Error('unavailable'); },
    })).rejects.toThrow('unavailable');
  });
});

it('reserves pending HA head numbers and only remembers delivered held notices', async () => {
  const ghImpl = async (args: string[]) => {
    const endpoint = args[1];
    let rows: unknown = [];
    if (endpoint.includes('/pulls?')) rows = [{ ...row(30), head: { sha: 'a'.repeat(40), ref: 'ha' } }];
    else if (endpoint.includes('/pulls/30/files')) rows = [{ filename: 'HUMAN-ACTIONS.md' }];
    else if (endpoint.includes('/contents/')) rows = { encoding: 'base64', content: Buffer.from('## #81 Pending').toString('base64') };
    else if (endpoint.includes('labels=founders-brief')) rows = [
      { ...row(40), body: '<!-- marjorie-held: issue=7 ha=80 -->' },
      { ...row(41), body: '<!-- marjorie-held: issue=8 ha=82 -->' },
    ];
    else if (endpoint.includes('/issues/40/comments')) rows = [{ body: '<!-- discord-message-id: 123 -->' }];
    return { stdout: JSON.stringify(rows) };
  };
  const state = await fetchDispatchChaseState('owner/repo', { ghImpl, readFileImpl: files });
  expect(state.pendingHaPrs[0]).toMatchObject({ number: 30, actionsText: '## #81 Pending', headSha: 'a'.repeat(40) });
  expect(state.reportedHeld).toEqual([{ issue: 7, ha: 80 }]);
});
