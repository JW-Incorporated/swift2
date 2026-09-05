import { NextResponse } from 'next/server';
import { loadMetrics } from '@swift2/core/notifications-server';
import { supabaseAdmin } from '../../../../lib/supabase-server';

// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §11) —
// GET /api/notifications/metrics: the data source behind the internal
// dashboard page (apps/web/app/internal/notifications/page.tsx). Read-only,
// SERVICE-ROLE posture (same as every other notifications route — reads
// `devices`/`deliveries`/`notification_prefs`, none of which have anon
// policies). Secret-gated via a query param rather than a header because
// the dashboard is meant to be an OPENABLE LINK a founder pastes into a
// browser, not a curl target — same tradeoff as any "shareable admin link"
// pattern, mitigated by requiring a long random secret (see
// SETUP_NOTIFICATIONS.md) and never indexing/linking this route publicly.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function authorizedForDashboard(providedSecret: string | null): boolean {
  const expected = process.env.NOTIFICATIONS_DASHBOARD_SECRET;
  // Unset secret = route disabled (fails closed), matching every other
  // unconfigured-env route in this repo.
  if (!expected) return false;
  if (!providedSecret) return false;
  return providedSecret === expected;
}

export async function GET(req: Request): Promise<Response> {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!authorizedForDashboard(secret)) {
    const configured = Boolean(process.env.NOTIFICATIONS_DASHBOARD_SECRET);
    return NextResponse.json(
      {
        error: configured
          ? 'Unauthorized.'
          : 'The notifications dashboard isn\u2019t configured in this environment yet.',
      },
      { status: configured ? 401 : 503 },
    );
  }

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json(
      { error: 'Notifications metrics aren\u2019t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  try {
    const metrics = await loadMetrics(db);
    return NextResponse.json(metrics, { status: 200 });
  } catch (err) {
    console.error('notifications/metrics: unexpected error', (err as Error).message);
    return NextResponse.json({ error: 'Failed to load metrics.' }, { status: 500 });
  }
}
