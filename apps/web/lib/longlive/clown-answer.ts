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
import type { ClownTake } from './clown-client';
import type { FallbackAnswer, RetrievedItem } from './clown-fallback';

/**
 * A labelled piece of prose. The bubble renders segments in array order.
 *
 * `stance` / `argument` / `counterpoint` are kept as DISTINCT segments rather
 * than pre-joined into one string on purpose: the counterpoint is the half
 * that keeps the bot honest — it is where the answer argues against itself —
 * and flattening it into a paragraph is how it quietly stops being visible.
 * The renderer may style them differently; it may not drop one.
 */
export type ClownSegmentRole =
  | 'stance'
  | 'argument'
  | 'counterpoint'
  | 'aside'
  /** Fallback prose, which has no rhetorical structure to label. */
  | 'plain';

export interface ClownSegment {
  role: ClownSegmentRole;
  text: string;
}

/**
 * One tool call the agent loop (clown-agent.ts, PLAN.md Stage 10) made while
 * investigating a question, in the order it happened. Rendered to the reader
 * so the trail is transparent, not just internal telemetry — "what the bot
 * looked up and found." Always `[]` for the fallback/chip/degraded/refusal
 * producers below: nothing investigated, nothing to show.
 */
export interface InvestigationStep {
  /** The tool name, exactly as sent on the wire (e.g. 'search', 'precedents'). */
  tool: string;
  /** The arguments the model supplied, already validated. */
  input: Record<string, unknown>;
  /** One line, our words: what the call found. Never the raw row payload. */
  summary: string;
}

export interface ClownAnswer {
  /** Which path produced this. Drives nothing user-visible except analytics. */
  kind: 'take' | 'fallback';
  /** Canonical theory name where one applies (see clown-names.ts). */
  theoryName: string | null;
  segments: ClownSegment[];
  /**
   * 0..5, or NULL.
   *
   * Null is load-bearing: the fallback path has no model, so nothing scored
   * the ambition of the claim. Rendering a fabricated 0 (or a cheerful 3)
   * there would invent a judgement no one made. The UI must render no delulu
   * element at all when this is null rather than substituting a default.
   */
  delulu: number | null;
  /** The corpus items this answer is allowed to have leaned on. */
  sources: RetrievedItem[];
  /** The agent loop's tool-call trail, in order. `[]` for every non-loop producer. */
  investigation: InvestigationStep[];
}

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
