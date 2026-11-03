// Pass A fact validation: drops malformed entries, never throws. Ids are
// re-issued f1..fN in order so the writer's citations can rely on them.

import { FACT_CONFIDENCES } from './types';
import type { ExtractedFact, FactConfidence } from './types';

export const MAX_FACTS = 8;

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
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const p = raw as Record<string, unknown>;
    const claim = clean(p.claim, 300);
    const attribution = clean(p.attribution, 80);
    if (!claim || !attribution) continue;
    if (!FACT_CONFIDENCES.includes(p.confidence as FactConfidence)) continue;
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
  return facts;
}
