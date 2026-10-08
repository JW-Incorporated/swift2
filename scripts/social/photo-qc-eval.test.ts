import { describe, expect, it } from 'vitest';
import { summarize } from './photo-qc-eval.mjs';

describe('summarize', () => {
  it('builds the confusion matrix, accuracy and the false-keep list', () => {
    const rows = [
      { id: 'a', label: 'keep', keep: true, reason: '' },
      { id: 'b', label: 'keep', keep: false, reason: 'dark' },
      { id: 'c', label: 'drop', keep: true, reason: 'looks fine' },
      { id: 'd', label: 'drop', keep: false, reason: '' },
    ];
    const s = summarize(rows);
    expect(s).toMatchObject({
      trueKeep: 1,
      falseReject: 1,
      falseKeep: 1,
      trueDrop: 1,
      accuracy: 0.5,
      falseKeepRate: 0.5,
    });
    expect(s.falseKeeps).toEqual([{ id: 'c', reason: 'looks fine' }]);
    expect(s.falseRejects).toEqual([{ id: 'b', reason: 'dark' }]);
  });
});
