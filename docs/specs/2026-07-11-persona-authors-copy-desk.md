# Spec: The Copy Desk — persona authors as living agents

**Status: proposed — needs Joey (product) + Wyatt (architecture) approval before any build.**

Resolves issue #462 (parked pending "a real spec" — this is it). Builds on the
merged single-voice standard (`docs/content-ops/editorial-voice-and-pipeline.md`,
#449) and the in-flight naming-rule + voice-linter work (#461). Follows the
repo's existing named-agent convention (Karen the content-integrity checker,
Kevin the ticket handler).

## TL;DR

Create a small, fixed team of **four named persona authors** — each a living
agent with a committed charter, an invocable agent definition, and a beat —
plus a **deterministic routing table** that assigns every piece of site copy to
exactly one author. Every content item gets an `author` field and an on-site
byline. Going backward, a script bylines all ~985 existing items for free and
we rewrite **only** the items that fail their persona's voice check — not all
of them. Going forward, every new Taylor event flows through one pipeline:
route → persona drafts → Karen checks per-persona voice → Codex reviews → seed.

---

## 1. What this is (and isn't)

- **It layers on #449; it does not replace it.** The house rules — sourcing
  bar, no-fabrication, length limits, the AI-tell cut-on-sight list, no
  first-person-as-Taylor — stay universal and non-negotiable for every
  persona. A persona is a *voice dial within* the house style, never a
  license to break it. #461's naming rule ("Taylor," not bare "Swift") is
  likewise universal.
- **Personas are a lens for authoring, not autonomous generators.** A persona
  is a charter that Claude (or Codex, per the standing content-delegation
  model) writes *through*. "Author credit" means the content was drafted
  against that charter and passed that charter's checks — not that an
  unsupervised bot published it. Everything still goes through the existing
  draft → cross-review → human-spot-check pipeline.
- **No runtime LLM cost.** All persona work happens at build/authoring time.
  The Vault stays static; bylines are just data.

## 2. The team: four authors, four beats

Four is deliberate: enough that the beats feel like real specialties, few
enough that each voice stays distinct and maintainable (Karen has to be able
to tell them apart mechanically). Names follow the Karen/Kevin convention —
human first names with a mnemonic hook. **Names and backstories are Joey's to
veto/rename; the beat structure is the load-bearing part.**

| Persona | Mnemonic | Beat (routing) | Voice sketch |
|---|---|---|---|
| **Theo** | *theory* | `music`, `release`, track dossiers | Music-theory and lyrics nerd. Talks keys, bridges, production credits, five-albums-ago callbacks. Precise, a little breathless about a good key change. |
| **Loren** | *lore* | Theories, egg threads / clowning content | The Easter-egg hunter. Speaks fluent clown, numerology, and timestamp forensics. Playful, self-aware ("we've been wrong before"), never states a theory as fact. |
| **Vera** | *couture* | `fashion`, `sighting` | Red-carpet and street-style historian. Names designers from a blurry photo, connects outfits to eras. Visual, decisive, warm. |
| **Deb** | *debut-era OG* | `relationship`, `business`, `tour` | Been a fan since MySpace. The timeline historian — masters-heist receipts, relationship chronology, tour history. Dry, exact, protective of getting dates right. |

- **Site chrome copy** (`docs/copy/*` — about, first-run, disclaimers, UI
  microcopy) is **unsigned house voice**, credited to the desk as a whole,
  not a persona. Bylines are for editorial content, not buttons.
- **One item = exactly one author.** A real-world event that spans beats is
  already split into one `month_item` per category (per `depth-rubric.md`);
  each split item routes independently. A track dossier is one document with
  one author (Theo), even where it discusses eggs — he can cite Loren's
  threads.

### 2.1 What makes them "living agents"

Each persona is persistent infrastructure, not a one-off prompt:

1. **Charter** — `docs/content-ops/personas/<name>.md`. The source of truth:
   backstory, beat, and — critically — a **machine-checkable voice section**:
   signature moves, diction guardrails, banned tics, 3+ before/after
   examples. If a voice rule can't be checked (by Karen's deterministic layer
   or its agent layer), it doesn't go in the charter.
2. **Agent definition** — `.claude/agents/<name>.md`, so any session (or CI
   job) can invoke the persona by name to draft or revise copy. The agent
   definition loads the charter + house style; it is thin and never
   duplicates rules.
3. **Desk notes** — `docs/content-ops/personas/<name>-notes.md`, an
   append-only file the persona updates when it learns something durable
   ("Joey vetoed X phrasing," "this beat's best sources are Y"). This is the
   persistence that makes the same author show up across sessions instead of
   being reinvented each time.

## 3. Assignment: the routing table (deterministic, committed)

Per CLAUDE.md rule 8, "who takes which copy" is **code, not judgment**:

- `scripts/copy-desk/routing.mjs` exports one function
  `routeAuthor({ surface, category }) -> personaSlug` backed by a literal
  table (the beat column above). Surfaces: era month-items (by `category`),
  track dossiers, theories/egg threads, videos (routed by the video's
  category), site chrome (`house`).
- The table is total: every valid surface/category combination maps to
  exactly one author, so routing never needs an LLM, never drifts, and the
  backfill and the forward pipeline share the same function.
- Genuinely ambiguous new surfaces (a content type the table doesn't know)
  fail loudly in `validate-content.mjs` — the desk editor (the Claude session
  doing the work) extends the table in the same PR, which makes the decision
  reviewable.

## 4. Data model

- New `author` column on `month_item` (and the corresponding field on track
  dossiers, theories, and videos in the seed/longlive layer), values
  CHECK-constrained to the persona slugs + `house`.
- `scripts/validate-content.mjs` requires the field and re-derives it via
  `routeAuthor()` — a mismatch between the stored author and the routing
  table is a validation error, so the table can't silently drift from data.
- Sync scripts (`sync-longlive-*.mjs`) carry `author` through to the web
  layer.

## 5. Backward pass over existing copy — cheap by design

Joey's framing: assessing every piece of text on the site is real work and
must be efficient. The design principle: **byline everything by script;
rewrite only what fails its author's voice check.**

1. **Byline backfill (near-zero cost).** One script run applies
   `routeAuthor()` to all ~985 seed items + 12 dossiers + theories + videos
   and writes the `author` field. Deterministic, reviewable as one diff, done
   in minutes.
2. **Voice-conformance scan (Karen, not rewrites).** Karen's per-persona
   voice checks (§7) run over the bylined corpus and emit findings per item,
   exactly like the existing CIE fact/safety scans. This turns "assess every
   piece of text" into a ranked worklist instead of a blanket rewrite.
3. **Targeted rewrites (batched, delegated).** Only flagged items get
   rewritten, batched by era/persona, drafted via the standing ChatGPT
   delegation model (`scripts/ask-chatgpt.mjs` with the persona charter in
   the prompt), fact-checked and integrated by Claude, Codex-reviewed, human
   spot-check on the first batch per persona. The #461 naming-rule retro
   pass folds into these same batches — one touch per item, not two.

## 6. Forward pipeline: how new Taylor events get authored

One consistent path for all future copy, whoever initiates it:

1. **Intake** — a new event arrives (Joey files it, a content session picks
   it up, or a future news-intake job surfaces it).
2. **Split** — the event becomes one item per category, per the existing
   depth-rubric rule.
3. **Route** — `routeAuthor()` stamps each item's author. No discussion, no
   per-item judgment.
4. **Draft** — the assigned persona agent drafts against its charter + house
   style + sourcing bar.
5. **Check** — `validate-content.mjs` (structure, author match) + Karen's
   per-persona voice check + existing fact/safety checks.
6. **Review** — Codex cross-review per the #449 pipeline, unchanged.
7. **Seed** — normal PR → seed flow.

The only new steps for authors of backend processes are (3) and the persona
context in (4) — everything else is the pipeline we already run.

## 7. Karen: per-persona voice checking (extends #461, doesn't fork it)

#461 proceeds now on the single house standard — that work is not thrown
away. When personas land:

- Karen's voice checks become **two-tier**: universal house rules (AI-tells,
  naming rule, length — exactly #461's linter) run on everything; then the
  item's `author` field selects that persona's machine-checkable charter
  section for a second pass (deterministic tic/diction checks + an agent
  "does this read like Theo?" judgment, same two-layer shape as the existing
  CIE).
- A charter rule that Karen can't check gets removed from the charter — this
  is the forcing function that keeps personas from becoming unenforceable
  vibes.

## 8. On-site author credit (the product feature)

- **Byline** on item detail views and dossier headers: "By Vera" with the
  persona's mark/avatar. Feed/list views stay clean (byline is a detail-view
  affordance) — Joey can widen this later.
- **Meet-the-desk page** (one page, four cards): each persona's backstory,
  beat, and a link to everything they've written. Bylines link here.
- **Honesty framing:** the site already leans into being unofficial
  (`docs/copy/unofficial.md`). The desk page should say plainly, in-voice,
  that these are the site's editorial characters — personas our team writes
  through — not disguised real people. Pretending they're human staff is a
  trust risk the moment anyone asks; owning it is on-brand. **Exact framing
  is Joey's call (see open questions).**

## 9. Phasing & acceptance criteria

**Phase 0 — decide (this spec).** Joey approves persona count/names/beats +
credit UI direction; Wyatt approves data-model/pipeline shape. Decision-log
entry added (draft in §11). *Done when: spec approved, decisions.md updated.*

**Phase 1 — the desk exists.** Four charters + agent definitions + desk-notes
files; `routing.mjs` + tests; `author` field, migration, validator + sync
support. *Done when: `validate-content.mjs` fails on a missing/misrouted
author; each persona agent can be invoked and drafts a sample item that
passes house checks.*

**Phase 2 — bylines everywhere (backward, cheap part).** Backfill script run;
all existing content carries an author; byline UI + meet-the-desk page ship.
*Done when: every item/dossier/theory shows a correct byline on mobile and
desktop; desk page live.*

**Phase 3 — voice conformance (backward, work part).** Karen per-persona
checks land; scan the corpus; rewrite flagged items in batches (folding in
#461's retro naming pass). *Done when: scan reports zero P1 voice findings;
first batch per persona human-spot-checked.*

**Phase 4 — steady state.** Forward pipeline (§6) is the documented, only way
copy gets authored; `editorial-voice-and-pipeline.md` updated to reference
the desk. *Done when: docs updated; one real new event has flowed end-to-end.*

Each phase is a separate PR train; #461 must not wait on any of it.

## 10. Open product questions (Joey)

1. **Names/backstories** — Theo/Loren/Vera/Deb are proposals with mnemonic
   hooks; rename freely. Count (4) is a recommendation, not sacred — but
   every added persona is a permanent maintenance cost (charter + checks).
2. **Disclosure framing** on the meet-the-desk page — "editorial characters"
   (recommended), or something else?
3. **Byline surfaces** — detail views only at first (recommended), or feeds
   too?

## 11. Draft decision-log entry (copy to `docs/decisions.md` on approval)

> **2026-07-XX — Persona author desk.** Adopt four named persona authors
> (charters in `docs/content-ops/personas/`) layered on the #449 house voice;
> deterministic category→author routing in `scripts/copy-desk/routing.mjs`;
> `author` field on all content; on-site bylines with honest
> editorial-characters framing. Expensive to reverse because bylines are
> user-visible and the author field threads through schema, seeds, sync, and
> Karen. Cost model: authoring-time only, no runtime LLM calls; retro pass
> bylines by script and rewrites only voice-check failures.
