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
| G-A | **Content depth: J3.5** — Midnights + TTPD at Active-tier, relationship/sighting/fashion-weighted (fixed launch gate, decisions 2026-07-04) | 🟡 first pass landed; never audited against the rubric; Joey's spot-check untimed (J3.5-next) | Rows-per-month audit vs rubric → gap list → **Content Shift queue (priority 3)** · Content desk; spot-check timing · Joey |
| G-B | **Voice: the Swiftie bar** (#461) — Taylor-not-Swift rule + fan-editor voice, enforced not aspirational | 🔴 rule approved, linter unbuilt, retro pass not run; today's 20-sample audit confirms bare-"Swift" prose in live content | Build the #461 word-choice checker into Karen; run retro pass batched by era · Integrity + Content desks |
| G-C | **Depth: worthy-of-Taylor** (#441 + #440 phases) — Karen can't see thinness; only 12/244 songs have dossiers; whole narrative periods (thread solo-eras etc.) sit near-empty | 🟡 **Nils (the critic, docs/agents/nils.md) now walks the site daily and tickets what's unworthy; the Content Shift (docs/agents/content-shift.md) authors those tickets on a 2×/day cadence** — machinery live 2026-07-11; the backlog itself still large | Nils tickets → Content Shift burns them; #441 checkers into Karen; dossier waves per #440 · Critic + Content + Integrity desks |
| G-D | **Track-guide UX** — Joey's 2026-07-11 report: song clicks broken on TLOAS, "Released" row shows album, most eras have zero clickable songs | 🔴 bugs filed (see tickets); unclickable-era problem is G-C's data gap surfacing in UI | Fix click bug + Released row · Build desk (Austin-eligible if triaged tractable); dossier coverage → G-C |
| G-E | **Karen nightly, actually nightly** — merged today (#139) but never yet run on schedule; 2026-07-11 full scan pending in this session | 🟡 engine on main; cadence not wired | Wire nightly run (Wyatt-side cron or routine) + fold report into brief Health · Integrity desk |
| G-F | **Zero open P0/P1 content findings** — Karen full criteria, queue drained before ship | 🟡 2026-07-11 full scan: 716 findings, but only **1 filable P1** (broken image) — 231 P1 claim-risk signals await the agent factual passes; 484 P2s are mostly image-quality/host advisories | Fix the broken image; run the agent factual+image passes on the batch inputs; counts in every brief · Integrity + Ticket ops |
| G-G | **Watch desk minimum (L1)** — uptime/error paging on the authoritative user path + analytics baseline | 🔴 not built; analytics decision #477 unanswered | Tick #477 · founders; then L1 build · Watch/Build desk |
| G-H | **Legal pages (G5)** — privacy + ToS covering feedback data (already collected!), minors, analytics consent | 🔴 nothing exists | Draft for IP-counsel review per existing gate · founders + Content desk |
| G-I | **Backups (G4)** — Supabase restore runbook tested once | 🔴 unverified | Verify tier, document, test one restore · Build desk |
| G-J | **Ops hygiene** — G2 merge=deploy decision made; G13 Vercel double-project noise resolved; #496 branch protection | 🔴 all three open | Founder decisions (banked) |
| G-K | **The launch campaign** — Growth desk's first deliverable (pre-launch per decisions) | 🔴 desk not stood up (Phase 3 pulled forward, not started) | Stand up Growth desk charter + campaign plan · next build slot |

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

Judged against the **deployed product** (https://swift2-ten.vercel.app/),
not tickets. Nils reports rows in each walk log; Marjorie folds them in
here; a surface (and ultimately a gate) closes only after **three
consecutive clean passes**. Standards: the Nils rubric + content-ops docs.

| Surface | Standard met? | Last verdict | Evidence |
|---|---|---|---|
| Era timelines ×11 (months, moments) | 🔴 unverified against rubric | 2026-07-11 sample: depth uneven | 20-sample audit |
| Thread: Blank Spaces (incl. solo periods) | 🔴 fails | 2026-07-11 (Joey) | one-line solo period 2013–15 |
| Threads: other 5 | 🔴 unverified, suspected thin | — | Joey: "nearly every thread the same" |
| Track guide: TLOAS | 🔴 fails | 2026-07-11 | click bug #498, Released row #499 |
| Track guides: other 10 eras | 🔴 fails | 2026-07-11 | 12/244 songs have dossiers |
| Videos / theories | 🟡 partial | 2026-07-11 sample | passes Karen letter, depth unscored |
| Chrome copy (first-run, about) | 🟡 unscored | — | J5 open |

Nils's daily walks replace the 🔴-unverified cells with real verdicts within
one rotation (~a week); the matrix is the objective launch answer.
