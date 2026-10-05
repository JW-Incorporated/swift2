-- Server-side ordering for POST /api/devices/register (#5039). The mobile
-- client stamps each registration write with a monotonically increasing
-- `seq`; a write whose seq is LOWER than the last applied one is stale (e.g. a
-- delayed register arriving after the opt-out null write) and is ignored.
-- Legacy clients send no seq: their writes stay unconditional and never touch
-- the stored value. Only a STRICTLY higher seq overwrites; an equal seq returns
-- the current row unchanged. One statement, so concurrent writers are ordered by the
-- row lock, not by a read-then-write race.
set lock_timeout = '3s';
alter table public.devices
  add column if not exists register_seq bigint;
reset lock_timeout;

create or replace function public.upsert_device_ordered(
  p_id uuid,
  p_platform text,
  p_push_token text,
  p_tz text,
  p_locale text,
  p_app_version text,
  p_seq bigint
)
returns setof public.devices
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.devices as d (id, platform, push_token, tz, locale, app_version, register_seq, last_seen_at)
  values (p_id, p_platform, p_push_token, p_tz, p_locale, p_app_version, p_seq, now())
  on conflict (id) do update
    set platform = excluded.platform,
        push_token = excluded.push_token,
        tz = excluded.tz,
        locale = excluded.locale,
        app_version = excluded.app_version,
        register_seq = coalesce(excluded.register_seq, d.register_seq),
        last_seen_at = now()
    where p_seq is null or d.register_seq is null or d.register_seq < p_seq
  returning d.*;
  if not found then
    return query select * from public.devices where id = p_id;
  end if;
end;
$$;

revoke all on function public.upsert_device_ordered(uuid, text, text, text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.upsert_device_ordered(uuid, text, text, text, text, text, bigint) to service_role;
