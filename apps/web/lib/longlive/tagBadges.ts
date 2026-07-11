import type { ContentTag } from './types';
import { ALL_TAGS } from './tags';

/**
 * Fixed, era-accent-independent color per content tag — the "category badge"
 * treatment specced in docs/marketing/content-framework-2026-07-03.md §4 +
 * addendum ("fixed 7-color chip set... not era-accent-dependent"), mapped onto
 * this app's actual tag taxonomy. (The live content model tags each
 * `ContentItem` with `ContentTag[]` — Music/Fashion/Tour/Relationship/Lore,
 * see types.ts — not the DB's 7-value `VaultCategory` CHECK-constraint enum
 * the doc was written against; that schema-driven model was never wired up to
 * this reader, see EraSection.tsx's module comment.)
 *
 * One stable color per tag so a lore-diver can pattern-match "Fashion" by its
 * pink chip in any era, the opposite of the old era-accent-tinted treatment.
 * Every value is a mid-dark, saturated hue that clears WCAG AA (>= 4.5:1)
 * against white text — badges render as a solid pill, white-on-color, so
 * contrast holds on every era surface (light or dark).
 */
export const TAG_COLORS: Record<ContentTag, string> = {
  Music: '#047857', // emerald
  Fashion: '#be185d', // pink
  Tour: '#6d28d9', // violet
  Relationship: '#b91c1c', // red
  Lore: '#b45309', // amber
};

/**
 * Does an item pass the active per-era tag filter?
 *
 * An empty active set means "filter off" — everything shows (the default,
 * collapsed state). Otherwise an item shows if ANY of its tags is selected:
 * a single moment can carry more than one tag (e.g. a look that's both
 * Fashion- and Relationship-coded), so filtering is "matches at least one
 * selected chip," not "matches all of them."
 */
export function itemMatchesFilter(tags: ContentTag[], active: ReadonlySet<ContentTag>): boolean {
  return active.size === 0 || tags.some((t) => active.has(t));
}

/**
 * The tags actually present across a set of items, in canonical taxonomy
 * order (`ALL_TAGS`) — so an era's filter only offers chips for tags its
 * content actually uses (no "Tour" chip in an era with zero tour items), and
 * chip order is stable across eras.
 */
export function tagsPresent(tagLists: Iterable<ContentTag[]>): ContentTag[] {
  const present = new Set<ContentTag>();
  for (const tags of tagLists) {
    for (const t of tags) present.add(t);
  }
  return ALL_TAGS.filter((t) => present.has(t));
}
