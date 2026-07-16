# Decision Log

Every decision that would be expensive to reverse gets an entry here BEFORE
implementation. Newest first.

Format: date, decision, why, alternatives considered, who approved.

---

## 2026-07-16 — Founders talk to Marjorie by replying to her emails

**Decision (Joey):** Replying to a brief/delta email is now a real channel
to Marjorie. A deterministic Action (`marjorie-inbox.yml`) reads her Gmail
inbox every 30 minutes, verifies the reply comes from a founder address
with a passing DKIM signature, and relays it onto the brief issue as a
`📧 Reply from <founder>` comment; Marjorie answers at her next run and
her reply reaches the founder via the next mailed brief/delta.

**Authority boundary (the important part):** relayed email is
**conversation-grade, never decision-grade.** Decisions still trace only
to founder-authored GitHub artifacts (checkbox edits, native comments) —
email is spoofable in ways a GitHub login is not, so the high-blast-radius
set (spending, merge/deploy grants, charters, security) can never be
granted by email; Marjorie restates any emailed decision as a bank item
for native confirmation.

**Why:** Joey asked to talk to Marjorie directly; email reply is the
lowest-friction interface he already lives in. Zero AI in the relay; ~30
runs/day of seconds-long Actions time.

**Alternatives considered:** a live chat with Marjorie (rejected for now —
she is a twice-daily scheduled runner, not a resident service; a chat
implies a paid always-on session); founders commenting on GitHub (still
works, still the only decision-grade path).

**Approved by:** Joey (in-session, 2026-07-16).

## 2026-07-15 — Era Secrets: every era entry teaches the fan something new

**Decision (Joey, product call):** Integrate the "Era Secrets" concept —
full research + design in `docs/proposals/2026-07-15-era-secrets.md` —
into the site. Core thesis, Joey verbatim: *"if a fan can learn something
they didn't know, they will ascribe value to the website."* Approved
scope, content-first sequencing: (1) author per-era secrets pools +
liner-note-code eggs into the existing content waves; (2) the **Era
Secret card** — one sourced, obscure, daily-rotating fact as the first
thing inside every era; (3) the **Track Five pill** — the artist-confirmed
track-5 tradition as a badge + cross-era rail in every Track Guide; (4)
later: "How every era ends" thread and secrets-found progress counter.
No runtime LLM anywhere — secrets are seed data on a deterministic daily
rotation (runtime-cost rule upheld).

**Why:** The Track 5 insight generalizes: the catalog is full of
artist-confirmed, fandom-documented patterns (track-13 grandparent
tributes, liner-note codes and the 1989 inversion, the healing-closer
arc, "seven" at seven) that even engaged fans haven't all seen. Surfacing
one at era entry is the cheapest possible proof of the site's depth at
the exact moment a visitor forms their value judgment.

**Alternatives considered:** Quiz/gamification-first (deferred — progress
counter is phase 2); random-per-pageload rotation (rejected — daily
deterministic feels curated and costs nothing).

**Approved by:** Joey (in-session, 2026-07-15: "log them as decisions from
me to integrate into the site"); Marjorie owns run order + routing.

## 2026-07-15 — The "Choose an era" screen becomes the landing page

**Decision (Joey, product call):** The site's first screen is the era
chooser — the existing EraSelector grid design ("Choose an era · Twelve
chapters, newest first"), promoted from a pop-up overlay to a **real
landing page**: the **Long Live** wordmark at the top, the **Eras / Threads
toggle** prominent up there with it, then the era grid. Tapping an era (or
Threads) steps inside the experience as today.

**Why:** New visitors currently land mid-experience and don't know what the
site is — the era/threads switcher is invisible to them (#634, the MOBILE
launch gate). The chooser grid communicates the entire concept in one
glance: twelve eras, pick where to start. It solves first-visit
comprehension *inside* the product, without an explanatory landing page —
which Joey considers against the ethos of good web design and holds only as
the fallback if this doesn't work.

**Alternatives considered:** (a) two-row top nav with the eras/threads
toggle as a full-width second row — Joey's earlier idea, superseded by this
same-day; (b) an explanatory marketing landing page — rejected unless the
chooser-as-landing fails with real users.

**Implementation notes (not part of the decision):** needs real thinking on
returning-visitor behavior (skip straight to their era? show chooser with
"HERE" state?), back-gesture semantics from the chooser, and it naturally
advances SEO/discoverability (#653) by giving the site a real front door.
Tracked in the implementation ticket; this unblocks the MOBILE gate's
design-intent ask (#634).

**Approved by:** Joey (explicit in-session directive, 2026-07-15: "call it
a decision and ask the team to implement it").

## 2026-07-15 — Autonomy expansion: content merges + work self-assignment

**Decision:** Two founder bottlenecks are removed from the daily pipeline:

1. **Content PRs are inside Marjorie's merge envelope.** A PR from the
   Content desk (label `content-shift`, touching only seed/content files per
   that desk's fence) may be merged by Marjorie when the standard envelope
   conditions hold: green required CI, no changes-requested review, no
   founder hold. "Brand voice / public-facing copy" no longer blankets
   routine content work — Karen's nightly integrity scan and Nils's daily
   walks audit content AFTER it ships, and a content merge is a plain
   `git revert` away from undone.
2. **Work is self-assigned.** Marjorie (with Kevin's triage) routes open
   launch-gate and build work directly into desk queues, ranked by cost of
   delay, without waiting for a founder-granted "build slot." A routed item
   counts as greenlit for the receiving desk's queue check. Founders steer
   by veto/comment and by the brief, not by per-item assignment.

**What still requires a founder:** product design intent (what should it
look like / do for users), legal/policy, pricing, spending, auth/secrets/
security, charter changes, and anything a founder has explicitly held. The
decision bank continues to exist for exactly these.

**Why:** The 2026-07-15 pipeline diagnosis showed the org healthy but
stalled at founder gates: finished content PRs sat unmerged for days, four
launch gates went five consecutive briefs waiting for a founder-assigned
build slot, and the founder-facing email channel was down (typo'd
MARJORIE_EMAIL variable, fixed same day) — so the asks never even reached
an inbox. Joey's directive: the system merges content and assigns its own
work; founders monitor via the now-working briefs.

**Alternatives considered:** Keeping founder merges with better nudging —
rejected by Joey: the bottleneck itself was the problem, not its
visibility.

**Approved by:** Joey (explicit in-session directive, 2026-07-15: "I want
the system to merge content and self-assign work without me. We already
approve.")

## 2026-07-12 — Product name and domain: Long Live / longlivets.com

**Decision:** The product's public name is **Long Live**. The website
domain will be **longlivets.com** — Joey is purchasing it now; Wyatt will
get it wired up (DNS/hosting) soon after. This resolves the "name TBD"
placeholder in `CLAUDE.md` and unblocks social-account naming (#518) and
any other naming-dependent work.

**Why:** Joey's call — the shipped reader was already internally called
"Long Live," and this makes it the actual public/company brand rather than
just a feature name.

**Alternatives considered:** None recorded; a direct founder decision, not
a debated option set.

**Approved by:** Joey.

## 2026-07-12 — Absorbed improvements from Joey's external AI review (charters amended)

**Decision:** From the ChatGPT/Gemini assessments Joey commissioned, absorb
four improvements (rejecting prompt-over-charter authority, precondition
skipping, and unbounded in-session loops): (1) reporting-is-not-progress +
idle-reason discipline (a briefs-only day is a failed org day); (2)
empty-queue fallbacks — no desk idles while gates are red (Austin falls back
to launch-gate work; Content Shift flags supply gaps); (3) claim-lease
expiry (24h) + reviews bounded at two rounds with Marjorie as tiebreak for
reversible matters; (4) the completion model — a per-surface coverage
matrix in docs/launch-readiness.md judged against the DEPLOYED site (Nils
now walks the live prod URL; three consecutive clean passes close a
surface), plus a zero-AI daily prod smoke check in the watchdog, and Karen's
nightly wired as a registered runner. Merge/deploy autonomy stays on the
already-approved ladder behind #488 (inertness) + #496 (branch protection),
now prioritized to the top of Wyatt's queue.

**Why:** the external reviews' valid core — close the loop through
merge→deploy→verify, and never let coordination substitute for progress —
without adopting their mechanism (pasted prompts overriding charters), which
is the authority-laundering pattern the provenance design exists to resist.

**Approved by:** Joey (in session, 2026-07-12 — 'Go. Merge it too').

## 2026-07-11 — Build desk autonomous lane (Austin) — approved in direction, activation gated

**Decision:** The Build desk gains an autonomous lane: **Austin**
(`docs/agents/austin.md`), a chartered agent that implements eng tickets
Kevin's triage labels tractable — and only those that also pass the
reversibility criterion (entry below), a semantic change-type allowlist
(no migrations/deps/workflows/API-routes/governance-docs; tests never
weakened), diff bounds (≤5 files/≤150 lines), and founder-or-desk
authorship. Rails: atomic claim (assignment + revalidation), stop triggers
instead of invention, regression test per bug fix, mandatory Codex review
with **no self-rebuttal**, human merge of every PR (v1), 2-attempt ledger,
2 starts/day, WIP limit of 3 open PRs blocking new claims. Autonomy expands
only class-by-class by founder grant (the §5.4 gate) — Austin never merges,
same as every agent. Kevin's charter records the handoff; his
never-auto-code invariant is unchanged (his triage is intake, the founder's
merge click is authorization).

**Why:** #470 — a fully-specified two-line fix — sat unbuilt for hours
because executing the queued tractable backlog was no one's job (gap
analysis: `docs/reviews/2026-07-11-operating-model-gap-analysis.md`, G1).
Design + Codex round: `docs/proposals/2026-07-11-build-desk-autonomous-lane.md`.

**Alternatives considered:** let Kevin auto-code Stream 3 (rejected — his
charter's unattended-loop concern is sound, and mixing triage with
execution removes a check); humans-only forever (rejected — the gap is
structural, not a discipline lapse).

**Approved by:** Joey (direction + commissioning, 2026-07-11).
**Activation gated on:** brief ticks for activate/name/caps **plus two
preconditions from the gap analysis — G3 branch protection enabled and G10
kill switch documented.** Austin runs nothing until those land.

**Activated same day (Joey, #494):** bundle approved; G10 done; **G3 turned
out to be paywalled** (GitHub requires Pro/Team for protection on private
repos — the gap analysis wrongly called it a free toggle). Joey chose
**option C — waive G3 for now — with option A (upgrade the org to GitHub
Team, then enable the ruleset) explicitly wanted later**; the upgrade is
banked as a TX item. Until it lands, "never push main" remains
charter-enforced rather than mechanical — a known, founder-accepted gap.

## 2026-07-11 — Marjorie's T2 gate redefined: reversibility is the criterion

**Decision:** Going forward, if a decision is reversible within a reasonable
window, Marjorie (or the relevant desk) decides it unilaterally and reports
it — founders reverse it after the fact if they disagree. Brief user-visible
exposure before a founder catches and reverses something does **not**
disqualify it as reversible. This is a new, independent route into T1 for
decisions outside the non-ratchetable set (`docs/proposals/2026-07-11-agentic-operating-model.md`
§5.3: product direction/scope, brand voice/public posting, legal/policy,
pricing, spending, merge/deploy authority, charter changes) — that set
remains a hard floor, gated regardless of whether a specific instance seems
reversible, unaffected by this decision.

**Why:** #477 (choice of analytics vendor) got banked as a T2 founder
decision even though switching vendors later is cheap and easy — the
ticket's own text said so. The prior T2 definition mixed named categories
(spec approvals, product direction, policy changes) with "anything expensive
to reverse," so a genuinely-reversible instance still consumed founder
attention because of its category. Joey's directive: define risk by
reversibility, not category — "who cares if a few users see it? The
founders will catch it and reverse it with reasonable timing, and therefore
reasonable damage control."

**Alternatives considered:** Keep the ratchet as the only path to T1
(rejected — requires two identical founder answers before Marjorie can act,
which is slower than a founder just stating the general rule directly, as
happened here). Redefine T2 by category only, tuning which categories
qualify (rejected — reversibility is the actual test Joey stated; recasting
it as category-tuning would drift from what was actually decided).

**Not yet resolved — explicitly not decided either way:** whether this
applies retroactively to items already in the decision bank or already
answered. Joey: "I think I should apply retroactively but I don't know if I
fully understand the implications." Tracked on issue #482; not implemented
until resolved.

**Approved by:** Joey (founder), issue #482, 2026-07-11.

## 2026-07-11 — Agentic operating model v2 (desks, chief of staff, Founders' Brief)

**Decision:** Adopt the desk model: chartered, sandboxed agents
(`docs/agents/`) with artifact-only interfaces; a chief-of-staff agent
(**Marjorie**) that curates a decision bank (`founder-decision` label +
required template) into a **6:00 AM Founders' Brief + 8:00 PM changes-only
delta**; tiered interrupt authority (T0–T3 + TX) with a founder-approved-only
autonomy ratchet and a non-ratchetable strategic set; a non-LLM GitHub-Action
watchdog watching Marjorie; decision provenance only from founder-authored
artifacts. **Merge authority granted by both founders:** autonomous merging
is the standing goal, earned class-by-class behind a deterministic merge gate
(never an LLM), starting with content-fix PRs once a content-inertness check
exists in CI; deploys stay human. **T3 paging:** SMS primary once the
provider account exists (TX item), email until then and as backup. **Growth &
Community desk starts pre-launch** (launch campaign plan, listening baseline,
account-creation lead time); the /marketing command is retired for a standing
marketing agent. **Marjorie also wears the manager hat** (Joey, same day):
deterministic team telemetry (tokens/outcome, no-op run ratio, findings-per-
PR by agent, cycle time, rework, escaped defects) + monthly mini-retros and
end-of-project retros proposing team changes as banked decisions — quality
up, tokens down, every cycle, because this team builds the next app too.

**Why:** founder attention is the scarcest resource; today every agent
interrupts ad hoc and nobody owns the queue. Full design + two-round Codex
debate record: `docs/proposals/2026-07-11-agentic-operating-model.md`
(PR #472); launch-ops work tracked as roadmap L-track.

**Alternatives considered:** pure deterministic digest with no chief-of-staff
(largely adopted as Marjorie's v1 scope and the degraded mode); many always-on
role agents (rejected 2026-07-02, ceremony at 2-person scale); wait for V2
engine (rejected — interrupt tax and intake gap are today-problems).

**Approved by:** Joey (product) + Wyatt (CTO), 2026-07-11 — Wyatt's sign-off
relayed by Joey in session; PRs #472/#463 merged by founders same day.
CLAUDE.md's merge rule is amended only when the gate + CI preconditions ship.

## 2026-07-11 — Clarification: "V1 is Vault-only" defers the automated engine, not recent content

**Decision:** The 2026-07-03 "V1 scope is Vault only" decision (below) means
the **automated** ingestion/clustering/ranking/notification engine (the
News/Current pipeline in `docs/proposals/2026-07-07-news-pipeline-architecture.md`)
is deferred to V2 — not that the Vault excludes recent events. The Vault's
scope has always been "anything that has already happened," and recency
doesn't disqualify content: an event from last week is exactly as valid a
Vault item as an event from 2008, as long as it's sourced and authored
through the normal Vault pipeline (Karen, the editorial voice standard, the
sourcing bar) like everything else.

Until V2's automated engine ships, recent content is added **manually** —
Joey brings in subject matter (real, already-happened events) as they occur,
which gets distilled into short, sourced Vault moments the same way any
other era content is authored. This is expected to be a daily habit, not an
edge case.

**Why:** This ambiguity caused a real mistake (2026-07-11): three
manually-curated, already-happened news subjects were initially treated as
conflicting with "V1 is Vault-only," when the actual scope boundary is
specifically about the *automated engine*, not about content recency. See
`JW-Incorporated/swift2` issue #464 for the incident this clarifies.

**Approved by:** Joey

---

## 2026-07-11 — Persona author copy desk

**Decision:** Adopt four named persona authors (charters in
`docs/content-ops/personas/`) layered on the #449 house voice — Theo (music/
releases/dossiers), Loren (theories/eggs), Vera (fashion/sightings), Deb
(relationships/business/tour); names are Joey's to rename before bylines
ship. Category→author routing lives in `scripts/copy-desk/routing.mjs` with
explicit per-item seed overrides; authorship is **derived at sync time, never
stored in the DB** (persona slugs permanent, display names mutable); on-site
bylines + a meet-the-desk page with honest editorial-characters framing,
gated on Joey approving the disclosure wording. Karen gains per-persona voice
checks (deterministic checks gate; agent judgment advisory only), calibrated
against committed golden fixtures per charter.

**Why:** One anonymous voice reads like an aggregator (#462); personas make
authorship legible and voice maintainable, and deriving (not storing) the
author keeps renames/beat changes a one-file edit. Retro pass is cheap by
design: bylines come free from sync derivation; only voice-check failures get
rewritten.

**Alternatives considered:** replace the single #449 voice standard entirely
(rejected — personas are a dial within house rules, so #461 proceeds
unchanged); store `author` as a CHECK-constrained DB column (rejected in
Codex review — duplicates derived data, makes renames a migration).

**Ref:** `docs/specs/2026-07-11-persona-authors-copy-desk.md` (PR #463),
issue #462.

**Approved by:** Joey (product) + Wyatt (CTO), 2026-07-11 — Wyatt's sign-off
relayed by Joey in session.

## 2026-07-10 — Track dossier data model: grouped fields on TrackNote, one jsonb dossier column

**Decision:** The Track Guide overhaul (issue #440) extends `TrackNote` with
two grouped optional objects instead of ~20 flat fields: `facts`
(writers/producers/release/single status/themes — data the seed files already
authored but the seed runner's INSERT list dropped) and `dossier`
(why-it-matters, tiered meaning, explained connections, live highlights,
collaborator voices, required sources). DB-side, the facts get real columns
(queryable scalars) and the dossier is ONE `jsonb` column validated by the
sync generator, not a column per section. Cross-song linking uses a new
`song:<slug>` RelatedId namespace on the existing `RelatedId` convention —
not a parallel linking system — which requires track slugs to stay globally
unique (asserted in tests). Meaning tiers reuse the existing
confidence-pill visual language (accent = confirmed, solid = supported,
dashed = fan theory), not a new one.

**Why:** grouped fields keep `tracks.generated.ts` diffable and let the UI
render whole sections from one prop; a single validated jsonb column avoids
a migration per future dossier section while the shape is still evolving
(Phases 2–3 of #440 will add more); reusing `RelatedId` was an explicit
acceptance criterion on the ticket.

**Alternatives considered:** one flat interface with ~20 optional fields
(rejected by Joey on the ticket — "Grouped fields"); a full page instead of
the overlay (rejected — "Overlay"); extending the Clue Web motif system now
(deferred — blocked on #445's rebuild landing first, per Kevin's plan).

**Approved by:** Joey (product) on issue #440, 2026-07-10.

## 2026-07-10 — Threads content derives from tagged content items, not hand-authored arrays

**Decision:** The six Threads (`love-story`, `fashion`, `taylors-version`,
`easter-eggs`, `hidden-clues`, `the-proposal`) currently render from
hand-authored TypeScript arrays in `apps/web/lib/longlive/lenses.ts`
(`RELATIONSHIPS`, `RUNWAY_LOOKS`, `RERECORDS`, `PROPOSAL_BEATS`, `CLUE_PAIRS`,
`EGG_NODES`/`EGG_LINKS`), completely disconnected from
`supabase/seed/content/**` — the pipeline every Era moment flows through.
Going forward, thread membership is derived from **tags on content items**
(new items in `supabase/seed/content/**` get one or more thread tags at
authoring time) rather than a second, hand-maintained data source. A thread's
rendered list should be a query/selector over tagged content, not a separate
array that has to be remembered and kept in sync by hand.

**Rollout is two phases, not one landing:** phase 1 (2026-07-10, this PR) is
the derivation mechanism itself — `ContentItem.threadIds`, the
`contentForThread()` selector, real tagged data via the existing
Relationship/Fashion category defaults. **`ThreadsMode.tsx` still renders
from the old `lenses.ts` arrays as of this PR — the mechanism exists but
nothing consumes it yet.** Phase 2, done per-thread as each thread's UI
rework lands (tracked in `docs/threads-rework-2026-07-10.md`), is wiring the
actual rendered UI to `contentForThread()` and retiring the corresponding
old array. Don't read this decision as "Threads already render from tagged
content" until phase 2 closes per thread.

**Why:** Joey flagged that new content isn't naturally flowing into Threads —
e.g. real relationship/sighting content added to an era file has no path
into the Love Story thread unless someone remembers to also hand-edit
`lenses.ts`. That's a structural drift risk, not a one-off oversight: the
two data sources will keep diverging as content authoring continues weekly
(see `docs/roadmap.md` J7). Auto-deriving from tags means new tagged content
appears in the right thread automatically, the same guarantee Era moments
already have.

**What this does NOT change:** thread-specific narrative structure that
doesn't map to a single content item — e.g. Love Story's single/solo periods
between relationships, or the Clue Web's motif-trail groupings and node-link
graph — still needs dedicated schema beyond a tag on one item. Those get
first-class fields/tables of their own (not another parallel hand-authored
array); the tag-derivation decision applies to "which content items surface
in which thread," not to every piece of thread-specific presentation data.

**Alternatives considered:** (1) keep `lenses.ts` hand-authored, add a
process rule + CI lint flagging likely-missed cases — rejected as treating
the symptom, not the drift; (2) hybrid — ship the current thread reworks
against today's `lenses.ts` shape, migrate after launch — rejected because
every thread rework happening now is the natural point to build the tagged
shape once instead of building on the old shape and migrating twice.

**Approved by:** Joey (product), 2026-07-10.

## 2026-07-10 — Love Story thread uses real names, not the earlier non-identifying convention

**Decision:** `RELATIONSHIPS` in `lenses.ts` previously used deliberately
non-identifying labels ("The Debut Sweetheart," "The Fearless Actor") per a
naming convention set in an earlier session. The Love Story thread rework
switches to real names (Joe Jonas, Taylor Lautner, John Mayer, Jake
Gyllenhaal, Conor Kennedy, Harry Styles, Calvin Harris, Tom Hiddleston, Joe
Alwyn, Travis Kelce).

**Why:** The thread's entire premise — both the original product brief
("who each era was written about") and the v0 design built against it — is
answering "who was she with, when." A relationship thread that hides who
defeats its own purpose. All of these are widely-reported public
relationships between public figures (nothing private or contested), and
this app's photo/media policy (2026-07-09 entries above) already accepted a
more permissive posture than the caution the non-identifying convention
implied.

**Alternatives considered:** Keep non-identifying labels — rejected, makes
the shipped feature confusing/useless relative to what was actually asked
for and designed.

**Approved by:** Claude, acting on the explicit product brief for this
thread rework — flagging here rather than treating silently, since it
reverses a previously deliberate convention. Low-risk/easily reversible
(display strings, not data-model or infra), so implementing directly rather
than blocking on a synchronous approval; revert is a one-line diff if this
call is wrong.

## 2026-07-09 — Superseded same-day: full lyrics reproduction rejected in favor of per-song analysis + short quotes

**Decision:** The entry directly below this one ("Full song lyrics may be
reproduced on-site") is superseded after further discussion, the same day it
was written. We will NOT reproduce complete song lyrics anywhere in the app.

Instead, every song gets its own page (`TrackDetail`, reached from the Track
Guide) with real, researched discussion — why she wrote it, what it's about,
its place in the album/era — grounded with a FEW short illustrative quoted
lines, the way music journalism quotes a couplet. This is exactly the
existing "original words + links, never paste verbatim" rule already applied
everywhere else in the app; there was never a real reason to treat songs
differently.

**Why the reversal:** a licensing/API tangent (Musixmatch, Genius) was
explored and dropped — Joey correctly pointed out that's solving the wrong
problem. The actual work is research and writing (what the song means, why
it was written), same as every other content pass in this app, not a data
source to license.

**Implementation note (2026-07-09):** it turned out every seeded track
already carries real, sourced `summary`/`inspiration`/`easterEggs` fields
(written during an earlier content pass) that were never surfaced in the UI
at all — another instance of this app's recurring "plumbing, not writing"
gap. The `TrackDetail` page's discussion is auto-derived from those fields
where no hand-written `discussion` override exists, so all ~244 songs got
real per-song pages with zero new content-writing required for this pass.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-09 — Full song lyrics may be reproduced on-site (SUPERSEDED, see entry above)

**Decision:** Reproducing complete song lyrics (not just short quoted lines)
is allowed in the track guide / song-meaning sections, at the same risk
tolerance as the photo-rehosting decision below: a knowing acceptance of
copyright-infringement exposure rather than an oversight.

**The actual risk being accepted, stated plainly:** song lyrics are
copyrighted works; the NMPA and Genius have both pursued infringement claims
over unlicensed lyric reproduction, historically more aggressively than
photo agencies pursue paparazzi-photo rehosting. This is a **larger** legal
exposure than the photo decision, not an equivalent one, even though the
same "knowing acceptance" framing applies.

**What this does NOT change:** the no-fabrication rule; text elsewhere (event
summaries, moment bodies) still must be original words + links, never pasted
verbatim, per the 2026-07-08 media policy below.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-09 — Deuxmoi may be cited as a source, always explicitly labeled

**Decision:** Deuxmoi (an anonymous gossip/blind-item Instagram account that
publishes unverified reader-submitted tips, not a reported news outlet with
editorial standards) may be used as a source. It must always be labeled
transparently as "Source: Deuxmoi" — never disguised as or blended with
reputable-press citations — so users can see for themselves that a claim
traces back to an anonymous tip account rather than confirmed reporting.

**Why:** Some real information about Taylor Swift genuinely does surface
first through Deuxmoi before (or instead of) verified press pickup.
Transparency about the source, not exclusion of it, is the honesty
mechanism — consistent with the existing confidence-label system
(`official` / `confirmed_interview` / `reputable_reporting` / etc. in
`apps/web/lib/longlive/types.ts`); a Deuxmoi-sourced claim should carry a
low confidence label (`plausible` or below), never `confirmed` or `official`.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-09 — Hosting/rehosting real internet photos IS allowed — no rules against it

**Decision:** There is **no rule against hosting photos.** Any real photo may
appear on-site by **any** means — embedded via oEmbed, hotlinked, or
**copied/rehosted to our own CDN** — with a credit line where available. Every
prior ban or restriction on rehosting is **deleted**, including the one that
had stood in the "Media & content sourcing policy" entry below (dated
2026-07-08, which had called an earlier same-day reversal an "over-correction").
That ban text has been removed from that entry too, so the log no longer
contradicts itself. Confirmed directly by Joey and Wyatt.

**Why this needed resolving explicitly:** the two entries directly
contradicted each other, and — independent of which one was "supposed" to be
current — Wyatt's content team had already shipped multiple merged PRs
rehosting real photos under what their own commit messages called "the
relaxed image policy" (e.g. `content/showgirl-marquee-photos`,
`content/red-photos`). Docs and shipped code disagreed; per CLAUDE.md's
"disagreements surface, not settle" rule, this was raised to Joey rather than
silently picked.

**What stands, unchanged from the 2026-07-08 entry below:** the no-fabrication
rule, the reference/comparable-image honesty-labeling requirement (never
present a stand-in as the real photo), and the monetization IP-counsel gate.
oEmbed is still the *preferred* path for social-post embeds (no hosting cost),
but is no longer the only way images may appear on-site.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-08 — LongLive content synced from Supabase at build time, not runtime

**Decision:** `apps/web/lib/longlive/content-vault.generated.ts` (the
generated half of the LongLive UI's content layer) is now produced by
`scripts/sync-longlive-content.mjs` running as a Next.js `prebuild` step.
That script tries the **live Supabase `month_item` table first** (same
public/RLS-read `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` env as the dormant
`VaultReader` path) and **falls back to the local `supabase/seed/content/**`
seed files** when Supabase isn't configured or the fetch fails (local dev
without secrets, CI, or before the DB is seeded).

**Why:** Earlier today the generated file was produced by a manual,
human-remembered script run against local seed files only — content changes
required someone to re-run it and commit the output, with no connection to
the actual Supabase database the seed files are meant to populate. This
closes that gap: seed the DB (`npm run db:seed:content`) → redeploy → the
build reads fresh data automatically. It stays a **build-time** read, not a
live per-request one — consistent with `CLAUDE.md`'s cost-discipline rule
("keep the Vault static, no per-user DB calls in the request path") and
`docs/architecture.md`'s Tier-0-static design. The fallback keeps local dev
and CI working without provisioning secrets everywhere.

**Alternatives considered:** wire live client-side/server-component Supabase
reads into the LongLive UI directly (rejected for now — a much larger,
riskier refactor across ~15 components that currently import static data
synchronously; also reintroduces runtime DB dependency the static design
deliberately avoids. Real architectural convergence, tracked as future work
in `docs/longlive-experience.md` §9, not done today); keep the manual-only
sync script (rejected — doesn't fix the actual problem, which is that
content updates require a human to remember a step).

**Not yet done:** Tier-1 `moment.context` (long-form body text) isn't fetched
in the live path — 400+ individual queries at build time was judged not
worth it right now; live-synced items fall back to the snippet as body, same
as any seed item without `moment.context`. The videos/theories/tours/
releases seed pipelines are still unsynced entirely (tracked in
`docs/longlive-experience.md` §9).

**Approved by:** Joey, in this session — explicit "go for it" on architecture
integration #1 from the Supabase review.

## 2026-07-08 — Media & content sourcing policy

**Decision:** Replace the inherited blanket "never store article bodies or
rehost images — metadata only" rule with a **three-part policy** that makes
goal #7 (a rich, self-contained on-site experience — users never click out)
achievable while confining the real legal exposure. (Refines and supersedes the
blunt same-day "just reverse it / allow rehosting" note — that over-corrected.)

1. **Text — relaxed.** We write **original summaries of events in our own
   words** and link to sources. Facts aren't copyrightable; expression is. We
   **never paste article bodies, lyrics, or official statements verbatim.** The
   no-fabrication rule still applies (summaries must be real + sourced).
   Low-risk; unblocked.

2. **Images — no hosting restriction (see the 2026-07-09 entry above).** Any
   real photo may appear on-site by **any** means — embedded via oEmbed,
   hotlinked, or **copied/rehosted to our own CDN** — with a credit line where
   available. There is **no ban on rehosting** (the clause that used to sit here
   banning "arbitrary internet photos" is **deleted**). oEmbed remains a
   convenient path for social posts, not a requirement. The only image rules
   that remain are content-integrity, not hosting: **no AI-generated fakes,**
   and **clearly label any reference/comparable stand-in** so it's never
   presented as the real thing.

3. **Monetization gate.** The affiliate/fashion (commercial) layer shifts us
   from editorial toward commercial and raises **right-of-publicity /
   false-endorsement** questions. **Nothing monetized ships without external
   IP-counsel review,** and the **UNOFFICIAL fan-project disclaimer stays
   prominent.**

**Why:** The inherited blanket "metadata only" ban made the product impossible
(goal #7 needs on-site media). The image half of this policy has since been
fully opened up — see the 2026-07-09 "no rules against hosting" entry above,
which is the current word: hosting/rehosting real photos (paparazzi, press,
agency) is allowed, with credit; only AI fakes and mislabeled stand-ins are
barred.

**Must go to a real lawyer before we monetize (explicit):**
- Any monetization / affiliate / commercial feature → external IP counsel
  (right-of-publicity, false endorsement, FTC affiliate-disclosure).
- Before accepting any **fan submissions / UGC** → register a **DMCA agent** +
  takedown workflow (safe-harbor).
- Editorial-imagery **licensing scope** confirmed before hosting licensed assets.

**Technical implications:**
- **oEmbed content model:** store provider + canonical post URL (+ cached
  oEmbed HTML/metadata with attribution + fetched-at); render via provider
  embed; respect provider ToS/rate limits; graceful fallback when a post is
  deleted. oEmbed is an **external dependency**, so treat social embeds as
  current/ephemeral and prefer licensed **owned** assets for permanent/hero
  imagery.
- **Caching + attribution** kept with every asset (credit = attribution, not a
  license).
- Owned/licensed media stays **off the Tier 0 payload budget**.

**Unchanged:** no-fabrication rule; Tier 0 payload budget; UNOFFICIAL stance;
RLS. Point-in-time references in `docs/specs/`, `docs/proposals/`,
`docs/marketing/`, and the `packages/shared/src/vault-types.ts` comments predate
this entry and are superseded by it; they'll be updated when the media pipeline
lands.

**CTO agent's evaluation (surfaced, not rubber-stamped):** agree with all three
parts. One caveat, not a disagreement — oEmbed's external dependency means
deleted source posts break embeds, so license/own anything that must persist.

**Approved by:** Wyatt (CTO). Product direction from Joey.

## 2026-07-08 — Web app upgraded to Next 16 / React 19 / Tailwind 4 (retroactive)

**Decision:** `apps/web` moved from Next 14.2 / React 18.3 / Tailwind 3 to
Next 16.0 / React 19.2 / Tailwind 4.3, plus a set of Radix UI primitives
(dialog, slider, slot, toggle-group, tooltip, visually-hidden), as part of the
LongLive front-end rewrite (PR #73, branch `dev-script-not-seen`).

**Why documented after the fact:** this shipped inside v0's (Vercel's AI
builder) large front-end rewrite rather than as a standalone decision, so it
wasn't logged before implementation as the workflow rules require. By the
time it surfaced in codex review, the app was already built, tested, and
merge-ready against the new stack — reverting the framework bump would mean
reverting the entire rewrite, not a small change. The versions typecheck,
lint, and test clean, and the app runs correctly on them, so we're recording
the decision now rather than unwinding working code to backfill process.

**Alternatives considered:** revert to Next 14/React 18 and re-port the
LongLive components (rejected: throws away a full day of tested, reviewed
work over a paperwork gap, not a functional problem); keep both versions
side by side per-workspace (rejected: `apps/web` is a single Next app, there
is no per-route framework split to make this meaningful).

**Approved by:** Joey (product), retroactively, given the rewrite was already
built end-to-end and passing review. **Process note for future sessions:**
framework/major-version bumps must get a decisions.md entry BEFORE
implementation per `CLAUDE.md` rule 6 — this entry exists to close that gap
for this specific change, not to establish after-the-fact logging as normal
practice.

---

## 2026-07-07 — News data model: `news_`-prefixed two-tier schema, zero coupling to Vault (DRAFT)

**Status: DRAFT — needs Wyatt's approval before any migration is written.
Nothing is implemented against this entry; it exists so the expensive-to-
reverse shape is reviewed before news work is ever scheduled.**

**Decision (proposed):** When the post-v1 News/Current world is built, its
schema is a two-tier model adapted from Orbit's production pipeline —
`news_raw_item` (every ingested item; many) collapsing into `news_story` (the
deduplicated unit users read; few), plus `news_source` (config rows, with a
credibility `tier`), `news_story_source` (audit trail / "reported by N"),
and `news_llm_usage` (durable daily LLM-call cap counter). All news tables
carry the **`news_` prefix**; **no foreign keys in either direction** between
`news_*` and Vault tables; raw/internal tables get **no public RLS policies**
(worker-only), stories are public-read like the Vault. Orbit's multi-figure
`channels` concept is dropped — Swift2 is single-subject; search terms become
worker config. Stories carry `verification_status` so the "hide vs. label
fake stories" product choice stays a serving-time filter, not a schema change.

**Why:** The raw→story split is what makes dedup, "N sources" credibility,
and classify-once cost control possible, and it's proven in Orbit. The prefix
+ no-FK rule makes the 2026-07-02 "separate data worlds" decision mechanically
enforceable rather than conventional. Deciding the shape now is cheap;
re-shaping deployed news tables later is not.

**Alternatives considered:** Single flat `news_story` table with a jsonb
source list (rejected: loses per-item dedup keys and ingest idempotency);
reusing Orbit's schema verbatim incl. `channels` (rejected: multi-figure
indirection with no product behind it); schema-per-world Postgres schemas
(viable, but a prefix is simpler and matches existing table style).

**Ref:** `docs/proposals/2026-07-07-news-pipeline-architecture.md` (§4, §5).

**Approved by:** _pending Wyatt_ — do not migrate before sign-off.

---

## 2026-07-04 — Persistent glass era-rail replaces the peek-strip summon

**Decision:** Drop the summon affordance entirely. The prior design (see the next
entry) had a thin **peek strip** at the top that you grabbed to expand into the
scrubber, plus overscroll-to-summon at the scroll top. Both are removed. In their
place: a **persistent, always-visible era rail** pinned to the right edge — a
glassmorphic capsule with one colour dot per era (the whole timeline visible at a
glance), the active dot enlarged, drag/tap to jump, and a magnified album
"bubble" while dragging. The continuous-stacked-timeline + scroll-spy + two-way
coupling decision below is UNCHANGED; only the *navigator affordance* changed.

**Why:** On-device testing (Wyatt, real phone) found the peek strip scrolled
**off the top of the screen and was unreachable**, and it wasn't obvious which
era each position mapped to. An always-present rail showing every era colour is
reachable at any scroll position and makes the destinations legible without a
summon gesture — which also removes the overscroll-vs-scroll-up ambiguity the
superseded entry was carefully working around.

**Alternatives considered:** Keep the peek strip but make it position-fixed
(rejected: still a hidden-until-grabbed control, and a fixed bar over a
continuous scroller competes with content); bottom-edge scrubber (rejected:
collides with mobile browser chrome / home indicator). Implementation notes and
the interaction-lag fixes from a Fable review are in PR #23.

**Approved by:** Wyatt (CTO) — from direct device testing.

## 2026-07-04 — Continuous stacked timeline over per-era paging (scrubber summon)

**Decision:** The Vault reader is one continuous vertical scroller with all eras
stacked (scroll-spy drives the era indicator + theme), not a per-era paged view.
Consequence for the summon affordance: the **peek strip is always visible and
grab-to-expand is the primary summon** (works from any era); **overscroll-to-
summon fires only at the global scroll top.** A per-era overscroll trigger is
deliberately NOT implemented — in a continuous scroller it would collide with
scrolling up into the previous era, which the architecture spec forbids
("never fights normal vertical scroll").

**Why:** Joey's spec is era-snap horizontal scrubber + vertical month scroll; a
continuous stack makes scrubbing and scroll-spy two-way coupling natural and
keeps months reachable by plain scrolling. The spec's "overscroll at the top of
an era" language predates the continuous-stack choice and assumed paging. The
always-present grab strip covers summon everywhere, so nothing is lost.

**Alternatives considered:** Per-era paged scroller with rubber-band overscroll
per era (rejected: heavier, and re-introduces a network/scroll-position seam
between eras); per-era overscroll detection in the continuous scroller (rejected:
fights scroll-up-to-previous-era). Flagged by a Codex review of the reader.

**Approved by:** _pending Wyatt/Joey_ (documented divergence from the spec's
per-era overscroll wording; primary grab-summon unaffected)

## 2026-07-04 — Ship-readiness bar: wavetop everywhere + 2 flagship eras deep, then weekly post-launch drops

**Decision:** v1's content ship bar is revised from wavetop-only (all 11 eras,
met by #38) to: wavetop-only stays the floor for all 11 eras, **plus Midnights
and Tortured Poets must reach Active-tier depth** (the framework's 3-tier rubric
applied beyond just milestone months) **before public launch**, weighted toward
`relationship`, `sighting`, and `fashion` — the categories currently at 0, 2,
and 11 items respectively, against `vision.md`'s explicit promise to cover
sightings, fashion, and relationships. The remaining 9 eras ship at the wavetop
floor and are deepened on a **public weekly cadence after launch** ("era
drops"), each announced externally.

**Why:** Joey challenged the wavetop-only bar on retention grounds — v1 has no
notifications or news feed (2026-07-03 decision below), so unexplored content
depth is the app's only mechanic for bringing a lapsed user back, and a
100-item archive is exhaustible in a single session. Full depth across all 11
eras before launch (~350 items, a ~3.5x jump concentrated in the
slowest-to-source categories) was rejected: it defers all launch value behind
one large authoring push with nothing shippable in between, and compounds
already-open quality debt (`docs/marketing/content-review-2026-07-04.md`)
rather than fixing it first. Two flagship eras deepened pre-launch, with the
rest on a weekly cadence, ships incrementally like every other track in this
project and gives the founders a recurring reason to post externally instead
of one launch mention.

**The retention logic's real dependency, stated explicitly so it isn't
glossed over:** with no in-app notification system, the weekly-drop cadence
only produces retention if it is **publicly announced** (external/social
posts naming what changed) — a silently-deepened backend is retention-
equivalent to shipping nothing extra. This makes the cadence a marketing-
operations commitment on Joey, not just a content-authoring schedule. If that
weekly commitment can't be sustained, this option collapses to the old
wavetop-only bar's retention profile with extra pre-launch authoring cost and
no offsetting benefit.

**Alternatives considered:** (A) Keep the wavetop-only bar as the sole ship
floor — rejected as the weakest retention story of the three, not because it's
wrong on effort/speed grounds. (B) Full curated depth across all 11 eras before
launch — rejected per the sizing above, not because it's technically
infeasible (a payload-budget objection in the prior framework doc doesn't
hold: 100 items measures at 0.6% of the 2MB gzipped Tier-0 budget, per
`docs/roadmap.md` W6 — real cost is authoring time and quality risk, not
payload).

**Update, same day — Joey asked why not front-load full depth with more AI
effort, since Max's constraint is a rate-limit window, not dollars, and
tokens are cheap. Correct on one point, not on two others (see
`docs/marketing/ship-readiness-review-2026-07-04.md` addendum):** the "B
defers everything behind one 11-era batch" reasoning above was wrong — each
era is an independently owned/shippable seed file
(`supabase/seed/content/<era>.mjs`), so full-depth authoring can run in
**parallel across eras beyond the two named here**, with each era shipping
full-depth the moment it individually clears Codex review + Joey's spot-check,
rather than waiting on all 11 together. **This is additive to the gate below,
not a replacement for it** — Midnights + Tortured Poets at Active-tier depth
remain the fixed minimum that blocks launch; any additional eras that clear
review in time ship deep too, reducing (not eliminating) reliance on the
post-launch weekly-drop plan for whatever's left. What tokens still can't buy:
real sources for months where nothing public happened (no padding, no
fabrication, ever — unchanged), and Joey's own spot-check time, which is the
one step in the pipeline that scales with his hours, not compute. Nobody has
timed that review step yet — doing so on the next batch is the actual
constraint on how many eras "parallel effort" can realistically clear before
launch, not token budget.

**Ref:** `docs/marketing/ship-readiness-review-2026-07-04.md` (Codex
adversarial-review round included), superseding the ship-readiness bar in
`docs/marketing/content-framework-2026-07-03.md`.

**Approved by:** Pending Joey sign-off on this PR — this is the marketing
dept's recommendation, not yet a confirmed product decision.

## 2026-07-04 — Song track guide is a separate, non-month-scoped shape

**Decision:** Full song-catalog coverage lives in a new `track_note` table
(per-album song notes: `era_slug`, `track_title`, `track_number`, `note`,
`source_url`, `sources[]`), **not** as `month_item` rows. It is reached from the
album/era and served **on demand** per album (`GET /vault/album/[slug]/tracks`),
like Tier 1 moments — deliberately kept **off the Tier 0 timeline payload**.
Same discipline as the rest of the Vault: short sourced note (≤400 chars, DB
CHECK), links only, no fabrication, RLS public-read, authored via repo seed
files (`supabase/seed/tracks/*.mjs`, `npm run db:seed:tracks`).

**Why:** Content approved full-catalog song annotation (Taylor's catalog is
unusually well-documented). Songs currently only become content as month-scoped
`month_item` rows, capped at 1–2 standout tracks/album to respect the
wavetop-month depth ceiling (5–8 items/month) and the Tier-0 payload budget gate
(W6, ≤2MB gz, CI-enforced). Midnights (13 tracks) and TTPD (31 w/ Anthology)
would blow both immediately. A separate album-scoped shape gives unlimited song
coverage without touching the timeline payload.

**Alternatives considered:** Extend `moment` with nullable month linkage + a
discriminator (rejected: `moment` is 1:1 and month-scoped; overloading it
muddies the timeline model). Bundle track guides into Tier 0 (rejected: that is
exactly the payload the budget gate protects). Keep cramming songs into
`month_item` (rejected: breaks both limits, needs migration later).

**Knock-on:** the staged Orbit song port (`candidates/00-orbit.mjs`, 218 songs
as `month_item` rows) is the anti-pattern this replaces — those should be
re-mapped to `track_note`s or dropped, and must not be seeded as month items.

**Ref:** `docs/proposals/2026-07-04-song-track-guide-content-shape.md`,
`docs/marketing/feature-brief-2026-07-04.md` (Addendum).

**Approved by:** Wyatt (CTO)

## 2026-07-03 — V1 scope is Vault (time machine) only

**Decision:** v1 ships the Vault/era-scrubber time-travel experience and
nothing else. Features 2–8 from the 2026-07-02 marketing brief (news feed,
notification onboarding, source-credibility tagging, collections, live
event companion) are not scheduled — not ruled out, just out of v1 entirely.
This narrows the brief's "ship #1, then #2, then #3" sequence down to #1
alone. Engineering spec: `docs/specs/2026-07-03-vault-mvp-v1-spec.md`.

**Why:** Product direction from Joey — focus the first release on the one
feature nobody else can clone quickly, rather than bundling in the
notification/news pillars before the Vault itself has shipped.

**Alternatives considered:** The brief's original 3-feature sequence
(rejected for v1: defers a shippable release behind two additional builds
that aren't needed to prove the core mechanic). Bundling notification
onboarding with the Vault as one release (the brief's still-open A/B
question — moot now, since notifications aren't in v1 at all).

**Approved by:** Joey

## 2026-07-02 — Cost strategy: two bills, and codify repetition

**Decision:** Manage build cost and runtime cost separately. Build: we run both
Max (scarce resource = rate-limit window; sequence heavy jobs around refreshes,
grip-and-rip within a window) and API (scarce resource = dollars; use a Console
spend cap + alerts, not manual tracking). Runtime: keep the Vault static, any
product LLM call is worker-side/capped/fallback, never in a user path. Standing
rule (now CLAUDE.md workflow rule 8): if an AI does the same procedural task
twice, or foresees it recurring >2×, it writes and commits reusable code for it
instead of re-executing token-by-token.

**Why:** Repeated manual execution costs tokens linearly and drifts; codifying
it is O(1) and deterministic. The biggest build-cost sink is rework, addressed
by spec-before-code + small PRs. A hand-kept spend spreadsheet is stale on
arrival; Console caps/alerts aren't.

**Alternatives considered:** Manual Excel bill-tracking (rejected: stale,
redundant with Console on API and meaningless on flat-rate Max). Pay-everything
-up-front with no discipline (rejected: fine for dollars, but ignores rework and
rate-limit throughput, the actual constraints).

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Reuse Orbit's stack, separate backend

**Decision:** Adopt the sibling project Orbit's stack topology wholesale —
TypeScript, Next.js (App Router) on Vercel for web, Expo/React Native for
mobile, Supabase for DB/auth/storage, npm-workspace monorepo with
`packages/shared` (portable domain, no I/O) + `packages/core` (data access).
Reuse Orbit's *code patterns and layout*, but stand up a **new, isolated
Supabase project** — do NOT share Orbit's backend, data, or quota.

**Why:** Orbit already runs this exact shape of problem in production; a
two-person AI-first team can't afford novel infra. Isolating the backend keeps
two products' prod data, cost, and blast radius separate (Orbit's own rules are
strict about a single shared backend).

**Alternatives considered:** (a) Green-field stack selection — rejected, no
upside over a proven one we operate daily. (b) Literally share Orbit's Supabase
project — rejected, entangles two products' data and quota; Wyatt can flip this
if Swift2 turns out to be an Orbit evolution rather than a distinct product.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Vault and News are separate data worlds

**Decision:** Curated Vault content (eras, milestones, fashion) and live
News/Current content live in separate tables and separate app surfaces. Vault
is authored/versioned in the repo, static between deploys, CDN-cached; News is
volatile and pipeline-driven.

**Why:** They have opposite freshness/caching needs; coupling would force the
Vault to inherit the feed's volatility for no benefit.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Era-scrubber gesture layer is per-platform

**Decision:** The Vault timeline scrubber is built as the app's reference
workload with a hard 60fps budget. Its data model, ordering, and snap math live
in shared packages, but the gesture recognizer + animated timeline are
implemented **twice** — web (Pointer Events + CSS transforms + rAF) and native
(Reanimated worklets + Gesture Handler on the UI thread). v1 snaps to **era
boundaries only**; milestones (wavetops: album releases + tours) are anchors,
not snap targets.

**Why:** "Smooth and low-latency" is the feature. A shared abstraction over two
very different animation runtimes would risk the frame budget and cost more than
it saves. Per-frame React state is banned on both platforms.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Adopt dual-AI operating model

**Decision:** Claude Code is the hub (planning + building); Codex runs inside
it via the official plugin (reviewing + delegated tasks). Roles are modes
defined in CLAUDE.md, not separate agents. QA is automated tests + CI, not an
AI role.

**Why:** Cross-provider review catches issues self-review can't; one-session
workflow avoids copy-paste overhead; lean docs over an 11-file process that
would go stale.

**Alternatives considered:** Separate PM/Engineer/Reviewer/QA AI agents
(rejected: ceremony without benefit at 2-person scale, unaffordable on
current plans).

**Approved by:** Joey

## 2026-07-02 — Repo is the source of truth

**Decision:** All knowledge lives in Git. Nothing important exists only in an
AI conversation. Core docs: CLAUDE.md, AGENTS.md, docs/vision.md,
docs/architecture.md, docs/decisions.md. New docs added only when their
absence causes real pain.

**Why:** Docs nobody maintains are worse than none; agents act on stale info.

**Approved by:** Joey
