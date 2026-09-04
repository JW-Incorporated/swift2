import { NextResponse } from 'next/server';
import { getDevicePrefs, updateDevicePrefs } from '@swift2/core';
import {
  isAnyNotificationCategory,
  isValidCadenceForCategory,
  type DeviceNotificationSettings,
  type DevicePrefsUpdateInput,
  type NotificationPref,
} from '@swift2/shared';
import { trustedClientIp } from '../../../../../lib/longlive/client-ip';
import { supabaseAdmin } from '../../../../../lib/supabase-server';

// Notifications Phase 1 — GET/PUT /api/devices/:id/prefs (NOTIFICATIONS_PLAN.md
// Phase 1, NOTIFICATIONS_SPEC.md §8/§9). Batch read/write over the device's
// settings columns (`devices`, Phase 0) + its per-category cadences
// (`notification_prefs`, this phase's migration). Same SERVICE-ROLE-ONLY
// posture as `POST /api/devices/register` — both tables ship RLS enabled
// with no anon/authenticated policies, so this route is the sole reader AND
// writer, never a client-held key. See that route's header for the full
// rationale; not repeated here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Same best-effort per-instance rate limit shape as devices/register — a
// settings screen legitimately fires several PUTs in quick succession
// (instant-apply, one call per pill tap), so the window is generous.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const SETTINGS_NUMERIC_FIELDS: Array<keyof DeviceNotificationSettings> = [
  'dailyCap',
  'quietStart',
  'quietEnd',
  'digestHour',
];

/**
 * Validates a PUT body. Every field is optional (spec §8: instant-apply, no
 * save button — a single pill tap sends one prefs entry, the master switch
 * sends one settings field). Rejects the whole request on any malformed
 * field rather than silently dropping it — a settings screen bug should
 * fail loudly, not write a corrupted subset.
 */
export function validatePrefsUpdate(
  body: unknown,
): { ok: true; input: DevicePrefsUpdateInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be an object.' };
  }
  const payload = body as Record<string, unknown>;
  const result: DevicePrefsUpdateInput = {};

  if (payload.settings !== undefined) {
    if (typeof payload.settings !== 'object' || payload.settings === null) {
      return { ok: false, error: 'settings must be an object.' };
    }
    const s = payload.settings as Record<string, unknown>;
    const settings: Partial<DeviceNotificationSettings> = {};

    if (s.masterEnabled !== undefined) {
      if (typeof s.masterEnabled !== 'boolean') {
        return { ok: false, error: 'settings.masterEnabled must be a boolean.' };
      }
      settings.masterEnabled = s.masterEnabled;
    }
    if (s.snoozeUntil !== undefined) {
      if (s.snoozeUntil !== null && typeof s.snoozeUntil !== 'string') {
        return { ok: false, error: 'settings.snoozeUntil must be a string or null.' };
      }
      settings.snoozeUntil = s.snoozeUntil;
    }
    for (const field of SETTINGS_NUMERIC_FIELDS) {
      if (s[field] === undefined) continue;
      const value = s[field];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { ok: false, error: `settings.${field} must be a number.` };
      }
      (settings as Record<string, number>)[field] = value;
    }
    result.settings = settings;
  }

  if (payload.prefs !== undefined) {
    if (!Array.isArray(payload.prefs)) {
      return { ok: false, error: 'prefs must be an array.' };
    }
    const prefs: NotificationPref[] = [];
    for (const entry of payload.prefs) {
      if (typeof entry !== 'object' || entry === null) {
        return { ok: false, error: 'Each prefs entry must be an object.' };
      }
      const { category, cadence } = entry as Record<string, unknown>;
      if (typeof category !== 'string' || !isAnyNotificationCategory(category)) {
        return { ok: false, error: `Unknown category: ${String(category)}.` };
      }
      if (typeof cadence !== 'string' || !isValidCadenceForCategory(category, cadence)) {
        return {
          ok: false,
          error: `Cadence "${String(cadence)}" is not valid for category "${category}".`,
        };
      }
      prefs.push({ category, cadence });
    }
    result.prefs = prefs;
  }

  return { ok: true, input: result };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'deviceId must be a UUID.' }, { status: 400 });
  }

  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429 });
  }

  const db = supabaseAdmin();
  if (!db) {
    console.warn('devices/[id]/prefs: SUPABASE_SERVICE_ROLE_KEY not set; GET dropped');
    return NextResponse.json(
      { error: 'Notification preferences aren\u2019t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  try {
    const result = await getDevicePrefs(db, id);
    if (!result) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('devices/[id]/prefs GET: unexpected error', (err as Error).message);
    return NextResponse.json(
      { error: 'Something went wrong loading preferences.' },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'deviceId must be a UUID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const validated = validatePrefsUpdate(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429 });
  }

  const db = supabaseAdmin();
  if (!db) {
    console.warn('devices/[id]/prefs: SUPABASE_SERVICE_ROLE_KEY not set; PUT dropped');
    return NextResponse.json(
      { error: 'Notification preferences aren\u2019t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  try {
    const result = await updateDevicePrefs(db, id, validated.input);
    if (!result) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('devices/[id]/prefs PUT: unexpected error', (err as Error).message);
    return NextResponse.json(
      { error: 'Something went wrong saving preferences.' },
      { status: 500 },
    );
  }
}
