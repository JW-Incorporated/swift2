// Tier 0 payload budget — the hard performance gate from the v1 spec. The
// always-resident skeleton must stay small enough to ship to and parse on a
// mid-tier Android device. Pure (no I/O): a runner measures bytes and calls
// evaluateTier0Budget; this module only owns the thresholds and the verdict.

export const TIER0_BUDGET = {
  /** Max transfer size, gzipped, over the wire. */
  gzipBytes: 2 * 1024 * 1024, // 2 MB
  /** Max size parsed in memory on a mid-tier Android device. */
  parsedBytes: 10 * 1024 * 1024, // 10 MB
} as const;

export interface Tier0Measurement {
  /** Size of the Tier 0 JSON after gzip. */
  gzipBytes: number;
  /** Size of the Tier 0 JSON as UTF-8 bytes (proxy for parsed cost). */
  parsedBytes: number;
}

export interface Tier0BudgetResult extends Tier0Measurement {
  gzipBudget: number;
  parsedBudget: number;
  /** Fraction of budget used (1 = exactly at budget). */
  gzipRatio: number;
  parsedRatio: number;
  withinBudget: boolean;
  /** Bytes over budget per dimension (0 when within). */
  overBy: { gzipBytes: number; parsedBytes: number };
}

export function evaluateTier0Budget(m: Tier0Measurement): Tier0BudgetResult {
  const overGzip = Math.max(0, m.gzipBytes - TIER0_BUDGET.gzipBytes);
  const overParsed = Math.max(0, m.parsedBytes - TIER0_BUDGET.parsedBytes);
  return {
    gzipBytes: m.gzipBytes,
    parsedBytes: m.parsedBytes,
    gzipBudget: TIER0_BUDGET.gzipBytes,
    parsedBudget: TIER0_BUDGET.parsedBytes,
    gzipRatio: m.gzipBytes / TIER0_BUDGET.gzipBytes,
    parsedRatio: m.parsedBytes / TIER0_BUDGET.parsedBytes,
    withinBudget: overGzip === 0 && overParsed === 0,
    overBy: { gzipBytes: overGzip, parsedBytes: overParsed },
  };
}
