/**
 * Live sticky-chrome height — TopBar + FilterBar when mounted — the single
 * source of truth for every place on the page that needs to know how many
 * pixels of the viewport's top are covered by pinned UI. Before this, three
 * places each carried their own idea of that number: EraStream's jump-correct
 * loop scrolled a target's top edge to viewport y=0 with no compensation at
 * all, and a `HEADER_OFFSET = 64` constant was duplicated in both
 * TimelineScrubber and ThreadsTimeline — none of them FilterBar-aware, so an
 * era jump landed underneath the filter row and the scrubber's
 * reading-position reference line silently ignored it too (founder report,
 * 2026-08-14: "our scroll goes under the filters").
 *
 * TimelineScrubber's own root is `position: fixed` (SCRUBBER_SHELL_CLASS in
 * timelineScrubberLayout.ts) — it contributes 0 to TopBar's flow height, so
 * it needs no separate accounting here despite rendering inside TopBar in
 * era mode.
 */
export interface ChromeMeasurement {
  /** TopBar's own rendered height, or 0 if it isn't mounted. */
  topBarHeight: number;
  /** FilterBar's own rendered height, or 0 if it isn't mounted (e.g. Threads
   *  mode, where EraStream — and therefore FilterBar — never renders). */
  filterBarHeight: number;
}

/** Pure: total sticky chrome height from raw measurements. */
export function resolveChromeHeight({ topBarHeight, filterBarHeight }: ChromeMeasurement): number {
  return topBarHeight + filterBarHeight;
}

/**
 * Impure: measures the live DOM. The one place that queries
 * `[data-ll-topbar]` / `[data-ll-filterbar]` for this fact — every caller
 * that needs the chrome height goes through this instead of keeping its own
 * constant or DOM query.
 */
export function measureChromeHeight(): number {
  if (typeof document === 'undefined') return 0;
  const topBar = document.querySelector<HTMLElement>('[data-ll-topbar]');
  const filterBar = document.querySelector<HTMLElement>('[data-ll-filterbar]');
  return resolveChromeHeight({
    topBarHeight: topBar ? topBar.getBoundingClientRect().height : 0,
    filterBarHeight: filterBar ? filterBar.getBoundingClientRect().height : 0,
  });
}

/**
 * Impure: where the sticky chrome's bottom edge actually IS right now, in
 * viewport coordinates — the filter bar's own `getBoundingClientRect().bottom`
 * (falling back to the top bar's when no filter bar is mounted, e.g. Threads
 * mode). Unlike `measureChromeHeight()` above, which sums each piece's own
 * rendered height and so is only correct once every piece is stacked flush
 * against the viewport top, this reads a live position and stays correct
 * whether the filter bar is stuck or not — and whatever renders above it
 * (EraStream's masthead today, anything added later) needs no accounting
 * here at all, because we never sum; we just ask the DOM where the edge is.
 */
export function measureChromeBottom(): number {
  if (typeof document === 'undefined') return 0;
  const filterBar = document.querySelector<HTMLElement>('[data-ll-filterbar]');
  if (filterBar) return filterBar.getBoundingClientRect().bottom;
  const topBar = document.querySelector<HTMLElement>('[data-ll-topbar]');
  if (topBar) return topBar.getBoundingClientRect().bottom;
  return 0;
}
