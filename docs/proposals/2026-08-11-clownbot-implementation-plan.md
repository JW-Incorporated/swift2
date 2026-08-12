# Clownbot — implementation plan (DRAFT — pending the founder talk-through)

Status: **DRAFT.** Companion to `2026-08-11-clownbot.md` (the product spec, same
status). Joey wants a dedicated planning session on Clownbot before anything is
locked; this file preserves the design work done 2026-08-11 evening so that
session starts from here instead of from scratch. Nothing below is approved to
build yet.

## Founder decisions already confirmed (Joey, 2026-08-11, in-session)

- Shape: a **chatbot** (not the #36 community theory board — that no-go stands).
- Full re-spec; the 2026-07-07 pre-generation Clownbot design is dead
  (superseded banner added to that doc).
- **The thread/theory/rumor corpora are the bot's inputs** — model never
  invents; deterministic retrieval hands it items.
- **Strict topic blocklist** (relationship-existence, health, pregnancy,
  sexuality, family/minors, legal, private individuals) — deterministic gates,
  not model judgment.
- **No login, open to every visitor** — confirmed acceptable given the limiter
  stack (per-IP rate limit, per-instance daily cap with no-model fallback,
  input/output caps, console spend ceiling, kill switch) — the Mood Chat
  pattern, already live and proven.
- **Current + historical** knowledge: Rumor Desk's daily labeled rumors are in
  scope ("what are we clowning on this week?").
- **True multi-turn conversation**, short capped memory (~6 messages),
  client-held transcript, zero server storage.
- Model: Claude-family behind Mood's caps plumbing; tier = Wyatt's cost call.

## Open for the planning session (nothing else should be)

Surface name + fourth-pill placement (coordinate with Definition-of-Done item
1's nav rethink) · starter-chip copy · redirect/refusal copy tone · cap numbers
+ model tier (Wyatt) · launch posture (proposed: red-team pass + kill switch,
no per-reply review).

---

## The plan (produced by the Plan agent, 2026-08-11; verified against the codebase)

### Codebase findings that adjust assumptions

1. `docs/definition-of-done.md` item 7 (on its own branch/PR #1953) still cites
   the old "no request-path LLM" constraint — Mood Chat already superseded it;
   update when this ships.
2. The rumor tier is small today (**19 vault items with `rumors:` blocks**) —
   "this week" queries must degrade gracefully to open theories
   (`outcome: 'pending'`) and unconfirmed clue pairs.
3. The #36 blocklist wording lives in prose (`docs/decisions.md` 2026-07-07,
   `docs/agents/growth.md`) + partial machine lists in
   `scripts/content-engine/config.mjs`. Repo precedent (`hot-thin-topic.mjs`)
   is mirror-with-pointer-comment across the `scripts/`↔`apps/web` boundary —
   a new TS module owns the runtime blocklist; do NOT import cross-boundary.
4. All five corpora are server-safe TS data modules;
   `apps/web/lib/longlive/search.ts` is the proven in-memory-index pattern to
   reuse. `mood-safety.ts` exports `normalizeForCrisis` for reuse.
5. `share.ts:topbarShareTarget` has an inline mode union — adding `'clown'` to
   `AppMode` is compiler-forced there (return `null`, like mood).
6. Mood's starter chips bypass the model entirely (zero cost) — Clownbot chips
   should do the same via the fallback composer.

### 1. Retrieval — runtime in-memory index (recommended; no generated artifact)

`apps/web/lib/longlive/clown-index.ts`: `ClownDoc` — namespaced id
(`clue:` / `egg:` / `theory:` / `track:` / `rumor:` / `moment:`), type, title,
text (our words only), `label: confirmed|supported|clowning|debunked`,
`labelDetail`, date, eraId, deep link (`{kind:'item'|'lens', id}`), sources,
precomputed normalized fields, `open` flag (live clown material).
`buildClownDocs()` pure over the imported corpora + module-scope singleton.
Exhaustive, compiler-checked label mapping per source enum (CluePair/EggNode
confirmed→confirmed else clowning; TheoryNote outcome map; track dossier
meaning tiers one doc per tier; RumorNote status map with sourceTier+dates in
labelDetail; moments via CONFIRMED_TIER). **Privacy pre-filter at index build:**
blocklist-tripping docs are excluded from the index entirely (e.g. the
bigger-than-the-whole-sky pregnancy-loss dossier is never clowning material) —
tested explicitly.

`apps/web/lib/longlive/clown-retrieve.ts`: pure, injectable `now`/docs;
token-overlap scoring (title weighted) reusing search.ts normalization; era +
motif boosts; default 8 candidates. `detectRecencyIntent()` fixed phrase list
("this week", "right now", …) → rank rumors by `max(reportedOn,lastCheckedOn)`
desc in a 14-day window, then open theories, then unconfirmed pairs.
Mid-conversation: latest message + previous user message tokens at 0.3 weight.

### 2. Multi-turn, zero storage

Client transcript in React state only. POST `{ messages[], starter?, hp? }`;
server caps: last 6 messages / 500 chars each / 3000 total. Stateless server;
logs derived data only (`source, degraded, candidateIds, usedIds, blocked
category`), never message text. Token budget/call: ~1.2k system (with
`cache_control`), ~1.2k candidates, ≤1k transcript, 500 out → ≈$0.015–0.02
Sonnet-class, 10× cheaper Haiku; 200/day cap ⇒ ≤ ~$4/day/instance worst case.

### 3. Prompt + output contract — grounding enforced structurally

**The route renders facts; the model renders vibes.** Model gets numbered
candidates, must reply via forced tool `record_clown_reply{ reply,
usedItemIds[], offTopic? }`; the route builds cards (title/label
badge/date/link/sources) from its own `ClownDoc` data — the model cannot alter
a label, date, or link.

`clown-client.ts` mirrors `mood-client.ts` guarantee-for-guarantee: reserve()
before spend, 8s timeout, one retry, sanitize tool input, `null` on any
degradation (never throw).

`clown-gate.ts` — deterministic output gate; any failure → card fallback:
(1) every usedItemId/[n] marker resolves to a handed candidate;
(2) blocklist re-screen on prose;
(3) **novel-entity check** — extract capitalized runs ≥2 words, 4-digit years,
date-like tokens, quoted strings; allowlist = tokens of handed candidates +
the user's own messages + fixed list (era/album names, months, site surfaces);
any uncovered entity → fail. (Honest scope: blocks invented
people/eggs/years/quotes structurally; wrong predicates about known entities
are handled by prompt + card rendering + red-team.)
(4) length ≤ ~900 chars + "confirmed"-near-marker heuristic.

Response union: `reply { prose, items: ClownCard[], source, degraded }` ·
`redirect` (in-character blocklist copy) · `crisis` (verbatim CRISIS_MESSAGE) ·
`refusal`.

### 4. Blocklist

`clown-blocklist.ts`: `screenTopic()` normalized phrase matching; categories
each with an exported phrase list: relationship-existence, health, pregnancy,
sexuality, family-minors, legal, private-individuals (+sexualization terms).
Seeded from `scripts/content-engine/config.mjs` lists, pointer comments both
ways. Applied at: route input, output gate, index build.
`clown-safety.ts`: crisis reuse + in-character redirect/refusal/disclaimer
copy (APPROVAL-PENDING markers, like mood's safety-language flow).

### 5. Files

New (each with colocated vitest): `clown-index.ts`, `clown-retrieve.ts`,
`clown-blocklist.ts`, `clown-safety.ts`, `clown-fallback.ts` (no-model
composer, seeded-deterministic for tests), `clown-usage.ts` (reuse MoodUsage
class, `CLOWN_DAILY_CAP=200` default), `clown-client.ts`, `clown-gate.ts`,
`clown-starters.ts` (chips resolve zero-model via fallback composer),
`app/api/clown/route.ts` (kill-switch 503 → parse/caps → per-IP rate limit →
crisis → input blocklist → retrieve → compose-or-fallback → output gate),
`components/longlive/ClownChat.tsx`, `ClownItemCard.tsx` (badge styling reused;
click → store `openItem`/`openThread`, SPA nav).

Touched: `store.tsx` (AppMode+'clown'), `share.ts` ('clown'→null + test),
`TopBar.tsx` (fourth tab behind a name const, hidden under kill flag),
`LongLive.tsx`, `LandingPage.tsx` (mode-jump condition ~line 37). Kill switch:
`NEXT_PUBLIC_CLOWN_KILL=1`, read server-side at request time + client-side.

### 6. Stages (Mood precedent — each green and shippable)

1. Pure libs: index/retrieve/blocklist/safety/fallback/starters + full tests.
2. Route, fallback-only (no model), ships dark; curl-verifiable.
3. Compose behind cap + gate; mocked-model route tests (valid / bad-id /
   novel-entity / blocklisted → each lands correctly).
4. UI + wiring; can ship with kill flag on until the name is signed.
5. Red-team + tuning + caps ratified + decisions entry + DoD item 7 flip.

### 7. Red-team acceptance (DoD item 7)

50-question groundedness pass (oblique real items; plausible FAKE eggs expect
honest miss; date bait; drift; "this week" with/without fresh rumors) — zero
invented entities, every claim traces to a card. Blocklist per category:
direct + oblique + multi-turn smuggling + output-side mock. Fallback with no
API key; cap-exhaustion path; rate-limit copy; kill-switch drill; crisis
phrases render CRISIS_MESSAGE alone. Joey device test.
