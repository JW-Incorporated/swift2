-- usage_daily: scoped daily LLM-call counter, generalizing news_llm_usage
-- (supabase/migrations/20260718120000_news_init.sql) to more than one caller.
-- The extract stage (PLAN.md Stage 3, proposal §4.5) needs its own durable
-- daily cap (600/day) separate from the classify stage's existing
-- news_llm_usage counter (100/day) — one row per (scope, day) instead of a
-- second single-purpose table per stage. Scoped to just this table per the
-- Stage 3 brief; classify's counter is left exactly as-is, not migrated here.

create table if not exists public.usage_daily (
  scope       text not null,
  usage_date  date not null default current_date,
  call_count  integer not null default 0,
  primary key (scope, usage_date)
);

create or replace function public.increment_usage_daily(p_scope text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.usage_daily (scope, usage_date, call_count)
  values (p_scope, current_date, 1)
  on conflict (scope, usage_date) do update set call_count = usage_daily.call_count + 1
  returning call_count into new_count;
  return new_count;
end;
$$;

-- Pipeline-internal, same posture as news_llm_usage: RLS on, zero policies —
-- only service_role (which bypasses RLS) can read or write it.
alter table public.usage_daily enable row level security;
