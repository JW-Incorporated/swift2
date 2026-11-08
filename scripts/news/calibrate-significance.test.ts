import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  evaluateRuns,
  judgeInputFor,
  layerOneResults,
  renderTable,
  runOutcomes,
} from './calibrate-significance-score.mjs';

const rows = readFileSync(new URL('./fixtures/significance-labels.jsonl', import.meta.url), 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l));

const ok = (tier: number) => ({ status: 'ok', tier });

describe('significance fixtures', () => {
  it('parse with the expected shape and unique ids', () => {
    expect(rows.length).toBeGreaterThanOrEqual(95);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const row of rows) {
      expect(['IMPORTANT', 'MARGINAL', 'NOISE']).toContain(row.label);
      expect([1, 2, 3]).toContain(row.tier);
      expect(row.label === 'NOISE' ? row.tier === 3 : row.tier < 3).toBe(true);
      expect(row.headline.length).toBeGreaterThan(0);
      expect(row.rationale.length).toBeGreaterThan(0);
    }
  });

  it('layer 1 keeps every IMPORTANT item and holds most NOISE', () => {
    const rules = layerOneResults(rows);
    const important = rows.filter((_, i) => rows[i].label === 'IMPORTANT');
    expect(rows.every((r, i) => r.label !== 'IMPORTANT' || rules[i] === null)).toBe(true);
    expect(important.length).toBeGreaterThan(15);
    const noise = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.label === 'NOISE');
    expect(noise.filter(({ i }) => rules[i]).length / noise.length).toBeGreaterThanOrEqual(0.8);
  });

  it('builds a judge input with heat and facts', () => {
    const input = judgeInputFor(rows[0]);
    expect(input.heat).toBe(rows[0].heat);
    expect(input.facts.length).toBe(rows[0].facts.length);
  });
});

describe('acceptance', () => {
  const small = [
    { label: 'NOISE' }, { label: 'NOISE' }, { label: 'IMPORTANT' }, { label: 'IMPORTANT' },
  ];

  it('accepts when a rule or tier 3 holds the noise and the important items are kept', () => {
    const outcomes = runOutcomes(small, ['listicle', null, null, null], [null, ok(3), ok(1), ok(2)]);
    const evaluation = evaluateRuns([outcomes, outcomes, outcomes]);
    expect(evaluation.accepted).toBe(true);
    expect(renderTable({ m: evaluation })).toContain('YES');
  });

  it('rejects a run that keeps too much noise', () => {
    const outcomes = runOutcomes(small, [null, null, null, null], [ok(2), ok(3), ok(1), ok(2)]);
    expect(evaluateRuns([outcomes]).noiseOk).toBe(false);
  });

  it('rejects a run that holds an important item', () => {
    const outcomes = runOutcomes(small, [null, null, null, null], [ok(3), ok(3), ok(3), ok(2)]);
    expect(evaluateRuns([outcomes]).importantOk).toBe(false);
  });

  it('counts a deferred judge as held and fails acceptance', () => {
    const outcomes = runOutcomes(small, [null, null, null, null], [ok(3), ok(3), { status: 'deferred' }, ok(1)]);
    expect(outcomes[2]).toMatchObject({ held: true, deferred: true });
    expect(evaluateRuns([outcomes]).accepted).toBe(false);
  });
});
