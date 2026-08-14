# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**Nothing in flight.** Community + Merch **MERGED `22314d5b` (#2112)** on top of
the dataset **MERGED `109e776a` (#2110)**; both sections are live. Earlier the
same day: era reader `e8500905` (#2086), device review `ff4df4ab` (#2099),
Clownbot `3d553340` / `b8a500a3` / `d969a29e` — confirmed live by fetching the
shipped JS bundles, not inferred from a green build.

**The submit form only files GitHub issues until Joey does three things** in
`docs/ops/community-merch-submissions.md`: deploy the Apps Script, verify
`longlivets.com` in Resend, add the env vars. By design — but that is today.

Community + Merch got **two Fable rounds: REJECT (5 findings) → all fixed →
APPROVE**, plus one LOW fixed after. The HIGH was **CSV/formula injection into
Joey's own sheet**; the rule and its lesson are in `docs/engineering-lessons.md`
§ Safety gates, the endpoint's invariants are on its `MAP.md` rows. Three that
must not be relearned the hard way: **nothing user-submitted ever renders**
(issue #36), **the endpoint never fetches a submitted URL** (SSRF), **a missing
integration must never fail a submission**.

Sheet id `1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4`, "Swift App" Drive
folder — **its 16-column order is fixed and both senders must match it.**

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **GITHUB ACTIONS IS DOWN ACCOUNT-WIDE — BILLING. Nothing can merge.** Jobs
  refuse to start: *"recent account payments have failed or your spending limit
  needs to be increased."* Last good run `CI` 2026-08-14T21:44:44Z; everything
  from ~21:49Z fails to start. **`build` does not run, so there is no merge
  gate** — do not merge past it, and do not read a missing `build` as red.
  Fix is a founder's: GitHub → Settings → Billing & plans. **Also silently
  down: `social-poster` (scheduled posts are NOT going out) and `watchdog`,
  which is the thing that emails when a runner goes dark — the alarm is inside
  the outage.** #2110 and #2112 both merged on genuinely green builds from
  before the cutoff; neither is suspect.
- **PR #2114 is parked on that** — this checkpoint, docs only; needs only a
  re-run. **PR #2104 (older, STATE.md-only) is superseded by it and should be
  closed, not merged** — it predates everything since the chat-UI merge.

- **#2110 merged with three questions still unanswered** (Joey deferred them;
  merging did not resolve them): **Instagram + TikTok** scope — item 4b names
  both, the brief omitted them, different shape so it was not widened
  unilaterally; **who owns the refresh cadence** — the file is accurate
  2026-08-14 and decays; **ratify or veto excluding `r/TravisAndTaylor`** as an
  anti-fan board (`r/GaylorSwift` kept but flagged private since Aug 2025).
- **Codex out until Aug 19 2026 — Workflow rule 3 UNSATISFIED** for Clownbot AND
  Community + Merch. **Run Codex against merged `main` when it returns.** A
  `reviewer` on `model: "fable"` is the authorised stand-in, required to
  REPRODUCE rather than read — which is why it finds what reading passes miss.
- **`guard-code` + `enable` are red on EVERY code PR — #2113, pre-existing.**
  Verdict correct, delivery broken (exits 1 under `bash -e` instead of emitting
  `server_code`). #2108 and #2112 merged in this state. Details in
  `docs/engineering-lessons.md` § CI. Don't fix it inside a feature PR.
- **Wyatt owns FIVE unsettled items:** Clownbot's model tier (`claude-sonnet-5`,
  one named constant), the 200/day/instance cap, ratifying the Mood route
  pattern, signing the Clownbot decisions entry, and the era reader's bottom nav
  (overrides `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3).
- **The bottom nav has never been opened on a real phone.** Told twice, merged
  anyway. Correct-in-code plus passing tests is not a device check.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap**
  (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`). Deliberately NOT
  fixed — floating feedback over a reading sheet may be intentional. Joey's call.
  (`tb-priv-02`, the other known-and-accepted gap, is in the lessons doc.)

## Merge authorization

Per-workstream, never standing — **all current grants are spent; a new effort
needs a new grant.** Standing and NOT spent: **"don't allow codex reviews to go
more than 2 rounds."**

## Autonomous decisions — review surface

- Merged #2110 on standing authorisation while Joey's three questions stay open,
  because the feature branch depended on it. Questions logged, not dropped.
- Fixed round 2's LOW (whitespace-hidden formulas) rather than shipping it as a
  named open finding — two characters, inside the class already being fixed.
- Left `PR #2104` open rather than closing it unilaterally; see above.
- Merged #2112 with `guard-code`/`enable` red, after confirming the same pair was
  red on merged #2108 and that `build` was green. Filed as #2113 instead.
- Moved the durable traps out of `STATE.md` into `docs/engineering-lessons.md`
  and pointed `CLAUDE.md` § Conventions at it. The cap was unmeetable because
  working memory was being used as the record; this separates them.
- **A `grunt` sent to compress `MAP.md` edited the MAIN checkout**
  (`Documents\Claude\Projects\Swift2`, branch `fix/karen-mechanics`) not its
  worktree, compressing that branch's base — output had no Community + Merch
  rows, so it was discarded and I compressed by hand. **That tree still has an
  uncommitted `MAP.md` edit I did not revert** (not mine to discard; a no-op
  once #2114 lands). Next brief: make the agent echo its resolved cwd first.

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. -->

- (none yet). A `reviewer` with `model: "fable"` is a MODEL OVERRIDE, NOT an
  architect escalation — do not log those here.

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only, Clownbot keeps its tab; Clownbot rulings J1–J7
  (`docs/decisions.md` 2026-08-13). **Joey reversed his own brief once: there is
  NO Threads filter chip.** Six filters forever: Music, Fashion, Tour,
  Relationship, Lore, Videos. Plans need no sign-off; no local-concurrency cap.
  Merge authority is human. Runners are on Wyatt's account. No self-armed
  PR monitors, ever.

## Known traps

**The durable ones now live in `docs/engineering-lessons.md` — read it before
touching `apps/web`, the safety gates, or the community dataset.** A passing
suite is not evidence; `apps/web` is unlinted so "lint clean" proves nothing;
over-refusal and under-blocking pull opposite ways; a sum of heights is not a
position; `pointer-events` inherits; two mechanisms for one fact; the dormant
affiliate seam; user text reaching a spreadsheet is a formula; every
external-research blocker. Only session-scoped items stay below.

- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — § Never babysit your own PR bans it, and it would not
  have fixed the stalls (background agents already re-invoke on completion).
  **If he reaffirms, build it.** Never build it silently.
- `scripts/social/post-queue.mjs` + `delete-media.mjs` hit LIVE accounts and
  `guard.sh` denies them. `core.autocrlf=true`. `.claude/worktrees/` holds ~30
  worktrees — never clean. `social-poster-workflow.test.ts.tmp` is scratch.
- **`apps/web/README.md` is untracked npm boilerplate** (empty headings, an
  `npm install @swift2/web` line for a private package) generated by some tool
  mid-session. Not work. `rm -f` is guard-denied, correctly — do not commit it.

## Open threads

- [ ] 3 appearance videos carry no topic tag — their own records support none;
      folklore and evermore have no Tour content (true of the world, not a gap).
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix.

## Next obvious step

0. **Check Actions billing before planning anything** — while it is down nothing
   merges and the social poster is silent. If still down, that is the report.
1. **Joey's hands:** the Apps Script / Resend / env setup in
   `docs/ops/community-merch-submissions.md`, plus his three #2110 questions.
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot AND Community + Merch.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav — six tabs, never seen on a phone.
5. #2113 (guard-code red on every code PR) when someone wants CI quiet again.
