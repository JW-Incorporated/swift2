/**
 * Marker layout for the Crossings shared axis (#701, WCAG 2.5.8 Target Size).
 * The crossing diamonds all render at the same x position, so crossings close
 * in time stack vertically — safe clickable space between neighbours measured
 * as low as 0px. 2.5.8's spacing exception needs marker centres ≥24px apart.
 * Only the tappable diamonds get nudged; connectors keep the true dates.
 */

export const MIN_MARKER_GAP_PX = 24;

type Cluster = { count: number; sumAdjusted: number; start: number };

/**
 * 1-D collision pass: takes each marker's raw `top` (% of the rail), returns
 * nudged percentages in the same order. Neighbours end ≥ `minGapPx` apart,
 * date order is preserved, and stacked groups spread symmetrically around
 * their true midpoint (least-squares placement), clamped to the rail.
 */
export function resolveCrossingMarkerTops(
  rawTopPcts: readonly number[],
  railHeightPx: number,
  minGapPx: number = MIN_MARKER_GAP_PX,
): number[] {
  if (rawTopPcts.length <= 1) return [...rawTopPcts];
  const gap = (minGapPx / railHeightPx) * 100;
  const order = rawTopPcts.map((_, i) => i).sort((a, b) => rawTopPcts[a] - rawTopPcts[b] || a - b);

  // Cluster merge (1-D label placement): a cluster puts its k markers at
  // start, start+gap, …; least-squares start = mean(p_j − j·gap). Merging on
  // overlap centres stacks on their true midpoint instead of cascading down.
  const clusters: Cluster[] = [];
  for (const idx of order) {
    let cur: Cluster = { count: 1, sumAdjusted: rawTopPcts[idx], start: rawTopPcts[idx] };
    while (clusters.length > 0) {
      const prev = clusters[clusters.length - 1];
      if (cur.start >= prev.start + prev.count * gap) break;
      clusters.pop();
      const count = prev.count + cur.count;
      // cur's markers sit prev.count slots further down the merged ladder.
      const sumAdjusted = prev.sumAdjusted + cur.sumAdjusted - prev.count * gap * cur.count;
      cur = { count, sumAdjusted, start: sumAdjusted / count };
    }
    // Keep the ladder on the rail; if the rail is ever too full to hold
    // everything, separation wins over the bottom edge (a11y guarantee).
    cur.start = Math.min(Math.max(cur.start, 0), Math.max(0, 100 - (cur.count - 1) * gap));
    const prev = clusters[clusters.length - 1];
    if (prev) cur.start = Math.max(cur.start, prev.start + prev.count * gap);
    clusters.push(cur);
  }

  const out = new Array<number>(rawTopPcts.length);
  let cursor = 0;
  for (const cluster of clusters) {
    for (let j = 0; j < cluster.count; j += 1) out[order[cursor + j]] = cluster.start + j * gap;
    cursor += cluster.count;
  }
  return out;
}
