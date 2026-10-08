// Deterministic theory-match dedup (proposal §4.6, PLAN.md Stage 3): "name
// similarity + symbol overlap >= 0.5" — read literally as a SUM of two 0..1
// scores against a single 0.5 threshold (not an average, not two separate
// gates), so a strong match on either axis alone can already qualify. Pure
// functions, no I/O, so this is unit-testable without a DB.

/** Bag-of-words Jaccard similarity over lowercased, punctuation-stripped tokens. */
export function nameSimilarity(a: string, b: string): number {
  const tokens = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
  const setA = tokens(a);
  const setB = tokens(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Jaccard overlap over two symbol-key arrays. */
export function symbolOverlap(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const s of setA) if (setB.has(s)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export const THEORY_MATCH_THRESHOLD = 0.5;

/** A candidate theory matches an existing one when name-similarity + symbol-overlap >= 0.5. */
export function isTheoryMatch(
  candidate: { name: string; symbols: readonly string[] },
  existing: { name: string; symbols: readonly string[] },
): boolean {
  const score = nameSimilarity(candidate.name, existing.name) + symbolOverlap(candidate.symbols, existing.symbols);
  return score >= THEORY_MATCH_THRESHOLD;
}

/** Finds the best-matching existing theory, if any clears the threshold. */
export function findTheoryMatch<T extends { name: string; symbols: readonly string[] }>(
  candidate: { name: string; symbols: readonly string[] },
  existing: readonly T[],
): T | undefined {
  let best: T | undefined;
  let bestScore = 0;
  for (const e of existing) {
    const score = nameSimilarity(candidate.name, e.name) + symbolOverlap(candidate.symbols, e.symbols);
    if (score >= THEORY_MATCH_THRESHOLD && score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}
