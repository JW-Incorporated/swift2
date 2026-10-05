# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-10-05 → 2026-10-18.**
Written by Tree's run of Monday 2026-10-05.

---

## ⛔ THE PROBLEM THIS FORTNIGHT — the drafter has produced nothing since 10-01

**Four daily-draft runs have finished green and opened no PR.** The last
`tree/draft/` PR of any kind is **#4728, opened 2026-10-01**. The runs on 10-02,
10-03, 10-04 and (as of 19:00Z) 10-05 all report `success` with no draft,
`social/queue/` is empty, and no draft PR is open. Everything that shipped in the
last seven days — the 10-01 timeline pair and the 10-03 Decode pair — was drafted
by the **10-01** run, which wrote three pairs at once.

Writing ahead is also what killed the third thing it wrote. **The 10-03 Mood pair
was founder-✅'d at `2026-10-01T16:21Z` and scheduled for `2026-10-03T23:00Z`.**
For an approved item the 48h staleness clock runs from `approval.at`, not from
`scheduledAt` (`social/README.md`'s 48h staleness check, `lib/queue.mjs`'s
`isStaleApproved`) — so at 54.6h it was already 6.6h stale when its own slot
arrived, and both halves went to `social/failed/` **without one posting
attempt**. An approved post, lost to arithmetic. Mood has now never shipped in
this desk's existence, across four attempts.

**Both halves of that are filed:** the sweep mechanism as
[#4296](https://github.com/JW-Incorporated/swift2/issues/4296) (open, Tree→
Marjorie) and the wider "exit path loses approved content" as
[#4475](https://github.com/JW-Incorporated/swift2/issues/4475) (open since
09-20). This week's ask to Marjorie is the silent drafter.

**Planning consequence, and it is binding on every slot below:**

> **One beat, drafted by its OWN day's run. Never park a beat more than 24h
> ahead.** The 23:00Z slot sits ~12h after its 11:00Z run — safely inside 48h.
> A catch-up or re-draft subject takes **today's or tomorrow's** beat, never a
> date two days out. Now also written into strategy §2 (2026-10-05).

---

## How to read a slot

- **One beat a day, at `23:00Z`.** `MAX_POSTS_PER_RUN = 1` and
  `MAX_POSTS_PER_PLATFORM_PER_DAY = 1` (`scripts/social/lib/queue.mjs:61-62`).
  Strategy §2 now says the same thing (changed 2026-10-05) — the old two-beat
  grammar promised 28 posts a week against a ceiling of 14.
- **Every beat is ONE pair on ONE image: one Instagram item + one X item**
  sharing a story-unique `campaign`, the same `scheduledAt` and the same
  photograph, written platform-native, >20% divergent in copy. **X is never
  text-only** — `check-drafts.mjs` fails an X item with no media
  (`media.requireImageOnX`), and the IG/X halves of one campaign sharing their
  tile is L001's one sanctioned repeat. Every "X: text-only" line in older
  versions of this file is dead. No single-platform exceptions (Joey,
  2026-08-26: *"Always an IG copy. Always."*).
- **Do not hand-pick the photo from this file, and do not expect it to name
  one.** `scripts/social/prepare-draft-inputs.mjs` hands each beat a never-used,
  Instagram-sized pick from the full ledger — posted + queued + every open draft
  PR — which a table written here cannot see. Take the pick from
  `.scratch/tree-inputs.json`, name it in the item's `why`, and if no pick is
  left for the beat, **defer the beat and say so.** Never repeat a tile, never
  take an off-era photo, never drop X to text-only to dodge it.
- **The three criteria, every post** (strategy §2, from the owner's 2026-10-02
  note on the 10-01 Blank Spaces post): a picture worth stopping on
  (`mediaEarnsItsPlace` ≥4 on its own, a 3 is a rewrite), text specific enough
  that it could not sit above another post, and a deep link into real site
  content. Mood is the only lane with no deep link.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label is a FAMILY.** Mint the story-unique value shown — a
  reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject below is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270; the
  checker hard-fails at 280.
- **Share-design pass** (strategy, 2026-09-01): every `heartbeat:` and `mood:`
  caption needs one genuine tag/share hook grounded in the actual content. Thread
  and launch posts are exempt. Never bolt on a fake one; say so in `why`.
- **📰 A NEWS RESERVE day is a slot, not a gap.** Two days below (**10-11**,
  **10-18**) are reserved for news first, each with a named fallback subject on
  the day. On a reserve day: check `events.uncovered[]` at 11:00Z, leave the slot
  for the same-day event run if an event is uncovered, otherwise draft the
  fallback. **The previous day's run never drafts a reserve day early.** News
  landing on a non-reserve day may take the next unfilled beat inside 48h,
  yielding in order heartbeat → mood → a thread window's *second* slot; it never
  takes the weekly timeline minimum, a thread hero, or a launch day 0/+2/+4
  (strategy §1(e2)). Cap: **≤2 news posts per rolling 7 days.**
- **Read `social/lessons.md` first.** L001 is now **retired as codified** — the
  rule did not go away, it became `check-drafts.mjs`'s `checkPhotoReuse` and
  stops a repeat at merge time instead of asking you to remember it.

---

## 🧪 EXPERIMENT 01 — hashtags on Instagram, extended (ask #4722)

**Status: one arm, no control, and the readout moves to 2026-10-19.** Of the four
slots the 09-28 calendar assigned, only the 10-02 tagged arm ever shipped (as the
10-03 Decode pair) — the 10-04 control, the 10-06 control and the 10-09 tagged
slot were all lost to the silent drafter above. n=1 is not a result.

**What the one tagged post returned:** `social/metrics/posts/2026-10/
18113627369011618.json` — `like_count: 0`, `comments_count: 0`, `reach: 0` at
48h+. Honest reading, pre-registered last week: *a 0-vs-0 is not "hashtags don't
work."* Note `reach` reads 0 on **every** October post including the untagged
timeline pair, so the metric may not be able to discriminate anything at this
follower count — which is itself the finding that sends the next experiment to
the click attribution in
[#4719](https://github.com/JW-Incorporated/swift2/issues/4719).

**Extended arms, counterbalanced inside the `thread:` family** so hero-versus-
second position cannot explain the result:

| Date | Beat | Arm |
|---|---|---|
| 10-07 | Clue Web hero | **TAGGED** |
| 10-10 | Clue Web, slot 2 | control |
| 10-15 | Runway hero | control |
| 10-17 | Runway, slot 2 | **TAGGED** |

**On a TAGGED slot, copy this object onto BOTH halves of the pair** — do not
reword it, it is the experiment's identity, and
`scripts/social/lib/queue-schema.mjs` caps `hypothesis` at 300 characters and
`variant`/`metric` at 100:

```json
"experiment": {
  "hypothesis": "IG reach at 4 followers is nearly all non-follower surfacing, and we have never used the one lever for it: all 44 posted IG items carry zero hashtags and every per-post metric reads 0 likes, 0 comments. A mid-tail Swiftie tag block should earn this account its first non-zero engagement.",
  "variant": "IG caption ends with 8-12 mid-tail Swiftie hashtags (no mega-tags); the X half is unchanged.",
  "metric": "like_count + comments_count at 48h in social/metrics/posts/2026-10, tagged pairs vs controls."
}
```

**On a control slot: no hashtags and no `experiment` object.** A control is an
ordinary post; noting "Experiment 01 control" in `why` is all it needs.

**Choosing the tags — 8-12 of them, as the last line of the Instagram caption:**

1. **Mid-tail, never mega-tags.** Not `#taylorswift`, `#swifties`, `#swiftie`
   or a bare `#erastour`: a tag with tens of millions of posts buries a
   4-follower account within seconds. Aim at tags plausibly in the
   thousands-to-low-millions.
2. **Three kinds, roughly even:** the era or album, the actual subject of the
   post, and the fan-practice tag a Swiftie would really search.
3. **Never a tag implying official status** (`#taylornation`,
   `#taylorswiftofficial`) and never one naming another real person, a
   relationship, or anything on the #36 blocklist.
4. **The X half is unchanged.** No tags there — they cost weighted characters
   and buy us nothing.
5. **Record the exact tag list in `why`** and cite `ask #4722`.

---

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-10** (`monthNumber` = 2) for the whole window |
| **October windows + angles** (`angle = ANGLES[(2 + threadIndex) % 5]`, as published 09-28) | Decode 10-01→05 `interactive-challenge` · **Clue Web 10-06→10 `behind-the-data`** · **Runway `quiz-poll`, window delayed to 10-13→17** · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| Thread progress, October | **Decode 1 of 2** — the hero shipped (10-03); its second slot was 10-05's and **10-05 is lost, so the slot is dropped, not slid.** Stretching a closed window to chase it would cost the launch arc a third deferral; that trade is not worth one post. **Clue Web 2 of 2 planned** (10-07 hero, 10-10 second). **Runway 2 of 2 planned** (10-15 hero, 10-17 second) — its window is delayed two days by the Community Engine arc, which §1(a) expressly permits ("may delay a thread window by up to 2 days; it never cancels one"). **Runway was dropped entirely in September; it does not drop twice.** |
| Thread windows that belong to the NEXT calendar | Blank Spaces `origin-story` (10-16→20) and Taylor's Version `single-best-item` (10-21→25). The 10-18 beat here is a news reserve, so Blank Spaces' thread slots are the **first reservation of the calendar written 2026-10-12.** |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts:34`) | `threads` · `mood` · `clownbot` · `community` · `merch`. `?mood=` is still not a thing — never write it. |
| **Launch arc — `launch:community-engine`, day 0 is 10-06** | The Clownbot fan-theory chip (#3965), the Clue Web live-theory board (#3964) and **#4525**, which wires big fan theories into the site's pin banner — a fan can see a live theory on the front page. Beats: **announce 10-06 · how-to 10-08 · example 10-12 · callback 10-14.** The shape is 0/+2/+6/+8 rather than the table's 0/+2/+4/+8: 10-10 holds the window-closing Clue Web slot and 10-11 is the news reserve, and an arc never takes a reserve or cancels a thread window. **Gate: invariant 6 — day 0 does not draft until the drafter has opened www.longlivets.com and seen the theory surfaces render for real.** Twice deferred already (09-28 → 10-05 → 10-06); a third deferral means it is not a launch, it is a secret. |
| Launch backlog (behind Community Engine) | notifications + web push (#3568→#3583) → pinch-zoom photo viewer (#831) → photos + focal program (#762). |
| New user-visible ships, 09-28→10-05 | ~80 PRs merged, and **not one is a new user-visible web surface a fan could notice unprompted.** The week was the One UI / Expo app push (accessibility passes, offline art caching, parity fixes, security hardening, mobile watchdog work). **The mobile app is unannounced and stays unannounced** — invariant 6, #1815 is the standing example. So no new arc: the Community Engine arc, already in flight on paper, takes the slots. |
| Mood beat | **October = `mood:era-match`, 0 of 2.** The 10-03 pair was **founder-approved and died in the 48h sweep** (see the incident above), so this is attempt four. **Slot 1 = 10-13**, a clean solo day drafted by its own run; slot 2 = the 10-18 reserve fallback. Quote a starter chip **verbatim** from `apps/web/lib/longlive/mood-starters.ts` and give the **real** songs it returned. Never promise evermore / Midnights / TTPD / TLOAS songs — not scored yet. |
| **Blank Spaces relationship timeline — permanent weekly minimum** | Week of 10-05: **10-09**. Week of 10-12: **10-16**. Chapter sequence: early solo years ✅ (09-17) → Harry Styles ✅ (09-21) → **Joe Jonas 2008 ✅ (shipped 10-01)** → next confirmed chapter, mint its slug and record it in `why`. Confirmed, publicly documented material only; no rumor-stage claim, ever. |
| Openers — last 14 days | **6 distinct patterns across 6 posts** (the denominator is the story, not the ratio). **Burned, do not reuse verbatim or near:** *"okay the moment that still undoes me"* · *"you can sing every 'taylor's version' by …"* · *"the blank spaces timeline just reached the …"* · *"2008. she was 18, and the breakup …"* · *"the decode thread has me spiraling again"* · *"quick challenge for the clowns 🤡 …"* · plus still-burned from the fortnight before: *"i keep sending people to …"*, *"consider this your permission …"*, *"this is taylor in 2007"*, *"every love story has a …"*, *"ever lose an hour …"*, *"pick one, and you're not …"*, *"five weeks. that's the whole …"*, *"i still think about …"*, *"you know the/when …"*, *"an honest question" / "genuine question"*, bare `<month> <n>, <year>:` date-stamps. |
| Media mix, last 14 days | **6 photo / 6 media-carrying = 100%**, target ≥70% ✅. Zero era tiles, zero undeclared media, zero site-screens. The gate is holding. |
| **Photo inventory — not the constraint any more** | `social/photo-library.json` holds **54** valid non-variant entries; **13 ids have ever been used**; the ledger (`lib/photo-ledger.mjs`, posted + failed + queue) leaves **72 eligible never-used picks**, with **0** blocked by Instagram's aspect window. Era coverage of never-used picks: 1989 **4** · speak-now **6** · red **6** · reputation **6** · evermore **6** · folklore **5** · fearless **5** · debut **3** · no-era-tag fan photos **31**. **⚠️ `lover` has ZERO never-used entries left** — both its library photos have shipped. A beat that needs a Lover photo must be deferred or re-anchored, and growing that era is this week's one founder task. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel — while **19 Reddit replies** completed this week through the Discord approval queue (scorecard `redditRepliesDone`, median answer 2h 55m). The counter tracks a channel nobody uses; the work is happening in the one they do. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| Founder tasks | **#4602, #4491, #4294, #3990 all open, 0 ticked — six consecutive weeks, zero completions.** The same founder answered 11 post verdicts and 19 Reddit prompts in Discord in the same period (median 2h 4m). This week files **one** task, the smallest one yet; the brief in `#longlive-tree` is where it is actually asked. |
| Crisis stop | **Not active.** No founder "stop posting" anywhere Tree can see (PR comments, issues, brief comments). *`gh variable list` returns nothing to this runner's token, so `SOCIAL_FREEZE` could not be read directly; posting and approvals continued through 10-03.* |
| 📰 News reserve | **10-11** and **10-18**, each with a named fallback (strategy §2: ≥1 reserve day per calendar week; a calendar that assigns all seven days is a planning bug). |
| Social event mode | **`normal`** — `reservedBeats: 0`, no countdown or big theory live, so no beat below is reserved for event coverage. *`scripts/social/event-status.mjs` cannot execute in this job (its `@swift2/core` import fails to resolve under a bare `node` run even after `npm ci`, the same reason the daily run's `prepare` job runs it instead); read from `social/state/event-status.json`, which `social-event-status.yml` writes from that exact script and which was refreshed today.* |

---

## 2026-10-05 (Mon) — ⚫ LOST · Tree run day

No daily-draft PR exists for today, the 11:00Z run has not fired by 19:00Z, and a
23:00Z slot cannot now be drafted, approved and posted in time. **Do not backfill
it.** The Decode second slot that lived here is dropped with the day.

## 2026-10-06 (Tue) — 🚀 Community Engine arc, day 0 (announce)

- **`23:00Z` · `launch:community-engine`** — mint
  `launch:community-engine:announce`. Link `/?mode=community` with standard UTM
  parameters.
  **Gate first (invariant 6):** open www.longlivets.com and confirm the live
  theory surfaces actually render — the Clownbot fan-theory chip, the Clue Web
  theory board, and a theory in the front-page pin banner. **If any of them does
  not render for real, do not announce it**: draft nothing for the arc, say
  exactly what you saw in the PR body, and the beat falls back to the 10-11
  reserve's heartbeat subject.
  **The job:** one line on what a fan can now *do* — not "we shipped" — "a fan
  theory people are actually arguing about now shows up on the front page, and
  you can see where it came from."
  Media: the pick from `.scratch/tree-inputs.json` as the Instagram tile and the
  X image; **a screenshot of the theory surface mid-use may ride as IG slide 2**,
  and only if it shows the surface *in use* with a real theory in it, never a
  landing page or an empty state (Joey, 2026-09-01). If it doesn't, go photo-only
  and say so in `why`.
  Hook: **direct address**.

## 2026-10-07 (Wed) — The Clue Web hero, slot 1 of 2 (window 10-06→10)

🧪 **Experiment 01: TAGGED arm.** The Instagram caption ends with the 8-12
mid-tail hashtag block and both halves carry the `experiment` object verbatim.

- **`23:00Z` · `thread:easter-eggs:behind-the-data`** — mint
  `thread:easter-eggs:behind-the-data:2026-10-hero`. Link `/?lens=easter-eggs`.
  Angle `behind-the-data`: the thread as a *body of work* — how many clues it
  holds, how far back they run, which era is densest. **Count it before you claim
  it**: read the real lens data, never estimate a number into a caption.
  Hook: **the number**.

## 2026-10-08 (Thu) — 🚀 Community Engine +2 (how-to)

- **`23:00Z` · `launch:community-engine`** — mint
  `launch:community-engine:how-to`. Link `/?mode=community`.
  Literally where to tap, written for a fan who has never found it. Assume
  nothing. One path, three steps at most.
  Media: the day's pick as the tile; the **tap-path** screens may ride as IG
  slides 2+ (same in-use rule as day 0).
  Hook: **the challenge** — "find it in ten seconds" is fair here because the
  post then shows how.
  Experiment 01: **not an arm.** A launch post is not comparable to a thread
  post; no hashtags, no `experiment` object.

## 2026-10-09 (Fri) — Blank Spaces relationship timeline, week of 10-05

- **`23:00Z` · `timeline:love-story:<chapter-slug>:2026-10-09`** — the weekly
  timeline minimum. **Mint the actual chapter slug you land on** and record it in
  `why` so the 10-12 calendar can continue the sequence. Link `/?lens=love-story`
  with standard UTM parameters.
  **Direction, not copy:** advance the chronology one chapter past the Joe Jonas
  2008 chapter that shipped 10-01. **Confirmed, publicly documented material
  only** — what was publicly acknowledged at the time and what she has said on the
  record since. No speculation, no rumor-stage claim, nothing about people who are
  not public figures in this story. If the Vault carries no confirmed anchor for
  the next chapter, **skip to the next one that has one** and say which you
  skipped.
  **Do not reopen with 10-01's lines** ("the blank spaces timeline just reached
  the…", "2008. she was 18, and the breakup…").
  Hook: **the real quote** — a sourced line, attributed after.

## 2026-10-10 (Sat) — The Clue Web, slot 2 of 2 (window closes today)

🧪 **Experiment 01: control.** No hashtags, no `experiment` object; note
"Experiment 01 control" in `why`.

- **`23:00Z` · `thread:easter-eggs:behind-the-data`** — a second story-unique
  value: `thread:easter-eggs:behind-the-data:2026-10-second`. Link
  `/?lens=easter-eggs`. A **different** cut of the data than 10-07's, never a
  restatement — if 10-07 counted the clues, this one takes the single strangest
  entry and shows what the data says about it.
  **Window-bound**: drop rather than slide. If 10-07 did not ship, this slot
  still runs — one Clue Web post beats none, and the window closes tonight.
  Hook: **the contradiction**.

## 2026-10-11 (Sun) — 📰 NEWS RESERVE · fallback: the fortnight's one heartbeat

- **If `events.uncovered[]` has something at 11:00Z**, leave this slot for the
  same-day event run and draft nothing here.
- **Otherwise, fallback — `23:00Z` · `heartbeat:era-deep-cut`** — mint
  `heartbeat:era-deep-cut:2026-10-11`. Link `/?era=<eraId>`.
  Direction: take an era with deep never-used photo coverage (`speak-now`, `red`,
  `reputation` and `evermore` each hold six unused picks) and go to Era Secrets
  or the month items for one genuinely small, checkable detail. **Not `lover` —
  it has no never-used photo left.** Share-design pass applies: one real
  tag/share hook grounded in the detail itself.
  Hook: **the artifact** — open with what the image *is*.

## 2026-10-12 (Mon) — 🚀 Community Engine +6 (example output) · Tree run day

- **`23:00Z` · `launch:community-engine`** — mint
  `launch:community-engine:example`. Link `/?mode=community`.
  **One real theory the surface is actually carrying**, as proof the thing works.
  Read it off the live site; if the board is empty, say so in the PR body and
  defer the beat rather than inventing a theory — an invented example is the
  worst possible post for a feature about fan theories.
  Media: the day's pick as the tile, a screenshot of **that actual theory** as IG
  slide 2.
  Hook: **the real quote** — the theory in the fan's own words if the surface
  shows them, attributed to the surface, never to a private individual by name.

## 2026-10-13 (Tue) — Mood, October slot 1 of 2 · attempt four

- **`23:00Z` · `mood:era-match`** — mint `mood:era-match:2026-10-a`.
  October's format is **"what it gave me"**, the strongest one, *because it proves
  the thing works.* Quote one starter chip **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, never reword — then
  give the **real** songs it returned. Run it; do not imagine the output.
  **Landing:** "tap Mood on longlivets.com". Mood is the one lane with no deep
  link — **never write a `?mood=` URL, it does not exist.**
  **Never promise evermore, Midnights, TTPD or TLOAS songs** — not scored yet.
  Share-design pass applies: one real "send this to the friend who…" hook.
  Hook: **the honest question** — one we'd actually like answered.
  **This subject has been drafted and approved once and lost to the sweep. It is
  drafted by THIS day's run, for THIS day's slot. Do not park it.**

## 2026-10-14 (Wed) — 🚀 Community Engine +8 (callback), arc closes

- **`23:00Z` · `launch:community-engine`** — mint
  `launch:community-engine:callback`. Link `/?mode=community`.
  Tie it to one fan use-case and invite a reply — "which theory are you actually
  willing to defend?" Close the arc here; there is no +14 unless real replies
  exist to quote with permission, in which case the 10-19 calendar schedules it.
  Hook: **direct address**, worded differently from day 0's.

## 2026-10-15 (Thu) — The Runway hero, slot 1 of 2 (window 10-13→17)

🧪 **Experiment 01: control.** No hashtags, no `experiment` object.

- **`23:00Z` · `thread:fashion:quiz-poll`** — mint
  `thread:fashion:quiz-poll:2026-10-hero`. Link `/?lens=fashion`.
  Angle `quiz-poll`: two or three real options from the thread, one question,
  reply to vote. **Every option must actually be in the lens** — verify before
  writing, and never set up a poll whose answer the thread doesn't hold.
  **Runway shipped nothing in September (0 of 2, window closed unused). This is
  the slot that does not get dropped again.**
  Hook: **the challenge**.

## 2026-10-16 (Fri) — Blank Spaces relationship timeline, week of 10-12

- **`23:00Z` · `timeline:love-story:<chapter-slug>:2026-10-16`** — the weekly
  timeline minimum, one chapter past 10-09's. Mint the slug, record it in `why`,
  link `/?lens=love-story`. Same confirmed-only bar as 10-09, same no-reopening
  rule on 10-09's own opener.
  Hook: **the date** — "<month> <day>, <year>:" is burned as a *bare* date-stamp
  opener; put the date inside a sentence that does something.

## 2026-10-17 (Sat) — The Runway, slot 2 of 2 (window closes today)

🧪 **Experiment 01: TAGGED arm.** Hashtag block + the `experiment` object on both
halves, verbatim.

- **`23:00Z` · `thread:fashion:quiz-poll`** — a second story-unique value:
  `thread:fashion:quiz-poll:2026-10-second`. Link `/?lens=fashion`. A
  **different** set of options than 10-15's, on a different era or motif.
  **Window-bound**: drop rather than slide; if 10-15 did not ship, this slot
  still runs.
  Hook: **the artifact**.

## 2026-10-18 (Sun) — 📰 NEWS RESERVE · fallback: Mood, October slot 2 of 2

- **If `events.uncovered[]` has something at 11:00Z**, leave this slot for the
  same-day event run and draft nothing here.
- **Otherwise, fallback — `23:00Z` · `mood:chip-poll`** — mint
  `mood:chip-poll:2026-10-b`. October's second Mood slot, a **different format**
  from 10-13's: put two real starter chips up and ask which one a fan would pick.
  Verbatim chip copy, same rules as 10-13 — "tap Mood on longlivets.com", no
  `?mood=` URL, no evermore/Midnights/TTPD/TLOAS promises.
  Hook: **direct address**.

---

## What the queue already covers

**`social/queue/` is empty** — verified this run, and **no `tree/draft/` PR is
open**. No date in 2026-10-05 → 2026-10-18 is covered by a queued item, so every
beat above is genuinely uncovered work.

The 10-03 Mood pair is in `social/failed/`, not in the queue: it is **not**
coverage of 10-13's Mood slot. Re-cover the subject fresh — new opener, the day's
own photo pick, drafted by 10-13's run.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks, ≤5 minutes each, paste-ready,
checkboxes.

**2026-10-05 — `founder-task: social reach week of 2026-10-05`** *(filed this
run)* — **one task, ~3 minutes:** paste 2-4 links to Lover-era photographs, the
one era whose never-used inventory is at zero. It is the smallest ask this
channel has carried, and it is the only one with a slot it actually unblocks.

**Deliberately not asked this week:** the monthly IG Insights paste (per-post
reach/saves are fetched automatically into `social/metrics/posts/` now — asking
for it burns a slot on data we already have), the follow-and-comment ask (filed
six times, ticked zero), the Android/Play Store status (four asks, zero answers,
dropped), and anything Reddit (19 replies cleared through Discord this week — that
lane is working in the channel the founder actually reads).

---

## Review — 2026-09

*The monthly self-review, per strategy §3. 2026-09-28 is the last Tree weekly run
of September. Kept verbatim by every later rewrite of this file.*

**Scorecard, September vs August** (counted from `social/posted/` and
`social/failed/`; the weekly numbers in the PR body come from
`weekly-scorecard.mjs`):

| | August | September |
|---|---|---|
| Posts shipped | 65 (X 41 · IG 24) | **20 (X 10 · IG 10)** |
| Failed | 19 | 10 |
| Instagram followers | 3 (at 08-31) | **4 (at 09-27)** |
| Facebook followers | 8 | 10 |
| X followers | 0 | 0 |
| Distinct openers / posts, last 14d | 35 / 36 ✅ | **12 / 12 ✅** |
| Media mix (media-carrying) | 25% photo ❌ | **100% photo ✅** |
| Followers gained per post | 0 / 65 | **1 / 20** |

**1. The month in one line.** September fixed the quality problem and broke the
throughput one: every gate the desk was built to hold is green — 100% real
photographs, zero era tiles, 12 distinct openers out of 12 posts, not one "did
you know" — and we shipped **less than a third of August's volume** because
approved posts stopped reaching the platforms.

**2. The three Insights posts.** None. Requested every month since August, never
supplied. Every "double down / drop" below is therefore judgment, not
measurement — which is exactly the gap strategy §3 names as the standing blocker.

**3. Double down: the real-photograph standard, now that it has inventory.**
The three months of argument about media ended this month with the gate holding
at 100% and the library going 10 → 30 on 09-28. The grid finally looks like a
Taylor Swift fan account. That is the one thing to protect. **Drop: batching
multiple days' items into one draft PR.** It is the direct cause of the
throughput collapse — one ❌ on one photo killed five approved posts across
#4471, #4513 and #4544, including both halves of the only Mood post this desk
has ever had approved. One item, one PR, or one rejection keeps costing four
good posts (#4475).

**4. Rotation state advanced.** October = `monthNumber` 2 — the windows and
angles are in the ledger above. Runway 10-11→15 `quiz-poll` is the first
reservation of the next calendar; it was dropped in September and must not be
dropped twice. Mood October = `mood:result`. Next launch arc after Community
Engine: notifications + web push (#3568→#3583).

**5. Needed a founder decision.** Two, both in this week's brief: whether a
`u/unknown` photo credit may ship at all (answered 2026-10-01: yes, with no credit
line), and whether the weekly founder task moves out of GitHub issues into
`#longlive-tree`.

---

## Review — 2026-08

*Kept verbatim from the run of 2026-08-31 — the monthly reviews are the durable
record of this lane and survive every rewrite of the file above.*

**Scorecard, week ending 2026-08-31:** X 14 · IG 8 · FB 8 (30 total) · follower
change IG +0 · X +0 · FB +0 · 5 failed · 35 distinct openers across 36 posts
(target ≥12) ✅ · media mix 3 photo / 12 = 25% (target ≥70%) ❌ · Instagram grid
3 photo / 10 = 30% ❌ · 0 followers gained per 30 posts published.

**1. The month in one line.** The formula loop that created this desk is dead —
35 distinct openers across 36 posts, and "did you know" has not appeared since
08-10. Every other target was missed.

**2. The three Insights posts.** None. The August ask was never supplied, so the
single per-post engagement signal in the system does not exist for August.

**3. Double down: real photographs of Taylor.** The three days that carried a
cleared photo (08-26, 08-27, 08-28) are the only days the grid looked like a
Taylor Swift fan account rather than a product tour. The corpus grew by exactly
one file in August and stood at four. **Drop: captions written from a headline
nobody read** — the `appearance-discovery` lane's unsupervised authoring, which
produced the window's only duplicate opener and a memorial graphic scheduled
with exclamation points. Resolved since, by #3817.

**4. Rotation state advanced.** September = `monthNumber` 1 — the windows and
angles now in the ledger above.

**5. Needed a founder decision.** The appearance-lane media/authoring question
(#3584, since closed) and the Android Play Store listing (still open).
