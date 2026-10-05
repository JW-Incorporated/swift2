# MAP.md

<!-- The purpose of this file is to make codebase exploration unnecessary — for
     the orchestrator AND for every agent it briefs. If anyone ever has to grep
     around asking "where does X live", that is a MAP.md bug: fix it here.
     Cap: 150 lines.

     SCOPE NOTE: this is the top-level map. It is deliberately shallow — deepen
     a row the first time a session has to go looking inside it, rather than
     pre-filling detail nobody has needed yet. -->

## Where the authority lives

`CLAUDE.md` is the operating manual and outranks this file. There is no
external orchestration layer — live task state and team coordination live in
GitHub Issues/PRs (see `CLAUDE.md` § WORKING MEMORY). The durable reference
docs `CLAUDE.md` points at:

| Doc | What it settles |
|---|---|
| `docs/cto-role.md` | Engineering role, authority limits, session bootup |
| `docs/vision.md` | What the product is for |
| `docs/architecture.md` | Stack + coding standards |
| `docs/dev-quickstart.md` | **Read before running anything** — commands, env, repo map |
| `docs/longlive-experience.md` | **Read before touching the shipped web reader** |
| `docs/roadmap.md` | Roadmap and who owns what |
| `docs/decisions.md` | Anything expensive to reverse. Append BEFORE implementing |
| `docs/definition-of-done.md` | The long form of CLAUDE.md § Definition of done |
| `docs/AUTOMATION.md` | **What runs automatically and why** — index of all 54 self-firing routines (27 GitHub Actions workflows, 24 Claude desk routines, the product's Vercel cron, 2 Dependabot schedules) plus the 10 manual-dispatch workflows. Read before touching anything scheduled. Its 2026-08-31 audit is split into `docs/automation/doc-quality-2026-08-31.md` (per-routine doc quality + stale references) and `docs/automation/review-2026-08-31.md` (efficiency review + recommendations) |
| `docs/agents/runners.md` | Scheduled runners — cadences + live trigger IDs; account policy resolved 2026-08-31 (D1=B) to Joey's account, matching the live fleet |
| `docs/agents/codex.md` | How a session actually runs a Codex review (`--background`, `result <job-id>`) |

## Conventions

- Branch names: `feature/<short-name>`, `fix/<short-name>`. Never commit to `main`.
- Workspaces: `apps/*` and `packages/*` (npm workspaces, root `package.json`).
- Generated, never hand-edit: `*.generated.ts` (written by the `sync:content`
  scripts; `npm run check:generated` fails if they drift).
- LF-pinned via `.gitattributes`: `*.mjs`, `*.generated.ts`, `*.sh`.
- Scratch//throwaway output: `.scratch/` (git-ignored).

## Top-level layout

| Path | Responsibility | Don't |
|------|----------------|-------|
| `apps/web` | Next.js front end, incl. the shipped era/threads reader at `/` | Don't touch `components/longlive/**` or `lib/longlive/**` without reading `docs/longlive-experience.md` |
| `apps/worker` | Server-side jobs. Any product LLM call lives here, hard-capped | Don't put an LLM call in a user-request path |
| `apps/mobile` | Mobile client | — |
| `packages/core` | Shared domain logic | Don't import app code into it |
| `packages/shared` | Shared types/utilities | Don't duplicate types in apps |
| `packages/ui` | `@swift2/ui`: source-shipped, host-agnostic UI shared by apps/web and the apps/mobile DOM host (One UI WP2.1). Tailwind sees it via `@source` in `apps/web/app/globals.css` and `apps/mobile/dom/reader-spike.css`, and `apps/mobile/dom/shared-ui-test.css`. Host adapter: `src/host/` (`HostAdapter` types, `HostProvider`, `useHost()`); X3 web-only side-effect list in `HOST-ADAPTER.md`. Bridge protocol: `src/bridge/` (One UI WP2.3-A: `envelope.ts` JSON envelope + string-boundary `parseEnvelope`, `messages.ts` Cmd/Evt unions + exhaustive `HandlerMap`, `version.ts` `BRIDGE_VERSION`/`negotiate`; transport-neutral, no Expo-DOM code here). Web impl: `apps/web/lib/host-adapter.tsx` + `host-adapter-provider.tsx` (mounted in `app/layout.tsx`); reader `components/longlive/**` take `Image`/`Link` from `useHost()` (WP2.1-D; server `LegalDocument` still on `next/link`); era art goes through `useResolveUrl()` (DOM host maps `/eras/x.png` to the canonical origin; parity serves the real bytes from `e2e/parity/helpers.ts`); tests wrap in `lib/test-host.tsx` `TestHostProvider`; the DOM host mounts the same `createWebAdapter` (its next/* imports resolve to the DOM stubs) in `apps/mobile/dom/reader/reader-modules.ts` | No `next/*`, no `react-native*`, no dynamic import/require of them, no relative imports into `apps/*` (ESLint-enforced, `src/lint-ban.test.ts`); reach the host only via `useHost()` |
| `packages/ui/fonts` | Self-hosted reader fonts (WP2.1-C): 6 latin WOFF2 (all preloaded, byte-identical to next/font) + 18 on-demand non-latin subsets listed in `subsets.json` (web CSS only) + `FONTS-LICENSE`; `scripts/parity/font-compare.mjs` pixel-diffs a main build vs this one with real fonts; `fonts.web.css` (url() to `apps/web/public/fonts/<name>.<hash>.woff2`), `fonts.dom.css` (data-URI, imported by `apps/mobile/dom/reader-spike.css`), `fonts.manifest.json` (preload list) are GENERATED by `packages/ui/scripts/build-fonts.mjs` (`--check` in `src/fonts.test.ts`) | Edit the generator or a woff2, then re-run it; never hand-edit the outputs. `--font-*` names unchanged. OG-card fonts stay in `lib/longlive/share-fonts` |
| `packages/shared/src/api/{clown,mood,inbox,devices}.ts` | API wire contracts (types + hand-written guards) for `/api/clown`, `/api/mood`, `/api/notifications/inbox`, `/api/devices/*` — web lib re-exports them, mobile clients import them, route tests assert the guards accept real responses (`api.test.ts` covers the guards) | Server shape wins; change the route and the contract together |
| `scripts/` | Repo automation: `check:*`, `validate:*`, `sync:*`, seeds, migrations | Don't re-do a chore by hand twice — codify it (Workflow rule 8) |
| `scripts/social/` | Social pipeline. **`post-queue.mjs` and `delete-media.mjs` hit the LIVE accounts** | Don't invoke those two, ever. `guard.sh` denies it |
| `scripts/content-engine/` | Content engine (`npm run karen` / `cie`) | — |
| `social/` | Queue/posted/failed/metrics content + `calendar.md` | Don't hand-edit `posted/` — it is the ledger the poster dedupes against |
| `supabase/` | Database project (migrations, config) | — |
| `e2e/` | Playwright specs (`npm run test:e2e`) | — |
| `docs/` | All durable knowledge | Don't leave a decision only in a conversation |
| `.github/workflows/` | CI + scheduled runners. `ci.yml` job `build` is the required check | Don't dispatch `social-poster.yml` / `social-delete-media.yml` |

## Session infrastructure (`.claude/` and the standing files)

| Path | Responsibility |
|------|----------------|
| `.claude/settings.json` | Tracked. Permissions, two hooks, statusline |
| `.claude/hooks/guard.sh` | `PreToolUse` (Bash) — deterministic deny list, incl. social real-send + the shared-checkout session lock |
| `.claude/hooks/post-edit.sh` | `PostToolUse` (Edit/Write) — **auto-format deliberately OFF here**; read the comment before enabling |
| `.claude/statusline.sh` | Model, context %, usage-limit gauge, branch |
| `.claude/agents/*.md` | scout, researcher, grunt — capability only, no orchestration authority |
| `.claude/commands/` | Project slash commands (design-debate, marketing) |
| `CLAUDE.md` | Project operating manual — the whole contract |
| `MOODBOT.md` | The mood-bot contract (landed on `main` via #2184). Durable lessons from it are in `docs/engineering-lessons.md` |
| `HUMAN-ACTIONS.md` | **Everything waiting on Joey.** Any session that opens it reconciles it: file non-`OPEN` items into DONE with a date, keep the number. `SKIP` is final — never re-raise |
| `docs/handoff/2026-08-19-paused-work.md` | Read-only snapshot of the work paused at the 2026-08-19 migration |
| `docs/archive/kit-v3-2026-08-19/` | The retired kit-v3 framework, verbatim (`STATE.md`, `PLAN.md`, hooks, agents, pause skill) |
| `scripts/watchdog/karen-post-repair-check.mjs` | Self-limiting: Karen ran after the repair? Auto-closes 2026-08-22 |
| `scripts/watchdog/news-worker-rotation-check.mjs` | Self-limiting: first news-worker run after the key rotation. Same expiry |
| `scripts/watchdog/cron-maxage-hours.mjs` | Derives per-workflow cadence maxage-hours from a `routine-*.yml`'s own cron, for watchdog.yml's dynamic WATCHED list (tree-overhaul #4117 task A1) |
| `scripts/mobile/lib/main-ahead.mjs` | Pure MAIN_AHEAD logic for `check-parity.mjs`: `readGitState` (injected git runner), `evaluateMainAhead`, `exitCodeFor` (exit 3 = production behind main) |
| `scripts/release/select-android-build.mjs` (+ `.test.ts`) | Release train: picks this run's Android store build from the train state file; fails closed on commit-hash/UUID/status mismatch (see docs/mobile-release.md) |
| `scripts/release/train-lib.mjs` (+ `.test.ts`), `train-plan.mjs`, `train-wait.mjs` | Release train, run from GitHub Actions since 2026-10-03 (HA #98): fingerprint + existing-build plan, build polling, state file, iOS submit gate; replaces the retired EAS workflow (see docs/mobile-release.md) |
| `scripts/parity/size-check.mjs` (+ `.test.ts`) | OTA size budget: fails CI on >15% growth of the mobile export vs `e2e/parity/size-baseline.json` (`--update` rewrites it; see docs/mobile-release.md) |
| `.claude/hooks/guard.test.sh` | Minimal shell fixture asserting guard.sh's deny patterns actually block (task A5) |

**Retired 2026-08-19 (kit-v3):** `STATE.md`, `PLAN.md`, `PLANtemplate.md`,
`docs/OPERATINGMANUAL.md`, `hooks/triage.sh`, `hooks/checkpoint-gate.sh`,
`agents/{architect,executor,reviewer}.md`, `skills/pause/`. All archived, not
deleted. **Removed 2026-08-22 (AI Dev OS):** `.claude/rules/`, the migration
inventory doc, the `.gitattributes` rules pin — see `docs/decisions.md`.
Live task state lives in GitHub Issues/PRs.

## The longlive reader (`apps/web`) — read `docs/longlive-experience.md` first

The whole reader is ONE client page: `app/page.tsx` → `LongLive.tsx`, with
React context state in `lib/longlive/store.tsx`. **There are no routes for
eras/threads/mood/clownbot** — `?item=`/`?lens=`/`?era=`/`?guide=`/`?song=` are
read once on mount (`deepLink.ts`) and never written back.

| Path (under `apps/web/`) | Responsibility |
|---|---|
| `lib/longlive/store/` | MOVED to `packages/ui/src/reader/store/` (WP2.4-A1); this folder holds one-line `export *` shims. The state container, split into slices (R21): `navigation.tsx` (mode/era/lens/crossing/selector/scrubbing + the back-gesture nav-history stack), `overlays.tsx` (moment/track-guide/theory-guide/clue-web-trail/pending-video-anchor), `return-points.tsx` (doorway `ReturnPoint` LIFO stack), `search-share.tsx` (search overlay, share sheet, timeline filters, clown transcript). `index.tsx` composes them into one `AppProvider`; `useAppState()`/`useAppActions()` keep the pre-split public signature unchanged |
| `lib/longlive/return-point-stack.ts` | Pure matching-consume rule for doorway return points; unrelated back restores leave the LIFO entry intact |
| `lib/longlive/tags.ts` | `ContentTag` — the 5 authored topic tags. **Does not re-export the type; import `ContentTag` from `./types`** |
| `lib/longlive/filters.ts` | `FilterId` (the 5 tags + `Videos`), `ALL_FILTERS`, `filterMatches`, `filtersForEntry`, `filterForThread` (LensId→FilterId, exhaustive) |
| `lib/longlive/anchor-date.ts` | Sort-key resolution for undated items. `displayDate` is null unless `via === 'exact'`; `via: 'clamped'` is a real date pulled inside an era's window (P3 step 14a) |
| `components/longlive/FilterBar.tsx` | The ONE global sticky filter row. Mounted once by `EraStream`, never per era |
| `lib/longlive/era-feed.ts` | Pure feed logic: `EraFeedEntry` (5 kinds — Stage 5 added `current`), `mergeEraFeed`, `visibleFeed` — one signature each (P3 step 14b). Doorway construction in `doorways.ts`, spacing in `space-doorways.ts`, live-item construction in `current-feed.ts` |
| `lib/longlive/era-feed-clusters.ts` | #696 release-day pileups: `clusterSameDayMoments`/`CLUSTER_MIN_SIZE` collapse a same-day `moment` run into one `ClusterEntry`, applied AFTER `visibleFeed` — render-only, never touches filtering/tiering |
| `lib/longlive/doorways.ts` | Builds `thread`/`egg` doorway entries (`threadDoorwaysForEra` clamps out-of-window anchors, `eggDoorwaysForEra`); `theoryThreadId` — the R4 theory→thread mapping, shared with `TheoryCard.tsx` |
| `lib/longlive/current-feed.ts` | Knowledge-engine Stage 5: `currentFeedEntries` (builds the `current` `EraFeedEntry` kind from `current_item` rows), `outletFor`, `CURRENT_ITEM_STATUS_COPY`, `summarizeCurrentActivity` (masthead line) |
| `lib/longlive/use-current-items.ts` | Client hook: fetches the current era's live rows from `/vault/current/[eraId]`, fails soft to `[]` |
| `lib/current.ts` | Server-side Current-tier loader (`loadCurrentItems`) — mirrors `lib/vault.ts`'s env detection, no v0-preview fallback |
| `app/vault/current/[eraId]/route.ts` | The Current tier's one read route — `packages/core/src/knowledge`, ISR `revalidate: 900` |
| `lib/longlive/live-theories.ts` (+ `.test.ts`) | Knowledge-engine Stage 7: `sortByHeatDesc`, `matchFanSignal` (theory_ids, else symbol overlap), `fansAreSayingLine` — pure, no I/O |
| `lib/longlive/use-live-theories.ts` | Client hook: fetches `live_theory`/`fan_signal` from `/vault/live-theories`, fails soft to `{theories:[],signals:[]}` |
| `lib/live-theories-data.ts` | Server-side `live_theory`/`fan_signal` loader — raw `fetch()` against Supabase's REST endpoint (not `@supabase/supabase-js`, not in `apps/web`'s deps), deliberately outside `packages/core/src/knowledge/` (file-disjoint from Stage 9's concurrent work there) |
| `apps/web/app/embed/youtube/[id]/route.ts` | Wrapper HTML (route handler) the app DOM host frames so YouTube gets a real origin (#4954); only route exempt from frame-ancestors/X-Frame-Options (`lib/security-headers.mjs` `embed`, `proxy.ts`, `next.config.mjs`). UI side: `packages/ui/src/reader/lib/youtube-embed.ts` |
| `apps/web/app/embed/spotify/[type]/[id]/route.ts` | Spotify wrapper HTML for the app DOM host (One UI W6), same exemption path as YouTube via `isEmbedPath`. UI side: `packages/ui/src/reader/lib/spotify-embed.ts` |
| `app/vault/live-theories/route.ts` | Stage 7's one read route for both boards below, ISR `revalidate: 900` |
| `components/longlive/LiveTheoryCard.tsx` | One live `live_theory` card in `TheoryGuide` — dashed-provisional border, heat pill, "fans are saying" line |
| `app/api/intake/route.ts` | "Help us verify" (`CurrentItemDetail.tsx`) files a GitHub `intake`-labeled issue — shape copied from `/api/feedback/route.ts` |
| `lib/longlive/space-doorways.ts` | `spaceDoorways`/`DOORWAY_MIN_GAP` — spreads doorways through an already-merged feed, never drops one. A displaced doorway is marked `displaced` and STOPS being a scrubber anchor |
| `lib/longlive/scrubber-anchor-corpus.test.ts` | Locks zero date inversions across all twelve real eras. Was 44 |
| `lib/longlive/bottom-nav-focus.ts` | Pure focus predicate for `BottomNav` — `focusout` does NOT fire on DOM removal, so this re-derives from `document.activeElement` |
| `lib/longlive/feed-tiers.ts` | Card silhouette/tier scoring — visual only, never order |
| `lib/longlive/lenses.ts` | **2473 lines.** THREADS (6 narrative galleries), EGG_NODES, CLUE_PAIRS, motifs |
| `lib/longlive/progress.ts` | The SSR-safe localStorage pattern — copy this for any persisted UI state |
| `lib/longlive/useBackDismiss.ts` | Module-level LIFO overlay stack; catches the OS back gesture |
| `components/longlive/EraStream.tsx` | Scrolls all eras; its scroll listener sets the active era. Also hosts `LandingMasthead` and the mount/jump scroll-correction loop (front door is the current era, top of stream) |
| `lib/longlive/era-jump-landing.ts` | Pure: `jumpLandingScrollTop` (lands a jump target below the sticky chrome) and `shouldRunEraJump` (gates EraStream's mount-time jump so a fresh `/` load doesn't jump past the masthead) |
| `lib/longlive/chrome-offset.ts` | `measureChromeHeight()` — the one place that measures live TopBar + FilterBar height; every jump/scroll/scrubber offset goes through it instead of a hardcoded constant |
| `components/longlive/EraSection.tsx` | One era's wiring: hero, lyric, feed/doorway data, doorway tap → `pushReturnPoint`. Split (P3 step 15, was 826 lines) into the files below — none over 300 |
| `components/longlive/EraFeedList.tsx` | Renders `EraSection`'s merged feed: dispatches each `EraFeedEntry` kind (plus `era-feed-clusters.ts`'s `cluster`) to the right card component |
| `components/longlive/ClusterCard.tsx` | #696 collapsible "release day, track by track" card — collapsed same-day `MomentCard` run, expands to the full normal-tiered grid |
| `components/longlive/CurrentItemCard.tsx` | Live `current_item` feed card (kind: `'current'`) — dashed-unconfirmed border, "Live · reported by X" chip |
| `components/longlive/CurrentItemDetail.tsx` | Live item's detail overlay — mandatory dashed rumor banner + "Help us verify" (POSTs `/api/intake`). State owned locally by `EraSection`, not the shared store |
| `components/longlive/MomentCard.tsx` | Moment card wrapper: box + inline video play affordance (#2057) |
| `components/longlive/MomentCardButton.tsx` | Moment card body per tier (hero/media/chip/text) + `MomentMeta`/`TagRow` |
| `components/longlive/VideoMomentCard.tsx` | Full-width video-record card (kind: `'video'`) |
| `components/longlive/DoorwayCard.tsx` | Thread/egg doorway cards — same silhouette as a moment card (P3 step 15) |
| `components/longlive/EraThreadsPivot.tsx` | The "Threads running through {era}" strip below the feed |
| `components/longlive/TopBar.tsx` | MOVED to `packages/ui/src/reader/shell/TopBar.tsx` (WP2.4-B); one-line shim. Sticky top bar + the 4-tab `ModeToggle`; hosts `TimelineScrubber` in era mode. Same for `TimelineScrubber`, `timelineScrubberLayout`, `topbarLayout`, `BottomNav`, `components/ui/button`, `EraGrid` (shim); `EraSelector` also lives there (takes optional `header`; the web file is a wrapper passing `YourLongLiveCard`); `ReaderShell.tsx` (new, same dir) is the old LongLive `Shell` with host `slots`; `LongLive.tsx` supplies the web slot map via `ReaderRoot` |
| `components/longlive/EraStream.tsx` | MOVED to `packages/ui/src/reader/era/EraStream.tsx` (WP2.4-C); one-line shim. Same for EraSection, EraFeedList, FilterBar, LandingMasthead, CountdownBanner, ClusterCard, CurrentItemCard, CurrentItemDetail, DoorwayCard, EraSecretCard, EraThreadsPivot, MomentCard, MomentCardButton, MomentVideo, OverlayNav, ShareImageMenu, SignificanceBadge, TrackFivePill, TrackGuideBar, VideoMomentCard (see `packages/ui/READER-MOVE.md`) |
| `lib/longlive/track-video.ts` | Pairs a track with a playable video. Exact match on normalised titles — **never strip edition qualifiers** like "(Taylor's Version)" |
| `components/longlive/TrackGuideBar.tsx` | Full-width bar under the lyric, in the retired Spotify player's slot; opens `TrackGuide` |
| `app/api/share-card/route.tsx` | W9 share cards: `GET /api/share-card` → deterministic PNG (`?item=` moment, `?era=`, `?eras=&m=&e=&f=` "My Eras", `size=portrait\|story`). Invalid input → default brand card, never 500; CDN cache headers. Separate from `/api/og` (untouched). Details in `docs/longlive-experience.md` §7a |
| `lib/longlive/share-card-params.ts` | Client-safe: size allowlist, `bucketCount`/`COUNT_BUCKETS`, `shareCardPath`, `summarizeProgress` (top-3 eras from `ll-progress-v1`) |
| `lib/longlive/share-card-spec.ts` | Server: `parseShareCardRequest(url, data)` — validates a URL against the era/moment allowlists into a `ShareCardSpec` (sub-confirmed → "Unconfirmed"/"Debunked" stamp); `data` is required (no default). `share-card-spec.server.ts` (`import 'server-only'`) binds it to the module content data for the route (WP2.2-C3) |
| `lib/longlive/share-card.tsx` · `share-card-layouts.tsx` · `share-card-frame.tsx` | Renderer split: `renderShareCard`/cache header, per-format layouts, shared era-palette frame + watermark + safe zones |
| `lib/longlive/share-card-fonts.ts` · `share-fonts/` | Vendored Playfair/Inter `.woff` (OFL) read with fs; `next.config.mjs` `outputFileTracingIncludes` ships them with the function |
| `components/longlive/ShareImageMenu.tsx` · `YourLongLiveCard.tsx` | "Share as image" Story/Post menu (moment detail, era hero) and the "Your Long Live" entry in `EraSelector`; `lib/longlive/share-action.ts` `triggerImageShare` + `share-payload.ts` `shareCardImage` do file-share-or-download |
| `components/longlive/TrackGuide.tsx` | Full-screen track-guide modal; plays a paired song video inline (~20% of tracks pair) |
| `packages/ui/src/reader/threads/TheoryGuide.tsx` (shim: `components/longlive/TheoryGuide.tsx`) | Full-screen theories & eggs modal shell; scroll-to-highlight + `ReturnPoint` pop on close |
| `components/longlive/TheoryCard.tsx` | One theory/egg card: badges, sources, R4 back-link (thread if `theoryThreadId` resolves, else the unconditional "whole section" line) |
| `components/longlive/ThreadsMode.tsx` | Thread gallery + thread detail |
| `components/longlive/FeedbackButton.tsx` | Fixed bottom-right, `z-[71]`, POSTs to `/api/feedback` |

## Commands worth knowing

- Test: `npm test` (vitest) · E2E: `npm run test:e2e`
- Typecheck: `npm run typecheck` · Lint: `npm run lint` · Format: `npm run format`
- Build: `npm run build`
- Content gates: `npm run check:generated`, `check:content-ownership`,
  `check:voice`, `validate:content`, `validate:social`
- Era-date regression: `scripts/era-date-audit.test.ts` checks every authored
  content/theory era file against `supabase/seed/eras-data.mjs` and snapshots
  the documented no-range/campaign exceptions.

## Clown bot rebuild (build B) — new files this workstream

`docs/decisions.md` 2026-08-13 "Clownbot rebuild"; `docs/longlive-experience.md`
§7 has the surface description. Existing as of this update (checked against
`git status --short`, not just `PLAN.md`'s aspirational table):

| Path | What |
|---|---|
| `apps/web/lib/longlive/clown-index.ts` (+ `.test.ts`, `.integration.test.ts`, `clown-index-status.test.ts`) | Retrieval index; blocklist pre-filter at build time |
| `apps/web/lib/longlive/clown-retrieve.ts` (+ `.test.ts`) | Deterministic retrieval + `detectRecencyIntent()` |
| `apps/web/lib/longlive/clown-blocklist.ts` (+ `-gates.ts`, `.test.ts`) | `screenTopic()`, per-category phrase lists |
| `apps/web/lib/longlive/clown-safety.ts` (+ `-gates.ts`, `.test.ts`) | Ported input/output safety, crisis reuse |
| `apps/web/lib/longlive/clown-battery-corpus.ts` (+ `-attacks.ts`, `-attacks-b.ts`, `-tier-b.ts`, `.test.ts`) | Red-team corpus (61 attacks, 23 Tier B probes as of Stage 12), ported + extended |
| `apps/web/lib/longlive/clown-board.ts` (+ `.test.ts`) | Both prefill columns, pure/deterministic |
| `apps/web/lib/longlive/clown-fallback.ts` (+ `.test.ts`) | Zero-model card composer |
| `apps/web/lib/longlive/clown-starters.ts` (+ `.test.ts`) | Column item → composer prefill string |
| `apps/web/lib/longlive/clown-names.ts` (+ `.test.ts`) | Ported name registry |
| `apps/web/lib/longlive/clown-explain.ts` (+ `.test.ts`) | Plain-language clowning/delulu/Easter-egg definitions; deterministic meta-question intercept before retrieval/model |
| `apps/web/lib/longlive/clown-client.ts` (+ `-prompt.ts`, `.test.ts`) | The one model call; tier as a named constant; `CLOWN_MODEL_DISABLED` kill switch |
| `apps/web/lib/longlive/clown-answer.ts` | `ClownAnswer` — the one client-facing shape |
| `apps/web/lib/longlive/clown-gate.ts` (+ `.test.ts`) | Output re-screen |
| `apps/web/lib/longlive/clown-usage.ts` (+ `.test.ts`) | Ported cap reservoir |
| `apps/web/components/longlive/ClownChat.tsx` | App-panel shell — state, the `ask()` fetch/stream loop, layout — fullscreen toggle + docked composer split out below (300-line cap, HUMAN-ACTIONS.md #15 LOW finding) |
| `apps/web/components/longlive/ClownChatTitlebar.tsx` | Titlebar (avatar/label/online dot/expand toggle), split out of ClownChat.tsx (300-line cap) |
| `apps/web/components/longlive/ClownEmptyState.tsx` | Newcomer vocabulary guide + four composer-prefill starters; buttons never auto-send |
| `apps/web/components/longlive/ClownChatComposer.tsx` | Docked composer pill (textarea/send), split out of ClownChat.tsx (300-line cap); textarea auto-grows via `useAutoResizeTextarea` |
| `apps/web/lib/longlive/clown-chat-ui.ts` | `useAutoResizeTextarea` / `useStickToBottomScroll` — the composer's grow-to-fit and the stream's stick-to-bottom-unless-scrolled-up auto-scroll |
| `apps/web/components/longlive/ClownMessageRow.tsx` | One transcript turn — user bubble + bot reply (split out of ClownChat.tsx, 300-line cap) |
| `apps/web/lib/longlive/useChromeOffset.ts` | Live sticky-chrome height hook, split out of ClownChat.tsx (300-line cap) — wraps `chrome-offset.ts`'s `measureChromeHeight` |
| `apps/web/components/longlive/ClownBoard.tsx` | The two columns. Knowledge-engine Stage 7: column 1 also renders `live_theory` rows (`lib/longlive/use-live-theories.ts`), sorted by heat, above the static list |
| `apps/web/components/longlive/ClownItemCard.tsx` | One column item / one source card |
| `scripts/check-clown-battery.mjs` | `clown:battery` CI script (deterministic, no API key) |
| `docs/proposals/2026-08-13-clownbot-shelved-content.md` | Build-A content not carried forward |
| `docs/ops/clown-kill-switch.md` | `CLOWN_MODEL_DISABLED` kill switch |

The build-A `clownbot-*` deletions, the `store.tsx`/`LongLive.tsx` wiring,
`app/api/clown/route.ts`, `clown-seed-example.ts`, and the
`share.ts`/`TopBar.tsx` wiring have all landed.

`apps/web/lib/longlive/clownbot-lore.ts` (+ `.test.ts`) — the hand-authored,
sourced rumor/lore corpus — is still live and still load-bearing: it's one of
three inputs `clown-index.ts`'s `buildClownDocs()` folds together (with
`theories.generated.ts` and `content.ts`), and that compile-time index is the
documented no-DB fallback the knowledge-engine build (Stage 9) deliberately
kept unmodified. It was **not** migrated/retired by the knowledge-engine
build, despite the original proposal's §3 plan to fold its 8 items into
`current_item`/`live_theory` — see `docs/decisions.md` and the Stage 13 PR
for why that didn't happen.

## Clownbot agent loop (PLAN.md Stage 10, proposal §7) — new files

Inserts a bounded, streamed tool loop into the existing route's
compose-or-fallback stage. Consumes Stage 9's `packages/core/src/knowledge`
retrieval library; also touches it additively (every `KnowledgeDataSource`
method — `search`/`precedents`/`recent`/`chatter`/`symbolActivity`/`track` —
gained an optional trailing `signal?: AbortSignal` so the loop's shared
wall-clock deadline aborts an in-flight DB read, not just abandons it), never
changing any existing call site's behaviour.

| Path | What |
|---|---|
| `apps/web/lib/longlive/clown-agent.ts` (+ `.test.ts`) | The bounded loop's control flow (`runClownAgent`) — ≤6 tool calls / ≤20s / ≤2,500 tokens, all enforced BEFORE a call is requested, not after; forces `record_take` once any cap trips |
| `apps/web/lib/longlive/clown-agent-prompt.ts` | Message-shape plumbing split out of `clown-agent.ts` (300-line cap): seed-prompt building, `tool_result` formatting, read-tool dispatch (`executeReadTool`, `dispatchReadBlocks`), `tool_use` block extraction — no cap/budget logic |
| `apps/web/lib/longlive/clown-agent-caps.ts` (+ tested via `clown-agent.test.ts`) | Pure per-round cap arithmetic (tool-call budget / token headroom / wall clock → next `tool_choice`), split out of `clown-agent.ts` (300-line cap) |
| `apps/web/lib/longlive/clown-agent-tools.ts` (+ `.test.ts`) | The 7 read tools' executors, DB-first with `clown-index.ts` as the no-DB-unreachable fallback (search only); `resolveScopeSignal` for the route's pre-loop scope check |
| `apps/web/lib/longlive/clown-predictions.ts` (+ `.test.ts`) | PLAN.md Stage 11: `persistPrediction` writes `bot_prediction` for real when a memory session resolves; no-ops when it doesn't (today's real state) |
| `apps/web/lib/longlive/clown-session.ts` (+ `.test.ts`) | PLAN.md Stage 11: Supabase anonymous-auth session resolution (raw `fetch()` over Auth/PostgREST, no SDK dep) — `resolveClownSession` degrades to `null` when the "Allow anonymous sign-ins" toggle is off (today's state, `HUMAN-ACTIONS.md` #15 item 2); session persistence is an `HttpOnly; Secure; SameSite=Strict` cookie (`readSessionCookie`/`buildSessionCookieHeader`), not `localStorage` (round-4 architect redesign; the prior `clown-session-storage.ts` localStorage approach was deleted) |
| `apps/web/lib/longlive/clown-memory.ts` (+ `.test.ts`) | PLAN.md Stage 11: conversation continuation, rolling summary (truncate-and-fold past 20 turns), per-user daily cap (`usage_daily(scope='clown-chat:<uid>')`, 200/day — same number as `clown-usage.ts`'s existing cap) |
| `apps/web/lib/longlive/clown-pins.ts` (+ `.test.ts`) | PLAN.md Stage 11: `clown_pinned_theory` pin/unpin/list — library only, no route wired to it yet |
| `apps/web/lib/longlive/clown-stream.ts` (+ `.test.ts`) | Client-side NDJSON stream reader, shared by `ClownChat.tsx` |
| `apps/web/lib/longlive/clown-route-helpers.ts` | `route.ts` plumbing split out (300-line cap): rate limiting, transcript sanitisation, the fixed-copy answer shape, the NDJSON stream producer (server side of `clown-stream.ts`) |
| `apps/web/lib/longlive/clown-chat-helpers.ts` | Pure helpers split out of `ClownChat.tsx` (300-line cap) |
| `apps/web/lib/longlive/clown-client.ts` | Unchanged behaviour, now also exports `callAnthropicMessages`/`clownModelKey` — the shared wire primitive `clown-agent.ts` reuses (no second model client) |
| `apps/web/lib/longlive/clown-client-prompt.ts` | Gains the method block + `CLOWN_READ_TOOLS` schemas; `CLOWN_TAKE_TOOL` unchanged |
| `apps/web/lib/longlive/clown-answer.ts` | `ClownAnswer` widened with `investigation: InvestigationStep[]` (`[]` for every non-loop producer) |

`ClownChat.tsx`/`ClownMessageRow.tsx` were already over the 300-line
guideline before this stage (350/153 lines); the stream-consumption and
investigation-trail rendering, plus two further Stage 11 fix rounds, pushed
`ClownChat.tsx` to 387 and `clown-agent.ts` to 334 (HUMAN-ACTIONS.md #15 LOW
finding). Split further in the #15 third-pass fix: `ClownChat.tsx` →
`ClownChatTitlebar.tsx` + `ClownChatComposer.tsx` + `useChromeOffset.ts`
(387 → 301 lines); `clown-agent.ts` → `clown-agent-caps.ts` +
`clown-agent-prompt.ts`'s new `dispatchReadBlocks` (334 → 311 lines). Both
land just above the 300-line guideline, not under it — noted honestly
rather than fragmenting further at the cost of readability.

## Clownbot eval harness (PLAN.md Stage 12, proposal §7 eval bullet) — new files

Not wired into CI (each needs a live key and/or a live, writable DB) —
degrades to a clear skip, matching the pattern of the other DB-dependent
scripts this build added. Battery corpus additions (tool-result injection,
the 2026-08-16 brief's 11 acceptance cases) live in the existing
`clown-battery-corpus*.ts` files above, not new files.

| Path | What |
|---|---|
| `scripts/knowledge-engine/clown-eval.mjs` (`npm run clown:eval`) | Retro battery over confirmed `egg_ledger` precedents with the write-up doc hidden — target top-3 hit rate ≥60%; also runs the grounding check (below) on every cited id |
| `apps/web/lib/longlive/clown-grounding.ts` (+ `.test.ts`) | Pure `groundCitations()` — confirms every cited id exists and is `redline_ok=true`; CI-safe on its own, driven with real DB rows by `clown-eval.mjs` |
| `apps/web/lib/longlive/clown-agent-injection.test.ts` | Agent-loop-level regression for the tool-result injection surface — mocked malicious `tool_result` content, asserts it stays confined to the data channel and that a resulting fabricated citation is still caught |
| `scripts/knowledge-freshness.mjs` (`npm run knowledge:freshness`) | `max(updated_at) tier='current'` < 24h SLO — report-only, wired into `watchdog.yml`, never blocks `build` |

## Mood Chat — the song/feeling matcher (SEPARATE from Clownbot)

Shares **zero imports** with `clown-*`; the two only mirror each other in
comments. A mood-only change cannot reach Clownbot except by editing the wrong
file by mistake — the names are easy to confuse.

| Path | What |
|---|---|
| `apps/web/lib/longlive/mood-prompt.ts` | **The classifier prompt, extracted from code so wording is editable without touching request logic.** Carries the permissiveness rules and the "always score at least one axis" guarantee |
| `apps/web/lib/longlive/mood-client.ts` | The ONE model call (`claude-sonnet-5`, forced `record_mood` tool, thinking disabled). `cache_control` present but a no-op below the 1024-token minimum |
| `apps/web/lib/longlive/mood-match.ts` | Deterministic matcher over precomputed vectors + era diversity. **Bereavement gate at :40-48 is issue #1984 — never weaken** |
| `apps/web/lib/longlive/mood-keywords.ts` | Degraded-path lexicon, used when no `ANTHROPIC_API_KEY` (the normal local state). **~440 lines — over the 300 cap BEFORE this workstream touched it.** Splitting it is its own task; do not bundle that into a feature PR |
| `apps/web/lib/longlive/mood-safety.ts` | Crisis detection + all user-facing copy. **Copy is founder-gated** (`docs/content-ops/mood-chat-safety-language.md`) |
| `apps/web/lib/longlive/mood-usage.ts` | 200/day cap, per cold start. No kill switch exists (unlike Clownbot's) |
| `supabase/seed/song-moods/*.mjs` | **HAND-AUTHORED SOURCE**, one file per era. `_example.mjs` is the template, `README.md` the rules. All 8 axes required per song, `useCase` ≤60 chars each, `oneLiner` ≤160. **NO LYRICS EVER** — the generator rejects any line break and it is a P0 redline |
| `scripts/sync-song-moods.mjs` | Merges track seeds + mood seeds → the generated catalogue. Validates ranges, lengths, slugs; fails the build on a bad entry. Run via `npm run sync:content`, checked by `npm run check:generated` |
| `apps/web/lib/longlive/song-moods.generated.ts` | **GENERATED, never hand-edited.** 8 axes + energy/valence per song |
| `apps/web/app/api/mood/route.ts` | The endpoint. Per-IP limit 15/60s in-process; `refusal` vs `unclear` distinction at :222 vs :239 is load-bearing |
| `apps/web/components/longlive/MoodChat.tsx` | Free-text box; renders structured JSON, never markdown |
| `apps/web/components/longlive/MoodSongCard.tsx` | One song card; the sentence is `pick.oneLiner`, not model prose |
| `apps/web/lib/longlive/mood-battery.ts` | The 10 acceptance cases as typed data, imported by the route tests |
| `scripts/check-mood-battery.mjs` | **Live** battery against a real `POST /api/mood` + real key — the only thing that exercises model judgment. `npm run dev --workspace @swift2/web -- -p 3100` first. **Port 3100, never 3000** (an agent killed Joey's server there). Case list is mirrored from `mood-battery.ts`; edit both |
| `MOODBOT.md` | How to add songs / re-score moods |
| `apps/web/lib/longlive/mood-intents.ts` | Hand-checked preferred/excluded song policies for companionship, everyday work stress, and bare fatigue |

Casual-language guardrails (#1985/#1986/#1988) live across
`mood-keywords.ts` and `mood-match.ts`: the lexicon recognizes the ticket's
literal phrases, while narrow companionship/work-stress/fatigue intents pin
or exclude only the hand-checked issue examples. General axis scoring and the
#1984 bereavement gate remain unchanged.

## Dead / do-not-touch

- `.claude/worktrees/` — ~30 registered git worktrees, excluded via
  `.git/info/exclude`. Never delete, never `git clean`.
- `scripts/social/social-poster-workflow.test.ts.tmp` — untracked scratch owned
  by another session. Leave it exactly as-is.

## Community research (2026-08-14, PR #2110)

- `data/communities.json` — 30 verified Swiftie communities, 8 platforms, each with verification provenance. NOT wired into the app.
- `data/communities-report.md` — landscape narrative, top 10, niches, and what is deliberately absent.
- `sources.md` — every directory/thread/article mined, plus the platform blockers, so this is re-runnable.

## Notifications Phase 0 (2026-08-31, NOTIFICATIONS_PLAN.md) — new files

Device registry only — foundation for the full notification system.
`NOTIFICATIONS_SPEC.md`/`NOTIFICATIONS_PLAN.md`/`NOTIFICATIONS_PROMPTS.md`
at the repo root are the durable spec/plan; `SETUP_NOTIFICATIONS.md` is the
founder-facing checklist for the Firebase/APNs pieces no agent can do.

| Path | What |
|---|---|
| `supabase/migrations/20260909000000_notifications_devices.sql` | The `devices` table (spec §9). RLS on, no `anon`/`authenticated` policies — `service_role` only |
| `packages/shared/src/notifications-types.ts` | Portable category catalogue (spec §4, minus Fun categories — Phase 4), `DeviceRegistrationInput` |
| `packages/core/src/devices.ts` | `upsertDevice()` — the one write path, service-role only, called from the register route; calls `upsert_device_ordered` (stale `seq` writes ignored), falling back to a plain upsert if the migration is not yet applied |
| `supabase/migrations/20261004010000_devices_register_seq.sql` | `devices.register_seq` + `upsert_device_ordered()` (service_role-only) — server-side ordering for register writes (#5039) |
| `packages/shared/src/device-registration.ts` | `DevicePlatform` + `DeviceRegistrationInput` (incl. optional `seq`), split out of `notifications-types.ts` |
| `apps/web/app/api/devices/register/route.ts` (+ `.test.ts`) | `POST /api/devices/register` — upsert-by-`device_id`, same call for first registration and token refresh |
| `apps/mobile/lib/api-base.ts` (+ test) | `apiBaseUrl()` / `DEFAULT_API_BASE_URL` — the one place the mobile API host is decided (`EXPO_PUBLIC_API_BASE_URL` override) |
| `apps/mobile/lib/device-id.ts` | Anonymous `device_id` generation + SecureStore persistence (spec §2) |
| `apps/mobile/lib/notification-channels.ts` | Android notification channels, 1:1 with spec §4 categories (Android-only, no-ops on iOS) |
| `apps/mobile/lib/push-registration.ts` | `registerDevice()` (cold-start safe, no permission prompt) vs `requestPushRegistration()` (asks permission — Phase 2's onboarding screen calls this, not App.tsx) |
| `scripts/send-test-push.ts` | Manual FCM HTTP v1 send to one device_id. Fails closed with a named-missing-env-var message until Firebase setup lands (`SETUP_NOTIFICATIONS.md`) |

`apps/mobile/App.tsx` calls `registerDevice()` on every cold start — this
alone satisfies Phase 0's "fresh install registers a devices row"
acceptance criterion without ever firing the OS permission dialog (spec §7:
that's gated behind Phase 2's pre-permission onboarding screen).

## Community + Merch (2026-08-14, PR pending)

- `apps/web/lib/longlive/communities.ts` — types + `COMMUNITIES` + grouping helpers. Re-exports the three data files below.
- `apps/web/lib/longlive/communities-data-{a,b,c}.ts` — the 30 entries, transcribed verbatim from `data/communities.json`. Split only for the 300-line cap; treat as one dataset. **15 of 30 have `memberCount: null` BY DESIGN** — Reddit blocks automated access. Never substitute 0.
- `apps/web/lib/longlive/merch.ts` — merch catalogue. `shopTheLook` (151 items) is read LIVE off `CONTENT`, never re-authored. `officialStore`/`fanMade` are genuinely empty.
- `apps/web/lib/longlive/submit-link.ts` — validation, domain/platform derivation, client-id hashing, and the three sinks. **Each sink is independently optional; a missing one must never fail a submission.** `neutralizeCell` here and `neutralizeCell_` in the Apps Script are the SAME rule deliberately duplicated — both sides of the sheet trust boundary. Change one, change both.
- `apps/web/app/api/submit-link/route.ts` — the public endpoint. Honeypot + per-IP rate limit copied from `/api/feedback`. **Never fetches the submitted URL** (SSRF).
- `apps/web/components/longlive/CommunitySection.tsx` — directory grouped by platform. Verification badge shows only when NOT verified; flags render above descriptions.
- `packages/ui/src/reader/merch/MerchSection.tsx` (apps/web `MerchSection.tsx` is a thin wrapper injecting the baked `MERCH_EXTENSIONS` via the `extensions` prop) — composition only (~165 lines): marquee, sticky rail, three sections, submit form. Links out only; no cart, no checkout (item 4a standing rule).
- `packages/ui/src/reader/merch/MerchMarquee.tsx` (apps/web path is a one-line shim) — flashing-bulb hero. Staggered `animationDelay`; relies on `globals.css`'s blanket `prefers-reduced-motion` `!important` rule, so the animation must stay a CSS `animation` (a JS timer would escape it).
- `packages/ui/src/reader/merch/MerchSectionRail.tsx` (apps/web path is a one-line shim) — sticky 3-section rail + scrollspy. Offset comes from `measureChromeBottom()` re-read on scroll/resize, NEVER a constant. Tags itself `data-ll-merchrail` but is deliberately NOT wired into `chrome-offset.ts` — nothing sticky sits below it.
- `packages/ui/src/reader/merch/EraSpine.tsx` (apps/web path is a one-line shim) — era filter spine. **Never use `scrollIntoView` here**: with `block:'nearest'` it scrolls the window too and hijacked page position on mount. Scroll the track's `scrollLeft` directly. 0 → em-dash + `disabled`, never "0".
- `packages/ui/src/reader/merch/MerchStyleSection.tsx` (apps/web path is a one-line shim) — the "Seen on Taylor" section: spine wiring, the REAL filters, tally, grid, pager. **No garment-type filter exists — `Product` has no `kind` field, deliberately.**
- `packages/ui/src/reader/merch/MerchCardHalf.tsx` — the photo half/tile split out of MerchCard (size rule). MerchCard and MerchSection take affiliate ids from `useHost().env.affiliate ?? {}` via `createHostShopLinkRenderer`, never the process env.
- `packages/ui/src/reader/merch/MerchCard.tsx` (apps/web path is a one-line shim) — split "On Taylor | the piece" card; exact-vs-similar with `altNote` INLINE (a hover tooltip is invisible on touch — that was the bug).
- `packages/ui/src/reader/merch/MerchEmptyPanel.tsx` (apps/web path is a one-line shim) — honest placeholder for the two empty buckets. Never fabricates products.
- `.merch-shell` in `apps/web/app/globals.css` — 11 `--merch-*` tokens. Merch deliberately opts OUT of era skinning; do not "unify" it back into the nine `--era-*` vars.
- `apps/web/components/longlive/SubmitLinkForm.tsx` — shared by both sections. Honeypot is off-screen, NOT `display:none`.
- `scripts/apps-script/submissions-doPost.gs` — Apps Script for the sheet. Joey deploys it; shared-secret gated.
- `docs/ops/community-merch-submissions.md` — Joey-facing setup: Apps Script, Resend domain, `vercel env add`.

## Local Facebook export automation (2026-09-30)

| Path | What |
|---|---|
| `scripts/knowledge/fb-export-harvest.mjs` | Captures and merges virtualized Facebook feed units during scrolling, neutralizes nested article roles, and builds parser-safe HTML exports |
| `scripts/knowledge/fb-export-launch.mjs` | Starts plain Chrome (no CDP/debugging port) on the local receiver URL and runs `extensionCollect`: receiver + Chrome, total wall budget, always closes both |
| `scripts/knowledge/fb-export-helpers.mjs` | Pure filename/date, relative-age, stopping, and page-classification rules |
| `scripts/knowledge/fb-export-run.mjs` | Weekly idempotent orchestration: collect → real-parser copy gate → confirmed upload → reminder issue comment/close; `--dry-run` stops before upload/GitHub |
| `scripts/knowledge/fb-export-task.ps1` | Registers the Sunday 18:00 local Windows task with start-after-miss and wake enabled |
| `%LOCALAPPDATA%\longlive-fb` | **Outside repo:** DPAPI credential, Chrome profile, dated raw exports/diagnostics, and weekly completion ledgers |
| `scripts/community/fb-lead-scrub.mjs` (+ test) | One-off repair for issue #4885 / HA #98: finds and DELETES the contaminated `engagement_lead` rows (leaked tag fragment + an unhashed group member's name in `locator`/`context`) written by the pre-fix parser. Dry run by DEFAULT; `--apply` deletes; `--json-out` dumps the pre-delete rows for audit. Matches only facebook + `status='new'` + a known checklist group + the leak signature at the head of the excerpt |
| `scripts/community/fb-lead-reingest.mjs` (+ test) | The repair half: re-derives clean leads from the exports already stored in the private `facebook-exports` bucket with the fixed parser, LEADS ONLY (`fan_signal` holds aggregates only, was never contaminated, and has no unique constraint — re-inserting would duplicate). Dry run by DEFAULT; `--apply` writes; idempotent via `engagement_lead`'s dedupe index |
| `.github/workflows/fb-lead-scrub.yml` | Manual-dispatch lane for the two scripts above (they need `SUPABASE_SERVICE_ROLE_KEY`, which only lives in Actions secrets). `apply` input defaults to false; uploads the deleted rows as a run artifact. One-off — delete after the repair has run |
| `supabase/migrations/20261004000000_community_watchlist_facebook_backfill.sql` | Backfills the 7 `community_watchlist` rows for export-checklist Facebook groups that were producing leads with no watchlist row (#4885's last bullet). scan=true, crawl=false, allows_links=false for all |

## Notifications Phase 4 (2026-08-31, NOTIFICATIONS_PLAN.md) — new files

Fun notifications: `lyric_of_day`, `on_this_day`, and the `countdowns`
event-driven category. Builds on Phases 0-3's devices/prefs/events/digest
infrastructure — no new send path, reuses `sendPushBatch` and the same
`/api/notifications/dispatch` cron entry point.

| Path | What |
|---|---|
| `supabase/migrations/20260913000000_notifications_fun.sql` | `lyrics`, `lyric_history`, `on_this_day`, `countdown_sends` tables + `events.drop_at` column. `service_role`-only RLS, same posture as every other notifications table |
| `supabase/seed/lyrics/starter-pool.mjs` | **DRAFT** 224-entry lyric pool, `verified: false` until founder review — see STATE.md |
| `supabase/seed/on-this-day/starter-pool.mjs` | 37 entries derived from the real `MILESTONES` timeline (`content.ts`) — not new content |
| `scripts/seed-lyrics.mjs` / `scripts/seed-on-this-day.mjs` (`npm run db:seed:lyrics` / `db:seed:on-this-day`) | Wholesale-replace seeders, same pattern as `seed-tracks.mjs` |
| `packages/core/src/notification-fun-schedule.ts` | DST-safe Daily/Weekly/Monthly send-day + period-boundary math for fun cadences, mirrors `notification-digest-schedule.ts` |
| `packages/core/src/notification-fun.ts` | Pure selection (`selectLyricForDevice` 12-month no-repeat, `selectOnThisDayEntry` silent-skip, `scheduleCountdowns` T-7d/T-1d/release-hour) + DB orchestration (`dispatchFunNotifications`, `scheduleCountdownsForPendingEvents`, `dispatchDueCountdowns`) |
| `packages/shared/src/notifications-types.ts` | Added `EVENT_NOTIFICATION_CATEGORIES` (`countdowns`), `EVENT_CADENCES` (`on`/`off`) — `cadenceVariantFor` now returns `'steady' \| 'fun' \| 'event'` |
| `packages/shared/src/notification-deep-links.ts` | Added `{ screen: 'track'; slug }` destination — `lyric_of_day` deep-links via `?song=<slug>` |
| `packages/shared/src/notification-links.ts` | #5044 — producer-side link builders (`songLink`/`theoriesBoardLink`/`merchLink`/`frontDoorLink`) in the site's deep-link vocabulary; every notification producer uses these, never `?current=` or `?song=<db slug>` |
| `apps/web/lib/longlive/lyric-track-key.ts` + `lyric-track-keys.json` | #5044 — lyrics.slug -> composite trackKey for `lyric_of_day`; the JSON is committed, regenerated by `scripts/sync-lyric-track-keys.mjs` (builder in `scripts/lib/lyric-track-keys.mjs`), drift-tested |
| `supabase/migrations/20261004100000_lyric_slug_showgirl.sql` | #5044 — guarded in-place rename of the wrong showgirl lyric slug (ids and lyric_history preserved); touches no event rows |
| `apps/mobile/components/CadencePills.tsx` | Added the `'event'` variant (On/Off pills) alongside `'steady'`/`'fun'` |
| `apps/web/app/api/notifications/dispatch/route.ts` | Now also runs `dispatchFunNotifications`, `scheduleCountdownsForPendingEvents`, `dispatchDueCountdowns` every tick |


## Notifications Phase 6 (2026-08-31, NOTIFICATIONS_PLAN.md) — final phase, new files

Web Push (VAPID) + open tracking + internal metrics dashboard. No new
device-identity schema — `platform='web'` devices reuse the entire Phase
0-5 pipeline unchanged (see notification-web-push.ts's header comment).
**The full notification system is now code-complete across all 7 phases.**

| Path | What |
|---|---|
| `supabase/migrations/20260914000000_notifications_web_push.sql` | `deliveries.delivery_token` (opaque per-send correlation id, backfilled) + a covering index for the dashboard's prefs-update queries |
| `packages/core/src/notification-web-push.ts` | VAPID sender (`sendWebPushBatch`) — same contract/degrade-on-unconfigured posture as the FCM sender |
| `packages/core/src/notification-sender.ts` | `sendPushBatch` now partitions by `platform`; web routes to the VAPID sender, everything else keeps using FCM. Every successful send gets a fresh `deliveryToken` |
| `packages/core/src/notification-metrics.ts` | `markDeliveryOpened()` (open-tracking write), `computeMetrics`/`computeOpenRateByCategory`/`computeMuteRateByCategory` (pure), `loadMetrics()` (DB orchestration), `MUTE_RATE_FLAG_THRESHOLD = 0.02` |
| `apps/web/public/sw.js` | Service worker: renders the push, reports the open on tap, focuses/opens the right page |
| `apps/web/lib/web-push-client.ts` | `subscribeToWebPush()`/`unsubscribeFromWebPush()` — localStorage device_id, permission request, Push subscribe, registers through the existing `/api/devices/register` |
| `apps/web/components/longlive/WebNotificationSettings.tsx` | The real settings screen once subscribed — reuses `@swift2/shared` types + the existing prefs API, same instant-apply contract as mobile |
| `apps/web/app/settings/notifications/page.tsx` | Was a static "get the app" page (Phase 1-5); now renders `WebNotificationSettings` |
| `apps/web/app/api/notifications/open/route.ts` (+ `.test.ts`) | `POST /api/notifications/open` — the open-tracking HTTP entry point, unauthenticated beyond the unguessable per-delivery token, degrades to a soft 200 on every failure mode |
| `apps/web/app/api/notifications/metrics/route.ts` (+ `.test.ts`) | `GET /api/notifications/metrics` — `?secret=`-gated (`NOTIFICATIONS_DASHBOARD_SECRET`), backs the dashboard page |
| `apps/web/app/internal/notifications/page.tsx` | The internal metrics dashboard — server-rendered, same `?secret=` gate, shows an honest "no data yet" state before real traffic |
| `scripts/generate-vapid-keys.mjs` | `node scripts/generate-vapid-keys.mjs` — thin wrapper around `web-push`'s own VAPID keypair generator |





## Tree Overhaul plan (2026-09-11, epic #4117)

| File | Purpose |
|---|---|
| `docs/plans/tree-overhaul/PLAN.md` | Plan of record: waves, item map, gates, checkpoints |
| `docs/plans/tree-overhaul/RUNBOOK.md` | Founder runbook: what to paste, which model, when to clear, what to react to |
| `docs/plans/tree-overhaul/waves/*.md` | Paste-ready prompts, one per wave, each a fresh session |
| `docs/plans/marjorie-overhaul/PLAN.md` | Marjorie Overhaul (epic #4180) plan of record: waves M0–M4, item map, gates, why M4 waits for Tree R2 |
| `docs/plans/marjorie-overhaul/RUNBOOK.md` | Founder runbook for the Marjorie waves: schedule, standing job in `#longlive-marjorie` |
| `docs/plans/marjorie-overhaul/checkpoints.json` | MR1/MR2 rechecks; `due` is null until the M1 session sets it |
| `docs/plans/marjorie-overhaul/waves/*.md` | Paste-ready prompts, one per wave: `m0-design` (done), `m1-comms`, `m2-watchdog-handling`, `m3-triage`, `m4-loop`, `m5-chat`, `m6-live-asks`, `m7-doorbell`, `m7-clock-v2` (the clock rebuilt from the architect ruling in `DEBUG.md` on `feature/m7-clock`) |
| `docs/plans/one-ui/PLAN.md` | One UI programme (epic #4788): work packages WP0.0–WP5.2, gates G0–G5, device test sessions S1–S9 |
| `docs/plans/one-ui/OPERATING-MODE.md` | How the One UI PM session runs: roles, decision authority, context discipline, Fable triggers, device-test protocol, kickoff prompt (§8) |
| `docs/plans/one-ui/PROGRESS.md` | One UI PM's live state; the up-to-date copy is on branch `pm/one-ui-progress` |
| `docs/one-ui/x4-universal-links.md` | H6 universal-link intake plan + owner values still needed; `docs/one-ui/drafts/well-known/` holds the draft AASA + assetlinks.json (placeholders, NOT served; must not move to `apps/web/public/.well-known` before H3/H6) |
| `.github/workflows/plan-recheck-marjorie.yml` | Fork of `plan-recheck.yml` for the Marjorie plan (path hard-coded there); daily gate, Opus only when due |
| `docs/agents/runner-prompts/plan-recheck-marjorie.md` | Prompt for the Marjorie recheck routine, reports on #4180 |
| `docs/plans/tree-overhaul/WAVE-1-REVIEW-BRIEF.md` | Handoff for a later review session: what Wave 1 decided, what was already reviewed, and the five places worth pushing hardest |
| `docs/plans/tree-overhaul/checkpoints.json` | Dated observation checkpoints R1–R4; `plan-recheck.yml` fires the routine when one is due |
| `docs/plans/tree-overhaul/rechecks/` | Routine-written recheck reports (one per checkpoint) |
| `docs/specs/marjorie-overhaul/c1-delivery.md` | M0 design: `scripts/marjorie/lib/discord.mjs`, webhook-not-bot-token and why, the `ops` environment, the mechanical `[discord failed]` mail fallback, and what M4 needs to read thread replies |
| `scripts/marjorie/lib/discord.mjs` | C1: `post()` — chunked Discord webhook delivery, at most one retry (2s, or the longest 429 header/body cooldown up to 2min; unknown/long cooldowns fail without retry), reuses `chunkForDiscord`/`neutralizeMentions`; returns safe cooldown metadata on 429 failure and the first chunk's `messageId` on success |
| `scripts/marjorie/post-or-mail.mjs` | C1: thin CLI — Discord via `discord.mjs`'s `post()`, `[discord failed]` email via `send-mail.py` only on an HTTP-observable failure; the only judgment-free path from Marjorie to email; M2 extension: also prints `discord-message-id: <id>` on a successful post so `routine-marjorie-brief.yml`'s `deliver` job can persist it |
| `scripts/marjorie/lib/discord-bot.mjs` | M5: bot-token Discord REST helper for `run:` steps under `environment: social` only — `discordRequest` (any method, 429 retry, `{ ok, status, data }`), `discordGet` (reply-poll's null-on-404 contract), `isRootOrWebhookMessage`, `snowflakeMs`, `hasOwnReaction`, `reactionUrl`; covered by `chat-poll.test.ts` and `reply-poll.test.ts` |
| `scripts/marjorie/chat-poll.mjs` | M5 I/O: `poll` claims founder messages in #longlive-marjorie / #longlive-tree and their active threads with 👀 (paged back to 24 h), then dispatches `routine-marjorie-chat.yml` / `routine-tree-chat.yml`; never removes a 👀 and never dispatches a claimed message twice — a claim still without ✅/❌ after 45 minutes, with every matching run (by `run-name`) finished, is settled with `lib/chat-delivery.mjs` (reply found → ✅, notice found → ❌, neither → one referenced `[chat failed]` notice then ❌); unreadable places or blank bodies fail the run; M7, while `DOORBELL_LIVE`: a message carrying someone else's 👀 is skipped while its run is going (a finished run → claimed with no second dispatch; no run after 60 s → `bot-chat-alarm.yml` `doorbell-dispatch-failed`), and an unrung message 60 s or older raises `doorbell-missed`, each alarm only after a successful claim; skipped messages do not use the 3-per-channel cap; `context` is re-exported from `lib/chat-context.mjs`; tests: `chat-poll.test.ts`, `chat-poll-doorbell.test.ts` |
| `scripts/marjorie/lib/chat-inbox.mjs` | M5 pure half of the poll: `BOTS` table, `runTitle` (the chat routines' `run-name`), `founderIds` (`DISCORD_FOUNDER_IDS` or `approvers.mjs`), `selectInbox` (picked ≤3 oldest / claimed / blank-body), `isFailureNotice` (the one `[chat failed]` notice shape, shared with `chat-delivery.mjs`), `dispatchArgs`, `buildContext`; M7: `DOORBELL_LIVE` (committed, flips by PR), `hasOthersReaction`, `alarmArgs`, `doorbellWatch` (m7-doorbell.md Mechanics 5); tests: `chat-poll.test.ts`, `chat-poll-doorbell.test.ts` |
| `scripts/marjorie/lib/chat-context.mjs` | M5/M7: `chat-poll.mjs context` — reads the message, claims it with the bot's own 👀 (a founder's unsettled, unclaimed message only; a refusal is a warning), then writes the context JSON the agent reads |
| `scripts/marjorie/chat-poll.fixtures.ts` | Shared Discord and `gh` stand-ins for `chat-poll.test.ts` and `chat-poll-doorbell.test.ts` |
| `scripts/marjorie/lib/chat-delivery.mjs` | M5: the one marker-free "already answered?" check — `readDeliveryState` (settled / replied / notified / open; `ok:false` on any failed read, so callers send nothing), pure `classifyDelivery`, and `failureBody`/`postFailure` (the referenced bot-token `[chat failed]` notice); shared by `chat-post.mjs finish` and `chat-poll.mjs` reconcile; tests: `chat-delivery.test.ts` (Codex round-2 findings 1–4 replayed) |
| `scripts/marjorie/growth-data.mjs` | Bots v2 W5 CLI: `node scripts/marjorie/growth-data.mjs [--week-ending D] [--out f] [--no-gh]` — read-only JSON for the weekly review: follower deltas, posts published, engagement, merged content PRs, time-sensitive coverage, Tree asks, `traffic` from Vercel Web Analytics when `VERCEL_TOKEN` is set (else null + reason); GitHub sections fail soft into `warnings`; tests: `growth-data.test.ts` |
| `scripts/marjorie/lib/growth-data.mjs` | W5 pure half: `weekWindow`, `followerDeltas` (null never 0; `partial` for a young series), `postsSummary` (this vs previous week), `contentSummary`, `trafficSection`, `buildGrowthData` |
| `scripts/marjorie/lib/growth-coverage.mjs` | W5: `keywordsOf`/`textMatches`, `timeSensitiveCoverage` (intake issues vs site close + social post within 48h → covered / site-only / social-only / pending / late / missed; open events carry over a week), `treeAsksSummary`; site coverage = a merged PR referencing the intake issue (verified) or a bare close (`siteStateUnverified`) |
| `scripts/marjorie/lib/growth-traffic.mjs` | W5: `fetchTraffic` — Vercel Web Analytics REST (`/v1/query/web-analytics/visits/count` + `/aggregate`): visitors, pageviews, top paths/referrers for the week and the prior week; token from env only, never echoed; any failure → `traffic: null` + reason |
| `scripts/marjorie/prompt-bot1.mjs` | W5/C5 CLI: `send --file <prompt.md> [--source url] [--dry-run]` — the Marjorie→bot1 bridge; gated by `marjorie-config.json` `bot1Bridge.enabled` (ships `false`) AND secret `DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL`; refusals exit 0; tests: `prompt-bot1.test.ts` |
| `scripts/marjorie/lib/bot1-bridge.mjs` | W5/C5 logic: `loadConfig`, `validatePrompt` (≤1500 chars, no mentions/secrets), `decide` (≤3/UTC day counted from `bot1-prompt` marker comments on the `bot1-bridge` tracking issue, trusted authors only), `sendWebhook` (`flags: 4`, no mentions, never echoes the URL), `runSend` (log comment BEFORE post; dry-run is read-only) |
| `scripts/marjorie/marjorie-config.json` | W5/C5 committed switches: `bot1Bridge.enabled` (false), `maxPromptsPerDay` (3, hard-capped at 3 in code), optional `trackingIssue` |
| `scripts/marjorie/weekly-review.test.ts` | W5 invariants: the weekly-review workflow (Sunday before Tree's Monday plan, `claude-fable-5`, no Write/Edit/Task, no webhook in the agent job), the bridge workflow (`ops` env, `ref: main`), the prompt's required sections (six questions, `## Next up`, caps, trailer), the charter mission and decisions entry, the skill, the labels |
| `.github/workflows/routine-marjorie-weekly-review.yml` | W5: Sunday 20:13 UTC (plain `collect` job holds `VERCEL_TOKEN` and runs the collector; $12 default budget) Fable-model growth review → `weekly-plan` issue, deduped work issues (≤6), Tree asks (≤2, filed by the plain `file-tree-feedback` job via `loop-asks.mjs`), bot1 drafts (`bot1` job); prompt: `docs/agents/runner-prompts/marjorie-weekly-review.md` |
| `.github/workflows/marjorie-bot1-bridge.yml` | W5/C5: `workflow_call` (artifact of `bot1-prompt-*.md`) + `workflow_dispatch` (typed prompt, dry-run default); `environment: ops`, checkout `ref: main`; a green no-op until the bridge flag and secret both exist |
| `.claude/skills/prompting-bot1/SKILL.md` | W5/C5: when Marjorie prompts bot1 vs files a GitHub issue, how to word one (one outcome, links, acceptance criteria, Swift2 guards), what to expect, 3 examples; referenced from the weekly-review, triage and chat prompts |
| `.github/workflows/bot-chat-poll.yml` | M5: the one Discord poll job (`environment: social`, `actions: write`) — `chat-poll.mjs poll` — every 5 minutes (the old reply-poll relay was retired 2026-10-01; replies to the status ping are chat) (this public repo's Actions minutes are not billed — only private repos draw on the org's $10/month hard stop); `BOT_CHAT_ENABLED=false` kill switch, `dry_run` input; watched by `watchdog.yml` |
| `.github/workflows/routine-marjorie-chat.yml` | M5: dispatch-only, one run per founder message (`run-name: Marjorie chat · <message id>`, the poll's reconcile key; concurrency per message). Jobs `context` (`social`: context JSON, reply thread, `message_url` output, stops a duplicate ✅/❌ run) → `typing` (`social`, beside `run`, `continue-on-error`: Discord "typing…" until `post` starts) and `run` (template, Opus, 25 turns, no Write/Edit, PAT + `GH_DISPATCH_TOKEN`; first attempt only) → `post` (`ops`: a saved reply via Marjorie's webhook; first attempt only, never `[chat failed]`) → `finish` (`social`: `chat-delivery.mjs` read, then ✅, ❌, or one referenced bot-token `[chat failed]` notice then ❌; turn log; deletes the run's chat artifacts — public repo). Delivery ids come from `inputs` + `context` outputs, never the artifact, so a re-run can only settle; `force_fail` input skips the agent |
| `docs/agents/runner-prompts/marjorie-chat.md` | M5: Marjorie's chat prompt — read `.scratch/chat-context.json`, act first (close a named human action by PR via `ha-close.mjs`, close what invariant 3 allows, file `marjorie-filed` issues, dispatch routines), then save a ≤1800-char cited reply with `chat-post.mjs save`; spec Mechanics 4 authority list verbatim; explains the L1 issue loop with Tree |
| `scripts/marjorie/chat-typing.mjs` | Discord "typing…" for the chat routines: `start --channel-id <id> [--thread-id <id>] --stop-job <post|deliver>` POSTs `/channels/{thread or channel}/typing` every 8 s on the bot token (`social` `typing` job only), stops when the stop job starts / `run` fails (`gh run view --json jobs`) / 20 min / 5 failed calls; 401/403/404 → one log line, exit 0; 429 → `retry_after`; tests: `chat-typing.test.ts`, `chat-workflows.test.ts` |
| `scripts/marjorie/chat-post.mjs` | M5: `save` (agent writes `.scratch/out/chat-reply.md` + summary without a Write tool), `thread` (since #4320 creates no thread: empty `reply_thread_id` for a top-level message, the existing thread id otherwise; `skip=true` on a duplicate run), `post` (a saved reply only, via the bot's webhook, first attempt only; mentions neutralized and `ref:` lines defused before the 1800-char cap so it is always one message; no reply → sends nothing, `result=missing`), `finish` (`chat-delivery.mjs` read first — a failed read sends nothing; settled → nothing, replied → ✅, notified → ❌, else one referenced bot-token `[chat failed]` notice then ❌; metadata-only `💬 chat:` turn log with `<!-- chat-id -->`, written only by the run that reacted — public repo; M7: a reply also logs `replied in <n>s`, message to ✅); tests: `chat-post.test.ts` |
| `scripts/marjorie/ha-close.mjs` | M5: deterministic HUMAN-ACTIONS v2 close (`--list`; `<N> --note … --by chat [--skip]`) — removes the item block, prepends the `HUMAN-ACTIONS-DONE.md` ledger line, keeps CRLF; the chat routine's path for "the owner said so in chat"; tests: `ha-close.test.ts` |
| `scripts/marjorie/status-page.mjs`, `lib/status-{ha,shipped,sections,data,render,issue}.mjs` | Bots v2 W4: deterministic status page (no LLM) — `--dry-run` prints from live read-only gh data, `--apply` finds/creates/pins the one `status-page` issue and rewrites its body; Needs you (HUMAN-ACTIONS.md, `Decide:` step lines become options) · Shipped 7d (explicit `NOISE_RULES`) · Next up · Growth · Tree · Marjorie's note region; tests: `status-page.test.ts`, `lib/status-*.test.ts` |
| `scripts/marjorie/status-note.mjs` | Bots v2 W4: Marjorie's side of the page — `write` (the note region, dated), `extract`, `stamp-ping`, `url`, `today` (watchdog's "brief exists" check); verifies a write stuck |
| `scripts/marjorie/status-reply.mjs`, `lib/status-reply.mjs` | Bots v2 W4: owner-only `done|skip|close #N [why]` / `decide #N <anything>` (any item; a non-option answer is kept verbatim) → `ha-close.mjs`'s `closeHumanAction` → `lib/status-closes.mjs`: ONE rolling bot-owned branch/PR `status-page/ha-closes` rebuilt from main with every pending close (records in the PR body), so closes never conflict → ack; `status-heal.mjs` rebuilds it when main moves; never acts on non-owner or bot comments; tests: `status-reply.test.ts`, `status-closes.test.ts` (real git) |
| `.github/workflows/marjorie-status.yml` | Bots v2 W4: `render` (hourly, push touching HUMAN-ACTIONS.md/social/**, dispatch), `heal` (same triggers; rebuilds the rolling close PR from main) and `reply` (owner `issue_comment`, SOCIAL_POSTER_PAT for the closing PR); tests: `status-workflow.test.ts`; ops: `docs/ops/status-page.md` |
| `scripts/marjorie/lib/status-{view,fans,fans-data,plan,strategy,traffic,ping}.mjs`, `status-traffic.mjs` | Status page extras (owner, 2026-10-01): `view` = the one derived picture (waiting/closing/shipped/fans/snapshot) the page and the ping share; `fans` = "For fans" feeds + the `fan-recap` region (brief writes it via `status-note.mjs write-recap`); `plan` = `### To grow / To make content better / Other` under Next up; `strategy` = `## Summary` of `docs/strategy/growth-strategy.md`; `traffic` + `status-traffic.mjs` = daily Vercel site usage cached in the issue body (only code holding `VERCEL_TOKEN`); `ping` = hashed baseline + debounce for the one-line Discord change ping (`status-page.mjs --apply --notify`); tests: `lib/status-{ping,fans,plan,traffic}.test.ts`, `status-notify.test.ts` |
| `.github/workflows/routine-marjorie-status-reply.yml`, `scripts/marjorie/status-relay.mjs`, `docs/agents/runner-prompts/marjorie-status-reply.md` | Bots v2 W4: dispatch-only twin of the Discord chat routine for a free-text owner comment on the status page — `context` re-verifies the comment is the owner's, Opus answers with one issue comment; tests: `status-relay.test.ts`, `status-workflow.test.ts` |
| `scripts/marjorie/lib/status-held.mjs` | Bots v2 W4: "Held" page section + hidden `marjorie-held` markers (written by `status-note.mjs stamp-held`, read by `dispatch-chase-state.mjs` as `reportedHeld`); tests: `status-held.test.ts` |
| `scripts/marjorie/chat-workflows.test.ts` | M5: text assertions over every deployed chat routine — `run-name` matches `runTitle`, dispatch-only with a per-message group, no Discord secret in the agent job, secret-holding jobs are env-scoped and check out main, artifacts deleted, Tree's agent job holds no PAT/dispatch token/git; M7: `bot-chat-alarm.yml` is dispatch-only with no agent job, secrets only in `run:` steps of `social`/`ops` jobs on main, no expression inside a script, alert first-attempt only and never on `dry_run` |
| `.github/workflows/bot-chat-alarm.yml` | M7 no-reply alarm, dispatch-only (`run-name: Chat alarm · <stage> · <message id>`, one group per message): `check` (`social`: `chat-alarm.mjs check`) → `alert` (`ops`: `upsert-alert.sh open`, then `gh workflow run routine-marjorie-ops.yml`, plus `bot-chat-poll.yml` for a stuck message with no run). Started by the doorbell's 6-minute timer and by the poll's doorbell watch |
| `scripts/marjorie/chat-alarm.mjs` | M7: `check` for `bot-chat-alarm.yml` — `stuck` re-reads Discord (`readDeliveryState`) and the runs, and ends with no alert when a reply, ✅, ❌ or notice is there; titles `Chat reply stuck · <Bot> · <id>` or the standing `Doorbell is not answering` / `Doorbell dispatch is failing`; a body of ids, links, run state and age, never message text; tests: `chat-alarm.test.ts` |
| `.github/workflows/routine-tree-chat.yml` | M5: dispatch-only Tree chat (`run-name: Tree chat · <message id>`, concurrency per message). Jobs `context` (`social`) → `typing` (`social`, beside `run`: typing until `deliver` starts) and `run` (template, Opus, 25 turns, `Bash(gh:*),Bash(node:*),Read,Grep,Glob` — no git, PAT or dispatch token) → `deliver` (`social`: a saved reply via the repo-secret Tree webhook on the first attempt only, then the `chat-delivery.mjs` settle — ✅, ❌, or one referenced notice then ❌ — turn log, deletes the chat artifacts); `run` is first-attempt only; `force_fail` skips the agent |
| `docs/agents/runner-prompts/tree-chat.md` | M5: Tree's read-mostly chat prompt — cite calendar / strategy / `weekly-scorecard.mjs` / lessons; a plan change becomes a `**Proposal from chat**` comment on the latest `tree/plan/` PR (what Monday's step 0 reads); approval-thread messages are pointed back to the ✅/❌/✏️ reactions; explains the L1 issue loop with Marjorie |
| `scripts/doorbell/doorbell.mjs` | M7: Long Live Doorbell — a systemd service on the Hermes VM host, tokens only in `/etc/longlive-doorbell.env`. Gateway listener: a founder message in #longlive-marjorie / #longlive-tree or a thread under one gets 👀 and its chat routine dispatched; 6 min later with no bot ✅/❌ it adds ⚠️ and dispatches `bot-chat-alarm.yml`. Never posts. `--check` prints the config without connecting; tests: `doorbell.test.ts` (ring and stuck flows, the never-posts text test, the bare-clone import graph) |
| `scripts/doorbell/lib/doorbell-core.mjs` | M7 pure half: `parseConfig`, `createChannelMap` (channels by name, threads by parent), `ringDecision` (the poll's own `isFounderMessage`; skips bots, webhooks, thread roots, non-founders, stickers, repeats), `chatDispatch`/`stuckDispatch` bodies, `stuckDecision`, `STUCK_MS`; tests: `doorbell-core.test.ts` |
| `scripts/doorbell/lib/gateway.mjs` | M7: Discord gateway client — identify (GUILDS + GUILD_MESSAGES, no privileged intent), heartbeat, resume, backoff capped at 60 s, no reconnect on a bad token or intents; tests: `gateway.test.ts` |
| `scripts/doorbell/lib/github-rest.mjs` | M7: the doorbell's never-throwing GitHub REST call on its dispatch key |
| `scripts/marjorie/lib/dispatch-chase.mjs` | Pure M8 stale classification, bounded nudge/HA candidates and HA rendering; own comments do not reset silence, closed/SKIP actions stay held. |
| `scripts/marjorie/lib/dispatch-chase-ledger.mjs` | Pending-aware allocate/check CLI for the existing alert HA path, reading refreshed main even while on an HA branch. |
| `scripts/marjorie/lib/dispatch-chase-apply.mjs` | M8 execution boundary: refreshes after alerts, deduplicates pending HA PRs, allocates against open/done/pending ledgers, and applies bounded chase writes. |
| `scripts/marjorie/lib/dispatch-chase-state.mjs` | M8 complete read-only REST snapshot shared by ops and the brief: issue/linked-PR comments, timeline events, commits/reviews, both HA files, pending HA PR heads and delivered held notices; pagination failures refuse a chase. Ops prepares one plan artifact before the agent and serializes each sweep; tests: `dispatch-chase-state.test.ts`, `brief-chase.test.ts` |
| `scripts/doorbell/schedule.json`, `schedule.test.ts` | M7 v2: exactly poll every five minutes and brief at noon UTC; CI asserts workflow cron parity, empty inputs and full-cycle rate bounds |
| `scripts/doorbell/lib/clock-core.mjs`, `clock-core.test.ts` | M7 v2 pure cron parser, process-start slot gating, complete main-run coverage, rolling attempt limits and analytical full-cycle table validation |
| `scripts/doorbell/lib/clock.mjs`, `clock.test.ts`, `clock-timing.test.ts` | Pinned host clock; off-only main flag gate, bounded refresh and fail-closed staleness, serialized once-only dispatch, gap-boundary wakeups and metadata logs; offline next-fire listing |
| `scripts/doorbell/lib/github-rest.test.ts` | Non-204 body-read failures cannot authorize blind dispatch |
| `scripts/marjorie/lib/clock-watch.mjs`, `clock-watch.test.ts` | Shared slot-coverage verdict for poll and alarm checkClock; any main poll run serves one slot, two misses raise the standing clock-silent alert after grace |
| `scripts/marjorie/lib/clock-flags.mjs`, `clock-flags.test.ts` | CI validation for CLOCK_LIVE/CLOCK_LIVE_SINCE, including activation transition freshness against a PR base |
| `scripts/marjorie/lib/brief-guard.mjs`, `brief-guard.test.ts` | Read-only first-job decision for the brief: main-only, one ordinary run per UTC day, delivery markers in issue bodies/comments, explicit manual force; workflow concurrency encloses guard through delivery |
| `scripts/doorbell/longlive-doorbell.service` | M7: systemd unit — own user, `Restart=always`, `RestartSec=30`, `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp` |
| `docs/ops/doorbell.md` | M7: operating the doorbell on the Hermes VM host — files, the journal lines of a healthy start, stop/start, updating the pinned tag, `DOORBELL_LIVE`, keys (the GitHub key expires 2027-09-13, checkpoint MR3), troubleshooting |
| `.github/workflows/marjorie-discord-smoketest.yml` | C1: `workflow_dispatch`-only smoke test proving the `ops`-environment webhook delivers end-to-end, ahead of C2's `deliver` job existing; `mode` input (`post` default, `upsert-alert`) also exercises a synthetic `upsert-alert.sh` open+close (M1 audit, c3-email-retired.md criterion 6) |
| `docs/specs/marjorie-overhaul/c2-brief.md` | M0 design: the Founders' Brief rebuilt — six sections, 40-line cap, exact template with a filled example; Distance to done scores `docs/definition-of-done.md`'s eight items, not the 12 retired gates |
| `scripts/marjorie/lib/tree-line.mjs` | C2: the brief's **Tree** section — one line from `social/lessons.md` (`lessons.mjs`'s `parseLessons`), one from Tree's `weekly-scorecard.mjs` scorecard; read-only, no scorecard math reimplemented |
| `scripts/marjorie/lib/submissions.mjs` | C2: 24h issue counts by label (`user-feedback`, `feedback`, `intake`, `link-submission`) for the brief's **Since yesterday** section — client-side date filtering, never `gh issue list --search` (forbidden for repo-scoped cloud sessions, `scripts/lib/gh.mjs`); M3 extension: `sourceOf`/`selectUntriagedSubmissions` (title-prefix selector, pure, `startsWith` not search/label), `renderFounderMarker`/`pendingFounderIssues` (the needs-founder Discord-handoff marker pair, mirrors `alert-router.mjs`'s marker pattern), CLI wrapper (`select`/`marker`/`pending-founder`) for `routine-marjorie-triage.yml`'s Bash-only tool set; tests: `submissions.test.ts` |
| `scripts/marjorie/lib/brief-sections.mjs` | M1 audit: split out of `assemble-brief.mjs` (was 449 lines) — every pure per-section renderer/builder plus `SECTION_BUDGETS`, `capSection`, `extractOptions`/`extractField`, `shortTitle`, `todayLA`, `findLatestTreePR`; re-exported unchanged from `assemble-brief.mjs` |
| `scripts/marjorie/lib/brief-state.mjs` | M1 audit: split out of `assemble-brief.mjs` — the `gh`/`ghWithCompleteness`/`ghCriticalList` fetch helpers and `fetchState`, the only network-touching code in the brief pipeline; re-exported unchanged from `assemble-brief.mjs` |
| `docs/specs/marjorie-overhaul/c3-email-retired.md` | M0 design: every `send-mail.py` call site and what it becomes; the `ALERT_ALSO_MAIL` opt-in that keeps the backup receipt on email; why the Gmail secrets must NOT be deleted |
| `docs/specs/marjorie-overhaul/w1-watchdog-handling.md` | M0 design: `routine-marjorie-ops.yml`, a handler row for all 14 watchdog alerts, the re-run budget, and the Facebook-export human action's final text |
| `.github/workflows/routine-marjorie-ops.yml` | M2/W1: hourly watchdog-alert handling sweep, gated by a zero-cost `gate` job (`needs`/`if` on `work == 'yes'`) so the Sonnet `run` job only fires when a `watchdog-alert` issue is open; no `Write`/`Edit`/`Task` in `allowed_tools`; `checkout_token_secret: SOCIAL_POSTER_PAT` for filing PRs against branch-protected main |
| `docs/agents/runner-prompts/marjorie-ops.md` | M2/W1: the handler table for all 14 `ALERT_TITLE` conditions (incl. the two dynamic ones) as instructions for `routine-marjorie-ops.yml`; the ledger-comment marker contract and the FB-export human-action-by-PR steps |
| `scripts/marjorie/lib/alert-router.mjs` | M2/W1: pure, tested — alert title → handler key (14 rows, 2 dynamic patterns), ledger-comment handled-state (`unhandled`/`handled-awaiting-watchdog`/`escalated`) from a `<!-- marjorie-ops-handled ... -->` marker, and the FB-export HUMAN-ACTIONS.md renderer (regenerates the group list from `fb-groups-checklist.mjs` at filing time); CLI wrapper for `routine-marjorie-ops.yml`'s Bash-only tool set; tests: `alert-router.test.ts` |
| `docs/specs/marjorie-overhaul/s1-triage.md` | M0 design: `routine-marjorie-triage.yml`; submissions selected by title prefix (the `intake` label has three producers); five classes; spam is the only autonomous close |
| `.github/workflows/routine-marjorie-triage.yml` | M3/S1: daily submission-triage sweep; no `gate` job (low-volume daily batch, unlike the hourly ops sweep); two-job shape — the Sonnet `run` job (no `Write`/`Edit`) classifies and leaves a `pending` founder-marker comment, a separate plain `deliver` job (`environment: ops`, `ref: main` checkout) is the only place `DISCORD_MARJORIE_WEBHOOK_URL` is visible, posts it, and writes back the `posted` marker |
| `docs/agents/runner-prompts/marjorie-triage.md` | M3/S1: the five-class table, the build-desk/content-correction/request issue templates (verbatim-quoted reporter text, defanging rule), the needs-founder two-comment handoff, the accountability/reconciliation pass, and the overrule vocabulary (full coverage: `spam`/`reopen`; documented gap: `bug`/`content`/`request`/`founder`/`close` reversal on a dispatched issue) |
| `scripts/marjorie/lib/submissions.test.ts` | M3/S1: boundary cases for `sourceOf`/`selectUntriagedSubmissions` (bracket-prefix required, `marjorie-triaged` exclusion) and `renderFounderMarker`/`pendingFounderIssues` (pending-with-no-posted vs. pending-then-posted) |
| `.github/workflows/routine-marjorie-ask-response.yml`, `routine-tree-ask-response.yml`, `loop-file-asks.yml`, `docs/agents/runner-prompts/{marjorie,tree}-ask-response.md` | Bots v2 W7: the live Tree↔Marjorie loop — dispatch-only response routines (Opus, $4/$5 caps) started the moment the other bot files an ask; each answers with one `Disposition:` comment + `loop:*` label (Marjorie: ACCEPT-NOW/SCHEDULE/DECLINE/REROUTE; Tree: DOING IT/CAN'T/NEEDS HELP, DOING IT opens a `tree/ask/` PR); `loop-file-asks.yml` is the plain reusable filer for saved help asks; tests: `loop-live-workflows.test.ts` |
| `scripts/marjorie/lib/loop-dispatch.mjs`, `lib/loop-queue.mjs`, `loop-live.mjs` | Bots v2 W7: dispatch guards (creation only, `loop-dispatched` marker once per issue, 6/day per direction from the workflow run list, depth cap 2), the pending-ask queue + `Disposition:` parser + loop labels + daily help-ask budget, and the CLI `file-help`/`pending`/`save-help`/`guard-dispositions` (the post-run guard job: `lib/loop-fallback.mjs` posts a fallback NEEDS HELP + `loop:needs-help` on any queued ask left without a Disposition); tests: `lib/loop-fallback.test.ts`, `lib/loop-dispatch.test.ts`, `lib/loop-queue.test.ts`, `loop-live.test.ts` |
| `scripts/marjorie/lib/status-sweep.mjs`, `lib/decision-propagate.mjs` | Bots v2 W7: the status reply job answers EVERY unacknowledged owner comment (`status-ack` marker, no lost comment under the one-pending concurrency rule) and a recorded `decide` is commented onto each ticket the item names (`decision-propagated` marker); tests: `lib/status-sweep.test.ts`, `lib/decision-propagate.test.ts`, `status-burst.test.ts` |
| `docs/specs/marjorie-overhaul/l1-loop.md` | M4/L1 spec: Tree's "Needs from Marjorie" + Marjorie's "For Tree" asks become `tree-filed`/`marjorie-filed` issues via a `run:` step, author-login trust (not `viewerDidAuthor`), contradiction = one ⚠️ line |
| `docs/specs/marjorie-overhaul/m5-chat.md` | M5 spec: a 5-min Discord poll claims founder messages with a 👀 reaction, dispatches a per-message Opus chat routine (Marjorie acts then answers, Tree read-mostly), a `run:` step posts the reply in the source place and reacts ✅/❌; bot token never in the agent env |
| `docs/specs/marjorie-overhaul/m6-live-asks.md` | M6 spec (build after the 2026-09-14 L1 cycle): an L1 ask filed by one bot dispatches one bounded `routine-loop-answer.yml` run of the other within minutes — an explicit `gh workflow run` from the filing step, since `GITHUB_TOKEN` events start no workflow; answer runs never file; Marjorie's chat-originated asks are filed by a trusted `run:` step with a `thread=` marker and echoed into the founder's thread; Tree answers now, acts Monday |
| `docs/specs/marjorie-overhaul/m7-doorbell.md` | M7 spec (not gated on L1): "Long Live Doorbell", a dependency-free Node gateway client on the Hermes VM host (systemd, outside Hermes' containers, tokens only in `/etc/longlive-doorbell.env`) reacts 👀 to a founder message in #longlive-marjorie / #longlive-tree in ~1 s and dispatches the chat routine; it never posts or reacts ✅/❌; `context` claims with the poll's 👀; the 5-min poll stays as fallback and alarms when the doorbell misses or fails to dispatch; a 6-min stuck reply adds ⚠️ and opens a watchdog alert via `bot-chat-alarm.yml` |
| `docs/specs/marjorie-overhaul/m8-drive-to-done.md` | M8 spec (after M6): Marjorie's build-desk issues are ready-shaped (`build-ticket.mjs check` refuses a body without Expected/Where/Size/Acceptance criteria), a founder ✅ or chat yes becomes a `Plan approved` comment Kevin's triage greenlights, and the ops sweep chases every `marjorie-filed` item: 48 h silent → one nudge + the brief's `stalled 2d+:` line, 96 h → one `[DECIDE]` human action (assign/defer/close), `SKIP` final; Austin's fence unchanged; Kevin accepts only the verified approval relay |
| `docs/plans/marjorie-overhaul/waves/m8-drive-to-done.md` | M8 Codex prompt; run after M6, never alongside another wave |
| `scripts/marjorie/lib/loop-asks.mjs` | M4/L1: pure ask parsers (`needsFromMarjorie` JSON, `- For Tree:` line scoped to the **Tree** section only), `loop-ask` marker + key (comment-opener neutralized in rendered content, last-match parsed), `findFiled` trust by `github-actions` login, `fileAsk`/`fetchAsksFor` (both `filedLabel`+`deskLabel`, 200-issue window, `withTimeout`-bounded), incoming-ask selection, both brief renderers; tests: `lib/loop-asks.test.ts` |
| `scripts/marjorie/lib/issues-rest.mjs` | M4/L1 fix: issues by label from the REST issues list (primary store), mapped to `gh --json` shape — `gh issue list --label` reads the search index, which missed a 1 s-old filing live (#4253); tests: `issues-rest.test.ts` |
| `scripts/marjorie/loop-asks.mjs` | M4/L1: CLI `file-tree` (`routine-tree-weekly-plan.yml` send-brief → `--loop` block) and `file-marjorie` (`routine-marjorie-brief.yml` deliver → number written into the brief); soft-fail, exit 0 on GitHub errors; tests: `loop-asks.test.ts` (split out of `lib/loop-asks.test.ts` to stay under the 300-line cap) |
| `docs/specs/tree-overhaul/s3-reason-protocol.md` | Wave 1 design: ✏️/❌ require a written reason; `social/feedback/*.jsonl` ledger on `social-ledger`; the generic reaction→action scope table S6/T4 reuse |
| `docs/specs/tree-overhaul/t1-one-charter.md` | Wave 1 design: Growth folds into Tree; `sourceRoutine` → `lane`; what "from Tree" means on every surface |
| `docs/specs/tree-overhaul/t2-self-critique.md` | Wave 1 design: the 5-dimension draft rubric, the queue threshold, the brief's pitch line; why `critique` is NOT in the content hash |
| `docs/specs/tree-overhaul/t4-weekly-brief.md` | Wave 1 design: the Monday brief in Discord, proposals as reaction targets, the Wednesday re-plan cut-off |
| `docs/specs/tree-overhaul/t5-lessons-ledger.md` | Wave 1 design: `social/lessons.md` schema, Monday distillation, codify-at-3-firings, propose-never-merge for strategy changes |
| `docs/specs/tree-overhaul/t6-side-doors.md` | Wave 1 design: merch/appearance write `social/inbox/` intents, never captions; the fast lane and its `timely` gate |
| `docs/specs/tree-overhaul/t7-autonomy-ladder.md` | Wave 1 design: per-campaign-type post-and-notify, signed grants, approval schema `v: 3`. **2026-09-11: founder overruled the "don't build" recommendation** (Instagram still can't delete via any API, but a human can in-app) — split Wave 4 (read-only: `eligibility()`, ladder standing) / Wave 5 (acting: signed grants, `v: 3`, gated on R4 + a founder re-confirmation) |
| `docs/agents/runner-prompts/plan-recheck.md` | Prompt for the plan-recheck routine (Opus, read-only, reports to #4117) |
| `.github/workflows/plan-recheck.yml` | Daily gate job + routine-template call; no-op when nothing is due |
| `docs/social/RULINGS-SOCIAL.md` | Architect (Fable) rulings A1–A6 on the social approval gate, reconstructed 2026-09-11 (Wave 2 S4) from PR #4098's body + `docs/decisions.md` — canonical citation target for `RULINGS-SOCIAL.md` references repo-wide |
| `docs/social/RULINGS-SOCIAL-2.md` | Architect (Fable) rulings B1–B5, superseding A2/A5, reconstructed 2026-09-11 from PR #4104's body + `docs/decisions.md` — canonical citation target for `RULINGS-SOCIAL-2.md` references repo-wide |
| `scripts/community/reply-opportunity.mjs` (+ test) | Bots v2 W3: builds one ≤2000-char Discord message per community reply opportunity (reply in a code block, ref-line last), the batch header, and the metadata-only webhook probe (channel_id + name only) that `mailer.mjs` logs. `discord-delivery.mjs` posts with `flags: 4` (no link previews) under the display name "Tree · Reply opportunities"; leads with no draft text are not sent |
| `scripts/community/reddit-account.mjs` (+ `reddit-account.json`, tests in `reply-opportunity.test.ts`) | `withReplyAccount(url)` appends the committed `redditLinkParams` (incl. `target_user` brand account) to Reddit thread links in every Discord reply/awareness message; `replyAsLine()` is the `↪️ Reply as u/…` line (`docs/community/README.md` § Replying as the brand account) |
| `scripts/community/awareness-*.mjs` (+ tests), `scripts/community/awareness-subs.json` | Awareness image-reply lane (owner direction 2026-10-01; `docs/community/README.md` § Awareness replies, strategy bet 2): `awareness-scan.mjs` finds threads (hot+new RSS per sub in `awareness-subs.json`; `awareness-filters.mjs` = age ≤48h, megathread/crafts/redline/personal-life skips, thread-type fit, per-sub caps; `awareness-eligibility.mjs` = `about.json` `comment_contribution_settings.allowed_media_types`, unverified live) → `engagement_lead(kind='awareness_reply')`; `awareness-image.mjs` validates/picks `moment:<id>`/`era:<id>` share cards against the real catalogue; `awareness-draft.mjs` is the answerer routine's count/export/apply CLI (the Claude job has no shell and no DB secret; apply validates the drafts file and lints each reply: no link, no site name); `awareness-deliver.mjs` + `awareness-message.mjs` post one Discord message per lead with the card PNG attached (multipart), batch header "🎯 Awareness replies — N today", caps ≤5/batch, ≤3/sub/day (4 for r/TaylorSwift and r/swifties), ≤15/day. Run with `npx tsx` (they import `@swift2/shared/redline`). `mailer.mjs` excludes this kind; `community-ack.ts` skips the non-promo counter for it |
| `.github/workflows/community-awareness-scan.yml` · `routine-awareness-answerer.yml` · `community-awareness-deliver.yml` · `docs/agents/runner-prompts/awareness-answerer.md` | The lane's three steps (scan every ~20 min, jittered → answerer every 3 h, skipped by a gate when nothing is waiting → deliver on its success); anonymous Reddit only, **never a Reddit API key** (owner decision 2026-10-01, `docs/decisions.md`). `awareness-fetch.mjs`/`awareness-sources.mjs`/`awareness-rotation.mjs` = 2-request budget per run, skip-on-429, optional relay, least-recently-fetched feed rotation (every sub hot+new + Reddit-wide search RSS), per-feed and whole-lane cooldowns persisted in `awareness_source_state` (migration `20261001010000_awareness_source_state.sql`). Kill switch: repo variable `AWARENESS_LANE_ENABLED=false`. Migration `20261001000000_awareness_lane.sql` adds the kind + `image_ref`, `image_comments`, `why`, `thread_type`. Marjorie's collector reports `awareness: {delivered, posted, skipped, open}` (`scripts/marjorie/lib/growth-awareness.mjs`) |
| `apps/web/public/social/tree-avatar.png` | Wave 2 S5: Discord webhook avatar for "Tree" identity (approval-prompt.mjs, community/discord-delivery.mjs). Placeholder (377 bytes, generated solid-circle+glyph PNG) — meant to be replaced with real brand art later |
| `scripts/social/approval-prompt.mjs` | Bots v2 W2: builds + sends the Discord approval prompt — ONE message per post (IG+X pair or lone item), ≤ `DISCORD_MESSAGE_HARD_CAP` (2,000), never chunked; one image embed, `flags: 4` when none |
| `scripts/social/lib/approval-post.mjs` | Bots v2 W2: `groupPosts` (campaign → post) + `buildPostMessage` (label, schedule, X in full, IG trimmed + link, why, ref LAST; truncate-to-fit, X cut last). Replaced `ref-line-chunk.mjs` (deleted — nothing chunks any more) |
| `scripts/social/lib/approval-text.mjs` | Bots v2 W2: the ref-line-injection-hardened text helpers (`sanitizeInlineField`, `neutralizeRefLikeLines`, …) moved verbatim out of approval-prompt.mjs, plus `clip`/`angleUrl` and the 2,000-char constant |
| `scripts/social/lib/reject-confirm.mjs` | Bots v2 W2: after a reply-rejection the poll adds ❌ to the post via the bot token; on 403 falls back to one short webhook message (`rejected: <id>` trailer) and warns that "Add Reactions" is needed |
| `docs/social/pipeline.md` | Wave 3 T1: posting-pipeline mechanics + incident history moved verbatim out of `docs/agents/growth.md` so the merged Tree charter stays readable; linked once from `docs/agents/tree.md` |
| `social/inbox/`, `social/inbox/closed/` | Wave 3 T1 (T6 slice pulled forward): fact-sheet intents from the merch/appearance side doors — no caption, no queue write; `closed/` holds declined/expired intents |
| `scripts/social/lib/inbox.mjs` | Wave 3 T1: `v:1` intent schema (`validateIntent`) + `readIntents(dir)`. Wave 4 T6 added `isExpired`/`selectFastLane`/`closeIntent` — selection/expiry are here now; the six-dimension rubric is `queue-schema.mjs`, displacement is `check-drafts.mjs` |
| `scripts/social/lib/feedback.mjs` | Wave 3 S3: `classifyReaction` (the generic reaction→action table: draft / reddit / plan-brief columns), approver gating against `SOCIAL_APPROVERS`, `pillarOf`, ledger row builders + `appendRows` dedupe on `(pr, file, messageId, action)` |
| `scripts/social/lib/stamp-health.mjs` | Wave 3 S3: v3 SHA-signed stamp predicates (`cleanSince`/`selfClean`/`mintable`) — the safety axis from the architect ruling that closed #4127; the poll may merge an honoured stale stamp but never mints one |
| `social/feedback/<ISO-week>.jsonl` | Wave 3 S3: the founder-feedback ledger, authoritative on the `social-ledger` branch, folded back to `main` by `social-approval-poll.yml` for visibility only (`social/README.md` → Feedback ledger) |
| `scripts/social/weekly-brief.mjs` | Wave 3 T4: `buildWeeklyBrief` — the Monday `#longlive-tree` post (5-line scorecard, what changed, 14-day calendar, ≤3 numbered proposals, ≤2 questions); tests in `weekly-brief-workflows.test.ts`, thread ingestion in `social-approval-poll-plan-brief.test.ts` |
| `social/lessons.md` | Wave 3 T5: the founder-feedback ledger, created empty with its format documented in a leading comment — distilled every Monday by Tree, read every morning by the daily drafter |
| `scripts/social/lib/lessons.mjs` | Wave 3 T5: `parseLessons`/`renderLessons`/`nextId` — pure round-trip parser/renderer for `social/lessons.md`; `validate-queue.mjs` and `check-drafts.mjs` (`checkCritique`) both read the file from disk and thread `activeLessonIds` into `queue-schema.mjs`'s `validateQueueItem`; `social-approval-poll.mjs`'s ✏️ re-check does not yet (issue #4150) |
| `scripts/social/prepare-draft-inputs.mjs` + `lib/draft-inputs.mjs`, `lib/photo-ledger.mjs`, `lib/photo-dimensions.mjs`, `lib/draft-prs.mjs`, `lib/social-fs.mjs` | Bots v2 W8: Tree's deterministic pre-compute — run by `routine-tree-daily-draft.yml`'s `prepare` job (and the event routine's) into `.scratch/tree-inputs.json` before the model starts: today's calendar slots, what is drafted on main AND in open PRs, one never-used **Instagram-sized** photo per beat (34 of 54 library photos are outside IG's 0.8–1.91 aspect window), era availability, active rules, `reject:` reasons, uncovered intake events. Tests: `draft-inputs.test.ts`, `draft-happy-path.test.ts` (the documented happy path passes `check-drafts`) |
| `scripts/social/make-ig-variants.mjs` + `lib/photo-variants.mjs` | Bots v2 W10: writes an Instagram-ready padded variant (`<id>-ig45` 1080x1350 / `<id>-ig191` 1080x566, original centred uncropped over its blurred darkened self, JPEG <=1 MB) beside every library photo outside IG's 0.8-1.91 window and adds a `variantOf` library entry (dry run default, `--write`, idempotent). `canonicalPhotoId` (`lib/photo-library.mjs`) makes original+variant ONE photo in `photoIdOf`/ledger/`selectSocialPhoto` (L001). Never touches posting-path files. Tests: `lib/photo-variants.test.ts`, `make-ig-variants.test.ts`, `draft-happy-path.test.ts`. |
| `scripts/social/lib/photo-reuse.mjs` | Bots v2 W8: lesson L001 codified (#4601) — `check-drafts` hard-fails a photo already shipped/queued under a DIFFERENT campaign; the IG and X halves of one campaign share a photo by design |
| `social/strategy-params.json`, `scripts/social/lib/strategy-params.mjs`, `scripts/social/lib/draft-taste.mjs`, `scripts/social/fetch-share-card.mjs`, `docs/social/guardrails.md` | S2 (2026-10-01, `docs/decisions.md`): Tree/Marjorie own social strategy and taste. `strategy-params.json` holds the taste thresholds `check-drafts.mjs`/`photo-reuse.mjs` read (loader with safe defaults, `why` per section); `draft-taste.mjs` = `mediaKind: "card"`, `experiment`, photo-mix checks; `fetch-share-card.mjs` saves a `/api/share-card` PNG into `public/social/library/cards/`; `guardrails.md` is the founder-owned list (in `NEVER_ALLOWLIST`). Tests: `scripts/social/strategy-params.test.ts` |
| `.github/workflows/routine-fable-taste-ruling.yml`, `taste-ruling-file.yml`, `scripts/marjorie/taste-ruling.mjs` + `lib/taste-ruling.mjs`, `docs/agents/runner-prompts/fable-taste-ruling.md` | S2: Fable rules on Tree/Marjorie taste disputes — a `taste-ruling` issue filed by the workflow identity, a dispatch-only Fable routine (≤2 a UTC day, no shell) writes `Ruling:`, a plain job posts and closes; the six Tree/Marjorie routines call `taste-ruling-file.yml`; tests: `scripts/marjorie/taste-ruling.test.ts` |
| `docs/strategy/growth-strategy.md` | The living growth strategy the owner reads and steers (Summary ≤6 bullets · Audience · ranked bets with proves/kills metrics · Content strategy · What we stopped · **Owner direction (standing)**, his verbatim dated steers, outranks all but `docs/social/guardrails.md` · Changelog). Owned by Marjorie's weekly Fable review; on `.github/content-automerge-allowlist.txt`; Owner-direction/Changelog lines are append-only (validator-enforced). Charter: `docs/agents/marjorie.md` "visible strategy and owner steering" |
| `scripts/marjorie/strategy-doc.mjs` + `lib/strategy-doc.mjs` (+ `strategy-doc.test.ts`, `strategy-workflows.test.ts`) | CLI/pure half for the strategy file: `check` (shape + append-only vs a previous version), `add-direction --from-context` (chat: one dated verbatim steer + changelog line), `save-update --pr N` / `dispatch` (chat → Fable same-day rewrite, ≤4/UTC day), `wait-merged` (update routine waits for the direction PR), `open-pr --kind weekly` or `update` (re-apply main's Owner direction, validate, then PR + auto-merge). `add-direction` takes only `--from-context` and refuses unless the chat context job set `owner.verified` (`ownerId` in `lib/chat-inbox.mjs`: Joey's id, `OWNER_DISCORD_ID` override). Chat-poll concurrency/stuck-run notes: `docs/ops/chat-poll.md` |
| `.github/workflows/strategy-pr.yml` | Reusable plain job: downloads the agent's `.scratch/out/growth-strategy.md`, validates it as data on `main`, opens the PR on `SOCIAL_POSTER_PAT` with auto-merge. Called by the weekly review (`strategy` job) and `routine-fable-strategy-update.yml` |
| `.github/workflows/routine-fable-strategy-update.yml`, `docs/agents/runner-prompts/fable-strategy-update.md` | Dispatch-only: after Marjorie's chat records an owner steer, waits for that PR to merge, Fable rewrites the affected sections (no write token), `strategy-pr.yml` opens the PR. $6 / 40 turns |
| `scripts/social/retire-stale-drafts.mjs` | Bots v2 W8: closes `social-draft` PRs open >48h that are empty, never approved, or approved-but-stranded, with a `retired:` comment (not `reject:`); dry-run by default, `--apply` only from the daily-draft `prepare` job. Nothing else closes an unmerged draft (the poster's 48h rule only reaches items on main) |
| `scripts/social/dispatch-event-drafts.mjs` + `lib/event-dispatch.mjs`, `.github/workflows/social-event-dispatch.yml`, `routine-tree-event-draft.yml`, `docs/agents/runner-prompts/tree-event-draft.md` | Bots v2 W8: same-day drafts for time-sensitive `intake:` issues no post covers — scan every 2h and after `routine-news-triage`, ≤2/day, deduped by the `tree-event-dispatched` label; the event run is a 30-turn one-pair job that opens an ordinary draft PR awaiting the owner's ✅ |
| `scripts/social/draft-receipt.mjs` | Bots v2 W8: the failure receipt for the daily/event draft runs — run summary + one deduped `desk:tree` issue per day naming why it stopped (e.g. the turn cap) and what the pre-compute had decided |
| `scripts/routine-quality-sample.mjs` | Wave 4 A4: `output-sampling.yml`'s second job — picks ≤2 merged PRs/routine (≤30/week) from `routine-output-sample.mjs`'s own discovery/attribution-matching, scores each 1-3 via one Sonnet call against its routine's charter `## Sampling rubric` heading (skipped, logged by name, never guessed, when no rubric is available), appends a "## Quality sampling" section to the same weekly report file; tests in `routine-quality-sample.test.ts` |
| `scripts/routine-usage-report.mjs` | Routine telemetry: turns/duration/cost plus error-only redacted diagnostics; assistant errors and result subtypes are fixed allowlists with unknown fallback. Spec: `docs/specs/2026-09-15-routine-error-metadata.md`; tests in `routine-usage-report.test.ts` |
| `scripts/news/check-triage-receipt.mjs` | News Triage completion gate: reads the current run attempt and its trusted-bot receipt on #502; missing, blocked and stale receipts fail. Tests: `check-triage-receipt.test.ts`; recovery spec: `docs/specs/2026-09-15-news-triage-recovery.md` |
| `scripts/social/lib/autonomy.mjs` | Wave 4 T7 (read-only half only): `eligibility(ledgerRows, type, now)` — the 28-day/8-brief/95%/0-reject gate over `social/feedback/*.jsonl` draft rows; `readGrants`/`activeGrantFor` are the grant READ path only (`social/autonomy.json` has no writer until Wave 5 — its absence is the normal day-0 state) |
| `scripts/social/lib/ladder-standing.mjs` | Wave 4 T7: `discoverTypes`/`buildLadderStanding`/`renderLadderStanding` — one `eligibility()` call per campaign type actually seen in the ledger, falling back to a bare-prefix placeholder for any of the five families with no history yet, so all five always render; wired into `weekly-scorecard.mjs`'s `buildScorecard`/`renderScorecard` as line 9 |
| `scripts/lib/moment-media-gate.mjs` | Blocking publication-media predicate used by `validate-content.mjs` and the top-of-feed checker; accepts authored photo/thumbnail, YouTube video, or Instagram embed, rejects fallback/placeholder shapes, and pins each of the 48 historical gaps by exact content hash so editing one requires adding media. Focused tests: `moment-media-gate.test.ts` |
| `social/metrics/posts/<YYYY-MM>/<postId>.json` | Wave 4 T3: per-post Instagram engagement (`like_count`/`comments_count` off the IG media node, `postId` = `platformPostId` from `social/posted/`), written/refreshed daily by `growth-snapshot.mjs` for every Instagram post still inside its 30-day window. IG-only v1 — no `impressions`/`reach`/`saved`/`shares`, no X per-post reads (`HUMAN-ACTIONS.md` #63/#64) |
| `scripts/social/lib/scorecard-report.mjs` | S3 (#4297): pure per-format/per-campaign report behind `node scripts/social/weekly-scorecard.mjs [--week YYYY-Www] [--json]` — posts, reach/saves/shares, likes/comments, founder approval rate, rejection reasons; `social.byCampaign` in Marjorie's `growth-data.mjs` reuses `familyOf`; tests in `scorecard-report.test.ts` |
| `scripts/social/lib/post-metrics.mjs` | Wave 4 T3: `selectInstagramPostsForMetrics`/`buildPostMetricRecord` (the write side growth-snapshot.mjs calls) + `fetchMediaInsights`/`parseInsights` (S3: IG `/insights` reach/saved/shares/total_interactions/views, `null` per unavailable metric) + `aggregateEngagement`/`renderEngagement` (campaign- and pillar-via-`pillarOf`-grouped engagement, wired into `weekly-scorecard.mjs`'s scorecard); tests in `post-metrics.test.ts` |
| `docs/specs/marjorie-overhaul/m7-chat-direct-replies.md` | M7 chat reply behavior: concise ordinary answers, channel-level delivery for top-level messages, existing-thread delivery when the founder chose a thread, and no thread deletion |

## Mobile settings entry + legal links (2026-09-25, App Store 5.1.1/5.1.2)

OS-039 removed the only entry to Settings (the site's in-page bell). JS-only fix, no fingerprint change.

| Path | What |
|---|---|
| `apps/mobile/components/HomeTopBar.tsx` | Persistent top bar above the five tabs; its Settings button runs the onboarding-then-settings gate |
| `apps/mobile/components/SettingsAboutSection.tsx` | Settings → About: Privacy Policy / Terms of Use / Support rows + UNOFFICIAL line |
| `apps/mobile/components/LegalPageScreen.tsx` | Legal WebView wrapped with a Done button + Android back, so a legal page is never a dead end |
| `apps/mobile/lib/legal-links.ts` (+ test) | `LEGAL_PAGES`, `legalPageUrl`, `isLegalPageUrl` (moved from App.tsx), `CLOWNBOT_AI_DISCLOSURE` |
| `apps/mobile/lib/settings-entry.ts` (+ test) | `openSettingsEntry`: onboarding first time, settings after (shared by HomeTopBar and the web bridge) |
| `apps/mobile/lib/visible-screen.ts` (+ test) | Which overlay App.tsx renders; inbox sits above settings so Settings → Inbox works |
| `docs/mobile-parity.md` | Web↔native parity inventory: every `apps/web` page route, `?mode=`/`?item=`/etc. query surface and `ShellDestination` kind with its native status (`native screen` / `web-only` / `N/A`) |
| `scripts/mobile/parity-inventory.test.ts` | Fails when a web page route or `ShellDestination` kind has no row in `docs/mobile-parity.md`, or a row's status is invalid |

## Mobile OTA rollback (2026-10-01)

| File | What it is |
|---|---|
| `.github/workflows/mobile-rollback.yml` | `workflow_dispatch` one-click OTA rollback (`mode=list` / `republish` per-platform groups); shares the `mobile-release` concurrency group |
| `scripts/mobile/rollback-workflow.test.ts` | YAML invariants for it: dispatch-only, pinned eas-cli, no `inputs.` interpolation in `run:`, serialised with the train |

## Social reply notifier (2026-10-01)

| File | What it is |
|---|---|
| `scripts/social/reply-notifier.mjs` | CLI: polls IG comments/replies, IG mentions, IG DMs and FB Page comments, dedupes against the ledger, posts one Discord message per new item (batch cap 15 + "+N more"). Read-only toward platforms; never on the posting path. `DRY_RUN=1` prints only |
| `scripts/social/lib/reply-sources.mjs` | Read-only Graph collectors + `makeGraph` (pagination via `paging.next`, token-scrubbed errors, `isPermissionError`) |
| `scripts/social/lib/reply-dms.mjs` | IG DM collector (`instagram_manage_messages`; page-token then user-token attempts) and `SourceDisabledError` for a missing scope |
| `scripts/social/lib/reply-notify.mjs` | Ledger (`seeded`/`seen`/`disabledLogged`), `planNotifications` (first-run 24h rule, 7-day stale rule), `sanitizeUserText`/`formatItem`, `postDiscord` ("Tree · Replies") |
| `scripts/social/reply-ledger.sh` | `fetch`/`push` of `reply-ledger.json` on the dedicated `social-reply-ledger` branch (plumbing only; creates the branch before anything is sent) |
| `.github/workflows/social-reply-notifier.yml` | Every 30 min (`:13/:43`), <= 30 Graph calls per run, `environment: social`, `contents: write` only; kill switch `REPLY_NOTIFIER_ENABLED=false`. See `docs/social/pipeline.md` › Reply notifier |
| `scripts/social/reply-notifier.test.ts`, `reply-dms.test.ts`, `social-reply-notifier-workflow.test.ts` | Mocked-Graph tests (pagination, dedupe, first-run seeding, injection, per-source failure, DM scope) + workflow invariants |

## Content loader forward compatibility (2026-10-01)

| File | What it is |
|---|---|
| `packages/content/src/forward-compat.ts` (+ test) | `pruneUnknownEnumValues`: drops unknown enum/literal values (array element, nearest enclosing array element, or whole file) for `loadBundle({ unknownEnumPolicy: 'drop' })`; any other zod issue stays a failure. Policy: `docs/decisions.md` 2026-10-01 |
| `config/mobile/app-config.json` | Remote kill switch source: `routeFlags` (one boolean per native screen). Published by `scripts/publish-content-bundle.mjs` to `<outRoot>/app-config.json` (sibling of `current.json`, never a manifest entry; not mirrored to Storage). Runbook: `docs/mobile-release.md` |
| `packages/content/src/app-config.ts` (+ test) | `appConfigSchema` (unknown keys stripped), `ROUTE_FLAG_KEYS` (the one list of flag names; mobile test asserts it matches `DEFAULT_ROUTE_FLAGS`) |
| `packages/ui/src/bridge/` (`envelope`, `messages`, `validate`, `version`, `README.md`, test) | WP2.3-A bridge types + pure validators (strict-JSON `parseEnvelope`, `isWebPath`, `isExternalUrl`, `sanitizeApiRequest`, `negotiate`, `answerUnknown`); README CONTRACT lists WP2.3-B's dispatcher acceptance criteria |
| `packages/ui/src/bridge/client-ready.ts`, `client-inbox.ts`, `client-back.ts` | WP2.3-C client split: ready handshake (post -> wait readyAck 2 s -> backoff retry -> fatal), held-inbox batching/cap, native `back` answerer |
| `packages/ui/src/bridge/client-types.ts`, `client-events.ts` (+ `client-events.test.ts`) | W6: client types split out; pre-ready DOM events (`theme`/`navReady`/`navigated`) queue with calls and flush in order after `readyAck`, `theme` coalesces in place, cap 32 (`event-dropped`); `diag`/`ready`/`ack` pass through |
| `apps/mobile/lib/bridge-host-events.ts`, `native-theme-store.ts` | W6: host dispatch for non-`ready` DOM events (strict `theme` validation, no reply); native chrome theme store (default = site `#0c0c0c`, reset on fallback/teardown) |
| `apps/mobile/lib/bridge-host-types.ts`, `bridge-host-acks.ts` | W6 split of `bridge-host.ts` (pure extraction, public API unchanged and re-exported): deps/limits/types; `onAcked` waiters, ack watermark, outbox-evicted seqs |
| `packages/ui/src/bridge/client-util.ts` (+ `client-fatal.test.ts`) | WP2.3-C client helpers: constants, `monotonicIds` (reseedable, throws at MAX_SAFE_INTEGER), strict-JSON `clean`, `resultFits`, `validHwm`, ready backoff |
| `packages/ui/src/bridge/client.ts` (+ `client.test.ts`, `contract.test.ts`) | WP2.3-C transport-neutral DOM bridge client (`createBridgeClient`: id-correlated `call` with timeout/abort->`cancel`, `consumeInbox` seq dedupe + `ack`, `on`/`handle('back')`, `sendReady`); contract test = 3 type-level legs (client <-> `HandlerMap`, host handler signatures, `HostAdapter` <-> `PayloadOf`/`ResultOf`) |
| `apps/mobile/dom/bridge/transport-expo.ts` (+ test) | WP2.3-C the ONE Expo-DOM-specific DOM-side file (`inbox` prop + `bridge` action -> client) |
| `apps/mobile/dom/bridge/app-adapter.tsx`, `app-adapter-nav.tsx` (+ `app-adapter.test.ts`) | One UI H4/D1 app HostAdapter (`createAppAdapter`, per provider): Link click interceptor, `a[target=_blank]` capture, `AppImage` (next/image fill styles), tri-state storage, env/insets/resolveUrl, `currentUrl` = in-DOM path. NOT mounted until D2 (SharedUiHost/ReaderSpike untouched) |
| `apps/mobile/lib/use-native-overlay.ts`, `components/NativeOverlayHost.tsx` | One UI D-7 overlay wiring extracted from App.tsx: the hook owns presenter state, deadline tick, reset when the DOM surface is not rendered (`domSurfaceRendered`) and hardware back; the host renders the RN Modal (no native route renders in it since W6-inbox-dom; the inbox is DOM) plus its own diag hot-corner strips (shared 7-tap counter `sharedHotCornerUnlock`) |
| `apps/mobile/lib/bridge-host.ts` (+ `bridge-host.test.ts`, `bridge-host-queue.test.ts`, `bridge-host.test-kit.ts`) | WP2.3-B native bridge dispatcher: pure/transport-neutral `createBridgeHost` (injected clock/scheduler/send/handlers). One res per cmd, 8 s per-type timeouts, `cancel`, bounded-LRU replay dedup, per-command validators before handlers, pre-ready seq queue + ack trim, version check vs `NATIVE_SUPPORTED_RANGE` -> `onProtocolFatal` (the only watchdog path). NOT wired into SharedUiHost/App yet (step 4 waits for G0) |
| `apps/mobile/dom/bridge/transport-expo.ts` (+ test) | WP2.3-C the ONE Expo-DOM-specific DOM-side file (`inbox` prop + `bridge` action -> client); imported by ReaderSpike (`ExpoBridgeMount`, only when the host passes `bridge`); H0 wired |
| `apps/mobile/lib/bridge-host.ts` (+ `bridge-host.test.ts`, `bridge-host-queue.test.ts`, `bridge-host.test-kit.ts`) | WP2.3-B native bridge dispatcher: pure/transport-neutral `createBridgeHost` (injected clock/scheduler/send/handlers). One res per cmd, 8 s per-type timeouts, `cancel`, bounded-LRU replay dedup, per-command validators before handlers, pre-ready seq queue + ack trim, version check vs `NATIVE_SUPPORTED_RANGE` -> `onProtocolFatal` (the only watchdog path). wired into SharedUiHost per mount (H0; unwired deps until H1/H2/H3) |
| `apps/mobile/lib/bridge-handlers-api.ts` (+ test) | WP2.3-F1 native `api` handler: `createHandlers({fetch,baseUrl,...})` -> `{api}`; 4-endpoint POST allowlist, header allowlists both ways, 256 KB caps, 8 s timeout, abort -> cancelled, no expo/SharedUiHost imports. NOT wired (F2 waits for G0) |
| `apps/mobile/lib/bridge-handlers-api-stream.ts` (+ `.test.ts`, `.test-kit.ts`) | W6-stream native stream table behind `api {stream:true}` / `apiRead`: bounded 64 KB buffer + backpressure, 256 KB cumulative cap, 32 KB chunks, 1 s long-poll, per-stream TextDecoder, deadline = CLOWN_TIMEOUT_MS; lifecycle via `HandlerContext.own` (cancel by streamId, abort-all drops the table). DOM pull loop: `dom/bridge/api-fetch.ts` `createBridgeApiStream` (+ `api-fetch-stream.test.ts`) |
| `apps/mobile/lib/bridge-handlers-api-clown.test.ts` | 2.11-D1 tests: ClownChat allow-list entry, native Authorization after sanitize, x-clown-session persisted + stripped, 60 s clown timeout |
| `apps/mobile/lib/expo-fetch-deps.ts` | `createExpoApiDeps()`: expo/fetch + apiBaseUrl + clown-session-store for the F2 `api` handler; no DOM transport imports. Loaded lazily by `createLiveApiDeps` (app-handlers.ts); `createLiveAppHandlers` = H0 map with `api` live (H2; SharedUiHost swap pending) |
| `apps/mobile/lib/use-native-screen-state.ts`, `components/NativeScreenRouter.tsx` | 300-line split of App.tsx (pure move): the hook owns tab/overlay/legal/track-guide/moment state + `openNativeScreen`/`openWebUrl`/`openLegalPage`/`closeLegalPage`; the router renders the native (non-DOM) screen tree |
| `apps/mobile/lib/native-back.ts` (+ test), `components/NativeBackBar.tsx` (+ test) | Native Back: `backAction` (pure) decides song -> track guide -> home tab -> unhandled (Android exits only from the root tab); `goBack` in `use-native-screen-state.ts` applies it, is registered on Android hardware Back, and every setter/opener bumps a nav generation so a stale async song resolve cannot override newer navigation. `NativeBackBar` is the Close/Back header on the track-guide and song screens | Do not add a native screen without giving it a close control and a `backAction` case |
| `apps/mobile/lib/bridge-handlers-notifications.ts`, `notification-tap-queue.ts` (+ tests) | WP2.3-E1 (pre-G0, pure, no expo/SharedUiHost imports): `createHandlers(deps)` for `notifications.{status,request,register,updatePrefs}` (fixed failure text, no token); tap queue holds bounded, id-deduped taps until `attach(sink)` then replays in order (`navigateSink(host.emit)`; `detach` re-holds). E2 wiring (App.tsx listener, SharedUiHost, watchdog-gate TODO) waits for G0 |
| `apps/mobile/lib/notification-tap-gate.ts`, `use-notification-taps.ts`, `notification-tap-ingest.ts`, `notification-host-deps.ts`, `notification-host-ports.ts` (+ tests) | H3: gate picks the tap target (native navigator / bound host via ack / hold); hook feeds expo cold+live taps (id = request.identifier, clears last response); real NotificationHost deps over expo ports (booleans -> cadences). SharedUiHost `bindHost`/deps wiring pending |
| `apps/mobile/lib/bridge-handlers-ui.ts` (+ test) | WP2.3-D1 UI bridge handlers: pure `createHandlers(deps)` (navigate/openExternal/share/haptic, injected native deps, validation before deps), `createBackHandler` (false pre-ready; non-`handled` -> exitApp; 1000 ms), `createInsetsEmitter`, `createContentVersionEmitter`. No RN/Expo imports; wired in SharedUiHost by H1 via `ui-deps.ts` + `createWiredHandlers`. |
| `apps/mobile/lib/app-handlers.ts` (+ test) | One UI wave 0 composer: pure `createAppHandlers({ui,notifications,api})` merges the D1/E1/F1 factories (a duplicate message key throws) into the `createBridgeHost` handler map (everything but `cancel`); no transport imports; `createUnwiredHandlers` = explicit H0 map answering `failed` for every command; `createWiredHandlers(log, {ui})` overlays real handler groups on it (H1: ui; H2/H3 add theirs) and is what SharedUiHost passes the host |
| `apps/mobile/lib/tap-bind-epoch.ts` (+ test), `apps/mobile/dom/bridge/navigate-subscriber.ts`, `navigate-subscriber.test.ts` (end to end per allowed root), `bridge-host-nav-hooks.test.ts`, `lib/app-handlers-for.test.ts`, `components/DomHostMount.tsx` | W2-I host integration: `createAppHandlersFor(log,{ui,api,notifications})` = unwired base + real groups (each key once); `createTapBinder` binds the tap gate once per keyed epoch after bridge ready + first paint + DOM `navReady`; `createTapTarget` sends reader paths with an id and counts delivery on ack + DOM `navigated`, opens other paths natively; lease released before dispose (bridge-host `onBeforeShutdown`/`onReadyAgain`/`onNavReady`/`onNavigated` hooks); bridge contract add-only: DOM events `navReady`/`navigated`, optional `navigate.id`, client `sendEvent`. `DomHostMount` holds the App.tsx DOM composition. App adapter mount + apiFetch/apiStream/webPush hookups stay D2 |
| `apps/mobile/lib/destination-resolver.ts` (+ test) | ONE normalized destination resolver: `resolveDestination(link, {isHostRoute, siteUrl?})` -> `{kind: 'dom'|'native', path}`; rewrites legacy backend query forms (`?screen=settings`, `?current=inbox`, `?screen=track-guide&era=`, `?screen=song&key=`, era-stream/clownbot) to DOM paths; settings/inbox/legal/reader = dom, registered host routes and anything else = native. Used by the tap target (`canonicalize` + `isReaderPath`), `tap-paths.ts`, `ui-deps.ts`. Lost-`navigated` recovery lives in `tap-bind-epoch.ts` (stale ref re-emit, `MAX_UNCONFIRMED_ATTEMPTS`; test `tap-ack-recovery.test.ts`) |
| `apps/mobile/lib/ui-deps.ts` (+ test) | H1 real deps for the UI handlers: `createUiDeps({linking, share, haptics, platformOS, log, siteUrl?, getPresenter?})`; `isNativeRoute` = the ONE `lib/destination-resolver.ts` canonicalizing to a registered host route (`dom/slots/routes`), legacy `lib/routes` no longer consulted; `navigate` calls the D-7 presenter (read at call time; absent = `failed`); Android share folds the url into the message; haptic kinds map to expo-haptics. Native modules are injected, no RN imports |
| `apps/mobile/dom/bridge/{back-responder,focus-restore}.ts` (+ tests), `ui-wiring.test.ts` | H1 DOM glue: `answerBack` (open item closes first = `handled`, else `exit`) registered by the reader Shell as the `back` responder; `withFocusRestore(fn)` returns focus to the trigger after a native sheet closes; `ui-wiring.test.ts` runs a real host + DOM client over the UI commands, back and insets |
| `apps/mobile/dom/slots/{onboarding,onboarding-overlay,onboarding-store}.ts(x)` (+ `onboarding.test.tsx`), `lib/bridge-handlers-notifications-onboarding.test.ts` | W6: capability-gated DOM push-permission offer (`overlay:onboarding`, first settings open, web never shows it); seen flag via bridge commands `notifications.onboardingOffered`/`markOnboardingOffered` on the native OnboardingScreen's SecureStore key; reuses the NEUTRAL palette exported by `settings-page.tsx`. Native `OnboardingScreen` stays for the fallback until WP5.2 |
| `apps/mobile/dom/slots/settings{,-page,-store,-paths}.ts(x)` + `inbox{,-page,-store}.ts(x)` (+ `settings.test.ts`; render tests in `apps/web/components/longlive/SettingsPage.app-host.test.tsx`) | WP2.12-D (AT RISK, stacked on D2): `overlay:settings` = `SettingsPage` (null while closed; open state in `settings-store.ts`, opened by `createNavigateDom` for `/settings` and `/settings/notifications`, closed by back via ReaderBridge). Driver: `packages/ui/src/reader/settings/lib/driver.ts` (`webPush ?? notifications ?? unsupported`; the app uses `host.notifications` over bridge `notifications.{getPrefs,savePrefs,unregister}`, no device id or push token crosses). W6-inbox-dom: `/inbox` is the DOM `overlay:inbox` (`InboxOverlay`, `inbox-store.ts`, page in `packages/ui/src/reader/settings/InboxPage.tsx`, feed via `host.apiFetch` GET `/api/notifications/inbox`, rendered only with `host.notifications`; opened by the host-gated Settings "Notification inbox" row, `createNavigateDom`/native-to-DOM navigate and notification taps; back closes it above settings); no native route remains (`host.routes.ts` registers none) and the native About screen is gone (Diagnostics stays behind the hidden hot corner) Also: `settings-paths.ts` (pure paths, shared with native tap routing), `lib/tap-paths.ts` (`isDomOwnedTapPath`: settings taps go DOM via native-to-DOM navigate), `lib/prefs-projection.ts` (exact native-side prefs projection), `notifications.registration` (token-free registered flag) and a bounded abortable FIFO for `savePrefs`; `scripts/parity/spa-routes.mjs` allow-lists side-b SPA routes | Add-only bridge commands need all three contract legs (`messages.ts`, `bridge-host-validate.ts`, handlers) |
| `apps/mobile/dom/slots/{era.ts,host.routes.ts,reader-slots.ts,overlay-fallback.tsx}` (+ tests) | One UI H4/D2: `era.ts` registers `surface:era`; `host.routes.ts` registers the native screens NativeOverlayHost renders (none since W6-inbox-dom; ModeFallback shows a placeholder when the handoff fails); `reader-slots.ts` maps the flat registry onto ReaderSlots (`surface:<mode>`/`overlay:<name>` in registration order/`footer`/`floating`, convention in `index.ts`); `overlay-fallback.tsx` is the app-side `overlayFallback` (rows song/track-guide/theory-guide/search; native handoff, clear only after presentation; the thread lens rides ModeFallback) plus the D-6 `ModeFallback`. Cold-start perf: `lazy.ts` + `lazy-loaders.ts` defer the threads/community/mood/clownbot surface modules to their first render (call-time require, same frame as the open); the era shell and all overlays stay eager. Each slice D deletes its row/mode path; 2.11-D2: `clown.tsx` registers `surface:clownbot` (ClownChat fed by `useLore()`) and `surface:mood` (MoodChat) |
| `apps/mobile/dom/bridge/{reader-bridge.tsx,reader-controls.ts,reader-nav.ts,deep-link-apply.ts,commit-apply.ts}` (+ tests) | One UI H4/D2: `ReaderBridge` (first slot overlay, inside the store provider: back registration, mode tracking, installs the navigate applier), `ReaderControls` context, `createNavigateDom`/`installReaderBridge` (React-free, real host/client round trip tested), `applyAfterCommit` (defers out of the transport effect, then flushSync, so the ack follows commit), `applyDeepLink` (native navigate through store actions, false = unresolved, state untouched; mirrors AppProvider mount read) |
| `apps/mobile/dom/slots/` (`types`, `registry`, `instance`, `index`, `routes`, `routes-registry`, `routes-instance`, `slots.test`, `community`, `community.test`, `tracks`, `tracks.test`) | One UI wave 0 skeleton, split in two. DOM side: `index.ts` + `<slice>.ts` self-registering slots (idempotent per slice). Native-safe side: `routes.ts` + `<slice>.routes.ts` registering frozen native routes (dup ids/matchers and g/y regexes throw); a test asserts its import graph has no slot files. Each slice adds one import line per side. No slice bodies registered yet (2.5-D adds `moment.ts` + test: `overlay:moment` = package MomentDetail; AT RISK, not yet imported by `index.ts` until D2); 2.9-D adds `merch.ts` + test: `surface:merch` = `MerchSurface` wrapping `MerchSection`, imported by `index.ts`; affiliate renderer from `HostAdapter.env.affiliate`, none in the app); WP2.8-D `search.ts` registers `overlay:search` = packages/ui SearchOverlay, imported by `index.ts` `community.ts` (WP2.10-D) registers `surface:community` from @swift2/ui; 2.7-D adds `tracks.ts` + test: `overlay:track-guide` + `overlay:song` from @swift2/ui; WP2.6-D `threads.ts` registers `surface:threads` = ThreadsMode and `overlay:theory-guide` = TheoryGuide (no native routes) |
| `packages/content/src/api-fetch.ts` (+ test) | `ApiFetch` request/response contract (bridge-serializable) + `webApiFetch` same-origin default; reader `/api` call sites not migrated yet (One UI WP0.3b) |
| `apps/web/next-config.test.ts` | Asserts `next.config.mjs` headers(): ACAO `*` on `/content/:path*` only, none on `/api`/HTML |
| `packages/content/src/timing.ts` (+ test) | One UI WP0.1: optional load-stage hooks (`beginStage`, `setLoadTimingSink`); shared no-op when no sink is registered; `load.ts` reports pointer/manifest/download/hash/parse/validate/disk-write/load-total |
| `packages/content/src/pool.ts` (+ test) · `load-concurrency.test.ts` | One UI WP0.2 PR B: `mapPool` capped-concurrency helper; `load.ts` downloads bundle file bodies 5 at a time (download marks overlap), then hash/parse/validate in manifest order |
| `apps/mobile/lib/diagnostics.ts` (+ test), `diagnostics-env.ts`, `diagnostics-override.ts`, `diagnostics-send.ts`, `components/DiagnosticsPanel.tsx` | One UI WP0.1: timing collector + `[diag]` report builder, device facts, C4 `Force shared UI` stub (persisted, unwired until WP0.4), send via `/api/feedback`. All `startMs`/`at:` values are offsets from launch T0 (collector creation; `index.ts` imports `lib/diagnostics` before App); point marks render by `at:` (panel + server comment drops their 0.0 row). Hidden panel: 7 taps on the Settings version label. Marks: `provider-wiring` (era-stream-data.ts `wireTheories`), `first-era-paint` (EraSection.tsx, first rAF after real entries commit) |
| `packages/content/src/warm-cache.ts` (+ test) | One UI WP0.2 PR C: `SCHEMA_FINGERPRINT` (hand-bumped; test pins a hash of `schema.ts` + `validation-contract.ts` + the zod version so a schema change cannot skip the bump) lets a warm launch skip per-file zod `safeParse`; `lastGoodJson` reuses the serialised files blob. `hash.ts` `createHash` also takes pre-encoded bytes |
| `packages/content/src/validation-contract.ts` | `lookupSchema`: manifest entry name -> zod schema (split from `load.ts`; covered by the `SCHEMA_FINGERPRINT` pin) |
| `apps/web/app/api/feedback/route.ts` (32 KB body cap, 413), `diag.ts` (+ `route.test.ts`, `route.diag.test.ts`) | `{message:"[diag]", diag:{...}}` is validated against an exact schema (`parseDiagReport`) and the comment on tracking issue #4791 (hardcoded `DIAG_ISSUE_NUMBER`) is rebuilt from a fixed template; client text is never posted. Same token, repo and per-IP rate limit; 400 on any unknown/extra/out-of-range field |
| `packages/shared/src/api/version.ts` | `API_VERSION`; `apps/web/proxy.ts` sends it as `x-api-version` on `/api/*` (test: `apps/web/proxy.test.ts`) |
| `apps/mobile/lib/update-required.ts` (+ test), `components/UpdateRequiredScreen.tsx` | Dormant forced-update gate: `isUpdateRequired`, `currentNativeBuild`, store URLs; driven by optional `minNativeBuild` in app-config (unset = inert). Rule: `docs/mobile-release.md` "Forcing an update" |
| `apps/mobile/lib/app-config.ts` (+ test) | `loadAppConfig()` (network, 3s timeout -> last-good -> defaults, never throws) + `routeFlagsFrom()`; App.tsx applies the result to `resolve`/`createNavigate` |
| `apps/mobile/lib/content-bundle.ts` (+ test) | `loadContentBundle()`: the one mobile bundle loader (shared storage, `unknownEnumPolicy: 'drop'`, `dataErrorFallback: 'last-good'`) + once-per-process OTA `selfHealOnce()`. All six `*-data.ts`/`vault.ts` callers use it |
| `packages/experience/src/era-ids-sync.test.ts` | Asserts `ERAS` ids equal `eraIdSchema.options`; see `docs/mobile-release.md` "Adding an era/enum/catalogue" |

## ReaderSnapshot (One UI WP0.3, 2026-10-02)

| File | What it is |
|---|---|
| `packages/experience/src/reader-snapshot/` (`types`, `build`, `corpus`, `sources`, `search-docs`, `queries`, `hash`, `index`, README) | Versioned `ReaderSnapshot` contract; `fromBaked` (web modules) / `fromBundle` (D1 bundle); canonical WebCrypto hash + `diffSnapshots`. Export: `@swift2/experience/reader-snapshot`. The web reads it via `@swift2/ui` context (`queries.ts`: pure `createReaderQueries`). See its README |
| `packages/experience/src/corpus.ts` | `ReaderCorpus` type (all-function members) + `injectedCorpus()` (O(1), provider-backed); the pure `*In(corpus, ...)` variants in threads/lenses/doorways/theories/era-secrets/track-guide take it, and the old exports wrap it |
| `packages/experience/src/reader-snapshot/lore.test.ts`, `packages/ui/src/reader/clown/ClownChatSection.tsx`, `apps/web/lib/longlive/clown-extensions.ts` | W2-L: `lore` extension domain (bundle `clownbotLore`, optional -> `[]`); ClownChatSection feeds ClownChat lore from the extensions context; web bakes `CLOWN_EXTENSIONS` |
| `packages/experience/src/reader-snapshot/{purity,flat-order}.test.ts` | WP2.2-A gates: build is pure over inputs (throwing sentinel providers, interleaved builds, no provider import); flat-order audit |
| `packages/ui/src/snapshot/context.tsx` (+ test) | WP2.2-B reader context: `ReaderSnapshotProvider`, `useReaderSnapshotStatus/useReaderSnapshot/useReader`, `isReaderSnapshot` guard | Host-agnostic (ui import ban); `loading` throws in `useReaderSnapshot` |
| `packages/ui/src/snapshot/extensions.tsx` (+ test) | WP2.2-E: `ReaderExtensionsProvider` calls `attachExtensions` inside the merch/mood chunk; `useExtendedSnapshot/useMerch/useSongMoods`. `useReader()` is typed by its video deps (`WatchableVideoNote[]`, no cast) | Render only in lazy chunks, never at the root; `extensions` must be a stable reference |
| `apps/web/lib/longlive/reader-extensions-equivalence.test.tsx` | WP2.2-E: provider data === direct imports, mood ranking identical over all starters/axes, merch markup independent of songMoods | |
| `apps/mobile/dom/reader/shims/fill-extensions.ts` | DOM host mirror: merch shim + `setDefaultSongCatalogue` poured only by `loadReader` (call-time require), apart from core `fill`; `snapshot.ts` hashes only after `attachExtensions` | |
| `apps/web/lib/longlive/{baked-modules,baked-modules-full,reader-snapshot-provider}.ts(x)` | `bakedModules()` = CORE only (no merch/moods; the root client component must not import them) feeds `fromBakedCore`; `bakedModulesFull()` adds them for `parity-probe`/tests (`fromBaked`, hashable). `hashSnapshot` throws on a core-only snapshot | No module singleton; probe hash must equal `fixture.json`; `scripts/perf/snapshot-build.ts` is the 15 ms median gate |
| `apps/web/lib/longlive/reader-c2-equivalence.test.tsx` | WP2.2-C2: `useReader()` accessors equal the module accessors for the C2 call sites | MomentDetail, ThreadsTimeline, ProposalThread read `useReader()`; `related.resolveRelatedMoments` takes a REQUIRED lookup (client-only helper). EntryDetail, RunwayThread, EraSecretCard also on `useReader()` (new core queries `contentForThreadInRange`, `contentForThreadInEra`, `songTargetOf`, `resolveEraSecretLink`, equal to the web modules in queries.test). Left for C3: `share-payload`/`share-card-spec` + OverlayNav, TopBar, TheoryGuide, ShareImageMenu |
| `apps/web/lib/longlive/render-with-reader.tsx` | Test helper `renderWithReader(ui)`: RTL `render` under `WebReaderSnapshotProvider`; any test rendering a `useReader()` component (incl. `AppProvider`) uses it | WP2.2-C1 migrated EraSection, TimelineScrubber, YourLongLiveCard, Crossings (threadPoints) and the store to `useReader()`; `threadsInEra`/`threadCrossings` still injected (no query yet) |
| `apps/web/lib/longlive/search-golden.fixture.json` | Frozen era/egg/thread search results from the deleted web index builder; `search.ts` is now only the engine re-exports | Content-independent groups only, so content PRs do not move it |
| `packages/experience/src/reader-snapshot/queries.test.ts` | Every `createReaderQueries` accessor deep-equals the web module it replaces, over all eras/ids/threads | Needs `npm run sync:content` (also covers `threadsInEra`, `threadCrossings`, `resolveTrackKey`, `adjacentTrackOnAlbum`, `keepExploring`, `resolveRelatedTheory`, WP2.2-C3) |
| `packages/ui/src/reader/{lib,store}/` (+ `READER-MOVE.md`) | WP2.4-A1 move-only: reader store and shared libs (theme, share-*, use-*, bottom-nav-*, video-affordance, utils `cn`, ...) with their pure tests; old `apps/web/lib/longlive/*` and `apps/web/lib/utils.ts` paths are one-line `export * from '@swift2/ui/reader/{lib,store}/...'` shims (subpath exports in `packages/ui/package.json`), retired in WP2.13 | Move-only: import-path edits only; logic changes go to 2.4-A2 |
| `eslint.config.mjs` + `packages/ui/src/reader-lint-ban.test.ts` | WP2.2-D: `no-restricted-imports` bans the module-global content accessors, baked/`*.generated` modules and injected `@swift2/experience` wrappers in `apps/web/components/longlive/**` and `packages/ui/**` ("read via useReader()"); tests + `*.server.*` exempt. `apps/web` is otherwise outside root lint; only that folder is un-ignored, with a parser and stub plugins so inline disables resolve | Merch components are allow-listed until #4859 (TODO in the config); the ban is import-level, so `lib/longlive/**` (mixed server/client) is not covered |
| `packages/experience/src/reader-snapshot/equivalence.test.ts` | CI gate (own step in `ci.yml`): baked vs bundle hash equal, diverged fixture names its domain |

## One UI reader slices (WP2.5-2.13 scaffold)

Intentionally empty barrels `packages/ui/src/reader/<slice>/index.ts` and package subpath exports already exist (no root re-exports; import via deep subpaths); each slice adds its rows only under its own heading.

### WP2.5 moment

| Path | What |
|---|---|
| `packages/ui/src/reader/moment/{MomentDetail,MomentSocialPost,ZoomableImage}.tsx` | MOVED from `apps/web/components/longlive/` (WP2.5-A1, move-only). `apps/web/components/longlive/MomentDetail.tsx` is a one-line `export *` shim (until D / WP2.13) |
| `packages/ui/src/reader/moment/{ConfidenceBanner,RumorSection,MomentFigure,MomentLightbox,MomentHero,MomentHeader,MomentSources,MomentClueCards,MomentThreadLinks,RelatedMomentsRail,ShopTheLook}.tsx`, `momentShared.ts` | One UI: pure-move split of `MomentDetail.tsx` (300-line debt); `MomentDetail.tsx` composes them and re-exports `RelatedMomentsRail`. Source-reading tests (`card-chrome`, `modal-focus-trap`, `focal-point-rendering`) repointed to the new files |
| `packages/ui/src/reader/moment/resolve-url.test.ts` | One UI W3-img: MomentDetail hero / lightbox / `RelatedMomentsRail` (now exported) pass era-art + `/placeholder.svg` paths through `useResolveUrl()`; app host → canonical origin, web identity, absolute untouched |
| `packages/ui/src/reader/moment/lib/{contain-fit,related,useFocusTrap,shop,shop-networks}.ts` + `awin-advertisers.json` | MOVED from `apps/web/lib/longlive/`; `related`, `shop`, `useFocusTrap` keep one-line shims at the old path. The awin sync workflow and `scripts/merch-engine/*` point at the moved JSON |

### WP2.6 threads
| Path | Purpose | Notes |
|---|---|---|
| `packages/ui/src/reader/threads/` (+ `READER-MOVE.md` § WP2.6 threads) | WP2.6-A1 move-only: ThreadsMode, ThreadsTimeline, ClueWeb, Crossings, FromTheEras, LiveTheoryCard, TheoryCard and the `decode/`, `love-story/`, `proposal/`, `runway/`, `taylors-version/` thread components; non-components under `threads/lib/` (`crossingMarkerLayout`, `decode`, `love-story`, `live-theories`, `lib/decode/patternRailLayout`) with their pure tests | One-line shims at `components/longlive/{ThreadsMode,TheoryCard,LiveTheoryCard}.tsx` and `lib/longlive/live-theories.ts`; `TheoryGuide` stays in `apps/web` until WP2.5 moves `useFocusTrap`; source-reading tests stay in `apps/web` and point at the moved files |

### WP2.7 tracks

| File | Note |
|---|---|
| `packages/ui/src/reader/tracks/{TrackGuide,TrackDetail}.tsx` | MOVED from `apps/web/components/longlive/` (WP2.7-A1, move-only). Both old paths are one-line `export *` shims (until D) |

### WP2.8 search

| Path | What |
|---|---|
| `packages/ui/src/reader/search/{SearchOverlay.tsx,search-listbox-children.test.ts}` | MOVED from `apps/web/components/longlive/` (WP2.8-A1, move-only). `apps/web/components/longlive/SearchOverlay.tsx` is a one-line `export *` shim (until D / WP2.13). `lib/longlive/search.ts` stays (still used by `clown-retrieve.ts`, the golden suite, regen script) |

### WP2.9 merch
(2.9-A1) Moved to `packages/ui/src/reader/merch/`: EraSpine, MerchMarquee, MerchEmptyPanel, MerchSectionRail, SubmitLinkForm, `lib/{merch-filters,section-jump}`. Old apps/web paths are one-line shims. 2.9-A1b also moved MerchCard and MerchStyleSection. 2.9-A2 moved MerchSection too (takes an `extensions` prop; web wrapper injects `MERCH_EXTENSIONS`); SubmitLinkForm now uses `useHost().apiFetch` and `env.turnstileSiteKey`. See `packages/ui/READER-MOVE.md`.

### WP2.10 community
(2.10-A1, move-only) Moved to `packages/ui/src/reader/community/`: CommunitySection, CommunityCard, SectionJumpBar. Old apps/web paths are one-line `export *` shims. Community data is imported from `@swift2/experience` directly; SubmitLinkForm and section-jump come from `reader/merch/`. A2 not needed (no non-import hunks). See `packages/ui/READER-MOVE.md`.

### WP2.11 clown
A1 (clown board/chat client modules only; Mood and all server-side `clown-*` stay in apps/web). MOVED to `packages/ui/src/reader/clown/`: `ClownBoard`, `ClownChat`, `ClownChatComposer`, `ClownChatTitlebar`, `ClownEmptyState`, `ClownItemCard`, `ClownMessageRow` (.tsx) and `lib/{clown-board,clown-chat-helpers,clown-chat-ui,clown-explain,clown-starters,clown-stream,useChromeOffset}.ts`. The old paths are one-line `export *` shims. Wire types come from `@swift2/shared`. `clown-board.ts` takes `lore` as a parameter (`ClownChat`/`ClownBoard` take a `lore` prop); the baked `LORE` (`apps/web/lib/longlive/clownbot-lore.ts` + `.generated`) stays app-side and `LongLive.tsx` passes it.

### WP2.12 settings
| File | Purpose |
|---|---|
| `packages/ui/src/reader/settings/WebNotificationSettings.tsx` | Web-push settings screen; reads `useHost().webPush`. Old `apps/web/components/longlive/` path is a shim |
| `packages/ui/src/reader/settings/NotificationSettingsPage.tsx` | Body of `/settings/notifications` (`useHost().Link`); the Next page keeps `metadata` + VAPID env |
| `apps/web/lib/host-adapter.tsx` (`webPushHost`) | Web `HostWebPush`: wraps `web-push-client.ts` + `/api/devices/:id/prefs` |

### WP2.13 legal
| Path | What it is |
|---|---|
| `packages/ui/src/reader/legal/{LegalDocument,SupportPage}.tsx` + `lib/legal.ts` | MOVED from `apps/web` (WP2.13-A1 + minimal A2). `apps/web/lib/longlive/legal.ts` is a one-line `export *` shim. `app/{privacy,terms,support}/page.tsx` keep `metadata` and pass `footer={<SiteFooter />}` (SiteFooter stays until 2.4-B). `Link` via `useHost()` |
| `packages/ui/src/reader/legal/FeedbackButton.tsx` | MOVED from `apps/web/components/longlive/` (WP2.13-A1b, move-only). Old path is a one-line `export *` shim (until A2) |
| `packages/ui/src/reader/legal/MailtoLink.tsx` | WP2.13-A2b: `mailto:` anchor; routes the click through `host.openExternal` when the host has it (app), plain anchor otherwise (web). Used by `SupportPage`. `isMailtoUrl`/`MailtoUrl` live in `packages/ui/src/bridge/validate.ts` (bare address only; `openExternal` accepts it besides https) |
| `apps/mobile/lib/mailto-allowlist.ts` (+ test) | `APP_MAILTO_ALLOWLIST` (exactly the two LEGAL_FACTS aliases), `isAllowedMailto`, `isAppOpenableUrl` (https or allow-listed mailto). One gate for the `openExternal` handler, the host command validator and `SiteShell`'s off-site navigation; everything else is dropped |
| `apps/mobile/lib/site-url.ts` | WP2.13-A2b: canonical `SITE_URL` (`EXPO_PUBLIC_SITE_URL` override). `components/SiteShell.tsx` re-exports it until the shims go after 2.13-D |
| `apps/mobile/dom/slots/{legal.ts,legal-overlay.tsx,legal-route.ts,use-legal-page.ts}` (+ tests) | WP2.13-D + W3-legal: slots `overlay:legal` (full-bleed `LegalDocument`/`SupportPage` keyed on `host.currentUrl()`, each with the web `SiteFooter`) ; no `floating` of its own (D2 registers the feedback button): the layer is portaled to <body> (root palette), z-80 above it, keyed per page, and sets the other body children `inert` while open; `dom/bridge/dom-path-commit.ts` = commit-aware `showDomPath` for native `navigate`. Native `LegalPageScreen`/`SiteShell` untouched. `legal.test.ts` drives the REAL `createAppAdapter` + `dom-path` (mocks `react` to apps/web's copy; apps/mobile pins its own) |
| `apps/mobile/dom/bridge/dom-path.ts` (+ test) | W3-legal: in-DOM page path for exactly `/privacy`, `/terms`, `/support` (allow-list). Lives in `history.state.swift2Path` (page pathname seeds it on web/dev/parity), first legal page pushes, legal-to-legal and back-to-root replace, `swift2:dompath` event + `popstate` notify, `backFromDomPath` answers native back. `AppReader` `getPath` = `currentDomUrl()`; `reader-nav`/`navigate-subscriber` keep these paths in the DOM |
| `packages/ui/src/reader/legal/{SiteFooter.tsx,lib/social.ts}` (+ `social.test.ts`) | W3-legal: MOVED from `apps/web` (`components/longlive/SiteFooter.tsx` and `lib/longlive/social.ts` are one-line `export *` shims); web output identical |

## CI concurrency (2026-10-01)

| File | What it is |
|---|---|
| `scripts/ci-concurrency.test.ts` | Pins `ci.yml`'s concurrency: `main` pushes grouped per commit (a shared group silently dropped queued runs when merges clustered), PRs per-ref with cancel-in-progress |

## Expo DOM host (One UI WP0.4)

| File | What it is |
|---|---|
| `apps/mobile/dom/SharedUiTest.tsx` (+ `shared-ui-test.css`, `css.d.ts`) | `'use dom'` test page: Tailwind v4, `--era-*` switch, Radix dialog, 50-row list, inlined web font, watchdog signals |
| `apps/mobile/dom/reader/shims/*.ts` (+ `fill.test.ts`, `parity.test.ts`, compile-time `parity.types.ts`) | Same exports as the baked web modules over live arrays/maps; `fill(snapshot)` mutates them in place and calls every `set*Provider`. `theories` is shimmed too (the baked one would overwrite the filled provider at import). Fill BEFORE importing reader components |
| `apps/mobile/dom/AppReader.tsx` (+ `reader-spike.css`) | One UI H4/D2 (was ReaderSpike, WP0.5b) `'use dom'` page: reads the native cache file by URI, builds the snapshot in-webview, fills the shims, then `loadReader` (`reader/reader-modules.ts`) `require`s packages/ui `ReaderRoot` + the slot registry and mounts it under the app HostAdapter (`createReaderAdapter`: D1 adapter + H2 `apiFetch`/`apiStream`, built once per bridge client). All G9 measurement kept (probe, speed test, image listener, error capture, devLoader). Native `navigate` is applied through the reader store (`bridge/reader-nav.ts`, `deep-link-apply.ts`), never a remount; test: `app-reader.test.ts` |
| `apps/mobile/dom/reader/{read-local,storage-shim,snapshot,probe}.ts` (+ tests) | `readLocalText` (script -> XHR -> fetch; script reads the `.js` twin of the cache, iOS WKWebView blocks file:// fetch/XHR; XHR status 0 ok), Map-backed storage shim, cache envelope to `ReaderSnapshot` + hash, probe recorder / placeholder counter / marker check; `deferred-hash.ts` runs the diagnostics-only hash after first paint + ready; the twin is an object literal (reader accepts it parsed, or the older string form) |
| `apps/mobile/dom/reader/dev-loader.ts`, `apps/mobile/index.web.ts` | DEV/WEB ONLY browser entry (served content bundle); never in the app bundle, enforced by `scripts/parity/check-dom-bundle.mjs` |
| `apps/mobile/lib/speed-test.ts`, `speed-test-controller.ts`, `speed-test-runtime.ts`, `speed-test-store.ts`, `image-marks.ts` (+ tests); `dom/reader/image-listener.ts` | #4896 Speed test mode: pure state/math/report builders, injected-deps controller + launch tracker (cold vs warm via AppState), runtime wiring (installed in App.tsx), one SecureStore key, image-load marks fed by MomentCard and the DOM adapter Image. Server side: `apps/web/app/api/feedback/diag.ts` `speed` meta + `speedAllowed` limiter (`route.speed.test.ts`) |
| `apps/mobile/lib/dom-reader-config.ts`, `dom-probe-store.ts` | `.js`-twin cache URI (written by vault-storage `setItem` for `:last-good`, backfilled on first launch) handed to the webview (config, not content); latest probe for the Diagnostics panel |
| `scripts/parity/check-dom-bundle.mjs` (+ test) | Asserts the exported DOM bundle has no baked content (sourcemap sources incl. every `*.generated.ts`, plus 4 content-kind sentinels) |
| `docs/one-ui/wp0.5.md` | WP0.5 spike notes: shims, gaps, recipes, findings |
| `apps/mobile/lib/deferred-bundle-refresh.ts`, `use-deferred-bundle-refresh.ts` (+ test) | Startup perf: with a disk cache the native content refresh (sync read + parse) waits for the DOM ready signal + InteractionManager; no cache = immediate. Hook used by SharedUiHost; diag marks `bundle-refresh-*` |
| `apps/mobile/components/SharedUiHost.tsx` | Native host for it; records launch/ready/error/crash signals and forwards them to the watchdog; no reload or error screen of its own |
| `apps/mobile/lib/dom-host-handlers.ts` (+ test) | Pure DOM-host signal handlers (`createDomHostHandlers`: signal + `watch` sink, `bridge` action forwarder) and `createBridgeLink` (host `send` -> `inbox` prop / awaited `res`/`readyAck`) |
| `apps/mobile/dom/bridge/api-fetch.ts` (+ test) | H2 DOM side of the `api` command: `createBridgeApiFetch(client)` (ApiFetch over `client.call('api')`, cancelled -> AbortError) and `createBridgeApiStream` (bufferedFrom); not yet imported by the app adapter |
| `apps/mobile/dom/bridge/api-fetch.wiring.test.ts` | H2 real-bridge test: DOM client + link + host + `createLiveAppHandlers`, only expo/fetch mocked (allowlist/64 KB host validation, cancel propagation, per-endpoint timeouts) |
| `apps/mobile/dom/bridge/bridge-wiring.test.ts` | H0 wiring test: real host + link + DOM client (ready/readyAck, inbox drain + ack trim, res via bridge action, protocol fatal to watchdog) |
| `apps/mobile/lib/native-route-state.test.ts` | Table tests for the pure native-route presenter state machine in `dom-host-handlers.ts` (`reduceNativeRoute`, `nativeOwnsBack`, `isPresentablePath`) |
| `apps/mobile/lib/watchdog-policy.ts` (+ test), `watchdog-telemetry.ts` (+ test), `watchdog-drill.ts` (+ test) | One UI WP2.14: default-on policy. Quarantine (`QUARANTINE_AFTER_FALLBACK_CYCLES=2`), launch precedence quarantine > override > cache > default (`resolveWantsDom`), the 1500 ms pending bound, reason categories, default-off category-only `[watchdog]` telemetry queue (server side: `apps/web/app/api/feedback/watchdog-report.ts`, strict schema + flood guard), and the scripted G4 drill. Pure; `app-config.ts` `loadLaunchFlags` reads the cached flags. Docs: `docs/one-ui/dom-host.md` |
| `apps/mobile/lib/watchdog.ts` (+ test), `watchdog-store.ts`, `watchdog-gate.ts` | One UI WP0.4b: DOM-reader watchdog. Pure record/monitor rules (`decideMount`, strikes, ready-timeout with fake-clock tests), one SecureStore key, and the `useDomMount` hook App.tsx uses (attempt write awaited, fail closed). No network. Diagnostics: tri-state Force DOM failure + watchdog block (panel only) |
| `apps/mobile/lib/orientation-lock.ts` | Locks phones to portrait at runtime (app.json orientation is `default`) |
| `apps/mobile/postcss.config.mjs` | Tailwind v4 PostCSS plugin for DOM CSS |
| `apps/mobile/components/DiagHotCorner.tsx`, `lib/diag-hot-corner.ts` (+ test) | #4872: invisible 88pt top-inset-strip hot corner, mounted only with SharedUiHost; 7 taps open DiagnosticsPanel (the only Diagnostics path when the DOM host is up) |
| W3-iOS hardening (docs/one-ui/dom-host.md); also `lib/watchdog-monitor.ts` (attempt monitor split out of watchdog.ts, re-exported), `lib/native-route.ts` (D-7 presenter split out of dom-host-handlers.ts, re-exported), `lib/run-when-active.ts`. `packages/ui/src/reader/clown/ClownChat.tsx` was already 332 lines on main (over the 300 cap before this PR; not split here) | Post-ready webview termination reloads the DOM once (`createAttemptMonitor.crashed` -> 'reload', `RELOAD_WINDOW_MS`); pre-ready or a repeat strikes. `SharedUiHost` `dom` props pin iOS insets/bounce off; hot-corner strips carry zIndex/elevation; `fonts.dom.css` is `font-display: block` (generator `packages/ui/scripts/build-fonts.mjs`); `ClownChat.tsx` reads `var(--safe-*, env(...))` |
| `docs/one-ui/dom-host.md` | Native-needs matrix, fingerprint proof, open items |
| `apps/mobile/package.json` `main` = `index` | One UI WP1.1c: Expo resolves `index.ts` for native and `index.web.ts` (WP0.5b, mounts AppReader) for the parity web export, so no `app.json` edit and the native fingerprint is unchanged. The part-1 `index.web.tsx` test-page entry was removed in part 2 |
| `playwright.parity.config.ts`, `e2e/parity/` (`helpers.ts` = thin barrel over `env.ts` (ports, fixture, BASE, insets), `routes.ts` (ROUTES, A_ONLY_ROUTES*, clips; runs the b-baseline collision guard), `routes-coverage.ts` (W5-parity COVERAGE_ROUTES: element surfaces compared a-vs-b incl. countdown-banner (stubbed /vault/live) and era-secret (?era=fearless), `routes-threads-eras.ts` (thread-runway/-proposal/-ownership-timeline via the lens deep links, and `era-landing-<id>` for every non-tloas era in the frozen eras.json), plus `EXTRA_ROUTES`, the list every spec iterates), `routes-b-only.ts` + `b-bridge.ts` + `b-only.spec.ts` (app-only surfaces, `sides: 'b'`: inbox states and the push-permission offer, b baselines in `baseline.spec.ts`, Settings-token computed-style assertions), `b-api.ts` (test-only patch of the b entry bundle so `NO_BRIDGE.call` serves stubbed `/api/*` answers), `harness.ts` (arm + `test` fixtures), `wait.ts` (imagesReady/settle/quiet), `open.ts`, `capture.ts` (captures, pixelMatches, mutate); `placeholder.ts`, `structure.ts`, `baseline.spec.ts`, `compare.spec.ts`, `negative.spec.ts`, `__screenshots__/`) | Visual parity harness on the spike routes: sides a (web build) and b (DOM entry), 4 device projects, a-vs-b pixel + structural gates, per-side Linux baselines, negative specs; WP2.4 footer: `a-support-footer.png` (side a, element clip of the `/support` footer via `openSupportFooter`) + its 1px-translate negative. Root `playwright.config.ts` ignores it |
| `scripts/parity/serve.mjs`, `scripts/parity/make-fixture.mjs`, `scripts/parity/fixture/` | Side b static server (export + frozen fixture bundle at `/content`; missing assets 404 except the `/eras/*.png` allowlist); fixture tool (`--apply` in CI, `--regenerate`/`--prune` manual); the COMMITTED, pruned (current era + fixed item's era, ~2.9 MB) frozen content snapshot both sides render from; bundle dir is `content/frozen/` |
| `apps/web/app/parity-probe/route.ts` | Parity harness only: reports the baked-modules equivalence hash; 404 unless `PARITY_PROBE=1` |
| `e2e/parity/chrome.ts`, `chrome.spec.ts` | One UI W6-chrome: whole-viewport (chrome-included) a-vs-b at real insets for home, home scrolled, item, threads, merch (+ footer at the foot); `emulateInsetsOnA` is side a's inset equivalent. No baselines of its own; see docs/one-ui/parity.md | A fail is a real app difference, never regenerate b to pass |
| `e2e/parity/sides.ts`, `sides.spec.ts` | One UI W1-E: `Sides` ('a' default / 'both') on `AOnlyRoute`; `bothSidesRoutes`, `bBaselineNames`, `planBSide`, `assertNoBaselineCollisions` (module-load guard from `routes.ts`) (pure). Routes marked `both` get an a-vs-b viewport compare (`compare.spec.ts`) and `b-<name>*.png` baselines (`baseline.spec.ts`); none flipped yet, so the gate is unchanged. How to flip: `docs/one-ui/parity.md` |
| `e2e/parity/a11y.ts`, `a11y.spec.ts`, `a11y-negative.spec.ts`, `a11y-baseline/<project>.json` | One UI WP1.2: axe (wcag2a/aa) on both sides of the fixture routes; fails only on serious/critical findings absent from the committed baseline; b-only rules logged. Regenerated by the parity `update-baselines` dispatch (`A11Y_UPDATE=1`) |
| `.github/workflows/parity.yml` | Parity CI (pinned Playwright container) + baseline-update dispatch; never a required check |
| `docs/one-ui/parity.md` | How the harness works, tolerance, baseline-update order |
