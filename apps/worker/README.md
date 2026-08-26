# @swift2/worker — News/Current pipeline (V2, issue #468)

One-shot: ingest → cluster/dedupe → classify/rank → verify → store → extract/
screen/write (Current tier). Run once, exit — no resident process. Scheduled
by `.github/workflows/news-worker.yml`.

Full design: `docs/proposals/2026-07-07-news-pipeline-architecture.md`.
What's actually decided vs. still open: `docs/decisions.md`, 2026-07-18 entry
("News/Current pipeline (V2, #468)... DRAFT, pending Wyatt").

## Running locally

```
cp apps/worker/.env.example apps/worker/.env   # fill in the values, see comments
npm run news --workspace @swift2/worker
```

## Env vars (see `.env.example` for where each comes from)

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — this project's existing
  Supabase project, a different credential shape than `SUPABASE_DB_URL`
  (which the `db:migrate`/`db:seed:*` scripts already use via `pg` directly).
- `OPENAI_API_KEY` — optional. Unset means the classify stage runs entirely on
  the deterministic rule-based classifier.
- `ANTHROPIC_API_KEY` — optional, extract stage only (`src/extract/`). Set as
  a repo secret (`HUMAN-ACTIONS.md` #13, DONE) but **not yet added to
  `news-worker.yml`'s env block** — PLAN.md Stage 3 shipped the extract
  code complete but deliberately left the workflow file untouched (that's a
  later stage's job, alongside the `knowledge-engine.yml` rename). Until that
  env var is wired through, scheduled runs skip the extract stage the same
  way they'd skip classify with no `OPENAI_API_KEY`: unset means null,
  cluster stays unextracted, retried next cycle — the designed degraded-but-
  functional path, not an error. Works locally today if you set it in
  `apps/worker/.env`.

## What ships in this pass

- Schema: `supabase/migrations/20260718120000_news_init.sql`.
- One adapter: RSS/Atom (`src/sources/rss.ts`) — zero cost, no API keys, no
  ToS ambiguity. Source research for Reddit/X/YouTube/Bluesky/etc lives at
  `docs/proposals/2026-07-18-news-source-research.md`; wiring those up is a
  separate pass (each has real auth/ToS/cost tradeoffs to work through).
- Full cluster → classify → verify stages, all stage-isolated (one bad feed
  or one LLM hiccup never aborts the cycle).
- `news_source` is seeded with 10 publisher tag/topic feeds + Google News
  search (`supabase/migrations/20260719180000_news_sources_seed.sql`,
  `20260719190000_news_source_google_news.sql`,
  `20260823010000_news_sources_seed_wave2.sql`) — run `npm run db:migrate`
  to apply. Validation: `docs/audits/2026-08-23-news-source-feed-validation.md`
  (`node scripts/validate-news-source-feeds.mjs` to re-check).
- Clustering matches cross-outlet coverage of the same event, not just
  near-identical titles: canonical URL match, cheap-embedding cosine within
  48h, or shared named entity + date
  (`packages/shared/src/news/cross-outlet-similarity.ts`).
- Google News redirect links are resolved to the real publisher URL at
  ingest and re-tiered from `packages/shared/src/news/outlet-tiers.ts`'s
  domain→tier map (`src/sources/resolve-google-news.ts`); unresolved items
  stay `unverified`.
- Extract stage (`src/extract/`, PLAN.md Stage 3): one Haiku 4.5 call per new
  cluster (`news_story.extracted_at is null`), forced `record_knowledge` tool
  call, screened through `packages/shared/src/redline.ts`'s `screenTopic()`,
  written to `current_item`/`fan_signal`/`live_theory` (theory-match dedup:
  name similarity + symbol overlap ≥0.5), projected into
  `knowledge_doc tier='current'`. Capped at 150 calls/run, 600/day
  (`usage_daily(scope='extract')`) — over cap defers the cluster to next run,
  never drops it. Run-summary poster (`scripts/knowledge-engine/
  run-summary.mjs`) exists but isn't called by the workflow yet (see
  `ANTHROPIC_API_KEY` note above).

## What's explicitly NOT in this pass (see the architecture proposal §9)

No `/current` UI surface, no notifications, no Reddit/X/YouTube/Bluesky
adapters, no user-report/moderation loop. All deferred by design, not by
oversight.

## Where this output actually goes (there IS a place for it — 2026-07-18)

No `/current` page exists, but that doesn't mean nothing can be published
from this yet: `docs/content-ops/intake.md` is the real destination.
`news_story` rows this worker produces are **candidate leads**, not
publishable copy — a human/content session still triages, re-verifies
sources, and re-writes each in fan-editor voice before it ships, landing as
a normal dated moment in **whichever era is current/ongoing** (named in
`intake.md`). Same rule regardless of origin: a lead from this worker gets
exactly the same re-verification as one Joey drops by hand or one ChatGPT
drafted — never a paste-through, no matter how confident its
`verification_status` looks.
