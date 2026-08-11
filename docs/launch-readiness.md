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
| DEPTH | **Content depth: J3.5** — Midnights + TTPD at Active-tier, relationship/sighting/fashion-weighted (fixed launch gate, decisions 2026-07-04) | 🟡 moving — 2026-07-17: Era Secrets batches 1–2 (25 secrets) + the 1989→reputation rupture arc live (#706/#711, merged by Joey overnight); 07-15 wave #643/#664/#665; full rubric audit still open; Joey's spot-check untimed (J3.5-next); 07-17 PM: batch 3 folklore/evermore live (#734 — pools 7/12) + debut origin story shipped (#718 closed); batch 4 (Red/Speak Now + TTPD eggs) awaiting review (#769); **07-18 AM: batch 4 merged overnight (#769 — pools 9/12)**; 07-19 AM: round-3 defining events + the top-100 event queue doc live (#865) | Rows-per-month audit vs rubric → gap list → **Content Shift queue (priority 3)** · Content desk (content-shift merges now in Marjorie's envelope, 2026-07-15 amendment); spot-check timing · Joey |
| VOICE | **Voice: the Swiftie bar** (#461) — Taylor-not-Swift rule + fan-editor voice, enforced not aspirational | 🟢 done — 2026-07-30/08-05: the checker (`content.voice` — surname-overuse, ai-tell phrases, and a new `wire-attribution` rule catching outlet-as-subject wire-service framing, e.g. "Billboard's gallery logged…") shipped into Karen (`scripts/content-engine/checkers/voice.mjs`, wired into `DET_CHECKERS`) and the full retro pass ran era-batched over the seeds, not just curated copy: 55 items across all 11 eras fixed 07-30 (PR #1633, register/framing only — no fact/date/quote changed), + 3 more from content authored in the interim fixed 08-05 on the same PR before it merged. **PR #1633 was stuck 5 days on a stale CI run from the unrelated build freeze (#1628/#1641) and looked red in the brief the whole time** — auto-merge was armed but had nothing to re-trigger it; fixed 08-05 by rebasing onto current `main` and re-verifying the full CI job locally before push. Current corpus: 0 `content.voice` findings (confirmed by a fresh scan post-merge). Karen's nightly scan (2am PT) now enforces this permanently — any future item authored in wire-voice gets caught the next night automatically | None — gate closed. Any regression reopens via a new `cie` ticket, same as any other Karen finding · Integrity + Build desks |
| WORTHY | **Depth: worthy-of-Taylor** (#441 + #440 phases) — Karen can't see thinness; only 12/244 songs have dossiers; whole narrative periods (thread solo-eras etc.) sit near-empty | 🟡 machinery producing — 2026-07-15: Nils walk 3 (Midnights + folklore + evermore + Crossings + Search + SEO; tickets #651–#655; 15 dupe pairs verified on #616) and three same-day closes: #628/#629/#654 all shipped via merged PRs #643/#664/#665; #615 routed to TOP of Content Shift queue (oldest P1) with #616/#617 behind it; 07-16/17: walk-4 gap #695 (1989 rupture arc) authored same-day and live (#706); #615/#617 re-routed to Austin (app-code fixes); 07-17 PM: 12 Red-era track dossiers merged (#759 — dossiers 12→24/244), photo epic #762 closed same-day (inline photos #763, site-wide focal points #772, 103 low-res upgrades #753), music videos embedded on track pages (#780); **07-18 AM: photo/focal-point program (#762) — 14 more PRs (~140 pages) merged (4 overnight by founders, 10 by Marjorie in-envelope); Karen's new photo-sparsity checker (#814, 110 thin-photo pages) now steers the queue; **07-18 PM: 4 more photo waves merged (#856/#857/#859/#861) + photo-zoom viewer (#831) + significance weighting (#843/#845); depth engine #860 lands the thinness-detection machinery (#441's ask)**; **07-19 AM: rumor tier (#866) + shoppable fashion links (#867) + tuned depth/photo checkers (#869) + vault consolidation (#862/#872) live overnight; 5 more photo/image PRs merged in the morning sweep (#871/#873/#874/#875/#889)** | Content Shift burns #615→#616→#617 in severity order; #441 checkers into Karen; dossier waves per #440 · Critic + Content + Integrity desks |
| SONGS | **Track-guide UX** — Joey's 2026-07-11 report: song clicks broken on TLOAS, "Released" row shows album, most eras have zero clickable songs | 🟢 done — 2026-07-16: **founder-verified on device** ("The song click thing works now" — Joey, on #498). Whole card opens the song (#675), all 244 songs clickable (Austin's #498 verification), Released row fixed (#633), deploy currency proven by bundle fingerprint and #455 closed. Extras shipped the same pass: #676 (Keep exploring leads with next song), #677 (back-swipe stays in-app) | None — gate closed. Any regression reopens via a new ticket · Build desk |
| SCAN | **Karen nightly, actually nightly** — merged today (#139) but never yet run on schedule; 2026-07-11 full scan pending in this session | 🟡 **six consecutive scheduled runs** (reports #612/#626/#648/#691/#714/#752, all merged; #752 is the second 07-17 run, first with the network-free URL-quality checker #742 → new P2 rollup #751); 2026-07-17 run: 1012 items, 0 red-lines, 0 filable P1s, 149 known P2 host-reputation advisories (rollup #647). 07-15 was the first run with the #625 fix live — 0 false image P1s (proxy-refused probes correctly "unverified"). Caveat: image liveness/quality remain effectively unchecked from the runner (egress denies most image hosts), so the run verifies the engine fix but was liveness-blind — **07-17 19:26 UTC: runner egress to the live site restored** (Nils fetched longlivets.com; deploy provably current), so the image-liveness 3-clean-pass count can finally start; **07-18: 7th consecutive clean night (#816 merged) — first run with LIVE image-liveness probing: 599 images, 0 broken → image clean-pass count starts at 1/3**; 07-19: 8th clean night (#885 — 1075 items, 0 P0/P1) but the live probe found **2 dead images → image clean-pass count resets to 0/3** (fix queued via Karen's rollups #877–#884); agent-pass backlog now 66 batches | Fix the 2 dead images, restart image clean-pass count; land remaining #613 fixes · Integrity desk |
| ERRORS | **Zero open P0/P1 content findings** — Karen full criteria, queue drained before ship | 🟡 filable P1 queue **0**; 2026-07-14: Joey commented "Approved" on #613 — the 07-13 bulk-close's authority gap is closed retroactively; the agent-pass batches (now 59: 44 factual, 15 image) remain never-run; Nils's factual finding #615 is queued under WORTHY but is P1-severity content risk | Schedule the agent factual+image passes; resolve #552; fix #615 · Integrity + Content desks |
| ALARMS | **Watch desk minimum (L1)** — uptime/error paging on the authoritative user path + analytics baseline | 🟡 moving — 2026-07-23: **alert delivery is now real email** (#1229 + exec-bit fix #1230 + permissions fix #1232, founder-merged): watchdog alerts (brief-missing, prod smoke check) email both founders From Marjorie's Gmail instead of dead-end @mentions, alerts are persistent per condition, and Content Shift got a liveness check; analytics DECIDED 2026-07-11 (#477 → A, Vercel Web Analytics — Joey); scoped and filed 2026-07-17 (#799); **2026-07-29: both #799 asks built** — `<Analytics />` mounted in the root layout (PR #1607), and the prod smoke check now runs hourly against 2 routes (homepage + `/?era=midnights`) instead of daily/homepage-only, same zero-AI GitHub-issue-paging pattern | Awaiting: founder confirms the Analytics toggle is on in the Vercel dashboard (PR #1607 out of code scope), then 3 consecutive clean hourly runs to flip 🟢 · Watch/Build desk |
| LEGAL | **Legal pages (G5)** — privacy + ToS covering feedback data (already collected!), minors, analytics consent | 🟡 moving — 2026-08-11: **counsel-ready drafts exist** (#800). A stale `/privacy` page *did* exist since 2026-07-08, unlinked from the entire site and materially false (it said "no analytics", "we collect nothing" — written before the feedback button, the mood chat, and Vercel Analytics all shipped); the earlier 🔴 "nothing exists" was right in substance, wrong in detail. Rewritten from a code-verified data-collection inventory, plus a new `/terms` carrying the unaffiliated-fan-site disclaimer, the image-rights/fair-use position, and a takedown path; both linked from the footer, both rendered `noindex` and excluded from the sitemap while `LEGAL_STATUS === 'draft'` | **Blocked on counsel — not closeable by engineering.** Founders: (1) answer the `[FOUNDERS: …]` blanks (entity, jurisdiction, contact addresses, effective date); (2) engage IP counsel with the drafts + the inventory in the PR body; (3) counsel must settle the minors/COPPA question; (4) flip `LEGAL_STATUS` to `'approved'` and log the sign-off in `docs/decisions.md` · founders + counsel |
| BACKUPS | **Backups (G4)** — Supabase restore runbook tested once | 🔴 unverified, but no longer ownerless — **routed 2026-07-15 PM** (#680, Joey's directive on brief #650 + autonomy amendment) into the Build desk queue | Next build-slot session works #680: verify tier → runbook → one tested restore · Build desk |
| PLUMBING | **Ops hygiene** — G2 merge=deploy decision made; G13 Vercel double-project noise resolved; #496 branch protection | 🟡 2026-07-15 PM: **#666 merged — watchdog + E2E now probe www.longlivets.com**; false alerts #632/#663 closed. 07-17 PM: **#679 FIXED** — token set, feedback verified live (#735 test; real feedback flowing again, e.g. #770) and closed by Wyatt; **agent egress to the live site restored** (Nils fetch 19:26 UTC, deployed bundle provably current vs HEAD); remaining gap: E2E suite selectors stale — all 30 tests fail uniformly against prod, monitor is blind (#669, now diagnosable with egress open) | Eng re-anchors the E2E suite (#669) · Build desk |
| CAMPAIGN | **The launch campaign** — Growth desk's first deliverable (pre-launch per decisions) | 🟡 **delivered 2026-07-17** (in-session with Joey, per #518's routing): Growth desk charter (`docs/agents/growth.md`) + the full launch playbook (`docs/marketing/growth-plan.md` — accounts, naming, draft-queue pipeline, IG growth plan, launch-day timeline). Joey directed the pickup ("launch day, let's go"). **Accounts created same day** — `@longlivetscom` on IG/X/TikTok/Threads + Reddit participation account (see growth-plan §1); Slack live (#all-longlive-hq + #social). 07-17 PM: **posting pipeline LIVE and first real posts published** — X+IG pipeline tests (#756/#757), Electric Lady sighting on IG+FB (#781/#786), FB cross-posting (#777), automated poster shipped + hardened (#741/#755/#785). Remaining to 🟢: footer icons + OG share cards (#736); channel-grant TX items (#738); **07-18 PM: footer social icons live (#839 — first #736 slice); social draft queue verified EMPTY (Joey email + `social/queue/` ground truth; #826 now grounds brief claims) — drafting routed to Growth**; **07-19 AM: queue STILL empty, 0 posts today (#864 top of Growth queue — escalates tonight if undelivered)** | Growth: refill draft queue + OG share cards (#736) · #738 TX asks |
| MOBILE | **Mobile navigation** (#634) — era dropdown barely visible, era/threads switcher pill not obvious to a new user; the switcher IS the core of the site. **Founder-declared launch gate: Joey, 2026-07-14 — "We cannot release the site until this works better"** | 🟢 done — 2026-07-18: **founder-verified on device** ("Checked on mobile. Good to go." — Joey on #634, 13:13 UTC). Path: design intent 07-16 (landing-page decision, PR #683), landing page shipped 07-17 (#740, #684 closed, Nils verified in prod), scroll-trap regression fixed same-day (#747 → #760), Joey's phone check closes it | None — gate closed (#634 can close). Any regression reopens via a new ticket · Build desk |

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
| Era timeline: 1989 | 🟡 walked — rupture-arc gap (#695) filed and authored same-day, live via #706; release-day pileups noted (#696, P3) | 2026-07-16 (Nils, walk 4) | #695, #696 |
| Era timeline: reputation | 🟡 walked — no P1/P2 gaps filed; release-day pileups noted (#696, P3) | 2026-07-16 (Nils, walk 4) | #696 |
| Era timelines ×5 remaining (red/lover/fearless/speak-now/debut) | 🔴 unverified (dup-scan only) | 2026-07-16 | next walk slice: red + Lover |
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
