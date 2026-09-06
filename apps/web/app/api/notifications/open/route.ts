import { NextResponse } from 'next/server';
import { markDeliveryOpened } from '@swift2/core/notifications-server';
import { trustedClientIp } from '../../../../lib/longlive/client-ip';
import { makeRateLimiter } from '../../../../lib/longlive/rate-limit';
import { supabaseAdmin } from '../../../../lib/supabase-server';

// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §11) —
// POST /api/notifications/open: "notification-open tracking writing
// deliveries.opened_at". Called from apps/web/public/sw.js's
// `notificationclick` handler with the opaque `deliveryToken` embedded in
// the push payload at send time (notification-sender.ts /
// notification-web-push.ts). Deliberately unauthenticated beyond the
// token itself — a delivery_token is a random UUID, unguessable, and
// scoped to exactly one delivery, so knowing it already proves you
// received that specific push. Same SERVICE-ROLE-ONLY posture as every
// other notifications route: `deliveries` has RLS enabled with no anon
// policies, so this route is the only writer.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Same best-effort per-instance rate limit shape as every other public
// POST route in this repo — a burst here is either a bug in the service
// worker or a single user tapping several notifications in a row, neither
// of which needs more than a generous window.
const limiter = makeRateLimiter({ windowMs: 60_000, max: 60 });

function rateLimited(ip: string): boolean {
  return limiter.isLimited(ip);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request): Promise<Response> {
  let payload: { deliveryToken?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const deliveryToken =
    typeof payload.deliveryToken === 'string' ? payload.deliveryToken.trim() : '';
  if (!deliveryToken || !UUID_RE.test(deliveryToken)) {
    return NextResponse.json({ error: 'deliveryToken must be a UUID.' }, { status: 400 });
  }

  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429 });
  }

  const db = supabaseAdmin();
  if (!db) {
    console.warn('notifications/open: SUPABASE_SERVICE_ROLE_KEY not set; open-tracking dropped');
    // 200, not 503: a missing service-role key must never surface as a
    // visible failure to the client (this call runs from inside a service
    // worker's notificationclick handler with no UI to show an error in;
    // the notification-open UX is "always succeeds," the tracking is
    // best-effort infrastructure behind it).
    return NextResponse.json({ ok: true, tracked: false }, { status: 200 });
  }

  try {
    const result = await markDeliveryOpened(db, deliveryToken);
    if (!result.ok) {
      if (result.error === 'not_found') {
        // A stale/unknown token (old delivery pruned, or a malformed
        // payload) — not a client error worth a 4xx, just nothing to mark.
        return NextResponse.json({ ok: true, tracked: false }, { status: 200 });
      }
      console.error('notifications/open: db error', result.message);
      return NextResponse.json({ ok: true, tracked: false }, { status: 200 });
    }
    return NextResponse.json({ ok: true, tracked: !result.alreadyOpened }, { status: 200 });
  } catch (err) {
    console.error('notifications/open: unexpected error', (err as Error).message);
    return NextResponse.json({ ok: true, tracked: false }, { status: 200 });
  }
}
