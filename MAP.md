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
| `docs/dev-quickstart.md` | **Read before running anything** — commands, env, repo map |
| `docs/longlive-experience.md` | **Read before touching the shipped web reader** |
| `docs/engineering-lessons.md` | **Defects that cost >1 review round.** Read before `apps/web`, the safety gates, or the community dataset |
| `docs/{cto-role,vision,architecture}.md` | Engineering role + authority limits; what the product is for; stack + coding standards |
| `docs/{roadmap,decisions,definition-of-done}.md` | Who owns what; anything expensive to reverse (append BEFORE implementing); the long form of § Definition of done |
| `docs/agents/{runners,codex}.md` | Scheduled runners (all on Wyatt's account); how a session actually runs a Codex review (`--background`, `result <job-id>`) |

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
| `.claude/hooks/{triage,guard,post-edit,checkpoint-gate}.sh` | `UserPromptSubmit` restates the routing rule every prompt; `PreToolUse` deterministic deny list incl. social real-send; `PostToolUse` prettier per edited file; `Stop` blocks ending a turn on stale `STATE.md` |
| `.claude/{statusline.sh,agents/*.md,skills/pause/,commands/}` | Model/context%/usage gauge/branch; scout, researcher, grunt, executor, reviewer, architect; usage-limit pause protocol; project slash commands |
| `PLANtemplate.md` / `PLAN.md` | Copy the template to `PLAN.md` when a task touches >~3 files. `PLAN.md` holds the LAST completed plan until the next one overwrites it — treat it as history, not as work in flight |
| `docs/OPERATINGMANUAL.md` | The kit's own long-form manual |

## The longlive reader (`apps/web`) — read `docs/longlive-experience.md` first

The whole reader is ONE client page: `app/page.tsx` → `LongLive.tsx`, with
React context state in `lib/longlive/store.tsx`. **There are no routes for
eras/threads/mood/clownbot** — `?item=`/`?lens=`/`?era=`/`?guide=`/`?song=` are
read once on mount (`deepLink.ts`) and never written back.

| Path (under `apps/web/`) | Responsibility |
|---|---|
| `lib/longlive/store.tsx` | The single state container: `mode`, `eraId`, `lensId`, overlays, era-scroll snapshot, `ReturnPoint` doorway back-to-position stack (`pushReturnPoint`/`popReturnPoint`) |
| `lib/longlive/{tags,filters}.ts` | The 5 authored topic tags — **`tags.ts` does not re-export the type; import `ContentTag` from `./types`** — and `FilterId` (those 5 + `Videos`), `ALL_FILTERS`, `filterMatches`, `filtersForEntry`, `filterForThread` (LensId→FilterId, exhaustive) |
| `lib/longlive/anchor-date.ts` | Sort-key resolution for undated items. `displayDate` is null unless `via === 'exact'`; `via: 'clamped'` is a real date pulled inside an era's window (P3 step 14a) |
| `components/longlive/FilterBar.tsx` | The ONE global sticky filter row. Mounted once by `EraStream`, never per era |
| `lib/longlive/era-feed.ts` | Pure feed logic: `EraFeedEntry` (4 kinds), `mergeEraFeed`, `visibleFeed` — one signature each (P3 step 14b). Doorway construction in `doorways.ts`, spacing in `space-doorways.ts` |
| `lib/longlive/doorways.ts` | Builds `thread`/`egg` doorway entries (`threadDoorwaysForEra` clamps out-of-window anchors, `eggDoorwaysForEra`); `theoryThreadId` — the R4 theory→thread mapping, shared with `TheoryCard.tsx` |
| `lib/longlive/space-doorways.ts` | `spaceDoorways`/`DOORWAY_MIN_GAP` — spreads doorways through an already-merged feed, never drops one. A displaced doorway is marked `displaced` and STOPS being a scrubber anchor |
| `lib/longlive/scrubber-anchor-corpus.test.ts` | Locks zero date inversions across all twelve real eras. Was 44 |
| `lib/longlive/bottom-nav-focus.ts` | Pure focus predicate for `BottomNav` — `focusout` does NOT fire on DOM removal, so this re-derives from `document.activeElement` |
| `lib/longlive/feed-tiers.ts` | Card silhouette/tier scoring — visual only, never order |
| `lib/longlive/lenses.ts` | **2473 lines.** THREADS (6 narrative galleries), EGG_NODES, CLUE_PAIRS, motifs |
| `lib/longlive/{progress,useBackDismiss}.ts` | The SSR-safe localStorage pattern — copy it for any persisted UI state; module-level LIFO overlay stack that catches the OS back gesture |
| `components/longlive/EraStream.tsx` | Scrolls all eras; its scroll listener sets the active era. Also hosts `LandingMasthead` and the mount/jump scroll-correction loop (front door is the current era, top of stream) |
| `lib/longlive/era-jump-landing.ts` | Pure: `jumpLandingScrollTop` (lands a jump target below the sticky chrome) and `shouldRunEraJump` (gates EraStream's mount-time jump so a fresh `/` load doesn't jump past the masthead) |
| `lib/longlive/chrome-offset.ts` | `measureChromeHeight()` — the one place that measures live TopBar + FilterBar height; every jump/scroll/scrubber offset goes through it instead of a hardcoded constant |
| `components/longlive/EraSection.tsx` | One era's wiring: hero, lyric, feed/doorway data, doorway tap → `pushReturnPoint`. Split (P3 step 15, was 826 lines) into the files below — none over 300 |
| `components/longlive/EraFeedList.tsx` | Renders `EraSection`'s merged feed: dispatches each `EraFeedEntry` kind to the right card component |
| `components/longlive/{Moment,VideoMoment,Doorway}Card.tsx` (+ `MomentCardButton.tsx`) | Moment card wrapper (box + inline video play affordance, #2057); body per tier (hero/media/chip/text) + `MomentMeta`/`TagRow`; full-width video-record card (kind `'video'`); thread/egg doorways, same silhouette as a moment card |
| `components/longlive/{EraThreadsPivot,TopBar}.tsx` | The "Threads running through {era}" strip; sticky top bar + `ModeToggle` — **five tabs since `bcc8f39e`** (Eras, Threads, Mood, Clownbot, Community). Labels vs icon-only: `entries.length >= BOTTOM_NAV_ICON_ONLY_THRESHOLD` in `bottom-nav-layout.ts`, **now 6 so five tabs keep their labels**. 320px has only ~1.2px slack — **no label may exceed "Community"** |
| `lib/longlive/track-video.ts` | Pairs a track with a playable video. Exact match on normalised titles — **never strip edition qualifiers** like "(Taylor's Version)" |
| `components/longlive/Track{GuideBar,Guide}.tsx` | Full-width bar under the lyric in the retired Spotify player's slot, opening the full-screen track-guide modal; plays a paired song video inline (~20% of tracks pair) |
| `components/longlive/{TheoryGuide,TheoryCard,ThreadsMode}.tsx` | Full-screen theories & eggs shell (scroll-to-highlight + `ReturnPoint` pop on close); one theory/egg card with badges, sources and the R4 back-link (thread if `theoryThreadId` resolves, else the unconditional "whole section" line); thread gallery + detail |
| `components/longlive/FeedbackButton.tsx` | Fixed bottom-right, `z-[71]`, POSTs to `/api/feedback` |

## Commands worth knowing

- Test: `npm test` (vitest) · E2E: `npm run test:e2e`
- Typecheck: `npm run typecheck` · Lint: `npm run lint` · Format: `npm run format`
- Build: `npm run build`
- Content gates: `npm run check:generated`, `check:content-ownership`,
  `check:voice`, `validate:content`, `validate:social`

## Clown bot rebuild (build B) — new files this workstream

`docs/decisions.md` 2026-08-13 "Clownbot rebuild"; `docs/longlive-experience.md`
§7 describes the surface. All paths below are under `apps/web/`, and most carry
a sibling `.test.ts` — assume one exists.

| Path | What |
|---|---|
| `app/api/clown/route.ts` | The endpoint. Stage order is load-bearing: rate-limit → kill switch → crisis → input blocklist → `screenConversation` → retrieval → compose-or-fallback → output gate |
| `lib/longlive/clown-index.ts` (+ `.integration.test.ts`, `clown-index-status.test.ts`) | Retrieval index; blocklist pre-filter at build time. `status: ItemStatus`, NOT a boolean — a debunked item must stay distinguishable from a confirmed one |
| `lib/longlive/clown-retrieve.ts` | Deterministic retrieval + `detectRecencyIntent()` |
| `lib/longlive/clown-{blocklist,safety}.ts` (+ `-gates.ts` each) | `screenTopic()`, per-category phrase lists; input/output safety + crisis reuse. **Change one direction, test both** — see `docs/engineering-lessons.md` |
| `lib/longlive/clown-battery-corpus.ts` (+ `-attacks.ts`, `-attacks-b.ts`, `-tier-b.ts`) | Red-team corpus: 53 attacks, 21 Tier B probes, 48 legit. Pinned by exact-equality assertions |
| `lib/longlive/clown-{board,starters}.ts` | Both prefill columns, pure/deterministic; column item → composer prefill string |
| `lib/longlive/clown-{fallback,answer,gate}.ts` | Zero-model card composer; `ClownAnswer`, the ONE client-facing shape (keeps `counterpoint` distinct — flattening hides what keeps a speculation bot honest); output re-screen |
| `lib/longlive/clown-{client,names,usage}.ts` (+ `clown-prompt.ts`) | The one model call, tier as a named constant, `CLOWN_MODEL_DISABLED` kill switch; name registry; cap reservoir |
| `lib/longlive/clown-seed-example.ts` | The pre-loaded example Q&A shown on load |
| `components/longlive/Clown{Chat,MessageRow,Board,ItemCard}.tsx` | App-panel chrome (titlebar, fullscreen toggle at `100dvh`, docked composer) + transcript; one turn; the two columns; one column item / source card |
| `scripts/check-clown-battery.mjs` | `clown:battery` CI script (deterministic, no API key) |
| `docs/ops/clown-kill-switch.md`, `docs/proposals/2026-08-13-clownbot-shelved-content.md` | The kill switch; build-A content not carried forward |

## Dead / do-not-touch

- `.claude/worktrees/` — ~30 registered worktrees, excluded via
  `.git/info/exclude`. Never delete, never `git clean`.
- `social-poster-workflow.test.ts.tmp` (another session's scratch) and
  `apps/web/{README,AGENTS,CLAUDE}.md` (dev-server scaffolding) — untracked,
  never committed. Leave exactly as-is.

## Community + Merch (2026-08-14, MERGED `109e776a` #2110 + `22314d5b` #2112)

- `data/{communities.json,communities-report.md}` + `sources.md` — 30 verified communities across 8 platforms with verification provenance; the landscape narrative; every source mined plus the platform blockers, so the research is re-runnable. The JSON is the SOURCE — the app reads the transcribed copy below, so a refresh must update both.
- `apps/web/lib/longlive/communities.ts` — types + `COMMUNITIES` + grouping helpers. Re-exports the three data files below.
- `apps/web/lib/longlive/communities-data-{a,b,c}.ts` — the 30 entries, transcribed verbatim from `data/communities.json`. Split only for the 300-line cap; treat as one dataset. **15 of 30 have `memberCount: null` BY DESIGN** — Reddit blocks automated access. Never substitute 0.
- `apps/web/lib/longlive/merch.ts` — merch catalogue. **`shopTheLook` is 156 products across 151 moments** (a moment holds a `products[]` array — the two counts are NOT the same number, and conflating them has burned three reports). Read LIVE off `CONTENT`, never re-authored. `officialStore`/`fanMade` genuinely empty. **150 of the 156 resolve to a real source photo via `hasRealPrimaryImage()`; 6 do not — never use `images.length`.**
- `apps/web/lib/longlive/submit-link.ts` — validation, domain/platform derivation, client-id hashing, and the three sinks. **Each sink is independently optional; a missing one must never fail a submission.** `neutralizeCell` here and `neutralizeCell_` in the Apps Script are the SAME rule deliberately duplicated — both sides of the sheet trust boundary. Change one, change both.
- `apps/web/app/api/submit-link/route.ts` — the public endpoint. Honeypot + per-IP rate limit copied from `/api/feedback`. **Never fetches the submitted URL** (SSRF).
- `apps/web/{lib/longlive/submit-link,app/api/submit-link/route}.test.ts` — the guarantees: neutralisation, honeypot, rate limit, abort-on-timeout, and **each sink missing individually while the submission still succeeds**. Break one and the contract changed silently.
- `apps/web/components/longlive/CommunitySection.tsx` — **the section SHELL** since `bcc8f39e`: H1 "Community", the 50/50 toggle, and the ONE sticky 44px rail (offset from the live `data-ll-topbar` measurement, never a constant). Hosts `SocialPane` + `MerchSection` as panes. **Exactly one sticky element on this page — never add a second.**
- `apps/web/components/longlive/SegmentedToggle.tsx` — generic segmented control (`options`/`value`/`onChange`). The repo had none; reuse this rather than writing another.
- `apps/web/components/longlive/MerchSection.tsx` — the Merch pane: era sections newest-first, filters, image-first cards. Links out only, no cart, no checkout (item 4a).
- `apps/web/lib/longlive/merch-filters.ts` — `merchByEra()` (contract: `{eraId, eraLabel, count, items}[]`, newest first), `merchMatchesFilter`, `parsePrice`, and **`merchItemImage()` — the ONE place image-vs-monogram is decided. It calls `hasRealPrimaryImage()`; never re-derive it from `images.length`.**
- `apps/web/lib/longlive/filter-chips.tsx` — the shared chip row, extracted so `FilterBar` and merch use ONE implementation (forking it would have been the 4th "two mechanisms for one fact"). **`.tsx` not `.ts` — it contains JSX.** Its two `#fff` literals predate the extraction; they are hardcoded active-chip text and are the known exception to the no-raw-hex rule.
- `apps/web/components/longlive/SubmitLinkForm.tsx` — shared by both sections. Honeypot is off-screen, NOT `display:none`. Sends only `{url, section, hp}`.
- `scripts/apps-script/submissions-doPost.gs` — Apps Script for the sheet. Joey deploys it; shared-secret gated.
- `docs/ops/community-merch-submissions.md` — Joey-facing setup: Apps Script, Resend domain, `vercel env add`.
