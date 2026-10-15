-- Tidewatch's cross-pipeline seen store, decision audit, SLA timeline, and
-- provider-neutral model usage ledger (automation overhaul P1-02).
-- Pipeline-internal only: RLS is enabled with zero anon/authenticated
-- policies, so these tables are reachable only through the service role.

create table if not exists public.watch_item (
  id               uuid primary key default gen_random_uuid(),
  item_key         text not null unique,
  source           text not null check (source in (
                     'official', 'news', 'youtube', 'intake', 'merch',
                     'reddit', 'facebook', 'theory', 'social', 'moment'
                   )),
  source_ref       text,
  url_norm_hash    text,
  title_simhash    bit(64),
  story_id         text,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  seen_count       integer not null default 1 check (seen_count > 0),
  excerpt          text,
  status           text not null default 'new',
  constraint watch_item_seen_order_check
    check (last_seen_at >= first_seen_at),
  constraint watch_item_excerpt_length_check
    check (excerpt is null or char_length(excerpt) <= 2000),
  constraint watch_item_facebook_excerpt_check
    check (source <> 'facebook' or excerpt is null)
);

create index if not exists watch_item_last_seen_idx
  on public.watch_item (last_seen_at);
create index if not exists watch_item_url_hash_idx
  on public.watch_item (url_norm_hash, last_seen_at desc)
  where url_norm_hash is not null;
create index if not exists watch_item_recent_simhash_idx
  on public.watch_item (last_seen_at desc, title_simhash)
  where title_simhash is not null;
create index if not exists watch_item_story_idx
  on public.watch_item (story_id)
  where story_id is not null;

create table if not exists public.watch_decision (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references public.watch_item (id) on delete set null,
  class       text not null,
  confidence  double precision not null check (confidence >= 0 and confidence <= 1),
  decider     text not null,
  model_id    text,
  answers     jsonb not null default '{}'::jsonb,
  action      text not null,
  action_ref  text,
  shadow      boolean not null default true,
  decided_at  timestamptz not null default now()
);

create index if not exists watch_decision_item_idx
  on public.watch_decision (item_id, decided_at desc)
  where item_id is not null;
create index if not exists watch_decision_shadow_retention_idx
  on public.watch_decision (decided_at)
  where shadow;

create table if not exists public.watch_cursor (
  source  text primary key,
  cursor  text not null
);

create table if not exists public.story_timeline (
  story_id         text primary key,
  first_public_at  timestamptz,
  detected_at      timestamptz,
  classified_at    timestamptz,
  verified_at      timestamptz,
  on_site_at       timestamptz,
  social_at        timestamptz,
  push_at          timestamptz
);

create index if not exists story_timeline_detected_idx
  on public.story_timeline (detected_at)
  where detected_at is not null;

create table if not exists public.llm_usage (
  id                 uuid primary key default gen_random_uuid(),
  caller             text not null,
  provider           text not null check (provider in ('jev', 'claude')),
  model              text not null,
  token              text check (token is null or token in ('primary', 'backup')),
  input_tokens       integer not null default 0 check (input_tokens >= 0),
  output_tokens      integer not null default 0 check (output_tokens >= 0),
  cache_read_tokens  integer not null default 0 check (cache_read_tokens >= 0),
  calls              integer not null default 1 check (calls > 0),
  est_cost_usd       numeric(14, 8) check (est_cost_usd is null or est_cost_usd >= 0),
  created_at         timestamptz not null default now()
);

create index if not exists llm_usage_caller_created_idx
  on public.llm_usage (caller, created_at desc);

alter table public.watch_item     enable row level security;
alter table public.watch_decision enable row level security;
alter table public.watch_cursor   enable row level security;
alter table public.story_timeline enable row level security;
alter table public.llm_usage      enable row level security;

revoke all on table public.watch_item, public.watch_decision, public.watch_cursor, public.story_timeline, public.llm_usage from public, anon, authenticated;
grant all on table public.watch_item, public.watch_decision, public.watch_cursor, public.story_timeline, public.llm_usage to service_role;

-- Deliberately no policies: anon and authenticated receive no rows through
-- RLS; service_role bypasses RLS for Tidewatch's collectors and jobs.
