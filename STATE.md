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

**P4 + P5 committed on `feature/era-reader-p4`**, along with all five Codex
fixes and the docs. Bottom nav on EVERY surface incl. the front door (Joey:
"the landing page IS the website"), plus the content spacer the fixed bar
needed. All gates green: 2636 tests, typecheck, lint, `check:filter-coverage`.

**Video topic tags DONE.** `VideoNote.tags` authored end to end; the
music-video inference in `filtersForEntry` is DELETED, not left beside it.
Untagged appearance videos 18 → 3 (the three are deliberate: their own text
supports no topic). `check:generated` green.

**ALL WORK IS PUSHED. #2086 is the single PR, CI GREEN** (build, guard-code,
Vercel preview deployed). The stack was collapsed by fast-forwarding
`feature/era-reader-p4` onto `feature/era-reader-rework`.

**Codex is exhausted: 3 rounds, per Joey's cap.** R1 five findings (one HIGH).
R2 three only partly fixed + four new defects. R3 FAILED at 9m52s before
producing verdicts — its partial corpus verification was positive (49/244
pairings stable, Fortnight pairs, Karma null, 84 records/81 tagged/3 untagged,
generated file matches a fresh regeneration) but it never judged the HIGH.

**The Fable reviewer ran and returned REJECT with 4 real findings — all now
fixed, verified, committed and pushed.** It also PROVED the date-leak
invariant holds, by execution: all 96 non-exact entries across 12 eras, every
render path, all 7 filter states, 0 violations. That bug is dead.

What it caught that three Codex rounds did not:
1. `focusout` never fires when its target is REMOVED from the DOM, so
   Escape-closing SearchOverlay left `BottomNav` unmounted **permanently**.
2. `spaceDoorways` displaced a doorway but kept its `data-ll-date`, so
   scrubber dates ran backwards — **44 inversions, worst 219 days**, in 9+
   eras. Now 44 → 0, locked by `scrubber-anchor-corpus.test.ts`.
3. Interpolation bent toward fabricated dates: the pill showed months no real
   content occupies. Synthetic anchors are now excluded from the date curve
   while still positioning cards.
4. The filter pin landed exactly on the viewport centre; now +4px clear.

**Waiting on CI (background job `be2c2mszf` exits when checks settle). Then
MERGE — authorised below.**

**Joey wants ONE PR** (2026-08-13). `feature/era-reader-p4` already contains
every commit from P1–P3, so: `git push origin
feature/era-reader-p4:feature/era-reader-rework` is a fast-forward and turns
**#2086 into the single PR**. Then `gh pr edit 2086` to retitle/rewrite the
body for the whole rework. No force push, no closing anything.

**CODEX CAPPED AT 3 ROUNDS — Joey, 2026-08-13:** "do not let codex go more
than 3 rounds. After that, I no longer have faith in codex. At that point you
spin up your own independent review agent and implement their feedback."
Rounds 1 and 2 are spent, so round 3 is the last. If round 3 is dirty: fix the
findings, then run a Claude reviewer INSTEAD of a round 4, implement it, merge.
This is a founder override of Workflow rule 3's Codex requirement, for THIS PR
only — it is not a standing change to rule 3.

Two mitigations, because a Claude reviewer shares the blind spots of the Claude
that wrote the code (proven this session: Codex found a HIGH that a 2600-test
suite and this orchestrator's own review both passed):
1. Run the reviewer with `model: "fable"` — a different model family is the
   only real independence available. This is a MODEL OVERRIDE on a normal
   reviewer, NOT an `architect` escalation; do not log it as one.
2. Require it to REPRODUCE against the real corpus, not just read code. That
   is the specific thing Codex did that our own review did not, and it is why
   it caught what it caught.

**MERGE AUTHORIZED — Joey, 2026-08-13, explicitly: "please merge it when it's
completely done. You have my permission."** This is the § Decision authority
approval that gate requires, for THIS PR only; it does not generalise to
future work. "Completely done" = Codex clean + full suite + typecheck + lint +
`check:generated` + `check:filter-coverage` green + CI `build` green on the
PR. **Do not merge on a dirty Codex review** — he was told he'd rather wake to
an unmerged green PR than a deployed broken one, and did not contradict it.
He was also told, twice, that the bottom nav has never been seen on a real
device; he authorised the merge anyway. Recorded, not re-litigated.

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

## Codex round 2, job `task-mssduf1d-erbg7z` (2026-08-13, 10m37s)

**2 of 5 genuinely fixed, 3 partial, 4 NEW defects.** Verdict: the fix diff is
not clean. Being fixed now.

- **HIGH still live.** `nearestAnchorExact` only replaces an anchor on a
  STRICTLY smaller distance, so a synthetic anchor TYING with exact anchors on
  the same date loses — debut's clamped `taylors-version` doorway shows
  "Oct 2006". The new test used only distinct dates. Same on reputation and
  tloas.
- Scroll pin can still reach page top: `era-stream-pin.ts` never receives
  `scrollY`, so it can request a negative absolute position that clamps to 0.
- The remix rule unpaired "Fortnight (feat. Post Malone)", which IS the album
  recording — the TRACK seed names that very `youtubeId`. Rule: authored data
  beats inference. Also `feat.` without parens still slips, and qualifiers are
  searched against a JOINED `relatedSongs` blob.
- NEW MED: the feedback dismiss X overlaps the feedback trigger on mobile
  (`size-5` vs `.era-icon-btn`'s 44px floor) — tapping Feedback dismisses it.
- NEW LOW ×3: no `aria-current` on the mobile landing nav; the gloss line
  flashes Eras→pick and can reflow; a dismissed feedback button flashes back
  on reload.

Genuinely fixed: the duplicate legacy matcher (one matcher left in the app),
and the FilterBar seed (never visible on the only mount path).

## Codex round 1, job `task-mssb0p0c-vzzubf` (2026-08-13, 15m20s)

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

- **`npm run lint` is polluted locally, ~630 errors, NOT ours.** Another
  session left a git worktree at `.scratch/clownbot-corpus-worktree`; ESLint
  then sees two `tsconfigRootDir`s and fails files nobody touched. `.scratch/`
  is git-ignored, so CI (clean checkout) is unaffected. Lint the specific
  files instead of trusting the repo-wide run, and do NOT "fix" it by deleting
  another session's worktree.
- **A passing suite is not evidence; EXECUTION against the real corpus is.**
  Every genuine defect this session was found by running the pipeline over the
  live vault, never by reading code — and each time, 2600+ green tests had
  made us confident and wrong. The fixtures always used the easy case
  (distinct dates, in-position cards). When reviewing, demand a corpus
  reproduction, not a code-reading verdict.
- **Two matchers, one app** — the lesson from Codex findings 2 and 4. Building
  a careful new helper does NOT retire the sloppy old one; grep for other
  callers before declaring a matching bug fixed. Same shape as the HIGH date
  leak: a correct rule in one file, bypassed by the plumbing around it.
- **ROUTING: this session sent every dispatch to `executor`, `grunt` zero
  times** — including steps `PLAN.md` itself tagged `(grunt)` (8: delete a
  component + its import). Joey called it out 2026-08-13. Agent choice IS the
  model choice (grunt=cheap, executor=mid, architect=Fable), so mis-routing is
  a real cost error. When `grunt` was finally used for the P4/P5 docs pass it
  did the job correctly and cheaply. Route by the plan's own tag.
- **Read a component's props before editing it.** Added a `className` to
  `ModeToggle` that does not exist, then had to undo it — a briefed agent
  avoids this because the brief says "read it first".
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

- [x] **Video topic tags — Joey said do it properly** (2026-08-13). `VideoNote`
      is gaining an authored `tags?: ContentTag[]`, which must REPLACE the
      "a dated music video is Music" inference in `filtersForEntry`, not run
      beside it — two disagreeing mechanisms is the defect Codex caught twice
      on this branch. Author in `supabase/seed/videos/*.mjs` + the sync script;
      never hand-edit `*.generated.ts`.
- [x] **Scattered theory doorways: Joey is fine with them** (2026-08-13).
      Leave as-is; do not re-open. The `anchorHint` seed field remains the
      improvement path if it ever matters.
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

1. Read the Codex re-review verdict (`codex-companion.mjs result <job-id>`,
   NOT the subagent summary). Confirm finding 1 — the synthetic-date leak — is
   dead on every path; it already survived a full suite and a human review.
2. Review the video-tagging table row by row for accuracy before accepting it.
   Content correctness is a product-quality call, not an agent's to self-certify
   — check the rows the agent flags as thin especially.
3. Fix anything either turns up, re-run the full gate.
4. Collapse to ONE PR per the § Current focus recipe, then rewrite #2086's
   title and body to describe the whole rework rather than just the filter.
   Note in the body that Wyatt should see the bottom nav (it overrides D3).

Branch stack, oldest first: `feature/era-reader-rework` (PR #2086, open) →
`feature/era-reader-p2` (committed, unopened) → `feature/era-reader-p3` (in
progress). Each targets its parent, not `main`, until #2086 merges. Ask Joey
to run `/codex:review` per branch before opening each PR.
