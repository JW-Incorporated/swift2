# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**Community + Merch sections** — branch `feature/community-merch`, commits
`0b347d66` (build) + `f21b9b88` (review fixes). Spec in `PLAN.md`. `origin/main`
merged in; **PR #2110 is MERGED (`109e776a`)**, so the dataset is on main.

**Fable review: round 1 REJECT (5 findings) → all fixed → round 2 APPROVE**, all
five re-verified by reproduction, no regressions. 2881/2881, typecheck clean.
Joey's 2-round cap is now spent and Codex is out until Aug 19 — **no further
review is available for this branch.**

The HIGH was **CSV/formula injection into Joey's own sheet**: the route accepted
`note`/`sourcePage` the form never sends and passed them raw to `appendRow`. A
value starting `= + - @` becomes a live formula firing when **Joey** opens the
sheet; the PoC exfiltrated it via `IMPORTXML`. Fixed on both sides —
`neutralizeCell` (route) and `neutralizeCell_` (Apps Script) are the SAME rule
deliberately duplicated, because that webhook may one day have another caller.
**Change one, change both.** The unused fields were deleted, not sanitised.

Three non-negotiable properties:

- **Nothing a user submits ever renders on the site.** Issue #36's no-go
  (`docs/definition-of-done.md:206-212`) forbids UGC-hosting liability.
  Submissions go to sheet + inbox + GitHub issue; Joey curates by hand — which
  is his own stated intent, so it costs nothing.
- **The endpoint never fetches a submitted URL** — SSRF and DoS amplifier.
- **A missing integration must never fail a submission.** Swift2 has NO runtime
  email (mail is Python+Gmail from Actions, unreachable from a route) and NO
  Sheets write anywhere in the tree; the Resend key is verified for
  `4twatches.com` only. Three sinks degrade independently: GitHub issue (day
  one), Sheet (`SUBMISSIONS_SHEET_WEBHOOK_URL`), email (`RESEND_API_KEY`).

**The IP rate limiter cannot be made authoritative** behind a proxy that lets
callers set `x-forwarded-for`. Best-effort; the honeypot is the real floor.
Do not chase a guarantee that is not available.

Sheet id `1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4` in the "Swift App" Drive
folder. **Its 16-column order is fixed and both senders must match it.** Merch
is not empty — `shop.ts` holds 151 shop-the-look products read live off
`CONTENT`, never re-authored.

Shipped 2026-08-14: era reader `e8500905` (#2086), device review `ff4df4ab`
(#2099), Clownbot `3d553340` / `b8a500a3` / `d969a29e`, community research
`109e776a` (#2110). Clownbot confirmed live by fetching the shipped JS bundles,
not inferred from a green build. Rulings J1–J7 in `docs/decisions.md`.

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **#2110 merged with three questions still unanswered.** Joey deferred them;
  merging did not resolve them. (1) **Instagram + TikTok** — item 4b names both,
  the brief omitted them; different shape (creator accounts, not joinable
  groups), so scope was not widened unilaterally. (2) **Who owns the refresh
  cadence** — invites rotate, groups go private; accurate 2026-08-14, decays
  from there. (3) Ratify or veto excluding **`r/TravisAndTaylor`** as an
  anti-fan snark board; `r/GaylorSwift` kept but flagged private since Aug 2025.
- **Codex out until Aug 19 2026 — Workflow rule 3 UNSATISFIED** for Clownbot AND
  this feature. **Run Codex against merged `main` when it returns.** A
  `reviewer` on `model: "fable"` is the authorised stand-in, required to
  REPRODUCE rather than read — which is why it finds what reading passes miss.
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

Per-workstream, never standing. Live: **"please merge when completed"** covers
Community + Merch. All earlier grants are spent. Standing and NOT spent:
**"don't allow codex reviews to go more than 2 rounds."**

## Autonomous decisions — review surface

- Merged #2110 on standing authorisation while Joey's three questions stay open,
  because the feature branch depended on it. Questions logged, not dropped.
- Fixed round 2's LOW (whitespace-prefixed formulas) rather than shipping it as
  a named open finding — two lines, inside the class already being fixed.

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
- **Reddit blocks this environment outright** (403 on `www.` and `oauth.`,
  WebFetch refuses the domain). Published r/TaylorSwift counts span 200k–3.8M
  across sources fetched the same week — **aggregators are not a substitute.**
  15 of 30 communities carry `memberCount: null` BY DESIGN; never write 0.
  Facebook is invisible from outside a login; half of public Discord listings
  are wrong (verify via `discord.com/api/v10/invites/<code>?with_counts=true`);
  Amino shut down entirely 2025-12-19 and listicles still cite it.
- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — it is what § Never babysit your own PR bans, and it would
  not have fixed the stalls (background agents already re-invoke on completion).
  **If he reaffirms, build it.** Never build it silently.
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

- [ ] 3 appearance videos carry no topic tag — their own records support none.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix if it
      ever matters.

## Next obvious step

1. Open the Community + Merch PR and merge it (authorised, review complete).
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot and this feature both.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav. Never been opened on a phone.
5. Joey's hands, not mine: the three #2110 questions, and the Apps Script /
   Resend / env setup in `docs/ops/community-merch-submissions.md`.
