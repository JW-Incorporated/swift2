-- The judge's writing score is now the sum of its four 1-5 dimensions (4-20),
-- not the minimum (docs/decisions.md 2026-11-03). Widen the range check.
alter table public.current_item drop constraint if exists current_item_writing_score_range;
alter table public.current_item add constraint current_item_writing_score_range check (writing_score between 1 and 20);
