# Content Review — 2026-07-04

Prepared by: Marketing dept (Claude, with Codex independent audit).
Focus, from Joey: "please review all of the recently created content and
provide feedback." Adapted from the standard `/marketing` template — this
isn't a "what feature should we build next" brief, it's a quality audit of
the 40 Vault items authored this session (PR #38, not yet merged), across
all 11 eras.

## What's actually good here, first

Before the findings below read as "this went badly" — it didn't. Every one
of the 40 items is real and independently verified against a live source,
not fabricated or trusted from a search summary. The relationship/private-
life exclusion held across the entire batch — Dear John, All Too Well,
Fortnight, and Now That We Don't Talk all cover real, well-documented song
content without ever naming who a theory points to. Multiple real errors
(wrong dates, misattributed outfits, stale superlatives, wrong attendance
figures) got caught and fixed before shipping, not after. The pipeline
(research → draft → Codex review → fix) worked as designed. The problems
below are about shape and balance, not fabrication or safety.

## Findings

Codex independently audited all 11 files against three hypotheses I'd
already formed from my own read-through, plus an open-ended pass. All
three were confirmed; two more surfaced that I'd missed.

### 1. Category imbalance — the content doesn't match the vision yet (High)

Actual counts across all 40 items: **business 16, music 16, tour 8,
fashion 1, sighting 0, relationship 0, release 0.**

`docs/vision.md` promises "where Taylor traveled, where she was spotted,
what her fashion choices were... who she was dating." What actually got
built is overwhelmingly chart records and song-meaning notes. Zero items
tell you where she was spotted. One item, total, is about what she wore.

**Why this happened, and it's a real structural bias, not an accident:**
chart/business facts are the easiest content in existence to double-source
cleanly — Billboard, Forbes, and Variety cover every chart record in
exhaustive, uncontroversial detail. Fashion and sighting content is
genuinely harder to source safely (I hit this early: several fashion leads
turned out to be vague, unverifiable, or outright fabricated in the Orbit
candidate data). The authoring process, under real time pressure, kept
reaching for the safe/easy category instead of the categories that
actually make the Vault feel like "being in the era" rather than reading
a chart database.

### 2. Sourcing rigor regressed partway through the session (High)

Four items — `fearless.mjs` ("youngest Album of the Year winner"),
`speak-now.mjs` ("sells over a million copies"), `red.mjs` ("sells 1.2
million copies"), and `folklore.mjs` ("first artist to top both charts") —
each pair Wikipedia with only one real outlet. Partway through the
session, a stricter standard got applied (visible in `evermore.mjs`'s file
comments): Wikipedia doesn't count as one of the two independent outlets
the framework requires for `business` items. That stricter standard got
applied going forward but was never retroactively run back across the
earlier four eras. `evermore.mjs` itself still carries one explicitly-
flagged compromise (a label press release as the second source, after
three real outlets all hit paywalls) — a documented exception, not the
same problem, but worth knowing about too.

### 3. Tier 0/Tier 1 architecture isn't being used as designed (High)

Only one item in the entire batch — Anti-Hero, in `midnights.mjs` — uses
the `moment.context` field. Every other item leaves it empty and puts its
full informational payload in the top-level `snippet`, which is the field
that's always resident in the lightweight Tier-0 payload the whole app
loads up front. The architecture exists specifically so Tier 0 stays small
and Tier 1 (loaded only when a user taps in) can carry the richer detail.
Right now, tapping into most items reveals nothing new — the snippet
already said everything. At ~40 items this isn't a real payload-budget
risk yet, but the pattern doesn't hold up at the ~350-item scale the
project is authoring toward, and it undersells the "tap for more" UX the
engineering spec promises.

### 4. Several snippets read as chart blurbs, not fan-editor hooks (Medium)

Related to #3: because meaning/background content has nowhere else to go,
snippets like Fearless's Grammy item or 1989's sales item pack two full
clauses of numbers and context into what's supposed to be a "caption
under a photo." It's not wrong information, but it's the wire-service
voice the framework explicitly tries to avoid, and it makes eras
tonally blur together — a reader can't tell Fearless's voice from
1989's voice from the numbers alone.

### 5. Era depth is uneven (Medium)

Midnights has 10 items; debut has 1. Some of that is legitimate — Midnights
absorbs three Taylor's Version re-releases and the Eras Tour by actual
release date, so it's genuinely a busier stretch of calendar time. But as
a first impression of the finished product, recent eras will feel alive
and mid-career eras will feel skeletal, which isn't really about
"curated depth," it's about which eras got a smaller research budget
before time ran out.

### 6. The `release` category has never been used (Low/Nit)

Every album-release wavetop month gets covered via `business` (chart
records) instead. Might be intentional — the milestone table already
marks releases as timeline anchors — but it means that content path has
never actually been exercised, and nobody's confirmed the app renders it
correctly.

## Verdict

1. **Fix the 4 sourcing violations first — it's small and it's an
   integrity issue, not a taste issue.** Fearless, Speak Now, Red, and
   folklore's flagged business items each need a second real outlet
   swapped in for Wikipedia, the same fix already applied to every later
   era. Contained, fast, no new research required beyond finding one
   replacement source per item.
2. **Restructure the snippet/`moment.context` split across all music
   items before authoring any more content.** Snippets get cut down to
   an actual one-sentence hook; the meaning/background material that's
   currently living in the snippet moves into `moment.context`, which is
   the field it was designed for. This is a rework pass on ~15 existing
   items, not new research — the facts are already verified, just
   misplaced.
3. **Before adding more chart/business items to any era, prioritize
   sighting and fashion content specifically, even though it's harder to
   source.** This is the actual gap between what got built and what the
   product promises. It's slower and will produce fewer items per hour
   of research than chart records did — that's the trade to make on
   purpose, not a sign something's going wrong.

---

## For Joey

**The headline: nothing here is fabricated or unsafe — it's a shape
problem, not a trust problem.** Every fact is real and sourced; the
relationship-exclusion line held everywhere. The issue is that the
content leans hard into chart records and song trivia because those were
the easiest things to verify quickly, and light on the fashion/sighting
content your original vision actually leads with.

**The three fixes, in order:**
1. Four items need a source swap (Wikipedia was standing in as one of two
   required independent outlets — fixed everywhere else, missed in four
   older eras).
2. ~15 music items have their "meaning" content sitting in the wrong
   field — an architecture fix, not a content fix, that makes the "tap
   for more" experience actually deliver something.
3. Going forward, deliberately slow down on chart records and spend more
   research time finding safely-sourceable fashion/sighting moments,
   since that's the actual differentiator the vision describes and it's
   currently almost entirely missing.

**Not asking a 50/50 question here — this is a quality bar call, not a
product-direction call.** PR #38 is still open and unmerged, so all of
this is fixable before anything ships.

**Should I go ahead and make these three fixes now, or do you want to
merge the current batch as a "v1 pass" and treat this as a backlog for
the next content session?**
