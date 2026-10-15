import { beforeEach, describe, expect, it } from 'vitest';
import {
  extractPromptFile,
  resolveIdentifier,
  computeMetrics,
  buildReport,
  isRateLimitError,
  waitBeforeNextSearch,
  waitForSearchReset,
  retryBackoffMs,
  pacedSearch,
  resetSearchPacing,
  fetchForRoutine,
  SEARCH_MIN_INTERVAL_MS,
  SEARCH_MAX_BACKOFF_MS,
} from './routine-output-sample.mjs';

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

  it('matches lowercase gh search states the same as uppercase', () => {
    const prs = [
      { number: 1, state: 'merged', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-09T00:00:00.000Z' },
      { number: 2, state: 'closed', createdAt: '2026-09-08T00:00:00.000Z', closedAt: '2026-09-09T00:00:00.000Z' },
      { number: 3, state: 'open', createdAt: '2026-09-05T00:00:00.000Z' },
    ];
    const issues = [{ number: 9, state: 'closed', createdAt: '2026-09-08T00:00:00.000Z' }];
    const m = computeMetrics({ prs, issues }, now);
    expect(m.prsMerged).toBe(1);
    expect(m.prsClosedUnmerged).toBe(1);
    expect(m.prsStale72h).toBe(1);
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

// #5845: three consecutive scheduled runs died on the first
// `403 API rate limit exceeded` from the installation-wide 30/min Search
// window. Both halves of the fix are covered: the calls are spaced, and a
// rate-limited call waits the window out instead of taking the run down.
describe('Search API rate-limit handling (#5845)', () => {
  beforeEach(() => resetSearchPacing());

  const rateLimited = () =>
    Object.assign(new Error(
      'Command failed: gh search issues --repo JW-Incorporated/swift2 Tier-2: Nils — site walk\n' +
      'HTTP 403: API rate limit exceeded for installation.',
    ), { stderr: '' });

  describe('isRateLimitError', () => {
    it('recognises the 403 shape gh search actually reports', () => {
      expect(isRateLimitError(rateLimited())).toBe(true);
    });

    it('recognises it when the text arrives on stderr instead of the message', () => {
      expect(isRateLimitError(Object.assign(new Error('Command failed'), {
        stderr: 'HTTP 403: API rate limit exceeded for installation.',
      }))).toBe(true);
    });

    it('does not swallow unrelated failures', () => {
      expect(isRateLimitError(new Error('HTTP 404: Not Found'))).toBe(false);
      expect(isRateLimitError(new Error('spawn gh ENOENT'))).toBe(false);
    });
  });

  describe('waitBeforeNextSearch', () => {
    it('does not delay the first call', () => {
      expect(waitBeforeNextSearch(null, 1_000_000)).toBe(0);
    });

    it('waits out the remainder of the interval after a recent call', () => {
      expect(waitBeforeNextSearch(1_000_000, 1_001_000, 3_000)).toBe(2_000);
    });

    it('does not delay once the interval has already elapsed', () => {
      expect(waitBeforeNextSearch(1_000_000, 1_010_000, 3_000)).toBe(0);
    });

    it('never waits longer than one interval, even if the clock jumps backwards', () => {
      expect(waitBeforeNextSearch(2_000_000, 1_000_000, 3_000)).toBe(3_000);
    });
  });

  describe('waitForSearchReset', () => {
    it('waits until the window resets, plus a second of slack', () => {
      const now = 1_700_000_000_000;
      expect(waitForSearchReset({ resources: { search: { reset: now / 1000 + 40 } } }, now))
        .toBe(41_000);
    });

    it('caps a bogus far-future reset at the backoff ceiling', () => {
      expect(waitForSearchReset({ resources: { search: { reset: 9_999_999_999 } } }, 0))
        .toBe(SEARCH_MAX_BACKOFF_MS);
    });

    it('returns null when the payload does not report a search reset', () => {
      expect(waitForSearchReset({ resources: { core: { reset: 123 } } }, 0)).toBeNull();
      expect(waitForSearchReset(null, 0)).toBeNull();
    });
  });

  describe('pacedSearch', () => {
    it('spaces consecutive searches by the pacing interval', async () => {
      const slept: number[] = [];
      let clock = 1_000_000;
      const deps = {
        run: async () => ({ stdout: '[]' }),
        sleep: async (ms: number) => { slept.push(ms); clock += ms; },
        now: () => clock,
        quota: async () => ({ ok: false, data: null }),
      };
      await pacedSearch(['search', 'prs'], deps);
      await pacedSearch(['search', 'issues'], deps);
      expect(slept).toEqual([SEARCH_MIN_INTERVAL_MS]);
    });

    it('retries a rate-limited search, waiting for the window reset the quota reports', async () => {
      const slept: number[] = [];
      let clock = 1_700_000_000_000;
      let calls = 0;
      const out = await pacedSearch(['search', 'prs'], {
        run: async () => {
          calls += 1;
          if (calls === 1) throw rateLimited();
          return { stdout: '[{"number":1}]' };
        },
        sleep: async (ms: number) => { slept.push(ms); clock += ms; },
        now: () => clock,
        quota: async () => ({ ok: true, data: { resources: { search: { reset: clock / 1000 + 20 } } } }),
      });
      expect(calls).toBe(2);
      expect(out.stdout).toBe('[{"number":1}]');
      expect(slept).toEqual([21_000]);
    });

    it('falls back to a fixed backoff when the quota endpoint is unreadable', async () => {
      const slept: number[] = [];
      let calls = 0;
      await pacedSearch(['search', 'prs'], {
        run: async () => {
          calls += 1;
          if (calls === 1) throw rateLimited();
          return { stdout: '[]' };
        },
        sleep: async (ms: number) => { slept.push(ms); },
        now: () => 1_000_000,
        quota: async () => ({ ok: false, data: null, error: 'boom' }),
      });
      expect(slept).toEqual([retryBackoffMs(1)]);
    });

    it('gives up after the retry budget rather than looping forever', async () => {
      let calls = 0;
      await expect(pacedSearch(['search', 'prs'], {
        run: async () => { calls += 1; throw rateLimited(); },
        sleep: async () => {},
        now: () => 1_000_000,
        quota: async () => ({ ok: false, data: null }),
        retries: 2,
      })).rejects.toThrow(/rate limit exceeded/i);
      expect(calls).toBe(3);
    });

    it('never retries a failure that is not a rate limit', async () => {
      let calls = 0;
      await expect(pacedSearch(['search', 'prs'], {
        run: async () => { calls += 1; throw new Error('HTTP 422: Validation Failed'); },
        sleep: async () => {},
        now: () => 1_000_000,
        quota: async () => ({ ok: false, data: null }),
      })).rejects.toThrow(/422/);
      expect(calls).toBe(1);
    });
  });

  describe('fetchForRoutine', () => {
    it('issues its two searches one at a time, never concurrently', async () => {
      let inFlight = 0;
      let maxInFlight = 0;
      const seen: string[] = [];
      const data = await fetchForRoutine('Nils — site walk', {
        run: async (args: string[]) => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          seen.push(args[1]);
          await new Promise((r) => setTimeout(r, 1));
          inFlight -= 1;
          return { stdout: args[1] === 'prs' ? '[{"number":1,"state":"MERGED"}]' : '[{"number":2}]' };
        },
        sleep: async () => {},
        now: () => 1_000_000,
        quota: async () => ({ ok: false, data: null }),
      });
      expect(maxInFlight).toBe(1);
      expect(seen).toEqual(['prs', 'issues']);
      expect(data.prs).toEqual([{ number: 1, state: 'MERGED' }]);
      expect(data.issues).toEqual([{ number: 2 }]);
    });
  });
});
