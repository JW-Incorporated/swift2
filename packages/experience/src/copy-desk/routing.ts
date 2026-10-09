// Copy desk routing (docs/specs/2026-07-11-persona-authors-copy-desk.md §3).
// Authorship is a pure function of (surface, category/kind, optional override):
// derived, never stored. Plain erasable TypeScript so node scripts can import
// it directly (scripts/copy-desk/routing.mjs re-exports it).

export const PERSONA_SLUGS = ['theo', 'loren', 'vera', 'deb'] as const;
export type PersonaSlug = (typeof PERSONA_SLUGS)[number];

/** Site chrome copy is unsigned house voice, credited to the desk as a whole. */
export type AuthorSlug = PersonaSlug | 'house';

export type RouteSurface =
  | 'month_item'
  | 'track_note'
  | 'theory'
  | 'video_work'
  | 'release'
  | 'tour'
  | 'chrome';

// Mirrors the month_item.category CHECK (supabase/migrations/
// 20260708150000_videos_theories_tours_releases.sql).
const MONTH_ITEM: Record<string, PersonaSlug> = {
  sighting: 'vera',
  fashion: 'vera',
  relationship: 'deb',
  business: 'deb',
  tour: 'deb',
  music: 'theo',
  release: 'theo',
  video: 'theo',
};

// Mirrors VIDEO_KINDS in packages/shared/src/vault-types.ts. The spec names
// music_video/lyric_video/live -> Theo and tour_film/documentary -> Deb; the
// remaining real kinds follow the nearer beat (works -> Theo, appearances -> Deb).
const VIDEO_WORK: Record<string, PersonaSlug> = {
  music_video: 'theo',
  lyric_video: 'theo',
  short_film: 'theo',
  performance: 'theo',
  tour_film: 'deb',
  documentary: 'deb',
  interview: 'deb',
  award_speech: 'deb',
  speech: 'deb',
  press_event: 'deb',
};

const SURFACE_DEFAULT: Partial<Record<RouteSurface, AuthorSlug>> = {
  track_note: 'theo',
  theory: 'loren',
  release: 'theo',
  tour: 'deb',
  chrome: 'house',
};

export function isPersonaSlug(value: unknown): value is PersonaSlug {
  return typeof value === 'string' && (PERSONA_SLUGS as readonly string[]).includes(value);
}

/**
 * Default author for a surface. `override` (a seed item's explicit `author`)
 * wins when it is a real persona slug. Throws on an unroutable surface or
 * category so validate-content fails loudly instead of defaulting silently.
 */
export function routeAuthor({
  surface,
  category,
  override,
}: {
  surface: RouteSurface;
  category?: string | null;
  override?: string | null;
}): AuthorSlug {
  if (override != null) {
    if (!isPersonaSlug(override)) throw new Error(`unknown author override "${override}"`);
    return override;
  }
  if (surface === 'month_item' || surface === 'video_work') {
    const table = surface === 'month_item' ? MONTH_ITEM : VIDEO_WORK;
    const hit = category != null ? table[category] : undefined;
    if (!hit) throw new Error(`no author route for ${surface} category "${category}"`);
    return hit;
  }
  const fixed = SURFACE_DEFAULT[surface];
  if (!fixed) throw new Error(`no author route for surface "${surface}"`);
  return fixed;
}
