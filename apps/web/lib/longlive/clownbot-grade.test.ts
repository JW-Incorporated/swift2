import { describe, expect, it } from 'vitest';

import {
  CONFIDENCE_CEILING,
  MAX_DELULU,
  MAX_EVIDENCE,
  deriveConfidence,
  gradeTheory,
  scoreEvidence,
} from './clownbot-grade';
import type { Receipt } from './clownbot-receipts';

function receipt(over: Partial<Receipt> = {}): Receipt {
  return {
    id: 'lore:x',
    kind: 'lore',
    date: '2025-01-01',
    dateLabel: '2025-01-01',
    title: 'A thing',
    detail: 'It happened.',
    sources: [{ name: 'Outlet', url: 'https://example.com' }],
    status: 'confirmed',
    eraId: null,
    ...over,
  };
}

describe('evidence is computed, never claimed', () => {
  it('scores zero with no receipts and says so out loud', () => {
    const { score, rationale } = scoreEvidence([]);
    expect(score).toBe(0);
    expect(rationale).toContain('vibes');
  });

  it('rises with distinct verified receipts', () => {
    const one = scoreEvidence([receipt({ id: 'a' })]).score;
    const three = scoreEvidence([
      receipt({ id: 'a' }),
      receipt({ id: 'b' }),
      receipt({ id: 'c' }),
    ]).score;
    expect(three).toBeGreaterThan(one);
  });

  it('never exceeds the maximum however many receipts are cited', () => {
    const many = Array.from({ length: 20 }, (_, i) => receipt({ id: `r${i}` }));
    expect(scoreEvidence(many).score).toBeLessThanOrEqual(MAX_EVIDENCE);
  });

  it('caps at 1 when any cited receipt is debunked', () => {
    const { score, rationale } = scoreEvidence([
      receipt({ id: 'a' }),
      receipt({ id: 'b' }),
      receipt({ id: 'c', status: 'debunked' }),
    ]);
    expect(score).toBe(1);
    expect(rationale).toContain('debunked');
  });

  it('gives no strong-source bonus to an unsourced record', () => {
    const sourced = scoreEvidence([receipt({ id: 'a' })]).score;
    const unsourced = scoreEvidence([receipt({ id: 'a', sources: [] })]).score;
    expect(sourced).toBeGreaterThan(unsourced);
  });
});

describe('the model cannot inflate its own evidence score', () => {
  it('ignores anything the model might claim — evidence comes from receipts only', () => {
    // gradeTheory takes delulu from the model and NOTHING else. Whatever a
    // jailbroken model puts in its other fields, this number is ours.
    const withReceipts = gradeTheory([receipt({ id: 'a' }), receipt({ id: 'b' })], 5);
    const without = gradeTheory([], 5);
    expect(withReceipts.evidence).toBeGreaterThan(without.evidence);
    expect(without.evidence).toBe(0);
  });

  it('clamps a hostile delulu value', () => {
    expect(gradeTheory([], 9999).delulu).toBe(MAX_DELULU);
    expect(gradeTheory([], -50).delulu).toBe(0);
    expect(gradeTheory([], 'wig' as unknown).delulu).toBe(3);
    expect(gradeTheory([], null).delulu).toBe(3);
    expect(gradeTheory([], Number.NaN).delulu).toBe(3);
  });
});

describe('confidence never manufactures certainty (research finding #6)', () => {
  it('is capped below 100 even at maximum evidence and zero delulu', () => {
    expect(deriveConfidence(MAX_EVIDENCE, 0)).toBeLessThanOrEqual(CONFIDENCE_CEILING);
    expect(deriveConfidence(MAX_EVIDENCE, 0)).toBeLessThan(100);
  });

  it('never goes negative', () => {
    expect(deriveConfidence(0, MAX_DELULU)).toBeGreaterThan(0);
  });

  it('rises with evidence and falls with delulu', () => {
    expect(deriveConfidence(4, 1)).toBeGreaterThan(deriveConfidence(1, 1));
    expect(deriveConfidence(4, 1)).toBeGreaterThan(deriveConfidence(4, 4));
  });

  it('no reachable grade reports certainty', () => {
    for (let e = 0; e <= MAX_EVIDENCE; e += 1) {
      for (let d = 0; d <= MAX_DELULU; d += 1) {
        expect(gradeTheory(Array.from({ length: e }, (_, i) => receipt({ id: `r${i}` })), d).confidence).toBeLessThan(
          100,
        );
      }
    }
  });
});

describe('labels', () => {
  it('labels every delulu level', () => {
    for (let d = 0; d <= MAX_DELULU; d += 1) {
      expect(gradeTheory([], d).label.length).toBeGreaterThan(3);
    }
  });
});
