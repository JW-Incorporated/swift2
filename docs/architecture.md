# Architecture

Owner: Wyatt (CTO). This is the source of truth for stack, hosting, data, and
coding standards. Expensive-to-reverse choices are mirrored as entries in
`docs/decisions.md`.

Status: v0.3 — reflects the actual structure map from the Fable 5.1
architecture review (`docs/reviews/2026-09-fable-architecture-review.md`,
2026-09-04, read-only review of `origin/main`). That review is the baseline
for everything in this section; re-read it for full detail (dependency
graphs, duplication inventory, hotspot rankings) — this doc summarizes it.

## What this repo actually is — two products in one

1. **The website.** Small, fast, honestly simple: **one client-rendered
   Next.js page** (`app/page.tsx` → `components/longlive/LongLive.tsx`) over
   **build-time generated TypeScript**. Content is authored in
   `supabase/seed/**`, compiled by `scripts/sync-longlive-content.mjs` and
   siblings into six `*.generated.ts` files (content, tracks, theories,
   videos, era-secrets, song-moods — manifest in
   `scripts/lib/generated-content.mjs`), and shipped as a static, CDN-cached
   client bundle. This is the interactive era/threads reader users see at
   `/`. **Its operational manual is `docs/longlive-experience.md` — read it
   before touching site UI.**
2. **The factory around it.** ~57k lines in `scripts/` (thirteen
   sub-engines), 39 GitHub Actions workflows, and 23 registered Claude desk
   routines (15 enabled) that write content, file issues, post to social,
   and merge their own PRs. CI (`ci.yml` job `build`) is the only reviewer
   for most of what lands — 764 PRs merged in the last 30 days on this
   auto-merge path. **Its operational manual is `docs/AUTOMATION.md` — read
   it before touching any workflow, script, or desk routine.**

Both are real, both are load-bearing, and neither substitutes for the other's
manual.

## The Supabase Vault read path — pending a founder decision

There are two separate, non-overlapping content pipelines that both produce
"Taylor's timeline" content:

- **Static-generated (live, in production).** Described above — this is
  what `/` actually serves. Deleted from the web UI on 2026-08-11 (the old
  `VaultReader.tsx` era-scrubber component); recoverable from git history if
  ever wanted again.
- **Supabase-direct (built, not on the web read path; mobile's only Vault
  data source today).** `apps/web/app/vault/{tier0,moment,album/[slug]/tracks}`
  routes and `apps/web/lib/vault.ts` → `packages/core/src/vault.ts` read
  live from Supabase `era`/`milestone`/`month_item`/`moment`/`track_note`
  tables, seeded via `db-seed.yml`. `/vault/tier0` is the default target of
  `npm run check:budget`. `apps/mobile/lib/vault.ts` +
  `VaultNavigator.tsx` are the one real, working consumer.

**This duplication is a known, recorded fork (`docs/decisions.md`
2026-07-17, 2026-08-23), not an accident — but whether to keep both
pipelines running is an open founder decision, not yet resolved.**
`docs/proposals/2026-09-vault-read-path.md` (R24) lays out the two options:

- **Option A (recommended in that doc):** mobile switches to reading the
  same generated static content the web ships; retire the Supabase Vault
  read path (routes, `packages/core/src/vault.ts`, `db-seed.yml`'s Vault
  targets, eventually the tables).
- **Option B:** reverse direction — make the live web UI read from Supabase
  instead of the static generated file, converging on the schema mobile
  already uses. Much larger blast radius; reopens a latency/scale problem
  the static approach already sidesteps.

**Until Joey decides, treat both pipelines as live and supported.** Do not
delete or repurpose either side of it without a decision recorded in
`docs/decisions.md`.

## Guiding principle

Boring, proven, already-operated beats theoretically-optimal. Two people plus
AI can't afford to babysit novel infra. We deliberately inherit the stack
topology from the sibling project **Orbit**, which already runs this exact
shape of problem (a Taylor Swift app, web now + Expo mobile next, two-person
AI-first team). We reuse Orbit's *patterns and code*, not its *backend* — see
Decision: "Reuse Orbit stack, separate backend."

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | **TypeScript** everywhere | Web, mobile, shared logic, any worker |
| Web | **Next.js (App Router)** | SSR/SSG + CDN caching; deploys on Vercel |
| Mobile | **Expo / React Native** | iOS + Android from one codebase |
| Shared logic | **`packages/shared`** (types, domain, no I/O) + **`packages/core`** (data access) | Must stay platform-agnostic so web and Expo reuse it unchanged |
| Backend / DB / auth | **Supabase** (Postgres + RLS + Auth + Storage) | New, isolated project — NOT Orbit's |
| Web hosting | **Vercel** (auto-deploy from `main` once we allow it) | |
| Mobile builds | **EAS (Expo Application Services)** | |
| Animation / gesture | **Reanimated + Gesture Handler** (native); **CSS transforms + rAF** (web) | The one place logic is NOT shared — see reference workload |

Monorepo, npm workspaces (Orbit's layout):

```
apps/web        Next.js reader (438 files, ~81k lines incl. generated)
apps/mobile     Expo app: Vault navigator + notification settings/inbox (35 files, ~2.2k lines)
apps/worker     News/Current ingest pipeline, run every 4h (49 files, ~4.7k lines)
packages/shared types + domain, zero I/O — portable (39 files, ~4.7k lines)
packages/core   data-access layer over Supabase — portable (40 files, ~7.6k lines)
scripts/        automation: 13 sub-engines + 83 top-level scripts (311 files, ~57k lines)
supabase/       33 migrations + 90 seed files — the content corpus (123 files, ~95k lines)
```

**Reality check on the "hard boundary" below:** in practice the entire
reader domain layer (`apps/web/lib/longlive/*`, 201 files) lives inside the
app, not in `packages/*`. `packages/shared`/`packages/core` hold almost none
of the web reader's logic today. The boundary below is the intended
target, not the current state — see the Fable review §1.3/§3.2 for the
specific layer violations (`types.ts` depending on generated data,
`merch.ts` reaching into `supabase/seed/**` directly).

**Hard boundary (intended):** new business logic goes in `packages/shared`
or `packages/core`, never in an app's view layer. The view layer (React
components, screens) is the only non-portable code. This is what lets the
future Expo app reuse everything but the views.

## Data architecture: two worlds, kept apart

The product has two content cadences that must not be coupled:

1. **Vault — curated, slow, editorial.** Eras, milestones (album releases,
   tours), fashion looks. Authored and versioned *in the repo* (seed files /
   migrations), effectively static between deploys, aggressively cacheable,
   served from the CDN today via the static-generated pipeline described
   above. This is the world the era-scrubber navigates.
2. **News / Current — live, polled, ranked.** Changing hourly via
   `apps/worker` (Orbit-style worker), the one genuinely live-from-DB
   surface on the web (`/vault/current/[eraId]`, `/vault/live-theories`, ISR
   900s). Volatile, freshness matters.

They live in separate tables and are served on separate surfaces/routes. The
Vault must never inherit the News feed's volatility or its cache-busting. This
mirrors Orbit's split and is a deliberate boundary.

### Vault data model (v1)

Editorial content, small and typed. Shape (names illustrative):

- **`era`** — id, title, album, start_date, end_date, order, color/theme,
  cover art ref. Ordered along the timeline.
- **`milestone`** — id, era_id, type (`album_release` | `tour`), title, date,
  optional link/art. **Wavetops only** in v1 — high-visibility events, not
  every single/MV.

Milestones are the navigation anchors the scrubber renders. Because the set is
small and curated, the whole Vault can be fetched/cached as one static payload
per channel and driven client-side with zero per-frame network cost.

## Reference workload — the Vault era-scrubber (this shapes the build)

The Vault's primary navigation is a **morph-on-grab timeline scrubber**. The
build is designed around it from day one, not retrofitted.

**Interaction model — two axes, bidirectionally coupled:**

- **Horizontal = era switching**, driven by the timeline scrubber.
- **Vertical = content within an era.**
- Coupling is two-way: scrubbing the timeline jumps the page to that era; and
  scrolling content into a new era updates the timeline's position indicator.

**Summon / expand behavior:**

- A persistent thin **peek strip** sits at the top (always discoverable).
- **Grabbing** the strip expands it into the full navigator (primary
  affordance).
- **Overscroll at the top of an era** also expands it (pull-to-refresh muscle
  memory, but it navigates). Fired only at the content top edge so it never
  fights normal vertical scroll.

**Snap:** v1 snaps to **era boundaries only**. (Free-scrub with milestone
sub-anchors is a possible v2; explicitly out of scope now.)

**Milestones:** wavetops only — album releases and tours. Rendered as markers
inside the expanded timeline to aid orientation.

### Performance requirements (non-negotiable — "smooth and low-latency" IS the feature)

- The scrub gesture and the coupled page transition must hold 60fps on mid-tier
  hardware, including mid-range Android.
- **Mobile:** all gesture + animation runs on the **UI thread via Reanimated
  worklets + Gesture Handler**. No React/JS-thread state updates per frame.
- **Web:** driven by **CSS transforms + `requestAnimationFrame`**. No React
  `setState` per pointer-move (that drops frames).
- The full Vault dataset is loaded/cached up front so scrubbing never waits on
  the network. Era content is virtualized/lazy where heavy (images), but
  timeline markers are cheap and always resident. In production this shows up
  as the entire content corpus (~20k lines of generated TS) shipping in the
  web client bundle — an intentional static/CDN tradeoff, not an oversight.

### What is and isn't shared across platforms

- **Shared** (`packages/shared` / `packages/core`): era + milestone data model,
  ordering, the mapping from scrub-position → era → content section, snap math.
- **Not shared** (per-platform view layer): the gesture recognizer and the
  animated timeline component itself — one web implementation (Pointer Events +
  CSS/rAF), one native implementation (Reanimated + Gesture Handler). Same data
  and snap logic underneath; different animation runtime on top.

This is the deliberate exception to "write once": we accept two gesture
implementations because a shared abstraction over two very different animation
runtimes would cost more than it saves and would risk the frame budget.

## Auth

Supabase Auth. Depth depends on Joey's vision (read-only content vs. accounts /
UGC). v1 assumes the Vault is public, read-only, no login required; auth is
provisioned but not load-bearing until a feature needs per-user state. RLS on
by default for any user-scoped table.

## AI-integration approach

Carried over from Orbit's discipline:

- Any LLM calls happen only in a **worker / server path with a hard daily cost
  cap and a rule-based fallback**, never in a synchronous user-request path.
- Keys live only in gitignored env files (`apps/*/.env*`), never committed,
  never read into output.
- No user-facing AI feature is in scope until a spec calls for one; when one
  does, it gets its own decision-log entry (cost model, latency budget, where
  keys live).
- **Reality check:** every LLM call site currently hand-writes its own
  Anthropic/OpenAI client, headers, and usage cap (six distinct
  implementations across web, worker, and scripts — see the Fable review
  §2.3). Consolidating this is on the review's remediation list; until that
  lands, treat each call site's cap as independent and per-instance, not a
  shared global cap.

## Coding standards (first draft — Wyatt to ratify)

- TypeScript strict mode across all workspaces.
- `npm run typecheck` must pass before any PR.
- Business logic in `shared`/`core`; views stay thin and platform-specific
  (see the "reality check" above — this is aspirational today).
- Conventional-commit style: `feat(vault): …`, `fix(web): …`, `docs: …`.
- Branch per task (`feature/<name>`, `fix/<name>`); never commit to `main`.
- Automated tests for every feature; full suite green before "done." (Note:
  63 of 81 web components currently have no test, and 27 of 39 existing
  component test files are `readFileSync` string-greps rather than a
  rendered-DOM assertion — see the Fable review §5.3.)
- **Media & content sourcing** (full policy + rationale: `docs/decisions.md`,
  2026-07-09 "no rules against hosting photos"). The product presents rich
  media on-site (goal #7 — users don't click out):
  - **Text:** original summaries in our own words + links; never paste article
    bodies / lyrics / official statements verbatim.
  - **Images: no hosting restriction.** Any real photo may appear on-site by
    any means — oEmbed, hotlink, or **rehost/CDN** (paparazzi, press, agency
    all included), with a credit line where available. A knowing risk
    acceptance, not an oversight. The only image rules are content-integrity:
    **no AI-generated fakes,** and reference/comparable stand-ins (e.g. a
    designer's prior work standing in for a not-yet-photographed item) must be
    visibly labeled as reference, never presented as the real thing.
  - **Monetization** (affiliate/commercial) ships only after **external
    IP-counsel review**; UNOFFICIAL disclaimer stays prominent.
  - Unchanged: the no-fabrication rule and the Tier 0 payload budget.

## Shipping one feature across web + mobile (first draft — Wyatt to ratify)

The shared-package boundary above answers *where code lives*. This answers
*how a feature actually ships without the three surfaces drifting apart* —
Joey's 2026-07-17 question, prompted by the mobile app (`apps/mobile`)
approaching real use. The risk isn't writing a feature three
times (the shared boundary already prevents that); it's that **web deploys
instantly on every merge and mobile does not** — an EAS store build sits in
App Store / Play review for days, and adoption of a new version is gradual,
never instant. Any process here has to survive that asymmetry.

**The checklist, in order, for a feature that touches data:**

1. Schema/data change (if any) → `packages/core`, with a migration.
2. Shape the feature's types once in `packages/shared` — this is the single
   contract both apps read; a mismatch here is where drift actually starts.
3. Implement the view in `apps/web` against that shared shape. Ships on the
   next merge to `main` (Vercel auto-deploy) — no lag.
4. Implement the view in `apps/mobile` against the *same* shared shape —
   never re-derive the data logic per-platform (see `apps/mobile/lib/vault.ts`
   for the existing pattern: it imports `@swift2/core` directly, it doesn't
   reimplement it). Ships on the next EAS store build — **days of lag**, and
   not every installed copy updates immediately after.
5. The one standing exception: if the feature touches the timeline-scrubber's
   gesture/animation layer, it's implemented twice on purpose (see that
   decision above) — everything else follows steps 1-4 unchanged.
6. Test once, mostly: unit tests for the shared logic in `packages/*` cover
   both platforms simultaneously — that's the whole payoff of the boundary.
   Add platform-specific tests only for the thin view layer itself.

**Backend compatibility across the mobile release lag (the actual hard part
ChatGPT's summary correctly flagged as "version drift"):** because an old
mobile build can be in the wild for days-to-weeks after a backend/schema
change ships, `packages/core`'s public shape is an **additive-only contract**
until further notice — add fields/endpoints freely, but don't remove or
repurpose one that a shipped mobile build still reads without a deprecation
window. (Formal API versioning is overkill at this scale; this single rule is
the cheap version of it. Revisit if/when usage data shows real staggered
adoption across versions.)

**Feature flags — not built yet, and deliberately not built until a feature
needs it.** Web can revert a bad change in a minute; mobile cannot un-ship a
build. The plan for when a mobile-facing feature is risky enough to want a
kill switch without a new store submission: a small remote config read at
app launch (a single row in Supabase, or even a static JSON the app already
has a data client for — no new vendor, matches the cost rails) gating the
feature client-side. Build this the first time a feature actually needs it,
not speculatively.

**Where this lives going forward:** this section, updated in the same PR as
any change to the shared boundary or the mobile release process. Anything
that turns out to be genuinely hard to reverse (e.g., committing to real API
versioning, adopting a paid feature-flag vendor) gets its own
`docs/decisions.md` entry when it happens, same as any other stack choice.

## Operational manuals (read these before touching the live system)

- **`docs/longlive-experience.md`** — the statically-authored web reader UI
  (the era/threads experience at `/`): components, state, content flow.
- **`docs/AUTOMATION.md`** — the three-tier automation factory: GitHub
  Actions (deterministic), Claude desk routines (judgment), and product cron.

## Open questions (need Joey's vision or a later decision)

- Product class: read-only content vs. social/UGC vs. utility — gates how much
  auth/RLS/realtime we actually build.
- Free-scrub-with-milestone-anchors (scrubber v2) — deferred.
- **Supabase Vault read path — retire (Option A) or adopt (Option B)?** See
  above and `docs/proposals/2026-09-vault-read-path.md`. Pending Joey's
  decision; not yet resolved.

_Resolved:_ v1 scope is the **Vault only**; the News/Current world is out of v1
(see `docs/decisions.md`, 2026-07-03).
