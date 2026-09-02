import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getInboxEvents } from '@swift2/core';
import { trustedClientIp } from '../../../../lib/longlive/client-ip';

// Notifications Phase 3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §8) —
// GET /api/notifications/inbox. Same SERVICE-ROLE-ONLY posture as every
// other notifications route: `events` ships RLS-locked to service_role, so
// this route is the only reader a client can reach. Deliberately has NO
// device-scoping — the inbox is a GLOBAL feed (spec §8: "chronological feed
// of everything notification-worthy regardless of push settings"), not
// filtered per-device, so there's no per-device rate-limit dimension to
// worry about beyond the standard per-IP guard every public route here uses.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function GET(req: Request): Promise<Response> {
  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429 });
  }

  const db = supabaseAdmin();
  if (!db) {
    console.warn('notifications/inbox: SUPABASE_SERVICE_ROLE_KEY not set; GET dropped');
    return NextResponse.json(
      { error: 'The inbox isn\u2019t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  try {
    const events = await getInboxEvents(db);
    return NextResponse.json({ events }, { status: 200 });
  } catch (err) {
    console.error('notifications/inbox: unexpected error', (err as Error).message);
    return NextResponse.json({ error: 'Something went wrong loading the inbox.' }, { status: 500 });
  }
}
