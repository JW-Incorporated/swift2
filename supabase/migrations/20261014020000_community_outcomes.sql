-- Engagement inputs and hand-posted comment outcomes for the community lane
-- (automation overhaul P1-14). These tables remain service-role only.

alter table public.engagement_lead
  add column if not exists score integer,
  add column if not exists num_comments integer,
  add column if not exists reactions integer,
  add column if not exists thread_created_at timestamptz,
  add column if not exists velocity double precision,
  add column if not exists rank_score double precision,
  add column if not exists last_scored_at timestamptz;

alter table public.community_post_ledger
  add column if not exists comment_url text;

create table if not exists public.community_outcome (
  post_ledger_id  uuid not null,
  platform        text not null,
  comment_url     text,
  comment_id      text,
  score           integer,
  replies         integer,
  horizon         text not null,
  checked_at      timestamptz not null default now()
);

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'community_outcome_post_ledger_id_fkey'
      and conrelid = 'public.community_outcome'::regclass
  ) then
    alter table public.community_outcome
      add constraint community_outcome_post_ledger_id_fkey
      foreign key (post_ledger_id)
      references public.community_post_ledger (id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'community_outcome_platform_check'
      and conrelid = 'public.community_outcome'::regclass
  ) then
    alter table public.community_outcome
      add constraint community_outcome_platform_check
      check (platform in ('reddit', 'facebook'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'community_outcome_horizon_check'
      and conrelid = 'public.community_outcome'::regclass
  ) then
    alter table public.community_outcome
      add constraint community_outcome_horizon_check
      check (horizon in ('1h', '24h', '7d'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'community_outcome_post_horizon_key'
      and conrelid = 'public.community_outcome'::regclass
  ) then
    alter table public.community_outcome
      add constraint community_outcome_post_horizon_key
      unique (post_ledger_id, horizon);
  end if;
end
$migration$;

alter table public.community_outcome enable row level security;

revoke all on table public.community_outcome from public, anon, authenticated;
grant all on table public.community_outcome to service_role;

-- Deliberately no policies: the community lane reads and writes outcomes
-- through service-role jobs, matching the existing community tables.
