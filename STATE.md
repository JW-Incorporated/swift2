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

1. **Era reader rework — PR #2086**, `feature/era-reader-rework` → `main`.
   Bottom nav on mobile, one global six-chip filter, Track guide replacing the
   Spotify player, threads/eggs as timeline doorways, rotating masthead gloss.
   Merge AUTHORIZED by Joey (below). Blocked only on CI after the `main` merge.
2. **Clownbot rebuild — merged as #2087.** Build A deleted, build B from the
   #1961 re-spec. Rulings J1–J7 in `docs/decisions.md`.

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
- **FIVE unsettled items — now JOEY's, not Wyatt's** (project handed to Joey
  2026-08-14; `docs/decisions.md`, `CLAUDE.md` § Ownership). Do not wait on
  Wyatt for any of them: Clownbot's model tier (`claude-sonnet-5`, one named
  constant), the 200/day/instance cap, ratifying the Mood route pattern,
  signing the Clownbot decisions entry — **plus the era reader's bottom nav**,
  which overrides the on-device rejection in
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
- **Joey owns the project outright (handoff 2026-08-14).** Sole decision-maker,
  product and engineering; his bots may touch any file. Wyatt keeps only: the
  Anthropic account the runners are hosted on, the API keys/secrets he supplies,
  and `fleet-schedule.yml` as the way to retime those routines.
- Merge authority is human (Joey). Scheduled runners still run on Wyatt's
  account — that is whose bill, not whose call.
- No self-armed PR monitors, ever.

## Known traps

- **A passing suite is not evidence; EXECUTION against the real corpus is.**
  Every genuine defect in the era-reader work was found by running the pipeline
  over the live vault, never by reading code — and each time 2600+ green tests
  had made us confident and wrong, because fixtures used the easy case
  (distinct dates, in-position cards). Demand a corpus reproduction.
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
