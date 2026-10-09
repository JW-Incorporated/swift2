/**
 * Warm-launch helpers for `load.ts` (One UI WP0.2 PR C).
 *
 * A warm launch (cached, marked-complete copy of the current `bundleVersion`)
 * used to zod-validate every file again. That is redundant when this exact
 * schema already validated the cached bytes, so the loader stores a schema
 * fingerprint beside the complete marker and skips per-file `safeParse` while
 * it matches.
 *
 * SCHEMA_FINGERPRINT is a hand-bumped constant, not derived at runtime: deriving
 * it would mean walking the zod graph (or hashing source, unavailable on
 * Hermes) on every launch, which is the cost this removes. The drift risk of a
 * hand-bumped value is closed by `warm-cache.test.ts`, which pins a hash of
 * every input that decides what "valid" means — `schema.ts`,
 * `validation-contract.ts` (entry name -> schema) and the installed zod version
 * (zod ships by OTA, so a bump can change parse behaviour) — and fails until
 * whoever changes any of them bumps BOTH. A new OTA
 * with a changed schema therefore ships a new fingerprint, mismatches what the
 * cache stored, and re-validates once (docs: issue #4800, cross-OTA hazard).
 */
import type { z } from 'zod';
import { isSchemaVersionSupported } from './compat';
import { manifestSchema, type Manifest } from './schema';

export const SCHEMA_FINGERPRINT = 'schema-fp-2';

export type BundleFilesRecord = Record<string, unknown>;
export interface WarmBundle {
  manifest: Manifest;
  files: BundleFilesRecord;
}

/**
 * Parses a cached manifest + files pair. Every manifest entry must be present
 * with a schema in this build; `trustedSchema` (stored fingerprint matches)
 * skips the per-file `safeParse`. sha256 is never recomputed. Null = unusable.
 */
export function readWarmCache(
  manifestRaw: string,
  filesRaw: string,
  schemaVersion: number,
  lookupSchema: (name: string) => z.ZodTypeAny | undefined,
  trustedSchema: boolean,
): WarmBundle | null {
  try {
    const manifest = manifestSchema.parse(JSON.parse(manifestRaw));
    if (!isSchemaVersionSupported(manifest.schemaVersion, schemaVersion)) return null;
    const files = JSON.parse(filesRaw) as BundleFilesRecord;
    if (!files || typeof files !== 'object') return null;
    for (const name of Object.keys(manifest.files)) {
      const schema = lookupSchema(name);
      if (!schema || !(name in files)) return null;
      if (!trustedSchema && !schema.safeParse(files[name]).success) return null;
    }
    return { manifest, files };
  } catch {
    return null;
  }
}

/** Same bytes as `JSON.stringify({ manifest, files })`, reusing already-serialised parts so `files` is stringified once per cold load. */
export function lastGoodJson(manifestJson: string, filesJson: string): string {
  return `{"manifest":${manifestJson},"files":${filesJson}}`;
}
