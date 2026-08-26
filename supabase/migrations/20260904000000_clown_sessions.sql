-- Clownbot sessions, memory, predictions, pins (PLAN.md Stage 11, proposal
-- §3.6/§7). `usage_daily` (20260902000000_usage_daily.sql) is reused with a
-- new per-user scope (`clown-chat:<user_id>`) rather than a new table — the
-- exact duplicate-table mistake already made once tonight between Stage 3
-- and Stage 6 must not repeat here.
--
-- AUTH POSTURE: every table here is written by the web app itself (not the
-- worker), scoped to a Supabase anonymous-auth session — the first migration
-- in this project to reference `auth.users`. RLS: the `authenticated` role
-- (which anonymous-auth sessions hold) may only read/write its OWN rows via
-- `auth.uid() = user_id`; `service_role` bypasses RLS by role attribute (no
-- explicit policy needed) for a future admin/resolution job. There is no
-- public-read policy anywhere in this file — unlike current_item/live_theory,
-- none of this is meant to be visible to anyone but the row's own owner.
--
-- Retention (docs/decisions.md 2026-08-23 item 6): clown_conversation /
-- clown_turn carry a 180-day `expires_at`, enforced today at the RLS read
-- layer (same pattern as current_item/fan_signal/live_theory); an active
-- purge job is a follow-up, not required for this stage to ship complete.
-- No IP address is stored anywhere in this file.
--
-- LIVE STATE: "Allow anonymous sign-ins" is not yet toggled on in the
-- Supabase dashboard (HUMAN-ACTIONS.md #15 item 2) — every write path this
-- schema supports fails closed (no session resolves) until that toggle
-- flips. This migration is schema-only; it does not depend on the toggle.

create table if not exists public.clown_conversation (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  summary         text not null default '',                  -- rolling fold of turns evicted past KEEP_RECENT_TURNS
  last_active_at  timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '180 days'
);
create index if not exists clown_conversation_user_recent_idx
  on public.clown_conversation (user_id, last_active_at desc);

create table if not exists public.clown_turn (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.clown_conversation (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,  -- denormalized so RLS never needs a join
  role             text not null check (role in ('user','assistant')),
  text             text not null check (char_length(text) <= 4000),
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default now() + interval '180 days'
);
create index if not exists clown_turn_conversation_created_idx
  on public.clown_turn (conversation_id, created_at asc);

-- bot_prediction: scoreboard rows. Resolution (setting status away from
-- 'pending') is Stage 8/promotion's job (proposal §6), not this stage's —
-- this table only needs enough structure for that future pass to act on:
-- the claim, symbols, and a status defaulting to pending.
create table if not exists public.bot_prediction (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references public.clown_conversation (id) on delete set null,
  user_id          uuid references auth.users (id) on delete set null,
  question         text not null check (char_length(question) <= 600),
  claim            text not null check (char_length(claim) <= 600),      -- the falsifiable position (ClownTake.stance)
  theory_name      text,
  symbols          text[] not null default '{}',
  cited_ids        text[] not null default '{}',
  delulu           int not null check (delulu between 0 and 5),
  status           text not null default 'pending' check (status in
                     ('confirmed','partially_confirmed','pending','debunked','abandoned','unfalsifiable')),  -- TheoryOutcome union
  resolution       jsonb,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz
);
create index if not exists bot_prediction_user_created_idx
  on public.bot_prediction (user_id, created_at desc);

create table if not exists public.clown_pinned_theory (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  live_theory_id uuid not null references public.live_theory (id) on delete cascade,
  pinned_at      timestamptz not null default now(),
  unique (user_id, live_theory_id)
);

alter table public.clown_conversation   enable row level security;
alter table public.clown_turn           enable row level security;
alter table public.bot_prediction       enable row level security;
alter table public.clown_pinned_theory  enable row level security;

drop policy if exists "clown_conversation own read"   on public.clown_conversation;
drop policy if exists "clown_conversation own insert" on public.clown_conversation;
drop policy if exists "clown_conversation own update" on public.clown_conversation;
create policy "clown_conversation own read" on public.clown_conversation
  for select using (auth.uid() = user_id and (expires_at is null or expires_at > now()));
create policy "clown_conversation own insert" on public.clown_conversation
  for insert with check (auth.uid() = user_id);
create policy "clown_conversation own update" on public.clown_conversation
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "clown_turn own read"   on public.clown_turn;
drop policy if exists "clown_turn own insert" on public.clown_turn;
drop policy if exists "clown_turn own delete" on public.clown_turn;
create policy "clown_turn own read" on public.clown_turn
  for select using (auth.uid() = user_id and (expires_at is null or expires_at > now()));
create policy "clown_turn own insert" on public.clown_turn
  for insert with check (auth.uid() = user_id);
create policy "clown_turn own delete" on public.clown_turn
  for delete using (auth.uid() = user_id);  -- rolling-summary fold deletes evicted turns

-- bot_prediction: the web app only ever inserts/reads its own rows; it never
-- resolves one (no update/delete policy for `authenticated` on purpose —
-- resolution is a service-role job per Stage 8).
drop policy if exists "bot_prediction own read"   on public.bot_prediction;
drop policy if exists "bot_prediction own insert" on public.bot_prediction;
create policy "bot_prediction own read" on public.bot_prediction
  for select using (auth.uid() = user_id);
create policy "bot_prediction own insert" on public.bot_prediction
  for insert with check (auth.uid() = user_id);

drop policy if exists "clown_pinned_theory own read"   on public.clown_pinned_theory;
drop policy if exists "clown_pinned_theory own insert" on public.clown_pinned_theory;
drop policy if exists "clown_pinned_theory own delete" on public.clown_pinned_theory;
create policy "clown_pinned_theory own read" on public.clown_pinned_theory
  for select using (auth.uid() = user_id);
create policy "clown_pinned_theory own insert" on public.clown_pinned_theory
  for insert with check (auth.uid() = user_id);
create policy "clown_pinned_theory own delete" on public.clown_pinned_theory
  for delete using (auth.uid() = user_id);
