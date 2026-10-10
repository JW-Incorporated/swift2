# Long Live — social operating strategy

**Version 1 — 2026-08-11; ownership revised 2026-10-01. Owner: Tree
(`docs/agents/tree.md`), the standing social-media manager, for execution and
format; Marjorie owns the growth goals. The founder-owned limits are
`docs/social/guardrails.md` and nothing else — everything in this file is
Tree's to change, by PR with a written reason and evidence.**

This file **supersedes `docs/marketing/growth-plan.md` §4-6 as the posting
strategy.** Growth-plan keeps everything else and stays live: §0 mental model,
§1-3 accounts/handles/profile kit, §7 Reddit + Tumblr etiquette, §8 site↔social
integration + UTM, §9 founder-action table. Where the two disagree about *what
to post and when*, this file wins.

Who does what, in one line each:

- **Tree** plans (this strategy → `social/calendar.md`, one weekly run) and
  drafts what the calendar says into `social/queue/` (a second, daily run).
- **`social-poster.yml`** ships it every 30 min, once a signed stamp is on it — since 2026-10-09 (owner decision) Tree mints it for IG/X by dispatching `social-tree-approve.yml`, with no per-post ✅. Reddit and Facebook are owner-posted from Tree's paste-ready cards.
- **Tree's charter** (`docs/agents/tree.md`) owns listening, metrics,
  and the six hard rails — including the `SOCIAL_FREEZE` crisis stop.

---

## 0. Why this exists — the failure it fixes

Audited 2026-08-11 (Joey, founder-verified):

| Symptom | Cause |
|---|---|
| **12 of the last 14 posts open "did you know…"** | The pillar *name* from growth-plan §4 ("did-you-know track facts") leaked into caption copy, and the drafting prompt said "see `social/posted/*.json` for real shipped examples" — so every run copied the last run. A formula loop with no strategy behind it. |
| **Every IG image is a generic era tile** (`/eras/<id>.png`) | The 2026-08-06 decision told the drafter to source real photos; it kept taking the documented last-resort default because that was less work, and nothing checked. |
| **11 of 12 failed posts are X** | Generic 403s from X rejecting over-length tweets on this non-premium account — all 11 measured 294-373 characters against X's real 280-character *weighted* limit (URLs always count as 23 regardless of actual length). Not duplicate content, corrected 2026-08-11 same day — see §2's "Sibling rule + the X length rule". |
| **Nothing plans ahead** | There was no artifact between "the pillars exist" and "draft something today". Feature launches got no push; the six site threads were never taught; Mood was never promoted. |

Three structural fixes, in priority order:

1. **A calendar exists** (`social/calendar.md`), written a week ahead by an
   agent whose only job is judgment about *what to post*. Drafting stops being
   an act of invention every morning.
2. **Campaigns, not just pillars.** Most posts now belong to an arc with a
   point (launch a feature / teach a thread / show Mood), not a lone fact.
3. **The gates are code.** `scripts/social/check-drafts.mjs` blocks banned
   openers, opener-pattern reuse, sibling-copy similarity, and missing/lazy IG
   media at draft time. A doc instruction is advisory; a check is not. (Same
   lesson as the voice checker, `docs/decisions.md` 2026-07-15 and 2026-08-06.)

---

## 1. Campaign architecture

Seven campaigns (News added 2026-10-01, answering #4676). Every queue item
belongs to exactly one. The names below are
**families** — a prefix that groups metrics — and the `campaign` field on a
queue item is never the bare family:

| Campaign | Family | A real `campaign` value | Share of slots |
|---|---|---|---|
| Feature launch | `launch:<feature-slug>` | `launch:mood-chat:announce` | 0-6 slots per launch, bursty |
| Thread cycle | `thread:<lensId>:<angle>` | `thread:hidden-clues:origin-story:2026-08` | **1 paired beat per thread per month (6/mo)** |
| Blank Spaces relationship timeline | `timeline:love-story:<chapter>` | `timeline:love-story:early-solo-years:2026-09-17` | **1 evening campaign beat every calendar week, permanent minimum** |
| Mood beat | `mood:<format>` | `mood:chip-poll:2026-09` | 2-3 slots per month |
| **News beat** | `news:<event-slug>` | `news:patient-zero-cover-reveal-2026-10-03` | **≥1 reserved day per calendar week, ≤2 posted per rolling 7 days** |
| Daily heartbeat | `heartbeat:<pillar>` | `heartbeat:on-this-day:red-announcement` | everything left (~60-70%) |
| Human reach | *(no queue item — a GitHub issue)* | — | 0 slots, ~15 min/week of Joey |

**Rule — every `campaign` value is story-unique** (2026-08-12, found the hard
way in issue #2031). The poster's `findPostedDuplicate`
(`scripts/social/lib/queue.mjs`) treats *same platform + same `campaign`* as
proof an item already shipped, and skips it. So a value reused as a thematic
bucket — every on-this-day post filed under `heartbeat:on-this-day`, all four
launch-arc posts under `launch:mood-chat` — means the first post ships and
**every later post in that bucket is silently skipped forever.** Extend the
family with the story: one slug per story, shared only between that story's
IG and X siblings. Metrics still group, because the family is still the
prefix. Note the check reads the **whole** `social/posted/` history, not a
recent window — a value reused a year later still skips, which is why the
angle examples above carry the cycle month.

### (a) Feature launch — the coordinated push

**Trigger.** Any **user-visible ship**: a merged PR that changes what a visitor
can see or do on longlivets.com. Not refactors, not content backfills, not
infra. Tree checks merged PRs since its last run and decides; when it's
borderline, the test is "could a fan notice this without being told?"

**Never tease unshipped work.** The Android app (#1815) is the standing example
— it is not shipped, so it does not exist on social until it is in a store.

**The arc — 4 posts over 8 days** (a 5th optional at +14):

A launch arc is the one place where the subject genuinely *is* a product
surface, so an **Instagram** `site-screen` is legitimate here — but §2's ladder
still governs: on Instagram the screenshot rides slide 2 of a carousel behind a
Taylor photo tile, because the grid is what a visiting fan sees. **X
site-screen posts are permanently prohibited**; use a real credited photo or
text-only X copy for the X sibling instead.

| Day | Post | Platform | Job | Media |
|---|---|---|---|---|
| 0 | **Announce** | IG + X sibling | One line on what it does. Not "we shipped" — "here's the thing you can now do." | IG: photo tile + the feature mid-use as slide 2. X: the SAME photo as its IG sibling |
| +2 | **How-to** | IG | Literally where to tap. Assume the reader never found it. | Photo tile + the tap-path screens as later slides |
| +4 | **Example output** | IG + X sibling | One real result the feature produced. The proof it's good. | Photo tile + a screenshot of that actual result |
| +8 | **Callback** | X | Tie it to a fan use-case; invite a reply ("what did yours give you?"). | A photo, or text-only |
| +14 | *(optional)* **What you did with it** | IG | Only if real replies/DMs exist to quote (with permission). Skip silently otherwise. | Photo tile + the quoted reply as a screenshot |

**Timing.** Day 0 is the first evening slot ≥24h after the deploy is live on
www.longlivets.com — never before, because the announce screenshot has to be of
the real deployed thing. Two arcs never overlap; a second ship inside a live arc
queues behind it (Tree records the backlog in the calendar ledger).

**Slot cost.** An arc preempts **heartbeat** slots first. It may delay a thread
window by up to 2 days; it never cancels one.

**Currently push-worthy, in order** (Tree works down this list when no new ship
landed): Mood Chat (#1560 — the clearest "we launched a thing" story), the
pinch-zoom photo viewer (#831), the photos + focal program (#762), shoppable
Runway looks, the rumor tier ("what's confirmed / what's rumored").

### (b) Thread of the month — all six threads, every month, a new angle

Joey's framing: *new followers keep arriving and nobody has ever taught them the
six threads.* So the six threads are re-taught **every month**, each with a
**different angle** than last time.

**The month splits into six ~5-day windows**, one thread each, in this fixed
rotation order (most visual first, so the strongest opens each cycle):

| # | Thread | Deep link |
|---|---|---|
| 0 | **The Decode** | `/?lens=hidden-clues` |
| 1 | **The Clue Web** | `/?lens=easter-eggs` |
| 2 | **The Runway** | `/?lens=fashion` |
| 3 | **Blank Spaces** | `/?lens=love-story` |
| 4 | **Taylor's Version** | `/?lens=taylors-version` |
| 5 | **End Game** | `/?lens=the-proposal` |

**Each window gets ONE paired beat** (changed 2026-10-09, Tree — see the
capacity note below): the IG hero and a structurally different X post, never
the IG caption truncated, placed anywhere in the window. The IG hero leads
with a Taylor photo from the era the thread's best item belongs to; the thread
page itself is a product surface, so a `/social/library/` screenshot of it
earns slide 2.

**Why one beat, not two (2026-10-09, Tree).** This rule used to read "2 slots:
one IG (the hero) and one X (a structurally different post)" — two *slots*,
because it was written under the two-beat-a-day grammar where an IG item and
an X item each consumed their own slot. §2's 2026-10-05 correction made one
beat a day the real grammar and **every beat an IG+X pair authored together**,
so a single beat now delivers exactly what this rule asked for: an IG hero
plus a structurally different X sibling. Keeping "2 slots" on top of that
meant each thread asked for two *pairs* a month — four posts to teach one
thread — which nobody decided and which the arithmetic cannot pay for:

> 7 beats a week is the whole budget. The standing reservations are 1 news
> reserve (§1(e2)) + 1 Blank Spaces timeline beat (§1(c)) + 12 thread slots a
> month (~2.8/week) = ~4.8 of 7, before a single Mood beat, launch-arc day or
> heartbeat. Planning the fortnight of 2026-10-09 against the old numbers came
> out at 19 demands for 13 slots. At 6 thread beats a month (~1.4/week) the
> reservations land at ~3.4 of 7 and the rest of the strategy fits.

The six-threads-every-month promise (Joey's framing above) is unchanged and
still the point — all six are still taught every month, each on a new angle.
What changed is that teaching one takes one pair, not two.

**The angle menu** — five angles, so a thread doesn't repeat itself for five
months:

| # | Angle | What the post does |
|---|---|---|
| 0 | `origin-story` | What this thread *is*, and the one moment that made it worth building. |
| 1 | `single-best-item` | One item from the thread, told whole. The thread is the byline, not the subject. |
| 2 | `interactive-challenge` | "Open it and find the one where ___ — reply with what you got." |
| 3 | `behind-the-data` | How many items, how they're sourced, the thing that surprised us while building it. |
| 4 | `quiz-poll` | A question whose answer lives inside the thread. X poll where the platform allows. |

**Which angle, deterministically** (so Tree never re-litigates it and never
repeats):

```
monthNumber = whole months since 2026-08   (Aug 2026 = 0, Sep = 1, …)
threadIndex = the # column above (0-5)
angle       = ANGLES[(monthNumber + threadIndex) % 5]
```

The `+ threadIndex` offset is deliberate: without it every thread in a given
month runs the same angle and the month reads monotonous.

**Partial months don't carry over.** A cycle that starts mid-month runs as many
windows as fit and drops the rest; the next month starts again at The Decode
with its own angle index. (August 2026 starts on the 12th, so it runs Decode →
Clue Web → Runway → Blank Spaces and skips Taylor's Version + End Game.)

### (c) Blank Spaces relationship timeline — weekly, confirmed-only

**Permanent minimum:** reserve at least **one 23:00Z evening campaign beat in
every calendar week** for this series. It is additional to, and never replaces,
the six-thread monthly rotation; Blank Spaces still receives its own
thread-cycle beat in its normal monthly window. If a launch arc or another campaign already
occupies the preferred evening beat, use the next available 23:00Z beat that
week rather than double-booking a slot or adding a separate Facebook item.

**Delivery shape:** each weekly beat is exactly one Instagram post and one
structurally distinct X post with the same story-unique `timeline:love-story:*`
campaign value and `scheduledAt`; Facebook rides the Instagram post
automatically. Never draft or plan a standalone Facebook item.

**Chronology:** begin with Taylor's early solo years, then advance through
publicly confirmed relationship-era material toward Travis. Each beat must stand
alone and point to `/?lens=love-story` with the standard UTM parameters. The
calendar supplies only the chapter and sourcing direction; the Growth drafter
must verify each specific person, relationship, event, date, quote, or other
factual claim against the Vault or reliable public sources before it appears in
copy. Joe Jonas may be covered only as confirmed public relationship history;
rumor-stage relationship-existence claims, countdowns, and speculation remain
banned.

**Media:** Instagram leads with a real cleared Taylor photo relevant to the era.
It may place a Blank Spaces lens screenshot on slide 2 only when the screenshot
shows that lens in actual, visually rich use and satisfies §2's “cool feature
only” rule; never use a generic Long Live card, landing-page image, or plain
article screenshot. X follows the media ladder: a relevant cleared Taylor photo
when it fits, otherwise text-only; never a site screenshot.

### (d) Mood beat — monthly, starter-chip driven

Mood is the most distinctive thing on the site and the hardest to link to.

**Hard constraints:**

- **No deep link exists.** Every Mood post says **"tap Mood on
  longlivets.com"** — never a fake `/?mood=` URL.
- **Coverage gap:** evermore, Midnights, TTPD and TLOAS songs are not scored
  yet. Never promise "every song" or name those eras as Mood results. Pick
  chips whose real results come from scored eras, and verify against the actual
  feature before writing the caption.
- The starter chips (`apps/web/lib/longlive/mood-starters.ts`) are **approved
  copy, verbatim** — quote them exactly, never reword: *crying in the car,
  cinematically · 3am and the group chat's asleep · plotting something in a ball
  gown · feral about a bridge · cardigan weather · driving out of a small town
  for good · romanticizing a Tuesday · someone said "we need to talk" ·
  winning, quietly · unhinged in the best way*.

**Formats** (2-3 slots in one week, once a month; rotate formats month to month):

| Format | Family | Shape |
|---|---|---|
| Chip poll | `mood:chip-poll` | X: three chips, "which one is you today", answer by tapping Mood. A photo if one fits; text-only is fine here. |
| What it gave me | `mood:result` | IG: one chip in the caption, a Taylor photo from the era those songs come from as the tile, the **real** returned songs as slide 2. The strongest format — it proves the thing works. |
| Chip of the week | `mood:chip-spotlight` | IG: the chip lives in the **caption**, not in the image — a Taylor photo carries the tile (match the era to the chip's mood). Caption is the fan-recognition beat ("feral about a bridge" is the deepest cut in the set and the one that says *we know you*). Rewritten 2026-08-12: this format used to be a designed typography card, and §2 retired cards from the feed. |

**When a feature-launch arc is about Mood, that month's beat is absorbed into
the arc.** Don't run both — it doubles Mood to 8 slots in a month and the grid
reads like an ad.

### (e) Daily heartbeat — the everyday posts, with hook craft

The five pillars survive. What changes is how the copy opens.

| Pillar | `campaign` | Source | Link |
|---|---|---|---|
| On this day | `heartbeat:on-this-day` | any Vault moment dated today | `/?item=<momentId>` |
| Era deep cut | `heartbeat:era-deep-cut` | Era Secrets, month items | `/?era=<eraId>` |
| Track fact | `heartbeat:track-fact` | track dossiers | `/?item=<momentId>` or `/?era=<eraId>` |
| Symbol thread | `heartbeat:symbol-thread` | Invisible Strings motif atlas | `/?lens=easter-eggs` |
| Product peek | `heartbeat:product-peek` | the site itself | the surface being shown |

**Rule 1 — pillar names are internal.** "Did you know", "fun fact", "era deep
cut" are *filenames for us*, never words in a caption. The entire current
failure is a pillar name that escaped into 12 captions.

**Rule 2 — banned openers** (hard-blocked by `check-drafts.mjs`):

> did you know · fun fact · here's a fact · ever wonder · let's talk about ·
> imagine · picture this · in a world · buckle up · spoiler · PSA · story time ·
> a thread 🧵 · we need to talk about

**Rule 3 — no opener-pattern reuse within 14 days.** The checker normalizes the
first five words of every draft and compares against the last 14 days of
`social/posted/` + `social/queue/`. Tree also keeps the human-readable list in
the calendar ledger so the drafter can see the trap before it walks into it.

**Rule 4 — the specificity test.** *Would a fan know what this post is about
from the image and the first line alone?* If the first line works equally well
above any of six other posts, it is not a hook. Rewrite.

**Rule 5 — rotate hook shapes.** A menu, not a formula; never the same shape two
days running on the same platform:

- **The date** — "august 13, 2013:" then the thing.
- **The number** — "31 songs. two hours. one 2am post."
- **The contradiction** — the fact that shouldn't be true.
- **Direct address** — "you've scrolled past this one a hundred times."
- **The artifact** — start with what the image *is*.
- **The real quote** — a sourced quote as the first line, attributed after.
- **The honest question** — one we'd actually like answered, not rhetorical.
- **The challenge** — "find it in ten seconds."

**Rule 6 — always land somewhere.** Every post in every lane carries a deep link
(era / item / lens) with the UTM tags from growth-plan §8 — widened from
heartbeat-only to all lanes on 2026-10-05, see §2's three criteria.
"longlivets.com" bare is only for Mood posts, which have no deep link.

**Rule 7 — mind X's real length limit, and it's weighted, not raw characters.**
X counts any autolinked URL (including a bare domain like
`longlivets.com/?utm=...`) as exactly **23** characters regardless of its real
length, most emoji/CJK as 2, everything else as 1 — not the string's plain
character count. Target **≤270 weighted characters**; `check-drafts.mjs` hard
fails anything over the real **280**. A caption that reads short in an editor
can still be 300+ weighted once the link is counted — this, not duplicate
sibling copy, is what actually broke 11 of 12 `social/failed/` items (§0,
corrected 2026-08-11).

### (e2) News beat — same-day coverage of a real-world event

**Added 2026-10-01, answering Marjorie's ask [#4676](https://github.com/JW-Incorporated/swift2/issues/4676)
(evidence: the week-of-2026-10-05 plan, [#4674](https://github.com/JW-Incorporated/swift2/issues/4674)).**
27 real-world Taylor events landed in `intake:` issues across the last two
weeks and **not one of them got a social post**, while the fandom conversation
those weeks was almost entirely about them. News is the strongest share-bait
this account has and it had no slot at all: every day of the calendar was
assigned to a thread, mood, launch or timeline beat, the poster ships **one
item per platform per UTC day**, and the same-day event run
(`routine-tree-event-draft.yml`) schedules only onto "a UTC day where neither
platform is already taken". A full calendar therefore *silently* turned every
event into a no-post. This section is the slot it was missing.

**Trigger.** A real-world event dated inside the last 48h that no shipped or
queued post covers (the daily run's `events.uncovered[]`). Confirmed fact
only, from the intake record — never a rumor-stage claim, and never anything
on the §Voice blocklist (the confirmed-only carve-out there governs the
personal-life topics).

**Slot — the news reserve, and this is the first-class part.** Every calendar
Tree writes **reserves at least one day per week as a news day**: its beat is
written as `news:` with a **named fallback subject on the same line**, so a
quiet week still posts and the "a calendar gap is never filled" rule
(§0/invariant) is never in play — a reserve is an assigned slot with two
possible subjects, not a gap. On a reserve day the 11:00Z daily run checks
`events.uncovered[]` first: an uncovered event → leave the beat for the event
run and draft nothing there; nothing uncovered → draft the named fallback as
written. A reserve day's beat is never drafted a day early by the previous
run.

**Yield order, when news lands off-reserve.** News may take the next
unfilled beat inside 48h, displacing in exactly this order, nearest first:

1. a `heartbeat:` beat — always yields,
2. a `mood:` beat.

**That is the whole list as of 2026-10-09.** It used to carry a third rung —
"the **second** slot of a thread window (never the hero)" — which no longer
exists: §1(b) now gives each thread window ONE paired beat, and that beat *is*
the hero. So news never displaces a thread beat, and a thread window's single
beat is never written as a news reserve's named fallback either; a reserve's
fallback is a heartbeat (or mood) subject. News never displaces the weekly
Blank Spaces timeline minimum (§1(c)), a thread window's beat, or a launch
arc's day 0 / +2 / +4 (§1(a)). The displaced beat
slides to the next free day where that is possible; a window-bound thread
slot is dropped rather than slid, same as today. The news item records the
displacement in its `why` ("takes 10-08 heartbeat; heartbeat → 10-09") because
the event run may not edit `social/calendar.md`; the next weekly run
reconciles the calendar to what actually shipped.

**Cap — ≤2 news posts per rolling 7 days.** News is the one campaign that can
arrive unplanned, so it gets the same bounded shape as the T6 fast lane: the
rotation it preempts is what teaches new followers the product, and a week of
pure reaction posting is how a fan account becomes a news aggregator nobody
needs.

**Bar.** A news beat is scored on the six-dimension rubric the fast lane
already uses — T2's five plus **`timely`, which must clear 4 on its own** — and
it has no claim on a slot it cannot clear. One rewrite, then the beat reverts
to its fallback subject. `lane` stays `"calendar"` (a reserved beat *is* a
calendar slot; `scripts/social/lib/queue-schema.mjs` has no `news` lane and
this strategy does not ask for one).

**Platform shape.** IG+X pair like everything else. Speed over polish is the
one legitimate `singlePlatformReason` for X-first here (§2's sibling rule
already names it), with Instagram following in the next run.

### (f) Human reach — the lane APIs can't touch

Facebook groups, Reddit and Tumblr are where this audience actually lives, and
no API we have reaches them. So they run on **~15 minutes of Joey per week**,
and the agent does 100% of the thinking.

**Mechanism:** one `founder-task` GitHub issue per week, filed by Tree's weekly
run, titled `founder-task: social reach week of <date>`.

**Rules for the issue** (these are what keep it 15 minutes and not a chore):

1. **≤3 tasks, each ≤5 minutes.** If Tree has more ideas, it keeps them for
   next week. An issue that takes 40 minutes gets ignored, and then all of them
   get ignored.
2. **Paste-ready.** Every task carries the exact destination (subreddit / group
   name / post URL) and the **exact text to paste**, in a fenced block. Never
   "write something about X."
3. **Etiquette state is tracked, not assumed.** growth-plan §7 requires **20-30
   genuine, zero-link contributions before any promo post.** The calendar ledger
   carries the running count (`redditNonPromo: n/20`). Until n ≥ 20, every
   Reddit task is a *contribution* task — real fandom knowledge answering a real
   question, no link, no mention of the site. Tree may not file a promo task
   before that, and the first promo task must be preceded by a modmail check.
4. **A checkbox per task**, so Joey's whole interaction is: read, paste, tick.
5. **Never a login, an account creation, or a payment** without it being an
   explicit TX item (growth charter rail 5).

Monthly, one of the three slots is instead **"paste your IG Insights top 3"** —
see §3, it's the only real engagement data we can get.

---

## 2. The weekly calendar grammar

### The bar every post clears — three criteria, not an average

**Added 2026-10-05 (Tree), from the owner's own words about the one post he has
praised.** `social/posted/2026-10-01-love-story-joe-jonas-ig.json` is the
reference: a credited fan photograph, a sourced and specific chapter narrative,
and a `/?lens=love-story` deep link into real site content. The owner asked that
**every** post meet all three. It is written here as three gates because that
post cleared `total` 21/25 while scoring `mediaEarnsItsPlace: 3` — exactly the
floor — which is how a merely-defensible image rides to publication on the back
of the other four scores.

1. **A real picture worth stopping on.** `mediaEarnsItsPlace` has its own floor
   of **≥4**, independent of `total` — the same shape `notEmbarrassed` already
   has. A 3 means "defensible"; the ask is "great". *(The scoring floor itself
   lives in `scripts/social/lib/queue-schema.mjs`'s
   `CRITIQUE_DIMENSION_MIN_OVERRIDES`, which Tree may not edit — until that
   lands, this is the bar the drafting run self-scores against and a 3 is a
   rewrite, not a ship.)*
2. **Text specific enough that it could not sit above another post.** Rule 4's
   specificity test, applied to every lane and not just heartbeat.
3. **A deep link into actual site content.** Rule 6 now covers **every** lane —
   timeline, thread, launch, mood, merch, appearance, news — not heartbeat
   alone. Mood is the single named exception, because no Mood deep link exists
   yet; it says "tap Mood on longlivets.com". The bare homepage is never a
   landing place.

### Slots — ONE paired campaign beat per day, at `23:00Z`

| Beat | Time (UTC) | Local | Queue items | Normally filled by |
|---|---|---|---|---|
| **B** | `23:00Z` | 7pm ET / 4pm PT | X + Instagram pair | the live campaign — launch arc, thread hero, timeline chapter or mood beat; heartbeat otherwise |

**One beat, not two (changed 2026-10-05, Tree — the code was always the real
grammar).** `scripts/social/lib/queue.mjs:61-62` sets `MAX_POSTS_PER_RUN = 1`
and `MAX_POSTS_PER_PLATFORM_PER_DAY = 1`, so a second same-day pair cannot
post however it is planned: the `15:00Z` beat A would be skipped, go stale and
retire to `social/failed/` at 48h. Every calendar since 2026-09-28 has already
planned one beat a day and flagged the contradiction; this section was the bug.
`social/calendar.brief.json` is 14 entries, one per day, for the same reason.
Evening-US is the priority window (growth-plan §6), so the one beat sits there.

**Weekly volume: 7 IG + 7 X = 14 posts** (was 28 under the unreachable
two-beat grammar). Each beat is two queue items authored together with the
same story-unique `campaign` and `scheduledAt`. Facebook rides every Instagram
item automatically (`postToFacebookPage`) — it is never planned or drafted
separately.

**A beat is drafted by its OWN day's run, and never parked more than 24h out
(added 2026-10-05, Tree).** For a founder-approved item the 48h staleness clock
runs from `approval.at`, not from `scheduledAt` (`social/README.md`'s "48h
staleness check"; `lib/queue.mjs`'s `isStaleApproved`), so an item approved well
before its slot can be retired *unposted* before its own scheduled time ever
arrives. That is what killed the 2026-10-03 Mood pair: drafted by the 10-01 run,
✅'d at `2026-10-01T16:21Z`, scheduled `2026-10-03T23:00Z` — 54.6h later, 6.6h
past the sweep — so both halves went to `social/failed/` without a single
posting attempt, and Mood has still never shipped. A catch-up or re-draft
subject therefore takes **today's or tomorrow's** beat, never a date two days
out; a calendar beat further ahead than that is drafted by the run on its own
day.

**At least one day of every calendar week is a news reserve** (§1(e2), added
2026-10-01): its beat is written `news:` with a named fallback subject on the
same line, and it is the only slot the previous day's run leaves alone. A
calendar that assigns all seven days to planned campaigns is now a planning
bug, not a full plan — it is what made 27 events in two weeks un-postable.

### Sibling rule + the X length rule

**Every campaign, including heartbeat, is an IG+X sibling pair authored in the
same change.** An Instagram item is also the Facebook delivery path. The only
escape hatch is a specific `Single-platform exception: <human-readable reason>`
in the existing item's `why`; an inconvenient visual or a forgotten sibling is
not an exception. For every pair:

- The X post is **written first, as its own post**: one idea, the link. It is
  never the IG caption truncated.
- IG can breathe: 3-6 short paragraphs, the story, credit line, then the link.
- `check-drafts.mjs` fails the pair if the two bodies are less than 20%
  different — still good, checker-enforced practice (a near-clone sibling
  reads as spam either way), even though it turned out not to be what caused
  the failures below.

**X's real length limit — and what actually broke 11 of 12 `social/failed/`
items (corrected 2026-08-11, same day):** the original diagnosis blamed
duplicate-content 403s from near-identical IG/X sibling copy. That was wrong.
Every one of those 11 items had a *raw* body length of 294-373 characters —
none had an IG sibling copied verbatim — and every one failed with the same
generic 403 ("You are not permitted to perform this action") that X returns
both for duplicate content and for a tweet over its length cap on a
non-premium account, which is what produced the original misread. X counts
length by its own **weighted** rule, not raw characters: any autolinked URL
(including a bare domain like `longlivets.com/?utm=...`) counts as exactly
**23** characters no matter how long it actually is; most emoji and CJK count
as 2; everything else counts as 1. `scripts/social/check-drafts.mjs` now
hard-fails any X draft over the real **280**-weighted-character limit and
warns above a **270** target, via `weightedTweetLength` — see that file's
header comment.

### What is out of scope

- **Reels, Stories, TikTok, Threads, YouTube Shorts: not automatable today.**
  The pipeline posts a single image plus text. Growth-plan §6's "3-5 Reels/week"
  cannot be executed by any agent here and must not be planned into a slot.
  Reels/Stories are **founder-manual and optional**; if a founder wants them
  back on the roadmap it's a product ticket for video posting, not a calendar
  entry.
- **Replies, DMs and comments stay human forever** (growth charter rail 4).
- **A new channel needs its own `docs/decisions.md` entry** with a channel
  policy and a crisis-stop rule (rail 3).

### Media — the source ladder, a.k.a. **the Taylor-photo standard (2026-08-12)**

**This section is the definition.** When another doc says "the 2026-08-12
Taylor-photo standard" — Tree's charter, the Tree and Growth runner prompts,
`social/calendar.md` — this ladder is what it means. `social/README.md`
carries the field-level schema (which `mediaKind` values exist, what each one
requires); it does not get a vote on the policy.

Joey's verdict after the 2026-08-11/12 incident, verbatim: *"We are a Taylor
Swift fan site whose social media has no pictures of Taylor Swift."* That ends
the screenshot-first ladder. The grid's job is to show Taylor; the product is
the byline.

**Enforced in code since #2043** (2026-08-12):
`scripts/social/lib/queue-schema.mjs` knows the `photo` / `site-screen`
values, and `scripts/social/check-drafts.mjs` rejects undeclared media and era
tiles outright — `photo` is path-bound to `/social/library/photos/` and
requires `mediaSource` (and `mediaCredit` whenever the photographer is known), so
a screenshot cannot be laundered as a photograph. This
section describes that gate; it is not the gate. Where the two ever disagree,
the code is what actually ships and this file is the bug.

1. **A real photograph of Taylor** — `mediaKind: "photo"`. THE default for
   every post. Source it from the repo's own corpus —
   `supabase/seed/content/**` `moment.photos` (1,000+ entries, url + credit)
   and `apps/web/lib/longlive/lenses.ts` (per-era Getty/Wikimedia with
   captions) — rehost it under `apps/web/public/social/library/photos/`
   (≤1.5MB), record `mediaSource` on the queue item (plus `mediaCredit` when the
   photographer is known — an unknown photographer means no `mediaCredit` and no
   credit line, never "unknown"; owner, 2026-10-01), and put a known credit line
   in the caption whenever the platform's length budget allows. Verify the download is the real image (view it — a CDN can serve a
   placeholder to curl), and that Taylor is actually in the frame.

   **Real content verification, not just path/credit (2026-08-31, Joey —
   kanban t_ac1281ef).** A path-bound + credited-string check is a SHAPE
   check, not a content check — `appearance-XwCWKSO0F8s`'s thumbnail was a
   Pixar-style animated tree/tire-swing illustration with zero Taylor in the
   frame, declared `mediaKind: "photo"`, and it passed every gate that
   existed at the time (`docs/decisions.md` 2026-08-31). For the
   **appearance-discovery fast lane** specifically — the one lane with no
   other judgment gate between "detect an upload" and "post it live" —
   `scripts/appearance-discovery/lib/social-draft.mjs`'s
   `fetchAppearanceThumbnail` now spends one `claude-sonnet-5` vision call
   per candidate YouTube thumbnail (`verifyTaylorPresence`, reusing the SAME
   existing Anthropic credential/account already standing-authorized for E3
   match auditing — `docs/decisions.md` 2026-08-30 — no new provider,
   account, or spend channel) before the thumbnail can be staged as
   `mediaKind: "photo"`. A thumbnail the model does not confidently (≥0.6)
   confirm shows Taylor as a real photographed person is never written to
   `social/queue/` at all — the run logs a loud, non-fatal `draftFailures`
   entry and simply produces no post for that video, same shape as any other
   staging failure. This stays inside the fast lane's existing auto-posting
   flow: the lane still ships with **no human review step of its own** (Joey's
   ruling, same task — the lane does not become review-first/draft-only; the
   draft is cleared by `social-tree-approve.yml` like every post), the gate
   is just now a real content check instead of a shape check. Every other
   sourcing path (Content Shift, Growth, Tree — the slower, already-judged
   lanes) is unaffected; a human already looks at those before they land.
2. **Site screenshot** — `mediaKind: "site-screen"`, **Instagram only**, for
   posts whose subject IS a product surface (a launch, a how-to). Must be a
   committed `/social/library/` asset. On Instagram, prefer a carousel: Taylor
   photo as the grid tile, the screenshot as slide 2 — the grid shows Taylor
   either way. **X site-screen posts are permanently prohibited**; the X
   sibling carries the same real photograph its Instagram half does.

   **X is never text-only (corrected 2026-10-05, Tree).** `check-drafts.mjs`
   fails an X item with no media (`social/strategy-params.json`
   `media.requireImageOnX`), and lesson L001's one sanctioned repeat is exactly
   this: **one beat, one pair, one image**, shared by the IG and X halves of the
   same `campaign` because the owner approves the pair as a single post
   (`docs/decisions.md` 2026-09-30). Every "or text-only" fallback written
   elsewhere in this file or in an older `social/calendar.md` is dead — dropping
   X to text-only is never the answer to a media problem, including a photo-reuse
   one. When no never-used photo fits a beat, the beat is deferred.

   **The "cool feature only" rule (Joey, 2026-09-01).** A `site-screen` may
   only show one of the site's genuinely distinctive, visually rich surfaces
   — the thread lenses (Decode, Clue Web, Runway, Blank Spaces, Taylor's
   Version, End Game), the Mood chat/chip experience, Clownbot, the shoppable
   "seen on Taylor" surface, or a comparably standout feature — captured in
   actual use (a real result on screen, not an empty state or a generic list
   view). It may never be: a bare landing page, a plain article/moment page,
   a letterboxed video-padding frame, or any screenshot whose only content is
   "the site exists" rather than "look what the site does." If a launch or
   how-to post has no genuinely cool visual to show, it drops to rung 3
   (text-only on X) or is skipped rather than shipping a flat screenshot —
   same "an empty slot beats a failed one" principle as the photo ladder.
   This is a caption/media judgment call for the drafter, and `check-drafts.mjs`
   cannot verify "cool" automatically — flag any borderline call in the
   item's `why` field so it's auditable in the weekly review.
3. **No image at all** (X only — Instagram always requires media). A sharp
   text-only tweet beats a decorative tile every time.

   **Amended 2026-09-30 (Bots v2 W8, `docs/decisions.md`): rung 3 is closed
   for pair posts.** `check-drafts.mjs` has failed an X item without media
   since 2026-09-10, and a post is one IG+X pair on ONE image (the owner
   approves the pair as one Discord message). A text-only X item now needs a
   written `singlePlatformReason`, like any other single-platform post. When no
   never-used photo fits the beat, the beat is deferred — never repeated, never
   dropped to text-only to dodge L001.

**Retired rungs:** the **era tile** (`/eras/<id>.png`) is banned from the feed
and the checker rejects it outright, declared or not — on 2026-08-06 all 17
posted IG items were era tiles, and the "declared fallback" loophole is how
they kept shipping.
**Designed cards** (`mediaKind: "card"`) are a sanctioned image source, and
format choice — photo, card, screenshot or text — is Tree's, judged on what the
numbers say. A card is a committed PNG saved from the site's own
`/api/share-card` render (`scripts/social/fetch-share-card.mjs`), recorded as
`cardUrl`, credited "Long Live". The card redline holds wherever a card is rendered:
the no-lyrics redline is a founder guardrail — `docs/social/guardrails.md`.

**Instagram media is required. X images work** (up to 4, via the v1.1 media
endpoint since 2026-08-11) — attach a photo to X posts whenever one fits the
story; the 280-char budget is for words, `mediaCredit` carries a known credit when
the body can't.

**Rights posture** is a founder guardrail — see `docs/social/guardrails.md` (credit the photographer when known and post with no credit line when not — owner, 2026-10-01; takedown on request; no AI images of Taylor; no watermarked images; no fan edits without the creator's permission). Clickability is priority #1 — a rights-clean but boring tile is the failure mode we corrected, not the safe default.

### Voice

The site's editorial standard applies to captions verbatim
(`docs/content-ops/editorial-voice-and-pipeline.md`): **Taylor**, not bare
"Swift"; no AI-tell phrases; no wire-attribution framing (the outlet is not the
subject of the sentence — the fan's read comes first, the source second).
Register is warm, a fan telling a fan — standard sentence capitalization
(caption openers and every new sentence start with a capital letter, proper
nouns capitalized normally). The one carve-out: the four albums officially
styled all-lowercase (`folklore`, `evermore`, `reputation`, and any future
release with a lowercase official styling) stay lowercase even at a sentence
start, per `era-capitalization.mjs` — that is brand-name styling, not
register, and is unaffected by this change (Joey, 2026-09-10 — "why aren't we
capitalizing the first letter in a sentence? drives me nuts"; supersedes the
lowercase-everything register call from 2026-08-25 below). Fan-made is implicit in the
bio, never claimed as official. The sensitive-topic blocklist and the no-fabrication rule are founder guardrails — `docs/social/guardrails.md`.

**Major personal-life events — confirmed-only carve-out:** a founder guardrail, in full in `docs/social/guardrails.md` (guardrail 4).

**Register — a fan in love, out loud (Joey, 2026-08-25).** We are fans and we
GUSH. Every caption is first-person fan reaction first, fact second: lead with
the feeling ("OMG", "i can't stop thinking about", "this makes me so happy"),
then the one concrete detail that earns it. If a caption could be read aloud
by a documentary narrator without sounding wrong, it's in the old voice —
rewrite it. Standard sentence capitalization applies (2026-09-10 update
above); detachment goes. Exclamation points and
caps-for-emphasis are welcome; 1-2 emoji max, never strings. The specificity
test still binds both ways: joy without a real detail is slop, and a detail
without joy is a museum placard. Unchanged: sourcing is absolute — gush only
over what's real, never invent a stat, quote, or event; the blocklist;
Taylor, not "Swift"; no AI-tell phrases; never speak as Taylor or her team.

---

## 3. Metrics and the monthly review

### What we actually have

`social/metrics/<date>.json`, written daily by `growth-snapshot.yml`:
follower count per platform + `postsToday`. That is the entire automated
telemetry — there is **no reach, saves, or share data in the pipeline**.

Honest baseline, 2026-08-11: **X 0, Instagram 1, Facebook 8** followers, ~3.5
weeks after launch. growth-plan §5's day-30 target (500-1,500 IG) missed by
three orders of magnitude. Not a reason to panic — the account posted 35 near
identical captions on 12 repeating images to nobody — but any target written
against that old curve is fiction. Reset below.

### The weekly scorecard (Tree computes it, every run)

| Metric | Source | Reading |
|---|---|---|
| Follower delta per platform | `social/metrics/*.json`, week over week | The only outcome number we own |
| Posts shipped vs planned | `social/posted/` vs last week's calendar | Calendar adherence; <80% means the calendar is unrealistic, not that the drafter is lazy |
| Failed posts | `social/failed/` new files | Should be **0**. Any X failure means the sibling rule leaked |
| Distinct opener patterns | last 14 days of posted bodies | Target ≥ 12 distinct in 14 days. This is the metric that would have caught the current failure on day 3 |
| Media mix | queue items' `media` + `mediaKind` | Target (2026-08-12), **computed over media-carrying posts only** (text-only X posts are excluded — they are a legitimate rung of the ladder, not a miss): **≥70% `photo`** (a real photograph of Taylor), the rest `site-screen` on launch/thread posts. Separately: **every Instagram post carries media by definition, so the IG grid alone should read ≥70% photo tiles.** Era-art is 0% by construction (checker-banned); ANY era-art or undeclared media shipping is a broken gate, not a style miss |
| Campaign mix | `campaign` prefixes | Roughly 1 launch arc, **6 thread beats** (one per thread, §1(b) as of 2026-10-09), 4-5 news reserves, 4-5 timeline beats, 2-3 mood, rest heartbeat, per month |

**Engagement proxy** (since no reach data exists): **followers gained per post
published**, weekly. Crude, but it moves when something lands and it needs no
new plumbing. Report it as a ratio and never over-read a single week.

**The one human input:** once a month the founder-task issue asks for the top 3
IG posts by reach/saves, pasted from IG Insights. 2 minutes, and it is the only
per-post engagement signal that exists. Tree names those 3 in its next monthly
review and says what they had in common.

### Targets — Marjorie's (moved to her weekly plan 2026-10-01)

Growth targets are Marjorie's: she sets them in the weekly `weekly-plan` issue
(`docs/agents/runner-prompts/marjorie-weekly-review.md`), judges Tree's
experiments against them, and changes them as the evidence moves. The table is
the last baseline Tree and she inherited (revised 2026-09-01 — tied to
mechanisms, not hopes); it is history once her plan restates a number.

**Why these changed:** the previous targets were floors for an account running growth-plan §6's outward-engagement engine (daily human engagement hour, following relevant accounts, Reddit non-promo participation). That engine has not been running — near-zero traction to date is a symptom of that gap, not of calendar quality. Targets below stay the same numbers but now name the mechanism each one depends on, so a miss tells us *what* to fix, not just *that* something's wrong.

| By | Instagram followers | Also true | Depends on |
|---|---|---|---|
| 2026-09-30 | **50** | zero failed posts; ≥12 distinct openers per 14 days; every one of the six threads taught twice; first 3 logged shares | Daily human engagement hour (comments + follows, growth-plan §6) running 3+ weeks; share-design pass (below) live on every heartbeat/mood post |
| 2026-10-31 | **150** | one post with measurable saves; Reddit contribution count ≥20 and the first promo post made | Reddit non-promo engine producing daily draft comments; engagement hour sustained |
| 2026-12-31 | **500** | a repeatable format identified from Insights data; first collab post with a mid-size fan account | 8+ weeks of Insights data actually arriving monthly (see below) to identify what to double down on |

**App-store launch week revised down from the old day-30 fantasy (500-1,500 was growth-plan's number for an account already running the outward engine): realistic launch-week bump is +200-500 IG in 7 days**, contingent on a pre-launch base of 150+ already built per the targets above.

These are floors for a fan account posting daily with real images and real
links plus a genuine outward-reach engine, not viral projections. One hit changes everything, and no plan can
schedule one — what a plan can do is buy a ticket every day.

**Standing blocker, not a new ask:** monthly IG Insights (top 3 posts by reach/saves) has been requested every month since 2026-08 and has never arrived. Without it, Tree cannot tell which content/format actually earns shares — the single most important number for tuning this plan — and every "double down / drop" call in the monthly review is a guess instead of a measurement.

### The monthly self-review

Last Tree run of each month, appended to `social/calendar.md` under
`## Review — <month>`, and summarized as one comment on the most recent
`founders-brief` issue:

1. The scorecard above, month over month.
2. The three Insights posts the founder pasted, and what they shared.
3. **One "double down", one "drop".** Named specifically — a format, an angle,
   a hook shape, or a slot time. Not "keep improving".
4. Rotation state advanced: next month's thread angles, next mood format, the
   next launch arc from the backlog.
5. Anything that touches `docs/social/guardrails.md` goes to the owner as a
   `founder-decision` issue — never decided quietly inside the calendar.
   Everything else is decided here by Tree; a taste dispute with Marjorie goes
   to a Fable ruling (`taste-ruling` issue), not to the owner.

*This file* is Tree's. A change to it is a PR with a written reason and the
evidence (a scorecard number, a lesson, an experiment result); Tree reports it
in the weekly plan, and Marjorie's weekly review keeps, reverts or adjusts it.
It lands without a founder merge.
