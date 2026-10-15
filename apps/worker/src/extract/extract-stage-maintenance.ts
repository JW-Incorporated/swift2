import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveVanishedCountdowns } from '../sources/site-diff';
import {
  abandonQuietTheories,
  refreshSymbolActivity,
} from './write-knowledge';

export interface ExtractMaintenanceResult {
  abandonedTheories: number;
  countdownsResolved: number;
  errors: string[];
}

export async function runExtractMaintenance(
  db: SupabaseClient,
  today: string,
  eraId: string,
): Promise<ExtractMaintenanceResult> {
  const result: ExtractMaintenanceResult = {
    abandonedTheories: 0,
    countdownsResolved: 0,
    errors: [],
  };
  try {
    result.abandonedTheories = await abandonQuietTheories(db, today);
  } catch (error) {
    result.errors.push((error as Error).message);
  }
  try {
    result.countdownsResolved = await resolveVanishedCountdowns(db, eraId);
  } catch (error) {
    result.errors.push((error as Error).message);
  }
  try {
    await refreshSymbolActivity(db);
  } catch (error) {
    result.errors.push((error as Error).message);
  }
  return result;
}
