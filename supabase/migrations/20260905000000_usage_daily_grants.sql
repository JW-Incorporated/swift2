-- Codex review of PR #2319 (HUMAN-ACTIONS.md #14): `increment_usage_daily`
-- (20260902000000_usage_daily.sql) is SECURITY DEFINER with no execute-grant
-- scoping. Postgres grants EXECUTE on a new function to PUBLIC by default,
-- so once this migration's predecessor is applied, ANY caller holding the
-- site's public anon key could invoke it directly via Supabase's
-- auto-generated REST RPC endpoint with an arbitrary `p_scope` and poison an
-- unrelated rate limit (`extract`'s 600/day, `gnews`'s free-tier cap, or any
-- other user's `clown-chat:<uid>` per-user cap).
--
-- Legitimate callers, confirmed by reading every call site:
--   - apps/worker (extract/usage-store.ts, sources/api-usage-daily.ts) —
--     connects with the SERVICE_ROLE key (apps/worker/src/db/client.ts),
--     scopes 'extract' / 'gnews'.
--   - apps/web (clown-memory.ts's incrementUserUsage) — calls with the
--     resolved anonymous-auth user's OWN access token, which PostgREST
--     authenticates as the `authenticated` role (anonymous sign-ins are
--     `authenticated` sessions with an `is_anonymous` claim, not the bare
--     `anon` role), scope `clown-chat:<user_id>`.
-- Neither caller is the bare `anon`/public role — revoke from public
-- (which is what `anon` inherits) and grant execute only to the two roles
-- above.
--
-- DEFENSE IN DEPTH beyond the grant: an `authenticated` caller is not a
-- trusted service the way `service_role` is — Supabase hands the
-- `authenticated` role to every anonymous sign-in, so "anyone who has ever
-- opened the clown chat" can reach this function once the grant below
-- exists. Re-creating the function to also check the scope it is being
-- asked to touch closes that gap: an `authenticated` caller (auth.uid() is
-- never null for one — every signed-in user, anonymous or not, has a
-- `sub` claim) may only increment ITS OWN `clown-chat:<uid>` scope, never
-- the worker's `extract`/`gnews` scopes or another user's. `service_role`
-- calls have no `sub` claim, so `auth.uid()` is null for them and the check
-- is skipped entirely — matching how service_role already bypasses RLS by
-- role attribute elsewhere in this schema.
create or replace function public.increment_usage_daily(p_scope text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
  caller_uid uuid := auth.uid();
begin
  if caller_uid is not null and p_scope is distinct from ('clown-chat:' || caller_uid::text) then
    raise exception 'increment_usage_daily: scope % not permitted for this caller', p_scope
      using errcode = '42501';
  end if;

  insert into public.usage_daily (scope, usage_date, call_count)
  values (p_scope, current_date, 1)
  on conflict (scope, usage_date) do update set call_count = usage_daily.call_count + 1
  returning call_count into new_count;
  return new_count;
end;
$$;

revoke execute on function public.increment_usage_daily(text) from public;
grant execute on function public.increment_usage_daily(text) to authenticated, service_role;
