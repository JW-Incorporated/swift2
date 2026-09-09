-- Community Engine Discord delivery: opaque, per-lead acknowledgement controls
-- replace the mail-only HMAC dependency without granting any social posting
-- authority. The UUID is a capability delivered only to the private Discord
-- social channel; it is not a configured secret and is idempotent at the
-- existing acknowledgement route.

alter table public.engagement_lead
  add column if not exists discord_ack_id uuid not null default gen_random_uuid(),
  add column if not exists discord_delivered_at timestamptz,
  add column if not exists discord_message_id text;

create unique index if not exists engagement_lead_discord_ack_id_idx
  on public.engagement_lead (discord_ack_id);

alter table public.engagement_lead drop constraint if exists engagement_lead_status_check;
alter table public.engagement_lead add constraint engagement_lead_status_check
  check (status in ('new', 'drafted', 'emailed', 'delivered', 'posted',
    'skipped_redline', 'skipped_low_relevance', 'skipped_by_founder'));

-- One append-only receipt per GitHub Action run. It records exactly which
-- prompts Discord confirmed, so an interrupted run is visible and is never
-- silently retried as a duplicate send.
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
