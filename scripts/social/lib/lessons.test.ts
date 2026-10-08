import { describe, expect, it } from 'vitest';
import { parseLessons, renderLessons, nextId, findCodifiableRules, findRetirableRules } from './lessons.mjs';

// spec AC#1 — active rule, a retired rule with `Superseded by`, and a rule
// with `Codify: done (#n)` (the retired rule carries both, matching the
// Retirement section: codification sets both fields on the same rule).
const FIXTURE = `### L005 — Don't post two Instagram carousels in one week

- **Status:** active
- **First seen:** 2026-09-20 (PR #4210)
- **Times fired:** 1
- **Last fired:** 2026-09-20 (PR #4210)
- **Evidence:** [#4210 ✏️](https://github.com/JW-Incorporated/swift2/pull/4210#issuecomment-1)
- **Codify:** —

**You said:** "two carousels in one week is a lot, space them out."

**So I:** never schedule a second Instagram carousel within 7 days of the last one.

## Retired

### L004 — Don't open two posts in a row with a question

- **Status:** retired
- **First seen:** 2026-09-17 (PR #4130)
- **Times fired:** 3
- **Last fired:** 2026-10-01 (PR #4188)
- **Evidence:** [#4130 ✏️](https://github.com/JW-Incorporated/swift2/pull/4130#issuecomment-1), [#4155 ❌](https://github.com/JW-Incorporated/swift2/pull/4155#issuecomment-2), [#4188 ✏️](https://github.com/JW-Incorporated/swift2/pull/4188#issuecomment-3)
- **Codify:** done (#4201)
- **Superseded by:** check-drafts.mjs:checkOpeners

**You said:** "this is the third question opener in a row, it reads like a quiz account."

**So I:** check the previous post on the same platform before drafting, and never open with a question twice running.`;

describe('parseLessons / renderLessons round-trip (AC#1)', () => {
  it('round-trips a fixture with an active rule, a retired Superseded-by rule, and a Codify: done(#n) rule, byte-for-byte', () => {
    expect(renderLessons(parseLessons(FIXTURE))).toBe(FIXTURE);
  });

  it('parses the active and retired rules into the right buckets with the right fields', () => {
    const { active, retired } = parseLessons(FIXTURE);
    expect(active).toHaveLength(1);
    expect(retired).toHaveLength(1);
    expect(active[0]).toMatchObject({ id: 'L005', status: 'active', timesFired: 1, codify: '—' });
    expect(active[0].supersededBy).toBeUndefined();
    expect(retired[0]).toMatchObject({
      id: 'L004',
      status: 'retired',
      timesFired: 3,
      codify: 'done (#4201)',
      supersededBy: 'check-drafts.mjs:checkOpeners',
      youSaid: '"this is the third question opener in a row, it reads like a quiz account."',
    });
  });

  it('treats a fully empty ledger as zero active, zero retired rules', () => {
    expect(parseLessons('')).toEqual({ active: [], retired: [] });
    expect(renderLessons({ active: [], retired: [] })).toBe('');
  });

  it('ignores a leading format comment rather than erroring on it', () => {
    const withPreamble = `<!-- format docs for humans, not a rule block -->\n\n${FIXTURE}`;
    expect(parseLessons(withPreamble)).toEqual(parseLessons(FIXTURE));
  });

  it('omits the "## Retired" heading entirely when nothing is retired yet', () => {
    const { active } = parseLessons(FIXTURE);
    expect(renderLessons({ active, retired: [] })).not.toContain('## Retired');
  });
});

describe('nextId (AC#2)', () => {
  it('returns L005 for a ledger whose highest id is L004, including when L003 is retired', () => {
    const rules = {
      active: [{ id: 'L004' }],
      retired: [{ id: 'L003' }],
    };
    expect(nextId(rules)).toBe('L005');
  });

  it('starts a fully empty ledger at L001', () => {
    expect(nextId({ active: [], retired: [] })).toBe('L001');
  });

  it('takes the max id regardless of array order', () => {
    expect(nextId({ active: [{ id: 'L002' }, { id: 'L009' }, { id: 'L005' }], retired: [] })).toBe('L010');
  });
});

// Round 2 review + owner ruling: AC#5/#6 are deterministic arithmetic over
// already-parsed ledger fields, not the semantic judgment spec's "done by
// the Opus weekly run rather than by a matcher" line covers — so they are
// code, tested here, mirroring nextId's own pure-function pattern.
describe('findCodifiableRules (AC#5)', () => {
  it('includes an active rule at Times fired >= 3 with Codify still unset', () => {
    const rules = { active: [{ id: 'L001', timesFired: 3, codify: '—' }], retired: [] };
    expect(findCodifiableRules(rules)).toEqual([rules.active[0]]);
  });

  it('excludes a rule already carrying a real Codify value — a second run over the same ledger never re-files', () => {
    const rules = {
      active: [
        { id: 'L001', timesFired: 5, codify: 'done (#4201)' },
        { id: 'L002', timesFired: 5, codify: '#4300' },
      ],
      retired: [],
    };
    expect(findCodifiableRules(rules)).toEqual([]);
  });

  it('excludes a rule below the 3-firing threshold', () => {
    const rules = { active: [{ id: 'L001', timesFired: 2, codify: '—' }], retired: [] };
    expect(findCodifiableRules(rules)).toEqual([]);
  });
});

describe('findRetirableRules (AC#6)', () => {
  it('retires a rule with no firing for 8 weeks AND >=10 briefs in that window', () => {
    const rules = { active: [{ id: 'L001', timesFired: 3, codify: '—' }], retired: [] };
    expect(findRetirableRules(rules, { L001: { weeksQuiet: 8, briefsInWindow: 10 } })).toEqual(rules.active);
  });

  // spec AC#6's own counter-example, verbatim: 8 quiet weeks is not enough
  // on its own — a posting freeze must never silently retire the rule set.
  it('does NOT retire a rule with 8 quiet weeks but only 2 briefs in the window', () => {
    const rules = { active: [{ id: 'L001', timesFired: 3, codify: '—' }], retired: [] };
    expect(findRetirableRules(rules, { L001: { weeksQuiet: 8, briefsInWindow: 2 } })).toEqual([]);
  });

  it('does NOT retire a rule with enough briefs but fewer than 8 quiet weeks', () => {
    const rules = { active: [{ id: 'L001', timesFired: 3, codify: '—' }], retired: [] };
    expect(findRetirableRules(rules, { L001: { weeksQuiet: 7, briefsInWindow: 10 } })).toEqual([]);
  });

  it('does NOT retire a rule with no window data at all', () => {
    const rules = { active: [{ id: 'L001', timesFired: 3, codify: '—' }], retired: [] };
    expect(findRetirableRules(rules, {})).toEqual([]);
  });
});

// Round 2 review — AC#7: a retired rule that fires again is reactivated
// with its original id and Evidence history intact, never re-created under
// a new id. lessons.mjs has no dedicated "reactivate" function (the owner's
// ruling keeps the matching decision itself in tree-weekly-plan.md's prose)
// — this proves the DATA MODEL represents reactivation correctly: moving a
// rule from retired to active, flipping Status, dropping Superseded by, and
// APPENDING (never replacing) Evidence all round-trip losslessly.
describe('reactivation (AC#7)', () => {
  it('a reactivated rule keeps its original id and its full Evidence history, and drops Superseded by', () => {
    const retiredRule = {
      id: 'L003',
      title: 'Never open with a pun',
      status: 'retired',
      firstSeen: '2026-08-01 (PR #4000)',
      timesFired: 2,
      lastFired: '2026-08-15 (PR #4010)',
      evidence: '[#4000 ✏️](https://example.com/1), [#4010 ✏️](https://example.com/2)',
      codify: '—',
      supersededBy: '— (no firings since 2026-08-15)',
      youSaid: '"puns again, please stop."',
      soI: 'never open with a pun.',
    };
    // "Fires again": same id, moved back to active, history appended not
    // replaced, Superseded by no longer applies once the rule is live again.
    const reactivated = {
      ...retiredRule,
      status: 'active',
      timesFired: retiredRule.timesFired + 1,
      lastFired: '2026-11-01 (PR #4300)',
      evidence: `${retiredRule.evidence}, [#4300 ✏️](https://example.com/3)`,
      youSaid: '"still doing the pun thing."',
    };
    delete reactivated.supersededBy;

    const rendered = renderLessons({ active: [reactivated], retired: [] });
    const parsed = parseLessons(rendered);

    expect(parsed.retired).toEqual([]);
    expect(parsed.active).toHaveLength(1);
    expect(parsed.active[0].id).toBe('L003');
    expect(parsed.active[0].status).toBe('active');
    expect(parsed.active[0].timesFired).toBe(3);
    expect(parsed.active[0].evidence).toContain('#4000');
    expect(parsed.active[0].evidence).toContain('#4010');
    expect(parsed.active[0].evidence).toContain('#4300');
    expect(parsed.active[0].supersededBy).toBeUndefined();
  });
});
