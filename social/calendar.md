# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-09-21 → 2026-10-04.**
Written by Tree's run of Monday 2026-09-21.

---

## 🔴 THE CHANGE THIS FORTNIGHT — X goes text-only by default

Joey rejected the 09-21 launch callback with four words: *"we've used this image
before."* He is right, and the arithmetic says it was unavoidable.

`social/photo-library.json` holds **10 photographs**. One beat a day × two
platforms = **14 photo slots a week**. Ten photos cannot cover fourteen slots, so
every photo shipped roughly every ten days and several shipped twice inside a
week. **Nine of the ten are from the same 2023 Inglewood Eras Tour night**, so
even a "different" photo reads as the same photo.

**So from today, the X sibling is text-only unless this file names a photo for
it.** Strategy §2's media ladder already blesses this — rung 3, *"a sharp
text-only tweet beats a decorative tile every time"* — and it is a planning call,
not a strategy change. It halves photo consumption to 7 slots a week against a
10-photo library, which is the only arrangement where **no photograph repeats
inside 7 days**. The per-day photo assignments in the ledger below are built on
exactly that and are checked: every repeat is ≥7 days apart.

This is a workaround, not a fix. The fix is more photographs — filed as this
week's ask of Marjorie, and written into `social/lessons.md` as **L001**, the
ledger's first rule.

---

## ⛔ OPEN INCIDENT — the 48h approval sweep is still eating approved posts

Unchanged from last week and **it cost another post**: `2026-09-16-runway-
behind-the-data-ig.json` was founder-approved 09-15 17:02Z, never posted, and was
swept to `social/failed/` with the 48h reason. Its X sibling
(`2026-09-16-runway-behind-the-data-x.json`) is **still sitting in
`social/queue/` carrying a valid signed approval** — the poster is not clearing
the queue on success or on sweep. Filed as **#4296** (open, unanswered since
09-14). **#4220** — the `social-poster` queue-state PR — has been red since 09-13
(HA #81).

Planning consequence: **The Runway ends September 0 of 2.** Its window closed
09-16; strategy §1(b) says a window that does not draft is dropped, not slid.
October's Runway window (10-11→15) is its next chance and falls outside this
calendar.

**Tree may not touch `social/queue/`, `social/failed/` or `scripts/`.** Nothing
above is fixable from this file.

---

## ⚠️ 09-21 is half-covered — read this before drafting today

PR **#4471** is **open and unmerged**. It holds
`social/queue/2026-09-21-shop-the-look-callback-ig.json`, **already
founder-approved**, photo `fearless-inglewood-2023`. Its X sibling was **❌'d**
for image reuse and is not in any branch.

- **Do NOT re-draft the 09-21 IG item.** It exists and it is approved.
- **Do draft the X sibling**, text-only, same `campaign`
  (`launch:shop-the-look:callback`) and same `scheduledAt` (`2026-09-21T23:00Z`).
- If #4471 has been closed rather than merged by the time the drafter reads this,
  the whole pair is dead — do not resurrect it. The arc ends 3 of 4 and 09-21
  becomes an empty slot, which beats a rushed replacement.

## ✅ Photo availability — the inventory is the binding constraint

Ten credited photographs, one per era except lover (two). **No credited photo
exists for `midnights`, `ttpd`, or `tloas`** — a story needing one of those
cannot carry an era-matched tile. Never substitute an era tile; pick a different
story or accept a non-matching credited photo and don't let the caption claim
era relevance it doesn't have.

⚠️ `photoId` is mandatory on every `mediaKind: "photo"` draft, and `altText[]`
must copy the library entry's `alt` **verbatim**.

## The carousel shape — how a thread or mood beat legally shows the site

`mediaKind: "site-screen"` is dead outside `launch:`. But a **`mediaKind:
"photo"` item may carry extra slides**, and only `media[0]` is prefix-checked
(`check-drafts.mjs:603-616`). So:

> **`mediaKind: "photo"` · `media[0]` = a cleared Taylor photo (the grid tile)
> · `media[1]` = the product screenshot.**

- **Slide 2 burns its own repeat window.** Used inside 14 days and therefore
  **burned this fortnight:** `thread-love-story-screen.png` (09-19).
  **Free:** `thread-taylors-version-screen.png`, `thread-the-proposal-screen.png`,
  `thread-hidden-clues-screen.png` (last used 09-05, clear), `mood-chat-screen.png`,
  `mood-feature.png`, `thread-fashion-screen.png` (staged 09-16 but that item
  never posted, so it is unburned).
- **"Cool feature only" (Joey, 2026-09-01, strategy §2).** A screenshot must show
  a thread lens, Mood, Clownbot or the shoppable "seen on Taylor" surface **in
  actual use** — never a landing page or an empty state. No cool visual → drop
  the slide and ship the photo alone. Say so in `why`.

## How to read a slot

- **One beat a day, at `23:00Z`.** `MAX_POSTS_PER_RUN = 1` and
  `MAX_POSTS_PER_PLATFORM_PER_DAY = 1` (`scripts/social/lib/queue.mjs:61-62`,
  re-verified this run). Strategy §2 still says two beats a day; that mismatch
  has been raised twice with no answer and is **not re-asked this week** — the
  code wins and this calendar plans one.
- **Every beat is ONE pair: one Instagram item + one X item** sharing a
  story-unique `campaign` and `scheduledAt`, written platform-native, >20%
  divergent in copy. No single-platform exceptions (Joey, 2026-08-26: *"Always an
  IG copy. Always."*).
- **X is text-only unless a slot below names an X photo.** See the change block
  at the top. X `site-screen` is permanently prohibited either way.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label is a FAMILY.** Mint the story-unique value shown — a
  reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270; the
  checker hard-fails at 280. Losing the image gives the words no extra budget.
- **Share-design pass** (strategy, 2026-09-01): every `heartbeat:` and `mood:`
  caption needs one genuine tag/share hook grounded in the actual content. Thread
  and launch posts are exempt. Never bolt on a fake one; say so in `why`.
- **Read `social/lessons.md` before drafting.** L001 is active and binding.

---

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-09** (`monthNumber` = 1) → **2026-10** (`monthNumber` = 2) inside this window |
| September windows + angles (`angle = ANGLES[(1 + threadIndex) % 5]`) | Decode 09-01→05 `single-best-item` · Clue Web 09-06→10 `interactive-challenge` · Runway 09-11→15 `behind-the-data` · Blank Spaces 09-16→20 `quiz-poll` · **Taylor's Version 09-21→25 `origin-story`** · **End Game 09-26→30 `single-best-item`** |
| **October windows + angles** (`monthNumber` = 2) | **Decode 10-01→05 `interactive-challenge`** · Clue Web 10-06→10 `behind-the-data` · Runway 10-11→15 `quiz-poll` · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| Thread progress, September | Decode **1 of 2** (closed short). Clue Web **2 of 2 ✅**. Runway **0 of 2 ❌** — both halves of its only slot died in the sweep incident above; window closed, dropped not slid. Blank Spaces **2 of 2 ✅** (09-19 + 09-20 both shipped). Taylor's Version **2 slots planned** (09-22, 09-25). End Game **2 slots planned** (09-26, 09-29). |
| Thread progress, October | Decode **2 slots planned** (10-02, 10-04). Clue Web's window (10-06→10) is the **first reservation of the calendar written 2026-09-28**. |
| Lens IDs (verified `packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (verified `packages/experience/src/deepLink.ts:34`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **`/?mode=mood` is real** — the drafter opens it once and confirms it lands on Mood before using it; fall back to `longlivets.com` + "tap Mood" if not. `?mood=` is still not a thing. |
| **Launch arc closing** | **`launch:shop-the-look`** — announce 09-12 ✅, how-to 09-15 ✅, example 09-18 ✅, **callback 09-21 (IG approved in #4471, X to re-draft text-only)**. The optional +14 beat runs **only** if real replies exist to quote with permission; none exist as of this run, so it is **skipped silently**, not carried forward. |
| **Launch arc starting 09-28** | **`launch:community-engine`** — the Clownbot fan-theory chip (#3965) and the Clue Web live-theory board with origin badges and a "Live now" strip (#3964), merged 2026-09-07. Code confirmed present this run (`ClownChat.tsx`, `clown-starters.ts`, `LiveTheoryCard.tsx`, `TheoryGuide.tsx`). **Day 0 does not draft until the drafter has opened www.longlivets.com and seen BOTH surfaces render for real** — invariant 6. If either does not, that day falls back to `heartbeat:` and the arc waits for the next calendar. Beats in this window: announce 09-28, how-to 10-01, example 10-03. The +8 callback lands 10-06 and is the **second reservation of the calendar written 2026-09-28**. |
| Launch backlog (order unchanged behind Community Engine) | notifications + web push (#3568→#3583) → pinch-zoom photo viewer (#831) → photos + focal program (#762). |
| No new user-visible ship this week | Every PR merged 2026-09-14→09-21 was ops/infra, agent routines, or Vault media backfill (#4396–#4403 are content repairs, explicitly not a launch trigger). #4397 and #4401 are bug fixes a fan would not notice unannounced. No launch trigger fired; the backlog governs. |
| ❓ Android status — **asked again this week, deliberately** | Open four runs. `HUMAN-ACTIONS.md` #17 records the device test as "the only thing left **before** Play Store"; PR #3534 calls it "the shipped Android app". **Barred under invariant 6 until a founder confirms.** Asked this week as a yes/no so it closes either way — a yes is the biggest launch story available; a no means Tree stops asking. |
| Mood beat | **September = `mood:chip-poll`, 0 of 2 shipped** — the 09-14 slot never drafted. One September slot left (**09-23**). **October = `mood:result`**, the strongest format, slot 1 of 2 on **10-03**; slot 2 belongs to the next calendar. **Mood has never shipped a single post in this desk's existence** — it is one of the three gaps this desk was created to close, and it is the one still open. |
| **Blank Spaces relationship timeline — permanent weekly minimum** | Week of 09-21: **09-24**, `timeline:love-story:joe-jonas-era:2026-09-24`. Week of 09-28: **09-30**, `timeline:love-story:chapter-3:2026-09-30`. Chapter sequence: early solo years ✅ (09-17) → Joe Jonas era → next confirmed public relationship-era chapter → Travis. Confirmed-only; no rumor-stage claim, ever. |
| Openers — last 14 days | **14 distinct patterns across 14 posts.** Target is ≥12 in 14 days — **cleared, and up from 8 of 10 last week.** The formula loop stays dead. **Burned, do not reuse verbatim or near:** *"i still think about …"* · *"3 videos. zero words."* · *"you know the/when …"* (both halves of the 09-12 pair — a sibling pair sharing its first two words is a near-miss on the structural-difference gate) · *"i keep sending people to …"* · *"consider this your permission …"* · *"this is taylor in 2007"* · *"every love story has a …"* · *"that ivory gown from the …"* · *"ever lose an hour …"* · *"pick one, and you're not …"* · *"two of her most …"* · *"five weeks. that's the whole …"* · *"barely a month together …"* · *"an honest question" / "genuine question"* · bare `<month> <n>, <year>:` date-stamps. **NB: the scorecard still does not compute this number** (#4297, open) — counted by hand from `social/posted/` bodies. |
| Photos used, last 14 days (all 10 in the library) | 1989 09-20 · debut 09-17 · evermore 09-18 · fearless 09-17 · folklore 09-19 · lover-minneapolis 09-09 · lover-act5 *(none in window)* · red 09-20 · reputation 09-18 · speaknow 09-19. **Every entry except `lover-minneapolis-act5-2023` shipped inside the window.** This is the constraint the change block at the top exists to route around. |
| Media mix, last 14 days | **14 photo / 14 media-carrying = 100%**, target ≥70% ✅. IG grid: 7 of 7 IG posts carried a real Taylor photo ✅. Zero era tiles, zero undeclared media. The gate is holding; the *variety* is not. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel — but **12 Reddit replies were completed this week** through the Discord approval queue (scorecard `redditRepliesDone`, median answer 4h36m). The counter above tracks the wrong channel. Until the promo threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Never supplied**, four months running. **Not re-asked this week** — monthly cadence, next due in the October run. |
| Founder tasks | **#4294 (09-14) and #3990 (09-07) are both open, 0 ticked. Four consecutive weeks, zero completions, including the week it was cut to a single 4-minute ask.** Meanwhile the founder answered 14 Discord approvals and 12 Reddit prompts in the same week. The issue channel is not being read as a work queue; the Discord channel is. Raised as this week's first question. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see; 15 posts shipped 09-14→09-21, which is positive evidence the freeze is off. *(The repo-variables API returns 403 to this runner's token, so `SOCIAL_FREEZE` was verified from live posting, not read directly.)* |

### Photo assignment — read this off, then verify

Built to guarantee **no photograph repeats inside 7 days**. Run
`npm run social:select-photo` to copy the exact `photoId`, path, credit, source
and `alt`; if a day slips or a slot is dropped, **re-derive from
`social/posted/` rather than sliding this table down**.

| Day | IG tile | Gap since last use |
|---|---|---|
| 09-21 | *(already drafted in #4471 — `fearless-inglewood-2023`)* | — |
| 09-22 | `lover-minneapolis-act5-2023` | >14d |
| 09-23 | `lover-minneapolis-2023` | 14d |
| 09-24 | `debut-acoustic-2007` | 7d |
| 09-25 | `fearless-inglewood-2023` | 8d |
| 09-26 | `evermore-inglewood-2023` | 8d |
| 09-27 | `speaknow-inglewood-2023` | 8d |
| 09-28 | `reputation-inglewood-2023` | 10d |
| 09-29 | `folklore-inglewood-2023` | 10d |
| 09-30 | `red-inglewood-2023` | 10d |
| 10-01 | `1989-inglewood-2023` | 11d |
| 10-02 | `lover-minneapolis-act5-2023` | 10d |
| 10-03 | `lover-minneapolis-2023` | 10d |
| 10-04 | `debut-acoustic-2007` | 10d |

---

## 2026-09-21 (Mon) — 🚀 Launch arc +9 (callback, closes the arc) · Tree run day

- **`23:00Z` · `launch:shop-the-look:callback`** — **X SIBLING ONLY.** The IG
  half is approved and waiting in PR #4471; do not re-draft it, do not touch it.
  Mint exactly `launch:shop-the-look:callback`, `scheduledAt`
  `2026-09-21T23:00:00Z`, link `/?mode=merch`.
  **Text-only** — this is the whole point of the rejection. No photo, no
  `mediaKind`.
  Job: tie the surface to a fan use-case and **invite a reply** — "which era's
  closet would you actually raid?". Hook: **the honest question**, in fresh
  wording (the phrase "an honest question" is burned). It must read >20% distinct
  from the IG body already in #4471 — read that file first.
  **Assert no item or era count.** The code comment says 156 `shopTheLook` items,
  the old ledger said 100, and nobody has reconciled them.

## 2026-09-22 (Tue) — Taylor's Version hero, slot 1 of 2 (window 09-21→25)

- **`23:00Z` · `thread:taylors-version:origin-story`** — mint
  `thread:taylors-version:origin-story:2026-09-hero`. Link `/?lens=taylors-version`.
  Angle `origin-story`: what this thread **is**, and the one moment that made it
  worth building. Not a re-recording explainer for people who already know — the
  moment.
  IG media: `lover-minneapolis-act5-2023` + **`thread-taylors-version-screen.png`**
  slide 2 (it must show the lens in use). The Lover-era tile is deliberate, not a
  fallback: the re-recording story begins in that era, so the photo and the
  subject genuinely line up — say so in the caption's photo line.
  X: **text-only.** Hook: **direct address**.

## 2026-09-23 (Wed) — Mood beat, September slot 2 of 2 · the last September chance

- **`23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-b`.
  **This is the one that has to land.** September's first Mood slot (09-14) never
  drafted, and Mood has never shipped a post at all. If this slot is empty
  tomorrow, September closes with Mood at zero for the second month running.
  Link **`/?mode=mood`** if it verifies, else bare `longlivets.com` + "tap Mood".
  X: three starter chips quoted **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, quote exactly, never
  reword — then "which one is you today". **Text-only.**
  IG sibling: the same three chips in the caption, `lover-minneapolis-2023` tile +
  **`mood-feature.png`** slide 2 only if it shows Mood mid-use; else photo-only.
  **Pick chips whose real results come from scored eras.** evermore, Midnights,
  TTPD and TLOAS are **not scored** — never promise or imply songs from them.
  **Share hook required** — "which one is you, tag the other one".
  Hook: **direct address**; the X and IG openers must not share their first five
  words.

## 2026-09-24 (Thu) — Blank Spaces relationship timeline, week of 09-21

- **`23:00Z` · `timeline:love-story:joe-jonas-era:2026-09-24`** — the weekly
  timeline minimum. Link `/?lens=love-story` with standard UTM parameters.
  **Direction, not copy:** advance the chronology one chapter from 09-17's early
  solo years. **Confirmed, publicly documented material only** — what was
  publicly acknowledged at the time and what she has said about it on the record
  since. No speculation about anyone's private life, no rumor-stage claim,
  nothing about people who are not public figures in this story. If the Vault
  carries no confirmed anchor for this chapter, **skip to the next chapter that
  has one rather than reaching** — an empty slot beats an unsourced one.
  IG media: `debut-acoustic-2007`, photo-only (era-right for the chapter).
  X: **text-only.** Hook: **the number** (a date, a gap, a count).

## 2026-09-25 (Fri) — Taylor's Version, slot 2 of 2 (window closes today)

- **`23:00Z` · `thread:taylors-version:origin-story`** — a second story-unique
  value: `thread:taylors-version:origin-story:2026-09-vault`. Link
  `/?lens=taylors-version`. A different entry point into the same angle: the
  single vault track the thread treats best, or the one re-recording detail that
  surprised us — **never a retelling of 09-22**.
  IG media: `fearless-inglewood-2023`, photo-only (the lens screenshot burned on
  09-22). X: **text-only.** Hook: **the artifact** — open with what the image is.
  **Window-bound**: drop rather than slide.

## 2026-09-26 (Sat) — End Game hero, slot 1 of 2 (window 09-26→30)

- **`23:00Z` · `thread:the-proposal:single-best-item`** — mint
  `thread:the-proposal:single-best-item:2026-09-hero`. Link `/?lens=the-proposal`.
  Angle `single-best-item`: one item from the thread, told whole. The thread is
  the byline, not the subject. **Confirmed material only** — this lens sits
  closest to the blocklist, so anything not settled public fact does not go in.
  IG media: `evermore-inglewood-2023` + **`thread-the-proposal-screen.png`**
  slide 2 (it must show the lens in use, not an empty state).
  X: **text-only.** Hook: **the artifact**.

## 2026-09-27 (Sun) — Heartbeat · the lost speak-now beat, second attempt

- **`23:00Z` · `heartbeat:era-deep-cut`** — mint
  `heartbeat:era-deep-cut:speak-now-million-week-2026-09-27`. **A new
  story-unique value**, because the 09-13 original died in `social/failed/` and is
  not requeuable from here. This is the **only heartbeat slot in the fortnight**.
  Link `/?era=speak-now`. IG media: `speaknow-inglewood-2023`, photo-only,
  era-matched. X: **text-only.**
  Subject direction: the Speak Now week-one sales record and the
  written-entirely-alone credit. **Source both against the Vault
  (`supabase/seed/content/speak-now.mjs`) and keep the "14 standard-edition
  tracks" qualifier** — the unqualified "wrote it alone" claim overstates the
  source, which a review caught on the original draft.
  **Share hook required** (heartbeat), grounded in the real no-co-writers detail.
  Hook: **the contradiction**. The original caption never shipped but is on file
  in `social/failed/` — read it, then **do not reopen with its first line.**

## 2026-09-28 (Mon) — 🚀 Community Engine arc, day 0 (announce) · Tree run day

- **`23:00Z` · `launch:community-engine:announce`** — mint exactly that.
  **Gate first:** open www.longlivets.com and confirm the Clownbot fan-theory
  chip AND the Clue Web live-theory board both render for real. If either does
  not, **do not draft this** — fall back to a `heartbeat:` beat and say so in the
  PR body. Invariant 6 is not negotiable.
  Link: `/?mode=clownbot` for the theory chip, `/?lens=easter-eggs` for the
  live-theory board — pick whichever surface the post actually leads with, and
  verify the deep link resolves before using it.
  Job per strategy §1(a): **one line on what a fan can now do** — not "we
  shipped", but "here's the thing you can now do". Name the real behaviour you
  saw on screen; assert no counts.
  IG media: `reputation-inglewood-2023` tile. Slide 2 only if a committed
  screenshot genuinely shows one of these surfaces in use —
  `feature-quote-demo-theory.png` is a candidate, **look at it before trusting
  the filename**; if it shows anything less than the real thing mid-use,
  photo-only. X: **text-only.** Hook: **direct address**.

## 2026-09-29 (Tue) — End Game, slot 2 of 2 (window closes 09-30)

- **`23:00Z` · `thread:the-proposal:single-best-item`** — a second story-unique
  value: `thread:the-proposal:single-best-item:2026-09-second`. Link
  `/?lens=the-proposal`. A **different** item from 09-26's, told whole — never a
  restatement. Same confirmed-only bar.
  IG media: `folklore-inglewood-2023`, photo-only (the lens screenshot burned on
  09-26). X: **text-only.** Hook: **the contradiction**.
  **Window-bound**: drop rather than slide.

## 2026-09-30 (Wed) — Blank Spaces relationship timeline, week of 09-28

- **`23:00Z` · `timeline:love-story:chapter-3:2026-09-30`** — the weekly timeline
  minimum. Link `/?lens=love-story` with standard UTM parameters.
  **Direction, not copy:** advance one chapter from 09-24. **Rename the campaign
  value's `chapter-3` segment to the actual chapter slug the drafter lands on**
  (it stays story-unique either way) and record it in `why` so the 10-05 calendar
  can continue the sequence.
  Same hard bar as every beat in this series: confirmed, publicly acknowledged
  material only; no speculation, no rumor frame, no private individuals. If the
  Vault carries no confirmed anchor, **skip forward to a chapter that does.**
  IG media: `red-inglewood-2023`, photo-only. X: **text-only.**
  Hook: **the real quote** — a sourced, on-the-record line as the first line,
  attributed after. Not the number hook again (09-24 has it).

## 2026-10-01 (Thu) — 🚀 Community Engine +3 (how-to)

- **`23:00Z` · `launch:community-engine:how-to`** — mint exactly that.
  Only draft this if 09-28's day 0 actually shipped; if it didn't, this slot
  becomes a `heartbeat:` beat instead and the arc waits.
  Job: **literally where to tap.** Assume the reader has never found it — how you
  reach the surface, what happens when you tap, what you get back.
  IG media: `1989-inglewood-2023` tile; slide 2 only if a real in-use screenshot
  exists (see 09-28). X: **text-only.** Hook: **the challenge**.

## 2026-10-02 (Fri) — The Decode hero, slot 1 of 2 (October window 10-01→05)

- **`23:00Z` · `thread:hidden-clues:interactive-challenge`** — mint
  `thread:hidden-clues:interactive-challenge:2026-10-hero`. Link
  `/?lens=hidden-clues`. **October's angle index, not September's** — the cycle
  month advances here.
  Angle `interactive-challenge`: *"open it and find the one where ___ — reply
  with what you got."* Name a real, findable thing in the thread; verify it is
  actually there before writing the challenge.
  IG media: `lover-minneapolis-act5-2023` + **`thread-hidden-clues-screen.png`**
  slide 2 (last used 09-05, clear of the window; it must show the lens in use).
  X: **text-only** — and on a challenge post the reply-bait carries itself.
  Hook: **the challenge**.

## 2026-10-03 (Sat) — 🚀 Community Engine +5 (example) · **or** Mood, October slot 1

- **`23:00Z`** — **two campaigns want this slot; the drafter picks one, not both.**
  - **Preferred: `mood:result`** — mint `mood:result:2026-10-a`. October's Mood
    format rotates to "what it gave me", the strongest one, *because it proves the
    thing works.* One starter chip quoted **verbatim** in the caption, the
    **real** returned songs as slide 2 (`mood-chat-screen.png` only if it shows an
    actual result on screen — otherwise screenshot the real result yourself is not
    an option here, so go photo-only and put the songs in the caption).
    Scored eras only: no evermore, Midnights, TTPD or TLOAS songs.
    Link `/?mode=mood` or the bare-domain fallback. **Share hook required.**
  - **Only if Mood cannot be drafted:** `launch:community-engine:example` — one
    real result the surface produced, the proof it's good.
  **Mood wins ties.** It has never shipped; the arc's callback is already
  reserved on the next calendar and loses nothing by sliding.
  IG media either way: `lover-minneapolis-2023`. X: **text-only.**
  Hook: **the artifact**.

## 2026-10-04 (Sun) — The Decode, slot 2 of 2 (window closes 10-05)

- **`23:00Z` · `thread:hidden-clues:interactive-challenge`** — a second
  story-unique value: `thread:hidden-clues:interactive-challenge:2026-10-answer`.
  Link `/?lens=hidden-clues`.
  If 10-02's challenge drew real replies, this is the answer beat and quotes them
  (with permission); if it drew none, it is a **different** challenge entirely —
  never a restatement.
  IG media: `debut-acoustic-2007`, photo-only (the lens screenshot burned on
  10-02). X: **text-only.** Hook: **the number**.

---

## What the queue already covers

`social/queue/` holds exactly one item: `2026-09-16-runway-behind-the-data-x.json`,
dated **09-16 — before this window opens**, stranded with a valid approval (see
the incident block). Nothing in `social/queue/` covers a date inside
2026-09-21 → 2026-10-04.

The only in-window coverage is **PR #4471**, open and unmerged, holding the
09-21 IG item. 09-21 above is written as an X-sibling-only slot for exactly that
reason.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks, ≤5 minutes each, paste-ready,
checkboxes.

**2026-09-21 — `founder-task: social reach week of 2026-09-21`** *(filed this
run)* — **exactly one task, ~3 minutes**, and it is the same follow-and-comment
ask as 09-14 because nothing has replaced it. #4294 and #3990 are both open with
zero ticked, four weeks running, so this week the report asks openly whether this
channel should move into Discord instead of being re-filed a fifth time.

**Deliberately not asked this week:** the monthly IG Insights paste (monthly
cadence, next due in October) and any second or third task — the evidence says
adding asks reduces completions, not raises them.

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
