-- Durable server-side idempotency for feedback submissions (#5108).
-- The in-memory dedupe in apps/web/app/api/feedback/idempotency.ts only holds
-- per serverless instance, so a resend landing on a cold/other instance could
-- file a duplicate PUBLIC GitHub issue. The client idempotency id is claimed
-- here atomically before posting: 'new' (go ahead), 'pending' (another request
-- is posting it right now), 'posted' (already filed; issue_url returned). A
-- pending claim older than 2 minutes is treated as abandoned (crashed
-- instance) and re-claimed. Rows older than 48 h are pruned on each claim.
-- Service-role only: RLS on, no policies, access revoked from anon/authenticated.
-- Idempotent (the migrate script replays every migration on every deploy).
create table if not exists public.feedback_idempotency (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'posted')),
  issue_url text
);

alter table public.feedback_idempotency enable row level security;

revoke all on table public.feedback_idempotency from public, anon, authenticated;
grant all on table public.feedback_idempotency to service_role;

-- Returns {"state": "new"|"pending"|"posted", "url": <issue_url or null>}.
create or replace function public.claim_feedback_id(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_status text;
  v_url text;
  v_created timestamptz;
begin
  delete from public.feedback_idempotency where created_at < now() - interval '48 hours';

  insert into public.feedback_idempotency (id) values (p_id)
    on conflict (id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 1 then
    return jsonb_build_object('state', 'new', 'url', null);
  end if;

  select status, issue_url, created_at into v_status, v_url, v_created
    from public.feedback_idempotency where id = p_id for update;
  if not found then
    return jsonb_build_object('state', 'pending', 'url', null);
  end if;
  if v_status = 'posted' then
    return jsonb_build_object('state', 'posted', 'url', v_url);
  end if;
  if v_created < now() - interval '2 minutes' then
    update public.feedback_idempotency set created_at = now() where id = p_id;
    return jsonb_build_object('state', 'new', 'url', null);
  end if;
  return jsonb_build_object('state', 'pending', 'url', null);
end;
$$;

revoke all on function public.claim_feedback_id(text) from public, anon, authenticated;
grant execute on function public.claim_feedback_id(text) to service_role;
