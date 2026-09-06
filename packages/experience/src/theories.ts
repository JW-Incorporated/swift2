import type { EraId, TheoryNote } from './types';
import { theoriesRawInjected } from './thread-content-provider';

/**
 * Per-era easter eggs + fan theories — static data synced at build time from
 * the Vault `theory` seed/table by `scripts/sync-longlive-theories.mjs` (same
 * pattern as `tracks.generated.ts`; see docs/longlive-experience.md §9). The
 * generator already normalizes, de-dupes, and enforces the confidence/outcome
 * + sources requirements, so reads here are plain lookups.
 *
 * Moved into `packages/experience` in OS-023
 * (docs/specs/2026-09-05-one-source-three-surfaces.md §6). The generated
 * `THEORIES_RAW` dataset still lives at
 * `apps/web/lib/longlive/theories.generated.ts` (content-loading is
 * OS-013/OS-014 scope), so the app wires it in at import time via
 * `setTheoriesRawProvider` — see `thread-content-provider.ts`.
 */

export function theoriesForEra(eraId: EraId): TheoryNote[] {
  return theoriesRawInjected()[eraId] ?? [];
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
  const theory = (theoriesRawInjected()[eraId] ?? []).find((t) => t.slug === slug);
  return theory ? { eraId, theory } : null;
}
