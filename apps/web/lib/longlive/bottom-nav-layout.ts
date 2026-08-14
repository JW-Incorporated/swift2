/**
 * Pure layout logic for BottomNav (PLAN.md P4 step 18, R3). Kept out of the
 * component and out of React entirely so vitest (node, no component tests)
 * can cover the label-vs-icon-only rule directly: four labelled tabs fit a
 * 390px phone, six do not — the bar must degrade to icon-only rather than
 * overflow or wrap once Marketplace and Community land (R3).
 */

export interface BottomNavEntry {
  id: string;
  label: string;
}

export type BottomNavTab<T extends BottomNavEntry> = T & {
  /** True once the tab count is too high to keep every label on-screen. */
  iconOnly: boolean;
};

/** At and above this many tabs, labels come off and only icons remain. */
export const BOTTOM_NAV_ICON_ONLY_THRESHOLD = 5;

/**
 * Decide, for the whole bar at once, whether tabs render icon+label or
 * icon-only. Same answer for every tab in a given call — a mixed bar (some
 * labelled, some not) would read as broken, not adaptive.
 */
export function layoutBottomNavTabs<T extends BottomNavEntry>(
  entries: readonly T[],
): BottomNavTab<T>[] {
  const iconOnly = entries.length >= BOTTOM_NAV_ICON_ONLY_THRESHOLD;
  return entries.map((entry) => ({ ...entry, iconOnly }));
}
