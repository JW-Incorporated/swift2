# Threads rework + day-level dates — 2026-07-10 initiative tracker

**Read this first if you're picking this up cold** (new session, session-limit
interruption, or a different founder's agent). This doc is the source of
truth for status — check here before re-deriving anything from git history.

## Status: 5 of 6 Threads shipped, 6th (Clue Web) handed off as a ticket

All 4 PRs from this initiative merged to `main` on 2026-07-10: **#249** (WS2
tag-derivation), **#430** (WS1 day-level dates), **#332** (Taylor's Version /
Decode / Love Story / Proposal), **#425** (Runway) — merged in that order by
Claude, with Joey's explicit go-ahead ("let's merge all these PR"), resolving
real conflicts between them (two seed items where WS1's day-additions and
WS2's category-corrections both needed keeping; a `docs/decisions.md`
entry-ordering conflict; the anticipated `ThreadsMode.tsx` conflict between
#332 and #425). Verified with a full regenerate + validate + typecheck + test
pass after each merge, plus a live browser check on the final tree.

**The Clue Web (6th thread) was handed to Wyatt as issue
[#431](https://github.com/JW-Incorporated/swift2/issues/431)** rather than
built here — v0's chat for it never captured real code (see the issue for
why), so it's a from-scratch implementation guided by a very thorough
prose spec, not a port like the other 5. Branch `content/thread-clue-web`
(worktree `../Swift2-thread-clue-web`) has the handoff doc + reference
sketches committed, no implementation started.

## Hand-off packages (GitHub issues) — status

- [#369](https://github.com/JW-Incorporated/swift2/issues/369) — WS1 final
  Codex confirmation review — **closed, shipped without the 6th round per
  Joey's explicit call**, PR #430 merged
- [#370](https://github.com/JW-Incorporated/swift2/issues/370) — Codex
  review backlog for PR #332 — **open, unresolved**: PR #332 merged with its
  5th confirmation pass never having completed (cut off by the 3:41 PM quota
  wall) — see "Known residual review gap" below
- [#371](https://github.com/JW-Incorporated/swift2/issues/371) — Mobile
  spot-check for PR #332 + Runway's 5 threads — **still open, still
  unresolved**, nothing in this initiative has had mobile verified
- [#372](https://github.com/JW-Incorporated/swift2/issues/372) — The Runway
  thread — **done, PR #425 merged**, but same gap as #332: its 2nd
  confirmation pass never ran either
- [#428](https://github.com/JW-Incorporated/swift2/issues/428) — a false
  alarm Claude filed about Wyatt's CIE tool being deleted; corrected and
  closed same-day after Wyatt's session pushed back with the real branch
  topology. Worth reading if you're ever tempted to compare commits across
  branches without checking `git merge-base --is-ancestor` first.
- [#429](https://github.com/JW-Incorporated/swift2/issues/429) — feedback
  ticket asking Wyatt's CIE pipeline to close tickets when their fix lands
- [#431](https://github.com/JW-Incorporated/swift2/issues/431) — The Clue
  Web thread, handed off whole (see "Status" above)
- [#433](https://github.com/JW-Incorporated/swift2/issues/433) — bug: Runway
  thread content renders oldest-to-newest, backwards vs. the site's
  established newest-first convention (root cause + fix location identified)
- [#434](https://github.com/JW-Incorporated/swift2/issues/434) — Love Story's
  18 entries need the deep per-entry content v0 originally designed (recap,
  impact, theories, photos, auto-derived Era cross-links, clickable
  confidence-tagged song links) — deliberately scoped down when built,
  unblocked now that WS2's tag-derivation infra is merged
- [#435](https://github.com/JW-Incorporated/swift2/issues/435) — bug:
  browser/swipe back doesn't work inside Threads (gallery<->detail, and
  within-thread entry expand/collapse) — the app already has a proven fix
  pattern (`useBackDismiss`) used in 8 other places, just never applied here
- [#436](https://github.com/JW-Incorporated/swift2/issues/436) — Threads and
  Eras don't cross-link anywhere in the shipped UI despite WS2's
  `contentForThread()`/`RelatedId` infrastructure existing with zero
  consumers — the app's core "Eras move forward, Threads cut sideways"
  promise isn't actually built yet, in either direction

## ⚠️ Known residual review gap — read before touching PR #332/#425's content again

Codex hit its usage limit twice on 2026-07-10: first ~10:39 AM (cleared,
resumed), then again after a burst of ~10 review jobs, until 3:41 PM. Joey
approved continuing to build with careful self-review in the meantime, on
the condition it stayed tracked. **What actually happened: WS1 (#430) got 5
full Codex-verified rounds and shipped on Joey's explicit call to skip the
6th. PR #332 and #425 were NOT so lucky** — both had real, multi-round,
Codex-verified fix cycles (detailed below), but the confirmation pass that
would have validated the LAST round of fixes on each got cut off mid-run by
the second quota wall and never re-ran before Joey said "let's merge all
these PR" and they went in. This is not hidden — flagging plainly: **the
final fixes on #332 and #425 are self-verified (typecheck/tests/manual
browser check) but not Codex-confirmed clean.** Given every prior round on
both branches found real issues, treat this as a real, non-zero-probability
gap, not a formality. A cheap, valuable follow-up for whoever has Codex
budget: run one more adversarial review against current `main` covering the
files these branches touched (`lenses.ts`, `ThreadsMode.tsx`,
`components/longlive/{taylors-version,decode,love-story,proposal,runway}/**`)
and fix anything it finds via a normal small PR — no need to reopen #370/#372
for this, just do it and reference them.

**PR #332** (Taylor's Version, Decode, Love Story, Proposal) — 4 Codex review
rounds completed, fixes applied after each: (1) self-caught issues before
first review (vaultTracks bug, wrong Spotify ID, decode.ts era-id mismatch,
Love Story style conflict); (2) fabricated 1989 TV tour-location claim
(Japan/New Zealand — the tour never had a NZ leg), a wedding-beat image
wrongly marked `kind: 'primary'` when it's a stand-in, an accidentally-
committed dev-mode `next-env.d.ts`; (3) 3 more fabricated RERECORDS claims
(Braun/Cadillac ad, wrong Fearless TV announcement date, two wrong chart-
record claims); (4) Calvin Harris note contradicting the dataset's own Joe
Alwyn entry, a verbatim-quote policy violation in BuybackBeat.tsx. Mobile
viewport still not spot-checked (browser-resize tool limitation this
session).

**PR #425** (Runway) — 1 Codex review round completed, fixes applied: a
Debut-caption date error (said "days before" the album released when the
CMA red carpet was actually 13 days after — fixed to "two weeks after"), and
missing test coverage for the new photo invariants (now added: 30 total,
2-3/era, real URLs, credits/captions, primary kind). Mobile not spot-checked.

**WS1** (`content/day-level-dates`, PR #430, merged) — 5 Codex confirmation
rounds completed, real fixes applied every round — this branch surfaced a
recurring bug class (an item's own sourced text states an explicit
chart-cover date, e.g. "the Hot 100 dated Oct. 18, 2025," but the item's
year/month/day fields used a different date — usually an earlier
report/announcement date instead of the actual chart date). Found and fixed
**9 total instances** of this pattern across lover.mjs,
the-life-of-a-showgirl.mjs (+ its content.ts curated duplicate),
folklore.mjs, 1989.mjs, and tortured-poets.mjs (3 instances). A one-off
scanner script was written mid-session to catch this pattern corpus-wide
(not committed — see the commit messages for its logic if useful to
recreate). A 6th confirmation pass ("do a truly exhaustive final sweep, this
needs to be the last one") was about to launch when the 3:41 PM quota wall
hit; Joey opted to ship without it rather than wait. Given the recurrence
rate, there's a real (not zero) chance 1-2 more instances of this exact bug
class remain undiscovered in the merged corpus — a cheap follow-up: rerun
the chart-date scanner pattern (or a real Codex pass) once quota allows.

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
| 1 | **Taylor's Version** | Clearest data mapping (`RERECORDS` already fits); mostly needs deeper narrative text, not new photos | ✅ **MERGED** — PR #332: https://github.com/JW-Incorporated/swift2/pull/332 |
| 2 | **The Decode** | Mostly a browsing/filtering UX enhancement on an already-rich dataset (42 `CLUE_PAIRS` — corrected count, not the 117 an earlier session note guessed) | ✅ **MERGED** — PR #332 (same as row 1) |
| 3 | **Love Story** | Needs a new `SINGLE_PERIODS` dataset alongside `RELATIONSHIPS` (see data-shape note below); moderate | ✅ **MERGED** — PR #332 (same as rows 1-2) |
| 4 | **The Proposal** | Needs real sourced photos per beat — heavier research lift | ✅ **MERGED** — PR #332 (same branch as rows 1-3) |
| 5 | **The Runway** | Needs the most new content: multiple real sourced photos per era (not the current 1), plus narrative on how/why style changed each era | ✅ **MERGED** — PR #425: https://github.com/JW-Incorporated/swift2/pull/425 |
| 6 | **The Clue Web** | UX/onboarding refinement only, not a rebuild — Joey likes the mechanic, found it unintuitive | 🎫 **Handed off, not built** — issue #431: https://github.com/JW-Incorporated/swift2/issues/431 (Wyatt). v0's chat never captured real code for this one — see the issue for why. |

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

## Wyatt's parallel track: the Content Integrity Engine ("Karen")

Not part of this initiative directly, but discovered while assessing his
progress on 2026-07-10 — noting here since it affects the same content files
this initiative touches, and has a real gap worth knowing about.

Wyatt (via a separate, more-capacity Claude Code session, Opus-driven) built
a read-only content-scanning tool at `scripts/content-engine/` (branch
`fix/karen-tickets`, aliased `npm run karen`) that reads the whole
`supabase/seed/**` corpus, reasons about factual/safety/image-quality issues
via a deterministic layer + an LLM agent-review fleet, and files GitHub
issues (`cie` label family: `cie:P0`-`cie:P3`, `cie:fact`, `cie:image`).
Full operator playbook: `scripts/content-engine/RUNBOOK.md` (as of the
commit that added it — see below).

**Status as of 2026-07-10 ~11 AM:** ~284 `cie`-labeled issues filed from a
full-corpus run. Fix-wave commits on `fix/karen-tickets` claim ~274 tickets'
worth of fixes applied (171 factual across 3 waves, 103 of 119 attempted
image fixes across 3 waves + a retry). Only **5 of ~284** `cie` issues are
actually closed on GitHub, though — this is very likely just bookkeeping
debt, not broken automation: the RUNBOOK's own "Finalize" step (step 5) only
generates a committed report, it never closes tickets. If Wyatt wants the
issue tracker to reflect reality, closing fixed tickets needs to be a
deliberate pass (matching commit ticket-number lists like `a2aafa8`'s
against `gh issue close`), not something to expect for free.

**CORRECTION (was wrong, leaving struck through for the record):** ~~the
entire `scripts/content-engine/` tool directory was deleted mid-fix-
application on `fix/karen-tickets`~~ — false alarm, my mistake. The RUNBOOK
commit (`c306d03`) is on a *different* branch, `feature/content-integrity-
engine` (PR #139, open, correctly marked "do not merge without review").
`fix/karen-tickets` branches from `f044725` and was content-only from the
start — Wyatt deliberately split the engine (its own branch/PR) from the
fix-application work (content-only branch). Nothing was deleted; I compared
two commits from different branches as if they shared history without
checking ancestry first (`git merge-base --is-ancestor` would have caught
this immediately). Corrected via a comment on issue #428 after Wyatt's
session flagged it — see that thread if you want the full back-and-forth.

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
