// #4874: durable (Supabase) dedupe + global cap for `[watchdog]` reports, layered
// on top of the per-instance in-memory caps in ./watchdog-report.ts. Dedupe and
// quota allocation are ONE atomic Postgres function (claim_watchdog_report, see
// the migration). The claim is final: a failed GitHub post is not released or
// retried (the day's report for that build+category is simply lost, which is the
// cheap, flood-safe side). Fails OPEN (the in-memory caps still apply) when
// Supabase is unconfigured or errors.
import { supabaseAdmin } from '../../../lib/supabase-server';
import type { WatchdogReport } from './watchdog-report';

export const WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY = 100;

export type DurableVerdict = 'new' | 'duplicate' | 'capped';

export async function claimWatchdogReport(r: WatchdogReport, now: Date = new Date()): Promise<DurableVerdict> {
  const db = supabaseAdmin();
  if (!db) return 'new';
  try {
    const { data, error } = await db.rpc('claim_watchdog_report', {
      p_day: now.toISOString().slice(0, 10),
      p_build_key: r.buildKey,
      p_category: r.category,
      p_max: WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY,
    });
    if (error) return 'new';
    return data === 'duplicate' || data === 'capped' ? data : 'new';
  } catch {
    return 'new';
  }
}
