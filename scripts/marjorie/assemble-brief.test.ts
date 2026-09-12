import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  buildBrief, extractField, extractOptions, findLatestTreePR, todayLA, shortTitle, ghCriticalList,
  capSection, renderHumanActionLine, renderMergedLine, renderAlertsLine, renderDispatchedLine,
  renderSiteLine, renderDistanceClosingLine,
} from './assemble-brief.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import * as ghMjs from '../lib/gh.mjs';

const NOW = new Date('2026-07-12T13:00:00Z').getTime();

// assemble-brief.mjs is plain JS with no exported types — this local shape
// covers only the fields these two fixtures/tests actually read
// (title/status/blockedOn/nextAction), just enough to avoid `any`.
type DoneItemFixture = { title?: string; status?: string; blockedOn?: string; nextAction?: string };

const formBody = [
  '### Context',
  'We need a thing decided.',
  '### Options',
  'A) Do the safe thing (recommended)',
  'B) Do the fast thing',
  '### Recommendation + why',
  'A, because safety.',
  '### Cost of delay',
  'Copy desk idles on persona names.',
  '### Affects',
  '#463 #480',
  '### Tier',
  'T2 — banked for the daily brief (default)',
].join('\n');

// State shape for the six-section rebuild (Marjorie Overhaul C2) — every key
// a real fetchState() run produces, empty-but-present so buildBrief never
// sees `undefined` where it expects an array/object.
const emptyState = {
  allPRs: [], allPRsCapExhausted: false,
  alerts: [],
  dispatched: [],
  submissions: {},
  contentShipped: [],
  treeLines: [],
  openActions: [],
  cadence: { runners: [] },
  doneItems: {}, doneSeries: [],
};

describe('extractOptions', () => {
  it('pulls lettered options from a form body', () => {
    expect(extractOptions(formBody)).toEqual([
      'A) Do the safe thing (recommended)',
      'B) Do the fast thing',
    ]);
  });
  it('returns [] for unparseable bodies instead of guessing', () => {
    expect(extractOptions('free-text ramble with no headings')).toEqual([]);
    expect(extractOptions(undefined)).toEqual([]);
  });
});

describe('extractField', () => {
  it('pulls a named form field', () => {
    expect(extractField(formBody, 'Cost of delay')).toBe('Copy desk idles on persona names.');
    expect(extractField(formBody, 'Affects')).toBe('#463 #480');
  });
  it('is empty for a missing field', () => {
    expect(extractField(formBody, 'Deadline')).toBe('');
  });
  it('survives regex metacharacters in the label (real form labels have them)', () => {
    const body = '### Recommendation + why\nA, because safety.\n### Deadline (only if real)\n2026-07-20';
    expect(extractField(body, 'Recommendation + why')).toBe('A, because safety.');
    expect(extractField(body, 'Deadline (only if real)')).toBe('2026-07-20');
  });
});

describe('todayLA', () => {
  it('renders the LA-clock date, not UTC', () => {
    // 2026-07-12 02:30 UTC is still 2026-07-11 in Los Angeles (PDT, UTC-7)
    expect(todayLA(new Date('2026-07-12T02:30:00Z'))).toBe('2026-07-11');
    expect(todayLA(new Date('2026-07-12T14:00:00Z'))).toBe('2026-07-12');
  });
});

describe('shortTitle', () => {
  it('cuts at a word boundary — a line ending mid-word reads as a bug', () => {
    expect(shortTitle('LEGAL/image: 17 distinct Getty comp URLs hotlinked across 4 era files')).not.toMatch(/\ber…$/);
    expect(shortTitle('[decision] Persona names')).toBe('Persona names');
    expect(shortTitle('Feedback chatbot pilot — spec ready, DORMANT')).toBe('Feedback chatbot pilot');
  });
});

describe('capSection', () => {
  it('passes an under-budget list through unchanged', () => {
    expect(capSection(['a', 'b'], 5)).toEqual(['a', 'b']);
  });

  it('truncates to budget-1 items plus a final +N more line', () => {
    expect(capSection(['a', 'b', 'c', 'd', 'e'], 3)).toEqual(['a', 'b', '+3 more']);
  });

  it('is exact-fit safe (length === budget needs no +N more line)', () => {
    expect(capSection(['a', 'b', 'c'], 3)).toEqual(['a', 'b', 'c']);
  });
});

describe('renderHumanActionLine', () => {
  it('renders number, age and title with no checkbox and no HA# prefix', () => {
    expect(renderHumanActionLine({ number: 66, ageDays: 0, tag: 'UPGRADE', title: 'Create a Discord webhook', eta: '~5 min' }))
      .toBe('- #66 · 0d · Create a Discord webhook (~5 min)');
  });

  it('prefixes [BLOCKING] items but leaves other tags unmarked', () => {
    expect(renderHumanActionLine({ number: 43, ageDays: 19, tag: 'BLOCKING', title: 'OS-004', eta: '~15 min' }))
      .toBe('- #43 · 19d · [BLOCKING] OS-004 (~15 min)');
  });

  it('omits the eta parenthetical when there is none, and says so when age is unknown', () => {
    expect(renderHumanActionLine({ number: 7, ageDays: null, tag: 'DECIDE', title: 'No estimate', eta: null }))
      .toBe('- #7 · age unknown · No estimate');
  });
});

describe('renderMergedLine', () => {
  it('lists merged PR numbers and counts titles starting "Revert" as reverted', () => {
    const merged = [
      { number: 7, title: 'feat: thing' },
      { number: 3, title: 'Revert "feat: thing"' },
    ];
    expect(renderMergedLine(merged)).toBe('- 2 PRs merged (#7 #3), 1 reverted');
  });

  it('says 0/0 plainly on a day with nothing merged', () => {
    expect(renderMergedLine([])).toBe('- 0 PRs merged, 0 reverted');
  });
});

describe('renderAlertsLine', () => {
  it('counts alerts opened and closed in the last 24h, naming the closed one', () => {
    const alerts = [
      { title: 'Watchdog: prod smoke check failing', createdAt: new Date(NOW - 60 * 60 * 1000).toISOString(), closedAt: null, state: 'OPEN' },
      { title: 'Watchdog: prod smoke check failing', createdAt: new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString(), closedAt: new Date(NOW - 60 * 60 * 1000).toISOString(), state: 'CLOSED' },
    ];
    expect(renderAlertsLine(alerts, NOW)).toBe('- Alerts: 1 opened, 1 closed (prod smoke check failing)');
  });

  it('is all zeros with no alerts', () => {
    expect(renderAlertsLine([], NOW)).toBe('- Alerts: 0 opened, 0 closed');
  });
});

describe('renderDispatchedLine', () => {
  it('is null (omitted) with nothing dispatched', () => {
    expect(renderDispatchedLine([], NOW)).toBeNull();
    expect(renderDispatchedLine(undefined, NOW)).toBeNull();
  });

  it('reports the open count and the oldest item, oldest by createdAt', () => {
    const dispatched = [
      { number: 10, createdAt: new Date(NOW - 2 * 86_400_000).toISOString() },
      { number: 9, createdAt: new Date(NOW - 5 * 86_400_000).toISOString() },
    ];
    expect(renderDispatchedLine(dispatched, NOW)).toBe('- dispatched: 2 open, oldest 5d (#9)');
  });
});

describe('renderSiteLine', () => {
  it('renders all four pills from already-fetched data, e2e honestly unwired', () => {
    const line = renderSiteLine({
      openAlertsNow: [],
      vaultRow: { status: 'ok', ageLabel: '14h' },
      contentShipped: [{ pr: { number: 1 } }],
    });
    expect(line).toBe('- Prod smoke 🟢 · e2e ⚪ (not wired yet) · Vault Run last PR 14h ago 🟢 · content lanes 🟢');
  });

  it('flags prod smoke red when a matching alert is open, and content lanes red when nothing shipped', () => {
    const line = renderSiteLine({
      openAlertsNow: [{ title: 'Watchdog: prod smoke check failing' }],
      vaultRow: null,
      contentShipped: [],
    });
    expect(line).toContain('Prod smoke 🔴');
    expect(line).toContain('content lanes 🔴');
    expect(line).toContain('Vault Run ⚪ (not in runner registry)');
  });
});

describe('renderDistanceClosingLine', () => {
  it('names the count blocked on nobody and says so plainly with no history', () => {
    const doneOpen: [string, DoneItemFixture][] = [
      ['4', { blockedOn: 'agent (Marketplace) · nobody (Community)' }],
      ['5', { blockedOn: 'agent' }],
    ];
    const line = renderDistanceClosingLine(doneOpen, []);
    expect(line).toContain('No recorded status change');
    expect(line).toContain('1 item blocked on `nobody`');
  });

  it('never invents an ETA', () => {
    const line = renderDistanceClosingLine([['5', { blockedOn: 'agent' }]], []);
    expect(line).not.toMatch(/\d+\s*(day|week)s?\s+(to|until)\s+done/i);
  });
});

// #3689: assemble-brief.mjs's own `gh()` wrapper discarded the
// `capExhausted` flag gh.mjs computes for every list call, so a founder ask
// past whatever page the underlying fetch happened to stop on rendered as
// "0 asks" instead of as the truncated-data bug it is. `ghCriticalList` is
// kept as a small, generically useful, independently-tested guard against
// that failure mode.
describe('ghCriticalList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the rows unchanged when the fetch is complete', async () => {
    vi.spyOn(ghMjs, 'gh').mockResolvedValue({ stdout: '[{"number":1}]', capExhausted: false, complete: true });
    await expect(ghCriticalList(['issue', 'list'])).resolves.toEqual([{ number: 1 }]);
  });

  it('throws loudly instead of returning a truncated list as if it were complete', async () => {
    vi.spyOn(ghMjs, 'gh').mockResolvedValue({ stdout: '[]', capExhausted: true, complete: false });
    await expect(ghCriticalList(['issue', 'list', '--label', 'founder-decision'])).rejects.toThrow(/#3689/);
  });
});

// Reviewer nit, PR #4140 round 1: no prior coverage at all for this
// function -- added alongside narrowing it from `tree/` to `tree/plan/`
// (Tree Overhaul T1) so a later regression back to the bare prefix (which
// the far-more-frequent daily-draft PRs would then win) fails a test
// instead of silently misreporting "Tree last planned" in the brief.
describe('findLatestTreePR', () => {
  it('picks the most recent PR whose branch starts tree/plan/, ignoring daily-draft PRs even when they are newer', () => {
    const allPRs = [
      { number: 1, headRefName: 'tree/plan/2026-09-01', createdAt: '2026-09-01T10:00:00Z' },
      { number: 2, headRefName: 'tree/draft/2026-09-10', createdAt: '2026-09-10T11:00:00Z' },
      { number: 3, headRefName: 'tree/plan/2026-09-08', createdAt: '2026-09-08T10:00:00Z' },
    ];
    expect(findLatestTreePR(allPRs)?.number).toBe(3);
  });

  it('returns null when there is no weekly-plan PR at all', () => {
    const allPRs = [{ number: 2, headRefName: 'tree/draft/2026-09-10', createdAt: '2026-09-10T11:00:00Z' }];
    expect(findLatestTreePR(allPRs)).toBeNull();
  });

  it('returns null for an empty/missing PR list', () => {
    expect(findLatestTreePR([])).toBeNull();
    expect(findLatestTreePR(undefined)).toBeNull();
  });
});

describe('buildBrief — six sections (Marjorie Overhaul C2, 2026-09-12)', () => {
  it('leads with the six bold headings, in order, and nothing else', () => {
    const brief = buildBrief(emptyState, { now: NOW });
    const headings = ['**Waiting on you', '**Since yesterday**', '**Today**', '**Site**', '**Tree**', '**Distance to done**'];
    for (const h of headings) expect(brief).toContain(h);
    const order = headings.map((h) => brief.indexOf(h));
    expect(order).toEqual([...order].sort((a: number, b: number) => a - b));
    expect(brief).not.toContain('## 1 ·');
    expect(brief).not.toContain("# Founders' Brief");
  });

  it('never emits the cc line or the self-link header — both are the runner prompt\'s job', () => {
    const brief = buildBrief(emptyState, { now: NOW });
    expect(brief).not.toContain('cc @sffan15-sys');
    expect(brief).not.toMatch(/\[issue #\d+\]/);
  });

  it('says so plainly when nothing is waiting on the founder, and the heading still counts zero', () => {
    const brief = buildBrief(emptyState, { now: NOW });
    expect(brief).toContain('**Waiting on you (0)**');
    expect(brief).toContain('Nothing is waiting on you right now.');
  });

  it('lists every open HUMAN-ACTIONS item — number, age, title — exactly (MR1: acceptance criterion 5)', () => {
    const brief = buildBrief({
      ...emptyState,
      openActions: [
        { number: 4, tag: 'UPGRADE', title: 'API accounts for research', ageDays: 8, eta: null },
      ],
    }, { now: NOW });
    expect(brief).toContain('**Waiting on you (1)**');
    expect(brief).toContain('- #4 · 8d · API accounts for research');
  });

  it('shows five open actions and a +N more line, never all of them past five', () => {
    const brief = buildBrief({
      ...emptyState,
      openActions: Array.from({ length: 9 }, (_, i) => ({ number: 100 + i, tag: 'UPGRADE', title: `Item ${i}`, ageDays: i, eta: null })),
    }, { now: NOW });
    expect(brief).toContain('**Waiting on you (9)**');
    expect(brief).toContain('+4 more in HUMAN-ACTIONS.md');
    // Exactly 5 rendered item lines (plus the +N more line) — never a 6th item line.
    const waitingBlock = brief.split('**Since yesterday**')[0];
    expect((waitingBlock.match(/^- #\d+/gm) || []).length).toBe(5);
  });

  it('reports PRs merged and reverted since yesterday', () => {
    const brief = buildBrief({
      ...emptyState,
      allPRs: [
        { number: 7, title: 'landed today', mergedAt: '2026-07-12T08:00:00Z', createdAt: '2026-07-12T07:00:00Z', headRefName: 'x', state: 'MERGED' },
        { number: 3, title: 'landed last week', mergedAt: '2026-07-05T08:00:00Z', createdAt: '2026-07-05T07:00:00Z', headRefName: 'x', state: 'MERGED' },
      ],
    }, { now: NOW });
    expect(brief).toContain('- 1 PR merged (#7), 0 reverted');
  });

  it('adds the dispatched accountability line only when Marjorie has open dispatched work', () => {
    const withDispatch = buildBrief({
      ...emptyState,
      dispatched: [{ number: 55, createdAt: new Date(NOW - 3 * 86_400_000).toISOString() }],
    }, { now: NOW });
    expect(withDispatch).toContain('dispatched: 1 open, oldest 3d (#55)');

    const without = buildBrief(emptyState, { now: NOW });
    expect(without).not.toContain('dispatched:');
  });

  it('points at an open Tree weekly-plan PR in Since yesterday, but not a merged/closed one', () => {
    const open = buildBrief({
      ...emptyState,
      allPRs: [{ number: 42, headRefName: 'tree/plan/2026-07-10', createdAt: '2026-07-10T10:00:00Z', state: 'OPEN' }],
    }, { now: NOW });
    expect(open).toContain("Tree's plan PR #42 is up for your ✅ in #longlive-tree");

    const merged = buildBrief({
      ...emptyState,
      allPRs: [{ number: 42, headRefName: 'tree/plan/2026-07-10', createdAt: '2026-07-10T10:00:00Z', state: 'MERGED' }],
    }, { now: NOW });
    expect(merged).not.toContain("Tree's plan PR");
  });

  it('passes the submissions line through from the already-computed counts', () => {
    const brief = buildBrief({
      ...emptyState,
      submissions: { 'user-feedback': 0, feedback: 2, intake: 3, 'link-submission': 0 },
    }, { now: NOW });
    expect(brief).toContain('- Submissions in: 0 user-feedback, 2 feedback, 3 intake, 0 link-submission');
  });

  it('Today always has something to say, even with zero registered runners', () => {
    const brief = buildBrief(emptyState, { now: NOW });
    expect(brief).toContain('**Today**');
    expect(brief).toContain('- Runs: no routines currently registered as scheduled.');
    expect(brief).toContain('- Me: sweep the 0 open watchdog alerts, triage anything new');
  });

  it('Tree falls back to a plain line when there is nothing to report, and otherwise passes state.treeLines through', () => {
    expect(buildBrief(emptyState, { now: NOW })).toContain('Nothing to report yet.');
    const withLines = buildBrief({ ...emptyState, treeLines: ['- Lessons: none logged yet.', '- Scorecard: 3 posts this week.'] }, { now: NOW });
    expect(withLines).toContain('- Lessons: none logged yet.');
    expect(withLines).toContain('- Scorecard: 3 posts this week.');
  });

  it('Distance to done reports N/8 green and cites the definition-of-done doc', () => {
    const brief = buildBrief({
      ...emptyState,
      doneItems: {
        1: { title: 'Landing page rethink', status: 'green', blockedOn: null, nextAction: 'none' },
        2: { title: 'Cards differentiated', status: 'notstarted', blockedOn: 'nobody', nextAction: 'spec it' },
      },
    }, { now: NOW });
    expect(brief).toContain('**Distance to done** — 1/2 green (`docs/definition-of-done.md`)');
    expect(brief).toContain('Cards differentiated');
    expect(brief).toContain('unstaffed');
  });

  it('calls out every non-green item with who it is blocked on, never inventing an ETA', () => {
    const brief = buildBrief({
      ...emptyState,
      doneItems: {
        4: { title: 'Marketplace + Community sections', status: 'yellow', blockedOn: 'agent (Marketplace) · nobody (Community)', nextAction: 'x' },
      },
    }, { now: NOW });
    expect(brief).toContain('#4 Marketplace + Community sections');
    expect(brief).toContain('blocked on');
    expect(brief).not.toMatch(/\d+\s*(day|week)s?\s+(to|until)\s+done/i);
  });

  it('celebrates all eight green with no non-green bullets', () => {
    const brief = buildBrief({
      ...emptyState,
      doneItems: { 1: { title: 'A', status: 'green' }, 2: { title: 'B', status: 'green' } },
    }, { now: NOW });
    expect(brief).toContain('**Distance to done** — 2/2 green');
    expect(brief).toContain('All 8 items are green');
  });

  it('says so plainly when the definition-of-done table did not parse, without dropping the section', () => {
    const brief = buildBrief(emptyState, { now: NOW });
    expect(brief).toContain('**Distance to done**');
    expect(brief).toContain('did not parse');
  });

  // Acceptance criterion 1 / the 40-line cap: a single global truncation at
  // line 40 always used to eat whichever section came last (Distance to
  // done). Per-section budgeting means an oversized Waiting-on-you can never
  // starve it — every section still appears, headings included, and
  // Distance to done still prints its full heading + content.
  it('stays under the 40-line cap and never lets other sections crowd out Distance to done', () => {
    const brief = buildBrief({
      ...emptyState,
      openActions: Array.from({ length: 40 }, (_, i) => ({ number: 200 + i, tag: 'UPGRADE', title: `Oversized item ${i}`, ageDays: i, eta: null })),
      doneItems: {
        1: { title: 'One', status: 'yellow', blockedOn: 'agent', nextAction: 'x' },
        2: { title: 'Two', status: 'yellow', blockedOn: 'nobody', nextAction: 'x' },
      },
    }, { now: NOW });
    expect(brief.split('\n').length).toBeLessThanOrEqual(40);
    for (const h of ['**Waiting on you', '**Since yesterday**', '**Today**', '**Site**', '**Tree**', '**Distance to done**']) {
      expect(brief).toContain(h);
    }
    expect(brief).toContain('**Distance to done** — 0/2 green');
    expect(brief).toContain('One');
    expect(brief).toContain('Two');
  });

  // Same cap, exercised from the other direction: Distance to done's OWN
  // content can also overflow its budget (all eight items non-green) — it
  // must truncate its item list, never drop the closing sentence of
  // judgment, which is reserved its own slot.
  it('truncates its own oversized item list but always keeps the closing sentence', () => {
    const doneItems: Record<number, DoneItemFixture> = {};
    for (let i = 1; i <= 8; i += 1) doneItems[i] = { title: `Item ${i}`, status: 'red', blockedOn: 'nobody', nextAction: 'x' };
    const brief = buildBrief({ ...emptyState, doneItems }, { now: NOW });
    expect(brief.split('\n').length).toBeLessThanOrEqual(40);
    expect(brief).toMatch(/\+\d+ more/);
    expect(brief).toContain('blocked on `nobody`');
  });
});
