# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-10-12 → 2026-10-25.**
Written by Tree's run of Monday 2026-10-12.

**Carry the RE-DRAFT line below forward into any rewrite of this file until the
daily run has drafted it** (it is read from anywhere in the file by
`scripts/social/lib/draft-inputs.mjs`).

RE-DRAFT ask #5541 by 2026-10-14: the Community Engine day 0 announce, now scheduled as the real dated beat on **2026-10-13** below — mint a NEW story-unique `launch:community-engine:*` value, gated on seeing the live surfaces first (invariant 6). Do NOT re-draft the 10-09 easter-eggs/Karma subject: it shipped 2026-10-09. Fresh photo, fresh opener; never re-file a stranded item.

---

## 🟢 THE CHANGE THIS FORTNIGHT — a plan exists again, and the photo drought is genuinely over

**Two things changed, and the first one is this file.** No weekly plan had
shipped since **2026-09-28**: the `routine-tree-weekly-plan` run died on its
turn ceiling on **10-05** ([run](https://github.com/JW-Incorporated/swift2/actions/runs/37359424560))
and again on **10-09** ([run](https://github.com/JW-Incorporated/swift2/actions/runs/37986930121)),
and PR **#5171** — the week-of-10-05 plan — was **closed unmerged**. So the
calendar on `main` was the 09-28 one, covering 09-28 → 10-11, and it **expired
yesterday**. From 10-12 the drafter had no assignment at all. Tracking issue
**[#5470](https://github.com/JW-Incorporated/swift2/issues/5470)** is open and
`ops-fix:stuck`; the human-directed fix is **HUMAN-ACTIONS #121**. This run got
through, so the next 14 days are planned — but the routine is still the single
point of failure for the whole posting engine (Marjorie's growth strategy puts
"Tree's weekly plan and calendar ship" at **order-of-work #1**, ahead of
everything else).

**Second: the photo library is no longer the constraint, by two orders of
magnitude.** `social/photo-library.json` holds **201 entries**, of which
**~186 have never shipped** — up from 30/20 at the last plan. And
`concert-photo-sourcing.yml`, which was failing both of its last two runs when
this was last reported, is **green on its last five** (most recent
[2026-10-12T18:11Z](https://github.com/JW-Incorporated/swift2/actions/runs/38289220338)).
Nothing in this fortnight is photo-blocked, and no era below needs a reserve
list. **The constraint is now entirely supply of posting days, not supply of
pictures.**

**Do not hand-assign photos.** There is no photo table in this calendar and
there must not be one (W8, 2026-09-30): `scripts/social/prepare-draft-inputs.mjs`
assigns each beat a never-used, Instagram-sized pick from the full ledger at
draft time, and it can see drafts waiting in open PRs — a hand-written table
cannot, which is how photos got repeated. Name an **era** below only where the
era is part of the story.

---

## ⛔ OPEN INCIDENT — the poster runs green and still does not post

**An approved pair is sitting unposted right now.**
`social/queue/2026-10-11-speaknow-million-week-{ig,x}.json` were approved at
**2026-10-11T19:21Z**, scheduled **2026-10-11T23:00Z**, and are still in the
queue **20+ hours past their slot**. This is not a dead poster:
`social-poster.yml` has run every ~30 minutes and **succeeded every time**,
including 2026-10-12T19:25Z. It runs, it reports success, and it does not ship
an approved, due item. The 48h staleness clock runs from `approval.at`, so this
pair dies in `social/failed/` at **2026-10-13T19:21Z** unless something changes.

That is the sharp version of **[#4475](https://github.com/JW-Incorporated/swift2/issues/4475)**
(the social-poster exit path, open since 09-20) and **HUMAN-ACTIONS #120**. It
is also why the fortnight below is written so that **every beat stands alone**:
one pair per PR, no beat depending on a previous one having shipped, nothing
batched.

**Planning consequence:** the engine ran **2 of 7 days** last week. Thirteen
drafted beats below is the plan; it is not a forecast.

---

## How to read a slot

- **One beat a day, at `23:00Z`.** Strategy §2 ("Slots — ONE paired campaign
  beat per day") and the code agree now: `scripts/social/lib/queue.mjs:61-62`
  sets `MAX_POSTS_PER_RUN = 1` and `MAX_POSTS_PER_PLATFORM_PER_DAY = 1`. The old
  two-beat grammar is gone; `social/calendar.brief.json` is 14 entries, one per
  day, for the same reason.
- **Every beat is ONE pair: one Instagram item + one X item** sharing a
  story-unique `campaign` and `scheduledAt`, written platform-native, >20%
  divergent in copy. Facebook rides every Instagram item automatically and is
  never a slot. No single-platform exceptions below.
- **Never "X: text-only."** Every beat is one IG+X pair on ONE image —
  `check-drafts.mjs` fails an X item without media, and `strategy-params.json`
  has `media.requireImageOnX: true`. (The 09-28 calendar's standing "X is
  text-only" instruction was wrong and is retired here.)
- **A beat is drafted by its OWN day's run and never parked more than 24h out**
  (strategy §2, 2026-10-05). The staleness clock runs from `approval.at`, not
  from `scheduledAt` — that is exactly what killed the 10-03 Mood pair, approved
  54.6h before its slot and swept to `social/failed/` without one posting
  attempt. **The previous day's run never drafts a reserve day early.**
- **The campaign label is a FAMILY.** Mint the story-unique value shown — a
  reused bucket value silently kills every later post in it, forever.
- **Direction, not facts.** Every subject below is a pointer into the Vault. The
  drafter sources it; nothing here is fact-checked and nothing here may be
  repeated as a claim.
- **Three criteria on every post, not an average** (strategy §2, 2026-10-05): a
  real picture worth stopping on (`mediaEarnsItsPlace` ≥4 on its own, a 3 is a
  rewrite), text specific enough that it could not sit above another post, and a
  deep link into actual site content. **No lane is exempt from the link any
  more** — including Mood, see the ledger.
- **X length is weighted** — an autolinked URL always counts 23. Target ≤270; the
  checker hard-fails at 280.
- **Share-design pass:** every `heartbeat:` and `mood:` caption needs one
  genuine tag/share hook grounded in the actual content. Thread and launch posts
  are exempt. Never bolt on a fake one; say so in `why`.
- **📰 A NEWS RESERVE day is a slot, not a gap.** Two days below (**10-17**,
  **10-25**) are reserved for news first, each with a named fallback subject on
  the day. On a reserve day: check `events.uncovered[]` at 11:00Z, leave the slot
  for the same-day event run if an event is uncovered, otherwise draft the
  fallback. News landing on a non-reserve day may take the next unfilled beat
  inside 48h, yielding in order heartbeat → mood → a thread beat; it never takes
  the weekly timeline minimum or a launch day 0/+2/+4 (strategy §1(e2)). Cap:
  **≤2 news posts per rolling 7 days.**
- **`social/lessons.md` has no active rules this week.** L001 retired as
  *codified* — the photo-reuse rule now lives in code
  (`check-drafts.mjs:checkPhotoReuse`), which is stronger than a prompt. Record
  `critique.rulesChecked: []`; that is explicitly valid when the ledger has no
  active rule.

---

## 🧪 EXPERIMENT 01 — hashtags on Instagram · the last four arms

**Extended to 2026-10-18** by strategy §3 (answering Marjorie's ask
[#5542](https://github.com/JW-Incorporated/swift2/issues/5542)); origin is ask
[#4722](https://github.com/JW-Incorporated/swift2/issues/4722).

**Where it stands: one tagged pair, one control, both at reach ~1.** The tagged
pair is 2026-10-09 (`thread:easter-eggs:behind-the-data:2026-10-second`, IG
reach 1); the control is 2026-10-02 at reach ~1. One-versus-one at reach 1
cannot tell a working lever from an account nobody has seen yet. The shortfall
is supply, not design — the engine ran 2 of 7 days.

**Binding, and it finishes this week.** Strategy §3: every Instagram beat
planned from 2026-10-12 carries an arm, **alternating, starting TAGGED**, until
five pairs exist in total. Four arms do that, so **the arms are 10-13 → 10-16
and then they stop:**

| Date | Beat | Arm |
|---|---|---|
| 10-13 | Community Engine announce | **TAGGED** |
| 10-14 | The Runway hero | control |
| 10-15 | Blank Spaces timeline | **TAGGED** |
| 10-16 | Mood Chat day 0 | control |

That lands the required 2 tagged + 2 control on top of the 10-09 tagged pair =
**five pairs, complete on 10-16**. **Every beat from 10-17 on carries NO arm and
NO `experiment` object** — not a control either; the experiment is closed to new
arms once the fifth pair exists. A news-reserve beat is never tagged and never
counts as an arm (which is why 10-17 is the first reserve, not an earlier day).

**Counterbalancing is not possible in this window, and the readout must say so.**
Strategy §3 asks for arms counterbalanced inside a campaign family. Strict
day-by-day alternation puts the four arms in four *different* families, and the
Mood arc's beats are every other day, so they would all land on the same arm
whatever the start. So **family is a confound in this experiment and cannot be
separated from arm.** Write that into the readout rather than reporting a clean
tagged-vs-control mean.

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

**On a control slot: no hashtags and no `experiment` object.** Note "Experiment
01 control" in `why`.

**Choosing the tags — 8-12, as the last line of the Instagram caption:**

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
5. **Record the exact tag list in `why`** and cite `ask #5542`.

**Readout: the Tree run of 2026-10-19.** Strategy §3 names 2026-10-18 — that is
a Sunday and there is no Tree run on it, so the readout lands in the Monday run,
reading `social/metrics/posts/2026-10/*.json` matched by `campaign`, IG reach
first, then `like_count + comments_count`, **reported with the number of pairs it
rests on and the family confound stated.** Written down now so the result is read
honestly: against a baseline of zero across 44 posts, *any* non-zero number on a
tagged post is the signal — and zero on both arms is a real answer too. It would
mean engagement cannot discriminate anything at this follower count, and the next
experiment waits for the click attribution now shipped in
[#5486](https://github.com/JW-Incorporated/swift2/pull/5486). A 0-vs-0 is not
"hashtags don't work".

---

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-10**, `monthNumber` = 2 (whole months since 2026-08) for the whole of this window |
| **October windows + angles** (`angle = ANGLES[(2 + threadIndex) % 5]`) | Decode 10-01→05 `interactive-challenge` · Clue Web 10-06→10 `behind-the-data` · **Runway 10-11→15 `quiz-poll`** · **Blank Spaces 10-16→20 `origin-story`** · **Taylor's Version 10-21→25 `single-best-item`** · End Game 10-26→30 `interactive-challenge` |
| **ONE paired beat per thread window** (changed 2026-10-09, strategy §1(b)) | Not two slots. One beat = the IG hero + a structurally different X sibling, which is what the old "2 slots" rule was asking for. Six threads a month at one pair each = ~1.4 beats/week, which is what the 7-beat budget can actually pay for. |
| Thread progress, October | Decode **1 of 1 ✅** (10-02 shipped). Clue Web **1 of 1 ✅** (10-09 shipped). **Runway 0 of 1 — scheduled 10-14, window closes 10-15.** Blank Spaces 0 of 1 — scheduled 10-19. Taylor's Version 0 of 1 — scheduled 10-22. End Game's window (10-26→30) belongs to the calendar written 10-19 or 10-26. |
| ⚠️ **Runway is on its last chance** | Runway was **dropped in September** (window closed with 0 of 2) and its October window opened 10-11 with no calendar in place. 10-14 is inside the window and **window-bound: drop rather than slide.** A third consecutive month of The Runway never being taught is a rotation failure, not a scheduling accident. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`, all via `?mode=`. |
| ✅ **Mood HAS a deep link: `/?mode=mood`** | Corrected this run in a separate strategy PR. §1(d) claimed "no deep link exists" and §2 carved Mood out of the land-somewhere rule because of it; both were stale. `MODE_VALUES` in `deepLink.ts` has carried `mood` since #2105 and a `/?mode=mood` caption was founder-approved 09-23. **`/?mood=` is the thing that does not exist** — never write it. Every Mood beat below lands on `/?mode=mood` with standard UTM. |
| **Launch arc — `launch:mood-chat` (NEW, the fortnight's spine)** | **No new user-visible ship landed since 10-05** — the 100 PRs merged since are content backfills (track dossiers, vault lanes, privacy redlines), infra, a11y fixes and agent routines. So strategy §1(a)'s backlog takes over, and its first entry is **Mood Chat (#1560), "the clearest 'we launched a thing' story."** Beats: day 0 **10-16**, +2 **10-18**, +4 **10-20**, +8 **10-24**. §1(d): **October's monthly Mood beat is absorbed into this arc** — do not plan a separate `mood:` beat. |
| 🔴 **Mood has never shipped a post in this desk's existence** | Both halves of the 09-23 `mood:chip-poll` pair were founder-approved and died in retired PR #4544. The 10-03 `mood:era-match` pair was approved and swept to `social/failed/` by the `approval.at` staleness bug 6.6h before its slot. That is **two approved Mood posts killed on the exit path, zero shipped, across two months.** The arc above is the fix: four beats, each standing alone, each drafted on its own day. |
| **Launch — `launch:community-engine`, ONE announce beat, 10-13** | Not a four-post arc. The surfaces (#3964 Clue Web live-theory board, #3965 Clownbot fan-theory chip, #4525 fan theories in the front-page pin banner) all shipped in **September** and the announce has been deferred four times (09-28 → 10-05 → never). A three-week-stale launch does not earn four posts, but fans have still never been told, and a re-book was promised to Marjorie on ask #5541 with a 10-14 deadline. So: one honest announce, then done. **Gate: invariant 6 — do not draft until the drafter has opened www.longlivets.com and seen the surfaces render for real.** |
| Launch backlog after Mood Chat (strategy §1(a)) | pinch-zoom photo viewer (#831) → photos + focal program (#762) → shoppable Runway looks → the rumor tier. |
| **Blank Spaces relationship timeline — permanent weekly minimum** | Week of 10-12: **10-15**. Week of 10-19: **10-21**. Chapter sequence: early solo years ✅ (09-17) → Harry Styles ✅ (09-21) → **Joe Jonas ✅ (10-01, and the one post the owner has praised)** → next confirmed chapter (10-15) → the one after (10-21). Confirmed-only; no rumor-stage claim, ever. |
| **Openers — last 14 days: 8 distinct across 8 posts** | Counted by hand from `social/posted/` + `social/queue/` bodies; **`weekly-scorecard.mjs` still does not compute this** ([#4297](https://github.com/JW-Incorporated/swift2/issues/4297), open). **Burned, do not reuse verbatim or near:** *"the blank spaces timeline just reached the…"* · *"2008. she was 18, and the breakup…"* · *"the Decode thread has me spiraling again"* · *"quick challenge for the clowns 🤡 in…"* · *"the clue web has one theory that…"* · *"gut-check for the clowns 🤡 the Karma…"* · *"they spent a whole year asking if…"* · *"speak now's 1,047,000-copy week nearly doubled what…"* |
| ⚠️ **Two opener SHAPES are drifting** (my read of the captions, not a checker finding) | **(1) Series-name-first:** three of the last eight openers lead with the product's own name — *"the blank spaces timeline…"*, *"the Decode thread…"*, *"the clue web has…"*. That is the thread as subject when strategy §1(b) says the thread is the **byline**, and it fails Rule 4's specificity test — all three work equally well above each other. **(2) "…for the clowns 🤡":** two of eight (*"quick challenge for the clowns"*, *"gut-check for the clowns"*). The checker normalizes only the first ~6 words, so neither shape trips Rule 3. **Both shapes are banned for this fortnight.** Open on the *thing* — the artifact, the number, the quote, the contradiction — never on the surface's name. Not written into `social/lessons.md`: it came from my own audit, not a founder ✏️/❌, and one fortnight of correction is the proportionate response. If it recurs, it becomes a rule. |
| Media mix, last 14 days | **8 photo / 8 media-carrying = 100%**, target ≥70% ✅. Zero era tiles, zero undeclared media, zero site-screens. The gate is holding. |
| **Photo library** | **201 entries · ~186 never used · `concert-photo-sourcing` green on its last 5 runs.** No era is exhausted; nothing below is photo-blocked. First time this line has not been a blocker. |
| Fast lane, last 7 days (`createdAt`-scoped) | **0 drafted · 2 declined · 10 expired**, 1 still open (`merch-2026-10-10-patient-zero-piano-version`, deadline 10-13). Expiry is the normal outcome and 10 is not 10 failures — but 10 expiries against 0 drafts in a week the engine ran 2 of 7 days is the same supply problem, not a rubric problem. Both declines were right calls: a Kimmel clip centred on Taylor's private life (off-brand, no Long Live surface to anchor it) and a bare $0.69 variant download (`notEmbarrassed` 3 — reads as shilling). |
| Reddit non-promo contributions | **0 / 20** via `founder-task` — but **5 Reddit replies were completed this week** through the Discord queue (scorecard `redditRepliesDone`), median 9h 40m. The counter tracks a channel nobody uses; the work is happening elsewhere. Until the threshold is genuinely met and modmail-checked, **every Reddit item stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked, and never will be again.** Per-post reach/saves/shares are fetched automatically into `social/metrics/posts/` and printed by the scorecard; a post reading `n/a` simply has no insights on file yet. |
| Founder tasks | **None filed this run.** The 2026-10-09 charter amendment supersedes invariant 15's ≤3-tasks quota: Tree asks the owner only for true human-only blockers, and then only as a `HUMAN-ACTIONS.md` card. The two real blockers (**#120** poster exit path, **#121** weekly-plan turn ceiling) are already open cards — re-filing them as prose would be noise. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see. *(The repo-variables API returns 403 to this runner's token, so `SOCIAL_FREEZE` could not be read directly; it is inferred from the 10-09 pair posting and from `social-poster.yml` running unblocked every 30 minutes through 10-12T19:25Z — a set freeze would halt it.)* |
| Social event mode | **`normal`** — `npx tsx scripts/social/event-status.mjs` returns `{"mode":"normal","kind":null,"windingDown":false,"reservedBeats":0}`, matching committed `social/state/event-status.json`. No countdown and no big theory is live, so **no beats are reserved** and the 14 days below are ordinary rotation. *(Note for future runs: this script imports `@swift2/core` TS source and must be run under `npx --no-install tsx`; bare `node` fails to resolve it.)* |
| 🎥 **Official Taylor videos lead the feed** (owner direction 2026-10-11, #5509) | Primarily a **site** direction — a videos entry plus the moment embed the same day a drop lands. For social it is explicit: *"On Instagram and X the drop still ships as an image-plus-text pair — guardrail 5 permits no video posting — written to send fans to the video on the site."* So **an official video drop is a news beat** (§1(e2)): it takes the next reserve or the next yielding beat, as an image+text pair whose whole job is to send fans to the video on longlivets.com. Never plan a video post. |

---

## 2026-10-12 (Mon) — ⚫ LOST · Tree run day

The 11:00Z daily-draft run has already passed and no calendar covered today (the
09-28 plan expired 10-11 and #5171 never merged), so there is nothing to draft
for 10-12. **Do not backfill it.** A post that is already a day late is worth
less than the next one being on time.

## 2026-10-13 (Tue) — 🚀 Community Engine announce · the carried promise

🧪 **Experiment 01: TAGGED arm.** The Instagram caption ends with the 8-12
mid-tail hashtag block and both halves carry the `experiment` object — rules and
the exact object are in the Experiment 01 section above.

- **`23:00Z` · `launch:community-engine:announce`** — mint exactly that value.
  **Gate first (invariant 6, not negotiable):** open www.longlivets.com and
  confirm for yourself that the Clownbot fan-theory chip, the Clue Web
  live-theory board, **and the front-page pin banner carrying a live fan theory
  (#4525)** render for real. If they do not, **do not draft this** — fall back to
  `heartbeat:track-fact` on an era not used below, say so in the PR body, and
  this announce is dropped for good rather than deferred a fifth time.
  Link: `/?mode=community`, `/?mode=clownbot` or `/?lens=easter-eggs` — pick the
  surface the post actually leads with and **verify the deep link resolves before
  using it.**
  Job per strategy §1(a): **one line on what a fan can now do** — not "we
  shipped", but "here's the thing you can now do". Name the real behaviour you
  saw on screen. **Assert no counts.** This is a single announce beat, not an
  arc; there is no how-to or example beat behind it.
  Media: one photo for both halves. Slide 2 only if a committed screenshot
  genuinely shows one of these surfaces **mid-use**, never a landing page or
  empty state (Joey, 2026-09-01) — **look at the file before trusting its name.**
  Hook: **direct address.** Satisfies RE-DRAFT ask #5541; cite it in `why`.

## 2026-10-14 (Wed) — The Runway hero · ⚠️ window-bound, last chance

🧪 **Experiment 01: control arm.** No hashtags, no `experiment` object — write
"Experiment 01 control" in `why`.

- **`23:00Z` · `thread:fashion:quiz-poll`** — mint
  `thread:fashion:quiz-poll:2026-10-hero`. Link `/?lens=fashion`.
  **The Runway's one paired beat for October**, and its window closes **10-15**.
  It was dropped entirely in September. **Drop rather than slide** — but dropping
  it means the thread goes untaught for a second straight month, so treat this as
  the day's priority.
  Angle `quiz-poll`: a question whose answer lives inside the thread. **Verify
  the answer is actually in the lens before writing the question**, and make the
  question answerable from looking, not from knowing. Use an X poll if the
  platform allows; the IG half asks the same question in the caption.
  Media: one photo for both halves. **Name the era in `why`** — the look is the
  story here, so match the photo's era to the item you are asking about, and do
  **not** use `speak-now` (10-11's queued pair) or Midnights (10-09).
  The thread page is a product surface, so a `/social/library/` screenshot of the
  lens **in use** earns slide 2 on Instagram if one exists.
  Hook: **the challenge.**

## 2026-10-15 (Thu) — Blank Spaces relationship timeline, week of 10-12

🧪 **Experiment 01: TAGGED arm** — same rules as 10-13, a different 8-12 tag
block chosen for this post's own subject.

- **`23:00Z` · `timeline:love-story:<chapter-slug>:2026-10-15`** — the weekly
  timeline minimum. **Mint the actual chapter slug you land on** and record it in
  `why` so the 10-19 calendar can continue the sequence. Link `/?lens=love-story`
  with standard UTM parameters.
  **Direction, not copy:** advance the chronology one chapter past the Joe Jonas
  chapter that shipped 10-01. **That 10-01 post is the owner's reference post for
  the whole account** (strategy §2's three criteria were written from it) — match
  its shape, do not reuse its angle, and **do not reopen with its first line**
  (*"the blank spaces timeline just reached the…"*, also a burned series-name-first
  shape — see the ledger).
  **Confirmed, publicly documented material only** — what was publicly
  acknowledged at the time and what she has said on the record since. No
  speculation, no rumor-stage claim, nothing about people who are not public
  figures in this story. If the Vault carries no confirmed anchor, **skip to the
  next chapter that has one.**
  Media: one photo for both halves. Hook: **the real quote** — a sourced,
  on-the-record line as the first line, attributed after.

## 2026-10-16 (Fri) — 🚀 Mood Chat launch, day 0 (announce) · the one that has to land

🧪 **Experiment 01: control arm.** No hashtags, no `experiment` object. **This is
the fifth pair — the experiment's arms end here.** Every beat from 10-17 on
carries no arm at all.

- **`23:00Z` · `launch:mood-chat:announce`** — mint exactly that value.
  **Gate first:** open Mood on www.longlivets.com, tap a real starter chip, and
  **see real songs come back** before writing a word. If it does not return
  results, do not draft this — the arc waits and you say so in the PR body.
  Link **`/?mode=mood`** with standard UTM parameters. **This is a real deep link**
  (see the ledger); `/?mood=` is not and must never be written.
  Job per strategy §1(a): **one line on what a fan can now do.** Mood is the most
  distinctive thing on the site and **has never once been posted about** — this is
  the announce it never got, not a re-run of the two Mood pairs that died on the
  exit path. Do not reuse their openers (*"Tell me your whole vibe in three
  words…"*, *"Okay be honest — which one is you today?"*) and do not re-file them.
  **Quote one starter chip verbatim** from `apps/web/lib/longlive/mood-starters.ts`
  — approved copy, never reworded.
  **Scored eras only: never promise or name evermore, Midnights, TTPD or TLOAS
  songs as Mood results.** Pick a chip whose real results come from scored eras
  and verify against the live feature.
  Media: one photo for both halves — match the era to the songs the chip actually
  returned. Slide 2 `mood-chat-screen.png` **only if it shows a real result on
  screen**; otherwise photo-only with the songs in the caption.
  **Share hook required.** Hook: **the artifact.**

## 2026-10-17 (Sat) — 📰 NEWS RESERVE (week of 10-12) · fallback: era deep cut

**This beat is reserved for news first** (strategy §1(e2)). At the 11:00Z run,
read `events.uncovered[]` **before** anything else:

- **An uncovered real-world event from the last 48h → draft the news beat.**
  Mint `news:<event-slug>-2026-10-17`, clear `timely` ≥4 on the six-dimension
  rubric, and drop the fallback. **An official Taylor video drop counts as news
  here** and ships as an image+text pair whose job is to send fans to the video on
  the site (owner direction 2026-10-11 — see the ledger). Never a video post.
- **Nothing uncovered → draft the fallback below.**
- **The 10-16 run does not draft this day's beat a day early.** That is what makes
  the reserve a reserve.
- **No Experiment 01 arm and no `experiment` object**, either way.

**Fallback beat:**

- **`23:00Z` · `heartbeat:track-fact:<subject-slug>-2026-10-17`** — mint a
  story-unique value. Link `/?item=<momentId>` or `/?era=<eraId>`.
  **Subject direction, and this one is a real gap worth closing:** the track
  dossiers are now genuinely deep — 150+ tracks landed across #440's batches this
  month — and **nothing on social has ever pointed a fan at one.** Marjorie's own
  growth strategy names this as the week's content gap: *"The dossiers are
  genuinely deep; nothing on social points fans at them yet."* So take **one
  track dossier** and post the single most surprising sourced thing in it.
  Source it against the Vault; keep every qualifier the source carries.
  **Not `speak-now`** (10-11's queued pair) and not an era used earlier this week.
  Media: one photo for both halves. **Share hook required** (heartbeat), grounded
  in the real detail. Hook: **the contradiction.**

## 2026-10-18 (Sun) — 🚀 Mood Chat +2 (how-to)

- **`23:00Z` · `launch:mood-chat:how-to`** — mint exactly that value.
  Only draft this if 10-16's day 0 actually shipped; if it did not, this slot
  becomes `heartbeat:symbol-thread` and the arc waits — **say which in the PR
  body.** Link `/?mode=mood` with standard UTM.
  Job: **literally where to tap.** Assume the reader has never found Mood — how
  you reach it from the homepage, what happens when you tap a chip, what you get
  back. A different chip from 10-16's, quoted verbatim.
  Scored eras only, same bar as 10-16. Media: one photo for both halves; slide 2
  only if a real in-use screenshot exists. Hook: **the challenge.**
  **No Experiment 01 arm** (the five pairs are complete).

## 2026-10-19 (Mon) — Blank Spaces hero · Tree run day

- **`23:00Z` · `thread:love-story:origin-story`** — mint
  `thread:love-story:origin-story:2026-10-hero`. Link `/?lens=love-story`.
  Blank Spaces' **one paired beat** for October (window 10-16→20, so there is one
  day of slack behind this). Angle `origin-story`: what this thread *is*, and the
  one moment that made it worth building.
  **Not a timeline chapter** — 10-15 and 10-21 are the chapters. This is the
  thread itself: why a confirmed-only relationship timeline exists at all, and
  what it refuses to do. **Do not open with the thread's name** (burned shape —
  see the ledger); open on the moment.
  Same hard bar as every love-story beat: confirmed, publicly acknowledged
  material only; no speculation, no rumor frame, no private individuals.
  Media: one photo for both halves. A `/social/library/` screenshot of the lens
  in use earns slide 2 on Instagram if one exists. Hook: **the artifact.**

## 2026-10-20 (Tue) — 🚀 Mood Chat +4 (example output)

- **`23:00Z` · `launch:mood-chat:example`** — mint exactly that value.
  Only draft this if 10-16 shipped. Job per strategy §1(a): **one real result the
  feature produced** — an actual chip, the actual songs it returned, in order.
  The proof it's good, not a description of it. Run it yourself and report what
  came back; **assert nothing you did not see on screen.**
  Link `/?mode=mood` with standard UTM. Scored eras only — if the chip you want
  returns an unscored-era song, pick a different chip rather than editing the
  result.
  Media: one photo for both halves, era-matched to the songs returned; slide 2 a
  screenshot of that actual result if one is committed. Hook: **the number.**

## 2026-10-21 (Wed) — Blank Spaces relationship timeline, week of 10-19

- **`23:00Z` · `timeline:love-story:<chapter-slug>:2026-10-21`** — the weekly
  timeline minimum. Mint the actual chapter slug and record it in `why`.
  Link `/?lens=love-story` with standard UTM parameters.
  **Advance one chapter from 10-15** — never a restatement of it, and never the
  same chapter told from a different angle. Same confirmed-only bar. If the Vault
  carries no confirmed anchor for the next chapter, skip forward to one that does
  and say which you skipped in `why`.
  Media: one photo for both halves. Hook: **the number** (a date, a gap, a
  count) — not the real-quote hook, which 10-15 has.

## 2026-10-22 (Thu) — Taylor's Version hero (window 10-21→25)

- **`23:00Z` · `thread:taylors-version:single-best-item`** — mint
  `thread:taylors-version:single-best-item:2026-10-hero`. Link
  `/?lens=taylors-version`.
  Taylor's Version' **one paired beat** for October. Angle `single-best-item`:
  **one** item from the thread, told whole. The thread is the byline, not the
  subject — and **do not open with its name** (burned shape). A different item
  from the 09-22 origin-story post that shipped from this lens; read that post
  first so you do not retell it.
  Media: one photo for both halves — name the era in `why` and match it to the
  item. Hook: **the contradiction.**

## 2026-10-23 (Fri) — Heartbeat · symbol thread

- **`23:00Z` · `heartbeat:symbol-thread:<motif-slug>-2026-10-23`** — mint a
  story-unique value. Link `/?lens=easter-eggs` with standard UTM.
  Subject direction: one motif from the Invisible Strings atlas, traced across
  **two eras at most** — the discipline is depth on one thread, not a list.
  **Source every appearance against the Vault**; a motif the atlas does not
  actually carry is an invented fact. If the strongest motif runs through an era
  already used this fortnight, pick the next one.
  This is the fortnight's only pure heartbeat, so it is also the yield slot:
  **news landing on a non-reserve day takes this beat first** (strategy §1(e2)).
  Media: one photo for both halves. **Share hook required**, grounded in the real
  motif. Hook: **the number.**

## 2026-10-24 (Sat) — 🚀 Mood Chat +8 (callback)

- **`23:00Z` · `launch:mood-chat:callback`** — mint exactly that value.
  Only draft this if 10-16 shipped. Job: tie Mood to a fan use-case and invite a
  reply — *"what did yours give you?"* — the one place in the arc where asking is
  the point. Link `/?mode=mood` with standard UTM.
  **Quote no fan content** unless you have permission; if replies exist on the
  earlier arc posts and permission is not obvious, describe rather than quote.
  A fourth distinct chip, verbatim, different from 10-16/10-18/10-20's.
  Media: one photo for both halves. Hook: **the honest question** — one we would
  actually like answered.

## 2026-10-25 (Sun) — 📰 NEWS RESERVE (week of 10-19) · fallback: on this day

**Second news reserve of this window** (strategy §1(e2)). Same procedure as
10-17: at the 11:00Z run, an uncovered real-world event from the last 48h takes
this slot as `news:<event-slug>-2026-10-25` and the fallback **slides into the
calendar written 10-26** rather than being dropped. An official video drop counts
as news and ships image+text, pointing at the video on the site. Nothing
uncovered → draft the fallback. **The 10-24 run leaves this day alone.** No
Experiment 01 arm either way.

**Fallback beat:**

- **`23:00Z` · `heartbeat:on-this-day:<moment-slug>-2026-10-25`** — mint a
  story-unique value. Link `/?item=<momentId>` with standard UTM.
  Subject direction: search the Vault for a moment genuinely **dated October 25**.
  **If there is no real dated match, do not stretch one** — fall back to an era
  deep cut on an era not used earlier in this fortnight and say so in `why`. A
  fabricated anniversary is the worst thing this lane can ship.
  Media: one photo for both halves. **Share hook required.** Hook: **the date** —
  the one slot in the fortnight where the date-stamp opener is the right shape,
  and only if the date is real.

---

## What the queue already covers

**No date in 2026-10-12 → 2026-10-25 is covered by a queued item.** `social/queue/`
holds exactly two files, both for **10-11**, which is outside this window:
`2026-10-11-speaknow-million-week-{ig,x}.json` (approved 10-11T19:21Z, scheduled
10-11T23:00Z, **still unposted** — see the open incident above). They are not
coverage for anything below, and if they are swept to `social/failed/` on
10-13T19:21Z **do not re-file them**: that heartbeat value is then permanently
dead and a re-draft would need a new story-unique value and a fresh subject.

Two daily-draft PRs are open and **both CONFLICTING** — **#5443** (10-09) and
**#5495** (10-10). Their subjects were re-booked by #5543 and the 10-09
easter-eggs/Karma subject has already shipped. They are historical, not coverage.

---

## Founder tasks scheduled in this window

**None.** The 2026-10-09 charter amendment supersedes invariant 15's ≤3-per-week
quota: Tree asks the owner only for true human-only blockers — money, a password
or secret, an approval, a physical-world action — and then only as a
`HUMAN-ACTIONS.md` card, never as `founder-task` prose.

The two genuine blockers are already open cards and are **not** re-filed here:
**#121** (fix `routine-tree-weekly-plan`'s turn ceiling — the reason no plan
shipped for two weeks, tracking issue #5470) and **#120** (the social-poster exit
path, #4475 — the reason the 10-11 pair is still sitting in the queue).

**Deliberately not asked:** the monthly IG Insights paste (per-post insights are
fetched automatically now — the ask is retired), and the Android/Play Store
status (five runs, zero answers, barred under invariant 6 and dropped).

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
