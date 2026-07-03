# Roadmap — v1 Build Plan

Owner: Wyatt (CTO), with Joey signing off product calls. Derived from
`docs/vision.md` + `docs/architecture.md` (v0.2). This is the execution plan;
architecture is the "what/why," this is the "in what order, and when is each
piece done."

**Read `CLAUDE.md` first** — every work package inherits its Definition of Done
(tests pass, Codex review clean, works mobile + desktop, docs updated, no
secrets) and its workflow rules (branch per task, spec before code, codify
repetition).

---

## v1 scope

**In:**
- Auth (Supabase accounts).
- Ingest pipeline: multi-source → dedupe/cluster → store (titles/snippets/links
  only).
- Classify + verify + rank. **Fake/unverified stories are hidden.**
- Recent-news web feed (the live tail), with aspect filtering.
- Time-travel: **era scrubber + month slider (both v1)** + per-era UI theming.
- Notifications: per-user subscription + quality/rate gate + delivery. The
  retention loop; treated as core UX, not settings.
- Mobile (Expo) parity for feed + time-travel + push.

**Out (v1):** monetization; anything in `architecture.md` "Still open" is a
tuning parameter, not a v1 blocker.

## How work is sized and sequenced

- The unit is a **work package (WP)** sized to fit **one Max rate-limit window
  (~5h autonomous) or less**, so a WP can start and finish inside plan limits
  without thrashing across a refresh. Larger efforts are split into sub-WPs,
  each independently shippable.
- **Effort legend:** `S` ≈ ≤½ window · `M` ≈ ~1 window · `L` ≈ ~2 windows
  (always split into two shippable halves). "Token intensity" flags WPs that
  burn context fast (lots of iteration/preview loops).
- Every WP ends at a **review gate**: `/codex:review` (or
  `/codex:adversarial-review` for the risky ones), all findings fixed, full
  test suite green, before it counts as done.
- **Dependencies are explicit.** Don't start a WP whose start criteria aren't
  met.

## Human-gated actions (a founder must do these — accounts / spend / secrets)

AI cannot create accounts, spend money, or handle secrets. These block specific
WPs — do them just-in-time, not all up front:

| ID | Action | Cost | Blocks |
|----|--------|------|--------|
| H1 | Create the new Supabase project; put URL + keys in `apps/*/.env` | free tier | WP1 |
| H2 | Anthropic API key for the worker (+ set a Console spend cap + alerts) | usage | WP3 |
| H3 | Source access: Reddit app creds, YouTube Data API key, SerpAPI (optional) | free / usage | WP2 (partial — RSS needs none) |
| H4 | Create/link the Vercel project for `apps/web` | free tier | WP4 deploy |
| H5 | Generate Web Push VAPID keys (low friction) | free | WP6 |
| H6 | Expo/EAS account + `eas login` | free tier | WP7 |
| H7 | FCM (Android) + APNs (Apple) push credentials | free / $99 Apple | WP7 mobile push |
| H8 | Apple Developer + Google Play accounts (store distribution) | $99 + $25 | post-v1 store release |
| H9 | ChatGPT sign-in for Codex (`codex login`) + install the CC plugin | Plus/Pro | all review gates |

---

## Work packages

### WP0 — Monorepo scaffold + tooling · `S`
**Goal:** an empty but real monorepo that boots, typechecks, tests, and CI-gates.
**Requirements:** npm workspaces (`apps/web`, `apps/worker`, `packages/shared`,
`packages/core`); TS strict everywhere; Vitest; ESLint/Prettier;
`npm run typecheck` + `npm run test` scripts at root; GitHub Actions CI running
both on PRs. No product code.
**Start criteria:** `main` up to date. No human gate.
**Finish / acceptance:** `apps/web` renders a placeholder page locally; worker
runs a no-op; `typecheck` + `test` green locally **and** in CI on the PR; Codex
review clean.
**Effort:** S (~½ window). **Human-gated:** none.

### WP1 — Supabase project + schema + shared types · `M`
**Goal:** the data foundation, matching `architecture.md`.
**Requirements:** migrations in `supabase/migrations` for: `channel`, `source`,
`story` (with `aspect`, `cluster_id`, `credibility`, `rank_signals`,
`classified_at`, `published_at`), `cluster`, `era` (with theme tokens),
`milestone`, `app_user`, `subscription`, `feedback`. RLS on all user-scoped
tables. **CHECK constraints forbidding article bodies / rehosted images.**
`packages/shared` types mirror the schema exactly. Seed: Taylor channel + eras +
wavetop milestones (write a **seed generator**, per rule 8 — don't hand-enter
12+ eras).
**Start criteria:** WP0 merged; **H1 done** (Supabase project exists, env set).
**Finish / acceptance:** migrations apply cleanly to the new project; RLS
policies verified (anon can read public feed, cannot read another user's prefs);
seed populates eras + milestones; `shared` types compile against real rows;
Codex review clean.
**Effort:** M (~1 window). **Human-gated:** H1.

### WP2 — Ingest pipeline (port from Orbit) · `L` → split
**Goal:** real stories flowing into the DB, deduped and clustered.
**Requirements:** `apps/worker` one-shot job. **WP2a:** source adapters
(RSS first — no keys; then Reddit + YouTube) → normalize to `story` rows
(titles/snippets/links/metadata only). **WP2b:** dedupe + clustering (port
Orbit's approach) → `cluster` assignment. Idempotent re-runs. Smoke tests per
source.
**Start criteria:** WP1 merged; **H3** for non-RSS sources (RSS can start with
none).
**Finish / acceptance:** a worker run ingests real, current stories into the new
DB; duplicates collapse into clusters; CHECK constraints hold (no bodies);
`test:sources` + `test:cluster` green; Codex review clean.
**Effort:** L (split: WP2a S–M, WP2b M). **Human-gated:** H3 (partial).

### WP3 — Classify + verify + rank · `M`
**Goal:** each story gets an aspect, a credibility verdict, and a rank; **fakes
are hidden.**
**Requirements:** worker step that (a) classifies `aspect`
(music/fashion/travel/tours/relationship/business), (b) scores `credibility`
via the LLM **worker-side only, classify-once (`classified_at`), hard daily cap
+ rule-based fallback**, (c) computes rank signals. Feed queries in
`packages/core` **exclude** below-bar stories by default. Cost cap + fallback
covered by tests.
**Start criteria:** WP2 merged; **H2 done** (Anthropic key + spend cap).
**Finish / acceptance:** stories carry aspect + credibility + rank; a seeded
"fake" story is absent from feed queries; the daily cap halts LLM calls and the
rule fallback still classifies; classify-once verified (no re-classify on
re-run); `test:classify` green; **`/codex:adversarial-review`** (cost-control
path = risky) clean.
**Effort:** M (~1 window). **Human-gated:** H2.

### WP4 — Web reader: auth + recent-news feed · `L` → split
**Goal:** first end-to-end user-visible product — log in, see the live verified
feed.
**Requirements:** **WP4a:** Supabase Auth (email/OAuth), session, protected
routes, `packages/core` data-access for the feed. **WP4b:** feed UI (latest
slice) via Next.js App Router — ranked list, aspect filters, responsive
(mobile + desktop), empty/loading/error states. Only non-hidden stories shown.
**Start criteria:** WP3 merged; **H4** for deploy preview.
**Finish / acceptance:** deployed Vercel preview: user logs in and sees a live,
verified, ranked feed; aspect filter works; fakes never appear; passes mobile +
desktop viewports; typecheck + component tests green; Codex review clean.
**Effort:** L (split: WP4a M, WP4b M). **Human-gated:** H4. **Token intensity:**
high (UI iteration).

### WP5 — Time-travel navigator (era scrubber + month slider + theming) · `L` → split
**Goal:** the signature feature — scrub eras and months, UI re-themes per era.
This is the reference workload; **latency is the feature.**
**Requirements:** **WP5a:** era switcher — morph-on-grab scrubber (persistent
peek + grab-to-expand + overscroll-top summon), snap to era boundaries,
bidirectional coupling with content; per-era **theme tokens** transform
colors/fonts/design on selection. **WP5b:** month slider within an era over
historical time-range queries; deeper history lazy-loads; era/milestone overlay
prefetched. Web impl = CSS transforms + `requestAnimationFrame`, **no per-frame
React state.**
**Start criteria:** WP4 merged (feed + data access exist).
**Finish / acceptance:** scrubbing eras and months holds **60fps** on a mid-tier
profile (measured, not asserted); UI re-themes correctly per era; content always
matches the selected time slice; no network wait during scrub; typecheck +
tests green; **`/codex:adversarial-review`** (perf-critical) clean.
**Effort:** L (split: WP5a M–L, WP5b M). **Human-gated:** none. **Token
intensity:** very high (animation/perf iteration) — budget a fresh window per
sub-WP.

### WP6 — Notifications subsystem · `L` → split
**Goal:** the retention loop — users get only what they want, at their rate,
never spammed.
**Requirements:** **WP6a:** subscription model UI + storage (per-aspect/topic
opt-in) as an *integral* surface, not a settings dump; quality gate (only
high-rank verified stories eligible) + per-user rate limiter (never
over-notify). **WP6b:** delivery via **Web Push** (VAPID), emitted by the
worker's `notify` step after rank + verify; dedupe against already-sent.
**Start criteria:** WP4 merged (auth + users) and WP3 (rank/verify); **H5**
(VAPID).
**Finish / acceptance:** a user subscribes to chosen aspects at a chosen rate,
receives only high-quality verified pushes on web, and is provably **not**
over-notified (rate limiter test); no duplicate sends; typecheck + tests green;
Codex review clean.
**Effort:** L (split: WP6a M, WP6b M). **Human-gated:** H5.

### WP7 — Expo mobile app · `L` → split
**Goal:** mobile parity, reusing `shared`/`core` unchanged.
**Requirements:** **WP7a:** `apps/mobile` Expo app — auth + feed reusing
`packages/*`; native navigation. **WP7b:** native time-travel timeline
(**Reanimated + Gesture Handler on the UI thread**) at 60fps + Expo Push.
**Start criteria:** WP5 + WP6 merged; **H6** (Expo/EAS), **H7** (push creds) for
push.
**Finish / acceptance:** app runs on iOS + Android (EAS dev build); feed +
time-travel + notifications at parity with web; native timeline holds 60fps on
mid-range Android; `shared`/`core` reused with zero forks; Codex review clean.
**Effort:** L (split: WP7a M, WP7b L). **Human-gated:** H6, H7. **Token
intensity:** high.

### WP8 — Hardening & pre-launch (rolling / post-feature) · `M`
**Goal:** production-readiness.
**Requirements:** E2E happy-path tests; error/empty states everywhere;
accessibility pass; basic monitoring/alerting; UNOFFICIAL-stance copy + legal
review; performance regression check on WP5.
**Start criteria:** WP4–WP7 substantially done.
**Finish / acceptance:** E2E suite green; a11y checks pass; monitoring live;
copy reviewed; Codex review clean.
**Effort:** M, rolling. **Human-gated:** none (store release = H8, post-v1).

---

## Suggested execution order (per window)

| Window | WP | Notes |
|--------|-----|-------|
| 1 | WP0 + start WP1 | scaffold; do H1 during this window |
| 2 | WP1 finish | schema + seed generator |
| 3 | WP2a | RSS ingest end-to-end |
| 4 | WP2b | dedupe/cluster |
| 5 | WP3 | classify/verify/rank — do H2 first |
| 6 | WP4a | auth + data access — do H4 |
| 7 | WP4b | feed UI (first demo-able product 🎉) |
| 8–9 | WP5a, WP5b | signature feature; one window each |
| 10 | WP6a | subscriptions + gate — do H5 |
| 11 | WP6b | Web Push delivery |
| 12–13 | WP7a, WP7b | mobile — do H6/H7 |
| rolling | WP8 | hardening |

Rough v1 total: **~13 focused windows** of build + rolling hardening. Chunked so
any single window is a clean start→finish with a review gate, respecting plan
limits and the "don't thrash across a refresh" cost rule.

## Key risks

- **WP5 perf** — the whole product's feel. Mitigation: adversarial review + a
  measured 60fps gate, per-platform impl, no per-frame React state.
- **Source reliability / rate limits** (WP2) — start with RSS (no keys), add
  keyed sources incrementally.
- **Notification spam** (WP6) — the rate limiter is a hard acceptance test, not
  a nice-to-have; over-notifying is a product-killing failure.
- **LLM cost** (WP3) — daily cap + classify-once + rule fallback, all tested.

## First action

**WP0 needs no human gate** — it can start immediately. WP1 unblocks the moment
**H1 (Supabase project)** is done, so kick that off in parallel with WP0.
