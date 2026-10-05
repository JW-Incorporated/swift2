// #4874: durable (Supabase) dedupe + global cap for `[watchdog]` reports, layered
// on top of the per-instance in-memory caps in ./watchdog-report.ts. Dedupe and
// quota allocation are ONE atomic Postgres function (claim_watchdog_report, see
// the migration). The claim is final: a failed GitHub post is not released or
// retried (the day's report for that build+category is simply lost, which is the
// cheap, flood-safe side). Fails OPEN (the in-memory caps still apply) when
// Supabase is unconfigured or errors.
import { supabaseAdmin } from '../../../lib/supabase-server';
import { hashIp } from './feedback-quota';
import type { WatchdogReport } from './watchdog-report';

export const WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY = 100;

export type DurableVerdict = 'new' | 'duplicate' | 'capped' | 'escalate';
export type DurableClaim = { verdict: DurableVerdict; n: number; sources: number };

const FALLBACK: DurableClaim = { verdict: 'new', n: 1, sources: 1 };
const VERDICTS: readonly string[] = ['new', 'duplicate', 'capped', 'escalate'];

// Every report is counted (n, and sources = distinct hashed IPs) so a forged first report cannot hide volume;
// 'escalate' asks the caller to post one more comment at the thresholds the SQL function picks.
export async function claimWatchdogReport(r: WatchdogReport, ip: string, now: Date = new Date()): Promise<DurableClaim> {
  const db = supabaseAdmin();
  if (!db) return FALLBACK;
  try {
    const { data, error } = await db.rpc('claim_watchdog_report', {
      p_day: now.toISOString().slice(0, 10),
      p_build_key: r.buildKey,
      p_category: r.category,
      p_max: WATCHDOG_DURABLE_GLOBAL_MAX_PER_DAY,
      p_ip_hash: hashIp(ip),
    });
    const d = data as { verdict?: unknown; n?: unknown; sources?: unknown } | null;
    if (error || !d || typeof d.verdict !== 'string' || !VERDICTS.includes(d.verdict)) return FALLBACK;
    return { verdict: d.verdict as DurableVerdict, n: Number(d.n) || 1, sources: Number(d.sources) || 1 };
  } catch {
    return FALLBACK;
  }
}
