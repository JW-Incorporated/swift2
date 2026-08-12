import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseGateTable, pointsFor, countsFor, lastChangeByGate, GATES } from './gate-history.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { estimateDaysToDone, velocityOverWindow, weekBand, renderDoneLines, stalledGates } from './done-estimator.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { extractTickets, ticketsReferencedByPr, buildGateActivity, classifyStall } from './gate-activity.mjs';

const NOW = new Date('2026-08-11T19:00:00Z').getTime();
const DAY = 86_400_000;

// A minimal table in the real file's shape: | gate | description | status | next |
function table(statuses: Record<string, string>, next: Record<string, string> = {}) {
  const rows = GATES.map((g: string) => `| ${g} | some description | ${statuses[g] ?? '🔴'} moving | ${next[g] ?? 'do a thing · Desk'} |`);
  return [
    '## What each gate means',
    '| Gate | was | Plain meaning |',
    '|---|---|---|',
    ...GATES.map((g: string) => `| ${g} | G-A | means a thing |`),
    '',
    '| # | Gate | Status | Next action · owner |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

function snap(iso: string, statuses: Record<string, string>) {
  const gates = parseGateTable(table(statuses));
  return { sha: iso, iso, date: iso.slice(0, 10), gates, points: pointsFor(gates), counts: countsFor(gates) };
}

const ALL_RED = Object.fromEntries(GATES.map((g: string) => [g, '🔴']));

describe('parseGateTable', () => {
  it('reads the status column, not the first emoji in the row', () => {
    // The real CAMPAIGN row's DESCRIPTION contains "Remaining to 🟢: footer
    // icons" while its status is 🟡. Searching the row for an emoji scores it
    // as done — the bug this test exists to prevent.
    const md = [
      '| # | Gate | Status | Next |',
      '|---|---|---|---|',
      '| CAMPAIGN | delivered; remaining to 🟢: footer icons | 🟡 moving | ship the cards · Growth |',
    ].join('\n');
    expect(parseGateTable(md).CAMPAIGN.status).toBe('yellow');
  });

  it('ignores the 3-column plain-meaning table that shares the gate names', () => {
    const parsed = parseGateTable(table({ ...ALL_RED, VOICE: '🟢' }));
    expect(Object.keys(parsed)).toHaveLength(12);
    expect(parsed.VOICE.status).toBe('green');
  });

  it('translates the pre-2026-07-15 letter codes onto canonical names', () => {
    const md = ['| # | Gate | Status | Next |', '|---|---|---|---|', '| G-D | songs | 🟢 done | none |'].join('\n');
    expect(parseGateTable(md).SONGS.status).toBe('green');
  });

  it('reads the #1928 re-scored layout, where Status moved to column 2', () => {
    // #1928 (merged 2026-08-12, while this PR was in flight) rebuilt the
    // status table as | Gate | Status | Blocked on | What is left | Next-action
    // issues |. A parser pinned to the legacy column indexes reads the
    // "Blocked on" cell ("nobody"/"founder") as the status and silently drops
    // every gate. The header row is the anchor, not a fixed index.
    const md = [
      '| Gate | Status | Blocked on | What is actually left | Next-action issues |',
      '|---|---|---|---|---|',
      '| DEPTH | 🟡 | nobody | rows-per-month audit never run | #1719, #47 |',
      '| SCAN | 🔴 | founder | criterion unsatisfiable since the throttle | — |',
      '| SONGS | 🟢 | nobody | Nothing — founder-verified | — |',
    ].join('\n');
    const parsed = parseGateTable(md);
    expect(parsed.DEPTH.status).toBe('yellow');
    expect(parsed.SCAN.status).toBe('red');
    expect(parsed.SONGS.status).toBe('green');
    // "Blocked on" is excluded; the ticket references survive into nextAction.
    expect(parsed.DEPTH.nextAction).not.toContain('nobody');
    expect(extractTickets(parsed.DEPTH.nextAction)).toEqual([1719, 47]);
  });
});

describe('pointsFor', () => {
  it('gives partial credit so the series has more than three data points', () => {
    expect(pointsFor(parseGateTable(table(ALL_RED)))).toBe(0);
    expect(pointsFor(parseGateTable(table(Object.fromEntries(GATES.map((g: string) => [g, '🟢'])))))).toBe(12);
    expect(pointsFor(parseGateTable(table({ ...ALL_RED, VOICE: '🟢', SONGS: '🟡' })))).toBe(1.5);
  });
});

describe('velocityOverWindow', () => {
  const series = [
    snap('2026-07-14T00:00:00Z', { ...ALL_RED }),
    snap('2026-07-28T00:00:00Z', { ...ALL_RED, VOICE: '🟢', SONGS: '🟢' }),
    snap('2026-08-11T00:00:00Z', { ...ALL_RED, VOICE: '🟢', SONGS: '🟢', MOBILE: '🟢', DEPTH: '🟡' }),
  ];

  it('measures gate-points per day over the trailing window', () => {
    const v = velocityOverWindow(series, 14, NOW);
    expect(v.deltaPoints).toBe(1.5); // MOBILE green + DEPTH yellow
    expect(v.ratePerDay).toBeCloseTo(1.5 / 14, 3);
  });

  it('clamps a window that predates the series instead of counting pre-history as zero progress', () => {
    const v = velocityOverWindow(series, 365, NOW);
    expect(v.clamped).toBe(true);
    // 3.5 points over ~28.8 observed days, not over 365.
    expect(v.spanDays).toBeLessThan(30);
    expect(v.ratePerDay).toBeGreaterThan(0.1);
  });
});

describe('weekBand', () => {
  it('rounds to weeks so a low-confidence number never reads as precise', () => {
    expect(weekBand(20, 50)).toBe('2–8 weeks');
    expect(weekBand(8, 9)).toBe('1–2 weeks'); // 9 days really does reach week 2
    expect(weekBand(7, 7)).toBe('1 week');
    expect(weekBand(null, 9)).toBeNull();
  });
});

describe('gate activity', () => {
  it('takes only tickets a PR CLAIMS, never every number in its prose', () => {
    // PR #1910 is a docs PR citing a dozen tickets as examples; a whole-body
    // scan attached it to three unrelated gates.
    const pr = { number: 1910, title: 'autonomy: work ownership as state', body: 'see #800 and #680 and #669 for context' };
    expect(ticketsReferencedByPr(pr)).toEqual([]);
    expect(ticketsReferencedByPr({ number: 1, title: 'legal drafts', body: 'Closes #800' })).toEqual([800]);
    expect(ticketsReferencedByPr({ number: 2, title: 'fix the thing (#680)', body: '' })).toEqual([680]);
  });

  it('extracts the tickets a gate row names', () => {
    expect(extractTickets('Eng re-anchors the E2E suite (#669) · Build desk')).toEqual([669]);
    expect(extractTickets('no tickets here')).toEqual([]);
  });

  it('calls a frozen row with a live PR a STALE TRACKER, not a stalled gate', () => {
    // The exact 2026-08-11 case: LEGAL red since 07-11, PR #1889 open today.
    const gates = parseGateTable(table({ ...ALL_RED }, { LEGAL: 'Draft privacy + ToS (#800) · founders' }));
    const activity = buildGateActivity(gates, {
      issues: [{ number: 800, state: 'open', updatedAt: '2026-07-26T12:13:00Z' }],
      prs: [{ number: 1889, title: 'legal: counsel-ready drafts', body: 'Closes #800', createdAt: '2026-08-11T02:00:00Z', updatedAt: '2026-08-11T02:00:00Z' }],
    });
    expect(classifyStall('LEGAL', activity, NOW, 21).kind).toBe('tracker-stale');
  });

  it('calls a frozen row with nothing behind it IDLE', () => {
    const gates = parseGateTable(table({ ...ALL_RED }, { BACKUPS: 'work #680 · Build desk' }));
    const activity = buildGateActivity(gates, {
      issues: [{ number: 680, state: 'open', updatedAt: '2026-06-01T00:00:00Z' }],
      prs: [],
    });
    expect(classifyStall('BACKUPS', activity, NOW, 21).kind).toBe('idle');
  });
});

describe('estimateDaysToDone', () => {
  const steady = Array.from({ length: 10 }, (_, i) => {
    const on = GATES.slice(0, i);
    return snap(new Date(NOW - (10 - i) * 5 * DAY).toISOString(), {
      ...ALL_RED, ...Object.fromEntries(on.map((g: string) => [g, '🟢'])),
    });
  });

  it('excludes idle gates from the trajectory instead of averaging them in', () => {
    const gates = parseGateTable(table(
      { ...ALL_RED, VOICE: '🟢', SONGS: '🟢', MOBILE: '🟢', CAMPAIGN: '🟢', DEPTH: '🟡', WORTHY: '🟡', SCAN: '🟡', ERRORS: '🟡', ALARMS: '🟡', PLUMBING: '🟡' },
      { LEGAL: 'draft it (#800)', BACKUPS: 'test a restore (#680)' },
    ));
    const series = [snap('2026-07-11T00:00:00Z', ALL_RED), snap('2026-08-06T00:00:00Z', {
      ...ALL_RED, VOICE: '🟢', SONGS: '🟢', MOBILE: '🟢', CAMPAIGN: '🟢', DEPTH: '🟡', WORTHY: '🟡', SCAN: '🟡', ERRORS: '🟡', ALARMS: '🟡', PLUMBING: '🟡',
    })];
    const activity = buildGateActivity(gates, {
      issues: [{ number: 800, state: 'open', updatedAt: '2026-06-01T00:00:00Z' }, { number: 680, state: 'open', updatedAt: '2026-06-01T00:00:00Z' }],
      prs: [],
    });
    const est = estimateDaysToDone(series, gates, { now: NOW, activity });
    expect(est.remainingPoints).toBe(5);
    expect(est.idle.map((g: { gate: string }) => g.gate).sort()).toEqual(['BACKUPS', 'LEGAL']);
    expect(est.idlePoints).toBe(2);
    expect(est.movingRemainingPoints).toBe(3);
  });

  it('caps confidence at low whenever anything is idle', () => {
    const gates = parseGateTable(table({ ...ALL_RED, ...Object.fromEntries(GATES.slice(0, 9).map((g: string) => [g, '🟢'])) }));
    const est = estimateDaysToDone(steady, gates, { now: NOW, activity: buildGateActivity(gates, {}) });
    expect(['low', 'none']).toContain(est.confidence);
  });

  it('refuses to give any estimate when most of what remains is idle', () => {
    const gates = parseGateTable(table({ ...ALL_RED, ...Object.fromEntries(GATES.slice(0, 10).map((g: string) => [g, '🟢'])) }));
    const est = estimateDaysToDone(steady, gates, { now: NOW, activity: buildGateActivity(gates, {}) });
    expect(est.idleDominates).toBe(true);
    expect(renderDoneLines(est).join('\n')).toContain('not on a trajectory');
  });

  it('says so plainly rather than dividing by zero when nothing has moved', () => {
    const flat = [snap('2026-06-01T00:00:00Z', ALL_RED), snap('2026-07-01T00:00:00Z', ALL_RED)];
    const gates = parseGateTable(table(ALL_RED));
    const est = estimateDaysToDone(flat, gates, { now: NOW, activity: buildGateActivity(gates, {}) });
    expect(est.confidence).toBe('none');
    expect(renderDoneLines(est).join('\n')).toContain('no defensible estimate');
  });

  it('never emits a point estimate at low confidence — only a week band', () => {
    const gates = parseGateTable(table({ ...ALL_RED, ...Object.fromEntries(GATES.slice(0, 11).map((g: string) => [g, '🟢'])) }));
    const est = estimateDaysToDone(steady, gates, { now: NOW, activity: buildGateActivity(gates, {}) });
    if (est.confidence === 'low' && !est.idleDominates) {
      expect(renderDoneLines(est).join('\n')).not.toMatch(/~\d+ days/);
    }
  });
});

describe('stalledGates + lastChangeByGate', () => {
  it('dates each gate from the snapshot where its status actually changed', () => {
    const series = [
      snap('2026-07-01T00:00:00Z', ALL_RED),
      snap('2026-07-20T00:00:00Z', { ...ALL_RED, VOICE: '🟡' }),
      snap('2026-08-10T00:00:00Z', { ...ALL_RED, VOICE: '🟡' }),
    ];
    expect(lastChangeByGate(series).VOICE.iso).toBe('2026-07-20T00:00:00Z');
    const gates = parseGateTable(table({ ...ALL_RED, VOICE: '🟡' }));
    expect(stalledGates(series, gates, NOW, 21).some((g: { gate: string }) => g.gate === 'VOICE')).toBe(true);
  });
});
