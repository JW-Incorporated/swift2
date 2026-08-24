-- Stage 6 fan adapters (PLAN.md, docs/proposals/2026-08-23-knowledge-engine.md
-- issue 7) — two additive changes, neither touches an existing row:
--
-- 1. `news_source.source_type` widens to admit the new adapters this stage
--    ships (`reddit_rss`, `tumblr`, `gnews`; `bluesky` was already allowed).
--    Drop-then-recreate is idempotent (`migrate.mjs` re-runs every file on
--    every apply) and safe to run against a live table: the constraint only
--    ever gets wider, never narrower, so no existing row can violate it.
-- 2. `api_usage_daily` — a generic scoped daily-call counter, same shape as
--    `news_llm_usage` (20260718120000_news_init.sql) but keyed by `scope`
--    so more than one hard-capped vendor call (gnews today) can share one
--    table instead of each minting its own. First consumer: gnews.ts's
--    100-req/day free-tier cap, engineered to hard-stop at 80
--    (docs/decisions.md 2026-08-23 vendor entry).
--
-- NOT YET APPLIED TO PRODUCTION as of this PR — same `apps/worker/.env`
-- gap as the three migrations already tracked in HUMAN-ACTIONS.md #14
-- (folded into that item, now four). Verified idempotent (applied twice)
-- against a real ephemeral local Postgres via the `embedded-postgres`
-- package, same mechanism `scripts/backup-restore-test.mjs --cluster
-- ephemeral` and the Stage 2 migration already use — not production.

alter table public.news_source drop constraint if exists news_source_source_type_check;
alter table public.news_source add constraint news_source_source_type_check
  check (source_type in
    ('rss', 'reddit', 'x', 'youtube', 'bluesky', 'google_news', 'reddit_rss', 'tumblr', 'gnews'));

create table if not exists public.api_usage_daily (
  scope       text not null,
  usage_date  date not null default current_date,
  call_count  integer not null default 0,
  primary key (scope, usage_date)
);

create or replace function public.increment_api_usage_daily(p_scope text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.api_usage_daily (scope, usage_date, call_count)
  values (p_scope, current_date, 1)
  on conflict (scope, usage_date) do update set call_count = api_usage_daily.call_count + 1
  returning call_count into new_count;
  return new_count;
end;
$$;

alter table public.api_usage_daily enable row level security;
-- Deliberately no policies — service_role only, same as news_llm_usage
-- (RLS enabled with zero policies means zero access under anon/authenticated).
