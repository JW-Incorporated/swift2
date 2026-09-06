# One Source, Three Surfaces — convergence spec and Hermes kanban plan

Owner: Engineering. Status: **ratified 2026-09-05** — decisions D1–D4 in §4
were made by Wyatt (owner) in session; Joey informed via issue #531. Every
phase is unblocked; Hermes may pull cards in dependency order from §6.

## 1. The problem, stated from the code

On 2026-09-05 the first iOS TestFlight build showed an app that looked
nothing like longlivets.com. That was not a bug. The two surfaces were built
on two different architectures and never converged:

| | Website (`apps/web`) | Native app (`apps/mobile`) |
| --- | --- | --- |
| Experience | `lib/longlive/**` + 99 components, ~64k lines (`docs/longlive-experience.md`) | Vault MVP: scrubber + month rows + notifications, ~2k lines |
| Content source | `*.generated.ts` baked into the bundle by `scripts/sync-longlive-*.mjs` from `supabase/seed/**` | Live Supabase reads (`createVaultClient`: era, milestone, month_item) |
| Shared code actually used | `@swift2/shared` (types, deep links, notifications) | `@swift2/shared`, `@swift2/core` (devices, notifications) |
| Release | every merge, instantly | EAS store build, days |

`docs/architecture.md` intended the web to move onto the Supabase Vault and
the app to grow the same views. Neither happened; the content pipeline and
the experience layer grew on the web instead. Today's stop-gap (decision
2026-09-05) mounts the website in a WebView inside the native shell so the
store gets the real product. This spec is the path from that stop-gap to
**one content source, one experience core, three thin surfaces**.

## 2. Target architecture

```
supabase/seed/**  (git-authored content; content agents keep writing PRs)
        │  scripts/build-content-bundle.mjs   (deterministic, hashed)
        ▼
content bundle  manifest.json + eras/*.json + tracks/theories/videos/… .json
        │  published on every merge to main (Vercel static + Supabase Storage mirror)
        ▼
packages/content      typed loader + zod schemas + fixtures      (Layer 1)
packages/experience   headless core: eras, deep links, lenses,   (Layer 2)
                      feeds, threads, track guide, progress, search, tokens
        │                                   │
        ▼                                   ▼
apps/web (Next.js)                 apps/mobile (Expo / React Native)  (Layer 3)
  unchanged UX, SEO, Vercel          native screens, progressively replacing
                                     SiteShell (WebView) per route
        │                                   │
        └──────── apps/web/app/api/** ───────┘                          (Layer 4)
          clown · mood · feedback · devices · notifications · intake
          Supabase holds DYNAMIC data only (devices, prefs, clown memory)
```

Principles:

1. **Content is an artifact, not a database (D1).** Authoring stays in git (the
   whole content engine depends on that). The bundle is the single thing
   every surface reads; Supabase content tables are frozen, then retired.
2. **Two renderers, one core (D2).** Next.js stays for the web (SEO, 64k lines
   that work). React Native renders the same core natively. No
   react-native-web migration of the site — it would regress the web to gain
   nothing the core does not already give.
3. **Progressive, never big-bang (D3).** The WebView shell stays as the fallback
   for any route not yet native. A routing table decides per URL.
4. **Ship JS without the store (D4).** EAS Update carries JS-only mobile changes
   so the app keeps pace with the web; store builds only for native changes.

## 3. Non-goals

- Redesigning the experience. Parity first; the web is the reference.
- Changing how content is authored or reviewed (Karen/CIE, photo enrichment,
  merch pipelines are untouched — they write the same seed files).
- Accounts / sign-in. Out of scope; the identity model stays anonymous.

## 4. Decisions (ratified by Wyatt, 2026-09-05; logged in `docs/decisions.md`)

| # | Decision | Decided | Rejected alternative | Reversal cost |
| --- | --- | --- | --- | --- |
| D1 | Content source of truth for all surfaces | **Git seeds → published, versioned bundle**; Supabase keeps dynamic data only | Supabase as runtime source (re-creates the stale-production failure of #723/#725) | Medium: loader swap |
| D2 | One renderer vs two | **Two renderers, one headless core** (Next.js web, React Native mobile) | One universal RN app via react-native-web (full web rewrite, weaker SEO) | High once ported |
| D3 | Native port strategy | **Progressive, route by route, behind flags, WebView fallback** | Big-bang rewrite behind the shell | Low |
| D4 | JS over-the-air for mobile | **EAS Update**, fingerprint runtime policy; store builds only for native changes | Store builds only | Low |

## 5. Kanban conventions for Hermes

**Columns:** Backlog → Ready (deps done, spec clear) → In progress → Review
(PR open, Codex review) → Done (merged, verified by the card's own command).

**WIP:** one card in progress per agent; at most three cards in progress per
phase. A card is Ready only when every card in its *Depends on* is Done.

**Every card carries:** Goal · Touches (files/dirs) · Steps · Done when (a
command or check a reviewer can run) · Depends on · Size (S ≤ half day,
M ≤ 1 day, L ≤ 2 days; split anything larger). All cards follow `CLAUDE.md`:
branch, PR with TL;DR, tests, docs in the same change, land your own green PR.

**Card IDs** are stable (`OS-0xx`); reference them in PR titles.

---

## 6. Cards

### Phase 0 — Make the shell a first-class wrapper (start now)

**OS-001 · App-aware website** · S · Depends on: —
Goal: the site knows when it runs inside the app.
Touches: `apps/web/lib/longlive/in-app.ts` (new), `apps/web/app/layout.tsx`.
Steps: detect the `LongLiveApp/<ver>` user-agent marker set by
`apps/mobile/components/SiteShell.tsx`; expose `isInApp()` and a `data-app`
attribute on `<html>`; hide any install/"open in app" CTAs when true (no-op if
none exist yet). Unit test both branches.
Done when: `npm test -- in-app` green; visiting the site with the UA marker
renders `data-app="ios"|"android"`.

**OS-002 · Web → native bridge for the bell** · M · Depends on: OS-001
Goal: the site's own top bar shows the bell in-app; the floating native bell
overlay goes away.
Touches: `apps/web/components/longlive/TopBar*`, `apps/web/lib/longlive/in-app.ts`,
`apps/mobile/components/SiteShell.tsx`, `apps/mobile/App.tsx`.
Steps: define a one-way message protocol (`window.ReactNativeWebView.postMessage(JSON.stringify({type:'openNotificationSettings'}))`,
also `openInbox`); render the bell in the site's top bar only when
`isInApp()`; shell handles `onMessage` and opens the native screen; remove
the absolute-positioned bell from `App.tsx`. Document the protocol in
`docs/architecture.md`.
Done when: tapping the in-page bell in a dev build opens the native settings
screen; no bell overlay remains; web unit test asserts the message payload.

**OS-003 · Deep-link contract test** · S · Depends on: —
Goal: every deep link the backend emits is understood by exactly one router.
Touches: `packages/shared/src/notification-deep-links.test.ts`,
`apps/web/lib/longlive/deepLink.ts`, `apps/mobile/App.tsx` (`destinationFor`).
Steps: enumerate the URL patterns produced in `packages/core/src/notification-*.ts`
(`?current=`, `?song=`, `?screen=settings`, `#merch-new-drops`, bare `/`);
assert the web router or the shell's `destinationFor` handles each; fail on
an unhandled pattern. Move `destinationFor` into `@swift2/shared` so the test
covers it.
Done when: the new test is in the root vitest suite and green.

**OS-004 · Push credentials on EAS (human-gated)** · S · Depends on: —
Goal: iOS and Android push actually deliver.
Touches: `HUMAN-ACTIONS.md`, `SETUP_NOTIFICATIONS.md`.
Steps: file the HUMAN-ACTIONS item: run `eas credentials -p ios` interactively
to upload/generate the APNs key (team D9N628AFHS), and the FCM v1 service
account for Android; send one test push via `scripts/send-test-push.ts` to a
TestFlight device.
Done when: a real device receives a push and tapping it opens the deep link
in the shell.

**OS-005 · Mobile in CI** · S · Depends on: —
Goal: the app cannot rot silently between store builds.
Touches: `.github/workflows/ci.yml`.
Steps: add `npm run typecheck --workspace @swift2/mobile` and
`npx expo export --platform ios` + `--platform android` (headless bundle) to
the `build` gate; cache node_modules.
Done when: CI runs both on a PR touching `apps/mobile/**` or `packages/**`.

### Phase 1 — One content artifact (D1 decided; start now)

**OS-010 · Content bundle schema + ADR** · M · Depends on: —
Goal: a typed, versioned contract for everything the experience renders.
Touches: `packages/content/src/schema.ts` (new, zod), `docs/decisions.md`,
`docs/architecture.md`.
Steps: derive schemas from the types already exported by
`apps/web/lib/longlive/content.ts`, `tracks.ts`, `theories.ts`, `videos.ts`,
`era-secrets.ts`, `merch.ts`, `song-moods.ts`, `clownbot-lore.ts`;
`manifest.json` = `{ schemaVersion, bundleVersion (content hash), generatedAt, files: { name → { path, sha256, bytes } } }`;
write the ADR (why an artifact, not a DB; N-1 schema support).
Done when: `packages/content` typechecks and a fixture bundle validates.

**OS-011 · `scripts/build-content-bundle.mjs`** · L · Depends on: OS-010
Goal: one deterministic script produces the bundle from the same sources the
sync scripts read.
Touches: `scripts/build-content-bundle.mjs` (new), reuse readers from
`scripts/sync-longlive-*.mjs`, `package.json` (`content:bundle`).
Steps: emit `dist/content-bundle/<bundleVersion>/…` split per era for the
vault (`eras/<eraId>.json`) and one file per other domain; stable key order;
byte-identical output for identical input (test); `check:content-bundle`
guard mirroring `check:generated`.
Done when: running it twice yields identical hashes; test in root suite.

**OS-012 · Publish the bundle on every merge** · M · Depends on: OS-011
Goal: web and mobile read the same published artifact.
Touches: `apps/web/next.config.*`, `apps/web/public/content/` (build output,
gitignored), `.github/workflows/ci.yml` or a new `content-publish.yml`,
Supabase Storage bucket `content` (mirror for mobile, immutable paths,
`Cache-Control: immutable`), `content/current.json` pointer (short TTL).
Steps: build the bundle during `next build` into `public/content/<version>/`
and write `current.json`; CI job mirrors the same files to Storage;
document rollback = repoint `current.json`.
Done when: `https://www.longlivets.com/content/current.json` and the
Storage URL return the same `bundleVersion` after a merge.

**OS-013 · `packages/content` loader** · M · Depends on: OS-010
Goal: one way to load the bundle on any runtime.
Touches: `packages/content/src/{load.ts,cache.ts,index.ts}`.
Steps: `loadBundle({ baseUrl, fetch, storage })` reads `current.json`, then
files by hash; ETag/If-None-Match; injectable storage adapter (web: none at
build time; mobile: `expo-file-system` cache with last-good fallback);
`schemaVersion` gate with a clear error; fixtures + tests.
Done when: tests cover cold load, cached load, stale-while-revalidate,
schema mismatch.

**OS-014 · Web reads the bundle** · L · Depends on: OS-012, OS-013
Goal: delete 3.6 MB of generated TypeScript from git without changing a pixel.
Touches: `apps/web/lib/longlive/{content,tracks,theories,videos,era-secrets,merch,song-moods,clownbot-lore}.ts`,
`scripts/sync-longlive-*.mjs`, `scripts/check-generated-in-sync.mjs`.
Steps: build-time import of the bundle via the loader; snapshot test proving
the in-memory data equals what the generated modules produced; then remove
`*.generated.ts` and the sync scripts that only fed them; keep
`sync-source-tiers` etc. if used elsewhere; update `docs/longlive-experience.md`.
Done when: `npm run build` + e2e green; `git ls-files | grep generated.ts`
empty; bundle size of the web client unchanged or smaller.

**OS-015 · Mobile reads the bundle** · M · Depends on: OS-013
Goal: the native app consumes the same artifact, even while unmounted.
Touches: `apps/mobile/lib/vault.ts`, `apps/mobile/components/VaultNavigator.tsx`,
`packages/core/src/vault.ts` (deprecate reads).
Steps: replace `createVaultClient` with the content loader + a mapper to the
`VaultSkeleton` shape (`@swift2/shared/vault-types`); offline last-good
bundle; remove `EXPO_PUBLIC_SUPABASE_*` from the app if nothing else needs it.
Done when: `expo export` green; a dev build renders VaultNavigator from the
bundle with the network off after one successful load.

**OS-016 · Retire Supabase content tables** · S · Depends on: OS-014, OS-015
Goal: one source, no shadow copy.
Touches: `scripts/seed-*.mjs` for content, `package.json` `db:seed:*`,
`docs/dev-quickstart.md`, `docs/backup-restore.md`, `supabase/migrations`
(no drop yet — mark deprecated).
Steps: remove content seeding from runbooks and CI; leave dynamic tables
(devices, notification events, clown memory, on_this_day if still read by
`notification-fun.ts`) untouched; open a follow-up to drop tables after one
release cycle.
Done when: no code path outside `scripts/` reads era/milestone/month_item.

### Phase 2 — Headless experience core (D2 decided; overlaps Phase 1)

**OS-020 · `packages/experience` skeleton + purity guard** · S · Depends on: —
Touches: `packages/experience/{package.json,tsconfig.json,src/index.ts}`,
`eslint.config.mjs`, `vitest.config.ts`, `tsconfig.base.json` paths.
Steps: workspace package; ESLint `no-restricted-imports` for `react-dom`,
`next`, `react-native`, `window`/`document` globals; included in root tests.
Done when: a deliberate `import 'next'` inside the package fails lint.

**OS-021 · Move eras, deep links, lenses, filters** · M · Depends on: OS-020
Touches: `apps/web/lib/longlive/{eras,deepLink,lenses,filters,filter-chips}.ts*`
→ `packages/experience/src/`. Keep `filter-chips.tsx` React-free or split.
Done when: web imports from `@swift2/experience`; existing tests moved and
green; `npm run build` unchanged.

**OS-022 · Move feeds: era-feed, clusters, feed-tiers, doorways, current-feed** · M · Depends on: OS-021, OS-013
Done when: same criteria; feed view-models take bundle types as input.

**OS-023 · Move threads, love-story, theories, live-theories, era-secrets** · M · Depends on: OS-021
Done when: same criteria.

**OS-024 · Move track guide, song-moods, mood-match, format, anchor-date, freshness, gloss-rotation** · M · Depends on: OS-021
Done when: same criteria; server-only mood/clown modules stay in `apps/web`.

**OS-025 · Progress + search with injected adapters** · S · Depends on: OS-021
Touches: `progress.ts` (localStorage → `StorageAdapter`), `SearchOverlay` index builder.
Done when: web passes a localStorage adapter; tests use an in-memory one.

**OS-026 · Core conformance suite** · M · Depends on: OS-022..OS-025
Goal: golden tests any renderer can be checked against.
Touches: `packages/experience/test/golden/**`.
Steps: for a fixture bundle and a list of deep links, snapshot the resulting
view-models (era stream sections, thread timelines, track guide pages);
both renderers must render from these exact inputs.
Done when: golden files committed; CI runs them.

### Phase 3 — Native renderer, route by route (D3 decided; needs OS-015, OS-026)

**OS-030 · Hybrid routing table** · M · Depends on: OS-003
Touches: `apps/mobile/lib/routes.ts` (new), `App.tsx`, `SiteShell.tsx`.
Steps: `resolve(url) → { native: ScreenId, params } | { web: url }`; one
`navigate(url)` used by deep links, inbox rows, the web→native bridge, and
in-WebView link clicks to native-capable routes; feature flags per screen.
Done when: unit tests for every backend deep-link pattern; toggling a flag
switches a route between native and WebView without a rebuild (EAS Update).

**OS-031 · Design tokens shared** · M · Depends on: OS-020
Touches: `apps/web/app/globals.css` era variables → `packages/experience/src/tokens.ts`;
web CSS generated from tokens; RN `StyleSheet` reads the same object.
Done when: a snapshot test proves the CSS variables equal the token values.

**OS-032 · Native era stream** · L · Depends on: OS-030, OS-031, OS-022, OS-015
Masthead, era sections, moment cards, sticky top bar, era re-skin.
Done when: golden view-model → rendered list matches the web's section order
for three eras; flag on in TestFlight.

**OS-033 · Native moment detail** · L · Depends on: OS-032
Sheet with body, sources, media (YouTube/Spotify/Instagram via embedded
WebView inside the sheet), share.
Done when: every `?item=` deep link opens natively.

**OS-034 · Native threads mode** · L · Depends on: OS-023, OS-032
**OS-035 · Native track guide + song page** · L · Depends on: OS-024, OS-032
**OS-036 · Native Clownbot + mood chat** · L · Depends on: OS-032
Server change: accept a bearer device token as the anonymous identity in
`/api/clown` alongside the cookie (`clown-session.ts`); update `/privacy`.
**OS-037 · Native merch, doorways, communities** · M · Depends on: OS-032
**OS-038 · Native search, share, feedback** · M · Depends on: OS-032

**OS-039 · Retire SiteShell as default** · S · Depends on: OS-033..OS-038
Keep the WebView only for `/privacy`, `/terms`, `/support`; refresh store
screenshots natively; update `docs/architecture.md`, `apps/mobile/README.md`,
and the App Privacy answers.
Done when: no route resolves to `web` except the legal pages.

### Phase 4 — Release and operations (D4 decided; OS-040 can start with Phase 0)

**OS-043 · Mobile release train (EAS Workflow, both platforms as one unit)** · M · Depends on: OS-005 · **Done 2026-09-05**
`apps/mobile/.eas/workflows/release.yml` + `.github/workflows/mobile-release.yml`; runbook `docs/mobile-release.md`. Fingerprint decides OTA vs store per platform; submits need both builds; one update group for both. Human prerequisites: HUMAN-ACTIONS #44/#45/#46.

**OS-044 · Mobile parity check** · S · Depends on: OS-043 · **Done 2026-09-05**
`scripts/mobile/check-parity.mjs` + `.github/workflows/mobile-parity.yml` (6-hourly + after each train); one persistent alert issue on divergence.

**OS-040 · EAS Update wiring** · M · Depends on: OS-005 · **Superseded by OS-043** (the per-platform unconditional `eas-update.yml` was removed; the app.json/eas.json wiring it added stays)
Touches: `apps/mobile/app.json` (`updates`, `runtimeVersion: { policy: 'fingerprint' }`),
`eas.json` channels, CI job `eas update --channel production` on merge when
only JS changed, `docs/deploy.md`.
Done when: a JS-only merge reaches a TestFlight device without a new build.

**OS-041 · Bundle schema compatibility policy** · S · Depends on: OS-010
`schemaVersion` bump rules, N-1 support in the loader, CI check that a
schema change ships with a loader that still reads the previous version.

**OS-042 · Single data inventory for privacy docs** · S · Depends on: OS-016
`apps/web/lib/longlive/data-inventory.ts` drives the `/privacy` factual
sections and generates `apps/mobile/docs/privacy-and-data-safety.md` tables.
Done when: a test fails if the inventory and the policy disagree.

---

## 7. Sequencing and critical path

```
Phase 0 (this week):   OS-001 → OS-002        OS-003   OS-004   OS-005 → OS-040
Phase 1 (2–3 weeks):   OS-010 → OS-011 → OS-012 ─┐
                                 └→ OS-013 ──────┼→ OS-014 → OS-016
                                                 └→ OS-015 ──┘
Phase 2 (parallel):    OS-020 → OS-021 → {OS-022, OS-023, OS-024, OS-025} → OS-026
Phase 3 (4–8 weeks):   OS-030 + OS-031 → OS-032 → {OS-033…OS-038} → OS-039
Phase 4:               OS-041 (with Phase 1)   OS-042 (after OS-016)
```

Critical path to "iPhone, Android, and web read one source": OS-010 →
OS-011 → OS-012/013 → OS-014 + OS-015. Critical path to "no WebView":
OS-026 → OS-032 → OS-033 → OS-039.

## 8. Risks

- **App Review 4.2** while the shell is the default: mitigated by native
  push/settings/inbox now, and by OS-032 landing early behind a flag.
- **Bundle size on mobile:** the vault alone is ~2 MB of TS today; per-era
  files + on-device cache (OS-011/OS-013) keep first load small.
- **Two renderers drifting:** OS-026 golden tests are the contract; a
  renderer change that breaks a golden must update the golden in the same PR.
- **Content agents:** unaffected by design; if OS-011 ever needs a seed
  format change, it goes through `docs/decisions.md` first.
