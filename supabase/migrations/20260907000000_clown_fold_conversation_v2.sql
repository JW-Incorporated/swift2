-- Fast-follow fix on `fold_clown_conversation` (20260906000000_clown_fold_
-- conversation.sql) — HUMAN-ACTIONS.md #15 item 5, PR #2325's own review
-- round. `create or replace function` redefines the same signature in
-- place; the prior migration is left untouched (already merged, matching
-- how every other fast-follow migration fix landed tonight) rather than
-- edited.
--
-- TWO REAL GAPS in the original body:
--   1. The delete only scoped by `id = any(p_delete_turn_ids)` — RLS
--      already restricts it to the CALLER'S OWN turns (`clown_turn own
--      delete`'s `auth.uid() = user_id`, 20260904000000_clown_sessions.sql),
--      but says nothing about which CONVERSATION those turns belong to. A
--      caller could pass turn ids that are genuinely theirs but belong to a
--      DIFFERENT one of their own conversations, and this function would
--      delete them anyway while patching an unrelated conversation's
--      summary — turns disappear from the wrong conversation, never folded
--      into any summary at all. Fixed by also requiring
--      `conversation_id = p_conversation_id` on the delete.
--   2. Neither write checked its own affected-row count. A caller passing a
--      `p_conversation_id` that does not exist (typo, a stale/deleted id)
--      silently "succeeded" — the delete (scoped to real owned turns) could
--      still remove rows, and the update simply matched and touched zero
--      rows, with no signal to the caller that nothing was actually folded.
--      Fixed by raising when the update affects zero rows — the one
--      unambiguous signal that `p_conversation_id` did not name a row this
--      caller can see, which for a security-invoker function scoped by RLS
--      to `auth.uid() = user_id` means either it does not exist or is not
--      this caller's to update.
--
-- SECURITY INVOKER — unchanged from the original migration's own rationale
-- (see that file's header): no elevated privilege is needed, RLS applies to
-- this function's body exactly as it would to the caller's own raw
-- requests.
create or replace function public.fold_clown_conversation(
  p_conversation_id uuid,
  p_delete_turn_ids uuid[],
  p_new_summary text
) returns void
language plpgsql
security invoker
as $$
declare
  v_updated int;
begin
  if p_delete_turn_ids is not null and array_length(p_delete_turn_ids, 1) > 0 then
    delete from public.clown_turn
     where id = any(p_delete_turn_ids)
       and conversation_id = p_conversation_id;
  end if;

  update public.clown_conversation
     set summary = coalesce(p_new_summary, summary),
         last_active_at = now()
   where id = p_conversation_id;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'fold_clown_conversation: no conversation % visible to this caller', p_conversation_id
      using errcode = 'P0002'; -- no_data_found
  end if;
end;
$$;

revoke execute on function public.fold_clown_conversation(uuid, uuid[], text) from public;
grant execute on function public.fold_clown_conversation(uuid, uuid[], text) to authenticated;
