import keys from './lyric-track-keys.json';

const KEYS = keys as Record<string, string>;

/** Maps a `lyrics.slug` (TrackNote.slug) to the site's composite trackKey (`${era}::n::title`), or null if unknown. */
export function trackKeyForLyricSlug(slug: string): string | null {
  return Object.hasOwn(KEYS, slug) ? KEYS[slug]! : null;
}
