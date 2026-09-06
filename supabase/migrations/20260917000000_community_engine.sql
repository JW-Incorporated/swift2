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

-- Seed the watchlist from the P0-2 verified values (docs/community/watchlist.md,
-- PR #3944, researched from docs/proposals/2026-09-06-community-engine-plan.md
-- §8-Q1 defaults). crawl=true on the first three scan subs plus
-- reddit:TaylorSwiftTheories, the confirmed "TSwiftEasterEggs-style" sub
-- (§8-Q1, §3.2). Facebook groups from sources.md's verified names (Taylor
-- Swift's Vault, ~480k; the Friendship Bracelet Making and Trading group) —
-- the rest of sources.md's candidate list remains unverified and is not
-- seeded here.
insert into public.community_watchlist (id, platform, name, scan, crawl, allows_links, notes)
values
  ('reddit:TaylorSwift', 'reddit', 'TaylorSwift', true, true, false, 'Sidebar/rules wiki (`/wiki/index/rules`) explicit: "No self promo... Linking or directing to your store will result in a ban." No exceptions found. Never link here without a prior modmail.'),
  ('reddit:SwiftlyNeutral', 'reddit', 'SwiftlyNeutral', true, true, true, 'Its own pinned Daily Discussion Thread rules explicitly list "Memes, videos, art, merch photos, or self-promotion you''d like to share" as permitted content — but this permission is scoped to the daily discussion thread, not the main feed/link posts. Treat as link-friendly only inside daily discussion threads; still gate on redditNonPromo≥20 and do a modmail check before the first post.'),
  ('reddit:TaylorSwiftBookClub', 'reddit', 'TaylorSwiftBookClub', true, true, true, 'Official rules (`/about/sidebar`, rule 5): "Please follow Reddit''s guidelines on self promotion. Self promotion links from accounts with limited non-promotion history may be removed." — i.e. no blanket ban, standard site-wide 9:1 norm applies. Low-traffic sub; a good "safe" first-link candidate for the etiquette gate once redditNonPromo≥20.'),
  ('reddit:YouBelongWithMemes', 'reddit', 'YouBelongWithMemes', true, false, false, 'Could not locate a published rules/sidebar text via search (mirrors show posts but not a rules page). Meme-only culture makes link posts atypical. Default to no-link until an Answerer-desk modmail check confirms a posture.'),
  ('reddit:TaylorSwiftMerch', 'reddit', 'TaylorSwiftMerch', true, false, false, 'No explicit self-promo rule surfaced; sub exists specifically to discuss merch/trading, so shop-adjacent links may be more tolerated than elsewhere, but nothing found guarantees it. Gate behind modmail same as others — this is the E5 fan-merch-widen target, not an Answerer-desk link target.'),
  ('reddit:TaylorSwiftTheories', 'reddit', 'TaylorSwiftTheories', false, true, false, 'r/TaylorSwiftTheories is confirmed alive with dated 2026 posts ("The Literacy of Taylor Swift" Apr ''26, an Eras-Tour Easter-egg thread Nov ''25, etc.) and its stated purpose is exactly "discuss and share Taylor Swift theories and Easter eggs" — a direct match for the Theory Miner''s intake. The lowercase r/tswifteastereggs variant also exists but no recent activity could be found in search results (only an old tagline snippet); recommend TaylorSwiftTheories over it. allows_links=false (theory/discussion sub, no self-promo rule text found — treat conservatively; irrelevant anyway since crawl-only subs don''t post).'),
  ('facebook:taylor-swifts-vault', 'facebook', 'Taylor Swift''s Vault', true, false, false, 'No FB crawler exists or is planned (decisions.md 2026-08-11) — this row only matters for the human-export ingest (E4/§2.4); "links" here means comment replies drafted from an export, not automated posting. Treat as no-link by default, same modmail-style caution as Reddit, until Joey confirms group norms from an actual export.'),
  ('facebook:friendship-bracelet-trading', 'facebook', 'Taylor Swift Friendship Bracelet Making and Trading NO SALES', true, false, false, 'The "NO SALES" in the group''s title is itself the self-promo rule — this is a making/trading group, not a marketplace. Never draft a promotional/shop-link reply here.')
on conflict (id) do nothing;
