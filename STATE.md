# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory.

     2026-08-14: consolidated after two parallel sessions collided on this file.
     The era-reader session merged `origin/main` (Clownbot) into its branch and
     kept BOTH sets of open items. Nothing below is safe to drop unread. -->

## Current focus

**BUILT, UNDER REVIEW: Community + Merch sections** (commit `0b347d66`) — — branch `feature/community-merch`
(off `research/communities`, so **PR #2110 merges first**). Plan in `PLAN.md`.
Built by four parallel agents. Verified by me: 2861/2861, typecheck clean,
new test files confirmed to actually run (61 tests), no secrets committed.
**Fable review round 1: REJECT — all 5 findings being fixed.** It is the ONLY
review this gets (Codex out until Aug 19), so rule 3 stays unsatisfied.

- **HIGH, and the one that matters: CSV/FORMULA INJECTION into Joey's sheet.**
  The route accepted `note`/`sourcePage` the form never sends, passed them raw
  to the Apps Script, which `appendRow`ed them unneutralised. A value starting
  `= + - @` becomes a LIVE FORMULA that fires when **Joey** opens the sheet —
  the reviewer's PoC exfiltrates the sheet to an attacker's server via
  `IMPORTXML`. **Any user string reaching a spreadsheet cell must be prefixed
  with an apostrophe, on BOTH sides.** The unused fields are being removed
  outright — deleting a field beats sanitising one.
- MED: no timeout on the GitHub/Resend fetches (only the sheet had one), and
  GitHub is the always-on sink, so a hang pins the serverless function.
- LOW: markdown breakout in the issue body; unbounded rate-limit map;
  `section` accepted free text instead of the two-value enum.

**The IP rate limiter cannot be made authoritative** behind a proxy that lets
callers set `x-forwarded-for`. It is best-effort; the honeypot is the real
floor. Do not add complexity chasing a guarantee that is not available.

Verified clean by EXECUTION: all 30 communities match the source JSON with all
15 nulls preserved, merch derives from `CONTENT`, nothing user-submitted can
reach the rendered site, honeypot fails closed, no-config path succeeds, email
HTML escaped, no secret in the client bundle, nav wired across all six modes.
**Joey authorised the merge** ("please merge when completed").

Two design properties that are NOT negotiable, both load-bearing:

- **Nothing a user submits ever renders on the site.** Issue #36's no-go
  (`docs/definition-of-done.md:206-212`) forbids user-generated-content hosting
  liability; a public form that auto-publishes walks straight into it.
  Submissions go to Joey's sheet, inbox and a GitHub issue. He curates by hand.
  This matches his own stated intent, so it costs nothing.
- **The endpoint never fetches a submitted URL** — SSRF and DoS amplifier.
  Domain and platform are derived from the string only.

**Infrastructure reality (surveyed, not assumed):** Swift2 has NO runtime email
(its mail is Python+Gmail from GitHub Actions, unreachable from a Vercel route)
and there is NO Google Sheets write capability anywhere in the projects tree.
The existing Resend key is verified for `4twatches.com` and cannot send as
`@longlivets.com`. **So the endpoint has three sinks that degrade
independently:** GitHub issue (works day one, reuses `/api/feedback`), Sheet
(needs `SUBMISSIONS_SHEET_WEBHOOK_URL`), email (needs `RESEND_API_KEY` +
verified domain). **A missing integration must never fail a submission.**

Sheet created in Joey's "Swift App" Drive folder, id
`1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4`. Column order is fixed and the
route must match it.

**Merch is not starting empty** — `lib/longlive/shop.ts` already holds the
shop-the-look products, affiliate-ready. Item 4a lists affiliate DISCLOSURE as
an open question; flagged for report.

Three efforts shipped 2026-08-14; the research PR is open and awaiting Joey.

| Effort | State |
|---|---|
| Era reader rework | MERGED `e8500905` (#2086) |
| Device-review round 1 | MERGED `ff4df4ab` (#2099) |
| Clownbot rebuild | MERGED `3d553340` (#2087) |
| Clownbot chat UI | MERGED `b8a500a3` (#2103) |
| Clownbot review fixes | MERGED `d969a29e` (#2108) |
| **Community research** | **PR #2110 OPEN — needs Joey** |

All Clownbot work confirmed live by fetching the shipped JS bundles, not
inferred from a green build. Rulings J1-J7 in `docs/decisions.md`.

**PR #2110 — the Community dataset.** 30 communities, 8 platforms, every entry
carrying verification provenance (`verified-live` / `third-party-cited` /
`listed-only` / `blocked-unverified`). Deliberately NOT wired into the app:
it sits at the brief's literal `data/` paths, and landing it as content needs
the repo's `supabase/seed/` convention plus validator support.

**Three things Joey must answer before it merges:**
1. **Instagram + TikTok** — `docs/definition-of-done.md` item 4b names both;
   the research brief omitted them. Different shape (creator accounts, not
   joinable groups), so scope was NOT widened unilaterally.
2. **Who owns the refresh cadence** the spec requires. Invites rotate, groups
   go private. The file is accurate on 2026-08-14 and decays from there.
3. **One editorial call to ratify or veto:** `r/TravisAndTaylor` was EXCLUDED
   as an anti-fan snark board rather than a corner of the fandom.
   `r/GaylorSwift` was kept but flagged as reportedly private since Aug 2025.

**A Reddit API app would unblock the missing member counts** and make the
dataset re-runnable rather than a snapshot. Five minutes at reddit.com/prefs/apps.

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **Clownbot review: 2 Fable rounds, both REJECT, all findings FIXED and
  merged (#2108, `d969a29e`).** Codex was down; a `reviewer` on
  `model: "fable"` stood in under the authorised fallback, required to
  REPRODUCE rather than read — which is why it found what a reading pass
  had missed. Round 1: the output gate ran INPUT-tuned regexes over the bot's
  own prose (the over-refusal root cause); it caught 0 of 13 redline drafts;
  prior transcript turns bypassed every input gate (a real jailbreak route,
  `screenConversation` existed and was never called); hyphenated queries
  retrieved nothing. Round 2 then caught that the fix had REGRESSED the
  product — screening the bot's own refusal copy with input patterns meant
  **one refusal permanently bricked the session.**
  **THE STANDING LESSON: over-refusal and under-blocking pull in opposite
  directions in these gates. Any change to one must be tested against both.**
  Both directions are now pinned by tests. Joey's 2-round cap is spent, so
  the final fix shipped reviewed only by the orchestrator.
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

Granted per-workstream, never standing — **all are spent.** A NEW effort needs
a NEW grant. Joey's framing across the day: era reader "you have my
permission"; Clownbot "I am giving you merge authorization"; the chat UI
"implement the current mockup live"; the review fixes "merge please".
Standing and NOT spent: **"don't allow codex reviews to go more than 2
rounds."**

## Autonomous decisions — review surface

<!-- One line each; clear after Joey reviews. -->

Cleared 2026-08-14 — the era-reader and Clownbot calls were reviewed and their
PRs merged. Community-research calls are listed in § Current focus (3 items
awaiting Joey) and in `docs/decisions.md` 2026-08-14.

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

- **Reddit blocks this environment outright** — HTTP 403 at the edge on
  `www.` AND `oauth.`, and WebFetch refuses the domain. No credential exists
  here. Do not burn time on UA/header tricks; it needs a real Reddit API app.
  Published member counts for r/TaylorSwift span 200k-3.8M across sources
  fetched the same week (19x) — **aggregators are not a substitute.**
- **Facebook groups are invisible from outside a login.** Named in the brief
  as the largest category; delivered the fewest entries. A group name from a
  search snippet, with no description, is NOT evidence — writing a warm
  description for it is fabrication laundered through a real URL.
- **Half of all public Discord listings are wrong.** 10 of 22 candidate
  invites were dead or resolved to a different server.
  `discordbotlist.com` serves its OWN promo invite on every page. Verify each
  invite via `discord.com/api/v10/invites/<code>?with_counts=true`.
- **Amino shut down entirely 2025-12-19.** Older listicles still cite it.

- **`apps/web` IS NOT LINTED BY ANYTHING — verified 2026-08-14.** The root
  `eslint.config.mjs` ignores `apps/web/**` (line 13); `apps/web/package.json`
  has NO lint script (dev/prebuild/build/start/typecheck only); CI runs the
  root `npm run lint`, which skips it. **So "lint clean" says nothing about
  any component or lib module** — typecheck and the suite are the only real
  gates on `apps/web`. Do not quote lint as verification for web code.
  Turning it on is its own task: unknown pre-existing backlog, and bundling it
  into a feature PR makes the diff unreviewable.
- **`shop.ts`'s affiliate seam is DORMANT, not absent.** `isAffiliate()`
  returns false for every retailer, `buildShopUrl()` returns the raw URL, and
  `SHOP_DISCLOSURE` exists but never renders. So no affiliate link ships today
  and no disclosure is required today. **The moment anyone flips `isAffiliate`,
  disclosure MUST render or it becomes a compliance problem.** One-file change,
  easy to make without noticing the obligation attached to it.

## Open threads

- [ ] 18 → **3** appearance videos still carry no topic tag. Deliberate: their
      own records support none. They remain reachable under Videos.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13. `TheoryNote` has no date/song/moment
      pointer; an authored `anchorHint` is the improvement path if it matters.

## Next obvious step

1. Get Joey's three answers on PR #2110 (above), then merge it.
2. **Run Codex against merged `main` when credits return (Aug 19).** Workflow
   rule 3 is unsatisfied for the whole Clownbot feature; the last safety fix
   shipped reviewed only by the orchestrator.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav. Never been opened on a phone.
