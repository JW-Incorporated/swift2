import { ERAS, eraIndex } from '@swift2/experience';
import type { CluePair } from '@swift2/experience';

/** Every era Taylor moved through between a clue's plant and payoff (inclusive of both ends), in chronological order. */
export function erasBetween(plantEraId: string, payoffEraId: string): string[] {
  const a = eraIndex(plantEraId);
  const b = eraIndex(payoffEraId);
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return ERAS.slice(lo, hi + 1).map((e) => e.id);
}

/** Whole years between a clue's plant and payoff dates. */
export function gapYears(clue: Pick<CluePair, 'plant' | 'payoff'>): number {
  const plant = new Date(clue.plant.date).getTime();
  const payoff = new Date(clue.payoff.date).getTime();
  return Math.max(0, Math.floor((payoff - plant) / (365.25 * 24 * 60 * 60 * 1000)));
}
