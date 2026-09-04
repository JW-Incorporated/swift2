// Shared content vocabulary — the enums the Vault content pipeline agrees on
// (rumor statuses/tiers, location specificity, milestone kinds, theory
// confidence) plus a `slugify` re-export, gathered in one dependency-free
// module (Fable 5.1 architecture review, R8).
//
// Why this file exists: scripts/content-engine/lib/corpus.mjs is deliberately
// zero-dependency pure Node (its own header: "no deps, no DB, no secrets") so
// it can be imported cheaply by every checker. Before this file, the only
// place these enums lived was scripts/sync-longlive-content.mjs and
// scripts/sync-longlive-theories.mjs — both of which pull in
// @supabase/supabase-js at module scope — so anything wanting just the
// vocabulary was forced to import the DB client transitively, and
// sync-longlive-content.mjs additionally imported sync-longlive-theories.mjs
// just for CONFIDENCE_VALUES (a content<->theories coupling with no other
// reason to exist). Both generators now import their enums from here instead
// of defining them, and lighter-weight consumers (validate-content.mjs,
// content-engine/lib/corpus.mjs, scripts/lib/knowledge-rows.mjs) can import
// straight from here without ever touching supabase-js.
//
// Keep every value mirrored in apps/web/lib/longlive/types.ts and
// packages/shared/src/vault-types.ts in sync with the sets below — see each
// export's docstring for the exact type it mirrors.

export { slugify } from './longlive-sync-shared.mjs';

/** Mirrors RumorStatus in apps/web/lib/longlive/types.ts. */
export const RUMOR_STATUSES = new Set([
  'unconfirmed',
  'partially_confirmed',
  'confirmed',
  'debunked',
  // The honest end-state for a claim that was reported, never confirmed,
  // never denied, and went quiet (2026-07-20, docs/content-ops/rumor-pipeline.md).
  'faded',
]);

/** Mirrors RumorSourceTier in apps/web/lib/longlive/types.ts. */
export const RUMOR_SOURCE_TIERS = new Set(['official', 'established', 'tabloid', 'social']);

/**
 * Mirrors LocationSpecificity. No 'address' member on purpose — L3 is never
 * publishable at any provenance (privacy-redlines.md Never-OK #1).
 */
export const LOCATION_SPECIFICITY = new Set(['region', 'city', 'venue']);

/** Statuses whose claim is settled, and therefore need a citation to back it. */
export const RESOLVED_RUMOR_STATUSES = new Set(['confirmed', 'debunked']);

/**
 * Valid `MilestoneKind` values — must stay in step with the union in
 * apps/web/lib/longlive/types.ts. `fandom` (2026-08-11) covers documented
 * fan-community events; see docs/proposals/2026-08-11-facebook-groups-signal.md.
 */
export const MILESTONE_KINDS = ['album', 'tour', 'life', 'business', 'award', 'fandom'];

/**
 * The 8 shared confidence values (mirrors THEORY_CONFIDENCE in
 * packages/shared/src/vault-types.ts). Importing the theories generator only
 * pulls its pure exports — its main() is guarded behind invokedDirectly — but
 * this vocabulary module needs no import of it at all, which is the point.
 */
export const CONFIDENCE_VALUES = new Set([
  'official',
  'confirmed_interview',
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'disproven',
  'joke_meme',
]);
