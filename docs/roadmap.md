# Roadmap — Vault v1 (owner-split execution plan)

The **what/how** lives in `docs/specs/2026-07-03-vault-mvp-v1-spec.md`. This doc
is the **who/when**, split into two tracks so Wyatt and Joey (each with their AI
session) work in parallel toward a ship by Taylor's wedding.

> **Known gap (as of the LongLive rewrite):** CONTENT-track authoring below
> targets the Supabase `month_item`/`moment`/`track_note` schema, but the
> front-end shipped at `/` (`docs/longlive-experience.md`) currently reads
> static mock data from `apps/web/lib/longlive/*`, not Supabase. The
> ENGINE-track UI work below (W3/W4/etc.) built the older `VaultReader`
> reader, which is not the component mounted today. Reconciling the two —
> wiring LongLive to real seeded content — is unscheduled; don't assume
> content authored per this roadmap is visible in the live app yet.

## ▶ How to start a session — just say "start working"

Each founder's agent owns ONE track. You never need to name a work package —
the agent reads its track, takes the topmost row not marked ✅, and begins.

| Founder | Track | Your agent's next action |
|---------|-------|--------------------------|
| **Wyatt** (CTO) | **ENGINE** | review/merge the **W4 scrubber (draft #23)** after an on-device 60fps check, then **W5** (moment detail) builds on it |
| **Joey** (CEO) | **CONTENT** | the topmost ⬜ in the Joey table below — currently **J3.5** (deepen Midnights + Tortured Poets to Active-tier before launch, per the 2026-07-04 ship-readiness bar) |

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
| **W4** | `apps/web`: the scrubber gesture layer (Pointer Events + CSS/rAF) to the 60fps budget — **the hard part** | 🟡 **DRAFT #23** — feature-complete: continuous themed timeline + morph-on-grab scrubber + moment/track-guide sheets, **100 real items live**, Codex-reviewed (pointercancel + summon fixes), month-union logic extracted to `shared`. Needs on-device 60fps swipe test + merge |
| **W4.5** | Two-tier Vault HTTP API: static `GET /vault/tier0` (+ version stamp) & on-demand `GET /vault/moment/[id]`, reused by web + Expo | ✅ (#27) |
| **W5** | `apps/web`: moment detail fetch + degraded states (slow/timeout/404/offline/superseded-tap) | ✅ folded into **#23** (tap-to-open over the continuous reader; supersedes #31) |
| **W6** | Tier 0 payload budget gate (≤2MB gz / ≤10MB parsed): pure `evaluateTier0Budget` + `npm run check:budget`; windowed-prefetch fallback only if a real payload fails | ✅ (#28) — **wired into CI** via `check:budget:seed` (#40, assembled from seed files, no creds). 100 items = 0.6% of budget. `validate:content` also gates seed rows in CI |
| **W7** | Song **track guide** (non-month-scoped): `track_note` table + `GET /vault/album/[slug]/tracks` + `db:seed:tracks`, off the Tier 0 payload — unblocks full-catalog song coverage | ✅ built + migrated (`docs/decisions.md` 2026-07-04); **reader UI shipped in #23** (TrackGuide bottom-sheet, on-demand per album) |
| **W8** | `apps/mobile`: Expo app reusing `shared`/`core` — read-only era list first, native Reanimated + Gesture Handler scrubber next | 🟡 **DRAFT #42** — scaffold typechecks in CI reusing shared+core **unchanged** (proves the boundary); needs a device / Expo Go boot before merge |
| **Wh** | Data-access hardening from the architecture double-check (Codex + self audit) | ✅ (#43) — explicit Tier 0 columns, stable ordering, portable auth options, row-cap guard, url-type mappers, no error leakage. `docs/reviews/2026-07-04-architecture-double-check.md` |

## ✍️ Joey track — content (spec step 3 + theming values)

Joey authors **data files under `supabase/seed/content/`** (never code). Each is
loaded by the seed runner the engine track provides. The agent should write a
seed generator, not hand-enter rows (CLAUDE.md rule 8).

| WP | What | Status |
|----|------|--------|
| **J1** | Confirm **editorial depth = Option A** (curated: notable months deep, sparse lighter). | ✅ — confirmed + a concrete 3-tier rubric (wavetop/active/quiet) locked in `docs/marketing/content-framework-2026-07-03.md` (#18) |
| **J2** | ~~Port Orbit's authored content~~ **superseded** — Orbit's `outfits`/`lore`/`stories` turned out to be AI-drafted/fabricated placeholder data, not real history (see "Ported from Orbit" below). Only real song track metadata is portable. | ⬜ **▶ NEXT (revised)** |
| **J3** | Author real `month_item`s from real sources (sightings, fashion, relationship, business, tour dates), starting with Midnights/Tortured Poets per the authoring order in `docs/marketing/content-framework-2026-07-03.md`. Light-touch model: research + a one-line hook, not original prose — see that doc's Section 5 (2026-07-03 revision). | ✅ **wavetop floor met** — 100 sourced `month_item`s across all 11 eras merged + seeded (#38), validated in CI. Category counts: music 42, business 28, fashion 11, tour 9, release 8, sighting 2, relationship 0 |
| **J3.5** | **Fixed launch gate (revised 2026-07-04, see `docs/decisions.md`):** bring **Midnights and Tortured Poets** from wavetop to **Active-tier depth**, weighted toward `relationship`/`sighting`/`fashion` specifically (was 0/2/11 overall) — not more `business`/`music`. This is the minimum that blocks public launch; it does not move. | 🟡 **first pass landed** — 33 new items across Midnights/TTPD, all relationship/sighting/fashion-weighted (relationship 0→11, sighting 2→11, fashion 11→24 across the whole vault); Codex fact-check round found and fixed 4 real issues (a mis-dated chart record, a fabricated/merged outfit detail, a nomination-vs-ceremony date mix, duplicate padding on one photoshoot) before merge. **Not yet claimed as "gate cleared"** — this is real-activity-month coverage for the two eras, not a rows-per-month audit against the 3-tier rubric; still needs Joey's spot-check + the review-throughput timing below before J3.5 is called done |
| **J3.5-next** | **Time Joey's spot-check step** (per item and per era) — no one has measured this yet, and it's what actually bounds how much of J3.5b below can happen pre-launch. | ⬜ **▶ NEXT** |
| **J3.5b** | **Additive, not required — parallel full-depth on other eras (added 2026-07-04, same-day update to the decision above):** each era is an independently owned/shippable file (`supabase/seed/content/<era>.mjs`), so full-depth authoring on eras beyond the two above can run **concurrently**, category-weighted the same way. Any era that clears Codex review + Joey's spot-check before ship day launches deep; anything that doesn't falls back to J7 unchanged. Does not delay or lower the J3.5 gate — pace-limited by Joey's review throughput (see J3.5) and real source availability, not by token/compute budget. | 🟡 **opportunistic first pass** — 7 items added to `1989.mjs` (5 relationship: Calvin Harris, Tom Hiddleston, the start of the Alwyn relationship — the vault's first relationship content anywhere — plus 1 sighting, 1 fashion), plus 1 fashion item each to `fearless.mjs`/`evermore.mjs`, since those facts don't live in the Midnights/TTPD date range. Genuinely real and sourced, not a required part of J3.5 |
| **J4** | `moment` detail — extended context + linked sources + hotlinked photos for key moments | ⬜ |
| **J5** | Per-era theming polish + cover art (theme values already seeded; refine) · product copy (first-run explainer, UNOFFICIAL/about) | ⬜ |
| **J6** | Content QA + editorial coverage pass before launch | ⬜ |
| **J7** | **Post-launch, weekly cadence, fallback for whatever J3.5b didn't clear pre-launch:** bring any remaining thin eras from wavetop to Active-tier depth, one per week, each publicly announced (social) as an "era drop." **Contingent on Joey committing to and sustaining the weekly external announcement** — the depth work alone does nothing for retention without it (see `docs/marketing/ship-readiness-review-2026-07-04.md`). If that commitment isn't sustainable, fall back to shipping depth silently with no retention claim attached. | ⬜ post-launch |

## 📡 Launch-ops & growth track (post-launch, automated — added 2026-07-11)

Once the site is live, operating it is a standing, automated function, not a
side task: **goal #1 growth, goal #2 keeping the fan base loving the app**
(Joey, 2026-07-11). Design + org model:
`docs/proposals/2026-07-11-agentic-operating-model.md` (pending founder
approval — the WPs below inherit its desk/charter pattern and don't start
before it's approved).

| WP | What | Status |
|----|------|--------|
| **L1** | **Watch desk (launch gate):** first define which serving path is authoritative for users (the static LongLive `/` vs the Supabase-wired path — see the known gap at the top of this doc), then uptime + error monitoring on that path's key routes, cost-cap watch, Tier-3 paging; usage-analytics stack decided (decision entry) and baseline wired | ⬜ pre-launch |
| **L2** | **Feedback loop:** in-app feedback (PR #427) + app-store reviews + social complaints funneled into Kevin's triage; recurring themes surface as banked product decisions | ⬜ at launch |
| **L3** | **Growth & Community desk, listening-first:** daily social/media/fandom scan (r/TaylorSwift, X, app stores) → sentiment + opportunity digest in the Founders' Brief; social-account creation TX items surfaced early (lead time) | ⬜ **pre-launch** (pulled forward 2026-07-11, Joey) |
| **L4** | **Automated announcements:** era-drop (J7) + feature announcements as a draft queue founders approve in the brief; scheduled autopost only via an explicit per-channel founder grant (decision entry + channel policy + crisis-stop rule — never via the autonomy ratchet); engagement replies stay human indefinitely | ⬜ post-launch |
| **L5** | **Standing marketing agent (replaces the /marketing command, which Joey judged not-a-team):** monthly research cadence with state between runs (recommended → shipped → measured), verdicts land as banked decisions; `docs/marketing/growth-plan.md` maintained from real metrics, founder-reviewed quarterly. **First deliverable: the launch campaign plan** | ⬜ **pre-launch** (pulled forward 2026-07-11, Joey) |

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
