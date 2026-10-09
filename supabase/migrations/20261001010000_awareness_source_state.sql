-- Awareness lane, anonymous-volume rework (owner decision 2026-10-01: no Reddit
-- API key, ever). The scan now runs every ~20 minutes with a 1-2 request budget
-- and rotates through the feeds; this table is its memory across runs.
--   source          'sub:<name>:hot' | 'sub:<name>:new' | 'search:<i>' for a feed,
--                   '*global*' for the whole runner IP
--   last_fetched_at when the feed was last asked (least recent goes next)
--   cooldown_until  after a 429/403 the feed (or, for '*global*', the whole lane)
--                   sits out until then
--   strikes         consecutive failures; the cooldown doubles per strike
-- Service-role only, like every Community Engine table.
create table if not exists public.awareness_source_state (
  source          text primary key,
  last_fetched_at timestamptz,
  cooldown_until  timestamptz,
  strikes         integer not null default 0,
  updated_at      timestamptz not null default now()
);
alter table public.awareness_source_state enable row level security;
