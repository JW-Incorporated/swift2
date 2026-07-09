import type { EraId, TrackNote } from './types';
import { TRACKS_RAW } from './tracks.generated';

/**
 * Per-album song track guide — static data synced at build time from the
 * Vault `track_note` seed/table by scripts/sync-longlive-tracks.mjs (same
 * pattern as content-vault.generated.ts; see docs/longlive-experience.md §9).
 * The generator already normalizes, de-dupes, and sorts (track number
 * ascending, unnumbered last), so reads here are plain lookups.
 */

export function tracksForEra(eraId: EraId): TrackNote[] {
  return TRACKS_RAW[eraId] ?? [];
}
