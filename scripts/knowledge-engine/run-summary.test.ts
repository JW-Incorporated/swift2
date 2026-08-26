import { describe, expect, it, vi } from 'vitest';
import { buildSummaryLine, findOrCreateIssue, postRunSummary, ISSUE_TITLE, ISSUE_LABEL } from './run-summary.mjs';

const sampleCycleResult = {
  itemsIngested: 12,
  sourcesPolled: 7,
  errors: [],
  extract: {
    clustersConsidered: 4,
    extracted: 2,
    screenedOut: 1,
    skipped: 1,
    deferred: 0,
    theoriesUpserted: 0,
    abandonedTheories: 0,
    errors: [],
  },
};

describe('buildSummaryLine', () => {
  it('reports items in, clusters, extracted, screened out, deferred, per-adapter status', () => {
    const line = buildSummaryLine(sampleCycleResult, '2026-08-23T12:00:00.000Z');
    expect(line).toContain('items in: 12');
    expect(line).toContain('clusters: 4');
    expect(line).toContain('extracted: 2');
    expect(line).toContain('screened out: 1');
    expect(line).toContain('deferred (cap): 0');
    expect(line).toContain('sourcesPolled: 7');
    expect(line).toContain('errors: 0');
  });

  it('degrades gracefully when extract is missing', () => {
    const line = buildSummaryLine({ itemsIngested: 0, errors: [] });
    expect(line).toContain('clusters: 0');
  });
});

describe('findOrCreateIssue', () => {
  it('returns the existing issue number when one is already open', async () => {
    const runGh = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([{ number: 42, title: ISSUE_TITLE }]),
    });
    const number = await findOrCreateIssue(runGh);
    expect(number).toBe(42);
    expect(runGh).toHaveBeenCalledTimes(1);
    expect(runGh.mock.calls[0][0]).toEqual(
      expect.arrayContaining(['issue', 'list', '--label', ISSUE_LABEL]),
    );
  });

  it('creates a new issue when none exists', async () => {
    const runGh = vi
      .fn()
      .mockResolvedValueOnce({ stdout: '[]' })
      .mockResolvedValueOnce({ stdout: 'https://github.com/JW-Incorporated/swift2/issues/99' });
    const number = await findOrCreateIssue(runGh);
    expect(number).toBe(99);
    expect(runGh).toHaveBeenCalledTimes(2);
  });

  it('ignores a same-labeled issue with a different title', async () => {
    const runGh = vi
      .fn()
      .mockResolvedValueOnce({ stdout: JSON.stringify([{ number: 1, title: 'something else' }]) })
      .mockResolvedValueOnce({ stdout: 'https://github.com/JW-Incorporated/swift2/issues/100' });
    const number = await findOrCreateIssue(runGh);
    expect(number).toBe(100);
  });
});

describe('postRunSummary', () => {
  it('finds/creates the issue then comments the one-line summary', async () => {
    const runGh = vi
      .fn()
      .mockResolvedValueOnce({ stdout: JSON.stringify([{ number: 42, title: ISSUE_TITLE }]) })
      .mockResolvedValueOnce({ stdout: '' });
    const { number, line } = await postRunSummary(sampleCycleResult, runGh);
    expect(number).toBe(42);
    expect(line).toContain('clusters: 4');
    expect(runGh.mock.calls[1][0]).toEqual(['issue', 'comment', '42', '--body', line]);
  });
});
