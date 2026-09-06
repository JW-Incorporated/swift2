// Internal helper for scripts/build-content-bundle.mjs (OS-011): loads the
// content sources the bundle needs and prints one JSON object to stdout.
//
// OS-014b-1 (docs/proposals/2026-09-vault-read-path.md): the CONTENT/
// MILESTONES/VIDEOS/MERCH_CATALOGUE enrichment logic is read here straight
// off `@swift2/content-enrichment` + the generated raw data files, with ZERO
// dependency on `apps/web/lib/longlive/{content,videos,merch}.ts` — those
// app-layer modules import the SAME `@swift2/content-enrichment` functions
// with the SAME raw data, so their exports stay byte-identical to what this
// script assembles; only the import path changed, resolving the circularity
// OS-014b needs fixed before the app layer can read from the bundle instead
// of computing it locally. `era-secrets.ts`/`clownbot-lore.ts` are OS-014b-5
// scope (no pure enrichment logic to extract there beyond thin provider
// wiring) and are unchanged.
//
// OS-014b-3 (kanban t_a68139a4): `theories.ts` now reads its raw per-era
// data from the PUBLISHED bundle (`apps/web/lib/longlive/theories.ts`) via
// a generated module — but THIS script is what PRODUCES that bundle
// (`build-content-bundle.mjs`), so it cannot import `theories.ts` without
// creating a fixed-point circularity (the bundle would derive from
// `theories.ts`, which would derive from the bundle it hasn't built yet).
// Reads `THEORIES_RAW` straight from `theories.generated.ts` instead, the
// same way videos already read `VIDEOS_RAW` from `videos.generated.ts`.
// `theoriesForEra(eraId)` is `THEORIES_RAW[eraId] ?? []`, an unconditional
// lookup with zero transformation (packages/experience/src/theories.ts), so
// this is a byte-identical substitution, not a behavior change — the
// regression test in `theories.test.ts` proves the published bundle and
// `THEORIES_RAW` stay identical.
//
// OS-014b-2: `content.ts`/`tracks.ts` hit the exact same circularity as
// `theories.ts` above once considered for a bundle-backed generated module
// — and per Fable rulings FR-t_cd5741fc-1/-2, took the OTHER accepted
// pattern instead (same as `era-secrets.ts`/`merch.ts`/`clownbot-lore.ts`'s
// OS-014b-4/5): they keep importing their `.generated.ts` literal directly
// (`content-vault.generated.ts` via `buildContent({}, VAULT_RAW)`,
// `tracks.generated.ts` via `./tracks`) and rely on a
// byte-identical-to-the-published-bundle regression test instead
// (content.test.ts, tracks.test.ts) — no generated-module regeneration
// step needed here, since these two never read the bundle at all.
//
// Run via `tsx` (the dev-only TS loader already used elsewhere in this repo,
// e.g. scripts/sync-source-tiers.mjs) IN A SEPARATE PROCESS from
// build-content-bundle.mjs, rather than tsx's in-process register()/
// unregister() API: registering tsx and then importing a real module graph
// with cycles-through-require (era-secrets.ts -> content.ts -> content-
// vault.generated.ts, etc.) hits Node's ERR_REQUIRE_CYCLE_MODULE in-process.
// A child process sidesteps that entirely: tsx owns the whole process's
// module loading from the start, the way it does when a human runs `tsx
// some-script.ts` directly.
import { eraSecretsForEra } from '../../apps/web/lib/longlive/era-secrets';
import { ERAS } from '@swift2/experience';
import { LORE, LORE_UPDATED_ON } from '../../apps/web/lib/longlive/clownbot-lore';
import { SONG_MOODS } from '../../apps/web/lib/longlive/song-moods.generated';
import { THEORIES_RAW } from '../../apps/web/lib/longlive/theories.generated';
// `tracksForEra` MUST be imported from `./tracks` (not `@swift2/experience`
// directly) — this script (under scripts/'s `"type": "module"`
// package.json) would otherwise resolve `@swift2/experience` to a
// different module instance than the one `./tracks` wires
// `setTracksRawProvider` into, and silently read back an empty default.
import { tracksForEra } from '../../apps/web/lib/longlive/tracks';
import { buildContent, buildMilestones, buildMerchCatalogue, allVideoRecords } from '@swift2/content-enrichment';
import { VAULT_RAW } from '../../apps/web/lib/longlive/content-vault.generated';
import { VIDEOS_RAW } from '../../apps/web/lib/longlive/videos.generated';
import { OFFICIAL, FAN_MADE } from '../../apps/web/lib/longlive/merch.generated';

void LORE_UPDATED_ON; // not part of the bundle schema; imported for completeness only

// No hand-curated RAW map remains (consolidation stage 2a, 2026-07-19) —
// mirrors the empty `RAW` seam `apps/web/lib/longlive/content.ts` keeps for
// the same reason.
const CONTENT = buildContent({}, VAULT_RAW);
const MILESTONES = buildMilestones(CONTENT);
const MERCH_CATALOGUE = buildMerchCatalogue(CONTENT, OFFICIAL, FAN_MADE);

process.stdout.write(
  JSON.stringify({
    ERAS,
    MILESTONES,
    CONTENT,
    perEra: ERAS.map((era) => ({
      eraId: era.id,
      tracks: tracksForEra(era.id),
      theories: THEORIES_RAW[era.id] ?? [],
      videos: allVideoRecords(VIDEOS_RAW[era.id] ?? []),
      eraSecrets: eraSecretsForEra(era.id),
    })),
    SONG_MOODS,
    LORE,
    MERCH_CATALOGUE,
  }),
);
