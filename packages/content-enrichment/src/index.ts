/**
 * `packages/content-enrichment` — the pure, framework-free, `apps/web`-free
 * home for the enrichment logic `scripts/build-content-bundle.mjs` (OS-011)
 * needs to assemble the content bundle. Extracted out of
 * `apps/web/lib/longlive/{content,tracks,theories,videos,era-secrets,merch,
 * song-moods,clownbot-lore}.ts` (OS-014b-1) so the bundle builder can import
 * this module directly instead of the app-layer files — resolving the
 * circularity where the bundle builder previously had to import
 * `apps/web/lib/longlive/*.ts` to build the very bundle those same modules
 * will eventually read from (OS-014b's Goal).
 *
 * This module owns ONLY the pure, id-normalizing, filtering, and
 * catalogue-construction logic — never the generated raw data itself. Raw
 * data (`VAULT_RAW`, `TRACKS_RAW`, `THEORIES_RAW`, `VIDEOS_RAW`,
 * `ERA_SECRETS_RAW`, `SONG_MOODS`, `LORE`, `OFFICIAL`/`FAN_MADE`) still lives
 * in `apps/web/lib/longlive/*.generated.ts`; callers (today:
 * `scripts/lib/dump-longlive-sources.ts`) pass it in as plain arguments so
 * this package has zero import of `apps/web`.
 *
 * `apps/web/lib/longlive/*.ts` still owns the CONSUMER-FACING exports (same
 * function/const names, same import paths for every existing caller) — this
 * card does not touch those. OS-014b-2..5 will rewire those modules to read
 * from the published bundle; for now they still compute the exact same
 * things by calling straight through to this package, so behavior (and the
 * bundle's bytes) is unchanged.
 */

export * from './content';
export * from './videos';
export * from './merch';
