-- BACKFILL_MODE=rewrite snapshots a live v2 row's old copy, facts AND judge
-- score so restore-copy-snapshot.mjs can put all of it back. Additive.
alter table public.current_item_copy_snapshot add column if not exists writing_score smallint;
