# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by the
Growth daily run** (`docs/agents/runner-prompts/growth-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-09-07 → 2026-09-20.**
Written by Tree's run of Monday 2026-09-07.

---

## ⛔ THE ONE THING THAT MATTERS THIS FORTNIGHT — Instagram deadlocks after tonight

**Founder decision filed. Until it is answered, almost nothing below can ship,
and no amount of good planning changes that.**

Three rules that are each individually correct now multiply into a hard stop:

1. Every Instagram post must carry a **real cleared Taylor photo as `media[0]`**
   — `site-screen` is rejected on any non-`launch:` campaign, and even on a
   launch campaign the grid tile must still be a photo
   (`check-drafts.mjs:480-499, 582-602`).
2. A media file may not repeat inside the **last 10 posted Instagram items**
   (`ERA_ART_LOOKBACK = 10`; `repeatsRecentIgMedia` flattens *every* slide of
   those 10 posts, not just their tiles).
3. **Pairing is unconditional** — a campaign with no Instagram sibling fails the
   checker, so a blocked Instagram slot kills its X sibling too.

The cleared corpus is **5 photos** (`CLEARED_PHOTO_ALLOWLIST`,
`scripts/social/check-drafts.mjs:141-147`). Rule 2 means a photo is reusable
only after 11 intervening Instagram posts. **A corpus of C photos can never
sustain more than C Instagram posts before every one of them is inside the
window — you need C ≥ 11 for a daily paired beat.**

Where that lands us concretely: tonight's queued Clue Web pair uses
`taylor-lover-eras-minneapolis-2023.jpg`, the last free photo. Once it posts,
all 5 cleared photos sit inside the last-10 window, **the 09-08 beat has zero
legal images, and there is no post that can roll the window forward.** It is a
deadlock, not a slowdown — the account goes silent on both platforms until the
corpus grows.

**Each new cleared photo buys exactly one more post.** Three new photos buy
about six days (three new posts, then `red`/`debut`/`fearless` roll free in
turn), and then it stalls again. Eleven is the number that makes a daily beat
sustainable.

**Two working fixes exist, and both need a human:** grow the corpus to 11+, or
relax the 10-post window for the photo corpus specifically. Filed as a
`founder-decision` issue this run. Related and still open: #3733 (the calendar
was undraftable all last week), #3387 (corpus too thin).

⚠️ **A corpus photo is not usable until it is allowlisted.** PR **#3890** adds
`taylor-evermore-eras-inglewood-2023.jpg` under `/social/library/photos/` but
does **not** add its filename to `CLEARED_PHOTO_ALLOWLIST` — merging it as-is
gives us a file the checker rejects with *"not in the license-cleared photo
corpus allowlist."* Every corpus PR from here needs both halves.

---

## ✅ CLOSED since the last calendar

- **The appearance-lane incident (#3584).** Resolved by #3817: a rehosted video
  thumbnail can no longer pass as a `photo`, the lane is X-only, and the Dolly
  Parton memorial card never shipped — it expired in the queue and swept to
  `social/failed/`. The lane's captions are no longer Tree's or Growth's problem.
- **`SOCIAL_FREEZE` (#3891).** Was on from 2026-08-31 to 2026-09-06 19:01Z —
  six dark days nobody had decided on. Lifted and verified. **Crisis stop is not
  active.** The 6 failures in this week's scorecard are the staleness sweep that
  unfreezing was expected to produce, not new breakage.
- **The shop-the-look arc pointed at the wrong surface (#3733 §1).** Fixed in
  this calendar: every `launch:shop-the-look:*` beat now links **`/?mode=merch`**,
  verified in `packages/experience/src/deepLink.ts:34`. `/?lens=fashion` is The
  Runway — editorial, no buy links — and `#merch-style` resolves to nothing
  behind a `lens` param. The old arc shipped zero of its four posts; it is
  restarted below rather than continued.
- **The site-screen ban vs. every thread and mood beat (#3733 §2).** Fixed by
  the carousel shape, below — not by a policy argument.

## The carousel shape — how a thread or mood beat legally shows the site

`mediaKind: "site-screen"` is dead outside `launch:`. But a **`mediaKind:
"photo"` item may carry extra slides**, and only `media[0]` is prefix-checked
(`check-drafts.mjs:603-616`). So:

> **`mediaKind: "photo"` · `media[0]` = a cleared Taylor photo (the grid tile)
> · `media[1]` = the product screenshot.**

The grid shows Taylor; the screenshot still gets seen. Growth already shipped
this shape on the 09-07 Clue Web pair and it passed the checker clean. Use it
for every thread and mood beat below. Two constraints:

- **Slide 2 burns the repeat window too**, so rotate screenshots as carefully as
  photos — the `*-intro.png` files used on 08-24/08-29/08-30 and 09-07 are all
  still inside it; prefer the matching `*-screen.png`.
- **"Cool feature only" (Joey, 2026-09-01, strategy §2).** A screenshot must
  show a thread lens, Mood, Clownbot or the shoppable "seen on Taylor" surface
  **in actual use** — never a landing page or an empty state. No cool visual →
  drop the slide and ship the photo alone.

## How to read a slot

**Every beat is ONE pair: one Instagram item + one X item sharing a
story-unique `campaign` and `scheduledAt`, written platform-native, >20%
divergent in copy.** There are no single-platform exceptions any more (Joey,
2026-08-26: *"Always an IG copy. Always."*) — a story that cannot be told on
both platforms is not drafted at all.

- **One beat a day, at `23:00Z`.** Changed this run. `MAX_POSTS_PER_RUN = 1` and
  `MAX_POSTS_PER_PLATFORM_PER_DAY = 1` (`scripts/social/lib/queue.mjs:51-52`)
  mean exactly one campaign per platform can ship per UTC day, so the old A
  `15:00Z` / B `23:00Z` two-beat grammar was drafting content the poster could
  never ship. `23:00Z` (7pm ET) is the priority window. Strategy §2 still says
  two beats a day; a correction to it is proposed in this run's PR.
- Facebook rides every Instagram item automatically. It is never a slot.
- **The campaign label below is a FAMILY.** Mint the story-unique value shown —
  a reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **X is text-only unless stated.** X `site-screen` is permanently prohibited,
  and two queued items may not share a media file — so an X sibling must never
  reuse its Instagram sibling's photo while both sit in the queue.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270;
  the checker hard-fails at 280.
- **Share-design pass** (strategy, 2026-09-01): every `heartbeat:` and `mood:`
  caption needs one genuine tag/share hook grounded in the actual content.
  Thread and launch posts are exempt — they already have one. Never bolt on a
  fake one; say so in `why` instead.

### The media-budget rule — read this before drafting any beat below

Because of the deadlock, **dates below are intent, not a promise.**

1. Draft the beats **in the order written**. Do not skip ahead to a later date's
   beat because its media happens to be free.
2. A beat with no free cleared photo on its day **holds and slides to the next
   day** — it is not skipped, and it is not replaced.
3. **Exception: thread beats are window-bound.** If a thread beat slides past
   its window's last day (below), drop it and say so in the run's PR — a Runway
   beat in the Blank Spaces window is worse than a missing one.
4. An empty slot beats a failed one. Never substitute an era tile, a designed
   card, or a bare screenshot to fill a day.

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-09** (`monthNumber` = 1), unchanged from last run |
| September windows + angles (`angle = ANGLES[(1 + threadIndex) % 5]`) | Decode 09-01→05 `single-best-item` · Clue Web 09-06→10 `interactive-challenge` · Runway 09-11→15 `behind-the-data` · Blank Spaces 09-16→20 `quiz-poll` · Taylor's Version 09-21→25 `origin-story` · End Game 09-26→30 `single-best-item` |
| Thread progress this month | Decode: **1 of 2** (the 09-05 challenge pair shipped 09-07; the 09-03 hero never ran and its window has closed — Decode ends September one short). Clue Web: **1 of 2** (hero queued for tonight). Runway + Blank Spaces: 2 slots each, below. |
| Lens IDs (verified `packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (verified `packages/experience/src/deepLink.ts:34`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **`/?mode=mood` is real** — Mood beats no longer need the bare-domain workaround, but the drafter must open it once and confirm it lands on Mood before using it; fall back to `longlivets.com` + "tap Mood" if not. `?mood=` is still not a thing. |
| **Launch arc in flight** | **`launch:shop-the-look` — RESTARTED.** The surface (100 shoppable items across all 12 eras; a separate "Made by Swifties" bucket of 22 fan-made items; the disclaimer reads verbatim **"Her look, not the product"** — all three per #3733, count them again before writing) went live 2026-08-31 and has still never been posted about: all four beats of the first attempt died on the wrong link plus no media. Re-run as announce → how-to → example → callback below, all on `/?mode=merch`. |
| Launch backlog (reordered) | **Community Engine's fan-facing surfaces** — the Clownbot fan-theory chip (#3965) and the Clue Web live-theory board with origin badges and a "Live now" strip (#3964), merged 2026-09-07 — new to the backlog this run and the best story behind shop-the-look, because it is a *thing fans do*, not a thing we shipped. **Verify it is live on www.longlivets.com and ≥24h old before day 0.** → notifications + web push (#3568→#3583) → pinch-zoom photo viewer (#831) → photos + focal program (#762). Two arcs never overlap. |
| ❓ Android status — **still needs Joey** | Unanswered from last run. `HUMAN-ACTIONS.md` #17 records the device test as "the only thing left **before** Play Store", while PR #3534 calls it "the shipped Android app". Tree cannot tell from the repo whether it is listed. **Barred under invariant 6 until a founder confirms.** Not re-asked this week — the deadlock is the only question worth Joey's attention right now. |
| Mood beat | **2026-09 = `mood:chip-poll`**, cut from 3 slots to **2** (09-14, 09-19). None of last cycle's three ever drafted; three slots against a 5-photo corpus was wishful. |
| Openers burned (last 14 days) | **23 distinct patterns across 24 posts** — target ≥12, clear. One duplicate: *"Taylor Swift opens up about…"* ×2, both from the appearance lane, which is now X-only and no longer writes this shape. Still burned, do not reuse verbatim or near: bare `<month> <n>, <year>:` date-stamps · `an honest question` / `genuine question` · `she was twenty` / `she was 22` · `a fresh official Taylor upload just landed`. |
| Eras stacked recently — spread away from these | **lover ×3** (09-07 twice, 09-02 attempt), tloas ×3, red ×2, debut ×2, fearless ×2. **Lean hard on:** speak-now, folklore, evermore, 1989, ttpd, reputation. |
| **Cleared-photo corpus — 5 files, all currently blocked** | Every one is inside the last-10 Instagram window as of tonight. <br>• `taylor-lover-eras-minneapolis-2023.jpg` (lover) — Michael Hicks, CC BY 2.0, Wikimedia Commons <br>• `taylor-lover-eras-minneapolis-act5-2023.jpg` (lover) — Michael Hicks, CC BY 2.0, Wikimedia Commons <br>• `taylor-red-eras-inglewood-2023.jpg` (red) — Paolo Villanueva, CC BY 2.0, Wikimedia Commons <br>• `taylor-fearless-eras-inglewood-2023.jpg` (fearless) — Paolo Villanueva, CC BY 2.0, Wikimedia Commons <br>• `taylor-debut-2007-acoustic.jpg` (debut) — Brian Cantoni, CC BY 2.0, Wikimedia Commons <br>**To add one:** CC BY / CC BY-SA / CC0 / public domain only, from `commons.wikimedia.org` (never the `/wikipedia/en/` fair-use path); rehost under `/social/library/photos/`; record `mediaCredit` + `mediaSource`; **open the file and confirm the era before committing** (#3273: 4 of 4 sampled "Folklore Set Era" files were actually Speak Now); **and add the filename to `CLEARED_PHOTO_ALLOWLIST`** or it is dead on arrival. Priority eras: speak-now, folklore, 1989, reputation, ttpd, evermore. |
| Reddit non-promo contributions | **0 / 20.** Three consecutive weeks asked, none ticked. Every Reddit task stays a zero-link contribution until this reaches 20 (growth-plan §7). |
| IG Insights | **Never supplied**, three months running — now named in strategy §3 as a standing blocker. Asked again this week as the lightest task. |
| Crisis stop | **Not active.** `SOCIAL_FREEZE` set to `false` 2026-09-06 19:01Z (#3891, verified end-to-end). No founder "stop posting" outstanding. |

---

## 2026-09-07 (Mon) — Tree run day · Clue Web hero — COVERED BY QUEUE

- **`23:00Z` — already queued**, both platforms:
  `thread:easter-eggs:interactive-challenge:2026-09-hero`, IG on
  `taylor-lover-eras-minneapolis-2023.jpg` + `thread-easter-eggs-intro.png`
  slide 2, X text-only.

**Plan nothing today.** Drafting over this would mint a second campaign for the
same slot and both would try to ship.

## 2026-09-08 (Tue) — 🚀 Launch arc day 0 (restart)

- **`23:00Z` · `launch:shop-the-look:announce`** — mint exactly that.
  **Link `/?mode=merch`.** Job: not "we shipped a feature" — *"here is a thing
  you can now do"*: tap the picture of a look Taylor actually wore and go buy
  the piece. Say the disclaimer in fan language, because it is the honest part
  of the promise — these are her looks, not her products.
  IG media: cleared photo tile, era **not** lover/tloas/red. If a 1080×1350
  capture of the "Seen on Taylor" section has been committed under
  `/social/library/` by then, ride it as slide 2 (it is a "cool feature"
  surface); none exists today, and **photo-only is the correct answer, not a
  blocker**. X: text-only. Hook: **direct address**.

## 2026-09-09 (Wed) — The Clue Web, slot 2 of 2 (window closes 09-10)

- **`23:00Z` · `thread:easter-eggs:interactive-challenge`** — a **second**
  story-unique value: `thread:easter-eggs:interactive-challenge:2026-09-find`.
  Link `/?lens=easter-eggs`. A different find from Monday's, structurally
  different, >20% divergence — never a truncation of the hero.
  IG media: cleared photo tile + **`thread-easter-eggs-screen.png`** slide 2
  (not `-intro.png`, which ships tonight and will be deep inside the window).
  X: text-only. Hook: **the number**.
  **Window-bound**: if this has not drafted by 09-10 it is dropped, not slid.

## 2026-09-10 (Thu) — 🚀 Launch arc +2

- **`23:00Z` · `launch:shop-the-look:how-to`** — mint exactly that.
  Link `/?mode=merch`. Job: **literally where to tap.** Assume the reader has
  never found it — how you get to the merch surface, what the tile does when you
  tap it, that the retailer opens in a new tab, and which eras carry looks
  (check: all 12 have at least one).
  IG media: cleared photo tile, era not used since 09-08. X: text-only.
  Hook: **the challenge** — "open your era and find one."

## 2026-09-11 (Fri) — Heartbeat · The Runway window opens

- **`23:00Z` · `heartbeat:era-deep-cut`** — target **`speak-now`** (top of the
  lean-on list, unposted for weeks); mint `era-deep-cut:speak-now-<slug>`.
  Link `/?era=speak-now`. If no cleared speak-now photo exists yet, take the
  first lean-on era that does — folklore, 1989, reputation, ttpd, evermore —
  and mint to match. IG media: cleared photo tile, era matched to the story.
  X: text-only. Hook: **the contradiction**.
  **Share hook required** (heartbeat) — tag-the-friend, grounded in the actual
  deep cut.

## 2026-09-12 (Sat) — 🚀 Launch arc +4

- **`23:00Z` · `launch:shop-the-look:example`** — mint exactly that.
  Link `/?mode=merch`. Job: **one real result the surface produced.** A single
  look, the piece, where the tap takes you. The proof it works, not the pitch.
  Pick a look from an era outside lover/tloas/red. IG media: cleared photo tile,
  ideally the same era as the look. X: text-only. Hook: **the artifact** — open
  with what the image is.

## 2026-09-13 (Sun) — The Runway hero, slot 1 of 2

- **`23:00Z` · `thread:fashion:behind-the-data`** — mint
  `thread:fashion:behind-the-data:2026-09-hero`. Link `/?lens=fashion`.
  Angle `behind-the-data`: how many looks The Runway holds, how they were
  sourced, and the one thing that surprised us building it. **Count against the
  real thread — do not estimate**, and now that shop-the-look is live, count how
  many of those looks are tappable too rather than asserting it.
  IG media: cleared photo tile + **`thread-fashion-screen.png`** slide 2
  (`-intro.png` shipped 08-24 and may still be in the window — check).
  X: text-only. Hook: **the number**.

## 2026-09-14 (Mon) — Mood beat 1 of 2 · Tree run day

- **`23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-a`.
  Link **`/?mode=mood`** if it verifies (see the ledger), else bare
  `longlivets.com` + "tap Mood".
  X: three starter chips quoted **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, quote exactly, never
  reword — then "which one is you today". IG sibling: the same three chips in
  the caption, cleared photo tile + **`mood-chat-screen.png`** slide 2.
  **Pick chips whose real results come from scored eras.** evermore, Midnights,
  TTPD and TLOAS are **not scored** — never promise or imply songs from them.
  **Share hook required** (mood) — "which one is you, tag the other one".
  Hook: **direct address**.

## 2026-09-15 (Tue) — The Runway, slot 2 of 2 (window closes today)

- **`23:00Z` · `thread:fashion:behind-the-data`** — a second story-unique value:
  `thread:fashion:behind-the-data:2026-09-tappable`. Link `/?lens=fashion`.
  A different entry point into the same angle: not the counts again, but the
  single look whose sourcing was hardest to pin down, or the era whose wardrobe
  is thinnest and why. IG media: cleared photo tile + a Runway screenshot not
  used in the last 10 IG posts; photo-only if none is free. X: text-only.
  Hook: **the honest question** — fresh wording, the phrase itself is burned.
  **Window-bound**: drop rather than slide past 09-15.

## 2026-09-16 (Wed) — 🚀 Launch arc +8 (callback, closes the arc) · Blank Spaces opens

- **`23:00Z` · `launch:shop-the-look:callback`** — mint exactly that.
  Link `/?mode=merch`. Job: tie it to a fan use-case and **invite a reply** —
  "which era's closet would you actually raid?" IG media: cleared photo tile,
  whichever is furthest from its last use. X: text-only. Hook: **the honest
  question**, fresh wording.
  The optional "what you did with it" follow-up runs **only** if real replies
  exist to quote with permission, and it is next Tree run's call, not Growth's.

## 2026-09-17 (Thu) — Heartbeat

- **`23:00Z` · `heartbeat:on-this-day`** — search the Vault for a moment dated
  **Sep 17**; mint `on-this-day:<story-slug>`. **Fallback** if the date has no
  match: `heartbeat:era-deep-cut` on **`1989`** → `/?era=1989`, mint
  `era-deep-cut:1989-<slug>`. Say in the `why` which branch you took.
  IG media: cleared photo tile, era matched to whichever branch ran.
  X: text-only. Hook: **the real quote** — a sourced quote first, attribution
  second. **Share hook required** (heartbeat).

## 2026-09-18 (Fri) — Blank Spaces hero, slot 1 of 2

- **`23:00Z` · `thread:love-story:quiz-poll`** — mint
  `thread:love-story:quiz-poll:2026-09-hero`. Link `/?lens=love-story`.
  Angle `quiz-poll`: pose one genuinely hard either/or from the thread and let
  people answer. The thread is the byline, named once at the end with the link,
  not the subject. IG media: cleared photo tile +
  **`thread-love-story-screen.png`** slide 2 (`-intro.png` shipped 08-29).
  X: text-only, structurally different. Hook: **the challenge**.

## 2026-09-19 (Sat) — Mood beat 2 of 2

- **`23:00Z` · `mood:chip-poll`** — mint `mood:chip-poll:2026-09-b`.
  A **different** three chips from 09-14, quoted verbatim. Link `/?mode=mood`
  (or the bare-domain fallback). IG media: cleared photo tile +
  **`mood-feature.png`** slide 2 if it is outside the window by then, else
  photo-only. X: text-only. Same scored-era constraint.
  **Share hook required.** Hook: **the contradiction**.

## 2026-09-20 (Sun) — Blank Spaces, slot 2 of 2 (window closes today)

- **`23:00Z` · `thread:love-story:quiz-poll`** — a second story-unique value:
  `thread:love-story:quiz-poll:2026-09-results`. Link `/?lens=love-story`.
  If 09-18's poll drew real answers, this is the results beat; if it drew none,
  it is a different either/or entirely — never a restatement. IG media: cleared
  photo tile, photo-only is fine. X: text-only.
  Hook: **the artifact**. **Window-bound**: drop rather than slide.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks each, ≤5 minutes each,
paste-ready, checkboxes. Roughly 15 minutes of Joey's week, total.

**2026-09-07 — `founder-task: social reach week of 2026-09-07`** *(filed this
run)* — three outward-reach tasks: the monthly Instagram Insights paste, one
zero-link r/TaylorSwift contribution (counter 0 → 1 of 20), and ten follows of
real Swiftie accounts. None of them depend on the account being able to post,
which is deliberate: reach is the mechanism September's target actually rests
on, and it is the one lane the deadlock does not touch.

**Deliberately not asked this week:** the Android Play Store question. It is
still open and still bars the Android launch arc, but it is not worth competing
with the deadlock for Joey's attention.

**2026-09-14 — next run.** Reserved. Priorities in order: whatever the
photo-corpus decision resolves to, then the Reddit counter, then two Swiftie
Facebook groups to join and read (join and read only, do not post) with each
group's self-promo rule quoted.

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
