// Durable cap counter for the extract stage — same shape as
// classify/usage-store.ts's UsageStore, extended with a SECOND, purely
// in-process cap (150/run) alongside the durable daily one (600/day,
// proposal §4.5). The worker is a fresh one-shot process every cycle (same
// rationale as classify/usage-store.ts's header), so the per-run cap needs
// no persistence of its own — it just bounds how many of the day's calls
// this one cycle is allowed to spend, so one cycle can never blow the whole
// day's budget by itself. Backed by `usage_daily(scope, usage_date,
// call_count)` (supabase/migrations/20260902000000_usage_daily.sql),
// scoped to 'extract' so this never shares a counter with classify's
// existing news_llm_usage.

export interface UsageDb {
  todaysCallCount(): Promise<number>;
  incrementToday(): Promise<void>;
}

export const PER_RUN_CAP = 150;
export const DAILY_CAP = 600;
const SCOPE = 'extract';

export class ExtractUsageStore {
  private constructor(
    private db: UsageDb,
    private runCount: number,
    private inProcessDailyCount: number,
    private readonly perRunCap: number,
    private readonly dailyCap: number,
  ) {}

  static async create(
    db: UsageDb,
    perRunCap: number = PER_RUN_CAP,
    dailyCap: number = DAILY_CAP,
  ): Promise<ExtractUsageStore> {
    let initialCount = 0;
    try {
      initialCount = await db.todaysCallCount();
    } catch {
      // Unreachable at startup — the per-run cap still bounds this run.
    }
    return new ExtractUsageStore(db, 0, initialCount, perRunCap, dailyCap);
  }

  /**
   * Reserves budget for one extract call. Returns false once EITHER cap is
   * hit — the caller must defer the cluster to the next run, never call the
   * LLM anyway (the cluster's news_story.extracted_at stays null so it is
   * picked up again next cycle).
   */
  async reserve(): Promise<boolean> {
    if (this.runCount >= this.perRunCap) return false;
    if (this.inProcessDailyCount >= this.dailyCap) return false;
    this.runCount++;
    this.inProcessDailyCount++;
    try {
      await this.db.incrementToday();
    } catch {
      // Durable counter unreachable this call — the in-process floor above
      // still bounds this run; the next healthy run reconciles.
    }
    return true;
  }
}

/** Real UsageDb backed by usage_daily / increment_usage_daily('extract'). */
export function supabaseExtractUsageDb(db: import('@supabase/supabase-js').SupabaseClient): UsageDb {
  return {
    async todaysCallCount() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await db
        .from('usage_daily')
        .select('call_count')
        .eq('scope', SCOPE)
        .eq('usage_date', today)
        .maybeSingle();
      if (error) throw error;
      return data?.call_count ?? 0;
    },
    async incrementToday() {
      const { error } = await db.rpc('increment_usage_daily', { p_scope: SCOPE });
      if (error) throw error;
    },
  };
}
