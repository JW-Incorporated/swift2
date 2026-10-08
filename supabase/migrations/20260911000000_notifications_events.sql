-- Notifications Phase 2 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §9):
-- events + deliveries. `events` is written by scraper/automation pipelines
-- via packages/core/src/events.ts's `insertEvent()` — the single producer
-- seam every pipeline call goes through (dedupe_key kills duplicate
-- detections at the DB layer via the unique constraint below).
-- `deliveries` is written by the router/governor (packages/core/src/
-- notification-router.ts) — one row per push actually sent, which is what
-- the governor's daily-cap gate counts against.
--
-- AUTH POSTURE: same as `devices`/`notification_prefs` — service_role only.
-- Producers (GitHub Actions workflows, the worker's write-knowledge.ts) call
-- insertEvent() with the service-role key; the router/dispatch API route
-- (Phase 2 scope) reads/writes both tables with the same key. RLS enabled,
-- no anon/authenticated policies.

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  tier        smallint not null,
  title       text not null,
  body        text not null,
  deep_link   text not null,
  dedupe_key  text unique,                 -- kills duplicate detections from the scraper pipeline
  -- T1 safety (spec §12 Q2, founder decision recorded on the Phase 2 kanban
  -- task): song_drop/album_news/tour_news get a 5-minute send delay so a
  -- false positive can be killed (scripts/notifications-kill-t1.mjs) before
  -- it reaches a single device. Non-T1 categories get available_at = now()
  -- (no delay). The router never sends an event before its available_at.
  available_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,                  -- stale events never send
  -- Kill switch (T1 alert hook): set true to withdraw a pending event before
  -- its available_at — the router skips killed events unconditionally, at
  -- any tier. Distinct from expires_at (a normal staleness window every
  -- event has) so a kill is visibly intentional in the audit trail.
  killed_at   timestamptz
);

create index if not exists events_category_idx on public.events (category);
create index if not exists events_available_at_idx on public.events (available_at);

alter table public.events enable row level security;
-- Deliberately no policies: service_role only, same posture as every other
-- notifications table.

create table if not exists public.deliveries (
  id          bigint generated always as identity primary key,
  device_id   uuid not null references public.devices(id) on delete cascade,
  event_id    uuid references public.events(id) on delete set null,
  kind        text not null check (kind in ('instant','digest','fun')),
  category    text,
  sent_at     timestamptz not null default now(),
  opened_at   timestamptz
);

-- Daily-cap gate (spec §6 gate 4) counts a device's instant deliveries for
-- "today" in the device's own local timezone — this index makes that lookup
-- cheap (packages/core/src/notification-governor.ts's countInstantToday).
create index if not exists deliveries_device_sent_at_idx
  on public.deliveries (device_id, sent_at);
-- 30-min coalescing (gate 3) needs "same device, same category, recent
-- deliveries" — covering index for that lookup.
create index if not exists deliveries_device_category_sent_at_idx
  on public.deliveries (device_id, category, sent_at);

alter table public.deliveries enable row level security;
-- Deliberately no policies: service_role only (the router/dispatch route),
-- same posture as every other notifications table.
