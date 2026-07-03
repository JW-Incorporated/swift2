# Roadmap — Vault v1 (owner-split execution plan)

The **what/how** lives in `docs/specs/2026-07-03-vault-mvp-v1-spec.md`. This doc
is the **who/when**, split into two tracks so Wyatt and Joey (each with their AI
session) work in parallel toward a ship by Taylor's wedding.

## ▶ How to start a session — just say "start working"

Each founder's agent owns ONE track. You never need to name a work package —
the agent reads its track, takes the topmost row not marked ✅, and begins.

| Founder | Track | Your agent's next action |
|---------|-------|--------------------------|
| **Wyatt** (CTO) | **ENGINE** | the topmost ⬜ in the Wyatt table below — currently **W2** |
| **Joey** (CEO) | **CONTENT** | the topmost ⬜ in the Joey table below — currently **J1 then J2** |

**Agent instruction (put this in your "start working" prompt or let the agent
infer it): "You are the {ENGINE|CONTENT} track in `docs/roadmap.md`. Take the
topmost unchecked work package in my track and do it end-to-end to the
Definition of Done. Don't touch the other track's files."**

## The no-collision boundary (why both can run at once)

The tracks own **different files**, so parallel work never conflicts:

- **ENGINE (Wyatt)** owns all code: `packages/**`, `apps/**`,
  `supabase/migrations/**`, `scripts/**`.
- **CONTENT (Joey)** owns authored data only: **`supabase/seed/content/**`**
  (new files, one per era/category) — never code.

The single shared dependency, the **data contract** (four tables +
`packages/shared` types), is already built (W1 ✅). After it, the two tracks
only meet at integration: Joey's seed rows drop into tables Wyatt's UI already
renders.

Every work package inherits `CLAUDE.md`'s Definition of Done (tests pass, Codex
review clean, works mobile + desktop, no secrets) and is sized to fit a single
Max rate-limit window.

## 🛠️ Wyatt track — engine (spec steps 1–2, 4–8)

| WP | What | Status |
|----|------|--------|
| **W0** | Monorepo scaffold + CI | ✅ merged (#11) |
| **W1** | 🔑 **Data contract:** `packages/shared` Vault types + snap/nav math (tested); Supabase schema for `era`/`milestone`/`month_item`/`moment` (RLS public-read, no-bodies CHECKs); migration + seed runners | ✅ (#14) |
| **W2** | `packages/core`: Tier 0 (skeleton + month index) and Tier 1 (moment detail) data access; version-pinned Tier 1 paths + version-mismatch refetch | ⬜ **▶ NEXT** |
| **W3** | `apps/web`: fetch + render Tier 0 — era switching + month lists, **no gesture layer yet** (functional, not yet "the feel"); Vercel deploy | ⬜ |
| **W4** | `apps/web`: the scrubber gesture layer (Pointer Events + CSS/rAF) to the 60fps budget + era theming engine — **the hard part** | ⬜ |
| **W5** | `apps/web`: moment detail fetch + all five degraded states (slow/timeout/404/offline/superseded-tap) + telemetry | ⬜ |
| **W6** | Measure real Tier 0 payload vs the ≤2MB gzipped / ≤10MB parsed gate; apply windowed-prefetch fallback only if it fails | ⬜ |

## ✍️ Joey track — content (spec step 3 + theming values)

Joey authors **data files under `supabase/seed/content/`** (never code). Each is
loaded by the seed runner the engine track provides. The agent should write a
seed generator, not hand-enter rows (CLAUDE.md rule 8).

| WP | What | Status |
|----|------|--------|
| **J1** | Confirm **editorial depth = Option A** (curated: notable months deep, sparse lighter). If unconfirmed, the agent proceeds on A and flags it. | ⬜ **▶ NEXT** |
| **J2** | **Port Orbit's authored content** into `month_item`/`moment`: Orbit's `outfits` (dated fashion + pieces/brands/colors), `songs`+`lore`, `albums`. This is the fastest start — reuse, don't hand-author. Source files listed under "Ported from Orbit" below. | ⬜ **▶ then this** |
| **J3** | Fill gaps beyond Orbit: notable `month_item`s per era/month (sightings, relationship, business, tour dates) for high-activity eras | ⬜ |
| **J4** | `moment` detail — extended context + linked sources + hotlinked photos for key moments | ⬜ |
| **J5** | Per-era theming polish + cover art (theme values already seeded; refine) · product copy (first-run explainer, UNOFFICIAL/about) | ⬜ |
| **J6** | Content QA + editorial coverage pass before launch | ⬜ |

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
