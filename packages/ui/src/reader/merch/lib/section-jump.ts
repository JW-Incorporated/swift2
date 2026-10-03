/**
 * Long Live — the section-jump / depth-preview control's pure logic
 * (PLAN.md 2026-08-14 step 3, Joey: "you have no idea how much is down
 * there"). Chip labels/counts/summaries and the DOM-id contract that ties a
 * jump chip to the section it scrolls to all live here so it's unit tested,
 * and so `CommunitySection` (which owns the compact rail) and each pane
 * (which owns its own rest-state bar and renders the actual target sections)
 * derive the SAME ids from the SAME function — never two string templates
 * for one fact (docs/engineering-lessons.md's recurring defect).
 */

export interface JumpChip {
  id: string;
  label: string;
  /** Omitted only for action chips (e.g. "+ Suggest a link") — every content
   *  chip MUST carry a count; the count IS the depth preview. */
  count?: number;
  /** Optional 8px identity dot (merch era chips use their era's own accent). */
  dotColor?: string;
}

/** kebab-cases free text into a safe DOM id fragment. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export function communityPlatformSectionId(platform: string): string {
  return `community-platform-${slugify(platform)}`;
}

export function merchEraSectionId(eraId: string): string {
  return `merch-era-${eraId}`;
}

export function suggestLinkSectionId(section: 'community' | 'merch'): string {
  return `suggest-link-${section}`;
}

export function communitySummary(totalCount: number, platformCount: number): string {
  const communityWord = totalCount === 1 ? 'community' : 'communities';
  const platformWord = platformCount === 1 ? 'platform' : 'platforms';
  return `${totalCount} ${communityWord} · ${platformCount} ${platformWord}`;
}

export function merchSummary(totalCount: number, eraCount: number): string {
  // `totalCount` is a PRODUCT count (MERCH_CATALOGUE.shopTheLook.length /
  // MerchEraGroup.count), NOT a moment/look count — one moment's `products[]`
  // can hold several products, so "looks" would understate what actually
  // renders as cards (docs/engineering-lessons.md: "a count is only as good
  // as the method"). Always say "piece(s)" here.
  const pieceWord = totalCount === 1 ? 'piece' : 'pieces';
  const eraWord = eraCount === 1 ? 'era' : 'eras';
  return `${totalCount} ${pieceWord} · ${eraCount} ${eraWord}`;
}

/** Descending by count, stable tie-break by label so equal counts render deterministically. */
export function sortChipsByCountDesc(chips: readonly JumpChip[]): JumpChip[] {
  return [...chips].sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.label.localeCompare(b.label));
}

/**
 * Community platform groups (as returned by `communitiesByPlatform()`) to
 * jump chips, always sorted by descending count — today's render order is
 * arbitrary data-file order, which the jump index must not inherit.
 */
export function communityGroupsToChips(
  groups: Iterable<readonly [string, { readonly length: number }]>,
): JumpChip[] {
  const chips: JumpChip[] = [];
  for (const [platform, list] of groups) {
    chips.push({ id: communityPlatformSectionId(platform), label: platform, count: list.length });
  }
  return sortChipsByCountDesc(chips);
}

/**
 * Merch era groups (as returned by `merchByEra()`, already newest-first) to
 * jump chips. `accentOf` reads each era's own accent from `ERAS` theme data
 * — never a literal — for the chip's 8px identity dot.
 */
export function merchGroupsToChips(
  groups: readonly { eraId: string; eraLabel: string; count: number }[],
  accentOf: (eraId: string) => string,
): JumpChip[] {
  return groups.map((g) => ({
    id: merchEraSectionId(g.eraId),
    label: g.eraLabel,
    count: g.count,
    dotColor: accentOf(g.eraId),
  }));
}

/**
 * Pure: where the browser should scroll a target's top edge to, so it lands
 * just below the live sticky chrome instead of underneath it.
 */
export function scrollTargetY(elementTop: number, currentScrollY: number, offsetPx: number): number {
  return Math.max(0, elementTop + currentScrollY - offsetPx);
}
