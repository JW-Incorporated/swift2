# Architecture

Owner: Wyatt (CTO). Source of truth for stack, hosting, data, and coding
standards. Expensive-to-reverse choices are mirrored in `docs/decisions.md`.

Status: **v0.2** — reconciled with Joey's now-written `docs/vision.md`. v0.1
assumed a static, editorial Vault; the vision makes the Vault a time-indexed
*news archive* and makes notifications + verification core. Changes below are
flagged **[confirm]** where they involve an interpretive call Wyatt/Joey should
ratify.

---

## What the product is (from vision.md)

1. **Recent News (primary).** A live, all-aspects Taylor feed — music, fashion,
   travel, tours, relationships, business. AI + user input **verify** stories
   (real vs. fake; fakes may be shown but clearly labelled). **Notifications
   are the core experience**, not a settings screen: high-quality only,
   user-tuned rate, never over-notify. Notifications are the retention loop.
2. **Time Travel (secondary).** The same news experience at a past point in
   time, sliced by **eras**. Selecting an era transforms the whole UI (colors,
   fonts, design); a **month-level timeline** browses the news *of that moment*.

Out of scope for v1: **monetization**.

## Guiding principle

Boring, proven, already-operated beats theoretically-optimal. We inherit both
the **stack and the ingest pipeline** from the sibling project **Orbit**, which
already does exactly this: many sources (RSS/Reddit/YouTube) → deduplicated,
classified, ranked feed per public figure. Swift2 = Orbit's pipeline + a
notifications-first UX + a time-travel/era UI over the same data. We reuse
Orbit's *patterns and code* on a **new, isolated backend** (not Orbit's prod
data/quota).

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | **TypeScript** everywhere | web, mobile, worker, shared |
| Web | **Next.js (App Router)** | SSR/SSG + CDN; Vercel |
| Mobile | **Expo / React Native** | iOS + Android, one codebase |
| Ingest/verify worker | **Node/TS one-shot job** (Orbit's `apps/worker` shape) | ingest → cluster → classify → verify → rank → notify; runs on a schedule (GitHub Actions) |
| Shared logic | **`packages/shared`** (types/domain, no I/O) + **`packages/core`** (data access) | portable across web + Expo |
| Backend / DB / auth | **Supabase** (Postgres + RLS + Auth + Storage) | new isolated project |
| Push notifications | **Expo Push** (mobile) + **Web Push** (web) | delivery layer for the notifications subsystem |
| Web hosting | **Vercel** | |
| Mobile builds | **EAS** | |
| Animation/gesture | **Reanimated + Gesture Handler** (native); **CSS transforms + rAF** (web) | per-platform, for the time-travel scrubber |

Monorepo (npm workspaces, Orbit's layout):

```
apps/web        Next.js reader + notification prefs
apps/mobile     Expo app                     (added when mobile starts)
apps/worker     ingest → verify → rank → notify one-shot job
packages/shared types + domain, zero I/O — portable
packages/core   data-access over Supabase — portable
```

**Hard boundary:** business logic lives in `shared`/`core`, never in a view
layer. The view layer is the only non-portable code.

## Data architecture — one time-indexed news store, two presentations

v0.1 wrongly split "static Vault" from "live News." Corrected: there is **one
store of classified, ranked, verified stories, indexed by time**. Presentation
differs, data does not:

- **Recent News** = the latest time slice (live tail of the same store).
- **Time Travel / era view** = a historical slice, filtered by era and month.

On top of that store sits a **thin editorial layer** (small, curated,
versioned in the repo):

- **`era`** — id, title, album, start/end dates, order, **theme tokens**
  (colors, fonts, design treatment), cover art ref.
- **`milestone`** — id, era_id, type (`album_release` | `tour`), title, date.
  **Wavetops only** — navigation anchors, not every event.

### Core story model (Orbit-derived)

- **`story`** — title, snippet, source link, published_at, aspect
  (music/fashion/travel/tours/relationship/business/…), cluster id, rank
  signals, and:
  - **`credibility`** — verification state (see below).
  - **`classified_at`** — classify-once marker (LLM runs once per story, never
    on read).
- **Never store article bodies or rehost images** — titles/snippets/links/
  metadata only (inherited legal posture; enforce with CHECK constraints).

Because "recent" and "era" are the same rows at different timestamps, the
time-travel UI needs no separate content pipeline — only time-range queries +
the editorial era/milestone overlay.

## Verification / credibility subsystem

The vision's "real vs. fake" promise:

- **AI signal (worker-side, capped):** during classify, the worker scores
  plausibility/credibility. LLM calls are worker-only, classify-once, with a
  hard daily cap + rule-based fallback — never in a user path.
- **User signal:** reader feedback (confirm/dispute) feeds a credibility score.
- **Presentation (decided 2026-07-03):** low-credibility / unverified stories
  are **hidden** from the feed entirely — not shown-and-labelled. The feed only
  ever surfaces stories that clear the credibility bar. (We'll iterate on where
  the bar sits.)

## Notifications subsystem (first-class — this is the retention loop)

Treated as core product surface, not settings:

- **Per-user subscription model:** which aspects/topics a user wants (e.g.
  "fashion + tours, not business"), stored per account.
- **Rate control:** user sets desired frequency; the system **never
  over-notifies**. A quality gate means only high-rank, verified stories are
  eligible; a per-user rate limiter spaces delivery.
- **Delivery:** Expo Push (mobile) + Web Push (web), emitted by the worker's
  `notify` step after ranking + verification.
- **[confirm] Open product questions for Joey:** what "high quality" means
  quantitatively (rank threshold?), and how rate preferences map to cadence.
  These refine the model; they don't block scaffolding it.

## Auth (corrected — load-bearing in v1)

v0.1 said v1 could be login-free. **Wrong given the vision:** personalized,
rate-tuned notifications require accounts + a preferences store. So:

- **Supabase Auth in v1.** Users have accounts; notification prefs and
  verification feedback are per-user.
- RLS on for all user-scoped tables. Public read of the story feed itself is
  fine; personalization requires login.

## Reference workload — the time-travel navigator (shapes the build)

Two levels of time navigation, from the vision:

1. **Era switcher (coarse):** the morph-on-grab timeline scrubber Wyatt
   specified — persistent peek strip + grab-to-expand + overscroll-top summon;
   **snap to era boundaries in v1**. Selecting an era transforms the UI via that
   era's **theme tokens** (colors/fonts/design).
2. **Month slider within an era (fine) — in v1 (decided 2026-07-03):** browse
   news month-by-month inside the selected era. Ships in v1 alongside the era
   switcher; expect a few UX iterations.

Interaction axes: horizontal = era switching, vertical = content within a
slice, bidirectionally coupled (scrub → jump; scroll into a new slice → the
timeline reflects it).

### Performance (non-negotiable — "smooth and low-latency" IS the feature)

- 60fps on mid-tier hardware incl. mid-range Android.
- **Mobile:** gesture + animation on the **UI thread via Reanimated worklets +
  Gesture Handler**. No per-frame React/JS-thread state.
- **Web:** **CSS transforms + `requestAnimationFrame`**. No `setState` per
  pointer-move.
- Era/milestone overlay + the visible time window are prefetched/cached so
  scrubbing never waits on the network; deeper history lazy-loads.

### Shared vs per-platform

- **Shared:** era/milestone/story data models, time-range query logic, the
  scrub-position → era/month → content-slice mapping, snap math, theme-token
  definitions.
- **Per-platform (view only):** the gesture recognizer + animated timeline
  (web: Pointer Events + CSS/rAF; native: Reanimated + Gesture Handler), and
  the era-theming application. Deliberate exception to "write once" — a shared
  abstraction over two animation runtimes would risk the frame budget.

## AI-integration approach

- LLM calls only in the **worker**, classify-once, with a hard daily cap +
  rule-based fallback. Never in a synchronous user path (Orbit's rule).
- Keys only in gitignored env files; never committed, never printed.
- Verification scoring is the v1 LLM use; each future AI feature gets its own
  decision-log entry with a cost model first.

## Coding standards (first draft — Wyatt to ratify)

- TypeScript strict across all workspaces; `npm run typecheck` green before any
  PR.
- Business logic in `shared`/`core`; views thin and platform-specific.
- Conventional commits: `feat(vault): …`, `fix(web): …`, `docs: …`.
- Branch per task; never commit to `main`; tests for every feature; full suite
  green before "done".
- Titles/snippets/links/metadata only — never article bodies or rehosted
  images.

## Suggested v1 build order (proposal — needs a spec per feature)

1. **DB schema + Supabase project** (story, era, milestone, credibility, user,
   subscription) + `packages/shared` types.
2. **Port Orbit's ingest → cluster → classify pipeline** onto the new backend;
   add the verification scoring step.
3. **Web reader**: recent-news feed (latest slice) — proves the pipeline
   end-to-end.
4. **Time-travel navigator**: era scrubber + theming over historical slices.
5. **Notifications**: subscription model + rate/quality gate + delivery.
6. **Expo app**: reuse `shared`/`core`, native timeline + push.

## Decided 2026-07-03 (were open questions)

- **Fake/unverified stories: hidden** from the feed (not labelled-and-shown).
- **Month-level slider: in v1** (with the era switcher).

## Still open (product — for Joey; don't block building)

- Quantitative definition of "high-quality" notification (rank/credibility
  threshold) and how rate prefs map to cadence — expected to iterate.
- Where exactly the credibility bar sits for hiding stories — expected to
  iterate.
- App name (still TBD).
