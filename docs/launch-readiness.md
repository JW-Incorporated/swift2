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

| # | Gate | Status 2026-07-11 | Next action · owner |
|---|---|---|---|
| G-A | **Content depth: J3.5** — Midnights + TTPD at Active-tier, relationship/sighting/fashion-weighted (fixed launch gate, decisions 2026-07-04) | 🟡 moving — 2026-07-12: +3 sourced July-2026 moments merged (#510, #517); first rows-per-month gap audit ran and 2 TTPD gap items await merge (PR #523, remaining-gaps ledger in its description); full rubric audit still open; Joey's spot-check untimed (J3.5-next) | Rows-per-month audit vs rubric → gap list → **Content Shift queue (priority 3)** · Content desk; spot-check timing · Joey |
| G-B | **Voice: the Swiftie bar** (#461) — Taylor-not-Swift rule + fan-editor voice, enforced not aspirational | 🔴 rule approved, linter unbuilt, retro pass not run; today's 20-sample audit confirms bare-"Swift" prose in live content | Build the #461 word-choice checker into Karen; run retro pass batched by era · Integrity + Content desks |
| G-C | **Depth: worthy-of-Taylor** (#441 + #440 phases) — Karen can't see thinness; only 12/244 songs have dossiers; whole narrative periods (thread solo-eras etc.) sit near-empty | 🟡 machinery now RUNNING, not just live — 2026-07-13: Nils's first full walk logged (#502; 3 tickets filed: #615 exp:P1 factual error, #616 exp:P1 duplication, #617 exp:P2 story gap) and Content Shift authored 2 intake PRs (#622, #624) awaiting merge; coverage matrix below now carries real verdicts; backlog still large | Nils tickets → Content Shift burns them; #441 checkers into Karen; dossier waves per #440 · Critic + Content + Integrity desks |
| G-D | **Track-guide UX** — Joey's 2026-07-11 report: song clicks broken on TLOAS, "Released" row shows album, most eras have zero clickable songs | 🔴 but reframed 2026-07-13: Austin drove the app on current `main` (dev + prod build, desktop + mobile) and **cannot reproduce the click bug** — all 244 songs clickable with non-empty deep-dives; Joey most likely saw a stale deploy (#498 attempt ledger). Needs Joey's retest on the live site once the deploy is confirmed current | Joey retests #498 on live site post-deploy-fix; Released row #458 stays Austin-eligible; dossier coverage → G-C |
| G-E | **Karen nightly, actually nightly** — merged today (#139) but never yet run on schedule; 2026-07-11 full scan pending in this session | 🟡 nightly IS wired — first scheduled run 2026-07-13 (report PR #612); facts/safety layers valid, image layer blind in the cloud runner (proxy incident #613); first engine fix authored 2026-07-13 PM (PR #625: CDN refusals → unverified, never P1), awaiting merge | Merge #625, land the remaining #613 fixes (preflight canary, REST port), then count 3 clean passes · Integrity desk |
| G-F | **Zero open P0/P1 content findings** — Karen full criteria, queue drained before ship | 🟡 2026-07-13 PM: the 80 false P1s (#532–#611) were bulk-closed with PR #625 as root-cause reference (79 re-verified live; the 1 genuine case #552 kept open, downgraded P2 for manual review) — Karen's filable P1 queue is now **0**; the 58 agent-pass batches (43 factual, 15 image) remain never-run; Nils's factual finding #615 is queued under G-C but is P1-severity content risk | Schedule the agent factual+image passes; resolve #552; fix #615 · Integrity + Content desks |
| G-G | **Watch desk minimum (L1)** — uptime/error paging on the authoritative user path + analytics baseline | 🔴 not built; analytics DECIDED 2026-07-11 (#477 → A, Vercel Web Analytics — Joey) | Wire Vercel Web Analytics + L1 uptime/error paging · Watch/Build desk |
| G-H | **Legal pages (G5)** — privacy + ToS covering feedback data (already collected!), minors, analytics consent | 🔴 nothing exists | Draft for IP-counsel review per existing gate · founders + Content desk |
| G-I | **Backups (G4)** — Supabase restore runbook tested once | 🔴 unverified | Verify tier, document, test one restore · Build desk |
| G-J | **Ops hygiene** — G2 merge=deploy decision made; G13 Vercel double-project noise resolved; #496 branch protection | 🟡 branch protection LIVE (ruleset `protect-main`, founder-confirmed 2026-07-12); G2 merge=deploy still undecided; G13/#522 state now UNCLEAR — prod moved to longlivets.com (#524), the retired swift2-ten URL 404s (watchdog alert #621 probes the old URL, watchdog.yml:112), and **no agent runner can reach the live site to verify it** (proxy blocks egress; Nils hit the same wall) | Founder 30-second phone check of longlivets.com; point watchdog.yml at the real domain (one-line, build slot); G2 decision (banked) |
| G-K | **The launch campaign** — Growth desk's first deliverable (pre-launch per decisions) | 🔴 desk not stood up (Phase 3 pulled forward, not started) | Stand up Growth desk charter + campaign plan · next build slot |

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
**Caveat 2026-07-13:** agent runners (Nils included) currently cannot reach
the live site (proxy egress denied), so verdicts below are data-walks
against `main` — repo-vs-deployed diff unverified until egress is fixed or
a founder spot-checks.

| Surface | Standard met? | Last verdict | Evidence |
|---|---|---|---|
| Era timeline: TLOAS (marquee) | 🔴 fails today — depth itself impressive (45 items) but duplication + one factual error | 2026-07-13 (Nils, full walk) | #615, #616 |
| Era timelines ×10 (non-marquee) | 🔴 unverified (dup-scan only, hit ~9 eras) | 2026-07-13 | #616; rotation starts 07-14 |
| Thread: End Game (marquee) | 🔴 fails — engagement year has zero beats | 2026-07-13 (Nils) | #615, #617 |
| Thread: Blank Spaces (incl. solo periods) | 🔴 fails (unchanged since Joey's report) | 2026-07-13 (Nils) | #434 still accurate vs `EntryDetail.tsx` |
| Thread: Taylor's Version | 🟢 spot-pass (1/3 consecutive) | 2026-07-13 (Nils) | buyback + 6 rerecord rows verified |
| Thread: The Runway | 🟡 coverage pass (12/12 eras have looks), depth unscored | 2026-07-13 (Nils) | walk log #502 |
| Threads: Clue Web, Decode | 🔴 unverified | — | next rotation |
| Track guide: TLOAS | 🟡 data-level pass; UI pass on `main` unconfirmed on live site | 2026-07-13 (Nils + Austin) | 12/12 dossiers, 48/48 cross-links resolve; #498 unreproducible on `main` |
| Track guides: other 10 eras | 🔴 fails | 2026-07-13 | 0/232 dossiers outside TLOAS (#440) |
| Videos / theories (TLOAS) | 🔴 theories thin (2 for the most-clowned era); videos pass counts | 2026-07-13 (Nils) | #460 escalated |
| Chrome copy (first-run, about) | 🟡 unscored | — | J5 open; rotation |

Nils's daily walks replace the 🔴-unverified cells with real verdicts within
one rotation (~a week); the matrix is the objective launch answer.
