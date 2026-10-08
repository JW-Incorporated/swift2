-- Durable global + per-IP quotas for the public feedback/diag writer (#5097).
-- The in-memory limiters in apps/web/app/api/feedback are per serverless
-- instance, so concurrent instances could flood public GitHub issues. These
-- counters are the global source of truth. IPs are stored only as a salted
-- sha256 hash (hashed in the app), never raw. One atomic function increments
-- the per-(day,kind,ip_hash) and per-(day,kind) counters only when both are
-- under their caps; a claim is final. Rows older than 7 days are pruned on
-- each claim. Service-role only: RLS on, no policies, access revoked from
-- anon/authenticated.
-- Idempotent (the migrate script replays every migration on every deploy).
create table if not exists public.feedback_quota_ip (
  day date not null,
  kind text not null,
  ip_hash text not null,
  n integer not null default 0,
  primary key (day, kind, ip_hash)
);

create table if not exists public.feedback_quota_global (
  day date not null,
  kind text not null,
  n integer not null default 0,
  primary key (day, kind)
);

alter table public.feedback_quota_ip enable row level security;
alter table public.feedback_quota_global enable row level security;

revoke all on table public.feedback_quota_ip, public.feedback_quota_global from public, anon, authenticated;
grant all on table public.feedback_quota_ip, public.feedback_quota_global to service_role;

-- Returns 'ok', 'ip_capped' or 'global_capped'.
create or replace function public.claim_feedback_slot(
  p_day date,
  p_kind text,
  p_ip_hash text,
  p_ip_max integer,
  p_global_max integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  delete from public.feedback_quota_ip where day < p_day - 7;
  delete from public.feedback_quota_global where day < p_day - 7;

  insert into public.feedback_quota_global (day, kind, n) values (p_day, p_kind, 0)
    on conflict (day, kind) do nothing;
  insert into public.feedback_quota_ip (day, kind, ip_hash, n) values (p_day, p_kind, p_ip_hash, 0)
    on conflict (day, kind, ip_hash) do nothing;

  update public.feedback_quota_ip set n = n + 1
    where day = p_day and kind = p_kind and ip_hash = p_ip_hash and n < p_ip_max;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return 'ip_capped';
  end if;

  update public.feedback_quota_global set n = n + 1
    where day = p_day and kind = p_kind and n < p_global_max;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    update public.feedback_quota_ip set n = n - 1
      where day = p_day and kind = p_kind and ip_hash = p_ip_hash;
    return 'global_capped';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.claim_feedback_slot(date, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_feedback_slot(date, text, text, integer, integer) to service_role;
