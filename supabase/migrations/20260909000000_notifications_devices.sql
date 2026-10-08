-- Notifications Phase 0 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §9):
-- the device registry. Anonymous-first identity model — `id` is the
-- client-generated `device_id` (UUID persisted in Keychain / Expo
-- SecureStore / EncryptedSharedPreferences), never a login.
--
-- AUTH POSTURE: this table is written ONLY by the server-side
-- `POST /api/devices/register` route using the Supabase service-role key
-- (never a client-supplied key — the register route is the sole writer,
-- same posture `clown_sessions`' header describes for its own
-- service-role-only tables). RLS is enabled with NO policies for
-- `anon`/`authenticated`, so a client holding only the public anon key can
-- never read or write a device row directly; `service_role` bypasses RLS by
-- role attribute, which is what the register route's key holds.
--
-- Later phases add `notification_prefs` (Phase 1), `events`/`deliveries`
-- (Phase 2), `digest_queue` (Phase 3) — not created here, Phase 0 scope only.

create table if not exists public.devices (
  id             uuid primary key,                 -- client-generated device_id
  user_id        uuid null,                         -- future accounts; null for anonymous (spec §2)
  platform       text not null check (platform in ('ios','android','web')),
  push_token     text,
  tz             text not null default 'America/Los_Angeles',
  locale         text,
  app_version    text,
  master_enabled boolean not null default true,
  snooze_until   timestamptz,
  daily_cap      smallint not null default 3,
  quiet_start    smallint not null default 22,       -- local hour
  quiet_end      smallint not null default 8,
  digest_hour    smallint not null default 9,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);

-- Token refresh / re-registration re-upserts by id (Phase 0 acceptance
-- criteria) — no separate index needed beyond the primary key for that path.
-- A device looking itself up by push token (e.g. FCM UNREGISTERED pruning,
-- Phase 2) benefits from an index since push_token has no uniqueness
-- constraint of its own (a stale token can briefly outlive a reinstall).
create index if not exists devices_push_token_idx
  on public.devices (push_token)
  where push_token is not null;

alter table public.devices enable row level security;
-- Deliberately no policies: anon/authenticated get zero access by default
-- once RLS is enabled; only service_role (used exclusively by
-- /api/devices/register) can read or write. Revisit when Phase 1 adds a
-- device-scoped prefs read/write API that needs its own auth story.
