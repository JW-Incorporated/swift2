# Decision doc: retire or adopt the Supabase Vault read path

Status: RESOLVED BY IMPLEMENTATION (2026-09-06) — see note below. Originally: DRAFT — awaiting Joey's decision
Author: Claude Code (worker, task R24)
Source: Fable 5.1 architecture review, PR #3709 finding
Grounded in: `docs/architecture.md`, `docs/proposals/2026-07-02-vault-history-serving-architecture.md`,
`docs/longlive-experience.md`

## One-line decision

**Should the app keep the Supabase-backed Vault read path (`packages/core/src/vault.ts`,
`apps/web/app/vault/{tier0,moment,album}` routes, `db-seed.yml`'s Vault tables) alive
as a second, parallel content pipeline — or retire it now that the live product
reads from generated static JSON instead?**

## What the review found

There are **two separate, non-overlapping pipelines** that both produce
"Taylor's timeline" content, and only one of them powers what users actually
see today:

1. **The static-generated pipeline (live, in production).**
   `supabase/seed/content/**` → `npm run sync:content`
   (`scripts/sync-longlive-content.mjs` + siblings) → committed generated file
   `apps/web/lib/longlive/content-vault.generated.ts` (2 MB, 9,103 lines) →
   the actual LongLive experience UI (`apps/web/components/longlive/**`,
   `e2e/vault.spec.ts` asserts against this UI via `data-ll-item`). This is
   what `/` serves today.

2. **The Supabase-direct pipeline (built, never mounted on web; used by mobile).**
   `supabase/migrations/20260703190000_vault_init.sql` (era/milestone/month_item/
   moment/track_note tables) ← seeded by `scripts/seed-eras.mjs` and
   `scripts/seed-content.mjs` via the `db-seed.yml` GitHub Action (targets
   `eras`, `content`, `tracks`) → `packages/core/src/vault.ts`
   (`createVaultClient`, direct `@supabase/supabase-js` reads) → consumed by:
   - `apps/web/app/vault/{tier0,moment,album/[slug]/tracks}` — three Next.js
     API routes that just proxy `packages/core`'s Supabase reads as JSON.
   - `apps/web/lib/vault.ts` — used by those routes, and as a *fallback* data
     source for a deleted web UI (kept alive only because the routes still
     exist).
   - `apps/mobile/lib/vault.ts` + `apps/mobile/components/VaultNavigator.tsx`
     — the Expo mobile app's **only** Vault data path today. This is real,
     working code, not dead scaffolding — it's the sole consumer that
     actually depends on this pipeline being correct.

`docs/architecture.md` (v0.2) already documents that the web UI which used to
read pipeline 2 (`VaultReader.tsx`) was deleted on 2026-08-11, and that
pipeline 2's API routes were kept "as shipped deliverables of record" and as
the target of `npm run check:budget` (the Tier-0 payload-budget gate from the
2026-07-02 sizing proposal). So the duplication is known and was a deliberate
interim state, not an oversight — but it was never revisited once the mobile
app started depending on it, and it is now a maintenance and cost burden with
no plan to converge.

## Why this matters

- **Two content models to keep in sync by hand.** Editors/automation must
  populate `supabase/seed/content/**` (for the live web UI) and separately
  seed `era`/`milestone`/`month_item`/`moment`/`track_note` tables via
  `db-seed.yml` (for mobile + the budget gate) to keep both pipelines
  current. Nothing enforces that they describe the same timeline; they can
  silently drift.
- **Mobile is the one dependency that's genuinely load-bearing.** If pipeline
  2 is removed without a replacement, mobile has no Vault data source at all
  — this is not a safe delete-and-walk-away.
- **Ongoing Supabase cost for a path most of the org doesn't touch.** Live
  Postgres tables + RLS-public reads + the `db-seed` GitHub Action are kept
  running for a consumer (mobile) that isn't yet shipped, while the actual
  live product (`content-vault.generated.ts`) doesn't use them.
- **Confusing to maintain.** Two different things are both called "Vault" —
  the live static-content UI and the Supabase read-path — which makes future
  review/onboarding harder (this doc exists because Fable's review flagged
  exactly that confusion).

## Option A — Mobile reads the same generated JSON the web ships

Mobile switches from live Supabase reads (`apps/mobile/lib/vault.ts` →
`packages/core/src/vault.ts` → Supabase) to consuming the same static,
deploy-time-generated content the web already ships
(`content-vault.generated.ts`, or a JSON export of it bundled/fetched by the
Expo app). Retire the whole Supabase Vault read path:

- Delete `packages/core/src/vault.ts` and its `createVaultClient` export.
- Delete `apps/web/app/vault/{tier0,moment,album/[slug]/tracks}` routes and
  `apps/web/lib/vault.ts` (including its fallback-API-client logic, which
  only exists to serve those routes).
- Delete `apps/mobile/lib/vault.ts` + rewrite `VaultNavigator.tsx`'s data
  source (view code stays; only the fetch boundary changes, preserving the
  `architecture.md` "shared, view-only mobile" boundary — the replacement
  data source can live in `packages/core` again if a mobile-compatible
  loader is useful, just backed by the static content instead of Supabase).
- Remove `eras`/`content`/`tracks` targets and their seed scripts
  (`scripts/seed-eras.mjs`, `scripts/seed-content.mjs`) from `db-seed.yml`
  once nothing reads the tables they populate. Confirm no other consumer
  (`apps/worker/src/extract/write-knowledge.ts`,
  `apps/worker/src/classify/rule-based.ts` reference "vault" in a different,
  unrelated sense — verify before deleting tables — see Open Questions).
- Drop the `era`/`milestone`/`month_item`/`moment`/`track_note` Supabase
  tables (migration follow-up) once confirmed unused, or leave them
  provisioned-but-unseeded if a future re-adoption is plausible (cheap to
  keep empty tables; the ongoing cost is the seeding pipeline and code, not
  the schema).
- Update `npm run check:budget` (`scripts/check-tier0-budget.mjs`) to measure
  the generated JSON's payload instead of hitting `/vault/tier0` — the budget
  gate's *intent* (mid-tier Android parse/transfer budget) still applies to
  whatever ships to mobile, it just needs a new measurement target.

**Cost/impact:**
- One content pipeline to maintain, one source of truth, no drift risk.
- Removes recurring Supabase read load + the `db-seed` Action's `eras`/
  `content`/`tracks` targets; keeps whatever residual Supabase cost the rest
  of the app (worker, other tables) already needs.
- Real engineering work: build a mobile-compatible export of the generated
  content (size/shape may differ from the current Supabase Tier-0 shape —
  the generated file is optimized for a bundled web import, not necessarily
  for over-the-wire mobile fetch; may need its own JSON export step from
  `sync-longlive-content.mjs`) and rewire `VaultNavigator.tsx`'s data
  boundary. Medium-sized, scoped, mobile-only change.
- Mobile gains automatic parity with whatever content the web ships (same
  editorial pipeline), instead of a separately-seeded copy that can go
  stale.

## Option B — Web reads Tier-0 from Supabase directly

Reverse direction: make the *live* web UI (`apps/web/components/longlive/**`)
consume pipeline 2 (Supabase `era`/`milestone`/`month_item`, `packages/core`)
instead of the static generated file, converging on the path mobile already
uses and that `docs/architecture.md`'s original v1 spec (2026-07-02 proposal)
was designed around.

- Rewrite `apps/web/components/longlive/**`'s data source to call
  `loadSkeleton()`/`loadMoment()`/`loadTrackGuide()` (`apps/web/lib/vault.ts`)
  instead of importing `VAULT_RAW` from `content-vault.generated.ts`.
- Retire `scripts/sync-longlive-content.mjs` (and its 7 sibling sync
  scripts — tracks/theories/videos/era-secrets/song-moods/clownbot-lore/
  clown-knowledge all feed the same generated-file pattern; each would need
  its own Supabase-table equivalent, since only `content-vault.generated.ts`
  itself is in this doc's stated scope) and the generated file itself.
- Requires either keeping `db-seed.yml`'s `content` target as the live
  authoring path (editors run the GitHub Action instead of committing
  `supabase/seed/content/**` + running `sync:content` locally), or building
  a new authoring UI/pipeline into Supabase.

**Cost/impact:**
- Converges on the schema the original 2026-07-02 sizing proposal designed
  for (Tier-0/Tier-1 budget gates, `TIER0_BUDGET`, version-pinned cache
  coherency in `docs/proposals/2026-07-02-vault-history-serving-architecture.md`
  Section 4) — that design work stops being unused.
- **Much larger blast radius.** The live production UI, its Playwright
  suite (`e2e/vault.spec.ts`), and 7 other sync scripts covering
  tracks/theories/videos/era-secrets/song-moods/clownbot content are all
  built around the static generated-file shape today; this option is a
  rewrite of the live experience's data layer, not an additive change.
- Introduces the exact "live-database-under-load" and latency-budget
  questions the 2026-07-02 proposal spent significant analysis resolving
  for a scrubbing gesture that must stay at 60fps with zero per-frame
  network cost — the generated-static-JSON approach sidesteps that problem
  entirely today; moving back to a live read path reopens it.
- Ongoing Supabase read cost for the live site's primary traffic (currently
  zero marginal cost — it's a static bundled import), replacing today's
  effectively-free content serving with live database reads at production
  scale.

## Recommendation

**Option A.** The live product already ships correctly and cheaply on
static generated JSON; nothing about that is broken or was flagged by the
review. The only real problem is that mobile's Vault reader depends on a
second, narrower pipeline that duplicates the same content by hand. Option A
fixes the actual duplication (one content source, mobile catches up to what
web already does) with a scoped, mobile-only change. Option B would rewrite
a working, cheap, already-tested production path to converge on the
narrower pipeline instead — much larger blast radius, reintroduces a
latency/scale problem the team already solved by going static, and for no
described product benefit.

## Consequences of not deciding

Both pipelines keep running. Editorial content can silently drift between
what web shows and what mobile shows once the mobile app ships. The
`db-seed.yml` Vault targets and their Supabase tables keep costing
maintenance and infra attention for a path most day-to-day work doesn't
touch.

## Open questions (need human input before implementation)

- **Mobile ship timeline:** is `apps/mobile` close enough to shipping that
  Option A's rewrite should happen now, or can this wait behind other
  mobile work? Affects sequencing, not the decision itself.
- **`write-knowledge.ts` / `rule-based.ts` "vault" references
  (`apps/worker/src/extract/write-knowledge.ts`,
  `apps/worker/src/classify/rule-based.ts`):** confirm these use "vault" in
  an unrelated sense (worker content classification) before any table drop —
  flagged here, not resolved, since this task is docs-only.
- **Table retention:** if Option A is chosen, should the Supabase Vault
  tables be dropped outright or left empty/unseeded for a period in case of
  rollback? Low cost either way; a call for whoever implements it.

## What this doc does NOT do

This card is docs-only and is **not authorized to implement either option**.
No code, schema, or workflow changes were made. Once Joey decides, open a
follow-up implementation card scoped to the chosen option.

## 2026-09-06 update — Option A adopted via the ratified One Source, Three Surfaces plan

Joey's founder-level decision D1 in `docs/specs/2026-09-05-one-source-
three-surfaces.md` (ratified 2026-09-05) independently reached the same
conclusion as this doc's Option A, and it has since been implemented:

- **OS-015** switched `apps/mobile/lib/vault.ts` off `createVaultClient`/
  Supabase entirely onto the same published static content bundle the web
  ships (`@swift2/content`'s `loadBundle()`). Mobile no longer touches
  Supabase for Vault content. Merged (PR #3845).
- **OS-016** retired Vault content DB seeding (`db-seed.yml`'s dropdown,
  `package.json` scripts) and marked the 9 Supabase Vault tables deprecated
  via `COMMENT ON TABLE` — **not dropped**, matching this doc's own
  "Table retention" caution above (leave unseeded for a rollback window
  rather than drop outright). Merged (PR #3851).
- **Not yet done:** `packages/core/src/vault.ts` (`createVaultClient`) and
  the `apps/web/app/vault/{tier0,moment,album/[slug]/tracks}` routes still
  exist — they were deliberately left in place pending **OS-014b** (tracked
  in `docs/longlive-experience.md` §9, not yet a kanban card), the follow-up
  that extracts the web reader's enrichment logic so it too can read from
  the bundle instead of the generated TS files. Once OS-014b lands, this
  doc's Option A can be closed out completely (delete `vault.ts` + the
  three routes).
- The two "open questions" above are effectively answered: mobile ship
  timeline no longer gates this (already switched), and table retention
  chose "mark deprecated, don't drop" as this doc suggested.

No further founder decision is needed on the read-path direction — it was
made and executed via D1. The remaining work is purely OS-014b's
implementation follow-up.
