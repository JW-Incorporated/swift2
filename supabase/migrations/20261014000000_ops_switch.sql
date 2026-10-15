-- Runtime operational brakes read by service-role server paths. No public
-- policies: switches that can halt outbound actions are privileged state.
create table if not exists public.ops_switches (
  name       text primary key,
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.ops_switches (name, enabled)
values ('PUSH_FREEZE', false)
on conflict (name) do nothing;

alter table public.ops_switches enable row level security;
-- Deliberately no anon/authenticated policies; service_role only.
