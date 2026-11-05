import { describe, expect, it, vi } from 'vitest';
import { replayWriter, runOne } from './tune-writer.mjs';

const row = {
  facts: [{ id: 'f1' }],
  contextText: '[c1] Era seed.',
};
const draft = (lead: string, ref: string) => ({ lead, paragraphs: [{ sentences: [{ text: 'One sentence.', refs: [ref] }] }] });

describe('replayWriter', () => {
  it('replays a supplied draft through the production validation', async () => {
    const result = await replayWriter(draft('Too short', 'f1'), row)();
    expect(result.status).toBe('invalid');
    expect(result.reasons.some((r: string) => r.includes('lead is 9 characters'))).toBe(true);
  });

  it('rejects a ref that is not a provided fact or context id', async () => {
    const result = await replayWriter(draft('x'.repeat(250), 'f9'), row)();
    expect(result.reasons).toContain('ref f9 is not a provided fact or context id');
  });
});

describe('runOne --judge-all', () => {
  const sentences = Array.from({ length: 10 }, (_, i) => `Sentence number ${i} says something specific about the Nashville studio visit on Tuesday.`);
  const kitRow = {
    kitId: 'k1',
    headline: 'Taylor spotted outside a Nashville studio',
    statusHint: 'reported',
    observedOn: '2026-11-02',
    facts: [{ id: 'f1', claim: 'Taylor was photographed outside Blackbird Studio.', attribution: 'People', confidence: 'reported' }],
    contextText: '[c1] Last autumn the album rollout began quietly.',
  };
  const gateFailing = {
    lead: 'x'.repeat(250),
    paragraphs: [
      { sentences: sentences.slice(0, 5).map((text) => ({ text, refs: [] })) },
      { sentences: sentences.slice(5).map((text) => ({ text, refs: [] })) },
    ],
  };
  const scores = { voice: 2, context: 4, grounding: 3, non_repetition: 4 };
  const verdict = { status: 'ok', pass: false, writingScore: 3, scores, reasons: { voice: 'flat', context: '', grounding: '', non_repetition: '' } };
  const stores = {};

  it('records judge scores on a gate-failed draft that is still a hold', async () => {
    const judgeFn = vi.fn(async () => verdict);
    const result = await runOne(stores, kitRow, { draft: gateFailing, judgeAll: true, judgeFn });
    expect(result.status).toBe('hold');
    expect(result.gateReasons?.length).toBeGreaterThan(0);
    expect(result.judgeScores).toEqual(scores);
    expect(judgeFn).toHaveBeenCalledTimes(1);
  });

  it('skips the judge for a gate-failed draft without the flag', async () => {
    const judgeFn = vi.fn(async () => verdict);
    const result = await runOne(stores, kitRow, { draft: gateFailing, judgeFn });
    expect(result.status).toBe('hold');
    expect(result.judgeScores).toBeUndefined();
    expect(judgeFn).not.toHaveBeenCalled();
  });
});
