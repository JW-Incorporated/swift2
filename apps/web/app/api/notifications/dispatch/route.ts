import { NextResponse } from 'next/server';
import {
  dispatchPendingEvents,
  dispatchDueDigests,
  dispatchClownReports,
  dispatchFunNotifications,
  scheduleCountdownsForPendingEvents,
  dispatchDueCountdowns,
  readPushFreeze,
  writeDispatchHeartbeat,
  runCooldownPass,
} from '@swift2/core/notifications-server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { bearerToken, timingSafeSecretEqual } from '../../../../lib/longlive/rate-limit';
import { trackKeyForLyricSlug } from '../../../../lib/longlive/lyric-track-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const PUSH_SENDING_PASSES = [
  'router',
  'digests',
  'clownReports',
  'fun',
  'countdownSchedule',
  'countdownDispatch',
  'cooldown',
] as const;

const COOLDOWN_PASS_ENABLED = false;

type PassSummary = {
  considered: number; sent: number; skipped: Record<string, number>; errors: number;
};
type DispatchSummary = {
  event: 'notification_dispatch_summary'; frozen: boolean; routeErrors: number;
  passes: Record<(typeof PUSH_SENDING_PASSES)[number], PassSummary>;
};

function passSummary(
  considered = 0,
  sent = 0,
  skipped: Record<string, number> = {},
  errors: readonly unknown[] = [],
): PassSummary {
  return { considered, sent, skipped, errors: errors.length };
}

function emptySummary(frozen: boolean, routeErrors = 0): DispatchSummary {
  return {
    event: 'notification_dispatch_summary',
    frozen,
    routeErrors,
    passes: Object.fromEntries(
      PUSH_SENDING_PASSES.map((name) => [name, passSummary()]),
    ) as DispatchSummary['passes'],
  };
}

function logSummary(summary: DispatchSummary): void {
  console.info(JSON.stringify(summary));
}

function haltedResponse(
  summary: DispatchSummary,
  completed: Record<string, unknown>,
  nextPass: number,
  freezeEngaged: boolean,
): Response {
  summary.frozen = freezeEngaged;
  logSummary(summary);
  const body = {
    halted: true, frozen: freezeEngaged, ...completed,
    skippedPasses: PUSH_SENDING_PASSES.slice(nextPass),
  };
  return NextResponse.json(body, { status: 503 });
}

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const token = bearerToken(req);
  return token !== null && timingSafeSecretEqual(token, expected);
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
    logSummary(emptySummary(false, 1));
    return NextResponse.json(
      { error: 'Notifications dispatch isn\u2019t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  const heartbeat = await writeDispatchHeartbeat(db);
  if (!heartbeat.written) {
    console.error(`notifications/dispatch: dispatch_heartbeat write failed: ${heartbeat.reason}`);
    logSummary(emptySummary(false, 1));
    return NextResponse.json({ error: 'Dispatch heartbeat write failed.' }, { status: 503 });
  }

  const pushFreeze = await readPushFreeze(db);
  if (pushFreeze.state === 'unreadable') {
    const reason = pushFreeze.reason ?? 'switch row is missing';
    console.warn(`notifications/dispatch: PUSH_FREEZE unreadable; all passes skipped: ${reason}`);
    logSummary(emptySummary(false, 1));
    return NextResponse.json(
      { error: `PUSH_FREEZE could not be read: ${reason}` },
      { status: 503 },
    );
  }
  if (pushFreeze.state === 'frozen') {
    console.warn(
      `notifications/dispatch: PUSH_FREEZE is on; skipped passes: ${PUSH_SENDING_PASSES.join(', ')}`,
    );
    logSummary(emptySummary(true));
    return NextResponse.json(
      { frozen: true, skippedPasses: PUSH_SENDING_PASSES },
      { status: 200 },
    );
  }

  const summary = emptySummary(false);
  try {
    const result = await dispatchPendingEvents(db);
    summary.passes.router = passSummary(
      result.eventsConsidered,
      result.sent,
      {
        notReady: result.eventsSkippedNotReady,
        killed: result.eventsSkippedKilled,
        expired: result.eventsSkippedExpired,
        alreadyDelivered: result.skippedAlreadyDelivered,
        stale: result.skippedStale,
        quietHours: result.held,
        masterOff: result.skippedMasterOff,
        snoozed: result.skippedSnoozed,
        coalesced: result.skippedCoalesced,
        dailyCap: result.skippedDailyCap,
        hardCeiling: result.skippedHardCeiling,
        sendFailure: result.sendFailures,
      },
      result.errors,
    );
    if (result.halted) {
      return haltedResponse(summary, { router: result }, 1, result.freezeEngaged);
    }

    const digestResult = await dispatchDueDigests(db);
    summary.passes.digests = passSummary(
      digestResult.devicesConsidered,
      digestResult.digestsSent,
      {
        outsideSendWindow: digestResult.digestsHeldOutsideSendWindow,
        masterOff: digestResult.digestsSkippedMasterOff,
        hardCeiling: digestResult.digestsSkippedHardCeiling,
        sendFailure: digestResult.sendFailures,
      },
      digestResult.errors,
    );
    if (digestResult.halted) {
      return haltedResponse(
        summary,
        { router: result, digests: digestResult },
        2,
        digestResult.freezeEngaged,
      );
    }

    const clownResult = await dispatchClownReports(db);
    summary.passes.clownReports = passSummary(
      clownResult.devicesConsidered,
      clownResult.clownReportsSent,
      {},
      clownResult.errors,
    );
    if (clownResult.halted) {
      return haltedResponse(
        summary,
        { router: result, digests: digestResult, clownReports: clownResult },
        3,
        clownResult.freezeEngaged,
      );
    }

    const funResult = await dispatchFunNotifications(db, new Date(), { trackKeyForSlug: trackKeyForLyricSlug });
    summary.passes.fun = passSummary(
      funResult.devicesConsidered,
      funResult.lyricsSent + funResult.onThisDaySent,
      {
        noEntry: funResult.onThisDaySkippedNoEntry,
        hardCeiling: funResult.skippedHardCeiling,
        sendFailure: funResult.sendFailures,
      },
      funResult.errors,
    );
    if (funResult.halted) {
      return haltedResponse(
        summary,
        { router: result, digests: digestResult, clownReports: clownResult, fun: funResult },
        4,
        funResult.freezeEngaged,
      );
    }
    const countdownScheduleResult = await scheduleCountdownsForPendingEvents(db);
    summary.passes.countdownSchedule = passSummary(
      countdownScheduleResult.scheduled,
      0,
      {},
      countdownScheduleResult.errors,
    );
    const countdownDispatchResult = await dispatchDueCountdowns(db);
    summary.passes.countdownDispatch = passSummary(
      countdownDispatchResult.sent +
        countdownDispatchResult.sendFailures +
        countdownDispatchResult.skippedHardCeiling,
      countdownDispatchResult.sent,
      {
        hardCeiling: countdownDispatchResult.skippedHardCeiling,
        sendFailure: countdownDispatchResult.sendFailures,
      },
      countdownDispatchResult.errors,
    );
    if (countdownDispatchResult.halted) {
      return haltedResponse(
        summary,
        {
          router: result,
          digests: digestResult,
          clownReports: clownResult,
          fun: funResult,
          countdownSchedule: countdownScheduleResult,
          countdownDispatch: countdownDispatchResult,
        },
        6,
        countdownDispatchResult.freezeEngaged,
      );
    }
    const cooldownResult = COOLDOWN_PASS_ENABLED
      ? await runCooldownPass(db)
      : {
          disabled: true,
          devicesConsidered: 0,
          devicesDowngraded: 0,
          noticesSent: 0,
          sendFailures: 0,
          freezeEngaged: false,
          halted: false,
          errors: [] as string[],
        };
    summary.passes.cooldown = passSummary(
      cooldownResult.devicesConsidered,
      cooldownResult.noticesSent,
      {
        disabled: 'disabled' in cooldownResult ? 1 : 0,
        notDowngraded: cooldownResult.devicesConsidered - cooldownResult.devicesDowngraded,
        sendFailure: cooldownResult.sendFailures,
      },
      cooldownResult.errors,
    );
    if (cooldownResult.halted) {
      return haltedResponse(summary, {
        router: result, digests: digestResult, clownReports: clownResult, fun: funResult,
        countdownSchedule: countdownScheduleResult, countdownDispatch: countdownDispatchResult,
        cooldown: cooldownResult,
      }, 7, cooldownResult.freezeEngaged);
    }
    logSummary(summary);
    return NextResponse.json({
      router: result, digests: digestResult, clownReports: clownResult, fun: funResult,
      countdownSchedule: countdownScheduleResult, countdownDispatch: countdownDispatchResult,
      cooldown: cooldownResult,
    });
  } catch (err) {
    console.error('notifications/dispatch: unexpected error', (err as Error).message);
    summary.routeErrors++;
    logSummary(summary);
    return NextResponse.json({ error: 'Dispatch failed unexpectedly.' }, { status: 500 });
  }
}
