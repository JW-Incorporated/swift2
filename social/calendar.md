# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-09-28 → 2026-10-11.**
Written by Tree's run of Monday 2026-09-28.

---

## 🟢 THE CHANGE THIS FORTNIGHT — the photo drought is over

**PR [#4592](https://github.com/JW-Incorporated/swift2/pull/4592) merged this
morning** (the rebased replacement for the stalled #4529) and
`social/photo-library.json` went from **10 entries to 30**. Twenty of them have
**never shipped**. Verified this run against every file in `social/posted/`:

> **Never used (20):** `reddit-erastour-1ptssc4` · `reddit-erastour-1q65hiz` ·
> `reddit-erastour-1q6jwfl` · `reddit-erastour-1q8clxb` ·
> `reddit-taylorswiftpictures-` `1nxmfeq` `1nz3wbn` `1ocof56` `1ogrcvp` `1ojprpr`
> `1pjmwfb` `1pm1yly` `1pphafw` `1puk3m7` `1pxtr93` `1q1pxtp` `1qad9bo` `1qgb3m8`
> `1r38qiv` `1r6n7aq` `1tl4pqb`
>
> **Used, therefore now permanently ineligible (10):** all ten original
> Wikimedia entries — `1989-inglewood-2023`, `debut-acoustic-2007`,
> `evermore-inglewood-2023`, `fearless-inglewood-2023`, `folklore-inglewood-2023`,
> `lover-minneapolis-2023`, `lover-minneapolis-act5-2023`, `red-inglewood-2023`,
> `reputation-inglewood-2023`, `speaknow-inglewood-2023`.

**`social/lessons.md` L001 is broadened to match what Joey actually said.** It
used to say "no repeat inside 7 days". It now says **a `photoId` that has ever
shipped is ineligible, full stop** — four rejections in eight days, the last one
absolute: *"All re-used pictures will be rejected. We need new pictures."* Filed
for codification as **#4601** (the rule belongs in `check-drafts.mjs`, not in a
prompt). Thirteen draftable days, twenty free photos: **every slot below gets its
own never-used photograph and none repeats.**

---

## New fan photos — most carry no credit, and that is fine

Sixteen of the twenty new entries carry the credit string **`u/unknown via
r/TaylorSwiftPictures`**: we have the Reddit link, not the person's name. **The
owner ruled 2026-10-01 that this is fine** ("I'm ok with uncredited photos. If we know who
took the photo, we should always give them credit, but if we don't that's fine too, just
post it…", `docs/social/guardrails.md` row 2): credit the photographer when known; when
not, post with no credit line. Four entries — all four `reddit-erastour-*` — do name a
real uploader (`u/Friscic`, `u/Shiver8597`, `u/Sensitive-Archer3010` ×2), and those are
assigned to the four highest-value beats below on purpose; credit them in the caption.

**Binding on the drafter, every slot:**

1. **Open the image file and look at it** before writing the item. The `alt`
   strings on the new entries were generated from the Reddit post title, not
   from the picture. The 2026-08-31 standard (strategy §2.1) is a *content*
   check, not a path check: if Taylor is not plainly in the frame, or the image
   does not match its `alt`, **take the next reserve entry and say which one you
   rejected and why in `why`.**
2. **Never paste `u/unknown` (or the word "unknown") into a caption.** If the real
   uploader can be read off the entry's `source` URL, credit them by name. If it cannot,
   ship the photo anyway with **no credit line and no `mediaCredit` on the item**
   (the pick from `.scratch/tree-inputs.json` already omits it).
3. **Never use `reddit-taylorswiftpictures-1nz3wbn`** — it is a 5.4 MB `.gif`.
   The pipeline posts one still image.
4. **Files over ~1.5 MB may be rejected by the platform** (strategy §2.1's
   rehost budget). Oversized entries are marked `⚠️ size` below; if one 400s,
   take the next reserve and note it.
5. **These are fan photos with no era tag** (`tags: ["fan-photo","eras-tour"]`).
   **A caption may not claim era relevance for them.** Credit the photo when known, say it
   is an Eras Tour fan photo, and let the words carry the era.

Nothing here blocks on credits any more; the library gaining photos (credited or not) is the priority.

---

## ⛔ OPEN INCIDENT — one ❌ strands every approved post beside it

**This is why 3 posts shipped in 7 days against 7 planned.** Six Tree daily-draft
PRs are open and unmerged right now — **#4471, #4513, #4544, #4556, #4565,
#4574** — and every one of them carries at least one photo-reuse rejection. The
approval poll merges a PR only when *every* item in it is approved, so a single ❌
kills its approved siblings too:

- **#4544** holds the 09-23 Mood pair (**both ✅**) and the 09-24 timeline X
  (**✅**) alongside one ❌'d Instagram item. Nothing in it shipped. **Mood has
  still never posted.**
- **#4471** holds a founder-approved Instagram item from 09-21. Still open.
- `2026-09-16-runway-behind-the-data-{ig,x}.json` were approved, never posted,
  and swept into `social/failed/` at 48h.

Root cause is filed as **[#4475](https://github.com/JW-Incorporated/swift2/issues/4475)**
(open since 09-20, unactioned) and the sweep half as **#4296**. Marjorie's
**#4581** asks Tree to re-file the stranded #4471 item; the weekly run may not
write `social/queue/`, so that ask stays open — see the comment on it.

**Planning consequence, and it is the one that hurts:** the 09-28 daily draft
produced no PR, so **today's beat is lost** and the Community Engine arc, already
deferred once, moves to **10-05**. Every date below assumes the batch-blocking
bug is still live — which is exactly why each beat is written to stand alone.

---

## How to read a slot

- **One beat a day, at `23:00Z`.** `MAX_POSTS_PER_RUN = 1` and
  `MAX_POSTS_PER_PLATFORM_PER_DAY = 1` (`scripts/social/lib/queue.mjs:61-62`).
  Strategy §2 still says two beats a day; the code wins and this calendar plans
  one. Raised as this week's proposal 1.
- **Every beat is ONE pair: one Instagram item + one X item** sharing a
  story-unique `campaign` and `scheduledAt`, written platform-native, >20%
  divergent in copy. No single-platform exceptions (Joey, 2026-08-26: *"Always an
  IG copy. Always."*).
- **X is text-only.** Every free photograph goes to the Instagram tile, where the
  grid is judged. X `site-screen` is permanently prohibited.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label is a FAMILY.** Mint the story-unique value shown — a
  reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270; the
  checker hard-fails at 280.
- **Share-design pass** (strategy, 2026-09-01): every `heartbeat:` and `mood:`
  caption needs one genuine tag/share hook grounded in the actual content. Thread
  and launch posts are exempt. Never bolt on a fake one; say so in `why`.
- **📰 A NEWS RESERVE day is a slot, not a gap.** Two days below (**10-04**,
  **10-11**) are reserved for news first, each with a named fallback subject on
  the day. On a reserve day: check `events.uncovered[]` at 11:00Z, leave the
  slot for the same-day event run if an event is uncovered, otherwise draft the
  fallback. **The previous day's run never drafts a reserve day early.** News
  landing on a non-reserve day may take the next unfilled beat inside 48h,
  yielding in order heartbeat → mood → a thread window's *second* slot; it
  never takes the weekly timeline minimum, a thread hero, or a launch day
  0/+2/+4 (strategy §1(e2)). Cap: **≤2 news posts per rolling 7 days.**
- **Read `social/lessons.md` first. L001 is active and binding.**

---

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-09** (`monthNumber` = 1) → **2026-10** (`monthNumber` = 2) inside this window |
| September windows + angles (`angle = ANGLES[(1 + threadIndex) % 5]`) | Decode 09-01→05 `single-best-item` · Clue Web 09-06→10 `interactive-challenge` · Runway 09-11→15 `behind-the-data` · Blank Spaces 09-16→20 `quiz-poll` · Taylor's Version 09-21→25 `origin-story` · **End Game 09-26→30 `single-best-item`** |
| **October windows + angles** (`monthNumber` = 2, recomputed this run) | **Decode 10-01→05 `interactive-challenge`** · **Clue Web 10-06→10 `behind-the-data`** · Runway 10-11→15 `quiz-poll` · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| Thread progress, September | Decode **1 of 2**. Clue Web **2 of 2 ✅**. Runway **0 of 2 ❌** (dropped, window closed). Blank Spaces **2 of 2 ✅**. Taylor's Version **1 of 2** — 09-22 shipped, the 09-25 slot never drafted. **End Game 0 of 2, both slots below (09-29, 09-30) are its last chance.** |
| Thread progress, October | Decode **2 slots planned** (10-02, 10-04). Clue Web **2 slots planned** (10-06, 10-09). Runway's window (10-11→15) is the **first reservation of the calendar written 2026-10-05** — it must not be dropped a second month running. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts:34`) | `threads` · `mood` · `clownbot` · `community` · `merch`. `/?mode=mood` verified working 09-23 (it shipped in an approved caption). `?mood=` is still not a thing. |
| **Launch arc — `launch:shop-the-look`** | **Closed, 3 of 4.** The 09-21 callback's Instagram half is still stranded in #4471 and its X half was ❌'d. The arc is **not** resurrected: it is seven days stale, and its photo (`fearless-inglewood-2023`) is now ineligible under L001. Do not re-draft any part of it. |
| **Launch arc — `launch:community-engine`, day 0 moves to 10-05** | The Clownbot fan-theory chip (#3965) + the Clue Web live-theory board (#3964), now joined by **#4525 (09-22), which wires big fan theories into the site's pin banner** — a fan can see a live theory on the front page. Beats: announce **10-05**, how-to **10-08**, example **10-10**. The +8 callback (10-13) is the **second reservation of the calendar written 2026-10-05**. **Gate: invariant 6 — day 0 does not draft until the drafter has opened www.longlivets.com and seen the surfaces render for real.** |
| Launch backlog (unchanged behind Community Engine) | notifications + web push (#3568→#3583) → pinch-zoom photo viewer (#831) → photos + focal program (#762). |
| New user-visible ships, 09-21→09-28 | #4525 (fan theories in the pin banner) and #4520 (countdown detector + auto-pin banner) are both user-visible and both **folded into the Community Engine arc** rather than given an arc of their own — an arc is already in flight (strategy §1(a)). #4570 is mobile-app-only and the app is unannounced (invariant 6). Everything else merged this week was ops, vault content, or agent routines. |
| ❓ Android status — **not asked again** | Open five runs with no answer. Asked four times; asking a fifth in a channel with a 0% response rate is not a plan. Barred under invariant 6 until a founder volunteers it. Dropped from the weekly ask list. |
| Mood beat | **September = `mood:chip-poll`, 0 of 2 shipped.** Both halves of the 09-23 pair were **founder-approved** and are still sitting in unmerged #4544. **October = `mood:result`, slot 1 on 10-03**; slot 2 belongs to the calendar written 10-05. **Mood has never shipped a post in this desk's existence and the reason is now a bug, not a plan.** |
| **Blank Spaces relationship timeline — permanent weekly minimum** | Week of 09-28: **10-01**. Week of 10-05: **10-07**. Chapter sequence: early solo years ✅ (09-17) → Harry Styles chapter ✅ (09-21) → Joe Jonas era (drafted, ❌'d on photo reuse, never shipped) → next confirmed chapter. Confirmed-only; no rumor-stage claim, ever. |
| Openers — last 14 days | **12 distinct patterns across 12 posts.** Target ≥12 in 14 days — met, but only because the denominator collapsed; 12 posts in 14 days is half the plan. **Burned, do not reuse verbatim or near:** *"i keep sending people to …"* · *"consider this your permission …"* · *"this is taylor in 2007"* · *"every love story has a …"* · *"that ivory gown from the …"* · *"ever lose an hour …"* · *"pick one, and you're not …"* · *"two of her most …"* · *"five weeks. that's the whole …"* · *"barely a month together …"* · *"okay the moment that still …"* · *"you can sing every …"* · plus last fortnight's burns: *"i still think about …"*, *"3 videos. zero words."*, *"you know the/when …"*, *"an honest question" / "genuine question"*, bare `<month> <n>, <year>:` date-stamps. **NB: the scorecard still does not compute this number** (#4297, open) — counted by hand from `social/posted/` bodies. |
| Media mix, last 14 days | **12 photo / 12 media-carrying = 100%**, target ≥70% ✅. IG grid: 6 of 6 IG posts carried a real Taylor photo ✅. Zero era tiles, zero undeclared media. The gate is holding; the *inventory* just stopped being the constraint. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel — but **9 Reddit replies were completed this week** through the Discord approval queue (scorecard `redditRepliesDone`). The counter tracks the wrong channel; that mismatch is founder question 2. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Never supplied**, three months running. **Asked this week** — September's monthly cadence falls on this run. |
| Founder tasks | **#4294 (09-14) and #3990 (09-07) are both open, 0 ticked — five consecutive weeks, zero completions**, including the week it was cut to a single 4-minute ask. The same founder answered 9 Reddit prompts and 9 draft approvals in Discord in the same period, median 3h 19m. The issue channel is not read as a work queue; Discord is. Founder question 2. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see. *(The repo-variables API returns 403 to this runner's token, so `SOCIAL_FREEZE` could not be read directly; it was inferred from live posting on 09-22 and from approvals continuing through 09-28.)* |
| **📰 News reserve (new, 2026-10-01 — answers [#4676](https://github.com/JW-Incorporated/swift2/issues/4676))** | **10-04 and 10-11**, each with a named fallback. Every calendar from the 10-05 run onward reserves **≥1 day per week** — a calendar that assigns all seven days is now a planning bug (strategy §2). Root cause of the 27 uncovered events: the same-day event run only schedules onto a UTC day where neither platform is taken, and no such day existed. |
| Social event mode | **`normal`** — `scripts/social/event-status.mjs` run this session returns `{"mode":"normal","kind":null,"windingDown":false,"reservedBeats":0}`. No countdown or big theory is live, so no beats are reserved and the 14 days below are planned as ordinary rotation. |

### Photo assignment — read this off, then verify

Thirteen draftable days, thirteen **never-used** photographs, **zero repeats**.
Run `npm run social:select-photo` to copy the exact `photoId`, `mediaPath`,
`credit`, `source` and `alt` — `altText[]` must copy the library `alt`
**verbatim**. Look at every image before you use it (rule 1 above).

| Day | IG tile | Credit | Note |
|---|---|---|---|
| 09-29 | `reddit-erastour-1q6jwfl` | u/Sensitive-Archer3010 | ✅ named uploader |
| 09-30 | `reddit-erastour-1q8clxb` | u/Sensitive-Archer3010 | ✅ named uploader |
| 10-01 | `reddit-taylorswiftpictures-1q1pxtp` | u/unknown | no credit line |
| 10-02 | `reddit-taylorswiftpictures-1ocof56` | u/unknown | no credit line |
| 10-03 | `reddit-erastour-1ptssc4` | u/Friscic | ✅ named uploader · ⚠️ size 3.1 MB |
| 10-04 | `reddit-taylorswiftpictures-1puk3m7` | u/unknown | no credit line |
| 10-05 | `reddit-erastour-1q65hiz` | u/Shiver8597 | ✅ named uploader · ⚠️ size 5.2 MB |
| 10-06 | `reddit-taylorswiftpictures-1pxtr93` | u/unknown | no credit line |
| 10-07 | `reddit-taylorswiftpictures-1r6n7aq` | u/unknown | no credit line |
| 10-08 | `reddit-taylorswiftpictures-1tl4pqb` | u/unknown | no credit line |
| 10-09 | `reddit-taylorswiftpictures-1ojprpr` | u/unknown | no credit line |
| 10-10 | `reddit-taylorswiftpictures-1pjmwfb` | u/unknown | no credit line |
| 10-11 | `reddit-taylorswiftpictures-1ogrcvp` | u/unknown | no credit line |

**Reserves, in order, all never used:** `1nxmfeq` · `1qad9bo` · `1pphafw`
(⚠️ 1.8 MB) · `1pm1yly` (⚠️ 2.1 MB) · `1qgb3m8` (⚠️ 2.2 MB) · `1r38qiv`
(⚠️ 7.5 MB). **Never:** `1nz3wbn` (`.gif`).
If a day slips or a slot is dropped, **re-derive from `social/posted/` rather
than sliding this table down.**

---

## 2026-09-28 (Mon) — ⚫ LOST · Tree run day

No daily-draft PR exists for today and the 11:00Z run has already passed, so
there is nothing to draft for 09-28. **Do not backfill it.** A post that is
already a day late is worth less than the next one being on time.

## 2026-09-29 (Tue) — End Game hero, slot 1 of 2 (window 09-26→30)

- **`23:00Z` · `thread:the-proposal:single-best-item`** — mint
  `thread:the-proposal:single-best-item:2026-09-hero`. Link `/?lens=the-proposal`.
  Angle `single-best-item`: one item from the thread, told whole. The thread is
  the byline, not the subject. **Confirmed material only** — this lens sits
  closest to the blocklist, so anything not settled public fact does not go in.
  IG media: `reddit-erastour-1q6jwfl` (named uploader), photo-only. Do not claim
  an era for it. X: **text-only.** Hook: **the artifact** — open with what the
  thing is, not with a question.

## 2026-09-30 (Wed) — End Game, slot 2 of 2 (window closes today)

- **`23:00Z` · `thread:the-proposal:single-best-item`** — a second story-unique
  value: `thread:the-proposal:single-best-item:2026-09-second`. Link
  `/?lens=the-proposal`. A **different** item from 09-29's, told whole — never a
  restatement. Same confirmed-only bar.
  IG media: `reddit-erastour-1q8clxb` (named uploader), photo-only.
  X: **text-only.** Hook: **the contradiction**.
  **Window-bound**: drop rather than slide. If 09-29 did not ship, this slot
  still runs — one End Game post beats none, and September closes tonight.

## 2026-10-01 (Thu) — Blank Spaces relationship timeline, week of 09-28

- **`23:00Z` · `timeline:love-story:<chapter-slug>:2026-10-01`** — the weekly
  timeline minimum. **Mint the actual chapter slug you land on** and record it in
  `why` so the 10-05 calendar can continue the sequence. Link `/?lens=love-story`
  with standard UTM parameters.
  **Direction, not copy:** advance the chronology one chapter past the Harry
  Styles chapter that shipped 09-21. The Joe Jonas chapter was drafted on 09-23
  and ❌'d **on photo reuse, not on content** — its body is on file in the
  feedback ledger and the material is sound, so it is a legitimate chapter to
  take. **Do not reopen with its first line** ("Okay this one is such a wild
  piece of Taylor lore").
  **Confirmed, publicly documented material only** — what was publicly
  acknowledged at the time and what she has said on the record since. No
  speculation, no rumor-stage claim, nothing about people who are not public
  figures in this story. If the Vault carries no confirmed anchor, **skip to the
  next chapter that has one.**
  IG media: `reddit-taylorswiftpictures-1q1pxtp`, photo-only. X: **text-only.**
  Hook: **the number** (a date, a gap, a count).

## 2026-10-02 (Fri) — The Decode hero, slot 1 of 2 (October window 10-01→05)

RE-DRAFT ask #4675 by 2026-10-04: the 09-23 Mood pair and the 09-24 Blank Spaces timeline X — founder-✅'d in retired PR #4544, never posted. Re-cover both subjects fresh as single-post items under the per-post approval flow: new openers, a never-used photo (L001), X text-only. Mood rides the 10-03 slot. Cite "ask #4675" in each item's `why`.

- **`23:00Z` · `thread:hidden-clues:interactive-challenge`** — mint
  `thread:hidden-clues:interactive-challenge:2026-10-hero`. Link
  `/?lens=hidden-clues`. **October's angle index** — the cycle month advances here.
  Angle `interactive-challenge`: *"open it and find the one where ___ — reply
  with what you got."* Name a real, findable thing in the thread; **verify it is
  actually there before writing the challenge.**
  IG media: `reddit-taylorswiftpictures-1ocof56` + **`thread-hidden-clues-screen.png`**
  as slide 2 (last used 09-05, clear of the window). Slide 2 only if it shows the
  lens **in use**, never a landing page or empty state (Joey, 2026-09-01); if it
  doesn't, go photo-only and say so in `why`.
  X: **text-only** — on a challenge post the reply-bait carries itself.
  Hook: **the challenge**.

## 2026-10-03 (Sat) — Mood, October slot 1 of 2 · the one that has to land

- **`23:00Z` · `mood:result`** — mint `mood:result:2026-10-a`.
  October's format rotates to **"what it gave me"**, the strongest one, *because
  it proves the thing works.* Quote one starter chip **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, never reword — then
  give the **real** songs it returned.
  **Both halves of September's Mood pair were founder-approved on 09-23 and are
  still stranded in unmerged #4544.** Do not re-use their openers (*"Tell me your
  whole vibe in three words…"*, *"Okay be honest — which one is you today?"*) and
  do not re-file them; write this beat fresh.
  **Scored eras only: no evermore, Midnights, TTPD or TLOAS songs.**
  Link `/?mode=mood` (verified) with standard UTM parameters.
  IG media: `reddit-erastour-1ptssc4` (named uploader, ⚠️ 3.1 MB — if the poster
  rejects it, take `1nxmfeq`). Slide 2 `mood-chat-screen.png` **only if it shows
  a real result on screen**; else photo-only with the songs in the caption.
  X: **text-only.** **Share hook required.** Hook: **the artifact**.

## 2026-10-04 (Sun) — 📰 NEWS RESERVE · fallback: The Decode, slot 2 of 2

**This beat is reserved for news first** (strategy §1(e2), added 2026-10-01 for
[#4676](https://github.com/JW-Incorporated/swift2/issues/4676)). At the 11:00Z
run on 10-04, read `events.uncovered[]` **before** anything else:

- **An uncovered real-world event from the last 48h → draft nothing here.**
  Leave the 10-04 `23:00Z` slot open so `routine-tree-event-draft.yml` can take
  it the same day; mint `news:<event-slug>-2026-10-04`, clear `timely` ≥4 on the
  six-dimension rubric, and the Decode answer beat below is **dropped** (its
  window closes 10-05 — drop rather than slide, per the window rule).
- **Nothing uncovered → draft the fallback below exactly as written.**
- **The 10-03 run does not draft this day's beat a day early.** That is what
  makes the reserve a reserve.

Either way the IG tile is 10-04's assigned photo (`reddit-taylorswiftpictures-1puk3m7`)
unless the event run's own `eventPhoto` supersedes it.

**Fallback beat:**

- **`23:00Z` · `thread:hidden-clues:interactive-challenge`** — a second
  story-unique value: `thread:hidden-clues:interactive-challenge:2026-10-answer`.
  Link `/?lens=hidden-clues`.
  If 10-02's challenge drew real replies, this is the answer beat and quotes them
  (with permission); if it drew none, it is a **different** challenge entirely —
  never a restatement.
  IG media: `reddit-taylorswiftpictures-1puk3m7`, photo-only (the lens screenshot
  burned on 10-02). X: **text-only.** Hook: **the number**.

## 2026-10-05 (Mon) — 🚀 Community Engine arc, day 0 (announce) · Tree run day

- **`23:00Z` · `launch:community-engine:announce`** — mint exactly that.
  **Gate first (invariant 6, not negotiable):** open www.longlivets.com and
  confirm for yourself that the Clownbot fan-theory chip, the Clue Web
  live-theory board, **and the front-page pin banner carrying a live fan theory
  (#4525)** render for real. If they do not, **do not draft this** — fall back to
  a `heartbeat:` beat, say so in the PR body, and the arc waits again.
  Link: `/?mode=clownbot`, `/?lens=easter-eggs`, or the bare domain if the pin
  banner is the lead — pick the surface the post actually leads with and verify
  the deep link resolves before using it.
  Job per strategy §1(a): **one line on what a fan can now do** — not "we
  shipped", but "here's the thing you can now do". Name the real behaviour you
  saw on screen. **Assert no counts.**
  IG media: `reddit-erastour-1q65hiz` (named uploader, ⚠️ 5.2 MB — if the poster
  rejects it, take `1qad9bo`). Slide 2 only if a committed screenshot genuinely
  shows one of these surfaces mid-use; `feature-quote-demo-theory.png` is a
  candidate — **look at it before trusting the filename.**
  X: **text-only.** Hook: **direct address**.

## 2026-10-06 (Tue) — Clue Web hero, slot 1 of 2 (October window 10-06→10)

- **`23:00Z` · `thread:easter-eggs:behind-the-data`** — mint
  `thread:easter-eggs:behind-the-data:2026-10-hero`. Link `/?lens=easter-eggs`.
  Angle `behind-the-data`: how the thread knows what it knows — the shape of the
  evidence, not a list of eggs. What gets counted, what gets rejected, and the
  one pattern that only shows up once you have all of it in one place.
  IG media: `reddit-taylorswiftpictures-1pxtr93`, photo-only.
  X: **text-only.** Hook: **the number**.

## 2026-10-07 (Wed) — Blank Spaces relationship timeline, week of 10-05

- **`23:00Z` · `timeline:love-story:<chapter-slug>:2026-10-07`** — the weekly
  timeline minimum. Mint the actual chapter slug and record it in `why`.
  Link `/?lens=love-story` with standard UTM parameters.
  Advance one chapter from 10-01. Same hard bar: confirmed, publicly acknowledged
  material only; no speculation, no rumor frame, no private individuals. If the
  Vault carries no confirmed anchor, skip forward to a chapter that does.
  IG media: `reddit-taylorswiftpictures-1r6n7aq`, photo-only. X: **text-only.**
  Hook: **the real quote** — a sourced, on-the-record line as the first line,
  attributed after. Not the number hook (10-01 has it).

## 2026-10-08 (Thu) — 🚀 Community Engine +3 (how-to)

- **`23:00Z` · `launch:community-engine:how-to`** — mint exactly that.
  Only draft this if 10-05's day 0 actually shipped; if it didn't, this slot
  becomes a `heartbeat:` beat and the arc waits.
  Job: **literally where to tap.** Assume the reader has never found it — how you
  reach the surface, what happens when you tap, what you get back.
  IG media: `reddit-taylorswiftpictures-1tl4pqb`; slide 2 only if a real in-use
  screenshot exists (see 10-05). X: **text-only.** Hook: **the challenge**.

## 2026-10-09 (Fri) — Clue Web, slot 2 of 2 (window closes 10-10)

- **`23:00Z` · `thread:easter-eggs:behind-the-data`** — a second story-unique
  value: `thread:easter-eggs:behind-the-data:2026-10-second`. Link
  `/?lens=easter-eggs`. A different entry point into the same angle — the one
  egg the data says the fandom got wrong, or the oldest one still live. **Never a
  retelling of 10-06.**
  IG media: `reddit-taylorswiftpictures-1ojprpr`, photo-only.
  X: **text-only.** Hook: **the contradiction**.
  **Window-bound**: drop rather than slide.

## 2026-10-10 (Sat) — 🚀 Community Engine +5 (example)

- **`23:00Z` · `launch:community-engine:example`** — mint exactly that.
  Only draft this if 10-05 shipped. Job per strategy §1(a): **one real thing the
  surface produced** — an actual theory on the board, an actual Clownbot
  exchange — the proof it's good, not a description of it. Quote fan-authored
  content only with permission; if you have none, use one the site itself
  generated.
  IG media: `reddit-taylorswiftpictures-1pjmwfb`; slide 2 per 10-05's rule.
  X: **text-only.** Hook: **the artifact**.

## 2026-10-11 (Sun) — 📰 NEWS RESERVE · fallback: the fortnight's one heartbeat

**Second news reserve of this window** (strategy §1(e2)). Same procedure as
10-04: at the 11:00Z run on 10-11, an uncovered real-world event from the last
48h takes this slot as `news:<event-slug>-2026-10-11` and the heartbeat below
**slides into the calendar written 10-12** rather than being dropped (a
heartbeat is not window-bound). Nothing uncovered → draft the fallback as
written. The 10-10 run leaves this day alone.

Heartbeat is first in the yield order, so this is the cheapest reserve in the
fortnight — which is exactly why it is one.

**Fallback beat:**

- **`23:00Z` · `heartbeat:era-deep-cut`** — mint
  `heartbeat:era-deep-cut:speak-now-million-week-2026-10-11`. **A new
  story-unique value**: the 09-13 original died in `social/failed/` and the
  09-27 retry never drafted, so neither value is requeuable.
  Link `/?era=speak-now`.
  Subject direction: the Speak Now week-one sales record and the
  written-entirely-alone credit. **Source both against the Vault
  (`supabase/seed/content/speak-now.mjs`) and keep the "14 standard-edition
  tracks" qualifier** — the unqualified "wrote it alone" claim overstates the
  source, which a review caught on the original draft.
  IG media: `reddit-taylorswiftpictures-1ogrcvp`, photo-only. **This is an Eras
  Tour fan photo, not a Speak Now-era photo — credit it as such and do not let
  the caption imply otherwise.** X: **text-only.**
  **Share hook required** (heartbeat), grounded in the real no-co-writers detail.
  Hook: **the contradiction**. The original caption is on file in
  `social/failed/` — read it, then **do not reopen with its first line.**

---

## What the queue already covers

**`social/queue/` is empty** — verified this run. No date in
2026-09-28 → 2026-10-11 is covered by a queued item.

Six daily-draft PRs are open with unmerged items (#4471, #4513, #4544, #4556,
#4565, #4574), but none of them targets a date inside this window — the latest
is 09-26. **If any of them is merged later, its items are historical, not
coverage**; do not treat a merged backlog PR as filling a slot below.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks, ≤5 minutes each, paste-ready,
checkboxes.

**2026-09-28 — `founder-task: social reach week of 2026-09-28`** *(filed this
run)* — **two tasks, ~5 minutes total.** Task 1 is the monthly IG Insights paste,
due this run on the monthly cadence and never once supplied in three months. Task
2 is the follow-and-comment ask, filed for the sixth time. If task 2 goes unticked
again, it does not get a seventh filing in this channel — it moves to
`#longlive-tree`, which is answered in hours.

**Deliberately not asked this week:** the Android/Play Store status (four asks,
zero answers — dropped) and any third task.

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
