-- Count every [watchdog] report, not just the first (#5120). The dedupe row
-- (20261004200000) keeps one GitHub comment per (day, build, category), so a
-- forged first report could hide real volume behind 'duplicate'. Each claim now
-- also bumps n (reports) and, via a per-day set of hashed IPs, sources (distinct
-- reporters). The caller escalates (one more comment) when n or sources crosses a
-- threshold: n in {5,25,100} or sources in {3,10}, once per threshold
-- (last_notified). Counting continues past the global cap; only a NEW row spends
-- quota. Service-role only, same RLS/revoke/grant as the other watchdog tables.
-- Idempotent (the migrate script replays every migration on every deploy).
-- sources is added with DEFAULT 0: rows that predate this migration have no
-- source rows yet, so their next report must count its (first) source itself, not
-- land on top of a phantom 1. The default is then flipped to 1 for new inserts
-- (the insert path counts the first source via the column default). Replays never
-- touch existing values: add-if-not-exists is a no-op and SET DEFAULT is metadata.
alter table public.watchdog_report_dedupe
  add column if not exists n integer not null default 1,
  add column if not exists sources integer not null default 0,
  add column if not exists last_notified integer not null default 1;

alter table public.watchdog_report_dedupe alter column sources set default 1;

create table if not exists public.watchdog_report_source (
  day date not null,
  build_key text not null,
  category text not null,
  ip_hash text not null,
  primary key (day, build_key, category, ip_hash)
);

alter table public.watchdog_report_source enable row level security;

revoke all on table public.watchdog_report_source from public, anon, authenticated;
grant all on table public.watchdog_report_source to service_role;

drop function if exists public.claim_watchdog_report(date, text, text, integer);

-- Returns jsonb {verdict, n, sources}; verdict is 'new' (caller may post),
-- 'escalate' (post the counts comment), 'duplicate' or 'capped'.
create or replace function public.claim_watchdog_report(
  p_day date,
  p_build_key text,
  p_category text,
  p_max integer,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_new boolean;
  v_n integer;
  v_sources integer;
  v_last integer;
begin
  delete from public.watchdog_report_dedupe where day < p_day - 7;
  delete from public.watchdog_report_quota where day < p_day - 7;
  delete from public.watchdog_report_source where day < p_day - 7;
  insert into public.watchdog_report_quota (day, n) values (p_day, 0) on conflict (day) do nothing;

  insert into public.watchdog_report_source (day, build_key, category, ip_hash)
  values (p_day, p_build_key, p_category, p_ip_hash)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  insert into public.watchdog_report_dedupe as d (day, build_key, category)
  values (p_day, p_build_key, p_category)
  on conflict (day, build_key, category)
  do update set n = d.n + 1, sources = d.sources + v_rows
  returning (xmax = 0), d.n, d.sources, d.last_notified into v_new, v_n, v_sources, v_last;

  if v_new then
    update public.watchdog_report_quota set n = n + 1 where day = p_day and n < p_max;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      delete from public.watchdog_report_dedupe
        where day = p_day and build_key = p_build_key and category = p_category;
      delete from public.watchdog_report_source
        where day = p_day and build_key = p_build_key and category = p_category;
      return jsonb_build_object('verdict', 'capped', 'n', 1, 'sources', 1);
    end if;
    return jsonb_build_object('verdict', 'new', 'n', v_n, 'sources', v_sources);
  end if;

  if (v_n in (5, 25, 100) or v_sources in (3, 10)) and v_n > v_last then
    update public.watchdog_report_dedupe set last_notified = v_n
      where day = p_day and build_key = p_build_key and category = p_category;
    return jsonb_build_object('verdict', 'escalate', 'n', v_n, 'sources', v_sources);
  end if;
  return jsonb_build_object('verdict', 'duplicate', 'n', v_n, 'sources', v_sources);
end;
$$;

revoke all on function public.claim_watchdog_report(date, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.claim_watchdog_report(date, text, text, integer, text) to service_role;
