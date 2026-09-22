#!/usr/bin/env node
// Imports a reviewed batch of credited Taylor/Taylor-related photo metadata
// into social/photo-library.json. It never posts or touches queue items.
//
// Two modes:
//   (default) pre-placed:  download/crop the image into
//     apps/web/public/social/library/photos/ yourself first, then run this
//     tool with the exact source/credit — unchanged from before.
//   --fetch:  each candidate carries a `sourceUrl` (the actual image bytes)
//     instead of a pre-placed file; this script downloads it into
//     apps/web/public/social/library/photos/, named from `mediaPath`, and
//     computes a sha256 of the bytes for content-based dedup (kanban
//     t_e1d26de7, 2026-09-22 — pool-expansion pipeline: catches the same
//     photo re-shared/reposted under a different URL/filename across
//     accounts, which a mediaPath/id dedupe alone would miss). A candidate
//     whose hash already exists anywhere in the library is skipped and
//     reported, never silently overwritten.
//
// Default is a dry run; --write persists the merged inventory (and, under
// --fetch, the downloaded files).
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePhotoEntry } from './lib/photo-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PHOTOS_DIR = path.join(ROOT, 'apps', 'web', 'public', 'social', 'library', 'photos');

/**
 * Resolves a candidate's `mediaPath` to an absolute path under `photosDir`,
 * or throws if it would escape that directory. `validatePhotoEntry` only
 * checks that `mediaPath` STARTS WITH `/social/library/photos/`, so a
 * crafted `/social/library/photos/../../../etc/foo.jpg` still passes it —
 * this is the actual write-path guard, kept as a standalone pure function
 * so it can be unit tested (fresh-context review, kanban t_e1d26de7).
 */
export function resolvePhotoDestPath(mediaPath, photosDir) {
  const destRelative = mediaPath.replace(/^\/social\/library\/photos\//, '');
  const destPath = path.join(photosDir, destRelative);
  const rel = path.relative(photosDir, destPath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`mediaPath "${mediaPath}" resolves outside the photos directory — refusing to write.`);
  }
  return destPath;
}

// The rest of this file only runs as a CLI entrypoint, never on import (so
// the export above can be unit-tested without a network call / real argv).
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

async function main() {
  const inventoryPath = path.join(ROOT, 'social', 'photo-library.json');
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const inputPath = inputIndex === -1 ? null : args[inputIndex + 1];
  const write = args.includes('--write');
  const fetchMode = args.includes('--fetch');

  if (!inputPath) {
    throw new Error(
      'Usage: node scripts/social/import-photo-library.mjs --input <candidates.json> [--write] [--fetch]',
    );
  }
  const input = JSON.parse(await readFile(path.resolve(ROOT, inputPath), 'utf8'));
  const candidates = Array.isArray(input) ? input : input.photos;
  if (!Array.isArray(candidates)) throw new Error('Candidate file must be a JSON array or an object with a photos array.');

  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const seenHashes = await existingLibraryHashes(inventory);
  const skippedDuplicates = [];

  if (fetchMode) {
    await mkdir(PHOTOS_DIR, { recursive: true });
    for (const candidate of candidates) {
      if (typeof candidate.sourceUrl !== 'string' || !/^https?:\/\//i.test(candidate.sourceUrl)) {
        throw new Error(`${candidate?.id ?? '(unknown)'}: --fetch requires a candidate "sourceUrl" http(s) URL to download from.`);
      }
      const res = await fetch(candidate.sourceUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LongLiveSocialLibraryImporter/1.0)' },
      });
      if (!res.ok) throw new Error(`${candidate.id}: failed to fetch ${candidate.sourceUrl}: ${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const hash = createHash('sha256').update(buf).digest('hex');
      if (seenHashes.has(hash)) {
        skippedDuplicates.push({ id: candidate.id, duplicateOf: seenHashes.get(hash) });
        continue;
      }
      const destPath = resolvePhotoDestPath(candidate.mediaPath, PHOTOS_DIR);
      await mkdir(path.dirname(destPath), { recursive: true });
      if (write) await writeFile(destPath, buf);
      seenHashes.set(hash, candidate.id);
    }
  }

  const toImport = candidates.filter((c) => !skippedDuplicates.some((d) => d.id === c.id));
  for (const candidate of toImport) {
    const findings = validatePhotoEntry(candidate);
    if (findings.length) throw new Error(`${candidate?.id ?? '(unknown)'}: ${findings.join('; ')}`);
    // Pre-placed mode always requires the file to already exist; fetch mode
    // sources the bytes itself, so it never needs this check.
    if (!fetchMode) await access(path.join(ROOT, 'apps', 'web', 'public', candidate.mediaPath));
  }

  const merged = [...inventory.photos];
  for (const candidate of toImport) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sourceUrl is fetch-only plumbing, never stored in the inventory
    const { sourceUrl, ...entry } = candidate;
    const existing = merged.findIndex((photo) => photo.id === entry.id || photo.mediaPath === entry.mediaPath);
    if (existing === -1) merged.push(entry);
    else merged[existing] = entry;
  }
  merged.sort((a, b) => a.id.localeCompare(b.id));
  const next = { ...inventory, photos: merged };
  if (write) await writeFile(inventoryPath, JSON.stringify(next, null, 2) + '\n');

  console.log(
    `${write ? 'updated' : 'validated'} photo library: ${toImport.length} candidate(s) imported, ` +
      `${skippedDuplicates.length} duplicate(s) skipped, ${merged.length} total inventory entries.`,
  );
  if (skippedDuplicates.length) {
    for (const dup of skippedDuplicates) console.log(`  skipped ${dup.id}: content-identical to existing entry "${dup.duplicateOf}"`);
  }
}

async function sha256OfFile(filePath) {
  const buf = await readFile(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

async function existingLibraryHashes(inventory) {
  const hashes = new Map(); // hash -> id
  for (const photo of inventory.photos) {
    const filePath = path.join(ROOT, 'apps', 'web', 'public', photo.mediaPath);
    try {
      hashes.set(await sha256OfFile(filePath), photo.id);
    } catch {
      // File missing on disk (e.g. running against a checkout without LFS
      // assets) — can't hash it, so it just won't be a dedup candidate.
    }
  }
  return hashes;
}
