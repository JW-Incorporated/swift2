// Era-tag inference for the social photo library — the single source of truth
// for "which era does this photo belong to".
//
// Extracted from source-reddit-photos.mjs (issue #6644). The keyword list used
// to live inside that sourcing adapter, which meant an era tag was only ever
// applied at INGEST time: every photo already in social/photo-library.json
// when a new era joined the list kept its generic `fan-photo`/`eras-tour` tags
// forever, and `select-photo.mjs --era <slug>` hard-failed for that era. The
// Showgirl era had eight eligible photos in the library and zero tagged.
// backfill-era-tags.mjs re-applies this list to entries already in the
// library; the adapter imports it so there is still exactly one list.
//
// Slugs match `supabase/seed/eras-data.mjs`'s canonical era slugs (NOT
// packages/experience/src/eras.ts's short site ids `ttpd`/`tloas`) — the
// library's tags and `select-photo.mjs --era` both speak the seed slug.
//
// `source-wikimedia-photos.mjs` keeps its OWN, stricter variant of this list,
// deliberately: Commons titles/descriptions are curated prose, so it can
// demand e.g. "1989 world tour" rather than a bare "1989 tour". Left alone on
// purpose — loosening it would change what that adapter accepts at ingest.
// The backfill below runs this (looser) list over the stored library, which is
// how five "Taylor Swift 1989 Tour at Ford Field" Commons photos that the
// stricter regex skipped finally got their `1989` tag.
//
// A title must contain an unambiguous album/tour-name signal to earn an era
// tag. NEVER inferred from outfit color, venue, or any other indirect signal:
// a wrong era tag is worse than no era tag at all (an off-era photo would ship
// on a themed post — the exact failure `select-photo.mjs --era`'s
// hard-fail-closed filter exists to prevent).

export const ERA_KEYWORD_HINTS = [
  { era: 'debut', re: /\b(debut era|taylor swift \(album\)|self[- ]titled album)\b/i },
  { era: 'fearless', re: /\bfearless\b/i },
  { era: 'speak-now', re: /\bspeak now\b/i },
  { era: 'red', re: /\bred (era|tour|act)\b/i },
  { era: '1989', re: /\b1989\s*(era|tour|act)\b/i },
  { era: 'reputation', re: /\breputation\b/i },
  { era: 'lover', re: /\blover (era|fest|tour|act)\b/i },
  { era: 'folklore', re: /\bfolklore\b/i },
  { era: 'evermore', re: /\bevermore\b/i },
  { era: 'midnights', re: /\bmidnights?\b/i },
  { era: 'tortured-poets', re: /\b(tortured poets|ttpd)\b/i },
  { era: 'the-life-of-a-showgirl', re: /\b(life of a showgirl|tloas|showgirl)\b/i },
];

/** Every era slug this module can assign — used to detect an already-era'd entry. */
export const ERA_TAG_SLUGS = ERA_KEYWORD_HINTS.map((hint) => hint.era);

/** Best-effort era slug from a post title / alt text's explicit album/tour-name mention. */
export function guessEraTag(title) {
  for (const hint of ERA_KEYWORD_HINTS) {
    if (hint.re.test(title ?? '')) return hint.era;
  }
  return null;
}

/** The era slug already on a library entry's `tags`, or null when it has none. */
export function eraTagOf(entry) {
  const tags = Array.isArray(entry?.tags) ? entry.tags : [];
  return tags.find((tag) => ERA_TAG_SLUGS.includes(tag)) ?? null;
}

/**
 * The era tag a library entry is MISSING, inferred from its own `alt` text, or
 * null when it needs nothing.
 *
 * Only ever ADDS a tag to an entry that carries no era slug at all — an entry
 * whose era was already decided (by the sourcing adapter, by seed data, or by
 * a human) is never re-classified. That rule is load-bearing, not caution:
 * several site photos tagged `1989` describe the reputation Stadium Tour in
 * their alt text, so text inference would happily overwrite a correct era with
 * a wrong one.
 */
export function missingEraTag(entry) {
  if (eraTagOf(entry)) return null;
  return guessEraTag(entry?.alt ?? '');
}

/**
 * `entry.tags` with its inferred era tag prepended, or null when unchanged.
 *
 * Era FIRST, matching the library's existing convention (`["1989",
 * "eras-tour", "inglewood"]`) and what `photo-coverage.mjs` reports as a
 * photo's era (it tallies `tags[0]`) — an era tag appended last is invisible
 * to the coverage report that exists to show which eras are starved.
 */
export function withEraTag(entry) {
  const era = missingEraTag(entry);
  if (!era) return null;
  return [era, ...(Array.isArray(entry?.tags) ? entry.tags : [])];
}
