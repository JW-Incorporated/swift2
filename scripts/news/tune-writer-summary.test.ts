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

describe('tone table', () => {
  const scored = (voice: number, grounding: number) => ({ voice, context: 4, grounding, non_repetition: 4 });
  const summary = summarizeRuns([
    { status: 'ok', judgeScores: scored(5, 4) },
    { status: 'hold', reason: 'writing_quality:uncited_sentence', gateReasons: ['uncited_sentence'], judgeScores: scored(2, 3) },
    { status: 'hold', reason: 'writing_quality:invalid_draft', gateReasons: ['x'] },
    { status: 'hold', reason: 'writing_quality:voice', judgeScores: scored(4, 5) },
  ]);

  it('counts voice >=4 and the median over every judged draft', () => {
    expect(summary.tone.voice).toEqual({ judged: 3, atLeast4: 2, median: 4 });
    expect(summary.tone.grounding).toEqual({ judged: 3, atLeast4: 2, median: 4 });
  });

  it('renders the Tone (all drafts) table', () => {
    const text = renderSummary(summary);
    expect(text).toContain('Tone (all drafts)');
    expect(text).toContain('| voice | 0 | 1 | 0 | 1 | 1 | 2/3 | 4 |');
    expect(text).toContain('| grounding | 0 | 0 | 1 | 1 | 1 | 2/3 | 4 |');
  });

  it('counts unjudgeable attempts', () => {
    const s = summarizeRuns([{ status: 'hold', reason: 'writing_quality:invalid_draft', unjudgeable: true }]);
    expect(s.unjudgeable).toBe(1);
    expect(renderSummary(s)).toContain('Unjudgeable (no usable lead and sentences): 1');
  });

  it('shows n/a with no judged drafts', () => {
    expect(renderSummary(summarizeRuns([{ status: 'hold', reason: 'writer_deferred' }]))).toContain('| voice | 0 | 0 | 0 | 0 | 0 | 0/0 | n/a |');
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
