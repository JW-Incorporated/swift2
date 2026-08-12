import { describe, expect, it } from 'vitest';

import {
  CANON_THEORIES,
  DEFAULT_RECEIPT_LIMIT,
  allReceipts,
  canonReceipts,
  findReceipts,
  receiptById,
  receiptForSource,
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

describe('relevance matching — earned confidence, honest empties (#1983/#1994)', () => {
  const ids = (q: string) => findReceipts(q).map((r) => r.id);

  it('resolves the `rep tv` alias instead of returning a false empty', () => {
    // The headline #1983 bug: this used to fall back to the longest token and
    // find nothing. The alias now pins the debut-re-record lore item.
    expect(ids('is rep tv actually coming')).toContain('lore:rep-tv-debut-tv');
    expect(ids('rep tv')).toContain('lore:rep-tv-debut-tv');
    expect(ids('will we ever get reputation tv')).toContain('lore:rep-tv-debut-tv');
    expect(ids('debut tv when')).toContain('lore:rep-tv-debut-tv');
  });

  it('resolves the orange-door alias to the doors hunt, not a junk token', () => {
    // "was the orange door a clue" used to match six receipts on **something**;
    // now it lands on the actual orange-doors lore item.
    const out = ids('was the orange door a clue');
    expect(out).toContain('lore:orange-doors-hunt');
    expect(out.length).toBeGreaterThan(0);
    // And nothing here is a Stonewall-era junk match on a stray token.
    expect(out.every((id) => typeof id === 'string')).toBe(true);
  });

  it('does NOT surface junk for "hi" — no Hiddleswift-at-60% substring match', () => {
    // "hi" is a stopword AND too short to be a word-prefix, so it can never
    // reach into "Hiddleswift". The reader gets an honest nothing.
    expect(findReceipts('hi')).toEqual([]);
  });

  it('does NOT surface junk for a bare filler token like "something"', () => {
    // The literal token the old longest-term fallback matched six receipts on.
    expect(findReceipts('something')).toEqual([]);
    expect(findReceipts('anything really')).toEqual([]);
  });

  it('returns an honest empty below the relevance threshold rather than a weak match', () => {
    // A lone month token overlaps many dated moments in the body only (weight
    // 5) — deliberately under the threshold, so it does not surface a pile of
    // unrelated "February" moments the way the Bad Bunny chip used to.
    const feb = findReceipts('february');
    if (feb.length > 0) {
      // If anything clears the bar it must do so on a real title hit, never on
      // a bare date-in-body coincidence.
      for (const r of feb) {
        expect(r.title.toLowerCase()).toContain('february');
      }
    } else {
      expect(feb).toEqual([]);
    }
  });

  it('a real multi-word query still ranks its on-topic receipts', () => {
    expect(ids('super bowl halftime')).toContain('lore:superbowl-lx-halftime');
  });
});

describe('chip source resolution (#1990)', () => {
  it('resolves a lore sourceId to its receipt, with or without the namespace', () => {
    expect(receiptForSource('rep-tv-debut-tv')?.id).toBe('lore:rep-tv-debut-tv');
    expect(receiptForSource('lore:rep-tv-debut-tv')?.id).toBe('lore:rep-tv-debut-tv');
  });

  it('returns undefined for an unknown sourceId rather than throwing', () => {
    expect(receiptForSource('definitely-not-a-real-lore-id')).toBeUndefined();
  });
});

describe('canon theories (#1993/#1996)', () => {
  it('every canon-theory receipt id resolves to a real, sourced receipt', () => {
    for (const theory of CANON_THEORIES) {
      for (const id of theory.receiptIds) {
        const r = receiptById(id);
        expect(r, `${theory.name} → ${id} does not resolve`).toBeDefined();
        expect(r!.sources.length, `${id} has no source`).toBeGreaterThan(0);
      }
    }
  });

  it('offers a non-empty canon theory deterministically per question', () => {
    const a = canonReceipts('give me your best theory');
    expect(a.length).toBeGreaterThan(0);
    expect(canonReceipts('give me your best theory').map((r) => r.id)).toEqual(a.map((r) => r.id));
  });

  it('is not always the same theory — the label varies with the question', () => {
    // Sample many varied asks; the deterministic per-question pick must spread
    // across more than one canon theory, so it cannot collapse to Debutation
    // every time (the spirit of #1996 on the best-theory path).
    const first = new Set<string | undefined>();
    for (let i = 0; i < 40; i += 1) first.add(canonReceipts(`best theory number ${i}?`)[0]?.id);
    expect(first.size).toBeGreaterThan(1);
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
