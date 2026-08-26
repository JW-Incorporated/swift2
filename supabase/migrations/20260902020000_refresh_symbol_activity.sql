-- refresh_symbol_activity(): the extract stage (PLAN.md Stage 3, proposal
-- §4.6) must refresh the symbol_activity materialized view
-- (20260901000000_knowledge_engine.sql) after every write batch. Supabase's
-- JS client can only call SQL through an RPC, not run DDL/utility statements
-- directly — this is that RPC, function-only, no new table.

create or replace function public.refresh_symbol_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.symbol_activity;
end;
$$;
