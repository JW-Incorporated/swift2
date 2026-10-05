// #4874: durable (Supabase) dedupe + global cap for `[watchdog]` reports, layered
// on top of the per-instance in-memory caps in ./watchdog-report.ts. One row per
// (UTC day, buildKey, category) in public.watchdog_report_dedupe; the primary key
// makes the insert the atomic "first one wins". Fails OPEN (the in-memory caps
// still apply) when Supabase is unconfigured or errors, so a storage outage never
// drops a report that would otherwise have been posted.
import { supabaseAdmin } from '../../../lib/supabase-server';
import type { WatchdogReport } from './watchdog-report';

export const WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY = 100;
const TABLE = 'watchdog_report_dedupe';

export type DurableVerdict = 'new' | 'duplicate' | 'capped';

export async function claimWatchdogReport(r: WatchdogReport, now: Date = new Date()): Promise<DurableVerdict> {
  const db = supabaseAdmin();
  if (!db) return 'new';
  try {
    const day = now.toISOString().slice(0, 10);
    const { count, error: countError } = await db
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('day', day);
    if (countError) return 'new';
    if ((count ?? 0) >= WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY) return 'capped';
    const { error } = await db.from(TABLE).insert({ day, build_key: r.buildKey, category: r.category });
    if (!error) return 'new';
    return error.code === '23505' ? 'duplicate' : 'new';
  } catch {
    return 'new';
  }
}
