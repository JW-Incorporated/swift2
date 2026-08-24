// Generic scoped daily-call counter, backing `classify/usage-store.ts`'s
// `UsageStore` with the `api_usage_daily` table (20260901010000 migration)
// instead of `news_llm_usage`, which is LLM-classify-specific. Same durable
// + in-process-floor design (UsageStore itself is already generic — see its
// own header) — this just supplies a `UsageDb` keyed by `scope`, so more
// than one hard-capped vendor call can share one table. First consumer:
// gnews.ts's 100-req/day free-tier cap.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UsageDb } from '../classify/usage-store';

export function apiUsageDailyDb(db: SupabaseClient, scope: string): UsageDb {
  return {
    async todaysCallCount() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await db
        .from('api_usage_daily')
        .select('call_count')
        .eq('scope', scope)
        .eq('usage_date', today)
        .maybeSingle();
      if (error) throw error;
      return data?.call_count ?? 0;
    },
    async incrementToday() {
      const { error } = await db.rpc('increment_api_usage_daily', { p_scope: scope });
      if (error) throw error;
    },
  };
}
