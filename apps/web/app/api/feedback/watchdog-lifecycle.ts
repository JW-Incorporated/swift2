// Request lifecycle for `[watchdog]` reports, extracted from route.ts: strict
// validation + in-memory caps up front, and the durable claim (run only after
// the token check) that answers duplicate/capped without touching GitHub.
import { NextResponse } from 'next/server';
import { claimWatchdogReport } from './watchdog-dedupe';
import {
  WATCHDOG_PREFIX,
  parseWatchdogReport,
  watchdogAllowed,
  watchdogCommentFrom,
  type WatchdogReport,
} from './watchdog-report';

type Prepared = { ok: true; report: WatchdogReport; comment: string } | { ok: false; response: Response };

export function prepareWatchdog(payload: { message?: string; watchdog?: unknown }): Prepared {
  const exactShape =
    payload.message === WATCHDOG_PREFIX &&
    Object.keys(payload).every((k) => k === 'message' || k === 'hp' || k === 'watchdog');
  const parsed = exactShape ? parseWatchdogReport(payload.watchdog) : null;
  if (!parsed?.ok) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid watchdog report.' }, { status: 400 }) };
  }
  if (!watchdogAllowed(parsed.report.buildKey)) {
    return { ok: false, response: NextResponse.json({ error: 'Too many reports.' }, { status: 429 }) };
  }
  return { ok: true, report: parsed.report, comment: watchdogCommentFrom(parsed.report) };
}

/** A response when the durable claim says stop (duplicate or capped), else null. A failed post is NOT retried or released. */
export async function watchdogClaimResponse(report: WatchdogReport): Promise<Response | null> {
  const claim = await claimWatchdogReport(report);
  if (claim === 'duplicate') return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  if (claim === 'capped') return NextResponse.json({ error: 'Too many reports.' }, { status: 429 });
  return null;
}
