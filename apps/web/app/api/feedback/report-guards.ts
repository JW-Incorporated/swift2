import { NextResponse } from 'next/server';

import { makeRateLimiter } from '../../../lib/longlive/rate-limit';
import { claimFeedbackSlot } from './feedback-quota';
import {
  DIAG_PREFIX,
  diagCommentFrom,
  isDiagMessage,
  parseDiagReport,
  speedAllowed,
  speedDuplicate,
  type SpeedMeta,
} from './diag';
import { isWatchdogMessage, type WatchdogReport } from './watchdog-report';
import { prepareWatchdog } from './watchdog-lifecycle';

// Request guards for POST /api/feedback, split out of route.ts (300-line cap,
// pure move): the in-memory per-IP limiter, [diag]/[watchdog] validation, and
// the durable quota claim.

// Best-effort per-instance rate limit (serverless instances are ephemeral, so
// this is bounded per WARM INSTANCE, not globally — an attacker spread across
// enough cold-started instances still gets more than MAX_PER_WINDOW total.
// There's no shared KV/Redis/Postgres rate-limit store anywhere in this repo
// to back it with today (checked), and standing one up is out of scope for
// this fix — this limitation is real and still open, tracked on #1973.
//
// What #1973 actually exploited IS closed here: the IP key comes from
// trustedClientIp() below (Vercel-set `x-real-ip`, or the edge-appended
// rightmost `x-forwarded-for` hop), not the client-spoofable leftmost XFF
// value, so a script can no longer manufacture a fresh bucket per request
// just by rotating a header.
const limiter = makeRateLimiter({ windowMs: 60_000, max: 5 });

// Speed test reports (a run is up to 31 reports in quick succession, and the summary must not be
// the one dropped) have their own budget in diag.ts (speedAllowed) instead of the generic per-IP
// limiter. Only a payload that then passes the strict schema AND the run budget reaches GitHub.
export function ipThrottled(message: string, payload: { diag?: unknown }, ip: string): boolean {
  const speedShaped =
    message === DIAG_PREFIX &&
    typeof payload.diag === 'object' &&
    payload.diag !== null &&
    'speed' in payload.diag;
  return !speedShaped && limiter.isLimited(ip);
}

export type ReportGuard =
  | { response: Response }
  | { diag: boolean; diagComment: string; speedReport: SpeedMeta | null; watchdogReport: WatchdogReport | null };

export async function guardReport(
  payload: { message?: string; diag?: unknown; watchdog?: unknown },
  message: string,
  ip: string,
): Promise<ReportGuard> {
  // One UI WP0.1: a `[diag]` report is never posted as client text. The
  // structured `diag` payload is validated against an exact schema and the
  // comment is rebuilt from those values only (see ./diag.ts). Rejects with a
  // fixed error before anything else, so nothing client-supplied is echoed.
  const watchdog = isWatchdogMessage(message);
  const diag = isDiagMessage(message) || watchdog;
  let diagComment = '';
  let speedReport: SpeedMeta | null = null;
  let watchdogReport: WatchdogReport | null = null;
  if (watchdog) {
    const prepared = prepareWatchdog(payload, ip);
    if (!prepared.ok) return { response: prepared.response };
    watchdogReport = prepared.durable ? prepared.report : null;
    diagComment = prepared.comment;
  } else if (diag) {
    const exactShape =
      payload.message === DIAG_PREFIX &&
      Object.keys(payload).every((k) => k === 'message' || k === 'hp' || k === 'diag');
    const parsed = exactShape ? parseDiagReport(payload.diag) : null;
    if (!parsed?.ok) {
      return { response: NextResponse.json({ error: 'Invalid diagnostics report.' }, { status: 400 }) };
    }
    if (parsed.report.speed) {
      if (speedDuplicate(parsed.report.speed)) {
        return { response: NextResponse.json({ ok: true, duplicate: true }, { status: 200 }) };
      }
      if (!speedAllowed(parsed.report.speed.run)) {
        return { response: NextResponse.json({ error: 'Too many reports.' }, { status: 429 }) };
      }
      speedReport = parsed.report.speed;
    }
    diagComment = diagCommentFrom(parsed.report);
  }

  if (!watchdog) {
    const quota = await claimFeedbackSlot(diag ? 'diag' : 'feedback', ip);
    if (quota === 'ip_capped' || quota === 'global_capped') {
      return { response: NextResponse.json({ error: 'Too many reports. Please try again later.' }, { status: 429 }) };
    }
  }
  return { diag, diagComment, speedReport, watchdogReport };
}
