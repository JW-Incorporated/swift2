# Decision Log

Every decision that would be expensive to reverse gets an entry here BEFORE
implementation. Newest first.

Format: date, decision, why, alternatives considered, who approved.

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
