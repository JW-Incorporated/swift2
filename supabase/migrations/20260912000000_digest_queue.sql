-- Notifications Phase 3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §5/§9):
-- digest_queue. Router (packages/core/src/notification-router.ts) enqueues a
-- row here instead of sending instantly whenever a device's pref for a
-- category is 'daily'/'weekly', and also as the cap-overflow rollover path
-- when an instant-tier send is skipped for hitting the daily cap (spec §6
-- gate 4: "overflow rolls into the next digest"). The digest cron
-- (packages/core/src/notification-digest-dispatch.ts, called from the same
-- `/api/notifications/dispatch` route Phase 2 already wired to Vercel Cron
-- every 15 min) reads due rows, merges ALL of a device's queued events into
-- ONE push, and clears them.
--
-- AUTH POSTURE: same as every other notifications table — service_role
-- only. RLS enabled, no anon/authenticated policies.

create table if not exists public.digest_queue (
  device_id     uuid not null references public.devices(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade,
  -- The cadence this row was queued under ('daily' | 'weekly') — the digest
  -- dispatch groups by (device_id, scheduled_for) but keeps this so a mixed
  -- daily+weekly device's two separate digests never accidentally merge
  -- into one send (spec §5: Daily and Weekly are each their own digest).
  cadence       text not null check (cadence in ('daily', 'weekly')),
  category      text not null,
  scheduled_for timestamptz not null,
  created_at    timestamptz not null default now(),
  primary key (device_id, event_id)
);

-- The dispatch job's core query: "every due row, grouped by device" —
-- covering index for `scheduled_for <= now()` filtered/grouped by device.
create index if not exists digest_queue_scheduled_for_idx
  on public.digest_queue (scheduled_for);
create index if not exists digest_queue_device_scheduled_for_idx
  on public.digest_queue (device_id, scheduled_for);

alter table public.digest_queue enable row level security;
-- Deliberately no policies: service_role only (the router + digest dispatch
-- job), same posture as every other notifications table.
