import type { VaultCategory } from '@swift2/shared';
import { VAULT_CATEGORIES } from '@swift2/shared';

/**
 * View-layer styling for the 7-category taxonomy. Lives in the app (not
 * `@swift2/shared`) on purpose: colors/icons are presentation, and the shared
 * package stays I/O- and view-free per the architecture boundary.
 *
 * Each category gets ONE stable icon + ONE fixed color, deliberately
 * independent of the per-era accent so a category reads the same across every
 * era's re-skin (a lore-diver can pattern-match "fashion" by its pink chip no
 * matter which era they're scrolling through).
 *
 * Contrast: badges render as a *filled* pill using `color` as the background
 * with white text, so legibility is white-on-`color` — fixed regardless of the
 * era surface underneath (light themes like `#ffffff` or dark like `#161616`).
 * Every color below is a mid-dark hue that clears WCAG AA (>= 4.5:1) against
 * white text, and each saturated fill stays clearly visible on both light and
 * dark card surfaces.
 */
export interface CategoryBadge {
  /** Emoji icon shown in the badge and filter chip. */
  icon: string;
  /** Human-readable, accessible label (also the visible chip text). */
  label: string;
  /** Fixed chip fill color (era-accent-independent). White text passes AA on it. */
  color: string;
}

export const CATEGORY_BADGES: Record<VaultCategory, CategoryBadge> = {
  sighting: { icon: '📸', label: 'Sighting', color: '#1d4ed8' }, // blue
  fashion: { icon: '👗', label: 'Fashion', color: '#be185d' }, // pink
  relationship: { icon: '💕', label: 'Relationship', color: '#b91c1c' }, // red
  tour: { icon: '🎤', label: 'Tour', color: '#6d28d9' }, // violet
  business: { icon: '💼', label: 'Business', color: '#b45309' }, // amber
  music: { icon: '🎵', label: 'Music', color: '#047857' }, // emerald
  release: { icon: '💿', label: 'Release', color: '#0e7490' }, // cyan
  video: { icon: '🎬', label: 'Video', color: '#86198f' }, // fuchsia
};

/**
 * Does a category pass the active per-era filter?
 *
 * An empty active set means "filter off" — everything shows (the default).
 * Otherwise an item shows only if its category is one of the selected ones.
 * Pure and platform-agnostic, so it's unit-tested directly.
 */
export function itemMatchesFilter(
  category: VaultCategory,
  active: ReadonlySet<VaultCategory>,
): boolean {
  return active.size === 0 || active.has(category);
}

/**
 * The categories actually present in a set of items, in canonical taxonomy
 * order — so an era's filter only offers chips for content it contains (no
 * "fashion" chip in an era with zero fashion items) and the chip order is
 * stable across eras.
 */
export function categoriesPresent(categories: Iterable<VaultCategory>): VaultCategory[] {
  const present = new Set(categories);
  return VAULT_CATEGORIES.filter((c) => present.has(c));
}
