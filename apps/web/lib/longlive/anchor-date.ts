/**
 * Anchor resolution for undated items — pure, tested.
 *
 * Every card on an era timeline needs a SORT position, but not every card has
 * an authored date. `resolveAnchor` picks the best available signal, in order
 * of trust: an exact authored date, a date borrowed from a related item, a
 * date borrowed from a related song's release, and — last resort — a
 * deterministic, id-derived position scattered across the era's own span.
 * Only the first of those may ever be shown to a reader; the rest exist to
 * place a card, never to claim a fact.
 */

/** How a sort position was arrived at. Drives whether a date may be SHOWN. */
export type AnchorSource =
  | 'exact' // the item has a real, authored date
  | 'related-item' // borrowed from a moment it references
  | 'related-song' // borrowed from a song/album release date
  | 'era-scatter' // last resort: a stable, id-derived position in the era's span
  | 'clamped'; // a real, exact date that fell outside the era's window and was
  // pulled to the nearest boundary (PLAN.md P3 step 14a) — still a real date
  // internally, but no longer trustworthy enough to print, so displayDate is
  // null exactly as for every other non-exact source.

export type Anchored = {
  /** Always present. Sorting only. NEVER rendered as fact. */
  sortDate: string; // YYYY-MM-DD
  /** Present only when `via === 'exact'`. Null means render no date. */
  displayDate: string | null;
  via: AnchorSource;
};

/**
 * A stable 32-bit hash of a string (FNV-1a). Deterministic across renders AND
 * across builds — no `Math.random`, no `Date.now` — so the same id always
 * hashes to the same number, which is exactly what a stable scatter position
 * needs (§ Plan amendments — 'era-midpoint' gave every undated item in an era
 * the same sort key and they clumped; this must not repeat that mistake).
 */
function hashId(id: string): number {
  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV-1a 32-bit prime
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * A deterministic position for `id` somewhere inside [start, end] (inclusive
 * ISO YYYY-MM-DD dates), computed in UTC so the result never shifts with the
 * machine's local timezone. Same id always yields the same date; different
 * ids spread across the whole span (day granularity) instead of clumping on
 * one value. When `start === end` (an era with no real span, e.g. `eraEnd`
 * collapsed to `eraStart` for the current era — see `resolveAnchor` below)
 * there is only one legal position, so every id resolves to `start`.
 */
function scatterDate(start: string, end: string, id: string): string {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const spanDays = Math.floor((endMs - startMs) / 86_400_000);
  if (spanDays <= 0) return start;
  const dayOffset = hashId(id) % (spanDays + 1);
  return new Date(startMs + dayOffset * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Resolve one item's sort anchor. The honesty rule, non-negotiable:
 * `displayDate` is null unless `via === 'exact'` — a synthetic anchor
 * positions a card and is never printed as a date.
 *
 * `id` is a stable tiebreak so two anchors landing on the same `sortDate`
 * order deterministically downstream, wherever multiple resolved anchors are
 * compared against each other — see `mergeEraFeed` in `era-feed.ts`. It also
 * IS the scatter input for `era-scatter`, below: the same id that breaks a
 * tie is what makes an id's fallback position stable and distinct from every
 * other undated item's.
 */
export function resolveAnchor(input: {
  exactDate?: string | null;
  relatedItemDate?: string | null;
  relatedSongDate?: string | null;
  eraStart: string;
  eraEnd: string | null;
  /** Stable tiebreak so equal anchors order deterministically. */
  id: string;
}): Anchored {
  if (input.exactDate) {
    return { sortDate: input.exactDate, displayDate: input.exactDate, via: 'exact' };
  }
  if (input.relatedItemDate) {
    return { sortDate: input.relatedItemDate, displayDate: null, via: 'related-item' };
  }
  if (input.relatedSongDate) {
    return { sortDate: input.relatedSongDate, displayDate: null, via: 'related-song' };
  }
  return {
    // eraEnd can be null for the current era (its authored end date hasn't
    // happened yet — era-feed.ts and EraSection.tsx already treat that as
    // "cap at what exists so far"); collapsing to eraStart here is the same
    // call scatterDate documents for start === end: one legal position.
    sortDate: scatterDate(input.eraStart, input.eraEnd ?? input.eraStart, input.id),
    displayDate: null,
    via: 'era-scatter',
  };
}
