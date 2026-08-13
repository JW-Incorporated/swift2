# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by the
Growth daily run** (`docs/agents/runner-prompts/growth-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. Seeded 2026-08-11 by the PR that
created Tree; the first real Tree run is Monday 2026-08-17 and it will extend
this to 2026-08-30.

## How to read a slot

`TIME · PLATFORM · campaign:value` then — **link**, **media**, **hook**.

- **Slot A** `15:00Z` X (11am ET / 8am PT) · **Slot B** `23:00Z` Instagram
  (7pm ET / 4pm PT) · **Slot C** `23:30Z` X (7:30pm ET / 4:30pm PT).
- Facebook rides every Instagram post automatically. It is never a slot.
- **Direction, not facts.** Every subject below is a pointer into the Vault. The
  drafter sources it; nothing here has been fact-checked and nothing here may be
  repeated as a claim.
- **On-this-day slots carry a fallback** because a given date may have no Vault
  match. Check first, fall back second, and say which you used in the `why`.
- **X images work** (up to 4, since 2026-08-11) — X slots carry a photo
  whenever one fits the story; text-only is the fallback, never a tile.
- **Media follows the 2026-08-12 Taylor-photo standard** (`social/README.md`
  `mediaKind`): the default for any slot is a real credited photograph of
  Taylor (`photo`); `/social/library/` screenshots (`site-screen`) only for
  product-surface subjects, ideally as a carousel behind a photo tile. Era
  tiles and designed cards are checker-dead; "designed card" media notes in
  the slots below are legacy and read as "photo, or text-only on X". Instagram media is always required.
- **Heartbeat days never sibling-pair.** Where B and C fall on the same day and
  both are heartbeat, they are deliberately different subjects. Only campaign
  posts run true IG+X siblings, and those must still differ by >20%.

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-08** (`monthNumber` = 0) |
| Thread windows this month | Decode 08-12→16 · Clue Web 08-17→21 · Runway 08-22→26 · Blank Spaces 08-27→31 |
| Thread angles this month | Decode `origin-story` · Clue Web `single-best-item` · Runway `interactive-challenge` · Blank Spaces `behind-the-data` |
| Dropped this month | Taylor's Version + End Game — August's cycle started on the 12th and partial months don't carry over. September restarts at Decode with `monthNumber` = 1. |
| Launch arc in flight | `launch:mood-chat` — day 0 = **2026-08-16** (moved by the 2026-08-12 override), arc runs 08-16 / 08-19 / 08-20 |
| Launch backlog | pinch-zoom photo viewer (#831) → photos + focal program (#762) → shoppable Runway looks → rumor tier. **Not** the Android app (#1815 — unshipped). |
| Mood beat, 2026-08 | **Absorbed** into `launch:mood-chat`. First standalone beat: 2026-09, format `mood:chip-poll`. |
| Openers burned (last 14 days) | `did you know:` — **12 of the last 14 posts.** Permanently banned regardless. Tree refreshes this list from real posted bodies each run. |
| Reddit non-promo contributions | **0 / 20** — every Reddit founder-task stays a zero-link contribution until this hits 20 (growth-plan §7). |
| Crisis stop | not active |

**OVERRIDE 2026-08-12 (Joey, issue #2031 — supersedes the 08-13 → 08-16 slots
below):** after the triple-post incident and the Taylor-free grid, Joey directed
that **the next 10 posts each carry a real photograph of Taylor**. The queue was
reworked accordingly in a founder-merged PR: Aug 13–16 now runs a Taylor-photo
set (new + upgraded items, every one `mediaKind: "photo"` with credit), the
`launch:mood-chat` arc moved to 08-16 (announce) / 08-19 (how-to + feral-bridge)
/ 08-20 (cardigan, photo-tile carousel), The Decode's X leg to 08-19 and its IG
hero to 08-21, and every campaign value was made story-unique. The slot blocks
below are kept for the record; **the queue is the truth for 08-13 → 08-21.**
Tree's first run (Mon 08-17) should plan from 08-22 onward, photo-first.

---

## 2026-08-12 (Wed) — Mood Chat launch, day 0

- **15:00Z · X · `heartbeat:on-this-day`** — link: `/?item=<match>`; fallback
  `heartbeat:era-deep-cut` on `fearless` → `/?era=fearless`. Media: designed card
  (date card). Hook: **the date** — "august 12, 2010:" then the thing, no
  preamble.
- **23:00Z · IG · `launch:mood-chat` — announce** — link: bare
  `longlivets.com` + "tap Mood" (Mood has no deep link; never write `?mood=`).
  Media: **screenshot** of Mood with one chip tapped and the songs it returned,
  captured live. Hook: **the artifact** — describe what's on screen in the first
  line, then what it means. Do not open with "we built" or "introducing".
- **23:30Z · X · `launch:mood-chat` — announce sibling** — link: same. Media:
  same screenshot once X image posting lands; text-only until then. Hook:
  **the number or the chip** in
  ≤280 — written from scratch, not the IG caption cut short. Must differ >20%.

## 2026-08-13 (Thu) — The Decode, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:track-fact` from a `red` dossier → `/?item=<momentId>`. Media: card.
  Hook: **the contradiction**.
- **23:00Z · IG · `thread:hidden-clues:origin-story`** — link:
  `/?lens=hidden-clues`. Media: **screenshot** of The Decode open on the real
  site, one clue→payoff pair visible. Hook: **direct address** — most followers
  have never opened a thread; say what this one is in one line, then the single
  pair that makes the case.
- **23:30Z · X · `heartbeat:era-deep-cut` on `lover`** — link: `/?era=lover`.
  Media: vetted Vault photo with credit, or a card. Hook: **an honest question**.
  Deliberately a different subject from the 23:00Z post.

**Also today:** Tree files founder-task issue #1 (see § Founder tasks).

## 2026-08-14 (Fri) — Mood Chat, day +2

- **15:00Z · X · `heartbeat:on-this-day`** — fallback `heartbeat:track-fact`
  from a `1989` dossier. Media: card. Hook: **the number**.
- **23:00Z · IG · `launch:mood-chat` — how-to** — link: `longlivets.com` +
  "tap Mood". Media: **screenshot sequence or designed card** showing the actual
  tap path; assume the reader has never found it. Hook: **the challenge** —
  "three taps and it knows." Then the three taps, literally.
- **23:30Z · X · `heartbeat:era-deep-cut` on `debut`** — link: `/?era=debut`.
  Media: vetted photo or card. Hook: **a real sourced quote** first, attribution
  second.

## 2026-08-15 (Sat) — The Decode, X leg

- **15:00Z · X · `thread:hidden-clues:origin-story`** — link:
  `/?lens=hidden-clues`. Media: **screenshot**, tighter crop than Wednesday's.
  Hook: **the number** ("one clue, one payoff, N months apart"). Not a
  truncation of the IG post — a different entry point into the same angle.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `reputation`** — link:
  `/?era=reputation`. Media: **vetted Vault photo with credit** — era tile
  explicitly not acceptable here. Hook: **the artifact**.
- **23:30Z · X · `heartbeat:track-fact`** — link: `/?item=<momentId>`. Media:
  designed card (title/date/number only — cards never reproduce lyrics). Hook:
  **the contradiction**.

## 2026-08-16 (Sun) — Mood Chat, day +4

- **15:00Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:symbol-thread` → `/?lens=easter-eggs`. Media: card. Hook: **the
  date**.
- **23:00Z · IG · `launch:mood-chat` — example output** — link:
  `longlivets.com` + "tap Mood". Media: **screenshot of a real result** for one
  chip. Verify against the live feature before writing; **do not** pick a chip
  whose results lean evermore / Midnights / TTPD / TLOAS — those songs aren't
  scored yet. Hook: the chip label **verbatim** as the first line (they're
  approved copy: quote exactly, never reword), then what it gave back.
- **23:30Z · X · `launch:mood-chat` — example-output sibling** — link: same.
  Media: same screenshot. Hook: the result as a plain list in ≤280 — structurally
  different from the IG post.

## 2026-08-17 (Mon) — The Clue Web window opens · Tree run day

- **15:00Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:era-deep-cut` on `speak-now`. Media: card. Hook: **direct address**.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `folklore`** — link:
  `/?era=folklore`. Media: **vetted Vault photo with credit**, else a screenshot
  of the folklore month view. Hook: **an honest question**.
- **23:30Z · X · `heartbeat:symbol-thread`** — link: `/?lens=easter-eggs`.
  Media: designed card of the motif. Hook: **the number**.

## 2026-08-18 (Tue) — The Clue Web, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — fallback `heartbeat:track-fact`
  from a `midnights` dossier. Media: card. Hook: **the contradiction**.
- **23:00Z · IG · `thread:easter-eggs:single-best-item`** — link:
  `/?lens=easter-eggs`. Media: **screenshot** of that one case file open on the
  site. Hook: **the artifact** — the case file is the subject; the thread is the
  byline, mentioned once at the end with the link.
- **23:30Z · X · `heartbeat:era-deep-cut` on `evermore`** — link:
  `/?era=evermore`. Media: vetted photo or card. Hook: **a real sourced quote**.

## 2026-08-19 (Wed) — The Clue Web, X leg

- **15:00Z · X · `thread:easter-eggs:single-best-item`** — link:
  `/?lens=easter-eggs`. Media: **screenshot**, different frame from Tuesday's.
  Hook: **the challenge** in ≤280 — a different entry point into the same case
  file, never a truncation of the IG caption.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `red`** — link: `/?era=red`.
  Media: **vetted Vault photo with credit**. Hook: **direct address**.
- **23:30Z · X · `heartbeat:track-fact`** from a `ttpd` dossier — link:
  `/?item=<momentId>`. Media: card. Hook: **the number**.

## 2026-08-20 (Thu) — Mood Chat, day +8 (callback)

- **15:00Z · X · `launch:mood-chat` — callback** — link: `longlivets.com` +
  "tap Mood". Media: designed card with three chip labels, quoted verbatim.
  Hook: **an honest question** we'd actually like answered — "which one is you
  today" — and an invitation to reply. Replies stay human; Tree flags any worth
  answering in the next founder-task issue.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `1989`** — link: `/?era=1989`.
  Media: **vetted Vault photo with credit**. Hook: **the artifact**.
- **23:30Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:symbol-thread` → `/?lens=easter-eggs`. Media: card. Hook: **the
  date**.

**Also today:** Tree files founder-task issue #2.

## 2026-08-21 (Fri) — The Clue Web window closes

- **15:00Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:symbol-thread`. Media: card. Hook: **the contradiction**.
- **23:00Z · IG · `heartbeat:product-peek`** — the era scrubber mid-scrub. Link:
  `/?era=midnights`. Media: **screenshot** of the scrubber caught between eras.
  Hook: **direct address** — describe the gesture, not the feature name.
- **23:30Z · X · `heartbeat:track-fact`** from a `speak-now` dossier. Media:
  card. Hook: **a real sourced quote**.

## 2026-08-22 (Sat) — The Runway window opens

- **15:00Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:era-deep-cut` on `midnights`. Media: card. Hook: **the number**.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `tloas`** — link: `/?era=tloas`.
  Media: **vetted Vault photo with credit**. Hook: **the artifact**.
- **23:30Z · X · `heartbeat:track-fact`** from an `evermore` dossier. Media:
  card. Hook: **an honest question**.

## 2026-08-23 (Sun) — The Runway, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — fallback `heartbeat:track-fact`
  from a `reputation` dossier. Media: card. Hook: **the date**.
- **23:00Z · IG · `thread:fashion:interactive-challenge`** — link:
  `/?lens=fashion`. Media: **screenshot** of The Runway with one look open.
  Hook: **the challenge** — name a specific thing to go find ("open it and find
  the one look that shows up in two different eras"), and ask for the reply.
- **23:30Z · X · `heartbeat:era-deep-cut` on `fearless`** — link:
  `/?era=fearless`. Media: vetted photo or card. Hook: **the contradiction**.

## 2026-08-24 (Mon) — Tree run day

- **15:00Z · X · `heartbeat:on-this-day`** — fallback
  `heartbeat:symbol-thread`. Media: card. Hook: **direct address**.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `midnights`** — link:
  `/?era=midnights`. Media: **vetted Vault photo with credit**. Hook: **a real
  sourced quote**.
- **23:30Z · X · `heartbeat:track-fact`** from a `folklore` dossier. Media:
  card. Hook: **the number**.

## 2026-08-25 (Tue) — The Runway, X leg

- **15:00Z · X · `thread:fashion:interactive-challenge`** — link:
  `/?lens=fashion`. Media: **screenshot**, a different look from Sunday's. Hook:
  **the challenge** in ≤280, different entry point, not a truncation.
- **23:00Z · IG · `heartbeat:on-this-day`** — fallback
  `heartbeat:era-deep-cut` on `debut` → `/?era=debut`. Media: **vetted Vault
  photo with credit** (IG media is required — a card is the fallback, an era tile
  is not). Hook: **the date**.
- **23:30Z · X · `heartbeat:symbol-thread`** — link: `/?lens=easter-eggs`. A
  **different motif** from 08-17. Media: card. Hook: **the artifact**.

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks each, ≤5 minutes each,
paste-ready, checkboxes. Roughly 15 minutes of Joey's week, total.

**2026-08-13 — `founder-task: social reach week of 2026-08-13`**

1. **r/TaylorSwift — one genuine contribution, zero links.** Tree supplies the
   thread URL and the exact comment text, drawn from real Vault knowledge. No
   mention of the site. (Counter: 0 → 1 of 20.)
2. **Two more of the same**, in different threads, supplied the same way.
   (Counter → 3 of 20.)
3. **IG Insights baseline** — open Instagram → Insights → screenshot or paste
   the last-30-days numbers into the issue. This is the monthly engagement input
   and the only per-post data that exists.

**2026-08-20 — `founder-task: social reach week of 2026-08-20`**

1. **Three more r/TaylorSwift contributions**, same rules, text supplied.
   (Counter → 6 of 20.)
2. **Join two Swiftie Facebook groups and read their rules** — Tree names the
   two groups and quotes the self-promo rule from each. **Join and read only; do
   not post.** Groups are the reach lane no API touches, and the first post has
   to be earned the same way Reddit's is.
3. *(Only if any Mood-callback replies came in on 08-20)* — three suggested
   replies, drafted for Joey to send or ignore. Never auto-sent (growth charter
   rail 4).

---

## Review — 2026-08

*(Appended by Tree's last run of the month — scorecard month over month, the
Insights posts and what they had in common, one "double down", one "drop", and
the advanced rotation state. Empty until then.)*
