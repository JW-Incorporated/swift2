import { describe, expect, it } from 'vitest';
import { parseLessons, renderLessons, nextId } from './lessons.mjs';

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
