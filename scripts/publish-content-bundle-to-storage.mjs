#!/usr/bin/env node
// OS-012: mirrors an already-published content bundle (apps/web/public/
// content/, written by scripts/publish-content-bundle.mjs during `next
// build`) into the Supabase Storage bucket `content` so mobile — which
// never runs the Next.js build — can fetch the exact same artifact
// `packages/content`'s loader (OS-013) understands.
//
// Uploads only the files this bundleVersion's manifest lists (plus the
// manifest itself) under `<bundleVersion>/…`, all with
// `Cache-Control: public, max-age=31536000, immutable` (paths are hashed —
// once written, a `<bundleVersion>/…` object never changes, so aggressive
// caching is safe by construction). `current.json` is uploaded LAST, with a
// short TTL, and only after every immutable file for that version is
// confirmed uploaded — the same "manifest+files together, atomically"
// discipline the loader's own cache write (packages/content/src/load.ts)
// follows, applied to the publish side: a reader must never observe
// current.json pointing at a bundleVersion whose files aren't fully mirrored
// yet.
//
// Rollback: repoint current.json in Storage (and in apps/web/public/content/
// on the next deploy) at a still-present older <bundleVersion>/ directory —
// see docs/deploy.md. This script never deletes an older bundleVersion from
// Storage; only the local web publish directory is pruned
// (scripts/publish-content-bundle.mjs, keepPrevious: false), because mobile
// clients may still be reading an older version from Storage.
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (the same service-role
// write path scripts/knowledge-fb-upload.mjs already uses) — mirroring to a
// bucket is a privileged write, not a public read.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serviceClient } from './lib/supabase.mjs';
import { DEFAULT_OUT_ROOT } from './publish-content-bundle.mjs';
import { runMain } from './lib/cli.mjs';

export const BUCKET = 'content';
const IMMUTABLE_CACHE_CONTROL_SECONDS = 31536000; // 1 year — hashed, immutable paths
const POINTER_CACHE_CONTROL_SECONDS = 60; // short TTL — current.json changes every merge

/** Creates the public `content` bucket if it doesn't exist yet. Idempotent. */
export async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`could not list storage buckets: ${listError.message}`);
  if ((buckets ?? []).some((b) => b.name === BUCKET)) return false;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError) throw new Error(`could not create bucket "${BUCKET}": ${createError.message}`);
  return true;
}

/** Reads `outRoot/<bundleVersion>/manifest.json` and returns the parsed manifest plus every relative file path it (and the manifest file itself) needs uploaded. */
async function readManifest(outRoot, bundleVersion) {
  const manifestPath = path.join(outRoot, bundleVersion, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const relPaths = ['manifest.json', ...Object.values(manifest.files).map((f) => f.path)];
  return { manifest, relPaths };
}

/**
 * Uploads every file for `bundleVersion` under `<bundleVersion>/…` with an
 * immutable cache-control header, then — only once all of them succeed —
 * uploads `current.json` pointing at it. Throws on the first failed file
 * upload without touching `current.json`, so a partial mirror never becomes
 * "current". `fsImpl`/`supabase` injectable for tests.
 */
export async function mirrorBundle(supabase, outRoot, bundleVersion, fsImpl = { readFile }) {
  const { relPaths } = await readManifest(outRoot, bundleVersion);

  for (const relPath of relPaths) {
    const localPath = path.join(outRoot, bundleVersion, relPath);
    const contents = await fsImpl.readFile(localPath);
    const storagePath = `${bundleVersion}/${relPath}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, contents, {
      contentType: 'application/json',
      cacheControl: String(IMMUTABLE_CACHE_CONTROL_SECONDS),
      upsert: true,
    });
    if (error) {
      throw new Error(`upload of "${storagePath}" failed: ${error.message}`);
    }
  }

  const pointerBody = Buffer.from(`${JSON.stringify({ bundleVersion }, null, 2)}\n`, 'utf-8');
  const { error: pointerError } = await supabase.storage.from(BUCKET).upload('current.json', pointerBody, {
    contentType: 'application/json',
    cacheControl: String(POINTER_CACHE_CONTROL_SECONDS),
    upsert: true,
  });
  if (pointerError) {
    throw new Error(`upload of "current.json" failed: ${pointerError.message}`);
  }

  return { bundleVersion, filesUploaded: relPaths.length };
}

/** Reads the bundleVersion CI should mirror off `outRoot/current.json` (the file `publish-content-bundle.mjs` just wrote during `next build`). */
async function readLocalCurrentVersion(outRoot) {
  const pointer = JSON.parse(await readFile(path.join(outRoot, 'current.json'), 'utf-8'));
  if (!pointer.bundleVersion) throw new Error(`${outRoot}/current.json has no bundleVersion`);
  return pointer.bundleVersion;
}

async function main() {
  const outRootArg = process.argv.find((a) => a.startsWith('--out-root='));
  const outRoot = outRootArg ? path.resolve(outRootArg.slice('--out-root='.length)) : DEFAULT_OUT_ROOT;

  const supabase = serviceClient();
  if (!supabase) {
    console.error(
      'publish-content-bundle-to-storage: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected as repo Actions secrets in the content-publish workflow).',
    );
    return 1;
  }

  const bundleVersion = await readLocalCurrentVersion(outRoot);
  const created = await ensureBucket(supabase);
  if (created) console.log(`publish-content-bundle-to-storage: created public bucket "${BUCKET}"`);

  const { filesUploaded } = await mirrorBundle(supabase, outRoot, bundleVersion);
  console.log(
    `publish-content-bundle-to-storage: mirrored bundleVersion=${bundleVersion} (${filesUploaded} files) to Storage bucket "${BUCKET}"; current.json repointed.`,
  );
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'publish-content-bundle-to-storage' });
}

// exported for tests that need to point at a fixture outRoot without going
// through the CLI's env/argv handling.
export { readManifest, readLocalCurrentVersion };
