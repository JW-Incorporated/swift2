# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**Nothing in flight.** Community + Merch **MERGED `22314d5b` (#2112)** on top of
the dataset **MERGED `109e776a` (#2110)**. Both sections are live. Earlier the
same day: era reader `e8500905` (#2086), device review `ff4df4ab` (#2099),
Clownbot `3d553340` / `b8a500a3` / `d969a29e`. Clownbot was confirmed live by
fetching the shipped JS bundles, not inferred from a green build. Rulings J1–J7
and the 2026-08-14 entries are in `docs/decisions.md`.

**The submit form does nothing useful until Joey does three things** in
`docs/ops/community-merch-submissions.md`: deploy the Apps Script, verify
`longlivets.com` in Resend, add the env vars. Until then submissions land only
as GitHub issues — by design, but that is what he has today.

Community + Merch got **two Fable rounds: REJECT (5 findings) → all fixed →
APPROVE**, everything re-verified by reproduction, plus one LOW fixed after
(formulas hidden behind leading whitespace). Merged at 2890/2890, typecheck
clean. The HIGH was **CSV/formula injection into Joey's own sheet** — the route
accepted `note`/`sourcePage` the form never sends and passed them raw to
`appendRow`, so a value starting `= + - @` became a live formula firing when
*Joey* opened the sheet; the PoC exfiltrated it via `IMPORTXML`. `neutralizeCell`
(route) and `neutralizeCell_` (Apps Script) are now the SAME rule deliberately
duplicated across a trust boundary. **Change one, change both.**

Three properties of that endpoint are non-negotiable:

- **Nothing a user submits ever renders on the site.** Issue #36's no-go
  (`docs/definition-of-done.md:206-212`) forbids UGC-hosting liability.
  Submissions go to sheet + inbox + GitHub issue; Joey curates by hand — his own
  stated intent, so it costs nothing.
- **The endpoint never fetches a submitted URL** — SSRF and DoS amplifier.
- **A missing integration must never fail a submission.** Swift2 has NO runtime
  email (mail is Python+Gmail from Actions, unreachable from a route) and NO
  Sheets write anywhere; the Resend key is verified for `4twatches.com` only.
  Three sinks degrade independently: GitHub issue (day one), Sheet, email.

**The IP rate limiter cannot be made authoritative** behind a proxy that lets
callers set `x-forwarded-for`. Best-effort; the honeypot is the real floor.
Sheet id `1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4`, "Swift App" Drive
folder — **its 16-column order is fixed and both senders must match it.**

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **#2110 merged with three questions still unanswered.** Joey deferred them;
  merging did not resolve them. (1) **Instagram + TikTok** — item 4b names both,
  the brief omitted them; different shape (creator accounts, not joinable
  groups), so scope was not widened unilaterally. (2) **Who owns the refresh
  cadence** — invites rotate, groups go private; accurate 2026-08-14 and decays.
  (3) Ratify or veto excluding **`r/TravisAndTaylor`** as an anti-fan snark
  board; `r/GaylorSwift` kept but flagged private since Aug 2025.
- **Codex out until Aug 19 2026 — Workflow rule 3 UNSATISFIED** for Clownbot AND
  Community + Merch. **Run Codex against merged `main` when it returns.** A
  `reviewer` on `model: "fable"` is the authorised stand-in, required to
  REPRODUCE rather than read — which is why it finds what reading passes miss.
- **`guard-code` + `enable` are red on EVERY code PR — issue #2113, pre-existing,
  not yours.** The verdict is correct (an API route reading secrets is not
  auto-mergeable); it just exits 1 under `bash -e` instead of emitting
  `server_code`. #2108 and #2112 both merged in this state. **`build` is the
  merge gate** — don't treat these as blocking, don't fix them in a feature PR.
- **Wyatt owns FIVE unsettled items:** Clownbot's model tier (`claude-sonnet-5`,
  one named constant), the 200/day/instance cap, ratifying the Mood route
  pattern, signing the Clownbot decisions entry, and the era reader's bottom nav
  (overrides `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3).
- **The bottom nav has never been opened on a real phone.** Joey was told twice
  and merged anyway. Correct-in-code plus passing tests is not a device check.
- **`tb-priv-02` is a documented, tested gap** — sexuality speculation with no
  orientation token cannot be caught deterministically without also refusing
  "what is track five on Midnights really about?". Do not "fix" it with a regex
  pinned to the probe text; that overfits the probe, not the class.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap**
  (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`). Deliberately NOT
  fixed — floating feedback over a reading sheet may be intentional. Joey's call.

## Merge authorization

Per-workstream, never standing — **all current grants are now spent.** A new
effort needs a new grant. Standing and NOT spent: **"don't allow codex reviews
to go more than 2 rounds."**

## Autonomous decisions — review surface

- Merged #2110 on standing authorisation while Joey's three questions stay open,
  because the feature branch depended on it. Questions logged, not dropped.
- Fixed round 2's LOW (whitespace-hidden formulas) rather than shipping it as a
  named open finding — two characters, inside the class already being fixed.
- Merged #2112 with `guard-code`/`enable` red, after confirming the same pair was
  red on merged #2108 and that `build` was green. Filed as #2113 instead.

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

**The durable ones now live in `docs/engineering-lessons.md` — read it before
touching `apps/web`, the safety gates, or the community dataset.** It carries:
a passing suite is not evidence; `apps/web` is unlinted so "lint clean" proves
nothing; over-refusal and under-blocking pull opposite ways; a sum of heights is
not a position; `pointer-events` inherits; two mechanisms for one fact; the
dormant affiliate seam; anything user-supplied reaching a spreadsheet is a
formula; and every external-research blocker (Reddit, Facebook, Discord, Amino).
Only session-scoped items stay below.

- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — it is what § Never babysit your own PR bans, and it would
  not have fixed the stalls (background agents already re-invoke on completion).
  **If he reaffirms, build it.** Never build it silently.
- `scripts/social/post-queue.mjs` + `delete-media.mjs` hit LIVE accounts and
  `guard.sh` denies them. `core.autocrlf=true`. `.claude/worktrees/` holds ~30
  worktrees — never clean. `social-poster-workflow.test.ts.tmp` is scratch.

## Open threads

- [ ] 3 appearance videos carry no topic tag — their own records support none.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix if it
      ever matters.

## Next obvious step

1. **Joey's hands, not mine:** the Apps Script / Resend / env setup in
   `docs/ops/community-merch-submissions.md`, plus his three deferred #2110
   questions.
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot AND Community + Merch.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav — six tabs in its icon-only
   degraded state, still never opened on a phone.
5. Issue #2113 (guard-code red on every code PR) when someone wants CI quiet.
