# Launch readiness — the gate, in one place

**Owner: Marjorie (tracking + brief reporting) · Founders (the go/no-go).**
Created 2026-07-11 after Joey's audit request exposed the real problem: every
gate below existed somewhere in decisions/roadmap/tickets, but no artifact
owned "distance to launch," so nothing drove toward it without founder
nudges. This file is that artifact. **Marjorie's 6 AM brief leads with this
table's deltas** (her runner prompt reads this file); a gate flipping to 🟢
is brief news, a gate stuck two briefs running is a flag.

Rule for editing: gates are added/removed only by founder decision; statuses
update freely as work lands (any desk may update its own row's status with a
link). "Launch-ready" for content = **Karen-clean under her FULL criteria**
— which per G-V below means Karen must first gain the voice + depth checks;
her current checks are necessary, not sufficient.

## What each gate means (plain English) + what the colors mean

Founder-facing surfaces (the brief's scoreboard above all) use the **plain
name**, never the bare code — codes exist for agents and tickets.

| Code | Plain name — "we can't launch until…" |
|---|---|
| G-A | **Every era has enough content** (Midnights + TTPD filled to the depth bar) |
| G-B | **It sounds like a fan wrote it** (says "Taylor," never "Swift" — enforced by a checker, not vibes) |
| G-C | **No thin or empty pages** (song pages, threads, and story arcs are worthy of her) |
| G-D | **Songs open when you tap them** (the track-guide click bug Joey found) |
| G-E | **The nightly content-safety scan actually runs every night** |
| G-F | **Zero serious content errors open** (facts, images, sourcing) |
| G-G | **We find out when the site breaks** (uptime alarms + visitor analytics) |
| G-H | **Privacy policy + terms of service exist** |
| G-I | **Backups exist and a restore has been tested once** |
| G-J | **The deploy/monitoring plumbing is healthy** (right URLs probed, branch protection on) |
| G-K | **A launch marketing plan exists** |
| G-L | **Mobile navigation is obvious to a new user** (Joey's gate: the era/threads switcher) |

**Status colors — defined, not vibes:**

- 🟢 **done** — the gate's criterion is met and verified (three consecutive
  clean passes where the criterion is a recurring check). Nothing left to do.
- 🟡 **moving** — someone is actively on it and it advanced within the last
  2 briefs.
- 🔴 **stalled** — not started, blocked, or no movement for 2+ briefs. A red
  row always names what it's waiting on.

A color change is claimable only with a link (PR, run, founder comment).
Every founder-facing rendering of this table carries the one-line legend:
`🟢 done · 🟡 moving · 🔴 stalled — red rows say what they're waiting on`.

| # | Gate | Status 2026-07-11 | Next action · owner |
|---|---|---|---|
| G-A | **Content depth: J3.5** — Midnights + TTPD at Active-tier, relationship/sighting/fashion-weighted (fixed launch gate, decisions 2026-07-04) | 🟡 moving — 2026-07-14: merge day — #523 (TTPD July+Oct gaps), #622, #624 all landed; Content Shift same-day PR #643 open (NYT songwriters interview #635 + Eras Tour final NA leg #628); full rubric audit still open; Joey's spot-check untimed (J3.5-next) | Merge #643; rows-per-month audit vs rubric → gap list → **Content Shift queue (priority 3)** · Content desk; spot-check timing · Joey |
| G-B | **Voice: the Swiftie bar** (#461) — Taylor-not-Swift rule + fan-editor voice, enforced not aspirational | 🔴 rule approved, linter unbuilt, retro pass not run; today's 20-sample audit confirms bare-"Swift" prose in live content | Build the #461 word-choice checker into Karen; run retro pass batched by era · Integrity + Content desks |
| G-C | **Depth: worthy-of-Taylor** (#441 + #440 phases) — Karen can't see thinness; only 12/244 songs have dossiers; whole narrative periods (thread solo-eras etc.) sit near-empty | 🟡 machinery producing — 2026-07-14: Nils rotation walk 2 (TTPD + Decode + Clue Web + chrome; tickets #628 exp:P2, #629 exp:P3; cross-era dupes escalated on #616) and Content Shift answered #628 the same day (PR #643); intake PRs #622/#624 + maintenance fleet #521 merged; #615–#617 still unworked | Merge #643; Content Shift burns #615–#617; #441 checkers into Karen; dossier waves per #440 · Critic + Content + Integrity desks |
| G-D | **Track-guide UX** — Joey's 2026-07-11 report: song clicks broken on TLOAS, "Released" row shows album, most eras have zero clickable songs | 🔴 re-confirmed 2026-07-13/14: Joey retested with a screenshot — **only the row's arrow icon opens a song; the rest of the row is dead on the live site**, while Austin still cannot reproduce on `main` (dev + prod build, desktop + mobile). Leading theory stands: the deploy is behind `main` (#455 env vars unset). Released-row fix Part 1 merged 07-14 (#633) | FIRST confirm which commit longlivets.com serves (#455) → retest #498 on a current deploy; in-session dev pass (human-touched, Austin re-queue barred) · Wyatt |
| G-E | **Karen nightly, actually nightly** — merged today (#139) but never yet run on schedule; 2026-07-11 full scan pending in this session | 🟡 **three consecutive scheduled runs** (reports #612/#626/#648, all merged); 2026-07-15 run was the first with the #625 fix live — 0 false image P1s (556 proxy-refused probes correctly "unverified"), 0 red-lines, 1 P2 advisory rollup (#647). Caveat: image liveness/quality remain effectively unchecked from the runner (egress denies most image hosts), so the run verifies the engine fix but is still liveness-blind — the 3-clean-pass count for the image criterion can't honestly start until agent egress to image hosts lands (same allowlist ask as G-J) | Land remaining #613 fixes (preflight canary, REST port); fix agent egress so liveness actually probes; then count 3 clean passes · Integrity + Build desks |
| G-F | **Zero open P0/P1 content findings** — Karen full criteria, queue drained before ship | 🟡 filable P1 queue **0**; 2026-07-14: Joey commented "Approved" on #613 — the 07-13 bulk-close's authority gap is closed retroactively; the 58 agent-pass batches (43 factual, 15 image) remain never-run; Nils's factual finding #615 is queued under G-C but is P1-severity content risk | Schedule the agent factual+image passes; resolve #552; fix #615 · Integrity + Content desks |
| G-G | **Watch desk minimum (L1)** — uptime/error paging on the authoritative user path + analytics baseline | 🔴 not built; analytics DECIDED 2026-07-11 (#477 → A, Vercel Web Analytics — Joey) | Wire Vercel Web Analytics + L1 uptime/error paging · Watch/Build desk |
| G-H | **Legal pages (G5)** — privacy + ToS covering feedback data (already collected!), minors, analytics consent | 🔴 nothing exists | Draft for IP-counsel review per existing gate · founders + Content desk |
| G-I | **Backups (G4)** — Supabase restore runbook tested once | 🔴 unverified | Verify tier, document, test one restore · Build desk |
| G-J | **Ops hygiene** — G2 merge=deploy decision made; G13 Vercel double-project noise resolved; #496 branch protection | 🟡 branch protection LIVE; 2026-07-14: **Joey confirms longlivets.com is UP** (#621 closed by founder) — the smoke-check failures are confirmed stale-URL noise, but watchdog.yml:112 still probes the retired swift2-ten URL and fired a second false alert today (#632); agent egress to the live site still denied (Nils blocked 2 runs straight); Marjorie merge-authority amendment landed (#636) | Point watchdog.yml at longlivets.com (one-line, build slot) → close #632 with it; allowlist prod domain for agent runners · Build desk; G2 decision (banked) |
| G-K | **The launch campaign** — Growth desk's first deliverable (pre-launch per decisions) | 🔴 desk not stood up (Phase 3 pulled forward, not started) | Stand up Growth desk charter + campaign plan · next build slot |
| G-L | **Mobile navigation** (#634) — era dropdown barely visible, era/threads switcher pill not obvious to a new user; the switcher IS the core of the site. **Founder-declared launch gate: Joey, 2026-07-14 — "We cannot release the site until this works better"** | 🔴 filed 2026-07-14, unassigned | Design pass with Joey (what should the switcher look like?) → build slot; likely too large for Austin's fence · Build desk + Joey |

> **2026-07-12 — auto-merge precondition NOT met:** #488's content-inertness checker merged (PR #507) but a red-team found a prototype-escape bypass (#508). The founder-approved content auto-merge gate (§5.4) stays OFF until #508 clears. G3 branch protection IS live; #488 is the last precondition and it is now reopened-in-effect via #508.
> **2026-07-12 PM status:** PR #512 merged (positive-grammar rewrite; all five red-team bypasses now fail as fixtures) and #508 is **closed** — the code-side precondition is met (one allowlisted file remains human-review-only, #511). Turning §5.4 auto-merge ON is still an explicit founder grant, not automatic.

## What "done" looks like

Every row 🟢, then a founders' go/no-go in the brief. No new categories of
work — everything above was already decided/approved somewhere; this file
just makes it one list that burns down visibly.

## 2026-07-11 sample audit (Joey's 20-random-items request) — summary

Seeded random 20 across moments/tracks/videos/theories/releases. Full notes
in the audit ticket. Results:

- **1 hard fail** of Karen's current criteria: `showgirl-hot-100-top-12-sweep`
  (business, single source — bar requires two independent outlets; also
  carries chart superlatives needing verification).
- **19 pass Karen's current letter** — but:
- **Voice flags (~3 items):** bare-"Swift" running prose exactly as #461
  documents (e.g. the folklore Rebekah Harkness item) — confirms the voice
  gate (G-B) is real in shipped content, not hypothetical.
- **Depth flags (all 3 sampled tracks):** single-line notes, no dossier, and
  therefore unclickable in the UI — Karen-compliant, launch-unworthy. This
  is G-C measured directly.
- **1 verify:** LGAD "peaked No. 13" chart digit (routed to factual pass).

Read: Karen's *current* criteria catch sourcing/safety/images well, and the
corpus mostly passes them — the same day's full deterministic scan (985
items, 585 images) produced exactly **one filable P1** and zero P0s, with
none of the 20 sampled items carrying a filable finding. The distance to
Joey's bar lives in the two checks Karen doesn't have yet (voice G-B, depth
G-C) plus the pending agent factual passes — which is why those gates exist
and why "Karen-clean" is redefined to include them.

## Coverage matrix (absorbed 2026-07-12 — the completion model)

Judged against the **deployed product** (https://longlivets.com/ since
#524; URL updated 2026-07-13 — was the retired swift2-ten project),
not tickets. Nils reports rows in each walk log; Marjorie folds them in
here; a surface (and ultimately a gate) closes only after **three
consecutive clean passes**. Standards: the Nils rubric + content-ops docs.
**Caveat (still true 2026-07-14, 2nd run):** agent runners (Nils included)
cannot reach the live site (proxy egress denied), so verdicts below are
data-walks against `main` — repo-vs-deployed diff unverified until egress is
fixed or a founder spot-checks. Joey did confirm the site is *up* (#621,
2026-07-14) and separately that the #498 click bug is *real on the deployed
site* — reinforcing that `main` and the deploy may differ.

| Surface | Standard met? | Last verdict | Evidence |
|---|---|---|---|
| Era timeline: TLOAS (marquee) | 🔴 unchanged — #615 error + #616 dupes verified still live | 2026-07-14 (Nils, re-walk) | #615, #616 |
| Era timeline: TTPD | 🔴 not yet — depth impressive (53 items) but arc breaks twice (tour final act, Grammys payoff) + cross-era dupes | 2026-07-14 (Nils, full walk) | #628, #629; #616 escalation; #643 open answers #628 |
| Era timelines ×9 remaining | 🔴 unverified (midnights month-spread spot only) | 2026-07-14 | full walks start 07-15 |
| Thread: End Game (marquee) | 🔴 unchanged — engagement year still has zero beats | 2026-07-14 (Nils, re-walk) | #615, #617 |
| Thread: Blank Spaces (incl. solo periods) | 🔴 fails (not re-walked; code unchanged) | 2026-07-13 (Nils) | #434 still accurate vs `EntryDetail.tsx` |
| Thread: Taylor's Version | 🟢 spot-pass (1/3 consecutive) | 2026-07-13 (Nils) | buyback + 6 rerecord rows verified |
| Thread: The Runway | 🟡 coverage pass (12/12 eras have looks), depth unscored | 2026-07-13 (Nils) | walk log #502 |
| Thread: Clue Web | 🟡 pass with one soft spot — 30 eggs/7 trails/12 eras all sourced, but folklore + evermore have 1 egg each | 2026-07-14 (Nils, full inventory) | walk log #502; #445 owns the rework |
| Thread: The Decode | 🟢 pass (1/3 consecutive) — best surface walked so far; 42 sourced plant→payoff pairs, honest confirmed-flags | 2026-07-14 (Nils, full inventory) | walk log #502 |
| Track guide: TLOAS | 🟡 data-level pass; **live-site UI FAILS per Joey's 07-14 retest** (only the arrow opens a song) while `main` passes — deploy-vs-main mismatch suspected | 2026-07-14 (Nils re-walk + Joey retest) | 12/12 dossiers, 48/48 cross-links; #498 + screenshot |
| Track guide: TTPD | 🟡 data pass — 31/31 notes+discussion, all clickable; dossier tier absent (#440) | 2026-07-14 (Nils, full walk) | walk log #502 |
| Track guides: other 9 eras | 🔴 fails | 2026-07-14 | 0 dossiers outside TLOAS/TTPD notes tier (#440) |
| Videos / theories (TLOAS) | 🔴 theories thin (2 for the most-clowned era); videos pass counts | 2026-07-13 (Nils) | #460 escalated |
| Videos / theories (TTPD) | theories 🔴 (2 entries, named in #460); videos 🟢 pass (2/2 vs reality, 1/3) | 2026-07-14 (Nils) | walk log #502 |
| Chrome copy (first-run, about) | 🟡 functional and honest; About surface missing (J5); footer blanket-disclaimer voice note logged | 2026-07-14 (Nils) | walk log #502 |

Nils's daily walks replace the 🔴-unverified cells with real verdicts within
one rotation (~a week); the matrix is the objective launch answer.
