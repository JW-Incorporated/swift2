# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-10-26 → 2026-11-08.**
Written by Tree's weekly run of 2026-10-26 (a Monday, on schedule; the last run
of October, so it carries the monthly review at the bottom).

**No photo table in this calendar, by design (W8, 2026-09-30).** The daily
pre-compute (`scripts/social/prepare-draft-inputs.mjs`) hands each beat a
never-used, Instagram-sized photo from the full ledger. A hand-assigned table
cannot see drafts waiting in open PRs, which is how photos got repeated. Era is
named below **only** for a themed beat.

**No experiment arms. No `experiment` object on any item** (strategy §3, closed
in PR #6105). Every Instagram beat carries the mid-tail tag block as the
**default**. There is deliberately no replacement experiment this fortnight
either — see the ledger.

---

## 🔴 THE CHANGE THIS FORTNIGHT — the news lane is finally reachable, and it just cost us a dark day

**Last week's merge outage is over.** Six of the seven things the 10-19 plan
called red are fixed: `scripts/lib/moment-media-gate.mjs` now treats a closed
intent as a `warn` rather than an `error`, so `build-content` stopped failing
every Tree PR that touches `social/inbox/**`; the 10-25 daily draft merged
normally ([#6296](https://github.com/JW-Incorporated/swift2/pull/6296)); the
inbox is empty with both past-deadline intents expired; and **12 posts shipped
10-19 → 10-24, exactly the six beats the plan asked for, with zero failures.**
Mood shipped for the first time in this desk's existence (10-21) and the owner
approved it at a critique total of 22.

**And then 10-25 shipped nothing, because of a planning rule I wrote.** The
reserve-day rule in §1(e2) said that if the daily drafter finds an uncovered
event, it leaves the beat empty for the same-day event run. On 10-25 it did
exactly that — naming intake
[#6290](https://github.com/JW-Incorporated/swift2/issues/6290) and
[#6273](https://github.com/JW-Incorporated/swift2/issues/6273) in its own PR
body — and `routine-tree-event-draft.yml` never fired for either (its last run
of the week was 10-23, intake #6258). **One dark day, two uncovered events, and
the slot that was held for them went to waste.** That rule is gone as of today
([PR #6321](https://github.com/JW-Incorporated/swift2/pull/6321)): a reserve
beat now **always drafts its named fallback**, and an arriving event takes it or
displaces a beat. The runner prompt still carries the old wording and is outside
this desk's mutation rights, so it is filed to Marjorie this run — until that
lands, **every reserve beat below says "draft the fallback" in its own text,
which is the file the drafter actually reads.**

**The other half of the fix landed today too.** `event-dispatch.mjs` now scans
48h instead of 24h and promotes a moment the site already fronts past the
keyword test entirely ([#6313](https://github.com/JW-Incorporated/swift2/issues/6313)),
and `tree-event-draft.md` step 5 now **displaces** a heartbeat or mood beat
instead of needing a vacant day. Both were what my NEEDS HELP on
[#6310](https://github.com/JW-Incorporated/swift2/issues/6310) asked for. That
ask is answerable now, and this plan is the answer: **four landing days a week
for news, every reserve productive, and ≥2 displaceable beats in every rolling
7 days, checked window by window below.**

---

## 🟢 And one thing deliberately dropped

**The `launch:photo-viewer` arc is deferred to the 11-09 fortnight, not
cancelled.** The 10-19 plan put day 0 on 11-01 and left +2/+4/+8 to this run.
Placing them makes the week illegal: a 7-day week owes a thread hero, a Blank
Spaces chapter and a news reserve, leaving four beats, and §1(e2) needs two of
those four to stay displaceable. An arc taking three leaves one. The arc waits
because launch eligibility does not expire — the viewer has been live since
2026-07-18 — while a major moment missed by 48h is gone for good. Written into
strategy §1(a) today so no future run walks into the same arithmetic
([PR #6321](https://github.com/JW-Incorporated/swift2/pull/6321)), and recorded
in the launch-backlog row below with the fortnight it moves to.

---

## Ledger

| State | Value |
|---|---|
| **⚫ Merge outage, 10-16 → 10-25: CLOSED** | `scripts/lib/moment-media-gate.mjs` now emits a `warn`, not an `error`, for a `SURFACE_MEDIA_LEGACY` entry whose intent is closed, so `build-content` no longer fails every Tree PR touching `social/inbox/**`. 12 posts shipped 10-19 → 10-24 and the 10-25 draft merged. **Residue:** seven Tree draft PRs from the outage are still open and long past the 48h staleness window (#5443, #5495, #5998, #6027, #6056, #6112, #6141) — `retire-stale-drafts.mjs` is not closing them. Filed to Marjorie; it is clutter, not a blocker. |
| Cycle month | **2026-11** (`monthNumber` = 3) from 11-01. October (`monthNumber` = 2) closes inside this window on 10-31 and its last two beats are below. |
| **October windows + angles** (`angle = ANGLES[(2 + threadIndex) % 5]`) | Decode 10-01→05 `interactive-challenge` · Clue Web 10-06→10 `behind-the-data` · Runway 10-11→15 `quiz-poll` · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| **November windows + angles** (`angle = ANGLES[(3 + threadIndex) % 5]`, computed this run) | Decode 11-01→05 `behind-the-data` · Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces 11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` · End Game 11-26→30 `behind-the-data`. Only Decode and Clue Web fall inside this window; the other four belong to later runs. |
| **Thread progress, October — 5 of 6** | Decode **✅ shipped 10-03**. Clue Web **✅ shipped 10-09**. Taylor's Version **✅ shipped 10-23**. End Game **queued for tonight 10-26** (`social/queue/end-game-ring-challenge-2026-10-26-{ig,x}.json`). Runway takes October's **one make-good on 10-30**. **Blank Spaces' hero stays dropped** — its lens was still taught twice this month through the timeline beats (10-22 shipped, 10-29 below), so the miss is a hero, not a lens. October lands **5 of 6 threads taught**, as the 10-19 plan projected. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`** (strategy §1(d)). `?mood=` is not a thing and never was. |
| **Launch arc — DEFERRED to the 11-09 fortnight** | `launch:photo-viewer` (the pinch-zoom viewer, [#831](https://github.com/JW-Incorporated/swift2/pull/831), live since 2026-07-18, never promoted). Not cancelled and not shortened: the 10-19 plan's 11-01 day 0 would have put day 0/+2/+4 into a week that owes a thread hero, a timeline chapter and a news reserve, leaving one displaceable beat against §1(e2)'s required two. **The 11-09 run places the whole 4-post arc with room.** Its day-0 gate is unchanged and hard (invariant 6): open www.longlivets.com on a phone, pinch-zoom a photo on an item page, confirm it works, and if it does not render, do not draft day 0. |
| Launch backlog, in order behind it | photos + focal program (#762) → `launch:community-engine` (when it ships — #5864/#6100 are still schema and reader work, so invariant 6 forbids teasing it) → shoppable Runway looks → the rumor tier. `launch:shop-the-look` stays closed at 3 of 4; `launch:mood-chat` stays closed at 1 post. |
| New user-visible ships, 10-19 → 10-26 | **None that earn an arc.** 100 PRs merged. The nearest miss is [#6186](https://github.com/JW-Incorporated/swift2/pull/6186) (`visualizer` kind so official visualizers lead the video feed) — a feed-ordering change a fan would have to be told about to notice, which fails §1(a)'s own test. Everything else was merch-sync plan authoring, Tidewatch eval work (all flag-off), photo imports (content backfill) and human-action bookkeeping. |
| **Mood beat** | **October ✅ SHIPPED 10-21** — `mood:result:romanticizing-a-tuesday`, the first Mood post this desk has ever landed, approved by the owner at critique total 22 (`social/feedback/2026-W43.jsonl`). **November = `mood:era-match`, placed 11-03** — rotating format per §1(d), and specifically the format whose 10-03 attempt was approved and then killed by the 48h-from-approval clock without a posting attempt. One slot, as in October. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 10-26: **10-29**. Week of 11-02: **11-04**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01) → Fearless solo 2008 (10-22). Take the next two unposted chapters **in the lens's own order** off `/?lens=love-story`, name the chapter in each item's `why`, and verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — 2 in week 1, 1 in week 2** | **10-28** and **11-01** (week of 10-26), **11-07** (week of 11-02). Each carries a named fallback on its own line. **New as of today: the fallback is ALWAYS drafted** ([PR #6321](https://github.com/JW-Incorporated/swift2/pull/6321)) — a reserve beat is never left empty for a run that may not fire, which is what cost 10-25. Never drafted a day early. |
| **📰 Major moments ship same-day** (§1(e2)) | Ceiling ≤3 news posts per rolling 7 days, ≤2 of them ordinary. **Four landing days in week 1** (reserves 10-28 + 11-01, displaceable 10-27 + 10-31) and **four in week 2** (reserve 11-07, displaceable 11-03 + 11-05 + 11-08), against a floor of three moments reaching both platforms inside 48h. The ≥2-displaceable check is below, window by window — checked, not asserted. |
| **📰 Floor performance, week to 10-26** | **0 of 3.** Zero news pairs shipped this week against 10 moments on the site's own new-on-site sheet. The week to 10-19 was 1 of 15. Named misses, with the reason: intake #6290 (GMA) and #6273 (New Heights) — the 10-25 reserve was held empty for an event run that never fired. The eight remaining 10-26 sheet moments — Richard Marx, Maya Hawke, Prince William, Seattle Symphony, Selena Gomez, Caitlin Clark at Arrowhead, Jason's Squatober call, Showgirl's 15th week at No. 1 — were never dispatchable: `event-dispatch.mjs` only scanned 24h and only matched its keyword list until today. Both constraints are gone; this plan is the first fortnight the floor is mechanically reachable. |
| 🧪 **Experiment — none this fortnight, deliberately** | Experiment 01 closed at n = 2, unreadable. All eleven October IG posts with insights on file are at **reach 0-2** (`social/metrics/posts/2026-10/`); the top three are tied at reach 2. A one-impression instrument cannot resolve a caption lever, a format lever or a time lever, so spending a slot in four on a labelled arm buys a number nobody can read. The comparison returns as a clean 3-vs-3 the first week trailing-7-day median IG reach is **≥10** (strategy §3). |
| Openers — burned in the last 14 days, **do not reuse verbatim or near** | **13 distinct patterns across 14 posted items** (10-16 → 10-24), against a ≥12-per-14-days target ✅ — up from 10 of 14 last week. Burned: *"okay this is the sweetest thing…"* · *"turns out taylor's home rotation is…"* · *"she FINALLY played it live 😭"* · *"over a year of waiting to hear it off a stage…"* · *"no label fight. no asterisk. just hers."* · *"the thing about Lover that still gets overlooked…"* · *"okay i tapped <chip> on Mood just to see what it'd do…"* · *"i expected a corny playlist. instead…"* · *"the next chapter in the blank spaces timeline isn't a boyfriend…"* · *"heartbreak in, arena tour out."* · *"of all six re-records, speak now is the one that…"* · *"speak now is the only album Taylor wrote entirely alone…"* · *"twenty years ago tomorrow…"*. **Off the menu this fortnight:** any bare date-stamp or *"<n> years ago"* opener, *"okay i/this…"* as a sentence-opener (spent twice in nine days), and *"the thing about <X> that still gets overlooked"*. |
| **⚠️ Sibling drift, 10-24 — the one editorial miss this week** | Both halves of the debut-anniversary pair opened on the **same clause**: IG *"twenty years ago tomorrow. that's how long we've had this album"*, X *"twenty years ago tomorrow, a 16-year-old put out eleven songs"*. That is a date-stamp opener, which the 10-24 beat's own calendar text explicitly ruled out, used twice in one pair. The owner approved it, so it is **not** a lessons-ledger rule (T5 builds rules from ✏️/❌ rows only) — it is a direction that was written and not followed. Every beat below that could attract a date-stamp now says so in its own hook line, and the sibling rule is restated: the X half is **written first, as its own post**, never the IG caption's opening clause re-used. |
| Media mix, last 14 days | **7 photo / 7 media-carrying = 100%**, target ≥70% ✅. Every IG post carried a real Taylor photograph. Zero era tiles, zero undeclared media, zero `site-screen` posts. The gate is holding and the grid reads as a Taylor Swift fan page. |
| **Photo supply** | Two sourced-photo imports landed this week ([#6198](https://github.com/JW-Incorporated/swift2/pull/6198), [#6243](https://github.com/JW-Incorporated/swift2/pull/6243)), so the library is moving again after four static days — the trend the 10-19 plan flagged has corrected. Growing the library stays a standing priority (2026-10-01 amendment): **any beat below whose era has no never-used photo left must say so in the draft PR body**, because that is the only signal the library gets fed. No era is exhausted as of this run. |
| Fast lane | **0 drafted, 0 declined, 0 expired** this week (scoped by `createdAt` ≥ 2026-10-19). `social/inbox/` holds **zero** open intents — last week's two past-deadline intents are expired and in `social/inbox/closed/`. Nothing stuck. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel. The scorecard records no Reddit prompts resolved this week (down from 3 last week), and the awareness lane that feeds them is blocked on [#6089](https://github.com/JW-Incorporated/swift2/issues/6089) — see the L002 row in `social/lessons.md`. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked for again this month, and it is the same decision.** Every October IG post is at reach 0-2, so a top-3-by-reach paste would rank noise — the top three are literally tied. The ask returns the month trailing-7-day median IG reach clears §3's trigger (≥10). |
| Founder tasks | **None filed this week.** Per the 2026-10-09 amendment Tree asks the owner only for a true human-only blocker (money, a secret, a major strategy call) and there is none. The one founder-only item in flight — the "Plan approved" comment that unblocks #6089 — is already carried in **Marjorie's** plan under *Needs the owner*, and asking twice for the same click is how the lane gets ignored. The owner's verdict channel is working: 4 ✅, 0 ✏️, 0 ❌ this week at a 5h 3m median. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see. *(The Actions variables API returns 403 to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze row and from 12 posts having shipped through `social-poster.yml` this week, which it refuses to do under a freeze.)* |
| Social event mode | **`normal`** — `scripts/social/event-status.mjs` returns `{"mode":"normal","kind":null,"id":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`. No countdown and no live theory, so **no beats are reserved for event coverage** and the 14 days below are ordinary rotation. *(It needed `npx tsx` plus a manual `npm install` to run at all — `routine-tree-weekly-plan.yml` has no workspace-install step, unlike the daily-draft and event-draft workflows. Filed to Marjorie.)* |

---

## 2026-10-26 (Mon) — ⚫ COVERED BY QUEUE · Tree run day

`social/queue/end-game-ring-challenge-2026-10-26-{ig,x}.json`, campaign
`thread:the-proposal:interactive-challenge:2026-10-hero`, scheduled `23:00Z`.
This is October's **End Game thread hero** and it is already drafted and
queued. **Plan nothing here and draft nothing here** — a second pair for today
would be skipped by the one-per-platform-per-day cap, go stale and retire to
`social/failed/`.

## 2026-10-27 (Tue) — Heartbeat (DISPLACEABLE, §1(e2))

- **`23:00Z` · `heartbeat:symbol-thread`** — mint
  `symbol-thread:<motif-slug>:2026-10-27`. Link `/?lens=easter-eggs`.
- **Subject direction:** one motif from the Invisible Strings atlas that recurs
  across at least two eras. Source every appearance against the Vault;
  speculation is **labelled** as speculation, never asserted (vision.md's rule,
  verbatim on social).
- **Hook direction:** the artifact, or the challenge ("find it in ten seconds").
  **Not** a date-stamp and **not** an `"okay …"` opener — both burned.
- **Yields first** to a major moment arriving off-reserve (§1(e2)'s order).

## 2026-10-28 (Wed) — 📰 NEWS RESERVE (week of 10-26)

- **`23:00Z` · `news:<event-slug>`**, or the fallback below.
- **🔴 DRAFT THE FALLBACK IF NOTHING IS UNCOVERED, AND NEVER LEAVE THIS BEAT
  EMPTY.** Changed today ([PR #6321](https://github.com/JW-Incorporated/swift2/pull/6321)):
  check `events.uncovered[]`, and if a real uncovered event dated inside the
  last 48h is there, draft **that** as `news:<event-slug>`. If there is not,
  draft the named fallback exactly as written. The old rule — leave the beat for
  the event run — is withdrawn; it cost 10-25 entirely.
- **Named fallback:** `heartbeat:era-deep-cut` on **`1989`**, built on the
  new-on-site moment
  `vault-1989-moved-by-become-ocean-she-sends-the-seattle-symphony-50-000`,
  minting `heartbeat:era-deep-cut:1989-seattle-symphony-50k:2026-10-28` and
  linking
  `/?item=vault-1989-moved-by-become-ocean-she-sends-the-seattle-symphony-50-000`.
- **Era note:** `1989` has not shipped in the last 14 days, so it is clear of the
  no-stacking rule, and it breaks a run of five straight TLOAS/debut/Speak Now
  beats.
- **News bar:** confirmed fact from the intake record only, scored on the
  six-dimension rubric with `timely` ≥4 on its own. Nothing on the #36 blocklist
  except an already-confirmed personal-life event, covered factually like any
  other real event.
- **Hook direction, for the fallback:** the number. $50,000 to a symphony
  orchestra because a piece of music moved her is the whole hook, and "she gave
  money away" is not — name the piece.

## 2026-10-29 (Thu) — Blank Spaces timeline (week of 10-26 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-10-29`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter in the lens's own order after
  Fearless solo 2008. Name the chapter in `why`. **Confirmed public relationship
  history only** — verify every person, date, event and quote against the Vault
  before it reaches copy; rumor-stage relationship-existence claims, countdowns
  and speculation stay banned outright.
- **Media:** pre-compute pick, era-relevant where the pick allows. A Blank
  Spaces lens screenshot may ride IG slide 2 only under the "cool feature only"
  rule.
- **Hook direction:** the artifact (start with what the photograph is) or a real
  sourced quote. **Not** a date-stamp, **not** *"the next chapter in the blank
  spaces timeline…"* — 10-22 just spent that exact shape — and not *"every love
  story has a…"*.

## 2026-10-30 (Fri) — Runway thread hero · **October's one make-good** (protected)

- **`23:00Z` · `thread:fashion:quiz-poll`** — mint
  `thread:fashion:quiz-poll:2026-10-hero`. Link `/?lens=fashion`.
- **This is an explicit out-of-window make-good** for the Runway window
  10-11→15, which closed with its hero written on PR #5998 and blocked red by
  the merge outage. Allowed by strategy §1(b): one a month, taking a heartbeat
  beat, never another minimum. **Write fresh copy** — do not resurrect #5998's
  body; that PR is 14 days stale and its opener is 15 days from its own context.
- **Not displaceable.** It is October's last chance at a fifth thread, and the
  month ends in two days.
- **Angle `quiz-poll`:** a question whose answer lives inside the Runway thread.
  X gets a real poll where the platform allows; the IG half asks the same
  question in prose and sends people to the lens to settle it. Structurally
  different halves, not a truncated caption.
- **Subject direction:** pick ONE Runway look the thread documents in detail and
  build the question around a detail only someone who opened the lens would know
  — a designer, a re-wear, a colour that recurs across a tour leg. Verify every
  attribution against the Vault; do not assert a designer or a date this file
  has not sourced.
- **Media:** pre-compute pick. The Runway lens is a genuinely visual product
  surface, so a `/social/library/` screenshot **earns IG slide 2** behind the
  photo tile — only if it shows the lens in rich actual use, never a flat page.
- **Why here:** Runway is the one thread dropped two months running, and both
  drops were engine failures rather than planning choices.

## 2026-10-31 (Sat) — Heartbeat (DISPLACEABLE, §1(e2))

- **`23:00Z` · `heartbeat:on-this-day`** — mint
  `on-this-day:<subject-slug>:2026-10-31`. Link `/?item=<momentId>`.
- **Subject direction:** it is Halloween, and that is a real seasonal hook, not
  a theme to invent. Search the Vault for a moment dated **October 31** — a
  costume, an appearance, a release — and use it. **If there is no genuinely
  dated October 31 match, do not stretch one:** fall back to
  `heartbeat:era-deep-cut` on **`folklore`**, minting
  `heartbeat:era-deep-cut:folklore-<subject>:2026-10-31` and linking
  `/?era=folklore`, and say in `why` that the dated search came up empty.
- **Hook direction:** the artifact or direct address. **A date-stamp opener is
  burned twice over now** — 10-24's pair opened on one on both halves — and on
  this day of all days it is also the dullest available choice.
- **Yields first** to a major moment arriving off-reserve.

## 2026-11-01 (Sun) — 📰 NEWS RESERVE #2 (week of 10-26)

- **`23:00Z` · `news:<event-slug>`**, or the fallback below. **Same rule as
  10-28: draft the fallback if nothing is uncovered, never leave the beat
  empty.**
- **Why a second reserve this week:** the floor is ≥3 moments reaching both
  platforms inside 48h and this week delivered **0 of 3**. A second reserve costs
  no minimum (October's thread work finishes 10-30 and the launch arc is
  deferred) and gives the lane a fourth landing day in the first fortnight where
  the dispatch path actually works.
- **Named fallback:** `heartbeat:era-deep-cut` on **`the-life-of-a-showgirl`**,
  built on the new-on-site moment
  `vault-tloas-richard-marx-on-the-15-year-old-taylor-he-passed-on-writing-`,
  minting `heartbeat:era-deep-cut:richard-marx-passed-on-writing:2026-11-01` and
  linking
  `/?item=vault-tloas-richard-marx-on-the-15-year-old-taylor-he-passed-on-writing-`.
- **Hook direction, for the fallback:** the real quote. Lead with Richard Marx's
  own words — *"I did the right thing"* about passing on a writing session with
  a 15-year-old Taylor — and attribute after. An outsider describing her, in his
  own voice, is a shape this account has used once and it was the best-reaching
  post of 10-16.
- **Sourcing:** his words come from the intake record and the Vault item, quoted
  exactly or not at all. Do not characterise what he meant.

## 2026-11-02 (Mon) — Decode thread hero (window 11-01→05) · Tree run day

- **`23:00Z` · `thread:hidden-clues:behind-the-data`** — mint
  `thread:hidden-clues:behind-the-data:2026-11-hero`. Link `/?lens=hidden-clues`.
- **November's first thread hero.** `angle = ANGLES[(3 + 0) % 5]` =
  `behind-the-data`, computed this run.
- **Angle `behind-the-data`:** the thread as a *dataset* — how many clues it
  tracks, how far back the earliest one goes, which era is densest, what the
  shape of it tells you. The number is the post; the lens is where you go to
  read the rows.
- **Subject direction:** count something real off the live lens before writing a
  word. Do not assert a count this file has not sourced — if the count cannot be
  verified, pick a different statistic that can.
- **Hook direction:** the number, or the contradiction. Not a date-stamp.
- **X half:** written first, as its own post — one idea plus the link, never the
  IG caption truncated or its opening clause re-used.

## 2026-11-03 (Tue) — Mood beat, November (DISPLACEABLE, §1(e2) rung 2)

- **`23:00Z` · `mood:era-match`** — mint `mood:era-match:2026-11-03`. Link
  **`/?mode=mood`** with the standard UTM tags. Never `?mood=`.
- **Format `mood:era-match`, rotating off October's `mood:result`.** It is also
  the format whose 10-03 attempt was approved by the owner and then killed
  unposted by the 48h-from-approval clock — so this is its first real airing.
- **Hard constraints:** quote the starter chip **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, never reworded.
  **Pick a chip whose real results come from scored eras.** evermore, Midnights,
  TTPD and TLOAS are not scored: never promise "every song" and never name those
  eras as Mood results. Run the chip against the live feature and screenshot
  what it actually returned before writing a word of the caption.
- **Hook direction:** the artifact — start with the era it matched you to and
  why that landed — or the honest surprise. **Not** *"okay i tapped …"*; 10-21
  spent that exact opener and it is burned.
- **Why here:** Mood shipped for the first time on 10-21 and the owner approved
  it at critique 22, the highest of the week. This month's beat goes early
  rather than late so a mechanical failure still leaves November time to retry.

## 2026-11-04 (Wed) — Blank Spaces timeline (week of 11-02 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-11-04`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter after 10-29's. Same sourcing
  bar: confirmed-only, verified against the Vault, chapter named in `why`.
- **Hook direction:** a different shape from 10-29's. Direct address or the
  honest question. Not a date-stamp, and not the shape 10-29 used.

## 2026-11-05 (Thu) — Heartbeat (DISPLACEABLE, §1(e2))

- **`23:00Z` · `heartbeat:era-deep-cut`** — mint
  `heartbeat:era-deep-cut:prince-william-wembley-selfie:2026-11-05`, built on
  the new-on-site moment
  `vault-tloas-prince-william-on-the-wembley-selfie-travis-kept-coming-back`.
  Link
  `/?item=vault-tloas-prince-william-on-the-wembley-selfie-travis-kept-coming-back`.
- **Subject direction:** the Prince of Wales's own account of the Wembley
  backstage selfie. Confirmed, on the record, and warm — the joke is his, not
  ours. Quote him exactly or not at all; do not characterise the relationship
  beyond what he said.
- **Hook direction:** the quote, or direct address. **Not** a date-stamp.
- **Yields first** to a major moment arriving off-reserve.

## 2026-11-06 (Fri) — Clue Web thread hero (window 11-06→10)

- **`23:00Z` · `thread:easter-eggs:quiz-poll`** — mint
  `thread:easter-eggs:quiz-poll:2026-11-hero`. Link `/?lens=easter-eggs`.
- `angle = ANGLES[(3 + 1) % 5]` = `quiz-poll`, computed this run.
- **Angle `quiz-poll`:** one question whose answer is genuinely inside the Clue
  Web lens. X gets a real poll where the platform allows; IG asks the same
  question in prose and sends people to the lens to settle it. **Check the answer
  is actually in there before writing the question.**
- **Hook direction:** the challenge or the honest question. **Not** anything
  addressing *"the clowns 🤡"* — that shape is off the menu — and **not** the
  `"the <thread name> has one theory…"` opener.
- **Note:** 10-27's heartbeat also links `/?lens=easter-eggs`. Ten days apart is
  clear of the stacking rule, but pick a motif there and a *different* question
  here — do not quiz on the motif 10-27 already explained.

## 2026-11-07 (Sat) — 📰 NEWS RESERVE (week of 11-02)

- **`23:00Z` · `news:<event-slug>`**, or the fallback below. **Same rule: draft
  the fallback if nothing is uncovered, never leave the beat empty.**
- **Named fallback:** `heartbeat:era-deep-cut` on **`folklore`**, built on the
  new-on-site moment
  `vault-tloas-maya-hawke-on-hot-ones-but-daddy-i-love-him-and-betty-are-ep`,
  minting `heartbeat:era-deep-cut:maya-hawke-epic-poetry:2026-11-07` and linking
  `/?item=vault-tloas-maya-hawke-on-hot-ones-but-daddy-i-love-him-and-betty-are-ep`.
- **Era note:** if 10-31's dated Halloween search came up empty and that beat
  took its `folklore` fallback, **this beat's fallback moves to `reputation`**
  with a deep-cut subject of the drafter's choosing off `/?era=reputation` — no
  two `folklore` posts in one week. Say which branch you took in `why`.
- **Hook direction, for the fallback:** the quote. Maya Hawke calling "betty"
  epic poetry on Hot Ones is the hook; the fact that it was said on a hot-wings
  show is the second line, not the first.

## 2026-11-08 (Sun) — Heartbeat (DISPLACEABLE, §1(e2))

- **`23:00Z` · `heartbeat:track-fact`** — mint
  `track-fact:<subject-slug>:2026-11-08`. Link `/?item=<momentId>` or
  `/?era=<eraId>`.
- **Subject direction:** one sourced fact off a track dossier, from an era this
  fortnight has not already used — so **not** `1989` (10-28), `the-life-of-a-showgirl`
  (11-01), `folklore` (10-31/11-07) or whichever era 10-29 and 11-04's chapters
  land in. `reputation`, `evermore`, `red` and `Speak Now` are all open.
- **Hook direction:** the contradiction, or the artifact. Not a date-stamp.
- **Yields first** to a major moment arriving off-reserve.

---

## Beat accounting — 13 uncovered beats, 13 slots

| Reservation | Strategy | Beats | Dates |
|---|---|---|---|
| Covered by queue (do not plan) | §2 one-per-platform-per-day cap | 1 | 10-26 |
| October thread make-good | §1(b) | 1 | 10-30 |
| November thread heroes | §1(b) | 2 | 11-02 (Decode), 11-06 (Clue Web) |
| Blank Spaces timeline | §1(c), permanent weekly minimum | 2 | 10-29, 11-04 |
| News reserves | §1(e2), ≥1 per calendar week | 3 | 10-28, 11-01, 11-07 |
| Mood | §1(d), monthly | 1 | 11-03 |
| Heartbeat (displaceable) | §1(e) | 4 | 10-27, 10-31, 11-05, 11-08 |
| Launch arc | §1(a) — **deferred to the 11-09 fortnight** | 0 | — |
| **Total** | | **14** | 14 days, 13 of them drafted by this plan |

**Displaceable-beat check (§1(e2), ≥2 per rolling 7 days), window by window.**
Displaceable beats are 10-27, 10-31, 11-03 (mood, rung 2), 11-05 and 11-08:

- 10-26→11-01: 10-27, 10-31 → **2** ✅
- 10-27→11-02: 10-27, 10-31 → **2** ✅
- 10-28→11-03: 10-31, 11-03 → **2** ✅
- 10-29→11-04: 10-31, 11-03 → **2** ✅
- 10-30→11-05: 10-31, 11-03, 11-05 → **3** ✅
- 10-31→11-06: 10-31, 11-03, 11-05 → **3** ✅
- 11-01→11-07: 11-03, 11-05 → **2** ✅
- 11-02→11-08: 11-03, 11-05, 11-08 → **3** ✅

**News landing days per calendar week** (reserve + displaceable, against the
≥3-moments floor): week of 10-26 = **4** (10-27, 10-28, 10-31, 11-01) · week of
11-02 = **4** (11-03, 11-05, 11-07, 11-08). ✅

**Where a major moment lands.** Nearest free heartbeat or mood beat, in §1(e2)'s
order, and the displaced beat slides to the next free day — except a
window-bound thread hero, which is never displaced and never slid. **The 10-30
Runway make-good is not displaceable**: it is October's last chance at a fifth
thread.

---

## Review — October 2026

**Scorecard, month over month.** October shipped **22 posts (11 IG + 11 X)**
against September's **20 (10 + 10)** — the first month-over-month increase since
August's 65, and it was bought back from two outages (a usage-limit dark stretch
10-12→10-14 and the `build-content` merge outage 10-16→10-25) rather than from a
higher cadence. Failed posts: **0** real delivery failures in the trailing week.
Follower movement over the last 7 days: IG +0, X −1, FB +0. Owner verdicts this
week: **4 ✅, 0 ✏️, 0 ❌** at a 5h 3m median — the approval channel is healthy and
the drafting is landing on first pass.

**Threads: 5 of 6 taught** (Decode 10-03, Clue Web 10-09, Taylor's Version
10-23, End Game queued 10-26, Runway's make-good 10-30). Blank Spaces' hero is
the one miss, named rather than buried; its lens still got taught twice through
the timeline beats. **Mood shipped for the first time ever** on 10-21.

**Top posts by reach, and what they had in common — with the caveat that
matters.** The three highest-reaching October IG posts are **tied at reach 2**:
the 10-16 Tate McRae shoutout (`heartbeat:event-news`), the 10-19 Fate of
Ophelia live debut (`news:`), and the 10-23 Speak Now TV thread hero
(`thread:taylors-version:single-best-item`). Eleven posts have insights on file
and **every one is at reach 0-2**, so this is not a ranking — it is noise with an
ordering. The one thing worth saying is that **two of the three are
news-driven**, and that is consistent with every month this account has
measured: real-world events are what people actually look at. It is a weak
signal held up by a strong prior, and I am reporting it as exactly that. No
saves, no shares and no comments were recorded on any October post.

**Double down: news.** The lane with the best evidence behind it was also the
lane that was mechanically impossible until today. Two of three top-reach posts
were news; the site covered 10 moments this week and social covered **0**, after
covering 1 of 15 the week before. Both binding constraints were fixed on
2026-10-26 — `event-dispatch.mjs` now scans 48h and promotes site-fronted
moments past its keyword test (#6313), and `tree-event-draft.md` step 5 now
displaces a beat instead of needing a vacant day. November's calendar gives the
lane **four landing days a week** and a reserve that always drafts something.
The measurement is already in the strategy: ≥3 moments reaching both platforms
inside 48h, reported every week as a number.

**Drop: the labelled on-platform experiment.** Experiment 01 closed at n = 2 and
unreadable, and no replacement is scheduled. At reach 0-2 the instrument cannot
resolve a caption lever, a format lever or a time lever — the arms came back
tied at reach 1. Spending one slot in four on an arm that returns an
unreadable number is a real cost in a 7-beat week with a news floor to hit. The
3-vs-3 comparison returns the first week trailing-7-day median IG reach is ≥10
(strategy §3). **This is a drop of the measurement, not of the format
variation** — formats still rotate; they are just not labelled, arm-assigned or
reported as if the difference were being measured.

**Rotation advanced into November** (`monthNumber` = 3,
`angle = ANGLES[(3 + threadIndex) % 5]`): Decode 11-01→05 `behind-the-data` ·
Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces
11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` ·
End Game 11-26→30 `behind-the-data`. November's Mood beat is `mood:era-match` on
11-03. The `launch:photo-viewer` arc opens the 11-09 fortnight.

**Straight answer on last month's open question — was the merge outage fixed?**
Yes. `moment-media-gate.mjs` downgraded the stale-allowlist error to a warning,
`build-content` went green on Tree PRs, and the 10-25 draft merged on its own.
The residue is seven stale draft PRs that `retire-stale-drafts.mjs` has not
closed, which is clutter rather than a blocker and is filed to Marjorie.

## Review — next due 2026-11-30

The next monthly review falls to the **last Tree run of November**. It owes: the
November scorecard against October's 22 posts, the first real reading of the news
floor (≥3 moments a week reaching both platforms inside 48h — this month's
number was 0 and 1, both under constraints now removed), whether the
`launch:photo-viewer` arc completed all four posts or closed short like the two
before it, and whether trailing-7-day median IG reach has moved off 0-2 at all.
If it has not, the honest next question is whether this account's reach problem
is a content problem or a distribution problem, because ten months of captions
at reach 0-2 is evidence about the latter.
