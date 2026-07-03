# Roadmap — Vault v1 (owner-split execution plan)

The **what/how** lives in `docs/specs/2026-07-03-vault-mvp-v1-spec.md`. This doc
is the **who/when**: it splits that spec's single build sequence into two tracks
so Wyatt and Joey (each with their AI session) work in parallel with minimal
collisions, targeting a ship by Taylor's wedding.

Every work package inherits `CLAUDE.md`'s Definition of Done (tests pass, Codex
review clean, works mobile + desktop, no secrets) and effort is sized to fit a
single Max rate-limit window.

## The anti-collision rule

There is exactly one hard shared dependency: **the data contract** (the four
Vault tables + `packages/shared` types). It is built once, first. After that,
the engine track (Wyatt) and the content track (Joey) run against the same
schema/types and only meet at integration — Joey's real rows drop into the
tables Wyatt's UI already renders.

## 🛠️ Wyatt track — engine (spec steps 1–2, 4–8)

| WP | What | Status |
|----|------|--------|
| **W0** | Monorepo scaffold + CI | ✅ merged/at PR #11 |
| **W1** | 🔑 **Data contract:** `packages/shared` Vault types + snap/nav math (tested); Supabase schema for `era`/`milestone`/`month_item`/`moment` (RLS public-read, no-bodies CHECKs); migration + seed runners | ✅ this PR |
| **W2** | `packages/core`: Tier 0 (skeleton + month index) and Tier 1 (moment detail) data access; version-pinned Tier 1 paths + version-mismatch refetch | next |
| **W3** | `apps/web`: fetch + render Tier 0 — era switching + month lists, **no gesture layer yet** (functional, not yet "the feel"); Vercel deploy | |
| **W4** | `apps/web`: the scrubber gesture layer (Pointer Events + CSS/rAF) to the 60fps budget + era theming engine — **the hard part** | |
| **W5** | `apps/web`: moment detail fetch + all five degraded states (slow/timeout/404/offline/superseded-tap) + telemetry | |
| **W6** | Measure real Tier 0 payload vs the ≤2MB gzipped / ≤10MB parsed gate; apply windowed-prefetch fallback only if it fails | |

## ✍️ Joey track — content (spec step 3 + theming values)

| WP | What | Depends on |
|----|------|-----------|
| **J1** | Confirm **editorial depth = Option A** (curated: notable months deep, sparse lighter) | — (spec §9) |
| **J2** | `month_item` content — the dated items per era/month (sightings, fashion, tour, releases, relationship, business, music-in-progress) | W1 schema |
| **J3** | `moment` detail — extended context + linked sources + hotlinked photos for key moments | W1 schema |
| **J4** | Per-era theming polish + cover art (theme token values already seeded from Orbit; refine) | W1 |
| **J5** | Product copy: first-run explainer, UNOFFICIAL-stance/about | — |
| **J6** | Content QA + editorial coverage pass before launch | all |

## 🎁 Ported from Orbit (big head start — reuse, don't re-author)

The sibling Orbit project already has authored Vault content we can lift:

- **✅ Done in W1:** all **11 era themes** (colors/gradients/eyebrows) → seeded
  into `era.theme`; album-release + marquee tour **milestones** → `milestone`.
- **To port next (Joey track, `month_item`/`moment`):** Orbit's `outfits`
  (dated fashion looks with pieces/brands/colors — `apps/web/lib`,
  `packages/shared/src/domain/fashion.ts`, `supabase/migrations/*outfits*`),
  `songs` + `lore` (`apps/worker/src/dev/songs-data.ts`, `seed-songs.ts`), and
  `albums` metadata. These map to dated month items + moment detail. Port via a
  seed generator (CLAUDE.md rule 8), not by hand.

## Codex utilization (salvaged from closed PR #9)

Claude keeps: architecture, integration, the perf-critical W4 gesture layer.
Delegate to Codex: test authoring from acceptance criteria, migration/RLS
review, `packages/core` boilerplate, mechanical refactors, and independent
review (`/codex:review`; `/codex:adversarial-review` for W4 perf + W6 budget).
Gated on `codex login` + the CC plugin.

## Open items (don't block engine track)

- **J1** — Joey confirms editorial depth (Option A assumed).
- **W6** — payload budget is a hard acceptance gate, measured against real seed.
