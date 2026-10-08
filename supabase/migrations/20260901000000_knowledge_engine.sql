-- Knowledge engine schema (proposal docs/proposals/2026-08-23-knowledge-engine.md
-- §3). One store, two tiers: the Vault (existing, static, curated) and the
-- Current tier added here (current_item/fan_signal/live_theory), plus the
-- precedent/methodology layer (egg_ledger/symbol_lexicon/technique) and the
-- single retrieval index (knowledge_doc) both tiers project into.
--
-- Two-worlds rule carries over from news_init.sql: no Vault table gains a
-- hard FK to anything in this file; current_item.story_id is the only link
-- back to the existing news_* pipeline, and it's nullable (social-only rows
-- have no story cluster).
--
-- PGVECTOR: `create extension vector` could not be verified against this
-- Supabase project in this session — no `apps/worker/.env` / `SUPABASE_DB_URL`
-- was reachable, so this migration was never actually applied or tested (see
-- HUMAN-ACTIONS.md). `knowledge_doc` therefore ships WITHOUT the
-- `embedding vector(1024)` column and its `hnsw` index from the proposal;
-- retrieval is FTS-only (`tsv`) for now, which also matches the already-
-- ratified stance in docs/decisions.md 2026-08-23 (embedding vendor pick is
-- deferred, `HUMAN-ACTIONS.md` #12 item 2) — a vector column would sit null
-- either way until that's chosen. Add it in a follow-up migration once (a)
-- pgvector is confirmed available on this project and (b) an embedding
-- vendor is picked.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- current_item: the generalized "sighting" — anything observable that
-- happened. The row the current era's feed renders AND the row Content Shift
-- promotes into the Vault.
-- ---------------------------------------------------------------------------
create table if not exists public.current_item (
  id               uuid primary key default gen_random_uuid(),
  story_id         uuid references public.news_story (id),   -- the cluster it came from (may be null for social-only)
  observed_on      date not null,
  era_id           text not null,                            -- the current/ongoing era per intake.md
  category         text not null check (category in
                     ('release','music','fashion','tour','relationship','business','award','sighting','statement','website','merch','lore')),
  tags             text[] not null default '{}',              -- the 5 ContentTags; drives FilterBar
  headline         text not null check (char_length(headline) <= 140),
  summary          text not null check (char_length(summary) <= 400),  -- matches the seed snippet cap
  detail           text not null,                             -- 1-3 sentences, our words, never past `status`
  status           text not null default 'reported' check (status in ('rumor','reported','confirmed','debunked','faded')),
  confidence       text not null,                             -- the existing Confidence union from types.ts, serialized
  source_tier      text not null check (source_tier in ('official','established','fan','unverified')),
  sources          jsonb not null,                             -- [{name,url,tier}] >= 1, publisher URLs only (never news.google redirects)
  location_level   text check (location_level in ('region','city','venue')),
  image_url        text,                                       -- hotlink from an allowlisted host or null; never rehosted
  social_post      jsonb,                                      -- {platform:'instagram',shortcode,postedOn} — existing SocialPost shape
  symbols          text[] not null default '{}',
  entities         text[] not null default '{}',
  heat             real not null default 0,                    -- corroboration x recency x fan volume
  promoted_to      text,                                       -- Vault moment id once promoted; row then hidden from feed, kept for the bot's provenance
  last_checked_on  date not null default current_date,
  expires_at       timestamptz not null default now() + interval '90 days',
  redline_ok       boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists current_item_era_observed_idx
  on public.current_item (era_id, observed_on desc) where redline_ok and promoted_to is null;
create index if not exists current_item_symbols_gin_idx
  on public.current_item using gin (symbols);

-- ---------------------------------------------------------------------------
-- fan_signal: what fans are saying — aggregate only, never an individual.
-- ---------------------------------------------------------------------------
create table if not exists public.fan_signal (
  id                 uuid primary key default gen_random_uuid(),
  window_start       timestamptz not null,
  window_end         timestamptz not null,
  platform           text not null,
  community          text not null,
  topic              text not null check (char_length(topic) <= 120),
  summary            text not null,                            -- aggregate voice: "a popular thread", "dozens of posts"
  volume             int not null,
  heat               real not null,
  stance_mix         jsonb not null default '{}',
  symbols            text[] not null default '{}',
  theory_ids         uuid[] not null default '{}',
  current_item_ids   uuid[] not null default '{}',              -- what the chatter is *about*
  sample_urls        jsonb not null default '[]',                -- <=3 public-thread permalinks
  expires_at         timestamptz not null default now() + interval '30 days',
  redline_ok         boolean not null default false
);

-- ---------------------------------------------------------------------------
-- live_theory: theories in play (fan / bot / site). The Threads-mode "eggs"
-- board reads this.
-- ---------------------------------------------------------------------------
create table if not exists public.live_theory (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  claim          text not null,
  first_seen_on  date not null,
  last_seen_on   date not null,
  origin         text not null check (origin in ('fan','bot','site')),
  status         text not null default 'rumor',
  outcome        text not null default 'pending',               -- TheoryOutcome union
  evidence_ids   text[] not null default '{}',                   -- knowledge_doc ids
  symbols        text[] not null default '{}',
  heat           real not null default 0,
  resolution     jsonb,                                          -- RumorResolution shape; REQUIRED when outcome != pending
  promoted_to    text,                                           -- theories seed slug once promoted
  expires_at     timestamptz not null default now() + interval '60 days'
);

-- ---------------------------------------------------------------------------
-- egg_ledger / symbol_lexicon: precedents + symbols, built from the Vault by
-- the canonical sync (Stage 4); grown by promotion. Schema only here.
-- ---------------------------------------------------------------------------
create table if not exists public.egg_ledger (
  id            text primary key,
  hint_doc_id   text,
  reveal_doc_id text,
  hint_date     date not null,
  reveal_date   date,
  lag_days      int generated always as (reveal_date - hint_date) stored,
  mechanism     text not null,                                   -- number|color|wardrobe|caption|set_design|lyric_callback|website|merch|social_post|countdown|interview|other
  symbols       text[] not null default '{}',
  era_id        text,
  confirmed     boolean not null default false,
  outcome       text not null,
  summary       text not null,
  sources       jsonb not null default '[]'
);
create table if not exists public.symbol_lexicon (
  key          text primary key,
  label        text not null,
  aliases      text[] not null default '{}',
  category     text not null,
  linked_eras  text[] not null default '{}',
  note         text not null default ''
);

-- ---------------------------------------------------------------------------
-- technique: THE METHODOLOGY LAYER (2026-08-16 brief, Task 1) — patterns, not
-- instances. "How Taylor plants eggs." Schema only — deliberately left EMPTY
-- here; docs/decisions.md 2026-08-23 defers authoring techniques.mjs (7-10
-- records) to a frontier-model session with a human, not an autonomous run.
-- ---------------------------------------------------------------------------
create table if not exists public.technique (
  key              text primary key,                            -- 'numerology','color_language','capitalization_cipher','anagram_wordplay',
                                                                  -- 'visual_callback','timing_cadence','long_game','wardrobe_signal','website_egg','caption_math'
  label            text not null,
  description      text not null,                                -- our words: what the technique is and how she uses it
  reliability      text not null check (reliability in ('signature','frequent','occasional','rare')),
  recurrence_test  text not null,                                 -- "what would count as evidence of it recurring" — the bot quotes this
  example_ids      text[] not null default '{}',                  -- >=2 knowledge_doc ids from the EXISTING corpus; never invented (brief's rule)
  linked_symbols   text[] not null default '{}',
  sources          jsonb not null default '[]'
);

-- ---------------------------------------------------------------------------
-- symbol_activity: materialized view, recomputed by the engine on refresh.
-- No RLS (Postgres doesn't support row security on materialized views); the
-- redline_ok filter is baked into the view definition itself, so a public
-- SELECT grant (same default as every other public-schema table here) never
-- exposes an unscreened current_item's symbols.
-- ---------------------------------------------------------------------------
create materialized view if not exists public.symbol_activity as
  select unnest(symbols) as symbol, date_trunc('week', observed_on) as week, count(*) as n
  from public.current_item where redline_ok group by 1, 2;

-- ---------------------------------------------------------------------------
-- knowledge_doc: the one retrieval index. Both tiers project into it.
-- ---------------------------------------------------------------------------
create table if not exists public.knowledge_doc (
  id            text primary key,                               -- moment:* theory:* egg:* track:* current:* signal:* ltheory:*
  kind          text not null,
  tier          text not null check (tier in ('vault','current')),
  title         text not null,
  text          text not null,
  date          date,
  recency_date  date,
  open          boolean not null default false,
  status        text not null,
  source_tier   text not null,
  sources       jsonb not null default '[]',
  era_id        text,
  symbols       text[] not null default '{}',
  entities      text[] not null default '{}',
  tsv           tsvector generated always as (to_tsvector('english', title || ' ' || text)) stored,
  expires_at    timestamptz,
  redline_ok    boolean not null default false,
  updated_at    timestamptz default now()
);
create index if not exists knowledge_doc_tsv_gin_idx on public.knowledge_doc using gin (tsv);

-- ---------------------------------------------------------------------------
-- RLS: service role writes (bypasses RLS); anon/authenticated read-only,
-- scoped to `redline_ok = true and (expires_at is null or expires_at > now())`
-- wherever a table carries both columns. live_theory has no redline_ok column
-- (theories only ever derive from already-screened content), so its policy
-- is expires_at-only. egg_ledger / symbol_lexicon / technique are curated
-- precedent/reference data built by the canonical sync from confirmed Vault
-- material, not raw ingest — public read like the rest of the Vault.
-- ---------------------------------------------------------------------------
alter table public.current_item  enable row level security;
alter table public.fan_signal    enable row level security;
alter table public.live_theory   enable row level security;
alter table public.egg_ledger    enable row level security;
alter table public.symbol_lexicon enable row level security;
alter table public.technique     enable row level security;
alter table public.knowledge_doc enable row level security;

drop policy if exists "current_item public read"   on public.current_item;
drop policy if exists "fan_signal public read"      on public.fan_signal;
drop policy if exists "live_theory public read"     on public.live_theory;
drop policy if exists "egg_ledger public read"      on public.egg_ledger;
drop policy if exists "symbol_lexicon public read"  on public.symbol_lexicon;
drop policy if exists "technique public read"       on public.technique;
drop policy if exists "knowledge_doc public read"   on public.knowledge_doc;

create policy "current_item public read" on public.current_item
  for select using (redline_ok = true and (expires_at is null or expires_at > now()));
create policy "fan_signal public read" on public.fan_signal
  for select using (redline_ok = true and (expires_at is null or expires_at > now()));
create policy "live_theory public read" on public.live_theory
  for select using (expires_at is null or expires_at > now());
create policy "egg_ledger public read" on public.egg_ledger
  for select using (true);
create policy "symbol_lexicon public read" on public.symbol_lexicon
  for select using (true);
create policy "technique public read" on public.technique
  for select using (true);
create policy "knowledge_doc public read" on public.knowledge_doc
  for select using (redline_ok = true and (expires_at is null or expires_at > now()));
