import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  parseOpenActions,
  renderActionLine,
  sortForBrief,
  STALE_AFTER_DAYS,
  parseMinutes,
  quickWins,
  parseClosedNumbers,
  nextHumanActionNumber,
} from './human-actions.mjs';

const NOW = new Date('2026-09-11T12:00:00Z').getTime();

// Format v2 (RULINGS-2 / ARCHITECTURE-decision.md §3): no `## OPEN`/`## DONE`
// split, no `**Status:**` field — presence in the file IS "open". Filed date
// moved into a hidden `<!-- ha filed=... -->` comment. Kind vocabulary is
// exactly BLOCKING / DECIDE / UPGRADE. An optional `(~eta)` trailer on the
// heading is its own field, not glued into the title text.
const DOC = [
  '# Human actions — Swift2',
  '',
  '<!-- ha-format: 2 -->',
  '',
  '> **3 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.',
  '',
  '## #4 🟢 [UPGRADE] API accounts for the marketplace research (~20 min)',
  '<!-- ha filed=2026-09-03 -->',
  '',
  '**Why:** blah blah.',
  '**Steps:**',
  '1. Do the thing.',
  '**Worked if:** it worked.',
  '',
  '## #10 🔴 [BLOCKING] Something urgent (~5 min)',
  '<!-- ha filed=2026-08-18 -->',
  '',
  '**Why:** blah.',
  '**Steps:**',
  '1. Do the urgent thing.',
  '**Worked if:** it worked.',
  '',
  '## #11 🟡 [DECIDE] No Filed date (predates the convention)',
  '',
  '**Why:** blah.',
  '**Steps:**',
  '1. TODO — steps needed',
  '**Worked if:** it worked.',
  '',
].join('\n');

describe('parseOpenActions', () => {
  it('returns every item in the file — presence means open, there is no section to filter by', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    expect(items.map((i) => i.number)).toEqual([4, 10, 11]);
  });

  it('computes age in days from the <!-- ha filed=... --> comment', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    const item4 = items.find((i) => i.number === 4)!;
    expect(item4.ageDays).toBe(8); // 2026-09-03 -> 2026-09-11
  });

  it('reports null age (not a guess) when the filed comment is missing', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    const item11 = items.find((i) => i.number === 11)!;
    expect(item11.filed).toBeNull();
    expect(item11.ageDays).toBeNull();
  });

  it('captures the kind and title, with the trailing (~eta) stripped out of the title', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    const item10 = items.find((i) => i.number === 10)!;
    expect(item10.tag).toBe('BLOCKING');
    expect(item10.title).toBe('Something urgent');
    expect(item10.title).not.toContain('~5 min');
  });

  it('captures the (~eta) trailer into its own eta field', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    expect(items.find((i) => i.number === 4)!.eta).toBe('~20 min');
    expect(items.find((i) => i.number === 10)!.eta).toBe('~5 min');
  });

  it('reports a null eta when the heading has no (~eta) trailer', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    expect(items.find((i) => i.number === 11)!.eta).toBeNull();
  });

  it('accepts all three v2 kinds and rejects the retired v1 vocabulary', () => {
    const doc = [
      '## #1 🔴 [BLOCKING] x',
      '<!-- ha filed=2026-09-01 -->',
      '## #2 🟡 [DECIDE] y',
      '<!-- ha filed=2026-09-01 -->',
      '## #3 🟢 [UPGRADE] z',
      '<!-- ha filed=2026-09-01 -->',
      // REVIEW/MERCH/DONE were v1-only tags; a heading using one is not a
      // recognized item header at all under v2 and must not be parsed.
      '## #4 [REVIEW] w',
      '<!-- ha filed=2026-09-01 -->',
    ].join('\n');
    const items = parseOpenActions(doc, { now: NOW });
    expect(items.map((i) => i.number)).toEqual([1, 2, 3]);
    expect(items.map((i) => i.tag)).toEqual(['BLOCKING', 'DECIDE', 'UPGRADE']);
  });

  it('never reads a v1 **Status:** line as meaningful — presence alone decides open', () => {
    // A stray "**Status:** DONE" line inside an item's body is leftover v1
    // furniture, not a v2 field (the whole point of v2: there is no status
    // field). It must have zero effect — the item still parses, still open.
    const doc = [
      '## #9 🟡 [DECIDE] Some item',
      '<!-- ha filed=2026-09-01 -->',
      '**Status:** DONE — this text must be inert under v2',
      '**Why:** blah.',
    ].join('\n');
    const items = parseOpenActions(doc, { now: NOW });
    expect(items).toHaveLength(1);
    expect(items[0].number).toBe(9);
  });

  it('does not require a glyph between the # number and the [KIND] tag', () => {
    const doc = ['## #7 [BLOCKING] No glyph at all', '<!-- ha filed=2026-09-01 -->'].join('\n');
    const items = parseOpenActions(doc, { now: NOW });
    expect(items.map((i) => i.number)).toEqual([7]);
  });

  it('ignores the preamble (title line, ha-format marker, blockquote) entirely', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    // Three items, not four or more from the preamble lines matching by
    // accident — a direct sanity check on top of the number-list assertions
    // above, so a future preamble edit that starts looking like a heading
    // is caught here specifically.
    expect(items).toHaveLength(3);
  });
});

describe('renderActionLine', () => {
  it('flags anything past the stale threshold with 🔴', () => {
    const stale = { number: 10, tag: 'BLOCKING', title: 'x', ageDays: STALE_AFTER_DAYS + 1 };
    const fresh = { number: 4, tag: 'UPGRADE', title: 'x', ageDays: 1 };
    expect(renderActionLine(stale)).toContain('🔴');
    expect(renderActionLine(fresh)).not.toContain('🔴');
  });

  it('says "age unknown" rather than a fabricated number when Filed: is missing', () => {
    const line = renderActionLine({ number: 11, tag: 'UPGRADE', title: 'x', ageDays: null });
    expect(line).toContain('age unknown — no Filed: date');
  });
});

describe('sortForBrief', () => {
  it('puts BLOCKING before UPGRADE regardless of age', () => {
    const items = [
      { number: 4, tag: 'UPGRADE', ageDays: 100 },
      { number: 10, tag: 'BLOCKING', ageDays: 1 },
    ];
    expect(sortForBrief(items).map((i) => i.number)).toEqual([10, 4]);
  });

  it('within the same tag, oldest first', () => {
    const items = [
      { number: 4, tag: 'UPGRADE', ageDays: 1 },
      { number: 5, tag: 'UPGRADE', ageDays: 30 },
    ];
    expect(sortForBrief(items).map((i) => i.number)).toEqual([5, 4]);
  });
});

describe('parseMinutes', () => {
  it('reads the ~N min estimate out of a string', () => {
    expect(parseMinutes('Rename Karen’s live trigger — ~2 min')).toBe(2);
    expect(parseMinutes('Mobile release train — ~35 min total')).toBe(35);
  });

  it('uses the UPPER bound of a range (honest worst-case for a "quick" claim)', () => {
    expect(parseMinutes('Vault Phase 4 needs a session — ~10-20 min')).toBe(20);
    expect(parseMinutes('Two PRs stuck — ~5–15 min, needs your GitHub UI access')).toBe(15);
  });

  it('returns null, never a guess, when no estimate is present', () => {
    expect(parseMinutes('No estimate here')).toBeNull();
    expect(parseMinutes(undefined)).toBeNull();
  });
});

describe('quickWins', () => {
  const mk = (number, eta) => ({ number, title: 'Some item', tag: 'UPGRADE', ageDays: 1, eta });
  it('keeps only items at or under the minute cap, ascending by time', () => {
    const items = [
      mk(1, '~35 min total'),
      mk(2, '~2 min'),
      mk(3, '~10 min'),
      mk(4, null),
    ];
    expect(quickWins(items).map((i) => i.number)).toEqual([2, 3]);
  });

  it('respects a custom minute cap', () => {
    const items = [mk(1, '~20 min'), mk(2, '~5 min')];
    expect(quickWins(items, 25).map((i) => i.number)).toEqual([2, 1]);
  });

  it('reads the estimate from item.eta, not item.title — v2 items never carry it in the title', () => {
    // A v2 item's title has the (~eta) trailer stripped by the parser, so an
    // implementation that (incorrectly) called parseMinutes(it.title) here
    // would find nothing and drop every real item from the quick-wins list.
    const items = [{ number: 1, title: 'Title with no minutes text at all', tag: 'UPGRADE', ageDays: 1, eta: '~3 min' }];
    expect(quickWins(items).map((i) => i.number)).toEqual([1]);
  });

  it('falls back to item.title when eta is absent (v1-shaped fixtures, inline estimates)', () => {
    const items = [{ number: 1, title: 'Legacy-style title — ~6 min', tag: 'UPGRADE', ageDays: 1, eta: null }];
    expect(quickWins(items).map((i) => i.number)).toEqual([1]);
  });
});

const DONE_DOC = [
  '# Human actions — Swift2 — CLOSED',
  '',
  '<!-- ha-format: 2. Machine record: nothing here needs you. One line per item, newest first. -->',
  '',
  '- #66 · 2026-09-12 · done · Create a Discord webhook — "closed via Discord reply" · by discord',
  '- #61 · 2026-09-12 · done · Set SOCIAL_FREEZE=false — "verified" · by owner',
  '',
].join('\n');

describe('parseClosedNumbers', () => {
  it('extracts every #N from HUMAN-ACTIONS-DONE.md lines', () => {
    expect(parseClosedNumbers(DONE_DOC)).toEqual([66, 61]);
  });

  it('returns an empty array for empty/missing content', () => {
    expect(parseClosedNumbers('')).toEqual([]);
    expect(parseClosedNumbers(undefined)).toEqual([]);
  });
});

describe('nextHumanActionNumber', () => {
  it('is max(open ∪ closed) + 1, not just the highest open number', () => {
    // DOC's highest open item is #11, but DONE_DOC has a closed #66 — the
    // true next number must skip past the closed one too (numbers are
    // never reused).
    expect(nextHumanActionNumber(DOC, DONE_DOC, { now: NOW })).toBe(67);
  });

  it('falls back to the open file alone when the done file is empty/missing', () => {
    expect(nextHumanActionNumber(DOC, '', { now: NOW })).toBe(12);
  });

  it('falls back to the done file alone when the open file is empty', () => {
    expect(nextHumanActionNumber('', DONE_DOC, { now: NOW })).toBe(67);
  });

  it('starts at 1 when both files are empty', () => {
    expect(nextHumanActionNumber('', '')).toBe(1);
  });
});
