// Deterministic catalog-fact match score (sibling of ./theory-match.ts —
// same "pure function, zero LLM calls, unit-testable without a DB"
// discipline). Checks a theory candidate's extracted `numeric_signals`
// (theory-types.ts's ExtractedFanTheory.numericSignals — numbers the fan
// discussion itself points to, e.g. a repeated punctuation count or an
// album-ordinal callout) against ./catalog-facts.ts's hand-maintained
// table of real catalog numbers.
//
// SCORING CHOICE (documented, not silent): this is a PRECISION score, not
// recall — the fraction of the candidate's own DISTINCT numbers that hit a
// catalog fact, not the fraction of catalog facts the candidate happened to
// cover. A theory that cites exactly one number and that number is a real
// catalog fact (today's worked example: "12th studio album") should score
// as strongly as one citing several, rather than being diluted for not
// also mentioning every other catalog fact. A theory padded with a long
// list of numbers where only one coincidentally matches scores
// proportionally lower — the fraction still measures "how much of what
// this theory pointed at was actually real", it just weights a single
// well-aimed reference higher than a scattershot list.
//
// WORKED EXAMPLE (today's live case): a theory citing "0 styled as ()", "12
// exclamation points", and "12th studio album" extracts to
// numeric_signals: [0, 12, 12]. Distinct signals: [0, 12]. Catalog facts
// (see catalog-facts.ts) include 12 (currentAlbumNumber AND
// currentAlbumTrackCount collapse to one number in the fact set) but not a
// bare 0. Hits: 1 of 2 distinct signals -> score 0.5 — a real, meaningful
// catalog hit, not a perfect one, which is the honest read: two of the
// theory's three raw mentions (both 12s) point at something real, the
// stylized-zero detail does not independently corroborate anything in this
// table.

import { CATALOG_FACTS, catalogFactNumbers, type CatalogFacts } from './catalog-facts';

/**
 * Returns 0..1: the fraction of `numericSignals`' DISTINCT values that
 * match a real catalog-facts number. Zero signals or zero catalog facts
 * both return 0 rather than dividing by zero or wrongly scoring an empty
 * theory as a match.
 */
export function symbolMatchScore(
  numericSignals: readonly number[],
  facts: CatalogFacts = CATALOG_FACTS,
): number {
  if (numericSignals.length === 0) return 0;
  const factNumbers = new Set(catalogFactNumbers(facts));
  if (factNumbers.size === 0) return 0;
  const distinct = [...new Set(numericSignals)];
  const hits = distinct.filter((n) => factNumbers.has(n)).length;
  return hits / distinct.length;
}
