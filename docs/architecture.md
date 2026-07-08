# Architecture

Owner: Wyatt (CTO). This is the source of truth for stack, hosting, data, and
coding standards. Expensive-to-reverse choices are mirrored as entries in
`docs/decisions.md`.

Status: v0.2 — stack proven against the reference workload. The Supabase-backed
web Vault reader (era-scrubber + two-tier serving, `VaultReader.tsx`/
`lib/vault.ts`) was built against this plan, but is **currently unmounted** —
`/` renders the static LongLive experience instead (see the front-end note
below and `docs/longlive-experience.md`). The Expo mobile app is scaffolded
reusing `packages/*` unchanged (validating the shared boundary). Product
vision (`docs/vision.md`) is still Joey's to fill in; this doc grows as
features are specced.

> **Front-end note.** The interactive experience currently shipped on the web
> (the era/threads reader at `/`) is a self-contained, statically-authored
> layer under `apps/web/components/longlive/**` + `apps/web/lib/longlive/**`.
> It does not yet read from the Supabase two-tier path described below. That
> layer has its own manual: **`docs/longlive-experience.md`** — read it before
> working on the site UI. This doc remains the source of truth for the
> underlying stack/data plan the two will converge on.

---

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
apps/web        Next.js reader
apps/mobile     Expo app            (scaffolded — reuses packages/* unchanged)
packages/shared types + domain, zero I/O — portable
packages/core   data-access layer over Supabase — portable
```

**Hard boundary:** new business logic goes in `packages/shared` or
`packages/core`, never in an app's view layer. The view layer (React
components, screens) is the only non-portable code. This is what lets the
future Expo app reuse everything but the views.

## Data architecture: two worlds, kept apart

The product has two content cadences that must not be coupled:

1. **Vault — curated, slow, editorial.** Eras, milestones (album releases,
   tours), fashion looks. Authored and versioned *in the repo* (seed files /
   migrations), effectively static between deploys, aggressively cacheable,
   served from the CDN. This is the world the era-scrubber navigates.
2. **News / Current — live, polled, ranked.** Changing hourly via an ingest
   pipeline (Orbit-style worker, if/when we build it). Volatile, freshness
   matters.

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
  timeline markers are cheap and always resident.

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

## Coding standards (first draft — Wyatt to ratify)

- TypeScript strict mode across all workspaces.
- `npm run typecheck` must pass before any PR.
- Business logic in `shared`/`core`; views stay thin and platform-specific.
- Conventional-commit style: `feat(vault): …`, `fix(web): …`, `docs: …`.
- Branch per task (`feature/<name>`, `fix/<name>`); never commit to `main`.
- Automated tests for every feature; full suite green before "done."
- Never store article bodies or rehost images — titles/snippets/links/metadata
  only (a rule inherited from Orbit's legal posture; revisit if vision changes).

## Open questions (need Joey's vision or a later decision)

- Product class: read-only content vs. social/UGC vs. utility — gates how much
  auth/RLS/realtime we actually build.
- Free-scrub-with-milestone-anchors (scrubber v2) — deferred.

_Resolved:_ v1 scope is the **Vault only**; the News/Current world is out of v1
(see `docs/decisions.md`, 2026-07-03).
