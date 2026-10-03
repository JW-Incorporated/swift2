import type { LensId } from './types';
import { injectedCorpus } from './corpus-injected';
import { threadPointsIn, threadsInEraIn, type Crossing, type ThreadPoint } from './lenses';

export function threadPoints(id: LensId): ThreadPoint[] {
  return threadPointsIn(injectedCorpus(), id);
}

/** Threads with at least one dated point inside the given era, with counts. */
export function threadsInEra(eraId: string): { id: LensId; count: number }[] {
  return threadsInEraIn(injectedCorpus(), eraId);
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
