// Pass A fact validation: drops malformed entries, never throws. Ids are
// re-issued f1..fN in order so the writer's citations can rely on them.
// Meta facts (about the fetch or the page, not the event) are dropped; if that
// leaves fewer than 2, the list is empty so the caller treats it as no_facts.

import { FACT_CONFIDENCES } from './types';
import type { ExtractedFact, FactConfidence } from './types';

export const MAX_FACTS = 8;

/** A claim about the fetch, the page or missing content rather than the event. */
export const META_FACT_RE = /\b(fetched|page contained|article (body|text)|no (quotes|statements)|this (page|article))\b/i;
export function isMetaFact(claim: string): boolean {
  return META_FACT_RE.test(claim);
}

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Returns undefined when the model sent no `facts` array at all (so the
 * result stays additive); an array (possibly empty) otherwise. */
export function sanitizeFacts(value: unknown): ExtractedFact[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const facts: ExtractedFact[] = [];
  let droppedMeta = false;
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const p = raw as Record<string, unknown>;
    const claim = clean(p.claim, 300);
    const attribution = clean(p.attribution, 80);
    if (!claim || !attribution) continue;
    if (!FACT_CONFIDENCES.includes(p.confidence as FactConfidence)) continue;
    if (isMetaFact(claim)) {
      droppedMeta = true;
      continue;
    }
    const key = claim.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({
      id: `f${facts.length + 1}`,
      claim,
      attribution,
      confidence: p.confidence as FactConfidence,
    });
    if (facts.length >= MAX_FACTS) break;
  }
  if (droppedMeta && facts.length < 2) return [];
  return facts;
}
