# Social calendar — the next 14 days

**Owned by Tree** (`docs/agents/tree.md`), rewritten every Monday. **Read by the
Growth daily run** (`docs/agents/runner-prompts/growth-draft.md`), which drafts
these slots into `social/queue/`. Nothing else may edit this file — the drafter
reading its own assignment and then rewriting it is exactly the loop this
replaces.

Strategy: `docs/marketing/social-strategy.md`. **Covers 2026-08-17 → 2026-08-30.**
Written by Tree's first real run, Monday 2026-08-17.

## How to read a slot

`TIME · PLATFORM · campaign:family` then — **link**, **media**, **hook**.

- **The campaign label is a FAMILY, never the queue item's `campaign` value**
  (2026-08-12): the drafter mints a story-unique value under the family —
  `on-this-day:<story-slug>`, not `heartbeat:on-this-day` — because the
  poster's duplicate check matches platform+campaign and a reused bucket
  value silently kills every later post in that bucket.
- **Slot A** `15:00Z` X (11am ET / 8am PT) · **Slot B** `23:00Z` Instagram
  (7pm ET / 4pm PT) · **Slot C** `23:30Z` X (7:30pm ET / 4:30pm PT).
- Facebook rides every Instagram post automatically. It is never a slot.
- **Direction, not facts.** Every subject below is a pointer into the Vault. The
  drafter sources it; nothing here has been fact-checked and nothing here may be
  repeated as a claim.
- **On-this-day slots carry a fallback** because a given date may have no Vault
  match. Check first, fall back second, and say which you used in the `why`.
- **Heartbeat days never sibling-pair.** Where B and C fall on the same day and
  both are heartbeat, they are deliberately different subjects. Only campaign
  posts run true IG+X siblings, and those must still differ by >20%.
- **A date already covered by a queued item is never drafted again.** Days
  marked *covered by queue* below are committed work — drafting over one ships
  two posts into the same slot, and the duplicate check cannot catch it because
  the campaigns differ.

---

## ⛔ Read this before drafting any Instagram slot

Two things broke the Instagram lane last week. Both are live constraints on
every slot below, and neither is caught by `check-drafts.mjs`.

**1. Instagram rejects any image outside a 0.8–1.91 aspect ratio.** Every
`/social/library/*-screen.png` asset in this repo is a raw **780×1688** mobile
screenshot — ratio **0.462**. Instagram's API refuses it with
`error_subcode 2207009, "The aspect ratio is not supported"`. That is what
killed `2026-08-15-tloas-era-page-ig` and `2026-08-16-mood-chat-announce-ig`
(3 attempts each), and it is why the Mood Chat launch never reached Instagram
at all. The checker never measures the image, so these pass the gate and die at
the API.

| Safe on Instagram (1080×1350, ratio 0.800) | **Never put on Instagram** (780×1688, ratio 0.462) |
|---|---|
| `thread-hidden-clues-intro.png` · `thread-easter-eggs-intro.png` · `thread-fashion-intro.png` · `thread-love-story-intro.png` · `thread-taylors-version-intro.png` · `thread-the-proposal-intro.png` · `thread-the-proposal-photo.png` · `mood-feature.png` · `feature-quote-demo-kelce.png` · `feature-quote-demo-theory.png` | `era-midnights-screen.png` · `era-tloas-screen.png` · `mood-chat-screen.png` · `thread-hidden-clues-screen.png` · `thread-easter-eggs-screen.png` · `thread-fashion-screen.png` · `thread-love-story-screen.png` · `thread-taylors-version-screen.png` · `thread-the-proposal-screen.png` |

Any NEW screenshot must be exported at **1080×1350** before it is queued. On X
the ratio does not matter — X accepts the tall screenshots fine.

**2. The photo corpus is down to one image.** The 2026-08-15 decision ("No
rehosted third-party press photos, going forward") removed the 12 Getty
preview comps. `apps/web/public/social/library/photos/` now holds exactly
`taylor-lover-eras-minneapolis-2023.jpg` (1280×964, CC BY 2.0, Michael Hicks via
Wikimedia). `mediaKind: "photo"` is path-bound to that directory, so a hotlink
cannot be declared `photo`.

**So the standing media instruction for every slot below is:**

> Source a **CC-licensed or public-domain photograph of Taylor** for the named
> era — Wikimedia Commons is the reliable well, and
> `apps/web/lib/longlive/lenses.ts` already carries per-era Wikimedia/Getty
> entries with captions to work back from. Check the licence, rehost under
> `/social/library/photos/`, export at **1080×1350** for Instagram, and record
> `mediaCredit` + `mediaSource` on the queue item, per the 2026-08-15 decision.
> **Fallback if no cleared photo can be sourced in time:** the era or thread's
> IG-safe `-intro.png` as `site-screen`. Do **not** re-use
> `taylor-lover-eras-minneapolis-2023.jpg` more than once a week — a repeating
> tile is the exact 2026-08-06 slideshow failure in a new costume.

Era tiles (`/eras/*.png`) and designed cards remain checker-dead. X slots may
run **text-only** — a legitimate rung of the ladder, and it is never counted
against the media mix.

---

## Ledger

| State | Value |
|---|---|
| Cycle month | **2026-08** (`monthNumber` = 0) |
| Thread windows this month | Decode 08-12→16 *(moved: X leg 08-19, IG hero 08-21 — both queued)* · Clue Web 08-17→21 · Runway 08-22→26 · Blank Spaces 08-27→31 |
| Thread angles this month | Decode `origin-story` · Clue Web `single-best-item` · Runway `interactive-challenge` · Blank Spaces `behind-the-data` |
| Dropped this month | Taylor's Version + End Game — August's cycle started on the 12th and partial months don't carry over. |
| Next month (2026-09, `monthNumber` = 1) | Decode `single-best-item` · Clue Web `interactive-challenge` · Runway `behind-the-data` · Blank Spaces `quiz-poll` · Taylor's Version `origin-story` · End Game `single-best-item`. Full six-window cycle, 09-01→30. |
| Launch arc closing | `launch:mood-chat` — day 0 was 08-16. Announce shipped on X only (the IG half died on aspect ratio); how-to queued 08-19; **example-output and callback replanned to 08-20**, closing the arc. |
| Launch arc opening | `launch:merch` — **Merch + Fan Communities went live** (#2112 on 08-14, rebuilt through #2172/#2176). Verified live: `www.longlivets.com/?mode=merch` returns the Merch surface. Day 0 = **2026-08-22**, ≥24h clear and non-overlapping with the Mood arc. Arc: 08-22 / 08-24 / 08-26 / 08-30. |
| Launch backlog | pinch-zoom photo viewer (#831) → photos + focal program (#762) → shoppable Runway looks → rumor tier. **Not** the Android app (#1815 — unshipped). |
| Mood beat, 2026-08 | **Absorbed** into `launch:mood-chat`. First standalone beat: 2026-09, format `mood:chip-poll`. |
| **Mood now has a real deep link** | `longlivets.com/?mode=mood` — shipped by #2105/#2134 and verified live. Strategy §1(c)'s "no deep link exists, say tap Mood" is out of date; a change to that file is a founder-approved PR, so it is proposed in this run's PR body, not edited here. Still true: **`?mood=` does not exist and must never be written.** The same `?mode=` family gives `?mode=merch`, `?mode=community`, `?mode=threads`, `?mode=clownbot`. |
| Openers burned (last 14 days) | `did you know:` — **permanently banned**, 9 uses on 08-03→08-09 (they age out of the window this week; the ban does not). Also burned: `twenty summers ago…` · `on this day in 2010…` · `ten songs, one artist…` · `august 12, 2025, 12:12…` · `how does a song nobody…` · `one year ago today…` · `august 13, 2012…` · `you know that squeaky…` · `"it literally took me just…` · `before reputation had a single…` · `madison square garden, sold out…` · `a critic wrote that she…` · `august 16, 2019…` · `ten starter chips, or type…` |
| Reddit non-promo contributions | **0 / 20** — every Reddit founder-task stays a zero-link contribution until this hits 20 (growth-plan §7). |
| Crisis stop | **not active.** No founder has said "stop posting"; `SOCIAL_FREEZE` is unset (the poster ran normally through 2026-08-17T01:16Z). |

---

## 2026-08-17 (Mon) — covered by queue · Tree run day

All three slots are committed work. **Do not draft this date.**
A `on-this-day:rep-year-of-silence` · B `thread-clue-web:first-egg` (IG-safe
media) · C `on-this-day:betty-country-radio`.

## 2026-08-18 (Tue) — covered by queue

All three slots committed. **Do not draft this date.**
⚠️ **`2026-08-18-clue-web-google-puzzles-ig` will fail at the Instagram API** —
its media is `thread-easter-eggs-screen.png`, 780×1688. Tree may not edit the
queue; see the founder-decision issue filed by this run.

## 2026-08-19 (Wed) — covered by queue

All three slots committed. **Do not draft this date.**
A `thread-decode:by-the-numbers` · B `launch:mood-chat-howto` (media
`mood-feature.png`, IG-safe) · C `launch:mood-chat-feral-bridge`.

## 2026-08-20 (Thu) — Clue Web X leg · the Mood arc closes

- **15:00Z · X · `thread:easter-eggs:single-best-item`** — link:
  `/?lens=easter-eggs`. Media: a sourced era photo if one fits the case file,
  else text-only. Hook: **the challenge**. This is The Clue Web's X leg and the
  window closes tomorrow. It must be a **third, different case file** — not the
  first-egg question queued for 08-17 and not the Google-puzzles story queued
  for 08-18 — and structurally its own post, never either caption re-cut.
- **23:00Z · IG · `launch:mood-chat` — example output** — link:
  `/?mode=mood` (verify the overlay actually opens before queueing). Media:
  **a newly sourced, cleared Taylor photo from the era the returned songs come
  from**, 1080×1350; `mood-feature.png` is the fallback tile. Hook: the chip
  label **verbatim** as the first line — approved copy, quote exactly, never
  reword — then what it actually gave back. **The writing for this post already
  exists**: `social/failed/2026-08-20-mood-chat-cardigan-weather-ig.json` was
  retired by hand on 08-15 only because its Getty photo was pulled, and its
  Mood result was sourced against the live endpoint. Reuse that body and result;
  replace the photo. Give it a fresh story-unique campaign value — the retired
  one (`launch:mood-chat-cardigan`) is safe to reuse only because it never
  posted, but a new slug is cheaper than checking.
- **23:30Z · X · `launch:mood-chat` — callback** — link: `/?mode=mood`. Media:
  text-only is right here. Hook: **an honest question** we would actually like
  answered — invite people to reply with what their chip returned. Replies stay
  human, forever; Tree flags any worth answering in next week's founder task.

## 2026-08-21 (Fri) — The Clue Web window closes · B covered by queue

- **15:00Z · X · `heartbeat:on-this-day`** — check the Vault for a moment dated
  Aug 21; fall back to `heartbeat:era-deep-cut` on `speak-now` →
  `/?era=speak-now`. Media: sourced photo or text-only. Hook: **the date**.
- **23:00Z · IG** — *covered by queue* (`2026-08-21-decode-elevator-eighteen-ig`,
  The Decode's IG hero). ⚠️ Its media is `thread-hidden-clues-screen.png`,
  780×1688 — **it will fail at the Instagram API** for the same reason as 08-18.
- **23:30Z · X · `heartbeat:track-fact`** — a `red` dossier →
  `/?item=<momentId>`. Media: text-only. Hook: **the contradiction**.

## 2026-08-22 (Sat) — **Merch launch, day 0** · The Runway window opens

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 22; fall back
  to `heartbeat:era-deep-cut` on `midnights` → `/?era=midnights`. Media:
  text-only. Hook: **the number**.
- **23:00Z · IG · `launch:merch` — announce** — link: `/?mode=merch`. Media:
  **carousel** — slide 1 a cleared Taylor photo (an era whose merch you are
  actually showing), slide 2 a **fresh 1080×1350 screenshot** of the Merch page
  as deployed. Do not reuse any `*-screen.png`. Hook: **the artifact** — open
  by describing what is on the screen, then what a fan can now do with it. Not
  "we shipped", not "introducing". The line that matters: you can filter the
  whole thing by era.
- **23:30Z · X · `launch:merch` — announce sibling** — same link. Written
  **first, as its own post**: one idea, the link, ≤270 weighted characters
  (a URL counts as 23 no matter its length). Must differ from the IG body by
  >20%. Hook: **direct address**.

## 2026-08-23 (Sun) — The Runway, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 23; fall back
  to `heartbeat:track-fact` from a `fearless` dossier. Media: text-only.
  Hook: **the date**.
- **23:00Z · IG · `thread:fashion:interactive-challenge`** — link:
  `/?lens=fashion`. Media: cleared Taylor photo as the tile (pick the era of the
  look you are pointing at), `thread-fashion-intro.png` as slide 2 — that asset
  is 1080×1350 and safe. Hook: **the challenge** — name one specific thing to go
  find ("open it and find the one look that shows up in two different eras") and
  ask for the reply.
- **23:30Z · X · `heartbeat:era-deep-cut` on `debut`** — link: `/?era=debut`.
  Media: text-only. Hook: **a real sourced quote** first, attribution second.
  Deliberately a different subject from the 23:00Z post.

## 2026-08-24 (Mon) — Merch +2 · Tree run day

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 24; fall back
  to `heartbeat:symbol-thread` → `/?lens=easter-eggs`. Media: text-only.
  Hook: **direct address**.
- **23:00Z · IG · `launch:merch` — how-to** — link: `/?mode=merch`. Media:
  cleared Taylor photo tile, then **1080×1350 exports of the actual tap path**
  (open the tab → pick an era → what the filter does). Assume the reader has
  never found it. Hook: **direct address** — say where it is, in words, before
  you say why it is good.
- **23:30Z · X · `heartbeat:era-deep-cut` on `tloas`** — link: `/?era=tloas`.
  Media: text-only. Hook: **the contradiction**.

## 2026-08-25 (Tue) — The Runway, X leg

- **15:00Z · X · `thread:fashion:interactive-challenge`** — link:
  `/?lens=fashion`. Media: text-only, or a cleared photo of the look.
  Hook: **the challenge** in ≤270 weighted characters — a **different look**
  from Sunday's and a different entry point, never a truncation of the IG
  caption.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `evermore`** — link:
  `/?era=evermore`. Media: cleared `evermore`-era photo, 1080×1350.
  Hook: **the artifact**.
- **23:30Z · X · `heartbeat:track-fact`** — a `1989` dossier →
  `/?item=<momentId>`. Media: text-only. Hook: **an honest question**.

## 2026-08-26 (Wed) — Merch +4 · The Runway window closes

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 26; fall back
  to `heartbeat:era-deep-cut` on `lover` → `/?era=lover`. Media: text-only.
  Hook: **the date**.
- **23:00Z · IG · `launch:merch` — example output** — link: `/?mode=merch`.
  Media: cleared Taylor photo tile + a 1080×1350 shot of **one real thing on the
  page** — a specific piece with its era and its story, not the grid again.
  Hook: **the number**. This is the proof-it's-good beat; pick the single item
  you would actually send a friend.
- **23:30Z · X · `launch:merch` — example sibling** — same link, its own post,
  >20% different. Media: the same item shot. Hook: **the artifact**.

## 2026-08-27 (Thu) — Blank Spaces window opens, X leg

- **15:00Z · X · `thread:love-story:behind-the-data`** — link:
  `/?lens=love-story`. Media: text-only. Hook: **the number** — how many beats
  are in the thread, how they were sourced, and the one thing that surprised us
  building it. Count from the real thread before writing; do not estimate.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `folklore`** — link:
  `/?era=folklore`. Media: cleared `folklore`-era photo, 1080×1350.
  Hook: **direct address**.
- **23:30Z · X · `heartbeat:track-fact`** — a `reputation` dossier →
  `/?item=<momentId>`. Media: text-only. Hook: **a real sourced quote**.

## 2026-08-28 (Fri) — Blank Spaces, IG hero

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 28; fall back
  to `heartbeat:symbol-thread` → `/?lens=easter-eggs`. Media: text-only.
  Hook: **the contradiction**.
- **23:00Z · IG · `thread:love-story:behind-the-data`** — link:
  `/?lens=love-story`. Media: cleared Taylor photo tile +
  `thread-love-story-intro.png` as slide 2 (1080×1350, safe). Hook: **the
  number** — a different number and a different entry point from Thursday's X
  leg, not the same post twice.
- **23:30Z · X · `heartbeat:era-deep-cut` on `ttpd`** — link: `/?era=ttpd`.
  Media: text-only. Hook: **the artifact**.

## 2026-08-29 (Sat) — heartbeat day

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 29; fall back
  to `heartbeat:era-deep-cut` on `speak-now` → `/?era=speak-now`. Media:
  text-only. Hook: **the date**.
- **23:00Z · IG · `heartbeat:product-peek`** — the **Fan Communities signal
  board**, live since #2158. Link: `/?mode=community` (verify the overlay opens).
  Media: cleared Taylor photo tile + a 1080×1350 shot of the board.
  Hook: **an honest question** — this surface exists to point fans at each
  other, so ask which community they would add.
- **23:30Z · X · `heartbeat:era-deep-cut` on `red`** — link: `/?era=red`.
  Media: text-only. Hook: **direct address**. A different subject from 23:00Z.

## 2026-08-30 (Sun) — Merch +8, the callback

- **15:00Z · X · `heartbeat:on-this-day`** — Vault check for Aug 30; fall back
  to `heartbeat:era-deep-cut` on `debut` → `/?era=debut`. Media: text-only.
  Hook: **the number**.
- **23:00Z · IG · `heartbeat:era-deep-cut` on `fearless`** — link:
  `/?era=fearless`. Media: cleared `fearless`-era photo, 1080×1350.
  Hook: **a real sourced quote**.
- **23:30Z · X · `launch:merch` — callback** — link: `/?mode=merch`. Media:
  text-only. Hook: **an honest question** tied to a fan use-case — what did you
  find in there, what is missing. Invite a reply; replies stay human.

---

## Slot accounting for this window

| | Planned by Tree | Covered by queue | Total |
|---|---|---|---|
| Days | 08-20 → 08-30 | 08-17, 08-18, 08-19, and 08-21 B | 14 days |
| Slots | 32 | 10 | 42 |
| Campaign slots | 13 (1 Clue Web X leg · 2 Mood close-out · 6 Merch arc · 2 Runway · 2 Blank Spaces) | | |
| Heartbeat slots | 19 | | |

Era spread across the window: `speak-now`, `red`, `midnights`, `fearless`,
`debut`, `tloas`, `evermore`, `1989`, `lover`, `folklore`, `reputation`, `ttpd`
— twelve distinct eras, none stacked twice inside any seven-day stretch, and
none colliding with the eras already committed in the 08-17→21 queue
(`reputation`, `folklore`, `1989`, `evermore`).

---

## Founder tasks scheduled in this window

Filed as `founder-task` issues by Tree. ≤3 tasks each, ≤5 minutes each,
paste-ready, checkboxes, written to `docs/agents/founder-comms.md`.

**2026-08-17 — `founder-task: social reach week of 2026-08-17`** *(filed by
this run)*

1. **Three r/TaylorSwift contributions**, exact text supplied, zero links, no
   mention of the site. Counter 0 → 3 of 20.
2. **Instagram Insights baseline** — the monthly slot, and it has never been
   done. It is the only per-post engagement data that exists anywhere in this
   system.
3. **Follow 10 Swiftie accounts** from the Long Live Instagram. The account has
   one follower; following is the cheapest honest move available and needs no
   API we don't have.

**2026-08-24 — `founder-task: social reach week of 2026-08-24`** *(next run)*

1. Three more r/TaylorSwift contributions, same rules. Counter → 6 of 20.
2. Join two Swiftie Facebook groups and read their rules — Tree names the two
   and quotes each self-promo rule. **Join and read only; do not post.**
3. *(Only if the Mood or Merch callbacks drew replies)* — three suggested
   replies, drafted for Joey to send or ignore. Never auto-sent.

---

## Review — 2026-08

*(Appended by Tree's last run of the month — Monday 2026-08-31 — with the
scorecard month over month, the Insights posts and what they had in common, one
"double down", one "drop", and the advanced rotation state. Empty until then.)*
