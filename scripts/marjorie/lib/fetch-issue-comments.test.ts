import { describe, expect, it } from 'vitest';
import { fetchIssueComments } from './fetch-issue-comments.mjs';

type Row = { number: number; state_reason?: string | null; pull_request?: object };

const rowsOf = (from: number, count: number): Row[] => Array.from({ length: count }, (_, i) => ({ number: from + i }));

/** Fakes `gh api repos/o/r/issues?labels=<l>&page=<n>` (100 per page) and `gh issue view <n>`. */
function fakeGh(lists: Record<string, Row[]>, issues: Record<number, Record<string, unknown>> = {}) {
  const calls: string[][] = [];
  const execImpl = (_cmd: string, args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const q = new URLSearchParams(args[1]!.split('?')[1]);
      const page = Number(q.get('page'));
      const all = lists[q.get('labels')!] ?? [];
      return JSON.stringify(all.slice((page - 1) * 100, page * 100));
    }
    return JSON.stringify(issues[Number(args[2])] ?? { body: '', comments: [] });
  };
  return { execImpl, calls };
}
const base = { repo: 'o/r', sleepImpl: async () => {}, paceMs: 0, warn: () => {} };
const apiCalls = (calls: string[][]) => calls.filter((c) => c[0] === 'api');

describe('fetchIssueComments', () => {
  it('reads every issue per-issue and returns one array, deduping across labels', async () => {
    const { execImpl, calls } = fakeGh(
      { a: [{ number: 1, state_reason: 'completed' }, { number: 2 }], b: [{ number: 2 }, { number: 3, state_reason: 'not_planned' }] },
      { 1: { body: 'x', comments: [{ id: 1 }] }, 2: { body: 'y', comments: [] }, 3: { body: 'z', comments: [] } },
    );
    const out = await fetchIssueComments({ ...base, labels: ['a', 'b'], execImpl });
    expect(out.map((i: { number: number }) => i.number)).toEqual([1, 2, 3]);
    expect(out[0]!.stateReason).toBe('COMPLETED');
    expect(out[1]!.stateReason).toBeNull();
    expect(out[2]!.stateReason).toBe('NOT_PLANNED');
    expect(out[0]!.comments).toEqual([{ id: 1 }]);
    expect(calls.filter((c) => c[1] === 'view')).toHaveLength(3);
    expect(calls.every((c) => !c.join(' ').includes('comments') || c[1] === 'view')).toBe(true);
  });

  it('returns an empty array for a label with no issues', async () => {
    const { execImpl, calls } = fakeGh({ a: [] });
    expect(await fetchIssueComments({ ...base, labels: ['a'], execImpl })).toEqual([]);
    expect(apiCalls(calls)).toHaveLength(1);
  });

  it('stops after one page when the first page is short', async () => {
    const { execImpl, calls } = fakeGh({ a: rowsOf(1, 42) });
    const out = await fetchIssueComments({ ...base, labels: ['a'], state: 'closed', execImpl });
    expect(out).toHaveLength(42);
    expect(apiCalls(calls)).toHaveLength(1);
    expect(apiCalls(calls)[0]![1]).toContain('state=closed');
  });

  it('follows pages past 200 instead of aborting (#6944), dropping pull requests', async () => {
    const rows: Row[] = [...rowsOf(1, 211), { number: 999, pull_request: {} }];
    const { execImpl, calls } = fakeGh({ a: rows });
    const warns: string[] = [];
    const out = await fetchIssueComments({ ...base, labels: ['a'], execImpl, warn: (m: string) => warns.push(m) });
    expect(out).toHaveLength(211);
    expect(out.some((i: { number: number }) => i.number === 999)).toBe(false);
    expect(apiCalls(calls).map((c) => new URLSearchParams(c[1]!.split('?')[1]).get('page'))).toEqual(['1', '2', '3']);
    expect(warns).toEqual([]);
  });

  it('past the bound keeps the newest maxPerLabel and logs a truncation notice instead of throwing', async () => {
    const { execImpl } = fakeGh({ a: rowsOf(1, 250) });
    const warns: string[] = [];
    const out = await fetchIssueComments({ ...base, labels: ['a'], maxPerLabel: 150, execImpl, warn: (m: string) => warns.push(m) });
    expect(out).toHaveLength(150);
    expect(out[0]!.number).toBe(1);
    expect(out[149]!.number).toBe(150);
    expect(warns).toHaveLength(1);
    expect(warns[0]).toMatch(/label a has more than 150 .*newest 150/);
  });

  it('exactly the bound is not truncated', async () => {
    const { execImpl } = fakeGh({ a: rowsOf(1, 200) });
    const warns: string[] = [];
    const out = await fetchIssueComments({ ...base, labels: ['a'], maxPerLabel: 200, execImpl, warn: (m: string) => warns.push(m) });
    expect(out).toHaveLength(200);
    expect(warns).toEqual([]);
  });

  it('requires a label', () => {
    expect(() => fetchIssueComments({ ...base, labels: [] })).toThrow(/label/);
  });
});
