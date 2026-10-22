-- Qwen second opinion (architect consult #15, founder-approved 2026-10-17).
-- A queue on engagement_lead: the home-PC poller (scripts/home/qwen-second-opinion)
-- drafts a second reply for REPLY leads and posts it under the card. Service-role only.

do $migration$
declare
  first_run boolean := not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'engagement_lead' and column_name = 'qwen_status'
  );
begin
  alter table public.engagement_lead
    add column if not exists qwen_status text default 'pending',
    add column if not exists qwen_draft text,
    add column if not exists qwen_attempts integer default 0,
    add column if not exists qwen_at timestamptz,
    add column if not exists qwen_discord_message_id text,
    add column if not exists qwen_error text;

  -- Every row that exists when the columns are added is skipped, so the first
  -- run never floods old cards. Reruns leave later rows alone.
  if first_run then
    update public.engagement_lead set qwen_status = 'skipped';
  end if;
end
$migration$;

alter table public.engagement_lead drop constraint if exists engagement_lead_qwen_status_check;
alter table public.engagement_lead add constraint engagement_lead_qwen_status_check
  check (qwen_status in ('pending', 'done', 'failed', 'skipped'));

create index if not exists engagement_lead_qwen_pending_idx
  on public.engagement_lead (qwen_status, created_at)
  where qwen_status = 'pending';
