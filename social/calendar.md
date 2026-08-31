# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by the
Growth daily run** (`docs/agents/runner-prompts/growth-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-08-31 → 2026-09-13.**
Written by Tree's run of Monday 2026-08-31.

---

## ⛔ OPEN INCIDENT — a second lane is writing to the queue, and its media bypasses the photo standard

**Issue [#3584](https://github.com/JW-Incorporated/swift2/issues/3584). Needs a
founder. Tree cannot fix any of it — `social/queue/` is outside its write rights.**

`appearance-discovery` (`.github/workflows/appearance-discovery.yml`, decided
2026-08-25) auto-drafts IG+X pairs straight into `social/queue/` from new
official YouTube uploads, with **nobody having watched the video** and no
planning layer. Its items are not in this calendar and Tree did not know the
lane existed until this run. Three things it has put in the live queue:

| Item | Scheduled | What's wrong |
|---|---|---|
| `2026-08-31-appearance-ldBrFonU8NA-{x,ig}` | **08-31 15:00Z / 23:00Z** | Caption *"my whole day is now about Taylor Swift, beyonce and more pay tribute to dolly parton!!"* over a **Good Morning America branded quote card** reading *"A world without Dolly doesn't feel possible, real, or right."* It reads as a memorial and we greet it with two exclamation points. |
| `2026-09-01-appearance-XwCWKSO0F8s-{x,ig}` | 09-01 17:21Z | The IG tile is an **animated tree-and-tire-swing frame with no Taylor in it**, declared `mediaKind: "photo"`. Both siblings share one timestamp, off the slot grid. |
| `2026-09-01-appearance-T6iTnTV-Rgw-{x,ig}` | 09-01 15:00Z / 23:00Z | Image is genuinely Taylor (Icon Sessions still) but letterboxed 16:9 video padding — a weak tile. |

**The gate hole:** `check-drafts.mjs` binds `mediaKind: "photo"` to the
`/social/library/photos/` **path** plus a credit pair. A rehosted YouTube
thumbnail dropped in that folder therefore passes as "a real credited
photograph of Taylor" — even a network-branded typography card, even one with
no Taylor in the frame. This collides with strategy §2 (designed cards are
retired from the feed) and `docs/decisions.md` 2026-08-15 (`photo` must be a
**license-cleared local file**; the Getty comps were deleted for exactly this).

**Until a founder rules:** Tree plans no slot on a date-time an appearance item
already holds (marked *covered by queue* below), so Growth never double-books.

---

## ✅ CLOSED — the Instagram aspect-ratio failure (2026-08-15 → 08-23)

Resolved and re-verified this run by measuring every file. **All 20
`/social/library/` assets are Instagram-legal** (1080×1350, ratio 0.800; the
one exception, `icon-sessions-grammy-museum-piano-screenshot.png`, is 786×937,
ratio 0.839 — also fine). All four cleared photos are legal too.

**Two stale warnings from the last calendar are now retired:** it said
`era-midnights-screen.png` "is 780×1688 and will FAIL" and told the drafter to
avoid `*-screen.png` on Instagram. Both were true of the pre-#3157 captures and
are false now — every `*-screen.png` measures 1080×1350. Draft them freely.

---

## How to read a slot

**Every beat is ONE pair: one Instagram item + one X item sharing a
story-unique `campaign`, written platform-native, >20% divergent in copy.**
`check-drafts.mjs` enforces the pair (an item whose campaign has no sibling on
the other platform fails), so there is no such thing as a lone X slot here.

- **Beat A** `15:00Z` (11am ET) · **Beat B** `23:00Z` (7pm ET), the priority
  window, which is why the campaign sits there.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label below is a FAMILY.** Mint the story-unique value shown —
  a reused bucket value silently kills every later post in it, forever, across
  the whole `social/posted/` history.
- **Direction, not facts.** Every subject is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **On-this-day slots carry a fallback** — a date may have no Vault match.
  Check first, fall back second, say which you used in the `why`.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270;
  the checker hard-fails at 280.
- **An empty IG slot beats a failed one.** No cleared photo sourceable for a
  *photo-only* slot → skip it and say so in the run's PR. Never substitute an
  era tile or a designed card; both are checker-dead.

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-09** (`monthNumber` = 1) |
| September windows + angles (`angle = ANGLES[(1 + threadIndex) % 5]`) | Decode 09-01→05 `single-best-item` · Clue Web 09-06→10 `interactive-challenge` · Runway 09-11→15 `behind-the-data` · Blank Spaces 09-16→20 `quiz-poll` · Taylor's Version 09-21→25 `origin-story` · End Game 09-26→30 `single-best-item` |
| August, closed | Decode ✅ · Clue Web ✅ · Runway ✅ · Blank Spaces ✅ (hero 08-28, X leg 08-30). Taylor's Version + End Game dropped — August's cycle started on the 12th and partial months don't carry over. |
| **Launch arc in flight** | **`launch:shop-the-look` — NEW this run.** The merch / "Seen on Taylor" shop-the-look surface went to production 2026-08-31 ~06:07Z (PR #3577 `D7=C`, plus #3552 JSON-LD, #3480 21 fan-made items, #3573/#3575/#3578 the imageUrl audit to 99/100). Day 0 is **09-02**, the first evening slot ≥24h after live that is not already held by a queued item. |
| Launch backlog (reordered) | **notifications + web push** (Phases 0-6, #3568→#3583, production 2026-08-31 ~08:30Z — genuinely user-visible via `/settings/notifications`, queued behind shop-the-look; two arcs never overlap) → pinch-zoom photo viewer (#831) → photos + focal program (#762) → rumor tier. **Not** the Android app — see the open question below. |
| ❓ Android status — **needs Joey** | `HUMAN-ACTIONS.md` #17 records "Done 2026-08-24 (Joey): tested the EAS build on a real Android phone", and PR #3534 describes "the **shipped** Android app" in the privacy policy. But #17's own text says the device test was "the only thing left **before** Play Store". Tree cannot tell from the repo whether the app is actually listed. **It stays barred (invariant 6) until a founder confirms.** If it is live, it is the strongest launch story in the backlog. |
| Mood beat | **2026-09 = the first standalone beat, format `mood:chip-poll`** (August's was absorbed into `launch:mood-chat`). 3 slots: 09-08, 09-11, 09-13. |
| Openers burned (last 14 days) | **35 distinct patterns across 36 posts** — target ≥12, comfortably clear. Do not reuse, verbatim or near: bare `august <n>, <year>:` date-stamps (08-20, 08-23) · `an honest question` / `honest question` / `genuine question` (08-17, 08-20, 08-22) · `she was twenty` / `she was 22` (08-23, 08-26) · `six weeks at no. 1` · `nine names, era by era` · `her 12th album, twelve songs`. **New formula forming — kill it:** every `appearance-discovery` item opens *"a fresh official Taylor upload just landed from &lt;channel&gt;. i haven't watched yet — come watch with me!!"* That is the 2026-08-11 "did you know" failure returning through a different door, and the one duplicate opener in the window (*"Taylor Swift opens up about songwriting"*, twice on 08-26) came from that lane too. |
| Eras stacked recently — spread away from these | **tloas/showgirl ×3** (08-29, 08-30, 08-31), red ×2, debut ×2, midnights ×2. **Lean on:** speak-now, folklore, evermore, 1989, ttpd, reputation, lover. |
| **Cleared-photo corpus — 4 files** | Grown by one since last run. All CC, all rehosted under `/social/library/photos/`, all Instagram-legal. Two were flagged unverified last week and **both were visually confirmed correct this run**. <br>• `taylor-lover-eras-minneapolis-2023.jpg` (lover) — Michael Hicks, CC BY 2.0, Wikimedia Commons — 1280×964 <br>• `taylor-red-eras-inglewood-2023.jpg` (red) — Paolo Villanueva, CC BY 2.0, Wikimedia Commons — 1080×1350 <br>• `taylor-fearless-eras-inglewood-2023.jpg` (fearless) — Paolo Villanueva, CC BY 2.0, Wikimedia Commons — 1080×1350 — ✅ **verified this run**: gold fringed sequin dress, the Fearless act of the Eras Tour. Correctly labelled. <br>• `taylor-debut-2007-acoustic.jpg` (debut) — Brian Cantoni, CC BY 2.0, Wikimedia Commons — 1280×1283 — ✅ **verified this run**: young Taylor, sunglasses, white dress, koa Taylor acoustic, daytime outdoor set. Correctly labelled. <br>**The `appearance-*.jpg` files in the same folder are NOT part of this corpus** — they are rehosted YouTube thumbnails, not license-cleared, and one contains no Taylor at all (see the open incident). Never plan one. <br>To grow it: **CC BY / CC BY-SA / CC0 / public-domain only**, from `commons.wikimedia.org` (never the `/wikipedia/en/` fair-use path), rehost, record `mediaCredit` + `mediaSource` — **and open the downloaded file and confirm the era before committing.** A Commons filename claiming an era is not proof (#3273: 4 of 4 sampled "Folklore Set Era" files were actually Speak Now). |
| ⚠️ Media-mix arithmetic | Last 14 days: **12 media-carrying posts, 3 of them `photo` = 25%** against a ≥70% target. The Instagram grid alone is **3 photo / 7 site-screen = 30%**. This is not drafter laziness — with **4** cleared photos and ~16 Instagram slots a fortnight, the ceiling is ~25%. **The target is arithmetically unreachable until the corpus grows.** Growing it is the single highest-value unblock in the whole lane. |
| Reddit non-promo contributions | **0 / 20.** Last week's founder-task issue [#2313](https://github.com/JW-Incorporated/swift2/issues/2313) is still open with no boxes ticked and no comments. Every Reddit task stays a zero-link contribution until this hits 20 (growth-plan §7). |
| IG Insights | **Never supplied.** #2313 asked for the 30-day screenshot; it did not arrive, so the 2026-08 review below cannot name the top 3 posts. Re-asked this week. |
| Crisis stop | **Not active** — no founder "stop posting" in issues or PR comments, and `SOCIAL_FREEZE` is evidently unset (the poster shipped items on 08-31). |

---

## 2026-08-31 (Mon) — Tree run day · August closes

- **Beat A `15:00Z` — covered by queue** (`appearance:ldBrFonU8NA`, X).
- **Beat B `23:00Z` — covered by queue** (`appearance:ldBrFonU8NA`, Instagram).

**Plan nothing today.** Both beats are held by queued items. If a founder
removes them per #3584, Growth may draft **one** replacement pair at `23:00Z`:
`heartbeat:era-deep-cut` → mint `era-deep-cut:speak-now-<slug>` on `speak-now`,
link `/?era=speak-now`. IG media: `taylor-lover-eras-minneapolis-2023.jpg`
(`photo`, credit Michael Hicks / CC BY 2.0 / Wikimedia Commons). X: text-only.
Hook: **the contradiction**.

## 2026-09-01 (Tue) — The Decode window opens

- **Beat A `15:00Z` — covered by queue** (`appearance:T6iTnTV-Rgw`, X).
- **Beat B `23:00Z` — covered by queue** (`appearance:T6iTnTV-Rgw`, Instagram).
- Also held: `17:21Z`, both platforms (`appearance:XwCWKSO0F8s`).

**Plan nothing today.** Three queued items already exceed the day's normal
volume. The Decode window opens but its beats sit on 09-03 and 09-05.

## 2026-09-02 (Wed) — 🚀 Launch arc day 0

- **Beat A `15:00Z` · `heartbeat:era-deep-cut`** — mint
  `era-deep-cut:lover-<slug>` on `lover`. Link `/?era=lover`.
  IG media: **`photos/taylor-lover-eras-minneapolis-2023.jpg`** (`photo`;
  `mediaCredit` "Michael Hicks (CC BY 2.0), via Wikimedia Commons",
  `mediaSource` the Commons file URL — both required or the checker rejects it).
  X: text-only. Hook: **the artifact** — start with what the image is.
- **Beat B `23:00Z` · `launch:shop-the-look:announce`** — mint exactly
  `launch:shop-the-look:announce`. Link `/?lens=fashion` (The Runway is where
  shop-the-look lives editorially). The section anchor is `#merch-style` —
  **verify it resolves on the live site before using it as the primary link**;
  fall back to `/?lens=fashion` if not.
  Job: *not* "we shipped" — "here's the thing you can now do": tap the picture
  of a look and go buy it. IG media: a cleared photo tile
  (**`photos/taylor-red-eras-inglewood-2023.jpg`**, `photo`, Paolo Villanueva /
  CC BY 2.0 / Wikimedia Commons), with a freshly captured 1080×1350 screenshot
  of the "Seen on Taylor" section as **slide 2 if one is committed** — no merch
  asset exists in `/social/library/` yet, so **photo-only is the correct fallback,
  not a blocker**. X: text-only or the same photo; **never a `site-screen` on X**
  (permanently prohibited). Hook: **direct address**.

## 2026-09-03 (Thu) — The Decode hero

- **Beat B `23:00Z` · `thread:hidden-clues:single-best-item`** — mint
  `thread:hidden-clues:single-best-item:2026-09-hero`. Link `/?lens=hidden-clues`.
  IG media: **`/social/library/thread-hidden-clues-intro.png`** (`site-screen`,
  1080×1350 — the thread page is a product surface, the one subject that
  legitimately earns a screenshot). X: text-only, or
  `thread-hidden-clues-screen.png` is fine **on X**.
  Angle is `single-best-item`: tell **one** clue→payoff pair whole, from the
  inside. The thread is the byline, named once at the end with the link — not
  the subject. Hook: **the artifact**.

## 2026-09-04 (Fri) — 🚀 Launch arc +2

- **Beat B `23:00Z` · `launch:shop-the-look:how-to`** — mint exactly that.
  Link `/?lens=fashion`. Job: **literally where to tap.** Assume the reader has
  never found it — which era pages carry looks, what the tile does when you tap
  it, what "Her look, not the product" means when it appears.
  IG media: **`photos/taylor-fearless-eras-inglewood-2023.jpg`** (`photo`, Paolo
  Villanueva / CC BY 2.0 / Wikimedia Commons), with the tap-path screens as
  later carousel slides **if captured**; photo-only otherwise. X: text-only.
  Hook: **the challenge** — "open any era page and find one."

## 2026-09-05 (Sat) — The Decode, second angle

- **Beat A `15:00Z` · `heartbeat:on-this-day`** — check the Vault for a moment
  dated Sep 5; mint `on-this-day:<story-slug>`. **Fallback** if the date has no
  match: `heartbeat:era-deep-cut` on `red` → `/?era=red`, mint
  `era-deep-cut:red-<slug>`. Either way IG media:
  **`photos/taylor-red-eras-inglewood-2023.jpg`** (`photo`, Paolo Villanueva /
  CC BY 2.0 / Wikimedia Commons). X: text-only. Hook: **the number**. Say in the
  `why` which branch you took.
- **Beat B `23:00Z` · `thread:hidden-clues:single-best-item`** — a **second,
  different** story-unique value: `thread:hidden-clues:single-best-item:2026-09-challenge`.
  Link `/?lens=hidden-clues`. A structurally different entry point into the same
  angle — never a truncation of Wednesday's hero, >20% divergence. IG media:
  **`thread-hidden-clues-screen.png`** (`site-screen`). X: text-only.
  Hook: **the honest question**, but not the words "an honest question" or
  "genuine question" (all burned).

## 2026-09-06 (Sun) — 🚀 Launch arc +4 · The Clue Web window opens

- **Beat B `23:00Z` · `launch:shop-the-look:example`** — mint exactly that.
  Link `/?lens=fashion`. Job: **one real result the surface produced** — a
  single look, the item, where it goes when you tap it. The proof it's good.
  Pick a look from an era **other than** tloas/showgirl (stacked ×3 last week).
  IG media: a cleared photo tile not used since 09-04 — prefer
  **`photos/taylor-debut-2007-acoustic.jpg`** (`photo`, Brian Cantoni / CC BY
  2.0 / Wikimedia Commons) if the look suits it, else reuse the lover tile;
  a screenshot of that actual result as slide 2 if committed. X: text-only.
  Hook: **the artifact**.

## 2026-09-07 (Mon) — The Clue Web hero · Tree run day

- **Beat B `23:00Z` · `thread:easter-eggs:interactive-challenge`** — mint
  `thread:easter-eggs:interactive-challenge:2026-09-hero`. Link
  `/?lens=easter-eggs`. IG media:
  **`/social/library/thread-easter-eggs-intro.png`** (`site-screen`, 1080×1350).
  This asset shipped 08-17 — confirm it is outside the last-10-posted-IG repeat
  window before using it. X: text-only, or `thread-easter-eggs-screen.png`.
  Angle is `interactive-challenge`: name **one specific thing** to go find in
  The Clue Web and ask for the answer in replies. Hook: **the challenge**.

## 2026-09-08 (Tue) — Mood beat 1/3

- **Beat B `23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-a`.
  Link: **bare `longlivets.com` + "tap Mood"**. Never write a `?mood=` URL; it
  does not exist. This is the only campaign allowed a bare-domain link.
  X: three starter chips quoted **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` (approved copy — quote exactly, never
  reword), then "which one is you today". IG sibling: the same three chips in
  the caption, media **`/social/library/mood-feature.png`** (`site-screen`,
  1080×1350) — last used 08-19, check the repeat window.
  **Pick chips whose real results come from scored eras.** evermore, Midnights,
  TTPD and TLOAS are **not scored** — never promise or imply songs from them.
  Hook: **direct address**.

## 2026-09-09 (Wed) — The Clue Web, second angle

- **Beat A `15:00Z` · `heartbeat:era-deep-cut`** — mint
  `era-deep-cut:fearless-<slug>` on `fearless`. Link `/?era=fearless`.
  IG media: **`photos/taylor-fearless-eras-inglewood-2023.jpg`** (`photo`, Paolo
  Villanueva / CC BY 2.0 / Wikimedia Commons). X: text-only.
  Hook: **the real quote** — a sourced quote first, attribution second.
- **Beat B `23:00Z` · `thread:easter-eggs:interactive-challenge`** — a second
  story-unique value: `thread:easter-eggs:interactive-challenge:2026-09-find`.
  Link `/?lens=easter-eggs`. IG media: **`thread-easter-eggs-screen.png`**
  (`site-screen`). X: text-only. A different find from Monday's, >20%
  divergence. Hook: **the number**.

## 2026-09-10 (Thu) — 🚀 Launch arc +8 (callback, closes the arc)

- **Beat B `23:00Z` · `launch:shop-the-look:callback`** — mint exactly that.
  Link `/?lens=fashion`. Job: tie it to a fan use-case and **invite a reply** —
  "which era's closet would you actually raid?" IG media: a cleared photo tile,
  whichever is furthest from its last use. X: text-only. Hook: **the honest
  question** (fresh wording — the phrase itself is burned).
  The optional +14 "what you did with it" post runs **only** if real replies
  exist to quote with permission; skip silently otherwise, and it is next
  Tree run's call, not Growth's.

## 2026-09-11 (Fri) — Mood beat 2/3 · The Runway window opens

- **Beat B `23:00Z` · `mood:chip-spotlight`** — mint
  `mood:chip-spotlight:2026-09`. Link: bare `longlivets.com` + "tap Mood".
  The chip lives in the **caption, not the image** — one chip quoted verbatim,
  and the fan-recognition beat that says *we know you*. IG media: a **cleared
  photo** tile, era matched to the chip's mood (this format is explicitly a
  photo tile since 2026-08-12, never a designed card). X sibling: text-only, a
  different way into the same chip. Do not name evermore / Midnights / TTPD /
  TLOAS songs as results. Hook: **direct address**.

## 2026-09-12 (Sat) — The Runway hero

- **Beat B `23:00Z` · `thread:fashion:behind-the-data`** — mint
  `thread:fashion:behind-the-data:2026-09-hero`. Link `/?lens=fashion`.
  IG media: **`/social/library/thread-fashion-intro.png`** (`site-screen`,
  1080×1350). X: text-only, or `thread-fashion-screen.png`.
  Angle is `behind-the-data`: how many looks are in The Runway, how they're
  sourced, and the one thing that surprised us building it. **Count them against
  the real thread before writing — do not estimate.** Now that shop-the-look is
  live, the honest new number is how many of those looks are tappable; count
  that too rather than asserting it. Hook: **the number**.

## 2026-09-13 (Sun) — Mood beat 3/3

- **Beat A `15:00Z` · `heartbeat:era-deep-cut`** — mint
  `era-deep-cut:debut-<slug>` on `debut`. Link `/?era=debut`.
  IG media: **`photos/taylor-debut-2007-acoustic.jpg`** (`photo`, Brian Cantoni
  / CC BY 2.0 / Wikimedia Commons). X: text-only. Hook: **the contradiction**.
- **Beat B `23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-b`.
  A **different** three chips from 09-08, quoted verbatim. Link: bare
  `longlivets.com` + "tap Mood". IG media: **`mood-chat-screen.png`**
  (`site-screen`, 1080×1350). X: text-only. Same scored-era constraint.
  Hook: **the contradiction**.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks each, ≤5 minutes each,
paste-ready, checkboxes. Roughly 15 minutes of Joey's week, total.

**2026-08-31 — `founder-task: social reach week of 2026-08-31`** *(filed this run)*

1. **Stop today's Dolly Parton post** — delete two queue files before 15:00Z.
   The one genuinely time-critical item; detail in #3584.
2. **IG Insights screenshot** *(this month's data slot, carried over from
   #2313, which went unactioned)* — the only per-post engagement signal we have.
3. **One r/TaylorSwift contribution**, zero links, paste-ready. (Counter 0 → 1
   of 20.) Cut from three to one because #2313's three are still outstanding —
   piling on a backlog is how the whole lane gets ignored.

**2026-09-07 — next run.** Reserved. Priorities in order: whatever #3584
resolves to, then the Reddit counter, then two Swiftie Facebook groups to join
and read (join and read only, do not post) with each self-promo rule quoted.

---

## Review — 2026-08

**Scorecard, week ending 2026-08-31** (from `scripts/social/weekly-scorecard.mjs`,
verbatim):

- Posts this week: **X 14 · IG 8 · FB 8 (30 total)**
- Follower change (7d, vs 2026-08-24): **IG +0 · X +0 · FB +0**
- Failed posts this week: **5** — target is zero
- Current followers: **IG 3 · X 0 · FB 8** (`social/metrics/2026-08-30.json`)
- Distinct opener patterns, last 14 days: **35 across 36 posts** (target ≥12) ✅
- Media mix, media-carrying posts only: **3 photo / 12 = 25%** (target ≥70%) ❌
- Instagram grid: **3 photo / 10 = 30%** ❌
- Engagement proxy: **0 followers gained per 30 posts published**

**1. The month in one line.** The formula loop that created this desk is dead —
35 distinct openers across 36 posts, and "did you know" has not appeared since
08-10. Every other target was missed.

**2. The three Insights posts.** None. #2313 asked for the 30-day screenshot on
08-24 and it was never supplied, so the single per-post engagement signal in the
system does not exist for August. Re-asked this week as the lightest of three
tasks.

**3. Double down: real photographs of Taylor.** The three days that carried a
cleared photo (08-26, 08-27, 08-28) are the only days the grid looked like a
Taylor Swift fan account rather than a product tour. The corpus grew by exactly
one file in August and now stands at four, which caps the grid at ~25% photo
against a 70% target — the arithmetic, not the drafter, is the blocker. Sourcing
CC-licensed Commons photos is the highest-value work in this lane, and every
week it does not happen is a week of screenshots.

**Drop: captions written from a headline nobody read.** `appearance-discovery`
produced five of August's X posts on 08-26 alone, the window's only duplicate
opener, a repeating "i haven't watched yet — come watch with me!!" formula, and
now a memorial graphic scheduled to ship with exclamation points. The lane's
detection half is good and worth keeping; its **authoring** half should stop
writing captions unsupervised. That is a founder call (#3584), not Tree's.

**4. Rotation state advanced.** September = `monthNumber` 1: Decode
`single-best-item`, Clue Web `interactive-challenge`, Runway `behind-the-data`,
Blank Spaces `quiz-poll`, Taylor's Version `origin-story`, End Game
`single-best-item`. Mood format for September is `chip-poll` (its first
standalone beat). Launch arc `launch:shop-the-look` opens 09-02; notifications
queued behind it.

**5. Needs a founder decision.** Two, both filed rather than decided quietly:
the appearance-lane media and authoring question (#3584), and whether the
Android app is actually listed in the Play Store — if it is, invariant 6 stops
applying and it is the best launch story in the backlog.

**Target check.** The 2026-09-30 goal is **50 Instagram followers**; we are at
**3**, having gained **0** in a week of 30 posts. Nothing in this plan credibly
closes that gap — 28 posts a fortnight to an audience of three is a distribution
problem, not a content problem, and the only distribution lever we have that
touches real Swiftie communities is the ~15 minutes a week of founder reach
tasks, which have not been actioned in the two weeks since they started. That is
the honest read, and it belongs in front of Joey rather than inside a scorecard.
