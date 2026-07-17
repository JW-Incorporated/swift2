/**
 * Deep-link routing decision for the landing page (#684).
 *
 * The landing page is the front door for every fresh load, but a shared URL
 * must land the visitor on the shared thing, not the front door. This pure
 * helper decides which — kept out of the store so the precedence rules
 * (item > lens > era, invalid lens falls through) are unit-testable.
 */

export type DeepLinkTarget =
  { kind: 'item'; id: string } | { kind: 'lens'; id: string } | { kind: 'era'; id: string } | null;

export function deepLinkTarget(search: string, validLensIds: readonly string[]): DeepLinkTarget {
  const params = new URLSearchParams(search);
  const item = params.get('item');
  if (item) return { kind: 'item', id: item };
  const lens = params.get('lens');
  if (lens && validLensIds.includes(lens)) return { kind: 'lens', id: lens };
  const era = params.get('era');
  if (era) return { kind: 'era', id: era };
  return null;
}
