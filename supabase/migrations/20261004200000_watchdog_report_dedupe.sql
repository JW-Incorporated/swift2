-- Durable dedupe for [watchdog] reports (#4874, follow-up to #4867). The
-- in-memory flood caps in apps/web/app/api/feedback/watchdog-report.ts are per
-- serverless instance. These tables are the global source of truth: one row per
-- (UTC day, buildKey, category) so a widespread failure posts at most one GitHub
-- comment per build+category per day, and a per-day counter row is the durable
-- global cap. Dedupe and quota allocation happen atomically in one function; a
-- claim is final (a failed GitHub post is not released). Rows older than 7 days
-- are pruned on each claim. Service-role only: RLS on, no policies, all table
-- and function access revoked from anon/authenticated.
-- Idempotent (the migrate script replays every migration on every deploy).
create table if not exists public.watchdog_report_dedupe (
  day date not null,
  build_key text not null,
  category text not null,
  created_at timestamptz not null default now(),
  primary key (day, build_key, category)
);

create table if not exists public.watchdog_report_quota (
  day date primary key,
  n integer not null default 0
);

-- Earlier draft of this migration carried pending/posted state; drop it.
alter table public.watchdog_report_dedupe
  drop column if exists status,
  drop column if exists claimed_at;

alter table public.watchdog_report_dedupe enable row level security;
alter table public.watchdog_report_quota enable row level security;

revoke all on table public.watchdog_report_dedupe, public.watchdog_report_quota from public, anon, authenticated;
grant all on table public.watchdog_report_dedupe, public.watchdog_report_quota to service_role;

drop function if exists public.finish_watchdog_report(date, text, text, boolean);
drop function if exists public.claim_watchdog_report(date, text, text, integer, integer);

-- Returns 'new' (caller may post), 'duplicate' or 'capped'.
create or replace function public.claim_watchdog_report(
  p_day date,
  p_build_key text,
  p_category text,
  p_max integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  delete from public.watchdog_report_dedupe where day < p_day - 7;
  delete from public.watchdog_report_quota where day < p_day - 7;
  insert into public.watchdog_report_quota (day, n) values (p_day, 0) on conflict (day) do nothing;

  insert into public.watchdog_report_dedupe (day, build_key, category)
  values (p_day, p_build_key, p_category)
  on conflict (day, build_key, category) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return 'duplicate';
  end if;

  update public.watchdog_report_quota set n = n + 1 where day = p_day and n < p_max;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    delete from public.watchdog_report_dedupe
      where day = p_day and build_key = p_build_key and category = p_category;
    return 'capped';
  end if;
  return 'new';
end;
$$;

revoke all on function public.claim_watchdog_report(date, text, text, integer) from public, anon, authenticated;
grant execute on function public.claim_watchdog_report(date, text, text, integer) to service_role;
