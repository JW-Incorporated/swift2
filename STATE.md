# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**ACTIVE: merge Community + Merch into one section, redesign both.** Joey
2026-08-14. **Drop the Merch tab** (nav → five labelled: Eras, Threads, Mood,
Clownbot, Community), title stays "Community", **full-width 50/50 toggle**
switching **Social** / **Merch**, a section-jump subnav that PREVIEWS depth,
era-style merch filters, an image on every merch item. **`PLAN.md` holds the
facts, the Fable design spec and the steps — read it, not this.**

**The image blocker is RESOLVED — verified by execution: 150 of 156 products**
show their source moment's photo (the look as worn); 6 get a monogram tile.
Those images already render in the era feed: no sourcing, no hotlink risk.
**`shopTheLook` is 156 products, NOT 151 — 151 is the distinct-MOMENT count.**
**Resolve images via `hasRealPrimaryImage()`, never `images.length`.**

**Nav fit is settled:** five labelled tabs FIT — 390/430px comfortably, 320px on
~1.2px slack (proxy-measured), so probable-not-proven. **Any label longer than
"Community" breaks 320px.**

**Actions is down, so work stays committed on the local branch.** The worktree's
objects live in the real repo, so local commits are durable though Temp holds
the files. Wyatt is fixing it; push when it returns.

Shipped 2026-08-14: Community + Merch `22314d5b` (#2112) on `109e776a` (#2110);
era reader `e8500905`; device review `ff4df4ab`; Clownbot `3d553340`/`b8a500a3`.

**The submit form only files GitHub issues until Joey does three things** in
`docs/ops/community-merch-submissions.md`: deploy the Apps Script, verify
`longlivets.com` in Resend, add the env vars. Sheet
`1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4` in "Swift App" — **16-column order
fixed; both senders must match.** Invariants: **nothing user-submitted renders**
(#36), **never fetches a submitted URL** (SSRF), **a missing integration must
never fail a submission.**

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **GITHUB ACTIONS IS DOWN ACCOUNT-WIDE — BILLING. Nothing can merge.** Jobs
  refuse to start: *"recent account payments have failed or your spending limit
  needs to be increased."* Last good run 21:44:44Z 2026-08-14; all later ones
  fail to start. **`build` does not run, so there is no merge gate** — a missing
  `build` is not a red one. Founder fix: Settings → Billing & plans. **Also down:
  `social-poster` (posts are NOT going out) and `watchdog` — the alarm for a dark
  runner is inside the outage.** #2110/#2112 merged green before the cutoff.
- **PR #2114 is parked on that** — this checkpoint, docs only; needs only a
  re-run. **PR #2104 (older, STATE.md-only) is superseded and should be closed,
  not merged** — it predates everything since the chat-UI merge.
- **#2110 merged with three questions still unanswered** (deferred, not
  resolved): **Instagram + TikTok** scope — item 4b names both, the brief
  omitted them, different shape so not widened unilaterally; **who owns the
  refresh cadence** — accurate 2026-08-14, decays; **ratify or veto excluding
  `r/TravisAndTaylor`** (`r/GaylorSwift` kept, flagged private since Aug 2025).
- **Codex out until Aug 19 2026 — Workflow rule 3 UNSATISFIED** for Clownbot AND
  Community + Merch. **Run Codex against merged `main` when it returns.** A
  `reviewer` on `model: "fable"` is the stand-in, required to REPRODUCE not read.
- **`guard-code` + `enable` are red on EVERY code PR — #2113, pre-existing.**
  Verdict correct, delivery broken (exits 1 under `bash -e`). #2108 and #2112
  merged so. `docs/engineering-lessons.md` § CI. Don't fix it in a feature PR.
- **Wyatt owns FIVE unsettled items:** Clownbot's model tier (`claude-sonnet-5`),
  the 200/day/instance cap, ratifying the Mood route pattern, signing the
  Clownbot decisions entry, and the era reader's bottom nav (overrides
  `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3).
- **The bottom nav has never been opened on a real phone.** Told twice, merged
  anyway. Correct-in-code plus passing tests is not a device check.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap**
  (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`). Deliberately NOT
  fixed — Joey's call. (`tb-priv-02` is the other accepted gap; lessons doc.)

## Merge authorization

Per-workstream, never standing — **all grants spent; a new effort needs a new
one.** Standing, NOT spent: **"don't allow codex reviews more than 2 rounds."**

## Autonomous decisions — review surface

- Merged #2110 and #2112 on standing authorisation — #2110 with Joey's three
  questions still open (the branch depended on it), #2112 with
  `guard-code`/`enable` red after confirming the same pair was red on merged
  #2108 and `build` was green (filed #2113). Left #2104 open, not closed.
- Fixed round 2's LOW (whitespace-hidden formulas) rather than shipping it as a
  named open finding — two characters, inside the class already being fixed.
- Moved durable traps into `docs/engineering-lessons.md`; `CLAUDE.md` points at
  it. The cap was unmeetable while working memory was being used as the record.
- **A `grunt` edited the MAIN checkout** (`fix/karen-mechanics`) not its
  worktree, compressing the wrong base — discarded, done by hand. **That tree
  still has an uncommitted `MAP.md` edit** (a no-op once #2114 lands). Make
  agents echo cwd first.
- **Counted merch image coverage myself after two agents disagreed** (147 vs
  151, both unsound). Lesson written up in `docs/engineering-lessons.md`
  § "A count is only as good as the method" — including that `node
  --experimental-strip-types` cannot run this repo (extensionless imports).

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. A `reviewer` with `model: "fable"` is a
     MODEL OVERRIDE, not an architect escalation — do not log those here. -->

- (none yet).

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only; Clownbot rulings J1–J7 (`docs/decisions.md`
  2026-08-13). **Joey reversed his own brief once: there is NO Threads filter
  chip.** Six filters forever: Music, Fashion, Tour, Relationship, Lore, Videos.
  Plans need no sign-off. Merge authority is human. No self-armed monitors.

## Known traps

**The durable ones live in `docs/engineering-lessons.md` — read it before
touching `apps/web`, the safety gates, or the community dataset.** A passing
suite is not evidence; `apps/web` is unlinted; over-refusal and under-blocking
pull opposite ways; a sum of heights is not a position; `pointer-events`
inherits; two mechanisms for one fact; user text in a spreadsheet is a formula.

- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — § Never babysit your own PR bans it, and it would not
  have fixed the stalls (background agents already re-invoke on completion).
  **If he reaffirms, build it.** Never build it silently.
- `post-queue.mjs` + `delete-media.mjs` hit LIVE accounts; `guard.sh` denies
  them. `core.autocrlf=true`. `.claude/worktrees/` ~30 worktrees — never clean.
- **The dev server scaffolds `apps/web/{README,AGENTS,CLAUDE}.md`** — untracked,
  never in git, not work; they return on every run. `README.md` **trips the Stop
  gate every turn until a human deletes it** (`rm -f` guard-denied, correctly).

## Open threads

- [ ] 3 appearance videos carry no topic tag; folklore/evermore have no Tour
      content. Both true of the world, not gaps.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix.

## Next obvious step

0. **`PLAN.md` steps 1–5 are READY — dispatch executors.** Nothing is stalled:
   the image blocker resolved, and the official/fan-made selector is
   render-gated so it needs no answer to build.
1. **Joey's hands:** the Apps Script / Resend / env setup in
   `docs/ops/community-merch-submissions.md`, plus his three #2110 questions.
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot AND Community + Merch.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav — never seen on a phone, and the
   320px five-tab margin is too thin to settle any other way.
5. #2113 (guard-code red on every code PR) when someone wants CI quiet again.
