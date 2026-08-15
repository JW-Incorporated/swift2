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

- [ ] **Marketplace research (Joey's brief, 2026-08-14) — BLOCKED on API keys,
      by his choice.** Goal: curated dataset of official + viral fan-made merch.
      Probed first rather than dispatching researchers, because every hype
      source in the brief is unreachable: Etsy/Redbubble/TeePublic 403, Reddit
      refused at tool level, TikTok returns an empty shell. Five agents pointed
      at those would have invented view counts.
      - **Tier 1 is already solved, free, no signup:**
        `store.taylorswift.com/products.json` is an open Shopify endpoint —
        verified live (titles, prices, variants, stock).
      - Joey chose "get proper API access first" over browser automation or a
        scoped-down press-only version. **Needs from him:** Reddit script app
        (reddit.com/prefs/apps), Etsy Open API Personal App
        (developer.etsy.com), then Awin + Amazon Associates for referral data.
      - **Permanent ceiling, tell him before he signs up for more:** per-video
        TikTok/Instagram view counts for accounts you don't own are NOT
        obtainable on any legitimate path (TikTok's only such API is
        academic/non-commercial; IG Business Discovery needs the TARGET to be a
        Business/Creator account). `hype_evidence` should be scoped to Reddit
        score + comments + press. Etsy listings also carry NO review count —
        that is a second call per listing.
      - **Must feed the EXISTING Merch surface (156 products, PR #2116 folds it
        into Community), not a parallel dataset.** Read that PR before building.
- [ ] **#2109 filed** — Codex cross-review owed on #2086, #2087, #2107.
- [ ] 3 appearance videos carry no topic tag — their own records support none.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix if it
      ever matters.

## Session 2026-08-15 (Joey sole owner)

**Joey: "No one else should be merging on this repo except you. Wyatt is no
longer working on the project."** Treat merge authority as delegated to this
session for his work; still never commit to `main` directly.

- **Nav pill drift — MERGED `7bb117b4` (#2118).** The desktop indicator sat
  right of its tab, worsening per tab (19.4px by the last one). Cause was NOT
  the padding arithmetic I guessed: the tabs are `flex-1 basis-0` WITHOUT
  `min-w-0`, so long labels ("Clownbot", "Community") keep a content-based
  minimum and claim more than an even share. The indicator assumed
  `100% / tabCount`. It now measures the active tab's own box. **Third bug this
  week fixed by the same principle: observe where a thing IS, do not compute
  where it ought to be** (see also `measureChromeBottom`, the scrubber rail).
  Also folded the duplicated `useIsomorphicLayoutEffect` into
  `lib/longlive/useIsomorphicLayoutEffect.ts` — FilterBar and TopBar had
  separate private copies.
- **Share on every surface — IN FLIGHT**, issue #2105, branch
  `fix/share-every-surface`. Two calls made for the agent, do not re-open:
  (1) extend the existing one-shot deep-link params, **do NOT add routing** —
  the app is deliberately route-free and PR #1947 set this pattern;
  (2) share the DESTINATION, never the conversation. `share.ts`'s refusal for
  Mood/Clownbot is about never transmitting what a user typed, and that stays.
  The agent must prove the produced URL is unchanged after typing into each.
- **#2118 was merged by `sffan15-sys` automatically**, not by me — worth
  knowing given `auto-merge-content` is meant for content-only PRs and that one
  touched three `.tsx`/`.ts` files. Bears on #2113.

## 2026-08-15 — three silent detectors, all found by execution

**REVIEW POLICY CHANGED (Joey, 2026-08-15): Codex is no longer required. A
Claude review satisfies Workflow rule 3.** Use a `reviewer` on
`model: "fable"`, required to REPRODUCE against real data or a real browser.
**Stop raising the Codex debt** — #2109 carries the record.

- **Shared-checkout guardrail — MERGED `b8b7b782`.** A session lock in
  `guard.sh` denies a branch switch when a DIFFERENT, still-fresh session holds
  the checkout, and the denial names the `git worktree add` escape.
  `git worktree add` is never blocked. **Fails open** on stale/missing/corrupt
  locks; 6h TTL; escape hatch `CLAUDE_ALLOW_SHARED_CHECKOUT=1`. Rule in
  `CLAUDE.md` § Agent shell discipline, how-to in `docs/agents/README.md`.
  **Practice now in force: branch-writing agents get their own worktree under
  the temp dir, never the Projects folder.**
- **Watchdog — MERGED `d51676ce`, this was a P0 failing live.** The Karen alarm
  shipped 08-14 had NEVER RUN. A plain `if:` is implicitly ANDed with
  `success()`, so an unrelated earlier step failing skipped it — and that step
  was failing on a missing `checks: read` permission dropped by the
  least-privilege PR #2119. **Five detection steps were skippable this way**,
  including the scheduled-workflow cadence check, which sat behind a prod smoke
  test that exits non-zero during a real outage — i.e. monitoring was weakest
  exactly when it mattered. Now `checks: read` is granted and the detection
  steps carry `!cancelled()`.
- **Clownbot refusal poisoning — IN FLIGHT**, worktree `wt-clownbot`. Two P1s,
  both reproduced E2E: (1) a refused user turn is re-screened, so ONE blocked
  question refuses the next TWO — including a must-engage battery prompt;
  (2) 7 of 825 corpus docs' fallback copy trips the gate on re-screen, so even
  a CLEAN answer poisons the following turn. **The fix must not create an
  exemption a caller can spoof** — match server-side strings, never a
  client-supplied flag, and test both directions (over-refusal AND
  under-blocking).
- **Supabase rotation — verified fine.** Only `SUPABASE_SERVICE_ROLE_KEY`
  rotated (GH secret 18:31:50Z); its sole consumer is the news-worker, itself a
  documented no-op. The live site never touches Supabase — it renders from
  `*.generated.ts`, and the Vault UI was deleted 2026-08-11. Open: the first
  post-rotation news-worker run had not happened yet; if it goes red with an
  auth error that is the signal. Vercel env + local `.env` not visible here.

**THE PATTERN OF THE DAY: three detectors that failed silently** — Karen's
report path, the watchdog's alarm, and the guardrail's own branch parsing (it
recorded `2>` from a shell redirect). Each looked healthy while doing nothing.
All three surfaced only because something EXECUTED them against real
conditions. A green suite is not evidence; dogfood the thing you just built.

## Next obvious step

0. **CI billing is CLEAR — #2116's stated blocker is gone.** It said "Actions
   is down account-wide on billing, so `build` never runs"; verified 2026-08-15
   03:45Z that its own `build` passed in 2m3s and three workflows completed
   successfully in the preceding seven minutes. The minutes BALANCE could not be
   read (GitHub moved that endpoint; it needs `admin:org` scope this token
   lacks) — this is evidence that jobs run, not a quota readout.
1. Open the Community + Merch PR and merge it (authorised, review complete).
2. **Run Codex against merged `main` when credits return (Aug 19)** — rule 3 is
   unsatisfied for Clownbot and this feature both.
3. Hand Wyatt his five items before treating tier/caps as decided.
4. First real-device check of the bottom nav. Never been opened on a phone.
5. Joey's hands, not mine: the three #2110 questions, and the Apps Script /
   Resend / env setup in `docs/ops/community-merch-submissions.md`.
