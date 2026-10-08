/**
 * Content-freshness reader. scripts/sync-longlive-content.mjs stamps
 * `CONTENT_GENERATED_AT` (an ISO timestamp) into content-vault.generated.ts on
 * every regeneration — which runs as a `prebuild` step, so the stamp is
 * effectively the deploy time. The COMMITTED fallback copy of that module
 * predates the export (and the regenerated file is deliberately never
 * committed — it would churn every build), so this reader is defensive: no
 * export, or a malformed one, just means "no freshness label".
 *
 * `readGeneratedAt` is pure and takes the module record directly, so it needs
 * no wiring. `contentGeneratedAt` reads through an app-wired provider (same
 * layering fix as `content-item-provider.ts`) since the generated vault
 * module itself is app-layer data.
 */

/**
 * Pulls the freshness stamp out of a module record. Pure + injectable so the
 * missing-export and wrong-type paths are unit-testable without fixture files.
 */
export function readGeneratedAt(mod: Record<string, unknown>): string | null {
  const v = mod['CONTENT_GENERATED_AT'];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/**
 * Supplies the raw generated-vault module record for `contentGeneratedAt` to
 * read. The app wires its real `content-vault.generated` module in once at
 * startup via `setContentGeneratedAtSource`; defaults to an empty record so
 * an unwired renderer degrades to "no freshness label" instead of crashing.
 */
let source: Record<string, unknown> = {};

export function setContentGeneratedAtSource(mod: Record<string, unknown>): void {
  source = mod;
}

/** ISO timestamp of the last content regeneration, or null when unavailable. */
export function contentGeneratedAt(): string | null {
  return readGeneratedAt(source);
}
