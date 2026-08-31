// Hard ceilings on paid-model spend for the appearance-discovery fast lane
// (2026-08-31, codex review round 2/3, kanban t_ac1281ef).
//
// `--max` (discover.mjs's per-run file cap) is a `workflow_dispatch` input a
// human can set to any positive integer, and — since the real photo-content
// verification gate landed (PR #3613) — every candidate this run considers
// now also spends up to 2 paid claude-sonnet-5 vision calls (one per
// thumbnail URL, see fetchAppearanceThumbnail in social-draft.mjs).
// CLAUDE.md ("Cost discipline") requires any product LLM call to be
// worker-side and HARD-capped, not bounded only by an operator-settable
// input. This is a separate module (not inlined in discover.mjs) so it can
// be unit-tested without importing discover.mjs, which runs its `main()` as
// a side effect of module load.

// 25 is well above the scheduled-run default (10) and the observed
// realistic daily volume (14 channels, twice a day), so it never
// constrains normal operation — it only stops an accidental/malicious huge
// manual dispatch from turning into an unbounded vision-call bill.
export const HARD_MAX_PER_RUN = 25;

/** Clamp a requested `--max` to the hard ceiling. Pure, no side effects. */
export function clampMaxPerRun(requested, hardMax = HARD_MAX_PER_RUN) {
  return Math.min(requested, hardMax);
}
