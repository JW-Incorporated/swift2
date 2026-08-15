/**
 * Pure layout logic for BottomNav (PLAN.md P4 step 18, R3). Kept out of the
 * component and out of React entirely so vitest (node, no component tests)
 * can cover the label-vs-icon-only rule directly.
 *
 * Measured 2026-08-15 in a real Chromium render at 390x844 and 360x640
 * (Playwright, dev server): all six of today's real tabs (Eras, Threads,
 * Mood, Clownbot, Community, Merch) fit labelled at both widths once the
 * label size dropped from 11px to 10px — worst case ("Community" at 360px)
 * has a 4px margin, single line, no clip. At the old 11px size, six labels
 * fit at 390px (3px margin) but "Community" clipped by 2px at 360px. See
 * the fix/bottom-nav-labels PR for the full measurement table. The bar
 * still needs to degrade to icon-only rather than overflow or wrap if a
 * seventh tab is ever added — that case is unmeasured.
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
export const BOTTOM_NAV_ICON_ONLY_THRESHOLD = 7;

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
