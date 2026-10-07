import type { LensId } from './types';
import { injectedCorpus } from './corpus-injected';
import {
  threadCrossingsIn,
  threadPointsIn,
  threadsInEraIn,
  type Crossing,
  type ThreadPoint,
} from './lenses';

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
  return threadCrossingsIn(injectedCorpus(), a, b, windowDays);
}
