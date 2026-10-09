-- site-diff adapter + countdown auto-pin (t_ddc17685, approved design on
-- t_09dc269f). Adds the taylorswift.com site-diff source type, the two
-- nullable current_item columns the pin computation reads
-- (countdown_target_at / countdown_resolved_at — a plain data predicate,
-- never a second stored "is pinned" flag, per the approved design §2), a
-- matching raw-item column so a countdown target detected deterministically
-- at ingest survives clustering/extraction without an LLM re-deriving it,
-- and a tiny pipeline-internal snapshot table the adapter uses to diff
-- consecutive fetches (store a hash, never the full page).

-- ---------------------------------------------------------------------------
-- 1. Widen news_source.source_type to admit 'site_diff' — same
--    drop-then-recreate, idempotent, only-ever-wider pattern as the
--    20260901010000 fan-adapters migration.
-- ---------------------------------------------------------------------------
alter table public.news_source drop constraint if exists news_source_source_type_check;
alter table public.news_source add constraint news_source_source_type_check
  check (source_type in
    ('rss', 'reddit', 'x', 'youtube', 'bluesky', 'google_news', 'reddit_rss', 'tumblr', 'gnews', 'site_diff'));

-- ---------------------------------------------------------------------------
-- 2. news_raw_item.countdown_target_at — carries a deterministically parsed
--    countdown target (epoch/ISO timestamp read straight off the site's own
--    markup) from the site-diff adapter through clustering into extraction.
--    Nullable; every other adapter/item leaves it null.
-- ---------------------------------------------------------------------------
alter table public.news_raw_item add column if not exists countdown_target_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. current_item: the two columns the CountdownBanner pin predicate reads
--    (proposal comment on t_09dc269f §2): "pinned" is computed as
--    `countdown_target_at is not null and countdown_resolved_at is null and
--    countdown_target_at > now() - grace`, never a separately stored flag.
-- ---------------------------------------------------------------------------
alter table public.current_item add column if not exists countdown_target_at timestamptz;
alter table public.current_item add column if not exists countdown_resolved_at timestamptz;
-- Only the current era's live, still-open countdowns are ever queried for
-- the pin slot — partial index keeps that lookup cheap regardless of how
-- large current_item grows.
create index if not exists current_item_live_countdown_idx
  on public.current_item (era_id, countdown_target_at)
  where countdown_target_at is not null and countdown_resolved_at is null;

-- ---------------------------------------------------------------------------
-- 4. site_diff_snapshot: pipeline-internal, one row per news_source of type
--    'site_diff'. Stores only a content hash (never the raw HTML) so the
--    adapter can tell "nothing changed since last poll" without diffing
--    full pages on every 4h run. No FK to current_item — resolution
--    (clearing countdown_resolved_at) is done by re-checking the site's own
--    markup against whatever current_item rows are still open, not by a
--    stored link, so a lost/rebuilt snapshot row can never leave a stale
--    pin behind.
-- ---------------------------------------------------------------------------
create table if not exists public.site_diff_snapshot (
  source_id    uuid primary key references public.news_source (id) on delete cascade,
  content_hash text not null,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: pipeline-internal, same posture as news_raw_item/news_source above —
-- no public policies, service-role/worker only.
-- ---------------------------------------------------------------------------
alter table public.site_diff_snapshot enable row level security;
