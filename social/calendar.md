# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-11-02 → 2026-11-15.**
Written by Tree's weekly run of 2026-11-02 (a Monday, on schedule). Not the last
run of the month, so no monthly review here — October's is in the previous
revision of this file and the next is due the last Tree run of November.

**No photo table in this calendar, by design (W8, 2026-09-30).** The daily
pre-compute (`scripts/social/prepare-draft-inputs.mjs`) hands each beat a
never-used, Instagram-sized photo from the full ledger. A hand-assigned table
cannot see drafts waiting in open PRs, which is how photos got repeated. Era is
named below **only** for a themed beat.

**No experiment arms. No `experiment` object on any item** (strategy §3, closed
in PR #6105). Every Instagram beat carries the mid-tail tag block as the
**default**. There is deliberately no replacement experiment this fortnight
either — see the ledger.

**Text-only X posts are BANNED** (owner, 2026-10-30; hard-gated by
`check-drafts.mjs`, PR #6433). Every beat below is one IG + X pair on ONE image.
No image, no post — pick a different subject or skip the slot.

---

## 🔴 THE CHANGE THIS FORTNIGHT — every mint line now carries its own campaign family and its own `utm_campaign`

**Two of last week's twelve posts were unmeasurable, and it was this file's
fault.** Strategy §1(e)'s own pillar table says the symbol-thread campaign is
`heartbeat:symbol-thread`. The week-of-10-26 calendar told the 10-27 beat to mint
`symbol-thread:<motif-slug>:2026-10-27` — dropping the `heartbeat:` family — so
the pair shipped under a family that does not exist, `weekly-scorecard.mjs`
emitted four `unrecognised campaign prefix` warnings, and the post landed in the
scorecard's `(unrecognized)` row with its traffic tagged `easter-eggs`. Same
defect was waiting on the 10-31 and 11-08 beats, which said `on-this-day:<slug>`
instead of `heartbeat:on-this-day:<slug>`.

**Fixed structurally, not by reminder.** Every beat below writes (a) the **full**
campaign value to mint, family prefix included, and (b) the **literal
`utm_campaign` value** to paste, on its own line. Rule 6a says there is nothing
to judge — take the campaign, cut at the first colon, paste — so this file now
does the cutting. The drafter reads a value, not a rule.

Rule 6a (strategy §1(e), added 2026-11-01 for ask
[#6521](https://github.com/JW-Incorporated/swift2/issues/6521)) still governs:
`utm_campaign` is the text before the first `:` in the item's own `campaign`,
copied verbatim — never the sub-format (`era-deep-cut`), never the subject
(`the-proposal`), never a neighbouring family. **No post has yet been drafted
under it:** the rule merged 2026-11-01 in PR #6524, after that day's draft PR
#6503 was already authored, so this fortnight is its first real test.

---

## 🟠 And the one editorial miss, for the second week running

**Sibling drift, 10-29.** Both halves of the Back to December pair opened on the
same clause — IG *"'back to december' is the one that gets me every time"*, X
*"'back to december' still wrecks me"*. Last week it was 10-24's pair opening on
the same date-stamp. Rule 3's 6-word gate passes both (words 3-6 differ) and
`crossPost.similarityThreshold` compares whole bodies, so a shared *opening
clause* is invisible to every gate we have. The owner approved both, so neither
is a lessons-ledger rule (T5 builds rules from ✏️/❌ rows only) — they are
direction written and not followed, twice.

**So the sibling rule is restated on every beat below, in the beat's own text:**
the **X half is written first, as its own post** — its own hook, its own shape —
and the IG caption is never its source. A pair that shares its first clause is
one post printed twice. A sibling-opener check in `check-drafts.mjs` is asked of
Marjorie this run; until it lands, this line is the only enforcement.

---

## Ledger

| State | Value |
|---|---|
| **⚫ Dark day, 10-28 — a run failure, not a planning rule** | The 10-28 news reserve shipped nothing on either platform. Cause: **two consecutive daily-draft run failures**, [10-27](https://github.com/JW-Incorporated/swift2/actions/runs/40540524433) and [10-28](https://github.com/JW-Incorporated/swift2/actions/runs/40732305282), both failing the `run / run-routine` job at *Decide routine outcome*. 10-27's beat shipped anyway (the 10-26 run had drafted it a day ahead); 10-28's had no such cover, because a reserve day's beat is never drafted a day early (§1(e2)). Its named fallback — the `1989` Seattle Symphony moment — was never drafted. **Last week's reserve-always-drafts-the-fallback fix (PR #6321) worked exactly as designed on 11-01; it cannot help on a day the run does not complete.** Filed to Marjorie as an error. |
| Cycle month | **2026-11** (`monthNumber` = 3), whole months since 2026-08. Unchanged across this whole window. |
| **November windows + angles** (`angle = ANGLES[(3 + threadIndex) % 5]`, recomputed this run, same result) | Decode 11-01→05 `behind-the-data` · Clue Web 11-06→10 `quiz-poll` · Runway 11-11→15 `origin-story` · Blank Spaces 11-16→20 `single-best-item` · Taylor's Version 11-21→25 `interactive-challenge` · End Game 11-26→30 `behind-the-data`. **Three fall inside this window** — Decode, Clue Web and Runway; the other three belong to later runs. |
| **Thread progress, November — 0 of 6 so far, 3 placed here** | Decode **11-02** (today), Clue Web **11-06**, Runway **11-12**. October closed **5 of 6** as projected (Decode 10-03, Clue Web 10-09, Taylor's Version 10-23, End Game 10-26, Runway's make-good 10-30); Blank Spaces' hero was the one miss and its lens was still taught twice through the timeline beats. **No make-good is owed in November** — October's one was spent on 10-30. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`** (strategy §1(d)). `?mood=` is not a thing and never was. |
| **🚀 Launch arc — PLACED, as promised** | `launch:photo-viewer` (the pinch-zoom viewer, [#831](https://github.com/JW-Incorporated/swift2/pull/831), live since 2026-07-18, never promoted). The 10-26 plan deferred it to "the 11-09 fortnight" and promised that run would place the whole arc with room. **This run places it: day 0 on 11-09, +2 on 11-11, +4 on 11-13**, with **day +8 on 11-17** handed explicitly to the 11-09 run. It has slipped twice; a third deferral would be a decision made by arithmetic rather than by judgment. The §1(a) displaceable-floor arithmetic that forced the first deferral is satisfied here — see the slack check below. **Day-0 gate, unchanged and hard (invariant 6):** open www.longlivets.com on a phone, pinch-zoom a photo on an item page, confirm it works. **If it does not render, do not draft day 0** — report it and the arc waits. |
| Launch backlog, in order behind it | photos + focal program (#762) → `launch:community-engine` (when it ships — #5864/#6100 are still schema and reader work, so invariant 6 forbids teasing it) → shoppable Runway looks → the rumor tier. `launch:shop-the-look` stays closed at 3 of 4; `launch:mood-chat` stays closed at 1 post. |
| New user-visible ships, 10-26 → 11-02 | **None that earn an arc.** 101 PRs merged. Nearest misses, all failing §1(a)'s "a fan could notice without being told" test: [#6476](https://github.com/JW-Incorporated/swift2/pull/6476) (embedded videos stop when scrolled out of view), [#6408](https://github.com/JW-Incorporated/swift2/pull/6408)/[#6474](https://github.com/JW-Incorporated/swift2/pull/6474) (a live theory without an image no longer shows), [#6463](https://github.com/JW-Incorporated/swift2/pull/6463) (WCAG contrast on the Red mode toggle), [#6430](https://github.com/JW-Incorporated/swift2/pull/6430) (iPhone-15 Track Guide bar). All four are correctness or a11y fixes to existing surfaces. The rest was merch-sync plan authoring, worker theory diagnostics, media-gate hardening, dependency bumps and bookkeeping. **So §1(a)'s fallback applies: take the next item off the push-worthy backlog** — which is `launch:photo-viewer`, above. |
| **Mood beat** | **November = `mood:era-match`, placed 11-03.** One slot, as in October. Rotating format per §1(d), off October's `mood:result` — and specifically the format whose 10-03 attempt was approved by the owner and then killed unposted by the 48h-from-approval clock, so 11-03 is its first real airing. October's beat **✅ SHIPPED 10-21** (`mood:result:romanticizing-a-tuesday`), the first Mood post this desk has ever landed, approved at critique total 22. No launch arc this month is about Mood, so the beat is not absorbed. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 11-02: **11-04**. Week of 11-09: **11-14**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01) → Fearless solo 2008 (10-22) → **Back to December / Lautner (10-29)**. Take the next two unposted chapters **in the lens's own order** off `/?lens=love-story`, name the chapter in each item's `why`, and verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — 3 in week 1, 2 in week 2** | **11-05 + 11-07 + 11-08** (week of 11-02 — placed 2026-11-01 for ask [#6520](https://github.com/JW-Incorporated/swift2/issues/6520) and kept by this run), **11-10 + 11-15** (week of 11-09). Each carries a named fallback on its own line, and **the fallback is ALWAYS drafted** (PR #6321) — a reserve beat is never left empty for a run that may not fire. Never drafted a day early. **Why week 2 carries two, not three:** §1(e2)'s three-reserve rule triggers off a *completed* week whose site-fronted moments went uncovered. The week of 11-02 is still running, so **the 11-09 run makes that call on real data** — if 11-02 → 11-08 again covers none, it raises week 2's reserves to three and the launch arc's day +8 moves rather than a reserve. Two is the standing ≥1 doubled, and the slack check below holds at ≥2 in every rolling window. |
| **📰 RE-DRAFT ask [#6520](https://github.com/JW-Incorporated/swift2/issues/6520) — PLACED, and one day later than asked, for a reason** | Marjorie asked for the two site-fronted moments the dispatcher skipped as "already covered" by 2026-11-04, **"as an extra pair, not in place of the day's beat."** An extra pair is unshippable: the poster ships **one item per platform per UTC day**, so a second pair on an already-assigned day is skipped by the cap, goes stale and retires to `social/failed/`. Both therefore take the two nearest reserve slots as their named fallbacks — **`patient-zero` on 11-05** (asked first, placed first) and **`brad-paisley` on 11-07** — one and three days past 11-04, and both ship this week. Each item's `why` cites `ask #6520`, which is the condition that retires this row. |
| **📰 Floor performance, week to 11-02** | **0 of 3, the third week running** — and this time the reason is not a missing mechanism. Zero news pairs shipped against **6** moments on the 11-02 new-on-site sheet, all `significance: "routine"`. Both reserves took their named `heartbeat:` fallbacks: 11-01's shipped (Richard Marx), 10-28's did not (the dark day above). The 10-26 fixes (#6313: 48h scan + site-fronted promotion) did land, and a **third** binding constraint was found and fixed *today* — [#6526](https://github.com/JW-Incorporated/swift2/issues/6526)/[PR #6527](https://github.com/JW-Incorporated/swift2/pull/6527): the "already covered" exclusion gate was a recall-tuned matcher firing on two common title words, so real moments were skipped as covered by unrelated posts. **This run's own sensor reports `considered: 0` and `uncovered: []`,** so nothing was dispatchable at plan time either. I am NOT redefining the floor to make the number green: 0 of 3 stands as a miss, named, for the third time. |
| 🧪 **Experiment — none this fortnight, deliberately** | Unchanged from 10-26 and for the same reason. Experiment 01 closed at n = 2, unreadable; every October IG post with insights on file is at **reach 0-2** (`social/metrics/posts/2026-10/`), and this week's trailing-7-day total reach across 12 posts was **3**. A one-impression instrument cannot resolve a caption, format or time lever. The comparison returns as a clean 3-vs-3 the first week trailing-7-day median IG reach is **≥10** (strategy §3). |
| Openers — **computed from the real posted bodies**, 10-20 → 11-01 | **22 distinct 6-word openers across 22 items — 22 of 22, a clean sweep** against the ≥12-per-14-days target ✅ (up from 13 of 14). **But the first-word tally is `the ×4, okay ×3, i ×2, twenty ×2, 'back ×2`**, and with `ok swifties` that is **4 of 22 posts opening on `okay`/`ok`** — a formula forming *underneath* a gate that only sees words 1-6 as a phrase. The 10-26 calendar put that shape off the menu in prose and it shipped twice anyway, so it is now a hard gate instead: `okay` and `ok` are added to `openers.bannedOpeners` in **[PR #6535](https://github.com/JW-Incorporated/swift2/pull/6535)** (which also enforces Rule 2's other 13 published openers, none of which were actually in the params file). **Off the menu this fortnight, on top of that gate:** any bare date-stamp or *"<n> years ago"* opener (spent on both halves of 10-24), *"the thing about <X> that still gets overlooked"*, and opening on a quoted song title (both halves of 10-29). |
| Media mix, last 14 days | **11 photo / 11 media-carrying = 100%**, target ≥70% ✅. Every IG post carried a real Taylor photograph. Zero era tiles, zero undeclared media, zero `site-screen` posts, zero text-only X posts. The gate is holding and the grid reads as a Taylor Swift fan page. |
| **Photo supply — comfortable for the first time** | **238 never-used photos** in the ledger and **no era exhausted** — every one of the 14 era buckets has a next pick (`1989`, `debut`, `evermore`, `fearless`, `folklore`, `lover`, `midnights`, `official-video`, `press-photo`, `red`, `reputation`, `site-photo`, `speak-now`, `tortured-poets`). That is a different world from the 54-photo library of five weeks ago. Growing it stays a standing priority (2026-10-01 amendment) and the rule is unchanged: **any beat whose era has no never-used photo left must say so in the draft PR body** — but no beat below is at risk this fortnight. |
| Fast lane | **0 drafted, 0 declined, 0 expired** this week (scoped by `createdAt` ≥ 2026-10-26, per the T6 note: drafted intents stay in `social/inbox/` with a `queueFiles` array; only declines and expiries move to `closed/`). `social/inbox/` holds **zero** open intents. Nothing stuck. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel, unmoved for a third week. The scorecard records **no Reddit prompts resolved this week** (0, after 0 last week and 3 the week before), and the awareness lane that feeds them is blocked on [#6089](https://github.com/JW-Incorporated/swift2/issues/6089) — unclaimed since 10-18, outside Austin's auto-build scope, waiting on a founder **"Plan approved"** comment that Marjorie's own plan already carries. See the L002 row in `social/lessons.md`. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked for again, and it is the same decision.** Trailing-7-day reach across 12 posts was 3 in total; a top-3-by-reach paste would rank noise. The ask returns the month trailing-7-day median IG reach clears §3's trigger (≥10). |
| Founder tasks | **None filed this week** — the third week with none, and deliberately. Per the 2026-10-09 amendment Tree asks the owner only for a true human-only blocker (money, a secret, a major strategy call). The one in flight is the "Plan approved" comment on #6089, and it is already carried in **Marjorie's** plan under *Needs the owner*; asking twice for the same click is how a lane gets ignored. Owner verdicts this week: **no drafts went to him** — since 2026-10-09 IG/X ship on Tree's own call, so an empty verdict column is the designed state, not a stall. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see — no brief comment, no issue, no PR comment. *(The Actions variables API returns `403 Resource not accessible by integration` to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze row and from 12 posts having shipped through `social-poster.yml` this week, which it refuses to do under a freeze.)* |
| Social event mode | **`normal`** — the `prepare` job's sensor returns `{"mode":"normal","kind":null,"id":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`. No countdown and no live theory, so **no beats are reserved for event coverage** and the 14 days below are ordinary rotation. *(The `prepare` job now hands this run the status in `.scratch/tree-inputs.json`, so last week's "needed `npx tsx` plus a manual install" problem is gone — not re-filed.)* |
| Lessons ledger | **Unchanged this week, and computed rather than eyeballed.** Zero `edit`/`reject` rows in `social/feedback/` for this week or last (no `2026-W44`/`W45` file exists; all of W43's rows are `approve`), so there is nothing to attribute — no new rules, no increments, and I am not inventing one to look busy. `findCodifiableRules` returns `[]` (`lessons.autoCodify` is `false`, and I am not codifying L002 by hand: its fix lives in `scripts/community/**`, outside this desk's rights, and is already tracked on #6089/#5878). `findRetirableRules` returns `[]` — L002 is **3 weeks quiet** against an 8-week window. |

---

## 2026-11-02 (Mon) — Decode thread hero (window 11-01→05) · Tree run day

- **`23:00Z`** · mint `campaign` = **`thread:hidden-clues:behind-the-data:2026-11-hero`**
- **`utm_campaign` = `thread`** — paste that literal value, nothing else (Rule 6a).
- **Link:** `/?lens=hidden-clues` with `?utm_source=<platform>&utm_medium=social&utm_campaign=thread`.
- **November's first thread hero.** `angle = ANGLES[(3 + 0) % 5]` = `behind-the-data`.
- **Angle `behind-the-data`:** the thread as a *dataset* — how many clues it
  tracks, how far back the earliest one goes, which era is densest, what the
  shape of it tells you. The number is the post; the lens is where you go to
  read the rows.
- **Subject direction:** count something real off the live lens before writing a
  word. Do not assert a count this file has not sourced — if the count cannot be
  verified, pick a different statistic that can.
- **Hook direction:** the number, or the contradiction. **Not** a date-stamp.
- **X half: written FIRST, as its own post** — its own hook, one idea plus the
  link. Never the IG caption truncated and never its opening clause re-used
  (10-24 and 10-29 both broke this).

## 2026-11-03 (Tue) — Mood beat, November (DISPLACEABLE, §1(e2) rung 2)

- **`23:00Z`** · mint `campaign` = **`mood:era-match:2026-11-03`**
- **`utm_campaign` = `mood`**.
- **Link:** **`/?mode=mood`** with the standard UTM tags. Never `?mood=` — it
  does not exist.
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
  why that landed — or the honest surprise. **Not** *"okay i tapped …"*: 10-21
  spent that exact opener, and as of PR #6535 `okay` is a hard-blocked opener.
- **X half: written FIRST, as its own post.** 10-21's pair did this well — IG
  told the story, X printed the five song titles as a list. Do that again in a
  new shape, not that shape.
- **Why here:** Mood shipped for the first time on 10-21 and the owner approved
  it at critique 22, the highest of the week. This month's beat goes early
  rather than late so a mechanical failure still leaves November time to retry.

## 2026-11-04 (Wed) — Blank Spaces timeline (week of 11-02 minimum)

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-04`**
- **`utm_campaign` = `timeline`** — **not** `thread`. Four `timeline:` items were
  tagged `thread` in the week to 11-01, which is a different family that exists,
  so they vanished into the "other" bucket (Rule 6a's evidence).
- **Link:** `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter in the lens's own order after
  **Back to December / Lautner (shipped 10-29)**. Name the chapter in `why`.
  **Confirmed public relationship history only** — verify every person, date,
  event and quote against the Vault before it reaches copy; rumor-stage
  relationship-existence claims, countdowns and speculation stay banned outright.
- **Media:** pre-compute pick. A Blank Spaces lens screenshot may ride IG slide 2
  only under the "cool feature only" rule, and never on X.
- **Hook direction:** the artifact (start with what the photograph is) or a real
  sourced quote. **Not** a date-stamp, **not** *"the next chapter in the blank
  spaces timeline…"* (10-22), and **not opening on a quoted song title** —
  10-29's pair opened on *'back to december'* on both halves.
- **X half: written FIRST, as its own post.**

## 2026-11-05 (Thu) — 📰 NEWS RESERVE #1 (week of 11-02) · **ask #6520 re-draft, first**

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*.
- **🔴 ALWAYS DRAFT SOMETHING HERE.** Check `events.uncovered[]`. A real,
  confirmed, sourced event dated inside the last 48h is drafted **here** as a
  pair, minted `news:<event-slug>` with `utm_campaign=news`, scored on the
  six-dimension rubric (`timely` ≥4 on its own, `total` ≥21). If there is not
  one, draft the fallback **exactly as written**. Never an empty beat (PR #6321).
- **Named fallback — ask [#6520](https://github.com/JW-Incorporated/swift2/issues/6520), the first of its two moments.**
  Mint `campaign` = **`heartbeat:era-deep-cut:patient-zero-three-weeks-at-no-1:2026-11-05`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-tloas-patient-zero-ends-its-three-week-hot-100-run-at-no-1-and-sli`.
  **Link** `/?item=vault-tloas-patient-zero-ends-its-three-week-hot-100-run-at-no-1-and-sli`.
- **Era note:** `the-life-of-a-showgirl`. Not used elsewhere in the week of 11-02.
- **Subject direction:** the chart run itself — three weeks at No. 1 on the Hot
  100, now sliding to No. 5. The numbers come from the moment record and the
  Vault, quoted exactly or not at all. A chart slide is not a sad story; it is
  what three weeks on top looks like on the way down.
- **Hook direction:** the number, or the contradiction. **Not** a date-stamp.
- **`why` must cite `ask #6520`** — that citation is what retires the RE-DRAFT
  row from the ledger above.
- **X half: written FIRST, as its own post.**

## 2026-11-06 (Fri) — Clue Web thread hero (window 11-06→10)

- **`23:00Z`** · mint `campaign` = **`thread:easter-eggs:quiz-poll:2026-11-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=easter-eggs`.
- `angle = ANGLES[(3 + 1) % 5]` = `quiz-poll`.
- **Angle `quiz-poll`:** one question whose answer is genuinely inside the Clue
  Web lens. X gets a real poll where the platform allows; IG asks the same
  question in prose and sends people to the lens to settle it. **Check the answer
  is actually in there before writing the question.**
- **Hook direction:** the challenge or the honest question. **Not** anything
  addressing *"the clowns 🤡"* — that shape is off the menu — **not** the
  `"the <thread name> has one theory…"` opener, and **not** *"ok swifties…"*
  (10-30's X half, and now a hard-blocked opener).
- **Note:** 10-27's snake beat also linked `/?lens=easter-eggs` and explained
  the reputation-snake motif. Ten days apart is clear of the stacking rule, but
  **quiz on something else** — do not re-quiz the motif that post already
  explained.
- **X half: written FIRST, as its own post** — and if it is a real poll, that is
  structurally different by construction, which is the point.

## 2026-11-07 (Sat) — 📰 NEWS RESERVE #2 (week of 11-02) · **ask #6520 re-draft, second**

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule as 11-05: a real
  uncovered 48h event is drafted here, otherwise the fallback exactly as
  written. Never an empty beat.**
- **Named fallback — ask [#6520](https://github.com/JW-Incorporated/swift2/issues/6520), the second of its two moments.**
  Mint `campaign` = **`heartbeat:era-deep-cut:brad-paisley-songwriters-hall:2026-11-07`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-tloas-brad-paisley-inducts-her-into-the-nashville-songwriters-hall`.
  **Link** `/?item=vault-tloas-brad-paisley-inducts-her-into-the-nashville-songwriters-hall`.
- **Era note:** `debut` — the Nashville songwriting rooms are where this one
  belongs, and no other beat in the week of 11-02 uses that era.
- **Subject direction:** Brad Paisley inducting her into the Nashville
  Songwriters Hall of Fame. An elder of the room she started in saying she
  belongs in it — that is the story, and it is an *award*, which §1(e2) counts
  as major. Quote him exactly or not at all; do not characterise what he meant.
- **Hook direction:** the real quote, attributed after. 10-16's Tate McRae pair
  used that shape and was the best-reaching post of its week (reach 2, tied —
  a weak signal, stated as one), and 11-01's Richard Marx pair used it too. So
  use it, and **do not** reuse 11-01's outsider-with-regrets framing; this is
  the opposite sentiment.
- **`why` must cite `ask #6520`.**
- **X half: written FIRST, as its own post.**

## 2026-11-08 (Sun) — 📰 NEWS RESERVE #3 (week of 11-02)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule. Never an empty
  beat.**
- **Why a third reserve:** §1(e2)'s three-reserve rule, placed 2026-11-01 for
  ask #6520 after the week to 11-01 shipped 0 news pairs against 27
  site-covered moments. A reserve is a day the 11:00Z run drafts news into on
  its own, with no second workflow in the path.
- **Named fallback.** Mint `campaign` =
  **`heartbeat:era-deep-cut:nelly-houston-just-a-dream:2026-11-08`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-speak-now-nelly-surprises-houston-for-just-a-dream-and-he-revealed-15-`.
  **Link** `/?item=vault-speak-now-nelly-surprises-houston-for-just-a-dream-and-he-revealed-15-`.
- **Era note:** `speak-now`. Not used elsewhere in the week of 11-02.
- **Subject direction:** Nelly surprising Houston for "Just a Dream" — and the
  detail he revealed fifteen years later, that he left with $50,000 in a
  McDonald's bag. **The money is the hook and the surprise is the setup.** Both
  halves of that come from the moment record and the Vault; quote him exactly or
  not at all, and do not embellish the bag.
- **Hook direction:** the number, or the real quote. **Not** a date-stamp.
- **X half: written FIRST, as its own post** — this subject has two separate
  surprises in it, which makes genuinely different halves easy.

## 2026-11-09 (Mon) — 🚀 `launch:photo-viewer` **DAY 0** · Tree run day

- **`23:00Z`** · mint `campaign` = **`launch:photo-viewer:day0:2026-11-09`**
- **`utm_campaign` = `launch`**.
- **Link:** an `/?item=` deep link to an item page that actually carries a photo
  worth zooming — the surface being shown, per §1(a).
- **🔴 DAY-0 GATE, HARD (invariant 6).** Before drafting a word: open
  www.longlivets.com **on a phone**, go to an item page with a photo, and
  pinch-zoom it. **If it does not work, do not draft day 0** — say so in the PR
  body, leave the beat for a `heartbeat:era-deep-cut` on `reputation` (an era
  untouched this fortnight), and the arc waits for the 11-09 run. Never tease
  unshipped or broken work.
- **Angle, day 0 — what it is and why it's good.** The viewer has been live
  since 2026-07-18 and has never been mentioned once. Lead with the thing a fan
  can do that they could not do before: get close enough to a photograph to read
  the details. Do not call it a launch, do not say "we're excited to announce" —
  it has been there for months and the honest framing is "you may not know this
  is here."
- **Media:** this is a product surface, so a `/social/library/` screenshot
  **earns IG slide 2** behind the Taylor photo tile — but only if it shows a real
  zoomed photo in actual use ("cool feature only", Joey 2026-09-01), never a flat
  page. **X takes the photo, never the screenshot** (permanently prohibited).
- **Hook direction:** direct address, or the artifact. **Not** a date-stamp.
- **Not displaceable** (§1(e2): news never displaces a launch arc's day 0/+2/+4).
- **X half: written FIRST, as its own post.**

## 2026-11-10 (Tue) — 📰 NEWS RESERVE #1 (week of 11-09)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule. Never an empty
  beat.**
- **Named fallback.** Mint `campaign` =
  **`heartbeat:era-deep-cut:millionaire-wood-question:2026-11-10`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-tloas-colin-jost-and-michael-che-nearly-get-stuck-on-wood-on-milli`.
  **Link** `/?item=vault-tloas-colin-jost-and-michael-che-nearly-get-stuck-on-wood-on-milli`.
- **Era note:** `the-life-of-a-showgirl`. Not used elsewhere in the week of 11-09.
- **Subject direction:** Colin Jost and Michael Che nearly getting stuck on
  "Wood" on *Millionaire*. It is funny and it is light, and every one of the 22
  items posted 10-20 → 11-01 was earnest — **let this one be funny.** The joke is
  theirs, not ours. Quote them exactly or not at all.
- **Hook direction:** the honest question (the one they were asked), or the
  contradiction. **Not** a date-stamp.
- **X half: written FIRST, as its own post** — a question-shaped subject is the
  easiest place in the fortnight to make the two halves genuinely different.

## 2026-11-11 (Wed) — 🚀 `launch:photo-viewer` **DAY +2**

- **`23:00Z`** · mint `campaign` = **`launch:photo-viewer:day2:2026-11-11`**
- **`utm_campaign` = `launch`**.
- **Link:** a *different* `/?item=` page from day 0's.
- **Angle, +2 — the detail you can only see zoomed in.** Day 0 says the feature
  exists; +2 proves it is worth using. Pick ONE photograph in the corpus with a
  detail that genuinely rewards zooming — something in the background, on a
  costume, in the crowd — and make the post about **that detail**, not about the
  viewer. Verify whatever you claim is in the frame by looking at the file.
- **Media:** the photograph itself, full stop. A screenshot here would be showing
  the frame instead of the picture.
- **Hook direction:** the artifact, or direct address. **Not** a date-stamp, and
  **not** the shape day 0 used.
- **Not displaceable.**
- **Gate:** if day 0 did not ship (its gate failed), **this beat does not ship
  either** — fall back to `heartbeat:era-deep-cut` on `reputation` and say so.
- **X half: written FIRST, as its own post.**

## 2026-11-12 (Thu) — Runway thread hero (window 11-11→15)

- **`23:00Z`** · mint `campaign` = **`thread:fashion:origin-story:2026-11-hero`**
- **`utm_campaign` = `thread`**.
- **Link:** `/?lens=fashion`.
- `angle = ANGLES[(3 + 2) % 5]` = `origin-story`.
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
- **Hook direction:** direct address or the honest question. **Not** a
  date-stamp, and **not** *"a little fashion detective moment for you"* (10-30).
- **Not displaceable** (window-bound thread hero; never displaced, never slid).
- **X half: written FIRST, as its own post.**

## 2026-11-13 (Fri) — 🚀 `launch:photo-viewer` **DAY +4**

- **`23:00Z`** · mint `campaign` = **`launch:photo-viewer:day4:2026-11-13`**
- **`utm_campaign` = `launch`**.
- **Link:** a third, different `/?item=` page.
- **Angle, +4 — the invitation.** Days 0 and +2 showed it and proved it; +4 asks
  for something back. Name a specific photo and ask what people find in it when
  they get close. **A real question we would actually like answered** — not
  engagement bait, not "double tap if".
- **Media:** the photograph the question is about.
- **Hook direction:** the honest question, or the challenge. **Not** a
  date-stamp, and not either shape the first two arc posts used.
- **Not displaceable.**
- **Gate:** if day 0 did not ship, this beat does not ship either — fall back to
  `heartbeat:era-deep-cut` on `reputation` and say so.
- **Day +8 is 2026-11-17, and it belongs to the 11-09 run** — outside this
  window. It is the arc's close (what people found, or the one surface the
  viewer makes best), and `launch:shop-the-look` and `launch:mood-chat` both
  closed short, so **say in that run's PR body whether this one completed.**
- **X half: written FIRST, as its own post.**

## 2026-11-14 (Sat) — Blank Spaces timeline (week of 11-09 minimum)

- **`23:00Z`** · mint `campaign` = **`timeline:love-story:<chapter-slug>:2026-11-14`**
- **`utm_campaign` = `timeline`** — **not** `thread`.
- **Link:** `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter after 11-04's. Same sourcing
  bar: confirmed-only, verified against the Vault, chapter named in `why`.
- **Hook direction:** a different shape from 11-04's. Direct address or the
  honest question. **Not** a date-stamp, not 11-04's shape, and **not opening on
  a quoted song title.**
- **X half: written FIRST, as its own post.**

## 2026-11-15 (Sun) — 📰 NEWS RESERVE #2 (week of 11-09)

- **`23:00Z` · `news:<event-slug>`** *(utm_campaign `news`)*, **or the named
  fallback below** *(utm_campaign `heartbeat`)*. **Same rule. Never an empty
  beat.**
- **Named fallback.** Mint `campaign` =
  **`heartbeat:era-deep-cut:abigail-toy-story-screening:2026-11-15`**,
  `utm_campaign` = **`heartbeat`**, built on the new-on-site moment
  `vault-tloas-at-a-toy-story-5-screening-taylor-tells-the-room-about-abiga`.
  **Link** `/?item=vault-tloas-at-a-toy-story-5-screening-taylor-tells-the-room-about-abiga`.
- **⚠️ That moment's own site media is a VIDEO and this pipeline cannot post
  video** (invariant 5). The *moment* is postable; its media is not. Use the
  beat's pre-compute photo pick and **do not** reference "watch the clip" in the
  caption — link to the item page, where the video actually lives.
- **Era note:** `fearless`. Not used elsewhere in the week of 11-09.
- **Subject direction:** Taylor telling a room at a *Toy Story 5* screening about
  Abigail — a friendship that has outlasted every era in the catalogue and is the
  one "Fifteen" is about. Quote her exactly or not at all. **Abigail is a private
  individual**: this is warm, confirmed, on-the-record and about the friendship
  as Taylor herself framed it in public. Nothing about her private life.
- **Hook direction:** the real quote, or direct address. **Not** a date-stamp.
- **X half: written FIRST, as its own post.**

---

## Beat accounting — 14 beats, 14 days

| Reservation | Strategy | Beats | Dates |
|---|---|---|---|
| November thread heroes | §1(b), one per window | 3 | 11-02 (Decode), 11-06 (Clue Web), 11-12 (Runway) |
| Blank Spaces timeline | §1(c), permanent weekly minimum | 2 | 11-04, 11-14 |
| News reserves | §1(e2) — **3** in the week of 11-02 (ask #6520), **2** in the week of 11-09 | 5 | 11-05, 11-07, 11-08, 11-10, 11-15 |
| Mood | §1(d), monthly | 1 | 11-03 |
| Launch arc | §1(a) — `launch:photo-viewer`, day 0 / +2 / +4 | 3 | 11-09, 11-11, 11-13 |
| Heartbeat (displaceable) | §1(e) | 0 | — (every reserve's fallback *is* a heartbeat subject) |
| **Total** | | **14** | 14 days, all 14 drafted by this plan |

**Covered by queue:** none. `social/queue/` is **empty** at plan time, so no date
below is pre-committed and every beat is genuinely uncovered.

**Landing-slack check (§1(e2), ≥2 per rolling 7 days), window by window.** Slack
is a **reserve day (`R`)** or a displaceable beat. Reserves: 11-05, 11-07, 11-08,
11-10, 11-15. Displaceable beats: 11-03 (mood, rung 2) — the launch arc's three
days, the three thread heroes and the two timeline minimums are all protected, so
the mood beat is the only non-reserve slack. A reserve counts, and counts
*better*: swapping a reserve's named subject for an arriving moment costs
nothing, while a displaceable beat only yields if a run fires to displace it.

- 11-02→11-08: 11-03, 11-05`R`, 11-07`R`, 11-08`R` → **4** ✅
- 11-03→11-09: 11-03, 11-05`R`, 11-07`R`, 11-08`R` → **4** ✅
- 11-04→11-10: 11-05`R`, 11-07`R`, 11-08`R`, 11-10`R` → **4** ✅
- 11-05→11-11: 11-05`R`, 11-07`R`, 11-08`R`, 11-10`R` → **4** ✅
- 11-06→11-12: 11-07`R`, 11-08`R`, 11-10`R` → **3** ✅
- 11-07→11-13: 11-07`R`, 11-08`R`, 11-10`R` → **3** ✅
- 11-08→11-14: 11-08`R`, 11-10`R` → **2** ✅
- 11-09→11-15: 11-10`R`, 11-15`R` → **2** ✅

**This is the arithmetic that deferred the arc on 10-26, run again and passing.**
The 10-26 plan found that an arc taking three beats left one displaceable beat
against a floor of two. It clears here because §1(e2) was amended on 11-01 to
count a reserve as slack *ahead of* a displaceable beat, and this fortnight
carries five reserves. The two tightest windows (11-08→11-14 and 11-09→11-15) sit
exactly on the floor at 2 — so **if the 11-09 run raises week 2 to three reserves
on real data, the beat it converts must come from the arc's day +8 or the 11-14
timeline sliding, never from dropping below 2.**

**News landing days per calendar week, against the ≥3-moments floor:** week of
11-02 = **3 reserves** (11-05, 11-07, 11-08), each a day the 11:00Z run drafts
news into with no second workflow in the path; week of 11-09 = **2 reserves**
(11-10, 11-15), with the third-reserve call handed to the 11-09 run on completed
data. ✅

**Where a major moment lands.** Nearest free reserve first, then the mood beat
(§1(e2)'s yield order), and the displaced beat slides to the next free day —
except a window-bound thread hero (never displaced, never slid) and the launch
arc's day 0/+2/+4 (never displaced). A major moment arriving when nothing is
free takes the nearest beat and that beat is **dropped rather than slid**,
recorded in the item's `why`: a major moment posted two days late is not news.

---

## Review — next due 2026-11-30

The next monthly review falls to the **last Tree run of November**. It owes: the
November scorecard against October's 22 posts; the first real reading of the news
floor (≥3 moments a week reaching both platforms inside 48h — October's weeks
were 0, 1 and 0, and the third binding constraint was only fixed 2026-11-02, so
November is the first month the number means anything); whether the
`launch:photo-viewer` arc completed all four posts or closed short like the two
before it; whether Rule 6a actually held once posts were drafted under it; and
whether trailing-7-day median IG reach has moved off 0-2 at all. If it has not,
the honest next question is whether this account's reach problem is a content
problem or a distribution problem, because ten months of captions at reach 0-2 is
evidence about the latter.
