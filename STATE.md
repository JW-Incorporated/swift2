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
3. **Clownbot chat UI — MERGED 2026-08-14 as `b8a500a3` (#2103).**
   Joey rejected the shipped look twice: it "just looks like another piece of
   content on the site. The user must immediately know it's a chatgpt type of
   chat box." He approved a mockup (scratchpad `clownbot-artifact.html`,
   published as an artifact) and that became the spec.
   Shipped: app-neutral panel chrome via new `--clown-*` tokens (NOT the era
   palette — that contrast is the whole point), right-aligned user bubble,
   avatar + full-width reply with no bubble, action row, docked pill composer,
   receipts as inline chips, a fullscreen toggle (CSS overlay at `100dvh`, NOT
   the Fullscreen API — unreliable on a non-video element in iOS Safari),
   "Most recent" replacing "Top 10", and eggs grouped into 11 eras.
   Verified by me: 2779/2779, typecheck + lint clean, zero raw hex.
   **Backend behaviour untouched — that is the NEXT piece of work** (Joey:
   "After this we will do more work on the backend of the chat bot, as far as
   how it functions"). Start with the 3/48 over-refusals below.
   Confirmed live on prod by fetching the shipped JS bundles, not inferred
   from a green build: `lets clown around`, `Most recent`, `Past confirmed
   easter eggs`, `Exit full screen` all present.
   - **Icon buttons: 28–32px visual, 44px hit area** via invisible inset
     overlays. An earlier pass satisfied the tap-target rule by inflating the
     buttons to 44px, which cost the chrome proportions that make it read as
     an app. Visual size and hit area are separate numbers — do not re-merge
     them.
   - **Action row is genuinely `disabled`**, not fake-live: no clipboard,
     re-ask or feedback path exists yet.

**Device-review round 1 — MERGED as `ff4df4ab` (#2099).** Joey's first
real-phone pass on the shipped reader: land in the Eras scroll (landing page
retired, `landing` removed from `AppMode`), one-line filter row, and a live
measured chrome height replacing a hardcoded `HEADER_OFFSET = 64`.

Two durable lessons from that round, kept because they will bite again:

- **`pointer-events` INHERITS.** Eleven invisible (`opacity-0`) scrubber rail
  adornments stayed hit-testable and ate taps on the filter row. Took three
  attempts because the first two moved the box without changing the hit-test.
  Locked now by a source test that walks the rail's JSX.
- **"How tall is the chrome" and "where is the filter bar NOW" are different
  questions.** They agree only once the bar sticks. That mismatch survived two
  review rounds; a fresh-context agent restricted to three files found it.

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

## Merge authorization

Granted per-workstream, never standing. All three have merged, so these are
spent — a NEW effort needs a NEW grant. Joey's own framing: era reader,
"please merge it when it's completely done. You have my permission"; Clownbot,
"I am giving you merge authorization"; the chat UI, "implement the current
mockup live… I just want to get it on the site." Also standing: **"don't allow
codex reviews to go more than 2 rounds."**

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
- **A SUM of heights is not a POSITION.** Four fixes died on this. Sticky
  chrome's summed height equals its on-screen position only once it is stuck;
  anything added above it (the masthead) breaks the equality pre-stick. Ask the
  DOM where an edge IS (`getBoundingClientRect().bottom`), do not compute where
  it ought to be — and recompute on scroll, because pre-stick that edge moves
  every frame. `measureChromeBottom()` vs `measureChromeHeight()` in
  `chrome-offset.ts` encodes the distinction; keep them straight.
- **`pointer-events` INHERITS — a `pointer-events-none` shell does not protect
  you.** `SCRUBBER_SHELL_CLASS` sets `none`, `SCRUBBER_RAIL_CLASS` sets `auto`,
  and every rail descendant inherited `auto`. Eleven `opacity-0` adornments
  were invisible AND hit-testable, overhanging the sticky filter row: taps on
  the last chip scrubbed the timeline instead. Locked now by a source test.
  **Verify a control with `elementFromPoint` and a real tap, never by checking
  that its container moved** — that mistake cost two review rounds.
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
