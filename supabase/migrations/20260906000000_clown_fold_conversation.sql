-- Codex review of PR #2319 (HUMAN-ACTIONS.md #15 item 2): `clown-memory.ts`'s
-- rolling-summary fold (`maintainRollingSummary`) issued the evicted-turn
-- DELETE and the `clown_conversation` summary PATCH as two separate,
-- non-status-checked PostgREST requests — a failure between them could
-- silently lose history (delete succeeds, patch fails: the folded turns'
-- text is gone AND never made it into `summary`) or duplicate it (patch
-- succeeds, delete fails: the same turns get folded into `summary` again on
-- the next fold). One Postgres function makes both writes one statement, one
-- transaction — either both land or neither does.
--
-- SECURITY INVOKER, not DEFINER (contrast with `increment_usage_daily`,
-- 20260905000000_usage_daily_grants.sql): this function needs no elevated
-- privilege — the caller already has exactly the right RLS-scoped
-- permissions to delete their own `clown_turn` rows and update their own
-- `clown_conversation` row (20260904000000_clown_sessions.sql's "own
-- delete"/"own update" policies), the same permissions the two separate
-- requests it replaces already relied on. Running as invoker means RLS
-- applies to the function body exactly as it would to the caller's own raw
-- requests — a caller cannot pass another user's conversation/turn ids and
-- have this function touch them, because the underlying policies still
-- gate every row this function reads or writes. No new grant needed for
-- that reason, but the execute grant is still scoped explicitly (revoke
-- from public, grant to authenticated) as belt-and-braces, matching the
-- least-privilege posture of the sibling migration above.
create or replace function public.fold_clown_conversation(
  p_conversation_id uuid,
  p_delete_turn_ids uuid[],
  p_new_summary text
) returns void
language plpgsql
security invoker
as $$
begin
  if p_delete_turn_ids is not null and array_length(p_delete_turn_ids, 1) > 0 then
    delete from public.clown_turn where id = any(p_delete_turn_ids);
  end if;

  update public.clown_conversation
     set summary = coalesce(p_new_summary, summary),
         last_active_at = now()
   where id = p_conversation_id;
end;
$$;

revoke execute on function public.fold_clown_conversation(uuid, uuid[], text) from public;
grant execute on function public.fold_clown_conversation(uuid, uuid[], text) to authenticated;
