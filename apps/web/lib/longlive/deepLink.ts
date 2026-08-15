/**
 * Deep-link routing decision for the front door (#684; R1, PLAN.md
 * 2026-08-14 — the front door is now the era stream itself, not a separate
 * landing page).
 *
 * The era stream is the front door for every fresh load, but a shared URL
 * must land the visitor on the shared thing, not the front door. This pure
 * helper decides which — kept out of the store so the precedence rules
 * (most specific wins) are unit-testable.
 *
 * Precedence (#707 — every immersive overlay is now shareable, so every
 * overlay needs a param that reopens it; #2105 added `mode` for the five
 * surfaces that have no more specific "thing" to address):
 *   item > song > guide > theories > lens > mode > era
 * Most specific first: a `?song=` opens the song dossier *stacked on top of*
 * its album's track guide, so it must outrank a bare `?guide=`; both outrank
 * the era stream underneath. `mode` sits just above the era fallback — it
 * addresses a whole surface (the Threads gallery, Mood, Clownbot, Community,
 * or Merch), never anything more specific than that. Exactly one param is
 * ever present on a shared URL, but the order keeps the helper total when a
 * URL is hand-mangled.
 */

export type DeepLinkTarget =
  | { kind: 'item'; id: string }
  | { kind: 'song'; key: string }
  | { kind: 'guide'; eraId: string }
  | { kind: 'theories'; eraId: string }
  | { kind: 'lens'; id: string }
  | { kind: 'mode'; mode: 'threads' | 'mood' | 'clownbot' | 'community' | 'merch' }
  | { kind: 'era'; id: string }
  | null;

const MODE_VALUES = new Set(['threads', 'mood', 'clownbot', 'community', 'merch']);

export function deepLinkTarget(search: string, validLensIds: readonly string[]): DeepLinkTarget {
  const params = new URLSearchParams(search);
  const item = params.get('item');
  if (item) return { kind: 'item', id: item };
  // Song dossier: the whole composite trackKey (`${eraId}::${n}::${title}`)
  // rides in the param, so it carries its own era — the store resolves it.
  const song = params.get('song');
  if (song) return { kind: 'song', key: song };
  const guide = params.get('guide');
  if (guide) return { kind: 'guide', eraId: guide };
  const theories = params.get('theories');
  if (theories) return { kind: 'theories', eraId: theories };
  const lens = params.get('lens');
  if (lens && validLensIds.includes(lens)) return { kind: 'lens', id: lens };
  // #2105 — Threads gallery, Mood, Clownbot, Community, and Merch each carry
  // no user input, so the whole surface (not any one thing on it) is the
  // shareable target.
  const mode = params.get('mode');
  if (mode && MODE_VALUES.has(mode)) {
    return { kind: 'mode', mode: mode as 'threads' | 'mood' | 'clownbot' | 'community' | 'merch' };
  }
  const era = params.get('era');
  if (era) return { kind: 'era', id: era };
  return null;
}
