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

## Addendum 2026-07-04 — Joey's pushback: "why not front-load everything, we can spend tons of tokens"

Joey pushed back on the Option B rejection above: if AI authoring is cheap
and plentiful, what's the actual downside of just running full depth
across all 11 eras right now instead of gating on a 2-era slice plus a
fragile weekly-marketing promise? Worth taking seriously rather than
re-asserting the prior verdict — and it partially changes the
recommendation.

**One real objection from the prior verdict doesn't survive this
pushback.** The Option B rejection leaned on "defers all launch value
behind one large, single-shot authoring push, with nothing shippable in
between." That's not actually true: `supabase/seed/content/` is one file
per era, owned independently (`docs/roadmap.md`'s CONTENT lane), so a
full-depth pass doesn't have to be one 11-era batch that blocks launch
until all of it clears. Each era can be deepened and shipped as soon as
*its own* file clears Codex review + Joey's spot-check, in parallel,
regardless of how many other eras are still in progress. Retracting that
part of the prior argument — it was wrong.

**Two objections that tokens genuinely cannot buy their way past:**

1. **Tokens don't create real sources.** The job here isn't "generate
   more text" — it's "find a real, dated, independently-corroborated fact
   about a specific living person, for a specific month." No amount of
   compute manufactures a verifiable sighting or relationship event in a
   month where nothing public happened; that's exactly why the framework's
   3-tier rubric has a "Quiet" tier (0-1 items) *by design*, not as an
   authoring shortfall. Pointing more tokens at a real-source vacuum
   doesn't produce more real content — it produces pressure to either
   lower the sourcing bar or pad low-value items to hit a volume target.
   Both are already-observed failure modes, not hypothetical ones: 4 of
   the current 100 items downgraded to a single-source Wikipedia citation
   under time pressure in the exact session that produced them
   (`content-review-2026-07-04.md`), and the framework doc had to add an
   explicit "never pad for category balance" rule after Codex caught an
   earlier draft implying a fill quota. More volume, pushed faster,
   recreates the conditions that already caused both problems once.
2. **Joey's own review time is the one part of this pipeline that doesn't
   scale with compute.** The three-stage pipeline — Claude drafts, Codex
   fact-checks for voice/fabrication, **Joey spot-checks at least the
   first authored batch** — is a locked decision
   (`content-framework-2026-07-03.md`), not a suggestion, specifically
   because unsupervised AI content about a real person is the fabrication/
   defamation risk this whole project has repeatedly steered away from
   (Orbit's AI-drafted `outfits`/`lore` data turned out to be fabricated
   placeholder history — `docs/roadmap.md`'s "Ported from Orbit" section
   is the cautionary tale already living in this repo). Spending more
   tokens produces more drafts arriving in Joey's personal review queue
   faster than he can personally clear it — it does not produce more of
   *his* hours. A 5-10x volume increase means a 5-10x backlog behind the
   one non-AI step in the pipeline, not a 5-10x faster ship.

**A related, more precise correction on "we can spend tons of tokens" as
stated:** it isn't literally unconstrained even on Max. CLAUDE.md's own
cost model says the scarce resource on Max is the **rate-limit window**,
not dollars — running many eras' research+drafting at once still means
sequencing heavy jobs across windows, not an unlimited simultaneous
push. If the intent is to route around that by using API capacity
instead, dollars scale with tokens directly on that path, which is the
exact cost CLAUDE.md's Console-cap discipline exists to keep visible —
not a reason not to do it, just a reason not to treat it as free.

**Revised recommendation, given the file-boundary point above:** drop the
"2 flagship eras, then a fragile 9-week external-marketing promise"
structure in favor of **a parallelized, category-weighted full-depth push
across as many eras as Joey can realistically review before launch** —
running research/authoring on multiple eras concurrently (each is an
independent file), explicitly weighted toward `relationship`/`sighting`/
`fashion` (not more `business`/`music`, which is where undirected volume
would default), with each era shipping the moment it individually clears
review. **The pace-setting constraint is Joey's review throughput and
real source availability, not tokens or eras-in-flight.** If his review
bandwidth can keep up, this could plausibly clear most or all 11 eras
before launch, genuinely removing the need for a post-launch weekly-drop
marketing dependency. If it can't keep up with all 11 before he wants to
ship, whatever's left over falls back to the original Option C
structure — wavetop floor + a public weekly cadence — with the same
fragility caveat already on record: that cadence only produces retention
if Joey actually sustains the external announcement, not just the
authoring.

### Codex adversarial-review round (this addendum)

Ran a second round, focused on this addendum specifically: whether the
"tokens can't buy sources/review time" argument holds, whether the
retracted "one big batch" objection was correctly retracted, and whether
the revised parallelized recommendation is actually different from
Option B in substance or just in name. Verdict: needs-attention, two
findings, both accepted:

1. **(High) The first draft of this addendum's "revised verdict" wasn't
   an actual ship bar.** It said all 11 eras get full-depth authoring,
   then let any era that didn't clear in time ship at the wavetop floor
   anyway under the Option C fallback — which means nothing was actually
   required to clear before launch, and the doc gave no way to know when
   to stop waiting on more eras versus ship. *Accepted* — rewritten below
   as a fixed, checkable minimum gate (unchanged from the pre-addendum
   verdict) with parallel full-depth work as additive upside on top of
   it, not a replacement for it.
2. **(Medium) Superseding language in this file wasn't backed by an
   actual update to `docs/decisions.md`/`docs/roadmap.md` in the same
   change.** Per CLAUDE.md, the decision log is the source of truth, and
   leaving it un-synced would hand the next CONTENT session two
   conflicting sets of instructions. *Accepted* — decisions.md and
   roadmap.md updated in this same commit, below.

### Revised verdict (refines, does not lower, the Option C verdict above)

**Ship bar is unchanged at the floor: wavetop for all 11 eras (met) +
Midnights and Tortured Poets at Active-tier depth, weighted toward
`relationship`/`sighting`/`fashion`.** That minimum still gates launch —
Joey's pushback didn't produce a reason to lower it. **What changes is
how the work beyond that floor happens:** instead of treating "2 eras
deep, then a 9-week weekly-marketing-drop plan" as the whole plan, run
category-weighted full-depth authoring on additional eras **in parallel**
right now — each era is an independently owned file
(`supabase/seed/content/<era>.mjs`), so there's no reason to wait on all
11 together, and no reason to cap the parallel work at exactly 2. Any
era that clears Codex review + Joey's spot-check before the ship date
ships with full depth at launch; any era that doesn't falls back to the
already-decided wavetop-plus-weekly-drop plan, unchanged. **This is
strictly additive to the existing gate, not a substitute for it** — it
cannot make the launch bar lower or later, only make more eras arrive
deep instead of thin.

**The one real next step this surfaces:** nobody has ever timed Joey's
spot-check step per item or per era, so there's no actual basis for
predicting how many eras "as much parallel work as possible" will
realistically clear before the ship date. Recommend timing his review
throughput on the very next batch (Midnights or Tortured Poets, whichever
goes first) before assuming more than 2 eras can be committed to
pre-launch — that number, not token budget, is the real constraint on how
far this can scale.

**What actually changed from the prior verdict, plainly:** the token-cost
objection to running more eras in parallel was wrong — Max's constraint
is a rate-limit window, not a token budget, and eras ship independently,
so there was never a reason to cap parallel authoring at exactly 2. What
didn't change: no amount of AI effort creates real sources for months
where nothing happened, Joey's personal review time is still the one
step in this pipeline that scales with his hours and not with compute,
and the launch gate itself (wavetop + 2 named eras deep) stays exactly
where it was.

