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
| `lib/longlive/store.tsx` | The single state container: `mode`, `eraId`, `lensId`, overlays, era-scroll snapshot |
| `lib/longlive/tags.ts` | `ContentTag` — the 5 authored topic tags. **Does not re-export the type; import `ContentTag` from `./types`** |
| `lib/longlive/filters.ts` | `FilterId` (the 5 tags + `Videos`), `ALL_FILTERS`, `filterMatches`, `filtersForEntry`, `filterForThread` (LensId→FilterId, exhaustive) |
| `lib/longlive/anchor-date.ts` | Sort-key resolution for undated items. `displayDate` is null unless the date is real |
| `components/longlive/FilterBar.tsx` | The ONE global sticky filter row. Mounted once by `EraStream`, never per era |
| `lib/longlive/era-feed.ts` | Pure feed logic: `EraFeedEntry` (4 kinds), `mergeEraFeed`, `visibleFeed`. Doorway construction lives in `doorways.ts`, spacing in `space-doorways.ts` — split out to stay under 300 lines |
| `lib/longlive/doorways.ts` | Builds `thread`/`egg` doorway entries from `lenses.ts`/`theories.ts` (`threadDoorwaysForEra`, `eggDoorwaysForEra`) |
| `lib/longlive/space-doorways.ts` | `spaceDoorways`/`DOORWAY_MIN_GAP` — spreads doorways through an already-merged feed, never drops one |
| `lib/longlive/feed-tiers.ts` | Card silhouette/tier scoring — visual only, never order |
| `lib/longlive/lenses.ts` | **2473 lines.** THREADS (6 narrative galleries), EGG_NODES, CLUE_PAIRS, motifs |
| `lib/longlive/progress.ts` | The SSR-safe localStorage pattern — copy this for any persisted UI state |
| `lib/longlive/useBackDismiss.ts` | Module-level LIFO overlay stack; catches the OS back gesture |
| `components/longlive/EraStream.tsx` | Scrolls all eras; its scroll listener sets the active era |
| `components/longlive/EraSection.tsx` | **521 lines.** One era: hero, lyric, player, guide pills, filter, feed, videos rail |
| `components/longlive/TopBar.tsx` | Sticky top bar + the 4-tab `ModeToggle`; hosts `TimelineScrubber` in era mode |
| `lib/longlive/track-video.ts` | Pairs a track with a playable video. Exact match on normalised titles — **never strip edition qualifiers** like "(Taylor's Version)" |
| `components/longlive/TrackGuideBar.tsx` | Full-width bar under the lyric, in the retired Spotify player's slot; opens `TrackGuide` |
| `components/longlive/TrackGuide.tsx` | Full-screen track-guide modal; plays a paired song video inline (~20% of tracks pair) |
| `components/longlive/TheoryGuide.tsx` | Full-screen theories & eggs modal |
| `components/longlive/ThreadsMode.tsx` | Thread gallery + thread detail |
| `components/longlive/FeedbackButton.tsx` | Fixed bottom-right, `z-[71]`, POSTs to `/api/feedback` |

## Commands worth knowing

- Test: `npm test` (vitest) · E2E: `npm run test:e2e`
- Typecheck: `npm run typecheck` · Lint: `npm run lint` · Format: `npm run format`
- Build: `npm run build`
- Content gates: `npm run check:generated`, `check:content-ownership`,
  `check:voice`, `validate:content`, `validate:social`

## Dead / do-not-touch

- `.claude/worktrees/` — ~30 registered git worktrees, excluded via
  `.git/info/exclude`. Never delete, never `git clean`.
- `scripts/social/social-poster-workflow.test.ts.tmp` — untracked scratch owned
  by another session. Leave it exactly as-is.
