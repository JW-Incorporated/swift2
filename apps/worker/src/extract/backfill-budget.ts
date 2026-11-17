// Force-mode backfill has its own writer and judge budgets (usage_daily scopes
// 'backfill-writer' / 'backfill-judge', 150/run and 300/day) so it finishes in
// a few runs without eating the live hourly worker's writer 40/150 and judge
// 100/400.

import type { SupabaseClient } from '@supabase/supabase-js';
import { ExtractUsageStore, type UsageDb } from './usage-store';

export const BACKFILL_PER_RUN_CAP = 150;
export const BACKFILL_DAILY_CAP = 300;
export const BACKFILL_WRITER_SCOPE = 'backfill-writer';
export const BACKFILL_JUDGE_SCOPE = 'backfill-judge';
export const BACKFILL_SIGNIFICANCE_SCOPE = 'backfill-significance';

function scopedUsageDb(db: SupabaseClient, scope: string): UsageDb {
  return {
    async todaysCallCount() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await db
        .from('usage_daily')
        .select('call_count')
        .eq('scope', scope)
        .eq('usage_date', today)
        .maybeSingle();
      if (error) throw error;
      return data?.call_count ?? 0;
    },
    async incrementToday() {
      const { error } = await db.rpc('increment_usage_daily', { p_scope: scope });
      if (error) throw error;
    },
  };
}

export function createBackfillWriterStore(db: SupabaseClient): Promise<ExtractUsageStore> {
  return ExtractUsageStore.create(scopedUsageDb(db, BACKFILL_WRITER_SCOPE), BACKFILL_PER_RUN_CAP, BACKFILL_DAILY_CAP);
}

export function createBackfillJudgeStore(db: SupabaseClient): Promise<ExtractUsageStore> {
  return ExtractUsageStore.create(scopedUsageDb(db, BACKFILL_JUDGE_SCOPE), BACKFILL_PER_RUN_CAP, BACKFILL_DAILY_CAP);
}

export function createBackfillSignificanceStore(db: SupabaseClient): Promise<ExtractUsageStore> {
  return ExtractUsageStore.create(scopedUsageDb(db, BACKFILL_SIGNIFICANCE_SCOPE), BACKFILL_PER_RUN_CAP, BACKFILL_DAILY_CAP);
}
