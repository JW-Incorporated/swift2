-- P1-21: durable dedupe for the theory miner. A bundle changes only when a
-- thread crosses a ten-comment bucket, so repeated reader runs do not repay
-- for unchanged text. Service-role only: these are pipeline internals.
create table if not exists public.theory_mined_bundle (
  bundle_key       text primary key check (bundle_key like 'bundle:%'),
  thread_id        text not null,
  comment_bucket   integer not null check (comment_bucket >= 0),
  outcome          text not null check (outcome in ('jev_negative', 'mined')),
  theories_found   integer not null default 0 check (theories_found >= 0),
  mined_at         timestamptz not null default now()
);

alter table public.theory_mined_bundle enable row level security;
revoke all on table public.theory_mined_bundle from public, anon, authenticated;
grant all on table public.theory_mined_bundle to service_role;
