# Launch readiness — the gate, in one place

> **2026-08-11 — the successor bar lives in [`definition-of-done.md`](definition-of-done.md).**
> Joey + Wyatt defined the eight-item product Definition of Done that gates
> the large marketing push. This file's original gates remain the historical
> record (most are 🟢); new pre-push work tracks THERE, and Wyatt is reworking
> Marjorie's dashboard/brief around that list.

**Owner: Marjorie (tracking + brief reporting) · Founders (the go/no-go).**
Created 2026-07-11 after Joey's audit request exposed the real problem: every
gate below existed somewhere in decisions/roadmap/tickets, but no artifact
owned "distance to launch," so nothing drove toward it without founder
nudges. This file is that artifact. **Marjorie's 6 AM brief leads with this
table's deltas** (her runner prompt reads this file); a gate flipping to 🟢
is brief news, a gate stuck two briefs running is a flag.

## Rules for editing

1. **Gates are added or removed only by founder decision.** Statuses update
   freely as work lands — any desk may update its own row, with a link.
2. **A colour change is claimable only with a link** (PR, run, founder
   comment). "Looks done" is not a status.
3. **Every non-green gate names who it is blocked on** — `founder`, `agent`,
   or `nobody`. See "Blocked on" below; `nobody` is a real and common answer
   and it is the most actionable thing this file carries.
4. **The cadence rule (2026-08-11).** A gate whose criterion names a cadence
   — nightly, hourly, weekly — **must name the runner that provides that
   cadence and where that runner's schedule is registered**, in the "Cadence
   provenance" table below. **Changing that runner's cadence requires
   re-scoring the gate in the same change.** A gate may never be 🟢 on a
   cadence its runner does not actually provide.
5. **The dead-ticket rule (2026-08-11).** A gate's next-action issue must be
   open. A closed one means the gate needs re-scoring, not that the row is
   fine.
6. **Say "unverified" rather than guess.** Where a gate's true state cannot
   be established from evidence, score it on what *is* known and write
   `unverified` plus what would settle it. A gate marked unverified is more
   useful than one confidently mis-scored.

Rules 3–5 are enforced mechanically by `npm run check:launch-gates`, which
runs in CI's `build` job. Add `-- --issues` to also check that every
next-action ticket is still open (needs GitHub access; skips cleanly without
it). The checker reads the three marked tables below — it proves the
scoreboard is internally consistent and that its cadence claims are backed by
a real cron. It cannot and does not judge whether a colour is *correct*; only
evidence does that.

"Launch-ready" for content = **Karen-clean under her FULL criteria** — which
per VOICE and WORTHY below means the voice + depth checks (now built) *and*
the agent factual/image passes (still never run). Her deterministic checks
are necessary, not sufficient.

## What each gate means (plain English) + what the colors mean

Gate names are one self-describing word (Joey, 2026-07-15 — the old
`G-A`…`G-L` letter codes said nothing; "G" literally just meant "gate").
Old codes appear in tickets/briefs written before the rename — the "was"
column translates them. Founder-facing surfaces use the name + plain
meaning, never a bare legacy code.

<!-- gates:meaning:start -->

| Gate | was | Plain meaning — "we can't launch until…" |
|---|---|---|
| DEPTH | G-A | **Every era has enough content** (Midnights + TTPD filled to the depth bar) |
| VOICE | G-B | **It sounds like a fan wrote it** (says "Taylor," never "Swift" — enforced by a checker, not vibes) |
| WORTHY | G-C | **No thin or empty pages** (song pages, threads, and story arcs are worthy of her) |
| SONGS | G-D | **Songs open when you tap them** (the track-guide click bug Joey found) |
| SCAN | G-E | **The content-safety scan actually runs every night** |
| ERRORS | G-F | **Zero serious content errors open** (facts, images, sourcing) |
| ALARMS | G-G | **We find out when the site breaks** (uptime alarms + visitor analytics) |
| LEGAL | G-H | **Privacy policy + terms of service exist** |
| BACKUPS | G-I | **Backups exist and a restore has been tested once** |
| PLUMBING | G-J | **The deploy/monitoring plumbing is healthy** (right URLs probed, branch protection on) |
| CAMPAIGN | G-K | **A launch marketing plan exists** |
| MOBILE | G-L | **Mobile navigation is obvious to a new user** (Joey's gate: the era/threads switcher) |

<!-- gates:meaning:end -->

**Status colors — defined, not vibes:**

- 🟢 **done** — the gate's criterion is met and verified (three consecutive
  clean passes where the criterion is a recurring check). Nothing left to do.
- 🟡 **moving** — advanced within the last 2 briefs, or advanced and is now
  waiting on a named party. Carries `unverified` when part of the criterion
  cannot currently be evidenced.
- 🔴 **stalled** — not started, blocked, or no movement for 2+ briefs. A red
  row always names what it's waiting on.

**Blocked on — a closed vocabulary, because the distinction is the point:**

- **founder** — needs a human decision, a credential, a dashboard, or an
  outside party (counsel). No agent can move it. *This is the scarce one.*
- **agent** — the next step is real engineering work that is scheduled or
  owned by a named desk.
- **nobody** — nothing and no one is in the way. The work is unclaimed, or
  the gate is already satisfied and simply was never re-checked. **Historically
  this has been the largest bucket, and it is invisible unless stated.**

Every founder-facing rendering of this table carries the one-line legend:
`🟢 done · 🟡 moving · 🔴 stalled — every non-green row says who it waits on`.

## The scoreboard

Re-scored end-to-end 2026-08-11 against evidence (PR "launch gates: re-score
all 12 against evidence"). Evidence for every change is in "Gate evidence +
history" below.

<!-- gates:scoreboard:start -->

| Gate | Status | Blocked on | What is actually left | Next-action issues |
|---|---|---|---|---|
| DEPTH | 🟡 | nobody | **The rows-per-month audit ran 2026-08-12** (`docs/audits/2026-08-12-depth-rows-per-month.md`, re-runnable via `npm run depth:months`): the wavetop floor is MET in all 12 eras. The depth-batch PR then worked the top of its queue — TTPD's `relationship` axis went 2 → 4 rows (clearing the floor, closing the one flagship launch-bar miss), 1989 gained the 2017 Mueller trial in its 14-month near-dead stretch, and 7 of the caption-level headline stubs were deepened. Remaining: the rest of the caption-level queue and 1989's still-thin month grid. Joey's spot-check still never happened | #1719, #47 |
| VOICE | 🟢 | nobody | Nothing — the corpus is back to **0 `content.voice` findings** (fresh run over 1,148 items, 2026-08-12), and enforcement no longer rides on a scan schedule: `npm run check:voice` is a blocking step in CI's `build` job and scans the seed files each PR changes, so surname drift cannot reach `main` at all (#1917, #1918) | — |
| WORTHY | 🟡 | nobody | **Dossier lane moving again after 14 flat days:** 101/244 song dossiers as of 2026-08-12 (the 08-11 row's "83" was stale; 89 at the 08-12 merge base) — speak-now went 0/23 → 12/23 in the depth-batch PR, first dossier PR since #1589 on 07-28. Remaining: 143 dossiers (fearless 2/25, debut 1/14, midnights 4/22 worst), 59 photo-sparse pages, 5 hot-thin topics | #440, #441, #615 |
| SONGS | 🟢 | nobody | Nothing — founder-verified on device; the E2E synthetic monitor is the standing regression signal and is green | — |
| SCAN | 🔴 | founder | **The criterion is unsatisfiable as written.** It requires a scan every night; a 2026-07-25 cost decision throttled the runner to weekly. Either the criterion drops to weekly or the runner goes back to nightly and the repo pays for it — a cost call, not an engineering one | — |
| ERRORS | 🟡 | agent | `unverified` — the ticketed P0 queue is 0 and the filable P1 queue is 4 tickets, but a fresh scan at merge 2026-08-12 finds **1 unticketed P0** (the new `safety.rumor-redline` checker from #1930, merged today, flags a venue-level whereabouts rumor), the agent factual + image passes have never run, and the nightly scan that is meant to keep this queue current runs weekly. Ticket filing produced nothing 2026-08-02 → 08-12; its root cause closed at merge (#1869 fixed by PR #1887, merged 2026-08-12) but no scheduled run has yet proven filing works again. The queue can neither be drained nor trusted | #552 |
| ALARMS | 🟢 | nobody | Nothing — founder confirmed Analytics 2026-08-01; the hourly prod smoke check has been clean far past the 3 consecutive runs the criterion asked for | — |
| LEGAL | 🟢 | nobody | Nothing — all nine `[FOUNDERS: …]` blanks filled (#2332, merged 2026-08-24), minors/COPPA settled (not directed to children under 13), counsel reviewed and Joey confirmed "proceed" (issue #800, 2026-08-18; issue closed 2026-08-25). `LEGAL_STATUS` stays `'draft'` (banner + noindex) until a separate founder call flips it to `'approved'` — a forward decision, not a blocker on this gate | — |
| BACKUPS | 🟡 | founder | Joey must read the Supabase plan + automated-backup/PITR status off the dashboard, then run one drill against production's own bytes. The drill itself is built and passing. **Re-checked 2026-08-26: an agent session confirmed it has no path to either — no `SUPABASE_DB_URL`/service-role value reachable (guard blocks even touching `.env`), no Supabase MCP/CLI/management-API access. Genuinely founder-only** | #680 |
| PLUMBING | 🟢 | nobody | Nothing — the synthetic monitor was re-anchored and has passed 10/10 daily since 2026-08-01; branch protection is live as ruleset `protect-main` | — |
| CAMPAIGN | 🟢 | nobody | Nothing — plan, accounts, footer icons, OG cards and an automated poster are all live and publishing | — |
| MOBILE | 🟢 | nobody | Nothing — founder-verified on device 2026-07-18 | — |

<!-- gates:scoreboard:end -->

**Count: 🟢 7 · 🟡 4 · 🔴 1.** Of the 5 non-green: **2 blocked on a founder**
(SCAN, BACKUPS), **1 on an agent** (ERRORS), **2 on nobody** (DEPTH,
WORTHY). Only the two founder rows are genuinely scarce; the other three
are unclaimed work.

## Cadence provenance

Rule 4 above, made concrete. Every gate whose criterion names a cadence
appears here with the runner that provides it. `npm run check:launch-gates`
verifies the cron literally exists in the cited file and is at least as
frequent as the criterion needs; a ⚠️ cell is a knowingly-unmet claim, legal
only while the gate is non-green.

Scope note: the checker reads cadence words in the *meaning* and *scoreboard*
tables only. A cadence mentioned solely in the long-form evidence rows below
is documentation, not a claim.

<!-- gates:cadence:start -->

| Gate | Cadence the criterion claims | Runner that provides it | Registered cadence | Where that cadence is registered |
|---|---|---|---|---|
| SCAN | nightly | Karen — content-safety scan (`trig_014HWuRmT2MFveDkPGwVDiQX`) | `0 9 * * 0` ⚠️ weekly, below the claim since 2026-07-25 | `docs/agents/runners.md` |
| ERRORS | nightly | Karen — content-safety scan (fills and drains the `cie` queue) | `0 9 * * 0` ⚠️ weekly, below the claim since 2026-07-25 | `docs/agents/runners.md` |
| ALARMS | hourly | watchdog → "Prod smoke check" step | `5 * * * *` | `.github/workflows/watchdog.yml` |
| PLUMBING | daily | E2E synthetic monitor | `5 13 * * *` | `.github/workflows/e2e.yml` |

<!-- gates:cadence:end -->

**Two gates still rest on a nightly scan that has been weekly for 18 days**
(SCAN and ERRORS; it was three until 2026-08-12). That is the single most
important line in this file. It is not a bug in the throttle — the cost
decision was deliberate and approved — it is that nothing propagated it to the
criteria that depended on it. Rule 4 and the checker exist so this cannot
recur silently.

**VOICE left this table on 2026-08-12, and how it left is the template for
the other two.** It did not get its cadence back; it stopped needing one. The
rule it enforces now runs as a blocking check in CI's `build` job
(`npm run check:voice`) over the content each PR changes, so a violation is
caught *before* it is on `main` rather than reported some number of hours
after. A scan schedule can slip silently — a required check cannot. Any gate
whose criterion is mechanically decidable over the repo's own files belongs in
`build`, not in a cron.

## Gate evidence + history

| Gate | Criterion | Status + evidence | Next action · owner |
|---|---|---|---|
| DEPTH | **Content depth: J3.5** — Midnights + TTPD at Active-tier, relationship/sighting/fashion-weighted (fixed launch gate, decisions 2026-07-04) | 🟡 moving, **partly unverified** — 2026-08-11 re-score: the July authoring waves all landed (Era Secrets batches 1–4, the 1989→reputation rupture arc #706/#711, folklore/evermore #734, debut origin story #718, round-3 defining events #865). Coverage at merge, 2026-08-12 (`npm run content:coverage`, 731 items): midnights **92**, showgirl 87, 1989 64, evermore 64, tortured-poets **61**, speak-now 60, red 58, lover 56, debut 52, fearless 49, reputation 47, folklore 41. Midnights is still the deepest era. **But the gate's own stated measure — rows per month against `docs/content-ops/depth-rubric.md` — has never been computed.** No audit artifact exists after 2026-07-09 and no issue owns it, so "at Active tier" is unevidenced in both directions. TTPD `relationship` = 2 items is the weakest weighted axis in the corpus and is exactly the axis J3.5 named. `content.depth-deficit` = 26 (rollup #1719, open + unassigned); 69 items flagged for a depth pass. Joey's untimed spot-check: no evidence it ever happened. Content Shift runs daily as a Vault Run lane but is a ≤2-items/day news lane — it is not burning a depth gap list, because no gap list exists | Run the rows-per-month × rubric audit → gap list → queue it; then Joey's spot-check. **Blocked on nobody** — unclaimed, needs no decision. (Sub-item #1241, depth-fleet trigger enablement, *is* founder-blocked but is not what holds this gate) · Content desk |
| VOICE | **Voice: the Swiftie bar** (#461) — Taylor-not-Swift rule + fan-editor voice, enforced not aspirational | 🟢 **re-closed 2026-08-12 — and this time the enforcement is at merge time, not on a schedule.** History first, because it is the point: the gate was flipped 🟢 on PR #1811 (08-06) on a fresh 0-findings scan, on the sentence "Karen's nightly scan now enforces this permanently — any future item authored in wire-voice gets caught the next night automatically." That sentence was false when written (the scan went weekly on 2026-07-25, 12 days earlier) and the ticket fallback was down too (`cie` filing produced nothing 2026-08-02 → 08-12, #1869). The corpus drifted back: `docs/audits/engine/` shows 0 voice findings daily 07-30 → 08-08, then 4 on 08-09, 4 on 08-10, 6 on 08-11, and a fresh run at merge on 08-12 returned **19** — 16 `content.voice.surname-overuse` and 3 `content.voice.wire-attribution`. **What this PR did.** (1) Verified the count independently rather than trusting the tickets: a fresh run over 1,148 items returned **exactly 19** (16 + 3 + 0 ai-tell). Note #1917 was filed listing only **13** surname items — the 3 in `supabase/seed/theories/the-life-of-a-showgirl.mjs` accumulated after it was filed and were tracked nowhere. (2) Fixed all 16 surname items in the site's own narrative voice; every direct quote, every "[Name] Swift" (Austin/Andrea/Scott), the bot name "Taylor Swift Store Updates" and the Target "Taylor Swift 20" listing were left byte-identical. (3) Rewrote 2 of the 3 wire-attribution items so the fan read leads and the citation trails ("— “twin No. 1 chart debuts,” per Variety —"; "…had already gone silent the same way (Billboard, Variety)"). (4) The third was a **checker false positive**, not a content defect: "the Us Weekly report above" is a noun phrase, and `report` is in the rule's reporting-verb list. The rule now ignores an outlet preceded by a determiner. A second false-positive class was found by building an adversarial battery before shipping the gate — **legal case captions** ("Hall v. Swift", "Mueller v. Swift"), which are what those proceedings are *called* — and is excluded too. Both changes ship with tests. (5) **The actual fix for the failure mode:** `npm run check:voice` (`scripts/check-voice.mjs`) is a blocking step in CI's `build` job. It scans the seed files each PR changes; editing the voice rule itself escalates to a full-corpus scan, so the rule cannot be loosened without proving the whole corpus still passes. Corpus is at **0 findings** at merge. | None — gate closed. It can no longer regress by cadence: a PR that adds wire voice goes red before it merges. Karen's scan is now the sweep, not the gate. Any genuine miss reopens via a new `cie` ticket · Integrity + Content desks |
| WORTHY | **Depth: worthy-of-Taylor** (#441 + #440 phases) — Karen can't see thinness; whole narrative periods sit near-empty | 🟡 machinery met, authoring stalled — #441's *machinery* half is effectively done: `content.depth-deficit`, `content.photo-sparsity` and `content.hot-thin-topic` are live checkers running every scan. The photo/focal-point program (#762) is genuinely productive — 10 PRs merged in the last week alone (#1545, #1565, #1662, #1749, #1771, #1793, #1849, #1866, #1879 + crosslinks #1827/#1867, depth-deepen #1732). **The dossier lane is the problem: 83/244 (34%), unchanged since 2026-07-29.** Trajectory 12 (07-11) → 24 (07-17) → 83 (07-29) → 83 (08-11); last dossier PR was #1589 on 07-28. Per era: tloas 12/12, ttpd 24/31, red 13/29, lover 6/18, folklore 6/17, 1989 5/21, evermore 5/17, reputation 5/15, midnights 4/22, fearless 2/25, debut 1/14, **speak-now 0/23**. Side finding while counting: `check-generated-in-sync` prints "dropping a dossier with content but no sources (authoring error)" ×7 — ~90 dossiers are authored, 83 ship, and the 7 fail silently at build. Current thinness: `content.photo-sparsity` 59 (rollup #1721 still says 54), `content.hot-thin-topic` 5 (rollup #1720 says 3) — both rollups stale because filing is down. #615/#616/#617/#440/#441 all open and unassigned; #440 carries an unresolved founder escalation from Joey dated 2026-07-15 | Staff the dossier lane (speak-now 0/23 first); fix the 7 silently-dropped dossiers; burn #615 (a live factual defect on a high-visibility page) → #616 → #617. **Blocked on nobody** — the pipeline works and merges daily; nothing is assigned to it · Critic + Content + Integrity desks |
| SONGS | **Track-guide UX** — Joey's 2026-07-11 report: song clicks broken on TLOAS, "Released" row shows album, most eras have zero clickable songs | 🟢 done — 2026-07-16: **founder-verified on device** ("The song click thing works now" — Joey, on #498). Whole card opens the song (#675), all 244 songs clickable, Released row fixed (#633), deploy currency proven by bundle fingerprint (#455 closed). Extras: #676, #677. **Still green on 2026-08-11:** the E2E synthetic monitor exercises the vault entry path and has passed 10/10 daily since 08-01, so a regression would surface without a founder re-check | None — gate closed. Any regression reopens via a new ticket · Build desk |
| SCAN | **Karen nightly, actually nightly** (#139) — plus 3 consecutive clean nightly image-liveness passes | 🔴 **stalled — the criterion cannot be met as written.** Was 🟡. Karen's registered cadence is `0 9 * * 0` — **weekly, Sundays** — set by the 2026-07-25 sustainment pass (`docs/agents/runners.md` → "Cadence overrides still in force"). A criterion reading "every night" has therefore been unsatisfiable for 17 days. Scheduled runs since the throttle are exactly what weekly predicts: 07-26 (#1547), 08-02 (#1725), 08-09 (#1850). **Three things the throttle hid.** (1) The brief has reported "nightly safety scan clean ✅" throughout, including today (#1882), while the 08-09 scheduled run reported P1 49 and its ticket-filing step died on `401 Bad credentials`; the 07-26 run died on `spawn gh ENOENT`. (2) `docs/audits/engine/YYYY-MM-DD-cie-run.md` looks like an unbroken nightly series (07-29 → 08-11) but is **not the scheduled scan** — those files are byproducts committed by content PRs from other lanes (08-11's arrived via #1879, 08-10's via #1867). They are real scans; nobody is on the hook for their findings. (3) Image-liveness clean-pass count is **unverified, not 3/3**: `image.liveness` reports 0 findings on 08-09/08-10/08-11 and `image.quality` reports 14 (which requires actually fetching bytes), so probes did run and found no broken images — but these are ad-hoc runs, not the consecutive *nightly* passes the criterion names, and the report footer prints the full checker list whether or not the image passes ran (`writeReport` is handed `DET_CHECKERS.map(c => c.id)`), so the artifact cannot evidence a pass on its own | **Founders decide which is true**: (a) relax the criterion to weekly and re-score, or (b) restore Karen to nightly and accept the token cost, or (c) split it — cheap deterministic pass nightly, full pass weekly. Filing's root cause is fixed (#1887, merged 2026-08-12, closed #1869); verify the next scheduled run actually files, so a dirty scan is visible. **Blocked on a founder** — this is the cost decision of 2026-07-25, and no agent may change fleet cadence · Wyatt + Integrity desk |
| ERRORS | **Zero open P0/P1 content findings** — Karen full criteria, queue drained before ship | 🟡 moving, **unverified on its stated criterion.** The old row's "filable P1 queue **0**" was wrong. Truth on 2026-08-11: **ticketed P0 = 0**; open `cie` tickets are **4 × P1** (#552 broken image 403, open since 07-14; #1665 broken image timeout; #1713/#1714 social-post-missing), 27 × P2, 2 × P3. The 503 P1 *findings* in today's report are not 503 defects: `fact.claim-risk` is emitted at confidence 0.30–0.45, deliberately below `issues.mjs`'s `minConfidence 0.5` — its own comment says "claim-risk ROUTES claims to the factual agent; it is never itself a defect." The genuinely filable P1s were the 47 `safety.redline` oversized fields, and PR **#1727 fixed all 47 today** (verified independently: `content:coverage` reports zero article-dump fields at HEAD). So the deterministic layer is in good shape. **Merge-day delta (2026-08-12):** the new `safety.rumor-redline` checker (#1930, merged today) flags **1 P0** in the shipped corpus — a venue-level whereabouts rumor on a showgirl sighting (`showgirl-newlyweds-1587-prime-dinner-rumored`) with no `locationSpecificity` declared, so validate-content's provenance gate never saw it. Unticketed — it surfaced while filing was still down. **What makes this unverified:** the gate says Karen's *full* criteria, which this file defines as including the agent factual + image passes — 72 batches were prepped as of 08-09 and **none has ever run**; no agent-sourced findings exist anywhere. And no `cie` issue was created 2026-08-02 → 08-12 across three scheduled runs, so the queue's own reporting was down. #1869 had the root cause: Node's `fetch` ignores `HTTPS_PROXY` → 401, and the proxy 403s `/search/issues`, which every list in `scripts/lib/gh.mjs` was built on — including the `cie-fp:` idempotency lookup. **PR #1887 (merged, closed #1869 on 2026-08-12) repoints the fallback at repo-scoped endpoints** — the fix is in, but no scheduled run has yet demonstrated filing end-to-end. A related claim needs checking: #1719's 08-11 comment cites `scripts/content-engine/dedupe-rollups.mjs` as shipped; **that file does not exist in the repo** | #1869 landed (PR #1887, 2026-08-12) — verify filing resumes on the next scheduled run; run the agent factual + image passes; ticket + fix the rumor-redline P0; re-triage #552 (may be a survivor of the #613 false-positive class). **Blocked on an agent** — Build + Integrity desks own the agent passes and the filing verification. A founder is needed only to change `minConfidence` policy, which nobody has proposed · Build + Integrity desks |
| ALARMS | **Watch desk minimum (L1)** — uptime/error paging on the authoritative user path + analytics baseline | 🟢 **done — flipped 2026-08-11, after sitting 🟡 for 10 days on a verification nobody performed.** Both halves are met. *Founder half:* Joey commented "Done" on #799 at 2026-08-01T14:19Z, confirming the Vercel Analytics toggle (`<Analytics />` shipped in PR #1607). *Verification half:* the criterion asked for 3 consecutive clean hourly runs of the prod smoke check (`watchdog.yml`, `5 * * * *`, added for #799 on 07-29). It has had far more — I read the step output on the six most recent runs (31515794886, 31507375557, 31495907976, 31488490444, 31476410330, 31468512069), every one printing `smoke OK (both routes)`; and its persistent alert issue, "Watchdog: prod smoke check failing", **has never been opened in this repo's history**, which is the standing proof of no failure since the persistent-title pattern landed 2026-07-23. Alert delivery is real email to both founders (#1229/#1230/#1232). Note for future audits: the ~28 non-success `watchdog.yml` runs in the last 200 are cancellations and infra failures, not smoke failures — the smoke step's own alert is the reliable signal, not the job conclusion | None — gate closed. A smoke failure reopens it automatically by opening the alert issue · Watch/Build desk |
| LEGAL | **Legal pages (G5)** — privacy + ToS covering feedback data (already collected!), minors, analytics consent | 🟡 moving — was 🔴 "nothing exists". **PR #1889 merged 2026-08-12 — the drafts are now live; the gate is closeable but not closed.** It adds `/privacy` and `/terms` written from a line-by-line audit of what the app actually does, footer-linked, with `LEGAL_STATUS = 'draft'` rendering a review banner, `noindex`, and sitemap exclusion until counsel signs off; 43 tests assert every real data flow stays disclosed so a deletion fails CI. It also corrects the old 🔴: a `/privacy` page had existed since 2026-07-08 — **linked from nowhere**, and materially false by the time it mattered (it claimed "no analytics" and "we collect nothing" after Vercel Analytics, the feedback button, and mood chat all shipped). So the gate was worse than "nothing exists", not better | **Blocked on a founder + counsel — not closeable by engineering.** In order: (1) answer the nine `[FOUNDERS: …]` blanks — legal entity, governing law/venue, privacy contact, takedown contact, postal address, effective date, mobile-store data-safety forms, minors/COPPA, DMCA agent; (2) engage IP counsel with the drafts + the inventory in #1889's body; (3) **settle minors/COPPA** — a Swift fan site plausibly draws under-13s and there is no age gate; a "yes" forces product change; (4) flip `LEGAL_STATUS` to `approved` and log the sign-off in `docs/decisions.md` · founders + counsel |
| BACKUPS | **Backups (G4)** — Supabase restore runbook tested once | 🟡 moving — was 🔴 "unverified, ownerless". **PR #1890 (merged 2026-08-12) executes the drill.** Real run, real evidence: 14 tables / 1901 rows / 3.24 MB backed up and restored into a scratch database in 15.2 s — schema fingerprint match, 14/14 per-table content checksums match, 8/8 named spot checks byte-identical, including all four runtime-only `news_*` tables. A negative control (drop a row, alter a title) makes the same drill exit 1, so the green is not a rubber stamp. A CI drill keeps it from rotting. Scoping finding that shrinks the gate: schema (`supabase/migrations/**`) and content (`supabase/seed/**`) are both in git and the live site renders from the committed generated vault, not Supabase — the only state existing nowhere else is the four `news_*` tables, `news_source.last_polled_at`, and generated uuids | **Blocked on Joey, two items, neither agent work:** (1) read the Supabase plan and whether automated backups / PITR are on off the dashboard into `docs/backup-restore.md` §6 — on the free tier the answer is "none", which should be a recorded accepted risk, not an assumption; (2) one drill against **production's own bytes** (`--source "$SUPABASE_DB_URL" --target <scratch>`, source pinned read-only) · Joey + Build desk. **2026-08-26 (#680 desk pass):** confirmed neither is reachable from an agent session — see `docs/backup-restore.md` §6 for the specific access paths checked and ruled out |
| PLUMBING | **Ops hygiene** — G2 merge=deploy decision made; G13 Vercel double-project noise resolved; #496 branch protection | 🟢 **done — flipped 2026-08-11; the row had been stale for 12 days.** The gap it named (#669, stale E2E selectors) was **closed 2026-07-30**, and the fix is real rather than a close-by-assertion: PRs **#1178** (07-21) and **#1207** (07-22) re-anchored the suite, and no spec was deleted to get there — `e2e/vault.spec.ts` is the only spec that has ever existed and still carries its original 5 `test()` blocks. The old row's "all 30 tests fail" was itself a misreading: 5 tests × 2 Playwright projects = 10, × `retries: 2` in CI = 30 reported attempts. The monitor is green — **11 consecutive successful `e2e.yml` runs 08-01 → today**, most recent `10 passed (21.7s)`. Branch protection is **on**, implemented as ruleset `protect-main` (id 18819106, enforcement `active`: deletion, non_fast_forward, pull_request, required_status_checks) — note the legacy `/branches/main/protection` endpoint 404s for rulesets and **must not** be read as "protection off". Watchdog's cadence view printed `cadence OK` today and has never opened its alert. Earlier work stands: #666 (probes moved to www.longlivets.com), #679 (feedback token), agent egress restored. **Residual not held against the gate:** #522 (Vercel double-project reconciliation) is open and dashboard-only, but its user-visible symptom — a stale build — is gone; prod serves post-07-18 code, confirmed today via the live OG tags and the smoke check | None gate-blocking. Housekeeping: close stale #1641 (CI `build` red — `ci.yml` is green on all recent `main` runs); founders may reconcile #522 at leisure · Build desk |
| CAMPAIGN | **The launch campaign** — Growth desk's first deliverable (pre-launch per decisions) | 🟢 **done — flipped 2026-08-11; the row had been stale for 12 days.** The criterion ("a launch marketing plan exists") is exceeded and every item the old row listed as remaining is discharged. **#736 closed 2026-07-30 with both halves shipped** — footer social icons (PR #839; `apps/web/lib/longlive/social.ts`, `SiteFooter.tsx`) and OG share cards (#1425/#1426; `apps/web/app/opengraph-image.tsx` + `layout.tsx`) — both **verified live in prod today**: `og:image` 1200×630 served from `/opengraph-image` (HTTP 200) with the correct `alt`, and the three footer links with `utm_medium=footer` present in the served HTML. **#738's founder TX asks are discharged** — X and IG/FB credentials have been in repo Actions secrets since 07-17/18 and both channels are publishing; the per-item approval gate #738 describes was retired by the 2026-07-25 decision. **The queue is not empty** — 10 items scheduled 08-11 → 08-18, `social/posted/` shows a post every day in August, `social-poster.yml` 20/20 green. Plan + charter live at `docs/agents/growth.md` and `docs/marketing/growth-plan.md`; accounts created 07-17 | None gate-blocking. Growth/eng housekeeping: **#1897** (Instagram publishes the media container without polling for `FINISHED` — has already burned one real post); one queue item stuck since 08-09 needing non-generic media; 12 X drafts stranded in `social/failed/` from the 07-21 → 08-04 403 window, never re-shipped; close stale #738 and #864 ("queue is EMPTY" — false since 08-05) · Growth desk |
| MOBILE | **Mobile navigation** (#634) — era dropdown barely visible, era/threads switcher pill not obvious to a new user. **Founder-declared launch gate: Joey, 2026-07-14 — "We cannot release the site until this works better"** | 🟢 done — 2026-07-18: **founder-verified on device** ("Checked on mobile. Good to go." — Joey on #634, 13:13 UTC). Path: design intent 07-16 (landing-page decision, PR #683), landing page shipped 07-17 (#740, #684 closed, Nils verified in prod), scroll-trap regression fixed same-day (#747 → #760), Joey's phone check closes it | None — gate closed (#634 can close). Any regression reopens via a new ticket · Build desk |

## 2026-08-11 re-score — what the audit found, beyond the individual rows

Four failure modes, all of which the rules above now guard:

1. **A cost decision silently invalidated a launch criterion.** Karen went
   weekly on 2026-07-25. Three gates (SCAN, VOICE, ERRORS) rest on her being
   nightly. Nothing propagated the change for 17 days, and the brief went on
   reporting "nightly safety scan clean ✅" the whole time. → Rule 4 + the
   cadence table + `check:launch-gates`.
2. **Gates cited dead tickets.** PLUMBING pointed at #669 and CAMPAIGN at
   #736; both closed 2026-07-30. Both gates were in fact *done* and were
   scored 🟡 for 12 days, and the brief kept printing closed tickets as the
   next step. → Rule 5 + `check:launch-gates -- --issues`.
3. **A gate sat yellow for want of a verification nobody ran.** ALARMS
   needed "3 consecutive clean hourly runs". It had had hundreds. Ten days,
   one `gh run view`. → the `blocked on: nobody` column exists to make this
   class visible at a glance.
4. **"Green" was claimed on a self-enforcement promise instead of a
   measurement.** VOICE closed on "the nightly scan enforces this
   permanently"; the scan was weekly, the ticket fallback was broken, and 16
   findings accumulated unseen. → a gate may not be 🟢 on a ⚠️ cadence.
   **Closed out 2026-08-12**: the 19 findings were fixed and the rule became a
   blocking `build` step (`npm run check:voice`) over each PR's own content.
   The lesson generalises past this one gate — *"a scan will catch it later"*
   is not enforcement, it is a hope with a cron attached. Where a criterion
   can be decided mechanically from the repo, decide it at the merge.

**Open questions for Wyatt / Joey** (none actionable by an agent):

- **SCAN's criterion vs Karen's cost.** Relax to weekly, restore nightly, or
  split cheap-nightly / full-weekly? Until this is answered SCAN stays 🔴 and
  ERRORS cannot be trusted to self-report. (VOICE no longer depends on this
  answer as of 2026-08-12 — its rule moved into CI's `build` job.)
- **LEGAL:** nine blanks + counsel + the minors/COPPA call (see the row).
- **BACKUPS:** the Supabase plan/PITR answer + one production-bytes drill.
- **`docs/agents/runners.md` contradicts itself** on Karen's cadence — the
  "Cadence overrides still in force" table says `0 9 * * 0` (weekly, and this
  matches observed behaviour) while "The split" table still lists `0 9 * * *`
  (nightly). This file cites the overrides table. That doc is owned by the
  fleet-ops session, not this one, so it is flagged rather than fixed — but
  it is the same class of drift as everything above.
- **`docs/launch-readiness.md` was edited by three PRs at once** (#1889
  LEGAL — merged 2026-08-12, #1890 BACKUPS — still open, and this re-score).
  The rows here already incorporate both of theirs; on conflict, take this
  file's version of the LEGAL and BACKUPS rows, which is theirs plus the
  blocked-on column.


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

> **⚠️ STALE as of 2026-08-11 — read as history, not as status.** Every
> verdict below is dated 2026-07-13 → 2026-07-16 and Nils's daily walk is now
> weekly (`0 14 * * 0`, `docs/agents/runners.md`), so the "replaced within one
> rotation" promise at the foot of this section no longer holds. Several rows
> are known-wrong: the SEO row (🔴 "no sitemap/robots/canonical/OG/JSON-LD")
> was fixed by #653/#1425/#1426 and OG cards are live in prod; the TLOAS
> track-guide row's pending on-device retest was confirmed by Joey on
> 2026-07-16. The egress caveat is also obsolete (restored 2026-07-17). This
> matrix was not re-walked in the 2026-08-11 re-score — the gates above were
> scored from primary evidence instead. **Treat any cell here as unverified
> until Nils re-walks it.**

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
