-- Notifications Phase 1 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §8/§9):
-- per-category cadence preferences. Device-level settings (master_enabled,
-- snooze_until, daily_cap, quiet_start, quiet_end, digest_hour) already
-- shipped on `devices` in Phase 0 (20260909000000_notifications_devices.sql)
-- — this migration ONLY adds the category-cadence table, per Phase 1's
-- actual scope ("notification_prefs migration plus device-level settings
-- columns" — the columns are already there, so there's nothing left to add
-- to `devices` itself).
--
-- AUTH POSTURE: same as `devices` — service_role only. The prefs API
-- (`GET/PUT /api/devices/:id/prefs`) is the sole reader/writer, using the
-- service-role key server-side. RLS enabled, no anon/authenticated
-- policies, matching the `devices` table's posture exactly.

create table if not exists public.notification_prefs (
  device_id  uuid not null references public.devices(id) on delete cascade,
  category   text not null,
  cadence    text not null check (cadence in ('instant','daily','weekly','monthly','on','off')),
  updated_at timestamptz not null default now(),
  primary key (device_id, category)
);

-- Batch reads (the whole settings screen fetches every category for a
-- device in one call) go through the primary key's device_id prefix, so no
-- extra index is needed beyond the PK.

alter table public.notification_prefs enable row level security;
-- Deliberately no policies: anon/authenticated get zero access once RLS is
-- enabled; only service_role (used exclusively by the prefs API route)
-- reads or writes. Same posture `devices` documents for its own migration.
