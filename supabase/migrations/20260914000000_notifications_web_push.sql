-- Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §3/§10,
-- §11) — web push open-tracking correlation + metrics support.
--
-- Web Push devices need NO new device-identity schema: `devices.platform`
-- already accepts 'web' (spec §9's original check constraint), and
-- `devices.push_token` already accepts an arbitrary string — a web device's
-- "token" is its serialized PushSubscription (endpoint + p256dh/auth keys)
-- as a JSON string, so `POST /api/devices/register` and `upsertDevice()`
-- (Phase 0) need ZERO code changes to accept a web registration. This is
-- the literal meaning of this phase's scope line: "registering
-- platform='web' devices through the existing pipeline unchanged."
--
-- What DOES need a new column: `deliveries.delivery_token`. The open-
-- tracking callback (`POST /api/notifications/open`) needs a way to name
-- "this specific delivery" from client-side JS running inside the service
-- worker's notificationclick handler — but the `deliveries` row for a send
-- doesn't exist yet at the moment the push payload is built (deliveries
-- are logged AFTER a successful send, same as every prior phase). A
-- pre-generated opaque `delivery_token` (crypto.randomUUID(), never
-- guessable, never PII) is embedded in the push payload's `data` field at
-- send time and stored on the `deliveries` row at insert time — the open
-- callback looks up by token instead of by not-yet-known id.
alter table public.deliveries
  add column if not exists delivery_token uuid not null default gen_random_uuid();

-- Every existing row got a default token via the ALTER above (backfill is
-- automatic — `default gen_random_uuid()` runs per-row on ALTER for
-- existing rows too on Postgres 13+). Uniqueness is what makes the open
-- callback's lookup safe: a token can only ever resolve to exactly one
-- delivery.
create unique index if not exists deliveries_delivery_token_idx
  on public.deliveries (delivery_token);

-- Read pattern for the metrics dashboard (spec §11 / this phase's scope):
-- "mute-within-1h rate" joins deliveries.sent_at against
-- notification_prefs.updated_at for the SAME (device_id, category) pair —
-- this index makes that join's prefs-side lookup cheap. The deliveries
-- side already has deliveries_device_category_sent_at_idx from Phase 2.
create index if not exists notification_prefs_device_category_updated_at_idx
  on public.notification_prefs (device_id, category, updated_at);
