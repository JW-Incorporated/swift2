# Content Depth Audit — LongLive

Date: 2026-07-08. Scope: the shipped web experience (`apps/web/components/longlive/**`, `apps/web/lib/longlive/**`) plus everything in `supabase/seed/**`. Produced by 6 parallel research passes (inventory, Swiftie-depth critique, UX/journey critique, schema critique, sourcing critique, engagement critique), synthesized below.

---

## A. Executive summary

**The app has two authors' worth of quality living side by side, and users will feel the seam without being able to name it.**

The Clue Web / Decode / theories content (sourced, confidence-graded, honest about what's confirmed vs. speculated) is genuinely good — it would pass a real Swiftie's smell test. Everything else — the hand-curated era moments outside a few flagship eras, `RELATIONSHIPS`, `RUNWAY_LOOKS`, and above all the 450-item synced `VAULT_RAW` dataset that makes up ~90% of what a user actually scrolls through — reads as generic, single-sentence, uncited filler.

**The single most important finding: this is mostly a plumbing problem, not a writing problem.** Real, well-sourced, well-structured content already exists and is sitting unused:
- `supabase/seed/theories/**` has richly sourced, confidence-graded Easter-egg content *better organized* than what's hand-authored in the shipped Clue Web — and it's never synced to the live UI at all.
- `supabase/seed/content/**`'s Tier-1 `moment.context` (the actual narrative paragraph) and `sources[]` (real citations) exist upstream, but `scripts/sync-longlive-content.mjs` currently drops both on the way into the live `ContentItem` shape — vault items render as one flat sentence with zero visible citation, even when the seed author did the work.
- `ContentItem` (the type behind the primary era-scroll surface — the app's main real estate) has **no source field and no confidence field at all**. Hand-curated content is structurally uncited, independent of whether the research behind it was good.

**Second finding: the interaction engineering is ahead of the content.** The scrubber physics, the Crossings math, the Clue Web constellation — all sophisticated. The text they're built to display is often one sentence. This is a rare, fixable-first situation: don't build more interaction, feed the interaction you have.

**Third finding: zero retention mechanics exist.** No accounts (out of v1 scope, correctly), but also no localStorage-backed progress, no completion states, no freshness signals, no favorites — genuinely buildable now, entirely client-side, and currently just absent.

**Verdict on effort allocation:** fix the plumbing (sync script + schema + citation display) before commissioning any new writing. It's higher leverage, lower risk of fabrication, and faster.

---

## B. Full content inventory

*(Condensed from the inventory-mapper and UX-critic passes — see full per-file detail in agent transcripts if needed.)*

| Surface | File(s) | Depth | Priority |
|---|---|---|---|
| Era hero/intro | `EraSection.tsx`, `eras.ts` | **Strong** — every era has a distinct, well-written 2-sentence intro + real lyric | P2 |
| Era moment cards, hand-curated | `content.ts` `RAW` | **Strong** on Red/1989/Midnights (7-9 items, real prose); **thin** on folklore (2)/evermore (1)/speak-now (2) | P0 |
| Era moment cards, synced | `content-vault.generated.ts` (450 items) | **Thin** — `body[0]` is usually a verbatim copy of `summary`, one sentence, no citation, no media | P0 |
| Timeline scrubber hover | `TimelineScrubber.tsx` | **Acceptable** interaction, **thin** content (title + date only, no summary) | P2 |
| Moment detail modal | `MomentDetail.tsx` | **Strong** for curated items, **jarring** for vault items — full-bleed immersive modal opens for one sentence | P0 |
| Threads gallery | `ThreadsMode.tsx`, `THREADS` | **Acceptable** — tight editorial copy, no preview of contents | P2 |
| Love Story thread | `RELATIONSHIPS` (6 entries) | **Thin** — no sources field at all, one sentence per relationship, one date/era-mislabeling found (see §C.5) | P0 |
| Fashion/Runway thread | `RUNWAY_LOOKS` (12 entries) | **Thin-to-acceptable** — one look per *era*, not per occasion; no designer/event credit on 11 of 12 | P1 |
| Taylor's Version thread | `RERECORDS` (6 entries) | **Acceptable** — good stat tiles, thin prose | P2 |
| Clue Web / Easter eggs | `ClueWeb.tsx`, `EGG_NODES` (30) | **Strong mechanic**, **uneven coverage** (dense pre-2020, sparse ttpd/tloas), **single-sourced throughout** | P1 |
| The Decode | `CLUE_PAIRS` (30 pairs — note: agent counts differ slightly by what's counted as a "pair" vs "entry"; treat 14–30 as the working range pending a direct count) | **Strong** — best-sourced content in the app, 2-3 sources/entry, correct confidence labeling | P1 |
| The Proposal | `PROPOSAL_BEATS` (4 beats) | **Acceptable** — well-sourced, but 4 beats for 2+ years is sparse, big date gaps | P1 |
| Crossings overlay | `Crossings.tsx` | **Derivative** — capped by the thinness of what it crosses (esp. Love Story) | P2 |
| Era media (Spotify) | `EraMedia.tsx` | **Complete** — 12/12 eras, minor TV-vs-original edition question unresolved | P2 |
| Moment video (YouTube) | `MomentVideo.tsx` | **Spotty by design** — only 10 curated items have video; 0 of 450 vault items do (schema has no video field for them) | P1 |
| Search | *(absent)* | **Missing entirely** — no search component anywhere | P0 |
| Glossary | *(absent)* | **Missing entirely** — no fan-vocabulary reference; "thread"/"crossing"/"motif" assumed-knowledge | P1 |
| Progress/completion state | *(absent)* | **Missing entirely** — no visited-state tracking, no trail completion, no localStorage beyond one UI hint flag | P0 |
| Theories/videos/tracks/tours/releases pipelines | `supabase/seed/{theories,videos,tracks,tours,releases}/**` | **Well-authored, zero reach** — not synced to the live UI at all | **P0** |

---

## C. Depth standard / rule set

Every content type below gets a **required-field bar**. Nothing ships to a live surface without these fields populated (or explicitly marked absent, never silently omitted).

### C.1 Era moment / `ContentItem`
- `date` (real day-level precision where known — not forced to `-01`)
- `title`, `summary` (one sentence, distinct from body — never identical text)
- `body` (2+ paragraphs of original narrative prose, not a repeated summary)
- `tags` (existing `ContentTag[]`)
- `sources: {name, url}[]` — **new required field**, minimum 1, prefer 2 for any non-trivial claim
- `confidence` — **new required field**, reuse the `TheoryConfidence` enum already built for theories
- `image` (real or era-fallback, explicit either way)
- `video?` (verified per §5.5's oEmbed rule)
- `relatedIds?: string[]` — **new field** — cross-links to eggs/threads/other moments

### C.2 Easter egg (`EggNode`)
- Plant date, payoff date (both, not folded into one `year`)
- Exact plant description, exact payoff description (currently one flattened `detail` string — split it)
- "Why fans noticed it" — a distinct field from the plain description
- `confirmed` — already exists as boolean; **upgrade to graded enum** (official/confirmed/strong_fan_consensus/plausible/debunked — mirror `THEORY_CONFIDENCE`)
- `sources: {name,url}[]` — minimum 2 for anything claiming `confirmed: true`; 1 minimum for theories, but must not be a bare social-media reupload (the one current YouTube-reupload source, `egg-tloas-orange-doors`, should be replaced or supplemented)
- Related songs/albums/eras — via `relatedIds`
- Media/visual reference
- One-sentence summary + deep-dive paragraph (currently one field only)
- "What to look for next" — optional, for open/pending eggs only

### C.3 Song/lyric/reference entry
- Song/album/era
- The lyric or reference itself, quoted minimally (never full verses — copyright + `docs/decisions.md` no-verbatim rule)
- Publicly known background, cited
- Fan theories **visually and structurally separated** from confirmed facts — not just tone, an actual field/section boundary
- Connections to other songs (`relatedIds`)
- Theme/emotional analysis (original prose)
- Source citations
- Recommended related content

### C.4 Timeline item
- Date (real precision)
- Event, era
- "Why it mattered" (distinct from a bare description)
- "What it connected to later" — this is the connective tissue the app currently lacks almost everywhere outside Clue Web
- Source
- Related app content (`relatedIds`)

### C.5 Quiz item *(net-new content type — none currently exist)*
- Question, correct answer, 2-3 plausible wrong answers
- Explanation shown after answering (with source)
- Difficulty tier, era/category
- "Why it's interesting" — the hook that makes answering worth it

### C.6 A concrete violation, to make the bar real
`Relationship rel-5` ("The 1989 Whirlwind") is dated Dec 2012–Jan 2013 and filed under the **Red** era, not 1989 — a real fan will clock this immediately as either an era-tagging bug or a sign nobody fact-checked it. This is exactly the kind of error the required-fields bar (source + confidence + explicit era-assignment reasoning) would have caught before it shipped.

---

## D. Gap analysis — missing categories

Confirmed present vs. absent, from the six audits:

| Category | Status |
|---|---|
| Era timelines | ✅ Present (`EraStream`/`TimelineScrubber`) |
| Easter egg chains | ✅ Present (`MOTIF_MEMBERSHIP`, Clue Web) but not linked from era mode |
| Confirmed vs. unconfirmed clues | ✅ Present in Clue Web/Decode, **absent everywhere else** including the main era-scroll surface |
| Lyric webs | ⚠️ Weak — `relatedIds`/cross-song linking doesn't exist as a field |
| Music video references | ⚠️ Spotty — 10/460 items have video |
| Outfit/color symbolism | ⚠️ Thin — one look per era, no occasion-level detail |
| Tour moments | ⚠️ Authored in `supabase/seed/tours/**`, **not synced to UI at all** |
| Award-show moments | ⚠️ A few in `content.ts`, not a distinct category |
| Social post clues | ⚠️ Present as individual eggs, no dedicated "social clue" type |
| Numerology/13 references | ✅ Present as one motif trail |
| Fan vocabulary/glossary | ❌ **Missing entirely** |
| "Beginner Swiftie" explainers | ❌ **Missing entirely** — onboarding is scattered, one-shot, feature-local |
| "Deep Swiftie" rabbit holes | ⚠️ Clue Web is the only one, and it has no completion payoff |
| Recurring motifs | ✅ Present (`MOTIFS`) |
| Source library | ❌ **Missing as a UI concept** — sources exist in data, never surfaced except in Clue Web |
| Confidence labels | ⚠️ Exist in data for eggs/pairs/theories, **absent from the schema for the main content feed** |
| Search | ❌ **Missing entirely** |
| Progress/visited-state/completion | ❌ **Missing entirely** |
| Freshness/"new since last visit" signal | ❌ **Missing entirely**, despite the Supabase sync now making content genuinely change over time |

---

## E. Page-by-page recommendations

**Era mode (`EraSection`/`MomentDetail`):**
1. Fix the sync script (§F) so vault items carry real body text + citations before anything else — this alone closes the biggest visible gap.
2. Add a visible source affordance to `MomentDetail.tsx`, mirroring the pattern already proven in `ClueWeb.tsx` (a plain "Source: [outlet]" link list at the bottom of the body).
3. Add a confidence pill next to any claim sourced from a theory/speculative record — reuse the Clue Web pill component.
4. Link a moment's `hiddenClue` (or future `relatedIds`) forward into the actual Clue Web trail it belongs to — the data (`MOTIF_MEMBERSHIP`) already knows this relationship; the UI doesn't use it.
5. Backfill thin eras (folklore: 2 items, evermore: 1, speak-now: 2) before anything else gets more content — an obvious, visible gap on first scroll.

**Threads mode:**
6. `RELATIONSHIPS`: add `sources` field, fix the `rel-5` era mislabeling, decide once on a naming convention (currently coy on old exes, blunt on recent ones — pick one and apply everywhere).
7. `RUNWAY_LOOKS`: move from one look per era to multiple dated, occasion-specific looks (red carpet vs. tour vs. video) — the Showgirl entry (Bob Mackie, Portofino orange, dated, sourced) is the template; the other 11 should match its specificity.
8. Clue Web: fill ttpd/tloas coverage gaps, replace/supplement the one weak YouTube-reupload source, make the "connects to" chips in `TrailView` clickable (they already are in the constellation view — same data, missing affordance).
9. The Proposal: expand beyond 4 beats — the Sept 2023 Cincinnati appearances, the friendship-bracelet lyric callback, and 2024 tour Easter eggs are all real, well-documented, and missing.

**Cross-cutting (affects every page):**
10. Build a glossary/fan-vocabulary page or drawer — "thread," "crossing," "motif trail," "vault track" all currently assumed-knowledge.
11. Build search — flagged as entirely absent by two independent audits.
12. Build the localStorage progress/completion layer (§G tickets) — highest-leverage retention fix, buildable now, no backend needed.

---

## F. Schema/template recommendations

**Highest-leverage fix, do this first:** `scripts/sync-longlive-content.mjs` currently drops `sources`, `slug`, full `tags[]`, and `moment.context` on the way from Supabase seed data into `content-vault.generated.ts`. The richer data already exists upstream — this is a transform-logic fix, not new research.

**Schema additions to `apps/web/lib/longlive/types.ts`:**
- Add a shared `SourceRef`-shaped type (or import `packages/shared/src/vault-types.ts`'s existing one) and `sources?: SourceRef[]` on `ContentItem`, `Relationship`, `RunwayLook`, `HiddenClue`.
- Add a shared graded confidence enum (reuse `TheoryConfidence`/`TheoryOutcome` from `vault-types.ts` rather than inventing a new one) on `ContentItem`, `Relationship`; upgrade `EggNode.confirmed`/`CluePair.confirmed` from boolean to the same graded enum.
- Promote `HiddenClue` to a first-class plant/payoff structure matching `CluePair`'s shape (dates + confidence + sources on both ends) — currently `HiddenClue` is bare `{clue, payoff}` prose sitting right next to `CluePair`, which already does this correctly.
- Add `relatedIds: string[]` for real cross-type linking (moment ↔ egg ↔ thread ↔ motif) — today the *only* cross-linking is egg-to-egg (`EggLink`) and a dormant, unused `Theory.relatedSlugs`.
- Add a `Glossary`/`Term` type — doesn't exist in either schema.
- Add a `Quiz`/`QuizQuestion` type per §C.5 — doesn't exist.

**Template system (reusable content shapes):**
- Easter egg detail: plant `{date, description, media?}` + payoff `{date, description, media?}` + why-noticed + confidence + sources[] + relatedIds[] + summary + deep-dive.
- Song detail: song/album/era + lyric (minimal quote) + background (cited) + theories (separated) + relatedIds + theme analysis + sources[].
- Era page: intro + tagline + lyric + hero image + `relatedIds` into its threads/eggs (currently implicit via `eraId` matching, should be explicit).
- Timeline event: date + event + era + why-it-mattered + what-it-connected-to-later + source + relatedIds.
- Quiz question: question + answer + distractors + explanation + source + difficulty + era/category + why-interesting.
- Glossary term: term + definition + first-appears-in (relatedIds) + example usage.
- Fan theory page: claim + evidence + confidence + outcome + sources[] + relatedIds — this template **already exists** in `supabase/seed/theories/**`; just needs a UI and a sync path.
- Source/citation object: `{name, url, publisher?, type?, accessed_at?, reliability_score?}` — already fully built as `SourceRef` in `vault-types.ts`; reuse, don't reinvent.

---

## G. Prioritized implementation tickets

### P0 — plumbing (do first, unlocks everything else)

**T1. Wire the theories/videos/tracks/tours/releases seed pipelines into the live UI**
- Problem: fully-authored, sourced, confidence-graded content sits unused in `supabase/seed/{theories,videos,tracks,tours,releases}/**`.
- User impact: closes the single biggest content-depth gap in the app without writing a word of new content.
- Files: `scripts/sync-longlive-content.mjs` (extend beyond `month_item`), `apps/web/lib/longlive/types.ts` (new types per §F), new components or extensions to `ClueWeb.tsx`/era views to render theories/videos.
- Acceptance criteria: theories render with confidence/outcome badges somewhere in the live UI; track guide accessible per-album; video metadata available to `MomentVideo`.
- Priority: **P0**.

**T2. Fix the sync script to preserve sources, full body text, and tags**
- Problem: `sync-longlive-content.mjs` flattens `moment.context` and drops `sources[]`/`slug`/full `tags[]`.
- User impact: every one of the 450 vault items gains a real citation and real body text instead of a repeated one-liner.
- Files: `scripts/sync-longlive-content.mjs`, `apps/web/lib/longlive/content-vault.generated.ts` (regenerate), `types.ts` (add `sources` field first — depends on schema change).
- Acceptance criteria: `npm run content:coverage` shows 0 items with missing sources in the generated file; `MomentDetail` renders a source for every vault item.
- Priority: **P0**.

**T3. Add source + confidence display to `MomentDetail.tsx`**
- Problem: the app's primary surface shows zero attribution for any claim.
- Files: `MomentDetail.tsx`, depends on T2/schema change.
- Acceptance criteria: every moment with `sources` populated shows a "Sources" section; every moment with a confidence level below "confirmed" shows a visible pill.
- Priority: **P0**.

**T4. Backfill the thinnest eras** (folklore: 2 items, evermore: 1, speak-now: 2 in hand-curated `content.ts`)
- Problem: visible, immediate quality drop-off scrolling from Red/1989 into these eras.
- Acceptance criteria: each era reaches parity with the flagship eras' item count and prose depth (2+ paragraphs per item, sourced).
- Priority: **P0**.

**T5. Fix `RELATIONSHIPS` — add sources, fix `rel-5` era mislabeling, resolve the naming-convention inconsistency**
- Priority: **P0** (factual error + credibility risk).

### P1 — structural/UX

**T6. Build a localStorage progress/visited-state layer** (moments seen, trails completed, favorites)
- Files: `store.tsx` (persist to localStorage), `ClueHome`/`TrailCard` (render real counts), `EraSection` moment grid (seen/new indicator).
- Acceptance criteria: returning users see real "X/Y explored" counts; trail completion shows an end-state card.
- Priority: **P1**.

**T7. Build search + glossary**
- Files: new `SearchBar` component wired into `TopBar.tsx`, new `Glossary` page/drawer.
- Priority: **P1**.

**T8. Make Clue Web "connects to" chips clickable in trail view** (already works in constellation view — same data)
- Priority: **P1**.

**T9. Cross-link moments → eggs/threads via `relatedIds`**
- Depends on schema change in F.
- Priority: **P1**.

**T10. Expand The Proposal beats, Runway looks (multi-occasion per era), Clue Web ttpd/tloas coverage**
- Priority: **P1**.

### P2 — polish

**T11. Content-freshness banner** ("3 new moments since your last visit") using the sync script's timestamp.
**T12. Richer share cards** with stats/progress.
**T13. Timeline scrubber hover shows summary, not just title/date.**
**T14. Resolve 1989/folklore Spotify-embed TV-vs-original-edition question.**

---

## H. Twenty examples: weak content rewritten to premium depth

Each pair below: **current** (as shipped or close paraphrase) → **premium rewrite**, following the C.1–C.4 standard. Facts below are drawn from real, known, verifiable public information; anything genuinely uncertain is explicitly marked as such rather than invented. Treat every rewrite as a *template demonstration*, not final copy — before shipping, each must go through the actual source-verification pass (this document does not substitute for that).

1. **Debut liner notes clue** — *Current:* "The liner notes hid secret messages in capital letters." → *Premium:* "Starting with her 2006 debut album, Swift began hiding messages in randomly capitalized letters scattered through each album's printed lyrics — spelling out phrases and names tied to each song. She's spoken about the practice in interviews (confirmed, not fan theory); MTV News and Billboard have both published decoded transcriptions of specific albums. **Why it matters:** this is the origin of the "capital letters" tradition fans still decode on every release — the direct ancestor of the Easter-egg culture the rest of this app is built around." *(Sources: MTV News, Billboard — verify specific article links before shipping.)*

2. **VMA moment, vague** — *Current:* "a VMAs moment." → *Premium:* "September 13, 2009: during Swift's Best Female Video acceptance speech at the MTV Video Music Awards, Kanye West took the microphone from her to argue Beyoncé's 'Single Ladies' deserved the award. President Obama later called West a 'jackass' in an off-record remark that leaked. **Confirmed**, extensively documented on record. **What it connected to later:** the moment became a recurring reference point in Swift's catalog and in the broader reputation era's snake-emoji narrative years later."

3. **Reputation single sentence** — *Current:* generic reference to "reclaiming the snake." → *Premium (already close to what exists in EGG_NODES, use as the bar):* full plant→payoff structure already modeled well in `egg-snake-lwymmd` — the standard to bring the rest of the app up to.

4. **`vault-1989-...` single-sentence body** — *Current:* summary and body identical, one clause. → *Premium:* expand to 2 paragraphs using the seed file's actual `moment.context` field (which exists upstream and is currently being dropped by the sync script — this is T2, not new writing).

5. **`rel-5` "1989 Whirlwind"** — *Current:* one sentence, mis-filed under Red era. → *Premium:* correct the era assignment, add real dates (Nov 2012–Jan 2013), add sources, and either name the relationship explicitly or apply the same vagueness convention used elsewhere consistently.

6. **Runway look, generic era vibe** — *Current:* "Midnight Glam — Retro-70s sparkle, deep blues" (no occasion, no date). → *Premium, using the Showgirl entry as the template:* name a specific occasion ("the [specific] red carpet, [date]"), a designer if known, and a real image credit — not an evocative-but-unverifiable vibe description.

7. **`egg-tloas-orange-doors`** — *Current:* single YouTube-reupload source. → *Premium:* supplement with Taylor Nation's own channel or a written outlet (Variety/Billboard/Rolling Stone covered the stunt) and keep `confirmed: false` since the cipher meanings themselves were fan-interpreted.

8. **`egg-wood-track-tloas`** — *Current:* sourced to an Apple Music album listing for a claim about fan theorizing (source doesn't support the claim). → *Premium:* source the *fan theory* claim to an actual fan-theory discussion/press piece; keep the Apple Music link only for the track's existence, not the theory.

9. **Empty filter state** — *Current:* "No moments match that filter in this era." → *Premium:* same message + a one-tap "Clear filter" action, per the UX critic's finding.

10. **Clue Web trail "connects to" chips** — *Current:* inert text. → *Premium:* make them clickable (T8) — this is a wiring fix, not new content.

11. **The Proposal, date gap** — *Current:* jumps from Sept 2023 to Feb 2024 to Aug 2025 with nothing between. → *Premium:* add the documented 2024 Eras Tour appearances and setlist Easter eggs fans tracked in real time, sourced to tour-recap coverage.

12. **Thread gallery card, no preview** — *Current:* title + kicker + one-line "what." → *Premium:* add an item count and a single representative highlight ("14 documented clue pairs, from 'Delicate' to 'ME!'") so the card previews depth before the click.

13. **Timeline scrubber hover** — *Current:* title + date only. → *Premium:* add the one-line summary already stored on the item — zero new content, just surface what exists (T13).

14. **`HiddenClue` bare prose** — *Current:* `{clue: "...", payoff: "..."}` with no dates/sources. → *Premium:* restructure to match `CluePair`'s shape — dated plant, dated payoff, sources on each, confidence label.

15. **Folklore era, 2 items total** — *Current:* the album that arguably has the richest verified lore (the "William Bowery" reveal, the Lakes/lockdown writing story, the folklorian character trilogy — Betty/James/August) reduced to 2 generic items. → *Premium:* minimum parity with Red/1989 — at least the William Bowery reveal (confirmed via Long Pond documentary, already correctly handled in the theories seed file per the depth critic's finding — again, this is a sync problem, T1/T2, not missing research.

16. **Evermore era, 1 item total** — *Current:* one item for an entire album. → *Premium:* same fix path as #15 — the seed content likely already has more; confirm via `supabase/seed/content/evermore.mjs` and sync it in.

17. **Speak Now, thin (2 items)** — *Current:* minimal. → *Premium:* the album's "written entirely alone" distinction (verifiable, notable) and the Grammy nomination context are both real, citable facts currently underused — check `supabase/seed/content/speak-now.mjs` for content already researched but not synced.

18. **Track guide, absent from UI entirely** — *Current:* `supabase/seed/tracks/**` fully populated, zero UI surface. → *Premium:* a per-album track list view (T1) — this is the single largest "new feature that isn't actually new content" opportunity in the whole audit.

19. **Share card, generic** — *Current:* era image + title + one-line blurb. → *Premium:* add a stat or progress hook per T12 ("1 of 30 Easter eggs decoded") so the shared card itself carries curiosity-gap value.

20. **No glossary entry for "crossing"** — *Current:* explained in one sentence inside the Threads gallery header, nowhere else. → *Premium:* a glossary term: "**Crossing** — a moment where two narrative threads (e.g. Fashion and Love Story) touch the same point in time, surfaced as an overlay showing both threads on one shared axis. See also: Thread, Motif trail."

---

## I. Suggested workflow for Claude/Codex/Gemini going forward

1. **Plumbing before prose.** Run T1–T3 (wire the seed pipelines, fix the sync script, add source/confidence display) before commissioning any new content — per this audit, most of the "missing depth" is actually already-written content that never reached the UI.
2. **Claude (or Codex) for schema + sync-script work.** This is precise, typed, review-cycle-appropriate engineering — exactly the Codex-reviewed workflow already in use this session.
3. **Content research/verification → a content-focused subagent or Gemini, with mandatory source-check gates**, following the exact rules already encoded in `supabase/seed/theories/**`'s `confidence`/`outcome` model — that model is good, it just needs to reach more content types (moments, relationships, runway looks) and then reach the UI.
4. **Never let a content-writing pass and a plumbing pass run simultaneously against the same files** — this session hit real branch-collision issues when parallel agents weren't fully isolated; use `isolation: "worktree"` for every content-writing agent and verify the isolation actually took effect before trusting the branch state.
5. **A standing "coverage gate" in CI** (extend `scripts/content-coverage.mjs`) should check: every `ContentItem` has ≥1 source once T2 ships, every `EggNode` confidence label matches its outcome, no era falls below a minimum item-count floor. This turns this one-time audit into a permanent guardrail instead of a snapshot that goes stale.
