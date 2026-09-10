/**
 * OS-010 done-when: "packages/content typechecks and a fixture bundle
 * validates." This test loads the on-disk fixture bundle
 * (`src/fixtures/bundle/**`) exactly the way a real loader (OS-013) will —
 * read manifest.json, verify every listed file's sha256/bytes actually
 * match what's on disk, then parse+validate each file's content against its
 * schema — so a hand-edited fixture that silently drifted from its own
 * manifest, or from the zod contract, fails loudly here instead of at
 * runtime in OS-013.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  clownbotLoreBundleFileSchema,
  contentBundleFileSchema,
  eraSchema,
  eraSecretsBundleFileSchema,
  manifestSchema,
  merchCatalogueSchema,
  milestoneSchema,
  songMoodsBundleFileSchema,
  theoriesBundleFileSchema,
  tracksBundleFileSchema,
  videosBundleFileSchema,
} from './schema';
import { z } from 'zod';

const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');

/** Which schema validates which manifest entry, by manifest key prefix. */
function schemaFor(name: string) {
  if (name === 'eras') return z.array(eraSchema);
  if (name === 'milestones') return z.array(milestoneSchema);
  if (name === 'tracks') return tracksBundleFileSchema;
  if (name === 'theories') return theoriesBundleFileSchema;
  if (name === 'videos') return videosBundleFileSchema;
  if (name === 'eraSecrets') return eraSecretsBundleFileSchema;
  if (name === 'merch') return merchCatalogueSchema;
  if (name === 'songMoods') return songMoodsBundleFileSchema;
  if (name === 'clownbotLore') return clownbotLoreBundleFileSchema;
  if (name.startsWith('content:')) return contentBundleFileSchema;
  throw new Error(`No schema mapped for manifest entry "${name}" — update schemaFor() in this test.`);
}

describe('OS-010 fixture bundle', () => {
  const manifestRaw = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));

  it('manifest.json itself matches manifestSchema', () => {
    expect(() => manifestSchema.parse(manifestRaw)).not.toThrow();
  });

  const manifest = manifestSchema.parse(manifestRaw);

  it('every file the manifest lists exists on disk with a matching sha256 and byte count', () => {
    for (const [name, entry] of Object.entries(manifest.files)) {
      const buf = readFileSync(join(bundleDir, entry.path));
      expect(buf.byteLength, `${name}: byte count`).toBe(entry.bytes);
      const actualHash = createHash('sha256').update(buf).digest('hex');
      expect(actualHash, `${name}: sha256`).toBe(entry.sha256);
    }
  });

  it('every file the manifest lists validates against its schema', () => {
    for (const [name, entry] of Object.entries(manifest.files)) {
      const raw = JSON.parse(readFileSync(join(bundleDir, entry.path), 'utf8'));
      const schema = schemaFor(name);
      const result = schema.safeParse(raw);
      expect(result.success, `${name} (${entry.path}) failed validation: ${JSON.stringify('error' in result ? result.error?.issues : undefined)}`).toBe(true);
    }
  });

  it('bundleVersion is a deterministic hash of the per-file hashes (not a timestamp/counter)', () => {
    const recomputed = createHash('sha256')
      .update(
        Object.keys(manifest.files)
          .sort()
          .map((name) => `${name}:${manifest.files[name]!.sha256}`)
          .join('\n'),
      )
      .digest('hex');
    expect(manifest.bundleVersion).toBe(recomputed);
  });

  it('schemaVersion is a positive integer', () => {
    expect(Number.isInteger(manifest.schemaVersion)).toBe(true);
    expect(manifest.schemaVersion).toBeGreaterThan(0);
  });
});
