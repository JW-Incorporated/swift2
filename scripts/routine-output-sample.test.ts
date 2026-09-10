import { describe, expect, it } from 'vitest';
import { extractPromptFile, resolveIdentifier, computeMetrics, buildReport } from './routine-output-sample.mjs';

describe('extractPromptFile', () => {
  it('extracts the prompt_file value from a workflow', () => {
    const text = `name: routine-austin-build\njobs:\n  run:\n    with:\n      prompt_file: docs/agents/runner-prompts/austin-run.md\n`;
    expect(extractPromptFile(text)).toBe('docs/agents/runner-prompts/austin-run.md');
  });

  it('ignores mentions of prompt_file inside comments, only matching the real field', () => {
    const text = `# session per docs/agents/runner-prompts/kevin-desk.md\nname: routine-kevin-daily-desk\n      prompt_file: docs/agents/runner-prompts/kevin-desk.md\n`;
    expect(extractPromptFile(text)).toBe('docs/agents/runner-prompts/kevin-desk.md');
  });

  it('returns null when no prompt_file field is present', () => {
    expect(extractPromptFile('name: routine-template\n')).toBeNull();
  });
});

describe('resolveIdentifier', () => {
  it('extracts an indented Tier-2 trailer line', () => {
    const text = 'PR body template:\n    Tier-2: Vault Run\n';
    expect(resolveIdentifier(text)).toBe('Vault Run');
  });

  it('extracts an inline backtick-quoted Tier-2 line', () => {
    const text = 'ATTRIBUTION (T-20 Phase 1): include the exact line `Tier-2: Answerer` in the body of every PR.';
    expect(resolveIdentifier(text)).toBe('Answerer');
  });

  it('returns null when no Tier-2 line is present', () => {
    expect(resolveIdentifier('You are Kevin, this company\'s automated ticket handler.')).toBeNull();
  });
});

describe('computeMetrics', () => {
  const now = new Date('2026-09-10T00:00:00.000Z');

  it('counts opened/merged/closed-unmerged PRs and filed/closed issues within the 7-day window', () => {
    const prs = [
      { number: 1, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-09T00:00:00.000Z' },
      { number: 2, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-09T00:00:00.000Z' },
      { number: 3, state: 'OPEN', createdAt: '2026-09-09T12:00:00.000Z', closedAt: null },
      // outside the 7-day window
      { number: 4, state: 'MERGED', createdAt: '2026-08-01T00:00:00.000Z', closedAt: '2026-08-02T00:00:00.000Z' },
    ];
    const issues = [
      { number: 10, state: 'OPEN', createdAt: '2026-09-09T00:00:00.000Z' },
      { number: 11, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z' },
      { number: 12, state: 'OPEN', createdAt: '2026-07-01T00:00:00.000Z' },
    ];
    const m = computeMetrics({ prs, issues }, now);
    expect(m.prsOpened).toBe(3);
    expect(m.prsMerged).toBe(1);
    expect(m.prsClosedUnmerged).toBe(1);
    expect(m.issuesFiled).toBe(2);
    expect(m.issuesClosed).toBe(1);
  });

  it('computes the closed-unmerged rate and flags it above the 40% threshold', () => {
    const prs = [
      { number: 1, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
      { number: 2, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
      { number: 3, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
    ];
    const m = computeMetrics({ prs, issues: [] }, now);
    expect(m.closedUnmergedRate).toBeCloseTo(2 / 3);
    expect(m.highRejectRate).toBe(true);
  });

  it('does not flag a closed-unmerged rate at or below the 40% threshold', () => {
    const prs = [
      { number: 1, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
      { number: 2, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
      { number: 3, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
      { number: 4, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
      { number: 5, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
    ];
    const m = computeMetrics({ prs, issues: [] }, now);
    expect(m.closedUnmergedRate).toBeCloseTo(0.2);
    expect(m.highRejectRate).toBe(false);
  });

  it('flags an open PR older than 72h as stale, but not a fresh one', () => {
    const prs = [
      // created 4 days ago, still open -> stale
      { number: 1, state: 'OPEN', createdAt: '2026-09-06T00:00:00.000Z', closedAt: null },
      // created 1 hour ago, still open -> not stale
      { number: 2, state: 'OPEN', createdAt: '2026-09-09T23:00:00.000Z', closedAt: null },
    ];
    const m = computeMetrics({ prs, issues: [] }, now);
    expect(m.prsStale72h).toBe(1);
  });

  it('flags zero output when there are no PRs and no issues in the window', () => {
    const m = computeMetrics({ prs: [], issues: [] }, now);
    expect(m.zeroOutput).toBe(true);
    expect(m.prsOpened).toBe(0);
    expect(m.issuesFiled).toBe(0);
  });

  it('does not flag zero output when only issues (no PRs) were filed', () => {
    const issues = [{ number: 1, state: 'OPEN', createdAt: '2026-09-09T00:00:00.000Z' }];
    const m = computeMetrics({ prs: [], issues }, now);
    expect(m.zeroOutput).toBe(false);
  });
});

describe('buildReport', () => {
  const now = new Date('2026-09-10T00:00:00.000Z');

  it('renders one table row per routine and a flagged section for zero-output routines', () => {
    const zeroMetrics = computeMetrics({ prs: [], issues: [] }, now);
    const report = buildReport({
      date: '2026-09-10',
      repo: 'JW-Incorporated/swift2',
      routines: [{ name: 'routine-nils-walk', identifier: 'Nils — site walk', metrics: zeroMetrics }],
    });
    expect(report).toContain('# Routine output sampling — 2026-09-10');
    expect(report).toContain('| routine-nils-walk | 0 | 0 | 0 (0%) | 0 | 0 | 0 |');
    expect(report).toContain('zero PRs and zero issues');
  });

  it('flags a routine above the closed-unmerged threshold', () => {
    const highReject = computeMetrics(
      {
        prs: [
          { number: 1, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
          { number: 2, state: 'CLOSED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' },
        ],
        issues: [],
      },
      now,
    );
    const report = buildReport({
      date: '2026-09-10',
      repo: 'JW-Incorporated/swift2',
      routines: [{ name: 'routine-austin-build', identifier: 'Austin — build runs', metrics: highReject }],
    });
    expect(report).toContain('closed-unmerged rate 100%');
  });

  it('flags a routine with no Tier-2 identifier instead of guessing', () => {
    const report = buildReport({
      date: '2026-09-10',
      repo: 'JW-Incorporated/swift2',
      routines: [{ name: 'routine-kevin-daily-desk', identifier: null, metrics: null }],
    });
    expect(report).toContain('| routine-kevin-daily-desk | — | — | — | — | — | — |');
    expect(report).toContain('no `Tier-2:` attribution line found');
  });

  it('reports "Nothing flagged" when every routine is healthy', () => {
    const healthy = computeMetrics(
      {
        prs: [{ number: 1, state: 'MERGED', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-08T00:00:00.000Z' }],
        issues: [],
      },
      now,
    );
    const report = buildReport({
      date: '2026-09-10',
      repo: 'JW-Incorporated/swift2',
      routines: [{ name: 'routine-vault-run', identifier: 'Vault Run', metrics: healthy }],
    });
    expect(report).toContain('Nothing flagged this window.');
  });
});
