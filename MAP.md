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
| `lib/longlive/store.tsx` | The single state container: `mode`, `eraId`, `lensId`, overlays, era-scroll snapshot, `ReturnPoint` doorway back-to-position stack (`pushReturnPoint`/`popReturnPoint`) |
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
| `components/longlive/TopBar.tsx` | Sticky top bar + the 4-tab `ModeToggle`; hosts `TimelineScrubber` in era mode |
| `lib/longlive/track-video.ts` | Pairs a track with a playable video. Exact match on normalised titles — **never strip edition qualifiers** like "(Taylor's Version)" |
| `components/longlive/TrackGuideBar.tsx` | Full-width bar under the lyric, in the retired Spotify player's slot; opens `TrackGuide` |
| `components/longlive/TrackGuide.tsx` | Full-screen track-guide modal; plays a paired song video inline (~20% of tracks pair) |
| `components/longlive/TheoryGuide.tsx` | Full-screen theories & eggs modal shell; scroll-to-highlight + `ReturnPoint` pop on close |
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
| `packages/core/src/devices.ts` | `upsertDevice()` — the one write path, service-role only, called from the register route |
| `apps/web/app/api/devices/register/route.ts` (+ `.test.ts`) | `POST /api/devices/register` — upsert-by-`device_id`, same call for first registration and token refresh |
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
- `apps/web/components/longlive/MerchSection.tsx` — composition only (~165 lines): marquee, sticky rail, three sections, submit form. Links out only; no cart, no checkout (item 4a standing rule).
- `apps/web/components/longlive/merch/MerchMarquee.tsx` — flashing-bulb hero. Staggered `animationDelay`; relies on `globals.css`'s blanket `prefers-reduced-motion` `!important` rule, so the animation must stay a CSS `animation` (a JS timer would escape it).
- `apps/web/components/longlive/merch/MerchSectionRail.tsx` — sticky 3-section rail + scrollspy. Offset comes from `measureChromeBottom()` re-read on scroll/resize, NEVER a constant. Tags itself `data-ll-merchrail` but is deliberately NOT wired into `chrome-offset.ts` — nothing sticky sits below it.
- `apps/web/components/longlive/merch/EraSpine.tsx` — era filter spine. **Never use `scrollIntoView` here**: with `block:'nearest'` it scrolls the window too and hijacked page position on mount. Scroll the track's `scrollLeft` directly. 0 → em-dash + `disabled`, never "0".
- `apps/web/components/longlive/merch/MerchStyleSection.tsx` — the "Seen on Taylor" section: spine wiring, the REAL filters, tally, grid, pager. **No garment-type filter exists — `Product` has no `kind` field, deliberately.**
- `apps/web/components/longlive/merch/MerchCard.tsx` — split "On Taylor | the piece" card; exact-vs-similar with `altNote` INLINE (a hover tooltip is invisible on touch — that was the bug).
- `apps/web/components/longlive/merch/MerchEmptyPanel.tsx` — honest placeholder for the two empty buckets. Never fabricates products.
- `.merch-shell` in `apps/web/app/globals.css` — 11 `--merch-*` tokens. Merch deliberately opts OUT of era skinning; do not "unify" it back into the nine `--era-*` vars.
- `apps/web/components/longlive/SubmitLinkForm.tsx` — shared by both sections. Honeypot is off-screen, NOT `display:none`.
- `scripts/apps-script/submissions-doPost.gs` — Apps Script for the sheet. Joey deploys it; shared-secret gated.
- `docs/ops/community-merch-submissions.md` — Joey-facing setup: Apps Script, Resend domain, `vercel env add`.

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



