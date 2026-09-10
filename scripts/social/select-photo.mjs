#!/usr/bin/env node
// Prints the next credited social photo without mutating the queue or posting.
// Growth/Tree can run this before authoring a paired draft; the JSON output is
// ready to copy into media[0], mediaCredit, mediaSource, and photoId.
//
// --era <tag> (2026-09-10, kanban t_75ec7106): when the draft has a target
// era/theme (the campaign or lens/egg node already names it — see
// packages/experience/src/lenses.ts's EGG_NODES[].eraId for the easter-eggs
// lens), pass it here so the selector only offers photos tagged with that
// era. Omitting it falls back to the old least-used-of-everything behavior,
// which is how a Lover-era tour photo shipped on a reputation-era post
// (2026-09-09-clue-web-reputation-snake-x.json) — always pass --era for a
// themed post; the output's `photoId`/media/credit/source belong together
// with a matching `photoEra` field on the queue item (see queue-schema.mjs).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectSocialPhoto, validatePhotoEntry } from './lib/photo-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const eraIndex = args.indexOf('--era');
const era = eraIndex === -1 ? null : args[eraIndex + 1];
if (eraIndex !== -1 && !era) throw new Error('Usage: node scripts/social/select-photo.mjs [--era <tag>]');

async function readJsonDir(dir) {
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(dir, file), 'utf8'))));
}

const inventory = JSON.parse(await readFile(path.join(ROOT, 'social', 'photo-library.json'), 'utf8'));
const invalid = inventory.photos.flatMap((photo) => validatePhotoEntry(photo).map((finding) => `${photo.id}: ${finding}`));
if (invalid.length) throw new Error(`Invalid photo library:\n${invalid.join('\n')}`);
const posted = await readJsonDir(path.join(ROOT, 'social', 'posted'));
const selected = selectSocialPhoto(inventory.photos, posted, era ? { requiredTags: [era] } : undefined);
if (!selected) {
  throw new Error(
    era
      ? `No credited photo tagged "${era}" is available in social/photo-library.json. This is a hard block, not a ` +
        `fallback-to-another-era situation — add a "${era}"-tagged photo via ` +
        '`npm run social:import-photo-library` before drafting this post (social/README.md).'
      : 'No credited photo is available in social/photo-library.json.',
  );
}
console.log(
  JSON.stringify(
    { photoId: selected.id, media: [selected.mediaPath], mediaCredit: selected.credit, mediaSource: selected.source, photoEra: era, reused: selected.reused },
    null,
    2,
  ),
);
