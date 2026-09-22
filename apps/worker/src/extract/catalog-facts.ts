// Hand-maintained catalog-facts table for deterministic theory scoring
// (Community Engine follow-up, symbol/numerology signal). Sibling of
// ./theory-match.ts — same "deterministic, not a second LLM call" posture:
// this is a small, founder-updated table of facts ABOUT THE CATALOG ITSELF
// (not fan sentiment), checked against a theory candidate's extracted
// `numeric_signals` by ./symbol-match.ts's pure function.
//
// Update this file by hand when the catalog changes (a new album drops, a
// new era starts) — there is no sync script for it, same manual-update
// posture as symbol_lexicon's seed data. Keep it small: only numbers a real
// fan theory would actually reference (album ordinal, track count, era
// start date parts, the documented "13" numerology habit), not every
// number that has ever appeared anywhere in the catalog.

export interface CatalogFacts {
  /** Current studio album's ordinal position in the discography, e.g. 12
   * for The Life of a Showgirl (Taylor's twelfth studio album). */
  currentAlbumNumber: number;
  /** Current studio album's standard-edition track count. */
  currentAlbumTrackCount: number;
  /** Current era's start/announcement date, broken into its numeric parts
   * (day, month, year) so a theory referencing any one part — "the 3rd",
   * "December" as 12, the year itself — can still register a hit without
   * requiring the theory to reconstruct the whole date. */
  eraStartDateParts: number[];
  /** Taylor's documented recurring numerology habit (her own stated
   * favorite number, repeatedly self-referenced across eras) — distinct
   * from the current album's own facts above because it persists across
   * every era, not just this one. */
  numerologyDigits: number[];
}

// The Life of a Showgirl: twelfth studio album, twelve tracks, announced on
// New Heights 2026-08-13 (see supabase/seed/theories/the-life-of-a-showgirl.mjs
// for the sourced version of these same facts already seeded into content).
export const CATALOG_FACTS: CatalogFacts = {
  currentAlbumNumber: 12,
  currentAlbumTrackCount: 12,
  eraStartDateParts: [13, 8, 2026],
  numerologyDigits: [13],
};

/** Flat, deduped list of every fact-number worth matching against — the
 * single source both symbol-match.ts's scorer and its tests read, so the
 * union logic never drifts out of sync with the table above. */
export function catalogFactNumbers(facts: CatalogFacts = CATALOG_FACTS): number[] {
  return [
    ...new Set([
      facts.currentAlbumNumber,
      facts.currentAlbumTrackCount,
      ...facts.eraStartDateParts,
      ...facts.numerologyDigits,
    ]),
  ];
}
