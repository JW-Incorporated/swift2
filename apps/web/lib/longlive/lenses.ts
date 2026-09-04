import { getEra } from './eras';
import { contentForThread } from './threads';
import type { EggNode, LensId, Motif, MotifId, ThreadMeta } from './types';
// Generated from supabase/seed/lenses/*.mjs by scripts/sync-longlive-lenses.mjs
// (Fable 5.1 architecture review, R12) — the same generated-file pattern as
// merch.ts (R11) and content-ids (R10). Do not import supabase/seed/** directly
// from app code; regenerate instead (`npm run sync:content` / `npm run check:generated`).
import {
  CLUE_PAIRS,
  EGG_LINKS,
  EGG_NODES,
  MOTIFS,
  RERECORDS,
  RELATIONSHIPS,
  RUNWAY_LOOKS,
  SINGLE_PERIODS,
  THREADS,
} from './lenses.generated';
export type { CluePair, EggLink, EggNode, Motif, ReRecord, Relationship, RunwayLook, SinglePeriod, ThreadMeta } from './types';
export { CLUE_PAIRS, EGG_LINKS, EGG_NODES, MOTIFS, RERECORDS, RELATIONSHIPS, RUNWAY_LOOKS, SINGLE_PERIODS, THREADS };

/**
 * Cross-era Lens datasets. Names and details are the widely-discussed fan
 * narratives, framed as an independent fan project (not confirmed fact).
 */

export function getThread(id: LensId): ThreadMeta {
  return THREADS.find((t) => t.id === id) ?? THREADS[0];
}

/** One face in a thread's grid hero. */
export interface ThreadHeroTile {
  /** The relationship this portrait belongs to. */
  id: string;
  name: string;
  url: string;
  alt: string;
  /** Photographer + licence — a licence condition on the CC BY / CC BY-SA ones. */
  credit: string;
}

/**
 * The "wall of names" hero (Joey, 2026-08-13, option B2): a thread whose
 * subject is a *set* of people gets a grid of their portraits instead of one
 * photo, so no single person becomes the face of the thread.
 *
 * Derived from `RELATIONSHIPS`, never hand-listed — the grid is the thread's
 * own data, so adding or re-photographing a relationship updates the card for
 * free. Two honest omissions, both structural rather than editorial:
 *   - the ONGOING relationship is excluded (`end === null`) — Blank Spaces is
 *     the eras *before* him, and End Game is his card;
 *   - anyone with no portrait in the data is skipped, which today means Conor
 *     Kennedy (deliberately unphotographed, privacy-redlines #5). That is why
 *     the grid shows eight faces against a kicker that says nine names: the
 *     count in the copy is the relationships, not the photographs.
 *
 * Returns `[]` for every other thread; callers fall back to `meta.hero`.
 */
export function threadHeroTiles(id: LensId): ThreadHeroTile[] {
  if (id !== 'love-story') return [];
  return RELATIONSHIPS.filter((r) => r.end !== null && r.image).map((r) => ({
    id: r.id,
    name: r.name,
    url: r.image!.url,
    alt: r.image!.alt,
    credit: r.image!.credit,
  }));
}

/**
 * How many columns a grid hero lays its tiles out in — always two rows, so a
 * card-shaped box gets card-shaped tiles.
 *
 * Derived from the tile count rather than hard-coded, because the tiles
 * themselves are derived: hard-coding four columns is tidy only while the data
 * happens to hold eight portraits, and the moment a ninth is added (giving
 * Conor Kennedy a photo would do it) a fixed four-column grid becomes three
 * rows with one face and three holes. The component pairs this with a widened
 * last tile when the count is odd, so the wall stays solid at any count.
 */
export function heroGridColumns(tileCount: number): number {
  return Math.max(1, Math.ceil(tileCount / 2));
}

/**
 * The credit line to render under a thread's hero: the tile credits when it
 * has a grid hero, otherwise the single photo's credit. Undefined for the era-
 * art heroes, which are album art and carry no photographer.
 *
 * Rendered on the thread DETAIL header only, deliberately. The gallery card
 * also displays the portraits, and CC BY / CC BY-SA attribution is a licence
 * condition wherever a work is shown — but eight photographer credits do not
 * fit a card whose text block already fills 246 of its 262 phone pixels, and
 * truncating an attribution is worse than placing it one tap away. So the
 * gallery shows the art as a thumbnail and the credit renders in full the
 * moment the thread opens. If a card ever displays a licensed photo WITHOUT a
 * detail view behind it, that reasoning does not carry — credit it in place.
 */
export function threadHeroCredit(id: LensId): string | undefined {
  const tiles = threadHeroTiles(id);
  if (tiles.length > 0) {
    return `Portraits: ${tiles.map((t) => `${t.name} — ${t.credit}`).join('; ')}. Via Wikimedia Commons.`;
  }
  return getThread(id).heroCredit;
}

/**
 * Where the credit line links to: the single photo's Commons page, or nothing
 * for a grid hero (whose credit names several photos and so has no one target)
 * and for the era-art fallback. Paired with `threadHeroCredit` at the render
 * site so a licence's attribution URI actually reaches the page.
 */
export function threadHeroSourceUrl(id: LensId): string | undefined {
  if (threadHeroTiles(id).length > 0) return undefined;
  return getThread(id).heroSourceUrl;
}

/** A single dated point on a thread's career-spanning timeline. */
export interface ThreadPoint {
  date: string;
  eraId: string;
  label: string;
}

/**
 * Date-tagged points for a thread, used to render its career-wide density
 * ridge and era-colored ticks. Each thread maps its own dataset onto a shared
 * 2006→now axis.
 */
export function threadPoints(id: LensId): ThreadPoint[] {
  switch (id) {
    case 'love-story':
      return RELATIONSHIPS.flatMap((r) =>
        r.eraIds.map((eraId, i) => ({
          // The relationship's real start date only applies to the era it
          // began in; later eras it spans get plotted at that era's own
          // start, since that's the earliest point it's known to overlap.
          date: i === 0 ? r.start : getEra(eraId).start,
          eraId,
          label: r.name,
        })),
      );
    case 'fashion':
      return RUNWAY_LOOKS.map((l) => ({
        date: getEra(l.eraId).start,
        eraId: l.eraId,
        label: l.name,
      }));
    case 'taylors-version': {
      const pts: ThreadPoint[] = [];
      for (const r of RERECORDS) {
        pts.push({ date: `${r.originalYear}-01-01`, eraId: eraForYear(r.originalYear), label: `${r.album} (original)` });
        if (r.reclaimedYear)
          pts.push({ date: `${r.reclaimedYear}-06-01`, eraId: eraForYear(r.reclaimedYear), label: `${r.album} (Taylor's Version)` });
      }
      return pts;
    }
    case 'easter-eggs':
      return EGG_NODES.map((n) => ({
        date: `${n.year}-06-01`,
        eraId: n.eraId,
        label: n.label,
      }));
    case 'hidden-clues':
      return CLUE_PAIRS.flatMap((c) => [
        { date: c.plant.date, eraId: c.plant.eraId, label: `${c.title} (planted)` },
        { date: c.payoff.date, eraId: c.payoff.eraId, label: `${c.title} (payoff)` },
      ]);
    case 'the-proposal':
      // Derived (stage 3, 2026-07-19): markers come from the tagged moments
      // themselves — the same source the thread page renders from.
      return contentForThread('the-proposal').map((item) => ({
        date: item.date,
        eraId: item.eraId,
        label: item.title,
      }));
    default:
      return [];
  }
}

/**
 * Narrative threads that live on the career axis (excludes the clue mini-apps,
 * which have their own spatial UI). These are the threads offered in the era
 * pivot strip and the Crossings overlay.
 */
export const CROSSING_THREADS: LensId[] = ['love-story', 'fashion', 'taylors-version', 'the-proposal'];

/** Threads with at least one dated point inside the given era, with counts. */
export function threadsInEra(eraId: string): { id: LensId; count: number }[] {
  return CROSSING_THREADS.map((id) => ({
    id,
    count: threadPoints(id).filter((p) => p.eraId === eraId).length,
  })).filter((t) => t.count > 0);
}

/** A moment where two threads have points near each other in time. */
export interface Crossing {
  /** Midpoint of the two dates, in ms — used to place the marker on the axis. */
  date: number;
  /** Era that owns the crossing (taken from thread A's point). */
  eraId: string;
  a: ThreadPoint;
  b: ThreadPoint;
  /** Absolute distance between the two points, in days. */
  gapDays: number;
}

/**
 * Find where two threads cross: pairs of points (one from each) that fall within
 * `windowDays` of each other. This is what powers the intersection overlay —
 * e.g. a fashion shift landing at the same time a relationship begins.
 */
export function threadCrossings(a: LensId, b: LensId, windowDays = 210): Crossing[] {
  if (a === b) return [];
  const pa = threadPoints(a);
  const pb = threadPoints(b);
  const windowMs = windowDays * 86_400_000;
  const out: Crossing[] = [];
  for (const x of pa) {
    const xt = new Date(x.date).getTime();
    for (const y of pb) {
      const yt = new Date(y.date).getTime();
      const gap = Math.abs(xt - yt);
      if (gap <= windowMs) {
        out.push({ date: (xt + yt) / 2, eraId: x.eraId, a: x, b: y, gapDays: Math.round(gap / 86_400_000) });
      }
    }
  }
  return out.sort((m, n) => n.date - m.date);
}

/** Best-effort era for a bare year (used by the reclamation timeline). */
function eraForYear(year: number): string {
  const ms = new Date(`${year}-06-01`).getTime();
  // Import-light: rely on getEra via a scan of known eras through RUNWAY_LOOKS.
  const candidates = RUNWAY_LOOKS.map((l) => getEra(l.eraId));
  let best = candidates[0];
  for (const e of candidates) {
    if (new Date(e.start).getTime() <= ms) best = e;
  }
  return best?.id ?? 'debut';
}

export const MOTIF_BY_ID = Object.fromEntries(MOTIFS.map((m) => [m.id, m])) as Record<MotifId, Motif>;

/** Source of truth for which eggs belong to which trail. */
const MOTIF_MEMBERSHIP: Record<MotifId, string[]> = {
  'number-13': ['egg-13-debut', 'egg-13-video-1989', 'egg-13-tracks-midnights'],
  'hidden-messages': ['egg-capitals-debut', 'egg-capitals-fearless', 'egg-fearless-tv-scramble', 'egg-wood-track-tloas'],
  'the-snake': ['egg-snake-instagram', 'egg-snake-lwymmd', 'egg-snake-me-mv'],
  'color-coding': ['egg-red-burning', 'egg-color-daylight', 'egg-string-willow', 'egg-karma-album-theory'],
  'clocks-countdowns': [
    'egg-clock-lastkiss',
    'egg-midnights-vinyl-clock',
    'egg-grammys-two-fingers',
    'egg-ttpd-timetable-clock',
    'egg-ttpd-anthology-drop',
  ],
  'doors-rooms': [
    'egg-loverhouse-mv',
    'egg-cabin-folklore',
    'egg-eras-burning-house',
    'egg-tloas-orange-doors',
    'egg-tloas-album-drop',
  ],
  'the-rerecordings': [
    'egg-man-graffiti',
    'egg-red-tv-rings',
    'egg-bejeweled-elevator',
    'egg-rep-tv-clue-bejeweled',
    'egg-speaknow-tv-nashville',
    'egg-1989-tv-la',
  ],
};

const NODE_TO_MOTIF: Record<string, MotifId> = Object.entries(MOTIF_MEMBERSHIP).reduce(
  (acc, [motif, ids]) => {
    for (const id of ids) acc[id] = motif as MotifId;
    return acc;
  },
  {} as Record<string, MotifId>,
);

/** The trail a node belongs to (undefined only if misclassified). */
export function motifOf(nodeId: string): MotifId | undefined {
  return NODE_TO_MOTIF[nodeId];
}

/** Nodes on a trail, oldest → newest (clue before payoff on year ties). */
export function motifNodes(motifId: MotifId): EggNode[] {
  return EGG_NODES.filter((n) => NODE_TO_MOTIF[n.id] === motifId).sort(
    (a, b) => a.year - b.year || (a.kind === b.kind ? 0 : a.kind === 'clue' ? -1 : 1),
  );
}

/** Distinct eras a trail touches, in chronological order. */
export function motifEraIds(motifId: MotifId): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of motifNodes(motifId)) {
    if (!seen.has(n.eraId)) {
      seen.add(n.eraId);
      out.push(n.eraId);
    }
  }
  return out;
}

// Dev-only guard: every egg must live on exactly one trail. An unclassified
// node should fail loudly here instead of silently vanishing from the UI.
if (process.env.NODE_ENV !== 'production') {
  const unclassified = EGG_NODES.filter((n) => !NODE_TO_MOTIF[n.id]).map((n) => n.id);
  if (unclassified.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[v0] Clue Web: unclassified egg nodes — add to MOTIF_MEMBERSHIP:', unclassified);
  }
}

// ── The Proposal (sourced narrative thread) ─────────────────────────────────
// Publicly reported facts, attributed. Framed by an independent fan project.

// PROPOSAL_BEATS removed (consolidation stage 3, 2026-07-19): the End Game
// thread derives from vault moments tagged the-proposal — see
// components/longlive/proposal/ProposalThread.tsx and threads.ts.


// ── The Decode (hidden clue → payoff pairs) ─────────────────────────────────
// AI-researched, hand-audited: URLs flattened to direct links, plant precedes
// payoff, confirmed vs. fan-theory flags preserved.
