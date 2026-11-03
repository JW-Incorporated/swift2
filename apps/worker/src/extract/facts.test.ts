import { describe, expect, it } from 'vitest';
import { sanitizeResult } from './haiku-client';
import { MAX_FACTS, sanitizeFacts } from './facts';

const fact = (claim: string, extra: Record<string, unknown> = {}) => ({
  id: 'x',
  claim,
  attribution: 'People',
  confidence: 'reported',
  ...extra,
});

describe('sanitizeFacts', () => {
  it('returns undefined when facts is absent or not an array', () => {
    expect(sanitizeFacts(undefined)).toBeUndefined();
    expect(sanitizeFacts('nope')).toBeUndefined();
  });

  it('allows an empty array', () => {
    expect(sanitizeFacts([])).toEqual([]);
  });

  it('drops malformed entries and re-issues ids in order', () => {
    const out = sanitizeFacts([
      fact('Taylor attended the premiere.'),
      null,
      fact('', {}),
      fact('No attribution.', { attribution: ' ' }),
      fact('Bad confidence.', { confidence: 'certain' }),
      fact('A venue statement said doors open at 7.', { attribution: 'official', confidence: 'confirmed' }),
    ]);
    expect(out).toEqual([
      { id: 'f1', claim: 'Taylor attended the premiere.', attribution: 'People', confidence: 'reported' },
      { id: 'f2', claim: 'A venue statement said doors open at 7.', attribution: 'official', confidence: 'confirmed' },
    ]);
  });

  it('drops duplicate claims and caps at the maximum', () => {
    expect(sanitizeFacts([fact('Same.'), fact('same.')])).toHaveLength(1);
    const many = Array.from({ length: 12 }, (_, i) => fact(`Claim ${i}.`));
    expect(sanitizeFacts(many)).toHaveLength(MAX_FACTS);
  });
});

describe('sanitizeResult facts', () => {
  const base = {
    observed_on: '2026-11-01',
    category: 'sighting',
    headline: 'h',
    summary: 's',
    detail: 'd',
    status_hint: 'reported',
  };

  it('carries validated facts on the current item', () => {
    const r = sanitizeResult({
      kind: 'current_item',
      redline_flags: [],
      current_item: { ...base, facts: [fact('One.')] },
    });
    expect(r.currentItem?.facts).toEqual([
      { id: 'f1', claim: 'One.', attribution: 'People', confidence: 'reported' },
    ]);
  });

  it('leaves facts off entirely when the model sent none', () => {
    const r = sanitizeResult({ kind: 'current_item', redline_flags: [], current_item: base });
    expect(r.currentItem).toBeDefined();
    expect('facts' in (r.currentItem ?? {})).toBe(false);
  });
});
