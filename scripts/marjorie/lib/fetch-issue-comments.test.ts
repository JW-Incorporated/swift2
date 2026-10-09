import { describe, expect, it } from 'vitest';
import { fetchIssueComments } from './fetch-issue-comments.mjs';

function fakeGh(lists: Record<string, Array<Record<string, unknown>>>, issues: Record<number, Record<string, unknown>>) {
  const calls: string[][] = [];
  const execImpl = (_cmd: string, args: string[]) => {
    calls.push(args);
    if (args[1] === 'list') return JSON.stringify(lists[args[args.indexOf('--label') + 1]]);
    return JSON.stringify(issues[Number(args[2])]);
  };
  return { execImpl, calls };
}
const base = { repo: 'o/r', sleepImpl: async () => {}, paceMs: 0 };

describe('fetchIssueComments', () => {
  it('reads every issue per-issue and returns one array, deduping across labels', async () => {
    const { execImpl, calls } = fakeGh(
      { a: [{ number: 1, stateReason: 'COMPLETED' }, { number: 2 }], b: [{ number: 2 }, { number: 3 }] },
      { 1: { body: 'x', comments: [{ id: 1 }] }, 2: { body: 'y', comments: [] }, 3: { body: 'z', comments: [] } },
    );
    const out = await fetchIssueComments({ ...base, labels: ['a', 'b'], execImpl });
    expect(out.map((i: { number: number }) => i.number)).toEqual([1, 2, 3]);
    expect(out[0]!.stateReason).toBe('COMPLETED');
    expect(out[1]!.stateReason).toBeNull();
    expect(calls.filter((c) => c[1] === 'view')).toHaveLength(3);
    expect(calls.every((c) => !c.join(' ').includes('comments') || c[1] === 'view')).toBe(true);
  });

  it('aborts when a list returns exactly the limit', () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ number: i + 1 }));
    const { execImpl } = fakeGh({ a: rows }, {});
    expect(() => fetchIssueComments({ ...base, labels: ['a'], limit: 3, execImpl })).toThrow(/exactly 3/);
  });

  it('requires a label', () => {
    expect(() => fetchIssueComments({ ...base, labels: [] })).toThrow(/label/);
  });
});
