/**
 * `schemaVersion` compatibility policy (OS-041, `docs/specs/2026-09-05-one-
 * source-three-surfaces.md` §6 Phase 4, `docs/decisions.md` "the content
 * bundle is a versioned artifact, not a database (OS-010)" — "N-1 schema
 * support" section).
 *
 * Bump rules (the ADR's mechanism, made checkable here):
 * - A schema change that only ADDS an optional field, or adds a new
 *   optional/whole-catalogue entry to `contentBundleSchemas`, does NOT bump
 *   `schemaVersion` — existing bundles still validate unchanged.
 * - A schema change that makes a previously-optional field required, changes
 *   a field's type, removes a field a consumer reads, or renames a manifest
 *   key MUST bump `schemaVersion` by exactly 1 in the same PR that ships the
 *   schema change.
 * - Every bump must keep this module's `isSchemaVersionSupported` true for
 *   `schemaVersion === CURRENT_SCHEMA_VERSION - 1` (the previous published
 *   bundle) as well as `CURRENT_SCHEMA_VERSION` itself — a loader built
 *   against version N must still read a bundle published at N-1, so a mobile
 *   client on an older EAS Update (D4) keeps rendering correctly against a
 *   newer web-published bundle for one release cycle.
 * - Bundles older than N-1 are NOT supported; a loader must fail loudly
 *   (`UnsupportedSchemaVersionError`) rather than attempt best-effort
 *   parsing against a schema shape it no longer has.
 *
 * This module owns the mechanism only. The CI check that enforces "a schema
 * change ships with a loader that still reads the previous version" is
 * `compat.test.ts` in this package: it is part of the root vitest suite
 * (`npm run test`, already a required CI job in `.github/workflows/ci.yml`),
 * and it fails if `CURRENT_SCHEMA_VERSION`'s N-1 boundary is ever violated.
 */

/**
 * Bumped ONLY on a breaking change to the shapes in `schema.ts` (see the
 * bump rules above). Keep this in lockstep with the fixture bundle's own
 * `manifest.json` `schemaVersion` — `fixture-bundle.test.ts` fails if they
 * drift silently.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * The oldest `schemaVersion` this package's loader (OS-013) is contractually
 * required to still read. Computed, not hand-maintained, so a future bump to
 * `CURRENT_SCHEMA_VERSION` automatically re-derives the correct floor — the
 * floor never goes below 1 (there is no version 0).
 */
export function computeMinSupportedSchemaVersion(currentSchemaVersion: number): number {
  return Math.max(1, currentSchemaVersion - 1);
}

/** The floor for this package's actual `CURRENT_SCHEMA_VERSION`. */
export const MIN_SUPPORTED_SCHEMA_VERSION = computeMinSupportedSchemaVersion(CURRENT_SCHEMA_VERSION);

/**
 * `true` iff a bundle published at `schemaVersion` is one this loader must
 * successfully read: exactly `currentSchemaVersion` or `currentSchemaVersion
 * - 1` (floored at 1). Takes `currentSchemaVersion` as a parameter (instead
 * of always reading the package constant) so `compat.test.ts` can exercise
 * a simulated version bump without needing to actually bump the package's
 * real `CURRENT_SCHEMA_VERSION`.
 */
export function isSchemaVersionSupported(
  schemaVersion: number,
  currentSchemaVersion: number = CURRENT_SCHEMA_VERSION,
): boolean {
  const min = computeMinSupportedSchemaVersion(currentSchemaVersion);
  return schemaVersion >= min && schemaVersion <= currentSchemaVersion;
}

export class UnsupportedSchemaVersionError extends Error {
  readonly schemaVersion: number;
  readonly currentSchemaVersion: number;
  readonly minSupportedSchemaVersion: number;

  constructor(schemaVersion: number, currentSchemaVersion: number = CURRENT_SCHEMA_VERSION) {
    const min = computeMinSupportedSchemaVersion(currentSchemaVersion);
    super(
      `Bundle schemaVersion ${schemaVersion} is not supported by this loader ` +
        `(current=${currentSchemaVersion}, supports ${min}..${currentSchemaVersion}). ` +
        'Republish the bundle at a supported schemaVersion, or update this app.',
    );
    this.name = 'UnsupportedSchemaVersionError';
    this.schemaVersion = schemaVersion;
    this.currentSchemaVersion = currentSchemaVersion;
    this.minSupportedSchemaVersion = min;
  }
}

/**
 * Throws `UnsupportedSchemaVersionError` unless `manifest.schemaVersion` is
 * within the supported N-1..N window. Call this before validating any of a
 * manifest's listed files against `contentBundleSchemas` — an out-of-window
 * manifest should fail fast with a clear error, not a confusing per-field
 * zod validation failure from schemas that were never meant to read it.
 */
export function assertSchemaVersionSupported(
  manifest: { schemaVersion: number },
  currentSchemaVersion: number = CURRENT_SCHEMA_VERSION,
): void {
  if (!isSchemaVersionSupported(manifest.schemaVersion, currentSchemaVersion)) {
    throw new UnsupportedSchemaVersionError(manifest.schemaVersion, currentSchemaVersion);
  }
}
