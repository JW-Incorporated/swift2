/**
 * Clownbot — the grounding check (PLAN.md Stage 12, proposal §7 eval bullet
 * item 4): "a grounding check on every cited id" — catches a hallucinated
 * citation the fabrication check inside `clown-gate.ts`'s `screenClownTake`
 * (in-run, against the loop's OWN retrieved pool) cannot see: a citation that
 * looks legitimate inside a single run but points at a `knowledge_doc` row
 * that either doesn't exist in the store at all, or exists but is not
 * `redline_ok = true` (screened out, never meant to reach a reader). Pure and
 * deterministic — no DB call itself; the caller (`clown-eval.mjs`, a live/DB
 * script) builds `store` from a real query and hands it in here.
 */

/** Minimal shape this module needs from a `knowledge_doc` row lookup — kept
 * narrow rather than importing the full `KnowledgeDoc` type, since a caller
 * building this from a raw SQL row only has these two columns to hand. */
export interface GroundingStoreRow {
  redlineOk: boolean;
}

export type GroundingReason = 'missing' | 'not-redline-ok';

export interface GroundingProblem {
  id: string;
  reason: GroundingReason;
}

export interface GroundingResult {
  ok: boolean;
  problems: GroundingProblem[];
}

/**
 * Checks every id in `citedIds` against `store` (a lookup of what actually
 * exists, built by the caller from a real query). An id absent from `store`
 * is `'missing'` (hallucinated — never existed, or was excluded from the
 * query entirely); an id present but `redlineOk: false` is `'not-redline-ok'`
 * (a real row, but one that failed screening and should never have been
 * citable). Duplicate ids in `citedIds` are checked once each, in order —
 * never deduped silently, so a caller printing `problems` sees every offending
 * citation as the model actually wrote it.
 */
export function groundCitations(
  citedIds: readonly string[],
  store: ReadonlyMap<string, GroundingStoreRow>,
): GroundingResult {
  const problems: GroundingProblem[] = [];
  for (const id of citedIds) {
    const row = store.get(id);
    if (!row) {
      problems.push({ id, reason: 'missing' });
      continue;
    }
    if (!row.redlineOk) {
      problems.push({ id, reason: 'not-redline-ok' });
    }
  }
  return { ok: problems.length === 0, problems };
}
