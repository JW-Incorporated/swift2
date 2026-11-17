-- Track consecutive per-source fetch failures so the worker can escalate a
-- single flaky source to a real error after three straight cycles without
-- reddening the run on every individual miss.
alter table public.news_source
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_ok_at timestamptz;
