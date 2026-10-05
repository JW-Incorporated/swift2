// #4874: durable (Supabase) dedupe + global cap for `[watchdog]` reports, layered
// on top of the per-instance in-memory caps in ./watchdog-report.ts. Dedupe and
// quota allocation are ONE atomic Postgres function (claim_watchdog_report, see
// the migration): a claim is pending until the GitHub post succeeds, then marked
// posted (finishWatchdogReport) or released on failure so the client's retry
// still gets through. Fails OPEN (the in-memory caps still apply) when Supabase
// is unconfigured or errors, so a storage outage never drops a report.
import { supabaseAdmin } from '../../../lib/supabase-server';
import type { WatchdogReport } from './watchdog-report';

export const WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY = 100;
export const WATCHDOG_CLAIM_STALE_MINUTES = 10;

export type DurableVerdict = 'new' | 'duplicate' | 'capped';

const dayOf = (now: Date): string => now.toISOString().slice(0, 10);

export async function claimWatchdogReport(r: WatchdogReport, now: Date = new Date()): Promise<DurableVerdict> {
  const db = supabaseAdmin();
  if (!db) return 'new';
  try {
    const { data, error } = await db.rpc('claim_watchdog_report', {
      p_day: dayOf(now),
      p_build_key: r.buildKey,
      p_category: r.category,
      p_max_per_day: WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY,
      p_stale_minutes: WATCHDOG_CLAIM_STALE_MINUTES,
    });
    if (error) return 'new';
    return data === 'duplicate' || data === 'capped' ? data : 'new';
  } catch {
    return 'new';
  }
}

/** posted=true after a successful GitHub post; false releases the claim (and its quota unit). Never throws. */
export async function finishWatchdogReport(r: WatchdogReport, posted: boolean, now: Date = new Date()): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  try {
    await db.rpc('finish_watchdog_report', {
      p_day: dayOf(now),
      p_build_key: r.buildKey,
      p_category: r.category,
      p_posted: posted,
    });
  } catch {
    // best effort: a leftover pending claim goes stale and is reclaimable
  }
}
