// Rules-first credibility model (proposal §5). Pure function of a story's
// corroboration breakdown — the base signal is WHO reported it and HOW MANY
// independently did, never an LLM's say-so. `disputed`/`debunked` require an
// explicit signal (a tiered outlet publishing a denial/correction, or
// founder/moderator action) and are never auto-computed from corroboration
// alone — the LLM's bounded role (proposal §5.4) is flagging a *candidate*
// dispute for a human/rule to confirm, not setting this status itself.

import type { SourceTier, VerificationStatus } from './news-types';

export interface Corroboration {
  tier: SourceTier;
}

/**
 * Computes verification_status from a story's supporting-source breakdown.
 * `explicitSignal`, when set, always wins — this function never invents
 * disputed/debunked on its own.
 */
export function computeVerificationStatus(
  corroboration: Corroboration[],
  explicitSignal?: 'disputed' | 'debunked',
): VerificationStatus {
  if (explicitSignal) return explicitSignal;
  if (corroboration.length === 0) return 'single_source';
  if (corroboration.some((c) => c.tier === 'official')) return 'official';
  // Distinct-outlet corroboration matters, not raw count — see news_story_source's
  // audit trail, which is where actual outlet identity is deduped before this runs.
  if (corroboration.length >= 2) return 'corroborated';
  // corroboration.length === 1 here (0 and 2+ handled above), so this index is safe.
  return corroboration[0]?.tier === 'established' ? 'single_source' : 'rumor';
}
