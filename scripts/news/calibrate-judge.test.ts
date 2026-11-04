import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GOLD_RUNS, evaluateModel, failedDimensions, judgeInputFor, legacyFailTarget, renderTable } from './calibrate-judge-score.mjs';

const DIR = new URL('../../apps/worker/src/extract/__fixtures__/judge-calibration/', import.meta.url);
const rows = (name: string) => readFileSync(new URL(name, DIR), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const ok = (pass: boolean, scores = { voice: 5, context: 5, grounding: 5, non_repetition: 5 }) => ({ status: 'ok', pass, scores });
const goldRuns = (pass: boolean[]) => Array.from({ length: GOLD_RUNS }, () => pass.map((p) => ok(p)));

describe('fixtures', () => {
  it('parse, with the expected shapes', () => {
    const gold = rows('gold.jsonl');
    const negatives = rows('negatives.jsonl');
    const legacy = rows('legacy.jsonl');
    expect(gold).toHaveLength(5);
    expect(negatives).toHaveLength(5);
    expect(legacy.length).toBeGreaterThanOrEqual(26);
    for (const row of [...gold, ...negatives, ...legacy]) {
      expect(row.kitId).toBeTruthy();
      expect(row.observedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.facts.length).toBeGreaterThan(0);
      expect(row.lead.length).toBeGreaterThan(0);
      expect(row.paragraphs.length).toBeGreaterThan(0);
    }
    for (const row of gold) expect(row.paragraphs.flatMap((p: { sentences: { refs: string[] }[] }) => p.sentences).every((s) => s.refs.length > 0)).toBe(true);
    for (const row of legacy) expect(row.paragraphs.flatMap((p: { sentences: { refs: string[] }[] }) => p.sentences).every((s) => s.refs.length === 0)).toBe(true);
  });

  it('gives every negative an expect_fail_on that is a judge dimension and a gold base', () => {
    const goldIds = new Set(rows('gold.jsonl').map((r) => r.kitId));
    for (const row of rows('negatives.jsonl')) {
      expect(['voice', 'context', 'grounding', 'non_repetition']).toContain(row.expect_fail_on);
      expect(goldIds.has(row.baseKitId)).toBe(true);
    }
  });
});

describe('judgeInputFor', () => {
  const row = rows('gold.jsonl')[0];

  it('has no headline, carries observedOn, and sends citations for gold', () => {
    const input = judgeInputFor(row);
    expect('headline' in input).toBe(false);
    expect(input.observedOn).toBe(row.observedOn);
    expect(input.citations?.length).toBeGreaterThan(0);
    expect(input.facts[0]).toMatch(/^\[f1\] /);
  });

  it('omits the citations block for legacy copy', () => {
    expect('citations' in judgeInputFor(row, { legacy: true })).toBe(false);
  });
});

describe('evaluateModel', () => {
  const negatives = (hits: number) => Array.from({ length: 5 }, (_, i) => (
    i < hits
      ? { ...ok(false, { voice: 2, context: 5, grounding: 5, non_repetition: 5 }), expectFailOn: 'voice' }
      : { ...ok(false, { voice: 5, context: 5, grounding: 5, non_repetition: 3 }), expectFailOn: 'voice' }
  ));
  const legacy = (fails: number, total = 31) => Array.from({ length: total }, (_, i) => ok(i >= fails));

  it('accepts when all three bars are met', () => {
    const e = evaluateModel({ gold: goldRuns([true, true, true, true, true]), negatives: negatives(5), legacy: legacy(26) });
    expect(e).toMatchObject({ goldOk: true, negativesOk: true, legacyOk: true, accepted: true, goldPassPerRun: [5, 5, 5] });
  });

  it('tolerates exactly one non-grounding gold miss across all runs', () => {
    const gold = goldRuns([true, true, true, true, true]);
    gold[1]![4] = ok(false, { voice: 3, context: 5, grounding: 5, non_repetition: 5 });
    expect(evaluateModel({ gold, negatives: negatives(5), legacy: legacy(31) }).goldOk).toBe(true);
  });

  it('rejects two gold misses', () => {
    const gold = goldRuns([true, true, true, true, true]);
    gold[0]![2] = ok(false, { voice: 3, context: 5, grounding: 5, non_repetition: 5 });
    gold[1]![4] = ok(false, { voice: 3, context: 5, grounding: 5, non_repetition: 5 });
    expect(evaluateModel({ gold, negatives: negatives(5), legacy: legacy(31) }).goldOk).toBe(false);
  });

  it('rejects any gold miss on grounding, even a single one', () => {
    const gold = goldRuns([true, true, true, true, true]);
    gold[2]![0] = ok(false, { voice: 5, context: 5, grounding: 3, non_repetition: 5 });
    expect(evaluateModel({ gold, negatives: negatives(5), legacy: legacy(31) }).goldOk).toBe(false);
  });

  it('rejects a negative that fails on the wrong dimension or passes', () => {
    expect(evaluateModel({ gold: goldRuns([true]), negatives: negatives(4), legacy: legacy(31) }).negativesOk).toBe(false);
    const passing = [...negatives(4), { ...ok(true), expectFailOn: 'voice' }];
    expect(evaluateModel({ gold: goldRuns([true]), negatives: passing, legacy: legacy(31) }).negativeHits).toBe(4);
  });

  it('needs 26 of 31 legacy failures, scaled to the row count', () => {
    expect(evaluateModel({ gold: goldRuns([true]), negatives: negatives(5), legacy: legacy(25) }).legacyOk).toBe(false);
    expect(legacyFailTarget(31)).toBe(26);
    expect(legacyFailTarget(30)).toBe(26);
    expect(evaluateModel({ gold: goldRuns([true]), negatives: negatives(5), legacy: legacy(26, 30) }).legacyOk).toBe(true);
  });

  it('treats a deferred verdict as a miss everywhere', () => {
    const deferred = { status: 'deferred', reason: 'limit' };
    const gold = goldRuns([true, true]);
    gold[0]![0] = deferred as never;
    expect(evaluateModel({ gold, negatives: negatives(5), legacy: legacy(31) }).goldOk).toBe(false);
    expect(evaluateModel({ gold: goldRuns([true]), negatives: negatives(5), legacy: legacy(31).map(() => deferred) as never }).legacyOk).toBe(false);
  });

  it('renders one row per model', () => {
    const e = evaluateModel({ gold: goldRuns([true]), negatives: negatives(5), legacy: legacy(31) });
    expect(renderTable({ 'claude-opus-5-5': e }).split('\n')).toHaveLength(3);
  });
});

describe('failedDimensions', () => {
  it('uses the per-dimension minimums', () => {
    expect(failedDimensions({ voice: 3, context: 3, grounding: 3, non_repetition: 2 }).sort()).toEqual(['grounding', 'non_repetition', 'voice']);
    expect(failedDimensions({ voice: 4, context: 3, grounding: 4, non_repetition: 3 })).toEqual([]);
  });
});
