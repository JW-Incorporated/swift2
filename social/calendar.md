# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-11-16 → 2026-11-29.**
Written by Tree's weekly run of 2026-11-16 (a Monday, on schedule). Not the last
run of the month — 2026-11-30 is also a Monday, so November's `## Review` belongs
to that run, not this one.

**This file ships alone** (strategy §2, "How the calendar ships — one PR, exactly
two files", added today from Marjorie's ask #6897). Its PR touches only
`social/calendar.md` and `social/calendar.brief.json`. Last week's plan PR
[#6744](https://github.com/JW-Incorporated/swift2/pull/6744) also edited
`HUMAN-ACTIONS.md`, which is not on the auto-merge allowlist, so it never merged,
`main`'s calendar expired on 11-15, and the 11-16 run found nothing to draft.

**No photo table, by design (W8, 2026-09-30).** The daily pre-compute
(`scripts/social/prepare-draft-inputs.mjs`) hands each beat a never-used,
Instagram-sized photo from the full ledger. Era is named below **only** for a
themed beat.

**Text-only X posts are BANNED** (owner, 2026-10-30; hard-gated by
`check-drafts.mjs`). Every beat is one IG + X pair on ONE image. No image, no
post — pick a different subject or skip the slot.

---

## 🔴 THE CHANGE THIS FORTNIGHT — every beat names the FEELING first, and the detail second

**The account has shipped nothing since 2026-11-09. Eight dark days. The cause
is in this file.**

On 2026-11-08 an independent Opus judge went live on every draft
(`scripts/social/judge-drafts.mjs`, `docs/decisions.md` 2026-11-08 "Shared voice
system"), scoring four dimensions with a hard floor of 4 on each inside
`check-drafts.mjs`. Since then **2 of 20 judged captions cleared it — 10%.**
`onVoice` came in below 4 on **15 of 20**, `notEmbarrassed` on **14 of 20**, and
the judge's own reasons say the same thing over and over:

> "the middle reads like a news recap of what she said" · "it turns into a
> documentary narrator recapping what Jack said" · "the middle reads like a
> listing" · "most of it sounds like a narrator retelling Jack's story"

Six draft PRs died of it — [#6766](https://github.com/JW-Incorporated/swift2/pull/6766),
[#6804](https://github.com/JW-Incorporated/swift2/pull/6804),
[#6839](https://github.com/JW-Incorporated/swift2/pull/6839) closed by
`social-tree-approve` after stamping; [#6815](https://github.com/JW-Incorporated/swift2/pull/6815),
[#6848](https://github.com/JW-Incorporated/swift2/pull/6848),
[#6872](https://github.com/JW-Incorporated/swift2/pull/6872) left blocked and
now stale past the 48h window.

**This was not a drafting failure. It was a briefing failure, and the brief is
mine.** Strategy §Voice has said since 2026-08-25: *"Every caption is
first-person fan reaction first, fact second: lead with the feeling, then the one
concrete detail that earns it. If a caption could be read aloud by a documentary
narrator without sounding wrong, it's in the old voice."* But §1(e) Rule 5's hook
menu — **the date · the number · the contradiction · direct address · the
artifact · the real quote · the honest question · the challenge** — is eight
*fact-first* shapes and not one of them is a feeling. And every beat in last
week's calendar printed that menu as its own instruction: *"Hook direction: the
number, or the contradiction"*, *"the artifact (start with what the photograph
is) or a real sourced quote"*.

A drafter obeying its beat cannot lead with the feeling, because the beat told it
to lead with a number. Two sections of the strategy have contradicted each other
since August; nothing graded voice, so the contradiction was free. The judge
made it expensive in 48 hours.

**So every beat below is written in two lines instead of one:**

- **Feel first** — the actual emotion a fan has about this subject, in plain
  words. The caption's **first sentence carries that feeling and nothing else**:
  no date, no number, no quote, no outlet name, no song title in quotes.
- **Then the detail** — the one concrete, sourced thing that earns the feeling,
  arriving in sentence two or later. Rule 5's eight shapes still apply here, to
  the *detail*. They are shapes for the second beat of a caption, never the
  first.

Rule 5 is amended to say exactly that in a separate strategy PR (per §2 this file
travels alone); the restatement on each beat below is the operative instruction
either way.

**Also binding, and already fixed in code — do not re-derive it:** the drafting
run judges its own captions pre-flight and rewrites anything under 4 before the
PR opens (`social/lessons.md` **L003**, from ask #6895; the rewrite pass itself
is `scripts/social/rewrite-drafts.mjs`, issue #6890, landed). The floors are 4 on
all four dimensions — Fable's time-boxed drop to 3 on `onVoice`/`formula`
([taste-ruling #6896](https://github.com/JW-Incorporated/swift2/issues/6896))
expired the week #6890 shipped, which is this one.

---

## 🟠 And the second cause of the two darkest days

**An OPEN draft PR is not coverage.** The 11-14 and 11-15 daily runs each drafted
nothing, and both said why in their own PR bodies: 11-14's beat was *"already
filled by PR #6848"* and 11-15's *"already filled by PR #6872"*. Neither PR had
merged. Neither ever would — both were blocked on the judge. So two beats were
spent on drafts that could not ship, on top of the three that had already failed.

**Rule, from here:** a beat is covered only by a queue file that is **merged on
`main`** — `social/queue/*.json` you can `ls`. An open `tree/draft/*` PR, however
recent, covers nothing and is never a reason to skip a beat. If an open PR
already drafts the same subject, draft the beat anyway on a different subject
from the standby pool below; a duplicate pair that never ships costs a dark day,
and a near-duplicate that does ship costs one skipped post to the poster's
per-platform cap, which is the cheaper of the two by a wide margin.

`social/queue/` is **empty** right now. No date below is covered.

---

## 🟢 BINDING FROM 2026-11-23 — news takes the next slot, and the timeline yields too

**Marjorie's ask [#7083](https://github.com/JW-Incorporated/swift2/issues/7083),
answered the same day.** Taylor performed at the CMA Awards on **11-18**. The
11-19 beat below is the reserve written for that performance — *"this is the beat
the fortnight is built around"* — and the 11-19 run drafted its **named fallback**
instead (`heartbeat-f1-2016-only-concert-2026-11-19`). 11-20 was the timeline
beat, which strategy §1(e2) called "never displaced". The performance shipped on
**11-21** (`event-cma-2026-performance-2026-11-21`): three days late, outside its
own 48h window, behind two beats whose subjects had no deadline at all. Strategy
§1(e2) is amended in the same PR as this file. The operative version for every
beat below:

- **On every beat, the news goes first.** A confirmed, sourced moment dated
  inside the last 48h that nothing shipped or queued covers (`events.uncovered[]`
  **or** that day's `new-on-site` sheet) is drafted **that day**, as
  `news:<event-slug>` with `utm_campaign = news`, *instead of* the planned
  subject. A reserve's named fallback is the **no-news branch** — what the day
  takes when no moment arrived, never a claim that outranks one.
- **Where the displaced beat goes — named for this window, so nobody re-derives
  it:** displaced on **11-24** → **11-25**'s reserve, replacing its fallback;
  on **11-26** or **11-27** → **11-29**'s reserve; on **11-28** or **11-29** →
  the 11-30 run's calendar as a named make-good. This replaces §1(e2)'s old
  "slides to the next free day", which was unexecutable — every day here carries
  a beat, so a *free* day never exists.
- **The timeline beat is the half of #7083 Tree could not finish.** 11-20 is the
  worked example: the CMA performance was missed on 11-19, the next slot was
  11-20, and 11-20 was a `timeline:` beat that
  `docs/agents/runner-prompts/tree-event-draft.md` step 5 forbids the event run
  from taking — with `tree-daily-draft.md` step 4.5 telling the 11:00Z run to
  leave an off-reserve moment to the event run, and a sync test pinning both.
  All three are outside this desk's mutation rights, so the ask is filed to
  Marjorie. **Meanwhile, for the beats below: 11-27 is this week's timeline
  minimum, and if a confirmed moment is uncovered that day the chapter goes to
  11-29 and the moment takes 11-27** — that is this calendar assigning its own
  slot, not a drafter overriding one, and the weekly minimum is still met.
- **The gates do not move.** A news draft still clears `timely` ≥4, `total` ≥21,
  the voice judge's floors and `check-drafts`. Two failed passes and the day takes
  its planned subject as written — the branch, not a preference. Sourcing is
  unchanged (invariant 13): verified against the Vault or the intake record before
  a word is written, #36 blocklist applies, guardrail 4 confirmed-only applies.
- **Record the chain in `why`**, e.g. *"takes 11-27 timeline; timeline → 11-29
  reserve, displacing the two-albums fallback"*. A daily run may not edit this
  file, so that `why` is the record until the 11-30 run reconciles it.

---

## Ledger

| State | Value |
|---|---|
| **⚫ 8 dark days, 11-10 → 11-16** | Last post: **2026-11-09**. Cause: the voice judge above (6 drafts failed), compounded by the open-PR-as-coverage bug (11-14, 11-15) and by `main` having no calendar for 11-16 (PR #6744 never merged). **11-16 is not recoverable** — today's 11:00Z draft run has already completed, found no calendar entry, and drafted nothing. The first beat that can ship is **11-17**. I am not backdating a beat to make the grid look continuous: a pair scheduled in the past is stale on arrival and retires unposted. |
| **Posting floor this fortnight** | Marjorie's success signal (`weekly-plan` [#6892](https://github.com/JW-Incorporated/swift2/issues/6892), bet 2) is **≥5 IG/X pairs posted in the week to 2026-11-22**. There are 6 beats between 11-17 and 11-22. That is the number this plan is written against, and it has no slack — every beat below has to clear the judge on its first or second pass. |
| Cycle month | **2026-11** (`monthNumber` = 3), whole months since 2026-08. Unchanged across this whole window. |
| **November windows + angles** (`angle = ANGLES[(3 + threadIndex) % 5]`, recomputed this run, same result as 11-02) | Decode 11-01→05 `behind-the-data` · Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces 11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` · End Game 11-26→30 `behind-the-data`. **Three fall inside this window** — Blank Spaces, Taylor's Version, End Game. |
| **Thread progress, November — 2 of 6 shipped, 4 placed here** | Shipped: Decode **11-02** (`42 clues`), Clue Web **11-06** (`willow string`). **Runway's 11-12 hero was drafted and killed by the judge** (PR #6804), so November owes it a make-good — placed **11-23**, outside its own window, which is what a make-good is. Blank Spaces **11-17**, Taylor's Version **11-21**, End Game **11-26**. All six land in November if this fortnight ships. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`**. `?mood=` is not a thing and never was. |
| **🚀 Launch arc — DEFERRED a fourth time, and this is a judgment, not arithmetic** | `launch:photo-viewer` (pinch-zoom viewer, live since 2026-07-18, never promoted). The 11-02 plan placed day 0 on 11-09; that slot went out as the reputation/Katy Perry pair instead and the arc never started. **I am not placing it into a lane that has shipped 0 posts in 8 days.** An arc is four beats whose days +2/+4/+8 are each gated on day 0 having shipped; dropping one into an unproven lane spends four of this fortnight's fourteen beats on a structure whose first failure voids the rest. The binding constraint right now is caption voice, not subject supply, and an arc does not help with voice. **Condition to place it, written down so the next run does not re-litigate it:** the 11-30 run places day 0 if **≥5 pairs posted in the week to 11-29**. If the lane ships, the arc goes next; if it does not, the arc is not the problem to solve. |
| Launch backlog, in order behind it | photos + focal program (#762) → `launch:community-engine` (when it ships — invariant 6 forbids teasing it) → shoppable Runway looks → the rumor tier. `launch:shop-the-look` stays closed at 3 of 4; `launch:mood-chat` stays closed at 1 post. |
| New user-visible ships, 11-09 → 11-16 | **None that earn an arc.** The week's merged work was the voice judge itself (#6706/#6711), the rewrite pass (#6890), six Showgirl Era Secrets (#6780, content not a surface), five Speak Now tour dates (#6783) and news-worker hardening. All either internal or content backfill — none passes §1(a)'s "a fan could notice without being told" test. §1(a)'s fallback (take the next backlog item) is overridden by the deferral above, with the reason stated. |
| **Mood beat** | **November is DONE** — `mood:era-match` shipped **11-03** (`mood-cardigan-weather`), the beat the 11-02 plan placed. One beat a month per §1(d); December's belongs to a December run. **None placed this fortnight**, and that is the rule working, not a gap. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 11-16: **11-20**. Week of 11-23: **11-27**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01) → Fearless solo 2008 (10-22) → Back to December / Lautner (10-29) → John Mayer (11-04). **The Jake Gyllenhaal chapter was drafted on 11-14 and killed with PR #6839** (judge: onVoice 2, specific 2, notEmbarrassed 2 — the worst-scoring caption of the week), so it is next, on 11-20. Take chapters in the lens's own order, name the chapter in each item's `why`, verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — 2 per week, 4 in the window** | **11-19 + 11-22** (week of 11-16), **11-25 + 11-29** (week of 11-23). Each carries a named fallback on its own line, and **the fallback is ALWAYS drafted** (PR #6321) — a reserve beat is never left empty for a run that may not fire. Never drafted a day early. 11-19 is the one that matters: see the CMA block below. |
| **📰 News floor — 0 of 16 for the second week running** | Marjorie's audit: the site caught all 16 site-fronted moments inside 48h; social caught none. **This week the cause is not the dispatcher** — the three real news drafts (Sherry Lansing award, CMA announcement, Taylor's two albums of the year) were all written and all three were stopped by the judge. The mechanism works; the captions did not clear. Two of those three subjects are re-placed below as ordinary beats (11-24, standby pool) rather than left to a reserve that may not catch them twice. 0 of 16 stands as a miss, named, for the second time. |
| **🎤 CMA Awards — the fortnight's one unmissable event** | Taylor performs at the **2026 CMA Awards, Wednesday 2026-11-18**, airing live on ABC and Disney+ (per intake [#6840](https://github.com/JW-Incorporated/swift2/issues/6840); **verify the date, network and whether the performance actually happened against the Vault and the site before a word of copy** — I have not sourced it myself and this file asserts nothing). It is Marjorie's bet 1 and the biggest fan moment of the month. **Two beats, deliberately:** 11-18 is the pre-show (23:00Z is 6pm ET, about two hours out — anticipation, which needs no footage and no source beyond the confirmed booking), and 11-19 is the reserve that catches the performance itself. If she does not perform, 11-19 takes its named fallback and 11-18's pre-show is simply a night a fan spent excited, which is still true. |
| 🧪 **Experiment 02 — OPEN, the posting hour** (Marjorie's ask [#7084](https://github.com/JW-Incorporated/swift2/issues/7084), 2026-11-23; replaces this row's "none this fortnight, for the third fortnight") | The row here used to decline on reach being 0 across 2 posts — measuring the outage. Supply is no longer the excuse: **12 posts shipped this week, 0 failed, and every measured Instagram post still reached 0 accounts.** The one variable held constant across all 12 is the hour — every beat is `23:00Z` by §2's slot grammar. **Variant `16:00Z` on 11-24, 11-26, 11-28; control `23:00Z` on 11-25, 11-27, 11-29** (alternating, so day-of-week does not track the arm; 11-23 is already drafted and untouched). Everything else held: subject, feeling-first shape, tag block, media standard, pairing, every gate. Readable because the question is **0 vs non-zero**, not a difference of means — which is why §3's ≥10-median trigger gates comparative experiments only. Full design, the verbatim `experiment` object, and all four pre-committed readouts: strategy §3. |
| Openers — computed from the real posted bodies, 11-03 → 11-09 | **12 distinct 6-word openers across 12 items — a clean sweep** against the ≥12-per-14-days target ✅. The number is this clean only because 8 of the 14 days shipped nothing, so read it as "no evidence of reuse", not as a win. First-word tally is flat (no word twice). `okay`/`ok` are hard-gated as of PR #6535 and did not appear. **Off the menu this fortnight, on top of the code gates:** any bare date-stamp or *"<n> years ago"* opener, opening on a quoted song title, and — new, and the whole point of this plan — **any first sentence whose subject is a fact rather than a feeling.** |
| Media mix, last 14 days | **12 photo / 12 media-carrying = 100%**, target ≥70% ✅. Zero era tiles, zero undeclared media, zero `site-screen` posts, zero text-only X posts. The gate is holding. |
| **Photo supply — healthy, with one thin bucket worth naming** | **307 never-used** in a 519-photo library, **no era exhausted**. 176 of the 307 are outside Instagram's 0.8–1.91 aspect window and can never ship, so the real usable pool is ~131. **The thin bucket is the current era:** `the-life-of-a-showgirl` has **7 never-used of 7 total**, and `tortured-poets` **5 of 5** — the two newest eras are the two smallest, and this fortnight's CMA and Sherry Lansing beats are both Showgirl-themed. Naming it per the 2026-10-01 standing priority: **Showgirl photos are the library's binding constraint**, tracked for content on [#6644](https://github.com/JW-Incorporated/swift2/issues/6644). Uncredited photos are welcome and are expected to be the bulk of it. No beat below is blocked today. |
| Fast lane | **0 drafted, 1 declined, 0 expired** this week (scoped by `createdAt` ≥ 2026-11-09, per the T6 note: drafted intents stay in `social/inbox/` with a `queueFiles` array; only declines and expiries move to `closed/`). The decline was `merch-2026-11-14-1989-album-cover-glass-ornament` (timely 2/5, gate is 4) plus an appearance intent closed as duplicate of PR #6848. **`social/inbox/` holds ~139 open merch intents** from a 130-item store sync, deadlines 11-17 and 11-18; the 11-15 run's read is right and I am endorsing it — a single $25 ornament out of a full store sync is not news, and these should expire rather than be drafted. Expiry is the normal outcome. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel, unmoved for a fourth week. The scorecard records **no Reddit prompts resolved this week**. The awareness lane that feeds them delivered **5 leads** this week (Marjorie's `awareness.delivered`) and is still blocked on [#6089](https://github.com/JW-Incorporated/swift2/issues/6089) — 29 days unclaimed, outside Austin's auto-build scope, waiting on a founder **"Plan approved"** comment that Marjorie's own plan already carries. See the L002 row in `social/lessons.md`. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked for again, same decision.** Trailing-7-day reach across 2 posts was 0. A top-3-by-reach paste would rank nothing. The ask returns the month trailing-7-day median IG reach clears §3's trigger (≥10). |
| Founder tasks | **None filed this week** — the fourth week with none, and deliberately. Per the 2026-10-09 amendment Tree asks the owner only for a true human-only blocker (money, a secret, a major strategy call). Nothing this fortnight is one: the voice fix is mine, the two dead PRs are Marjorie's, and the one live founder click ("Plan approved" on #6089) is already carried in **Marjorie's** plan under *Needs the owner*. Asking twice for the same click is how a lane gets ignored. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see — no brief comment, no issue, no PR comment; Marjorie's 11-16 plan treats resumed posting as this week's bet 2, which is the opposite of a halt. *(The Actions variables API returns `403 Resource not accessible by integration` to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze row.)* |
| Social event mode | **`normal`** — the `prepare` job's sensor returns `{"mode":"normal","kind":null,"id":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`. No live countdown and no live theory, so **no beats are reserved for event coverage** and the 14 days below are ordinary rotation. The CMA block above is a scheduled broadcast handled through the normal news beat, not an event-mode countdown. |
| Lessons ledger | **Unchanged by this run, and computed rather than eyeballed.** Zero `edit`/`reject` rows in `social/feedback/` for this week or last (no `2026-W46`/`W47` file exists), so there is nothing to attribute — no new rules, no increments. `findCodifiableRules` returns `[]` (`lessons.autoCodify` is `false`; L003 already carries `Codify: #6890`, L002 has fired once). `findRetirableRules` returns `[]` — L002 is **5 weeks quiet** across 5 briefs, against an 8-week / 10-brief window. **L003 was added earlier today** by the ask-response run for #6895, not by this run, and it is the rule every beat below depends on. |

---

## Standby pool — three subjects, pre-cleared, for any beat that needs one

Not a dark-day fallback *policy* (that is §2's standby subject); a concrete pool,
because this fortnight has six subjects that were written and killed and should
not be re-derived from scratch. Any beat may take one of these. Each is a
**new-on-site moment with media on file**, so the image question is already
answered.

1. **Sherry Lansing Leadership Award, Greta Gerwig presenting** —
   `vault-tloas-taylor-gets-the-2026-sherry-lansing-leadership-award-with-gr`
   (the only `significance: notable` moment on the 11-16 sheet, `mediaKind: photo`).
   Drafted twice and killed on 11-11 (PR #6815). **Placed on 11-24.**
2. **A Swiftie wins Michigan's Senate seat, and reviews Showgirl on the way** —
   `vault-tloas-a-swiftie-wins-michigans-senate-seat-and-reviews-showgirl-on`
   (`mediaKind: photo`). **Placed on 11-28.**
3. **Her only concert of 2016, at the Formula 1 U.S. Grand Prix** —
   `vault-1989-her-only-concert-of-2016-at-the-formula-1-u-s-grand-prix`.
   Unplaced — this is the free one. Era `1989`, which no other beat below uses.

Two more off the same sheet if all three go:
`vault-1989-i-dont-wanna-live-forever-breaks-the-silence-with-zayn` and
`vault-tloas-ill-see-what-my-wife-can-cook-up-travis-volunteers-taylor-fo`
(the second is Travis on record, which clears guardrail 4's confirmed-only
test — it is him saying it, not an anonymous source).

---

## 🧪 Experiment 02 — the posting hour, on six beats

**Marjorie's ask [#7084](https://github.com/JW-Incorporated/swift2/issues/7084),
answered 2026-11-23. Design and the four pre-committed readouts: strategy §3.**
12 posts shipped this week and every measured Instagram post reached **0
accounts**. Supply was not the problem. The one variable never varied is the
hour: every beat in this file says `23:00Z`.

| Beat | Hour | Arm |
|---|---|---|
| 11-24 · Sherry Lansing | **`16:00Z`** | variant |
| 11-25 · news reserve #3 | `23:00Z` | control |
| 11-26 · End Game hero | **`16:00Z`** | variant |
| 11-27 · timeline | `23:00Z` | control |
| 11-28 · Michigan Senate | **`16:00Z`** | variant |
| 11-29 · news reserve #4 | `23:00Z` | control |

- **The hour is the ONLY thing that moves.** Same subjects, same feeling-first
  shape, same mid-tail tag block, same media standard, same gates. A variant beat
  keeps both halves of its pair on the **same** `scheduledAt` (inside
  `check-drafts`'s 5-minute pairing window) — `16:00Z` on the IG item *and* the X
  item, never one of each.
- **On a variant beat, write this `experiment` object on both queue items,
  verbatim:**
  `{"hypothesis": "every one of the 12 posts in the week to 2026-11-23 went out at 23:00Z and every measured one reached 0 accounts; the hour is the one variable never varied", "variant": "hour-16z", "metric": "instagram reach per post, read as 0 vs non-zero"}`
  Control beats carry **no** `experiment` object at all.
- **A news displacement does not cancel the arm.** If a confirmed moment takes a
  variant day, the news pair ships at that day's experiment hour and keeps the
  `experiment` object; the arm is the hour, not the subject.
- **`16:00Z` is a time-boxed exception to §2's slot table**, open until the 11-30
  readout — not a planning bug. `check-drafts.mjs` enforces no hour.
- **Why not pageviews per post, the other metric Marjorie offered:** it does not
  exist as a number. The first-party counter keys on `utm-visit:<family>` — the
  campaign family, not the item — so every `thread:` beat shares one bucket of
  ~14-16 traceable pageviews a week. Three posts cannot be separated inside it.
  Reason and the fix it would need: strategy §3.

---

## 2026-11-16 (Mon) — ⚫ NOT FILLABLE · Tree run day

- **No beat.** Today's 11:00Z draft run has already completed and drafted
  nothing, because `main` carried no calendar for today (PR #6744 never merged).
- **Do not backfill this date.** A pair with a `scheduledAt` in the past is stale
  on arrival and retires unposted; drafting one spends a run and ships nothing.
- Recorded as the 8th consecutive dark day. The fix is this file landing.

## 2026-11-17 (Tue) — Blank Spaces thread hero (window 11-16→20) · **first beat back**

- **`23:00Z`** · mint `campaign` = **`thread:love-story:single-best-item:2026-11-hero`**
- **`utm_campaign` = `thread`** — the text before the first `:`, pasted verbatim (Rule 6a).
- **Link:** `/?lens=love-story` with `?utm_source=<platform>&utm_medium=social&utm_campaign=thread`.
- **Angle `single-best-item`:** one entry out of the whole Blank Spaces lens —
  the one you would show a friend first — and why that one. Not a tour of the
  lens, not a count of it. One item, all the way down.
- **Feel first:** the ache of it. This lens is a map of someone's whole romantic
  history written in public, and the single best item is the one that still
  makes you put your hand over your mouth. **First sentence = that reaction.**
- **Then the detail:** which item, and the one sourced fact that makes it the
  best one. Pick it off the live lens; verify against the Vault.
- **Why this is the first beat back:** `single-best-item` is the easiest angle in
  the rotation to write with real feeling — one subject, one reaction, no listing
  — and after 8 dark days the first beat's only job is to clear the judge.
- **X half: written FIRST, as its own post** — its own hook, one idea plus the
  link. Never the IG caption truncated and never its opening clause re-used.

## 2026-11-18 (Wed) — 🎤 CMA Awards, PRE-SHOW (about 2h out)

- **`23:00Z`** · mint `campaign` = **`news:cma-awards-2026-preshow:2026-11-18`**
- **`utm_campaign` = `news`**.
- **Link:** the site's own CMA moment or the `the-life-of-a-showgirl` era page —
  `/?item=<momentId>` if content has landed one by then (tracked on
  [#6891](https://github.com/JW-Incorporated/swift2/issues/6891)), otherwise
  `/?era=the-life-of-a-showgirl`. Never a bare domain.
- **Feel first:** she is performing tonight. That is the entire first sentence —
  the nerves and the thrill of a fan about to watch it live. No date in it, no
  network name in it, no "tune in".
- **Then the detail:** one confirmed, sourced thing about the booking — and
  **verify it first**: the date, the network, and that the performance is still
  on. Intake #6840 is the lead, not the source.
- **Era:** `the-life-of-a-showgirl` (the thin bucket — see the ledger).
- **Hard limit:** this is a pre-show, so it has no footage and must not pretend
  to. Never describe a performance that has not happened, never predict a
  setlist as if sourced, never speak as Taylor or her team.
- **X half: written FIRST, as its own post.**

## 2026-11-19 (Thu) — 📰 NEWS RESERVE #1 (week of 11-16) · **the CMA performance itself**

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Check `events.uncovered[]`. A real,
  confirmed, sourced event dated inside the last 48h is drafted **here** as a
  pair, minted `news:<event-slug>`, scored on the six-dimension rubric (`timely`
  ≥4 on its own, `total` ≥21). If there is not one, draft the fallback **exactly
  as written**. Never an empty beat (PR #6321).
- **This is the beat the fortnight is built around.** If she performed on 11-18,
  the performance is the news and nothing else gets this slot.
- **Feel first:** what it felt like to watch it. The first sentence is a fan's
  reaction to the thing they just saw, not a report that it occurred.
- **Then the detail:** what she actually performed, sourced. No setlist claim, no
  quote, no award result that is not confirmed on the record.
- **Named fallback** — mint `campaign` =
  **`heartbeat:era-deep-cut:f1-2016-only-concert:2026-11-19`**, `utm_campaign` =
  **`heartbeat`**, built on new-on-site moment
  `vault-1989-her-only-concert-of-2016-at-the-formula-1-u-s-grand-prix`.
  **Link** `/?item=vault-1989-her-only-concert-of-2016-at-the-formula-1-u-s-grand-prix`.
  Era `1989`. *(Standby pool #3, spent here.)*
  **Feel first for the fallback:** one show in a whole year — the strangeness of
  missing her that much. Then the detail: which show, where, when, from the
  moment record.
- **X half: written FIRST, as its own post.**

## 2026-11-20 (Fri) — Blank Spaces timeline (week of 11-16 minimum) · draft-ahead eligible

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-20`**
- **`utm_campaign` = `timeline`** — **not** `thread`. Four `timeline:` items were
  mis-tagged `thread` in the week to 11-01 and vanished into the "other" bucket.
- **Link:** `/?lens=love-story`.
- **Chapter:** the **Jake Gyllenhaal chapter**, next in the lens's own order after
  John Mayer (shipped 11-04). It was drafted on 11-14 and killed at onVoice 2 /
  specific 2 / notEmbarrassed 2 — the worst caption of the week — so treat the
  previous attempt as a warning, not a starting point. Name the chapter in `why`.
- **Feel first:** this is the one every fan has a feeling about, and the feeling
  is not neutral. Lead with that — the first sentence is the reaction, not the
  chapter heading. **Never open "the next chapter in the blank spaces
  timeline…"** (spent 10-22) and never on a quoted song title (spent 10-29).
- **Then the detail:** one confirmed, dated fact, verified against the Vault.
  **Confirmed public relationship history only** — no rumor-stage claim, no
  speculation, no countdown, ever.
- **X half: written FIRST, as its own post.**

## 2026-11-21 (Sat) — Taylor's Version thread hero (window 11-21→25) · draft-ahead eligible

- **`23:00Z`** · mint `campaign` = **`thread:taylors-version:interactive-challenge:2026-11-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=taylors-version`.
- **Angle `interactive-challenge`:** give the reader one thing to go and do in
  the lens, small enough to finish on a phone in under a minute, with a real
  answer that exists on the site.
- **Feel first:** the specific joy of catching a difference between a Taylor's
  Version and the original — the moment your ear snags on something. First
  sentence = that moment, in first person.
- **Then the detail:** the challenge itself, concrete and findable. Verify the
  answer exists in the lens before writing it.
- **X half: written FIRST, as its own post** — and for a challenge, the two
  halves should ask for *different* things, not the same challenge twice.

## 2026-11-22 (Sun) — 📰 NEWS RESERVE #2 (week of 11-16)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Same rule as 11-19. Never drafted a day early.
- **Named fallback** — mint `campaign` =
  **`heartbeat:era-deep-cut:i-dont-wanna-live-forever-zayn:2026-11-22`**,
  `utm_campaign` = **`heartbeat`**, built on new-on-site moment
  `vault-1989-i-dont-wanna-live-forever-breaks-the-silence-with-zayn`.
  **Link** `/?item=vault-1989-i-dont-wanna-live-forever-breaks-the-silence-with-zayn`.
- **Feel first for the fallback:** the surprise of it — this collaboration should
  not have worked and it did. First sentence is that reaction.
- **Then the detail:** the one sourced fact off the moment record. Era `1989` is
  already used on 11-19's fallback, so **if 11-19 took its fallback, take standby
  pool #2 (Michigan Senate / Showgirl) here instead** and leave 11-28 to pick
  from the remainder — do not stack `1989` twice in one week.
- **X half: written FIRST, as its own post.**

## 2026-11-23 (Mon) — Runway thread hero, **November make-good** · Tree run day

- **`23:00Z`** · mint `campaign` = **`thread:fashion:origin-story:2026-11-makegood`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=fashion`.
- **Why it is here, outside its 11-11→15 window:** Runway's hero was drafted on
  11-11 for the 11-12 slot and killed by the judge with PR #6804 (onVoice 2,
  formula 2 on the X half). A make-good is the whole point of being able to
  place one outside its window. The `campaign` slug says `makegood` so it is
  story-unique against the killed attempt.
- **Angle `origin-story`:** where one look came from — the idea before the
  garment. The previous attempt used the **Speak Now tour gowns**; that subject
  is fine and sourced, so reuse it rather than hunting a new one.
- **Feel first:** the childhood-fairytale pull of those gowns — why a teenager
  in 2011 wanted to be in one. First sentence is that, in first person.
- **Then the detail:** one sourced fact about the gown or its making. Era
  `speak-now` (38 never-used photos, comfortable).
- **X half: written FIRST, as its own post.**

## 2026-11-24 (Tue) — Sherry Lansing Award (standby pool #1, re-placed)

- **`23:00Z`** · mint `campaign` =
  **`heartbeat:event-news:sherry-lansing-award-gerwig:2026-11-24`**
- **`utm_campaign` = `heartbeat`**.
- **Link:** `/?item=vault-tloas-taylor-gets-the-2026-sherry-lansing-leadership-award-with-gr`.
- **Why a fixed beat and not a reserve:** this is the only `notable` moment on
  the 11-16 new-on-site sheet, it carries a real photograph, it was drafted twice
  on 11-11 and killed (PR #6815, IG at onVoice 3 / formula 3 while the X half
  passed clean at 4/5/4/4), and a subject that good should not be left to a
  reserve that might not catch it a third time.
- **Feel first:** pride. Someone handed her an award for leadership and **Greta
  Gerwig** was the one who handed it over, and that pairing is the feeling. First
  sentence is being glad about it, not reporting it.
- **Then the detail:** the award, the presenter, one sourced line — off the
  moment record, quoted exactly or not at all. The X half scored 4s on this
  subject already; the failure was the IG caption's middle turning into a recap.
- **Era:** `the-life-of-a-showgirl` (thin bucket — second and last use this
  fortnight).
- **X half: written FIRST, as its own post.**

## 2026-11-25 (Wed) — 📰 NEWS RESERVE #3 (week of 11-23)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Same rule as 11-19. Never drafted a day early.
- **Named fallback** — mint `campaign` =
  **`heartbeat:era-deep-cut:travis-new-heights-invite:2026-11-25`**,
  `utm_campaign` = **`heartbeat`**, built on new-on-site moment
  `vault-tloas-ill-see-what-my-wife-can-cook-up-travis-volunteers-taylor-fo`.
  **Link** `/?item=vault-tloas-ill-see-what-my-wife-can-cook-up-travis-volunteers-taylor-fo`.
- **Guardrail check, done:** this is **Travis on the record**, saying it himself
  on his own show — not an anonymous source and not relationship speculation, so
  guardrail 4's confirmed-only test is satisfied. **If the Vault record shows it
  sourced to anyone other than Travis himself, drop it and take standby pool #2.**
- **Feel first for the fallback:** the delight of being offered something you
  did not ask for. First sentence is that, warm and short.
- **Then the detail:** the one quote, exactly as the moment record has it.
- **X half: written FIRST, as its own post.**

## 2026-11-26 (Thu) — End Game thread hero (window 11-26→30) · US Thanksgiving

- **`23:00Z`** · mint `campaign` = **`thread:the-proposal:behind-the-data:2026-11-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=the-proposal`.
- **Angle `behind-the-data`:** the lens as a dataset — how many entries it
  tracks, how far back the earliest goes, which era is densest. **Count something
  real off the live lens before writing a word.** Do not assert a count this file
  has not sourced; if it cannot be verified, pick a statistic that can.
- **Feel first — and this angle is where the judge keeps catching us, so read
  this twice:** `behind-the-data` is the angle most likely to produce a recap,
  because a number invites narration. The first sentence is still a feeling —
  what it is like to realise the clues go back *that* far — and the number
  arrives second, as the thing that justifies the feeling. A caption that opens
  on a figure will score onVoice 3 and die.
- **It is Thanksgiving in the US**, which is a genuine reason to be warm and
  sentimental rather than clever. Use it; do not make the post *about* the
  holiday, and never imply Taylor is doing anything for it.
- **X half: written FIRST, as its own post** — and on a data angle the X half
  should carry a *different* statistic, not the same one shortened.

## 2026-11-27 (Fri) — Blank Spaces timeline (week of 11-23 minimum) · draft-ahead eligible

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-27`**
- **`utm_campaign` = `timeline`**.
- **Link:** `/?lens=love-story`.
- **Chapter:** the next unposted chapter in the lens's own order after 11-20's.
  Name it in `why`. **Confirmed public relationship history only** — verify every
  person, date, event and quote against the Vault before it reaches copy.
- **Feel first:** whatever this chapter actually makes you feel, named plainly in
  the first sentence. Not the chapter heading, not a date, not a song title.
- **Then the detail:** one confirmed, dated fact.
- **X half: written FIRST, as its own post.**

## 2026-11-28 (Sat) — Michigan Senate / Showgirl (standby pool #2) · draft-ahead eligible

- **`23:00Z`** · mint `campaign` =
  **`heartbeat:era-deep-cut:michigan-senate-swiftie-showgirl:2026-11-28`**
- **`utm_campaign` = `heartbeat`**.
- **Link:** `/?item=vault-tloas-a-swiftie-wins-michigans-senate-seat-and-reviews-showgirl-on`.
- **Feel first:** the specific joy of spotting one of us somewhere unexpected.
  First sentence is that recognition, in first person.
- **Then the detail:** who, what seat, and the Showgirl line — off the moment
  record, exactly or not at all. **No political commentary of any kind**: the
  post is about a Swiftie being a Swiftie, never about the politics, the party or
  the race. If that line cannot be held cleanly, drop this subject and take a
  remaining standby.
- **If 11-22's reserve already spent this subject,** take
  `vault-tloas-campaigning-for-i-knew-it-i-knew-you-taylor-names-her-two-al`
  instead (Taylor naming her two albums of the year — her own words, on the
  record), and note the swap in `why`.
- **X half: written FIRST, as its own post.**

## 2026-11-29 (Sun) — 📰 NEWS RESERVE #4 (week of 11-23)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Same rule as 11-19. Never drafted a day early.
- **Named fallback** — mint `campaign` =
  **`heartbeat:era-deep-cut:two-albums-of-the-year:2026-11-29`**,
  `utm_campaign` = **`heartbeat`**, built on new-on-site moment
  `vault-tloas-campaigning-for-i-knew-it-i-knew-you-taylor-names-her-two-al`.
  **Link** `/?item=vault-tloas-campaigning-for-i-knew-it-i-knew-you-taylor-names-her-two-al`.
  *(If 11-28 took this one, use the remaining 11-16 sheet moment — the F1 2016
  concert if 11-19 did not spend it — and say so in `why`.)*
- **Feel first for the fallback:** the fun of hearing her be a fan of other
  people's records. First sentence is that.
- **Then the detail:** which two albums, in her own words, exactly as recorded.
- **Last beat of the window.** The 11-30 run rewrites this file, places November's
  `## Review`, and makes the launch-arc call per the ledger's condition.
- **X half: written FIRST, as its own post.**

---

## Review sections

**Next monthly review:** the **2026-11-30** run (the last Tree run of November).
It appends `## Review — November 2026` here per strategy §3 and comments the same
summary on the latest `founders-brief` issue. **What it will have to answer:** did
the feeling-first beat shape above actually clear the judge, measured as pairs
posted 11-17 → 11-29 out of 13 available beats, and what the per-dimension judge
scores did across the fortnight. That is a real measurement with a real
denominator, and it is the one number that matters more than reach at these
follower counts.

**What this plan is betting:** that the judge was right and the brief was wrong.
If beats written feeling-first still score onVoice 3, the hypothesis is dead and
the 11-30 run should say so plainly rather than restate it — the next move then is
a Fable taste ruling on the rubric's anchors, not another prose instruction.
