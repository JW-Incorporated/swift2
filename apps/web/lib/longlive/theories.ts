import type { EraId, TheoryNote } from './types';
import { THEORIES_RAW } from './theories.generated';

/**
 * Per-era easter eggs + fan theories — static data synced at build time from
 * the Vault `theory` seed/table by scripts/sync-longlive-theories.mjs (same
 * pattern as tracks.generated.ts; see docs/longlive-experience.md §9). The
 * generator already normalizes, de-dupes, and enforces the confidence/outcome
 * + sources requirements, so reads here are plain lookups.
 */

export function theoriesForEra(eraId: EraId): TheoryNote[] {
  return THEORIES_RAW[eraId] ?? [];
}

/**
 * Resolves one `TheoryNote.relatedSlugs` entry (`${EraId}:${slug}`, already
 * mapped to a real EraId at generation time) against the live per-era
 * theory lists. Returns null when the era or slug doesn't resolve to an
 * actual theory — a stale/typo'd cross-link must never render as a dead
 * link, same convention as ContentItem.relatedIds.
 */
export function resolveRelatedTheory(
  ref: string,
): { eraId: EraId; theory: TheoryNote } | null {
  const i = ref.indexOf(':');
  if (i < 0) return null;
  const eraId = ref.slice(0, i) as EraId;
  const slug = ref.slice(i + 1);
  const theory = (THEORIES_RAW[eraId] ?? []).find((t) => t.slug === slug);
  return theory ? { eraId, theory } : null;
}
