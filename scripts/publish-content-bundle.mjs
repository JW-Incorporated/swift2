#!/usr/bin/env node
// OS-012 (docs/specs/2026-09-05-one-source-three-surfaces.md §6): publishes
// the OS-011 content bundle into a target root and writes the `current.json`
// pointer next to it — `writeBundle()` (build-content-bundle.mjs) only ever
// produces the immutable `<outRoot>/<bundleVersion>/…` directory; the
// pointer file that tells a loader which version is current is this
// script's job, shared by both publish destinations:
//
//   - apps/web's own build (`prebuild`): publishes straight into
//     `apps/web/public/content/`, which Next/Vercel then ships as static
//     files — `https://www.longlivets.com/content/current.json` and
//     `.../<bundleVersion>/manifest.json` are this directory, verbatim.
//   - CI's `content-publish` job additionally mirrors the same bundle to
//     Supabase Storage for mobile (see publish-content-bundle-to-storage.mjs)
//     — a separate script because that destination needs the Storage API,
//     not a filesystem write.
//
// `keepPrevious: false` (the default, used by the web build) prunes any
// other `<outRoot>/<version>/` directories so a Vercel build artifact only
// ever ships the one version it was built with — old versions already
// served are cached `immutable` by the browser/CDN and never need to be
// re-fetched from an old deployment. The Storage mirror is a different
// story (mobile clients may still be pinned to an older bundleVersion and
// need it to keep existing there), so it never calls this with pruning on.
import path from 'node:path';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { register } from 'tsx/esm/api';
import { writeBundle } from './build-content-bundle.mjs';
import { ROOT } from './lib/generated-content.mjs';
import { runMain } from './lib/cli.mjs';

export const DEFAULT_OUT_ROOT = path.join(ROOT, 'apps', 'web', 'public', 'content');
export const DEFAULT_APP_CONFIG_PATH = path.join(ROOT, 'config', 'mobile', 'app-config.json');
const APP_CONFIG_SCHEMA_FILE = path.join(ROOT, 'packages', 'content', 'src', 'app-config.ts');

/**
 * Reads + validates the remote app config (kill switch, docs/mobile-release.md)
 * and returns its normalised body. Throws on invalid config so a bad file
 * fails the publish instead of reaching installed apps.
 */
export async function readAppConfigBody(configPath = DEFAULT_APP_CONFIG_PATH) {
  const raw = JSON.parse(await readFile(configPath, 'utf-8'));
  const unregister = register();
  let schema;
  try {
    schema = await import(pathToFileURL(APP_CONFIG_SCHEMA_FILE).href);
  } finally {
    await unregister();
  }
  const parsed = schema.appConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`invalid app config ${configPath}: ${parsed.error.message}`);
  }
  return `${JSON.stringify(raw, null, 2)}\n`;
}

/**
 * Publishes one bundle build into `outRoot`: writes
 * `outRoot/<bundleVersion>/…` (via `writeBundle`) plus `outRoot/current.json`
 * = `{ bundleVersion }`. Returns the manifest and both paths. Exported for
 * tests.
 */
export async function publishBundle({
  outRoot = DEFAULT_OUT_ROOT,
  resync = true,
  generatedAt,
  keepPrevious = false,
  appConfigPath = DEFAULT_APP_CONFIG_PATH,
} = {}) {
  // Validate first: an invalid config must fail the publish before anything is written.
  const appConfigBody = await readAppConfigBody(appConfigPath);
  const { manifest, dir } = await writeBundle({ outRoot, resync, generatedAt });

  if (!keepPrevious) {
    await mkdir(outRoot, { recursive: true });
    const entries = await readdir(outRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== manifest.bundleVersion) {
        await rm(path.join(outRoot, entry.name), { recursive: true, force: true });
      }
    }
  }

  const pointerPath = path.join(outRoot, 'current.json');
  const pointerBody = `${JSON.stringify({ bundleVersion: manifest.bundleVersion }, null, 2)}\n`;
  await writeFile(pointerPath, pointerBody);

  // Sibling of current.json — never under a bundleVersion, never a manifest
  // entry (installed apps hard-fail on unknown manifest entries).
  const appConfigOutPath = path.join(outRoot, 'app-config.json');
  await writeFile(appConfigOutPath, appConfigBody);

  return { manifest, dir, pointerPath, appConfigPath: appConfigOutPath };
}

async function main() {
  const outRootArg = process.argv.find((a) => a.startsWith('--out-root='));
  const outRoot = outRootArg ? path.resolve(outRootArg.slice('--out-root='.length)) : DEFAULT_OUT_ROOT;
  const resync = !process.argv.includes('--no-resync');
  const keepPrevious = process.argv.includes('--keep-previous');

  const { manifest, dir } = await publishBundle({ outRoot, resync, keepPrevious });
  console.log(
    `Published content bundle bundleVersion=${manifest.bundleVersion} (${Object.keys(manifest.files).length} files) -> ${dir}, current.json -> ${path.join(outRoot, 'current.json')}`,
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'publish-content-bundle' });
}
