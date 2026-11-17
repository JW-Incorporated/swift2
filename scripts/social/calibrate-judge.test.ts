import { describe, expect, it } from 'vitest';
import { deterministicFindings, evaluateDeterministic, evaluateModel, readRows, renderTable } from './calibrate-judge.mjs';

type Row = { id: string; platform: string; detGate?: boolean };
const gold: Row[] = readRows('gold.jsonl');
const negatives: Row[] = readRows('negatives.jsonl');

describe('judge-calibration/social fixtures', () => {
  it('has 8 gold captions and 6 negatives with the required defect kinds', () => {
    expect(gold).toHaveLength(8);
    expect(negatives.map((n) => n.id)).toEqual([
      'neg-formulaic-snake',
      'neg-product-announcement-decode',
      'neg-mean-take',
      'neg-smuggled-rumor',
      'neg-em-dash-heavy',
      'neg-tag-a-friend',
    ]);
    for (const row of [...gold, ...negatives]) expect(['x', 'instagram']).toContain(row.platform);
  });

  it('every gold caption passes the deterministic voice gates', () => {
    for (const row of gold) expect(deterministicFindings(row), row.id).toEqual([]);
  });

  it('every negative marked detGate fails a deterministic gate, and the judge-only ones are marked so', () => {
    const result = evaluateDeterministic(gold, negatives);
    expect(result.accepted).toBe(true);
    const byId = Object.fromEntries(result.negativeResults.map((r: { id: string; findings: string[] }) => [r.id, r.findings.length > 0]));
    expect(byId).toMatchObject({ 'neg-formulaic-snake': true, 'neg-em-dash-heavy': true, 'neg-tag-a-friend': true });
    expect(negatives.filter((n) => !n.detGate).map((n) => n.id)).toEqual(['neg-product-announcement-decode', 'neg-mean-take', 'neg-smuggled-rumor']);
  });
});

describe('evaluateModel', () => {
  const s = (v: number) => ({ onVoice: v, specific: v, formula: v, notEmbarrassed: v });
  const goodGold = [[{ status: 'ok', scores: s(4) }], [{ status: 'ok', scores: s(5) }]];
  const goodNeg = [{ status: 'ok', scores: { ...s(4), formula: 2 }, expectFailOn: 'formula' }];

  it('accepts when gold clears every dimension and negatives fall on the expected one', () => {
    expect(evaluateModel({ gold: goodGold, negatives: goodNeg }).accepted).toBe(true);
  });

  it('rejects a gold caption below 4, a negative that does not fall, and any deferral', () => {
    expect(evaluateModel({ gold: [[{ status: 'ok', scores: { ...s(5), specific: 3 } }]], negatives: goodNeg }).goldOk).toBe(false);
    expect(evaluateModel({ gold: goodGold, negatives: [{ status: 'ok', scores: s(5), expectFailOn: 'formula' }] }).negativesOk).toBe(false);
    expect(evaluateModel({ gold: goodGold, negatives: [{ status: 'ok', scores: { ...s(5), onVoice: 2 }, expectFailOn: 'formula' }] }).negativesOk).toBe(false);
    expect(evaluateModel({ gold: [[{ status: 'unavailable' }]], negatives: goodNeg }).accepted).toBe(false);
  });

  it('renders a verdict table', () => {
    expect(renderTable({ 'claude-opus-5-5': evaluateModel({ gold: goodGold, negatives: goodNeg }) })).toContain('ACCEPT');
  });
});
