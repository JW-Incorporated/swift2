import { describe, expect, it } from 'vitest';
import { contextFromText, renderSummary, sampleRows, summarizeRuns } from './tune-writer-summary.mjs';

describe('summarizeRuns', () => {
  const summary = summarizeRuns([
    { status: 'ok', judgeScores: { voice: 4, context: 4, grounding: 5, non_repetition: 4 } },
    { status: 'hold', reason: 'writing_quality:voice', judgeScores: { voice: 3, context: 4, grounding: 4, non_repetition: 4 } },
    { status: 'hold', reason: 'writing_quality:attribution_unknown_outlet', gateReasons: ['attribution_unknown_outlet'] },
  ]);

  it('counts passes and hold reasons', () => {
    expect(summary).toMatchObject({ total: 3, passed: 1 });
    expect(summary.holds).toEqual({ 'writing_quality:voice': 1, 'writing_quality:attribution_unknown_outlet': 1 });
    expect(summary.gateReasons).toEqual({ attribution_unknown_outlet: 1 });
  });

  it('builds the judge score histogram per dimension', () => {
    expect(summary.scores.voice).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 0 });
    expect(renderSummary(summary)).toContain('| voice | 0 | 0 | 1 | 1 | 0 |');
  });
});

describe('sampleRows', () => {
  const text = [1, 2, 3, 4].map((i) => JSON.stringify({ i })).join('\n');
  it('returns all rows without n and an even sample with n', () => {
    expect(sampleRows(text, 0)).toHaveLength(4);
    expect(sampleRows(text, 2).map((r: { i: number }) => r.i)).toEqual([1, 3]);
  });
});

describe('contextFromText', () => {
  it('splits [cN] lines into pack items', () => {
    const pack = contextFromText('[c1] One\n[c2] Two\nmore');
    expect(pack.items).toEqual([
      { id: 'c1', kind: 'prior', text: 'One' },
      { id: 'c2', kind: 'prior', text: 'Two\nmore' },
    ]);
  });
});
