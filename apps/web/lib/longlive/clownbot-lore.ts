/**
 * Clownbot — the status-tagged rumor + lore file.
 *
 * THE RULE THAT GOVERNS THIS FILE: no source, no ship. Every item carries at
 * least one named outlet with a real URL and a real date. Nothing in here was
 * written from memory, inferred, or "probably about right" — a bot asserting a
 * debunked rumor as live is instant credibility death (research finding #8),
 * and a bot asserting a *fabricated* rumor is worse. `clownbot-lore.test.ts`
 * enforces the shape; a human enforces the truth.
 *
 * PRIVACY: every item is checked against docs/content-ops/privacy-redlines.md
 * BEFORE it is written down, not after. This file carries no location beyond
 * L0/L1, no body/health/sexuality speculation, no relationship prognosis, no
 * private individuals.
 *
 * GENERATED DATA, HAND-AUTHORED HELPERS (Fable ruling FR-t_2745eb60-1, issue
 * #3515, 2026-09-04): the `LORE` array itself is no longer authored here. It
 * is generated from supabase/seed/clownbot-lore/clownbot-lore.mjs by
 * scripts/sync-clownbot-lore.mjs into clownbot-lore.generated.ts, which
 * scripts/build-content-bundle.mjs then folds into the published content
 * bundle's `clownbot-lore.json` — this keeps the unattended Rumor Desk
 * lane's editing surface in seed files, off runtime app source, while this
 * module stays the stable import surface every consumer (clown-index.ts,
 * clown-board.ts, tests) already uses.
 *
 * BUNDLE AS SOURCE OF TRUTH, LITERAL AS RUNTIME VALUE (OS-014b-5, Fable
 * rulings FR-t_cd5741fc-1 then -2, 2026-09-06): the goal is that the
 * published bundle's `clownbot-lore.json` is authoritative and any drift
 * from it is impossible to miss — NOT that this module perform a runtime
 * filesystem read. `LORE`/`LORE_UPDATED_ON` keep importing straight from
 * `clownbot-lore.generated.ts` (a plain array/string literal with zero
 * imports) because this module is reachable from `clown-board.ts` ->
 * `ClownBoard.tsx`, a `'use client'` component: Next.js/Turbopack statically
 * traces every module in a client component's import graph and refuses to
 * bundle `node:fs`/`node:path` for the browser (a real build failure hit
 * during FR-t_cd5741fc-1's first implementation, not a theoretical
 * concern) — a runtime `typeof window` guard does not help, since Turbopack
 * resolves the graph before any branch executes. `clownbot-lore.test.ts`
 * enforces the actual invariant instead: a CI-required assertion that this
 * literal is byte-identical to the published bundle's `clownbot-lore.json`,
 * so any drift between the two fails the build immediately. See
 * `./read-bundle-artifact.ts` for the fs-based reader this ruling reserves
 * for server-only domains (not usable here).
 *
 * REFRESH PATH: docs/content-ops/clownbot-rumor-refresh.md. The news cycle
 * moves in hours, so `LORE_UPDATED_ON` is surfaced to the reader and the
 * surface says plainly when it is stale rather than pretending to be live.
 */
import type { LoreItem, LoreLedger, LoreSource, LoreStatus } from '@swift2/experience';
import { LORE_RAW, LORE_UPDATED_ON } from './clownbot-lore.generated';

export type { LoreStatus, LoreSource, LoreLedger, LoreItem };

/** A rumor/reported item older than this is no longer "live" for prompts. */
export const FRESH_WINDOW_DAYS = 14;

export const LORE: readonly LoreItem[] = LORE_RAW;
export { LORE_UPDATED_ON };

/** Fast id lookup. Built once at module load. */
const BY_ID = new Map<string, LoreItem>(LORE.map((item) => [item.id, item]));

export function loreById(id: string): LoreItem | undefined {
  return BY_ID.get(id);
}

/** Whole days between two ISO dates, floored at 0. */
export function daysBetween(fromIso: string, to: Date): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  if (!Number.isFinite(from)) return Number.POSITIVE_INFINITY;
  const delta = Math.floor((to.getTime() - from) / 86_400_000);
  return delta < 0 ? 0 : delta;
}

export interface LoreFreshness {
  updatedOn: string;
  /** Days since a human last swept the file. */
  ageDays: number;
  /** True once the sweep is older than the fresh window. */
  stale: boolean;
  /** Open items whose status was checked inside the fresh window. */
  liveCount: number;
}

/**
 * What the surface tells the reader about how current this is. Staleness is
 * SHOWN, never hidden (research finding #8) — a bot that looks live while
 * running on four-month-old lore is the failure mode we are avoiding.
 */
export function loreFreshness(now: Date): LoreFreshness {
  const ageDays = daysBetween(LORE_UPDATED_ON, now);
  const liveCount = LORE.filter(
    (item) =>
      (item.status === 'rumor' || item.status === 'reported') &&
      daysBetween(item.lastCheckedOn, now) <= FRESH_WINDOW_DAYS,
  ).length;
  return {
    updatedOn: LORE_UPDATED_ON,
    ageDays,
    stale: ageDays > FRESH_WINDOW_DAYS,
    liveCount,
  };
}
