import type { CurrentItemCategory, CurrentItemStatus, SourceTier } from '@swift2/shared';

// Deterministic "worth a post" floor (docs/decisions.md 2026-11-03). Runs
// before the writer pass; not yet wired into the extract stage.

export const WORTH_FLOOR_CATEGORIES: readonly CurrentItemCategory[] = ['release', 'tour', 'sighting'];
const MIN_DISTINCT_HOSTS = 2;

export interface WorthSource {
  url: string;
  tier: SourceTier;
}

export type WorthResult = { ok: true } | { ok: false; reason: 'below_tier_floor' };

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function worthAPost(input: {
  sources: readonly WorthSource[];
  category: CurrentItemCategory;
  statusHint: CurrentItemStatus;
}): WorthResult {
  const { sources, category, statusHint } = input;
  if (sources.some((source) => source.tier === 'official' || source.tier === 'established')) {
    return { ok: true };
  }
  const hosts = new Set(sources.map((source) => hostOf(source.url)).filter((host): host is string => host !== null));
  if (hosts.size >= MIN_DISTINCT_HOSTS) return { ok: true };
  if (WORTH_FLOOR_CATEGORIES.includes(category) && statusHint === 'confirmed') return { ok: true };
  return { ok: false, reason: 'below_tier_floor' };
}
