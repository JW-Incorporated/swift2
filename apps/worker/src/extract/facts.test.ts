import { describe, expect, it } from 'vitest';
import { sanitizeResult } from './haiku-client';
import { isMetaFact, MAX_FACTS, sanitizeFacts } from './facts';

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

describe('meta facts', () => {
  it('drops a meta fact alongside two normal facts', () => {
    const out = sanitizeFacts([
      fact('Taylor wore a blue dress.'),
      fact('The fetched TMZ page contained no article body, quotes, or statements from Taylor\'s team'),
      fact('She arrived at 6 PM.'),
    ]);
    expect(out).toEqual([
      { id: 'f1', claim: 'Taylor wore a blue dress.', attribution: 'People', confidence: 'reported' },
      { id: 'f2', claim: 'She arrived at 6 PM.', attribution: 'People', confidence: 'reported' },
    ]);
  });

  it('keeps a normal fact', () => {
    const out = sanitizeFacts([fact('TMZ reports that Taylor paid Nelly $50,000')]);
    expect(out).toHaveLength(1);
    expect(out?.[0]?.claim).toBe('TMZ reports that Taylor paid Nelly $50,000');
  });

  it('keeps another normal fact', () => {
    const out = sanitizeFacts([fact('Neither source names a venue')]);
    expect(out).toHaveLength(1);
    expect(out?.[0]?.claim).toBe('Neither source names a venue');
  });

  it('returns [] when 2 of 3 facts are meta', () => {
    const out = sanitizeFacts([
      fact('This article has no statements'),
      fact('TMZ reports a payment'),
      fact('The page contained no quotes'),
    ]);
    expect(out).toEqual([]);
  });

  it('evaluates isMetaFact correctly', () => {
    expect(isMetaFact('This article has no statements')).toBe(true);
    expect(isMetaFact('Taylor played Nashville')).toBe(false);
  });

  it('returns 1 fact when single valid non-meta fact with no meta dropped', () => {
    const out = sanitizeFacts([fact('Taylor waved.')]);
    expect(out).toHaveLength(1);
  });
});
