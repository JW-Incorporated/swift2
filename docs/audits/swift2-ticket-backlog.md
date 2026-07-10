# Swift2 Ticket Backlog — T18+ (Knowledge-Architecture Audit)

Date: 2026-07-09. Source: `swift2-full-content-audit.md`. Numbering continues the
existing scheme (T1–T17 are in `content-depth-audit-2026-07-08.md`). New tickets
start at **T18**. The machine-readable mirror is `swift2-ticket-backlog.json`.
Product decisions the auditor must *not* resolve are in §"Needs a decision".

Priority key: **P0** credibility/trust/copyright · **P1** major depth/graph gap ·
**P2** improvement · **P3** polish. Owner type: ENG (schema/UI/sync), CONTENT
(writing/verification), RESEARCH (web-search-capable lane), PRODUCT (decision).

## Still-open prior tickets (referenced, not renumbered)

These remain open from the 2026-07-08 depth audit and are cited by the new
tickets — do not duplicate them:
- **T6** — localStorage progress/visited/completion layer (P1, ENG).
- **T7** — search + glossary (P1, ENG).
- **T8** — Clue Web "connects to" chips clickable in trail view (P1, ENG).
- **T9** — `relatedIds` cross-linking field moment↔egg↔thread↔song (P1, ENG).
- **T10** — expand The Proposal beats / Runway occasions / Clue Web ttpd-tloas (P1, CONTENT).
- **T11–T14** — polish: freshness banner, richer share cards, scrubber-hover summary, 1989/folklore TV-edition call.
- **T15** — replace `ContentItem.image` with `images: ImageRef[]` gallery (P0, ENG) — **specified but never merged; reopened as a live blocker, see T18/T20 context.**
- **T16** — major-event photo + depth re-pass (P0, CONTENT) — **authored on `*-full` branches, unlanded.**
- **T17** — Wikipedia Tier-1 breadth backfill: awards / videos / tour dates (P0-Tier1, RESEARCH) — audit doc done (stranded on a branch), backfill open.

---

## New tickets

### T18 — Reconcile and land the stranded depth work and audit docs
- **Surface / files:** `supabase/seed/content/*.mjs`; branches `content/<era>-full`
  (×10), `content/debut-body-depth-t16` (#114), `content/fearless-full` (merged);
  `docs/breadth-audit-2026-07-09.md` (on `content/lover-full`),
  `docs/qa-era-depth-spotcheck-2026-07-09.md` (on `content/reputation-full`).
- **Priority:** P0 · **Effort:** M · **Category:** content-ops / merge-reconciliation · **Owner:** ENG + CONTENT.
- **Problem:** The "full-standard, every era" depth pass lives on ten unmerged
  `*-full` branches (`git branch --merged main` lists none); `main` still shows
  **491/614** items flagged by the coverage gate. Two prior audit docs exist only
  on branches. `main` has since taken its own QA edits (e.g. the #114 debut date
  fix), so a blind merge would clobber them.
- **Why it matters:** The app's depth problem is almost entirely *unlanded*, not
  *unwritten*. This is the highest-leverage P0 in the whole backlog and a
  credibility risk (claimed state ≠ deployed state).
- **Acceptance criteria:** every `*-full` branch either merged to `main`
  (conflicts resolved *keeping* `main`'s QA corrections, as was done for #114) or
  explicitly closed as superseded with a reason; the two audit docs live under
  `docs/`; a fresh `npm run content:coverage` on `main` shows the flagged count
  drop to the branches' level; one summary PR or a tracked sequence, no silent
  force-pushes.
- **Data-model implications:** none (content + docs only).
- **Definition of done:** `main`'s coverage report matches the intended
  full-standard state; no depth work remains only on a branch; `decisions.md`
  notes the reconciliation.

### T19 — The Song Meaning surface (per-song deep view)
- **Surface / files:** `apps/web/components/longlive/TrackGuide.tsx` (new
  per-song detail sub-view), `apps/web/lib/longlive/types.ts` (`TrackNote`),
  `supabase/seed/tracks/*.mjs`, `packages/shared/src/vault-types.ts` (`TrackNote`),
  `scripts/sync-longlive-tracks.mjs`.
- **Priority:** P1 · **Effort:** L · **Category:** feature + content · **Owner:** ENG then CONTENT.
- **Problem:** "What does this song mean?" — the most common fan question — has no
  home. `TrackNote` is explicitly a one-line hook (`TrackRow` is a flat list
  item); there is no meaning essay, no lyric snippet, no song-to-song links, no
  "what Taylor said."
- **Why it matters:** highest single content lever in the app (audit §0 #5);
  turns the Track Guide from an index into a destination.
- **Acceptance criteria:** tapping a `TrackRow` opens a per-song detail with:
  (a) an original-words meaning (2+ paragraphs, sourced); (b) key lyric lines as
  **short snippets only, ≤300 chars, never the full song** (copyright policy);
  (c) `relatedIds` to connected songs (shared theme / callback / same subject /
  same era); (d) cited "what Taylor has said" (interviews, liner notes, Long
  Pond). Phased content rollout — flagship/most-searched songs first, not all
  ~200+ at once.
- **Data-model implications:** extend `TrackNote` with optional `meaning: string`,
  `lyricSnippets: {line, source}[]`, `relatedIds: string[]`,
  `commentary: {quote, source}[]` (all optional; the coverage gate's ≥300 excerpt
  hard-fail already guards the snippet cap). Reuse the existing `Confidence` enum
  if any claim needs it.
- **Definition of done:** the detail renders for songs that have the new fields;
  songs without them keep today's one-liner; a phase-1 set (e.g. the 10–15
  most-searched songs) is authored + sourced; gates green.

### T20 — Sync the theories seed to a live Theory surface
- **Surface / files:** `scripts/sync-longlive-content.mjs` (or a new
  `sync-longlive-theories.mjs` following the tracks pattern),
  `apps/web/lib/longlive/lenses.ts` + a generated `theories.generated.ts`,
  `apps/web/components/longlive/ClueWeb.tsx`, `supabase/seed/theories/**` (27 recs).
- **Priority:** P1 · **Effort:** M · **Category:** plumbing (zero new writing) · **Owner:** ENG.
- **Problem:** `supabase/seed/theories/**` is fully authored with **required
  `confidence` + `outcome`** and is *better structured* than the in-repo
  `EGG_NODES` the Clue Web renders — and it has **zero UI reach**.
- **Why it matters:** closes a major depth gap with content that already exists
  and already passes every gate; unifies two divergent theory datasets.
- **Acceptance criteria:** theories render in the live UI with confidence +
  outcome badges (reuse the existing pill component); fan/theory content stays
  structurally separated from confirmed fact; no `EGG_NODES`/seed double-source
  of truth left ambiguous (pick one, or map one onto the other).
- **Data-model implications:** a UI-facing `Theory` type mirroring
  `vault-types.ts`; decide whether `EGG_NODES` becomes a projection of the seed.
- **Definition of done:** every seed theory reachable in the UI; badges correct;
  `content:coverage` still green.

### T21 — Sync the videos seed + wire the era video rail to it
- **Surface / files:** `supabase/seed/videos/**` (65 recs), a new sync path +
  generated module, `apps/web/components/longlive/MomentVideo.tsx` /
  `EraMedia.tsx` / `EraSection.tsx`.
- **Priority:** P1 · **Effort:** M · **Category:** plumbing + light content · **Owner:** ENG.
- **Problem:** only ~10 signature moments have a video against 62 real MVs; the
  65-record `videos/**` seed is unsynced. IDs in the seed are oEmbed-shaped;
  verify before render (`longlive-experience.md` §5.5).
- **Why it matters:** the video rail is a natural Cultural-Impact + Shareability
  surface currently running at ~15% coverage.
- **Acceptance criteria:** an era's official videos render from the seed via
  verified oEmbed facades (click-to-play, `youtube-nocookie`); no unverified IDs;
  filmography/TV/commercial rows are **out of scope** pending the Needs-a-decision
  call on where they live.
- **Data-model implications:** a UI `Video` type; `MomentVideo` may generalize to
  read the synced set.
- **Definition of done:** era rails show the seeded MVs; IDs verified; gates green.

### T22 — Sync tours + releases seeds to the live UI
- **Surface / files:** `supabase/seed/tours/tours.mjs`, `releases/releases.mjs`,
  new sync + generated modules, a tours/releases surface (thread or era section).
- **Priority:** P2 · **Effort:** M · **Category:** plumbing · **Owner:** ENG.
- **Problem:** both pipelines are seeded (6 tours w/ Eras leg+show detail; 29
  releases) and unsynced. The Eras Tour date ledger has nowhere to render.
- **Why it matters:** unlocks tour/release depth already written; feeds Timeline
  and Cultural-Impact.
- **Acceptance criteria:** tour + release records render somewhere live; the Eras
  leg/show data is visible; no schema regressions.
- **Data-model implications:** UI `Tour`/`Release` types mirroring `vault-types.ts`.
- **Definition of done:** records reachable in the UI; gates green.

### T23 — Extend `content-coverage.mjs`: knowledge-graph density + pipeline-reach gates
- **Surface / files:** `scripts/content-coverage.mjs` (extend, do **not** fork).
- **Priority:** P2 · **Effort:** S · **Category:** tooling/guardrail · **Owner:** ENG.
- **Problem:** the coverage gate measures body length, sources, media rights, and
  policy hard-fails — but not the two things this audit found most broken:
  cross-linking density and whether a seeded pipeline actually reaches the UI.
- **Why it matters:** turns this one-time audit into a standing guardrail so
  "authored but unreachable / unlinked" can't recur silently.
- **Acceptance criteria (all report-only, never a new hard-fail):**
  (a) **graph density** — count records carrying `relatedIds` (reads
  `row.relatedIds ?? row.moment?.relatedIds`; reports 0 today, meaningful once T9
  lands); (b) **pipeline reach** — for each seed type, report whether a
  corresponding `*.generated.ts` exists under `apps/web/lib/longlive/` (flags
  theories/videos/tours/releases as "seeded, unsynced" until T20–T22);
  (c) **branch-vs-main drift note** — optional line reminding that flagged counts
  reflect `main`, per T18.
- **Data-model implications:** none (reads optional fields defensively).
- **Definition of done:** new sections print; exit behavior unchanged; existing
  CI stays green.

### T24 — Awards as a structured corpus
- **Surface / files:** new `supabase/seed/awards/**` + shape in
  `packages/shared/src/vault-types.ts`, a UI surface, `content-coverage.mjs`
  expectations.
- **Priority:** P2 · **Effort:** L · **Category:** data-model + research · **Owner:** RESEARCH + ENG.
- **Problem:** the breadth audit found awards covered only as scattered narrative;
  the Wikipedia source lists 690 wins / 1,640 nominations with no award-entry
  schema. T17 can't "close" without one.
- **Why it matters:** awards are a bounded, enumerable Tier-1 completeness axis.
- **Acceptance criteria:** an `Award` shape (body, year, work, category, result,
  source_url); a first import of the major bodies (Grammy/AMA/VMA/CMA/Billboard);
  coverage reported per body. **Scope decision required first** (see Needs a
  decision) — curated highlights vs. full 1,640-row corpus.
- **Data-model implications:** new `Award` type + seed dir + coverage
  expectations.
- **Definition of done:** award records render + are gated; scope decision logged.

### T25 — Media rights-status backfill + missing credits
- **Surface / files:** all `supabase/seed/content/*.mjs` media, `theories/videos`
  media, `content-coverage.mjs` rights report.
- **Priority:** P2 · **Effort:** M · **Category:** compliance/data-hygiene · **Owner:** CONTENT + ENG.
- **Problem:** 707/751 media refs carry no rights-status; 7 detail photos have no
  credit. The rights-aware media shape was specified (audit §5) but not applied.
- **Why it matters:** the media policy is deliberately permissive now (hosting
  allowed), but rights-status + credit are still the discipline that keeps it
  defensible; also unblocks a clean T15 gallery.
- **Acceptance criteria:** every media ref gets a `rights`
  (`oembed|owned|hotlink_legacy`) and a credit; the 7 uncredited photos fixed;
  coverage "missing rights-status" → 0.
- **Data-model implications:** apply the §5 rights-aware media object; readers
  treat missing fields as `hotlink_legacy`.
- **Definition of done:** coverage rights report clean; no AI-fake images;
  reference/comparable stand-ins still labeled.

### T26 — Land the known factual corrections + the `rel-5` era mislabel
- **Surface / files:** `supabase/seed/content/{debut,tortured-poets,reputation}.mjs`,
  `apps/web/lib/longlive/lenses.ts` (`RELATIONSHIPS` `rel-5`).
- **Priority:** P0 · **Effort:** S · **Category:** correctness · **Owner:** CONTENT.
- **Problem:** the QA spot-check found real errors (Rascal Flatts date [fixed on
  `main` via the unmerged #114], Vienna "250,000 tickets," Getty-vs-Taylor
  engagement-photo credit, the 90k "Angels" wording) that mostly live corrected
  only on `reputation-full`/branches; `rel-5` is still mis-filed under Red.
- **Why it matters:** these are exactly the errors a real fan clocks instantly.
- **Acceptance criteria:** each flagged claim on `main` corrected or softened to
  what its source supports; `rel-5` era corrected + sourced + the vagueness
  convention applied; folds into T18's reconciliation where they overlap.
- **Data-model implications:** none.
- **Definition of done:** the QA spot-check's flags all resolved on `main`.

### T27 — De-thin and source the Relationships and Runway threads
- **Surface / files:** `apps/web/lib/longlive/lenses.ts` (`RELATIONSHIPS` 6,
  `RUNWAY_LOOKS` 12), `types.ts` (`Relationship`, `RunwayLook`).
- **Priority:** P1 · **Effort:** M · **Category:** content + light schema · **Owner:** CONTENT + ENG.
- **Problem:** Relationships have no sources field and one sentence each; Runway
  is one look per era with 11/12 missing designer/occasion. Both feed Crossings,
  so their thinness propagates.
- **Why it matters:** two of the six threads score <2.0 and drag Crossings with
  them.
- **Acceptance criteria:** `sources` on every relationship; multiple dated,
  occasion-specific runway looks per era (the Showgirl entry is the template);
  the relationship naming convention applied consistently (**needs the decision
  below first**).
- **Data-model implications:** add `sources?: EggSource[]` to `Relationship` and
  `RunwayLook`; optional `designer`/`occasion` on `RunwayLook`.
- **Definition of done:** both threads sourced + de-thinned; Crossings visibly
  richer as a result.

### T28 — Empty-filter state gets a one-tap "Clear filter"
- **Surface / files:** `apps/web/components/longlive/EraSection.tsx` (moment grid
  filter empty state).
- **Priority:** P3 · **Effort:** S · **Category:** UX polish · **Owner:** ENG.
- **Problem:** "No moments match that filter in this era." is a dead end.
- **Acceptance / DoD:** the empty state offers a one-tap clear-filter action.

### T29 — Thread gallery cards preview their depth
- **Surface / files:** `apps/web/components/longlive/ThreadsMode.tsx` (gallery cards).
- **Priority:** P3 · **Effort:** S · **Category:** UX polish · **Owner:** ENG.
- **Problem:** cards show title + kicker + one line; no sense of what's inside.
- **Acceptance / DoD:** each card shows an item count + one representative
  highlight (e.g. "14 clue pairs, from 'Delicate' to 'ME!'").

### T30 — Trim the 4 over-cap verbatim excerpts
- **Surface / files:** the 4 `moment.context` fields flagged ≥300 chars by
  `content:coverage`.
- **Priority:** P2 · **Effort:** S · **Category:** copyright discipline · **Owner:** CONTENT.
- **Problem:** 4 verbatim pull-quotes sit above the 300-char excerpt cap (below
  the 600-char hard-fail, so not blocking — but off-policy).
- **Acceptance / DoD:** each trimmed to ≤300 or converted to original-words
  summary + link; coverage "verbatim excerpts ≥300" → 0.

### T31 — "Ask the Vault" worker-side semantic search *(AI; decision-gated)*
- **Surface / files:** new worker (per `docs/architecture.md` AI rules), a search
  entry in `TopBar.tsx` (coexists with T7 keyword search).
- **Priority:** P2 · **Effort:** L · **Category:** AI feature · **Owner:** ENG + PRODUCT.
- **Problem:** the corpus is rich but only keyword-searchable (once T7 lands);
  natural-language "which song is about the Kennedy summer?" isn't answerable.
- **Architecture constraint (mandatory):** worker-side only, hard-capped,
  **rule-based fallback** (keyword search) when the model is unavailable/over
  budget, **never synchronous per request**, and a **decision-log cost entry
  before it ships**. Precompute embeddings offline; no live per-request model
  calls in the reader.
- **Acceptance criteria:** NL queries resolve to real corpus items with sources;
  fallback path works with the model disabled; cost entry logged.
- **Data-model implications:** an offline-built embedding index over the corpus.
- **Definition of done:** feature behind the constraint above; decision logged.

### T32 — Editor aid: suggested `relatedIds` *(AI; offline batch)*
- **Surface / files:** an offline script (not in the request path), output
  reviewed by CONTENT before commit; depends on T9.
- **Priority:** P3 · **Effort:** M · **Category:** AI tooling · **Owner:** ENG.
- **Problem:** building the knowledge graph (T9) by hand across 600+ items is slow.
- **Architecture constraint:** offline batch only; suggestions are **proposals a
  human accepts**, never auto-written; no runtime model calls.
- **Acceptance / DoD:** a script proposes candidate `relatedIds`; a human
  accepts/rejects; nothing auto-commits.

---

## Needs a decision (PRODUCT — auditor does not resolve)

1. **Quiz / trivia as a feature?** No quiz surface exists; the `Quiz` shape was
   sketched (depth audit §C.5). Net-new feature, not a depth gap — build or shelve?
2. **Required `confidence` on the main content feed?** The enum exists and
   `ContentItem.confidence` is optional. Make it required so nothing on the main
   feed renders unlabeled below-confirmed?
3. **Accounts / UGC?** T6 progress is client-only by design. Cross-device sync,
   favorites, or any user content needs an accounts decision (out of v1 scope so
   far — confirm it stays out).
4. **Awards scope (blocks T24):** curated highlights only, or the full
   1,640-nomination structured corpus? The latter is a large ongoing pipeline.
5. **Filmography / TV / commercials:** do these live in `videos/**` or a new seed
   type? (blocks the non-MV portion of T21.)
6. **Eras Tour date-table scope (T17):** "legs + notable shows" (current) vs.
   every one of 149 date rows. Under the strict reading the first five tours are
   incomplete; pick the bar.
7. **Relationship naming convention:** coy on older exes vs. blunt on recent ones
   — T5 flagged this unresolved; T27 needs one rule applied everywhere.
8. **Monetization (shop-the-look / affiliate):** still blocked on external IP
   counsel; nothing ships until then — confirm still parked.
