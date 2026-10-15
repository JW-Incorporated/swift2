// Push dispatch heartbeat watchdog. The Vercel cron writes
// ops_switches.dispatch_heartbeat before every authorized tick, including
// ticks stopped by PUSH_FREEZE. Exit 0 = fresh or not live yet, 1 = stale,
// 2 = unknown because the check itself could not read a trustworthy value.
/* global AbortSignal */
import { readFileSync, writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';

export const HEARTBEAT_KEY = 'dispatch_heartbeat';
export const PUSH_FREEZE_KEY = 'PUSH_FREEZE';
export const MIN_THRESHOLD_MINUTES = 30;
export const MAX_FUTURE_SKEW_MINUTES = 5;
const FETCH_TIMEOUT_MS = 20_000;

export function thresholdFromScheduler(config) {
  const cron = config?.crons?.find((entry) => entry.path === '/api/notifications/dispatch');
  const match = cron?.schedule?.match(/^\*\/(\d+) \* \* \* \*$/);
  const intervalMinutes = Number(match?.[1]);
  if (!Number.isInteger(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error('dispatch cron interval is missing or unsupported in apps/web/vercel.json');
  }
  return {
    intervalMinutes,
    thresholdMinutes: Math.max(MIN_THRESHOLD_MINUTES, intervalMinutes * 3),
  };
}

export function evaluateHeartbeat(rows, { now = new Date(), thresholdMinutes }) {
  if (!Array.isArray(rows)) {
    return { status: 'unknown', reason: 'database response was not an array' };
  }
  if (rows.length === 0) return { status: 'not-live' };

  const lastTick = new Date(rows[0]?.updated_at);
  if (Number.isNaN(lastTick.getTime())) {
    return { status: 'unknown', reason: 'heartbeat row has an invalid updated_at' };
  }
  const rawAgeMinutes = (now.getTime() - lastTick.getTime()) / 60_000;
  if (rawAgeMinutes < -MAX_FUTURE_SKEW_MINUTES) {
    return { status: 'unknown', reason: 'heartbeat updated_at is in the future' };
  }
  const ageMinutes = Math.max(0, rawAgeMinutes);
  return {
    status: ageMinutes > thresholdMinutes ? 'stale' : 'fresh',
    ageMinutes,
    lastTick: lastTick.toISOString(),
  };
}

export function renderResult(result, { intervalMinutes, thresholdMinutes, now = new Date() }) {
  const checkedAt = now.toISOString();
  if (result.status === 'not-live') {
    return {
      exitCode: 0,
      line: 'push-dispatch-heartbeat: NOT LIVE YET — no heartbeat row; no alert.',
      body: `Push dispatch is not live yet: no \`${HEARTBEAT_KEY}\` row exists as of ${checkedAt}. This is expected until CRON_SECRET is configured, so no alert is active.\n`,
    };
  }
  if (result.status === 'fresh') {
    return {
      exitCode: 0,
      line: `push-dispatch-heartbeat: OK — last tick ${result.lastTick} (${result.ageMinutes.toFixed(1)}m ago).`,
      body: `Push dispatch is healthy. Last authorized tick: ${result.lastTick} (${result.ageMinutes.toFixed(1)} minutes old at ${checkedAt}). The ${thresholdMinutes}-minute threshold is 3 × the ${intervalMinutes}-minute Vercel cron interval, with a 30-minute floor.\n`,
    };
  }
  if (result.status === 'stale') {
    return {
      exitCode: 1,
      line: `push-dispatch-heartbeat: STALE — last tick ${result.lastTick} (${result.ageMinutes.toFixed(1)}m ago; threshold ${thresholdMinutes}m).`,
      body: `@sffan15-sys — push dispatch has stopped ticking. Last authorized tick: **${result.lastTick}** (${result.ageMinutes.toFixed(1)} minutes old at ${checkedAt}); alert threshold: ${thresholdMinutes} minutes (3 × the ${intervalMinutes}-minute Vercel cron interval, floor 30 minutes). PUSH_FREEZE does not suppress this check because frozen routes still write the heartbeat.\n`,
    };
  }
  return {
    exitCode: 2,
    line: `push-dispatch-heartbeat: UNKNOWN — ${result.reason}.`,
    body: `@sffan15-sys — push dispatch heartbeat status is **unknown** as of ${checkedAt}: ${result.reason}. The watchdog could not verify liveness; this is an alert, not a silent pass.\n`,
  };
}

export async function checkPushDispatchHeartbeat({
  fetchImpl = globalThis.fetch,
  env = process.env,
  now = new Date(),
  intervalMinutes,
  thresholdMinutes,
}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return renderResult(
      { status: 'unknown', reason: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured' },
      { intervalMinutes, thresholdMinutes, now },
    );
  }
  const baseEndpoint = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/ops_switches`;
  const requestRows = async (select, key) => {
    let response;
    try {
      response = await fetchImpl(`${baseEndpoint}?select=${select}&name=eq.${key}&limit=1`, {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      return { error: `database request failed (${error.message})` };
    }
    if (!response.ok) return { error: `database returned HTTP ${response.status}` };
    try {
      const rows = await response.json();
      if (!Array.isArray(rows)) return { error: 'database response was not an array' };
      return { rows };
    } catch {
      return { error: 'database response was not valid JSON' };
    }
  };

  const heartbeat = await requestRows('updated_at', HEARTBEAT_KEY);
  if (heartbeat.error) {
    return renderResult({ status: 'unknown', reason: heartbeat.error }, { intervalMinutes, thresholdMinutes, now });
  }
  if (heartbeat.rows.length > 0) {
    return renderResult(evaluateHeartbeat(heartbeat.rows, { now, thresholdMinutes }), {
      intervalMinutes,
      thresholdMinutes,
      now,
    });
  }

  const pushFreeze = await requestRows('name', PUSH_FREEZE_KEY);
  if (pushFreeze.error) {
    return renderResult({ status: 'unknown', reason: pushFreeze.error }, { intervalMinutes, thresholdMinutes, now });
  }
  if (pushFreeze.rows.length === 0) {
    return renderResult(
      {
        status: 'unknown',
        reason: 'heartbeat and seeded PUSH_FREEZE rows are missing; watchdog may be reading the wrong database',
      },
      { intervalMinutes, thresholdMinutes, now },
    );
  }
  return renderResult({ status: 'not-live' }, { intervalMinutes, thresholdMinutes, now });
}

async function main() {
  const config = JSON.parse(readFileSync(new URL('../../apps/web/vercel.json', import.meta.url), 'utf8'));
  let schedule;
  try {
    schedule = thresholdFromScheduler(config);
  } catch (error) {
    schedule = { intervalMinutes: 0, thresholdMinutes: MIN_THRESHOLD_MINUTES };
    const result = renderResult({ status: 'unknown', reason: error.message }, { ...schedule, now: new Date() });
    console.log(result.line);
    writeAlertBody(result.body);
    return result.exitCode;
  }
  const result = await checkPushDispatchHeartbeat({ ...schedule });
  console.log(result.line);
  writeAlertBody(result.body);
  return result.exitCode;
}

function writeAlertBody(body) {
  const index = process.argv.indexOf('--alert-body');
  if (index !== -1 && process.argv[index + 1]) writeFileSync(process.argv[index + 1], body);
}

const invokedDirectly = process.argv[1]?.split(/[\\/]/).pop() === 'push-dispatch-heartbeat.mjs';
if (invokedDirectly) runMain(main, { name: 'push-dispatch-heartbeat' });
