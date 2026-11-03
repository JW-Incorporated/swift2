-- News post quality engine (docs/decisions.md 2026-11-03): bound the v2 writer's retries per story.
-- A story that never yields facts or keeps deferring is retried at most 3 times, at least 2h apart,
-- then marked extracted so it cannot starve the pending queue. Additive and idempotent; the worker
-- selects these columns only in NEWS_WRITER_V2=on mode and tolerates them being absent.
alter table public.news_story add column if not exists v2_attempts int not null default 0;
alter table public.news_story add column if not exists v2_last_attempt_at timestamptz;
