import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  evaluateRuns,
  evaluateSets,
  judgeInputFor,
  layerOneResults,
  normalizeRow,
  renderTable,
  runOutcomes,
} from './calibrate-significance-score.mjs';

const read = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
  .split('\n').filter(Boolean).map((l) => normalizeRow(JSON.parse(l)));
const rows = read('significance-labels.jsonl');
const holdout = read('significance-holdout.jsonl');

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

  it('carries the three adversarial NOISE rows and one wedding row', () => {
    const adversarial = rows.filter((r) => r.id.startsWith('adv-'));
    expect(adversarial).toHaveLength(3);
    expect(adversarial.every((r) => r.label === 'NOISE')).toBe(true);
    expect(rows.filter((r) => /(wed|marry) at Madison Square Garden/.test(r.headline))).toHaveLength(1);
  });

  it('layer 1 keeps every IMPORTANT item and holds most NOISE', () => {
    const rules = layerOneResults(rows);
    expect(rows.every((r, i) => r.label !== 'IMPORTANT' || rules[i] === null)).toBe(true);
    expect(rows.filter((r) => r.label === 'IMPORTANT').length).toBeGreaterThan(10);
    const noise = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.label === 'NOISE');
    expect(noise.filter(({ i }) => rules[i]).length / noise.length).toBeGreaterThanOrEqual(0.7);
  });

  it('builds a judge input with heat and facts', () => {
    const input = judgeInputFor(rows[0]);
    expect(input.heat).toBe(rows[0].heat);
    expect(input.facts.length).toBe(rows[0].facts.length);
  });
});

describe('held-out set', () => {
  it('has the expected label mix and a normalized source from the outlet', () => {
    expect(holdout).toHaveLength(30);
    expect(holdout.filter((r) => r.label === 'IMPORTANT')).toHaveLength(8);
    expect(holdout.filter((r) => r.label === 'NOISE')).toHaveLength(14);
    const billboard = holdout.find((r) => r.outlet === 'Billboard');
    expect(billboard?.sources[0]).toMatchObject({ name: 'Billboard', tier: 'established' });
    expect(holdout.find((r) => r.outlet === 'TMZ')?.sources[0].tier).toBe('unverified');
    expect(judgeInputFor(billboard!).sources).toEqual(['Billboard']);
  });

  it('layer 1 does not hold any IMPORTANT item', () => {
    const rules = layerOneResults(holdout);
    expect(holdout.every((r, i) => r.label !== 'IMPORTANT' || rules[i] === null)).toBe(true);
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
    expect(renderTable({ m: evaluateSets({ fixture: [outcomes], holdout: [outcomes] }) })).toContain('YES');
  });

  it('requires both sets to pass and reports them separately', () => {
    const good = runOutcomes(small, [null, null, null, null], [ok(3), ok(3), ok(1), ok(2)]);
    const bad = runOutcomes(small, [null, null, null, null], [ok(2), ok(3), ok(1), ok(2)]);
    const result = evaluateSets({ fixture: [good], holdout: [bad] });
    expect(result.fixture.accepted).toBe(true);
    expect(result.holdout.accepted).toBe(false);
    expect(result.accepted).toBe(false);
    const table = renderTable({ m: result });
    expect(table).toContain('| m | fixture |');
    expect(table).toContain('| m | holdout |');
    expect(table).toContain('deferred NOISE row counts as held');
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
    const noiseDeferred = runOutcomes(small, [null, null, null, null], [{ status: 'deferred' }, ok(3), ok(1), ok(2)]);
    expect(noiseDeferred[0]).toMatchObject({ held: true, deferred: true });
    expect(evaluateRuns([noiseDeferred]).noiseOk).toBe(true);
    expect(evaluateRuns([noiseDeferred]).accepted).toBe(false);
  });
});
