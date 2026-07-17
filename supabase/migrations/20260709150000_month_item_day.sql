-- Adds optional day-of-month precision to month_item. Most items are still
-- only known to month precision (day stays null, falling back to the 1st
-- for date/sort purposes with a month-level display label); this lets
-- content authors add a real day where the exact date is documented.
-- Additive only.

alter table public.month_item
  add column if not exists day smallint,
  add constraint month_item_day_range check (day is null or (day >= 1 and day <= 31));
