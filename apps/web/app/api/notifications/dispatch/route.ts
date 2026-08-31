import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchPendingEvents } from '@swift2/core/notifications-server';

// Notifications Phase 2 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §10) —
// the router's HTTP entry point. Runs `dispatchPendingEvents()` (fan-out +
// governor + FCM send + delivery logging) against every pending, non-killed,
// non-expired event whose `available_at` has arrived. Triggered every 15
// minutes by Vercel Cron (apps/web/vercel.json's `crons` entry — the
// Supabase Edge Function + pg_cron path spec §10 describes is the eventual
// production home; this route is the deployable-today equivalent given the
// same Vercel stack every other API route in this repo already uses, same
// reasoning as Phase 0/1's routes).
//
// GET, not POST: Vercel Cron only ever issues a GET request to the
// configured path, and automatically attaches `Authorization: Bearer
// $CRON_SECRET` when a project env var literally named `CRON_SECRET` is
// set — see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
// `authorized()` below checks that exact header/env pair.
//
// SERVICE ROLE, same posture as every other notifications route — this is
// the only writer to `deliveries` and the only reader of cross-device
// `events`/`devices`/`notification_prefs` state, so it must never be a
// client-callable route with just the anon key.
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

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  // Unset secret = route disabled (fails closed), matching every other
  // unconfigured-env route in this repo (503, not "trust the request").
  if (!expected) return false;
  const header = req.headers.get('authorization');
  return header === `Bearer ${expected}`;
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) {
    const configured = Boolean(process.env.CRON_SECRET);
    console.warn(
      configured
        ? 'notifications/dispatch: unauthorized request rejected'
        : 'notifications/dispatch: CRON_SECRET not set; dispatch disabled',
    );
    return NextResponse.json(
      {
        error: configured
          ? 'Unauthorized.'
          : 'Dispatch isn\u2019t wired up in this environment yet.',
      },
      { status: configured ? 401 : 503 },
    );
  }

  const db = supabaseAdmin();
  if (!db) {
    console.warn('notifications/dispatch: SUPABASE_SERVICE_ROLE_KEY not set; dispatch dropped');
    return NextResponse.json(
      { error: 'Notifications dispatch isn\u2019t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  try {
    const result = await dispatchPendingEvents(db);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('notifications/dispatch: unexpected error', (err as Error).message);
    return NextResponse.json({ error: 'Dispatch failed unexpectedly.' }, { status: 500 });
  }
}
