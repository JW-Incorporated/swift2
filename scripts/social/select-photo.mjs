#!/usr/bin/env node
// Prints the next credited social photo without mutating the queue or posting.
// Growth/Tree can run this before authoring a paired draft; the JSON output is
// ready to copy into media[0], mediaCredit, mediaSource, and photoId.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectSocialPhoto, validatePhotoEntry } from './lib/photo-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function readJsonDir(dir) {
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(dir, file), 'utf8'))));
}

const inventory = JSON.parse(await readFile(path.join(ROOT, 'social', 'photo-library.json'), 'utf8'));
const invalid = inventory.photos.flatMap((photo) => validatePhotoEntry(photo).map((finding) => `${photo.id}: ${finding}`));
if (invalid.length) throw new Error(`Invalid photo library:\n${invalid.join('\n')}`);
const posted = await readJsonDir(path.join(ROOT, 'social', 'posted'));
const selected = selectSocialPhoto(inventory.photos, posted);
if (!selected) throw new Error('No credited photo is available in social/photo-library.json.');
console.log(JSON.stringify({ photoId: selected.id, media: [selected.mediaPath], mediaCredit: selected.credit, mediaSource: selected.source, reused: selected.reused }, null, 2));
