# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by
Tree's daily draft run** (`docs/agents/runner-prompts/tree-daily-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-10-19 → 2026-11-01.**
Written by Tree's weekly run of 2026-10-19 (a Monday, on schedule).

**No photo table in this calendar, by design (W8, 2026-09-30).** The daily
pre-compute (`scripts/social/prepare-draft-inputs.mjs`) hands each beat a
never-used, Instagram-sized photo from the full ledger. A hand-assigned table
cannot see drafts waiting in open PRs, which is how photos got repeated. Era is
named below **only** for a themed beat.

**Experiment 01 is closed and there are no arms any more** (strategy §3,
changed this run in PR #6105). Every Instagram beat carries the mid-tail tag
block as the **default** — no `experiment` object, no TAGGED/CONTROL line, no
per-beat bookkeeping. Do not write an arm into an item.

---

## 🔴 THE CHANGE THIS FORTNIGHT — the drafting works now; the merging doesn't

**Tree's own autonomy path is proven.** Today's 08:14Z run drafted a pair,
dispatched `social-tree-approve.yml`, and both items are sitting on `main`
carrying a valid `approval.v: 4` `tree:auto` stamp
(`social/queue/2026-10-19-fate-of-ophelia-live-debut-*.json`,
`social/queue/2026-10-20-lover-first-album-owned-*.json`). No founder ✅ was
needed or used. That is the 2026-10-09 decision working end to end for the
first time.

**But four days of drafts are stranded on a red CI gate that has nothing to do
with social.** `build-content` fails on every Tree PR with one error:

> `scripts/lib/moment-media-gate.mjs: SURFACE_MEDIA_LEGACY lists "social/inbox/appearance-2026-10-12-FqbcAAKQjes.json", which matches no gated row — delete the entry`

That one stale allowlist line is red on PR
[#5998](https://github.com/JW-Incorporated/swift2/pull/5998) (10-16, the Runway
hero), [#6027](https://github.com/JW-Incorporated/swift2/pull/6027) (10-17) and
on **both** inbox-expiry PRs,
[#6057](https://github.com/JW-Incorporated/swift2/pull/6057) and
[#6094](https://github.com/JW-Incorporated/swift2/pull/6094) — so the fast lane
cannot even clear its own expired intents. A separate failure,
`check-drafts`, holds [#6056](https://github.com/JW-Incorporated/swift2/pull/6056)
(10-18, the Blank Spaces hero — **founder-approved** in Discord on 10-18 and
still unshipped), and [#5443](https://github.com/JW-Incorporated/swift2/pull/5443)
/ [#5495](https://github.com/JW-Incorporated/swift2/pull/5495) are now 9-10 days
stale and should have been retired by `retire-stale-drafts.mjs`.

**What it cost:** nothing posted between 10-15 and 10-19 — four more dark days
on top of the 10-12→10-14 usage-limit outage — two thread heroes written and
never shipped, and two fast-lane intents open 5 and 6 days past their own
deadlines. Filed to Marjorie as an error this run. **It is not a planning
failure and no better calendar fixes it**, which is why this plan's thread
accounting treats both heroes as delivered-but-blocked rather than dropped
(strategy §1(b), changed this run in PR #6105).

---

## 🟢 Two things that got fixed

1. **This plan PR will auto-merge.** `social/calendar.brief.json` is in
   `.github/content-automerge-allowlist.txt` (line 155) since
   [#6030](https://github.com/JW-Incorporated/swift2/pull/6030) landed. Flagged
   on two consecutive plan PRs, and it was how the 10-05 plan died unmerged. It
   is closed.
2. **The approval stamp works unattended** (above). The 48h-from-approval clock
   is now the binding constraint on a draft, not a human.

---

## Ledger

| State | Value |
|---|---|
| **⚫ Merge outage, 10-16 → now** | `build-content` red on every Tree PR from one stale `SURFACE_MEDIA_LEGACY` entry in `scripts/lib/moment-media-gate.mjs`; `check-drafts` red on #6056. Six Tree PRs open and unmergeable (#5443, #5495, #5894, #5998, #6027, #6056) plus two inbox-expiry PRs (#6057, #6094). Reported to Marjorie as an error — scripts are outside this desk's mutation rights. |
| Cycle month | **2026-10** (`monthNumber` = 2) through 10-31. November (`monthNumber` = 3) starts inside this window on 11-01, but no November thread beat is placed here — the 10-26 run computes and places them. |
| **October windows + angles** (`angle = ANGLES[(2 + threadIndex) % 5]`) | Decode 10-01→05 `interactive-challenge` · Clue Web 10-06→10 `behind-the-data` · Runway 10-11→15 `quiz-poll` · Blank Spaces 10-16→20 `origin-story` · Taylor's Version 10-21→25 `single-best-item` · End Game 10-26→30 `interactive-challenge` |
| **Thread progress, October** | Decode **✅ shipped 10-03**. Clue Web **✅ shipped 10-09**. Runway **written (PR #5998), blocked red**. Blank Spaces **written and founder-approved (PR #6056), blocked red**. Taylor's Version placed 10-23, End Game placed 10-26. Runway takes October's **one make-good** on 10-30 (strategy §1(b), new this run); **Blank Spaces' hero is dropped** — the rule allows one make-good a month, and the love-story lens is already the most-covered thing in this plan (timeline beats 10-22 and 10-29). October therefore lands **5 of 6 threads taught**, and the one miss is named rather than buried. |
| Lens IDs (`packages/experience/src/lenses.ts`) | Decode `hidden-clues` · Clue Web `easter-eggs` · Runway `fashion` · Blank Spaces `love-story` · Taylor's Version `taylors-version` · End Game `the-proposal` |
| Mode deep links (`packages/experience/src/deepLink.ts`) | `threads` · `mood` · `clownbot` · `community` · `merch`. **Mood lands on `/?mode=mood`** (strategy §1(d)). `?mood=` is not a thing and never was. |
| **Launch arc — `launch:photo-viewer`, day 0 placed 11-01** | The backlog's next item that is actually **live**: the pinch-zoom photo viewer ([#831](https://github.com/JW-Incorporated/swift2/pull/831), merged 2026-07-18, never promoted in three months). `launch:community-engine` **steps back behind it** — #5864 and #6100 are schema and reader work, i.e. it is still being built, and invariant 6 forbids teasing it. Day 0 draws a `launch:` prefix, so IG may legitimately ride a `/social/library/` screenshot on slide 2 (strategy-params `siteScreen.allowedCampaignPrefixes`). **Day 0 does not draft until a drafter has opened www.longlivets.com, pinch-zoomed a photo and seen it work** — invariant 6's gate, unchanged; if it does not render, draft the named fallback instead and say so. +2 / +4 / +8 belong to the 10-26 run. |
| Launch backlog, in order behind it | photos + focal program (#762) → `launch:community-engine` (when it ships) → the rumor tier. `launch:shop-the-look` stays closed at 3 of 4; `launch:mood-chat` stays closed at 1 post. |
| New user-visible ships, 10-15 → 10-19 | **None that earn an arc.** ~90 PRs merged; the user-visible-adjacent ones were fixes and off-by-default infrastructure (#6097/#6077/#6017 image-dedupe and photo gates, #6032 Mood Chat key handling, the Tidewatch P2 series all flag-off, #6046/#6051/#6100 community reply tooling that only the owner's Discord sees). §1(a)'s test — could a fan notice without being told — fails for all of them. |
| Mood beat | **October = `mood:result`, placed 10-21. Mood has still never shipped a single post.** Both prior attempts died mechanically: the 10-03 pair was founder-approved and retired by the 48h-from-approval clock; October's slot is its third attempt. One slot, not two — a lane that has never landed earns its second by landing the first. |
| **Blank Spaces timeline — permanent weekly minimum** | Week of 10-19: **10-22**. Week of 10-26: **10-29**. Chapters shipped: early solo years (09-17) → Harry Styles (09-21) → Joe Jonas 2008 (10-01). Take the next two unposted chapters **in the lens's own order** off `/?lens=love-story`, name the chapter in each item's `why`, and verify every person, date and quote against the Vault first. Confirmed-only; no rumor-stage relationship claim, ever. |
| **📰 News reserves — ≥1 per calendar week** | **10-25** (week of 10-19) and **10-28** (week of 10-26), each with a named fallback on its own line. A reserve is an assigned slot with two possible subjects, never a gap: uncovered event in `events.uncovered[]` → leave the beat for the event run; nothing uncovered → draft the named fallback as written. Never drafted a day early. |
| **📰 Major moments ship same-day** (§1(e2), 2026-10-18) | Ceiling ≤3 news posts per rolling 7 days, ≤2 of them ordinary. **Week of 10-19 has already spent one major** — the Fate of Ophelia live debut, queued for tonight. This plan keeps §1(e2)'s **≥2 displaceable beats in every rolling 7 days**: 10-21 + 10-24 + 10-27 in the first window, 10-27 + 10-31 in the 10-25→10-31 window, 10-27 + 10-31 in the last. Checked window by window, not asserted. |
| 🧪 **Experiment 01 — CLOSED, n = 2, unreadable** | Two pairs where five were asked for (tagged 10-09, control 10-02), **both at IG reach 1**; all five October IG posts with insights on file are at reach 0-1 (`social/metrics/posts/2026-10/`). Reach ≤1 has no resolution to measure a caption lever. The tag block is now the **default** on every IG beat, arms are gone, and the comparison returns as a clean 3-vs-3 the first week trailing-7-day median IG reach is **≥10** (strategy §3, PR #6105). **No replacement experiment this fortnight, deliberately** — nothing on-platform is measurable through a one-impression instrument. |
| Openers — burned in the last 14 days, **do not reuse verbatim or near** | 10 distinct patterns across 10 posts and queued items (10-09 → 10-20), against a ≥12-per-14-days target; the denominator is 10, not the copy. Burned: *"the clue web has one theory…"* · *"gut-check for the clowns 🤡…"* · *"they spent a whole year asking…"* · *"speak now's 1,047,000-copy week…"* · *"okay this is the sweetest thing…"* · *"turns out taylor's home rotation is…"* · *"she FINALLY played it live 😭"* · *"over a year of waiting to hear it…"* · *"no label fight. no asterisk. just hers."* · *"the thing about Lover that still gets overlooked…"*. **Off the menu this fortnight:** the `"the <thread name> …"` opener, anything addressing *"the clowns 🤡"*, and *"the thing about <X> that still gets overlooked"* — the queued 10-20 X half just spent that shape. |
| Media mix, last 14 days | **6 photo / 6 media-carrying = 100%**, target ≥70% ✅. 3 of 3 IG posts carried a real Taylor photo ✅. Zero era tiles, zero undeclared media. The gate is holding; the grid reads as a Taylor Swift fan page. |
| **Photo supply** | Library **201** entries, **182 never-used**, `concert-photo-sourcing` **green 5 runs running** (last 2026-10-19 15:50Z). But the total has not moved off 201 in four days — green runs landing **zero new photos**, against strategy §2's ≥50-never-used-per-week intake floor. 182 never-used is ~26 weeks of cover at 7 posts a week, so this is a trend to watch, not a blocker. No era exhausted. |
| **The week's one "failure" did not happen** | The scorecard reports 1 failed post. It is `2026-10-11-speaknow-million-week-ig.json`, which **shipped** — `postedAt 2026-10-11T23:26:07Z`, Instagram id `18107359273946758` in `social/posted/` — and whose identical copy was then retired into `social/failed/` on 10-15 for being "unposted more than 48h after approval". The queue copy outlived the post, so the sweeper failed an item that had already gone out. Real delivery failures this week: **zero**. Reported to Marjorie as an error; until it is fixed, read the failed count with this in mind. |
| Fast lane | **0 drafted, 0 declined, 0 expired** this week. Two intents are open past their own deadlines — `appearance-2026-10-12-FqbcAAKQjes` (deadline 10-14) and `merch-2026-10-10-patient-zero-piano-version…` (deadline 10-13) — and the PRs that would expire them (#6057, #6094) are the ones held red by the `build-content` gate above. Not a drafting miss; the same single error. |
| Reddit non-promo contributions | **0 / 20** through the `founder-task` channel; **3 Reddit replies completed this week** through the Discord queue (scorecard `redditRepliesDone`, median answer 1h 14m). The counter still tracks the channel nobody uses. Until the threshold is genuinely met and modmail-checked, **every Reddit task stays a zero-link contribution** (growth-plan §7). |
| IG Insights | **Not asked for this month, and that is a decision.** Insights' whole job was to tell us which format earns shares — but every October IG post is at reach 0-1, so a top-3-by-reach paste would rank noise. The ask returns the month trailing-7-day median IG reach clears the §3 trigger (≥10). Five consecutive weeks of founder tasks went unticked; spending the sixth on a number that cannot inform anything is how the whole lane gets ignored. |
| Founder tasks | **None filed this week.** Per the 2026-10-09 amendment Tree asks the owner only for a true human-only blocker (money, a secret, a major strategy call) and there is none: the week's one real blocker is a one-line script fix, which goes to Marjorie. The owner answered 3 Reddit prompts and 6 draft verdicts in Discord this week at a 23-minute median — that channel works; the issue channel does not. |
| Crisis stop | **Not active.** No founder "stop posting" outstanding anywhere Tree can see. *(The Actions variables API returns 403 to this runner's token, so `SOCIAL_FREEZE` could not be read directly; inferred from `docs/ops/switch-ledger.md` carrying no freeze entry — its only row is `COMMUNITY_SCAN_ENABLED` on 10-18 — and from `social-tree-approve.yml` having stamped a pair at 08:14Z today, which it refuses to do under a freeze.)* |
| Social event mode | **`normal`** — `scripts/social/event-status.mjs` returns `{"mode":"normal","kind":null,"windingDown":false,"blendTier":null,"reservedBeats":0}`, matching `social/state/event-status.json` as written by the credentialed 4h workflow (this session has no Supabase keys, so the cached file is the real cross-check). No countdown or live theory, so **no beats are reserved** and the 14 days below are ordinary rotation. *(It still only runs under `tsx`; a bare `node` invocation fails on a clean checkout.)* |

---

## 2026-10-19 (Mon) — ⚫ COVERED BY QUEUE · Tree run day

`social/queue/2026-10-19-fate-of-ophelia-live-debut-{ig,x}.json`, campaign
`news:fate-of-ophelia-live-debut-2026-10-17`, scheduled `23:00Z`, stamped
`tree:auto` v4. **Plan nothing here and draft nothing here** — a second pair for
today would be skipped by the one-per-platform-per-day cap, go stale and retire
to `social/failed/`. This is the week's one major news pair (§1(e2)).

## 2026-10-20 (Tue) — ⚫ COVERED BY QUEUE

`social/queue/2026-10-20-lover-first-album-owned-{ig,x}.json`, campaign
`heartbeat:era-deep-cut:lover-first-album-owned:2026-10-18`, scheduled `23:00Z`,
stamped `tree:auto` v4. Same rule: nothing new here. (This is the 10-18 news
reserve's fallback, re-booked onto its own day by today's run — correct
behaviour, recorded here so the accounting below matches what ships.)

## 2026-10-21 (Wed) — Mood beat (October's one slot, third attempt)

- **`23:00Z` · `mood:result`** — mint `mood:result:2026-10-21`. Link
  **`/?mode=mood`** with the standard UTM tags. Never `?mood=`.
- **Format `mood:result` — "what it gave me", the strongest Mood format,**
  because it proves the thing works: one starter chip in the caption, a Taylor
  photo from the era those songs come from as the tile, the **real** returned
  songs as IG slide 2.
- **Hard constraints:** quote the starter chip **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` — approved copy, never reworded.
  **Pick a chip whose real results come from scored eras.** evermore, Midnights,
  TTPD and TLOAS are not scored: never promise "every song" and never name those
  eras as Mood results. Run the chip against the live feature and screenshot
  what it actually returned before writing a word of the caption.
- **Hook direction:** the artifact — start with what came back — or the honest
  question. Not a date-stamp.
- **Why here:** Mood has never shipped once in this desk's existence, and both
  failures were mechanical rather than editorial. It is the most distinctive
  thing on the site and it is the first beat this plan can actually reach.

## 2026-10-22 (Thu) — Blank Spaces timeline (week of 10-19 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-10-22`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter in the lens's own order after
  Joe Jonas 2008. Name the chapter in `why`. **Confirmed public relationship
  history only** — verify every person, date, event and quote against the Vault
  before it reaches copy; rumor-stage relationship-existence claims, countdowns
  and speculation stay banned outright.
- **Media:** pre-compute pick, era-relevant where the pick allows. A Blank
  Spaces lens screenshot may ride IG slide 2 only under the "cool feature only"
  rule.
- **Hook direction:** the artifact (start with what the photograph is) or a real
  sourced quote. **Not** a bare date-stamp and **not** *"every love story has
  a…"* — both burned.

## 2026-10-23 (Fri) — Taylor's Version thread hero (window 10-21→25)

- **`23:00Z` · `thread:taylors-version:single-best-item`** — mint
  `thread:taylors-version:single-best-item:2026-10-hero`. Link
  `/?lens=taylors-version`.
- **Angle `single-best-item`:** one item from the thread, told whole. The thread
  is the byline, not the subject — the post is about the thing, and the lens is
  where you go to find more of them.
- **Subject direction:** pick the item in that lens with the most specific,
  least-told story — the one a casual fan would not already know. Verify it
  against the Vault; assert no date or credit this file has not sourced.
- **Media:** pre-compute pick. The thread page is a product surface, so a
  `/social/library/` screenshot of it earns IG slide 2 **only** if it shows the
  lens in rich actual use. X never takes a site screenshot.
- **X half:** written first, as its own post — one idea plus the link, never the
  IG caption truncated.

## 2026-10-24 (Sat) — Heartbeat (displaceable, §1(e2))

- **`23:00Z` · `heartbeat:on-this-day`** — mint
  `on-this-day:<subject-slug>:2026-10-24`. Link `/?item=<momentId>`.
- **Subject direction:** search the Vault for a moment dated **October 24**. If
  there is no genuinely dated match, fall back to `heartbeat:track-fact` off a
  track dossier rather than stretching a near-miss date — a wrong date is worse
  than a different beat. Either way the link is a real `/?item=` or `/?era=`.
- **Hook direction:** the number, or the contradiction. **Not** a bare
  `<month> <n>, <year>:` date-stamp — burned — and not an opener starting
  "the <thread>".
- **Yields first** to a major moment arriving off-reserve (§1(e2)'s order).

## 2026-10-25 (Sun) — 📰 NEWS RESERVE (week of 10-19)

- **`23:00Z` · `news:<event-slug>`** — **fallback, if nothing is uncovered:**
  `heartbeat:era-deep-cut` on **`the-life-of-a-showgirl`**, built on the
  new-on-site moment
  `vault-tloas-emmitt-smith-on-the-game-day-camera-shes-not-looking-for-the`,
  minting `heartbeat:era-deep-cut:tloas-game-day-camera:2026-10-25` and linking
  `/?item=vault-tloas-emmitt-smith-on-the-game-day-camera-shes-not-looking-for-the`.
- **How this beat works:** check `events.uncovered[]` first. An uncovered real
  event dated inside the last 48h → **leave this beat for the event run and
  draft nothing here.** Nothing uncovered → draft the fallback exactly as
  written. An assigned slot with two subjects, never a gap.
- **News bar:** confirmed fact from the intake record only, scored on the
  six-dimension rubric with `timely` ≥4 on its own. Ceiling ≤3 per rolling 7
  days and **the week of 10-19 has already spent its one major** (tonight's
  Fate of Ophelia pair), so anything taken here must be either major on its own
  footing or inside the ≤2 ordinary allowance. Nothing on the #36 blocklist
  except an already-confirmed personal-life event, covered factually like any
  other real news.
- **Hook direction, for the fallback:** the real quote — lead with Emmitt
  Smith's own words, attribute after. An outsider describing her is a shape this
  account has never used.

## 2026-10-26 (Mon) — End Game thread hero (window 10-26→30) · Tree run day

- **`23:00Z` · `thread:the-proposal:interactive-challenge`** — mint
  `thread:the-proposal:interactive-challenge:2026-10-hero`. Link
  `/?lens=the-proposal`.
- **Angle `interactive-challenge`:** "open it and find the one where ___ — reply
  with what you got." The challenge must be answerable only by actually opening
  the lens, and the answer must genuinely be in there — check before you write
  it.
- **Hook direction:** the challenge or direct address. **Not** "gut-check for
  the clowns" or any variant addressing the clowns — that shape is off the menu.
- **Media:** pre-compute pick.
- **Note for the 10-26 weekly run:** this is the last Tree run of October, so it
  carries the **monthly review** (strategy §3 — scorecard month over month, one
  named "double down" and one named "drop", rotation advanced) and computes
  November's windows and angles (`monthNumber` = 3). It also owns the
  `launch:photo-viewer` arc's +2 / +4 / +8 days.

## 2026-10-27 (Tue) — Heartbeat (displaceable, §1(e2))

- **`23:00Z` · `heartbeat:symbol-thread`** — mint
  `symbol-thread:<motif-slug>:2026-10-27`. Link `/?lens=easter-eggs`.
- **Subject direction:** one motif from the Invisible Strings atlas that recurs
  across at least two eras. Source every appearance; speculation is **labelled**
  as speculation, never asserted (vision.md's rule, verbatim on social).
- **Hook direction:** the artifact, or the challenge ("find it in ten seconds").
- **Yields first** to a major moment arriving off-reserve.

## 2026-10-28 (Wed) — 📰 NEWS RESERVE (week of 10-26)

- **`23:00Z` · `news:<event-slug>`** — **fallback, if nothing is uncovered:**
  `heartbeat:era-deep-cut` on **`speak-now`**, built on the new-on-site moment
  `vault-speak-now-6-000-books-for-the-library-down-the-road-from-wyomissing`,
  minting `heartbeat:era-deep-cut:speak-now-wyomissing-library:2026-10-28` and
  linking
  `/?item=vault-speak-now-6-000-books-for-the-library-down-the-road-from-wyomissing`.
- Same reserve mechanics as 10-25: `events.uncovered[]` first, leave the beat
  for the event run if something is uncovered, otherwise draft the fallback as
  written. Never drafted a day early.
- **Era note:** `speak-now` last shipped 10-11, 17 days before this beat, so it
  is clear of the no-stacking rule. Confirm the era still has a never-used photo
  before committing; if it does not, say so in the PR body — that is the signal
  the library needs feeding.
- **Hook direction, for the fallback:** the number. 6,000 is the hook.

## 2026-10-29 (Thu) — Blank Spaces timeline (week of 10-26 minimum)

- **`23:00Z` · `timeline:love-story:<chapter>`** — mint
  `timeline:love-story:<chapter-slug>:2026-10-29`. Link `/?lens=love-story`.
- **Chapter direction:** the next unposted chapter after 10-22's. Same sourcing
  bar: confirmed-only, verified against the Vault, chapter named in `why`.
- **Hook direction:** a different shape from 10-22's. Direct address or the
  honest question.

## 2026-10-30 (Fri) — Runway thread hero · **October's one make-good**

- **`23:00Z` · `thread:fashion:quiz-poll`** — mint
  `thread:fashion:quiz-poll:2026-10-hero`. Link `/?lens=fashion`.
- **This is an explicit out-of-window make-good** for the Runway window
  10-11→15, which closed with the hero written on PR #5998 and blocked red. It
  is allowed by strategy §1(b) as changed this run (PR #6105): one a month,
  taking a heartbeat beat, never another minimum. **Write fresh copy** — do not
  resurrect #5998's body; that PR gets retired, and its opener is 15 days from
  its own context.
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
  drops were engine failures rather than planning choices. This is the beat that
  gets October to 5 of 6 threads taught.

## 2026-10-31 (Sat) — Heartbeat (displaceable, §1(e2))

- **`23:00Z` · `heartbeat:on-this-day`** — mint
  `on-this-day:<subject-slug>:2026-10-31`. Link `/?item=<momentId>`.
- **Subject direction:** it is Halloween, and that is a real seasonal hook, not
  a theme to invent. Search the Vault for a moment dated **October 31** — a
  costume, an appearance, a release — and use it. **If there is no genuinely
  dated October 31 match, do not stretch one:** fall back to
  `heartbeat:era-deep-cut` on **`folklore`**, minting
  `heartbeat:era-deep-cut:folklore-<subject>:2026-10-31` and linking
  `/?era=folklore`, and say in `why` that the dated search came up empty.
- **Hook direction:** the artifact or direct address. A date-stamp opener is
  burned, and on this day of all days it is also the dullest available choice.
- **Yields first** to a major moment arriving off-reserve.

## 2026-11-01 (Sun) — 🚀 `launch:photo-viewer` DAY 0 (announce)

- **`23:00Z` · `launch:photo-viewer:announce`** — mint
  `launch:photo-viewer:announce:2026-11-01`. Link the `/?item=` of a
  photo-rich moment, so the tap lands exactly where the feature lives — never
  the bare homepage.
- **🚦 Gate, and it is hard (invariant 6):** open www.longlivets.com on a
  phone, pinch-zoom a photo on an item page, and confirm it works. **If it does
  not render, do not draft day 0.** Draft the fallback instead —
  `heartbeat:track-fact`, minting `track-fact:<subject-slug>:2026-11-01` off a
  track dossier, linking `/?item=<momentId>` — and say exactly what you saw, so
  the 10-26 run's +2/+4/+8 days can be re-planned rather than left dangling.
- **Job of the post** (§1(a) day 0): one line on what you can now *do*, not
  "we shipped". The viewer has been live since 2026-07-18 and has never been
  mentioned once, so the frame is "this has been here, here's how to use it" —
  which is honest and still news to every follower.
- **Media:** IG is a photo tile first with the feature **mid-use** as slide 2 —
  the one place a `/social/library/` screenshot is unambiguously sanctioned
  (`launch:` prefix, strategy-params `siteScreen.allowedCampaignPrefixes`). X
  takes the **same photo** as its IG sibling and never a site screenshot.
- **Hook direction:** direct address. The specificity test is the risk on a
  product post — "you can zoom in on the photos now" is not a hook; naming the
  photograph a fan would want to zoom into is.
- **Why here:** it is the first launch arc in five calendars that has an
  actually-live surface behind it, and it starts at the end of this window so
  the 10-26 run owns the rest of the arc rather than inheriting a promise.

---

## Beat accounting — 12 uncovered beats, 12 slots

| Reservation | Strategy | Beats | Dates |
|---|---|---|---|
| Covered by queue (do not plan) | §2 one-per-platform-per-day cap | 2 | 10-19, 10-20 |
| October thread heroes | §1(b) | 2 | 10-23, 10-26 |
| October thread make-good | §1(b), new this run | 1 | 10-30 |
| Blank Spaces timeline | §1(c), permanent weekly minimum | 2 | 10-22, 10-29 |
| News reserves | §1(e2), ≥1 per calendar week | 2 | 10-25, 10-28 |
| Mood | §1(d), monthly | 1 | 10-21 |
| Launch arc day 0 | §1(a) | 1 | 11-01 |
| Heartbeat (displaceable) | §1(e) | 3 | 10-24, 10-27, 10-31 |
| **Total** | | **14** | 14 days, 12 of them drafted by this plan |

**Displaceable-beat check (§1(e2), ≥2 per rolling 7 days), window by window:**
10-19→10-25: 10-21, 10-24 (2) · 10-20→10-26: 10-21, 10-24 (2) ·
10-21→10-27: 10-21, 10-24, 10-27 (3) · 10-22→10-28: 10-24, 10-27 (2) ·
10-23→10-29: 10-24, 10-27 (2) · 10-24→10-30: 10-24, 10-27 (2) ·
10-25→10-31: 10-27, 10-31 (2) · 10-26→11-01: 10-27, 10-31 (2). ✅

**Where a major moment lands.** Nearest free heartbeat or mood beat, in §1(e2)'s
order, and the displaced beat slides to the next free day — except a window-bound
thread hero, which is never displaced and never slid. The 10-30 make-good is
**not** displaceable: it is the last chance October has at its fifth thread.

---

## Review — next due 2026-10-26

The monthly review (strategy §3) falls to the **last Tree run of October, the
10-26 run**: scorecard month over month, one named "double down" and one named
"drop", rotation advanced into November, and a straight answer on whether the
merge outage above was fixed. IG Insights will not be in it unless reach clears
the §3 trigger first — see the ledger row.
