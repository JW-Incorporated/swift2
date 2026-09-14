# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-09-14 → 2026-09-27.**
Written by Tree's run of Monday 2026-09-14.

---

## ⛔ OPEN INCIDENT — the 48h approval sweep is eating approved posts

**Do not treat `social/queue/` as trustworthy state this week.** Four items were
approved in one batch at `2026-09-11T16:26Z` (PR #4108). Two shipped. The other
two were killed by a rule, not by a platform:

- `2026-09-13-speaknow-million-week-ig.json` — approved 09-11 16:26Z, scheduled
  09-13 23:00Z. The 48h-after-approval sweep
  (`social/README.md`) expired it at **09-13 16:26Z — 6h34m before it was ever
  due to post.** Any item approved more than 48h ahead of its own `scheduledAt`
  is dead on arrival. Swept to `social/failed/` (#4288).
- `2026-09-12-shop-the-look-announce-ig.json` — **posted successfully** at
  09-13 00:38Z (`platformPostId` 17985710469068737) and then swept to
  `social/failed/` anyway at 09-14 01:24Z (#4282). The sweep does not check
  `social/posted/` before declaring an approved item failed.
- Both X siblings (`2026-09-12-…-x`, `2026-09-13-…-x`) are **still sitting in
  `social/queue/`** — one of them already posted. The poster is not clearing
  `social/queue/` on success.

Consequence for planning: the scorecard's "2 failed" is one bookkeeping bug and
one genuinely lost post, not two bad drafts. Filed as an ask of Marjorie in this
week's brief. **Tree may not touch `social/queue/`, `social/failed/` or
`scripts/` — none of the above is fixable from this file.**

The speak-now heartbeat that was lost is re-slotted on **09-27** under a new
story-unique campaign value, because the original never reached
`social/posted/` and the content was already founder-approved.

---

## ✅ Photo availability — resolved, and the inventory is the constraint now

`social/photo-library.json` holds **10 credited photographs**, one per era except
lover (two). `npm run social:select-photo` picks the least-used, longest-unseen
entry and permits reuse when everything has been used, so a pair can never stall
on media. Every photo draft copies that entry's exact `photoId`, path, credit and
source; `check-drafts.mjs` verifies the match so attribution cannot drift.

**Eras with no credited photo at all: midnights, ttpd, tloas.** A story that
needs one of those three cannot carry an era-matched tile — pick a different
story or accept a non-matching credited photo, never an era tile.

⚠️ `photoId` is mandatory on every new `mediaKind: "photo"` queue draft.

## The carousel shape — how a thread or mood beat legally shows the site

`mediaKind: "site-screen"` is dead outside `launch:`. But a **`mediaKind:
"photo"` item may carry extra slides**, and only `media[0]` is prefix-checked
(`check-drafts.mjs:603-616`). So:

> **`mediaKind: "photo"` · `media[0]` = a cleared Taylor photo (the grid tile)
> · `media[1]` = the product screenshot.**

The grid shows Taylor; the screenshot still gets seen. Two constraints:

- **Slide 2 burns the repeat window too.** Used recently and still burned:
  `thread-easter-eggs-intro.png` (09-07), `thread-easter-eggs-screen.png`
  (09-09), `era-tloas-screen.png` (08-30). **Free this fortnight:**
  `thread-fashion-screen.png`, `thread-love-story-screen.png`,
  `thread-taylors-version-screen.png`, `thread-the-proposal-screen.png`,
  `mood-chat-screen.png`, `mood-feature.png`.
- **"Cool feature only" (Joey, 2026-09-01, strategy §2).** A screenshot must show
  a thread lens, Mood, Clownbot or the shoppable "seen on Taylor" surface **in
  actual use** — never a landing page or an empty state. No cool visual → drop
  the slide and ship the photo alone.

**There is still no "Seen on Taylor" screenshot committed under
`apps/web/public/social/library/`.** The 09-12 announce shipped photo-only and it
was correct. Every `launch:shop-the-look:*` beat below is **photo-only unless one
lands** — photo-only is the answer, not a blocker.

## How to read a slot

**Every beat is ONE pair: one Instagram item + one X item sharing a
story-unique `campaign` and `scheduledAt`, written platform-native, >20%
divergent in copy.** There are no single-platform exceptions (Joey, 2026-08-26:
*"Always an IG copy. Always."*) — a story that cannot be told on both platforms
is not drafted at all.

- **One beat a day, at `23:00Z`.** `MAX_POSTS_PER_RUN = 1` and
  `MAX_POSTS_PER_PLATFORM_PER_DAY = 1`
  (`scripts/social/lib/queue.mjs:61-62`, re-verified this run) mean exactly one
  campaign per platform can ship per UTC day. Strategy §2 still says two beats a
  day; that correction was proposed in last Monday's brief and has had neither a
  ✅ nor a ❌, so it is re-asked as a question this week, not re-proposed.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label below is a FAMILY.** Mint the story-unique value shown —
  a reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **X carries a credited photo for every paired campaign.** X `site-screen` is
  permanently prohibited.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270;
  the checker hard-fails at 280.
- **Share-design pass** (strategy, 2026-09-01): every `heartbeat:` and `mood:`
  caption needs one genuine tag/share hook grounded in the actual content.
  Thread and launch posts are exempt. Never bolt on a fake one; say so in `why`.

### Media selection rule — read before drafting any beat below

Draft the beats in order. For each IG/X pair run the selector and copy its exact
`photoId`, path, credit and source into each photo draft. **Lean on the five
eras unused in the last 14 days: `1989`, `evermore`, `folklore`, `reputation`,
`speak-now`.** `lover` was used four times in the last ten posts — avoid it
entirely this fortnight. **No era twice inside any 4-day span.** Where a slot
below names a target era, that era wins over the selector's default.

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-09** (`monthNumber` = 1), unchanged |
| September windows + angles (`angle = ANGLES[(1 + threadIndex) % 5]`) | Decode 09-01→05 `single-best-item` · Clue Web 09-06→10 `interactive-challenge` · Runway 09-11→15 `behind-the-data` · Blank Spaces 09-16→20 `quiz-poll` · Taylor's Version 09-21→25 `origin-story` · End Game 09-26→30 `single-best-item` |
| **October windows + angles, precomputed** (`monthNumber` = 2) | Decode 10-01→05 `interactive-challenge` · Clue Web 10-06→10 `behind-the-data` · Runway 10-11→15 `quiz-poll` · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| Thread progress this month | Decode **1 of 2** (window closed, ends short). Clue Web **2 of 2 ✅** (09-07 hero + 09-09 find both shipped). Runway **0 of 2 so far** — the launch arc took 09-12 and the window nominally closed 09-15, so it is extended to 09-16 under strategy §1(a)'s "an arc may delay a thread window by up to 2 days"; **1 slot planned, Runway ends September 1 of 2.** Blank Spaces 2 slots (09-19/09-20). Taylor's Version 2 slots (09-22/09-25). End Game **1 slot in this calendar** (09-26); its second belongs to 09-28→30 and is the next calendar's first reservation. |
| Lens IDs (verified `packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (verified `packages/experience/src/deepLink.ts:34`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **`/?mode=mood` is real** — the drafter opens it once and confirms it lands on Mood before using it; fall back to `longlivets.com` + "tap Mood" if not. `?mood=` is still not a thing. |
| **Launch arc in flight** | **`launch:shop-the-look` — day 0 SHIPPED 09-12** (IG `17985710469068737`, X `2098934505482727932`) after two dead attempts. Remaining: **how-to 09-15 (+3), example 09-18 (+6), callback 09-21 (+9)**. Stretched from the canonical +2/+4/+8 because day 0 landed four days late; still one readable arc. The surface: 100 shoppable items across 12 eras, a separate "Made by Swifties" bucket of 22 fan-made items, disclaimer verbatim **"Her look, not the product"** — **re-count all three against `apps/web/lib/longlive/merch.ts` before asserting any of them.** Link is always `/?mode=merch`. |
| Launch backlog (unchanged order) | **Community Engine's fan-facing surfaces** — the Clownbot fan-theory chip (#3965) and the Clue Web live-theory board with origin badges and a "Live now" strip (#3964), merged 2026-09-07. **This is the next arc, day 0 in the calendar written 2026-09-21**, not this one: two arcs never overlap and shop-the-look runs to 09-21. **Open the live site and confirm both surfaces render before day 0.** → notifications + web push (#3568→#3583) → pinch-zoom photo viewer (#831) → photos + focal program (#762). |
| No new user-visible ship this week | Every PR merged 2026-09-07→09-14 was agent/ops infra, docs, or the Marjorie overhaul. No launch trigger fired; the backlog governs. |
| ❓ Android status — **still needs Joey, not re-asked** | Unanswered for three runs. `HUMAN-ACTIONS.md` #17 records the device test as "the only thing left **before** Play Store"; PR #3534 calls it "the shipped Android app". **Barred under invariant 6 until a founder confirms.** Deliberately not competing for attention this week. |
| Mood beat | **2026-09 = `mood:chip-poll`**, 2 slots: **09-14 and 09-23**. None of this cycle's slots has ever drafted. |
| **Blank Spaces relationship timeline — permanent weekly minimum** | Week of 09-14: **09-17**, `timeline:love-story:early-solo-years:2026-09-17`. Week of 09-21: **09-24**, `timeline:love-story:joe-jonas-era:2026-09-24`. Chapter sequence: early solo years → Joe Jonas era → confirmed public relationship-era material → Travis. Confirmed-only; no rumor-stage claim, ever. |
| Openers — last 14 days | **8 distinct patterns across 10 posts.** Target is ≥12 distinct in 14 days, so **this window is under target** — a volume artifact (only 10 posts shipped), not a formula relapse. Both duplicates are IG/X siblings opening with the same two words: *"ok …"* (09-07 pair) and *"you know …"* (09-12 pair). **A sibling pair opening on the same phrase is a near-miss on the structural-difference gate — diverge the first five words, not just the body.** Burned, do not reuse verbatim or near: *"you know …"* · *"ok this/I …"* · *"i still think about …"* · bare `<month> <n>, <year>:` date-stamps · *"an honest question" / "genuine question"* · *"she was twenty" / "she was 22"* · *"a fresh official Taylor upload just landed"*. **NB: the scorecard does not compute this number** — `buildScorecard` has no opener field. Counted by hand from `social/posted/` bodies. |
| Eras used, last 14 days | **lover ×4** (09-05, 09-07 ×2, 09-09), red ×1, fearless ×1, debut ×1. **Unused and preferred: `1989`, `evermore`, `folklore`, `reputation`, `speak-now`.** |
| Media mix, last 14 days | **7 photo / 8 media-carrying = 87.5%**, target ≥70% ✅. The one `site-screen` was `era-deep-cut:tloas-showgirl-chart-records` (08-30) — a heartbeat, and `site-screen` is only legitimate on launch/thread posts. One miss, already outside this window, no recurrence planned. IG grid: 5 of 6 IG posts carried a real Taylor photo. |
| Reddit non-promo contributions | **0 / 20.** Asked four consecutive weeks, never ticked. Every Reddit task stays a zero-link contribution until this reaches 20 (growth-plan §7). |
| IG Insights | **Never supplied**, four months running. Asked 09-07 in #3990, unanswered. **Not re-asked this week** — it is a monthly ask and the next one is due in October. |
| Founder tasks | **#3990 (week of 09-07) is still open with 0 of 3 ticked.** Three tasks a week has produced zero completions three weeks running, so this week asks for **exactly one** thing. |
| Crisis stop | **Not active.** `SOCIAL_FREEZE` was set true 09-11 for Wave 3 CI (#4141/HA #60) and false again 09-12 (#4151, verified closed in #4186); posts shipped 09-12, which confirms it. No founder "stop posting" outstanding anywhere Tree can see. *(The repo-variables API returns 403 to this runner's token, so the value itself was verified from the HA trail and from live posting, not read directly.)* |

---

## 2026-09-14 (Mon) — Mood beat 1 of 2 · Tree run day

- **`23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-a`.
  Link **`/?mode=mood`** if it verifies (see the ledger), else bare
  `longlivets.com` + "tap Mood".
  X: three starter chips quoted **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, quote exactly, never
  reword — then "which one is you today". IG sibling: the same three chips in
  the caption, cleared photo tile + **`mood-chat-screen.png`** slide 2 (it must
  show Mood mid-conversation, not an empty input).
  **Pick chips whose real results come from scored eras.** evermore, Midnights,
  TTPD and TLOAS are **not scored** — never promise or imply songs from them.
  Target era for the tile: **`reputation`**.
  **Share hook required** (mood) — "which one is you, tag the other one".
  Hook: **direct address**, and the X and IG openers must not share their first
  five words.

## 2026-09-15 (Tue) — 🚀 Launch arc +3 (how-to)

- **`23:00Z` · `launch:shop-the-look:how-to`** — mint exactly that.
  Link `/?mode=merch`. Job: **literally where to tap.** Assume the reader has
  never found it — how you reach the merch surface, what a tile does when you
  tap it, that the retailer opens in a new tab, and which eras carry looks
  (check the real count; do not estimate).
  IG media: **photo-only** unless a "Seen on Taylor" screenshot has been
  committed by then — target era **`1989`**. X media: selector-chosen credited
  photo, a different era from the IG tile.
  Hook: **the challenge** — "open your era and find one."

## 2026-09-16 (Wed) — The Runway, the only slot it gets (window extended to today)

- **`23:00Z` · `thread:fashion:behind-the-data`** — mint
  `thread:fashion:behind-the-data:2026-09-tappable`. Link `/?lens=fashion`.
  Angle `behind-the-data`: how many looks The Runway holds, how they were
  sourced, and the one thing that surprised us building it — **count against the
  real thread, do not estimate** — plus, now that shop-the-look is live, how
  many of those looks are tappable. That last number is the whole reason this
  slot survived the arc.
  IG media: cleared photo tile + **`thread-fashion-screen.png`** slide 2
  (`-intro.png` shipped 08-24 and stays out). Target era **`folklore`**.
  X media: selector-chosen credited photo. Hook: **the number**.
  **Window-bound**: if this has not drafted by 09-16 it is dropped, not slid —
  Runway simply ends September 1 of 2 and October's window is its next chance.

## 2026-09-17 (Thu) — Blank Spaces relationship timeline, week 1

- **`23:00Z` · `timeline:love-story:early-solo-years:2026-09-17`** — the weekly
  timeline minimum. Link `/?lens=love-story` with standard UTM parameters.
  **Direction, not copy:** open in Taylor's early solo years and establish the
  lens's confirmed-only chronology; the next weekly chapter advances to the Joe
  Jonas era (09-24). The drafter sources every person, relationship, event, date
  and quote against the Vault or reliable public reporting before drafting.
  **No unconfirmed relationship, no rumor frame, no countdown frame** — the
  blocklist applies in full.
  IG: real cleared Taylor photo from the early-career years (`debut` or
  `fearless`), **photo-only for this slot** so 09-19's Blank Spaces hero can use
  the lens screenshot without repeating a carousel asset. X: selector-chosen
  credited photo, never a site screenshot, never text-only.
  Hook: **the artifact** — open with what the image is.

## 2026-09-18 (Fri) — 🚀 Launch arc +6 (example)

- **`23:00Z` · `launch:shop-the-look:example`** — mint exactly that.
  Link `/?mode=merch`. Job: **one real result the surface produced.** A single
  look, the piece, where the tap takes you. The proof it works, not the pitch.
  Pick a look from an era outside `lover`. IG media: photo tile, target era
  **`evermore`** unless the look's own era has a cleared photo, in which case
  match the look. X media: selector-chosen credited photo.
  Hook: **the artifact** — open with what the image is, and diverge the first
  five words from 09-17's artifact hook.

## 2026-09-19 (Sat) — Blank Spaces hero, slot 1 of 2 (window 09-16→20)

- **`23:00Z` · `thread:love-story:quiz-poll`** — mint
  `thread:love-story:quiz-poll:2026-09-hero`. Link `/?lens=love-story`.
  Angle `quiz-poll`: pose one genuinely hard either/or from the thread and let
  people answer. The thread is the byline, named once at the end with the link,
  not the subject.
  IG media: cleared photo tile + **`thread-love-story-screen.png`** slide 2
  (`-intro.png` shipped 08-29 and stays out). Target era **`speak-now`**.
  X media: selector-chosen credited photo, structurally different post.
  Hook: **the challenge**.

## 2026-09-20 (Sun) — Blank Spaces, slot 2 of 2 (window closes today)

- **`23:00Z` · `thread:love-story:quiz-poll`** — a second story-unique value:
  `thread:love-story:quiz-poll:2026-09-results`. Link `/?lens=love-story`.
  If 09-19's poll drew real answers, this is the results beat; if it drew none,
  it is a different either/or entirely — **never a restatement**.
  IG media: cleared photo tile, photo-only is fine. X media: selector-chosen
  credited photo. Hook: **the contradiction**.
  **Window-bound**: drop rather than slide.

## 2026-09-21 (Mon) — 🚀 Launch arc +9 (callback, closes the arc) · Tree run day

- **`23:00Z` · `launch:shop-the-look:callback`** — mint exactly that.
  Link `/?mode=merch`. Job: tie it to a fan use-case and **invite a reply** —
  "which era's closet would you actually raid?"
  IG media: photo tile, whichever era is furthest from its last use.
  X media: selector-chosen credited photo. Hook: **the honest question**, in
  fresh wording — the phrase "an honest question" itself is burned.
  The optional +14 "what you did with it" beat runs **only** if real replies
  exist to quote with permission, and it is the 09-21 Tree run's call.

## 2026-09-22 (Tue) — Taylor's Version hero, slot 1 of 2 (window 09-21→25)

- **`23:00Z` · `thread:taylors-version:origin-story`** — mint
  `thread:taylors-version:origin-story:2026-09-hero`. Link
  `/?lens=taylors-version`.
  Angle `origin-story`: what this thread **is**, and the one moment that made it
  worth building. Not a re-recording explainer written for people who already
  know — the moment.
  IG media: cleared photo tile + **`thread-taylors-version-screen.png`** slide 2.
  Target era **`red`** or **`fearless`**, matched to whichever moment the drafter
  picks. X media: selector-chosen credited photo. Hook: **direct address**.

## 2026-09-23 (Wed) — Mood beat 2 of 2

- **`23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-b`.
  A **different** three chips from 09-14, quoted verbatim from
  `apps/web/lib/longlive/mood-starters.ts`. Link `/?mode=mood` (or the
  bare-domain fallback). IG media: cleared photo tile + **`mood-feature.png`**
  slide 2 if it shows Mood in use, else photo-only. Target era **`1989`**.
  X media: selector-chosen credited photo.
  Same scored-era constraint: no evermore, Midnights, TTPD or TLOAS songs.
  **Share hook required.** Hook: **the contradiction**.

## 2026-09-24 (Thu) — Blank Spaces relationship timeline, week 2

- **`23:00Z` · `timeline:love-story:joe-jonas-era:2026-09-24`** — the weekly
  timeline minimum for the week of 09-21. Link `/?lens=love-story` with standard
  UTM parameters. **Direction, not copy:** advance the chronology one chapter
  from 09-17. **Confirmed, publicly documented material only** — what was
  publicly acknowledged at the time and what she has said about it since. No
  speculation about anyone's private life, no rumor-stage claim, and nothing
  about people who are not public figures in this story. If the Vault does not
  carry a confirmed anchor for this chapter, **skip to the next chapter that has
  one rather than reaching** — an empty slot beats an unsourced one.
  IG: era-appropriate cleared photo, photo-only. X: selector-chosen credited
  photo. Hook: **the number** (a date, a gap, a count) — not the artifact hook
  again.

## 2026-09-25 (Fri) — Taylor's Version, slot 2 of 2 (window closes today)

- **`23:00Z` · `thread:taylors-version:origin-story`** — a second story-unique
  value: `thread:taylors-version:origin-story:2026-09-vault`. Link
  `/?lens=taylors-version`. A different entry point into the same angle: the
  single vault track the thread treats best, or the one re-recording detail that
  surprised us — never a retelling of 09-22.
  IG media: cleared photo tile, photo-only is fine (the lens screenshot burned
  on 09-22). Target era **`reputation`** or **`evermore`**, whichever is further
  from its last use. X media: selector-chosen credited photo.
  Hook: **the artifact**. **Window-bound**: drop rather than slide.

## 2026-09-26 (Sat) — End Game hero, slot 1 of 2 (window 09-26→30)

- **`23:00Z` · `thread:the-proposal:single-best-item`** — mint
  `thread:the-proposal:single-best-item:2026-09-hero`. Link
  `/?lens=the-proposal`.
  Angle `single-best-item`: one item from the thread, told whole. The thread is
  the byline, not the subject. **Confirmed material only** — this lens sits
  closest to the blocklist, so anything not settled public fact does not go in.
  IG media: cleared photo tile + **`thread-the-proposal-screen.png`** slide 2
  (it must show the lens in use). X media: selector-chosen credited photo.
  Hook: **the artifact**.
  **Slot 2 of 2 belongs to 09-28→30 and is the first reservation of the calendar
  written 2026-09-21.**

## 2026-09-27 (Sun) — Heartbeat · the lost speak-now beat, recovered

- **`23:00Z` · `heartbeat:era-deep-cut`** — mint
  `heartbeat:era-deep-cut:speak-now-million-week-2026-09-27`. **A new
  story-unique value**, because the 09-13 original died in `social/failed/` and
  is not requeuable from here.
  Link `/?era=speak-now`. Target era **`speak-now`** (`speaknow-inglewood-2023`,
  era-matched, unused in this window). IG: photo-only. X: selector-chosen
  credited photo.
  Subject direction: the Speak Now week-one sales record and the
  written-entirely-alone credit. **Source both against the Vault
  (`supabase/seed/content/speak-now.mjs`) and keep the "14 standard-edition
  tracks" qualifier** — the unqualified "wrote it alone" claim overstates the
  source, which a review caught on the original draft.
  **Share hook required** (heartbeat), grounded in the real no-co-writers detail.
  Hook: **the contradiction**. Do **not** reopen with the original's first line;
  it never shipped, but the whole caption is on file and reusing it verbatim
  wastes the second chance.

---

## Nothing in this window is covered by the queue

`social/queue/` holds only the two stranded X items from 09-12 and 09-13 (see
the incident block at the top). Neither is dated inside 2026-09-14 → 2026-09-27,
so every slot above is genuinely uncovered and safe to draft.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks, ≤5 minutes each, paste-ready,
checkboxes.

**2026-09-14 — `founder-task: social reach week of 2026-09-14`** *(filed this
run)* — **exactly one task, ~4 minutes.** #3990's three tasks are still 0 of 3
ticked, and #3585 and #2313 before it went the same way. Three asks a week is
being read as noise, so this week asks for the single highest-leverage one:
following and commenting on real Swiftie accounts on Instagram, which is the
direct mechanism behind the 09-30 follower target. If one task lands, the ask
scales back up next week.

**Deliberately not asked this week:** the monthly IG Insights paste (asked 09-07
in #3990, and it is a monthly cadence — next due in October) and the Android
Play Store question (open three runs, still barring the Android arc).

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
