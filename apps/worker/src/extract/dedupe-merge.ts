import { sameClaim } from './dedupe-shortlist';
import type { ExtractedFact } from './types';
import type { ClusterSource } from './write-knowledge';

export interface MergedFactsResult {
  needsRewrite: true;
  mergedFacts: ExtractedFact[];
  addedFacts: ExtractedFact[];
  mergedSources: ClusterSource[];
}

function stripId(fact: ExtractedFact): Omit<ExtractedFact, 'id'> {
  return { claim: fact.claim, attribution: fact.attribution, confidence: fact.confidence };
}

/** v2 merge: no prose is touched. The duplicate's facts that the original does
 * not already state (exact normalized claim or token Jaccard >= 0.8) are
 * appended to the original's facts (ids re-issued f1..fN), and sources are
 * unioned deduped by URL and by outlet. The caller re-runs the writer once
 * from `mergedFacts`. */
export function mergeFactLists(
  originalFacts: readonly ExtractedFact[],
  newFacts: readonly ExtractedFact[],
  originalSources: readonly ClusterSource[],
  newSources: readonly ClusterSource[],
): MergedFactsResult {
  const kept: Omit<ExtractedFact, 'id'>[] = originalFacts.map(stripId);
  const added: Omit<ExtractedFact, 'id'>[] = [];
  for (const fact of newFacts) {
    const rest = stripId(fact);
    const known = [...kept, ...added].some((existing) => sameClaim(existing.claim, rest.claim));
    if (!known) added.push(rest);
  }
  const reissue = (facts: Omit<ExtractedFact, 'id'>[], offset: number): ExtractedFact[] => (
    facts.map((fact, index) => ({ id: `f${offset + index + 1}`, ...fact }))
  );
  const mergedFacts = reissue([...kept, ...added], 0);
  const addedFacts = mergedFacts.slice(kept.length);

  const urls = new Set(originalSources.map((source) => source.url));
  const outletKey = (source: ClusterSource) => (source.outletName ?? '').trim().toLowerCase();
  const outlets = new Set(originalSources.map(outletKey).filter(Boolean));
  const mergedSources: ClusterSource[] = [...originalSources];
  for (const source of newSources) {
    const outlet = outletKey(source);
    if (urls.has(source.url) || (outlet && outlets.has(outlet))) continue;
    urls.add(source.url);
    if (outlet) outlets.add(outlet);
    mergedSources.push(source);
  }
  return { needsRewrite: true, mergedFacts, addedFacts, mergedSources };
}
