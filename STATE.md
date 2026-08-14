# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory.

     2026-08-14: consolidated after two parallel sessions collided on this file.
     The era-reader session merged `origin/main` (Clownbot) into its branch and
     kept BOTH sets of open items. Nothing below is safe to drop unread. -->

## Current focus

**Two efforts landed within hours of each other.**

1. **Era reader rework — MERGED 2026-08-14 as `e8500905` (#2086).**
2. **Clownbot rebuild — merged as #2087.** Rulings J1–J7 in `docs/decisions.md`.

**NOW: device-review round 1 on `fix/land-in-eras`** — Joey's first real-phone
pass on the shipped reader. Three bugs, ONE PR (they are interdependent: the
chrome-offset math consumes the filter bar's height, and both sit on the
masthead having moved into the stream).

- **Fix 1 — COMMITTED (`e2fbda2b`).** Landing page retired; visitors land in
  the Eras scroll with the masthead on top of it. `landing` removed from
  `AppMode` entirely. `EraGrid` survives via `EraSelector`.
- **Fixes 2+3 — COMMITTED (`be50b85c`).** Filter row is one line (36px chips,
  horizontal scroll, edge fade): FilterBar 113px → 49px, chrome 178px → 114px.
  Jump offset now uses a LIVE measured chrome height with one source of truth
  (`lib/longlive/chrome-offset.ts`), replacing `HEADER_OFFSET = 64` which was
  duplicated in `TimelineScrubber.tsx` + `ThreadsTimeline.tsx` and unaware the
  filter bar existed — so the scrubber's reference line had been wrong too.
- **Fable review: REJECT. Two HIGH defects, both browser-reproduced. Being
  fixed now — DO NOT MERGE until re-reviewed.**
  1. **A fresh visit still never shows the masthead** — the same bug fix 1
     existed to solve, in a new costume. `EraStream.tsx:101-104`'s
     `mountedWithoutRestore` gate was written when mounting could only be an
     `openEra` jump; now that the initial mode is `'era'` it fires on the plain
     front-door mount and scrolls past ~345px of masthead. Repro: `scrollY=296`,
     `<h1>` at viewport top −159. Fix: gate the mount-time jump on
     `eraJumpSeq > 0` (a fresh load is 0; every real jump bumps it).
  2. **The "Videos" chip is 100% tap-blocked and tapping it scrubs the page**
     (296 → 1089). The scrubber's date pill sits at y≈84–100, directly over the
     65–114px filter bar. **A regression from OUR one-line filter row** — on
     `main` the wrapped layout put Videos on row 2, clear of the pill. Fix:
     clamp the rail below the sticky chrome via `measureChromeHeight()`.
  3. MEDIUM: hydration mismatch on every load (milestone-dot % precision).
     Pre-existing, but this branch put the scrubber on `/`, so it is ours.

**MERGE AUTHORIZED for this round — Joey, 2026-08-14: "focus on fixing these.
you have merge authority. when done ill test on my phone."** Scoped to these
device-review fixes. He is away (school run), so nothing blocks on him.

**Codex cannot review this — out of credits until Aug 19.** Use the Fable
reviewer fallback he authorised on 2026-08-13: a `reviewer` agent with
`model: "fable"`, required to REPRODUCE against the real corpus/browser rather
than read code. That is what caught the two production-grade defects last
night that three Codex rounds missed.

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **Codex is out of credits until Aug 19 2026.** Workflow rule 3 is UNSATISFIED
  for BOTH efforts. Clownbot never got a Codex round; the era reader got three
  (round 3 died mid-run — this limit is why). **Run Codex against merged `main`
  when credits return.** The era reader got a Fable reviewer instead, under
  Joey's explicit 3-round cap; Clownbot got a stopgap review.
- **Clownbot: 3 of 48 over-refusals, NOT fixed.** "Which venues did the Eras
  Tour play in 2024?", the Scooter masters history, and a new-single question
  are all held at the output gate. Over-refusal is the safe direction but it is
  still a broken bot. Zero real safety leaks (all 21 LEAK flags triaged by hand
  as false positives).
- **Wyatt owns FIVE unsettled items:** Clownbot's model tier
  (`claude-sonnet-5`, one named constant), the 200/day/instance cap, ratifying
  the Mood route pattern, signing the Clownbot decisions entry — **plus the
  era reader's bottom nav**, which overrides the on-device rejection in
  `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3.
- **The bottom nav has never been opened on a real phone.** Joey was told twice
  and authorised the merge anyway. Safe-area insets are correct in code and
  covered by tests; that is not the same thing. First device check is a real
  task, not a formality.

## Merge authorization (era reader only)

**Joey, 2026-08-13: "please merge it when it's completely done. You have my
permission."** The § Decision authority approval that gate requires, for THIS
PR only — it does not generalise. Also his: **"do not let codex go more than 3
rounds… spin up your own independent review agent and implement their
feedback."** Both honoured; the Fable reviewer's four findings are fixed.

## Autonomous decisions — review surface

<!-- Clear once Joey has reviewed the two PRs. -->

Era reader: anchors sort but never display · no URL routing · `TrackGuide`
kept as a destination · plan amended mid-flight three times · per-id
`era-scatter` over a fixed midpoint · theory doorways scatter, no text-matching
heuristic · zero-match era empty state · tagline rewritten · one tag overruled
on review (the Eras Tour premiere carpet is Fashion, not Fashion+Tour).

Clownbot: `clown-answer.ts` as the one client-facing shape · `delulu` nullable
with no badge on fallback · did NOT auto-block `config.mjs` candidate term
lists (bare `child`/`minor`/`teen` would refuse ordinary biography) ·
`clown-safety.test.ts` left at 522 lines rather than split a red-team suite ·
`ClownDoc` carries a real `status` instead of the route guessing one.

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. -->

- (none yet). Note: the era reader ran a `reviewer` with `model: "fable"`.
  That is a MODEL OVERRIDE on a normal reviewer, NOT an architect escalation.

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only, Clownbot keeps its tab. `docs/decisions.md`
  2026-08-13. **Joey reversed his own brief once: there is NO Threads filter
  chip.** Six filters forever: Music, Fashion, Tour, Relationship, Lore, Videos.
- Clownbot rulings J1–J7, same file.
- Plans need no sign-off; no local-concurrency cap (Joey, 2026-08-13).
- Merge authority is human. Scheduled runners live on Wyatt's account.
- No self-armed PR monitors, ever.

## Known traps

- **A passing suite is not evidence; EXECUTION against the real corpus is.**
  Every genuine defect in the era-reader work was found by running the pipeline
  over the live vault, never by reading code — and each time 2600+ green tests
  had made us confident and wrong, because fixtures used the easy case
  (distinct dates, in-position cards). Demand a corpus reproduction.
- **Joey asked for a 30-minute recurring cron to "keep you going" (2026-08-14).
  RAISED, not built.** It is exactly what § Never babysit your own PR bans, and
  the ban is his own — the 2026-07-25 audit found self-armed wake-ups were ~69%
  of all scheduled agent token spend. It also would not have fixed the stalls:
  background agents already re-invoke the session on completion. The two real
  gaps were Codex `--background` jobs (not harness-tracked → poll them, see
  `docs/agents/codex.md`) and waiting on external state (→ a background bash
  with an until-loop, which fires exactly one notification). **If he reaffirms,
  build it — his call.** Do not build it silently.
- **`apps/web/next-env.d.ts` is regenerated by Next.js** whenever an agent
  starts a dev server for browser verification. Leave it uncommitted; do not
  hand-edit it, and do not `git restore` it.
- **Sticky chrome and the scrubber rail fight over the same band.** The rail is
  `pointer-events-auto` and its date pill floats at y≈84–100 — on top of the
  filter bar. Any control placed in that band is untappable and a tap there
  scrubs the timeline instead. Check `elementFromPoint` across a new control
  before believing it is tappable.
- **A fix can reintroduce the bug it fixed, one layer down.** Retiring the
  landing page did not make the masthead visible: the era-jump correction
  scrolled straight past it on plain load. Verify the USER-VISIBLE outcome in a
  browser, not the mechanism you changed.
- **Two mechanisms for one fact is this repo's recurring defect.** It appeared
  three times in one branch: two song→video matchers, two date paths, and an
  inference left running beside an authored field. Grep for other callers
  before declaring a matching bug fixed.
- **`npm run lint` may be polluted (~630 errors) by a git worktree under
  `.scratch/`.** `.scratch/` is git-ignored so CI is unaffected. Use
  `npx eslint . --ignore-pattern ".scratch/**"`. Do NOT delete another
  session's worktree.
- **Parallel sessions share this checkout.** `STATE.md`/`PLAN.md` collided on
  2026-08-14. Verify the branch right before every commit, and expect
  `git status` to show files you never touched.
- **Pre-existing failures, not yours:** `scripts/social/lib/card-render.test.ts`
  (missing `satori`) and repo-wide `npm run typecheck` (`apps/mobile`). Use
  `npm run typecheck --workspace=@swift2/web`.
- **How to get a Codex review:** `codex:rescue` skill → `codex:codex-rescue`
  subagent via the `Agent` tool, always with `--background`, then poll
  `codex-companion.mjs result <job-id>`. Full contract: `docs/agents/codex.md`.
- **Reader has no URL routes** — one client page, React context; `?item=`,
  `?lens=`, `?era=` read ONCE on mount, never written back.
- `scripts/social/post-queue.mjs` + `delete-media.mjs` hit LIVE accounts;
  `guard.sh` denies them. `core.autocrlf=true`. `.claude/worktrees/` holds ~30
  worktrees — never clean. `social-poster-workflow.test.ts.tmp` is scratch.

## Open threads

- [ ] 18 → **3** appearance videos still carry no topic tag. Deliberate: their
      own records support none. They remain reachable under Videos.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13. `TheoryNote` has no date/song/moment
      pointer; an authored `anchorHint` is the improvement path if it matters.

## Next obvious step

Finish the `origin/main` merge on `feature/era-reader-p4` (conflicts resolved:
`store.tsx` keep-both, this file consolidated, `PLAN.md` taken from `main`),
run the full gate, push to `feature/era-reader-rework`, wait for CI `build` to
appear AND pass — it was absent while the PR was conflicting — then merge
#2086. Do not merge on a red or missing `build`.
