/**
 * The ONE client-facing answer shape.
 *
 * Three producers converge here and the UI must render all of them
 * identically, because a user cannot tell (and should not have to care)
 * which path served their question:
 *
 *   - `ClownTake`      (clown-client.ts)   — the model path
 *   - `FallbackAnswer` (clown-fallback.ts) — the deterministic zero-model path,
 *                                            used for chip taps AND for the
 *                                            over-cap / model-down degrade
 *
 * Written as the integration contract for steps 8-10 after step 7 and step 9
 * independently grew different shapes for the same thing. Adapters live here
 * so neither producer imports the other, and so there is exactly one place to
 * look when the rendering and the data disagree.
 *
 * Do not add a second answer type. If a producer needs a field this does not
 * carry, widen this type.
 */
import type { ClownAnswer, ClownSegment, InvestigationStep } from '@swift2/shared';
import type { ClownTake } from './clown-client';
import type { FallbackAnswer, RetrievedItem } from './clown-fallback';

// The wire shapes (ClownAnswer and friends) live in `@swift2/shared`'s api/
// clown.ts — the one source of truth the native client also imports. Their
// field docs (segments are kept DISTINCT so the counterpoint stays visible;
// `delulu` is NULL on the zero-model paths and the UI must then render no
// delulu element; `investigation` is `[]` for every non-loop producer) are
// there too. Re-exported so every existing web import keeps working.
export type { ClownAnswer, ClownSegment, ClownSegmentRole, InvestigationStep } from '@swift2/shared';

/** Drop empty/whitespace-only segments so the bubble never renders a blank row. */
function compact(segments: ClownSegment[]): ClownSegment[] {
  return segments.filter((s) => s.text.trim().length > 0);
}

/**
 * Model path -> client shape.
 *
 * `sources` is passed in rather than read off the take: the take carries only
 * `citedIds`, and resolving those against the retrieved set is `clown-gate.ts`'s
 * job (it fails the answer outright if an id was never retrieved). By the time
 * we get here the ids are already validated, so this only maps them.
 */
export function answerFromTake(
  take: ClownTake,
  sources: RetrievedItem[],
  investigation: InvestigationStep[] = [],
): ClownAnswer {
  return {
    kind: 'take',
    theoryName: take.theoryName,
    segments: compact([
      { role: 'stance', text: take.stance },
      { role: 'argument', text: take.argument },
      { role: 'counterpoint', text: take.counterpoint },
      { role: 'aside', text: take.aside ?? '' },
    ]),
    delulu: take.delulu,
    sources,
    investigation,
  };
}

/**
 * Zero-model path -> client shape.
 *
 * Note `delulu: null` — see the field docs. This is the honest answer, not a
 * missing feature.
 */
export function answerFromFallback(fallback: FallbackAnswer): ClownAnswer {
  return {
    kind: 'fallback',
    theoryName: null,
    segments: compact([{ role: 'plain', text: fallback.text }]),
    delulu: null,
    sources: fallback.items,
    investigation: [],
  };
}
