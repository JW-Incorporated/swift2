import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RECEIPT_LIMIT,
  allReceipts,
  findReceipts,
  receiptById,
  receiptsForPrompt,
} from './clownbot-receipts';

describe('the receipt corpus', () => {
  it('spans moments, theories and lore', () => {
    const kinds = new Set(allReceipts().map((r) => r.kind));
    expect(kinds).toContain('moment');
    expect(kinds).toContain('theory');
    expect(kinds).toContain('lore');
  });

  it('is large — this corpus is the differentiator', () => {
    expect(allReceipts().length).toBeGreaterThan(700);
  });

  it('has unique namespaced ids', () => {
    const all = allReceipts();
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('memoises', () => {
    expect(allReceipts()).toBe(allReceipts());
  });

  it('resolves by id', () => {
    const first = allReceipts()[0];
    expect(receiptById(first.id)?.id).toBe(first.id);
    expect(receiptById('moment:definitely-not-real')).toBeUndefined();
  });
});

describe('retrieval is deterministic and bounded', () => {
  it('finds real vault material for a real query', () => {
    const out = findReceipts('reputation');
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(DEFAULT_RECEIPT_LIMIT);
  });

  it('returns the same results for the same query', () => {
    expect(findReceipts('folklore').map((r) => r.id)).toEqual(
      findReceipts('folklore').map((r) => r.id),
    );
  });

  it('honours the limit', () => {
    expect(findReceipts('the', 3).length).toBeLessThanOrEqual(3);
  });

  it('returns nothing for an empty query rather than padding', () => {
    expect(findReceipts('')).toEqual([]);
    expect(findReceipts('   ')).toEqual([]);
  });

  it('returns nothing rather than junk for gibberish', () => {
    expect(findReceipts('zzzxqyw qqqjjjkkk')).toEqual([]);
  });

  it('relaxes to the strongest term when the full AND finds nothing', () => {
    // "reputation" matches plenty; the nonsense word does not. The relaxed
    // pass should still find the reputation material.
    const out = findReceipts('reputation zzzxqyw');
    expect(out.length).toBeGreaterThan(0);
  });

  it('surfaces live lore for a lore-shaped query', () => {
    const out = findReceipts('masters buyback shamrock');
    expect(out.some((r) => r.id === 'lore:masters-buyback')).toBe(true);
  });
});

describe('what crosses the boundary to the model', () => {
  it('serialises id, date, status and one line — and nothing else', () => {
    const out = receiptsForPrompt(findReceipts('masters buyback shamrock', 2));
    expect(out).toContain('[lore:masters-buyback]');
    // No URLs cross the boundary: the model has no business citing a link it
    // cannot verify, and the route attaches the real sources afterwards.
    expect(out).not.toContain('https://');
  });

  it('produces one line per receipt', () => {
    const receipts = findReceipts('reputation', 3);
    expect(receiptsForPrompt(receipts).split('\n').length).toBe(receipts.length);
  });

  it('handles an empty set', () => {
    expect(receiptsForPrompt([])).toBe('');
  });
});
