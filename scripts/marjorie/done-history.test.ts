import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseDoneTable, changeSinceAnchor, sinceLastBrief, countsFor } from './done-history.mjs';

const TABLE = (rows: string[]) => [
  '| # | Item | Status | Blocked on | Next action |',
  '|---|---|---|---|---|',
  ...rows,
].join('\n');

describe('parseDoneTable', () => {
  it('parses all four statuses and the blocked-on column', () => {
    const body = TABLE([
      '| 1 | Landing page rethink | ⬜ not started | nobody | Design spec |',
      '| 2 | Cards differentiated | 🟡 built, awaiting check | founder | Joey eyeballs it |',
      '| 3 | Clown bot | 🟡 build B in progress | agent | Land the PR |',
      '| 4 | Capitalization audit | 🟢 done | | n/a |',
    ]);
    const out = parseDoneTable(body);
    expect(out[1]).toEqual({ title: 'Landing page rethink', status: 'notstarted', blockedOn: 'nobody', nextAction: 'Design spec' });
    expect(out[2].status).toBe('yellow');
    expect(out[2].blockedOn).toBe('founder');
    expect(out[3].blockedOn).toBe('agent');
    expect(out[4].status).toBe('green');
    expect(out[4].blockedOn).toBeNull();
  });

  // 2026-09-05 audit: DoD item 4 records `agent (Marketplace) · nobody
  // (Community)` and the brief said "reason not recorded" every day.
  it('keeps a compound Blocked-on cell that names real parties', () => {
    const out = parseDoneTable(TABLE(['| 4 | Marketplace + Community | 🟡 moving | agent (Marketplace) · nobody (Community) | build |']));
    expect(out[4].blockedOn).toBe('agent (Marketplace) · nobody (Community)');
    expect(sinceLastBrief(4, out[4], {})).toContain('agent (Marketplace)');
  });

  it('skips the legend line and any row with an unrecognised status', () => {
    const body = TABLE([
      '| 1 | Real item | 🟡 moving | founder | do the thing |',
    ]) + '\nLegend: 🟢 done · 🟡 moving · ⬜ not started · 🔴 blocked, says on what.\n';
    const out = parseDoneTable(body);
    expect(Object.keys(out)).toEqual(['1']);
  });

  it('does not confuse an emoji inside prose for the status cell', () => {
    // status column (index 2) is unambiguous even though nextAction (index 4)
    // contains an emoji-adjacent arrow — same trap gate-history.mjs documents.
    const body = TABLE([
      '| 1 | Item | 🔴 blocked | founder | Remaining to 🟢: footer icons |',
    ]);
    expect(parseDoneTable(body)[1].status).toBe('red');
  });

  it('re-anchors columns from a header row carrying "Status"', () => {
    // Legacy 3-column shape (no Blocked-on) should not crash and should
    // simply record no blocked-on value.
    const body = [
      '| # | Item | Status | Next action |',
      '|---|---|---|---|',
      '| 1 | Item | ⬜ not started | do the thing |',
    ].join('\n');
    const out = parseDoneTable(body);
    expect(out[1].status).toBe('notstarted');
    expect(out[1].blockedOn).toBeNull();
  });
});

describe('countsFor', () => {
  it('buckets by status', () => {
    const items = {
      1: { status: 'green' }, 2: { status: 'yellow' },
      3: { status: 'notstarted' }, 4: { status: 'red' }, 5: { status: 'red' },
    };
    expect(countsFor(items)).toEqual({ green: 1, yellow: 1, notstarted: 1, red: 2 });
  });
});

describe('changeSinceAnchor + sinceLastBrief', () => {
  const series = [
    { iso: '2026-08-20T12:00:00Z', items: { 1: { title: 'X', status: 'yellow', blockedOn: 'founder', nextAction: 'old action' } } },
    { iso: '2026-08-21T12:00:00Z', items: { 1: { title: 'X', status: 'yellow', blockedOn: 'founder', nextAction: 'old action' } } },
  ];
  const anchorIso = '2026-08-21T12:00:00Z';

  it('red always states its blocked-on reason, even with no history', () => {
    const current = { 1: { title: 'X', status: 'red', blockedOn: 'nobody', nextAction: 'spec it' } };
    const delta = changeSinceAnchor([], current, anchorIso);
    expect(sinceLastBrief(1, current[1], delta)).toBe('blocked on nobody (unstaffed — needs someone to pick it up)');
  });

  it('red with no blocked-on value says the table is incomplete, never guesses', () => {
    const current = { 1: { title: 'X', status: 'red', blockedOn: null, nextAction: 'spec it' } };
    const delta = changeSinceAnchor([], current, anchorIso);
    expect(sinceLastBrief(1, current[1], delta)).toMatch(/reason not recorded/);
  });

  it('notstarted states unstaffed when blocked-on is nobody', () => {
    const current = { 1: { title: 'X', status: 'notstarted', blockedOn: 'nobody', nextAction: 'spec' } };
    const delta = changeSinceAnchor([], current, anchorIso);
    expect(sinceLastBrief(1, current[1], delta)).toMatch(/unstaffed/);
  });

  it('yellow with a status change since the anchor reports the flip', () => {
    const current = { 1: { title: 'X', status: 'green', blockedOn: null, nextAction: 'old action' } };
    const delta = changeSinceAnchor(series, current, anchorIso);
    // status went yellow (at anchor) -> green (now): green rows short-circuit
    // in sinceLastBrief itself, so assert on the raw delta instead.
    expect(delta[1].statusChanged).toBe(true);
    expect(delta[1].from).toBe('yellow');
  });

  it('yellow whose nextAction text changed since the anchor reports progress, not silence', () => {
    const current = { 1: { title: 'X', status: 'yellow', blockedOn: 'founder', nextAction: 'NEW action, PR #900' } };
    const delta = changeSinceAnchor(series, current, anchorIso);
    expect(sinceLastBrief(1, current[1], delta)).toMatch(/next-action ticket updated/);
  });

  it('yellow with genuinely zero movement states the blocked-on reason every time — never silent, never escalation-gated', () => {
    const current = { 1: { title: 'X', status: 'yellow', blockedOn: 'founder', nextAction: 'old action' } };
    const delta = changeSinceAnchor(series, current, anchorIso);
    expect(sinceLastBrief(1, current[1], delta)).toBe('no movement since yesterday — blocked on founder');
  });

  it('yellow with zero movement and no blocked-on value flags the table gap rather than staying silent', () => {
    const current = { 1: { title: 'X', status: 'yellow', blockedOn: null, nextAction: 'old action' } };
    const delta = changeSinceAnchor(series, current, anchorIso);
    expect(sinceLastBrief(1, current[1], delta)).toMatch(/reason not recorded/);
  });

  it('green rows get no delta line at all', () => {
    const current = { 1: { title: 'X', status: 'green', blockedOn: null, nextAction: 'n/a' } };
    expect(sinceLastBrief(1, current[1], {})).toBeNull();
  });

  it('an item absent from every pre-anchor snapshot is reported honestly, not guessed at -- but still states blocked-on, since that is static data, not history', () => {
    const current = { 9: { title: 'Brand new item', status: 'yellow', blockedOn: 'founder', nextAction: 'x' } };
    const delta = changeSinceAnchor(series, current, anchorIso);
    expect(delta[9].moved).toBeNull();
    const line = sinceLastBrief(9, current[9], delta);
    expect(line).toMatch(/no history yet/);
    expect(line).toContain('blocked on founder');
  });
});
