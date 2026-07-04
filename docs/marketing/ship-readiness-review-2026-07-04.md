# Ship-Readiness Bar Review — 2026-07-04

Prepared by: Marketing dept (Claude, with Codex adversarial review).
Human focus, from Joey: challenging the wavetop-only ship bar locked in
`docs/marketing/content-framework-2026-07-03.md`. His argument: v1 has no
notifications and no news feed (`docs/decisions.md`, 2026-07-03), so
unexplored content depth is the *only* retention mechanic this product has.
If a user can exhaust the content in one session, they never come back — so
v1 needs a complete content set at launch. Asked to pressure-test that
against the current bar and a third option: ship 2-3 eras at full curated
depth, then release the rest as scheduled weekly "era drops."

## Where the product actually is today (grounded in the repo, not assumed)

The wavetop-only bar this doc is reviewing was met the same day it was
written: `c6990e0` ("content: complete wavetop-month coverage for all 11
eras," #38) merged 100 items across all 11 eras, evenly spread (8-13 per
era). Measured directly from `supabase/seed/content/*.mjs` just now:

| category | count |
|---|---|
| music | 42 |
| business | 28 |
| fashion | 11 |
| tour | 9 |
| release | 8 |
| sighting | 2 |
| relationship | 0 |

Half the items now use `moment.context` (Tier 1) rather than dumping
everything into the Tier-0 `snippet` — a real improvement over the 1-of-40
figure `docs/marketing/content-review-2026-07-04.md` flagged, so the team
acted on that review before merging. **What hasn't changed: `relationship`
is still zero items, and `sighting` is still nearly zero (2).** `vision.md`
explicitly promises "where she was spotted... who she was dating" as core
content pillars — right now the archive cannot deliver on either sentence.
This matters independently of the depth-vs-breadth question below: it's a
category gap, not a depth gap, and no ship-bar decision fixes it by itself.

**A technical correction to the framework's own reasoning, found while
grounding this review:** `docs/marketing/content-framework-2026-07-03.md`
justified curated depth partly on payload risk ("full depth... is
explicitly flagged [as] the scenario most likely to blow that budget").
`docs/roadmap.md`'s W6 status line records the actual measurement: 100
items = **0.6%** of the 2MB gzipped Tier-0 budget — current seed data is
far under the gate, so panic about the *existing* corpus blowing the
budget isn't warranted. **That's as far as this measurement goes.** It
does not establish that a full-depth corpus is technically safe: the
spec's gate is both ≤2MB gzipped *and* ≤10MB parsed in memory, measured
against real seed content, not a linear projection — and the categories
this doc later recommends prioritizing (relationship, sighting, fashion)
are exactly the ones with near-zero representation today, so their real
per-item weight (longer contexts, more sources/photos) is unmeasured.
Before payload is used as an argument for *or against* full depth, engine
track should generate a representative full-depth fixture and measure
both numbers against it — this doc isn't that measurement, and doesn't
claim to be.

## Joey's argument, taken seriously

The core claim is correct and not new information forcing a reframe of
something already well understood: v1 is genuinely different from typical
content apps in that there is no mechanism — no push notification, no
feed algorithm, no email — to pull a lapsed user back in. That was a
deliberate, approved scope cut (`docs/decisions.md`, 2026-07-03), not an
oversight, but it does mean this app's only paths back into a user's week
are (a) the content itself is deep enough that one browse doesn't finish
it, or (b) something external — social, word of mouth — reminds them to
come back. A wavetop-only archive (100 items across 19 years) is
browsable by an engaged lore-diver in well under an hour. That is a real
exhaustion risk, and it is sharper here than in a typical content app
specifically because there's no notification system to paper over it.

Where the argument needs pressure: "we need a complete content set" treats
completeness as a single finish line. It isn't one. Taylor's public life
is a moving target — full depth for 19 years and counting is not a
scope that finishes, it's a scope that keeps growing, and "complete" for a
living person's ongoing career has no natural stopping point the way a
fixed feature spec does.

## Option A — current bar: wavetop-only, ship now

**What it is:** already met. All 11 eras have their milestone months
populated; everything else is "quiet" (0-1 items) by the framework's own
3-tier rubric.

**For:** fastest possible ship, zero incremental authoring cost, matches
the original engineering spec's default (Section 9, Option A).

**Against:** this is the weakest retention story of the three, and Joey's
diagnosis of why is correct — 100 items with zero notifications is a
first-session-exhaustion risk with no built-in recovery. It also ships
with real category gaps still open (relationship=0, sighting=2) that
undercut vision.md's own pitch on day one, independent of the depth
argument.

## Option B — Joey's ask: full depth, all 11 eras, before launch

**What it is:** every month of every era populated to a consistent
standard (the spec's own "Option B," Section 9) — not just milestones,
the "Active" and "Quiet" tiers filled in everywhere before anyone sees v1.

**For:** genuinely solves the exhaustion problem the way the argument
frames it — nothing left half-built for an early user to notice.

**Sized properly, bounded to today (not "infinite"):** Codex correctly
pushed back on an earlier draft of this doc that rejected Option B as
"unbounded scope." That's not quite right — bounded to the archive as it
exists today (not a moving target), Option B is really: go from the
current 100 items (wavetop-only) to something like the **~350 items**
`content-framework-2026-07-03.md`'s own sanity check already estimated
for full curated depth across all 11 eras (its 3-tier rubric applied
everywhere, not just milestone months) — a real, boundable **~3.5x**
jump from what exists now, not an infinite one.

**Against, sized honestly rather than dismissed as infinite:**
- **That ~3.5x jump is concentrated in exactly the categories already
  shown to be slow.** The review found fashion/sighting content
  "genuinely harder to source safely" than business/music, and this doc's
  own category count (relationship 0, sighting 2) shows those categories
  barely exist yet. The remaining ~250 items needed for Option B skew
  hard toward the slowest-to-author material, not an even mix.
- **Compounds an already-open quality-debt problem instead of fixing it
  first.** `content-review-2026-07-04.md` found real issues in the
  *existing* 100 items (sourcing rigor regressed in 4 items, category
  imbalance, Tier 0/1 misuse) — some fixed since, some not. Multiplying
  the corpus ~3.5x before those systemic issues are fully closed out
  multiplies the debt surface, not just the content.
- **It defers all launch value behind one large, single-shot authoring
  push, with nothing shippable in between.** Every other track in this
  project ships incrementally (W3 → W4 → W4.5 → W5, each a real
  merge) rather than holding everything until one large batch clears.
  Option B is the one track that would break that pattern — not because
  the total work is unbounded, but because none of the ~250-item delta
  is separable into an earlier, smaller ship.
- Ongoing career growth (new eras, new events) is a real *separate* cost
  that continues after any full-depth bar is hit, but it's a post-launch
  maintenance question, not the reason to reject Option B as a launch
  bar — the launch-sizing argument above stands on its own.

## Option C — 2-3 eras at full depth, then weekly "era drops"

**What it is:** bring a small number of flagship eras to true Active-tier
depth (not just wavetop) before public launch; ship the remaining eras at
the current wavetop bar (already true today); deepen the rest on a
publicly announced weekly cadence after launch, each one framed as a
release moment.

**Being precise about what actually does the retention work here, per
Codex's challenge — this is not a product retention mechanic by itself,
and shouldn't be sold as one.** v1 has no notification system, no email,
no feed, and (deliberately, per the design consideration below) no
in-app countdown/locked-era surface either. That means there is no
mechanism *inside the product* that tells a lapsed user a new drop
happened. If nothing outside the app announces it, a weekly backend
deepening is retention-equivalent to Option A: real work, invisible to
anyone who isn't already mid-session. **The entire retention value of
Option C is conditional on one explicit, named commitment: Joey posts
externally (social) on a real weekly cadence, naming what changed and
where to look.** That is a marketing-operations commitment, not a content
or engineering one, and it needs to be evaluated as such — not assumed
free because the authoring happens anyway.

**What happens if that commitment breaks:** a missed week isn't neutral —
it's worse than never promising a cadence, because it trains anyone who
did notice the pattern that the promise doesn't hold. If Joey isn't
confident he'll sustain weekly public posts for however many weeks the
remaining 9 eras take, Option C collapses to Option A's retention
profile plus extra pre-launch authoring cost with no offsetting benefit —
in that case Option A is the more honest choice. This doc cannot make
that operational call for him; it can only make the dependency explicit
instead of glossing over it, which the first draft of this section did
not do clearly enough.

**Which eras first:** recommend Midnights + Tortured Poets, for the same
reason `content-framework-2026-07-03.md` already gave for authoring order
(most recent, best-documented, matches current fan conversation) — not a
new argument, reapplying an existing one. When deepening them, prioritize
`relationship`, `sighting`, and `fashion` specifically — the categories
already proven hardest to source and currently at 0/2/11 — rather than
adding more `business`/`music` content, which is already over-represented
relative to vision.md's stated pillars.

**In-app discovery, kept deliberately out of scope here:** the simplest
version of this option needs no new UI at all — a returning user (brought
back by an external post) just finds more content than they remembered.
A locked/countdown "coming soon" surface would also cut against
vision.md's "browse the whole time machine" promise by hiding parts of
the archive. If Wyatt later wants a lighter in-app signal (a "recently
added" marker, say), that's a small, separate scope decision for the
engine track — not proposed or assumed here.

**Remaining open dependency, stated plainly:** this project has a real
target ship window ("ship by Taylor's wedding," `docs/roadmap.md`) that
this doc doesn't have enough information to check the 2-3-era timeline
delta against — Joey/Wyatt should size that against actual authoring
velocity, not this doc's estimate.

## Codex adversarial-review round

Ran one adversarial round against the pre-review draft, focused on whether
Option C's retention logic holds without a notification system, whether
the payload-budget correction was accurate, and whether Option B was
being unfairly dismissed. Verdict came back "needs-attention," three
findings, all accepted:

1. **(High) Option C's retention mechanism depended on an unresolved
   discovery channel.** The draft claimed a weekly drop schedule "answers"
   retention without saying who tells users it happened. *Fixed*: rewrote
   the section to state plainly that the entire retention value is
   conditional on Joey sustaining real weekly external posts — not a
   product mechanism, a marketing-operations commitment — and to say
   explicitly that a broken cadence is worse than no cadence.
2. **(Medium) The payload-budget correction over-extrapolated.** The
   draft turned "100 items = 0.6% of gzipped budget" into a hard
   15,000-16,000-item ceiling, ignoring the parsed-memory gate and that
   the measurement doesn't cover the (currently near-empty)
   relationship/sighting/fashion categories this doc recommends growing.
   *Fixed*: narrowed the claim to "current seed data is far under the
   gate," dropped the projected ceiling, and added that a real full-depth
   fixture measurement (both gzipped and parsed) is required before
   payload can be used as evidence either way.
3. **(Medium) Option B was dismissed as "unbounded" in a way that didn't
   match the actual launch decision.** Bounded to today's archive rather
   than treated as an ongoing-maintenance problem, Option B has a real
   size: ~350 items total per the framework's own curated-depth estimate,
   a ~3.5x jump from the current 100. *Fixed*: reframed the rejection
   around that sized delta (concentrated in the slowest-to-source
   categories, deferring all launch value behind one large batch with
   nothing shippable in between) rather than an open-ended "it never
   finishes" argument, and split out ongoing career growth as a separate,
   secondary post-launch cost.

No findings were rebutted this round — all three identified real gaps in
the reasoning, not disagreements with the underlying facts.

## Verdict

**Recommended ship bar: Option C.** Ship v1 with all 11 eras at the
current wavetop bar (already met, no rework needed) plus **Midnights and
Tortured Poets brought to true Active-tier depth before public launch**,
with that depth work deliberately weighted toward `relationship`,
`sighting`, and `fashion` — the three categories vision.md promises and
the archive currently can't deliver (0, 2, and 11 items respectively).
The remaining 9 eras ship at the wavetop bar and deepen on a public
weekly cadence after launch.

**The retention logic, stated at the strength Codex's review left it:**
this is not a self-executing product mechanic. v1's lack of notifications
means the app itself cannot tell a lapsed user anything happened. Option
C's entire retention advantage over Option A depends on one explicit,
named commitment — **Joey posts externally, on a real weekly cadence,
naming what changed** — for as many weeks as the remaining 9 eras take.
If that commitment isn't one Joey is confident he'll sustain, Option C
provides no retention benefit over Option A and should not be chosen
just to look more thorough. That commitment is the actual product
question underneath this ship-bar decision, and it's Joey's to make, not
this doc's.

**Timeline impact:** slower than shipping the wavetop bar today (Option
A), by however long it takes to bring 2 eras from wavetop (~9 items each)
to Active-tier depth concentrated on the hardest-to-source categories —
a real, bounded delta, not the ~3.5x, nothing-shippable-in-between delay
Option B would require. This doc doesn't have enough authoring-velocity
data to convert that into calendar weeks against the "ship by Taylor's
wedding" target in `docs/roadmap.md` — that sizing call belongs to
Joey/Wyatt, not this analysis.

