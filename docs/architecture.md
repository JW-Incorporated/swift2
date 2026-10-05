# Architecture

Owner: Wyatt (CTO). This is the source of truth for stack, hosting, data, and
coding standards. Expensive-to-reverse choices are mirrored as entries in
`docs/decisions.md`.

Status: v0.4 — rewritten 2026-09-10 against current `origin/main` (superseding
the v0.3 rewrite from PR #3725, which itself went stale within a day as
OS-021/OS-039 landed). This doc describes what the repo actually is today,
not a plan still in progress.

## What this repo actually is — two products in one, plus a mobile app now on a headless core

1. **The website.** One client-rendered Next.js page (`apps/web/app/page.tsx`
   → `<LongLive/>` in `apps/web/components/longlive/**`) driven by
   `apps/web/lib/longlive/**`. Content used to live in committed
   `*.generated.ts` files; those are gone now (see "Content pipeline" below).
   This is the interactive era/threads reader users see at `/`. **Its
   operational manual is `docs/longlive-experience.md` — read it before
   touching site UI.**
2. **The factory around it.** `scripts/` (~70k lines across content-engine,
   knowledge-engine, merch-engine, community, social, news, watchdog, and
   other sub-engines), 67 GitHub Actions workflows, and product Vercel Cron —
   these write content, file issues, post to social, and merge their own
   PRs. The old Claude desk-routine fleet is fully retired (0 enabled
   triggers as of 2026-09-06; see `docs/AUTOMATION.md`'s history). **Its
   operational manual is `docs/AUTOMATION.md` — read it before touching any
   workflow, script, or desk routine.**
3. **The mobile app (`apps/mobile`).** No longer a WebView shell. As of
   OS-039 (2026-09-05), the app's default surface is **five native screens**
   behind a persistent `BottomTabBar` (era stream, threads, clownbot,
   community, merch) — see "Mobile app" below.

Both apps, the factory, and the shared headless core are real and
load-bearing; none substitutes for another's manual.

## Convergence: one content bundle, two renderers, one headless core

Ratified 2026-09-05 (`docs/decisions.md` "Convergence decisions D1–D4",
spec `docs/specs/2026-09-05-one-source-three-surfaces.md`) and now largely
implemented, not aspirational:

- **D1 — content source of truth = git seeds → published, versioned
  bundle.** Authoring stays in `supabase/seed/**`;
  `scripts/build-content-bundle.mjs` (OS-011) publishes a hashed, versioned
  JSON bundle (manifest.json + one file per domain) that both web and
  mobile read through `packages/content`. Supabase keeps only dynamic
  runtime data (devices, prefs, notification events, clownbot memory) —
  content tables are frozen/deprecated under this plan (OS-016 marked the
  9 Vault content tables deprecated via `COMMENT ON TABLE`, not dropped).
  **Implemented and shipped**, not a plan: see "Content pipeline" below.
- **D2 — two renderers, one headless core.** Next.js for the web, React
  Native for mobile; both consume `packages/experience` (OS-020/OS-021),
  the platform-agnostic core (eras, deep links, lenses, filters, feeds,
  threads, track guide, search, progress — ~11.8k lines, zero React-DOM/
  Next/React-Native imports, enforced by an ESLint `no-restricted-imports`
  rule scoped to `packages/experience/**`). *Rejected:* a universal
  react-native-web rewrite of the working ~55k-line web app.
- **D3 — progressive native port, route by route, behind flags, WebView
  shell as fallback until the last route lands.** OS-032..OS-039 shipped
  five native screens flag-on by default; the WebView (`SiteShell.tsx`)
  now only ever renders the three static legal pages. **Substantially
  complete, not "next" — see "Mobile app" below.**
- **D4 — EAS Update for JS-only mobile changes**, fingerprint runtime
  policy; store builds only when native code changes. See
  `docs/mobile-release.md` for the release train mechanics.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | **TypeScript** everywhere | Web, mobile, worker, shared logic |
| Web | **Next.js 16 (App Router)**, React 19 | SSR/SSG + CDN caching; deploys on Vercel |
| Mobile | **Expo / React Native** | iOS + Android from one codebase; native screens behind a `BottomTabBar`, not a WebView |
| Headless core | **`packages/experience`** (~11.8k lines, zero-I/O, zero-UI-framework) | Eras, deep links, lenses, filters, feeds, threads, track guide, search — the D2 shared core both renderers consume |
| Content contract | **`packages/content`** (zod schemas + typed loader) | Reads the published bundle over HTTP with ETag caching + offline last-good fallback (mobile's consumer); `apps/web` reads the same published JSON synchronously off local disk instead — see "Content pipeline" |
| Content enrichment | **`packages/content-enrichment`** | Zero-`apps/web`-dependency enrichment logic extracted from the old web-only generators (OS-014b) |
| Data access (legacy) | **`packages/core`** | Now holds only shared types (`vault-types.ts`) and the News/Current live-read helpers; the old Supabase Vault client (`createVaultClient`) was deleted (OS-014b-6) |
| Backend / DB / auth | **Supabase** (Postgres + RLS + Auth + Storage) | Dynamic runtime data only under D1 (devices, prefs, notifications, clownbot memory, News/Current); content authoring lives in `supabase/seed/**` |
| Ingest worker | **`apps/worker`** | News/Current pipeline, polls every 4h (`news-worker.yml` cron `10 1,5,9,13,17,21 * * *`) |
| Web hosting | **Vercel** (auto-deploy from `main`) | |
| Mobile builds | **EAS (Expo Application Services)** | One release train ships iOS + Android together; see `docs/mobile-release.md` |
| Animation / gesture | **Reanimated + Gesture Handler** (native); **CSS transforms + rAF** (web) | Still the one deliberately-not-shared layer |

Monorepo, npm workspaces:

```
apps/web            Next.js reader (~55k lines incl. app/lib/components)
apps/mobile         Expo app: 5 native screens + BottomTabBar (~7.9k lines)
apps/worker         News/Current ingest pipeline, polls every 4h (~7.4k lines)
packages/shared     types + domain, zero I/O — portable (~5.6k lines)
packages/core       shared Vault types + News/Current live-read helpers (~8k lines)
packages/experience headless core (D2): eras, deep links, lenses, filters,
                    feeds, threads, track guide, search, progress — zero
                    React/Next/RN imports (~11.8k lines)
packages/content    zod schemas + typed async loader for the published
                    content bundle (~1.5k lines) — mobile's read path
packages/content-enrichment  zero-apps/web-dependency enrichment logic
                    extracted from the old generators (~0.5k lines)
scripts/            automation: sub-engines (content-engine, knowledge-
                    engine, merch-engine, community, social, news,
                    watchdog, images, ...) + top-level scripts (~70k lines,
                    ~380 files)
supabase/           migrations + seed files — the content corpus
```

**Hard boundary:** new business logic that is genuinely platform-agnostic
goes in `packages/experience` (preferred going forward) or `packages/shared`,
never in an app's view layer. The view layer (React components, RN screens)
is the only non-portable code. This is the boundary that lets `apps/mobile`
reuse the same era/feed/thread/search logic `apps/web` uses, rather than
each reimplementing it — see "Mobile app" below for how far that's actually
landed.

## Content pipeline — one bundle, no more committed generated TypeScript

The old `apps/web/lib/longlive/*.generated.ts` committed files (era content,
tracks, theories, videos, era-secrets, song-moods — the "six generated
files" the old manifest tracked) are **gone**. OS-014b (six sub-phases,
merged 2026-09-06) rewired every domain module
(`content.ts`, `tracks.ts`, `theories.ts`, `videos.ts`, `era-secrets.ts`,
`merch.ts`) to read from the published content bundle instead:

1. `supabase/seed/**` — content is authored/versioned in the repo, same as
   before.
2. `scripts/build-content-bundle.mjs` (OS-011) publishes a hashed,
   versioned JSON bundle (`manifest.json` + one file per domain), validated
   against `packages/content`'s zod schemas.
3. **Two different readers of the same published artifact, by design**
   (`apps/web/lib/longlive/read-bundle-artifact.ts`'s own header explains
   why, citing Fable ruling FR-t_cd5741fc-1/-2):
   - `apps/web`'s `prebuild` script (`scripts/publish-content-bundle.mjs`)
     writes the bundle JSON to local disk (`apps/web/public/content/**`)
     before the Next.js build runs, so web reads it **synchronously off the
     local filesystem** — no HTTP round trip, because by build time it's
     already on the same machine. This is required specifically for any
     module reachable from a `'use client'` import graph, since Next.js/
     Turbopack cannot bundle `node:fs` for the browser.
   - `packages/content`'s `loadBundle()` is an **async HTTP client** (fetch +
     ETag caching + offline last-good fallback) for a genuinely remote,
     distributed consumer — mobile (OS-015 switched
     `apps/mobile/lib/vault.ts` off Supabase onto this loader).
4. `packages/content-enrichment` holds the zero-`apps/web`-dependency
   enrichment logic extracted from the old generator scripts (OS-014b-1),
   so both readers can share the transform logic without either depending
   on the other's runtime.

**The old parallel Supabase-direct Vault pipeline is retired, not just
deprioritized.** `docs/proposals/2026-09-vault-read-path.md` (originally a
DRAFT decision doc, R24) is now marked **CLOSED / SHIPPED**: Joey's D1
decision independently reached the same conclusion as that doc's
recommended "Option A" and it has been fully executed —
`packages/core/src/vault.ts` (`createVaultClient`), `apps/web/lib/vault.ts`,
and the `apps/web/app/vault/{tier0,moment,album/[slug]/tracks}` routes are
**deleted**. Only `packages/core/src/vault-types.ts` (the `VaultSkeleton`
shape, zero I/O) survives because mobile's `@swift2/core` import still
needs the shared Tier-0 type. The 9 Supabase Vault content tables are
marked deprecated (`COMMENT ON TABLE`) but not dropped, as a rollback
window. `db-seed.yml`'s Vault-content seeding is retired.

**Not part of this retirement — still live and unrelated:**
`apps/web/app/vault/{live,live-theories,current}` are a separate "Current"
tier (News/Current world, reads `current_item`/`live_theory`/`fan_signal`
via `apps/web/lib/current.ts`), intentionally left untouched.

## Data architecture: two worlds, kept apart

The product still has two content cadences that must not be coupled:

1. **Vault — curated, slow, editorial.** Eras, milestones (album releases,
   tours), fashion looks. Authored in `supabase/seed/**`, compiled into the
   published content bundle above, effectively static between deploys,
   aggressively cacheable, served from the CDN. This is the world the era
   reader and mobile's era-stream tab both navigate — now off the same
   bundle rather than two separate pipelines.
2. **News / Current — live, polled, ranked.** Changing every 4 hours via
   `apps/worker` (`news-worker.yml`). Volatile, freshness matters. Served
   via `apps/web/app/vault/{live,live-theories,current}` on the web; not
   yet ported to mobile as a native screen.

They live in separate tables and are served on separate surfaces/routes. The
Vault must never inherit the News feed's volatility or its cache-busting.

## Mobile app — native screens behind a BottomTabBar, not a WebView shell

**This is the single biggest structural change since the last architecture
doc revision, and it reverses a decision that doc itself recorded.** The
2026-09-05 "ships the website in a native shell" decision
(`docs/decisions.md`) was explicitly a stop-gap ("a later build can swap the
shell for native screens one at a time"); OS-032 through OS-039 did exactly
that, and OS-039 (merged, `docs/decisions.md` / commit `c128d5a4`) flipped
the default:

- `apps/mobile/App.tsx` renders one of **five native screens** — era
  stream, threads, clownbot, community, merch — behind a persistent
  `BottomTabBar` (`apps/mobile/components/BottomTabBar.tsx`), the mobile
  equivalent of the web's own `BottomNav.tsx`. All five ship flag-on by
  default (`routes.ts`'s `DEFAULT_ROUTE_FLAGS`).
- The WebView (`apps/mobile/components/SiteShell.tsx`) still exists and is
  still mounted, but **only ever shows one of the three legal pages**
  (`/privacy`, `/terms`, `/support`) — see `isLegalPageUrl` in `App.tsx`.
  Any other URL that would previously have opened the WebView (a bare site
  root, an off-site link, a stale notification param with no native
  equivalent) now degrades to the native home screen instead.
- Mobile's Vault data no longer touches Supabase at all (OS-015): it reads
  `packages/content`'s `loadBundle()`, the same published bundle web reads.
  `apps/mobile/lib/vault.ts` / `VaultNavigator.tsx` / `EraTimeline.tsx`
  still exist on disk but are dead code, no longer the mounted app's data
  path or UI — not imported from anything reachable from `App.tsx`.
- The web → native bridge (below) still applies to the three legal pages
  the WebView renders; the protocol itself is unchanged from when it also
  served the full site.
- Release process: one EAS Workflow train ships both platforms together
  (`docs/decisions.md` 2026-09-05 "iOS and Android ship as one unit");
  never a manual laptop build. Full mechanics in `docs/mobile-release.md`.

### Web → native bridge (OS-002)

The site calls `postToNativeApp(message)` (`apps/web/lib/longlive/in-app.ts`),
detected via the `LongLiveApp/<ver> (ios|android)` user-agent marker
(OS-001), which does nothing outside the app and otherwise calls
`window.ReactNativeWebView.postMessage(...)`. `SiteShell` wires the
WebView's `onMessage` and `App.tsx` maps it onto the corresponding native
screen. Currently a small closed union (`openNotificationSettings`,
`openInbox`). Extending it: add a member to `NativeBridgeMessage` in both
`apps/web/lib/longlive/in-app.ts` and `apps/mobile/components/SiteShell.tsx`
(kept in sync by hand).

## Reference workload — the era experience (still shapes the build)

The interaction model the original "morph-on-grab timeline scrubber" concept
described now lives as the web's era-mode vertical scroll
(`docs/longlive-experience.md` §1 has the current, shipped mental model —
read that doc, not this section, for the actual UI behavior) and mobile's
native `EraStreamScreen`. The non-negotiable performance bar carries over
unchanged:

- The scrub/scroll gesture and coupled transitions must hold 60fps on
  mid-tier hardware, including mid-range Android.
- **Mobile:** gesture + animation runs on the UI thread via Reanimated
  worklets + Gesture Handler. No React/JS-thread state updates per frame.
- **Web:** driven by CSS transforms + `requestAnimationFrame`. No React
  `setState` per pointer-move.

### What is and isn't shared across platforms

- **Shared** (`packages/experience`, increasingly `packages/shared`): era +
  feed data model, ordering, deep-link resolution, lenses/filters, search,
  track-guide logic, thread content resolution.
- **Not shared** (per-platform view layer): the gesture recognizer and
  animated components themselves — one web implementation (Pointer Events +
  CSS/rAF), one native implementation (Reanimated + Gesture Handler). Same
  data and logic underneath; different animation runtime on top.

## Auth

Supabase Auth. v1 remains public, read-only, no login required; auth is
provisioned but not load-bearing until a feature needs per-user state. RLS
on by default for any user-scoped table.

## AI-integration approach

- LLM calls happen in worker/server paths with a cost cap and a rule-based
  fallback, never in a synchronous user-request path — clownbot chat, the
  content/knowledge/merch engines under `scripts/`, and the News pipeline
  are the current call sites.
- Keys live only in gitignored env files (`apps/*/.env*`), never committed,
  never read into output.

## Coding standards

- TypeScript strict mode across all workspaces.
- `npm run typecheck` must pass before any PR.
- Business logic in `packages/experience`/`packages/shared`/`packages/core`;
  views stay thin and platform-specific. This boundary is real and enforced
  for `packages/experience` (an ESLint rule blocks React-DOM/Next/RN
  imports there), not just aspirational.
- Conventional-commit style: `feat(vault): …`, `fix(web): …`, `docs: …`.
- Branch per task (`feature/<name>`, `fix/<name>`); never commit to `main`
  directly — CI (`ci.yml` job `build`, plus `build-full`/`build-content`) is
  the reviewer for most of what lands on the automation side; see
  `docs/AUTOMATION.md`.
- Automated tests for every feature; `npm run test` (vitest) full suite
  green before "done."
- **Media & content sourcing** (full policy + rationale: `docs/decisions.md`,
  2026-07-09 "no rules against hosting photos"):
  - **Text:** original summaries in our own words + links; never paste
    article bodies / lyrics / official statements verbatim.
  - **Images: no hosting restriction.** Any real photo may appear on-site by
    any means — oEmbed, hotlink, or rehost/CDN — with a credit line where
    available. The only image rules are content-integrity: no AI-generated
    fakes, and reference/comparable stand-ins must be visibly labeled as
    reference.
  - **Monetization** (affiliate/commercial) ships only after external
    IP-counsel review; UNOFFICIAL disclaimer stays prominent.

## Shipping one feature across web + mobile

The shared-package boundary above answers *where code lives*. This answers
*how a feature ships without the surfaces drifting apart* — the risk isn't
writing a feature twice (the shared boundary prevents that); it's that
**web deploys instantly on every merge and mobile does not**. EAS Update
(D4) narrows that gap for JS-only changes but native-code changes still sit
in App Store / Play review for days.

**The checklist, in order, for a feature that touches data:**

1. Schema/data change (if any) → seed it in `supabase/seed/**`, publish via
   the content bundle (or `packages/core` + a migration for dynamic runtime
   data).
2. Shape the feature's logic once in `packages/experience` (preferred) or
   `packages/shared` — the single contract both apps read.
3. Implement the view in `apps/web`. Ships on the next merge to `main`
   (Vercel auto-deploy) — no lag.
4. Implement the view in `apps/mobile` against the same shared logic —
   never re-derive it per-platform. Ships via the next EAS Workflow train:
   an OTA update group if no native code changed (near-instant per D4), a
   store build + review if it did (days of lag).
5. The one standing exception: if the feature touches gesture/animation, it
   is implemented twice on purpose — everything else follows steps 1-4.
6. Test once, mostly: unit tests for shared logic in `packages/*` cover
   both platforms simultaneously. Add platform-specific tests only for the
   thin view layer.

**Backend compatibility across the mobile release lag:** an old mobile
build can be in the wild for days after a backend/schema or bundle-schema
change ships. `packages/content`'s bundle schema enforces this formally —
`CURRENT_SCHEMA_VERSION` bumps only on a breaking change, and
`isSchemaVersionSupported`/`assertSchemaVersionSupported`
(`packages/content/src/compat.ts`, OS-041) enforce an N-1 compatibility
window: a loader built against version N must still read a bundle published
at N-1, checked in CI (`compat.test.ts`). `packages/core`'s remaining public
shape (News/Current, shared types) follows the same additive-only
discipline by convention.

**Feature flags:** `apps/mobile/lib/routes.ts`'s `DEFAULT_ROUTE_FLAGS`
already gates every native screen per-route — this is now a real mechanism
in production use (all five native screens shipped behind it and were
flipped on progressively through OS-032..OS-039), not a future plan.

## Operational manuals (read these before touching the live system)

- **`docs/longlive-experience.md`** — the web reader UI (the era/threads
  experience at `/`): components, state, content flow.
- **`docs/AUTOMATION.md`** — the automation index: GitHub Actions workflows,
  Vercel Cron, and the (now fully retired) Claude desk-routine history.
- **`docs/mobile-release.md`** — the EAS release train mechanics.
- **`docs/decisions.md`** — the append-only decision log; the source for
  every "why" cited above.

## Open questions (need Joey's vision or a later decision)

- Product class: read-only content vs. social/UGC vs. utility — gates how
  much auth/RLS/realtime we actually build.
- News/Current world as a native mobile screen — not yet ported; currently
  web-only.
- Dead code cleanup: `apps/mobile/lib/vault.ts`, `VaultNavigator.tsx`,
  `EraTimeline.tsx` are unreferenced from the mounted app after OS-015; no
  card yet to remove them.

_Resolved:_ v1 scope is the **Vault only**; the News/Current world is out of
v1 (2026-07-03). _Resolved:_ the Supabase-direct Vault read path is retired,
not adopted — see "Content pipeline" above (2026-09-06). _Resolved:_ the
mobile app is native-screens-by-default, not a WebView shell — see "Mobile
app" above (OS-039, 2026-09-05/06).
