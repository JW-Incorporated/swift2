-- Schema fix: ONE conversation per user IS the actual identity model, not a
-- bug to route around (architect-directed redesign, HUMAN-ACTIONS.md #15
-- round 4). `clown_conversation` previously allowed multiple rows per
-- `user_id`, forcing every read to guess "most recent" via
-- `order=last_active_at.desc&limit=1` (`clown-memory.ts`'s `getConversation`)
-- instead of the database enforcing the invariant directly.
--
-- DEDUPE FIRST (idempotent — a no-op once already deduped, so re-running
-- this migration is safe): any dev/test DB carrying pre-constraint data may
-- already have more than one row per `user_id`. Keep the most recently
-- active row per user, drop the rest — their `clown_turn` rows cascade-
-- delete via that table's own FK (`20260904000000_clown_sessions.sql`).
delete from public.clown_conversation c
 where c.id not in (
   select distinct on (user_id) id
     from public.clown_conversation
    order by user_id, last_active_at desc
 );

-- `clown-memory.ts`'s `getOrCreateConversation` now upserts against this
-- constraint (`on_conflict=user_id`, `Prefer: resolution=merge-duplicates`)
-- rather than a plain insert — a plain insert alone would permanently fail
-- conversation creation for any user whose existing row has EXPIRED (RLS
-- hides an expired row at read time, but the physical row still exists and
-- would collide on insert); the upsert recovers from that collision by
-- resetting `summary`/`expires_at` instead of erroring.
alter table public.clown_conversation drop constraint if exists clown_conversation_user_id_unique;
alter table public.clown_conversation add constraint clown_conversation_user_id_unique unique (user_id);
