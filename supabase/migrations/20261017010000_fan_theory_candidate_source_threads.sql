-- Retain every source thread independently of the <=3 public sample URLs so
-- repeat mining after a comment-bucket change cannot inflate mention_count.
alter table public.fan_theory_candidate
  add column if not exists source_thread_ids text[] not null default '{}';
