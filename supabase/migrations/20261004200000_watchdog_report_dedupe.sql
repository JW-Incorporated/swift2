-- Durable dedupe for [watchdog] reports (#4874, follow-up to #4867). The
-- in-memory flood caps in apps/web/app/api/feedback/watchdog-report.ts are per
-- serverless instance. These tables are the global source of truth: one row per
-- (UTC day, buildKey, category) so a widespread failure posts at most one GitHub
-- comment per build+category per day, and a per-day counter row is the durable
-- global cap. A claim is `pending` until the GitHub post succeeds (`posted`);
-- a failed post releases it, and a pending claim older than the stale window is
-- reclaimable (a crashed request must not block retries forever). Dedupe and
-- quota allocation happen atomically inside the functions below. Service-role
-- only: RLS on, no policies, execute revoked from anon/authenticated.
-- Idempotent (the migrate script replays every migration on every deploy).
create table if not exists public.watchdog_report_dedupe (
  day date not null,
  build_key text not null,
  category text not null,
  status text not null default 'pending' check (status in ('pending', 'posted')),
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (day, build_key, category)
);

create table if not exists public.watchdog_report_quota (
  day date primary key,
  n integer not null default 0
);

alter table public.watchdog_report_dedupe enable row level security;
alter table public.watchdog_report_quota enable row level security;

-- Returns 'new' (caller may post), 'duplicate' or 'capped'.
create or replace function public.claim_watchdog_report(
  p_day date,
  p_build_key text,
  p_category text,
  p_max_per_day integer,
  p_stale_minutes integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  insert into public.watchdog_report_quota (day, n) values (p_day, 0) on conflict (day) do nothing;

  insert into public.watchdog_report_dedupe (day, build_key, category)
  values (p_day, p_build_key, p_category)
  on conflict (day, build_key, category) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 1 then
    update public.watchdog_report_quota set n = n + 1 where day = p_day and n < p_max_per_day;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      delete from public.watchdog_report_dedupe
        where day = p_day and build_key = p_build_key and category = p_category;
      return 'capped';
    end if;
    return 'new';
  end if;

  -- Existing claim: only a stale pending one is reclaimable (its quota unit is already counted).
  update public.watchdog_report_dedupe
    set claimed_at = now()
    where day = p_day and build_key = p_build_key and category = p_category
      and status = 'pending'
      and claimed_at < now() - make_interval(mins => p_stale_minutes);
  get diagnostics v_rows = row_count;
  return case when v_rows = 1 then 'new' else 'duplicate' end;
end;
$$;

-- p_posted = true marks the claim posted; false releases a still-pending claim and its quota unit.
create or replace function public.finish_watchdog_report(
  p_day date,
  p_build_key text,
  p_category text,
  p_posted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if p_posted then
    update public.watchdog_report_dedupe set status = 'posted'
      where day = p_day and build_key = p_build_key and category = p_category;
    return;
  end if;
  delete from public.watchdog_report_dedupe
    where day = p_day and build_key = p_build_key and category = p_category and status = 'pending';
  get diagnostics v_rows = row_count;
  if v_rows = 1 then
    update public.watchdog_report_quota set n = greatest(n - 1, 0) where day = p_day;
  end if;
end;
$$;

revoke all on function public.claim_watchdog_report(date, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.finish_watchdog_report(date, text, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_watchdog_report(date, text, text, integer, integer) to service_role;
grant execute on function public.finish_watchdog_report(date, text, text, boolean) to service_role;
