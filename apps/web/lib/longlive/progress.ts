/**
 * Exploration progress — the pure logic behind the localStorage visited-state
 * layer (audit §G-T6). No React in here: parsing, guarding, set math, and the
 * count/completion helpers all live in this module so they can be unit-tested
 * directly; the React wiring (hydrate-after-mount, write-on-change) lives in
 * store.tsx's ProgressProvider.
 *
 * Storage contract: one versioned JSON blob under `ll-progress-v1`. Every read
 * is defensive — malformed JSON, a wrong version, missing fields, or non-string
 * members all degrade to "nothing tracked yet", never a throw. localStorage
 * itself may be unavailable (private mode, SSR): readers/writers swallow that
 * too and the app simply behaves like a first visit.
 */

import { EGG_NODES, MOTIFS, motifNodes } from './lenses';
import type { MotifId } from './types';

export const PROGRESS_STORAGE_KEY = 'll-progress-v1';

/** In-memory shape — sets for O(1) membership checks from render code. */
export interface Progress {
  /** ContentItem ids the visitor has opened in MomentDetail. */
  moments: ReadonlySet<string>;
  /** EggNode ids the visitor has read (trail scroll or constellation tap). */
  eggs: ReadonlySet<string>;
  /** MotifIds whose trail view the visitor has opened. */
  trails: ReadonlySet<string>;
  /** ContentItem ids the visitor has hearted. */
  favorites: ReadonlySet<string>;
}

/** Serialized (localStorage) shape — arrays so it's plain JSON. */
interface ProgressSnapshotV1 {
  v: 1;
  moments: string[];
  eggs: string[];
  trails: string[];
  favorites: string[];
}

export function emptyProgress(): Progress {
  return {
    moments: new Set(),
    eggs: new Set(),
    trails: new Set(),
    favorites: new Set(),
  };
}

/** Keep only string members — a corrupted field degrades, never throws. */
function stringSet(value: unknown): ReadonlySet<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((x): x is string => typeof x === 'string'));
}

/**
 * Parse a raw stored blob into Progress. Total function: any input — null,
 * truncated JSON, an old/foreign version, wrong field types — yields a valid
 * Progress (falling back to empty per-field or overall).
 */
export function parseProgress(raw: string | null | undefined): Progress {
  if (!raw) return emptyProgress();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (typeof data !== 'object' || data === null) return emptyProgress();
  const snap = data as Partial<ProgressSnapshotV1>;
  if (snap.v !== 1) return emptyProgress();
  return {
    moments: stringSet(snap.moments),
    eggs: stringSet(snap.eggs),
    trails: stringSet(snap.trails),
    favorites: stringSet(snap.favorites),
  };
}

export function serializeProgress(p: Progress): string {
  const snap: ProgressSnapshotV1 = {
    v: 1,
    moments: [...p.moments].sort(),
    eggs: [...p.eggs].sort(),
    trails: [...p.trails].sort(),
    favorites: [...p.favorites].sort(),
  };
  return JSON.stringify(snap);
}

/**
 * Read persisted progress. Safe everywhere: on the server, in private mode,
 * or with a corrupted blob it returns empty progress instead of throwing.
 */
export function readStoredProgress(): Progress {
  try {
    if (typeof window === 'undefined') return emptyProgress();
    return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}

/** Persist progress. Best-effort — storage failures are silently ignored. */
export function writeStoredProgress(p: Progress): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(p));
  } catch {
    /* private mode / quota — the session still works, it just won't persist */
  }
}

/**
 * Set-with-ids-added. Returns the ORIGINAL set when nothing new was added so
 * state updates can bail out (`===`) and skip a re-render + a storage write.
 */
export function withAdded(set: ReadonlySet<string>, ids: readonly string[]): ReadonlySet<string> {
  let next: Set<string> | null = null;
  for (const id of ids) {
    if (set.has(id) || next?.has(id)) continue;
    next ??= new Set(set);
    next.add(id);
  }
  return next ?? set;
}

/** Set-with-one-id-toggled (the favorites gesture). Always a new set. */
export function withToggled(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/* ── Counts / completion (all computed against the live data, so ids from a
      stale or tampered blob can never inflate a count past its total) ────── */

export interface TrailProgress {
  seen: number;
  total: number;
  complete: boolean;
}

/** How much of one motif's trail the visitor has read. */
export function trailProgress(eggsSeen: ReadonlySet<string>, motifId: MotifId): TrailProgress {
  const nodes = motifNodes(motifId);
  const seen = nodes.filter((n) => eggsSeen.has(n.id)).length;
  return { seen, total: nodes.length, complete: nodes.length > 0 && seen === nodes.length };
}

export interface ClueWebProgress {
  eggsSeen: number;
  eggsTotal: number;
  trailsExplored: number;
  trailsTotal: number;
}

/** The Clue Web home "X/Y explored" numbers. */
export function clueWebProgress(p: Progress): ClueWebProgress {
  return {
    eggsSeen: EGG_NODES.filter((n) => p.eggs.has(n.id)).length,
    eggsTotal: EGG_NODES.length,
    trailsExplored: MOTIFS.filter((m) => p.trails.has(m.id)).length,
    trailsTotal: MOTIFS.length,
  };
}
