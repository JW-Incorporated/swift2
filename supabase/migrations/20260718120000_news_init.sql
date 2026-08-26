-- News/Current pipeline schema (V2, issue #468). DRAFT — see the
-- docs/decisions.md 2026-07-18 entry ("News/Current pipeline (V2, #468):
-- schema, cadence, cost cap — DRAFT, pending Wyatt"). Nothing here touches
-- the Vault's runtime path.
--
-- Two-worlds rule (docs/decisions.md, 2026-07-02): zero foreign keys in
-- either direction between news_* and the Vault (era/milestone/month_item/
-- moment/track_note); no Vault query may join or read news_*; the Vault's
-- Tier-0 payload builder and budget gate never see news rows.
--
-- Same "no bodies" rule and CHECK-constraint backstop as the Vault
-- (supabase/migrations/20260703190000_vault_init.sql): title + snippet +
-- canonical link only, never a rehosted article body; images are hotlinked
-- URLs, never rehosted.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- news_source: one row per configured ingestion source instance. Adding a
-- feed is a data change (INSERT), not a deploy. No secrets in `config` —
-- API keys live in worker env only (docs/proposals/2026-07-07-news-pipeline-
-- architecture.md §6).
-- ---------------------------------------------------------------------------
create table if not exists public.news_source (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  source_type    text not null check (source_type in
                    ('rss', 'reddit', 'x', 'youtube', 'bluesky', 'google_news')),
  tier           text not null check (tier in
                    ('official', 'established', 'fan', 'unverified')),
  config         jsonb not null default '{}'::jsonb,
  is_enabled     boolean not null default true,
  last_polled_at timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists news_source_enabled_idx on public.news_source (is_enabled);

-- ---------------------------------------------------------------------------
-- news_story: the deduplicated unit users read. Classified/verified exactly
-- once each — the partial indexes below keep those once-only stages a cheap
-- query (`WHERE classified_at IS NULL`), not a full scan.
-- ---------------------------------------------------------------------------
create table if not exists public.news_story (
  id                  uuid primary key default gen_random_uuid(),
  canonical_title     text not null check (char_length(canonical_title) <= 500),
  summary             text not null default '' check (char_length(summary) <= 1000),
  category            text check (category in
                         ('sighting','fashion','relationship','tour','business','music','release')),
  importance          integer check (importance between 1 and 10),
  source_count        integer not null default 0,
  verification_status text not null default 'single_source' check (verification_status in
                         ('official','corroborated','single_source','rumor','disputed','debunked')),
  corroboration       jsonb not null default '[]'::jsonb,  -- tier-weighted outlet breakdown
  top_image_url       text,                                -- hotlink or null; never rehosted
  first_seen_at       timestamptz not null default now(),
  last_updated_at     timestamptz not null default now(),
  classified_at       timestamptz,
  verified_at         timestamptz
);
create index if not exists news_story_classified_pending_idx
  on public.news_story (id) where classified_at is null;
create index if not exists news_story_verified_pending_idx
  on public.news_story (id) where verified_at is null;
create index if not exists news_story_first_seen_idx on public.news_story (first_seen_at desc);

-- ---------------------------------------------------------------------------
-- news_raw_item: every ingested item, pre-dedup. Idempotent on
-- (source_id, external_id) so a re-poll of the same feed never duplicates.
-- ---------------------------------------------------------------------------
create table if not exists public.news_raw_item (
  id             uuid primary key default gen_random_uuid(),
  source_id      uuid not null references public.news_source (id) on delete cascade,
  external_id    text not null,
  url            text not null,
  title          text not null check (char_length(title) <= 500),
  snippet        text not null default '' check (char_length(snippet) <= 2000),
  author         text,
  published_at   timestamptz,
  image_url      text,                                 -- hotlink or null; never rehosted
  raw_payload    jsonb not null default '{}'::jsonb,    -- trimmed source payload, pipeline-internal
  similarity_key text,
  story_id       uuid references public.news_story (id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint news_raw_item_source_external_unique unique (source_id, external_id)
);
create index if not exists news_raw_item_story_idx on public.news_raw_item (story_id);
create index if not exists news_raw_item_source_idx on public.news_raw_item (source_id);

-- ---------------------------------------------------------------------------
-- news_story_source: audit trail story → supporting raw items. Drives
-- "reported by N sources" and the credibility display. `tier` is denormalized
-- at corroboration time so the audit trail is stable even if a source's tier
-- is recalibrated later.
-- ---------------------------------------------------------------------------
create table if not exists public.news_story_source (
  id           uuid primary key default gen_random_uuid(),
  story_id     uuid not null references public.news_story (id) on delete cascade,
  raw_item_id  uuid references public.news_raw_item (id) on delete set null,
  outlet_name  text not null,
  url          text not null,
  tier         text not null check (tier in
                  ('official', 'established', 'fan', 'unverified')),
  created_at   timestamptz not null default now()
);
create index if not exists news_story_source_story_idx on public.news_story_source (story_id);

-- ---------------------------------------------------------------------------
-- news_llm_usage: durable daily LLM-call counter backing the hard cap
-- (docs/decisions.md 2026-07-18 entry — 100 calls/day starting cap). One row
-- per UTC day; the worker's capped-call module increments this before every
-- call and refuses once the cap is hit for that day.
-- ---------------------------------------------------------------------------
create table if not exists public.news_llm_usage (
  usage_date  date primary key default current_date,
  call_count  integer not null default 0
);

create or replace function public.increment_news_llm_usage()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.news_llm_usage (usage_date, call_count)
  values (current_date, 1)
  on conflict (usage_date) do update set call_count = news_llm_usage.call_count + 1
  returning call_count into new_count;
  return new_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: news_story / news_story_source are public and read-only, like the
-- Vault. news_raw_item / news_source / news_llm_usage are pipeline
-- internals — no public policies at all (service-role/worker only).
-- ---------------------------------------------------------------------------
alter table public.news_source       enable row level security;
alter table public.news_story        enable row level security;
alter table public.news_raw_item     enable row level security;
alter table public.news_story_source enable row level security;
alter table public.news_llm_usage    enable row level security;

drop policy if exists "news_story public read"        on public.news_story;
drop policy if exists "news_story_source public read" on public.news_story_source;

create policy "news_story public read"        on public.news_story        for select using (true);
create policy "news_story_source public read" on public.news_story_source for select using (true);
-- Deliberately no policies on news_source / news_raw_item / news_llm_usage —
-- RLS enabled with zero policies means zero access under anon/authenticated;
-- only service_role (which bypasses RLS) can read or write them.
