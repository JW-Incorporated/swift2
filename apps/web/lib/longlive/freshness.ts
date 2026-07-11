/**
 * Content-freshness reader. scripts/sync-longlive-content.mjs stamps
 * `CONTENT_GENERATED_AT` (an ISO timestamp) into content-vault.generated.ts on
 * every regeneration — which runs as a `prebuild` step, so the stamp is
 * effectively the deploy time. The COMMITTED fallback copy of that module
 * predates the export (and the regenerated file is deliberately never
 * committed — it would churn every build), so this reader is defensive: no
 * export, or a malformed one, just means "no freshness label".
 */

import * as vault from './content-vault.generated';

/**
 * Pulls the freshness stamp out of a module record. Pure + injectable so the
 * missing-export and wrong-type paths are unit-testable without fixture files.
 */
export function readGeneratedAt(mod: Record<string, unknown>): string | null {
  const v = mod['CONTENT_GENERATED_AT'];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** ISO timestamp of the last content regeneration, or null when unavailable. */
export function contentGeneratedAt(): string | null {
  return readGeneratedAt(vault as unknown as Record<string, unknown>);
}
