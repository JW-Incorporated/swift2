-- Stage 6 fan adapters (PLAN.md, docs/proposals/2026-08-23-knowledge-engine.md
-- issue 7): widens `news_source.source_type` to admit the new adapters this
-- stage ships (`reddit_rss`, `tumblr`, `gnews`; `bluesky` was already
-- allowed). Drop-then-recreate is idempotent (`migrate.mjs` re-runs every
-- file on every apply) and safe to run against a live table: the constraint
-- only ever gets wider, never narrower, so no existing row can violate it.
--
-- gnews.ts's daily-call cap does NOT need a new table here — this migration
-- originally added its own `api_usage_daily`/`increment_api_usage_daily`,
-- but Stage 3 (merged to `main` first, 20260902000000_usage_daily.sql)
-- landed the same generic `scope`-keyed counter as `usage_daily`/
-- `increment_usage_daily` for the extract stage's own cap. Reusing that
-- table (`apps/worker/src/sources/api-usage-daily.ts` targets it, scoped to
-- `'gnews'`) rather than shipping a second near-identical one was the right
-- call once the overlap surfaced during this branch's merge with `main`.
--
-- NOT YET APPLIED TO PRODUCTION as of this PR — same `apps/worker/.env`
-- gap tracked in HUMAN-ACTIONS.md #14 (reconciled running total there).
-- Verified idempotent (applied twice) against a real ephemeral local
-- Postgres via the `embedded-postgres` package, same mechanism
-- `scripts/backup-restore-test.mjs --cluster ephemeral` and the Stage 2
-- migration already use — not production.

alter table public.news_source drop constraint if exists news_source_source_type_check;
alter table public.news_source add constraint news_source_source_type_check
  check (source_type in
    ('rss', 'reddit', 'x', 'youtube', 'bluesky', 'google_news', 'reddit_rss', 'tumblr', 'gnews'));
