# MAP.md

<!-- The purpose of this file is to make codebase exploration unnecessary — for
     the orchestrator AND for every agent it briefs. If anyone ever has to grep
     around asking "where does X live", that is a MAP.md bug: fix it here.
     Cap: 150 lines.

     SCOPE NOTE: this is the top-level map. It is deliberately shallow — deepen
     a row the first time a session has to go looking inside it, rather than
     pre-filling detail nobody has needed yet. -->

## Where the authority lives

`CLAUDE.md` is the operating manual and outranks this file. The durable
reference docs it points at:

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
| `docs/agents/runners.md` | Scheduled runners — all on Wyatt's account |
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

## The kit layer

| Path | Responsibility |
|------|----------------|
| `.claude/settings.json` | Tracked. Permissions, hooks, model pin (`opus`), statusline |
| `.claude/hooks/triage.sh` | `UserPromptSubmit` — restates the routing rule every prompt |
| `.claude/hooks/guard.sh` | `PreToolUse` (Bash) — deterministic deny list, incl. social real-send |
| `.claude/hooks/post-edit.sh` | `PostToolUse` (Edit/Write) — prettier on every edited file |
| `.claude/hooks/checkpoint-gate.sh` | `Stop` — blocks ending a turn on stale `STATE.md` |
| `.claude/statusline.sh` | Model, context %, usage-limit gauge, branch |
| `.claude/agents/*.md` | scout, researcher, grunt, executor, reviewer, architect |
| `.claude/skills/pause/SKILL.md` | Usage-limit pause/resume protocol |
| `.claude/commands/` | Pre-existing project slash commands (design-debate, marketing) |
| `PLANtemplate.md` | Copy to `PLAN.md` when a task touches >~3 files |
| `PLAN.md` | Live plan: era reader rework (5 sequenced PRs) |
| `docs/OPERATINGMANUAL.md` | The kit's own long-form manual |

## The longlive reader (`apps/web`) — read `docs/longlive-experience.md` first

The whole reader is ONE client page: `app/page.tsx` → `LongLive.tsx`, with
React context state in `lib/longlive/store.tsx`. **There are no routes for
eras/threads/mood/clownbot** — `?item=`/`?lens=`/`?era=`/`?guide=`/`?song=` are
read once on mount (`deepLink.ts`) and never written back.

| Path (under `apps/web/`) | Responsibility |
|---|---|
| `lib/longlive/store.tsx` | The single state container: `mode`, `eraId`, `lensId`, overlays, era-scroll snapshot, `ReturnPoint` doorway back-to-position stack (`pushReturnPoint`/`popReturnPoint`) |
| `lib/longlive/tags.ts` | `ContentTag` — the 5 authored topic tags. **Does not re-export the type; import `ContentTag` from `./types`** |
| `lib/longlive/filters.ts` | `FilterId` (the 5 tags + `Videos`), `ALL_FILTERS`, `filterMatches`, `filtersForEntry`, `filterForThread` (LensId→FilterId, exhaustive) |
| `lib/longlive/anchor-date.ts` | Sort-key resolution for undated items. `displayDate` is null unless `via === 'exact'`; `via: 'clamped'` is a real date pulled inside an era's window (P3 step 14a) |
| `components/longlive/FilterBar.tsx` | The ONE global sticky filter row. Mounted once by `EraStream`, never per era |
| `lib/longlive/era-feed.ts` | Pure feed logic: `EraFeedEntry` (4 kinds), `mergeEraFeed`, `visibleFeed` — one signature each (P3 step 14b). Doorway construction in `doorways.ts`, spacing in `space-doorways.ts` |
| `lib/longlive/doorways.ts` | Builds `thread`/`egg` doorway entries (`threadDoorwaysForEra` clamps out-of-window anchors, `eggDoorwaysForEra`); `theoryThreadId` — the R4 theory→thread mapping, shared with `TheoryCard.tsx` |
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
| `components/longlive/EraFeedList.tsx` | Renders `EraSection`'s merged feed: dispatches each `EraFeedEntry` kind to the right card component |
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
| `apps/web/lib/longlive/clown-battery-corpus.ts` (+ `-attacks.ts`, `-attacks-b.ts`, `-tier-b.ts`, `.test.ts`) | Red-team corpus (53 attacks, 21 Tier B probes), ported + extended |
| `apps/web/lib/longlive/clown-board.ts` (+ `.test.ts`) | Both prefill columns, pure/deterministic |
| `apps/web/lib/longlive/clown-fallback.ts` (+ `.test.ts`) | Zero-model card composer |
| `apps/web/lib/longlive/clown-starters.ts` (+ `.test.ts`) | Column item → composer prefill string |
| `apps/web/lib/longlive/clown-names.ts` (+ `.test.ts`) | Ported name registry |
| `apps/web/lib/longlive/clown-client.ts` (+ `-prompt.ts`, `.test.ts`) | The one model call; tier as a named constant; `CLOWN_MODEL_DISABLED` kill switch |
| `apps/web/lib/longlive/clown-answer.ts` | `ClownAnswer` — the one client-facing shape |
| `apps/web/lib/longlive/clown-gate.ts` (+ `.test.ts`) | Output re-screen |
| `apps/web/lib/longlive/clown-usage.ts` (+ `.test.ts`) | Ported cap reservoir |
| `apps/web/components/longlive/ClownChat.tsx` | App-panel chrome (titlebar, fullscreen toggle, docked composer) + transcript |
| `apps/web/components/longlive/ClownMessageRow.tsx` | One transcript turn — user bubble + bot reply (split out of ClownChat.tsx, 300-line cap) |
| `apps/web/components/longlive/ClownBoard.tsx` | The two columns |
| `apps/web/components/longlive/ClownItemCard.tsx` | One column item / one source card |
| `scripts/check-clown-battery.mjs` | `clown:battery` CI script (deterministic, no API key) |
| `docs/proposals/2026-08-13-clownbot-shelved-content.md` | Build-A content not carried forward |
| `docs/ops/clown-kill-switch.md` | `CLOWN_MODEL_DISABLED` kill switch |

The build-A `clownbot-*` deletions and the `store.tsx`/`LongLive.tsx` wiring
have landed. Not yet landed as of this update (per `PLAN.md`'s "Files touched"
table, still in flight in a parallel step): `app/api/clown/route.ts`,
`clown-seed-example.ts`, and the `share.ts`/`TopBar.tsx` wiring.

## Dead / do-not-touch

- `.claude/worktrees/` — ~30 registered git worktrees, excluded via
  `.git/info/exclude`. Never delete, never `git clean`.
- `scripts/social/social-poster-workflow.test.ts.tmp` — untracked scratch owned
  by another session. Leave it exactly as-is.

## Community research (2026-08-14, PR #2110)

- `data/communities.json` — 30 verified Swiftie communities, 8 platforms, each with verification provenance. NOT wired into the app.
- `data/communities-report.md` — landscape narrative, top 10, niches, and what is deliberately absent.
- `sources.md` — every directory/thread/article mined, plus the platform blockers, so this is re-runnable.

## Community + Merch (2026-08-14, PR pending)

- `apps/web/lib/longlive/communities.ts` — types + `COMMUNITIES` + grouping helpers. Re-exports the three data files below.
- `apps/web/lib/longlive/communities-data-{a,b,c}.ts` — the 30 entries, transcribed verbatim from `data/communities.json`. Split only for the 300-line cap; treat as one dataset. **15 of 30 have `memberCount: null` BY DESIGN** — Reddit blocks automated access. Never substitute 0.
- `apps/web/lib/longlive/merch.ts` — merch catalogue. `shopTheLook` (151 items) is read LIVE off `CONTENT`, never re-authored. `officialStore`/`fanMade` are genuinely empty.
- `apps/web/lib/longlive/submit-link.ts` — validation, domain/platform derivation, client-id hashing, and the three sinks. **Each sink is independently optional; a missing one must never fail a submission.** `neutralizeCell` here and `neutralizeCell_` in the Apps Script are the SAME rule deliberately duplicated — both sides of the sheet trust boundary. Change one, change both.
- `apps/web/app/api/submit-link/route.ts` — the public endpoint. Honeypot + per-IP rate limit copied from `/api/feedback`. **Never fetches the submitted URL** (SSRF).
- `apps/web/components/longlive/CommunitySection.tsx` — directory grouped by platform. Verification badge shows only when NOT verified; flags render above descriptions.
- `apps/web/components/longlive/MerchSection.tsx` — links out only; no cart, no checkout (item 4a standing rule).
- `apps/web/components/longlive/SubmitLinkForm.tsx` — shared by both sections. Honeypot is off-screen, NOT `display:none`.
- `scripts/apps-script/submissions-doPost.gs` — Apps Script for the sheet. Joey deploys it; shared-secret gated.
- `docs/ops/community-merch-submissions.md` — Joey-facing setup: Apps Script, Resend domain, `vercel env add`.
