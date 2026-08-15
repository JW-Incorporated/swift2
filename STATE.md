# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**Community + Merch merge, `feature/community-social-merch`.** Joey 2026-08-14:
*"go for it. let's get it live."* Merch tab dropped, title stays "Community",
50/50 Social/Merch toggle, section-jump subnav that PREVIEWS depth, era-style
merch filters, an image on every merch item. **`PLAN.md` holds the facts, the
Fable design spec and the steps.**

**ALL FIVE STEPS BUILT — `3382795e`** (`bcc8f39e` nav+shell+toggle, `bd7293a3`
merch, `3382795e` jump bar). Verified by me: **2926/2926**, typecheck clean, no
raw hex, all <300 lines. Browser-measured: **150 `<img>` / 6 monogram**, rail
44px, big toggle and rail never co-visible, real taps landing via
`elementFromPoint`, era order newest-first, `0 of 13 match` persists, no source
row. **`FilterBar` survived its refactor** on a dark AND a light era.

**FABLE REVIEW ROUND 1 OF 2 RUNNING** — the only review this gets (Codex out to
Aug 19, rule 3 otherwise unsatisfied). Pointed at the two places this branch
could be quietly broken: `FilterBar`'s *behaviour* (not just render — no test
locks its DOM) and `pointer-events` hit-testing under the new sticky chrome.

**156 products, NOT 151 (the MOMENT count) — a moment holds a `products[]`
array. Images resolve through `merchItemImage()` → `hasRealPrimaryImage()`,
never `images.length`. Five labelled tabs fit, but 320px has only ~1.2px slack
— no label may exceed "Community".** Work stays committed locally while Actions
is down; the worktree's objects live in the real repo, so commits are durable.

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

- **GITHUB ACTIONS IS DOWN ACCOUNT-WIDE — BILLING. Nothing can merge or ship.**
  Jobs refuse to start: *"recent account payments have failed or your spending
  limit needs to be increased."* Last good run 21:44:44Z 2026-08-14. **`build`
  does not run, so there is no merge gate** — a missing `build` is not a red one.
  Founder fix: Settings → Billing & plans (Wyatt is on it). **Also down:
  `social-poster` (posts are NOT going out) and `watchdog` — the alarm for a dark
  runner is inside the outage.** #2110/#2112 merged green before the cutoff.
- **PR #2114 is parked on that** — docs only; needs only a re-run. **#2104 is
  superseded and should be closed, not merged.**
- **#2110 merged with three questions still unanswered** (deferred, not
  resolved): **Instagram + TikTok** scope (item 4b names both, the brief omitted
  them — not widened unilaterally); **who owns the refresh cadence**; **ratify
  or veto excluding `r/TravisAndTaylor`** (`r/GaylorSwift` kept but flagged).
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
- **The bottom nav has never been opened on a real phone**, and the five-tab
  change makes that check overdue. Passing tests are not a device check.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap**
  (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`) — deliberately
  NOT fixed, Joey's call. (`tb-priv-02` is the other accepted gap.)

## Merge authorization

Per-workstream, never standing. **LIVE: "go for it. let's get it live"** covers
Community+Merch — **but Actions is down, so it CANNOT ship; commit locally and
never merge past a `build` that never ran.** Standing, NOT spent: **"don't allow
codex reviews more than 2 rounds."**

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
  still has an uncommitted `MAP.md` edit** (a no-op once #2114 lands).
- **Counted merch image coverage myself after two agents disagreed** (147 vs
  151, both unsound); lesson in `docs/engineering-lessons.md` § "A count is only
  as good as the method".

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. `model: "fable"` on a normal agent is a
     MODEL OVERRIDE, not an escalation (the design eval was one). Not logged. -->

- (none yet).

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only; Clownbot rulings J1–J7 (`docs/decisions.md`
  2026-08-13). **Joey reversed his own brief once: NO Threads filter chip.** Six
  filters forever: Music, Fashion, Tour, Relationship, Lore, Videos. Plans need
  no sign-off. Merge authority is human. No self-armed monitors.

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

0. **Fix whatever Fable round 1 finds, then round 2 is the LAST one.** Anything
   unresolved after it ships as a named open finding in the PR body, never a
   third round. Then the PR waits on Actions.
1. **Joey's hands:** the Apps Script / Resend / env setup in
   `docs/ops/community-merch-submissions.md`, plus his three #2110 questions.
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot AND Community + Merch.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav — the 320px five-tab margin is too
   thin to settle any other way. Then #2113, when someone wants CI quiet.
