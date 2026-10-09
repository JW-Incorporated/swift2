// Detects a "degraded no-op" knowledge-extract cycle: the job stays green
// (ingestion works) but extraction did nothing. Issue #4647 item 4 — a silent
// no-op ran for weeks (schema pending, then a missing ANTHROPIC_API_KEY).
// The annotation this feeds is read back by watchdog.yml via
// scripts/watchdog/extract-degraded-check.mjs, so MARKER must stay in sync.

export const EXTRACT_DEGRADED_MARKER = 'extract-degraded';

export interface ExtractDegradedInput {
  clustersConsidered: number;
  extracted: number;
  deferred: number;
  schemaPending: number;
  hasApiKey: boolean;
}

export type ExtractDegradedCause = 'schema-pending' | 'deferred-no-key' | 'deferred-at-cap';

export function detectExtractDegraded(
  input: ExtractDegradedInput,
): { cause: ExtractDegradedCause; message: string } | null {
  const { clustersConsidered, extracted, deferred, schemaPending, hasApiKey } = input;
  if (extracted > 0) return null;
  if (schemaPending > 0) {
    return {
      cause: 'schema-pending',
      message:
        `${EXTRACT_DEGRADED_MARKER}: schema-pending — ${schemaPending} call(s) skipped, extracted 0 ` +
        `(clusters ${clustersConsidered}). Knowledge-engine migrations are not applied.`,
    };
  }
  if (clustersConsidered > 0 && deferred === clustersConsidered) {
    const cause = hasApiKey ? 'deferred-at-cap' : 'deferred-no-key';
    const why = hasApiKey
      ? 'the per-run/daily extraction cap is reserved out'
      : 'ANTHROPIC_API_KEY is not set for the extract stage';
    return {
      cause,
      message:
        `${EXTRACT_DEGRADED_MARKER}: ${cause} — all ${clustersConsidered} cluster(s) deferred, extracted 0. ` +
        `Likely cause: ${why}.`,
    };
  }
  return null;
}
