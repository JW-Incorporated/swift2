/**
 * OS-041 CI check: "a schema change ships with a loader that still reads
 * the previous version." This is the enforcement half of the N-1 policy
 * defined in `compat.ts` and `docs/decisions.md`'s OS-010 ADR.
 *
 * Three things this file guarantees on every CI run:
 * 1. The package's actual `CURRENT_SCHEMA_VERSION` always supports its own
 *    N-1 (self-consistency of the constant — catches someone hand-editing
 *    `MIN_SUPPORTED_SCHEMA_VERSION` logic incorrectly).
 * 2. The on-disk fixture bundle's `manifest.json` `schemaVersion` is within
 *    the package's supported window — if a future PR bumps
 *    `CURRENT_SCHEMA_VERSION` without also updating/keeping a fixture the
 *    loader can still read, this fails loudly instead of silently shipping
 *    a loader that can't read its own N-1 fixture.
 * 3. A **deliberate schema-version-bump test case**: simulate bumping
 *    `currentSchemaVersion` from N to N+1 and prove version N (the "previous
 *    version" after the bump) is still accepted, version N+1 is accepted,
 *    and version N-1 (now two versions behind) is correctly rejected. This
 *    is the card's own "Done when" — a deliberate bump scenario that passes.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CURRENT_SCHEMA_VERSION,
  MIN_SUPPORTED_SCHEMA_VERSION,
  UnsupportedSchemaVersionError,
  assertSchemaVersionSupported,
  computeMinSupportedSchemaVersion,
  isSchemaVersionSupported,
} from './compat';
import { manifestSchema } from './schema';

describe('OS-041 schema compatibility policy', () => {
  it('the package constant is self-consistent: current supports its own N-1', () => {
    expect(MIN_SUPPORTED_SCHEMA_VERSION).toBe(computeMinSupportedSchemaVersion(CURRENT_SCHEMA_VERSION));
    expect(isSchemaVersionSupported(CURRENT_SCHEMA_VERSION)).toBe(true);
    expect(isSchemaVersionSupported(MIN_SUPPORTED_SCHEMA_VERSION)).toBe(true);
  });

  it('the floor never drops below 1 even at schemaVersion 1', () => {
    expect(computeMinSupportedSchemaVersion(1)).toBe(1);
    expect(isSchemaVersionSupported(1, 1)).toBe(true);
    expect(isSchemaVersionSupported(0, 1)).toBe(false);
  });

  it('the on-disk fixture bundle manifest is within the currently-supported window', () => {
    const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');
    const manifest = manifestSchema.parse(JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8')));
    expect(
      isSchemaVersionSupported(manifest.schemaVersion),
      `fixture bundle schemaVersion ${manifest.schemaVersion} must be within ` +
        `${MIN_SUPPORTED_SCHEMA_VERSION}..${CURRENT_SCHEMA_VERSION} — if you just bumped ` +
        'CURRENT_SCHEMA_VERSION, the loader must still read this N-1 fixture; update the fixture ' +
        'or confirm the loader genuinely still supports it before changing this constant.',
    ).toBe(true);
  });

  describe('deliberate schema-version-bump test case', () => {
    // Simulate the exact scenario the "Done when" describes: a schema
    // change lands and schemaVersion goes from N to N+1. The loader (this
    // package) must keep reading N (the new N-1) without a code change to
    // its validation logic — only the published CURRENT_SCHEMA_VERSION
    // constant changes.
    const preBumpVersion = CURRENT_SCHEMA_VERSION; // N
    const postBumpVersion = CURRENT_SCHEMA_VERSION + 1; // N+1, simulated

    it('a bundle at the pre-bump version (N) still validates after the bump (N+1 is current)', () => {
      expect(isSchemaVersionSupported(preBumpVersion, postBumpVersion)).toBe(true);
      expect(() => assertSchemaVersionSupported({ schemaVersion: preBumpVersion }, postBumpVersion)).not.toThrow();
    });

    it('a bundle at the new current version (N+1) validates', () => {
      expect(isSchemaVersionSupported(postBumpVersion, postBumpVersion)).toBe(true);
    });

    it('a bundle two versions behind (N-1, now out of window) is rejected with a clear error', () => {
      const twoVersionsBehind = preBumpVersion - 1;
      if (twoVersionsBehind < 1) return; // no version below 1 exists to test against yet
      expect(isSchemaVersionSupported(twoVersionsBehind, postBumpVersion)).toBe(false);
      expect(() => assertSchemaVersionSupported({ schemaVersion: twoVersionsBehind }, postBumpVersion)).toThrow(
        UnsupportedSchemaVersionError,
      );
    });

    it('a bundle from the future (newer than current) is rejected', () => {
      expect(isSchemaVersionSupported(postBumpVersion + 1, postBumpVersion)).toBe(false);
    });
  });
});
