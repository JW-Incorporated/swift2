import { NextResponse } from 'next/server';
import { ackPosted, ackSkipped, verifyAckToken } from '@swift2/core/community-ack';

import { trustedClientIp } from '../../../../lib/longlive/client-ip';
import { makeRateLimiter } from '../../../../lib/longlive/rate-limit';
import { supabaseAdmin } from '../../../../lib/supabase-server';

// Community Engine Phase 1 card P1-5
// (docs/proposals/2026-09-06-community-engine-plan.md §2.6, §9): the
// one-click "Posted"/"Skip" links `community-mailer.yml` (P1-6) embeds in
// the daily Community Tasks email —
// `https://longlivets.com/api/community/ack?lead=<id>&action=posted&link=
// <0|1>&token=<hmac>` (or `action=skip`, no `link` param).
//
// GET, no auth beyond the HMAC token itself (same posture as
// `notifications/open`): a founder clicks a link from an email client,
// there's no session to check. The token signs `lead+action+link` together
// (`COMMUNITY_ACK_SECRET`, `packages/core/src/community-ack-token.ts`), so
// none of the three can be tampered with independently — flipping
// `action=posted` to `action=skip`, or flipping `link=1` to `link=0` (which
// would otherwise let a copied URL dodge or inflate the `redditNonPromo`
// etiquette counter), invalidates the signature.
//
// Idempotent (`ackPosted`/`ackSkipped`): a second click, or an email
// client's link-prefetch bot, is a silent no-op — never a double ledger
// row or a double etiquette-counter bump. Guardrail §6.1 (\"a human always
// posts\") is why this route only ever RECORDS an outcome a human already
// carried out by hand; it never posts, replies, or acts on Reddit/Facebook
// itself.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^[0-9a-f]+$/i;

// Same best-effort per-instance shape as notifications/open — a burst here
// is a founder tapping a link a few times, not an attack surface worth a
// stronger guarantee (see rate-limit.ts's header).
const limiter = makeRateLimiter({ windowMs: 60_000, max: 30 });

function rateLimited(ip: string): boolean {
  return limiter.isLimited(ip);
}

function htmlResponse(status: number, message: string): Response {
  // A founder opens this link straight from an email client — a bare JSON
  // body would be confusing. Minimal, dependency-free HTML confirmation,
  // no user input echoed (message is always one of this file's own
  // constant strings, never request-derived).
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Community Engine</title></head>` +
      `<body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto">` +
      `<p>${message}</p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(req: Request): Promise<Response> {
  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return htmlResponse(429, 'Please try again in a minute.');
  }

  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead')?.trim() ?? '';
  const action = url.searchParams.get('action')?.trim() ?? '';
  const token = url.searchParams.get('token')?.trim() ?? '';
  const linkIncluded = url.searchParams.get('link') === '1';

  if (!leadId || !UUID_RE.test(leadId)) {
    return htmlResponse(400, 'This link is missing or has an invalid lead id.');
  }
  if (action !== 'posted' && action !== 'skip') {
    return htmlResponse(400, 'This link has an invalid action.');
  }
  if (!token || !HEX_RE.test(token)) {
    return htmlResponse(400, 'This link is missing its verification token.');
  }

  const secret = process.env.COMMUNITY_ACK_SECRET;
  if (!secret) {
    // Never surfaces as a 5xx bug report from a founder's inbox — same
    // clean-degrade posture as every other unconfigured route in this
    // repo — but this one really does need attention, hence the warn.
    console.warn('community/ack: COMMUNITY_ACK_SECRET not set; ack dropped');
    return htmlResponse(503, 'The Community Engine ack link isn’t configured in this environment yet.');
  }

  if (!verifyAckToken(secret, { leadId, action, linkIncluded }, token)) {
    // Tamper case (§9 acceptance criterion: "tests for route + tamper
    // cases") — wrong signature for this lead+action pair. Never reveals
    // whether the lead id itself exists.
    return htmlResponse(403, 'This link’s verification token doesn’t match — it may have been altered.');
  }

  const db = supabaseAdmin();
  if (!db) {
    console.warn('community/ack: SUPABASE_SERVICE_ROLE_KEY not set; ack dropped');
    return htmlResponse(503, 'The Community Engine isn’t wired up in this environment yet.');
  }

  try {
    const result =
      action === 'posted'
        ? await ackPosted(db, leadId, linkIncluded)
        : await ackSkipped(db, leadId);

    if (!result.ok) {
      if (result.error === 'not_found') {
        return htmlResponse(404, 'That community task couldn’t be found — it may already have been removed.');
      }
      console.error('community/ack: db error', result.message);
      return htmlResponse(500, 'Something went wrong recording that — please try again shortly.');
    }

    if (result.alreadyActed) {
      return htmlResponse(200, 'Already recorded — nothing more to do here.');
    }
    return htmlResponse(
      200,
      action === 'posted' ? 'Marked as posted. Thanks!' : 'Marked as skipped.',
    );
  } catch (err) {
    console.error('community/ack: unexpected error', (err as Error).message);
    return htmlResponse(500, 'Something went wrong recording that — please try again shortly.');
  }
}
