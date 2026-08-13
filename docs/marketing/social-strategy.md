# Long Live — social operating strategy

**Version 1 — 2026-08-11. Owner: Tree (`docs/agents/tree.md`), the standing
social-media manager. Founders steer; Joey has final say on anything
product-facing.**

This file **supersedes `docs/marketing/growth-plan.md` §4-6 as the posting
strategy.** Growth-plan keeps everything else and stays live: §0 mental model,
§1-3 accounts/handles/profile kit, §7 Reddit + Tumblr etiquette, §8 site↔social
integration + UTM, §9 founder-action table. Where the two disagree about *what
to post and when*, this file wins.

Who does what, in one line each:

- **Tree** plans (this strategy → `social/calendar.md`, one weekly run).
- **The Growth daily run** drafts what the calendar says into `social/queue/`.
- **`social-poster.yml`** ships it every 30 min. No human in the path.
- **Growth's charter** (`docs/agents/growth.md`) still owns listening, metrics,
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

Five campaigns. Every queue item belongs to exactly one, named in its
`campaign` field with this taxonomy (so metrics group without parsing prose):

| Campaign | `campaign` value | Share of slots |
|---|---|---|
| Feature launch | `launch:<feature-slug>` | 0-6 slots per launch, bursty |
| Thread cycle | `thread:<lensId>:<angle>` | 2 slots per thread per month (12/mo) |
| Mood beat | `mood:<format>` | 2-3 slots per month |
| Daily heartbeat | `heartbeat:<pillar>` | everything left (~60-70%) |
| Human reach | *(no queue item — a GitHub issue)* | 0 slots, ~15 min/week of Joey |

### (a) Feature launch — the coordinated push

**Trigger.** Any **user-visible ship**: a merged PR that changes what a visitor
can see or do on longlivets.com. Not refactors, not content backfills, not
infra. Tree checks merged PRs since its last run and decides; when it's
borderline, the test is "could a fan notice this without being told?"

**Never tease unshipped work.** The Android app (#1815) is the standing example
— it is not shipped, so it does not exist on social until it is in a store.

**The arc — 4 posts over 8 days** (a 5th optional at +14):

| Day | Post | Platform | Job | Media |
|---|---|---|---|---|
| 0 | **Announce** | IG + X sibling | One line on what it does. Not "we shipped" — "here's the thing you can now do." | Screenshot of the feature, mid-use |
| +2 | **How-to** | IG | Literally where to tap. Assume the reader never found it. | Screenshot sequence or designed card with the tap path |
| +4 | **Example output** | IG + X sibling | One real result the feature produced. The proof it's good. | Screenshot of that actual result |
| +8 | **Callback** | X | Tie it to a fan use-case; invite a reply ("what did yours give you?"). | Card or none |
| +14 | *(optional)* **What you did with it** | IG | Only if real replies/DMs exist to quote (with permission). Skip silently otherwise. | Screenshot or card |

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

**Each window gets 2 slots:** one IG (the hero — screenshot of the thread on the
real site) and one X (a structurally different post, never the IG caption
truncated), placed anywhere in the window.

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

### (c) Mood beat — monthly, starter-chip driven

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

| Format | `campaign` | Shape |
|---|---|---|
| Chip poll | `mood:chip-poll` | X: three chips, "which one is you today", answer by tapping Mood. |
| What it gave me | `mood:result` | IG: one chip + a screenshot of the **real** songs it returned. The strongest one — it proves the thing works. |
| Chip of the week | `mood:chip-spotlight` | IG card of a single chip, big; caption is the fan-recognition beat ("feral about a bridge" is the deepest cut in the set and the one that says *we know you*). |

**When a feature-launch arc is about Mood, that month's beat is absorbed into
the arc.** Don't run both — it doubles Mood to 8 slots in a month and the grid
reads like an ad.

### (d) Daily heartbeat — the everyday posts, with hook craft

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

**Rule 6 — always land somewhere.** Every heartbeat post carries a deep link
(era / item / lens) with the UTM tags from growth-plan §8. "longlivets.com" bare
is only for Mood posts, which have no deep link.

**Rule 7 — mind X's real length limit, and it's weighted, not raw characters.**
X counts any autolinked URL (including a bare domain like
`longlivets.com/?utm=...`) as exactly **23** characters regardless of its real
length, most emoji/CJK as 2, everything else as 1 — not the string's plain
character count. Target **≤270 weighted characters**; `check-drafts.mjs` hard
fails anything over the real **280**. A caption that reads short in an editor
can still be 300+ weighted once the link is counted — this, not duplicate
sibling copy, is what actually broke 11 of 12 `social/failed/` items (§0,
corrected 2026-08-11).

### (e) Human reach — the lane APIs can't touch

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

### Slots — 3 per day, fixed times

| Slot | Time (UTC) | Local | Platform | Normally filled by |
|---|---|---|---|---|
| **A** | `15:00Z` | 11am ET / 8am PT | X | heartbeat (on-this-day when today has a real Vault match) |
| **B** | `23:00Z` | 7pm ET / 4pm PT | Instagram | the live campaign — launch arc, thread hero, or mood beat; heartbeat otherwise |
| **C** | `23:30Z` | 7:30pm ET / 4:30pm PT | X | campaign sibling on campaign days; a **different** heartbeat subject otherwise |

Evening-US is the priority window (growth-plan §6), which is why the IG slot and
the stronger X slot sit there. Facebook rides every IG post automatically
(`postToFacebookPage`) — it is never planned separately.

**Weekly volume: 7 IG + 14 X = 21 posts.** That sits under every cap: the poster
allows 5 per run and 10 per platform per day, and 3 slots/day stays inside the
Growth run's ≤4 drafts per run.

### Sibling rule + the X length rule

**Heartbeat days never sibling-pair.** Slot C is a different subject from slot
B, full stop. Only campaign posts run true IG+X siblings, and when they do:

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

### Media — the source ladder (REWRITTEN 2026-08-12: Taylor first)

Joey's verdict after the 2026-08-11/12 incident, verbatim: *"We are a Taylor
Swift fan site whose social media has no pictures of Taylor Swift."* That ends
the screenshot-first ladder. The grid's job is to show Taylor; the product is
the byline. Enforced in code by `scripts/social/check-drafts.mjs` +
`scripts/social/lib/queue-schema.mjs` (the `mediaKind` standard, see
`social/README.md`) — this section describes the gate, it is not the gate.

1. **A real photograph of Taylor** — `mediaKind: "photo"`. THE default for
   every post. Source it from the repo's own credited corpus —
   `supabase/seed/content/**` `moment.photos` (1,000+ entries, url + credit)
   and `apps/web/lib/longlive/lenses.ts` (per-era Getty/Wikimedia with
   captions) — rehost it under `apps/web/public/social/library/photos/`
   (≤1.5MB), record `mediaCredit` + `mediaSource` on the queue item, and put
   the credit line in the caption whenever the platform's length budget
   allows. Verify the download is the real image (view it — a CDN can serve a
   placeholder to curl), and that Taylor is actually in the frame.
2. **Site screenshot** — `mediaKind: "site-screen"`, only for posts whose
   subject IS a product surface (a launch, a how-to). Must be a committed
   `/social/library/` asset. On Instagram, prefer a carousel: Taylor photo as
   the grid tile, the screenshot as slide 2 — the grid shows Taylor either
   way.
3. **No image at all** (X only — Instagram always requires media). A sharp
   text-only tweet beats a decorative tile every time.

**Retired rungs:** the **era tile** (`/eras/<id>.png`) hard-fails the checker
outright, declared or not — on 2026-08-06 all 17 posted IG items were era
tiles, and the "declared fallback" loophole is how they kept shipping.
**Designed cards** (`render-card.mjs`) are retired from the feed for the same
reason: a typography tile is still not a picture of Taylor. The script stays
for possible non-feed uses; re-admitting cards to the feed is a founder call.
The card redline survives the retirement, wherever a card is ever rendered:
**cards never reproduce lyrics** — titles, dates, numbers, and sourced quotes
only, the same no-lyrics line the Mood starter chips hold (docs/decisions.md
2026-07-09 lyrics entry).

**Instagram media is required. X images work** (up to 4, via the v1.1 media
endpoint since 2026-08-11) — attach a photo to X posts whenever one fits the
story; the 280-char budget is for words, `mediaCredit` carries the credit when
the body can't.

**Rights posture** (decision entry 2026-07-09 + 2026-08-11): hosting real
internet photos is unrestricted — embed, hotlink, or rehost, press/agency all
fine — **with credit, always**, as a knowing accepted risk;
takedown-on-request without argument. The hard bars: **no AI-generated
images, ever**, and any reference/comparable stand-in must be visibly labeled
as such (never passed off as Taylor). No watermarked images, no fan edits
without the creator's permission. Clickability is priority #1 — a
rights-clean but boring tile is the failure mode we corrected, not the safe
default.

### Voice

The site's editorial standard applies to captions verbatim
(`docs/content-ops/editorial-voice-and-pipeline.md`): **Taylor**, not bare
"Swift"; no AI-tell phrases; no wire-attribution framing (the outlet is not the
subject of the sentence — the fan's read comes first, the source second).
Register is lowercase-warm, a fan telling a fan. Fan-made is implicit in the
bio, never claimed as official. The `#36`/Clownbot blocklist (health, pregnancy,
sexuality, family/minors, legal wrongdoing, private individuals,
relationship-existence speculation) applies to every draft, and nothing is ever
invented — no stat, quote, or trend without a Vault item or a verifiable source
behind it.

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
| Campaign mix | `campaign` prefixes | Roughly 1 launch arc, 12 thread slots, 2-3 mood, rest heartbeat, per month |

**Engagement proxy** (since no reach data exists): **followers gained per post
published**, weekly. Crude, but it moves when something lands and it needs no
new plumbing. Report it as a ratio and never over-read a single week.

**The one human input:** once a month the founder-task issue asks for the top 3
IG posts by reach/saves, pasted from IG Insights. 2 minutes, and it is the only
per-post engagement signal that exists. Tree names those 3 in its next monthly
review and says what they had in common.

### Targets — reset for reality

| By | Instagram followers | Also true |
|---|---|---|
| 2026-09-30 | **50** | zero failed posts; ≥12 distinct openers per 14 days; every one of the six threads taught twice |
| 2026-10-31 | **150** | one post with measurable saves; Reddit contribution count ≥20 and the first promo post made |
| 2026-12-31 | **500** | a repeatable format identified from Insights data |

These are floors for a fan account posting daily with real images and real
links, not viral projections. One hit changes everything, and no plan can
schedule one — what a plan can do is buy a ticket every day.

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
5. Anything that needs a founder decision goes to a `founder-decision` issue —
   never decided quietly inside the calendar.

A change to *this file* is a founder-approved PR. Tree may propose one in its
review; it may not edit strategy into existence on its own.
