# Content Framework — 2026-07-03

Prepared by: Marketing dept (Claude, with Codex adversarial review).
Human focus question: *"What's the plan for content types and content
layout, before we start actually authoring content?"* — Joey noted this
is his first time building something like this and asked to be told if
he's framing the problem wrong.

## Framing check (answering that directly)

Mostly right instinct, one correction: this isn't a "which new feature"
question — it's "how do we finish specifying the Vault feature that's
already approved, so content authoring doesn't start on a moving target."
Good news: more of this is already decided than it feels like from the
outside.

**Already locked, not up for debate here:**
- v1 is Vault-only — no news feed, no notifications (`docs/decisions.md`,
  2026-07-03).
- The DB schema (merged in PR #14, `feature/vault-foundation`) already
  hard-codes a 7-category taxonomy via a CHECK constraint:
  `sighting | fashion | relationship | tour | business | music | release`.
  Changing this later means a migration, not a doc edit — so "what are the
  content types" is *already answered* at the schema level. Today's job is
  to confirm it's right before content is authored against it, not invent
  a new list.
- 11 eras + wavetop milestones (album releases, tour openings) are already
  seeded (`supabase/seed/eras-data.mjs`) — the skeleton Joey described
  (era → month → item) is real, not hypothetical.
- The one thing genuinely unresolved and *blocking* content authoring:
  Section 9 of `docs/specs/2026-07-03-vault-mvp-v1-spec.md`, "curated
  depth vs. full depth." That's the real decision this doc needs to close.

**What's genuinely still open (this doc's job):** is the 7-category list
right, how deep to go per era, what order to author eras in, how content
is visually laid out inside a month, and what the authoring bar is
(length, sourcing, tone) — so the content-creation phase has a spec to
build against instead of Joey freelancing 19 years of content by feel.

## Segments (carried from `feature-brief-2026-07-02.md`, unchanged)

The Vault's core audience is the **lore-diver** (wants cross-era
connections, rewatches *End of an Era*, builds era-aesthetic boards) and
the **show-going superfan** (tracks eras like chapters, cares about tour +
fashion). The content framework below is built for them specifically, not
"all Swifties" — see the 2026-07-02 brief for why that's the right
beachhead.

## 1. Is the 7-category taxonomy right?

**Recommendation: keep it, unchanged, for v1.** Checked it against how
existing Taylor Swift fan wikis organize content (Fandom's Taylor Swift
Wiki) — their real content clusters into almost exactly these buckets:
dating/relationship timelines, fashion/aesthetic per era, friendships
(folds into `relationship`), and public/career milestones (folds into
`business`/`release`). Nothing in that research surfaces a category
Joey's schema is missing. Two categories users might expect
("quotes/interviews," "awards") aren't there — parking them below rather
than adding them now (see Codex round).

**Note for content authors, not a decision:** `release` (month_item
category) and `album_release` (milestone type) overlap conceptually — a
release is both a wavetop milestone *and* likely a `release`-category
month item on the same date. That's fine (milestones are timeline
markers; month items are the content list), but the two shouldn't be
authored as duplicate/contradictory blurbs. Flag for engineering to
confirm rendering doesn't double-show the same release.

## 2. Curated vs. full depth (closes spec Section 9)

**Recommendation: Option A, curated depth — with a concrete 3-tier rubric
so "curated" isn't a matter of Joey's mood on a given day:**

| Tier | Trigger | Target items/month |
|---|---|---|
| **Wavetop** | Month contains a seeded milestone (album release, tour opening) | 5–8 items, spread across categories |
| **Active** | Real, sourceable public activity that month (major sighting, relationship news, high-profile fashion moment, notable business news) | 2–4 items |
| **Quiet** | Everything else (the majority of months, by design) | 0–1 items; UI shows the lighter "sparse month" state already specced in the engineering spec — not an empty/broken screen |

This is what the engineering spec assumes by default (Option A) so it's
not a new ask of engineering — it just turns "curated depth" into a rule
authors can apply consistently instead of an open judgment call per
month. It also directly protects the **2MB gzipped Tier-0 payload
budget** the spec gates shipping on (Section 5) — full depth (Option B)
is explicitly flagged there as the scenario most likely to blow that
budget.

## 3. Authoring order (new — not in the spec, needed before work starts)

Don't author chronologically from 2006. **Start with the eras that are
both highest fan demand and easiest to source**, then backfill:

1. **Midnights + Tortured Poets** (2022–2025) — most recent, most
   documented, matches what the lore-diver segment is actively
   discussing right now, and is the era the Eras Tour milestone lives in.
2. **reputation, Lover, 1989** — high cultural volume, well-documented,
   strong "aesthetic era" fan behavior already (see Pinterest evidence in
   the 2026-07-02 brief).
3. **folklore/evermore, Red, Speak Now** — solid documentation, slightly
   lower urgency.
4. **Fearless, debut** — least digitized coverage from that era; hardest
   to source well, least time-sensitive to ship first.

This lets a first content pass ship a *complete, dense* slice of the
Vault (not a thin coat of paint over 19 years) and gives something
demoable well before all 11 eras are done.

## 4. Content layout inside a month (frontend spec gap)

The engineering spec's acceptance criteria says a month shows items
"grouped/labelled by category" — that phrase is ambiguous and someone
will have to pick an interpretation when building the view. Marketing's
call, with rationale:

**Recommendation: one chronological list per month, each card labelled
with a small category badge (icon + color) — not hard category-grouped
sections.** Reasoning: the whole product mechanic is "browse time like a
physical timeline" (`vision.md`); splitting a month into 7 category
sub-sections breaks that narrative and turns a moment-by-moment story
into a filterable database. The badge keeps categories scannable (a
lore-diver skimming for fashion moments can still pattern-match visually)
without sacrificing the chronological read. This also matches current
UI-trend research on card-based layouts using visual hierarchy (color/
icon, not hard grouping) to keep mixed content types legible without
competing for attention.

**Concrete spec for engineering when this gets built:** category → icon +
accent treatment, e.g. 📸 sighting, 👗 fashion, 💕 relationship, 🎤 tour,
💼 business, 🎵 music, 💿 release — reuse the era's existing theme accent
color for the badge background so it stays visually coherent with the
era's morph, rather than inventing 7 new brand colors that fight the
per-era palette.

**Addendum (post-discussion with Joey, 2026-07-03):** add one opt-in
category filter, scoped per-era, off by default — not per-month chips.
It reuses the badge icon/color set as its control, and applying it hides
non-matching items in place without changing the timeline's structure or
scrubber behavior. This directly serves the lore-diver's "just show me
fashion moments" use case without adding a persistent filter row to every
one of ~230 months. Small effort (client-side filter over already-tagged,
already-resident data — no backend or payload change) but it's new scope
versus the current engineering spec's acceptance criteria and needs to be
added there explicitly, not assumed.

## 5. Editorial bar (formalizes what `_example.mjs` already implies)

The seed template already encodes real constraints via DB CHECK
constraints (snippet ≤400 chars, moment context ≤2000 chars, hotlink-only
images). Turning that into an actual style guide for whoever authors
content:

- **Snippet = a hook, not a summary.** One sentence, present-tense,
  written like a caption under a photo, not a news headline.
- **Voice (decided with Joey, 2026-07-03): fan-editor voice, third-person
  — not first-person as Taylor.** Written like a sharp, plugged-in fan
  telling another fan the tea, not a wire-service reporter and not a
  corporate copywriter. Explicitly ruled out: first-person "as Taylor"
  copy — inventing quotes and attributing them to a real person is a
  fabrication/defamation risk (the exact risk the 2026-07-02 marketing
  brief steered v1 away from with the source-credibility feature). Cut on
  sight: "In this article," "it is worth noting," "Taylor Swift, the
  American singer-songwriter," hedging qualifiers, exclamation-stacked
  hype, corporate throat-clearing. Use naturally, not forced into every
  item: era nicknames, fan shorthand, Easter-egg culture references.
  - *Bad (wire/AI voice):* "Taylor Swift was photographed wearing a
    notable outfit while attending an awards ceremony in 2019."
  - *Good (fan-editor voice):* "The butterfly jumpsuit at the 2019 VMAs —
    still the outfit people bring up first when you say 'Lover era.'"
- **Process (decided with Joey, 2026-07-03): three-stage pipeline — Claude
  drafts, Codex reviews for voice, human spot-checks.** Claude drafts each
  item against this voice guide → Codex (cross-provider, not the same
  model checking its own work) reviews specifically for AI-tells and
  voice drift — does it sound like a fan wrote it, does it hit any item
  on the "cut on sight" list above, does every claim in the snippet/
  context actually trace to what the cited source(s) support (no
  fabrication check), and does `relationship`/`business` content have
  its required second independent source — and only then does a human
  (Joey or a fan-adjacent editor) spot-check at least the first authored
  batch before scaling to all 11 eras. This mirrors the company's
  existing dual-AI cross-review model (`docs/decisions.md`,
  "Adopt dual-AI operating model" — Codex's job is to disagree, cross-
  provider review catches what self-review can't) applied to content
  instead of code. Authentic fan voice is genuinely hard for one model to
  sustain solo at volume — a failed attempt reads worse than plain
  neutral copy, so Codex's pass and the human batch check are both real
  gates, not rubber stamps.
  - **Build note:** with ~350 items expected, drafting + Codex-review
    should be a repeatable script/prompt workflow, not manually re-run by
    hand per item (per CLAUDE.md rule 8, "codify repetition") — left for
    the build phase, not decided here.
- **Sourcing minimum:** every item needs at least one `sourceUrl`.
  `relationship` and `business` items — the two categories most exposed
  to rumor/gossip risk — need **two independent outlet sources** before
  they're authored, not one. (Lower misinformation exposure than the
  now-descoped news-feed feature, since Joey is hand-authoring rather
  than ingesting live claims, but the bar should still exist.)
- **No fabrication, ever — every fact traces to a real, findable source.**
  Not a style note, a hard rule: nothing gets written — not a brand name,
  not a date, not a detail — that isn't actually reported by the linked
  source(s). If a detail can't be confirmed, it's left out, not
  guessed. (This stopped being theoretical during the W-track build:
  Orbit's `outfits`/`lore` data, originally scoped as a fast-start port
  for this content, turned out to be AI-drafted/fabricated placeholder
  data, not real history — see `docs/roadmap.md`'s "Ported from Orbit"
  section. Nothing from that source gets seeded as fact.)
- **Revised, lighter model (decided with Joey, 2026-07-03 — supersedes
  the "2–4 sentences" guidance below at first draft): link-first, not
  write-first.** The real work per item is *research* (find the best
  real source covering it, verify it isn't fan-disputed, get a second
  independent source for relationship/business) — not prose. Per item:
  - `title` + `snippet`: one short original hook (still fan-editor voice,
    still ≤400 chars) — this is the only prose that's really "written."
  - `moment.context`: **omit by default.** Only include it if a source
    reports a specific fact the snippet didn't already cover (e.g. a
    confirmed brand name) — and even then, one short line, not a
    paragraph. Most items will have `sources` + optionally `photos` in
    their `moment` and no `context` at all; the linked article carries
    the rest of the story, which is the whole point of never rehosting
    article bodies in the first place.
  - A single real-world event routinely becomes **two or more separate
    `month_item` rows**, one per category (e.g. a dinner sighting =
    one `fashion` item for the outfit, one `relationship` item for who
    she was with) — never one row blending categories.
  - *(Superseded) original guidance, kept for context:* "moment context
    is texture, not a Wikipedia paragraph — 2-4 sentences max." Replaced
    because even 2-4 original sentences per item, times ~350 items, is
    real avoidable authoring cost when the source article already tells
    the story; the app's job is curation + a good hook, not rewriting.
- **Photos are always hotlinked with credit** — already enforced by
  schema (`photos: [{url, credit}]`), just restating as an authoring
  rule so it's not discovered mid-authoring.

## Effort / impact summary

| Decision | Effort | Impact |
|---|---|---|
| Keep 7-category taxonomy as-is | S (no work, just confirm) | Unblocks nothing new to build; prevents a mid-authoring schema migration |
| Adopt curated-depth 3-tier rubric | S (doc only) | Closes the one open item actually blocking authoring; protects the payload budget gate |
| Era authoring order | S (doc only) | Ships a demoable, dense slice sooner instead of 19 years of thin coverage |
| Chronological-list + category-badge layout | S (frontend spec clarification) | Resolves an ambiguous acceptance criterion before someone builds the wrong interpretation |
| Editorial style guide + sourcing minimum | S (doc only) | Consistent authoring quality; de-risks relationship/business content specifically |
| Link-first authoring model (2026-07-03 revision) | S (doc only) | Cuts real per-item authoring cost — research + a one-line hook instead of original paragraphs, across ~350 items |

Nothing here is runtime-cost-relevant — this is all static, repo-authored
content per the existing architecture (zero LLM calls, per
`architecture.md`'s AI-integration section). No new decision-log entry
needed on that front.

## Codex adversarial-review round

Ran one challenge round (14 findings). Two rebutted, twelve accepted and
folded into the sections above/below.

**Rebutted (2):** Codex claimed the schema/seed data "doesn't exist yet,"
quoting the MVP spec's "nothing exists yet beyond `hello-swifties.html`"
line. That line is now stale — it predates `feature/vault-foundation`
(PR #14, commit `e63994a`, "Vault data contract + schema + Orbit era
content port"). Verified directly by reading
`supabase/migrations/20260703190000_vault_init.sql` and
`supabase/seed/eras-data.mjs` on disk just now: the 7-category CHECK
constraint and the 11 real (non-placeholder) eras + milestones both exist
in the repo today. Codex was reasoning from a doc instead of checking the
file — the irony of an adversarial-review pass isn't lost on us. Flagging
separately that the spec doc itself needs a one-line update so it stops
misleading the next reader.

**Accepted (12), folded in above:**
- Research basis for "taxonomy is fine" was thin — reworded to a
  disclosed light pass, not a settled competitive audit.
- "Awards" / "interviews" can't just be "parked" vaguely — **explicit
  call: out of scope for v1 content authoring**, not a category gap to
  revisit later unless a specific era's authoring hits a wall without
  them.
- The 3-tier depth rubric was too subjective — added a concrete test per
  tier below.
- "5–8 items" for wavetop months read as a fill quota — reworded as a
  ceiling, explicitly: never pad for category balance.
- "Sparse month" language implied a new UI state beyond what the spec
  already requires — reworded to cite the existing spec behavior only.
- The payload-budget claim ("directly protects") had no math behind it —
  added a rough order-of-magnitude estimate below.
- "Highest fan demand" for Midnights/TTPD was asserted as market fact —
  reframed as an authoring hypothesis (recency → source availability +
  demo relevance), not a demand claim.
- Authoring order needed a stated minimum bar for what "done enough to
  ship v1" means, not just a demo-order preference — added below.
- The chronological-vs-grouped layout call cited unsupported "UI trend
  research" as if it settled the question — dropped that as evidence,
  kept the mechanic-based rationale, and added a cheap fallback (a
  category filter chip) if user testing says people want to filter.
- Category badges inheriting the era's accent color contradicted the
  stated goal of making categories visually scannable — fixed: category
  is signaled by icon + label (primary) plus a small **fixed 7-color
  chip set** (secondary, consistent across eras), not the era accent.
- "Two independent outlet sources" for relationship/business was
  undefined — added acceptable/unacceptable source classes below.
- "Hotlinked with credit" was stated as if credit = legal clearance —
  corrected: credit is editorial attribution, not a license; hotlinking
  (never rehosting) is what `architecture.md` actually relies on for risk
  mitigation.

### Revised depth rubric (post-Codex)

| Tier | Trigger | Item ceiling | Test |
|---|---|---|---|
| **Wavetop** | Month contains a seeded milestone | up to 5–8, never padded for category balance | Would this item independently clear the "Active" bar on its own? |
| **Active** | Real activity that month | 2–4 | Would this have appeared in a mainstream entertainment outlet or a fan-community roundup within a week of happening? |
| **Quiet** | Everything else | 0–1 | Default — uses the spec's existing sparse-month behavior (Section 2), not a new UI state |

**Rough payload sanity check:** ~230 months across 11 eras, curated-depth
average of ~1.5 items/month (most months are Quiet) ≈ ~350 Tier-0 rows.
At roughly 150–250 bytes/row for title+snippet+date+category+URLs, that's
well under 100KB uncompressed for Tier 0 text — nowhere near the 2MB
gzipped budget gate. (Thumbnail URLs are strings, not image bytes, so
they don't change this math.) This is a sanity check, not a substitute
for the spec's required real-content measurement before ship.

**Sourcing bar, defined:** acceptable = named entertainment/news outlets,
official statements (label, venue, brand), verified journalist bylines.
Not acceptable alone: anonymous gossip accounts, unverified social posts,
a single paparazzi agency wire with no outlet reporting on it.
"Independent" = two different outlets/bylines, not two re-syndications of
the same wire story.

**Ship-readiness bar (new, closes Codex finding #10):** v1 does not
require all 11 eras at full curated depth before shipping, but it does
require every era to have **all of its wavetop months populated** before
the Vault ships publicly — a user landing on any era should never find a
milestone month with zero content. Non-wavetop "Active" months can ship
incrementally era-by-era after that bar is met.

## Verdict

1. **Adopt the revised curated-depth 3-tier rubric above as the answer to
   spec Section 9**, with the ship-readiness bar (all wavetop months
   populated, every era, before public launch) as the actual finish line
   — not "all 11 eras fully authored." Start authoring with Midnights/TTPD
   first as a hypothesis about source availability and demo value, not an
   asserted demand claim.
2. **Lock the month layout as one chronological list with icon+label
   category badges (fixed 7-color chip set, not era-accent-dependent),
   not category-grouped sections — plus one opt-in category filter,
   applied per-era, off by default.** Tapping it hides non-matching items
   in place (same scrubber, same chronological order, no re-layout); it
   reuses the badge icon/color set so it's the same visual language, not
   a new one. This answers "what if someone just wants to see fashion"
   without cluttering every month with 7 filter chips — decided with
   Joey 2026-07-03. Needs to be written into acceptance criteria when
   this view gets built; it's not in the current engineering spec.
3. **Ship the editorial style guide as written**: snippet-as-hook,
   2-independent-source minimum on relationship/business with defined
   source classes, hotlink+credit always (credit = attribution, not legal
   clearance), and awards/interviews explicitly out of scope for v1
   authoring.
