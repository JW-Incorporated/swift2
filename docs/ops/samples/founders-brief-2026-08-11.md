<!--
Sample output of `node scripts/marjorie/assemble-brief.mjs 2026-08-11`, run
against LIVE repo data on 2026-08-11. Nothing below was written by hand.

This is the raw deterministic skeleton. Marjorie's judgment pass tightens the
wording and cuts to the charter's 550-word cap before posting — see the
`<!-- budget: ... -->` stamp at the end, which exists so a run cannot blow the
cap without leaving a trace.

Kept in the repo as the reference for what the format is supposed to look
like, and as evidence for the rebuild: compare it with issue #1882, the
hand-built brief posted the same morning.
-->

cc @sffan15-sys @wjduvall-cmd

# Founders' Brief — 2026-08-11

## 1 · Progress toward Done

**🫵 Gated on you: 7** — 5 overdue. Each of these needs an answer **or a close**; leaving them open is what makes this list grow.

- 🔴 [#459](https://github.com/JW-Incorporated/swift2/issues/459) **Track Guide theme pills look clickable but do nothing** — banked 31d ago, never once put in front of you
- 🔴 [#530](https://github.com/JW-Incorporated/swift2/issues/530) **V2: Get the Android app live on Play Store** — banked 29d ago, never once put in front of you
- 🔴 [#725](https://github.com/JW-Incorporated/swift2/issues/725) **ops: re-seed production Supabase from current main seeds…** — banked 25d ago, never once put in front of you
- 🔴 [#710](https://github.com/JW-Incorporated/swift2/issues/710) **Feedback chatbot pilot** — banked 25d ago, never once put in front of you
- 🔴 [#935](https://github.com/JW-Incorporated/swift2/issues/935) **LEGAL/image: 17 distinct Getty comp URLs hotlinked across 4…** — banked 22d ago, never once put in front of you
- [ ] [#1911](https://github.com/JW-Incorporated/swift2/issues/1911) **social: 11 X posts dead since 07-21 on one 403 credential…** — banked as a founder-decision, 0d old
- [ ] [#1894](https://github.com/JW-Incorporated/swift2/issues/1894) **Buy GitHub Secret Protection? (push protection is the gap…** — banked as a founder-decision, 0d old

**Cleared: 1** — [#979](https://github.com/JW-Incorporated/swift2/issues/979) (closed) · 1 of these was already closed while still on your checklist; that loop is now fixed.

### 📈 Distance to done

**7.0 / 12 gate-points done (58%)** — 4 green · 6 moving · 2 not started.
**Time to done: 2–8 weeks** for the 3.5 points with activity behind them, at 0.1607 pts/day over the last 28 days. Confidence **low** — 10 status changes, window rates within 2.7×; 1.5 of the remaining points sit on gates with no activity — extrapolation does not cover them.
⚠ **1.5 more points are outside that estimate**: **DEPTH** (30d, tracker row names no ticket to check) · **SCAN** (30d, no ticket activity in 26 days) · **ERRORS** (30d, no ticket activity in 24 days). Until staffed, the honest answer for those is "unbounded".

> "Done" = all 12 gates green. **[JOEY: replace with your definition — `docs/ops/definition-of-done.md`. Until then the gates are the proxy.]**

### ⚡ What would make it sooner

- **Land #1889** — closes **LEGAL**, which the tracker still shows as red.
- **Land #1890** — closes **BACKUPS**, which the tracker still shows as red.
- **Land #1618** — closes **WORTHY**, which the tracker still shows as yellow.
- **Land #1910** — closes **PLUMBING**, which the tracker still shows as yellow.

### 📊 Gates still open

| Gate | | Next step | Tickets |
|---|---|---|---|
| DEPTH | 🟡 | Rows-per-month audit vs rubric → gap list →  | — |
| WORTHY | 🟡 | Content Shift burns #615→#616→#617 in severi | #615 #616 #617 #441 #440 · PR #1618 |
| SCAN | 🟡 | Fix the 2 dead images, restart image clean-p | #613 |
| ERRORS | 🟡 | Schedule the agent factual+image passes; res | #552 #615 |
| ALARMS | 🟡 | Awaiting: founder confirms the Analytics tog | ~~#1607~~ |
| LEGAL | 🔴 | Draft privacy + ToS for IP-counsel review (# | #800 · PR #1889 |
| BACKUPS | 🔴 | Next build-slot session works #680: verify t | #680 · PR #1890 |
| PLUMBING | 🟡 | Eng re-anchors the E2E suite (#669) | PR #1910 · ~~#669~~ |

🟢 done (4): VOICE, SONGS, CAMPAIGN, MOBILE. Struck-through tickets are already closed — if one is still a "next step", that row is stale.

### 📰 Last 24 hours

- **17 PRs merged · 24 tickets closed · 30 PRs opened.** Newest: #1906 replace the queue with calendar-driven dra · #1902 content auto-merge allowlist missed 3 gene · #1901 merge two duplicate 2023 VMAs + Chiefs-gam

## 2 · Maintenance — 🔴 **5 of 8 failing: dark runners, stuck PRs, unowned work, stale tracker, budget.**

- 🔴 **All bots running** — 4 dark: Austin — build runs (never seen), Kevin — S1 Karen solver (never seen), Laura — a11y walk (never seen), Routine Auditor (never seen)
- 🔴 **No stuck or stale PRs** — 8 green >24h unmerged (#1822 #1629 #1619 #1618 #1596 #1585 #1580 #1571) · 2 red >24h (#1762 #1642) · 3 untouched >7d (#1619 #1596 #1580)
- 🟢 **CI and deploys healthy** — main green · 100% of 32 builds passed in 24h
- 🔴 **No unowned launch work** — 11 launch-gate ticket(s) with no owner (#615 #616 #617 #441 #440 #613 #552 #800 #680 #738 #634) · 10 intake item(s) untriaged >48h
- 🟢 **No open watchdog alerts** — none open
- 🟢 **Social queue flowing** — 10 queued (9 scheduled, 1 due) · 0 posted today
- 🔴 **Launch tracker current** — 4 gate row(s) contradicted by live tickets: WORTHY, LEGAL, BACKUPS, PLUMBING — fix the status column before section 1 is trusted
- 🔴 **Budget and limits inside cap** — Actions minutes 65.3% of the published 3000-min allowance, on pace for 187.9% by month end (~5.7d headroom) — but GitHub has billed $0.00, which contradicts that; confirm the real allowance (docs/ops/

**What ran:**
- Growth: IG 1 (+0) · X 0 (+0) · FB 8 (+0) · 0 posts today · queue: 9 scheduled to post, 1 due now · site: pending #799
- Content + social PRs landed today: 11 · intake queue 19 open

Full evidence: journal comment below.
<!-- budget: 68 lines / 893 words -->
