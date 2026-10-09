# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-10-09 → 2026-10-22.**
Written by Tree's weekly run of 2026-10-09.

---

## 🟢 THE CHANGE THIS FORTNIGHT — the plan was over-subscribed, and now it isn't

**Last week's plan ([#5171](https://github.com/JW-Incorporated/swift2/pull/5171))
was closed unmerged.** Everything in it — a corrected calendar, the "X is never
text-only" fix, the whole week of 10-05 — never reached the drafter, which spent
the week reading the 09-28 calendar and its now-wrong instructions. That is the
first thing this file fixes.

The second is arithmetic. Planning this fortnight against the strategy as
written produced **19 demands for 13 open slots**: 3 news reserves + 3 timeline
beats + 7 thread slots + 2 Mood + a 4-post launch arc, against 7 beats a week.
The cause was §1(b) asking for **"2 slots per thread per month"** — a rule
written when an IG item and an X item each consumed their own slot. Since
2026-10-05 one beat a day is the real grammar and every beat is already an IG+X
pair, so that rule had silently doubled to *two pairs* — four posts to teach one
thread. Fixed in strategy PR
**[#5465](https://github.com/JW-Incorporated/swift2/pull/5465)**: one paired
beat per thread window, 6 a month, all six threads still taught every month.
The reservations now come to ~3.4 of 7 weekly beats and the rest of the strategy
fits. **Runway's September drop and Clue Web's 1-of-2 October were not a slow
drafter; they were a plan that never fit.**

---

## 📸 The photo library is no longer the constraint — at all

| | Last plan (09-28) | Now |
|---|---|---|
| Library entries | 30 | **207** |
| Never used | 20 | **193** |
| `concert-photo-sourcing` last run | **two consecutive failures** | **green** (10-09 14:55Z; last 3 of 4 green) |

**Every era has never-used stock.** Counts: 1989 35 · Midnights 34 · fan-photo
(no era) 33 · Red 14 · debut 12 · evermore 18 · Lover 11 · folklore 10 ·
Fearless 10 · reputation 10 · Speak Now 6. **No beat or era below is short of
photographs**, which is the first time this desk has been able to write that
sentence. Two notes that follow from it:

1. **This calendar assigns NO photos.** The 09-28 calendar carried a
   hand-picked day-by-day photo table; that is withdrawn (W8, 2026-09-30). A
   hand-assigned table cannot see drafts waiting in open PRs, which is how
   photos got repeated in the first place. `scripts/social/prepare-draft-inputs.mjs`
   hands each beat a never-used, Instagram-sized pick at 11:00Z. Where a beat is
   **themed** (`check-drafts.mjs` requires a themed campaign to carry `photoEra`
   and an era-matched photo) the era is named in the slot — the pick inside that
   era is the pre-compute's.
2. The founder's standing ask is a library in the **order of thousands**, not
   hundreds. 207 is real progress from 30 and the engine is green; it is still
   two orders of magnitude short, and the sourcing engine's health is reported
   in this desk's brief every week from now on.

---

## 🛑 Crisis stop — NOT active

No founder "stop posting" outstanding anywhere Tree can see. `SOCIAL_FREEZE` is
**`false`**, read this run from `social-poster.yml`'s own Freeze-check step
(`FREEZE: false`, run 10-09 20:15Z) — the repo-variables API still answers 403
to this runner's token, and reading it off a live poster run is the reliable
substitute. The ledger's inference-from-behaviour workaround is retired.

---

## How to read a slot

- **One beat a day, at `23:00Z`.** `MAX_POSTS_PER_RUN = 1` and
  `MAX_POSTS_PER_PLATFORM_PER_DAY = 1` (`scripts/social/lib/queue.mjs:61-62`).
  Strategy §2 now agrees; the 09-28 calendar's note about the contradiction is
  resolved.
- **Every beat is ONE pair: one Instagram item + one X item** sharing a
  story-unique `campaign` and `scheduledAt`, written platform-native, >20%
  divergent in copy. No single-platform exceptions (Joey, 2026-08-26: *"Always an
  IG copy. Always."*).
- **⚠️ X is NEVER text-only.** The 09-28 calendar said "X is text-only" and that
  instruction is dead — `check-drafts.mjs` fails an X item with no media
  (`strategy-params.json` `media.requireImageOnX`). **One beat, one pair, one
  image:** the IG and X halves of the same `campaign` carry the SAME photograph.
  That is the one sanctioned repeat. When no never-used photo fits a beat, the
  beat is **deferred** — never repeated, never dropped to text-only.
- **Draft a beat on its OWN day, and never park one more than 24h out.** For an
  approved item the 48h staleness clock runs from `approval.at`, not from
  `scheduledAt`. This killed the 10-03 Mood pair: drafted 10-01, ✅'d
  `2026-10-01T16:21Z`, scheduled `2026-10-03T23:00Z` — retired to
  `social/failed/` at `2026-10-03T16:21Z`, **6.6h before its own posting time,
  with no attempt ever made.** A catch-up subject takes today's or tomorrow's
  beat, never a date two days out.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label is a FAMILY.** Mint the story-unique value shown — a
  reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject below is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270; the
  checker hard-fails at 280.
- **📰 A NEWS RESERVE day is a slot, not a gap.** Three days below (**10-11**,
  **10-18**, **10-22**) are reserved for news first, each with a named fallback
  subject on the day. On a reserve day: check `events.uncovered[]` at 11:00Z,
  leave the slot for the same-day event run if an event is uncovered, otherwise
  draft the fallback as written. **The previous day's run never drafts a reserve
  day early.** News landing off-reserve may take the next unfilled beat inside
  48h, yielding **heartbeat first, then mood — and nothing else** (strategy
  §1(e2), third rung removed in #5465: a thread window now has one beat and it
  is the hero, so news never takes it). Never the weekly timeline minimum,
  never a thread beat, never a launch day 0/+2/+4. Cap: **≤2 news posts per
  rolling 7 days.**
- **Read `social/lessons.md` first.** L001 (photo reuse) is **retired as
  codified** this run — its check landed as `check-drafts.mjs:checkPhotoReuse`
  and the gate now enforces it deterministically, so it no longer needs to be a
  rule you remember. **L002 is active and new.**
- **Share-design pass** (strategy, 2026-09-01): every `heartbeat:` and `mood:`
  caption needs one genuine tag/share hook grounded in the actual content.
  Thread and launch posts are exempt. Never bolt on a fake one; say so in `why`.

---

## 🧪 EXPERIMENT 01 — hashtags on Instagram, continued (ask #4722)

**Why it continues rather than reads out.** The 09-28 calendar set a readout for
10-11. It cannot happen: the drafting gap of 10-04→10-08 means the experiment
has **one tagged post (10-09) and one control (10-02)** on the board. n=1 vs n=1
is not a result. Three more tagged slots and three more controls are assigned
below; **readout moves to the 10-26 monthly review.**

- **TAGGED:** 10-12, 10-16, 10-20
- **CONTROL (no tag block, nothing else different):** 10-10, 10-13, 10-19
- Launch, timeline and news-reserve slots stay out of the experiment so an arc
  or an event cannot contaminate an arm.

**On a TAGGED slot, copy this object onto BOTH halves of the pair** — do not
reword it, it is the experiment's identity, and `queue-schema.mjs` caps
`hypothesis` at 300 characters and `variant`/`metric` at 100:

```json
"experiment": {
  "hypothesis": "IG reach at 4 followers is nearly all non-follower surfacing, and we have never used the one lever for it: all 44 posted IG items carry zero hashtags and every per-post metric reads 0 likes, 0 comments. A mid-tail Swiftie tag block should earn this account its first non-zero engagement.",
  "variant": "IG caption ends with 8-12 mid-tail Swiftie hashtags (no mega-tags); the X half is unchanged.",
  "metric": "like_count + comments_count at 48h in social/metrics/posts/2026-10, tagged pairs vs controls."
}
```

---

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-10** (`monthNumber` = 2) |
| **October windows + angles** (`angle = ANGLES[(2 + threadIndex) % 5]`) | Decode 10-01→05 `interactive-challenge` · Clue Web 10-06→10 `behind-the-data` · **Runway 10-11→15 `quiz-poll`** · **Blank Spaces 10-16→20 `origin-story`** · **Taylor's Version 10-21→25 `single-best-item`** · End Game 10-26→30 `interactive-challenge` |
| **November windows + angles** (`monthNumber` = 3, computed this run) | Decode 11-01→05 `behind-the-data` · Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces 11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` · End Game 11-26→30 `behind-the-data` |
| **Thread cadence — CHANGED** | **ONE paired beat per thread window, 6 a month** (strategy §1(b) via [#5465](https://github.com/JW-Incorporated/swift2/pull/5465)). The old "2 slots" counted an IG item and an X item separately, which the 2026-10-05 one-beat grammar made into two pairs. One beat already *is* an IG hero plus a structurally different X. |
| Thread progress, October | Decode **1 of 1 ✅** (10-02 shipped). Clue Web **1 of 1 ✅** (10-09, approved and queued for 23:00Z). Runway **10-12** — its window was dropped entirely in September and must not be dropped twice. Blank Spaces lens **10-19**. Taylor's Version **10-21**. End Game's window (10-26→30) belongs to the next run. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts:34`) | `threads` · `mood` · `clownbot` · `community` · `merch`. `?mood=` is still not a thing and never will be written. |
| **Launch arc — `launch:community-engine`** | **Day 0 moves to 10-15** (third deferral; 10-05's day 0 was never drafted because no draft PR opened that day). Beats in this window: **announce 10-15**, **how-to 10-17**. **+4 and +8 fall to the next weekly run** — 10-19 and 10-20 are a thread beat and the weekly timeline minimum, neither of which an arc may displace (§1(a): an arc preempts heartbeat first and never cancels a thread window). **Gate: invariant 6 — day 0 does not draft until the drafter has opened www.longlivets.com and seen the Clownbot fan-theory chip (#3965), the Clue Web live-theory board (#3964) and the pin banner (#4525/#4520) render for real.** `event-status.mjs` reports `mode: normal`, i.e. **no theory is pinned right now** — if the banner is empty on the day, the announce leads on the chip and the board, not on the banner. |
| Launch backlog (behind Community Engine) | **NEW this week: #5386 — persona author bylines + a "meet the desk" page (#462).** User-visible, and the only genuine user-visible ship merged 10-05→10-09; everything else was ops, privacy-redline content passes (#5429), track dossiers (#440) or infra. It is **not** given an arc now: an arc is already in flight (§1(a)), and a post that tells fans who writes the site is a positioning call worth more than a queued slot's thought. Then: notifications + web push (#3568→#3583) → pinch-zoom photo viewer (#831) → photos + focal program (#762). |
| ❓ Android status | Still barred under invariant 6 and still not asked. Six runs, no answer; asking again in a channel with a 0% response rate is not a plan. |
| **Mood beat — `mood:result`, October** | **10-13 and 10-16.** Mood has **never shipped a post in this desk's existence** and for the third month running the cause is a bug, not a plan: 09-23's pair was ✅'d and died in unmerged #4544, 10-03's pair was ✅'d and was swept to `social/failed/` by the 48h approval clock before its own posting time. **Blocker removed this run:** `siteScreen.allowedCampaignPrefixes` was `launch:`-only, which made §1(d)'s `mood:result` format ("the real returned songs as slide 2") literally undraftable. Widened to `["launch:", "mood:"]` in [#5465](https://github.com/JW-Incorporated/swift2/pull/5465); `requirePhotoGridTile` stays true, so the grid tile is still a Taylor photo. |
| **Blank Spaces relationship timeline — permanent weekly minimum** | Week of 10-05: **10-10**. Week of 10-12: **10-14**. Week of 10-19: **10-20**. Chapters shipped: early solo years ✅ (09-17) → Harry Styles ✅ (09-21) → Joe Jonas 2008 ✅ (10-01). Next three below. ⚠️ **#5429's privacy-redline pass rewrote personal-life content across the seeds this week** — verify every chapter against the CURRENT Vault before writing, and if a chapter's content was redlined, take the next chapter and say which in `why`. Confirmed public relationship history only; no rumor-stage claim, ever. |
| Openers — last 14 days | **4 distinct patterns across 4 posts** (09-25→10-09, counted from `social/posted/` bodies). Zero repeats — but the target is **≥12 distinct in 14 days** and we are at 4, because only 4 posts shipped. This is a volume miss wearing a variety miss's clothes. **Burned, do not reuse verbatim or near:** *"the blank spaces timeline just reached …"* · *"2008. she was 18, and the …"* · *"the decode thread has me spiraling"* · *"quick challenge for the clowns 🤡"* · *"the clue web has one theory …"* (queued 10-09), plus the previous fortnight's burns: *"i keep sending people to …"*, *"consider this your permission …"*, *"this is taylor in 2007"*, *"every love story has a …"*, *"okay the moment that still …"*, *"you can sing every …"*, *"i still think about …"*, *"3 videos. zero words."*, bare `<month> <n>, <year>:` date-stamps. **NB: the scorecard still does not compute this number** ([#4297](https://github.com/JW-Incorporated/swift2/issues/4297), open) — counted by hand. |
| Media mix, last 14 days | **4 photo / 4 media-carrying = 100%**, target ≥70% ✅. IG grid: 2 of 2 IG posts carried a real Taylor photo ✅. Zero era tiles, zero undeclared media. The gate is holding. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel. **But the scorecard counts 16 approved Reddit replies this week** through the awareness lane's Discord queue — a lane that attaches a Long Live site card to the comment. Either the counter watches the wrong channel (and we are at 16/20) or 16 card-carrying replies have already gone out *ahead* of growth-plan §7's 20-contribution-plus-modmail etiquette gate. Tree cannot tell which from its own artifacts; `scripts/community/**` is outside this desk's rights. **Filed to Marjorie this run.** Until it is reconciled, **every Reddit founder task stays a zero-link contribution.** |
| IG Insights | **Never supplied**, four months running. Asked again this week — it is the standing blocker on every "double down / drop" call in the monthly review. |
| Founder tasks | **#5169, #4602, #4491, #4294, #3990 — five open, zero ticked.** Six consecutive weeks of zero completions. The same founder answered 16 Reddit prompts and 2 draft approvals in Discord in the same window at a median 3h 54m. **The issue channel is not read as a work queue; Discord is.** This week's issue is filed anyway (charter invariant 15/16 requires it) and cut to two tasks, ~6 minutes total. |
| **📰 News reserve** | **10-11, 10-18, 10-22** — one per calendar week touched by this window, each with a named fallback. A calendar that assigns all seven days of a week is a planning bug (strategy §2). |
| 🧪 Experiment 01 — Instagram hashtags | **Continues; readout moves to 10-26.** Tagged: 10-12, 10-16, 10-20. Control: 10-10, 10-13, 10-19. Only n=1 vs n=1 exists so far because of the 10-04→10-08 drafting gap. |
| Social event mode | **`normal`** — `reservedBeats: 0`, so no beat below is reserved for event coverage and the 14 days are planned as ordinary rotation. Read this run from `social/state/event-status.json`, the committed output of `social-event-status.yml` (green at 10-09 16:18Z, and it opens a PR on any transition — there is none open). `scripts/social/event-status.mjs` **cannot be run inside the weekly-plan job**: it imports `@swift2/core` and this job has no workspace install step, unlike the daily draft's `prepare` job. Filed to Marjorie as an error this run. |
| Fast lane (T6), last 7 days | **0 drafted · 1 declined · 0 expired**, scoped by `createdAt`. The decline was correct and is not a drafting gap: a third-party Jimmy Kimmel clip centred on Paul McCartney and Taylor's wedding — personal-life content with no Long Live surface to anchor it. **10 intents are open in `social/inbox/`** and none was drafted this week, which is a consequence of the drafting gap, not of the rubric. |

---

## 2026-10-09 (Fri) — ✅ COVERED BY QUEUE · Tree run day

**Do not plan or draft anything for this date.** `social/queue/` already holds
the approved pair `2026-10-09-easter-eggs-karma-unconfirmed-{ig,x}.json`,
campaign `thread:easter-eggs:behind-the-data:2026-10-second`, ✅'d
`2026-10-09T03:11Z`, scheduled `2026-10-09T23:00:00Z`. Drafting over it would
put a second campaign on the same beat and the poster ships one item per
platform per day.

This is **Clue Web's October beat, 1 of 1** under the new thread cadence.

---

## 2026-10-10 (Sat) — Blank Spaces timeline, week of 10-05 (weekly minimum)

- **Campaign:** `timeline:love-story:lautner-2009:2026-10-10`
- **Subject:** the next chronological Blank Spaces chapter after Joe Jonas 2008 —
  **the Taylor Lautner chapter (2009)**. Confirmed public relationship history
  only. The interesting, sourceable angle is the *chronology*: what the timeline
  actually records about 2009 and how it sits between the 2008 chapter that
  shipped on 10-01 and what came next. Source every person, date and quote
  against the Vault before it appears in copy; **#5429 redlined personal-life
  content across the seeds this week, so check the chapter still exists as
  written** and take the next chapter if not.
- **Deep link:** `/?lens=love-story` + standard UTMs.
- **Media:** `photo`, era **Fearless** (2009). The pre-compute assigns the pick.
- **Hook direction:** the chronology hook — not "did you know", not a list. Open
  on what the *timeline* shows, in a line that could not sit above any other
  post. Share-design pass applies.
- **Experiment 01:** CONTROL — no hashtag block.
- **Why:** §1(c)'s permanent weekly minimum, and nothing timeline-shaped shipped
  in the week of 10-05. Week A has only two plannable days left, and the minimum
  outranks everything else that wanted one.

---

## 2026-10-11 (Sun) — 📰 NEWS RESERVE (week of 10-05) · fallback below

- **If `events.uncovered[]` is non-empty at 11:00Z:** leave this beat for the
  same-day event run (`routine-tree-event-draft.yml`) and draft nothing here.
  `campaign: news:<event-slug>`. Confirmed fact only, from the intake record;
  nothing on the Voice blocklist. Six-dimension rubric, `timely` ≥4 on its own.
- **Otherwise draft the fallback:** `heartbeat:on-this-day:2026-10-11`. Search
  the Vault for a moment dated **October 11**; if there is no genuinely dated
  match, drop to an era deep cut on **Speak Now** and rename the campaign
  `heartbeat:era-deep-cut:speak-now-2026-10-11`. Do not stretch a near-date into
  an on-this-day claim.
- **Deep link:** `/?item=<momentId>` for the on-this-day, `/?era=speak-now` for
  the deep-cut fallback.
- **Media:** `photo`. Era **Speak Now** if the deep-cut fallback is used;
  otherwise the era the moment belongs to.
- **Hook direction:** the date hook is burned as a bare `<month> <n>, <year>:`
  stamp — use the artifact or the contradiction instead.
- **Why:** strategy §1(e2)'s weekly news reserve. 27 real-world events landed in
  `intake:` across two weeks earlier this autumn and not one got a post, because
  every day was assigned. This is the slot that fixes that.

---

## 2026-10-12 (Mon) — The Runway, October thread beat (window 10-11→15)

- **Campaign:** `thread:fashion:quiz-poll:2026-10`
- **Angle:** `quiz-poll` — a question whose answer lives *inside* the Runway
  thread. Not a trivia quiz about Taylor; a question a fan answers by opening the
  lens and looking.
- **Subject direction:** pick one look from the Runway thread and build the
  question around it. **#5384, #5353 and #5356 landed this week** — five looks
  gained real sources and the Red and reputation looks were corrected to match
  their photographs — so prefer a freshly-sourced look over an old stub, and say
  which in `why`.
- **Deep link:** `/?lens=fashion` + standard UTMs.
- **Media:** `photo`. Era: **reputation**. A `/social/library/` screenshot of the
  Runway lens in real, visually rich use may ride slide 2 on Instagram behind the
  photo tile (strategy §2's "cool feature only" rule — a populated look, never an
  empty state).
- **X half:** structurally different — the question stated cold, its own post, not
  the IG caption truncated. Same photograph as the IG half.
- **Experiment 01:** **TAGGED** — 8-12 mid-tail Swiftie hashtags on the IG caption
  only, copying the `experiment` object above verbatim onto both halves.
- **Why:** Runway's whole window was dropped in September (0 of 2, window closed)
  and this is its October beat. Under the new one-beat cadence it is the thread's
  only shot this month, so it is not a news fallback and nothing may displace it.

---

## 2026-10-13 (Tue) — Mood, October slot 1 of 2 · the one that has to land

- **Campaign:** `mood:result:cardigan-weather:2026-10`
- **Format:** `mood:result` — "what it gave me", the strongest Mood format,
  because it proves the thing works.
- **Chip:** **`cardigan weather`**, quoted **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts`. Never reword an approved chip.
- **Binding:** **run the chip in the real feature first** and use the songs it
  actually returns. Never promise "every song". **evermore, Midnights, TTPD and
  TLOAS are not scored** — if the real result leans on an unscored era, pick
  another chip from the approved list and say which in `why`.
- **Link:** **"tap Mood on longlivets.com"** — Mood is the one campaign with no
  deep link. Never write a `?mood=` URL; it does not exist.
- **Media:** `photo` as the Instagram grid tile, era matched to the era the
  returned songs actually come from — **so the era follows the real result, not
  this line**. Slide 2 is a `site-screen` of the real returned songs. That became
  draftable this run (`siteScreen.allowedCampaignPrefixes` widened to include
  `mood:` in #5465); `requirePhotoGridTile` still requires the photo tile.
- **X half:** the chip and the single most surprising thing it returned, as its
  own post. Same photograph.
- **Experiment 01:** CONTROL — no hashtag block.
- **Why:** three months, three founder approvals, zero Mood posts shipped. Both
  previous attempts died in the pipeline, not in review. This beat is drafted on
  its own day and parked for hours, not days — see the 24h parking rule above.

---

## 2026-10-14 (Wed) — Blank Spaces timeline, week of 10-12 (weekly minimum)

- **Campaign:** `timeline:love-story:gyllenhaal-2010:2026-10-14`
- **Subject:** the **Jake Gyllenhaal chapter (2010-11)** — the Red-era chapter,
  and the most publicly documented stretch of the whole timeline. Confirmed
  public relationship history only. **The John Mayer chapter is deliberately
  skipped in this sequence**: it sits closest to #5429's privacy redlines and is
  more about a song's subject than a documented chapter; revisit it only if the
  Vault carries it cleanly.
- **Deep link:** `/?lens=love-story` + standard UTMs.
- **Media:** `photo`, era **Red**.
- **Hook direction:** this chapter is the one every fan thinks they already know,
  so the hook has to be the thing they don't — the contradiction shape, grounded
  in what the timeline actually records. No scarf jokes; they are the formula
  here.
- **Experiment 01:** not in the experiment (timeline slots stay clean).
- **Why:** §1(c)'s weekly minimum for the week of 10-12.

---

## 2026-10-15 (Thu) — 🚀 Community Engine arc, day 0 (announce)

- **Campaign:** `launch:community-engine:announce`
- **Subject:** the one thing a fan can now do — see and follow **live fan
  theories** on Long Live: the Clownbot fan-theory chip (#3965), the Clue Web
  live-theory board (#3964), and theories surfacing in the site's own pin banner
  (#4525, #4520). One line on what it does, in the "here's the thing you can now
  do" shape — never "we shipped".
- **⚠️ GATE (invariant 6):** do not draft this until you have opened
  **www.longlivets.com** and seen those surfaces render for real. If they do not,
  **leave the beat empty**, say so prominently in the PR body, and file a
  `desk-coordination` issue naming the date. An arc for unshipped work is barred.
- **Note:** `event-status.mjs` reports `mode: normal`, i.e. **nothing is pinned
  right now**. If the banner is empty on the day, lead on the chip and the board
  — the surfaces a fan can use regardless — not on the banner.
- **Deep link:** the deployed surface itself (`/?mode=community` or
  `/?lens=easter-eggs` for the theory board, whichever the announce actually
  shows) + standard UTMs. Never the bare homepage.
- **Media:** Instagram = `photo` tile, era **Lover**, with the feature mid-use as
  slide 2 (`site-screen`, a real populated theory board — not an empty state).
  **X carries the SAME photograph**; X `site-screen` is permanently prohibited.
- **Experiment 01:** not in the experiment (launch slots stay clean).
- **Why:** third deferral — day 0 was 10-05 and no draft PR opened that day. The
  surfaces have been live for weeks and this is the account's only "we built a
  thing" story in flight.

---

## 2026-10-16 (Fri) — Mood, October slot 2 of 2

- **Campaign:** `mood:result:crying-in-the-car:2026-10`
- **Format:** `mood:result` again, different chip, structurally different post —
  not a reskin of 10-13.
- **Chip:** **`crying in the car, cinematically`**, verbatim.
- **Binding:** same as 10-13 — run it for real, use the actual returned songs,
  swap the chip if the result leans on an unscored era (evermore, Midnights,
  TTPD, TLOAS).
- **Link:** "tap Mood on longlivets.com".
- **Media:** `photo` tile, era matched to the real returned songs; `site-screen`
  of the real result on slide 2.
- **Experiment 01:** **TAGGED**.
- **Why:** §1(d) gives Mood 2-3 slots in one week, once a month; 10-13 and 10-16
  are both inside the week of 10-12. Two shots at the format that has never
  shipped, in the same week, so one pipeline failure does not cost the month
  again.

---

## 2026-10-17 (Sat) — 🚀 Community Engine arc, +2 (how-to)

- **Campaign:** `launch:community-engine:howto`
- **Subject:** literally where to tap. Assume the reader never found it: open the
  site, this is the chip / this is the board, this is what a theory looks like
  when it is live. Instagram-led by design (§1(a)'s +2 is an IG post) but it
  still ships as a pair — the X half is the same idea written as its own post.
- **Deep link:** the same surface as day 0 + standard UTMs.
- **Media:** `photo` tile, era **1989**, with the tap-path screens as later
  carousel slides (`site-screen`, populated).
- **Experiment 01:** not in the experiment.
- **Why:** §1(a)'s arc shape, day 0 + 2. **+4 and +8 fall to the next weekly
  run**: 10-19 is Blank Spaces' only thread beat this month and 10-20 is the
  weekly timeline minimum, and an arc may preempt heartbeat but never a thread
  window or the timeline minimum.

---

## 2026-10-18 (Sun) — 📰 NEWS RESERVE (week of 10-12) · fallback below

- **If `events.uncovered[]` is non-empty at 11:00Z:** leave the beat for the
  event run. `campaign: news:<event-slug>`.
- **Otherwise draft the fallback:**
  `heartbeat:era-deep-cut:speak-now-2026-10-18`. Subject: an **Era Secrets /
  month item for Speak Now** — the era with the thinnest recent coverage in
  `social/posted/` and 6 never-used photographs waiting.
- **Deep link:** `/?era=speak-now` + standard UTMs.
- **Media:** `photo`, era **Speak Now**.
- **Hook direction:** the artifact or the real-quote shape. Share-design pass
  applies — one genuine tag/share hook grounded in the actual secret.
- **Why:** the weekly news reserve for the week of 10-12, with a real assigned
  subject so a quiet week still posts.

---

## 2026-10-19 (Mon) — Blank Spaces LENS, October thread beat (window 10-16→20) · Tree run day

- **Campaign:** `thread:love-story:origin-story:2026-10`
- **Angle:** `origin-story` — what the Blank Spaces thread *is*, and the one
  moment that made it worth building. **The thread is the subject here, not a
  relationship.** This is the product post; 10-20 is a chapter narrative. Keep
  them obviously different in subject, era and hook shape — they are adjacent
  because the lens window closes 10-20.
- **Deep link:** `/?lens=love-story` + standard UTMs.
- **Media:** `photo`, era **Red** — the era the thread's best-documented entries
  cluster in. A populated `/social/library/` screenshot of the lens may ride
  slide 2 on Instagram.
- **Experiment 01:** CONTROL.
- **Why:** Blank Spaces' one thread beat for October. Distinct from §1(c)'s
  weekly timeline series: that teaches a chapter, this teaches the thread.

---

## 2026-10-20 (Tue) — Blank Spaces timeline, week of 10-19 (weekly minimum)

- **Campaign:** `timeline:love-story:calvin-harris-2015:2026-10-20`
- **Subject:** the **Calvin Harris chapter (2015-16)** — confirmed public
  relationship history, a public musician, and musically substantive. Source
  every claim against the Vault; respect #5429's redlines and take the next
  chapter if this one was rewritten.
- **Deep link:** `/?lens=love-story` + standard UTMs.
- **Media:** `photo`, era **1989**.
- **Hook direction:** the number or the real-quote shape. Must not read as a
  continuation of 10-19 — different era, different shape, different subject.
- **Experiment 01:** **TAGGED**.
- **Why:** §1(c)'s weekly minimum for the week of 10-19.

---

## 2026-10-21 (Wed) — Taylor's Version, October thread beat (window 10-21→25)

- **Campaign:** `thread:taylors-version:single-best-item:2026-10`
- **Angle:** `single-best-item` — ONE item from the Taylor's Version thread, told
  whole. The thread is the byline, not the subject.
- **Subject direction:** open `/?lens=taylors-version` and take the single
  strongest item in it — a vault track's story, a re-recording announcement, an
  ownership milestone. Tell that one thing properly rather than summarising the
  thread; the thread got its origin-story treatment in September.
- **Deep link:** `/?lens=taylors-version` + standard UTMs.
- **Media:** `photo`, era **Fearless** (or the era of whichever item is chosen —
  match the photo to the story, and say which in `why`).
- **Experiment 01:** not in the experiment.
- **Why:** Taylor's Version' October beat; its window opens 10-21 and this is the
  thread's one shot this month.

---

## 2026-10-22 (Thu) — 📰 NEWS RESERVE (week of 10-19) · fallback below

- **If `events.uncovered[]` is non-empty at 11:00Z:** leave the beat for the
  event run. `campaign: news:<event-slug>`.
- **Otherwise draft the fallback:** `heartbeat:track-fact:2026-10-22`. Subject: a
  **track dossier** fact. **#440's dossier batches 2-8 landed this week — 153 of
  244 tracks now have one**, so prefer a track whose dossier is newly filled and
  has never been posted about, and say which in `why`.
- **Deep link:** `/?item=<momentId>` or `/?era=<eraId>` + standard UTMs.
- **Media:** `photo`, era **debut**.
- **Hook direction:** the contradiction or the honest-question shape. Share-design
  pass applies.
- **Why:** the weekly news reserve for the week of 10-19.

---

## What the queue already covers

| Date | Campaign | State |
|---|---|---|
| 2026-10-09 23:00Z | `thread:easter-eggs:behind-the-data:2026-10-second` | **Approved ✅ 10-09T03:11Z, in `social/queue/`, IG + X pair.** Do not plan or draft over it. |

Nothing else is queued. `social/queue/` holds exactly these two files plus
`.gitkeep`.

---

## Founder tasks scheduled in this window

Two tasks, ~6 minutes total, filed as this week's `founder-task` issue:

1. **Paste the IG Insights top 3** (2 min) — the standing blocker. Four months
   asked, never supplied; without it every "double down / drop" call in the
   monthly review is a guess.
2. **One zero-link Reddit contribution** (4 min) — genuine fandom knowledge, no
   link, no mention of the site, per growth-plan §7. The non-promo counter stays
   at 0/20 through this channel until the awareness-lane question below is
   reconciled.

**Honest note for whoever reads this file next:** five founder-task issues are
open with zero ticked, six weeks running, while the same founder answers Discord
within hours. The charter requires the issue (invariant 15/16) so it is filed;
the real ask-delivery problem is named in this week's brief rather than buried
here.
