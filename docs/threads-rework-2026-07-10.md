# Threads rework + day-level dates — 2026-07-10 initiative tracker

**Read this first if you're picking this up cold** (new session, session-limit
interruption, or a different founder's agent). This doc is the source of
truth for status — check here before re-deriving anything from git history.

## Hand-off packages (GitHub issues)

Opened 2026-07-10 so Wyatt's session (which has budget when Joey's/Claude's
runs low) can pick up a self-contained package without needing this
conversation's context or v0 access. Each links back to this doc.

- [#369](https://github.com/JW-Incorporated/swift2/issues/369) — WS1 final
  Codex confirmation review
- [#370](https://github.com/JW-Incorporated/swift2/issues/370) — Codex
  review backlog for PR #332 (4 threads)
- [#371](https://github.com/JW-Incorporated/swift2/issues/371) — Mobile
  spot-check for PR #332's 4 threads
- [#372](https://github.com/JW-Incorporated/swift2/issues/372) — The Runway
  thread integration — **done, PR #425 open**, issue left open pending its
  Codex review (folded into the same review backlog as #370)

## ⚠️ PENDING CODEX REVIEW — do not merge until this section is empty

Codex hit its usage limit mid-session on 2026-07-10 (retry suggested ~10:39
AM). Joey approved continuing to build with careful self-review in the
meantime rather than blocking, on the explicit condition that this gets
tracked so nothing merges unreviewed. **Whoever picks this up: run
`/codex:adversarial-review` (or `/codex:review`) on each branch below before
merging, fix any findings, then remove it from this list.**

- [ ] `content/thread-taylors-version` (worktree `../Swift2-thread-tv`) — PR
  #332 (draft): https://github.com/JW-Incorporated/swift2/pull/332. **Now
  covers Taylor's Version, The Decode, Love Story, AND The Proposal**
  (bundled onto one branch since Codex went down mid-session — four separate
  commits, still individually reviewable). Zero Codex review so far on any
  of the four. Self-reviewed only — see the PR description for what was
  caught in each (a vaultTracks data bug, a wrong Spotify ID, a decode.ts
  era-id mismatch, a Love Story background/backgroundImage style conflict;
  Proposal had no code bug — a suspected Getty hotlink-protection issue
  turned out to be a one-off dev-server image load stall, confirmed by
  reloading and re-checking all 7 beats). All four manually verified in a
  running dev server (desktop) — mobile viewport not yet spot-checked on
  any of them.
- [ ] `content/thread-runway` (worktree `../Swift2-thread-runway`) — PR
  #425 (draft): https://github.com/JW-Incorporated/swift2/pull/425. All 12
  `RUNWAY_LOOKS` entries now carry real credited photos instead of
  placeholders. Zero Codex review. Self-reviewed and desktop-verified in a
  running dev server (all 12 eras' feature + gallery photos, re-theming,
  scrubber sync) — mobile not spot-checked (browser-resize tool didn't
  change the rendered viewport this session). Built off `main`, not
  stacked on `content/thread-taylors-version` — expect a small merge
  conflict in `ThreadsMode.tsx`'s import list/JSX when both land.
- [ ] `content/day-level-dates` (worktree `../Swift2-datebackfill`) — DID get
  a full adversarial review + fixes, and a separate date fact-check pass +
  fixes (both real, both completed before the quota hit — see the two
  commits with "Codex" in their messages). Only the *final confirmation*
  review after those fixes got stuck for 43 minutes on the quota wall and
  was canceled. Needs one more pass to confirm the fixes actually landed
  clean, not a from-scratch review.

## Why this exists

Joey's brief (2026-07-10): the Threads section (`/` → Threads tab,
`ThreadsMode.tsx` + `apps/web/lib/longlive/lenses.ts`) is thin enough to cost
us users, and every era's content dates are month/year-only when day-level
precision is knowable. Both need real, ground-up work, not polish. Directive:
be strategic, parallelize across Codex/Gemini/v0/Claude, and make sure the
work survives a session getting cut off (it did, once already, on
2026-07-09 — see chat history if curious).

## Tool fleet actually available in this repo

- **Codex CLI** (`codex` on PATH, logged in via ChatGPT) — same account/API as
  ChatGPT. Also reachable via the `codex:rescue` skill / `codex-rescue` agent.
- **Gemini CLI** (`gemini` on PATH, authenticated) — the MCP registration for
  it in `~/.claude.json` is broken (`command: "\\"`), but the raw CLI works
  fine via `gemini -p "<prompt>"`. Use the CLI directly, not the MCP entry.
- **v0** (`mcp__v0__*` tools) — existing project `C9vVM1eei8p` ("Feed design
  exploration", used for the tiered-card feature). Reuse this projectId for
  continuity/design-system consistency across chats.
- Claude subagents (this session's `Agent` tool) — used for source-verification
  research (WebSearch/WebFetch), where fabrication risk means an ungrounded
  CLI call isn't good enough on its own.

## Decision already locked (see `docs/decisions.md` for the real entry once written)

**Threads content architecture:** auto-derive from tagged content items,
*not* keep the hand-authored `lenses.ts` arrays long-term. New content
(relationship sightings, fashion moments, easter eggs, etc.) should flow into
the relevant thread automatically once tagged, the same way era moments
already flow from `supabase/seed/content/**` into the vault. Approved by
Joey 2026-07-10. Implementation is WS2 below — foundational, not delegated.

## Workstreams

| WS | What | Branch/worktree | Owner | Status |
|----|------|------------------|-------|--------|
| **WS1** | Day-level date backfill across all 12 era seed files | `content/day-level-dates` (worktree at `../Swift2-datebackfill`) | Codex CLI (delegated), Claude committed + fixed fact-check findings | 🟡 10/12 files have real partial day-coverage (20-95% depending on how much is actually sourceable), committed in 11 small per-file/fix commits on `content/day-level-dates`, not pushed yet. `midnights.mjs` and `speak-now.mjs` are still fully untouched (0 items). A Codex fact-check pass (`/codex:adversarial-review`) sample-checked the added dates and found 4 real date/event-type mismatches (day was real but anchored to the wrong event — e.g. release date used for a chart-report date) — all 4 fixed. **That check was a sample, not exhaustive** — per its own next-steps, a fuller re-audit of chart/report/certification-dated items for the same release-vs-report drift is still open. |
| **WS2** | Threads content architecture: tag-based derivation replacing hand-authored `lenses.ts` arrays | `feature/threads-content-architecture` (worktree at `../Swift2-threads-rework`) | Claude (foundational — not delegated) | ✅ PR #249 open: https://github.com/JW-Incorporated/swift2/pull/249 — reviewed (adversarial + confirming pass, both clean), not yet merged |

**WS2 implementation notes:** added `ContentItem.threadIds?: LensId[]`
(`types.ts`). Resolved in `build()` (`content.ts`) via
`defaultThreadIdsForTags()` — `Relationship` tag implies `love-story`,
`Fashion` implies `fashion`, no authoring action needed (42+ real relationship
items and real fashion items already in `supabase/seed/content/**` get picked
up automatically, no re-tagging required). The other four threads
(`taylors-version`, `easter-eggs`, `hidden-clues`, `the-proposal`) have no
1:1 tag mapping, so they're explicit opt-in via a `threadIds` field on the
seed row, threaded through `scripts/sync-longlive-content.mjs`. New selector:
`contentForThread(threadId)` in `apps/web/lib/longlive/threads.ts`. Tests in
`threads.test.ts`.

Ran a Codex adversarial review (`/codex:adversarial-review`) before calling
this done, per CLAUDE.md rule 3 — it correctly found 4 real issues (explicit
threadIds overrode instead of merged with tag defaults; two seed items
miscategorized as `relationship` when they're friendship/feud content, which
would've polluted Love Story; `threadIdsFrom` silently swallowed typos
instead of failing; `docs/decisions.md` read as though the UI already
consumed this). All 4 fixed in a follow-up commit; a confirming (non-
adversarial) review is running now.

**Not done yet:** wiring any thread's actual UI to `contentForThread()`
(waiting on the v0 designs above to land first — rewiring the old UI now
would be thrown away), and explicitly tagging content for the other four
threads. `docs/decisions.md`'s 2026-07-10 entry is explicit that this is
phase 1 of 2 — don't treat Threads as already rendering from tagged content.
| **WS3** | Love Story rework — real relationship + single-period timeline ending in the 2026 wedding | `content/thread-love-story` | v0 (UX) + Claude (content sourcing) | 🟡 v0 chat done: https://v0.app/chat/nhR4XzA7UFE |
| **WS4** | The Runway rework — picture-heavy, guided era style-evolution story | `content/thread-runway` | v0 (UX) + Claude (photo/content sourcing) | 🟡 v0 chat done: https://v0.app/chat/b363XfJaly6 |
| **WS5** | Taylor's Version rework — masters-ownership-over-time visual + deeper per-album narrative | `content/thread-taylors-version` | v0 (UX) + Claude (content sourcing) | 🟡 v0 chat done: https://v0.app/chat/e5KdCTYOjZt |
| **WS6** | The Clue Web — keep the home→trail→constellation structure (Joey likes the mechanic), fix intuitiveness/onboarding | `content/thread-clue-web` | v0 (UX refinement, not rebuild) | 🟡 v0 chat done: https://v0.app/chat/gG8tkq1XeX4 |
| **WS7** | The Decode — keep plant→payoff mechanic (Joey called it the best of the group), add real depth (more clue pairs + richer browsing) | `content/thread-decode` | v0 (light UX) + Claude (content sourcing) | 🟡 v0 chat done: https://v0.app/chat/ksK1QOyHkdF |
| **WS8** | The Proposal rework — picture-heavy Travis/Taylor story, move past the "pills" layout | `content/thread-proposal` | v0 (UX) + Claude (photo/content sourcing) | 🟡 v0 chat done: https://v0.app/chat/dS5uHBGADCt |

All six v0 chats live in project `C9vVM1eei8p`. 🟡 = design exploration back, not yet
reviewed/integrated into the app. Next step per thread: review the v0 output,
pick/merge the best ideas, then integrate as real components wired to real
(sourced) data — don't ship v0's placeholder copy or invented facts.

Cross-cutting question baked into every WS3–WS8 v0 brief: does the right-side
`ThreadsTimeline` career scrubber (`apps/web/components/longlive/
ThreadsTimeline.tsx`) make sense for this thread, given most threads don't
scroll far enough today to make it functional? Each thread decides
independently — no rule that it must be present.

## Phase 3 (2026-07-10, started): integrate 5 of 6 v0 designs into the live site

Joey reviewed the six v0 chats himself and iterated directly with v0 (see
"iterating with v0 directly" below). Verdict: 5 of 6 are ready to build in —
**everything except The Clue Web**, which stays as-is for now.

**Hard safety rule, per an actual prior incident
([[v0-shared-branch-collision]] in Claude's memory — 2026-07-08, v0 pushed
unannounced commits to a branch Claude was mid-review on): v0 is NEVER given
push/publish/GitHub-sync access to this repo.** All integration work reads
v0's output via the read-only Platform API (`getChat`) only. Every actual
commit, branch, and push happens through normal git in this repo, done by
Claude — never by clicking Publish in v0 or connecting it to GitHub. If a
future session is tempted to "just let v0 open the PR," don't — re-read this
section first.

**Iterating with v0 directly:** Joey can keep replying in any of the 6 chat
URLs to refine a design. Whoever integrates a thread should re-fetch the
chat via `getChat` right before starting that thread's work (not rely on
what an earlier session already read) in case it changed.

### Execution model

- **Claude**: the actual code integration — porting each v0 component into
  `ThreadsMode.tsx` (or new dedicated files), wiring to real data, tests.
  Kept on Claude specifically because it requires deep context on this
  codebase already built up this session; re-deriving that in a fresh
  subagent per thread would be wasteful.
- **Codex** (`codex:adversarial-review` / `codex:review`): review pass on
  every thread's integration before it's called done, same bar as WS1/WS2.
- **Gemini CLI** (`gemini -p "..."`, direct — MCP registration for it is
  broken, see the gotcha above): a second-opinion pass, used for whichever
  parts benefit most from independent verification (fact-checking sourced
  content is the best fit found so far).
- **Claude subagents with WebSearch**: parallel real-content research (photo
  sourcing with credits, narrative depth, date verification) — these don't
  need this session's codebase context, just the sourcing/no-fabrication
  rules, so they run well in the background while integration proceeds.

### Sequencing

Integration (wiring into the shared `ThreadsMode.tsx`, testing, PR) happens
**one thread at a time** — parallel edits to a shared file across agents is
exactly the kind of collision this whole initiative exists to avoid.
Content-research prep (photos, narrative) for later threads can and does run
in parallel with an earlier thread's integration, since research doesn't
touch code.

Planned order (easiest data mapping → most new content needed), status
updated as each lands:

| Order | Thread | Why this position | Status |
|---|---|---|---|
| 1 | **Taylor's Version** | Clearest data mapping (`RERECORDS` already fits); mostly needs deeper narrative text, not new photos | ✅ PR #332: https://github.com/JW-Incorporated/swift2/pull/332 |
| 2 | **The Decode** | Mostly a browsing/filtering UX enhancement on an already-rich dataset (42 `CLUE_PAIRS` — corrected count, not the 117 an earlier session note guessed) | ✅ PR #332 (same as row 1) |
| 3 | **Love Story** | Needs a new `SINGLE_PERIODS` dataset alongside `RELATIONSHIPS` (see data-shape note below); moderate | ✅ PR #332 (same as rows 1-2) |
| 4 | **The Proposal** | Needs real sourced photos per beat — heavier research lift | ✅ PR #332 (same branch as rows 1-3) |
| 5 | **The Runway** | Needs the most new content: multiple real sourced photos per era (not the current 1), plus narrative on how/why style changed each era | ✅ PR #425: https://github.com/JW-Incorporated/swift2/pull/425 (own branch `content/thread-runway`, off `main` — not stacked on PR #332, expect a small merge conflict in `ThreadsMode.tsx` when both land) |

**Data-shape note on Love Story:** `contentForThread('love-story')` (WS2)
returns individual dated *moments* (~40 of them), not relationship *spans*
— there's no field linking a moment to which relationship it belongs to.
Aggregating moments into spans isn't a good fit for the tag-derivation
mechanism; relationship spans (name/start/end/songs/note) stay a small,
hand-curated dataset in `lenses.ts` (it's ~10-12 stable entries over a
20-year career, not high-volume weekly content — the "flows in
automatically" problem WS2 solved doesn't really apply at this
granularity). Single/solo periods get the same treatment: a small dedicated
dataset, not derived from tagged content.

## Gotcha: Codex CLI sandbox root vs. git worktrees

`codex-companion.mjs`'s write sandbox anchors to whatever directory it's
*invoked from* (cwd at launch), not to the git repo it operates on. Launching
a `task`/`review` job for a sibling worktree (e.g.
`../Swift2-datebackfill`) from within the main `Swift2` checkout gets its
writes rejected as "outside the project" — happened once already on
2026-07-10 (WS1's first attempt, no files touched, caught by checking
`codex-companion.mjs result <job-id>` directly rather than trusting the
launch confirmation). Fix: `cd` into the actual worktree directory *before*
invoking `node codex-companion.mjs ...`, so its own `workspaceRoot` resolves
there. Always verify a job's `workspaceRoot` in its status JSON matches the
directory you actually wanted it to write to.

## How to resume if a session dies mid-work

1. Read this doc top to bottom.
2. `git branch -vv` and `gh pr list --state all` to see what's actually
   landed vs. still local/uncommitted.
3. Check `mcp__v0__findChats` (or https://v0.app, project `C9vVM1eei8p`) for
   the six thread-redesign chats — each chat's title says which thread.
4. Check the `content/day-level-dates` worktree
   (`../Swift2-datebackfill`) for uncommitted date-backfill progress before
   assuming it needs to restart.
5. Update the status column in this table as work lands — don't let it go
   stale (this is exactly how the previous WIP got lost).

## Definition of done (per workstream, per CLAUDE.md)

Spec'd, real sourced content (no fabrication), Codex review clean, works
mobile + desktop, tests updated, this doc's status row flipped to ✅ with the
merged PR number.
