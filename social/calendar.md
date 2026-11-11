# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-11-09 → 2026-11-22.**
Written by Tree's weekly run of 2026-11-09 (a Monday, on schedule). Not the last
run of the month, so no monthly review here — the next is due the last Tree run
of November (2026-11-30).

**No photo table in this calendar, by design (W8, 2026-09-30).** The daily
pre-compute (`scripts/social/prepare-draft-inputs.mjs`) hands each beat a
never-used, Instagram-sized photo from the full ledger. A hand-assigned table
cannot see drafts waiting in open PRs, which is how photos got repeated. Era is
named below **only** for a themed beat — and where it is named, it is named
because `heartbeat:era-deep-cut:` and `thread:easter-eggs:` are
`THEMED_CAMPAIGN_PREFIXES` (`scripts/social/lib/queue-schema.mjs:66`) and hard-require
a `photoEra` whose bound photo carries that tag.

**No experiment arms. No `experiment` object on any item** (strategy §3, closed
in PR #6105). Every Instagram beat carries the mid-tail tag block as the
**default**. There is deliberately no replacement experiment this fortnight
either — see the ledger.

**Text-only X posts are BANNED** (owner, 2026-10-30; hard-gated by
`check-drafts.mjs`, PR #6433). Every beat below is one IG + X pair on ONE image.
No image, no post — pick a different subject or skip the slot.

---

## 🔴 THE CHANGE THIS FORTNIGHT — the launch arc is a real new ship, and the gate it waits on is one a run can actually clear

**`launch:photo-viewer` has now been deferred four times, and the fourth was not
arithmetic — it was a gate no automated run can clear.** The 11-02 calendar put
day 0 on 11-09 behind a hard check: *open www.longlivets.com on a phone and
pinch-zoom a photo.* The 11-09 daily run cannot hold a phone, so it did the only
honest thing available and drafted the beat's named `reputation` fallback
instead (`social/queue/2026-11-09-reputation-katy-perry-olive-branch-*.json`,
`why`: "invariant-6 phone gate couldn't be verified in an automated run"). A
fifth placement behind the same gate would produce a fifth fallback. **So the
gate changes hands rather than dates:** the 60-second phone check is filed as
**HUMAN-ACTIONS #150**, the only thing in this plan a founder is asked for, and
the arc returns to the calendar the first Monday after it comes back.

**And it is no longer this fortnight's arc, because a genuinely new user-visible
ship landed.** §1(a) says a new ship takes precedence over the backlog, and the
week to 11-08 shipped the biggest visible change to the front of the site in
months: **[#6562](https://github.com/JW-Incorporated/swift2/pull/6562)** replaced
the egg doorway with a pinned **"This week's news"** section on the feed (owner's
own ask, 2026-11-03), and **[#6708](https://github.com/JW-Incorporated/swift2/pull/6708)**
+ **[#6719](https://github.com/JW-Incorporated/swift2/pull/6719)** made the
videos on live news items actually play, in the card and in the detail view, with
**[#6566](https://github.com/JW-Incorporated/swift2/pull/6566)** putting the
image and labelled source links on them. A fan who opened the site this week
noticed without being told. That is `launch:news-feed`, placed day 0 / +2 / +4 on
**11-15 / 11-17 / 11-19** — spread across the two weeks precisely so §1(e2)'s
≥2-displaceable floor holds in every rolling window (the arithmetic is run in
full at the bottom of this file, and it passes at 2 or better everywhere).

**Its day-0 gate is one the 11:00Z run can clear by itself:** fetch
www.longlivets.com and confirm the pinned "This week's news" section renders with
at least one real item in it. No phone, no founder, no fifth deferral. The claim
day 0 makes is also the claim that check verifies — nothing about video playback
on a device nobody has touched. **Video is the subject, never the medium**
(invariant 5): every post in this arc is one photo plus text, and the arc never
says "watch this here."

---

## 🟠 The editorial miss — `okay` died and the formula moved one word over

**Last week's gate worked, and the shape walked around it.** PR #6535 added
`okay`/`ok` to `openers.bannedOpeners` after 4 of 22 posts opened on one. Not a
single post since 10-31 has opened on `okay`. **But the six Instagram captions
posted 11-02 → 11-08 opened, in order:** *"i went digging through The Decode…"* ·
*"it's finally cardigan weather where i am…"* · *"this is the chapter i always
forget…"* · *"i will never be normal about this…"* · *"i did not expect to tear
up…"* · *"i cannot stop thinking about this one…"*. **Four of six open on the
literal word `i`, and six of six open on the drafter's own reaction before the
subject arrives.** Every one of them cleared the 6-word reuse gate, because words
2-6 differ every time.

This is the 2026-08-11 `did you know` finding recurring for the third time under
a third word, and the lesson about the *fix* is now the interesting part: a
banned-word list cannot catch a formula, because the formula is a shape and the
list only sees letters.

**What changed, and what deliberately did not.** A ban on first-person openers
would be wrong and I am not writing one — strategy §2's Voice section wants a fan
in love with Taylor, and *"i went digging through The Decode"* is that voice
working, with the subject in the first clause. So the params change this week is
deliberately narrow: the three exact reaction-stems that shipped —
`i cannot stop`, `i will never`, `i did not expect` — go on the banned list
([PR #6743](https://github.com/JW-Incorporated/swift2/pull/6743), branch
`tree/strategy/2026-W46-1`, reported in this week's plan, no ✅ asked). The real
gate is a **first-word diversity cap** (fail an IG draft whose first word already
opened 3 of the last 7 posted IG items), which lives in `check-drafts.mjs`,
outside this desk's mutation rights, and is asked of Marjorie this run.

**So every beat below carries one line of direction that is the actual rule:**
**the first clause carries the subject — the artifact, the number, the quote, the
question, the contradiction — not the writer's reaction to it.** Feel it in
sentence two.

**Sibling drift is, for the first time in three weeks, not on this list.** 11-02,
11-04, 11-06 and 11-08 all shipped halves with genuinely different openings. The
prose direction is holding; ask [#6539](https://github.com/JW-Incorporated/swift2/issues/6539)
(a sibling-opener check in `check-drafts.mjs`) stays open and is not re-asked.

---

## Ledger

| State | Value |
|---|---|
| **⚫ Dark day, 11-05 — a library gap, not a run failure** | The 11-05 news reserve shipped nothing. The run itself **succeeded**; its PR [#6642](https://github.com/JW-Incorporated/swift2/pull/6642) drafted the 11-06 hero and deferred the 11-05 beat with the cause stated exactly: its named fallback was `heartbeat:era-deep-cut:patient-zero-…`, era **`the-life-of-a-showgirl`**, and that era had **zero tagged photos** in the library — while `era-deep-cut` is a `THEMED_CAMPAIGN_PREFIXES` family that hard-requires a matching `photoEra`. No caption fixes a missing photo. **That gap is now closed: the library carries 7 `the-life-of-a-showgirl` photos, all 7 never used.** So the subject is re-placed on 11-11 below, and the planning lesson is written into this file's own rules: **a themed beat may only name an era whose bucket has a never-used pick** — checked, this run, for every era named below. |
| Cycle month | **2026-11** (`monthNumber` = 3), whole months since 2026-08. Unchanged across this whole window. |
| **November windows + angles** (`angle = ANGLES[(3 + threadIndex) % 5]`, recomputed this run, same result) | Decode 11-01→05 `behind-the-data` · Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces 11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` · End Game 11-26→30 `behind-the-data`. **Three fall inside this window** — Runway, Blank Spaces and Taylor's Version; End Game belongs to the 11-23 or 11-30 run. |
| **Thread progress, November — 2 shipped, 3 placed here, 5 of 6 by 11-22** | Decode ✅ 11-02 (`behind-the-data`, 42 clues) · Clue Web ✅ 11-06 (`quiz-poll`, the "willow" golden string) · Runway **11-12** · Blank Spaces **11-16** · Taylor's Version **11-21**. End Game's window (11-26→30) is outside this file. **No make-good is owed** — October's one was spent on 10-30. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`** (strategy §1(d)). `?mood=` is not a thing and never was. |
| **🚀 Launch arc — `launch:news-feed`, days 0/+2/+4 placed** | **11-15 / 11-17 / 11-19**, day **+8 on 11-23 handed to the 11-16 run**. Subject: the pinned "This week's news" section (#6562) and playable video on live items (#6708, #6719, #6566). First user-visible ship to earn an arc since `launch:shop-the-look`. Day 0 is 7 days after the earliest of those merges and 7 days after the latest — comfortably past §1(a)'s ≥24h floor. **Day-0 gate (satisfiable by the 11:00Z run, which is the point):** fetch www.longlivets.com, confirm the pinned "This week's news" section renders with ≥1 real item. If it does not render, do not draft day 0 — say so in the PR body, fall back to `heartbeat:era-deep-cut` on `midnights` (39 never-used, untouched this fortnight), and the arc waits. |
| **🚀 `launch:photo-viewer` — deferred a fourth time, and this time with the blocker named and filed** | The feature is real and shipped: `packages/ui/src/reader/moment/ZoomableImage.tsx` (pinch, pan, double-tap and ctrl/cmd+wheel) mounted by `MomentLightbox.tsx`, mounted by `MomentDetail.tsx`, with `ZoomableImage.test.ts` in the suite that gates every merge. What is *not* verified is how it feels on a real phone, and **no automated run can verify that** — which is why 11-09 fell back. Filed as **HUMAN-ACTIONS #150** (~60 seconds). **It returns to the calendar the first Monday after that card closes, and not before.** Note for whoever places it: the gate's old wording was also wrong about the surface — it is the moment **lightbox gallery** (tap a photo on a moment, it opens full-screen), not "any item page photo". |
| Launch backlog, in order behind the news feed | `launch:photo-viewer` (#831, blocked on HA #150) → photos + focal program (#762) → `launch:community-engine` (when it ships — #5864/#6100 are still schema and reader work, so invariant 6 forbids teasing it) → shoppable Runway looks → the rumor tier. `launch:shop-the-look` stays closed at 3 of 4; `launch:mood-chat` stays closed at 1 post. |
| New user-visible ships, 11-02 → 11-09 | **Yes — one cluster, and it takes the arc.** 120 PRs merged. The video-first news work is the ship: [#6562](https://github.com/JW-Incorporated/swift2/pull/6562) (pinned "This week's news" replaces the egg doorway), [#6708](https://github.com/JW-Incorporated/swift2/pull/6708) + [#6719](https://github.com/JW-Incorporated/swift2/pull/6719) (video embeds play in the card and the detail view), [#6721](https://github.com/JW-Incorporated/swift2/pull/6721) (media-aware era-feed interleave), [#6566](https://github.com/JW-Incorporated/swift2/pull/6566) (image + labelled source links on news posts). Nearest misses that are **not** an arc: [#6674](https://github.com/JW-Incorporated/swift2/pull/6674)/[#6630](https://github.com/JW-Incorporated/swift2/pull/6630) (clownbot lore count), [#6616](https://github.com/JW-Incorporated/swift2/pull/6616)/[#6611](https://github.com/JW-Incorporated/swift2/pull/6611)/[#6617](https://github.com/JW-Incorporated/swift2/pull/6617) (live-feed freshness and RLS). The rest was the news writer/judge pipeline, vault lanes, growth snapshots and bookkeeping. |
| **Mood beat** | **November's beat ✅ SHIPPED 11-03** (`mood:era-match:2026-11-03`, the "cardigan weather" chip) — the second Mood post this desk has ever landed and the first airing of the `era-match` format, whose 10-03 attempt died unposted on the 48h clock. One beat a month per §1(d), so **no Mood beat falls in this window**; December's belongs to a December run, rotating off `era-match`. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 11-09: **11-14**. Week of 11-16: **11-22**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01) → Fearless solo 2008 (10-22) → Back to December / Lautner (10-29) → **John Mayer 2009 (11-04)**. Take the next two unposted chapters **in the lens's own order** off `/?lens=love-story`, name the chapter in each item's `why`, and verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — 3 in week 1, 2 in week 2** | **11-10 + 11-11 + 11-13** (week of 11-09), **11-18 + 11-20** (week of 11-16). Each carries a named fallback on its own line, and **the fallback is ALWAYS drafted** (PR #6321) — a reserve beat is never left empty for a run that may not fire. Never drafted a day early. **Why week 1 is raised to three, on real data:** §1(e2)'s three-reserve rule triggers off a *completed* week whose site-fronted moments went uncovered, and the 11-02 calendar explicitly handed that call to this run. The week of 11-02 → 11-08 is complete and shipped **zero** `news:` pairs against a 6-moment new-on-site sheet, so it triggers. **Why week 2 carries two, not three:** the week of 11-16 is not complete at plan time; the 11-16 run makes that call on its own data, and if it raises week 2 to three, the beat it converts comes from the arc's day +8 or the 11-22 timeline sliding — never from dropping a rolling window below 2. |
| **📰 Floor performance, week to 11-09** | **0 of 3, the fourth week running.** Zero `news:` pairs shipped. Both the 11-05 and 11-07 reserves took their fallbacks (11-05's never shipped at all — the dark-day row above; 11-07's Brad Paisley pair shipped), and the 11-08 reserve shipped its Nelly fallback. The 11-02 → 11-08 new-on-site sheets listed moments every day and the sensor reported nothing dispatchable at plan time again (`considered: 0`, `uncovered: []`). **The honest reading after four weeks is that the constraint is no longer the mechanism.** Three separate binding bugs have now been found and fixed (#6313's 48h scan + site-fronted promotion; #6526/#6527's recall-tuned "already covered" matcher), and the number has not moved off zero once. So this run stops asking for another fix and asks a different question instead: the one thing never tested is whether a `news:`-family pair gets drafted when a reserve's *own* named fallback is also sitting right there, ready, and strictly easier. That is a drafting-incentive problem, not a sensor problem, and **every reserve below now says it in the beat text: check `events.uncovered[]` FIRST and in writing — the fallback is the second thing you consider, never the first.** 0 of 3 stands as a miss, named, for the fourth time. |
| 🧪 **Experiment — none this fortnight, deliberately** | Unchanged from 10-26 and 11-02, same reason. Experiment 01 closed at n = 2, unreadable. Trailing-7-day reach across 12 posts was **2** this week (and 3 last week); every October IG post with insights on file is at reach 0-2. A one-impression instrument cannot resolve a caption, format or time lever. The comparison returns as a clean 3-vs-3 the first week trailing-7-day median IG reach is **≥10** (strategy §3). |
| Openers — **computed from the real posted bodies**, 10-26 → 11-08 | **24 distinct 6-word openers across 24 items — 24 of 24, a clean sweep** against the ≥12-per-14-days target ✅, second week running. **And it is the wrong measurement**, which is this fortnight's editorial finding above: the first-word tally for the six IG captions of 11-02 → 11-08 is `i ×4, it's ×1, this ×1`, and all six lead on the writer's reaction rather than the subject. `okay`/`ok` is gone (0 since 10-31 — PR #6535's gate works). **Off the menu this fortnight:** opening on the writer's reaction (any shape — *"i cannot stop…"*, *"i will never…"*, *"i did not expect…"*, *"screaming a little…"*); any bare date-stamp or *"<n> years ago"*; opening on a quoted song title; *"a little <X> detective moment for you"* (10-30); anything addressing *"the clowns 🤡"*. |
| Media mix, last 14 days | **12 photo / 12 media-carrying = 100%**, target ≥70% ✅. Every IG post carried a real Taylor photograph. Zero era tiles, zero undeclared media, zero `site-screen` posts, zero text-only X posts. The gate is holding and the grid reads as a Taylor Swift fan page. |
| **Photo supply — comfortable, and the one era gap that caused a dark day is closed** | **298 never-used** of 498 in the ledger (up from 238 a week ago), **no era exhausted**, and all 15 buckets have a next pick: `1989` 57 · `debut` 9 · `evermore` 9 · `fearless` 8 · `folklore` 15 · `lover` 23 · `midnights` 39 · `official-video` 144 · `press-photo` 10 · `red` 38 · `reputation` 20 · `site-photo` 82 · `speak-now` 38 · **`the-life-of-a-showgirl` 7 (was 0 — the 11-05 dark day's cause, now fixed)** · `tortured-poets` 5. Growing the library stays a standing priority (2026-10-01 amendment). **Thinnest buckets to watch: `tortured-poets` (5) and `fearless` (8)** — no beat below depends on either. 2 photos are held in open draft PRs. |
| Fast lane | **0 drafted, 0 declined, 0 expired** this week (scoped by `createdAt` ≥ 2026-11-02, per the T6 note: drafted intents stay in `social/inbox/` with a `queueFiles` array; only declines and expiries move to `closed/`). `social/inbox/` holds **zero** open intents. Nothing stuck. |
| **⚠️ Eight stranded `tree/draft/*` PRs, six of them from October** | Open and never cleared: [#6141](https://github.com/JW-Incorporated/swift2/pull/6141) (10-20), [#6112](https://github.com/JW-Incorporated/swift2/pull/6112) (10-19), [#6094](https://github.com/JW-Incorporated/swift2/pull/6094) (10-19, an expiry PR), [#6027](https://github.com/JW-Incorporated/swift2/pull/6027) (10-17), [#5998](https://github.com/JW-Incorporated/swift2/pull/5998) (10-16), [#5495](https://github.com/JW-Incorporated/swift2/pull/5495) (10-10), [#5443](https://github.com/JW-Incorporated/swift2/pull/5443) (10-09), plus [#6714](https://github.com/JW-Incorporated/swift2/pull/6714) (11-08). Every one of the October ones is **far past the poster's 48h staleness cap**, so none can ever ship — they are dead drafts holding photos out of the never-used pool (2 today). Ask [#5877](https://github.com/JW-Incorporated/swift2/issues/5877) already covers #5443 and #5495 and is still open; this run widens it to all seven rather than filing a second ask. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel, unmoved for a fourth week. The scorecard records **no Reddit prompts resolved this week** (0, after 0, 0 and 3). The awareness lane that feeds them is blocked on [#6089](https://github.com/JW-Incorporated/swift2/issues/6089) — unclaimed since 10-18, outside Austin's auto-build scope, waiting on a founder **"Plan approved"** comment that Marjorie's own plan already carries. See the L002 row in `social/lessons.md`. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked for again, same decision.** Trailing-7-day reach across 12 posts was 2 in total; a top-3-by-reach paste would rank noise. The ask returns the month trailing-7-day median IG reach clears §3's trigger (≥10). |
| Founder tasks | **One card filed, and it is the only founder-only item in this plan: HUMAN-ACTIONS #150**, the 60-second phone pinch-zoom check that unblocks `launch:photo-viewer` after four deferrals. No `founder-task` issue: per the 2026-10-09 amendment the owner is asked only for a true human-only blocker, and a physical-device check is exactly one. The other item in flight — the "Plan approved" comment on #6089 — stays carried in **Marjorie's** plan under *Needs the owner*; asking twice for the same click is how a lane gets ignored. Owner verdicts this week: **no drafts went to him**, the designed state since 2026-10-09. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see — no brief comment, no issue, no PR comment. *(The Actions variables API returns `403 Resource not accessible by integration` to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze row and from 12 posts having shipped through `social-poster.yml` this week, which it refuses to do under a freeze.)* |
| Social event mode | **`normal`** — the `prepare` job's sensor returns `{"mode":"normal","kind":null,"id":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`. No countdown and no live theory, so **no beats are reserved for event coverage** and the 14 days below are ordinary rotation. The sensor arrived in `.scratch/tree-inputs.json` as designed; ask [#5876](https://github.com/JW-Incorporated/swift2/issues/5876) (making it runnable on a clean checkout) is still open but no longer blocks this run. |
| Lessons ledger | **Unchanged this week, and computed rather than eyeballed.** No `social/feedback/2026-W45.jsonl` or `2026-W46.jsonl` exists and W44's rows are all `approve`, so there are **zero `edit`/`reject` rows to attribute** — no new rules, no increments, and I am not inventing one to look busy. `findCodifiableRules` returns `[]` (`lessons.autoCodify` is `false`, and L002 is not codified by hand: its fix lives in `scripts/community/**`, outside this desk's rights, already tracked on #6089/#5878). `findRetirableRules` returns `[]` — L002 is **4 weeks quiet** against an 8-week window and **4 briefs** against a ≥10 window. |

---

## 2026-11-09 (Mon) — ✅ COVERED BY QUEUE · Tree run day

- **Already drafted and merged.** `social/queue/2026-11-09-reputation-katy-perry-olive-branch-ig.json`
  and `-x.json`, campaign `heartbeat:era-deep-cut:reputation-katy-perry-olive-branch:2026-11-09`,
  `23:00Z`, both platforms, era `reputation`. **Do not plan or draft over it.**
- **It is the `launch:photo-viewer` day-0 fallback**, taken correctly — see the
  change note at the top of this file and the HA #150 row in the ledger.
- **⚠️ Open PR [#6714](https://github.com/JW-Incorporated/swift2/pull/6714) also
  targets this date** with a `heartbeat:event-news:taylor-karlie-arrowhead-2026-11-08`
  pair at `15:00Z`, and it moves the reputation pair to **11-10 `15:00Z`** to stay
  inside the poster's one-per-platform-per-UTC-day cap. That PR is internally
  consistent, so **if it has merged by the time a run reads this file, 11-10 is
  covered too** — see 11-10's own note. If it has not merged within 48h of
  `2026-11-09T15:00:00Z` it can never ship and is one of the stranded drafts in
  the ledger.

## 2026-11-10 (Tue) — 📰 NEWS RESERVE #1 (week of 11-09) · ⚠️ conditional

- **🔴 FIRST, before anything else: check whether PR
  [#6714](https://github.com/JW-Incorporated/swift2/pull/6714) merged.** If it
  did, `social/queue/` already holds a reputation pair at `2026-11-10T15:00:00Z`
  and **this beat is covered — draft nothing for 11-10** and say so in the run's
  PR body. If it did not, draft this beat as written.
- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 CHECK `events.uncovered[]` FIRST, AND SAY SO IN WRITING.** Four straight
  weeks at 0 of 3 news pairs is the account's single worst number, and every one
  of those weeks had a ready fallback sitting beside the news path. **Name what
  was in `events.uncovered[]` in the run's PR body — including "it was empty" —
  before you reach for the fallback.** A real, confirmed, sourced event dated
  inside the last 48h is drafted **here** as a pair, minted `news:<event-slug>`
  with `utm_campaign=news`, scored on the six-dimension rubric (`timely` ≥4 on
  its own, `total` ≥21). Only then the fallback. Never an empty beat (PR #6321).
- **Named fallback.** Mint `campaign` =
  **`heartbeat:event-news:millionaire-wood-question:2026-11-10`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-tloas-colin-jost-and-michael-che-nearly-get-stuck-on-wood-on-milli`.
  **Link** `/?item=vault-tloas-colin-jost-and-michael-che-nearly-get-stuck-on-wood-on-milli`.
- **`event-news`, deliberately not `era-deep-cut`.** This is a 2026 television
  moment, not a deep cut from a past era, and `event-news` is a **non-themed**
  family — so it needs no `photoEra` and the pre-compute may pick any never-used
  photo. That choice is what makes the beat draftable at all; forcing it into
  `era-deep-cut` would hard-require a `the-life-of-a-showgirl` photo and is
  exactly the shape that produced the 11-05 dark day.
- **Subject direction:** Colin Jost and Michael Che nearly getting stuck on
  "Wood" on *Millionaire*. It is funny and it is light, and almost everything
  this desk has posted in three weeks has been earnest — **let this one be
  funny.** The joke is theirs, not ours. Quote them exactly or not at all.
- **Hook direction: the first clause carries the subject** — the question they
  were actually asked, or the contradiction. **Not** a date-stamp, **not** your
  own reaction to it.
- **X half: written FIRST, as its own post** — a question-shaped subject is the
  easiest place in the fortnight to make the two halves genuinely different.

## 2026-11-11 (Wed) — 📰 NEWS RESERVE #2 (week of 11-09) · **ask #6520's unshipped moment, re-placed**

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule as 11-10: check
  `events.uncovered[]` first and say so in writing, then the fallback. Never an
  empty beat.**
- **Named fallback — ask [#6520](https://github.com/JW-Incorporated/swift2/issues/6520),
  the moment that still has not shipped.** Mint `campaign` =
  **`heartbeat:era-deep-cut:patient-zero-three-weeks-at-no-1:2026-11-11`**,
  `utm_campaign` = **`heartbeat`**, `photoEra` = **`the-life-of-a-showgirl`**,
  built on the new-on-site moment
  `vault-tloas-patient-zero-ends-its-three-week-hot-100-run-at-no-1-and-sli`.
  **Link** `/?item=vault-tloas-patient-zero-ends-its-three-week-hot-100-run-at-no-1-and-sli`.
- **🟢 Why this works now and did not on 11-05:** `era-deep-cut` is a themed
  family that hard-requires a `photoEra` with a matching photo, and on 11-05 the
  `the-life-of-a-showgirl` bucket was empty. **It now holds 7 never-used
  photos.** Set `photoEra` explicitly and take the pre-compute's pick for that
  era. If — and only if — that bucket is somehow empty again at draft time, mint
  `heartbeat:event-news:patient-zero-three-weeks-at-no-1:2026-11-11` instead
  (non-themed, no `photoEra`) rather than deferring the beat a second time.
- **Placed on 11-11 rather than the nearer 11-10 on purpose:** 11-10 may be
  covered by PR #6714, and this is the one subject in the fortnight carrying an
  outstanding commitment to Marjorie. It goes on the day with no collision risk.
- **Era note:** `the-life-of-a-showgirl`. Not used elsewhere in the week of 11-09.
- **Subject direction:** the chart run itself — three weeks at No. 1 on the Hot
  100, now sliding to No. 5. The numbers come from the moment record and the
  Vault, quoted exactly or not at all. A chart slide is not a sad story; it is
  what three weeks on top looks like on the way down.
- **Hook direction: the first clause carries the subject** — the number, or the
  contradiction. **Not** a date-stamp, **not** your own reaction.
- **`why` must cite `ask #6520`** — that citation is what finally retires it.
- **X half: written FIRST, as its own post.**

## 2026-11-12 (Thu) — Runway thread hero (window 11-11→15)

- **`23:00Z`** · mint `campaign` = **`thread:fashion:origin-story:2026-11-hero`**
- **`utm_campaign` = `thread`** — paste that literal value, nothing else (Rule 6a).
- **Link:** `/?lens=fashion` with `?utm_source=<platform>&utm_medium=social&utm_campaign=thread`.
- `angle = ANGLES[(3 + 2) % 5]` = `origin-story`. November's third thread hero.
- **Angle `origin-story`:** why the Runway thread exists and what it is for —
  the thread as something somebody built on purpose. What question was it made to
  answer? What does it let you see that scrolling a tag page does not?
- **Subject direction:** ground it in ONE concrete thing the thread documents in
  detail, so the post is specific rather than a mission statement. Verify every
  designer, date and attribution against the Vault; do not assert one this file
  has not sourced. 10-30's Runway hero was an Oscar de la Renta quiz — **pick a
  different look.**
- **Media:** pre-compute pick. The Runway lens is a genuinely visual product
  surface, so a `/social/library/` screenshot **earns IG slide 2** behind the
  photo tile — only if it shows the lens in rich actual use, never a flat page.
  Never on X.
- **Hook direction: the first clause carries the subject** — direct address or
  the honest question. **Not** a date-stamp, **not** your own reaction, and
  **not** *"a little fashion detective moment for you"* (10-30).
- **Not displaceable** (window-bound thread hero; never displaced, never slid).
- **X half: written FIRST, as its own post** — its own hook, one idea plus the
  link. Never the IG caption truncated and never its opening clause re-used.

## 2026-11-13 (Fri) — 📰 NEWS RESERVE #3 (week of 11-09)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule. Check
  `events.uncovered[]` first and say so in writing. Never an empty beat.**
- **Why a third reserve this week:** §1(e2)'s three-reserve rule, triggered on
  completed data — the week of 11-02 → 11-08 shipped zero `news:` pairs against a
  6-moment new-on-site sheet, the fourth such week. The 11-02 calendar handed
  this call to this run and this is the call.
- **Named fallback.** Mint `campaign` =
  **`heartbeat:event-news:vienna-shows-documentary:2026-11-13`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-tloas-the-cancelled-vienna-shows-get-their-own-documentary-taylor-`.
  **Link** `/?item=vault-tloas-the-cancelled-vienna-shows-get-their-own-documentary-taylor-`.
- **`event-news`, non-themed** — same reasoning as 11-10: a 2026 documentary
  announcement is not an era deep cut, and the non-themed family frees the
  pre-compute to pick any never-used photo.
- **Subject direction:** the three cancelled Vienna shows getting their own
  documentary, *"Taylor Swift Wien"*. The 2024 cancellation is a confirmed,
  heavily reported public event and the documentary is the news; **the plot
  against the shows is not the subject and must not be described, speculated
  about or dramatised** — it touches legal wrongdoing and private individuals,
  both blocklist topics. What this post is about is 200,000 people who did not
  get their night, and a film about them. Quote the announcement exactly or not
  at all.
- **Hook direction: the first clause carries the subject** — the artifact (the
  film) or the number. **Not** a date-stamp, **not** your own reaction.
- **X half: written FIRST, as its own post.**
- **Spare subject, if this one cannot be sourced cleanly:** the new-on-site
  moment `vault-tloas-i-knew-it-i-knew-you-picks-up-a-hollywood-music-in-media-nod`
  — an award nomination for "I Knew It, I Knew You", mint
  `heartbeat:event-news:i-knew-it-hmma-nod:2026-11-13`. Its site media is a
  **video** and this pipeline cannot post video (invariant 5): the *moment* is
  postable, its media is not — use the beat's pre-compute photo pick and do not
  write "watch the clip".

## 2026-11-14 (Sat) — Blank Spaces timeline (week of 11-09 minimum)

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-14`**
- **`utm_campaign` = `timeline`** — **not** `thread`. Four `timeline:` items were
  tagged `thread` in the week to 11-01, which is a different family that exists,
  so they vanished into the "other" bucket (Rule 6a's evidence).
- **Link:** `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter in the lens's own order after
  **John Mayer 2009 (shipped 11-04)**. Name the chapter in `why`. **Confirmed
  public relationship history only** — verify every person, date, event and quote
  against the Vault before it reaches copy; rumor-stage relationship-existence
  claims, countdowns and speculation stay banned outright.
- **Media:** pre-compute pick. A Blank Spaces lens screenshot may ride IG slide 2
  only under the "cool feature only" rule, and never on X.
- **Hook direction: the first clause carries the subject** — the artifact (start
  with what the photograph is) or a real sourced quote. **Not** a date-stamp,
  **not** your own reaction, **not** *"this is the chapter i always forget"*
  (11-04), and **not opening on a quoted song title** (10-29 spent that on both
  halves).
- **X half: written FIRST, as its own post.**

## 2026-11-15 (Sun) — 🚀 `launch:news-feed` **DAY 0**

- **`23:00Z`** · mint `campaign` = **`launch:news-feed:day0:2026-11-15`**
- **`utm_campaign` = `launch`**.
- **Link:** `https://www.longlivets.com/` — the front of the site, because the
  pinned section *is* the surface being shown. Standard UTM tags.
- **🔴 DAY-0 GATE — and this one a run can clear by itself.** Before drafting a
  word: fetch www.longlivets.com and confirm the pinned **"This week's news"**
  section renders with **at least one real item in it**. **If it does not, do not
  draft day 0** — say so in the run's PR body, fall back to
  `heartbeat:era-deep-cut` on **`midnights`** (39 never-used, untouched this
  fortnight; set `photoEra`), and the arc waits for a run that can confirm it.
  Never tease unshipped or broken work.
- **Angle, day 0 — what it is and why it's good.** The front of the site changed:
  where the egg doorway used to be there is now a pinned "This week's news"
  section (#6562, the owner's own 2026-11-03 ask), and the videos on live news
  items actually play now (#6708, #6719). Lead with the thing a fan can do that
  they could not do before: **open the site and see what happened this week,
  already there, without hunting for it.** Do not say "we're excited to
  announce"; say what is now true.
- **Media:** this is a product surface, so a `/social/library/` screenshot
  **earns IG slide 2** behind the Taylor photo tile — but only if it shows the
  real pinned section with real items in it ("cool feature only", Joey
  2026-09-01), never a flat page. **X takes the photo, never the screenshot**
  (permanently prohibited).
- **⚠️ Video is the subject, never the medium** (invariant 5). The post may say
  the videos play on the site; the post itself is one photo plus text, and it
  never says "watch it here".
- **Hook direction: the first clause carries the subject** — direct address, or
  the artifact. **Not** a date-stamp, **not** your own reaction.
- **Not displaceable** (§1(e2): news never displaces a launch arc's day 0/+2/+4).
- **X half: written FIRST, as its own post.**

## 2026-11-16 (Mon) — Blank Spaces thread hero (window 11-16→20) · Tree run day

- **`23:00Z`** · mint `campaign` = **`thread:love-story:single-best-item:2026-11-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=love-story`.
- `angle = ANGLES[(3 + 3) % 5]` = `single-best-item`. November's fourth hero.
- **Angle `single-best-item`:** pick the ONE entry in the Blank Spaces thread
  that would make a stranger open the lens, and spend the whole post on it. Not a
  tour of the thread — one item, fully.
- **Subject direction:** it must be a chapter the timeline beats have **not**
  already spent (early solo years, Harry Styles, Joe Jonas 2008, Fearless solo
  2008, Back to December / Lautner, John Mayer 2009, plus whatever 11-14 takes).
  Confirmed-only, verified against the Vault, and the same ban on rumor-stage
  relationship claims applies here as on the timeline beats.
- **Hook direction: the first clause carries the subject** — the artifact or a
  real sourced quote. **Not** a date-stamp, **not** your own reaction, **not** a
  quoted song title.
- **Not displaceable** (window-bound thread hero).
- **X half: written FIRST, as its own post** — and this hero and the 11-14/11-22
  timeline beats all sit on the same lens, so make sure all three are about
  genuinely different things.

## 2026-11-17 (Tue) — 🚀 `launch:news-feed` **DAY +2**

- **`23:00Z`** · mint `campaign` = **`launch:news-feed:day2:2026-11-17`**
- **`utm_campaign` = `launch`**.
- **Link:** `https://www.longlivets.com/` again, or an `/?item=` deep link to one
  real live news item — whichever the post is actually about.
- **Angle, +2 — literally where to tap.** Day 0 says the section exists; +2
  assumes the reader never found it. Where it is on the page, what the pinned
  section gives you that scrolling the feed does not, and how an item with a
  video behaves when you tap it. Describe only what you have confirmed by
  fetching the page.
- **Media:** the Taylor photo tile, plus the tap-path screens as later IG slides
  — the one beat in the arc where a screenshot carousel is the whole point. Never
  on X.
- **Hook direction: the first clause carries the subject** — direct address.
  **Not** a date-stamp, **not** your own reaction, and **not** the shape day 0
  used.
- **Not displaceable.**
- **Gate:** if day 0 did not ship (its gate failed), **this beat does not ship
  either** — fall back to `heartbeat:era-deep-cut` on `midnights` and say so.
- **X half: written FIRST, as its own post.** §1(a)'s table makes +2 Instagram-only,
  but the pairing default and the text-only-X ban both stand, so draft it as a
  pair with a genuinely different X idea; single-platform needs a real
  `singlePlatformReason` and "the table says IG" is not one.

## 2026-11-18 (Wed) — 📰 NEWS RESERVE #1 (week of 11-16)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule. Check
  `events.uncovered[]` first and say so in writing. Never an empty beat.**
- **Named fallback.** Mint `campaign` =
  **`heartbeat:era-deep-cut:<red-era-subject>:2026-11-18`**, `utm_campaign` =
  **`heartbeat`**, `photoEra` = **`red`**.
- **Subject direction, not a fact:** search the Vault for a `red`-era moment that
  carries either a **sourced quote** or a **real number** — a session detail, a
  chart or tour figure, a writing-room story. **Do not assert anything this file
  has not sourced**; if the first candidate cannot be verified, take another.
  Link the `/?item=` page for whatever you land on, or `/?era=red` if the moment
  has no item page.
- **Era note:** `red` — **38 never-used photos**, and the era is untouched across
  this whole fortnight. Set `photoEra` explicitly; it is a themed family.
- **Hook direction: the first clause carries the subject** — the number, the real
  quote, or the contradiction. **Not** a date-stamp, **not** your own reaction.
- **X half: written FIRST, as its own post.**

## 2026-11-19 (Thu) — 🚀 `launch:news-feed` **DAY +4**

- **`23:00Z`** · mint `campaign` = **`launch:news-feed:day4:2026-11-19`**
- **`utm_campaign` = `launch`**.
- **Link:** an `/?item=` deep link to **one specific real live news item** —
  different from anything days 0 and +2 linked.
- **Angle, +4 — one real result.** §1(a)'s "example output": the proof it is
  good. Pick ONE actual story the new section surfaced this week, and make the
  post about **that story**, not about the section. The feature is the reason you
  saw it, mentioned once, at the end.
- **Media:** a Taylor photo on both halves. A screenshot of that actual item may
  ride IG slide 2.
- **Hook direction: the first clause carries the subject** — the story's own
  artifact, number or quote. **Not** a date-stamp, **not** your own reaction, and
  not either shape days 0 and +2 used.
- **Not displaceable.**
- **Gate:** if day 0 did not ship, this beat does not ship either — fall back to
  `heartbeat:era-deep-cut` on `midnights` and say so.
- **Day +8 is 2026-11-23, and it belongs to the 11-16 run** — outside this
  window. It is the arc's close (§1(a): tie it to a fan use-case, invite a real
  reply). `launch:shop-the-look` closed at 3 of 4 and `launch:mood-chat` at 1 of
  4, so **say in that run's PR body whether this arc completed.**
- **X half: written FIRST, as its own post.**

## 2026-11-20 (Fri) — 📰 NEWS RESERVE #2 (week of 11-16)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule. Check
  `events.uncovered[]` first and say so in writing. Never an empty beat.**
- **Named fallback.** Mint `campaign` =
  **`heartbeat:era-deep-cut:<lover-era-subject>:2026-11-20`**, `utm_campaign` =
  **`heartbeat`**, `photoEra` = **`lover`**.
- **Subject direction, not a fact:** same bar as 11-18 — a `lover`-era moment
  with a sourced quote or a real number, verified against the Vault before it
  reaches copy, and a different *kind* of subject from whatever 11-18 took (if
  11-18 went with a number, go with a quote here).
- **Era note:** `lover` — **23 never-used photos**, untouched across this
  fortnight. Set `photoEra` explicitly.
- **Hook direction: the first clause carries the subject.** **Not** a date-stamp,
  **not** your own reaction, and not 11-18's shape.
- **X half: written FIRST, as its own post.**

## 2026-11-21 (Sat) — Taylor's Version thread hero (window 11-21→25)

- **`23:00Z`** · mint `campaign` = **`thread:taylors-version:interactive-challenge:2026-11-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=taylors-version`.
- `angle = ANGLES[(3 + 4) % 5]` = `interactive-challenge`. November's fifth hero;
  End Game's window (11-26→30) belongs to a later run.
- **Angle `interactive-challenge`:** give people something to *do* that the lens
  settles — spot the difference between a vault track and its original, place a
  re-record in order, find the one detail that changed. **Confirm the answer is
  genuinely in the lens before writing the challenge.**
- **Subject direction:** 10-23's Taylor's Version hero was a `single-best-item`
  and this is a different angle, so it may revisit the same territory — but pick
  a different album than that post did.
- **Hook direction: the first clause carries the subject** — the challenge
  itself, or the honest question. **Not** a date-stamp, **not** your own
  reaction, **not** *"ok swifties"* (hard-blocked), and **not** *"quiz for the
  group chat"* (10-26).
- **Not displaceable** (window-bound thread hero).
- **X half: written FIRST, as its own post** — a real X poll where the platform
  allows is structurally different by construction, which is the point.

## 2026-11-22 (Sun) — Blank Spaces timeline (week of 11-16 minimum)

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-22`**
- **`utm_campaign` = `timeline`** — **not** `thread`.
- **Link:** `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter after 11-14's, in the lens's
  own order. Same sourcing bar: confirmed-only, verified against the Vault,
  chapter named in `why`. **Not** the chapter 11-16's hero spent.
- **Hook direction: the first clause carries the subject**, in a different shape
  from 11-14's and 11-16's. **Not** a date-stamp, **not** your own reaction, and
  **not opening on a quoted song title.**
- **X half: written FIRST, as its own post.**

---

## Beat accounting — 14 beats, 14 days

| Reservation | Strategy | Beats | Dates |
|---|---|---|---|
| Covered by queue | — | 1 | 11-09 (reputation / Katy Perry olive branch, already merged) |
| November thread heroes | §1(b), one per window | 3 | 11-12 (Runway), 11-16 (Blank Spaces), 11-21 (Taylor's Version) |
| Blank Spaces timeline | §1(c), permanent weekly minimum | 2 | 11-14, 11-22 |
| News reserves | §1(e2) — **3** in the week of 11-09 (triggered on completed data), **2** in the week of 11-16 | 5 | 11-10, 11-11, 11-13, 11-18, 11-20 |
| Launch arc | §1(a) — `launch:news-feed`, day 0 / +2 / +4 | 3 | 11-15, 11-17, 11-19 |
| Mood | §1(d), monthly — November's ✅ shipped 11-03, outside this window | 0 | — |
| Heartbeat (displaceable) | §1(e) | 0 | — (every reserve's fallback *is* a heartbeat subject) |
| **Total** | | **14** | 14 days, 13 drafted by this plan + 1 already queued |

**Covered by queue:** **11-09** (`social/queue/2026-11-09-reputation-katy-perry-olive-branch-{ig,x}.json`,
`23:00Z`). **Conditionally 11-10** — open PR [#6714](https://github.com/JW-Incorporated/swift2/pull/6714)
moves that same pair to `2026-11-10T15:00:00Z` and puts a Karlie Kloss / Arrowhead
pair on 11-09 `15:00Z`; if it merges, 11-10's beat is covered and must not be
drafted. Every other date below is genuinely uncovered.

**Landing-slack check (§1(e2), ≥2 per rolling 7 days), window by window.** Slack
is a **reserve day (`R`)** or a displaceable beat. Reserves: 11-10, 11-11, 11-13,
11-18, 11-20. **Displaceable non-reserve beats: none** — the three thread heroes
are window-bound, the two timeline chapters are weekly minimums, the arc's three
days are protected by §1(e2), and November's Mood beat already shipped on 11-03,
so there is no heartbeat or mood beat left to yield. Slack is therefore exactly
the reserve count in each window, which is why the arc had to spread across both
weeks rather than sit inside one.

- 11-09→11-15: 11-10`R`, 11-11`R`, 11-13`R` → **3** ✅
- 11-10→11-16: 11-10`R`, 11-11`R`, 11-13`R` → **3** ✅
- 11-11→11-17: 11-11`R`, 11-13`R` → **2** ✅
- 11-12→11-18: 11-13`R`, 11-18`R` → **2** ✅
- 11-13→11-19: 11-13`R`, 11-18`R` → **2** ✅
- 11-14→11-20: 11-18`R`, 11-20`R` → **2** ✅
- 11-15→11-21: 11-18`R`, 11-20`R` → **2** ✅
- 11-16→11-22: 11-18`R`, 11-20`R` → **2** ✅

**This is the §1(a) arithmetic that deferred an arc on 10-26, run again and
passing — but only just.** Six of the eight windows sit exactly on the floor at
2, because this fortnight has no displaceable beat at all. Two consequences the
11-16 run must honour: **(1)** if it raises the week of 11-16 to three reserves,
the beat it converts comes from the arc's day **+8** or the 11-22 timeline
sliding, never from a window dropping below 2; **(2)** a major moment arriving on
a day with nothing free takes the nearest beat and that beat is **dropped rather
than slid**, recorded in the item's `why` — a major moment posted two days late
is not news.

**News landing days per calendar week, against the ≥3-moments floor:** week of
11-09 = **3 reserves** (11-10, 11-11, 11-13), each a day the 11:00Z run drafts
news into with no second workflow in the path; week of 11-16 = **2 reserves**
(11-18, 11-20), with the third-reserve call handed to the 11-16 run on completed
data. ✅

**Where a major moment lands.** Nearest free reserve first (§1(e2)'s yield
order), and the displaced beat slides to the next free day — except a
window-bound thread hero (never displaced, never slid) and the launch arc's day
0/+2/+4 (never displaced). With no displaceable beat in the fortnight, a reserve
is the only landing ground, which is the second reason week 1 carries three.

---

## Review — next due 2026-11-30

The next monthly review falls to the **last Tree run of November**. It owes: the
November scorecard against October's 22 posts; the first real reading of the news
floor (≥3 moments a week reaching both platforms inside 48h — October's weeks
were 0, 1 and 0, November's first two were 0 and 0, and three separate binding
bugs have now been fixed without the number moving, so the review owes an answer
to the drafting-incentive question this file raises instead of a fourth fix);
whether the `launch:news-feed` arc completed all four posts or closed short like
the two before it; whether `launch:photo-viewer` is still sitting behind HA #150;
whether the first-clause-carries-the-subject direction actually held or the
formula moved a third time; and whether trailing-7-day median IG reach has moved
off 0-2 at all. If it has not, the honest next question is whether this account's
reach problem is a content problem or a distribution problem, because ten months
of captions at reach 0-2 is evidence about the latter.
