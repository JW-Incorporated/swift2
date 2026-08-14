# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory. -->

## Current focus

**Era reader rework** — branch `feature/era-reader-rework`, plan in `PLAN.md`
(five sequenced PRs, order is load-bearing). Driven by Joey's consolidated team
feedback on the "Time Machine Mockups" artifact, 2026-08-13.

**PR 1 is open: #2086** (`feature/era-reader-rework` → `main`).

**P2 committed on `feature/era-reader-p2`** (stacked on P1). NOT opened as a
PR yet — awaiting a Codex review.

**P3 committed on `feature/era-reader-p3`** (stacked on P2). Doorways in the
timeline, back-to-position, R4 back-link; `EraSection.tsx` split 826 → seven
files, all under 300. Per-era doorway counts 5–12.

**P4 in flight on `feature/era-reader-p4`** with THREE executors sharing the
tree on disjoint file sets: (a) bottom nav + TopBar context label + feedback
button, (b) `gloss-rotation.ts`/`LandingMasthead.tsx` (new files only —
orchestrator wires it in), (c) the five Codex fixes below.

**MERGE ORDER IS LOAD-BEARING:** #2086 → P2 → P3 → P4. The HIGH date-leak fix
lands on P4, so #2086 must NOT merge alone.

**HOW TO GET A CODEX REVIEW (agents do this themselves — never hand it to a
founder).** `/codex:review` the SLASH COMMAND is human-only, but Codex is
reachable: `codex:rescue` skill → `codex:codex-rescue` subagent via the
`Agent` tool. `Skill(codex:rescue)` from inside that command re-enters and
HANGS the session. Pull results with `codex-companion.mjs result <job-id>` —
the subagent's inline summary is not reliable. A 7-commit review takes ~15
min because Codex EXECUTES the corpus to confirm findings.

## Last session

<!-- Working memory, NOT a changelog. Git holds the history. Keep this to what
     the next session needs; prune anything already merged or superseded. -->

- **P1 (PR #2086, open):** one global six-chip filter in the store, rendered
  once by `EraStream`; `EraSection` lost its per-era filter state; every feed
  entry carries an `anchor`; `check:filter-coverage` gates the build.
- **P2 (committed, unopened):** Spotify player deleted, `TrackGuideBar` in its
  slot, three-pill row and era-bottom videos rail gone, `track-video.ts` pairs
  songs to videos (50/244 pair).
- **P3 (in progress):** feed union widened to four kinds; `doorways.ts` and
  `space-doorways.ts` added; UI/back-to-position/R4 with an executor.
- Verified by me directly, not taken on report: `npm test -- filters` 11/11,
  `era-feed filters doorways` 62/62, `track-video` 16/16,
  `check:filter-coverage` exit 0.

## Autonomous decisions — review surface

<!-- Every call made without asking, one line each. This is what a founder
     skims instead of being interrupted. Clear it after review. -->

All reported to Joey in-session 2026-08-13; reasoning lives in
`docs/decisions.md` and `PLAN.md` § Plan amendments. Clear once he has
reviewed the PRs. One line each:

anchors sort but never display · no URL routing, extended the scroll snapshot
· five sequenced PRs, real dependency chain · `TrackGuide` stays a
destination (the AFFORDANCE moved, not the list) · plan amended mid-flight
three times rather than shipped through · `era-midpoint` → per-id
`era-scatter` · theory doorways scatter, no text-matching heuristic · added
the zero-match era empty state the plan missed · three corrections sent back
on P3 (clamp anchors, kill the overload scaffolding, make R4 unconditional)
· tagline copy rewritten, offered to Joey to veto.

## Architect invocations

<!-- NEVER cleared — a running log for the life of the project. One line per
     invocation: date, question, which half of the rule fired, the call.
     Budget: <=2 per week. Two weeks at zero on genuinely novel work means
     escalation is being under-served. -->

- (none yet)

## Decisions that are settled

<!-- Must NOT be re-litigated. Anything expensive to reverse belongs in
     docs/decisions.md instead — this is the short pointer list. -->

- The five era-reader decisions (bottom nav overriding D3; Spotify player
  removed; one global filter; anchor dates sort-only; Clownbot keeps its tab)
  — `docs/decisions.md` 2026-08-13, and `PLAN.md` § Rulings. **Joey reversed
  his own brief on one point: there is NO Threads filter chip.** Six filters,
  forever: Music, Fashion, Tour, Relationship, Lore, Videos.
- **Plans do not need a sign-off** (Joey, 2026-08-13). Write the plan, execute.
- **No local-concurrency cap** (Joey, 2026-08-13).
- Merge authority is human. `git merge` / `gh pr merge` prompt by design.
- Scheduled runners live on Wyatt's account, never Joey's.
- No self-armed PR monitors, ever (CLAUDE.md § Never babysit your own PR).

## Codex review, job `task-mssb0p0c-vzzubf` (2026-08-13, 15m20s)

Five findings on `main...feature/era-reader-p2`, all being fixed on the P4
branch. Codex reproduced them by EXECUTING the corpus, not just reading —
that is why it is worth the wall-clock time, and why the in-house `reviewer`
agent does not substitute (Workflow rule 3).

1. **HIGH — a synthetic anchor date DOES reach the UI.** The card says "Date
   unknown" but `TimelineScrubber`'s pill renders it and `aria-valuetext`
   announces it, because `EraSection` discarded `displayDate` and handed the
   scrubber `sortDate`. **An earlier claim in this file that anchors "never
   display" was wrong** — the invariant held in `anchor-date.ts` and leaked in
   the plumbing around it.
2. MED — `TrackDetail` still calls the LEGACY `videoForTrack`, whose
   normaliser strips "(Taylor's Version)", so a song's dossier plays a
   different recording than its track-guide row. Two matchers, one app.
3. MED — the filter pin stores only the section's top, so an era that
   collapses under a filter can leave the reader visibly in the NEXT era.
4. MED — "Karma" pairs with the `feat. Ice Spice` remix via `relatedSongs`,
   which is matched before the title rule. **A test blessed it** — the test
   encoded the bug.
5. LOW — `FilterBar`'s 52px seed is wrong (real bar 65px) and it measures
   after paint, so it jumps on hydration at nonzero scroll.

Codex cleared: the scatter hash (even at 300 ids), coverage-checker drift,
the `EraVideos` deletion vs the scrubber sentinel, lazy-era races, and the
`FilterBar` observer lifecycle.

## Known traps

<!-- Things that already burned tokens once. Paste the relevant ones into
     delegation prompts — agents do not read this file. -->

- **Two matchers, one app** — the lesson from Codex findings 2 and 4. Building
  a careful new helper does NOT retire the sloppy old one; grep for other
  callers before declaring a matching bug fixed.
- **`lenses.ts` is 2473 lines, not ~238** — the landing-page brief is stale.
- **An untagged item is invisible under any active filter**
  (`tagBadges.test.ts:47`). `check:filter-coverage` gates the build on it.
- **Pre-existing failures, not ours:** `scripts/social/lib/card-render.test.ts`
  (missing `satori`) and repo-wide `npm run typecheck` (`apps/mobile`). Use
  `npm run typecheck --workspace=@swift2/web`.
- **Reader has no URL routes** — one client page, React context;
  `?item=`/`?lens=`/`?era=` read ONCE on mount, never written back.
- `scripts/social/post-queue.mjs` + `delete-media.mjs` hit LIVE accounts;
  `guard.sh` denies them. `core.autocrlf=true` (`.gitattributes` pins `*.mjs`,
  `*.generated.ts`, `*.sh` to LF). `.claude/worktrees/` holds ~30 worktrees —
  never clean. `social-poster-workflow.test.ts.tmp` is another session's
  scratch; leave it.

## Open threads

- [ ] **18 appearance-family videos carry no topic tag** (interviews, awards,
      TV spots) — reachable only under Videos. `VideoNote` has no topic field
      at all. Reported to Joey 2026-08-13; his call whether to author them.
      Music videos are fine (they reach Music via the restored rule).
- [ ] **Song pointers, settled 2026-08-13:** videos DO have one
      (`VideoNote.relatedSongs`, `types.ts:844`, all 55 music/lyric videos) —
      `track-video.ts` is the tested lookup. `TheoryNote` does NOT, and nor do
      its sources. So theory doorways scatter; that is a data gap, not a code
      one, and the fix is an authored `anchorHint` in the seed.
- [ ] folklore and evermore have no Tour content. Correct — neither era had a
      tour. Not a content gap; do not "fix" it.
- [ ] **Wyatt has not signed off on the bottom nav** and should see PR 4. It
      overrides the on-device rejection in `docs/specs/2026-08-13-landing-page-
      brief.md` §3.2/D3. Surfaced per rule 5, not settled.
- [ ] Six labelled tabs do not fit 390px. The bar must degrade to icon-only at
      5–6; test with 4, 5 and 6 stub entries (P4 step 18).
- [ ] Residual wording: § Decision authority and § Roles still say "approved
      spec". Joey removed the sign-off gate, not the spec. Low priority.

## Next obvious step

Three executors are in flight on `feature/era-reader-p4`. When they land:

1. Verify each directly — this session has already caught four defects that
   way, and Codex caught five more that verification missed.
2. **Wire `LandingMasthead` into `LandingPage.tsx` yourself** — agent (b) was
   told not to, to avoid colliding with agent (a).
3. Re-run Codex on the FIX DIFF (cheap — scope it to the diff, not the
   branch): `codex:rescue` skill → `codex:codex-rescue` subagent via `Agent`.
   Confirm finding 1 in particular is genuinely dead, since it survived a full
   test suite and my own review.
4. Then open PR 2, PR 3, PR 4. Merge order #2086 → P2 → P3 → P4.

Joey was offered the option of collapsing the four branches into ONE PR to
make it a single merge — check whether he took it before opening four.

Branch stack, oldest first: `feature/era-reader-rework` (PR #2086, open) →
`feature/era-reader-p2` (committed, unopened) → `feature/era-reader-p3` (in
progress). Each targets its parent, not `main`, until #2086 merges. Ask Joey
to run `/codex:review` per branch before opening each PR.
