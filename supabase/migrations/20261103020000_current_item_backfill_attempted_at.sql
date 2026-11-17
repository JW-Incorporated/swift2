-- News post quality engine (docs/decisions.md 2026-11-03): force-mode backfill marks every row it
-- attempts so a capped or deferred run resumes with the least recently attempted rows instead of
-- re-trying the same newest rows forever. Additive and idempotent; the worker selects this column
-- only in force-mode backfill and tolerates it being absent (Postgres 42703).
alter table public.current_item add column if not exists backfill_attempted_at timestamptz;
