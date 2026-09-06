// Long Live — the per-era track guide's raw data module (OS-014b-2,
// docs/specs/2026-09-05-one-source-three-surfaces.md §6). Historically this
// data lived only in the generated `tracks.generated.ts` (produced by
// `scripts/sync-longlive-tracks.mjs` from `supabase/seed/tracks/**`), which
// wired itself straight into `@swift2/experience`'s injected track-catalogue
// provider via a side-effecting `setTracksRawProvider(TRACKS_RAW)` call at
// import time (see track-catalogue-provider.ts's doc for why the app must
// wire this in rather than `packages/experience` reading generated data
// directly).
//
// This module is now the canonical place that wiring happens: it prefers
// the published content bundle's `tracks` entry — the SAME artifact
// `packages/content`'s `loadBundle()` serves to mobile (OS-015) — falling
// back to the generated `TRACKS_RAW` map whenever the bundle isn't
// available/valid (a fresh checkout before `content:bundle` has run, or
// `build-content-bundle.mjs`'s own bundle-building process — see
// `bundle-source.ts`'s module doc). Both paths are proven byte-identical in
// `bundle-source.test.ts`.
import type { EraId, TrackNote } from '@swift2/experience';
import { setTracksRawProvider } from '@swift2/experience';
import { TRACKS_RAW as GENERATED_TRACKS_RAW } from './tracks.generated';
import { tracksRawFromPublishedBundle } from './bundle-source';

export { tracksForEra } from '@swift2/experience';

export const TRACKS_RAW: Partial<Record<EraId, TrackNote[]>> =
  tracksRawFromPublishedBundle() ?? GENERATED_TRACKS_RAW;

// Wires the per-era track map into packages/experience's injected provider —
// see track-catalogue-provider.ts. Importing this module (for its side
// effect, same convention as `./content`/`./tracks.generated` before it) is
// what every existing caller (vault-wiring.ts, scripts/lib/dump-longlive-
// sources.ts) already relies on for `tracksForEra()`/`songTargetOf()` etc.
// to resolve real data.
//
// IMPORTANT: any consumer that needs `tracksForEra()` (or another
// `@swift2/experience` accessor backed by this provider) to see the data
// this module just wired MUST import it from THIS module (the re-export
// above), not straight from `@swift2/experience` — a caller living outside
// `apps/web`'s own package.json (no top-level `"type": "module"`, unlike
// this file's package) can otherwise resolve `@swift2/experience` to a
// SEPARATE module instantiation than the one this file wired
// (`scripts/lib/dump-longlive-sources.ts` hit exactly this: it imports
// `@swift2/experience` from `scripts/`, which lives under a package.json
// that IS `"type": "module"`, so Node's dual-CJS/ESM-instance resolution
// gave it a different `track-catalogue-provider.ts` module instance than
// the one `setTracksRawProvider` below writes to — `tracksForEra()` then
// silently read an empty, never-wired default). `theories.ts` already
// re-exports `theoriesForEra` for the same reason; this mirrors it.
setTracksRawProvider(TRACKS_RAW);
