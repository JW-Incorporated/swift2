# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory.

     2026-08-14: consolidated after two parallel sessions collided on this file.
     The era-reader session merged `origin/main` (Clownbot) into its branch and
     kept BOTH sets of open items. Nothing below is safe to drop unread. -->

## Current focus

**NOW: Community section research** — branch `research/communities`, plan in
`PLAN.md`. Joey's uploaded brief: build the curated dataset of every meaningful
place Swifties gather, to power a new Community nav tab. Four parallel
researchers by platform. **Not a code change — a dataset.**

Three findings that reshape the brief, all confirmed:
- **Reddit is unreachable from this environment.** 403 at the edge on
  `www.` AND `oauth.reddit.com`; `WebFetch` refuses `reddit.com` outright; no
  Reddit credential anywhere (checked `dongerbot`). So NO member counts and NO
  activity for any subreddit. Pivoted to name+story+recommendation-frequency,
  `member_count: null`. **A Reddit API app would unblock this and make the
  dataset refreshable — offered to Joey, not yet actioned.**
- **Facebook is the SMALLEST slice, not the largest** as the brief predicted:
  5 entries, 12 candidates dropped. Not because the groups don't exist — they
  leave no verifiable trace from outside. Zero corroborated era-specific,
  vinyl, mom, teacher, UK or AU groups despite dedicated searches.
- **Discord is the strongest slice** (11, all verified via the invite API) and
  proves why verification was non-negotiable: of 22 candidate invites, **10
  were dead or pointed at the wrong server**. `discordbotlist.com` serves its
  OWN promo invite on every page; one directory labelled an invite "The Lakes"
  when the API showed an unrelated 84-member server.

**Every entry carries a `verification` block** (`verified-live` /
`third-party-cited` / `listed-only` / `blocked-unverified`) so verified and
unverified never blend into one confident-looking list. **Open product
question for Joey: the spec (`docs/definition-of-done.md:136-142` item 4b)
names Instagram and TikTok; the brief omits them. Also unanswered: who owns
the refresh cadence the spec requires.**

---

**Clownbot: COMPLETE and live.** Three PRs merged 2026-08-14 — rebuild (#2087),
chat UI (#2103), and the review fixes (#2108, `d969a29e`). Confirmed live by
fetching the shipped JS bundles, not inferred from a green build. Rulings
J1-J7 and the review findings are in `docs/decisions.md`. Backend behaviour was
the named next step and #2108 delivered it.

**Two efforts landed within hours of each other.**

1. **Era reader rework — MERGED 2026-08-14 as `e8500905` (#2086).**
2. **Clownbot rebuild — merged as #2087.** Rulings J1–J7 in `docs/decisions.md`.
3. **Clownbot chat UI — IN FLIGHT on `feature/clownbot-chat-ui`** (off `ff4df4ab`).
   Joey rejected the shipped look: the chat box "just looks like another piece
   of content on the site. The user must immediately know it's a chatgpt type of
   chat box." He then approved a mockup, which is now the spec —
   scratchpad `clownbot-artifact.html`, published as an artifact.
   Porting it: app-neutral panel chrome (NOT the era palette — that contrast is
   the point), titlebar, right-aligned user bubble, avatar + full-width reply,
   action row, docked pill composer, receipts as inline chips, a fullscreen
   toggle (CSS overlay at `100dvh`, NOT the Fullscreen API — unreliable on iOS),
   "Most recent" replacing the "Top 10" heading, and eggs grouped by era.
   Backend behaviour is untouched; that is the NEXT piece of work.
   - **Board half DONE and committed.** `BoardItem` gained an `era` field
     (optional, so an existing test double in an unowned file kept compiling);
     eggs group into 11 era buckets with **0 failing era resolution**; column 1
     is "Most recent" with relative dates and a touch-visible "Ask clown bot →".
     Verified: `clown-board` 27/27, full suite 2779/2779, typecheck + lint clean.
   - **Panel half BUILT, one correction in flight.** Chrome + fullscreen
     toggle + new `ClownMessageRow.tsx` (split for the 300-line cap).
     Verified by me: full suite 2779/2779, typecheck + lint clean.
     Reused the existing reference-counted `useScrollLock`; `z-50` matches the
     codebase's overlay convention (`EraSelector`, `MomentDetail`); action-row
     buttons are genuinely `disabled`, not fake-live.
     **Correction sent:** the agent hit the 44px tap-target rule by making icon
     buttons physically 44px, which inflated the titlebar and composer pill
     past the mockup. That is the exact chunkiness Joey rejected twice —
     visual size and hit area must be separate numbers (glyph ~32px, hit area
     44px via padding + negative margin). Not yet re-verified.
   - **Do NOT stage `apps/web/lib/longlive/content-vault.generated.ts`** — an
     agent's `npm run build` regenerated its timestamp. Leaving it unstaged is
     the clean fix; `git restore`/`checkout --` are forbidden here.

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
- **Round 2 fixes COMMITTED (`3dfc1292`, `1e11dca2`). Review round 3 running.
  DO NOT MERGE until it returns APPROVE.**
  - Masthead on fresh load: FIXED and confirmed (8+ loads, `scrollY=0`), with
    all NINE jump paths still landing at the chrome edge — the `eraJumpSeq > 0`
    gate did not cost a legitimate jump.
  - Hydration: FIXED (zero errors, ~10 loads).
  - **Videos chip took THREE attempts.** The real cause: `pointer-events`
    INHERITS. `SCRUBBER_SHELL_CLASS` sets `none`, `SCRUBBER_RAIL_CLASS`
    re-enables `auto`, so all 11 rail adornments inherited `auto` — invisible
    (`opacity-0`) but hit-testable, overhanging the filter row. Attempt 1
    clamped the rail box; attempt 2 verified the box moved, not the hit-test.
    Now all 11 are `pointer-events-none`, locked by a source test that walks
    the rail's JSX.
  - Clamping also broke two things it caused: the rail overflowed a landscape
    phone (844×390, 15px off-screen) → `scrubberRailMaxHeight`; and adornments
    painted over the filter row → `SCRUBBER_RAIL_CLIP_PATH`.
  - **Accepted trade-off, founder-visible:** while clamped on mobile, the top
    year label is clipped during an active drag. Desktop unaffected.
  - **Round 3 REJECTED it again: the chip was dead on a FRESH unscrolled load.**
    Fix 4 (`99e1d1a9`) — the two-strike rule fired, `DEBUG.md` was written, and
    a fresh-context agent restricted to three files found the real mechanism:
    the clamp asked "how tall is the chrome" (65+49=114) when it needed "where
    is the filter bar NOW". Those agree only once the bar sticks; the masthead
    this branch added pushes it to y≈410 pre-stick. New `measureChromeBottom()`
    reads the live `getBoundingClientRect().bottom`; padding recomputes inside
    the rAF scroll handler. Rail top == filter-bar bottom in every state.
    **Review round 4 running — DO NOT MERGE until it returns APPROVE.**

  Review rounds 1 and 2 both returned REJECT; their findings are all fixed and
  described above. Detail is in the commit messages.

**MERGE AUTHORIZED for this round — Joey, 2026-08-14: "focus on fixing these.
you have merge authority. when done ill test on my phone."** Scoped to these
device-review fixes. He is away (school run), so nothing blocks on him.

**Codex cannot review this — out of credits until Aug 19.** Use the Fable
reviewer fallback he authorised on 2026-08-13: a `reviewer` agent with
`model: "fable"`, required to REPRODUCE against the real corpus/browser rather
than read code. That is what caught the two production-grade defects last
night that three Codex rounds missed.

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **Clownbot review, 2 Fable rounds, both REJECT. PR #2108 open, NOT merged.**
  Codex is down, so a `reviewer` on `model: "fable"` stood in under the
  authorised fallback, required to REPRODUCE rather than read. Joey capped it
  at 2 rounds; **both are spent, so the final fix ships reviewed only by the
  orchestrator.** Round 1 found four defects, all reproduced:
  1. Over-refusal root cause — `screenOutput` ran INPUT-tuned regexes over the
     bot's own prose (`\bdiagnos` matched "I diagnosed a whole color theory").
     Non-deterministic because it depended on the model's word choice.
  2. The output gate caught **0 of 13** redline drafts. The battery only ever
     "held" them because the model chose to deflect. `clown-safety.ts`'s header
     claimed prompt-independence; that was FALSE for the output path.
  3. **Prior transcript turns bypassed every input gate** — a real jailbreak
     route. `screenConversation` existed for it and was never called.
  4. Hyphenated queries retrieved nothing, so real topics were refused.
  Round 2 verified all four fixes hold, then found the fix for (1)/(3) had
  **REGRESSED the product**: `screenConversation` screened stored ASSISTANT
  prose and the bot's OWN refusal copy with input patterns, so 4 of 13 refusal
  messages tripped their own gate. **One refusal permanently bricked the
  session** — each refusal appends more self-tripping text and the 6-message
  cap never clears it. Fix in flight: user turns screened with input patterns,
  assistant turns with output patterns.
  **The standing lesson: over-refusal and under-blocking pull in opposite
  directions here. Every change to one gate must be tested against both.**
- **`tb-priv-02` is a documented, tested gap** — sexuality speculation with no
  orientation token cannot be caught deterministically without also refusing
  "what is track five on Midnights really about?". Do not "fix" it with a
  probe-text-pinned regex; that overfits the probe, not the class.
- **Four other overlays share the `z-50`-under-`z-[71]` FeedbackButton
  overlap** (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`).
  Deliberately NOT fixed — floating feedback over a reading sheet may be
  intentional. Joey's call, not an agent's.

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
