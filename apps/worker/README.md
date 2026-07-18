# @swift2/worker — News/Current pipeline (V2, issue #468)

One-shot: ingest → cluster/dedupe → classify/rank → verify → store. Run once,
exit — no resident process. Scheduled hourly by
`.github/workflows/news-worker.yml`.

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
- `OPENAI_API_KEY` — optional. Unset means the pipeline runs entirely on the
  deterministic rule-based classifier — that's the expected state today; no
  key has been provisioned yet (founder TX item).

## What ships in this pass

- Schema: `supabase/migrations/20260718120000_news_init.sql`.
- One adapter: RSS/Atom (`src/sources/rss.ts`) — zero cost, no API keys, no
  ToS ambiguity. Source research for Reddit/X/YouTube/Bluesky/etc lives at
  `docs/proposals/2026-07-18-news-source-research.md`; wiring those up is a
  separate pass (each has real auth/ToS/cost tradeoffs to work through).
- Full cluster → classify → verify stages, all stage-isolated (one bad feed
  or one LLM hiccup never aborts the cycle).
- Zero `news_source` rows are seeded yet — the worker will run and do
  nothing useful until at least one source is inserted. That's a data change
  (`INSERT INTO news_source`), never a deploy.

## What's explicitly NOT in this pass (see the architecture proposal §9)

No `/current` UI surface, no notifications, no Reddit/X/YouTube/Bluesky
adapters, no user-report/moderation loop. All deferred by design, not by
oversight.
