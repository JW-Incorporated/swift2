/** Bundle-file download + validation for `load.ts` (split out for the 300-line limit). */
import type { z } from 'zod';
import type { Manifest } from './schema';
import type { CachedBundleRecord } from './load-cache';
import { lookupSchema } from './validation-contract';
import { createHash } from './hash';
import { mapPool } from './pool';
import { beginStage } from './timing';
import { validateEntry } from './load-cache';
import { joinUrl, transportFetch } from './load-transport';
import {
  BundleIntegrityError,
  BundleLoadError,
  TransportError,
  type BundleFiles,
  type FetchLike,
} from './load-types';

const FETCH_CONCURRENCY = 5;

function schemaForManifestEntry(name: string): z.ZodTypeAny {
  const schema = lookupSchema(name);
  if (!schema) {
    throw new BundleLoadError(
      `No schema mapped for manifest entry "${name}" — update schemaForManifestEntry() in load.ts.`,
    );
  }
  return schema;
}

export interface FetchedFiles {
  files: BundleFiles;
  skipped: string[];
  pruned: boolean;
}

/** Fetches and validates every manifest file this build can read. Throws `TransportError` / `BundleIntegrityError` / zod errors; the caller decides on fallback. */
export async function fetchBundleFiles(args: {
  manifest: Manifest;
  bundleVersion: string;
  baseUrl: string;
  fetchImpl: FetchLike;
  requestTimeoutMs: number;
  dropUnknown: boolean;
  /** A previous full load (same schema fingerprint): files whose manifest sha256 + bytes are unchanged are reused instead of fetched (#4508). */
  reusable?: CachedBundleRecord | null;
}): Promise<FetchedFiles> {
  const { manifest, bundleVersion, baseUrl, fetchImpl, requestTimeoutMs, dropUnknown, reusable } =
    args;
  const files: BundleFiles = {};
  const skipped: string[] = [];
  let pruned = false;
  const wanted: Array<[string, (typeof manifest.files)[string]]> = [];
  for (const [name, entry] of Object.entries(manifest.files)) {
    // A catalogue added after this build has nothing here that could read it.
    if (dropUnknown && !lookupSchema(name)) skipped.push(name);
    else wanted.push([name, entry]);
  }
  // Bodies download concurrently (capped), so per-file 'download' marks now
  // overlap in time. Hash/parse/validate below stay in manifest order, so the
  // first failing file in manifest order decides the error. We never await
  // fetches past a decisive failure (a hung one must not block the fallback);
  // their results are discarded and nothing they do is written.
  const reuses = ([name, entry]: (typeof wanted)[number]): boolean => {
    const before = reusable?.manifest?.files?.[name];
    return (
      !!before &&
      before.sha256 === entry.sha256 &&
      before.bytes === entry.bytes &&
      !!reusable?.files &&
      name in reusable.files
    );
  };
  const { slots, stop } = mapPool(wanted, FETCH_CONCURRENCY, async (item) => {
    const [name, entry] = item;
    if (reuses(item)) return null;
    const endDownload = beginStage('download', name);
    const fileRes = await transportFetch(
      fetchImpl,
      joinUrl(baseUrl, `${bundleVersion}/${entry.path}`),
      undefined,
      requestTimeoutMs,
    );
    if (!fileRes.ok) {
      throw new TransportError(`Fetching "${entry.path}" failed with HTTP ${fileRes.status}`);
    }
    const body = await fileRes.text();
    endDownload();
    return body;
  });
  try {
    for (const [i, [name, entry]] of wanted.entries()) {
      const settled = await slots[i]!;
      if (!settled.ok) throw settled.error;
      const text = settled.value;
      if (text === null) {
        // Unchanged since a validated full load under this schema fingerprint: the manifest hash match is the integrity check.
        files[name] = reusable!.files[name];
        continue;
      }
      const endHash = beginStage('hash', name);
      const bytes = new TextEncoder().encode(text);
      const byteLength = bytes.length;
      if (byteLength !== entry.bytes) {
        throw new BundleIntegrityError(name, `expected ${entry.bytes} bytes, got ${byteLength}`);
      }
      const actualHash = await createHash(bytes);
      if (actualHash !== entry.sha256) {
        throw new BundleIntegrityError(
          name,
          `sha256 mismatch (expected ${entry.sha256}, got ${actualHash})`,
        );
      }
      endHash();
      const schema = schemaForManifestEntry(name);
      const endParse = beginStage('parse', name);
      const json: unknown = JSON.parse(text);
      endParse();
      const endValidate = beginStage('validate', name);
      const result = validateEntry(schema, json, dropUnknown);
      endValidate();
      if (result.kind === 'invalid') {
        throw new BundleIntegrityError(
          name,
          `schema validation failed: ${JSON.stringify(result.issues)}`,
        );
      }
      if (result.kind === 'drop-file') {
        pruned = true;
        skipped.push(name);
      } else {
        if (result.removed > 0) pruned = true;
        files[name] = result.data;
      }
    }
  } finally {
    stop();
  }
  return { files, skipped, pruned };
}
