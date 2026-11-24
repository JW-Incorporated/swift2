# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-11-23 → 2026-12-06.**
Written by Tree's weekly run of 2026-11-23 (a Monday, on schedule). **Not** the
last run of the month — 2026-11-30 is also a Monday, so November's `## Review`
belongs to that run.

**This file ships alone** (strategy §2, "How the calendar ships — one PR, exactly
two files"). Its PR touches only `social/calendar.md` and
`social/calendar.brief.json`. Nothing else, ever — PR #6744 added a third file,
never merged, and cost the account eight dark days.

**No photo table, by design (W8, 2026-09-30).** The daily pre-compute
(`scripts/social/prepare-draft-inputs.mjs`) hands each beat a never-used,
Instagram-sized photo from the full ledger. An era is named below **only** where
the subject is genuinely era-themed; everywhere else the pre-compute picks, which
is also how the two thin buckets stay unspent.

**Text-only X posts are BANNED** (owner, 2026-10-30; hard-gated by
`check-drafts.mjs`). Every beat is one IG + X pair on ONE image. No image, no
post — pick a different subject or skip the slot.

---

## ✅ THE BET FROM LAST WEEK PAID OFF — read this before you change anything

Last week's plan bet that the voice judge was right and the brief was wrong, and
rewrote every beat to name the **feeling first and the detail second**. The result,
from `weekly-scorecard.mjs` on 2026-11-23:

**6 pairs posted, 12 items, 0 failed, 12 distinct openers out of 12.** The week
before was 2 posts and eight consecutive dark days. The hypothesis held. Rule 5
is already amended in the strategy (PR #6911) and **nothing about the beat shape
below is up for revision this fortnight** — it is the one thing in this system
with evidence behind it.

So this file is shorter than last week's. The three rules that bind every beat
are stated once, here, and referenced per beat instead of re-argued:

### Rule A — the feeling opens, the detail follows (strategy §1(e) Rule 5)

The caption's **first sentence carries the feeling and nothing else**: no date, no
number, no quote, no outlet name, no song title in quotes. The one concrete,
sourced detail arrives in sentence two or later. Rule 5's eight hook shapes are
shapes for the *detail*, never for the first sentence.

**Enforcement note, from this week's own grid:** the 11-17 Instagram caption
opened *"november 25, 2020, and my hand still flies to my mouth every time"* — a
real feeling with a **bare date-stamp bolted to the front of it**. It cleared the
judge and it should not have cleared me. A date in the first sentence is a Rule A
failure even when the feeling is also in there. Cut the stamp; the date is a
sentence-two detail.

### Rule B — the news goes first, on every beat (strategy §1(e2), rungs 1-5)

A confirmed, sourced moment dated inside the last 48h that nothing shipped or
queued covers (`events.uncovered[]` **or** that day's `new-on-site` sheet) is
drafted **that day**, as `news:<event-slug>` with `utm_campaign = news`, *instead
of* the planned subject. A reserve's named fallback is the **no-news branch** —
what the day takes when no moment arrived, never a claim that outranks one. A
`timeline:` beat yields too, last of all (rung 5, landed in PR #7091).

**Where a displaced beat goes, named for this window so nobody re-derives it:**
displaced on 11-24/11-25 → 11-29's reserve, replacing its fallback · on
11-26/11-27/11-28 → 12-02's reserve · on 11-30 or later → the 12-07 run's calendar
as a named make-good. Record the chain in the item's `why`; a daily run may not
edit this file, so that `why` is the record until the next weekly run reconciles it.

The gates do not move: a news draft still clears `timely` ≥4, `total` ≥21, the
judge's four floors and `check-drafts`. Two failed passes and the day takes its
planned subject — the branch, not a preference.

### Rule C — the X half may not open on the IG half's opening clause 🆕

**New this week, from a pair that shipped.** On 11-20 Instagram opened *"three
months. i keep coming back…"* and X opened *"three months!! that's the entire
jake…"*. Both halves cleared `check-drafts`'s 20%-different test (the bodies *are*
different) and both cleared the judge — because the rule being broken had never
been written down. It is written down now, in strategy §2's sibling rule (separate
`tree/strategy/2026-W48-1` PR) and on every beat below:

> The X half is written FIRST, as its own post, and its **first sentence is a
> different sentence** — not the Instagram opener with different punctuation.
> Different first three words, minimum.

No checker enforces this yet, so the beat text is the enforcement. Restate it in
every pair's `why`.

---

## Ledger

| State | Value |
|---|---|
| **Posting rate, week to 11-22** | **6 pairs / 12 items, 0 failed.** Marjorie's success signal (`weekly-plan` [#6892](https://github.com/JW-Incorporated/swift2/issues/6892), bet 2) was ≥5 pairs. **Met, with one to spare.** First full-rate week in a month. |
| **Reach, same week** | **0.** Every campaign row of the trailing-7-day table reads reach 0 · saves 0 · shares 0 · likes 0/0 — real zeros from posts with insights on file. Followers: **IG 4 · X 1 · FB 11** (2026-11-22). Supply is fixed; distribution is not, and distribution is not this desk's lever (see the Reddit and awareness rows). |
| Cycle month | **2026-11** (`monthNumber` = 3) through 11-30, then **2026-12** (`monthNumber` = 4) from 12-01. This window straddles the boundary, which is why two rotation rows follow. |
| **November windows + angles** (`angle = ANGLES[(3 + threadIndex) % 5]`, recomputed, same result as 11-02 and 11-16) | Decode 11-01→05 `behind-the-data` · Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces 11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` · End Game 11-26→30 `behind-the-data`. **One still open in this window:** End Game. |
| **December windows + angles** (`angle = ANGLES[(4 + threadIndex) % 5]`, computed this run) | Decode 12-01→05 `quiz-poll` · Clue Web 12-06→10 `origin-story` · Runway 12-11→15 `single-best-item` · Blank Spaces 12-16→20 `interactive-challenge` · Taylor's Version 12-21→25 `behind-the-data` · End Game 12-26→30 `quiz-poll`. **One opens in this window:** Decode, placed 12-01. Clue Web's window opens on 12-06, the last day here — its hero belongs to the 12-07 run, not to a beat squeezed in on the boundary. |
| **Thread progress — November: 5 of 6 shipped or placed, 1 left** | Shipped: Decode 11-02, Clue Web 11-06, Blank Spaces 11-17, Taylor's Version 11-21. **Runway's make-good is in `social/queue/` right now for 11-23** (the 11-12 attempt was killed by the judge, PR #6804). End Game is placed **11-26**. All six land in November if 11-23 and 11-26 ship. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`**. `?mood=` is not a thing and never was. |
| **🚀 Launch arc — PLACED, and it is a new ship, not the deferred one** | **`launch:news-surface`** — the site's live-news layer. "This week's news" carries 42 live items in production, and this week three merged PRs made it findable: [#6976](https://github.com/JW-Incorporated/swift2/pull/6976) (live stories now appear in search under a "News" group — before this, search found **none** of 6 probed live headlines), [#6992](https://github.com/JW-Incorporated/swift2/pull/6992) (live news items get filter-chip tags, so filters reach them) and [#6989](https://github.com/JW-Incorporated/swift2/pull/6989) (outlet names on source links). That passes §1(a)'s "a fan could notice without being told" test — a fan searching *CMA* on the site gets the story now and did not a week ago — and it is live on production, so invariant 6 is satisfied. **Day 0 → 12-03, +2 → 12-05**; +4 → 12-07 and +8 → 12-11 belong to the 12-07 run's calendar. Each later beat is gated on day 0 having actually shipped. |
| **Why day 0 is 12-03 and not this week** | Two reasons, both written down so the next run does not re-litigate them. (1) **Experiment 02 owns 11-24 → 11-29** and its design holds every variable but the hour constant; dropping an arc into the middle of it would break the one measurement in flight. (2) The arc's whole value is site clicks, and **the 11-30 readout tells us which hour to spend it at** — learning the hour first and then spending four beats at the better one is strictly better than the reverse. |
| **`launch:photo-viewer` — deferred a fifth time, now behind the arc above** | Pinch-zoom viewer, live since 2026-07-18, never promoted. The 11-16 plan set a condition — place day 0 on the 11-30 run if ≥5 pairs posted in the week to 11-29. **That condition stands and it is the 11-30 run's to measure**, not mine to pre-empt with a different denominator. It now queues *behind* `launch:news-surface` for the simple reason that §1(a) puts this week's actual ship ahead of a backlog item. |
| Launch backlog, in order behind both | photos + focal program (#762) → `launch:community-engine` (when it ships — invariant 6 forbids teasing it) → shoppable Runway looks → the rumor tier. `launch:shop-the-look` stays closed at 3 of 4; `launch:mood-chat` stays closed at 1 post. |
| **Mood beat** | **November is DONE** — `mood:era-match` shipped 11-03. **December's is NOT placed here, deliberately:** 12-01 → 12-06 carries the Decode hero, the week's timeline minimum, two news reserves and the arc's first two beats, which is all seven days. §1(d) is one beat a month and December has a full fortnight left, so December's Mood beat belongs to the **12-07 run** (window 12-07 → 12-20). Named here so it is not forgotten, not so it is crammed. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 11-23: **11-27**. Week of 11-30: **12-04**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01) → Fearless solo 2008 (10-22) → Back to December / Lautner (10-29) → John Mayer (11-04) → **Jake Gyllenhaal (11-20, shipped on its second attempt after PR #6839 was killed)**. Take chapters in the lens's own order, name the chapter in each item's `why`, verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — 2 per week, 4 in the window** | **11-25 + 11-29** (week of 11-23), **12-02 + 12-06** (week of 11-30). Each carries a named fallback on its own line, and **the fallback is ALWAYS drafted** (PR #6321) — a reserve beat is never left empty for a run that may not fire. Never drafted a day early. |
| **📰 News floor — the mechanism finally fired, twice** | Two weeks running this row read 0 of 16 caught. This week the news beat actually worked: the **CMA performance** shipped 11-21 (`event-cma-2026-performance`, via the event drafter and intake #7013) and **Taylor naming her two albums of the year** took the 11-22 reserve ahead of its own named fallback, which is Rule B doing exactly what it was written to do. The CMA pair was still **three days late** (performance 11-18, post 11-21) — that gap is what #7091's rung 5 and the new `SCHEDULED EVENT` line fix going forward, and it is why the row below exists. |
| **🗓️ `SCHEDULED EVENT` lines — none this window, and that is a real answer** (issue [#7012](https://github.com/JW-Incorporated/swift2/issues/7012)) | I checked every intake issue filed 11-06 → 11-23 for a pre-announced, dated event landing between 11-23 and 12-06. **There is not one.** The CMAs are over, the 2027 Grammys are February, and the MFA Boston exhibit opens April 2027. The line format exists for a date I can source, and I am not writing one for a date I would be guessing at. |
| **⏳ The one event I know about and cannot book yet** | **THR's Women in Entertainment gala**, where Taylor receives the 2026 Sherry Lansing Leadership Award from Greta Gerwig — confirmed and officially announced ([intake #6814](https://github.com/JW-Incorporated/swift2/issues/6814)), but the gala date is **TBD** ("typically early December", and the intake explicitly says do not invent one). It plausibly lands inside this window. **The moment a date is sourced, the run that sees it writes a `SCHEDULED EVENT` line for it** — and the award subject itself is already placed as an ordinary beat on 11-24, so a fan gets the story either way. |
| 🧪 **Experiment 02 — OPEN, the posting hour; readout 11-30** | Design and the four pre-committed readouts: strategy §3. 12 posts shipped last week and every measured Instagram post reached 0 accounts; the one variable never varied is the hour, since §2's slot grammar puts every beat at `23:00Z`. **Variant `16:00Z` on 11-24, 11-26, 11-28; control `23:00Z` on 11-25, 11-27, 11-29** — unchanged from last week's assignment, alternating so day-of-week does not track the arm. Readable because the question is **0 vs non-zero**, not a difference of means. **Read it honestly on 11-30:** at 4 Instagram followers, reach 0 is close to arithmetic, so this experiment's real job is to retire a cheap variable, not to find growth. |
| Openers — computed from the real posted bodies, 11-10 → 11-23 | **12 distinct 6-word openers across 12 items — a genuine clean sweep** against the ≥12-per-14-days target ✅, and unlike last week's it is backed by 12 shipped items rather than by dark days. First-word tally: `the` ×2, `three` ×2, `my` ×2, all others ×1 — the two `three`s are the 11-20 pair, which is Rule C's evidence. **Off the menu this fortnight, on top of the code gates:** any bare date-stamp or *"<n> years ago"* opener (Rule A's enforcement note), opening on a quoted song title, any first sentence whose subject is a fact rather than a feeling, and any X opener sharing the IG opener's first three words (Rule C). |
| Media mix, last 14 days | **12 photo / 12 media-carrying = 100%**, target ≥70% ✅. Zero era tiles, zero undeclared media, zero `site-screen` posts, zero text-only X posts. The gate is holding. |
| **Photo supply — growing, and the thin buckets are the same two** | **314 never-used in a 531-photo library** (up from 307 of 519 last week — eight `social: import sourced concert photos` PRs merged this week, which is the 2026-10-01 standing priority actually working). No era exhausted. 176 of the 314 sit outside Instagram's 0.8–1.91 aspect window and can never ship, so the usable pool is ~138. **Thin buckets, unchanged:** `the-life-of-a-showgirl` **7 of 7** and `tortured-poets` **5 of 5** — the two newest eras are the two smallest, and almost every current-news beat wants a Showgirl photo. So this file names `the-life-of-a-showgirl` on **exactly one beat per week** and lets the pre-compute pick everywhere else. Tracked for content on [#6644](https://github.com/JW-Incorporated/swift2/issues/6644). Uncredited photos are welcome and expected to be the bulk of it. No beat below is blocked. |
| Fast lane | **0 drafted, 2 declined, 32 expired** this week (scoped by `createdAt` ≥ 2026-11-16, per the T6 note: drafted intents stay in `social/inbox/` with a `queueFiles` array; only declines and expiries move to `closed/`). **Both declines were out-of-stock merch** — `1989-blue-seagull-sweat-short` and `but-you-tolerate-it-table-ornament`, each declined because the official store lists it as unavailable, so there is nothing for a fan to act on. `social/inbox/` holds **129 open merch intents**; 170 have now expired across two weeks. Expiry is the normal outcome and I am not drafting a single ornament out of a full store sync — but a side door that keeps proposing sold-out products is spending my gate time on nothing, so it is this week's ask of Marjorie. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel, unmoved for a fifth week; the scorecard records **no Reddit prompts resolved this week**. The lane is blocked on [#6089](https://github.com/JW-Incorporated/swift2/issues/6089) — **36 days unclaimed**, outside Austin's auto-build scope, waiting on a founder "Plan approved" comment that **Marjorie's own plan already carries**. I am not asking for the same click a second time; see the L002 row in `social/lessons.md`. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked for again, same decision, fourth month.** Trailing-7-day reach across 12 posts was 0 — a top-3-by-reach paste would rank nothing. The ask returns the month trailing-7-day median IG reach clears §3's trigger (≥10). |
| Founder tasks | **None filed this week** — the fifth with none, and deliberately. Per the 2026-10-09 amendment Tree asks the owner only for a true human-only blocker (money, a secret, a major strategy call). Nothing this fortnight is one. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see — no brief comment, no issue, no PR comment. *(The Actions variables API returns `403 Resource not accessible by integration` to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze row and from the poster having shipped 12 items this week, which a freeze would have stopped.)* |
| Social event mode | **`normal`** — the `prepare` job's sensor returns `{"mode":"normal","kind":null,"id":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`, and `events.uncovered[]` is empty. No live countdown and no live theory, so **no beats are reserved for event coverage** and the 14 days below are ordinary rotation. |
| Lessons ledger | **Unchanged by this run, and computed rather than eyeballed.** No `social/feedback/2026-W47.jsonl` or `W48.jsonl` exists and `rejections` in the pre-compute is `[]`, so there are **zero `edit`/`reject` rows to attribute** — no new rules, no increments. `findCodifiableRules` returns `[]` (`lessons.autoCodify` is `false`; L003 carries `Codify: #6890`). `findRetirableRules` returns `[]` — L002 is **6 weeks quiet across 6 briefs**, against an 8-week / 10-brief window. Rule C above came from my own audit of shipped captions, not from founder feedback, so it is a **strategy** change and not a lesson. |

---

## Standby pool — three subjects, pre-cleared, for any beat that needs one

Not a dark-day fallback *policy* (that is §2's standby subject); a concrete pool,
so no run has to derive one under time pressure. Each is confirmed and sourced
through an intake issue. **Link rule for all three:** search the site for an
`/?item=` deep link for the moment first; if content has not landed it yet, link
the relevant era page (`/?era=<era>`) — **never a bare domain**.

1. **A new insect species named after her — `Swiftiephylus taylorae`**
   ([intake #7040](https://github.com/JW-Incorporated/swift2/issues/7040), Science
   News Explores, Nov 20). Delightful, harmless, entirely confirmed. **Feel first:**
   the pure absurd joy of a scientist naming a bug after her.
2. **Keltie Knight on Taylor's kindness when she was her backup dancer at the 2009
   VMAs** ([intake #6941](https://github.com/JW-Incorporated/swift2/issues/6941),
   People, Nov 16). First-person, on the record, warm. Era `fearless`.
   **Feel first:** what it means that the stories people tell about her are these.
3. **Taylor presenting Brooks & Dunn with the Willie Nelson Lifetime Achievement
   Award at the CMAs** ([intake #7020](https://github.com/JW-Incorporated/swift2/issues/7020),
   Billboard/Rolling Stone, Nov 19). Her being a fan of someone else, on a stage.

**Do not take from intake without checking it against the blocklist first.** The
11-06 → 11-23 intake run also carries subjects this account does not touch:
anything framed as a feud or a put-down, the state-tax stories (political), the
reported-but-unconfirmed reconciliation story (invariant 13 + guardrail 4), and
anything routed through "Taylor's wedding" (private individuals, family).

---

## 2026-11-23 (Mon) — ✅ COVERED BY QUEUE · Tree run day

- **Already drafted and merged on `main`:**
  `social/queue/thread-fashion-speak-now-gowns-makegood-2026-11-23-{ig,x}.json`,
  campaign `thread:fashion:origin-story:2026-11-makegood`, `23:00Z`. This is
  November's Runway make-good.
- **Do not plan or draft over this date.** A queued pair is committed work; a
  second campaign on the same day would ship two posts against the per-platform
  daily cap and one of them would be skipped.
- Reminder of the standing rule, because it cost two dark days on 11-14/11-15: a
  beat is covered **only** by a queue file merged on `main` that you can `ls`. An
  open `tree/draft/*` PR covers nothing.

## 2026-11-24 (Tue) — Sherry Lansing Award · 🧪 `16:00Z` VARIANT

- **`16:00Z`** (experiment variant — both halves of the pair on the same
  `scheduledAt`, never one of each) · mint `campaign` =
  **`heartbeat:event-news:sherry-lansing-award-gerwig:2026-11-24`**
- **`utm_campaign` = `heartbeat`**.
- **Link:** `/?item=vault-tloas-taylor-gets-the-2026-sherry-lansing-leadership-award-with-gr`.
- **Carry the `experiment` object on both items, verbatim:**
  `{"hypothesis": "every one of the 12 posts in the week to 2026-11-23 went out at 23:00Z and every measured one reached 0 accounts; the hour is the one variable never varied", "variant": "hour-16z", "metric": "instagram reach per post, read as 0 vs non-zero"}`
- **Feel first (Rule A):** pride. Someone handed her an award for leadership and
  **Greta Gerwig** was the one who handed it over, and that pairing is the whole
  feeling. First sentence is being glad about it — not reporting that it happened,
  and not the award's name.
- **Then the detail:** the award, the presenter, one sourced line off the moment
  record, quoted exactly or not at all.
- **History on this subject:** drafted twice on 11-11 and killed (PR #6815) — the X
  half passed clean at 4/5/4/4 while the IG caption's middle turned into a recap.
  The X half's previous attempt is a usable reference; the IG middle is the part
  to write differently.
- **Era:** `the-life-of-a-showgirl` — **this week's one named Showgirl beat**, spent
  here because a 2026 award night genuinely wants a current-era photograph. No
  other beat this week names it.
- **X half: written FIRST, as its own post, and Rule C applies** — different first
  three words from the IG opener.

## 2026-11-25 (Wed) — 📰 NEWS RESERVE #1 (week of 11-23) · `23:00Z` CONTROL

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **No `experiment` object** — a
  control beat carries none.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Check `events.uncovered[]` and the day's
  `new-on-site` sheet per Rule B. A real, confirmed, sourced moment dated inside
  the last 48h is drafted **here** as a pair, minted `news:<event-slug>`, scored on
  the six-dimension rubric (`timely` ≥4 on its own, `total` ≥21). If there is not
  one, draft the fallback **exactly as written**. Never an empty beat (PR #6321).
- **Named fallback** — mint `campaign` =
  **`heartbeat:era-deep-cut:travis-new-heights-invite:2026-11-25`**,
  `utm_campaign` = **`heartbeat`**, built on new-on-site moment
  `vault-tloas-ill-see-what-my-wife-can-cook-up-travis-volunteers-taylor-fo`.
  **Link** `/?item=vault-tloas-ill-see-what-my-wife-can-cook-up-travis-volunteers-taylor-fo`.
- **Guardrail check, done:** this is **Travis on the record**, saying it himself on
  his own show — not an anonymous source and not relationship speculation, so
  guardrail 4's confirmed-only test is satisfied. **If the Vault record shows it
  sourced to anyone other than Travis himself, drop it and take standby #1.**
- **Feel first:** the delight of being offered something you did not ask for.
  First sentence is that, warm and short.
- **Then the detail:** the one quote, exactly as the moment record has it.
- **No era named** — let the pre-compute pick, so the Showgirl bucket stays at 11-24.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-11-26 (Thu) — End Game thread hero (window 11-26→30) · US Thanksgiving · 🧪 `16:00Z` VARIANT

- **`16:00Z`** (variant; same `scheduledAt` on both halves) · mint `campaign` =
  **`thread:the-proposal:behind-the-data:2026-11-hero`**
- **`utm_campaign` = `thread`** — the text before the first `:`, pasted verbatim
  (Rule 6a).
- **Link:** `/?lens=the-proposal` with
  `?utm_source=<platform>&utm_medium=social&utm_campaign=thread`.
- **Carry the same `experiment` object as 11-24, verbatim, on both items.**
- **Angle `behind-the-data`:** the lens as a dataset — how many entries it tracks,
  how far back the earliest goes, which era is densest. **Count something real off
  the live lens before writing a word.** This file asserts no count; if a figure
  cannot be verified, pick a statistic that can.
- **Feel first — and this is the angle the judge keeps catching, so read it twice:**
  `behind-the-data` is the angle most likely to produce a recap, because a number
  invites narration. The first sentence is still a feeling — what it is like to
  realise the clues go back *that* far — and the number arrives second, as the
  thing that justifies the feeling. A caption that opens on a figure scores
  onVoice 3 and dies.
- **It is Thanksgiving in the US**, which is a real reason to be warm and
  sentimental rather than clever. Use the register; do not make the post *about*
  the holiday, and never imply Taylor is doing anything for it.
- **X half: written FIRST, as its own post, Rule C applies** — and on a data angle
  the X half carries a *different* statistic, not the same one shortened.
- **This is November's last unshipped thread.** If it ships, all six threads landed
  in November for the first time since the rotation started.

## 2026-11-27 (Fri) — Blank Spaces timeline (week of 11-23 minimum) · `23:00Z` CONTROL · draft-ahead eligible

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-27`**
- **`utm_campaign` = `timeline`** — **not** `thread`. Four `timeline:` items were
  mis-tagged `thread` in the week to 11-01 and vanished into the "other" bucket.
- **Link:** `/?lens=love-story`. **No `experiment` object.**
- **Chapter:** the next unposted chapter in the lens's own order after **Jake
  Gyllenhaal** (shipped 11-20). Name the chapter in `why`. **Confirmed public
  relationship history only** — verify every person, date, event and quote against
  the Vault before it reaches copy. No rumor-stage claim, no speculation, no
  countdown, ever.
- **Feel first:** whatever this chapter actually makes you feel, named plainly in
  the first sentence. Not the chapter heading, not a date, not a song title.
  **Never open "the next chapter in the blank spaces timeline…"** (spent 10-22).
- **Then the detail:** one confirmed, dated fact.
- **Rule B rung 5 applies here:** if a confirmed, uncovered moment lands on 11-27,
  the moment takes this slot and **the chapter slides to 11-29**, displacing that
  day's fallback. That is this calendar assigning its own slot, and the weekly
  timeline minimum is still met.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-11-28 (Sat) — Michigan Senate / Showgirl · 🧪 `16:00Z` VARIANT · draft-ahead eligible

- **`16:00Z`** (variant; same `scheduledAt` on both halves) · mint `campaign` =
  **`heartbeat:era-deep-cut:michigan-senate-swiftie-showgirl:2026-11-28`**
- **`utm_campaign` = `heartbeat`**.
- **Link:** `/?item=vault-tloas-a-swiftie-wins-michigans-senate-seat-and-reviews-showgirl-on`.
- **Carry the same `experiment` object as 11-24, verbatim, on both items.**
- **Feel first:** the specific joy of spotting one of us somewhere unexpected.
  First sentence is that recognition, in first person.
- **Then the detail:** who, what seat, and the Showgirl line — off the moment
  record, exactly or not at all.
- **No political commentary of any kind.** The post is about a Swiftie being a
  Swiftie, never about the politics, the party or the race. If that line cannot be
  held cleanly in both halves, drop the subject and take standby #1.
- **No era named** (the record mentions Showgirl; the photo does not have to).
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-11-29 (Sun) — 📰 NEWS RESERVE #2 (week of 11-23) · `23:00Z` CONTROL

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **No `experiment` object.**
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Same rule as 11-25. Never drafted a day early.
- **⚠️ The fallback changed — the old one shipped.** Last week's file named
  `two-albums-of-the-year` here; the 11-22 reserve took that subject ahead of its
  own fallback (correctly, under Rule B) and it **posted on 11-23**. Drafting it
  again would be a duplicate.
- **Named fallback, replacing it** — mint `campaign` =
  **`heartbeat:era-deep-cut:i-dont-wanna-live-forever-zayn:2026-11-29`**,
  `utm_campaign` = **`heartbeat`**, built on new-on-site moment
  `vault-1989-i-dont-wanna-live-forever-breaks-the-silence-with-zayn`.
  **Link** `/?item=vault-1989-i-dont-wanna-live-forever-breaks-the-silence-with-zayn`.
  Era `1989` (56 never-used, the healthiest bucket in the library), and `1989` is
  used nowhere else this week.
- **Feel first:** the surprise of it — this collaboration should not have worked
  and it did. First sentence is that reaction.
- **Then the detail:** the one sourced fact off the moment record.
- **If 11-27's chapter slid here under Rule B rung 5,** draft the chapter instead
  and say so in `why`; this fallback then carries to 12-06.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-11-30 (Mon) — MFA Boston, the Eras Collection · Tree run day + November review

- **`23:00Z`** (Experiment 02 ends on 11-29; 11-30 returns to §2's slot grammar
  and carries no `experiment` object) · mint `campaign` =
  **`heartbeat:event-news:mfa-boston-eras-collection:2026-11-30`**
- **`utm_campaign` = `heartbeat`**.
- **Link:** `/?item=vault-tloas-the-mfa-boston-announces-taylor-swift-the-eras-collection-it`.
- **Why this subject gets a fixed beat:** it is the only `notable` moment on the
  2026-11-23 new-on-site sheet, it carries real media, and a major museum opening
  its **first show for a musician** is the kind of thing a fan account should not
  leave to a reserve. ([Intake #6938](https://github.com/JW-Incorporated/swift2/issues/6938).)
- **Feel first:** the vindication of it — the clothes you watched her wear are
  going in a museum. First sentence is that, in first person.
- **Then the detail:** the museum, the show's name, and when it opens — **April
  2027**, verified off the moment record. The exhibit is **not** open; never write
  it as if a fan could go now.
- **No era named** — the subject is cross-era by definition, which also leaves both
  thin buckets alone.
- **X half: written FIRST, as its own post, Rule C applies.**
- **For the run itself:** this is the last Tree run of November, so it appends
  `## Review — November 2026` to this file and comments the same summary on the
  latest `founders-brief` issue. **The two numbers it owes an answer on:** pairs
  posted 11-17 → 11-29 out of the 13 available beats, and Experiment 02's four
  pre-committed readouts (strategy §3).

## 2026-12-01 (Tue) — Decode thread hero, December (window 12-01→05)

- **`23:00Z`** · mint `campaign` = **`thread:hidden-clues:quiz-poll:2026-12-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=hidden-clues`.
- **Angle `quiz-poll`** (December's angle for Decode, computed in the ledger above):
  ask the reader one question with a real answer that exists in the lens, and make
  the answer findable in under a minute on a phone.
- **Feel first:** the particular smugness of having spotted a clue before it paid
  off. First sentence is that feeling, in first person — not the question.
- **Then the detail:** the question itself, concrete, with a verified answer. The
  pre-compute hands this lens's **sourced** counts (42 clues · 24 confirmed · 18
  theory · earliest plant 2014-08-04 · densest era `lover` at 12) — quote those
  as-is, never round or extrapolate, and verify anything else off the live lens.
- **X half: written FIRST, as its own post, Rule C applies** — and for a quiz the
  two halves ask for *different* things, never the same question twice.

## 2026-12-02 (Wed) — 📰 NEWS RESERVE #1 (week of 11-30)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Same rule as 11-25. Never drafted a day early.
- **This is also the landing slot for anything displaced on 11-26 / 11-27 / 11-28**
  (Rule B's cascade). A displaced beat outranks the fallback below.
- **Named fallback** — mint `campaign` =
  **`heartbeat:event-news:grammy-nods-fifth-straight-aoty:2026-12-02`**,
  `utm_campaign` = **`heartbeat`**, built on new-on-site moment
  `vault-tloas-five-nods-for-the-2027-grammys-and-a-fifth-straight-album-up`.
  **Link** `/?item=vault-tloas-five-nods-for-the-2027-grammys-and-a-fifth-straight-album-up`.
  ([Intake #6921](https://github.com/JW-Incorporated/swift2/issues/6921).)
- **Note on media:** that moment's own `mediaKind` is `video` and this pipeline
  posts one image — so the pre-compute's never-used **photo** is the image, exactly
  as on any other beat. A video-media moment is a fine *subject*; it is never the
  media.
- **Feel first:** the steadiness of it — five albums in a row, and you have been
  there for all of them. First sentence is that, not the count.
- **Then the detail:** how many nominations and which category, off the moment
  record. **Do not predict a win**, and do not imply the ceremony has happened —
  the 2027 Grammys are in February.
- **Era:** `the-life-of-a-showgirl` — the week of 11-30's one named Showgirl beat.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-12-03 (Thu) — 🚀 `launch:news-surface` DAY 0 — the site tracks the news

- **`23:00Z`** · mint `campaign` = **`launch:news-surface:day0`**
- **`utm_campaign` = `launch`**.
- **Link:** the live-news surface itself — `/?item=<a current live story's id>` for
  a story a fan would actually want, picked off the site that day. Never a bare
  domain, never `/?mode=` for this.
- **The subject, stated plainly:** the site carries Taylor news as it happens, and
  as of this week you can **search** for it and reach it under the feed's filters
  ([#6976](https://github.com/JW-Incorporated/swift2/pull/6976),
  [#6992](https://github.com/JW-Incorporated/swift2/pull/6992)). Day 0's job is the
  surface existing at all; 12-05 is the searching.
- **Feel first:** the relief of one place that just has it — no scrolling four apps
  to find out whether the thing you heard is real. First sentence is that feeling.
- **Then the detail:** one concrete, verified thing about the surface — **count it
  off production before writing it.** Production had **42 live items** when #6976
  was measured on 11-18; that number moves, so check it or pick a statement that
  does not depend on it.
- **Media:** the pre-compute's photo tile leads, as always. **There is no committed
  `/social/library/` screenshot of this surface yet** (the library has thread, era,
  mood and merch screens and nothing for news), so this beat ships
  `mediaKind: "photo"` — do **not** invent a `site-screen` path that does not
  exist, and do not fall back to an era tile. Asked of Marjorie this week; if a
  screenshot has landed by 12-03, a carousel behind the photo tile is better and
  `mediaKind: "site-screen"` is then correct per §2's ladder.
- **Honesty rail (invariant 6 and 13):** everything claimed here is live on
  production right now. Never describe search behaviour you have not tried, and
  never claim the site is faster or more complete than a fan can verify in a minute.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-12-04 (Fri) — Blank Spaces timeline (week of 11-30 minimum) · draft-ahead eligible

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-12-04`**
- **`utm_campaign` = `timeline`**.
- **Link:** `/?lens=love-story`.
- **Chapter:** the next unposted chapter in the lens's own order after 11-27's.
  Name it in `why`. **Confirmed public relationship history only** — verify every
  person, date, event and quote against the Vault first. No rumor-stage claim, ever.
- **Feel first:** the feeling this chapter actually produces, in the first
  sentence. Not the heading, not a date, not a song title.
- **Then the detail:** one confirmed, dated fact.
- **Rule B rung 5 applies:** a confirmed uncovered moment may take this slot, with
  the chapter sliding to 12-06 — same week, minimum still met, chain recorded in `why`.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-12-05 (Sat) — 🚀 `launch:news-surface` DAY +2 — now you can search it

- **`23:00Z`** · mint `campaign` = **`launch:news-surface:day2`**
- **`utm_campaign` = `launch`**.
- **🔴 Gated on day 0 having actually shipped.** Check `social/posted/` for
  `launch:news-surface:day0`. If it did not post, **do not draft day +2** — draft
  standby #1 instead and say so in `why`, and the arc restarts in the 12-07 run's
  calendar. An arc whose day 0 never landed is four posts of a story nobody heard
  the beginning of.
- **Link:** a live story reached *through search* — pick the story, then write the
  link as `/?item=<that story's id>`.
- **The subject:** search. Before this week the index was built from baked content
  only, so **none** of six probed live headlines could be found; now live stories
  come back under a "News" group and picking one opens the story. Filters reach
  them too.
- **Feel first:** the small satisfaction of typing half a thing you half-remember
  and having it come back. First sentence is that.
- **Then the detail:** one verified thing — **try the search yourself before
  writing it**, and name the story you actually found. Nothing claimed here is
  allowed to be untested.
- **Media:** as 12-03 — photo tile, or a carousel behind it if a news-surface
  screenshot has landed by then.
- **Arc tail, for the 12-07 run:** day +4 → 12-07, day +8 → 12-11, each gated on
  the beat before it having shipped.
- **X half: written FIRST, as its own post, Rule C applies.**

## 2026-12-06 (Sun) — 📰 NEWS RESERVE #2 (week of 11-30)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Same rule as 11-25. Never drafted a day early.
- **Named fallback** — **standby pool #2**, Keltie Knight on Taylor's kindness when
  she was her backup dancer at the 2009 VMAs
  ([intake #6941](https://github.com/JW-Incorporated/swift2/issues/6941)). Mint
  `campaign` = **`heartbeat:era-deep-cut:keltie-knight-2009-vmas:2026-12-06`**,
  `utm_campaign` = **`heartbeat`**, era `fearless`. **Link:** the site's `/?item=`
  for the moment if content has landed it, otherwise `/?era=fearless`.
- **Feel first:** what it means that the stories people who worked with her tell
  are *these* stories. First sentence is that.
- **Then the detail:** who she is, what she was doing there, the one thing she
  actually said — on the record, exactly or not at all.
- **If 11-29's Zayn fallback carried here** (because 11-29 took a slid chapter),
  draft that instead and say so in `why`.
- **Last beat of the window.** The 12-07 run rewrites this file, places December's
  Mood beat and the Clue Web December hero, and carries the arc's day +4/+8.
- **X half: written FIRST, as its own post, Rule C applies.**

---

## Review sections

**Next monthly review:** the **2026-11-30** run (the last Tree run of November).
It appends `## Review — November 2026` here per strategy §3 and comments the same
summary on the latest `founders-brief` issue. **What it owes an answer on:** pairs
posted 11-17 → 11-29 against the 13 available beats, the per-dimension judge scores
across the fortnight, and Experiment 02's four pre-committed readouts.

**What this plan is betting.** Last fortnight's bet — that the judge was right and
the brief was wrong — came in **6 pairs of 6, 0 failed**. So this plan does not
re-bet it; it bets something smaller and more specific instead: **that the gates
that still let things through are gaps in what is written down, not gaps in
judgement.** Rule C is the test. Two captions shipped this week that the calendar
had already forbidden in prose — one opened on a date-stamp, one pair shared its
opening clause across platforms — and both cleared every automatic gate. If
writing those two rules into the strategy and onto every beat stops them
recurring, the next unwritten rule is worth finding the same way. If they recur
anyway, the answer is a checker, not more prose, and the 12-07 run should say so
plainly rather than restate this.

**The honest ceiling, stated once.** Twelve posts, zero reach, four Instagram
followers. Nothing in this file can fix that, and no caption can: the mechanism
every target in strategy §3 depends on is growth-plan §6's outward-engagement
engine, which has never run and is blocked on
[#6089](https://github.com/JW-Incorporated/swift2/issues/6089) at 36 days
unclaimed. The calendar's job in the meantime is to be worth finding when someone
finally arrives — which is what a full-rate week of posts a fan would actually
want looks like.
