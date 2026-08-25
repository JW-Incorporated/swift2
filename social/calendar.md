# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by the
Growth daily run** (`docs/agents/runner-prompts/growth-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-08-24 → 2026-09-06.**
Written by Tree's run of Monday 2026-08-24 — the first Tree run to actually
execute (no `tree/*` branch or PR exists for 2026-08-17, so the seeded plan ran
unrefreshed for a fortnight; the queue is empty as of this run and no date below
is pre-covered).

---

## ⛔ OPEN INCIDENT — Instagram has been failing for 9 days. Read before drafting.

**Every Instagram post whose media is a `*-screen.png` fails.** Six lost since
2026-08-15: 08-15, 08-16, 08-18, 08-21, 08-22, 08-23. Instagram returns
`code 36003 / error_subcode 2207009 — "The aspect ratio is not supported."`

Root cause, measured this run from the files themselves:

| Asset family | Dimensions | Ratio | Instagram (needs 0.80–1.91) |
|---|---|---|---|
| `*-screen.png` (all 8) | 780 × 1688 | **0.462** | **REJECTED, always** |
| `*-intro.png` (all 6), `mood-feature.png`, `thread-the-proposal-photo.png`, `feature-quote-demo-*.png` | 1080 × 1350 | 0.800 | OK — these have shipped |
| `photos/taylor-lover-eras-minneapolis-2023.jpg` | 1280 × 964 | 1.328 | OK |

**Drafter rule until an engineer re-captures the set: never put a
`*-screen.png` on an Instagram slot.** It is not a style call — the post cannot
physically publish. `*-screen.png` on **X** is fine (X has no such ratio bar)
and every slot below that wants a full-page capture is an X slot.

`scripts/social/check-drafts.mjs` has **no aspect-ratio gate** — it validates
path, kind and credit but never dimensions, which is why six posts failed
one after another with nothing catching it. Adding that gate is the durable
fix and is proposed to the founders in this run's PR. Tree cannot write it
(scripts are outside its mutation rights).

**Second constraint, from `docs/decisions.md` 2026-08-15 (Joey):** rehosted
third-party press photos are retired, and the 12 Getty preview comps were
deleted. `mediaKind: "photo"` is path-bound by the checker to
`/social/library/photos/`, so a hotlink cannot satisfy it — a photo must be a
**license-cleared local file**. Exactly **one** exists today
(`taylor-lover-eras-minneapolis-2023.jpg`, CC BY 2.0, Michael Hicks). The
strategy's "≥70% of media-carrying posts are real photographs of Taylor" is
therefore **not currently reachable on Instagram**, through no fault of the
drafter. Growing that corpus is the single highest-value unblock; see the
sourcing note in the ledger.

---

## How to read a slot

`TIME · PLATFORM · campaign:family` then — **link**, **media**, **hook**.

- **The campaign label is a FAMILY, never the queue item's `campaign` value.**
  Mint a story-unique value under the family — `on-this-day:<story-slug>`, not
  `heartbeat:on-this-day` — because the poster's duplicate check matches
  platform+campaign and a reused bucket value silently kills every later post
  in that bucket, forever, across the whole `social/posted/` history.
- **Slot A** `15:00Z` X (11am ET) · **Slot B** `23:00Z` Instagram (7pm ET) ·
  **Slot C** `23:30Z` X (7:30pm ET).
- Facebook rides every Instagram post automatically. It is never a slot.
- **Direction, not facts.** Every subject below is a pointer into the Vault.
  The drafter sources it; nothing here has been fact-checked and nothing here
  may be repeated as a claim.
- **On-this-day slots carry a fallback** — a date may have no Vault match.
  Check first, fall back second, say which you used in the `why`.
- **Heartbeat days never sibling-pair.** Where B and C fall on the same day and
  both are heartbeat, they are deliberately different subjects. Only campaign
  posts run true IG+X siblings, and those must still differ by >20%.
- **X length is weighted, not raw** — an autolinked URL always counts 23. Target
  ≤270; the checker hard-fails at 280.
- **An empty IG slot beats a failed one.** Where a slot below says *droppable*,
  and no cleared photo can be sourced that day, **skip the slot and say so in
  the run's PR**. Do not substitute a `*-screen.png`, an era tile, or a designed
  card — the first cannot publish and the other two are checker-dead.

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-08** (`monthNumber` = 0) → **2026-09** (`monthNumber` = 1) opens 09-01 |
| August windows | Decode 08-12→16 ✅ · Clue Web 08-17→21 ✅ · **Runway 08-22→26 (IG hero re-placed to 08-24 after the 08-23 aspect-ratio failure; X leg 08-25)** · Blank Spaces 08-27→31 |
| August angles | Decode `origin-story` · Clue Web `single-best-item` · Runway `interactive-challenge` · Blank Spaces `behind-the-data` |
| Dropped in August | Taylor's Version + End Game — August's cycle started on the 12th and partial months don't carry over. |
| **September windows + angles** (`angle = ANGLES[(1 + threadIndex) % 5]`) | Decode 09-01→05 `single-best-item` · Clue Web 09-06→10 `interactive-challenge` · Runway 09-11→15 `behind-the-data` · Blank Spaces 09-16→20 `quiz-poll` · Taylor's Version 09-21→25 `origin-story` · End Game 09-26→30 `single-best-item` |
| Launch arc in flight | **None.** `launch:mood-chat` is closed out — its X legs shipped, its 08-16 announce and 08-20 example-output IG legs are in `social/failed/`. |
| New launch arc this fortnight | **None, deliberately.** No user-visible ship merged since the last run (the 08-16→08-24 merges are knowledge-engine staging, reporting, docs and infra — none is something a fan could notice, and the engine is mid-build, so invariant 6 bars teasing it). Starting an arc while the IG half of every announce sibling cannot publish would burn the backlog's best story on a dead lane. |
| Launch backlog (unchanged, in order) | pinch-zoom photo viewer (#831) → photos + focal program (#762) → shoppable Runway looks → rumor tier. **Not** the Android app (#1815 — unshipped). |
| Mood beat | 2026-08 was absorbed into `launch:mood-chat`. **2026-09 = first standalone beat, format `mood:chip-poll`** — 3 slots, 09-01 / 09-04 / 09-05. Chip-poll is X-native, which suits the current IG constraint. |
| Openers burned (last 14 days) | **27 distinct patterns across 28 posts** — target is ≥12, so this is comfortably clear and the "did you know" formula is dead (last seen 08-10, pre-fix). Do not reuse, verbatim or near: `august <date>, <year>:` as a bare date-stamp (used 08-12/13/16/20/23), `an honest question` / `genuine question` (08-17, 08-22), `she was twenty`, `three taps and it knows`, `ten starter chips`, `no. 6 on hot country songs`. |
| Eras stacked recently — spread away from these | **lover ×4**, fearless ×2, evermore ×2, reputation ×2, 1989 ×2. **Lean on:** speak-now, midnights, folklore, red, debut, ttpd, tloas. |
| Cleared-photo corpus | **4 files**, all rehosted under `/social/library/photos/` at 1080×1350 (IG-safe, ratio 0.8) per the 2026-08-15 policy — grown 2026-08-24 to close #2218 (was down to 1). Each entry is `filename` — `mediaCredit` — `mediaSource`: <br>• `taylor-lover-eras-minneapolis-2023.jpg` — Michael Hicks (CC BY 2.0), via Wikimedia Commons — `https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_4.jpg` <br>• `taylor-red-eras-inglewood-2023.jpg` — Paolo Villanueva (CC BY 2.0), via Wikimedia Commons — `https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Inglewood,_California_-_Red_act_10.jpg` (the same shot already vetted in `apps/web/lib/longlive/lenses.ts`) <br>• `taylor-fearless-eras-inglewood-2023.jpg` — Paolo Villanueva (CC BY 2.0), via Wikimedia Commons — `https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_Fearless_Set_Era_(53109821975).jpg` <br>• `taylor-folklore-eras-inglewood-2023.jpg` — Paolo Villanueva (CC BY 2.0), via Wikimedia Commons — `https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_The_Folklore_Set_Era_(53108930417).jpg` (cropped 4:5, centered on Taylor, from the original wide stage shot). To grow it further under the 2026-08-15 policy, keep sourcing **CC BY / CC BY-SA / CC0 / public-domain** images from Wikimedia Commons (`commons.wikimedia.org` / `upload.wikimedia.org/wikipedia/commons/...` only — never the `/wikipedia/en/...` fair-use path), rehost under `/social/library/photos/`, and record `mediaCredit` + `mediaSource` on the draft. Never a Getty preview comp. |
| Reddit non-promo contributions | **0 / 20** — no founder-task issue has been ticked yet (none was filed by a Tree run before today). Every Reddit task stays a zero-link contribution until this hits 20 (growth-plan §7). |
| Crisis stop | **not active** — no founder "stop posting" in issues or PR comments, and `SOCIAL_FREEZE` is evidently unset (the poster has shipped X items daily through 08-23). |

---

## 2026-08-24 (Mon) — The Runway, IG hero (re-placed) · Tree run day

- **15:00Z · X · `heartbeat:on-this-day`** — check the Vault for a moment dated
  Aug 24; fall back to `heartbeat:era-deep-cut` on `speak-now` →
  `/?era=speak-now`. Media: photo if one is cleared, else **text-only** (a sharp
  text-only tweet is a legitimate rung, not a miss). Hook: **the contradiction**
  — the fact that shouldn't be true.
- **23:00Z · IG · `thread:fashion:interactive-challenge`** — link:
  `/?lens=fashion`. Media: **`/social/library/thread-fashion-intro.png`**
  (`site-screen`, 1080×1350 — verified publishable; the thread page is a product
  surface, the one subject that legitimately earns a screenshot). **Do NOT use
  `thread-fashion-screen.png`** — that is the exact file that failed on 08-23.
  Hook: **the challenge** — name one specific thing to go find in The Runway and
  ask for the answer in replies. This is the re-run of the lost 08-23 post: the
  writing in `social/failed/2026-08-23-runway-sister-eras-ig.json` was sound and
  its subject is still good — reuse the reporting, write a fresh opener, and mint
  a **new** story-unique campaign value (the failed item's value must not be
  reused if it ever reaches `posted/`).
- **23:30Z · X · `heartbeat:track-fact`** from a `midnights` dossier — link:
  `/?item=<momentId>`. Media: text-only, or `era-midnights-screen.png` (X has no
  ratio bar). Hook: **the number**. Different subject from 23:00Z.

## 2026-08-25 (Tue) — The Runway, X leg

- **15:00Z · X · `thread:fashion:interactive-challenge`** — link:
  `/?lens=fashion`. Media: `thread-fashion-screen.png` is fine **on X**. Hook:
  **direct address** — a different entry point into the same angle, never a
  truncation of Monday's IG caption; must differ >20%.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `folklore` — link:
  `/?era=folklore`. Media: **photo only** — the one cleared file, or a newly
  sourced Commons image. *Droppable* if neither can be sourced: an era page is
  not a product surface, so a screenshot would be the wrong media even if it
  could publish. Hook: **the artifact** — start with what the image is.
- **23:30Z · X · `heartbeat:symbol-thread`** — link: `/?lens=easter-eggs`.
  Media: text-only. Hook: **the honest question**, but not the words "an honest
  question" (burned 08-22).

## 2026-08-26 (Wed) — Runway window closes

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 26; fall back
  to `heartbeat:track-fact` from a `red` dossier. Media: text-only. Hook: **the
  real quote** — a sourced quote first, attribution second.
- **23:00Z · IG · `heartbeat:product-peek`** — the era scrubber mid-scrub. Link:
  `/?era=midnights`. Media: **`/social/library/era-midnights-screen.png` is
  780×1688 and will FAIL** — so either shoot this as an X post instead, or use a
  publishable 1080×1350 asset. *Droppable* this fortnight; the subject keeps.
  Hook: **direct address** — describe the gesture, not the feature name.
- **23:30Z · X · `heartbeat:era-deep-cut`** on `debut` — link: `/?era=debut`.
  Media: text-only. Hook: **the number**.

## 2026-08-27 (Thu) — Blank Spaces window opens

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 27; fall back
  `heartbeat:era-deep-cut` on `ttpd` → `/?era=ttpd`. Media: text-only. Hook:
  **the challenge**.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `red` — link: `/?era=red`.
  Media: **photo only**, *droppable*. Hook: **the contradiction**.
- **23:30Z · X · `heartbeat:track-fact`** from a `speak-now` dossier — link:
  `/?item=<momentId>`. Media: text-only. Hook: **the artifact**.

## 2026-08-28 (Fri) — Blank Spaces, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 28; fall back
  `heartbeat:symbol-thread` → `/?lens=easter-eggs`. Media: text-only. Hook:
  **the date** — but vary the shape; the bare `august <n>, <year>:` stamp has
  run five times in 14 days.
- **23:00Z · IG · `thread:love-story:behind-the-data`** — link:
  `/?lens=love-story`. Media:
  **`/social/library/thread-love-story-intro.png`** (`site-screen`, 1080×1350 —
  verified publishable). Hook: **behind-the-data** — how many items are in Blank
  Spaces, how they're sourced, and the one thing that surprised us building it.
  Count them against the real thread before writing; do not estimate.
- **23:30Z · X · `heartbeat:era-deep-cut`** on `tloas` — link: `/?era=tloas`.
  Media: text-only. Hook: **direct address**. Different subject from 23:00Z.

## 2026-08-29 (Sat)

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 29; fall back
  `heartbeat:track-fact` from a `1989` dossier. Media: text-only. Hook: **the
  number**.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `midnights` — link:
  `/?era=midnights`. Media: **photo only**, *droppable*. Hook: **the real
  quote**.
- **23:30Z · X · `heartbeat:symbol-thread`** — a **different motif** from 08-25.
  Link: `/?lens=easter-eggs`. Media: text-only. Hook: **the contradiction**.

## 2026-08-30 (Sun) — Blank Spaces, X leg

- **15:00Z · X · `thread:love-story:behind-the-data`** — link:
  `/?lens=love-story`. Media: `thread-love-story-screen.png` is fine **on X**.
  Hook: **the number** — one statistic from the thread carried as the whole
  post. Structurally different from Friday's IG hero; >20% divergence.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `reputation` — link:
  `/?era=reputation`. Media: **photo only**, *droppable*. Hook: **the
  artifact**.
- **23:30Z · X · `heartbeat:on-this-day`** — Vault check for Aug 30; fall back
  `heartbeat:track-fact` from a `folklore` dossier. Media: text-only. Hook:
  **the honest question** (different wording from 08-25).

## 2026-08-31 (Mon) — August closes · Tree run day (monthly review due)

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 31; fall back
  `heartbeat:era-deep-cut` on `evermore` → `/?era=evermore`. Media: text-only.
  Hook: **direct address**.
- **23:00Z · IG · `heartbeat:product-peek`** — the six threads as a set, seen
  from the home page. Link: `/?lens=hidden-clues`. Media:
  **`/social/library/thread-the-proposal-photo.png`** (1080×1350 — verified
  publishable) or any `*-intro.png` not used in the last 10 IG posts. Hook:
  **the number** — six threads, and what they add up to.
- **23:30Z · X · `heartbeat:track-fact`** from a `debut` dossier. Media:
  text-only. Hook: **the challenge**.

**Also today:** Tree's 08-31 run appends `## Review — 2026-08` (last run of the
month) and comments the summary on the latest `founders-brief` issue.

## 2026-09-01 (Tue) — September cycle opens · The Decode window opens · Mood beat 1/3

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Sep 1; fall back
  `heartbeat:era-deep-cut` on `speak-now`. Media: text-only. Hook: **the
  artifact**.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `ttpd` — link: `/?era=ttpd`.
  Media: **photo only**, *droppable*. Hook: **the contradiction**.
- **23:30Z · X · `mood:chip-poll`** — link: **bare `longlivets.com` + "tap
  Mood"**. Never write a `?mood=` URL; it does not exist. Media: text-only.
  Hook: three starter chips quoted **verbatim** from
  `apps/web/lib/longlive/mood-starters.ts` (approved copy — quote exactly, never
  reword), then "which one is you today". Pick chips whose real results come
  from **scored** eras — evermore, Midnights, TTPD and TLOAS are not scored, so
  never promise or imply songs from them.

## 2026-09-02 (Wed) — The Decode, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Sep 2; fall back
  `heartbeat:track-fact` from a `red` dossier. Media: text-only. Hook: **the
  real quote**.
- **23:00Z · IG · `thread:hidden-clues:single-best-item`** — link:
  `/?lens=hidden-clues`. Media:
  **`/social/library/thread-hidden-clues-intro.png`** (`site-screen`, 1080×1350
  — verified publishable). **Not `thread-hidden-clues-screen.png`** — that file
  failed on 08-21. Hook: **the artifact** — September's Decode angle is
  `single-best-item`: tell **one** clue→payoff pair whole, from the inside. The
  thread is the byline, named once at the end with the link — not the subject.
- **23:30Z · X · `heartbeat:era-deep-cut`** on `1989` — link: `/?era=1989`.
  Media: text-only. Hook: **the number**.

## 2026-09-03 (Thu)

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Sep 3; fall back
  `heartbeat:symbol-thread` → `/?lens=easter-eggs`. Media: text-only. Hook:
  **the contradiction**.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `fearless` — link:
  `/?era=fearless`. Media: **photo only**, *droppable*. Hook: **direct
  address**.
- **23:30Z · X · `heartbeat:track-fact`** from a `midnights` dossier. Media:
  text-only. Hook: **the honest question**.

## 2026-09-04 (Fri) — The Decode, X leg · Mood beat 2/3

- **15:00Z · X · `thread:hidden-clues:single-best-item`** — link:
  `/?lens=hidden-clues`. Media: `thread-hidden-clues-screen.png` is fine **on
  X**. Hook: **the challenge** — a different entry point into the same pair
  Wednesday told; never a truncation, >20% divergence.
- **23:00Z · IG · `heartbeat:era-deep-cut`** on `folklore` — a **different**
  subject from 08-25's folklore slot. Link: `/?era=folklore`. Media: **photo
  only**, *droppable*. Hook: **the number**.
- **23:30Z · X · `mood:chip-poll`** — second beat, a **different** three chips
  from 09-01, quoted verbatim. Link: bare `longlivets.com` + "tap Mood". Media:
  text-only. Hook: **direct address**. Same scored-era constraint as 09-01.

## 2026-09-05 (Sat) — Mood beat 3/3

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Sep 5; fall back
  `heartbeat:era-deep-cut` on `red`. Media: text-only. Hook: **the date**.
- **23:00Z · IG · `mood:chip-spotlight`** — link: bare `longlivets.com` + "tap
  Mood". Media: **`/social/library/mood-feature.png`** (1080×1350 — verified
  publishable; last used 08-19, so check it is outside the last-10-posted-IG
  repeat window before using, and prefer a cleared photo tile if one has been
  sourced by then). Hook: the chip lives in the **caption**, not the image —
  one chip quoted verbatim, and the fan-recognition beat that says *we know
  you*. Do not name evermore / Midnights / TTPD / TLOAS songs as results.
- **23:30Z · X · `heartbeat:era-deep-cut`** on `reputation` — link:
  `/?era=reputation`. Media: text-only. Hook: **the artifact**. Different
  subject from 23:00Z.

## 2026-09-06 (Sun) — The Clue Web window opens

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Sep 6; fall back
  `heartbeat:track-fact` from a `tloas` dossier. Media: text-only. Hook: **the
  real quote**.
- **23:00Z · IG · `thread:easter-eggs:interactive-challenge`** — link:
  `/?lens=easter-eggs`. Media:
  **`/social/library/thread-easter-eggs-intro.png`** (`site-screen`, 1080×1350
  — verified publishable). **Not `thread-easter-eggs-screen.png`** — that file
  failed on 08-18. This asset shipped on 08-17; confirm it is outside the
  last-10-posted-IG repeat window, and if it is not, prefer a cleared photo tile
  and drop the screenshot to a later carousel slide. Hook: **the challenge** —
  September's Clue Web angle is `interactive-challenge`: name one specific thing
  to go find, and ask for the reply.
- **23:30Z · X · `heartbeat:era-deep-cut`** on `debut` — link: `/?era=debut`.
  Media: text-only. Hook: **the number**.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks each, ≤5 minutes each,
paste-ready, checkboxes. Roughly 15 minutes of Joey's week, total.

**2026-08-24 — `founder-task: social reach week of 2026-08-24`** *(filed this
run)*

1. **r/TaylorSwift — one genuine contribution, zero links.** Exact thread and
   exact comment text supplied in the issue. No mention of the site.
   (Counter: 0 → 1 of 20.)
2. **Two more of the same**, different threads, supplied the same way.
   (Counter → 3 of 20.)
3. **IG Insights baseline** *(this month's data slot)* — Instagram → Insights →
   paste the last-30-days numbers into the issue. The only per-post engagement
   signal that exists; Tree names the top 3 in the monthly review.

**2026-08-31 — `founder-task: social reach week of 2026-08-31`** *(next run)*

1. Three more r/TaylorSwift contributions, same rules. (Counter → 6 of 20.)
2. Join two Swiftie Facebook groups and read their rules — **join and read
   only, do not post.** Tree names the groups and quotes each self-promo rule.
3. Reserved for whatever the 08-31 monthly review surfaces.

---

## Review — 2026-08

*(Appended by Tree's last run of the month — 2026-08-31. Scorecard month over
month, the Insights posts and what they had in common, one "double down", one
"drop", and the advanced rotation state. Empty until then.)*
