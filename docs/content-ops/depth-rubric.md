# Curated-Depth Rubric & Launch Bar

**Proposed standard (v1)** — comment or file a ticket to change.

Formalizes: `JW-Incorporated/swift2` issue #15, "Content: adopt curated-depth
rubric + wavetop launch bar." Grounded in:
`docs/marketing/content-framework-2026-07-03.md` (sections 2–3, incl. the
2026-07-04 revision), `docs/specs/2026-07-03-vault-mvp-v1-spec.md` (Section 9),
`docs/decisions.md` (2026-07-04 ship-readiness entry).

## What this closes

`docs/specs/2026-07-03-vault-mvp-v1-spec.md` Section 9 left one item open
before content authoring could start: curated depth (Option A) vs. full depth
(Option B) per month. **This adopts Option A** — curated depth, with a
concrete 3-tier rubric so "curated" is a rule authors apply consistently, not
a per-month judgment call. Full 19-year depth is explicitly **not** required
for v1.

## The 3-tier rubric

| Tier | Trigger | Item ceiling | Test |
|---|---|---|---|
| **Wavetop** | Month contains a seeded milestone (album release, tour opening) | up to 5–8, spread across categories | Would this item independently clear the Active bar on its own? |
| **Active** | Real, sourceable public activity that month (major sighting, relationship news, high-profile fashion moment, notable business news) | 2–4 | Would this have appeared in a mainstream entertainment outlet or a fan-community roundup within a week of happening? |
| **Quiet** | Everything else (the majority of months, by design) | 0–1 | Default — uses the existing sparse-month UI behavior already specced in the engineering spec, not a new UI state |

**"5–8" and "2–4" are ceilings, not fill quotas — never pad an item count for
category balance.** If a wavetop month only has 3 real, sourceable items, it
ships with 3. A single real-world event that spans categories (e.g. a dinner
sighting) becomes multiple `month_item` rows, one per category — that's
still each item earning its place on its own facts, not padding.

## Item-level significance (added 2026-07-18) — a different axis from the tiers above

The 3-tier rubric above governs **months** (how many items a month earns).
`significance` (`apps/web/lib/longlive/types.ts`, `ContentItem.significance`)
governs **individual items** within any month — how much depth *that one
item* gets and how prominently it renders. The two are related (a Wavetop
month's headline event will often be the month's `defining` item) but not
the same thing: a Wavetop month can still have zero `defining` items if
nothing in it was truly life-altering, and a `defining` item can occur in a
month that wouldn't otherwise clear Wavetop on its own.

**Decision (Joey + Wyatt, 2026-07-18, `docs/decisions.md`):** content should
be weighted by the real-world importance of the event, not by incidental
signals like photo count or write-up length — those used to be the only
signal the feed's card-sizing logic had (`lib/longlive/feed-tiers.ts`), which
meant a routine sighting with several photos could visually out-rank a
defining event with fewer. `significance` fixes that by making importance an
explicit authoring call instead of an inferred one.

**The two values, and how to judge them:**

- **`'defining'`** — reserve for genuinely life-altering events: a wedding, a
  major breakup, an album release, an event on the scale of those. Test:
  would a fan, years later, name this as one of the handful of moments that
  defined this era of Taylor's life? If you're unsure, it's probably
  `'notable'` instead — this tier should stay rare by design (see the two
  seeded examples below).
- **`'notable'`** — meaningfully important but not era-defining: a major
  performance, a high-profile interview, a significant but non-defining
  business/award moment.
- **Omit entirely (the default, nearly all items)** — routine. Most Active-
  and Wavetop-tier months are still made up of routine items; significance
  is not a reward for a month clearing Wavetop, it's reserved for the
  handful of items site-wide that are genuinely exceptional.

**What `'defining'` actually changes:**

1. **Depth** — a `'defining'` item gets the same kind of depth exception
   `music` items already have (see Length discipline, `editorial-voice-and-
   pipeline.md`): comprehensive `moment.context` where real sourced facts
   support it, not the routine "one short line, omit by default" bar. Still
   bound by the same no-fabrication rule — deeper means more real sourced
   facts, never speculation to fill space.
2. **Visibility** — the feed always renders it as the full-bleed `hero` card
   tier (`lib/longlive/feed-tiers.ts`), never subject to the pacing throttle
   that spaces out incidentally-hero-worthy items. `'notable'` gets a
   guaranteed floor (never demoted to a routine-shaped card) without forcing
   hero.
3. **The timeline scrubber** — a `'defining'` item's date should also get a
   `MILESTONES` entry (`lib/longlive/content.ts`) if it doesn't already have
   one nearby, so it's reachable from the horizontal era-scrubber too, not
   only the vertical feed. The two lists are hand-curated separately for now
   (no automated sync) — check both when authoring a defining item.

**Seeded examples:** as of 2026-07-19 (`docs/decisions.md`), 11 items across
7 era files carry `significance: 'defining'` — a career-wide top 10 (plus
`showgirl-release-day` from the 2026-07-18 pass), not a per-era quota,
picked and cross-linked in one pass rather than the per-era review
originally anticipated below. `msg-wedding` and `showgirl-release-day`
(`the-life-of-a-showgirl.mjs`) remain the two richest examples to read for
what "comprehensive depth, real sourcing, hero-worthy" looks like in
practice; the other 9 (debut, both Fearless Grammy/VMA moments, both 1989
business/culture moments, the Big Machine sale, folklore's surprise drop,
the Eras Tour opening, and the Kelce relationship going public) are listed
with rationale in the decision log.

Eras/events outside that 10 may still surface their own `'defining'` or
`'notable'` candidates over time — flag them as you encounter them rather
than treating the list above as permanently closed, but keep the bar the
2026-07-19 pass set: would a fan, years later, name this among the handful
of moments that defined her whole career, not just its own era.

## Authoring order

Don't author chronologically from 2006. Start with the eras that are both
highest fan demand and easiest to source, then backfill:

1. **Midnights + Tortured Poets** (2022–2025) — most recent, most documented,
   matches what the lore-diver segment is discussing right now.
2. **reputation, Lover, 1989** — high cultural volume, well-documented,
   strong "aesthetic era" fan behavior already.
3. **folklore/evermore, Red, Speak Now** — solid documentation, slightly
   lower urgency.
4. **Fearless, debut** — least digitized coverage from that era; hardest to
   source well, least time-sensitive to ship first.

This is an authoring hypothesis about source availability and demo value,
not an asserted demand claim — but it's the order to author against absent
a reason to deviate on a specific era.

## The launch bar

**Ticket #15's floor:** every era must have **all of its wavetop months
populated** before the Vault ships publicly — a user landing on any era
should never find a milestone month with zero content. Non-wavetop Active
months can ship incrementally, era-by-era, after that bar is met. This was
met across all 11 eras on 2026-07-04 (issue #38).

**Superseded/refined the same day** (`docs/decisions.md`, 2026-07-04
"Ship-readiness bar" entry) — the wavetop-only floor stays the minimum for
all 11 eras, **plus Midnights and Tortured Poets must reach Active-tier
depth before public launch**, weighted toward `relationship`, `sighting`,
and `fashion` (the categories flagged furthest behind at the time). The
remaining 9 eras ship at the wavetop floor and deepen on a public,
externally-announced weekly cadence after launch. This is the current
launch bar — cite the decisions.md entry, not the wavetop-only floor alone,
when checking ship-readiness.

**Not required for v1, ever, per this rubric:** full curated depth (every
Active-tier month filled) across all 11 eras before shipping. That's Option
B from spec Section 9, explicitly rejected — see "why" below.

## Why curated depth, not full depth

- Directly protects the 2MB gzipped Tier-0 payload budget
  (`docs/specs/2026-07-03-vault-mvp-v1-spec.md` Section 5) — full depth
  (Option B) is the scenario most likely to blow that budget.
- Rough sanity check: ~230 months across 11 eras, curated-depth average of
  ~1.5 items/month (most months are Quiet) ≈ ~350 Tier-0 rows, well under
  100KB uncompressed for Tier-0 text — nowhere near the budget gate. (This
  is a sanity check, not a substitute for the spec's required real-content
  measurement before ship.)
- Full depth defers all launch value behind one large authoring push
  instead of shipping a complete, dense slice sooner.

## Applying it — example

`supabase/seed/content/lover.mjs`: **August 2019** is Lover's wavetop month
(album release, 2019-08-23) and currently carries items across `business`,
`music`, and `fashion` — each independently clears the Active bar (a
Billboard-covered chart record, a song with its own well-sourced backstory,
a red-carpet look with two outlet sources) rather than being added to hit a
count. A quiet month elsewhere in the same era with no real sourceable
activity gets 0–1 items and the existing sparse-month UI state — not an
empty screen, not a padded one.

## Open questions

- The weekly post-launch "era drop" cadence for the 9 non-flagship eras only
  produces its intended retention benefit if it is **publicly announced**
  each time (per `docs/decisions.md`) — that's a recurring marketing-ops
  commitment on Joey, not just a content-authoring schedule. This rubric
  doesn't own that commitment; flagging so it isn't silently assumed as
  "automatic" once wavetop+flagship coverage ships.
- No one has yet timed Joey's human spot-check step per batch
  (`docs/decisions.md`, 2026-07-04 update) — that's the real throughput
  constraint on how many eras can reach deeper coverage before launch, not
  token budget. Not resolved here.
