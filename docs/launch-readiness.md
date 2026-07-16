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

Gate names are one self-describing word (Joey, 2026-07-15 — the old
`G-A`…`G-L` letter codes said nothing; "G" literally just meant "gate").
Old codes appear in tickets/briefs written before the rename — the "was"
column translates them. Founder-facing surfaces use the name + plain
meaning, never a bare legacy code.

| Gate | was | Plain meaning — "we can't launch until…" |
|---|---|---|
| DEPTH | G-A | **Every era has enough content** (Midnights + TTPD filled to the depth bar) |
| VOICE | G-B | **It sounds like a fan wrote it** (says "Taylor," never "Swift" — enforced by a checker, not vibes) |
| WORTHY | G-C | **No thin or empty pages** (song pages, threads, and story arcs are worthy of her) |
| SONGS | G-D | **Songs open when you tap them** (the track-guide click bug Joey found) |
| SCAN | G-E | **The nightly content-safety scan actually runs every night** |
| ERRORS | G-F | **Zero serious content errors open** (facts, images, sourcing) |
| ALARMS | G-G | **We find out when the site breaks** (uptime alarms + visitor analytics) |
| LEGAL | G-H | **Privacy policy + terms of service exist** |
| BACKUPS | G-I | **Backups exist and a restore has been tested once** |
| PLUMBING | G-J | **The deploy/monitoring plumbing is healthy** (right URLs probed, branch protection on) |
| CAMPAIGN | G-K | **A launch marketing plan exists** |
| MOBILE | G-L | **Mobile navigation is obvious to a new user** (Joey's gate: the era/threads switcher) |

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
| DEPTH | **Content depth: J3.5** — Midnights + TTPD at Active-tier, relationship/sighting/fashion-weighted (fixed launch gate, decisions 2026-07-04) | 🟡 moving — 2026-07-15 PM: founders merged #643/#664/#665 (NYT songwriters #635, Eras final NA leg #628, Midnights cold open #654, 2025 + 2023 Grammys payoffs #629, Swiftkirchen); full rubric audit still open; Joey's spot-check untimed (J3.5-next) | Rows-per-month audit vs rubric → gap list → **Content Shift queue (priority 3)** · Content desk (content-shift merges now in Marjorie's envelope, 2026-07-15 amendment); spot-check timing · Joey |
| VOICE | **Voice: the Swiftie bar** (#461) — Taylor-not-Swift rule + fan-editor voice, enforced not aspirational | 🔴 linter still unbuilt, but no longer ownerless — **routed 2026-07-15 PM** (Joey's directive on brief #650 + autonomy amendment) into the Integrity/Build queue; Nils 07-15: seeds are systematically bare-"Swift" (117 hits in midnights.mjs alone) so the retro pass must cover seeds, not just curated copy | Next Integrity/Build run builds the #461 checker into Karen; retro pass era-batched over seeds · Integrity + Build desks |
| WORTHY | **Depth: worthy-of-Taylor** (#441 + #440 phases) — Karen can't see thinness; only 12/244 songs have dossiers; whole narrative periods (thread solo-eras etc.) sit near-empty | 🟡 machinery producing — 2026-07-15: Nils walk 3 (Midnights + folklore + evermore + Crossings + Search + SEO; tickets #651–#655; 15 dupe pairs verified on #616) and three same-day closes: #628/#629/#654 all shipped via merged PRs #643/#664/#665; #615 routed to TOP of Content Shift queue (oldest P1) with #616/#617 behind it | Content Shift burns #615→#616→#617 in severity order; #441 checkers into Karen; dossier waves per #440 · Critic + Content + Integrity desks |
| SONGS | **Track-guide UX** — Joey's 2026-07-11 report: song clicks broken on TLOAS, "Released" row shows album, most eras have zero clickable songs | 🟡 moving — 2026-07-15 PM: **#675 merged — the whole track-guide card now opens the song (#498 closed)**, plus #676 (Keep exploring leads with next song) and #677 (back-swipe stays in-app); Released-row Part 1 was #633 (07-14) | Joey: paste the deployed commit SHA on #455 (he's on it per brief #650 comment) → on-device retest of the shipped fix; 🟢 needs that retest · Joey + Build desk |
| SCAN | **Karen nightly, actually nightly** — merged today (#139) but never yet run on schedule; 2026-07-11 full scan pending in this session | 🟡 **four consecutive scheduled runs** (reports #612/#626/#648/#691, all merged); 2026-07-16 run: 1003 items, 0 red-lines, 0 filable P1s, advisories deduped into #647 (0 new issues — idempotency held). 07-15 was the first run with the #625 fix live — 0 false image P1s (proxy-refused probes correctly "unverified"). Caveat: image liveness/quality remain effectively unchecked from the runner (egress denies most image hosts), so the run verifies the engine fix but is still liveness-blind — the 3-clean-pass count for the image criterion can't honestly start until agent egress to image hosts lands (same allowlist ask as PLUMBING) | Land remaining #613 fixes (preflight canary, REST port); fix agent egress so liveness actually probes; then count 3 clean passes · Integrity + Build desks |
| ERRORS | **Zero open P0/P1 content findings** — Karen full criteria, queue drained before ship | 🟡 filable P1 queue **0**; 2026-07-14: Joey commented "Approved" on #613 — the 07-13 bulk-close's authority gap is closed retroactively; the 58 agent-pass batches (43 factual, 15 image) remain never-run; Nils's factual finding #615 is queued under WORTHY but is P1-severity content risk | Schedule the agent factual+image passes; resolve #552; fix #615 · Integrity + Content desks |
| ALARMS | **Watch desk minimum (L1)** — uptime/error paging on the authoritative user path + analytics baseline | 🔴 not built; analytics DECIDED 2026-07-11 (#477 → A, Vercel Web Analytics — Joey) | Wire Vercel Web Analytics + L1 uptime/error paging · Watch/Build desk |
| LEGAL | **Legal pages (G5)** — privacy + ToS covering feedback data (already collected!), minors, analytics consent | 🔴 nothing exists | Draft for IP-counsel review per existing gate · founders + Content desk |
| BACKUPS | **Backups (G4)** — Supabase restore runbook tested once | 🔴 unverified, but no longer ownerless — **routed 2026-07-15 PM** (#680, Joey's directive on brief #650 + autonomy amendment) into the Build desk queue | Next build-slot session works #680: verify tier → runbook → one tested restore · Build desk |
| PLUMBING | **Ops hygiene** — G2 merge=deploy decision made; G13 Vercel double-project noise resolved; #496 branch protection | 🟡 2026-07-15 PM: **#666 merged — watchdog + E2E now probe www.longlivets.com**; false alerts #632/#663 closed. Two new gaps: E2E suite selectors stale — all 30 tests fail uniformly against prod, monitor is blind (#669); **GITHUB_FEEDBACK_TOKEN unset on prod since the 07-12 Vercel move — site feedback silently dropped (#679, founder TX)**. Agent egress to the live site still denied (Nils blocked 3 runs straight) | Founders: #679 token (~5 min); eng re-anchors the E2E suite (#669); allowlist prod domain for agent runners · Build desk + founders |
| CAMPAIGN | **The launch campaign** — Growth desk's first deliverable (pre-launch per decisions) | 🔴 desk not stood up, but no longer ownerless — **routed 2026-07-15 PM** (comment on #518, Joey's directive on brief #650 + autonomy amendment): #518 (Joey's full social-strategy ask) is the campaign's working ticket; its old blocker is gone (product name decided 07-12: Long Live) | Next build slot drafts the Growth desk charter (founder-approved PR) + works #518 · Build desk; charter approval · founders |
| MOBILE | **Mobile navigation** (#634) — era dropdown barely visible, era/threads switcher pill not obvious to a new user; the switcher IS the core of the site. **Founder-declared launch gate: Joey, 2026-07-14 — "We cannot release the site until this works better"** | 🟡 moving — 2026-07-16 AM: **design intent delivered** — Joey's landing-page decision ('Choose an era' grid becomes the front door; decision log 2026-07-15, PR #683, confirmed on #634) answers the gate's open question; implementation ticket #684 routed to the top of the Build queue (2026-07-16 routing comment); adjacent mobile fix #677 merged 07-15 | Build #684 (landing page) → Joey on-device check · Build desk + Joey |

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
  gate (VOICE) is real in shipped content, not hypothetical.
- **Depth flags (all 3 sampled tracks):** single-line notes, no dossier, and
  therefore unclickable in the UI — Karen-compliant, launch-unworthy. This
  is WORTHY measured directly.
- **1 verify:** LGAD "peaked No. 13" chart digit (routed to factual pass).

Read: Karen's *current* criteria catch sourcing/safety/images well, and the
corpus mostly passes them — the same day's full deterministic scan (985
items, 585 images) produced exactly **one filable P1** and zero P0s, with
none of the 20 sampled items carrying a filable finding. The distance to
Joey's bar lives in the two checks Karen doesn't have yet (voice VOICE, depth
WORTHY) plus the pending agent factual passes — which is why those gates exist
and why "Karen-clean" is redefined to include them.

## Coverage matrix (absorbed 2026-07-12 — the completion model)

Judged against the **deployed product** (https://longlivets.com/ since
#524; URL updated 2026-07-13 — was the retired swift2-ten project),
not tickets. Nils reports rows in each walk log; Marjorie folds them in
here; a surface (and ultimately a gate) closes only after **three
consecutive clean passes**. Standards: the Nils rubric + content-ops docs.
**Caveat (still true 2026-07-15, 3rd run):** agent runners (Nils included)
cannot reach the live site (proxy egress denied), so verdicts below are
data-walks against `main` — repo-vs-deployed diff unverified until egress is
fixed or a founder spot-checks. Joey did confirm the site is *up* (#621,
2026-07-14) and separately that the #498 click bug is *real on the deployed
site* — reinforcing that `main` and the deploy may differ. Joey is pulling
the deployed commit SHA onto #455 (per brief #650 comment, 07-15 PM).

| Surface | Standard met? | Last verdict | Evidence |
|---|---|---|---|
| Era timeline: TLOAS (marquee) | 🔴 unchanged — #615 error + #616 dupes verified still live; +2 strong new items (#622/#624) | 2026-07-15 (Nils, re-walk) | #615, #616 |
| Era timeline: TTPD | 🔴 not yet — arc-break tickets #628/#629 **closed same-day via merged PRs #643/#664**; cross-era dupes remain; re-walk pending | 2026-07-14 (Nils, full walk) | #616 escalation; merges 07-15 PM |
| Era timeline: Midnights | 🔴 not yet — cold open #654 **closed same-day via #664**; 4+1 curated↔vault dupes verified (#616); re-walk pending | 2026-07-15 (Nils, full walk: 84 vault + 7 curated) | #654, #616; walk log #502 |
| Era timeline: folklore | 🟡 arc pass — 4 pivotal beats present; dupes + release-day clumping + voice noted | 2026-07-15 (Nils, full walk) | #616 comment; walk log #502 |
| Era timeline: evermore | 🔴 fails Joey test on first scroll — 6/6 curated dupes render as doubles; era-window sprawl to Sep 2022 | 2026-07-15 (Nils, full walk) | #616; walk log #502 |
| Era timelines ×7 remaining (red/1989/rep/lover/fearless/speak-now/debut) | 🔴 unverified (dup-scan only) | 2026-07-15 | walk 4 slice: red + 1989 + reputation |
| Thread: End Game (marquee) | 🔴 unchanged — engagement year still zero beats; beat 3 now sourced in-repo (#622) but not wired as a thread beat | 2026-07-15 (Nils, re-walk) | #615, #617 |
| Thread: Blank Spaces (incl. solo periods) | 🔴 fails (re-checked, unchanged) + new bug: "Married July 2026" resolution banner never renders (id mismatch) | 2026-07-15 (Nils, re-check) | #434; #651 |
| Thread: Taylor's Version | 🟢 spot-pass (1/3 consecutive) | 2026-07-13 (Nils) | buyback + 6 rerecord rows verified; 2/3 attempt in walk 4 |
| Thread: The Runway | 🟡 coverage pass (12/12 eras have looks), depth unscored | 2026-07-13 (Nils) | walk log #502; depth scoring in walk 4 |
| Thread: Clue Web | 🟡 pass with one soft spot — 30 eggs/7 trails/12 eras all sourced, but folklore + evermore have 1 egg each | 2026-07-14 (Nils, full inventory) | walk log #502; #445 owns the rework |
| Thread: The Decode | 🟢 pass (1/3 consecutive) — 42 sourced plant→payoff pairs, honest confirmed-flags | 2026-07-14 (Nils, full inventory) | walk log #502 |
| Track guide: TLOAS | 🟡 data pass; the live-site click failure (Joey 07-14) now has a shipped fix — **#675 merged 07-15 PM: whole card opens the song**; on-device retest pending deploy confirmation | 2026-07-15 (Nils re-walk; fix merged post-walk) | 12/12 dossiers, 48/48 cross-links; #498 closed, #455 open |
| Track guide: TTPD | 🟡 data pass — 31/31 notes+discussion, all clickable; dossier tier absent (#440) | 2026-07-14 (Nils, full walk) | walk log #502 |
| Track guide: Midnights | 🟡 data pass — 22/22 notes+discussion+facts, all clickable; dossier tier absent (#440) | 2026-07-15 (Nils, full walk) | walk log #502 |
| Track guides: folklore + evermore | 🟢 pass (1/3 each) — 17+17 fully populated, zero thin tracks | 2026-07-15 (Nils, full walk) | walk log #502 |
| Track guides: other 7 eras | 🔴 fails | 2026-07-15 | 0 dossiers outside walked eras (#440) |
| Videos / theories (TLOAS) | 🔴 theories thin (2 for the most-clowned era); videos pass counts | 2026-07-13 (Nils) | #460 escalated |
| Videos / theories (TTPD) | theories 🔴 (2 entries, named in #460); videos 🟢 pass (2/2 vs reality, 1/3) | 2026-07-14 (Nils) | walk log #502 |
| Videos / theories (Midnights) | 🟢 both pass (1/3) — 7 honest-labeled theories, 5/5 videos vs reality | 2026-07-15 (Nils) | walk log #502 |
| Crossings overlay | 🟡 works but half-wired — lane dots dead (nothing on mobile), crossing details name moments without linking | 2026-07-15 (Nils, first walk) | #655 |
| Search overlay | 🟡 indexed but dead-ends — song/video results misroute, threads unsearchable, dead suggestion chip | 2026-07-15 (Nils, first walk) | #652 |
| SEO / discoverability | 🔴 near-zero — no sitemap/robots/canonical/OG/JSON-LD, no per-surface URLs | 2026-07-15 (Nils, first audit) | #653 |
| Chrome copy (first-run, about) | 🟡 functional and honest; About surface missing (J5); footer blanket-disclaimer voice note logged | 2026-07-14 (Nils) | walk log #502 |

Nils's daily walks replace the 🔴-unverified cells with real verdicts within
one rotation (~a week); the matrix is the objective launch answer.
