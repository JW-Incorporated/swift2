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
