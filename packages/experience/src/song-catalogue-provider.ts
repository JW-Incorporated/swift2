import type { SongMood } from './types';

/**
 * `mood-match.ts`'s default catalogue is `SONG_MOODS`, a generated file
 * (`apps/web/lib/longlive/song-moods.generated.ts`) built at sync time from
 * `supabase/seed/tracks/**` + `supabase/seed/song-moods/**` — the same
 * layering problem `thread-content-provider.ts` solves for thread content
 * (OS-021): `packages/experience` must never import an app-layer generated
 * module directly (the purity guard in eslint.config.mjs would reject it,
 * and mobile has no such file to import from). The app wires the real
 * catalogue in once at startup via `setDefaultSongCatalogue`; every
 * `matchMoods`/`scoredSongs` call that doesn't pass an explicit `catalogue`
 * reads through this indirection instead.
 *
 * Defaults to an empty catalogue so a renderer that never wires a provider
 * (an early mobile screen, or a unit test that always passes its own
 * `catalogue`) degrades to "no matches" instead of crashing.
 */
let catalogue: readonly SongMood[] = [];

export function setDefaultSongCatalogue(songs: readonly SongMood[]): void {
  catalogue = songs;
}

export function defaultSongCatalogue(): readonly SongMood[] {
  return catalogue;
}
