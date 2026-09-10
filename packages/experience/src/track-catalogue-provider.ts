import type { EraId, TrackNote } from './types';

/**
 * `track-guide.ts`'s per-era track list is app-supplied generated data
 * (`apps/web/lib/longlive/tracks.generated.ts`, synced from
 * `supabase/seed/tracks/**`) — the same layering problem
 * `song-catalogue-provider.ts` solves for the mood matcher (OS-024):
 * `packages/experience` must never import an app-layer generated module
 * directly. The app wires the real per-era map in once at startup via
 * `setTracksRawProvider`; every track-guide accessor that needs "all tracks
 * for this era" reads through this indirection instead.
 *
 * Defaults to an empty map so a renderer that never wires a provider (an
 * early mobile screen, or a unit test that injects its own data) degrades to
 * "no tracks" instead of crashing.
 */
let tracksRaw: Partial<Record<EraId, TrackNote[]>> = {};

export function setTracksRawProvider(byEra: Partial<Record<EraId, TrackNote[]>>): void {
  tracksRaw = byEra;
}

export function tracksRawProvider(): Partial<Record<EraId, TrackNote[]>> {
  return tracksRaw;
}
