// Long Live — the per-era track guide's raw data module.
//
// BUNDLE AS SOURCE OF TRUTH, LITERAL AS RUNTIME VALUE (OS-014b-2, same
// reasoning recorded for era-secrets.ts/merch.ts/clownbot-lore.ts's
// OS-014b-4/5 — see those files' headers for the fuller writeup, and Fable
// rulings FR-t_cd5741fc-1/-2 for why a runtime filesystem read was
// rejected): `TRACKS_RAW` keeps importing straight from
// `tracks.generated.ts` (a plain object literal with zero imports, produced
// by `scripts/sync-longlive-tracks.mjs` from `supabase/seed/tracks/**` —
// the same seed source that also feeds the published bundle build, via
// `scripts/lib/dump-longlive-sources.ts`) rather than reading the
// published bundle's `tracks.json` at runtime via `packages/content`'s
// async `loadBundle()` or a synchronous `node:fs` read.
//
// This module is reachable from `TrackGuide.tsx`/`TrackDetail.tsx`, both
// `'use client'` components — Next.js/Turbopack statically traces every
// module in a client component's import graph and refuses to bundle
// `node:fs`/`node:path` for the browser (a real `TurbopackInternalError`
// build failure hit while implementing this card, not a theoretical
// concern — see FR-t_cd5741fc-1's writeup). `loadBundle()` is likewise the
// wrong shape: it is an async HTTP client, and every one of the ~100+ call
// sites across the app reads `tracksForEra`/`songTargetOf`/etc.
// synchronously today (this migration's explicit "zero pixel/behavior
// change" bar) — switching to an async load would ripple into every
// consumer's render path for no benefit apps/web's own build doesn't
// already get for free (the generated file is produced from the exact same
// seed source the bundle is built from, by the same `prebuild` step,
// before either is read).
//
// `tracks.test.ts`'s bundle-regression describe block enforces the actual
// invariant instead: a byte-identical-to-the-published-bundle regression
// check, so any drift between `TRACKS_RAW` and the bundle's `tracks.json`
// fails the suite immediately.
export {
  adjacentTrackOnAlbum,
  keepExploring,
  nextTrackOnAlbum,
  releasedFactValue,
  resolveConnections,
  songTargetOf,
  tracksForEra,
} from '@swift2/experience';

// Wires the app's generated track-guide dataset into `packages/experience`'s
// injected track-catalogue provider — see track-catalogue-provider.ts for
// why the headless package can't load generated content itself (content
// loading is OS-013/OS-014 scope, so the app injects the real
// implementation in at import time). Importing this module (for its side
// effect, same convention as `./content`/`./era-secrets` before it) is what
// every existing caller (vault-wiring.ts, scripts/lib/dump-longlive-
// sources.ts) already relies on for `tracksForEra()`/`songTargetOf()` etc.
// to resolve real data.
import type { EraId, TrackNote } from '@swift2/experience';
import { setTracksRawProvider } from '@swift2/experience';
import { TRACKS_RAW } from './tracks.generated';

export { TRACKS_RAW };

setTracksRawProvider(TRACKS_RAW as Partial<Record<EraId, TrackNote[]>>);
