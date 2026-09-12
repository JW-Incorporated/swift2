// Tree Overhaul T5 (docs/specs/tree-overhaul/t5-lessons-ledger.md). Tree's
// weekly-plan/daily-draft "steps" are prose an LLM run follows, not code.
//
// Round 2 review + owner ruling (see docs/decisions.md and this PR's "Round
// 2" body section): spec's "judgment, done by the Opus weekly run rather
// than by a matcher" line is scoped to SEMANTIC attribution — which rule a
// reject reason's meaning matches — not the deterministic bookkeeping
// around it. AC#5 (codify-at-3), AC#6 (retirement windows), and AC#10 (list
// already-parsed rule ids) are now real, tested code
// (scripts/social/lib/lessons.test.ts's findCodifiableRules/
// findRetirableRules describe blocks, and validate-queue.test.ts/
// check-drafts.test.ts for rulesChecked). What's left with no corresponding
// code — and cannot have any, since it IS the judgment call — is semantic
// attribution itself (AC#4) and the strategy-proposal mechanism's PR-opening
// action (AC#9, Tree's own `gh pr create`). This file pins the literal facts
// the runner prompts must state for those, the same way
// scripts/check-launch-gates.test.ts pins docs/launch-readiness.md's — a
// real check that the algorithm is documented correctly, even though it
// cannot check a future run followed it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

describe('tree-weekly-plan.md — the Monday distillation (AC#4-7, #9)', () => {
  const doc = read('docs/agents/runner-prompts/tree-weekly-plan.md');

  it('caps new rules at 3/week and names the overflow instead of forcing a rule', () => {
    expect(doc).toContain('at most 3 new ones this week');
    expect(doc).toContain('N more things I haven\'t turned into rules yet');
  });

  it('scopes judgment to semantic attribution only — codify/retire are computed, not eyeballed (round 2 ruling)', () => {
    expect(doc).toContain('Semantic attribution is your judgment call, and the only part of this step that is');
    expect(doc).toContain('Codification and retirement are counting, not judgment');
    expect(doc).toContain('findCodifiableRules');
    expect(doc).toContain('findRetirableRules');
    expect(doc).toContain('never decide either by re-reading the numbers yourself');
  });

  it('computes the retirement window inputs deterministically rather than restating the thresholds as prose (thresholds are pinned in lessons.test.ts instead)', () => {
    expect(doc).toContain('weeksQuiet');
    expect(doc).toContain('briefsInWindow');
    expect(doc).toContain('whole weeks between its `Last fired` date and today');
  });

  it('states the codify-at-3 trigger and issue shape', () => {
    expect(doc).toContain('Times fired ≥ 3');
    expect(doc).toContain('Codify: —');
    expect(doc).toContain('codify: L### — <title>');
    expect(doc).toContain('`intake`+`social`');
  });

  it('AC#7 — checks retired rules too and reactivates on a match, instead of minting a new id', () => {
    expect(doc).toContain('read every active AND retired rule first');
    expect(doc).toContain('a reason that means the same thing as a *retired* rule reactivates it');
    expect(doc).toContain('Reactivating a retired rule (spec AC#7)');
    expect(doc).toContain('never re-created under a new id');
  });

  it('resolves a proposal verdict from a ledger row, never a PR comment', () => {
    expect(doc).toContain('does not land as a PR comment');
    expect(doc).toContain('file: "proposal:N"');
    expect(doc).toContain('tree/strategy/<ISO-week>-<n>');
    expect(doc).toContain('never staged here, never before this row exists');
  });

  it('a rejected proposal opens no PR and is recorded as a firing', () => {
    expect(doc).toContain('open nothing; count the ❌ as a firing');
  });

  it('the hard-limits list of writable files includes social/lessons.md, still forbids the strategy file, and no longer describes the stale pre-T4 propose mechanism', () => {
    expect(doc).toContain('`social/lessons.md` (T5, step 3.5) are the ONLY files you may write');
    expect(doc).toContain('never `docs/marketing/social-strategy.md`');
    expect(doc).not.toContain('propose strategy changes in the PR body or a `founder-decision` issue');
  });
});

describe('tree-daily-draft.md — rulesChecked (AC#10)', () => {
  const doc = read('docs/agents/runner-prompts/tree-daily-draft.md');

  it('reads social/lessons.md before drafting and treats active rules as binding', () => {
    expect(doc).toContain('treat every `active` rule as binding while you draft');
  });

  it('a rule violation fails the same rewrite-then-empty path as a low rubric score, not a new path', () => {
    expect(doc).toContain('fails the same way a low score does');
  });

  it('writes every active rule id actually checked into critique.rulesChecked', () => {
    expect(doc).toContain('lists every `active` rule id from `social/lessons.md` you checked this draft against');
    expect(doc).not.toContain('rulesChecked: [], revision');
  });

  it("the PR body lists the active rule ids read this run", () => {
    expect(doc).toContain('the active rule ids you read from `social/lessons.md` this run');
  });
});

describe('docs/agents/tree.md — invariant 2 and mutation rights (AC#9)', () => {
  const doc = read('docs/agents/tree.md');

  it('restates invariant 2 as propose-in-brief, ✅-then-next-run-opens-its-own-PR, never a merge by Tree', () => {
    expect(doc).toContain('recorded as a ledger row, never a merge');
    expect(doc).toContain('tree/strategy/<ISO-week>-<n>');
    expect(doc).toContain('Tree never merges it');
    expect(doc).not.toContain('PR body or a `founder-decision` issue');
  });

  it('adds social/lessons.md to mutation rights alongside social/calendar.md', () => {
    expect(doc).toContain('`social/lessons.md` (T5)');
  });
});
