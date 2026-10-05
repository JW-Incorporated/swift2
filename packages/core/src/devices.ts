// Notifications Phase 0 — device registry data access (NOTIFICATIONS_SPEC.md
// §9, NOTIFICATIONS_PLAN.md Phase 0). Server-only: every caller here is
// `POST /api/devices/register`, running with the Supabase SERVICE ROLE key
// (see that route's header) — never a client-held anon key, because the
// `devices` migration enables RLS with no `anon`/`authenticated` policies at
// all (service_role bypasses RLS by role attribute). This module takes a
// `SupabaseClient` directly, same convention as `knowledge/client.ts`, so
// it's unit-testable against a fake client without constructing a real one.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeviceRegistrationInput } from '@swift2/shared';

export interface DeviceRow {
  id: string;
  user_id: string | null;
  platform: string;
  push_token: string | null;
  tz: string;
  locale: string | null;
  app_version: string | null;
  master_enabled: boolean;
  snooze_until: string | null;
  daily_cap: number;
  quiet_start: number;
  quiet_end: number;
  digest_hour: number;
  created_at: string;
  last_seen_at: string;
}

/**
 * Upsert-by-`id` (the client-generated `device_id`) — this is BOTH first
 * registration and token refresh (Phase 0 acceptance: "token refresh
 * re-upserts correctly"), the same row either way. `last_seen_at` always
 * bumps to now() on conflict so a device's freshness is accurate even when
 * only its token/tz/locale changed. Preference/governor columns
 * (`master_enabled`, `quiet_start`, etc.) are NOT touched on conflict —
 * they default once at insert and are owned by Phase 1's prefs API from
 * then on; a token-refresh call must never silently reset a user's
 * settings back to defaults.
 *
 * Ordering (#5039): a write carrying `seq` lower than the stored `register_seq` is stale and ignored
 * atomically in the `upsert_device_ordered` function; the current row is returned (idempotent, no error).
 * Writes without `seq` (old app builds) stay unconditional.
 */
export async function upsertDevice(
  db: SupabaseClient,
  input: DeviceRegistrationInput,
): Promise<DeviceRow> {
  const { data, error } = await db
    .rpc('upsert_device_ordered', {
      p_id: input.deviceId,
      p_platform: input.platform,
      p_push_token: input.pushToken ?? null,
      p_tz: input.tz ?? 'America/Los_Angeles',
      p_locale: input.locale ?? null,
      p_app_version: input.appVersion ?? null,
      p_seq: input.seq ?? null,
    })
    .single();

  if (error) throw new Error(`upsertDevice: ${error.message}`);
  return data as DeviceRow;
}
