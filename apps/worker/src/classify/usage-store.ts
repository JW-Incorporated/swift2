// Durable daily-cap counter, with an in-process floor so the cap bounds a
// run even if the DB is briefly unreachable (Orbit's claude_usage pattern,
// ported as news_llm_usage / increment_news_llm_usage() — see
// supabase/migrations/20260718120000_news_init.sql). ONE module owns every
// LLM call's budget check — nothing calls the LLM client without going
// through reserve() first (docs/decisions.md, 2026-07-18 cost-cap entry).
//
// The worker is a fresh one-shot process every cycle (proposal §6) — a
// counter that only lived in-process, starting from 0 each run, would let
// each cycle independently use up to dailyCap calls, blowing the cap many
// times over across a day. create() seeds the in-process count from today's
// persisted total at startup so the cap holds cumulatively across cycles.

export interface UsageDb {
  todaysCallCount(): Promise<number>;
  incrementToday(): Promise<void>;
}

export const DAILY_CAP = 100;

export class UsageStore {
  private constructor(
    private db: UsageDb,
    private inProcessCount: number,
    private dailyCap: number,
  ) {}

  static async create(db: UsageDb, dailyCap: number = DAILY_CAP): Promise<UsageStore> {
    let initialCount = 0;
    try {
      initialCount = await db.todaysCallCount();
    } catch {
      // Unreachable at startup — this run's own floor still caps it at
      // dailyCap, just without cross-run knowledge until the DB recovers.
    }
    return new UsageStore(db, initialCount, dailyCap);
  }

  /**
   * Reserves budget for one LLM call. Returns false if the cap is already
   * reached — the caller must fall back to the rule-based classifier, never
   * call the LLM anyway. Increments the in-process floor FIRST, before the
   * best-effort durable persist, so the floor holds for this run even if the
   * durable increment below fails.
   */
  async reserve(): Promise<boolean> {
    if (this.inProcessCount >= this.dailyCap) return false;
    this.inProcessCount++;
    try {
      await this.db.incrementToday();
    } catch {
      // Durable counter unreachable this call — the in-process increment
      // above still bounds this run; the next healthy run reconciles.
    }
    return true;
  }
}

/** Real UsageDb backed by news_llm_usage / increment_news_llm_usage(). */
export function supabaseUsageDb(db: import('@supabase/supabase-js').SupabaseClient): UsageDb {
  return {
    async todaysCallCount() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await db
        .from('news_llm_usage')
        .select('call_count')
        .eq('usage_date', today)
        .maybeSingle();
      if (error) throw error;
      return data?.call_count ?? 0;
    },
    async incrementToday() {
      const { error } = await db.rpc('increment_news_llm_usage');
      if (error) throw error;
    },
  };
}
