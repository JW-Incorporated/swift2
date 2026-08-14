/**
 * Clownbot (build B) — GATE 2, the post-generation output re-screen.
 *
 * PLAN.md Step 7. Runs over everything `clown-client.ts` produced, AFTER
 * generation and BEFORE a reader sees a word of it. Two independent checks,
 * either one discards the whole answer:
 *
 *  1. THE DETERMINISTIC CONTENT SCREEN — reuses `screenOutput()` from
 *     `clown-safety.ts` (which itself composes `clown-blocklist.ts`'s topic
 *     gates), unmodified. This file writes NO phrase lists of its own and
 *     imports the safety module rather than re-deriving any part of it — see
 *     CLAUDE.md's instruction not to weaken, duplicate, or reimplement it.
 *
 *  2. THE CITATION CHECK — a citation to an id the retrieval step never
 *     handed the model is a fabrication, full stop. `clown-client.ts`'s
 *     system prompt already tells the model to cite only supplied ids, but
 *     the prompt is not the enforcement layer (same principle as the content
 *     screen above): this checks the model's actual `citedIds` against the
 *     actual retrieved set and FAILS THE WHOLE ANSWER on any mismatch, rather
 *     than silently dropping the bad id (build A's `clownbot`
 *     `validateCited()` silently filtered; this rebuild's stricter posture —
 *     PLAN.md Step 7's brief — is that a fabricated citation invalidates the
 *     take that made it, not just the one citation).
 */

import { screenOutput, type Redline } from './clown-safety';
import type { ClownTake } from './clown-client';

/**
 * Minimal shape this file needs from a retrieved corpus item — decoupled from
 * `clown-index.ts`'s `ClownDoc` (same pattern as `clown-names.ts`'s
 * `NamedReceipt`). Any retrieved item with an `id` satisfies it.
 */
export interface GateRetrievedItem {
  id: string;
}

export type GateRejection =
  | { kind: 'redline'; category: Redline }
  | { kind: 'fabrication'; citedId: string };

/**
 * Re-screen a `ClownTake` before it reaches a reader.
 *
 * Returns the rejection reason, or `null` to let the take through unchanged.
 * Checks the content screen FIRST (it is the graver failure mode — a
 * boundary violation vs. a bad citation) so a take that trips both reports
 * the more protective reason.
 */
export function screenClownTake(
  take: ClownTake,
  retrieved: readonly GateRetrievedItem[],
): GateRejection | null {
  const parts = [take.stance, take.argument, take.counterpoint, take.aside, take.theoryName ?? undefined];
  const redline = screenOutput(parts);
  if (redline) return { kind: 'redline', category: redline };

  const retrievedIds = new Set(retrieved.map((item) => item.id));
  for (const citedId of take.citedIds) {
    if (!retrievedIds.has(citedId)) return { kind: 'fabrication', citedId };
  }

  return null;
}
