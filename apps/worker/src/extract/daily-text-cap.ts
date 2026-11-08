// Worker-side daily cap on image+text news items (docs/decisions.md
// 2026-11-03, point 4 "Balance"). First come, first served: hourly runs cannot
// rank across the day, so once the era already has DAILY_TEXT_CAP published
// items created this UTC day, the next one is held as `daily_text_cap`.
// The count is read from current_item so the cap holds across hourly runs.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractedFact } from './types';
import type { WriterV2Write } from './write-knowledge';

export const DAILY_TEXT_CAP = 6;
export const DAILY_TEXT_CAP_HOLD = 'daily_text_cap';

export function utcDayStart(now: Date): string {
  return `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

/** Published (servable, unmerged, unretracted) items for the era created since 00:00 UTC today. */
export async function countTextPublishedToday(
  db: SupabaseClient,
  eraId: string,
  now: Date = new Date(),
): Promise<number> {
  const { count, error } = await db
    .from('current_item')
    .select('id', { count: 'exact', head: true })
    .eq('era_id', eraId)
    .eq('redline_ok', true)
    .is('merged_into', null)
    .is('retracted_at', null)
    .gte('created_at', utcDayStart(now));
  if (error) throw new Error(`daily text cap count failed: ${error.message}`);
  return count ?? 0;
}

/** A hold when the era is already at the cap, undefined while there is room. */
export async function dailyTextCapHold(
  db: SupabaseClient,
  eraId: string,
  facts: readonly ExtractedFact[],
  now: Date = new Date(),
): Promise<WriterV2Write | undefined> {
  const published = await countTextPublishedToday(db, eraId, now);
  return published >= DAILY_TEXT_CAP ? { facts, holdReason: DAILY_TEXT_CAP_HOLD } : undefined;
}

// Tier-aware cap (docs/decisions.md 2026-11-08). Live when NEWS_SIGNIFICANCE=on;
// dailyTextCapHold above stays the cap for off and shadow.
export const TIER2_DAILY_CAP = 4;
export const TIER2_CAP_HOLD = 'daily_tier2_cap';
export const TIER3_HOLD = 'not_notable:tier3';

export type TierCapDecision = { publish: true } | { publish: false; reason: string };

/** Tier 1 is never capped, tier 2 is capped per era per UTC day, tier 3 is never published. */
export function tierCapDecision(tier: 1 | 2 | 3, tier2PublishedToday: number): TierCapDecision {
  if (tier === 1) return { publish: true };
  if (tier === 2) {
    return tier2PublishedToday >= TIER2_DAILY_CAP ? { publish: false, reason: TIER2_CAP_HOLD } : { publish: true };
  }
  return { publish: false, reason: TIER3_HOLD };
}

/** Published tier-2 items for the era since 00:00 UTC. Before the significance column exists every published item counts, the conservative side of the cap. */
export async function countTier2PublishedToday(
  db: SupabaseClient,
  eraId: string,
  now: Date = new Date(),
): Promise<number> {
  const { count, error } = await db
    .from('current_item')
    .select('id', { count: 'exact', head: true })
    .eq('era_id', eraId)
    .eq('redline_ok', true)
    .is('merged_into', null)
    .is('retracted_at', null)
    .eq('significance_verdict->>tier', '2')
    .gte('created_at', utcDayStart(now));
  if (error) {
    if (isMissingSignificanceColumn(error)) return countTextPublishedToday(db, eraId, now);
    throw new Error(`tier-2 cap count failed: ${error.message}`);
  }
  return count ?? 0;
}

/** True when an error says `significance_verdict` does not exist yet (migration pending). */
export function isMissingSignificanceColumn(error: { message: string; code?: string }): boolean {
  return /significance_verdict/.test(error.message)
    && (error.code === '42703' || error.code === 'PGRST204' || /column/.test(error.message));
}

/** A hold when a tier-2 item would exceed its daily cap or the tier is 3, undefined when it may publish. Tier 1 never reads the count. */
export async function tierCapHold(
  db: SupabaseClient,
  eraId: string,
  facts: readonly ExtractedFact[],
  tier: 1 | 2 | 3,
  now: Date = new Date(),
): Promise<WriterV2Write | undefined> {
  const published = tier === 2 ? await countTier2PublishedToday(db, eraId, now) : 0;
  const decision = tierCapDecision(tier, published);
  return decision.publish ? undefined : { facts, holdReason: decision.reason };
}
