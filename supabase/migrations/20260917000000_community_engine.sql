-- Community Engine schema (proposal docs/proposals/2026-09-06-community-engine-plan.md
-- §5, Phase 0 card P0-1). Founder approved all 4 §8 recommendations 2026-09-06
-- (Q1 defaults, Q2=b, Q3=a, Q4=a).
--
-- Two engines, one store: the engagement engine (leads → drafts → a daily
-- email a human pastes) and the content engine (a year-deep fan-theory
-- corpus). Nothing here posts, replies, votes, follows or DMs on Reddit or
-- Facebook — every write to those platforms is by a human's hands
-- (guardrail §6.1). This migration is schema only; no automation reads or
-- writes these tables yet (that's Phase 1/2, gated behind GATE-P0).
--
-- RLS posture (§5, "the three new tables are service-role only"): unlike
-- current_item/fan_signal/live_theory (public, screened content), leads and
-- drafts never reach the browser — they exist only for the Answerer desk,
-- the daily mailer, and the HMAC ack route, all service-role. So
-- community_watchlist, engagement_lead, community_post_ledger and
-- fan_theory_candidate get RLS enabled with NO public policies at all
-- (service role bypasses RLS by design; anon/authenticated get zero rows).

create table if not exists public.community_watchlist (
  id            text primary key,                              -- 'reddit:TaylorSwift' | 'facebook:<group-slug>'
  platform      text not null check (platform in ('reddit', 'facebook')),
  name          text not null,
  scan          boolean not null default true,                  -- daily hot-thread scan (E2/E4)
  crawl         boolean not null default false,                 -- yearly corpus crawl (C1)
  allows_links  boolean,                                        -- per-sub self-promo rule, human-set (§6.5 etiquette gate)
  notes         text
);

create table if not exists public.engagement_lead (
  id                uuid primary key default gen_random_uuid(),
  platform          text not null,
  community         text not null,
  kind              text not null check (kind in ('alert', 'digest', 'hot_thread', 'reply_to_us')),
  thread_id         text,                                       -- reddit t3_ id; null for facebook
  url               text,                                       -- public permalink; null for facebook
  locator           text,                                       -- facebook: group + first 80 chars of post text
  title             text,
  context           text,                                       -- our-words summary, NEVER raw comment/post bodies (§6.3)
  relevance         real,
  matched_doc_ids   text[] not null default '{}',
  target_url        text,
  draft             text,
  draft_alt         text,
  link_included     boolean,
  status            text not null default 'new'
                      check (status in ('new', 'drafted', 'emailed', 'posted',
                        'skipped_redline', 'skipped_low_relevance')),
  redline_ok        boolean not null default false,
  created_at        timestamptz default now(),
  emailed_at        timestamptz,
  posted_at         timestamptz
);
create index if not exists engagement_lead_status_idx
  on public.engagement_lead (status, created_at desc);
-- Dedupe key from §5's schema (`unique (platform, coalesce(thread_id,
-- locator), kind)`). A table-level UNIQUE constraint only accepts a plain
-- column list in Postgres — it cannot take an expression like coalesce() —
-- so the dedupe has to be a unique INDEX over the expression instead.
create unique index if not exists engagement_lead_dedupe_idx
  on public.engagement_lead (platform, coalesce(thread_id, locator), kind);

create table if not exists public.community_post_ledger (   -- the "did we already comment" truth (§2.6)
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references public.engagement_lead (id),
  platform        text not null,
  community       text not null,
  thread_id       text,
  comment_target  text,
  link_included   boolean not null,
  posted_at       timestamptz not null default now(),
  posted_by       text
);
create index if not exists community_post_ledger_dedupe_idx
  on public.community_post_ledger (platform, community, thread_id);

create table if not exists public.fan_theory_candidate (
  id                 uuid primary key default gen_random_uuid(),
  claim              text not null check (char_length(claim) <= 200),   -- our words, never a quote
  theory_key         text not null,                              -- slug, dedupes across threads
  mechanism          text,                                       -- same vocabulary as egg_ledger.mechanism
  symbols            text[] not null default '{}',
  era_id             text,
  track_slug         text,
  predicts           text check (predicts in ('release', 're-record', 'setlist', 'feature', 'title', 'date', 'other')),
  predicted_date     date,
  evidence_summary   text,                                       -- 1-2 sentences, aggregate fan voice
  first_seen_on      date not null default current_date,
  last_seen_on       date not null default current_date,
  mention_count      int not null default 1,
  peak_score         real not null default 0,
  communities        text[] not null default '{}',
  stance             text not null default 'believed' check (stance in ('believed', 'contested', 'debunked_by_fans')),
  status             text not null default 'candidate' check (status in ('candidate', 'accepted', 'merged', 'rejected')),
  redline_ok         boolean not null default false,             -- screenTopic() result; never true into the store on a redline hit
  sample_urls        jsonb not null default '[]',                -- <=3 public permalinks; empty for Facebook
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index if not exists fan_theory_candidate_theory_key_idx
  on public.fan_theory_candidate (theory_key);

-- live_theory gains the columns the corpus miner needs to promote a
-- long-lived, corpus-mined theory without it aging out at the existing
-- 60-day `expires_at` default (§1: "Add a persistent flag ... they age out
-- only when outcome resolves") and to carry the heat/provenance the Clue
-- Web origin badge reads (§3.4: "340 mentions · r/TaylorSwift").
alter table public.live_theory add column if not exists persistent boolean not null default false;
alter table public.live_theory add column if not exists mention_count int;
alter table public.live_theory add column if not exists communities text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- RLS: all four objects above are service-role only. No anon/authenticated
-- policy is created for any of them — drafts, leads, ledger entries and
-- theory candidates never reach the browser except through the HMAC-signed
-- /api/community/ack route (service-role, Phase 1 P1-5), matching §5's RLS
-- note verbatim. live_theory's new columns ride the table's existing public
-- read policy (20260903000000_live_theory_redline.sql) unchanged.
-- ---------------------------------------------------------------------------
alter table public.community_watchlist    enable row level security;
alter table public.engagement_lead        enable row level security;
alter table public.community_post_ledger  enable row level security;
alter table public.fan_theory_candidate   enable row level security;

-- Seed the watchlist from §8-Q1 defaults (founder accepted; edit later in
-- this table, not in code). crawl=true only on the first three per §3.2's
-- opening list; TSwiftEasterEggs-style sub verification is P0-2's job, not
-- inserted here as a guess. Facebook groups from sources.md's verified
-- names (Taylor Swift's Vault, ~480k; the Friendship Bracelet Making and
-- Trading group) — the rest of sources.md's candidate list is unverified
-- and is P0-2's job to confirm before it's added here.
insert into public.community_watchlist (id, platform, name, scan, crawl, allows_links, notes)
values
  ('reddit:TaylorSwift', 'reddit', 'TaylorSwift', true, true, null, 'Seed default (§8-Q1). allows_links pending P0-2 sidebar-rule verification.'),
  ('reddit:SwiftlyNeutral', 'reddit', 'SwiftlyNeutral', true, true, null, 'Seed default (§8-Q1). allows_links pending P0-2 sidebar-rule verification.'),
  ('reddit:TaylorSwiftBookClub', 'reddit', 'TaylorSwiftBookClub', true, true, null, 'Seed default (§8-Q1). allows_links pending P0-2 sidebar-rule verification.'),
  ('reddit:YouBelongWithMemes', 'reddit', 'YouBelongWithMemes', true, false, null, 'Seed default (§8-Q1), scan-only. allows_links pending P0-2 verification.'),
  ('reddit:TaylorSwiftMerch', 'reddit', 'TaylorSwiftMerch', true, false, null, 'Seed default (§8-Q1), scan-only; also feeds the E5 fan-merch widen (§3.5).'),
  ('facebook:taylor-swifts-vault', 'facebook', 'Taylor Swift''s Vault', true, false, null, 'sources.md verified group name (~480k members). Export-only intake (§2.4), no crawler.'),
  ('facebook:friendship-bracelet-making-and-trading', 'facebook', 'Taylor Swift Friendship Bracelet Making and Trading NO SALES', true, false, null, 'sources.md verified group name. Export-only intake (§2.4), no crawler.')
on conflict (id) do nothing;
