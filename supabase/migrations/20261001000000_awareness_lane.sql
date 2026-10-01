-- Awareness image-reply lane (owner direction 2026-10-01,
-- docs/strategy/growth-strategy.md bet 2): threads where a picture of the
-- site, with no link, invites "what is that?!". Same engagement_lead table
-- and the same HMAC Posted/Skip ack route as the reply-opportunity lane; the
-- owner posts every reply himself.
--
-- New kind 'awareness_reply', and four columns the lane needs:
--   image_ref       'moment:<id>' | 'era:<id>' — the share-card to attach
--   image_comments  can this sub's comments carry an image? ('image' |
--                   'text_only' | 'unknown'; about.json is unverified from CI)
--   why             one-line reason this thread fits (answerer-written)
--   thread_type     ranking | timeline | easter_egg | nostalgia | news | facebook

alter table public.engagement_lead drop constraint if exists engagement_lead_kind_check;
alter table public.engagement_lead add constraint engagement_lead_kind_check
  check (kind in ('alert', 'digest', 'hot_thread', 'reply_to_us', 'awareness_reply'));

alter table public.engagement_lead
  add column if not exists image_ref text,
  add column if not exists image_comments text
    check (image_comments is null or image_comments in ('image', 'text_only', 'unknown')),
  add column if not exists why text,
  add column if not exists thread_type text;

create index if not exists engagement_lead_awareness_idx
  on public.engagement_lead (status, created_at desc)
  where kind = 'awareness_reply';

-- Per-sub cache of the about.json image-comment reading (`comment_contribution_
-- settings.allowed_media_types`), so a successful read is never repeated for a
-- week. Sub '*blocked*' records "Reddit bot-blocked about.json" for half a day.
-- Service-role only, like every Community Engine table.
create table if not exists public.awareness_sub_cache (
  sub            text primary key,
  image_comments text not null check (image_comments in ('image', 'text_only', 'unknown')),
  over18         boolean not null default false,
  fetched_at     timestamptz not null default now()
);
alter table public.awareness_sub_cache enable row level security;
