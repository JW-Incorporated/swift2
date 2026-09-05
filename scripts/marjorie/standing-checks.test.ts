import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { checkRunners, checkPRs, checkCI, checkUnassigned, checkTrackerFresh, runStandingChecks, loadRunnerCadence } from './standing-checks.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { summarizeActionsUsage, gradeActionsUsage, summarizeRunVolume, summarizeThroughput, multiplierFor, attributeRunMinutes } from './meta-constraints.mjs';

const NOW = new Date('2026-08-11T19:00:00Z').getTime();
const HOUR = 3_600_000;
const DAY = 86_400_000;
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const cadence = { runners: [{ name: 'Vault Run', perDay: 1, maxAgeHours: 30, match: { kind: 'pr-branch', value: 'vault/' } }] };

describe('checkRunners', () => {
  it('counts MERGED PRs as liveness, not just open ones', () => {
    // Vault Run's PR auto-merges within the hour. Checking only open PRs
    // marked it, Content Shift and Growth dark on a day all three shipped.
    const allPRs = [{ number: 1892, headRefName: 'vault/2026-08-11', createdAt: ago(4 * HOUR), state: 'MERGED' }];
    expect(checkRunners({ allPRs, issues: [], cadence, now: NOW }).status).toBe('ok');
  });

  it('calls a runner dark past its tolerance window', () => {
    const allPRs = [{ number: 1, headRefName: 'vault/2026-08-01', createdAt: ago(10 * DAY), state: 'MERGED' }];
    const r = checkRunners({ allPRs, issues: [], cadence, now: NOW });
    expect(r.status).toBe('fail');
    expect(r.detail).toContain('Vault Run');
  });

  it('reports unobservable runners without failing the check every single day', () => {
    const c = { runners: [{ name: 'Answerer', checkable: false, why: 'no branch prefix' }] };
    const r = checkRunners({ allPRs: [], issues: [], cadence: c, now: NOW });
    expect(r.status).toBe('ok');
    expect(r.detail).toContain('no observable artifact');
    expect(r.blind).toEqual(['Answerer']);
  });

  it('ships a cadence file that parses and covers the registered runners', () => {
    const loaded = loadRunnerCadence();
    expect(loaded.runners.length).toBeGreaterThan(10);
    for (const r of loaded.runners) {
      if (r.checkable === false) expect(r.why).toBeTruthy();
      else expect(['pr-branch', 'pr-title', 'issue-label', 'issue-title']).toContain(r.match.kind);
    }
  });

  // #3689: gh.mjs's own page cap on allPRs/allIssues silently truncated the
  // window this check reads, and a runner with no visible artifact in a
  // truncated window read as a confident DARK — the false "10 dark runners"
  // flag the incident named for Vault Run, Content Shift and Growth on days
  // they had actually shipped.
  it('reports unknown, not dark, for a silent runner when the source lists were capped', () => {
    const r = checkRunners({ allPRs: [], issues: [], cadence, now: NOW, listsCapExhausted: true });
    expect(r.rows[0].status).toBe('unknown');
    expect(r.rows[0].detail).toContain('truncated');
  });

  it('still reports dark when the runner is silent and the lists are complete', () => {
    const r = checkRunners({ allPRs: [], issues: [], cadence, now: NOW, listsCapExhausted: false });
    expect(r.status).toBe('fail');
    expect(r.rows[0].status).toBe('fail');
  });
});

describe('checkPRs', () => {
  const green = [{ conclusion: 'SUCCESS' }];
  const red = [{ conclusion: 'FAILURE' }];

  it('separates merge latency from a red build from plain staleness', () => {
    const openPRs = [
      { number: 1, isDraft: false, createdAt: ago(3 * DAY), updatedAt: ago(HOUR), statusCheckRollup: green },
      { number: 2, isDraft: false, createdAt: ago(3 * DAY), updatedAt: ago(HOUR), statusCheckRollup: red },
      { number: 3, isDraft: false, createdAt: ago(20 * DAY), updatedAt: ago(9 * DAY), statusCheckRollup: green },
    ];
    const r = checkPRs({ openPRs, now: NOW });
    expect(r.status).toBe('fail');
    expect(r.waiting).toContain(1);
    expect(r.red).toContain(2);
    expect(r.stale).toContain(3);
  });

  it('ignores drafts and fresh PRs', () => {
    const openPRs = [
      { number: 1, isDraft: true, createdAt: ago(9 * DAY), updatedAt: ago(9 * DAY), statusCheckRollup: green },
      { number: 2, isDraft: false, createdAt: ago(HOUR), updatedAt: ago(HOUR), statusCheckRollup: green },
    ];
    expect(checkPRs({ openPRs, now: NOW }).status).toBe('ok');
  });
});

describe('checkCI', () => {
  it('fails loudly when main is red — the 2026-07-30 merge-freeze condition', () => {
    const runs = [{ status: 'completed', conclusion: 'failure', created_at: ago(HOUR), html_url: 'u' }];
    const r = checkCI({ runs, now: NOW });
    expect(r.status).toBe('fail');
    expect(r.detail).toContain('Every merge is frozen');
  });

  it('is unknown, never ok, when no run data was fetched', () => {
    expect(checkCI({ runs: [], now: NOW }).status).toBe('unknown');
  });
});

describe('checkUnassigned', () => {
  it('flags launch-gate tickets with no owner and stale intake', () => {
    const issues = [
      { number: 800, state: 'open', labels: [{ name: 'launch-gate' }], assignees: [], createdAt: ago(20 * DAY) },
      { number: 900, state: 'open', labels: [{ name: 'intake' }], assignees: [], createdAt: ago(5 * DAY) },
      { number: 901, state: 'open', labels: [{ name: 'launch-gate' }], assignees: [{ login: 'a' }], createdAt: ago(DAY) },
    ];
    const r = checkUnassigned({ issues, gateTickets: [], now: NOW });
    expect(r.gateOrphans).toEqual([800]);
    expect(r.staleIntake).toEqual([900]);
  });
});

describe('checkTrackerFresh', () => {
  it('is red when a gate row is contradicted by live tickets, even if the file is recent', () => {
    // The file was edited 5 days ago; LEGAL and BACKUPS rows were 30 days old
    // and both had PRs open. "Recently edited" is not "current".
    const r = checkTrackerFresh({ lag: { trackerAgeDays: 5 }, staleRows: [{ gate: 'LEGAL' }, { gate: 'BACKUPS' }] });
    expect(r.status).toBe('fail');
    expect(r.detail).toContain('LEGAL');
  });
  it('is green when the file is fresh and no row is contradicted', () => {
    expect(checkTrackerFresh({ lag: { trackerAgeDays: 2 }, staleRows: [] }).status).toBe('ok');
  });
});

describe('runStandingChecks', () => {
  const base = {
    allPRs: [], openPRs: [], issues: [], alerts: [], gateTickets: [],
    runs: [{ status: 'completed', conclusion: 'success', created_at: ago(HOUR) }],
    cadence: { runners: [] },
    queueStatus: { total: 3, scheduled: 3, due: 0, awaitingApproval: 0 },
    growth: { postsToday: 1 },
    lag: { trackerAgeDays: 1 }, staleRows: [],
    constraints: { level: 'ok', grades: { actions: { level: 'ok', message: 'fine' } } },
    now: NOW,
  };

  it('says stop reading when everything passes', () => {
    const r = runStandingChecks(base);
    expect(r.green).toBe(true);
    expect(r.punchline).toContain('stop reading');
  });

  it('is NOT green when a check could not run — "I did not look" is not "fine"', () => {
    const r = runStandingChecks({ ...base, runs: [] });
    expect(r.green).toBe(false);
    expect(r.punchline).toContain('could not run');
  });

  it('names failures as nouns, not as the inverted health labels', () => {
    const r = runStandingChecks({ ...base, alerts: [{ number: 9, title: 'prod smoke check failing', state: 'open' }] });
    expect(r.punchline).toContain('open alerts');
    expect(r.punchline).not.toContain('No open watchdog');
  });
});

describe('meta-constraints', () => {
  it('applies GitHub multipliers — a macOS minute costs ten included minutes', () => {
    expect(multiplierFor('Actions macOS 3-core')).toBe(10);
    expect(multiplierFor('Actions Linux')).toBe(1);
    expect(multiplierFor('Actions Windows 2-core')).toBe(2);
  });

  it('measures billable minutes against the allowance, not raw minutes', () => {
    // Real July shape: 3425 Linux + 102 macOS = 4445 billable, not 3527.
    const items = [
      { product: 'actions', sku: 'Actions Linux', unitType: 'Minutes', quantity: 3425, netAmount: 0, date: '2026-07-01T00:00:00Z', repositoryName: 'swift2' },
      { product: 'actions', sku: 'Actions macOS 3-core', unitType: 'Minutes', quantity: 102, netAmount: 0, date: '2026-07-01T00:00:00Z', repositoryName: 'foray' },
      { product: 'actions', sku: 'Actions storage', unitType: 'GigabyteHours', quantity: 212, netAmount: 0, date: '2026-07-01T00:00:00Z', repositoryName: 'swift2' },
    ];
    const u = summarizeActionsUsage(items, { includedMinutes: 3000, now: Date.UTC(2026, 6, 31), monthStart: Date.UTC(2026, 6, 1) });
    expect(u.rawMinutes).toBe(3527);
    expect(u.billableMinutes).toBe(4445);
    expect(u.pctUsed).toBeGreaterThan(140);
    expect(u.byRepo[0].repo).toBe('swift2');
  });

  it('says the two signals disagree rather than picking the comfortable one', () => {
    const over = { pctUsed: 148, pctProjected: 148, includedMinutes: 3000, netAmountUsd: 0, daysToExhaustion: -5 };
    const g = gradeActionsUsage(over);
    expect(g.level).toBe('warn'); // not 'alarm': GitHub has charged nothing
    expect(g.message).toContain('contradicts');

    const billed = gradeActionsUsage({ ...over, netAmountUsd: 12.5 });
    expect(billed.level).toBe('alarm');
  });

  it('grades a comfortable month as ok', () => {
    expect(gradeActionsUsage({ pctUsed: 20, pctProjected: 55, includedMinutes: 3000, netAmountUsd: 0, daysToExhaustion: 40 }).level).toBe('ok');
  });

  it('catches a runner running while its registry entry says disabled', () => {
    // The 2026-07-25 drift: `Lex depth` documented disabled, running 12x/day.
    const artifacts = Array.from({ length: 84 }, (_, i) => ({ type: 'pr', at: ago(i * HOUR * 2), branch: 'lex/x' }));
    const rows = summarizeRunVolume(artifacts, [{ name: 'Lex', perDay: 0, match: (a: { branch: string }) => a.branch.startsWith('lex/') }], { now: NOW });
    expect(rows[0].verdict).toBe('running-while-disabled');
  });

  it('catches a duplicated fleet running at twice its intended cadence', () => {
    const artifacts = Array.from({ length: 56 }, (_, i) => ({ type: 'pr', at: ago(i * HOUR * 3), branch: 'kevin/x' }));
    const rows = summarizeRunVolume(artifacts, [{ name: 'Kevin', perDay: 4, match: (a: { branch: string }) => a.branch.startsWith('kevin/') }], { now: NOW });
    expect(rows[0].verdict).toBe('over-cadence');
  });

  it('flags a growing PR pile, which is the merge-latency condition', () => {
    const prs = [
      ...Array.from({ length: 10 }, (_, i) => ({ number: i, state: 'open', createdAt: ago(2 * DAY) })),
      { number: 99, state: 'merged', createdAt: ago(3 * DAY), mergedAt: ago(2 * DAY) },
    ];
    const t = summarizeThroughput({ prs, issues: [] }, { now: NOW });
    expect(t.prCloseRatio).toBeLessThan(0.8);
  });

  it('ranks workflows by approximate wall clock without claiming a minute total', () => {
    const runs = [
      { name: 'CI', run_started_at: ago(2 * HOUR), updated_at: ago(HOUR) },
      { name: 'CodeQL', run_started_at: ago(2 * HOUR), updated_at: ago(2 * HOUR - 60_000) },
    ];
    const ranked = attributeRunMinutes(runs);
    expect(ranked[0].workflow).toBe('CI');
    expect(ranked[0].approxMinutes).toBe(60);
  });
});
