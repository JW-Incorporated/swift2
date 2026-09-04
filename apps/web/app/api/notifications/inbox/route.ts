import { NextResponse } from 'next/server';
import { getInboxEvents } from '@swift2/core';
import { trustedClientIp } from '../../../../lib/longlive/client-ip';
import { makeRateLimiter } from '../../../../lib/longlive/rate-limit';
import { supabaseAdmin } from '../../../../lib/supabase-server';

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

const limiter = makeRateLimiter({ windowMs: 60_000, max: 30 });

function rateLimited(ip: string): boolean {
  return limiter.isLimited(ip);
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
