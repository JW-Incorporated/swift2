-- Community Engine Phase 1 card P1-5 (docs/proposals/2026-09-06-community-engine-plan.md
-- §2.6, §9): the HMAC ack route (`/api/community/ack`, apps/web) needs (1) a
-- founder-facing "skip" outcome that P0-1's `engagement_lead.status` check
-- constraint doesn't yet allow, and (2) somewhere durable to keep the
-- `redditNonPromo` etiquette counter the plan's §6.5 link gate reads
-- (`link_included` may only be true when this is >= 20).
--
-- §5's schema only defined skip statuses the *Answerer desk* sets before a
-- draft ever reaches a human (`skipped_redline`, `skipped_low_relevance`).
-- The ack route's "Skip" email link is a distinct, later outcome — a human
-- who saw the finished draft chose not to post it — so it gets its own
-- status rather than overloading either desk-time value.

alter table public.engagement_lead drop constraint if exists engagement_lead_status_check;
alter table public.engagement_lead add constraint engagement_lead_status_check
  check (status in ('new', 'drafted', 'emailed', 'posted',
    'skipped_redline', 'skipped_low_relevance', 'skipped_by_founder'));

-- `redditNonPromo` counter (plan §2.6/§6.5, mirrored today in
-- `social/calendar.md`'s Ledger table as "Reddit non-promo contributions").
-- Prefer the DB per P1-5's card decision: this is a service-role-only value
-- multiple future workflows read (community-scan's etiquette gate, the
-- Answerer desk's link_included=true rule) and increment (this ack route),
-- and a markdown table is not a safe concurrent-write target from a
-- serverless route. `social/calendar.md` remains the human-readable mirror;
-- keeping it in sync is a docs-only follow-up (Tree's weekly run already
-- rewrites that file), not this route's job. Generic (scope, value) shape
-- so a second named counter never needs its own migration.
create table if not exists public.community_counters (
  id          text primary key,
  value       integer not null default 0,
  updated_at  timestamptz not null default now()
);

create or replace function public.increment_community_counter(p_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_value integer;
begin
  insert into public.community_counters (id, value, updated_at)
  values (p_id, 1, now())
  on conflict (id) do update
    set value = community_counters.value + 1, updated_at = now()
  returning value into new_value;
  return new_value;
end;
$$;

-- Seed at the value `social/calendar.md`'s ledger currently records
-- (2026-09-06 run: "Reddit non-promo contributions | 0 / 20").
insert into public.community_counters (id, value)
values ('reddit_non_promo', 0)
on conflict (id) do nothing;

-- Same posture as every other Community Engine table (§5's RLS note):
-- service-role only, no anon/authenticated policy.
alter table public.community_counters enable row level security;
