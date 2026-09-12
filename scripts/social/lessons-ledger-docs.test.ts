// Tree Overhaul T5 (docs/specs/tree-overhaul/t5-lessons-ledger.md). Tree's
// weekly-plan/daily-draft "steps" are prose an LLM run follows, not code —
// spec's own Mechanics section is explicit that attribution is "judgment,
// done by the Opus weekly run rather than by a matcher" — so acceptance
// criteria #4-7, #9, #10 (attribution counts, retirement windows, the
// codify-at-3 trigger, the strategy-PR mechanism, the daily PR body) have no
// corresponding code to unit-test. This file pins the literal facts those
// runner prompts must state, the same way scripts/check-launch-gates.test.ts
// pins docs/launch-readiness.md's — a real check that the algorithm is
// documented correctly, even though it cannot check a future run followed it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

describe('tree-weekly-plan.md — the Monday distillation (AC#4-6, #9)', () => {
  const doc = read('docs/agents/runner-prompts/tree-weekly-plan.md');

  it('caps new rules at 3/week and names the overflow instead of forcing a rule', () => {
    expect(doc).toContain('at most 3 new ones this week');
    expect(doc).toContain('N more things I haven\'t turned into rules yet');
  });

  it('states the retirement windows exactly (8 consecutive weeks AND ≥10 briefs)', () => {
    expect(doc).toContain('8 consecutive weeks');
    expect(doc).toContain('≥10 briefs went out in that window');
  });

  it('states the codify-at-3 trigger and issue shape', () => {
    expect(doc).toContain('Times fired ≥ 3');
    expect(doc).toContain('Codify: —');
    expect(doc).toContain('codify: L### — <title>');
    expect(doc).toContain('`intake`+`social`');
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

  it('the hard-limits list of writable files includes social/lessons.md and still forbids the strategy file', () => {
    expect(doc).toContain('`social/lessons.md` (T5, step 3.5) are the ONLY files you may write');
    expect(doc).toContain('never `docs/marketing/social-strategy.md`');
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
