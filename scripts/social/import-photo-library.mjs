#!/usr/bin/env node
// Imports a reviewed batch of credited Taylor/Taylor-related photo metadata
// into social/photo-library.json. It never downloads, posts, or rewrites queue
// items: download/crop the image into apps/web/public/social/library/photos/
// first, then run this tool with the exact source and credit captured from the
// editorial source. Default is a dry run; --write persists the merged inventory.
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePhotoEntry } from './lib/photo-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const inventoryPath = path.join(ROOT, 'social', 'photo-library.json');
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const inputPath = inputIndex === -1 ? null : args[inputIndex + 1];
const write = args.includes('--write');

if (!inputPath) throw new Error('Usage: node scripts/social/import-photo-library.mjs --input <candidates.json> [--write]');
const input = JSON.parse(await readFile(path.resolve(ROOT, inputPath), 'utf8'));
const candidates = Array.isArray(input) ? input : input.photos;
if (!Array.isArray(candidates)) throw new Error('Candidate file must be a JSON array or an object with a photos array.');

for (const candidate of candidates) {
  const findings = validatePhotoEntry(candidate);
  if (findings.length) throw new Error(`${candidate?.id ?? '(unknown)'}: ${findings.join('; ')}`);
  await access(path.join(ROOT, 'apps', 'web', 'public', candidate.mediaPath));
}

const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
const merged = [...inventory.photos];
for (const candidate of candidates) {
  const existing = merged.findIndex((photo) => photo.id === candidate.id || photo.mediaPath === candidate.mediaPath);
  if (existing === -1) merged.push(candidate);
  else merged[existing] = candidate;
}
merged.sort((a, b) => a.id.localeCompare(b.id));
const next = { ...inventory, photos: merged };
if (write) await writeFile(inventoryPath, JSON.stringify(next, null, 2) + '\n');
console.log(`${write ? 'updated' : 'validated'} photo library: ${candidates.length} candidate(s), ${merged.length} total inventory entries.`);
