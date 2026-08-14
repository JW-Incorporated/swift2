# PLAN.md — Clownbot rebuild (title + full-width chat + two prefill columns)

Branch: `feature/clownbot-rebuild`, cut from `origin/main` @ `c3600223`.
Working tree is an **isolated worktree** outside `Projects/` — the primary
checkout is owned by a parallel session on `feature/era-reader-p4`. Do not
touch the primary checkout.

Source of truth, in precedence order:

1. Joey's brief, this session (2026-08-13) — layout + the four rulings below.
2. `docs/proposals/2026-08-11-clownbot.md` (spec B) and
   `docs/proposals/2026-08-11-clownbot-implementation-plan.md`, on PR #1961.
   This session IS the "planning session pending" that PR was parked for.
3. `CLAUDE.md`. Where anything here appears to conflict with it, CLAUDE.md wins.

## Goal

Replace the shipped-but-gated Clownbot (build A) with the re-spec'd chat
(build B), presented in Joey's layout: a big `clown bot` title, one
full-width conversation box seeded with a real worked example, and beneath it
two columns — current theories, and confirmed easter eggs — whose items
prefill the composer on tap.

## Rulings (Joey, 2026-08-13 — do not re-litigate, do not re-ask)

- **J1 — Build B, not a refit of A.** Joey's 2026-08-11 decision stands: "get
  rid of all the old chatbot clown stuff. The items related to threads remain
  and will actually be inputs for the bot." Build A is superseded. Salvage
  named assets from it (§ Salvage); do not extend it.
- **J2 — The theory column is derived from the corpus we already have.**
  No new content authoring, no scoring engine. "Long-term we need this to be
  auto-populated by an engine but that's phase 2 of the clownbot." Phase 2 is
  **out of scope**; do not build toward it speculatively.
- **J3 — Live on merge, gated on red-team.** Therefore the battery is a
  REQUIRED CI check (§ Step 12), not a manual pre-flight. A posture that
  depends on someone remembering to run a script is not the posture Joey
  chose.
- **J4 — Delulu only.** Source cards carry groundedness. Evidence and
  Confidence meters are dropped — they restate the cards. One compact delulu
  element sits in the answer header. Joey gave discretion here; this is the
  call made under it.

Still **not** decided, and not ours (Workflow rule 5 — surface, don't settle):

- **Wyatt:** model tier (spec offers Sonnet-class like Mood, or Haiku), the
  cap numbers (spec proposes 200 composes/day/instance), ratifying reuse of
  the Mood route pattern, and the `docs/decisions.md` entry.
  Build against Mood's tier; make the tier a single named constant so
  changing it is a one-line diff. Flag all four in the PR body.

## Out of scope

- The phase-2 auto-population engine (J2).
- Accounts, stored theories, novelty scoring, cross-user anything — issue #36's
  no-go still stands.
- #445 (Mastermind / Invisible Strings). Clownbot consumes its corpus once
  shipped; it does not block on it, and this plan does not touch it.
- The era-reader rework on `feature/era-reader-p4`. Different session, different
  branch, no shared files.
- Any change to `scripts/social/**`.

## Salvage from build A — port, do not rewrite

`clownbot-safety.ts` (719 lines) and `clownbot-battery-corpus.ts` (678 lines)
encode red-team findings. Rewriting them re-opens whatever they closed.

| From build A | Into | Treatment |
|---|---|---|
| `clownbot-safety.ts` | `clown-safety.ts` | Port phrase lists + refusal copy verbatim. Re-shape only the call signature. |
| `clownbot-battery-corpus.ts` | `clown-battery-corpus.ts` | Port every case. Add cases; never delete one. |
| `clownbot-ledger.ts` | `clown-board.ts` | The confirmed/debunked derivation is exactly column 2. |
| `clownbot-lore.ts` | kept in place | 8 hand-authored items, still a retrieval input. |
| `clownbot-names.ts` | `clown-names.ts` | 6 canonical names keep the bot's naming stable. |
| `clownbot-usage.ts` | `clown-usage.ts` | Cap reservoir; re-point at `CLOWN_DAILY_CAP`. |

**Deleted with build A:** `Clownbot.tsx`, `/api/clownbot/route.ts`,
`clownbot-client.ts`, `clownbot-grade.ts`, `clownbot-output-classifier.ts`,
`clownbot-prompts.ts`, `clownbot-persona.ts`, `clownbot-receipts.ts`, and their
tests. Content inside them that is not carried forward goes to the shelf doc
(§ Step 1) **before** deletion — no content is lost, per Joey's instruction.

## Files touched

| Path | New/Edit | What |
|---|---|---|
| `docs/decisions.md` | Edit | Entry for J1–J4 + the Wyatt-pending list. **Step 0.** |
| `docs/proposals/2026-08-13-clownbot-shelved-content.md` | **New** | Everything from A not carried forward. |
| `apps/web/lib/longlive/clown-index.ts` | **New** | Build the retrieval index; blocklist pre-filter at build time. |
| `apps/web/lib/longlive/clown-retrieve.ts` | **New** | Deterministic retrieval + `detectRecencyIntent()`. |
| `apps/web/lib/longlive/clown-blocklist.ts` | **New** | `screenTopic()`, per-category phrase lists. |
| `apps/web/lib/longlive/clown-safety.ts` | **New** | Ported from A + crisis reuse. |
| `apps/web/lib/longlive/clown-board.ts` | **New** | Both columns. Pure, derived, zero model. |
| `apps/web/lib/longlive/clown-fallback.ts` | **New** | Zero-model card composer. |
| `apps/web/lib/longlive/clown-starters.ts` | **New** | Column item → composer prefill string. |
| `apps/web/lib/longlive/clown-names.ts` | **New** | Ported registry. |
| `apps/web/lib/longlive/clown-seed-example.ts` | **New** | The frozen example Q&A. |
| `apps/web/lib/longlive/clown-client.ts` | **New** | The one model call. Tier as a named constant. |
| `apps/web/lib/longlive/clown-client-prompt.ts` | **New** | System prompt + tool schema, split out of the above for length. Added in flight. |
| `apps/web/lib/longlive/clown-answer.ts` | **New** | `ClownAnswer` — the ONE client-facing shape, plus adapters from `ClownTake` and `FallbackAnswer`. Added in flight after two steps grew different shapes for the same thing. |
| `apps/web/lib/longlive/clown-gate.ts` | **New** | Output re-screen. |
| `apps/web/lib/longlive/clown-usage.ts` | **New** | Ported cap reservoir. |
| `apps/web/app/api/clown/route.ts` | **New** | The pipeline. |
| `apps/web/components/longlive/ClownChat.tsx` | **New** | Title + composer + transcript. |
| `apps/web/components/longlive/ClownBoard.tsx` | **New** | The two columns. |
| `apps/web/components/longlive/ClownItemCard.tsx` | **New** | One column item / one source card. |
| `apps/web/lib/longlive/store.tsx` | Edit | `clown` transcript state, client-held. |
| `apps/web/lib/longlive/share.ts` | Edit | `topbarShareTarget` union — return `null`, as mood does. |
| `apps/web/components/longlive/TopBar.tsx` | Edit | Mode label. |
| `apps/web/components/longlive/LongLive.tsx` | Edit | Mount `ClownChat` for `mode === 'clown'`. |
| `.github/workflows/ci.yml` | Edit | Battery as a required check (J3). |
| `package.json` | Edit | `clown:battery` script. |
| `docs/definition-of-done.md` | Edit | Item 7 — flip 🔴, drop the stale "no request-path LLM" line. |
| `docs/longlive-experience.md` | Edit | Replace the Clownbot section. |
| `MAP.md` | Edit | Every file added/deleted. |

Plus deletions of every build-A file listed in § Salvage.

## Contracts — copy verbatim, do not redesign

```ts
// apps/web/lib/longlive/clown-board.ts
// Both columns. Pure and deterministic: same corpus in => same board out.
// ZERO model calls — this is what keeps the columns free (J2).

export type BoardItem = {
  id: string;
  /** Column 1 headline, or column 2 egg name. */
  title: string;
  /** One line of context. Never a claim of fact for an unresolved item. */
  blurb: string;
  /** What tapping it puts in the composer. Authored, not generated. */
  prompt: string;
  /** Sort key. ISO date. */
  date: string;
};

/**
 * Column 1 — "top 10 current theories".
 * Unresolved theories + open rumors, recency-ranked, capped at 10.
 *
 * J2: derived from the corpus we already have. If the corpus yields fewer
 * than 10, RETURN FEWER. Do not pad, do not invent, do not reach further
 * back in time to fill the slot — a padded "current" list is a lie about
 * what is current. The UI handles a short list (§ Step 8).
 */
export function currentTheories(now: Date): BoardItem[];

/**
 * Column 2 — "past confirmed easter eggs".
 * Ported from clownbot-ledger.ts: theories.generated.ts entries with
 * outcome === 'confirmed', plus lore items with a ledger block.
 * Confirmed only — 'debunked' is a different thing and does not belong
 * in a column labelled "confirmed".
 */
export function confirmedEggs(): BoardItem[];
```

```ts
// apps/web/lib/longlive/clown-seed-example.ts
// The pre-filled worked example. Static, shipped, zero runtime cost.

export type SeedExample = {
  question: string;
  /** A REAL answer from the live pipeline, captured once and frozen. */
  answer: ClownAnswer;
};

/**
 * HOW THIS IS PRODUCED (Step 10) — it is not hand-written:
 *   1. Pick a question about a theory already in the corpus (J2 + Joey:
 *      "re-use some of the existing theories we already have").
 *   2. Run it through the real route once with a live key.
 *   3. Paste the response verbatim.
 * A hand-written answer here would misrepresent the bot's actual behaviour
 * to every first-time visitor. If the pipeline cannot be run, STOP and
 * report — do not substitute prose.
 */
export const SEED_EXAMPLE: SeedExample;
```

```ts
// apps/web/lib/longlive/clown-starters.ts
/** Column item -> composer text. Pure. Chips never reach the model. */
export function promptForItem(item: BoardItem): string;
```

## Steps

Steps 1–5 are **disjoint file sets and run in parallel.** Steps 6+ have real
dependencies and are sequenced.

### Step 0 — decisions (orchestrator, no code)

0. [ ] `docs/decisions.md` entry dated 2026-08-13: J1–J4 with rationale and
   who decided, plus the four items still pending on Wyatt. Workflow rule 6
   requires this BEFORE implementation.
   - Verify: `git diff --stat docs/decisions.md` → one file, entry present.

### Steps 1–5 — parallel

1. [ ] **Content shelf.** Write
   `docs/proposals/2026-08-13-clownbot-shelved-content.md` capturing, verbatim,
   everything in build A not carried forward: `CANON`'s 3 entries,
   `EMPTY_STATE_HEADING`/`_BODY`, `wigCountLine()`, the 9-chip rotating row and
   its selection logic, the Evidence/Confidence meter copy and `METER_NOTE`,
   `DEGRADED_*` copy, and the persona/disclosure strings. Note where each came
   from. **This must land before any deletion in Step 6.** (grunt)
   - Verify: `grep -c "" docs/proposals/2026-08-13-clownbot-shelved-content.md`
     → non-zero; every symbol named above appears in it.
2. [ ] **`clown-blocklist.ts` + `clown-safety.ts` + tests.** Port from
   `clownbot-safety.ts` and `clownbot-battery-corpus.ts`. Phrase lists are
   MIRRORED from `scripts/content-engine/config.mjs` with pointer comments both
   ways — **never imported across the `scripts/` ↔ `apps/web` boundary**
   (repo precedent: `hot-thin-topic.mjs`). Crisis path reuses `mood-safety.ts`'s
   `normalizeForCrisis` and the verbatim `CRISIS_MESSAGE`. (executor)
   - Verify: `npm test -- clown-safety clown-blocklist` → green, and every case
     from A's battery corpus is present.
3. [ ] **`clown-index.ts` + `clown-retrieve.ts` + tests.** Index over threads /
   theories / rumors / moments. Blocklist pre-filter runs at INDEX BUILD time so
   blocked material never enters the index at all. `detectRecencyIntent()` per
   spec. (executor)
   - Verify: `npm test -- clown-retrieve clown-index` → green, including a case
     asserting a blocklist-tripping doc is absent from the built index.
4. [ ] **`clown-board.ts` + `clown-names.ts` + tests.** Both columns per the
   contract. Port the ledger derivation. (executor)
   - Verify: `npm test -- clown-board` → green, including a determinism case
     and a **fewer-than-10 case** asserting no padding.
5. [ ] **`clown-fallback.ts` + `clown-starters.ts` + tests.** Deterministic card
   composer with fixed framing lines; zero model calls. (executor)
   - Verify: `npm test -- clown-fallback clown-starters` → green.

### Steps 6+ — sequenced

6. [ ] Delete every build-A file listed in § Salvage as "Deleted". Only after
   Step 1 has landed. (grunt)
   - Verify: `grep -rn "clownbot-" apps/web --include=*.ts --include=*.tsx`
     → only the deliberately-kept `clownbot-lore.ts` remains.
7. [ ] `clown-client.ts` + `clown-gate.ts` + `clown-usage.ts`. Model tier as a
   single exported constant. Cap default per spec (200/day/instance), pending
   Wyatt. (executor)
   - Verify: `npm test -- clown-client clown-usage` → green.
8. [ ] `app/api/clown/route.ts`. Stage order, non-negotiable: rate-limit →
   kill-switch → crisis → input blocklist → retrieval → compose-or-fallback →
   output gate. A blocked topic returns the fixed in-character redirect and
   **the model is never consulted**. (executor)
   - Verify: `npm test -- api/clown` → green, with cases for valid, bad-id,
     novel-entity, blocklisted, over-cap, and no-API-key.
9. [ ] `ClownChat.tsx` + `ClownBoard.tsx` + `ClownItemCard.tsx`.
   - Title: `font-era`, matching the shipped page-title pattern.
   - Composer + transcript box at the era column width (`max-w-4xl`).
   - Placeholder "lets clown around" — a real `placeholder`, so it clears on
     focus and is never submitted as content.
   - Board: `grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6`.
   - Tapping an item prefills the composer; it does not auto-send.
   - Column 1 renders gracefully at fewer than 10 items.
   - Delulu only in the answer header (J4). Source cards beneath.
   - Colors via era CSS tokens only. No Taylor imagery. (executor)
   - Verify: `npm run typecheck --workspace=@swift2/web && npm run lint` clean.
10. [ ] **Capture the seed example.** Pick a question about an existing corpus
    theory, run it through the real route once with a live key, freeze the
    verbatim response into `clown-seed-example.ts`. Report which theory and
    show the captured answer. If the pipeline can't be run, STOP and report.
    (orchestrator — needs a key, and needs judgment about which answer
    represents the bot well)
    - Verify: the seed renders on load with no network request.
11. [ ] Wire-up: `store.tsx` transcript (client-held, ~6 messages, **zero
    server storage**), `share.ts` union (`'clown'` → `null`, like mood),
    `TopBar.tsx`, `LongLive.tsx`. (executor)
    - Verify: `npm run typecheck --workspace=@swift2/web` clean.
12. [ ] **Red-team battery as a required CI check (J3).** `clown:battery` in
    `package.json` running the corpus battery against a mocked model — no API
    key, deterministic, CI-safe. Add to the `build` job in `ci.yml`. The
    live-key battery stays a separate manual pre-flight. (executor)
    - Verify: `npm run clown:battery` → exit 0; `ci.yml` diff shows the step
      inside `build`.
13. [ ] Docs: `definition-of-done.md` item 7 (flip 🔴, remove the stale
    "no request-path LLM" line), `docs/longlive-experience.md` Clownbot
    section, `MAP.md`. (executor)
    - Verify: `grep -n "no LLM in a user-request path" docs/` → no hits.
14. [ ] Full suite + gates. (executor)
    - Verify: `npm test && npm run typecheck --workspace=@swift2/web &&
      npm run lint && npm run check:generated && npm run clown:battery` green.
15. [ ] Codex review on the full diff; fix every finding before the PR is
    declared done (Workflow rule 3 — the in-house `reviewer` does not satisfy
    this). Contract, per CLAUDE.md as amended 2026-08-13 and
    `docs/agents/codex.md`:
    - `/codex:review` is **human-only** (`disable-model-invocation`). A session
      must not run it and must not reproduce it by other means.
    - Use the `codex:rescue` skill → `codex:codex-rescue` subagent via `Agent`.
    - **Pass `--background`.** Without it the forwarder blocks, times out at
      10 minutes and returns nothing, while a real review takes ~15.
    - Read the result with `codex-companion.mjs result <job-id>`. Never trust
      the relay's inline summary.
    - Never hand the review back to a founder — this session deploys Codex.
    - This is an architectural change (a request-path LLM surface shipping live
      on merge), so prefer the **adversarial** review over the standard one.

## Known risks

- **Deleting build A before the shelf doc lands loses content.** Step 1 gates
  Step 6 for exactly this reason. Joey asked explicitly that nothing be lost.
- **Live on merge (J3) means the first real traffic has no human gate.** The CI
  battery is the only thing standing between a bad merge and users. If the
  battery is weakened to make CI pass, the posture is silently gone. Never
  delete a battery case; only add.
- **Mirror-not-import for blocklist phrases.** An import across
  `scripts/` ↔ `apps/web` will pass locally and break the build.
- **A padded theory column lies.** Fewer than 10 is correct output, not a bug.
- **Two matchers, one app** (`STATE.md` trap): grep for other callers before
  declaring any matching behaviour fixed.
- **Model tier and caps are Wyatt's.** Building against Mood's tier is a
  placeholder, not a decision. Keep it a one-line change.
- `npm run typecheck` is repo-wide-red on `apps/mobile` — use
  `--workspace=@swift2/web`.

## Do not

- Don't refit build A (J1).
- Don't build toward the phase-2 engine (J2).
- Don't rewrite the safety module or thin the battery corpus.
- Don't import blocklist phrases across the `scripts/` boundary.
- Don't pad the theory column.
- Don't hand-write the seed example answer.
- Don't touch the primary checkout or `feature/era-reader-p4`.
- Don't proceed past a failed verification — report it and stop.
