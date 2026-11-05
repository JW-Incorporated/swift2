#!/usr/bin/env node
// Re-applies lib/era-tags.mjs's era-keyword list to photos ALREADY in
// social/photo-library.json, so an era added to that list after a photo was
// sourced still reaches the photo (issue #6644).
//
// Why this exists: era tags were only ever assigned at ingest, inside
// source-reddit-photos.mjs. Every photo in the library when a new era joined
// the keyword list kept its generic `fan-photo`/`eras-tour` tags forever, and
// `select-photo.mjs --era <slug>` hard-fails on an era with no tagged photo —
// which is how the Showgirl era ended up with eight eligible photos in the
// library and zero that a themed draft could select, blocking the daily news
// reserve. Re-sourcing could not fix it either: the importer keys on photo id,
// so a re-run of the adapter is a no-op re-import for a post already stored.
//
// Read-only by default (a dry run prints what it WOULD change); `--write`
// persists. Never downloads, never posts, never touches queue items, and never
// re-classifies a photo that already carries an era tag — see
// lib/era-tags.mjs's `missingEraTag` for why that rule is load-bearing.
//
// Usage:
//   node scripts/social/backfill-era-tags.mjs            # dry run
//   node scripts/social/backfill-era-tags.mjs --write
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from '../lib/is-main.mjs';
import { withEraTag } from './lib/era-tags.mjs';
import { validatePhotoEntry } from './lib/photo-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Returns `{ photos, changes }` — a new photos array with inferred era tags
 * prepended, and one `{ id, era }` record per entry that changed. Pure: the
 * input array and its entries are never mutated.
 */
export function backfillEraTags(photos) {
  const changes = [];
  const next = photos.map((photo) => {
    const tags = withEraTag(photo);
    if (!tags) return photo;
    changes.push({ id: photo.id, era: tags[0] });
    return { ...photo, tags };
  });
  return { photos: next, changes };
}

export async function main({ argv = process.argv.slice(2), log = console.log } = {}) {
  const write = argv.includes('--write');
  const unknown = argv.filter((arg) => arg !== '--write');
  if (unknown.length) {
    throw new Error(`Usage: node scripts/social/backfill-era-tags.mjs [--write] — unrecognized argument ${JSON.stringify(unknown[0])}.`);
  }

  const inventoryPath = path.join(ROOT, 'social', 'photo-library.json');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const { photos, changes } = backfillEraTags(inventory.photos);

  // A retag must never produce an entry the library's own validator rejects.
  const invalid = photos.flatMap((photo) => validatePhotoEntry(photo).map((finding) => `${photo.id}: ${finding}`));
  if (invalid.length) throw new Error(`refusing to write an invalid photo library:\n${invalid.join('\n')}`);

  const byEra = new Map();
  for (const change of changes) byEra.set(change.era, (byEra.get(change.era) ?? 0) + 1);

  log(`${write ? 'retagged' : 'would retag'} ${changes.length} photo(s) with a missing era tag.`);
  for (const [era, count] of [...byEra.entries()].sort((a, b) => b[1] - a[1])) log(`  ${String(count).padStart(3)}  ${era}`);
  for (const change of changes) log(`  ${change.id} -> ${change.era}`);

  if (write && changes.length) {
    await writeFile(inventoryPath, JSON.stringify({ ...inventory, photos }, null, 2) + '\n');
  }
  return 0;
}

if (isMain(import.meta.url, process.argv[1])) {
  await main();
}
