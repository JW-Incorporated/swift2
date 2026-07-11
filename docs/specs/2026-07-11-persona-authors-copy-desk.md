# Spec: The Copy Desk — persona authors as living agents

**Status: APPROVED — Joey (product) + Wyatt (architecture), 2026-07-11
(Wyatt's sign-off relayed by Joey in session). Build may proceed per the §9
phases. Still owed from Joey before Phase 2 ships: final persona names and
the disclosure framing (§10) — names default to Theo/Loren/Vera/Deb until he
says otherwise.**

Resolves issue #462 (parked pending "a real spec" — this is it). Builds on the
merged single-voice standard (`docs/content-ops/editorial-voice-and-pipeline.md`,
#449) and the in-flight naming-rule + voice-linter work (#461). Follows the
repo's existing named-agent convention (Karen the content-integrity checker,
Kevin the ticket handler).

## TL;DR

Create a small, fixed team of **four named persona authors** — each a living
agent with a committed charter, an invocable agent definition, and a beat —
plus a **routing table** that gives every piece of site copy a default author,
with explicit per-item overrides where a beat call needs judgment. Authorship
is **derived at sync time**, not stored in the DB, so it costs no migration
and renames stay cheap. Going backward, the sync derivation bylines all ~985
existing items for free and we rewrite **only** the items that fail their
persona's voice check — not all of them. Going forward, every new Taylor
event flows through one pipeline: route → persona drafts → Karen checks
per-persona voice → Codex reviews → seed.

*(Revised 2026-07-11 after Codex adversarial review — see PR #463 for the
findings this version addresses.)*

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
| **Theo** | *theory* | `music`, `release`, `video`, track dossiers, music videos | Music-theory and lyrics nerd. Talks keys, bridges, production credits, five-albums-ago callbacks. Precise, a little breathless about a good key change. |
| **Loren** | *lore* | Theories, egg threads / clowning content | The Easter-egg hunter. Speaks fluent clown, numerology, and timestamp forensics. Playful, self-aware ("we've been wrong before"), never states a theory as fact. |
| **Vera** | *couture* | `fashion`, `sighting` | Red-carpet and street-style historian. Names designers from a blurry photo, connects outfits to eras. Visual, decisive, warm. |
| **Deb** | *debut-era OG* | `relationship`, `business`, `tour`, tour films/documentaries | Been a fan since MySpace. The timeline historian — masters-heist receipts, relationship chronology, tour history. Dry, exact, protective of getting dates right. |

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

## 3. Assignment: routing table + explicit overrides

Per CLAUDE.md rule 8, the *default* for "who takes which copy" is **code, not
judgment** — but real items straddle beats (a `music` item that's really a
friendship-feud timeline; a `tour` item that's really a fashion moment), so
the table gives a default, not a verdict:

- `scripts/copy-desk/routing.mjs` exports one function
  `routeAuthor({ surface, category }) -> personaSlug` backed by a literal
  table. It must be **total over every real surface**, explicitly including:
  era month-items by `category` (`sighting`/`fashion` → Vera,
  `relationship`/`business`/`tour` → Deb, `music`/`release`/`video` → Theo),
  track dossiers (Theo), theories/egg threads (Loren), `video_work` rows by
  their own category (`music_video`/`lyric_video`/`live` → Theo,
  `tour_film`/`documentary` → Deb), standalone release and tour tables
  (Theo / Deb), and site chrome (`house`). Building the table starts from the
  actual CHECK constraints in the migrations, not from this paragraph.
- **Per-item override:** a seed item may carry an optional
  `author: '<slug>'` field. The validator accepts it (it's an explicit,
  reviewable editorial call in the diff); absence means the routing default.
  This is how "Bad Blood, the friendship it ended" lands on Deb's desk even
  though its category is `music` — judgment happens once, in a PR, and is
  recorded in data rather than re-litigated.
- An unknown surface/category fails loudly in `validate-content.mjs`; the
  desk editor extends the table in the same PR.

## 4. Data model: derived, not stored

Authorship is a pure function of `(surface, category, optional override)`, so
we **don't** persist it in Postgres — no new column, no migration, no CHECK
constraint to churn when a persona is renamed:

- `sync-longlive-*.mjs` compute `author` via `routeAuthor()` (+ seed
  override) when building the web layer's generated content, and emit it as a
  field there. The seed runner and DB schema are untouched.
- Persona **slugs are permanent identifiers**; display names/avatars live in
  the charter and can change without touching content. A beat reassignment is
  one routing-table edit + regenerated sync output.
- Honest scope note: this still touches each sync script, the generated
  longlive types, fallback/live parity, and the byline UI — smaller than a
  schema change, but Phase 1–2 work, not a one-liner.

## 5. Backward pass over existing copy — cheap by design

Joey's framing: assessing every piece of text on the site is real work and
must be efficient. The design principle: **byline everything by script;
rewrite only what fails its author's voice check.**

1. **Byline backfill (near-zero cost).** Since authorship is derived at sync
   time (§4), all ~985 seed items + 12 dossiers + theories + videos get
   bylines the moment routing lands — no per-item work. To be explicit about
   what this claims: a backfilled byline means *this desk now owns this item*
   (accountability going forward), **not** that the old copy already conforms
   to the persona's voice. Conformance is Phase 3.
2. **Voice-conformance scan (Karen, not rewrites).** Karen's per-persona
   voice checks (§7) run over the bylined corpus and emit findings per item,
   exactly like the existing CIE fact/safety scans. This is triage, not
   proof: the deterministic layer catches what it can catch; the agent layer
   is best-effort. The full-corpus agent scan is itself the main assessment
   cost of the retro pass — budget it like a CIE run (the 2026-07-10 run
   covered 985 items), and QA it by human-sampling a slice of *unflagged*
   items before trusting the "only rewrite failures" claim.
3. **Targeted rewrites (batched, delegated).** Only flagged items get
   rewritten, batched by era/persona, drafted via the standing ChatGPT
   delegation model (`scripts/ask-chatgpt.mjs` with the persona charter in
   the prompt), fact-checked and integrated by Claude, Codex-reviewed, human
   spot-check on the first batch per persona. **#461's retro naming pass is
   independent and proceeds on its own schedule** — it does not wait for
   this. If its pass hasn't run by the time a Phase 3 batch touches an era,
   coordinate so each item is edited once; otherwise Phase 3 batches simply
   must pass the already-shipped naming linter.

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
  item's derived author selects that persona's charter checks for a second
  pass, same two-layer shape as the existing CIE.
- **What "machine-checkable" concretely means** (adjectives like "warm" or
  "dry" are voice *sketches* for the writer, never checks):
  - *Deterministic layer:* per-persona lexicon allow/ban lists, required
    structural moves (e.g. Loren must carry an explicit speculation marker on
    every theory claim; Theo's dossier sections must reference musical craft
    at least once), tic-frequency caps. Pattern rules, CI-stable.
  - *Agent layer:* "does this read like Theo?" is a judgment call and is
    treated as one — its findings are **advisory (P2-style ticket fodder),
    never a merge gate**. Only the deterministic layer gates.
  - *Calibration fixtures:* each charter ships with a committed golden set —
    ≥5 passing and ≥5 failing sample items — and the deterministic checks
    must classify the golden set correctly in tests. A charter rule that
    can't be expressed this way stays a writer-facing sketch and is dropped
    from the checkable section.

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
  is Joey's call, and it is a Phase 0 gate, not an open thread: bylines do
  not ship (Phase 2) until the disclosure framing is approved.** A public
  byline with unsettled disclosure is the one part of this that's hard to
  walk back.

## 9. Phasing & acceptance criteria

**Phase 0 — decide (this spec).** Joey approves persona count/names/beats,
credit UI direction, **and the disclosure framing (gates Phase 2)**; Wyatt
approves data-model/pipeline shape. Decision-log entry added (draft in §11).
*Done when: spec approved, decisions.md updated.*

**Phase 1 — the desk exists.** Four charters (with golden-set fixtures) +
agent definitions + desk-notes files; `routing.mjs` + tests, total over the
real surfaces in the migrations; validator support for the optional
`author` override; sync scripts derive and emit `author`. No DB migration.
*Done when: `validate-content.mjs` fails on an unroutable item; routing +
golden-set tests pass; each persona agent can be invoked and drafts a sample
item that passes house checks.*

**Phase 2 — bylines everywhere (backward, cheap part).** Sync-derived
bylines land for all existing content; byline UI + meet-the-desk page ship
(disclosure framing already approved in Phase 0). *Done when: every
item/dossier/theory shows a correct byline on mobile and desktop; desk page
live.*

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
   (recommended), or something else? *(Decided in Phase 0; gates Phase 2 —
   see §8.)*
3. **Byline surfaces** — detail views only at first (recommended), or feeds
   too?

## 11. Draft decision-log entry (copy to `docs/decisions.md` on approval)

> **2026-07-XX — Persona author desk.** Adopt four named persona authors
> (charters in `docs/content-ops/personas/`) layered on the #449 house voice;
> category→author routing in `scripts/copy-desk/routing.mjs` with explicit
> per-item seed overrides; authorship **derived at sync time, never stored in
> the DB** (persona slugs permanent, display names mutable); on-site bylines
> with honest editorial-characters framing, gated on approved disclosure.
> Expensive to reverse because bylines are user-visible and authorship
> threads through routing, sync, and Karen. Cost model: authoring-time only,
> no runtime LLM calls; retro pass bylines via sync derivation and rewrites
> only voice-check failures (full-corpus Karen scan is the assessment cost).
