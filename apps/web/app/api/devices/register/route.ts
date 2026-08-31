import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { upsertDevice } from '@swift2/core';
import {
  DEVICE_PLATFORMS,
  isDevicePlatform,
  type DeviceRegistrationInput,
} from '@swift2/shared';

// Notifications Phase 0 — POST /api/devices/register (NOTIFICATIONS_PLAN.md
// Phase 0, NOTIFICATIONS_SPEC.md §2/§9). Upserts a `devices` row keyed by the
// client-generated `device_id`; the SAME call handles first registration and
// later token refresh (Phase 0 acceptance criterion), because it's an
// upsert-by-id either way — see packages/core/src/devices.ts.
//
// SERVICE ROLE, ON PURPOSE: `devices` ships with RLS enabled and NO policies
// for `anon`/`authenticated` (migration 20260909000000_notifications_devices
// .sql) — a client holding only the public anon key cannot read or write a
// device row at all. This route is therefore the ONLY writer, authenticating
// with `SUPABASE_SERVICE_ROLE_KEY` server-side. That key is never exposed to
// any client bundle: it's read from `process.env` inside this Node runtime
// route only, the same posture `apps/worker`'s `.env.example` documents for
// its own service-role usage, and it must never be prefixed
// `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*` — doing so would ship it into the browser
// bundle. See SETUP_NOTIFICATIONS.md for exactly where this value comes from.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FIELD = 200;

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const clip = (s: unknown, n: number): string | undefined =>
  typeof s === 'string' && s.trim() ? s.trim().slice(0, n) : undefined;

// Best-effort per-instance rate limit — same shape/posture as every other
// public POST route in this repo (feedback/intake/submit-link/mood): blunts
// accidental bursts, not a security guarantee behind a spoofable XFF header.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20; // higher than the content-submission routes: a
// real device legitimately re-registers on every cold start / token refresh.

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

interface RegisterPayload {
  deviceId?: string;
  platform?: string;
  pushToken?: string | null;
  tz?: string | null;
  locale?: string | null;
  appVersion?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateRegistration(
  payload: RegisterPayload,
): { ok: true; input: DeviceRegistrationInput } | { ok: false; error: string } {
  const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId.trim() : '';
  if (!deviceId || !UUID_RE.test(deviceId)) {
    return { ok: false, error: 'deviceId must be a UUID.' };
  }
  const platform = typeof payload.platform === 'string' ? payload.platform.trim() : '';
  if (!platform || !isDevicePlatform(platform)) {
    return { ok: false, error: `platform must be one of: ${DEVICE_PLATFORMS.join(', ')}.` };
  }
  return {
    ok: true,
    input: {
      deviceId,
      platform,
      pushToken: clip(payload.pushToken, 4096) ?? null,
      tz: clip(payload.tz, MAX_FIELD) ?? null,
      locale: clip(payload.locale, 40) ?? null,
      appVersion: clip(payload.appVersion, 40) ?? null,
    },
  };
}

export async function POST(req: Request): Promise<Response> {
  let payload: RegisterPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const validated = validateRegistration(payload);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ip =
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429 });
  }

  const db = supabaseAdmin();
  if (!db) {
    // Not wired up yet (local/preview without the service-role secret) —
    // degrade the same way every other unconfigured route in this repo does
    // rather than 500ing. See SETUP_NOTIFICATIONS.md.
    console.warn('devices/register: SUPABASE_SERVICE_ROLE_KEY not set; registration dropped');
    return NextResponse.json(
      { error: 'Device registration isn’t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  try {
    const device = await upsertDevice(db, validated.input);
    return NextResponse.json(
      {
        ok: true,
        device: {
          id: device.id,
          platform: device.platform,
          tz: device.tz,
          lastSeenAt: device.last_seen_at,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('devices/register: unexpected error', (err as Error).message);
    return NextResponse.json({ error: 'Something went wrong registering the device.' }, { status: 500 });
  }
}
