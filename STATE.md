# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**IN FLIGHT: porting #2116's depth work onto SIX tabs.** `PLAN.md` is written
and an `executor` is running it on `feature/merch-community-depth`, in its own
worktree. Take the merch filters / era grouping / product images / jump bars;
DROP the tab merge. **`PLAN.md` § TWO TRAPS is the whole risk**: that branch's
`bottom-nav-layout.ts` carries the OLD 5-tab threshold (taking it deletes every
nav label again) and its `STATE.md` would revert this checkpoint. Porting
FORWARD from `main`, never rebasing #2116.

**JOEY'S RULING 2026-08-15: six separate tabs, kept.** Eras, Threads, Mood,
Clownbot, Community, Merch — device-confirmed on his phone, labels showing,
"honestly it looks really good with 6". **#2116 merged Merch INTO Community to
reach 5 tabs, purely because 5 was then the only way to get labels back. #2140
(threshold 5→7) killed that premise.** So #2116 is to be CLOSED UNMERGED once
the depth work lands separately. Do not resurrect the merge.

**Correction worth keeping: #2116 never shipped.** Joey reported the depth work
as "regressed to an older, worse form". It was never live — `mergedAt: null`.
He was looking at the PR's Vercel PREVIEW deployment, which renders the branch.
**A preview URL is not production; check `mergedAt` before accepting a
regression report.**

Merged 2026-08-15: era-reader device fixes, the Karen watchdog alarm repair,
the `guard-code` verdict fix, **#2140** (nav labels: threshold 5→7, 11px→10px),
**#2141** (two self-limiting verification checks), **#2143** (this checkpoint),
**#2144** (departed-founder notification sweep), **#2145** (`HUMAN-ACTIONS.md`).

**#2141 fires tomorrow and Check 1 is EXPECTED to alarm.** Two steps in
`watchdog.yml`, both `if: (!cancelled()) && (…'35 14 * * *')` so an unrelated
earlier failure cannot silently skip them — the exact bug the Karen alarm
repair fixed, so never "simplify" them to a plain `if:`. Check 1
(`karen-post-repair-check.mjs`): Karen has not run since 2026-08-09 and the
newest report in her directory was committed by the photo-enrichment PR, not
by her — **an alert tomorrow means "still not enabled", not a bug.** Check 2
(`news-worker-rotation-check.mjs`): first news-worker run after the
SUPABASE_SERVICE_ROLE_KEY rotation; reads logs only if that run failed. **Both
self-close 2026-08-22** (`WINDOW_END`); removal = delete the two steps or the
two `.mjs` files.

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **PR #2116 is to be CLOSED UNMERGED**, after the depth port lands. It is
  conflicting AND checked out in another session's worktree — do not rebase it,
  the port supersedes it. Comment on it before deleting its branch.
- **Wyatt has NOT lost access — corrected by Joey 2026-08-15.** He is still an
  owner, working a different project; Joey CO-OWNS the Vercel team and their
  GitHub accounts are connected. **The infra-lapse risk previously recorded here
  was wrong.** The notification sweep (#2144) still stands — he simply is not
  working on this project — but do NOT frame his accounts as a failure risk.
- **#2110 merged with three questions still unanswered.** Joey deferred them;
  merging did not resolve them. (1) **Instagram + TikTok** — item 4b names both,
  the brief omitted them; different shape (creator accounts, not joinable
  groups), so scope was not widened unilaterally. (2) **Who owns the refresh
  cadence** — invites rotate, groups go private; accurate 2026-08-14, decays
  from there. (3) Ratify or veto excluding **`r/TravisAndTaylor`** as an
  anti-fan snark board; `r/GaylorSwift` kept but flagged private since Aug 2025.
- **Watchdog alerts still @-mention `@wjduvall-cmd`. Wyatt has left the
  project** (Joey, 2026-08-14: "Wyatt is no longer working on the project").
  Every alert pings a departed founder. RAISED, not fixed — it wants one sweep
  across `watchdog.yml`, not a half-fix in the two newest steps.
- **Wyatt's five formerly-owned items are now unowned** — Clownbot's model tier
  (`claude-sonnet-5`, one named constant), the 200/day/instance cap, ratifying
  the Mood route pattern, signing the Clownbot decisions entry, and the era
  reader's bottom nav (overrides `docs/specs/2026-08-13-landing-page-brief.md`
  §3.2/D3). **All five are Joey's call now, or they die unratified.**
- **`tb-priv-02` is a documented, tested gap** — sexuality speculation with no
  orientation token cannot be caught deterministically without also refusing
  "what is track five on Midnights really about?". Do not "fix" it with a regex
  pinned to the probe text; that overfits the probe, not the class.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap**
  (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`). Deliberately NOT
  fixed — floating feedback over a reading sheet may be intentional. Joey's call.

## Merge authorization

**Joey is the ONLY merger** (2026-08-14: "No one else should be merging on this
repo except you. Wyatt is no longer working on the project"), delegated to this
session for the work it produced. Standing and NOT spent: **max two review
rounds**, never a third.

**Codex is OUT, by Joey's explicit ruling** (2026-08-14): "we can ignore the
codex reviews. use claude code review. I know that you think that's not good,
but it's all we have right now. if that's already been done then just stop
reminding me about it." This OVERRIDES Workflow rule 3's `/codex:review`
requirement. A `reviewer` agent (optionally `model: "fable"`) is the sanctioned
substitute. **Do not re-raise the missing-Codex gap with him** — he has heard it
and ruled. Note it in a PR body if it matters; do not put it in chat again.

## Autonomous decisions — review surface

- Merged #2140 and #2141 myself under the delegated authority above, after
  verifying each diff (additive-only, guard idiom, self-limiting window).
- Did NOT strip `@wjduvall-cmd` from ownership-routing or bot-identity sites in
  the same PR as the notification sweep — those change behaviour, and runners
  execute on Wyatt's account. Split, with the risky half reported not guessed.
- `auto-merge-content.yml` is landing UI CODE PRs, not just content (#2140 went
  in unattended). Correct per its own guard, which only blocks server-executing
  and secret-reading files. **Flagged to Joey; tightening is his call.**

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. -->

- (none yet). A `reviewer` with `model: "fable"` is a MODEL OVERRIDE, NOT an
  architect escalation. Do not log those here.

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only, Clownbot keeps its tab (`docs/decisions.md`
  2026-08-13). **Joey reversed his own brief once: there is NO Threads filter
  chip.** Six filters forever: Music, Fashion, Tour, Relationship, Lore, Videos.
- Clownbot rulings J1–J7, same file. Plans need no sign-off; no local-concurrency
  cap (2026-08-13). Merge authority is human. Runners live on Wyatt's account.
  No self-armed PR monitors, ever.

## Known traps

- **A passing suite is not evidence; EXECUTION against the real corpus is.**
  Every genuine defect this week came from running the pipeline over live data,
  never from reading code — each time 2600+ green tests had made us confident
  and wrong, because fixtures used the easy case. Demand a reproduction.
- **`apps/web` IS NOT LINTED BY ANYTHING** (verified 2026-08-14): root
  `eslint.config.mjs` ignores `apps/web/**` (line 13), `apps/web/package.json`
  has no lint script, CI runs the root lint. **"lint clean" says nothing about
  any component or lib module there** — typecheck and the suite are the only
  real gates. Turning it on is its own task; bundling it into a feature PR makes
  the diff unreviewable.
- **Over-refusal and under-blocking pull in opposite directions in the Clownbot
  gates. Any change to one must be tested against both.** Round 1's fix bricked
  sessions: screening the bot's own refusal copy with input patterns meant one
  refusal permanently killed the conversation. Both directions now pinned.
- **`shop.ts`'s affiliate seam is DORMANT, not absent.** `isAffiliate()` returns
  false for every retailer, `SHOP_DISCLOSURE` never renders. **The moment anyone
  flips `isAffiliate`, disclosure MUST render** — a one-file change silently
  carrying a compliance duty.
- **A SUM of heights is not a POSITION.** Four fixes died here. Ask the DOM where
  an edge IS (`getBoundingClientRect().bottom`) and recompute on scroll;
  `measureChromeBottom()` vs `measureChromeHeight()` encodes the distinction.
- **`pointer-events` INHERITS — a `pointer-events-none` shell does not protect
  you.** Eleven `opacity-0` adornments were invisible AND hit-testable. **Verify
  a control with `elementFromPoint` and a real tap**, never by checking that its
  container moved — that mistake cost two review rounds.
- **Two mechanisms for one fact is this repo's recurring defect** — three times
  in one branch. Grep for other callers before declaring a fix done.
- **Reddit blocks this environment outright** (403, WebFetch refuses it) and
  published r/TaylorSwift counts span 200k–3.8M the same week — **aggregators
  are not a substitute.** 15 of 30 communities carry `memberCount: null` BY
  DESIGN; never write 0. Facebook is invisible outside a login; half of public
  Discord listings are wrong (verify via
  `discord.com/api/v10/invites/<code>?with_counts=true`).
- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — it is what § Never babysit your own PR bans, and it
  would not have fixed the stalls (background agents already re-invoke on
  completion). He then said "stand down and turn off anything automated".
  **Build it only if he reaffirms explicitly.** Never build it silently.
- **Parallel sessions share this checkout** — `STATE.md`/`PLAN.md` collided twice
  on 2026-08-14. Verify the branch right before every commit.
- **Pre-existing failures, not yours:** `scripts/social/lib/card-render.test.ts`
  (missing `satori`) and repo-wide `npm run typecheck` (`apps/mobile`). Use
  `npm run typecheck --workspace=@swift2/web`. `npm run lint` may show ~630
  errors from a `.scratch/` worktree — add `--ignore-pattern ".scratch/**"`.
- `apps/web/next-env.d.ts` is regenerated by any dev server — leave it
  uncommitted, never `git restore` it. `post-queue.mjs` + `delete-media.mjs` hit
  LIVE accounts and `guard.sh` denies them. `core.autocrlf=true`.
  `.claude/worktrees/` holds ~30 worktrees — never clean.
- **Codex review path:** `codex:rescue` skill → `codex:codex-rescue` subagent,
  always `--background`, then poll `codex-companion.mjs result <job-id>`.
- **Reader has no URL routes** — one client page, React context; `?item=`,
  `?lens=`, `?era=` read ONCE on mount, never written back.

## Open threads

- [ ] **Marketplace research (Joey's brief, 2026-08-14) — BLOCKED on API keys,
      by his choice.** Curated official + viral fan-made merch dataset. Every
      hype source in the brief is unreachable from here (Etsy/Redbubble/
      TeePublic 403, Reddit refused at tool level, TikTok an empty shell) —
      agents pointed at those would invent view counts. **Tier 1 is already
      solved, free, no signup:** `store.taylorswift.com/products.json`, an open
      Shopify endpoint verified live. **Needs from Joey:** Reddit script app,
      Etsy Open API Personal App, then Awin + Amazon Associates.
      **Permanent ceiling — tell him before he signs up for more:** per-video
      TikTok/IG counts for accounts you don't own are unobtainable on any
      legitimate path, and Etsy listings carry no review count. Scope
      `hype_evidence` to Reddit score + comments + press. Must feed the
      EXISTING Merch surface (156 products, #2116), not a parallel dataset.
- [ ] 3 appearance videos carry no topic tag — their own records support none.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix if it
      ever matters.

## Next obvious step

1. **Verify the depth-port executor's output against `PLAN.md`'s step 5 nav
   proofs BEFORE anything else** — `BottomNav.tsx` diff empty vs `main`,
   `THRESHOLD = 7`, `npm test -- bottom-nav` green. Then the device check at
   360px and 390px, then merge.
2. **Close #2116** with a comment: depth work landed separately, tab merge
   rejected because #2140 removed its reason.
3. **Await tomorrow's watchdog run** — Check 1 should alarm (Karen still not
   enabled); Check 2 reports the first post-rotation news-worker run. Neither
   needs a session babysitting it; read the alert when it lands.
4. **Reconcile `HUMAN-ACTIONS.md`** every session that opens it. #1 (Vercel/
   GitHub ownership) is effectively answered — Joey co-owns the team and Wyatt
   retains access; rewrite it rather than leaving the false lapse-risk framing.
5. Joey's hands, not mine: the three #2110 questions, the five decisions that
   lost their owner, whether `auto-merge-content` should stop auto-landing UI
   code, and the Apps Script / Resend / env setup in
   `docs/ops/community-merch-submissions.md`.
