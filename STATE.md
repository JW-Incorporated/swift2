# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->
## Current focus

**Community + Merch merge — BUILT, REVIEWED, PR #2116 OPEN.** Joey: *"go for it.
let's get it live."* Merch tab dropped (nav → five LABELLED tabs), 50/50
Social/Merch toggle under the "Community" title, section-jump subnav that
PREVIEWS depth via chip counts, era-style merch filters, an image on every merch
item. `PLAN.md` holds the facts and the Fable design spec. Commits: `bcc8f39e`
shell, `bd7293a3` merch, `3382795e` jump bar, `1e92771b` fixes, `838407eb`
scroll-spy. Browser-measured: **150 `<img>` / 6 monogram**, rail 44px, toggle and
rail never co-visible, era order newest-first, no source row (buckets empty).

**Both review rounds spent: REJECT → APPROVE. #2116 CANNOT MERGE — Actions is
down, `build` never runs, and merging past a gate that did not execute is not
on.** 2927 tests, typecheck clean.

Round 1's MEDIUM was **mine**: "156 shoppable **looks**" — the PRODUCT-vs-MOMENT
conflation `docs/engineering-lessons.md` warns about, leaked from my plan into
user copy. **Kept 156, changed the noun to "pieces"** — 156 is what renders as
cards, so the true 151 would contradict the screen. Round 1 cleared `FilterBar`
(behaves identically after the shared-chip refactor).

Round 2's hit-testing scare was settled by execution — **30 `elementFromPoint`
tests, every rail chip, 3 scroll positions, 0 failures**. Its one real defect is
**FIXED, not deferred**: the scroll-spy sorted stale IntersectionObserver
snapshots, marking the next chip active ~40px early on 6 of 12 boundaries; it
now reads live tops, browser-verified across all 12 within 2px. **The reviewer
called it pre-existing; it is pre-existing to the FIX COMMIT but new on this
branch — shipping a defect in code you just wrote is not inheriting one.**

**156 products, NOT 151 (the MOMENT count) — never call products "looks".
Images resolve through `merchItemImage()` → `hasRealPrimaryImage()`, never
`images.length`. 320px has ~1.2px nav slack — no label may exceed "Community".**

**The submit form only files GitHub issues until Joey does three things** in
`docs/ops/community-merch-submissions.md`: deploy the Apps Script, verify
`longlivets.com` in Resend, add the env vars. Sheet
`1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4` in "Swift App" — **16 columns,
order fixed, both senders must match.** Invariants: **nothing user-submitted
renders** (#36), **never fetch a submitted URL** (SSRF), **a missing integration
never fails a submission.**

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **GITHUB ACTIONS IS DOWN ACCOUNT-WIDE — BILLING. Nothing can merge or ship.**
  Jobs refuse to start ("payments have failed or your spending limit needs to be
  increased"); last good run 21:44:44Z 2026-08-14. **`build` does not run, so
  there is no merge gate** — a missing `build` is not a red one. Founder fix:
  Settings → Billing & plans (Wyatt is on it). **Also down: `social-poster`
  (posts NOT going out) and `watchdog` — the alarm for a dark runner is itself
  inside the outage.**
- **PRs #2114 (docs) and #2116 (this feature) are both parked on it.** **#2104
  is superseded — close it, don't merge it.**
- **#2110's three questions are still unanswered** (deferred, not resolved):
  Instagram/TikTok scope; who owns the refresh cadence; ratify or veto excluding
  `r/TravisAndTaylor`. Detail in `data/communities-report.md`.
- **Codex out until Aug 19 2026 — rule 3 UNSATISFIED** for Clownbot AND
  Community + Merch; run it against merged `main` when it returns. A `reviewer`
  on `model: "fable"` stands in, required to REPRODUCE not read.
- **`guard-code` + `enable` are red on EVERY code PR — #2113, pre-existing** and
  explained in `docs/engineering-lessons.md` § CI. `build` is the real gate.
- **Wyatt owns FIVE unsettled items:** Clownbot's model tier (`claude-sonnet-5`),
  the 200/day/instance cap, ratifying the Mood route pattern, signing the
  Clownbot decisions entry, and the bottom nav (overrides
  `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3 — now five tabs, and
  **still never opened on a real phone**; passing tests are not a device check).
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap** —
  deliberately NOT fixed, Joey's call. (`tb-priv-02` is the other accepted gap.)

## Merge authorization

Per-workstream, never standing. **LIVE: "go for it. let's get it live"** covers
Community+Merch — **but Actions is down: commit locally, never merge past a
`build` that never ran.** Standing: **max 2 review rounds.**

## Autonomous decisions — review surface

- Merged #2110 and #2112 on standing authorisation — #2110 with Joey's three
  questions open (the branch depended on it), #2112 with `guard-code`/`enable`
  red after confirming both were red on merged #2108 (filed #2113).
- **Ordered the build waves sequentially** rather than fanning out: agents
  committing in one shared checkout collide, and merchByEra had to exist first.
- Moved durable traps into `docs/engineering-lessons.md`; `CLAUDE.md` points at
  it. The cap was unmeetable while working memory doubled as the record.
- **Chose "156 pieces" over "151 looks"**: 156 is what renders as cards, so the
  smaller true number would contradict the screen.
- **A `grunt` edited the MAIN checkout** (`fix/karen-mechanics`) not its
  worktree — discarded, redone by hand. **That tree still has an uncommitted
  `MAP.md` edit** (a no-op once #2114 lands).
- **Counted merch image coverage myself after two agents disagreed** (147 vs
  151, both unsound); lesson in `docs/engineering-lessons.md`.
- **Fixed round 2's scroll-spy finding instead of shipping it as an open
  finding** — the reviewer called it pre-existing, but it was new on this branch.

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. `model: "fable"` on a normal agent is a
     MODEL OVERRIDE, not an escalation (the design eval was one). Not logged. -->

- (none yet).

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only; Clownbot rulings J1–J7 (`docs/decisions.md`).
  **Joey reversed his own brief once: NO Threads filter chip.** Six filters
  forever: Music, Fashion, Tour, Relationship, Lore, Videos. Plans need no
  sign-off. Merge authority is human. No self-armed monitors.

## Known traps

**The durable ones live in `docs/engineering-lessons.md` — read it before
touching `apps/web`, the safety gates, or the community dataset.** A passing
suite is not evidence; `apps/web` is unlinted; a sum of heights is not a
position; `pointer-events` inherits; two mechanisms for one fact; a count is
only as good as its method.

- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — § Never babysit your own PR bans it, and it would not
  have fixed the stalls. **If he reaffirms, build it** — never silently.
- `post-queue.mjs` + `delete-media.mjs` hit LIVE accounts; `guard.sh` denies
  them. `core.autocrlf=true`. `.claude/worktrees/` ~30 worktrees — never clean.
- **The dev server scaffolds `apps/web/{README,AGENTS,CLAUDE}.md`** — untracked,
  not work; `README.md` **trips the Stop gate every turn until a human deletes
  it** (`rm -f` guard-denied, correctly).

## Open threads

- [ ] 3 appearance videos carry no topic tag; folklore/evermore have no Tour
      content. Both true of the world, not gaps.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss
      (Joey accepted this 2026-08-13); an authored `anchorHint` is the fix.
- [ ] **#2116 open finding:** `space-y-10`'s 40px gap between era sections means
      the active chip flips when the OUTGOING section's bottom crosses the
      chrome line, 40px early. Fixing it means changing spacing or the selection
      rule — a design call, not a bug.

## Next obvious step

0. **Nothing to build. #2116 waits on Actions** — when CI returns, check it goes
   green and merge (authorised). Do NOT re-review; both rounds are spent.
1. **Joey's hands:** the Apps Script / Resend / env setup in
   `docs/ops/community-merch-submissions.md`, plus his three #2110 questions.
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot AND Community + Merch.
3. Hand Wyatt his five items; then the first real-device bottom-nav check —
   320px five-tab margin is too thin to settle any other way.
