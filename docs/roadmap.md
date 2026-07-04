# Roadmap — Vault v1 (owner-split execution plan)

The **what/how** lives in `docs/specs/2026-07-03-vault-mvp-v1-spec.md`. This doc
is the **who/when**, split into two tracks so Wyatt and Joey (each with their AI
session) work in parallel toward a ship by Taylor's wedding.

## ▶ How to start a session — just say "start working"

Each founder's agent owns ONE track. You never need to name a work package —
the agent reads its track, takes the topmost row not marked ✅, and begins.

| Founder | Track | Your agent's next action |
|---------|-------|--------------------------|
| **Wyatt** (CTO) | **ENGINE** | review/merge the **W4 scrubber (draft #23)** after an on-device 60fps check, then **W5** (moment detail) builds on it |
| **Joey** (CEO) | **CONTENT** | the topmost ⬜ in the Joey table below — currently **J2/J3** (author content in `supabase/seed/content/`) |

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
| **W2** | `packages/core`: Tier 0 (skeleton + month index) and Tier 1 (moment detail) data access | ✅ (#20) |
| **W3** | `apps/web`: fetch + render Tier 0 — era switching + per-era theming + month/milestone timeline (**no gesture layer yet**) | ✅ (#21) — Vercel deploy still TODO |
| **W4** | `apps/web`: the scrubber gesture layer (Pointer Events + CSS/rAF) to the 60fps budget — **the hard part** | 🟡 **DRAFT #23** — needs on-device 60fps check + review before merge |
| **W4.5** | Two-tier Vault HTTP API: static `GET /vault/tier0` (+ version stamp) & on-demand `GET /vault/moment/[id]`, reused by web + Expo | ✅ (#27) |
| **W5** | `apps/web`: moment detail fetch + degraded states (slow/timeout/404/offline/superseded-tap) | ✅ folded into **#23** (tap-to-open over the continuous reader; supersedes #31) |
| **W6** | Tier 0 payload budget gate (≤2MB gz / ≤10MB parsed): pure `evaluateTier0Budget` + `npm run check:budget`; windowed-prefetch fallback only if a real payload fails | ✅ (#28) — **wired into CI** via `check:budget:seed` (#40, assembled from seed files, no creds). 100 items = 0.6% of budget. `validate:content` also gates seed rows in CI |
| **W7** | Song **track guide** (non-month-scoped): `track_note` table + `GET /vault/album/[slug]/tracks` + `db:seed:tracks`, off the Tier 0 payload — unblocks full-catalog song coverage | ✅ built + migrated (`docs/decisions.md` 2026-07-04); **reader UI shipped in #23** (TrackGuide bottom-sheet, on-demand per album) |

## ✍️ Joey track — content (spec step 3 + theming values)

Joey authors **data files under `supabase/seed/content/`** (never code). Each is
loaded by the seed runner the engine track provides. The agent should write a
seed generator, not hand-enter rows (CLAUDE.md rule 8).

| WP | What | Status |
|----|------|--------|
| **J1** | Confirm **editorial depth = Option A** (curated: notable months deep, sparse lighter). | ✅ — confirmed + a concrete 3-tier rubric (wavetop/active/quiet) locked in `docs/marketing/content-framework-2026-07-03.md` (#18) |
| **J2** | ~~Port Orbit's authored content~~ **superseded** — Orbit's `outfits`/`lore`/`stories` turned out to be AI-drafted/fabricated placeholder data, not real history (see "Ported from Orbit" below). Only real song track metadata is portable. | ⬜ **▶ NEXT (revised)** |
| **J3** | Author real `month_item`s from real sources (sightings, fashion, relationship, business, tour dates), starting with Midnights/Tortured Poets per the authoring order in `docs/marketing/content-framework-2026-07-03.md`. Light-touch model: research + a one-line hook, not original prose — see that doc's Section 5 (2026-07-03 revision). | ⬜ **▶ then this** |
| **J4** | `moment` detail — extended context + linked sources + hotlinked photos for key moments | ⬜ |
| **J5** | Per-era theming polish + cover art (theme values already seeded; refine) · product copy (first-run explainer, UNOFFICIAL/about) | ⬜ |
| **J6** | Content QA + editorial coverage pass before launch | ⬜ |

## 🎁 Ported from Orbit — and the important caveat

**Done (verifiable facts only):** all **11 era themes** (colors/gradients/
eyebrows) → `era.theme`; album-release + marquee tour **milestones** →
`milestone`. Both now render in the web app.

**Reality check (found during the port):** Orbit does **not** contain a large
corpus of real, dated Vault content. Its `outfits` and song `lore` are
**AI-drafted** (generated, not verified) and its news `stories` are **fabricated
placeholder mocks** — none is safe to seed as Taylor's real history.

**So: no fabrication.** The rich month-level content (what Taylor did each
month) must be **authored from real sources**, not lifted from Orbit and not
invented. The one remaining genuinely-factual Orbit asset worth porting later is
its **real song track metadata** (folklore, 1989 TV — `apps/worker/src/dev/
songs-data.ts`) as release-detail `moment`s. Everything else is fresh sourced
authoring on the CONTENT track.

## Codex utilization (salvaged from closed PR #9)

Claude keeps: architecture, integration, the perf-critical W4 gesture layer.
Delegate to Codex: test authoring from acceptance criteria, migration/RLS
review, `packages/core` boilerplate, mechanical refactors, and independent
review (`/codex:review`; `/codex:adversarial-review` for W4 perf + W6 budget).
Gated on `codex login` + the CC plugin.

## Open items (don't block engine track)

- **W6** — payload budget is a hard acceptance gate, measured against real seed.
