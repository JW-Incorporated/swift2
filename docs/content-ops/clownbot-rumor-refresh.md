# Clownbot — the rumor/lore file and how it gets refreshed

**Status:** v3, 2026-09-04 (Fable ruling FR-t_2745eb60-1, #3515). Owner: the
scheduled Rumor Desk lane.
Source of truth for authoring: `supabase/seed/clownbot-lore/clownbot-lore.mjs`.
Generated output the app imports: `apps/web/lib/longlive/clownbot-lore.ts`
(produced by `scripts/sync-clownbot-lore.mjs`, wired into `npm run
sync:content`). **Never hand-edit the `.ts` file** — it is regenerated from
the seed on every sync, and `npm run check:generated` fails the build if it
drifts from the seed.
Binding above this doc: `docs/content-ops/privacy-redlines.md`.

## Why this file exists separately from the Vault

The Vault is ~733 dated, sourced moments — stable, past-tense, slow-moving.
Clownbot also needs the **live** layer: what the fandom is arguing about this
week. That is a different shape (short-lived, status-tagged, expires) and a
different risk profile, so it lives in its own small seed file rather than
being smuggled into the seed corpus's `content` items — but it now follows
the exact same seed-authored / generated-output pattern as the rest of the
Vault (theories, era secrets, etc.), per the FR-t_2745eb60-1 ruling. The prior
v2 design (hand-authored `.ts` app source, edited directly by the unattended
Rumor Desk lane) is retired: it put an unattended content lane in `apps/`
source, which is the seed-only hard limit this ruling exists to uphold.

## The one rule

**No source, no ship.** Every item carries at least one named outlet and a real
`https` URL, plus a real date. This is enforced two ways: by
`scripts/sync-clownbot-lore.mjs`, which drops any seed item missing a source,
a valid status, or a valid date rather than generating a malformed one, and by
`clownbot-lore.test.ts`, which fails the build on the generated output for a
missing/malformed source, a bad date, a duplicate id, or anything that looks
like street-level location detail. A fabricated rumor is the single failure
this feature cannot survive.

Corollary: **if we cannot source it, we ship the file without it.** At v1 this
meant deliberately dropping two otherwise attractive items — an aggregated
"spotted boarding a jet amid bachelorette rumours" (travel + private life,
banned outright by the redlines) and an unsourced "erased writing in the promo
says June 13" theory (no named outlet). The empty slot is the honest outcome.

## Schema

The seed file (`supabase/seed/clownbot-lore/clownbot-lore.mjs`) exports
`{ updatedOn: string, items: RawLoreItem[] }`. Each raw item:

```js
{
  id: string,            // stable; the model cites this as a receipt id
  status: 'rumor' | 'reported' | 'confirmed' | 'debunked',
  date: string,          // ISO — when it happened, or when it was reported
  lastCheckedOn: string, // ISO — when a human/frontier-model last verified the status
  headline: string,      // one line, our words
  detail: string,        // 1–3 sentences, our words, never asserting past `status`
  sources: [{ outlet: string, url: string }],  // >= 1, always, real https URL
  prompts: [string],     // optional suggested-prompt seeds (see the landing rule below)
  ledger: { theory: string, verdict: 'clowned' | 'confirmed', on: string },  // optional
  evergreen: boolean,    // optional — stays in the prompt pool once the fresh window empties
  tags: [string],        // optional
}
```

`scripts/sync-clownbot-lore.mjs` normalizes this into the generated
`LoreItem` shape (`sources: [{ outlet, url }]` → `[{ name, url }]`, same
convention as the other sync generators) and writes
`apps/web/lib/longlive/clownbot-lore.ts`.

### What each status means

| Status | Means | Example |
|---|---|---|
| `rumor` | Circulating, never confirmed or denied | Rep TV / debut TV ever landing |
| `reported` | A named outlet reported it; the underlying claim is still open | The #SwiftiesAgainstAI accusations — the accusation is documented, the AI use is not |
| `confirmed` | She, her team, or the record confirmed it | The masters buyback |
| `debunked` | Resolved false | The Super Bowl LX halftime theory |

**A status is a promise.** `reported` on an item whose claim was later confirmed
is a lie of omission in the other direction, and `rumor` on something debunked
is instant credibility death. That is the whole reason the field exists.

## The refresh path

The scheduled owner is `docs/agents/runner-prompts/vault-lanes/4-rumor-desk.md`
(every other day through the Vault Run). Before #1997, that lane updated Vault
seed `rumors` and the knowledge-engine lifecycle queue but never named this
file, so `clownbot-lore.ts` had no refresh trigger at all. The lane now carries
an explicit fallback sweep, and a regression test fails if that connection is
removed. As of FR-t_2745eb60-1 (#3515), the sweep edits the SEED
(`supabase/seed/clownbot-lore/clownbot-lore.mjs`); the orchestrator's `sync:content`
step regenerates `clownbot-lore.ts` from it before the gate runs.

The primary live path is separate and mechanical: `.github/workflows/news-worker.yml`
runs every four hours and writes `current_item` / `fan_signal` / `live_theory`.
Clownbot reads those rows first; this file is the no-DB fallback. Production
must have the knowledge-engine migrations applied for those writes to occur
(tracked in `HUMAN-ACTIONS.md` #14). A scheduled Action run that only publishes
the candidate digest has not refreshed the live store.

The news cycle moves in **hours**, not weeks. The file is designed for same-day
updates and for being honest when it has not had one.

### Cadence

- **Same-day** when something breaks (an announcement, a countdown, a denial).
- **Weekly sweep** minimum: walk every `rumor` / `reported` item in the seed,
  re-check it, and bump `lastCheckedOn` whether or not the status changed.
- Bump the seed's `updatedOn` on **every** sweep — it becomes `LORE_UPDATED_ON`
  in the generated file and is shown to the reader.

### The steps

1. **Re-check every open item** in `supabase/seed/clownbot-lore/clownbot-lore.mjs`.
   For each `rumor` / `reported` item, look for a confirmation or a denial
   from a named outlet.
2. **Promote or retire.** A resolved item moves to `confirmed` or `debunked`
   **with the confirming/debunking citation added** — never silently.
3. **Add the ledger verdict** when a fandom prediction resolves. `debunked`
   items are required by test (on the generated output) to carry a `ledger`
   block, because a debunked theory with no verdict is just a dead claim
   sitting in the file.
4. **Add new items** — status-tagged, sourced, dated, redline-checked *before*
   writing, not after.
5. **Write prompts** for anything prompt-worthy (rule below).
6. **Bump the seed's `updatedOn`**, run `npm run sync:content` to regenerate
   `clownbot-lore.ts`, then `npm test`, then open a PR.

### Compile it with a strong model, not the chat model

The chat turn runs on `claude-haiku-4-5` because it is writing voice inside a
deterministic cage. **Do not curate this file with a small model.** Status
adjudication and redline judgement are exactly where small models fail, and a
mistake here is durable — it ships to every reader until the next sweep. Use a
frontier model, or a deterministic pipeline plus human review. This split is
the point of research finding #7.

## The suggested-prompt landing rule

A prompt earns its place when it:

1. names a **specific dated artifact**,
2. invites a **stance or a job** — decode / rank / take a side / draft — never
   a summary,
3. is **answerable from receipts we actually hold**,
4. **signals play**, and
5. **expires**.

Retirement is automatic: the pool is derived from this file, so a prompt cannot
outlive its item. A `debunked` item's prompts are dropped — *unless* the item
carries a `ledger` verdict, in which case the prompt is about having been
wrong, which is the product rather than a bug (see the Super Bowl autopsy).

Enforced by `clownbot-prompts.test.ts`: every prompt must trace to a real item,
that item must have sources, and every prompt must contain a stance/job verb.

## Staleness is shown, never hidden

`loreFreshness()` reports the sweep date, its age in days, and how many open
items were rechecked inside the 14-day window. An old unresolved claim can
still be live after a current verification; using its original report date
made every later sweep invisible (#1997). The surface prints all of it — and
when the live count is zero it says so plainly rather than presenting
evergreens as news. A bot that looks live while running on four-month-old lore
is exactly the credibility failure this design is avoiding.

## Deferred

- **Merging with `RumorNote`.** The Vault already has a per-moment `rumors[]`
  with a richer status vocabulary. Unifying them is a real simplification and a
  real migration; not worth blocking v1 on.
