import type { FanSignal, LiveTheory } from '@swift2/shared';

/**
 * Live-tier theory helpers (PLAN.md Stage 7) — pure, no I/O. Both the
 * Threads "Theories & eggs" board (`TheoryGuide.tsx`) and the Clownbot board
 * (`ClownBoard.tsx`) sort `live_theory` rows by heat with `sortByHeatDesc`;
 * `TheoryGuide` additionally pairs each theory with a `fan_signal` row for
 * the "fans are saying" line.
 */

export function sortByHeatDesc<T extends { heat: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.heat - a.heat);
}

/**
 * Best `fan_signal` match for a live theory: a signal that names this
 * theory's id in `theoryIds` wins outright; otherwise the highest-heat
 * signal sharing at least one symbol. `undefined` when nothing matches —
 * callers render without the "fans are saying" line rather than fabricate
 * one.
 */
export function matchFanSignal(theory: LiveTheory, signals: readonly FanSignal[]): FanSignal | undefined {
  const byTheoryId = signals.find((s) => s.theoryIds.includes(theory.id));
  if (byTheoryId) return byTheoryId;
  const bySymbol = signals.filter((s) => s.symbols.some((sym) => theory.symbols.includes(sym)));
  return sortByHeatDesc(bySymbol)[0];
}

/** The "fans are saying" line — `fan_signal.summary` is already aggregate
 * voice ("a popular thread", "dozens of posts"), so this only adds the
 * fixed lead-in, never paraphrases or invents. */
export function fansAreSayingLine(signal: FanSignal): string {
  return `Fans are saying: ${signal.summary}`;
}
