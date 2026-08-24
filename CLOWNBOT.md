# CLOWNBOT.md — Clown bot: how an egg/theory/technique enters the store

For a content-desk reader, not a developer. Covers the live chat feature
(`/api/clown`, `ClownChat`/`ClownBoard` on the site's 4th toggle surface —
`docs/longlive-experience.md` §7 has the full surface description) and the
knowledge-engine pipeline that feeds it
(`docs/proposals/2026-08-23-knowledge-engine.md`).

## The one-paragraph version

Everything Clownbot can cite comes from one Supabase store
(`current_item`/`fan_signal`/`live_theory`/`egg_ledger`/`symbol_lexicon`/
`technique`/`knowledge_doc`) that the site's Eras reader, the Threads/eggs
board, and Clownbot all read — Clownbot is a reader with tools over the same
data the site renders, not a separate brain. Nothing enters that store
without a name, a date, and a real source; nothing is invented, by a bot or
otherwise.

## How something new enters the store

```
worker ingests → clusters → extracts → screens → writes current_item /
fan_signal / live_theory → (maybe) promotes into the Vault → egg_ledger
```

1. **Ingest + cluster.** The worker (`apps/worker`, `.github/workflows/
   news-worker.yml`, runs every 4h) pulls publisher RSS feeds, Google News
   search RSS, YouTube channel RSS, Bluesky search, Reddit RSS (interim,
   feature-flagged), and Tumblr, and clusters same-story items across
   outlets (real, verified redirect resolution — no `news.google.com`
   redirect URL is ever stored as a source).
2. **Extract.** A new cluster gets one Haiku call
   (`apps/worker/src/extract/haiku-client.ts`) that writes structured,
   our-words copy — never a paste-through of the source article — using the
   forced `record_knowledge` tool shape. No `ANTHROPIC_API_KEY` set → this
   stage no-ops, same degraded-but-functional posture as the rest of the
   worker.
3. **Screen.** Every extracted item is checked against the same redline
   module the live chat uses (`packages/shared/src/redline.ts` /
   `apps/web/lib/longlive/clown-blocklist.ts`'s `screenTopic()`) before it is
   ever written. A blocked item is dropped outright, not filtered later.
4. **Store.** Screened items land as `current_item` (a sourced sighting),
   `fan_signal` (aggregate-only fan chatter — never an individual, never a
   comment body beyond what a public feed already exposes), or `live_theory`
   (a theory in play), each with an expiry (`current_item` 90 days,
   `fan_signal` 30 days, `live_theory` 60 days from last activity, quiet 45
   days → `abandoned`) so nothing sits forever in limbo. Both tiers project
   into `knowledge_doc`, the one retrieval index Clownbot searches.
5. **Promote (current_item only).** The Content Shift desk
   (`docs/agents/content-shift.md`) checks `current_item` first, ahead of
   hand-filed intake drops: a row with `status` `reported`/`confirmed`,
   `source_tier` `official`/`established`, and `heat >= 0.5` is
   fast-tracked into a real Vault seed row (a human-reviewed PR, same gates
   as any other content change) — full flow in `docs/content-ops/intake.md`.
   `fan_signal` and `live_theory` never promote; they stay live-only.
   `egg_ledger`/`symbol_lexicon` are built separately, from the Vault's own
   confirmed theories/moments, by `npm run sync:content`
   (`scripts/sync-clown-knowledge.mjs`) — the reverse direction, curated
   data feeding the retrieval index, not raw ingest feeding the Vault.

## What's generated vs. hand-authored

| Generated (never hand-edit) | Hand-authored |
|---|---|
| `current_item`/`fan_signal`/`live_theory` rows — written by the worker's extract stage | Vault seed files (`supabase/seed/**`) — every promoted item still gets a real seed row, same as any other content |
| `knowledge_doc`, `egg_ledger`, `symbol_lexicon` — built by `npm run sync:content` from Vault source data | `apps/web/lib/longlive/clownbot-lore.ts` — the sourced rumor/lore corpus Clownbot's no-DB fallback index (`clown-index.ts`) folds in; every item there is hand-verified against a named outlet before it ships (see that file's own header for the rule) |
| — | `technique` — schema shipped, **table is deliberately empty**. The proposal is explicit this needs "a frontier-model session with a human," not an autonomous run (`docs/decisions.md` 2026-08-23) — every consumer (`scripts/knowledge-coverage.mjs`, Clownbot's `precedents()` grouping) is built and tested to say "no techniques seeded yet" honestly rather than fabricate a pattern. Authoring `techniques.mjs` (7-10 records) is a human-in-the-loop task, not something the pipeline above will ever do on its own |

## Tests that gate a change here

- **`npm run clown:battery`** (`scripts/check-clown-battery.mjs`) — the
  deterministic red-team corpus (61 attacks, 23 Tier B probes as of the eval
  stage), no API key needed, runs in CI on every PR.
- **`npm run clown:eval`** (`scripts/knowledge-engine/clown-eval.mjs`) — the
  retro battery over confirmed `egg_ledger` precedents (write-up doc hidden,
  target top-3 hit rate ≥60%) plus a grounding check
  (`clown-grounding.ts`'s `groundCitations()`) confirming every id the bot
  cites actually exists and is `redline_ok`. Needs a live DB; not wired into
  CI, run by hand or from a session with real credentials.
- **The full suite** (`npm test`, i.e. `vitest run`) plus
  `npm run typecheck` — every file this document names carries its own
  `.test.ts`; a change to any of them is not done until both are green.
- **`npm run knowledge:freshness`** (`scripts/knowledge-freshness.mjs`) —
  report-only SLO (`max(updated_at)` on the `current` tier < 24h), wired into
  `watchdog.yml`, never blocks a merge.

## The kill switch

Same house pattern as every other desk (`docs/agents/README.md`'s "kill
switch" section) — the levers here are per-layer, so you can stop one
without stopping the others:

1. **Stop new content from entering the store (ingestion):** disable
   `news-worker.yml` under the repo's Actions tab — instant, reversible, no
   work lost (state is all in Supabase/GitHub, not in the runner).
2. **Stop the chat model / agent loop:** set `CLOWN_MODEL_DISABLED=1` in the
   deploy environment (Vercel, Production scope, same place
   `ANTHROPIC_API_KEY` lives — full mechanics in `docs/ops/clown-kill-
   switch.md`). This is the one switch for both the single model call and
   the bounded tool-using agent loop (`clown-agent.ts`'s `runClownAgent`) —
   there is no separate flag for "loop but not model." Readers still get an
   in-voice answer built from source cards with zero model calls (the
   deterministic fallback composer, `clown-fallback.ts`), not an error
   state. The two prefill columns and every starter chip already resolve
   with zero model calls regardless of this switch.
3. **Stop one adapter only:** `REDDIT_RSS_ENABLED=false` disables the
   Reddit-RSS adapter specifically (it's feature-flagged so it can flip off
   the moment real Reddit OAuth lands, `HUMAN-ACTIONS.md` #15). The other
   adapters (Tumblr, GNews, Bluesky) don't have a dedicated flag — they fail
   closed to an empty result if their API key env var is unset, or can be
   paused at the source by disabling their rows in the `news_source` table.
4. **Freeze promotion only:** disable Content Shift's routine
   (`docs/agents/README.md` item 4) — `current_item` rows keep accumulating
   in the store and rendering live on the site, they just stop being
   promoted into the Vault.
5. **What keeps running on purpose:** `watchdog.yml`'s freshness SLO check
   and CI are dumb observers — they alert, they never write.

## What this document does not cover

Reader-facing product behavior (chip copy, dashed treatment, masthead line)
is in `docs/longlive-experience.md` §7. The exact Supabase schema is in
`docs/content-ops/rumor-pipeline.md` § Data model. File-by-file ownership is
in `MAP.md`. The original architecture proposal, with a status note on what
shipped vs. what's still deferred, is
`docs/proposals/2026-08-23-knowledge-engine.md`.
