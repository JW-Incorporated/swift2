-- Adds optional day-of-month precision to month_item. Most items are still
-- only known to month precision (day stays null, falling back to the 1st
-- for date/sort purposes with a month-level display label); this lets
-- content authors add a real day where the exact date is documented.
-- Additive only.

alter table public.month_item
  add column if not exists day smallint;

-- Postgres has no `add constraint if not exists`, so the original form of
-- this migration could only ever run ONCE — a re-run threw "constraint
-- already exists" and aborted the whole run, blocking every migration
-- ordered after it. Found 2026-07-19: that is exactly why news_init had
-- never been applied and the news pipeline had no tables to read.
-- scripts/migrate.mjs applies every file on every run and documents that
-- migrations are idempotent, so guard this one explicitly.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'month_item_day_range'
      and conrelid = 'public.month_item'::regclass
  ) then
    alter table public.month_item
      add constraint month_item_day_range
      check (day is null or (day >= 1 and day <= 31));
  end if;
end $$;
