/**
 * Exploration progress — the pure logic behind the visited-state layer
 * (audit §G-T6), moved into the headless core (OS-025,
 * `docs/specs/2026-09-05-one-source-three-surfaces.md` §6 Phase 2) so both
 * renderers track the same shape with their own storage.
 *
 * Storage contract: one versioned JSON blob under `PROGRESS_STORAGE_KEY`.
 * Every read is defensive — malformed JSON, a wrong version, missing
 * fields, or non-string members all degrade to "nothing tracked yet",
 * never a throw.
 *
 * Renderer-agnostic storage: this module never touches `localStorage`,
 * `expo-file-system`, or any other platform API directly (packages/experience
 * must stay framework-free — see index.ts and eslint.config.mjs's
 * `no-restricted-imports` guard on `window`/`document`). Instead every
 * caller injects a `StorageAdapter` — the same shape as `@swift2/content`'s
 * adapter contract, kept independent here so this package never depends on
 * `@swift2/content` for a two-method interface:
 *
 *  - on the web, `apps/web/lib/longlive/local-storage-adapter.ts` wraps
 *    `window.localStorage`, guarding SSR (`typeof window === 'undefined'`)
 *    and private-mode/quota failures;
 *  - in tests, `createMemoryStorageAdapter()` below — a process-local Map;
 *  - on mobile (future), an adapter backed by `expo-file-system` or
 *    `AsyncStorage`.
 *
 * The React wiring (hydrate-after-mount, write-on-change) stays in the app
 * layer's store (e.g. `apps/web/lib/longlive/store/index.tsx`'s
 * ProgressProvider) since it needs `useState`/`useEffect`.
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

/** Serialized (storage) shape — arrays so it's plain JSON. */
interface ProgressSnapshotV1 {
  v: 1;
  moments: string[];
  eggs: string[];
  trails: string[];
  favorites: string[];
}

/**
 * Injected storage contract — plain string-keyed get/set, synchronous like
 * `localStorage` (the only backend this powers today). Kept minimal and
 * local to this module rather than importing `@swift2/content`'s adapter,
 * so `packages/experience` never depends on `packages/content` for it.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** In-memory adapter: durable for the lifetime of the process, nowhere else. Used by tests. */
export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
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
 * Read persisted progress through the injected adapter. Safe everywhere: a
 * throwing adapter (private mode, a null-object adapter, etc.) or a
 * corrupted blob both return empty progress instead of throwing.
 */
export function readStoredProgress(adapter: StorageAdapter): Progress {
  try {
    return parseProgress(adapter.getItem(PROGRESS_STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}

/** Persist progress through the injected adapter. Best-effort — storage failures are silently ignored. */
export function writeStoredProgress(adapter: StorageAdapter, p: Progress): void {
  try {
    adapter.setItem(PROGRESS_STORAGE_KEY, serializeProgress(p));
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
