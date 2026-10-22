-- Enforce one shadow classification per watch item without rewriting the
-- decision audit ledger. If unexpected duplicates already exist, fail the
-- migration so no unusable conflict-handling function is installed.

do $$
declare
  duplicate_item_count bigint;
begin
  select count(*) into duplicate_item_count
  from (
    select item_id
    from public.watch_decision
    where shadow is true and item_id is not null
    group by item_id
    having count(*) > 1
  ) duplicate_items;

  if duplicate_item_count > 0 then
    raise exception 'Cannot create watch_decision shadow uniqueness: % duplicate shadow item_id value(s) exist. Remove or relink the duplicate shadow decisions, then rerun db:migrate.', duplicate_item_count;
  end if;

  create unique index if not exists watch_decision_shadow_item_unique_idx
    on public.watch_decision (item_id)
    where shadow is true and item_id is not null;
end
$$;

-- PostgREST cannot express the predicate needed to infer a partial unique
-- index. Keep the conflict clause in SQL so racing classifier runs safely
-- return only the rows they won instead of failing the batch.
create or replace function public.insert_shadow_watch_decisions(decision_rows jsonb)
returns setof public.watch_decision
language sql
security invoker
set search_path = ''
as $$
  insert into public.watch_decision (
    item_id, class, confidence, decider, model_id, answers,
    action, action_ref, shadow, decided_at
  )
  select
    decision_input.item_id,
    decision_input.class,
    decision_input.confidence,
    decision_input.decider,
    decision_input.model_id,
    coalesce(decision_input.answers, '{}'::jsonb),
    decision_input.action,
    decision_input.action_ref,
    true,
    coalesce(decision_input.decided_at, now())
  from jsonb_to_recordset(decision_rows) as decision_input(
    item_id uuid,
    class text,
    confidence double precision,
    decider text,
    model_id text,
    answers jsonb,
    action text,
    action_ref text,
    shadow boolean,
    decided_at timestamptz
  )
  where coalesce(decision_input.shadow, true) is true
  on conflict (item_id) where shadow is true and item_id is not null
  do nothing
  returning *;
$$;

revoke all on function public.insert_shadow_watch_decisions(jsonb)
  from public, anon, authenticated;
grant execute on function public.insert_shadow_watch_decisions(jsonb)
  to service_role;
