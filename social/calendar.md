# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-10-15 → 2026-10-28.**
Written by Tree's run of 2026-10-15 (a Thursday — the Monday 10-12 run never
produced a plan; see the ledger's outage row).

**No photo table in this calendar, by design (W8, 2026-09-30).** The daily
pre-compute (`scripts/social/prepare-draft-inputs.mjs`) hands each beat a
never-used, Instagram-sized photo from the full ledger. A hand-assigned table
cannot see drafts waiting in open PRs, which is how photos got repeated; every
previous version of this table was superseded by the pre-compute before the
week was out. Era is named below **only** for a themed beat.

---

## 🔴 THE CHANGE THIS FORTNIGHT — the account went dark, and it was not the plan

**Nothing has posted since 2026-10-11.** The daily draft run failed on 10-12,
10-13 and 10-14, all three with the same cause, quoted from the 10-14 run log:

> `session result subtype=success is_error=true — routine step failed · reason: You've hit your weekly limit · resets 11pm (UTC)`

That is the Claude account's **weekly usage limit**, not a bug in this desk's
code, not a calendar gap, and not something a better prompt fixes. Already
filed to Marjorie three times ([#5600](https://github.com/JW-Incorporated/swift2/issues/5600),
[#5687](https://github.com/JW-Incorporated/swift2/issues/5687),
[#5766](https://github.com/JW-Incorporated/swift2/issues/5766)) and caught by
the watchdog ([#5697](https://github.com/JW-Incorporated/swift2/issues/5697));
`#5825` landed 10-15 to detect the limit and pause routines automatically.

**What it cost:** four dark days, the Runway thread window (10-11→15) consumed
without its hero shipping, Experiment 01 starved of the pairs it needs to be
readable, and two fast-lane intents sitting open past their own deadlines
because the run that sweeps them never started.

**What this calendar does about it.** It plans **13 beats for 13 draftable
days** and not one more. The standing strategy reservations — 4 October thread
heroes, 3 weekly Blank Spaces timeline beats, 3 weekly news reserves — already
claim 10 of those 13. A 4-post launch arc does not fit inside the remaining 3,
and §1(a) does not let an arc be paid for out of thread or timeline beats. So
**the Community Engine arc does not start this fortnight** (ledger row below).
Four consecutive calendars have planned that arc and zero of its posts have
ever shipped; planning it a fifth time against a budget that cannot pay for it
would be the same fiction §1(b)'s capacity note was written to stop.

---

## 🟢 The good news — photo supply stopped being the constraint

`social/photo-library.json` now holds **201 entries, 186 of them never used**
(it was 88/88 one brief ago, and 30/20 the brief before that).
`concert-photo-sourcing.yml` has gone **green five runs in a row** — 10-12 ×2,
10-13, 10-14, 10-15 — after failing both its 10-01 and 10-05 runs and landing
zero photos on each. **No era in the rotation is exhausted.** The three supply
lines are now a reported row on the weekly scorecard (strategy §3, changed this
week in PR #5871).

**Binding on the drafter, every slot:**

1. **Open the image file and look at it** before writing the item. Library
   `alt` strings on Reddit-sourced entries were generated from the post title,
   not from the picture. The Taylor-photo standard is a *content* check, not a
   path check: if Taylor is not plainly in the frame, or the image does not
   match its `alt`, take the next pick and say which one you rejected and why
   in `why`.
2. **Never write the word "unknown" (or `u/unknown`) into a caption.** An
   uncredited photo ships with no `mediaCredit` and no credit line — that is
   fine and expected (owner, 2026-10-01, `docs/social/guardrails.md` row 2). A
   known credit goes in the caption, always on Instagram, on X when length
   allows, and must match the library entry exactly.
3. **The photo comes from the pre-compute, not from this file.** Use
   `beats[].photo` as-is on BOTH halves of the pair. For a themed beat
   (`thread:easter-eggs:*`, `heartbeat:era-deep-cut:*`) set `photoEra` and take
   `photos.eras[<era>].next`; if that era is `exhausted: true`, defer the beat
   and say so — never repeat, never drop X to text-only to dodge it, never take
   an off-era photo.

---

## Ledger

| State | Value |
|---|---|
| **⚫ Outage, 10-12 → 10-15** | Daily draft run failed 10-12, 10-13, 10-14 — all three `reason: You've hit your weekly limit`. No draft PR and no post since 10-11. Filed to Marjorie ×3 (#5600, #5687, #5766); watchdog #5697; #5825 (merged 10-15) adds weekly-limit detection and an automatic pause. **Not a calendar gap and not a planning failure** — the plan it was reading had expired on 10-11 because the 10-12 weekly run also never ran. |
| Cycle month | **2026-10** (`monthNumber` = 2) for the whole window. November's angles are not this plan's business — the 10-26 run computes them. |
| **October windows + angles** (`monthNumber` = 2, `angle = ANGLES[(2 + threadIndex) % 5]`) | Decode 10-01→05 `interactive-challenge` · Clue Web 10-06→10 `behind-the-data` · Runway 10-11→15 `quiz-poll` · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| Thread progress, October | Decode **✅ shipped 10-03**. Clue Web **✅ shipped 10-09**. Runway **unshipped — its window closed today with the engine down.** Blank Spaces, Taylor's Version, End Game all still owed. **All four remaining heroes are placed below**, so October's six-threads promise is still deliverable. |
| **Runway's window is extended by one day, to 10-16** (this run's call) | §1(b) gives each window ~5 days and §1(e2) says a window-bound thread slot is dropped rather than slid. It is not being slid for convenience: a three-day engine outage consumed the window, not a planning choice, and Runway has now been dropped **two months running** (Sept 0 of 2; Oct unshipped) against a ledger row that said it must not be. One day, and only because 10-16 was otherwise a heartbeat. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`** — real, shipped, founder-approved in a 09-23 caption (strategy §1(d), corrected 2026-10-12). `?mood=` is still not a thing and never was. |
| **Launch arc — `launch:community-engine`: NOT started this fortnight** | Day 0 moves to the **first beat of the week of 2026-11-02**, after October's thread promise is discharged. Reason is arithmetic, stated in full above: 4 thread heroes + 3 timeline beats + 3 news reserves = 10 of 13 beats, and §1(a) forbids paying for an arc out of either. The surfaces (#3964, #3965, #4525) are believed live but **unverified by this run** — invariant 6's gate stands and day 0 still does not draft until a drafter has opened www.longlivets.com and seen them render. |
| Launch backlog, in order behind it | `launch:community-engine` → pinch-zoom photo viewer (#831, merged 2026-07-18, live, never promoted) → photos + focal program (#762) → the rumor tier. |
| New user-visible ships, 10-05 → 10-15 | **None that earn an arc.** 100 PRs merged; the user-visible ones were fixes and safety work inside existing surfaces (#5768 feed-card photo fronting, #5835/#5848 push-notification safety, #5846/#5836 media gates) — real, but nothing a fan notices without being told, which is §1(a)'s test. #5864 (community engagement columns) is schema work, i.e. the Community Engine is **still being built**, which is the second reason its arc waits. |
| `launch:shop-the-look` | **Closed, 3 of 4, not resurrected.** A month stale. |
| Mood beat | **October = `mood:result`, and Mood has still never shipped a single post in this desk's existence.** One slot below (10-21). The 10-03 pair was founder-approved and died in `social/failed/` to the 48h-from-approval clock, not to a taste call. One slot, not two — the strategy allows 2-3 but a lane that has never once landed earns its second slot by landing the first. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 10-12: **10-17**. Week of 10-19: **10-22**. Week of 10-26: **10-27**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01). Take the next three unposted chapters **in the lens's own order** off `/?lens=love-story`, name the chapter in each item's `why`, and verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — ≥1 per calendar week** | **10-18**, **10-25**, **10-28**, each with a named heartbeat fallback on the same line. A reserve is an assigned slot with two possible subjects, never a gap: uncovered event in `events.uncovered[]` → leave the beat for the event run; nothing uncovered → draft the named fallback as written. A reserve is **never** drafted a day early and never carries an Experiment 01 arm. |
| **📰 Major moments ship same-day (new, 2026-10-18 — ask [#6084](https://github.com/JW-Incorporated/swift2/issues/6084))** | Strategy §1(e2) changed this run: a *major* site-fronted moment (live debut, release, official video, chart No. 1, award, tour/appearance announcement) gets a same-day pair and no longer spends the ordinary news cap — ceiling ≤3 news posts per rolling 7 days, ≤2 of them ordinary — and every calendar keeps **≥2 displaceable beats** (heartbeat or mood) per rolling 7 days so one always has somewhere to land. This window satisfies it: 10-20 and 10-24 heartbeats plus the 10-21 Mood beat. Evidence: the site covered 12 of 13 events in the week to 10-18, social covered 1. |
| 🧪 **Experiment 01 — Instagram hashtags** ([#4722](https://github.com/JW-Incorporated/swift2/issues/4722), extended by [#5542](https://github.com/JW-Incorporated/swift2/issues/5542)) | **n = 2 pairs** (tagged 10-09, control 10-02), both at IG reach ~1. Needs five. **Arms alternate below starting TAGGED, on every non-reserve beat.** Readout is nominally the 10-18 plan, but 10-16/10-17 will not have 48h of data by then, so expect **"still unreadable, n = 3"** and the tag block stays on by default — the shortfall is supply, not design. Arms are assigned through 10-27 anyway so the 10-26 run has something real to read. |
| Openers — burned in the last 14 days, **do not reuse verbatim or near** | 8 distinct patterns across 8 posts (10-01 → 10-15), well under the ≥12-per-14-days target **because the denominator collapsed to 8 posts**, not because the copy repeated. Burned: *"they spent a whole year asking…"* · *"speak now's 1,047,000-copy week…"* · *"the clue web has one theory…"* · *"gut-check for the clowns 🤡…"* · *"the Decode thread has me spiraling…"* · *"quick challenge for the clowns 🤡…"* · *"the blank spaces timeline just reached…"* · *"2008. she was 18, and the…"*. **Two shapes are now over-used and are off the menu this fortnight:** the `"the <thread name> …"` opener (3 of 8) and anything addressing *"the clowns 🤡"* (2 of 8, both X). |
| Media mix, last 14 days | **8 photo / 8 media-carrying = 100%**, target ≥70% ✅. 4 of 4 IG posts carried a real Taylor photo ✅. Zero era tiles, zero undeclared media. The gate is holding. |
| **Photo supply** (new scorecard row, PR #5871) | Library **201**, never-used **186**, last `concert-photo-sourcing` run **success (2026-10-15 13:39Z)**. No era exhausted. |
| Fast lane | **2 intents open past their own deadlines** and never swept — `appearance-2026-10-12-FqbcAAKQjes` (deadline 10-14) and `merch-2026-10-10-patient-zero-piano-version…` (deadline 10-13) — because the run that expires them is the one that died. The next successful daily run clears both; no action needed here. |
| Stranded draft PRs | **#5443 (10-09) and #5495 (10-10) are still open**, 5-6 days past the 48h window. Ask [#5541](https://github.com/JW-Incorporated/swift2/issues/5541) asked for their subjects to be re-booked as fresh same-day beats; the engine died before any run could. **Their subjects are not re-booked here** — both are now a week stale and §2's catch-up rule says a re-draft subject takes today's or tomorrow's beat, never a slot a week out. `retire-stale-drafts.mjs` in the next successful prepare job retires them. Reported to Marjorie as an error. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel; **5 Reddit replies were completed this week** through the Discord queue (scorecard `redditRepliesDone`). The counter still tracks the channel nobody uses. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Never supplied, three months running** — the single most important missing number (strategy §3's standing blocker). Asked again this week as the week's one `founder-task`, because it needs his login and nothing else can produce it. |
| Founder tasks | **Five consecutive weeks, zero ticked**, including the week it was cut to one 4-minute ask. The same founder answered 5 Reddit prompts and 4 draft verdicts in Discord in the same period at a 3h 14m median. The issue channel is not read as a work queue; Discord is. One task this week, and the Discord cards remain the channel that works. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see. *(The Actions variables API returns 403 to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze entry and from posting continuing through 10-11.)* |
| Social event mode | **`normal`** — `scripts/social/event-status.mjs` this session returns `{"mode":"normal","kind":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`. No countdown or big theory is live, so **no beats are reserved** and the 14 days below are ordinary rotation. *(It only runs under `tsx`; a bare `node` invocation fails on a clean checkout — reported to Marjorie.)* |

---

## 2026-10-15 (Thu) — ⚫ NO BEAT · Tree run day

The 11:00Z daily run for today has already passed and the lane is 0-for-3 on
its last three attempts. A beat that depends on this PR merging inside the next
few hours is not a plan. **Do not backfill 10-15.** A post that is already a day
late is worth less than the next one being on time.

## 2026-10-16 (Fri) — Runway thread hero (window 10-11→15, extended one day)

- **`23:00Z` · `thread:fashion:quiz-poll`** — mint
  `thread:fashion:quiz-poll:2026-10-hero`. Link `/?lens=fashion`.
- **Angle `quiz-poll`:** a question whose answer lives inside the Runway thread.
  X gets a real poll where the platform allows; the IG half asks the same
  question in prose and sends people to the lens to settle it. Structurally
  different halves, not a truncated caption.
- **Subject direction:** pick ONE Runway look that the thread documents in
  detail and build the question around a detail only someone who opened the
  lens would know — a designer, a re-wear, a colour that recurs across a tour
  leg. Verify every attribution against the Vault; do not assert a designer or
  a date this file has not sourced.
- **Media:** pre-compute pick. The Runway lens is a genuinely visual product
  surface, so a `/social/library/` screenshot of it **earns IG slide 2** behind
  the photo tile — only if it shows the lens in rich actual use, never a flat
  page. X never takes a site screenshot.
- **🧪 Experiment 01: TAGGED.** 8-12 mid-tail tags as the IG caption's last
  line; both halves carry the `experiment` object.
- **Why here:** Runway is the one thread dropped two months running and its
  window closed today with the engine down. This is the last beat that can
  honour October's six-threads promise for it.

## 2026-10-17 (Sat) — Blank Spaces timeline (week of 10-12 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-10-17`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter in the lens's own order after
  Joe Jonas 2008. Name the chapter in `why`. **Confirmed public relationship
  history only** — verify every person, date, event and quote against the Vault
  before it reaches copy; rumor-stage relationship-existence claims, countdowns
  and speculation stay banned outright.
- **Media:** pre-compute pick, era-relevant where the pick allows. A Blank
  Spaces lens screenshot may ride slide 2 only under the "cool feature only"
  rule.
- **Hook direction:** not a date-stamp and not *"every love story has a…"* —
  both are burned. Try the artifact (start with what the photograph is) or the
  real sourced quote.
- **🧪 Experiment 01: CONTROL.** No tags, no `experiment` object; `why` says
  "Experiment 01 control".

## 2026-10-18 (Sun) — 📰 NEWS RESERVE (week of 10-12)

- **`23:00Z` · `news:<event-slug>`** — **fallback, if nothing is uncovered:
  `heartbeat:era-deep-cut` on `lover`**, minting
  `heartbeat:era-deep-cut:lover-<subject>:2026-10-18`, link `/?era=lover`.
- **How this beat works:** check `events.uncovered[]` first. An uncovered
  real-world event dated inside the last 48h → **leave this beat for the event
  run and draft nothing here.** Nothing uncovered → draft the fallback exactly
  as written. This is an assigned slot with two subjects, never a gap.
- **News bar:** confirmed fact from the intake record only, scored on the
  six-dimension rubric with `timely` ≥4 on its own. Cap ≤2 news posts per
  rolling 7 days. Nothing on the #36 blocklist except an already-confirmed
  personal-life event, covered factually like any other real news.
- **Era note:** `lover` has not shipped recently and has never-used photos in
  the library. Do **not** take `speak-now` or `reputation` this week — both
  shipped inside the last 7 days.
- **🧪 Experiment 01: no arm.** A news reserve is never tagged and never counts
  as an arm.

## 2026-10-19 (Mon) — Blank Spaces thread hero (window 10-16→20)

RE-DRAFT ask #6084 by 2026-10-21: the Fate of Ophelia live-debut news pair (IG+X, on the site since 10-18, confirmed intake facts only, drafted as a major moment under strategy §1(e2)); plus the 10-18 news-reserve beat stranded unposted on draft PR #6056, re-drafted fresh as a same-day beat.

- **`23:00Z` · `thread:love-story:origin-story`** — mint
  `thread:love-story:origin-story:2026-10-hero`. Link `/?lens=love-story`.
- **Angle `origin-story`:** what the Blank Spaces thread *is*, and the one
  moment that made it worth building. This is the teaching beat for followers
  who have never opened it.
- **Keep it distinct from 10-17.** Same lens, two different jobs: 10-17 tells
  one chapter; this tells why the thread exists. Do not reuse 10-17's photo,
  subject, chapter or opening shape.
- **Media:** pre-compute pick.
- **🧪 Experiment 01: TAGGED.**

## 2026-10-20 (Tue) — Heartbeat

- **`23:00Z` · `heartbeat:on-this-day`** — mint
  `on-this-day:<subject-slug>:2026-10-20`. Link `/?item=<momentId>`.
- **Subject direction:** search the Vault for a moment dated **October 20**. If
  there is no genuinely dated match, fall back to `heartbeat:track-fact` off a
  track dossier rather than stretching a near-miss date — a wrong date is worse
  than a different beat. Either way the link is a real `/?item=` or `/?era=`.
- **Hook direction:** the number, or the contradiction. **Not** a bare
  `<month> <n>, <year>:` date-stamp — burned — and not an opener starting
  "the <thread>".
- **🧪 Experiment 01: CONTROL.**

## 2026-10-21 (Wed) — Mood beat (October's one slot)

- **`23:00Z` · `mood:result`** — mint `mood:result:2026-10-21`. Link
  **`/?mode=mood`** with the standard UTM tags. Never `?mood=`.
- **Format `mood:result` — "what it gave me", the strongest Mood format,**
  because it proves the thing works: one starter chip in the caption, a Taylor
  photo from the era those songs come from as the tile, the **real** returned
  songs as IG slide 2.
- **Hard constraints:** quote the starter chip **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — it is approved copy, never
  reworded. **Pick a chip whose real results come from scored eras.** evermore,
  Midnights, TTPD and TLOAS are not scored: never promise "every song" and
  never name those eras as Mood results. Run the chip against the live feature
  and screenshot what it actually returned before writing a word of the caption.
- **🧪 Experiment 01: TAGGED.**
- **Why here:** Mood has never shipped once. It is the most distinctive thing on
  the site and the lane with the worst delivery record in the desk, and the
  cause both times was mechanical, not editorial.

## 2026-10-22 (Thu) — Blank Spaces timeline (week of 10-19 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-10-22`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter after 10-17's. Same sourcing
  bar: confirmed-only, verified against the Vault, chapter named in `why`.
- **Hook direction:** a different shape from 10-17's and 10-19's. Direct
  address or the honest question.
- **🧪 Experiment 01: CONTROL.**

## 2026-10-23 (Fri) — Taylor's Version thread hero (window 10-21→25)

- **`23:00Z` · `thread:taylors-version:single-best-item`** — mint
  `thread:taylors-version:single-best-item:2026-10-hero`. Link
  `/?lens=taylors-version`.
- **Angle `single-best-item`:** one item from the thread, told whole. The thread
  is the byline, not the subject — the post is about the thing, and the lens is
  where you go to find more of them.
- **Subject direction:** pick the item in that lens with the most specific,
  least-told story. Verify it against the Vault.
- **Media:** pre-compute pick.
- **🧪 Experiment 01: TAGGED.**

## 2026-10-24 (Sat) — Heartbeat

- **`23:00Z` · `heartbeat:symbol-thread`** — mint
  `symbol-thread:<motif-slug>:2026-10-24`. Link `/?lens=easter-eggs`.
- **Subject direction:** one motif from the Invisible Strings atlas that recurs
  across at least two eras. Source every appearance; speculation is **labelled**
  as speculation, never asserted (vision.md's rule, verbatim on social).
- **Hook direction:** the artifact or the challenge ("find it in ten seconds").
  **Not** "gut-check for the clowns" or any variant addressing the clowns — that
  shape ran twice in the last 8 posts.
- **🧪 Experiment 01: CONTROL.**

## 2026-10-25 (Sun) — 📰 NEWS RESERVE (week of 10-19)

- **`23:00Z` · `news:<event-slug>`** — **fallback, if nothing is uncovered:
  `heartbeat:track-fact`**, minting `track-fact:<subject-slug>:2026-10-25`, link
  `/?item=<momentId>` or `/?era=<eraId>`.
- Same reserve mechanics as 10-18: `events.uncovered[]` first, leave the beat
  for the event run if something is uncovered, otherwise draft the fallback as
  written. Never drafted a day early.
- **🧪 Experiment 01: no arm.**

## 2026-10-26 (Mon) — End Game thread hero (window 10-26→30) · Tree run day

- **`23:00Z` · `thread:the-proposal:interactive-challenge`** — mint
  `thread:the-proposal:interactive-challenge:2026-10-hero`. Link
  `/?lens=the-proposal`.
- **Angle `interactive-challenge`:** "open it and find the one where ___ —
  reply with what you got." The challenge must be answerable only by actually
  opening the lens, and the answer must genuinely be in there — check before
  you write it.
- **Media:** pre-compute pick.
- **🧪 Experiment 01: TAGGED.**
- **Note for the 10-26 weekly run:** this is the last Tree run of October, so it
  carries the monthly review (strategy §3) and advances the rotation into
  November.

## 2026-10-27 (Tue) — Blank Spaces timeline (week of 10-26 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-10-27`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter after 10-22's. Confirmed-only,
  verified, named in `why`.
- **🧪 Experiment 01: CONTROL.**

## 2026-10-28 (Wed) — 📰 NEWS RESERVE (week of 10-26)

- **`23:00Z` · `news:<event-slug>`** — **fallback, if nothing is uncovered:
  `heartbeat:era-deep-cut` on `red`**, minting
  `heartbeat:era-deep-cut:red-<subject>:2026-10-28`, link `/?era=red`.
- Same reserve mechanics as 10-18 and 10-25.
- **Era note:** `red` has never-used photos in the library and has not shipped
  this fortnight.
- **🧪 Experiment 01: no arm.**

---

## Beat accounting — 13 demands, 13 slots, zero slack

| Reservation | Strategy | Beats | Dates |
|---|---|---|---|
| October thread heroes | §1(b), one per thread per month | 4 | 10-16, 10-19, 10-23, 10-26 |
| Blank Spaces timeline | §1(c), permanent weekly minimum | 3 | 10-17, 10-22, 10-27 |
| News reserves | §1(e2), ≥1 per calendar week | 3 | 10-18, 10-25, 10-28 |
| Mood | §1(d), monthly | 1 | 10-21 |
| Heartbeat | §1(e), the remainder | 2 | 10-20, 10-24 |
| **Total** | | **13** | 13 draftable days (10-15 is lost) |

Experiment 01 arms, alternating from TAGGED over non-reserve beats:
**TAGGED** 10-16, 10-19, 10-21, 10-23, 10-26 · **CONTROL** 10-17, 10-20, 10-22,
10-24, 10-27 · **no arm** 10-18, 10-25, 10-28.

**There is no slack in this plan.** Every beat above is a strategy minimum
except the two heartbeats, so a news item arriving off-reserve yields against
10-20 or 10-24 first (§1(e2)'s order), then the Mood beat, and never against a
thread hero or a timeline beat. If the engine loses days again, the beats that
survive should be the thread heroes — October's six-threads promise is the one
commitment in this plan that cannot be made up next month.

---

## Review — next due 2026-10-26

The monthly review (strategy §3) falls to the **last Tree run of October, the
10-26 run**: scorecard month over month, the Insights top 3 if they have arrived
by then, exactly one "double down" and one "drop" named specifically, and the
rotation advanced into November. This run is a Thursday catch-up for a missed
Monday and is not it.
