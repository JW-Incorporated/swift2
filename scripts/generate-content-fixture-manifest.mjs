#!/usr/bin/env node
/**
 * Regenerates packages/content's OS-010 fixture bundle manifest
 * (packages/content/src/fixtures/bundle/manifest.json) from the files
 * actually on disk there. Used by the fixture-bundle test to keep the
 * manifest's sha256/bytes honest, and is the template
 * scripts/build-content-bundle.mjs (OS-011) will follow for the real
 * published bundle.
 *
 * Deterministic: same input files -> same manifest.json (`files` map keys
 * are sorted, `bundleVersion` is a hash of every file's own hash — not a
 * timestamp or counter).
 *
 * Usage: node scripts/generate-content-fixture-manifest.mjs
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundleDir = fileURLToPath(
  new URL('../packages/content/src/fixtures/bundle/', import.meta.url),
);

const FILES = {
  eras: 'eras.json',
  milestones: 'milestones.json',
  tracks: 'tracks.json',
  theories: 'theories.json',
  videos: 'videos.json',
  eraSecrets: 'era-secrets.json',
  merch: 'merch.json',
  songMoods: 'song-moods.json',
  clownbotLore: 'clownbot-lore.json',
  'content:folklore': 'eras/folklore.json',
};

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

const files = {};
for (const name of Object.keys(FILES).sort()) {
  const path = FILES[name];
  const buf = readFileSync(join(bundleDir, path));
  files[name] = { path, sha256: sha256(buf), bytes: buf.byteLength };
}

const bundleVersion = sha256(
  Object.keys(files)
    .sort()
    .map((name) => `${name}:${files[name].sha256}`)
    .join('\n'),
);

const manifest = {
  schemaVersion: 1,
  bundleVersion,
  generatedAt: '2026-09-05T00:00:00.000Z',
  files,
};

writeFileSync(join(bundleDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote manifest.json (bundleVersion=${bundleVersion})`);
