# Feature Brief — 2026-07-04

Prepared by: Marketing dept (Claude, with Codex adversarial review).
Human focus, from Joey (relaying feedback from Swiftie friends): (1) Taylor's
own official site has an archive section now — we need to differentiate hard
while covering the same ground; (2) our biggest edge could be *depth* —
explaining song meanings/Easter eggs, tracing how fashion evolved, explaining
why a piece of news matters; (3) an idea from Orbit called a "clown bot" — an
AI companion trained on Easter eggs/theories that lets fans submit and track
their own theories, tells them how novel an idea is, and notifies them when
someone builds on a theory they're invested in.

## Where the product actually is today

Confirmed by reading the repo and git history, not assuming: the Vault is
real and running. `docs/roadmap.md` shows W0–W3, W4.5, and W6 merged; W4 (the
scrubber gesture layer) is in review; two eras have real, sourced content
(Midnights: 7 items across Oct 2022 + Mar 2023; Tortured Poets: 2 items,
Apr 2024) authored under the pipeline locked in
`docs/marketing/content-framework-2026-07-03.md` (Claude drafts → Codex
fact-checks → Joey spot-checks). 9 of 11 eras still have zero real content.
This brief is written for a team mid-build on v1, not a pre-MVP company —
the question isn't "what do we build first," it's "what does the content
*need to become* to actually beat the alternatives," which is exactly what
Joey's focus question asks.

## Market research (answering the three discussion points)

**1. Taylor's own site now has an archive.** `tserasarchive.taylorswift.com`
lets fans click era "slices" to reach behind-the-scenes clips, music, and
live-performance video for that era — confirmed directly by fetching
`taylorswift.com/swiftiearchive`. (A launch-date claim from an earlier draft
of this brief, sourced to a Threads post, couldn't be independently verified
— dropped rather than asserted.) It's real, official, and well-produced —
and it is exactly what an official brand site *should* be: curated highlight
reels, no day-by-day browsing, no explanation of why anything matters, no
analysis, no theory-crafting. It cannot editorialize or speculate — it's
Taylor's own PR channel. That gap (analysis, dated granularity, "why") is
space our Vault already occupies structurally and doesn't yet fill
editorially. [taylorswift.com/swiftiearchive](https://www.taylorswift.com/swiftiearchive/)

**2. There's visible publisher supply of Easter-egg content — demand for a
timeline-native version is a hypothesis, not yet validated.** Fan media
outlets run recurring "Easter egg guide" roundups (capital-letter liner-note
codes, numerology, color coding, character-naming, styling hints) as
evergreen content.
[Marie Claire](https://www.marieclaire.com/culture/music/best-taylor-swift-easter-eggs/),
[Nylon](https://www.nylon.com/entertainment/taylor-swift-easter-eggs-motifs-betty-lore-guide),
[Biography.com](https://www.biography.com/musicians/g65783972/taylor-swift-easter-eggs),
[Today.com](https://www.today.com/popculture/music/taylor-swift-easter-eggs-hidden-messages-rcna51887).
That proves publishers believe there's an audience for this content, not
that fans are underserved or want it inside a dated timeline specifically —
worth being honest about the gap between "supply exists" and "our specific
angle wins." None of these are dated/browsable inside a timeline the way our
Vault is; that structural angle is still untested, not proven.

**3. The "clown bot" concept has adjacent prior art, not validation, and one
real risk worth taking seriously.** A Character.AI-style "Taylor Swift AI"
chatbot already exists (Questie AI), marketed on being "Easter-egg-aware."
[Questie AI](https://www.questie.ai/character-ai-chat/taylor-swift-ai). That
shows a vendor believes there's appetite for celebrity-AI roleplay — it does
not validate Joey's specific idea (user-submitted theories, novelty scoring,
theory storage, cross-user notifications), which nothing found in this
research has built. The real risk signal: Taylor's own camp has already
faced public accusations of using undisclosed AI in a recent promotional
campaign ([Newsweek](https://www.newsweek.com/entertainment/music/taylor-swift-accused-using-ai-viral-videos-10830988)) —
AI-generated content *about* Taylor is already a live public sensitivity,
not a hypothetical one. (An academic-paper citation on "conspiratorial
participatory practices" in an earlier draft of this brief could not be
verified — the source returned an access error on direct check — dropped
rather than asserted.) The underlying concern stands on its own without that
citation: a tool that archives and lends legitimacy to fan speculation about
a real person's private life is the same defamation/hallucination risk
category the 2026-07-02 brief already steered the company away from with the
"verdict machine" news feature — just aimed at theories instead of news.

1. **Comprehensive, source-gated song annotation (revised twice: Codex
   pushed "blanket deep-dive" to "selective"; Joey then pushed back on
   "selective" as underselling how well-documented Taylor's catalog
   actually is — see Addendum below).** The rule that survives both rounds:
   cover a song's meaning/background/Easter eggs whenever a real, findable
   source exists (Taylor's own commentary, credible music journalism,
   well-corroborated fan-research culture) — aim for full catalog coverage
   over time, not a curated subset — but never invent to fill a gap when a
   source genuinely doesn't exist. The content framework's "hooks by
   default" rule still governs *length* (a sourced line, not an essay); it
   no longer governs *how many songs* get covered. Serves the lore-diver —
   this is the real differentiator vs. Taylor's own archive, which explains
   nothing. Effort: **M**, and larger than originally scoped — see the
   Addendum for why this now needs an engineering-side content-shape
   decision before full-catalog authoring starts. Runtime cost: zero.
2. **Fashion style-evolution threads — parked, not scoped now.** Connecting
   looks across eras/time is a real idea but premature: 9 of 11 eras still
   have zero authored content, so there's nothing to connect across yet.
   It's also a new content shape (cross-era, not month-scoped) that would
   need its own proposal and a `docs/decisions.md` entry before building,
   per the same process any schema-affecting change goes through — not a
   "small addition." Revisit once the wavetop-month coverage bar
   (`docs/marketing/content-framework-2026-07-03.md`) is met across most
   eras.
3. **Weave known theories into existing `music` items — not a standalone
   glossary.** Reframed after Codex's review: a dedicated "theories" section
   would put the product in the business of deciding which fan theories are
   "legitimate," which is real editorial risk even without user accounts.
   Instead, where a song already has well-documented fan theories (the kind
   covered by mainstream fan media, not fringe speculation), one sourced
   line can live inside that song's existing content — same item, same
   sourcing bar, no new category, no new legitimacy-granting section. Hard
   scope line, part of the feature definition itself, not a caveat: **no
   theories about relationships, private life, sexuality, family, or
   identity, ever** — content/lyrical/Easter-egg theories only. Serves the
   lore-diver. Effort: **S** (same pipeline, no schema change). Runtime
   cost: zero.
4. **Community theory board / "clown bot" (full version, NOT recommended for
   now).** User-submitted theories, AI novelty-scoring ("you're the 100th
   person to say that"), per-user theory storage, cross-user notifications
   when someone builds on a theory. This requires: real accounts (v1 is
   explicitly public/read-only per `docs/decisions.md`), a notification
   system (explicitly out of v1 scope), per-user LLM calls to score
   submissions (`architecture.md` bans LLM calls in the synchronous
   user-request path — this feature is *inherently* request-path AI), and a
   similarity/novelty-detection system (embeddings + vector search — net-new
   infra, nothing like it exists today). It also inherits the
   defamation/misinformation risk flagged above, now compounded by
   user-generated content the company would be hosting and an AI actively
   validating theories about a real person. Effort: **L**, likely
   multi-week even scoped down. Not a v1-adjacent feature — see Verdict.

## Addendum — Joey's pushback on "selective" (2026-07-04, after the Codex round)

Joey pushed back on candidate 1 as originally revised: Taylor's catalog is
unusually well-documented (her own commentary, Long Pond Studio Sessions,
music journalism, mature fan-annotation culture), so "selective" understates
how much real, sourced material actually exists — the constraint is research
effort, not scarcity of real content. Agreed; candidate 1 above reflects
this. This immediately collides with an earlier scoping call, unreviewed by
Joey until now: songs getting their own timeline entry were capped at 1-2
"standout tracks" per album, specifically to respect the wavetop-month depth
ceiling (5-8 items *total*, all categories) and the Tier-0 payload budget
gate the engine track already enforces in CI (`docs/roadmap.md` W6). Midnights
has 13 tracks, Tortured Poets has 31 with the Anthology — full-catalog
coverage cannot live inside month-scoped `month_item` rows without breaking
both limits.

**Resolution:** full song-catalog annotation needs a new, non-month-scoped
content shape (a per-album "track guide," conceptually similar to the
cross-era fashion idea parked above, but lower-risk since it doesn't need
mature cross-era content to be useful — each song's entry stands alone).
This is a schema-affecting decision, which belongs with Wyatt's engine
track, not something CONTENT can decide unilaterally per `docs/roadmap.md`'s
lane boundary. Next step: a short technical note for Wyatt (separate from
this brief, much lighter than the clown-bot proposal — a content-shape
addition, not new infra/accounts/AI) proposing the track-guide shape, so
engineering can size and schedule it. Content authoring on the current
2 eras continues in parallel against existing constraints while that's
decided, so this isn't a blocker on ongoing work.

## Codex adversarial-review round

Ran one round (focus: market assumptions, effort estimates, scope creep,
and whether deferring the clown bot dodges Joey's actual question). Nine
findings, all addressed:

- **"Deep-dive annotation" as originally scoped (every item gets more prose)
  quietly reversed the content framework's own "hooks by default, omit
  context unless additive" rule.** *Accepted.* Rewrote candidate 1 above to
  be selective and source-gated, not blanket.
- **Fashion cross-era threads are premature with 9/11 eras still empty, and
  calling it "a small schema addition" understates that new content shapes
  need a proposal + decision-log entry, per the framework's own rule that
  schema/category changes aren't lightweight doc edits.** *Accepted.*
  Candidate 2 rewritten as parked, with the real process it needs when
  revisited spelled out.
- **A curated "known theories" glossary still puts the product in the
  business of deciding which theories are "legitimate" — that's the same
  risk category with extra steps, not a safe version of it.** *Accepted.*
  Dropped the standalone-glossary idea entirely. Candidate 3 rewritten to
  weave sourced, content-only theory notes into existing items instead of
  creating a dedicated legitimacy-granting section, with the
  relationship/private-life exclusion moved into the feature definition
  itself rather than left as a later caveat.
- **Deferring the clown bot risks reading as dodging a direct question Joey
  asked expecting an actionable answer.** *Accepted, addressed by making the
  deferral itself a concrete deliverable* (proposal with required sections
  and go/no-go criteria — see Verdict), not just "later."
- **Market research overclaimed in three places:** "served badly" implied
  validated dissatisfaction when the citations only show publisher supply;
  Questie AI was used as appetite-validation for a materially different
  feature (celebrity roleplay chat vs. theory-tracking/novelty-scoring/
  notifications); and "nobody has married deep annotation to timeline
  browsing" was asserted from a handful of listicles, not a real
  competitive audit. *Accepted, all three.* Language softened throughout
  the market research section above to separate "supply exists" from
  "demand is validated."
- **Two citations couldn't be verified** (a Threads post for the archive's
  launch date; an academic paper on Swiftie "conspiratorial participatory
  practices"). *Accepted — checked both directly, confirmed inaccessible,
  removed rather than asserted on unverifiable sourcing.* The underlying
  risk argument for the clown bot doesn't depend on the removed citation —
  it stands on the same reasoning as the already-adopted 2026-07-02
  decision to avoid AI "verdict" claims about a real person.

## Verdict

1. **Adopt comprehensive, source-gated song annotation as the authoring
   standard going forward** — cover a song's meaning/background/Easter eggs
   whenever a real source exists, don't artificially limit to a curated
   subset, but never invent when no source exists. This is the actual,
   defensible differentiator vs. Taylor's own archive (which explains
   nothing).
2. **Send Wyatt a short technical note proposing a per-album "track guide"
   content shape** — full song-catalog coverage can't fit inside month-scoped
   `month_item` rows without breaking the wavetop-month depth ceiling and
   the Tier-0 payload budget gate the engine track already enforces. This
   is a schema-affecting call that belongs with engineering, not something
   CONTENT decides alone. Content authoring on the current 2 eras continues
   in parallel, not blocked on this.
3. **Weave sourced, content-only fan theories into existing `music` items,
   with relationships/private life permanently out of scope for this
   feature.** No standalone glossary, no new category, no schema change —
   this is the safe, buildable realization of the theory-culture interest
   Joey's friends raised.
4. **Do not build the full "clown bot" — instead, commit to a real proposal
   with a deadline.** It fails three of v1's locked constraints at once
   (accounts, notifications, request-path LLM) and carries real
   defamation/moderation risk once it's user-generated and AI-adjudicated.
   Concrete deliverable: a `docs/proposals/` doc (owner: marketing dept,
   next session touching this topic) covering auth requirements, a
   moderation plan, novelty-scoring approach, notification design, and an
   AI cost model — ending in explicit go/no-go criteria — brought back as a
   `docs/decisions.md` entry before any build commitment.

---

## For Joey

**The verdict, in plain language:**
1. **We aim to cover every song's meaning and background where a real
   source exists** — you were right that Taylor's catalog is deep enough
   that this is mostly a research question, not a content-scarcity one.
   The only hard line: never invent a meaning when no real source says it.
2. **That means songs need their own space outside the month-by-month
   timeline** — a full tracklist won't fit into a release month without
   breaking limits Wyatt's already built (item density, payload size). I'm
   sending him a short proposal for a per-album "track guide" so this can
   move forward without me building content against a shape that doesn't
   exist yet. Doesn't block current authoring — that keeps going.
3. **Fan theories get woven into the songs they're about**, sourced the
   same careful way as everything else — with a hard line, built into the
   feature itself: nothing about her relationships or private life, ever.
   That's the safe version of what your friends were excited about, without
   us building a page that ranks which theories "count."
4. **We do NOT build the full "clown bot" yet** — it needs accounts,
   notifications, and live AI, three things v1 deliberately doesn't have,
   and it's the kind of feature that could get us in real trouble if an AI
   starts validating theories about her personal life. Instead of just
   dropping the idea, I'll write a real proposal (cost, moderation, what
   accounts would require, explicit yes/no criteria) so you and Wyatt get
   an actual decision point later, not a vibe.

**What Codex changed:** this brief went through a real rewrite, not just a
findings list — the original draft would have quietly walked back the
"hooks by default" cost discipline, treated a theories glossary as safer
than it actually is, oversold three pieces of market research, and cited
two sources that turned out to be unverifiable (I checked both directly and
confirmed Codex was right to flag them). Then you separately pushed back on
"selective" annotation as underselling the catalog — right call, fixed
above, and it surfaced a real architecture question (track guide shape)
that needed to go to Wyatt rather than get decided in a marketing brief.

**Approve items 1-4 as the next content-authoring standard, or tell me what
to change?**
