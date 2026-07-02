# Proposal: Serving "Taylor's entire life" with low latency (Vault deep-history architecture)

Status: DRAFT — round 2 review complete, both review rounds used per protocol; awaiting human decision
Author: Claude Code (planning mode)
Date: 2026-07-02
Grounded in: `docs/vision.md`, `docs/architecture.md`, `docs/decisions.md`

## 1. The problem, in plain language

`vision.md` describes a "time travel" experience: a user picks an era, then
can drop into any *month* inside it and see what Taylor was doing then —
travel, fashion, relationships, tours, songs being written, sightings. That's
not a handful of curated wavetops; it's a dense, scrollable archive spanning
~20 years. The person asking for this debate framed it precisely: "we will
have Taylor's entire life basically stored on our server and have to serve
that to the user as they dive through history" — and it has to feel instant
while they do it, because `docs/decisions.md` already locked "smooth and
low-latency IS the feature" as a non-negotiable (60fps scrub, no per-frame
network wait).

So the actual engineering question is: **how do you serve a large, deep,
date-addressable archive to a scrubbing gesture that must never wait on the
network, without that archive becoming a live-database-under-load problem?**

## 2. Conflict with the current architecture doc (flagging, not silently resolving)

`docs/architecture.md`'s Vault v1 section currently assumes:

- Milestones are **"wavetops only"** — album releases and tours, a small
  curated set.
- "The whole Vault can be fetched/cached as one static payload... driven
  client-side with zero per-frame network cost."

That assumption is correct *for era + milestone navigation* (the scrubber
skeleton) but doesn't obviously extend to month-level drill-down content
(per vision.md) without checking the actual numbers first — see Section 3.
This proposal keeps the existing wavetops-only skeleton exactly as
architecture.md specifies, and asks whether the month-level layer underneath
it can follow the *same* "load it up front" principle, or genuinely needs a
different mechanism. Round 1 of this proposal assumed the latter without
proof; Codex called that out (Section 3a), so the sizing work below is done
before picking a mechanism, not after.

## 3. Sizing the archive first (added in round 2 — Codex forced this)

### 3a. What round 1 got wrong

Round 1 asserted month-depth content is "10-100x larger" than wavetops and
that loading it all up front "stops scaling by year 2-3" — then, in the same
document, estimated the total dataset at ~12,000 rows and called it "not big
data." Those two claims contradict each other, and neither was backed by a
real number. Codex's adversarial review flagged this directly: the entire
three-tier mechanism was being justified by a scale assumption nobody had
checked. That's the failure this section fixes.

### 3b. An actual estimate

`docs/architecture.md` already hard-caps row size: no article bodies, no
rehosted images — titles/snippets/links/metadata only. Using that constraint:

- One dated item (a sighting, a fashion look, a dated event): date, category,
  title, short snippet, source link, thumbnail URL ≈ **250-400 bytes** as
  JSON.
- Illustrative editorial depth (pending Joey's answer — see open questions):
  ~40 items/month average across all categories × 12 months × 20 years =
  **~9,600 items**.
- Raw JSON for the *entire* archive at month-summary depth: ~9,600 × 350B ≈
  **3.4 MB**, likely **under 1 MB gzipped**.
- Even at 5x that editorial density (dense eras like 2023-2024 get much more
  coverage than quiet years), the whole-archive month-index is still a
  **low-single-digit-MB** payload, gzipped.

Conclusion: the month-*index* (one line per category per month — enough to
render timeline markers and preview cards) is **plausibly not too big to
load up front**, the same way Tier 0 (eras + milestones) already is. But this
is still an illustrative estimate, not a measured one — see the v1
verification gate in 3d, added after Codex's round 2 review correctly
pointed out that "40 items/month, 300 bytes/item" is asserted, not measured,
and doesn't account for real fields (IDs/slugs, source attribution, longer
third-party thumbnail URLs, denser high-coverage eras).

### 3d. V1 verification gate (added after Codex round 2)

Eager-loading the whole month-index is this proposal's default *hypothesis*,
not a final commitment made from an illustrative estimate. Before it ships,
require:

- A real fixture generated from the actual Vault schema (once specced) at
  the actual editorial depth Joey commits to (Open Questions), not the
  illustrative 40/month figure.
- Measured gzip size and mobile parsed-memory footprint against a hard v1
  budget: **≤ 2 MB gzipped, ≤ 10 MB parsed in memory on a mid-tier Android
  device.**
- If the measured payload exceeds that budget, the fallback is *not* a
  redesign from scratch — it's reinstating round 1's windowed
  prefetch-per-era mechanism (Section 6, "alternatives"), which this
  proposal already worked out and only shelved because the numbers didn't
  yet justify its complexity. That fallback path stays documented for
  exactly this reason.
- This gate belongs in the implementation spec/acceptance criteria for
  whichever engineering task builds Tier 0/1, not just this doc — flagging
  here so it isn't lost.

What genuinely is open-ended, and can't be preloaded, is the **full detail
behind a single moment** — every linked source, every photo, extended
context — because that's the one place editorial depth per item isn't
bounded by a "one line per category" rule. That's the only part of the
archive that needs on-demand fetch.

### 3c. Revised design consequence

This collapses round 1's three tiers into two, and removes the parts of the
mechanism (ISR + publish webhooks) that Codex correctly identified as
solving a scaling problem that the numbers don't actually support yet. See
Section 4.

## 4. Proposed design (revised)

Two tiers, not three. Keep Postgres (Supabase) as the sole source of truth
and authoring surface, and keep Vault **authored/versioned in the repo and
regenerated at deploy time**, exactly as `docs/architecture.md` and
`docs/decisions.md` already specify. This proposal does not change Vault's
authoring/versioning model — round 1 did, implicitly, and that was wrong
(Section 3 of the Codex response below).

| Tier | Contents | Est. size | When loaded | Delivery |
|---|---|---|---|---|
| **0. Skeleton + month index** | eras + milestone wavetops (as today) **plus** one line per category per month (fashion/travel/relationship/tour/song) | low single-digit MB, whole archive, gzipped (Section 3b) | Up front, always resident — same as today's Tier 0 | One static JSON payload per platform, built at deploy time, CDN-cached |
| **1. Moment detail** | the full set of linked sources/photos/context for one specific item the user opens | small per item, but open-ended (unbounded links/sources) | On demand, only when the user opens a specific moment | Static JSON per item, built at deploy time, CDN-cached |

**Why deploy-time generation, not ISR/webhooks (reversing round 1):** Vault
changes only when an editor publishes, and `docs/decisions.md` already
treats Vault as "static between deploys." Introducing publish-webhook-driven
revalidation would change Vault's update model from "reviewed, versioned,
atomic at deploy" to "mutated live between deploys" — a change with real
consequences for rollback, review, and cache-consistency that deserves its
own decision-log entry, not a default baked into this proposal. **For v1,
new Vault content ships the same way it ships today: through a deploy.** If
editorial cadence turns out to need faster-than-deploy publishing, that's a
future, explicitly-approved decision — flagged in Open Questions, not
assumed here.

**Prefetch, simplified:** because Tier 0 now includes the month index for
the *entire* archive, there is no "settle on an era before fetching"
mechanism left to design — the data the scrub gesture needs is already
resident, matching the existing 60fps/no-per-frame-network requirement
exactly. The only network fetch introduced by this proposal is Tier 1
(moment detail), triggered when a user taps into a specific moment — a
discrete, deliberate tap, not a scrub-frame, so a normal loading-state
pattern applies:

- **Latency budget:** show the moment card's already-known summary (title,
  date, thumbnail — all present in Tier 0) instantly; fetch Tier 1 detail
  behind it. If the fetch takes longer than ~150ms, show a skeleton/loading
  state for the detail region only — the card itself never blocks or waits.
- **Degraded states — concrete acceptance criteria (added after Codex round
  2 flagged this as named-but-not-specified):**
  - **Timeout (>3s):** keep showing the summary already in Tier 0; show a
    "still loading" affordance with a manual retry button in the detail
    region only.
  - **404 / missing detail artifact:** show an explicit "details unavailable"
    state (not a spinner that never resolves); log the moment ID for
    editorial follow-up.
  - **Offline:** show an offline indicator in the detail region; auto-retry
    once connectivity returns (standard platform connectivity listener).
  - **Rapid repeated taps across moments:** each tap's fetch is keyed to the
    moment ID and aborted (`AbortController` on web, equivalent on native) if
    superseded by a later tap; only the response for the currently-open
    moment is ever applied to the UI.
  - **Telemetry:** emit distinct events for timeout, 404/missing-artifact,
    and offline, so "broken content" (editorial gap) is distinguishable from
    "user's network failed" in monitoring.

**Cache/version coherency across the two tiers (added after Codex round 2):**
Tier 0 carries a content/build version. Tier 1 detail files are published at
version-pinned (content-hashed or version-suffixed) paths that Tier 0's
entries reference directly, so a client holding a slightly-stale cached
Tier 0 never requests a Tier 1 path that has been replaced or removed. On
version mismatch (client's cached Tier 0 predates the latest deploy), the
client forces a Tier 0 refetch before trusting any Tier 1 link. Prior Tier 1
artifacts are retained at least through the longest mobile TTL window so a
client on the previous version never hits a 404 for content it can already
see summarized in its own cached index. Rollback follows the same rule in
reverse: rolling back a deploy restores the prior Tier 0 version, which only
ever points at Tier 1 paths guaranteed to still exist.

**Mobile:** Tier 0 fetched once and persisted on-device (e.g. MMKV) with a
TTL, refreshed on app start if stale — consistent with the existing
`packages/core` data-access boundary. Tier 1 fetched on demand per platform
the same way.

**Shared item shape with News:** unchanged from round 1 — vision.md
describes month-drilldown as "the same experience as recent news... except
at a different point in time." Vault items and News items should share a
render-time shape (date, category, title, snippet, link, thumbnail) even
though storage and pipelines stay separate, per the existing Vault/News
decision. This lets the feed-card component be written once.

**Cost model:** with ISR/webhooks removed, this is deploy-time static
generation onto the CDN already in use (Vercel) — no new infrastructure or
cost center versus what architecture.md already assumes for Tier 0 today.
The only new recurring cost is CDN serving of Tier 1 detail payloads on
demand, which scales with user taps, not archive size, and is small per the
metadata-only row cap.

## 5. Key tradeoffs

- **Pro:** two tiers instead of three, no ISR/webhook machinery, no change
  to Vault's authoring/versioning model — this is additive to the existing
  architecture, not a rework of it.
- **Pro:** the hot path (scrubbing) touches zero network calls, same as
  today; the one new network call (moment detail) is triggered by explicit
  user intent (a tap), which is far more forgiving of latency than a
  scrub-frame.
- **Con:** the whole-archive month index is one payload that grows every
  year. It's small today (low single-digit MB) by the estimate in Section
  3b, but that estimate depends on editorial depth Joey hasn't specified
  yet (Open Questions). If real depth is 10x the illustrative estimate, this
  proposal's "just preload it" conclusion needs revisiting — flagged
  explicitly, not silently assumed to remain small forever.
- **Con:** deploy-time-only generation means new Vault content ships only as
  fast as deploys happen. Acceptable for a curated/editorial cadence; would
  need revisiting if the product wants same-day publishing independent of a
  deploy.

## 6. Alternatives considered and rejected

- **Three-tier static generation with ISR + editorial publish webhooks**
  (round 1's design). Rejected for v1 after Codex review: solves a scaling
  problem the numbers in Section 3b don't support yet, and silently changes
  Vault's authoring model from "versioned in repo, static between deploys"
  to "webhook-mutated between deploys" — a change that needs its own
  decision-log entry if it's ever actually needed, not a default.
- **Ship the entire archive to the client (SQLite/local DB bundle),
  including all moment detail.** Rejected: moment-level detail (full source
  lists, extended context) is the one part of the archive that's genuinely
  open-ended per item; bundling it removes the only place this design
  degrades gracefully under future growth.
- **Live GraphQL/query API with server-side filtering per scrub position.**
  Rejected: adds a network round trip to the exact interaction that must
  never wait on the network; the sizing estimate in Section 3b shows a live
  query API isn't needed to solve a real scale problem for the index tier.
- **Specialized time-series or graph database for the archive.** Rejected:
  no evidence of graph-shaped queries (e.g. "connections between people");
  Supabase Postgres already covers "items dated and categorized" fully.
- **Supabase Realtime subscriptions for Vault content.** Rejected: Vault is
  not realtime by definition (that's the News world's job per the existing
  decision).
- **Edge image-optimization/cache proxy for third-party photos** (round 1's
  proposed middle path on image hosting). Rejected as part of the *default*
  design after Codex review: a cached copy for display, even temporary, is
  still a hosted copy, and likely conflicts with architecture.md's
  categorical "never rehost images" rule. Removed from the proposed design;
  see Open Questions for the default fallback and the path to revisit this
  if Wyatt wants to.

## 7. Open questions (need human input before implementation)

- **Editorial depth and workload (Joey — product):** Section 3b's whole
  estimate hinges on how deep "any month" actually goes — is every month of
  20 years populated at meaningful depth, or only "notable" months, with
  sparse months falling back to a lighter view? This determines whether the
  "preload the whole month-index" conclusion in Section 4 holds, or whether
  a tiered/prefetch mechanism (round 1's design) needs to come back once
  real numbers exist. **This is the single open question everything else in
  this proposal is downstream of.**
- **Image hosting vs. the "never rehost images" rule (Wyatt —
  architecture, expensive to reverse):** the time-travel experience leans
  heavily on fashion/paparazzi photos. Default assumption in this revised
  proposal: images stay hotlinked to source, with the UX designed around
  that from day one (placeholders, metadata-first cards, graceful handling
  of slow/broken thumbnails) rather than solved with a caching layer. If
  hotlink reliability/latency turns out to hurt the experience badly enough
  to reconsider, that's a distinct, explicit decision for Wyatt — this
  proposal does not assume or design around getting one.
- **Deploy cadence vs. editorial cadence:** if editorial publishing needs to
  happen faster than the team wants to deploy, the "static at deploy time"
  model in Section 4 will start to hurt. Not a problem today; worth naming
  as the trigger condition for reconsidering ISR/webhooks as a real,
  separately-approved decision rather than something this proposal backs
  into by default.
- **Date-range search/jump.** vision.md's "timeline slider" implies jumping
  to an arbitrary month. Is date-based navigation (browse by era → month)
  sufficient for v1, or does the product need full-text/keyword search
  across the archive? If the latter, that's a later addition (Postgres
  trigram/full-text search), not a v1 requirement.

## 8. What this does NOT change

- The era-scrubber's 60fps gesture requirement, its UI-thread/worklet
  implementation, and era-boundary-only snapping — untouched, exactly as
  `docs/decisions.md` already locked in.
- The Vault/News separation — untouched.
- Vault's authoring/versioning model (authored in repo, static between
  deploys) — untouched; round 1 drifted from this and round 2 restores it.
- The "never rehost images" rule — untouched; round 1's proposed workaround
  is removed from the design.
- The stack (Next.js/Vercel, Expo, Supabase) — untouched. This proposal is
  about data *shape and delivery*, not a new stack choice.

## 9. Codex round 1 review — findings and responses

Full adversarial review run against round 1 of this document. All five
findings accepted; the document above reflects the revisions. No findings
were rebutted.

1. **[high] Static tiering justified by unsupported payload-growth
   assumptions.** *Accepted.* Added Section 3, a real sizing estimate.
   Conclusion changed: the month-index doesn't need tiering after all — see
   3c.
2. **[high] Proposal silently changed Vault from repo-versioned/static to
   webhook-mutated CDN state.** *Accepted.* Removed ISR/webhook
   revalidation from the default design (Section 4); restored deploy-time
   generation matching the existing architecture/decision docs. Reframed as
   a future, separately-approved decision in Open Questions.
3. **[high] Image-cache middle path likely violates the existing no-rehost
   rule.** *Accepted.* Removed from proposed design (Section 6); replaced
   with an explicit default (hotlink + graceful-degradation UX) in Open
   Questions, with any change requiring Wyatt's separate approval.
4. **[medium] Windowed prefetch doesn't cover arbitrary month-jump
   latency (cold cache, rapid jumps, offline).** *Accepted.* Resolved
   structurally: Section 4 no longer gates the month-index on scrub
   settling — it's resident up front like Tier 0. Added explicit latency
   budget and degraded-state handling for the one remaining network call
   (moment detail).
5. **[medium] ISR/CDN cost model missing.** *Accepted, and moot given
   finding 2's resolution:* removing ISR/webhooks removes the cost center
   Codex was asking to have modeled. Added a short cost note in Section 4
   confirming no new infrastructure beyond what architecture.md already
   assumes.

## 10. Codex round 2 review — findings and responses

Second adversarial review run against the round-2 revision. All three
findings accepted. Per the design-debate protocol, this is the second and
final automated round — no further rounds without explicit human approval.
Both rounds ended in full acceptance; there is no unresolved Claude/Codex
disagreement to surface. What remains are human decisions Codex was never
positioned to make — see Section 7, Open Questions.

1. **[high] Sizing estimate still not conservative enough to justify
   whole-index eager load.** *Accepted.* This is the correct challenge —
   there is no seeded schema or real editorial data to measure yet, so no
   review round can turn an illustrative estimate into a verified one.
   Added Section 3d: a hard v1 budget (≤2MB gzipped, ≤10MB parsed on
   mid-tier Android) plus an explicit fallback — reinstate round 1's
   windowed prefetch design — if the real, measured payload exceeds it.
   Eager-load is now framed as a gated hypothesis, not a commitment.
2. **[medium] Two static tiers need versioning/cache-coherency rules.**
   *Accepted.* Added a cache/version-coherency subsection to Section 4:
   version-pinned Tier 1 paths, forced Tier 0 refetch on version mismatch,
   retention of prior Tier 1 artifacts through the mobile TTL window, and
   rollback semantics.
3. **[medium] Moment-detail degraded states named but not behaviorally
   specified.** *Accepted.* Replaced the one-line mention with concrete
   acceptance criteria in Section 4: timeout threshold and UI, 404/missing-
   artifact UI, offline handling, superseded-request abort behavior, and
   required telemetry events.

Codex was not asked to, and did not, flag anything round 1 got right that
round 2 overcorrected away from.
