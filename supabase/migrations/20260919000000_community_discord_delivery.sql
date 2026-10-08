-- Community Engine Discord delivery: replaces the mail-only send with
-- delivery of the same signed, HMAC-verified acknowledgement links
-- (`buildAckUrl` / `apps/web/app/api/community/ack/route.ts`, unchanged)
-- to the configured Discord social channel. No new acknowledgement
-- capability is introduced — the existing signed-token route is reused
-- as-is (Fable ruling 2026-09-09 23:24: an unsigned `discord_ack_id`
-- capability is architecturally unsafe because `action`/`link` remain
-- caller-controlled and Discord URL unfurling can trigger a false GET
-- acknowledgement).

alter table public.engagement_lead
  add column if not exists discord_delivered_at timestamptz,
  add column if not exists discord_message_id text;

-- `delivered` sits between `drafted` and `posted`/`skipped_*`: a lead whose
-- prompt was confirmed sent to Discord but not yet acted on by a founder.
alter table public.engagement_lead drop constraint if exists engagement_lead_status_check;
alter table public.engagement_lead add constraint engagement_lead_status_check
  check (status in ('new', 'drafted', 'emailed', 'delivered', 'posted',
    'skipped_redline', 'skipped_low_relevance', 'skipped_by_founder'));

-- One append-only receipt per delivery batch. It records exactly which
-- leads Discord confirmed, so an interrupted run is visible and only the
-- still-undelivered leads are retried — never a duplicate send of an
-- already-confirmed message.
create table if not exists public.community_delivery_receipt (
  id uuid primary key default gen_random_uuid(),
  delivery_key text not null unique,
  mode text not null check (mode in ('daily', 'replies-waiting')),
  lead_count integer not null,
  draft_count integer not null,
  delivered_count integer not null default 0,
  status text not null check (status in ('started', 'delivered', 'failed')),
  discord_messages jsonb not null default '[]',
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.community_delivery_receipt enable row level security;
