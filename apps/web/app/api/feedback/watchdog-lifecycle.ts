// Request lifecycle for `[watchdog]` reports, extracted from route.ts: strict
// validation + in-memory caps up front, and the durable claim (run only after
// the token check) that answers duplicate/capped without touching GitHub.
import { NextResponse } from 'next/server';
import { makeRateLimiter } from '../../../lib/longlive/rate-limit';
import { claimWatchdogReport } from './watchdog-dedupe';
import { isKnownBuildKey } from './watchdog-known-builds';
import {
  WATCHDOG_PREFIX,
  parseWatchdogReport,
  watchdogAllowed,
  watchdogCommentFrom,
  type WatchdogReport,
} from './watchdog-report';

// Per-IP (in-memory, per instance) so one client rotating buildKeys or categories cannot burn the shared durable quota.
export const WATCHDOG_IP_MAX_PER_HOUR = 6;
const ipLimiter = makeRateLimiter({ windowMs: 60 * 60_000, max: WATCHDOG_IP_MAX_PER_HOUR, sweepIntervalMs: 10 * 60_000 });

// Unknown native builds (e.g. a store release before the allow-list is updated) are still posted, but only through this
// small global in-memory bucket and WITHOUT a durable claim, so they can never touch the shared durable quota.
export const WATCHDOG_UNKNOWN_BUILD_MAX_PER_DAY = 10;
const unknownBuildLimiter = makeRateLimiter({ windowMs: 24 * 60 * 60_000, max: WATCHDOG_UNKNOWN_BUILD_MAX_PER_DAY, sweepIntervalMs: 60 * 60_000 });

type Prepared = { ok: true; report: WatchdogReport; comment: string; durable: boolean } | { ok: false; response: Response };

export function prepareWatchdog(payload: { message?: string; watchdog?: unknown }, ip: string): Prepared {
  const exactShape =
    payload.message === WATCHDOG_PREFIX &&
    Object.keys(payload).every((k) => k === 'message' || k === 'hp' || k === 'watchdog');
  const parsed = exactShape ? parseWatchdogReport(payload.watchdog) : null;
  if (!parsed?.ok) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid watchdog report.' }, { status: 400 }) };
  }
  const durable = isKnownBuildKey(parsed.report.platform, parsed.report.buildKey);
  if (ipLimiter.isLimited(ip)) {
    return { ok: false, response: NextResponse.json({ error: 'Too many reports.' }, { status: 429 }) };
  }
  if (!durable && unknownBuildLimiter.isLimited('unknown')) {
    return { ok: false, response: NextResponse.json({ error: 'Too many reports.' }, { status: 429 }) };
  }
  if (!watchdogAllowed(parsed.report.buildKey)) {
    return { ok: false, response: NextResponse.json({ error: 'Too many reports.' }, { status: 429 }) };
  }
  return { ok: true, report: parsed.report, comment: watchdogCommentFrom(parsed.report), durable };
}

/** A response when the durable claim says stop (duplicate or capped), else null. A failed post is NOT retried or released. */
export async function watchdogClaimResponse(report: WatchdogReport): Promise<Response | null> {
  const claim = await claimWatchdogReport(report);
  if (claim === 'duplicate') return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  if (claim === 'capped') return NextResponse.json({ error: 'Too many reports.' }, { status: 429 });
  return null;
}
