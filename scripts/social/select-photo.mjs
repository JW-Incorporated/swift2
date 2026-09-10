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

// Accepts both `--era value` and `--era=value`, and REJECTS any unrecognized
// argument outright (Codex review round 4, kanban t_75ec7106: the old parser
// only matched a bare `--era` token and silently ignored everything else —
// `--era=reputation` looked exactly like a request for a reputation photo
// but was silently treated as no `--era` at all, quietly re-opening the
// off-era-photo bug this script exists to prevent). Fail loud on anything
// unrecognized rather than fail open into unconstrained selection.
let era = null;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--era') {
    era = args[++i];
    if (typeof era !== 'string') throw new Error('Usage: node scripts/social/select-photo.mjs [--era <tag>] — --era requires a value.');
  } else if (arg.startsWith('--era=')) {
    era = arg.slice('--era='.length);
  } else {
    throw new Error(`Usage: node scripts/social/select-photo.mjs [--era <tag>] — unrecognized argument ${JSON.stringify(arg)}.`);
  }
}
era = typeof era === 'string' ? era.trim() : null;
if (args.some((a) => a === '--era' || a.startsWith('--era=')) && !era) {
  throw new Error('Usage: node scripts/social/select-photo.mjs [--era <tag>] — <tag> must be a non-blank string.');
}

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
    era
      ? { photoId: selected.id, media: [selected.mediaPath], mediaCredit: selected.credit, mediaSource: selected.source, photoEra: era, reused: selected.reused }
      : { photoId: selected.id, media: [selected.mediaPath], mediaCredit: selected.credit, mediaSource: selected.source, reused: selected.reused },
    null,
    2,
  ),
);
