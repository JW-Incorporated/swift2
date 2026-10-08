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
import { resolveFrameFile } from './lib/frame-path.mjs';
import { describePhoto, normalizePhoto } from './lib/normalize-photo.mjs';
import { imageMeta } from '../content-engine/checkers/image-liveness.mjs';
import { dHash, findNearDuplicate } from './lib/perceptual-hash.mjs';
import { validatePhotoEntry } from './lib/photo-library.mjs';
import { isLfsPointerBuffer } from './lib/lfs-pointer.mjs';
import { BudgetExhaustedError, DEFAULT_BUDGET_MS, createPoliteFetcher } from './lib/polite-fetch.mjs';
import { isMain } from '../lib/is-main.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PHOTOS_DIR = path.join(ROOT, 'apps', 'web', 'public', 'social', 'library', 'photos');
export const FRAMES_SCRATCH_DIR = path.join(ROOT, '.artifacts', 'video-scratch', 'frames');

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

// 2026-09-28: a 62MB GIF got sourced and shipped once with no size check at
// all (repo push warned it exceeded GitHub's own recommended 50MB limit) — cap
// ingestion at a sane social-media size so one oversized source never bloats
// the repo or slows the site.
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Downloads each candidate's `sourceUrl` (and writes it when `write`). A
 * failure on one candidate is recorded in `failed` and skipped — it never
 * aborts the rest (2026-10-06: one DjVu book scan killed a whole run).
 */
export async function fetchCandidates(
  candidates,
  { write, photosDir, seenHashes, framesDir = FRAMES_SCRATCH_DIR, fetchImpl = fetch, normalizeImpl = normalizePhoto, hashImpl = dHash, sleepImpl, nowImpl, budgetMs, warn },
) {
  const seenPerceptual = [];
  const skippedDuplicates = [];
  const failed = [];
  const deferred = [];
  await mkdir(photosDir, { recursive: true });
  // Per-host pacing, Retry-After backoff and the total time budget live in the
  // polite fetcher (Wikimedia 429'd 146 of 150 unpaced downloads, 2026-10-07).
  const polite = createPoliteFetcher({ fetchImpl, sleepImpl, nowImpl, budgetMs, warn });
  for (const candidate of candidates) {
    const id = candidate?.id ?? '(unknown)';
    // Local frames never touch the network, so the download budget must not defer them
    // (their videos are already in the ledger and would never be retried).
    const isLocal = typeof candidate?.sourceUrl === 'string' && /^file:/i.test(candidate.sourceUrl);
    if (!isLocal && polite.budgetSpent()) {
      deferred.push(id);
      continue;
    }
    try {
      if (typeof candidate.sourceUrl !== 'string' || !/^(https?|file):\/\//i.test(candidate.sourceUrl)) {
        throw new Error('--fetch requires a candidate "sourceUrl" http(s) (or local file://) URL to download from.');
      }
      let raw;
      if (isLocal) {
        // Locally extracted video frames (source-video-frames.mjs Mode A): no network, no pacing, no budget.
        raw = await readFile(await resolveFrameFile(candidate.sourceUrl, framesDir));
      } else {
        const res = await polite.fetch(candidate.sourceUrl);
        if (!res.ok) throw new Error(`failed to fetch ${candidate.sourceUrl}: ${res.status} ${res.statusText}`);
        raw = Buffer.from(await res.arrayBuffer());
      }
      if (raw.byteLength > MAX_PHOTO_BYTES) {
        throw new Error(
          `fetched image is ${(raw.byteLength / 1024 / 1024).toFixed(1)}MB, over the ${MAX_PHOTO_BYTES / 1024 / 1024}MB import cap (${candidate.sourceUrl})`,
        );
      }
      // Normalize BEFORE hashing: the library's existing hashes are of stored (normalized) bytes.
      const buf = await normalizeImpl(raw, candidate.mediaPath);
      if (candidate.minLongEdge !== undefined) {
        const meta = imageMeta(buf);
        const longEdge = Math.max(meta?.width ?? 0, meta?.height ?? 0);
        if (longEdge < candidate.minLongEdge) {
          throw new Error(`image long edge is ${longEdge || 'unreadable'}px, under the ${candidate.minLongEdge}px minimum (${candidate.sourceUrl})`);
        }
      }
      const hash = createHash('sha256').update(buf).digest('hex');
      if (seenHashes.has(hash)) {
        skippedDuplicates.push({ id: candidate.id, duplicateOf: seenHashes.get(hash) });
        continue;
      }
      // The same wire photo republished by another outlet is recompressed, so
      // sha256 misses it; a perceptual hash within this run's downloads catches it.
      const perceptual = await hashImpl(buf);
      const near = findNearDuplicate(perceptual, seenPerceptual);
      if (near) {
        skippedDuplicates.push({ id: candidate.id, duplicateOf: near.id });
        continue;
      }
      const destPath = resolvePhotoDestPath(candidate.mediaPath, photosDir);
      await mkdir(path.dirname(destPath), { recursive: true });
      if (write) await writeFile(destPath, buf);
      seenHashes.set(hash, candidate.id);
      Object.assign(candidate, await describePhoto(buf)); // width/height/bytes land in the library entry
      if (perceptual) seenPerceptual.push({ hash: perceptual, id: candidate.id });
    } catch (err) {
      if (err instanceof BudgetExhaustedError) deferred.push(id);
      else failed.push({ id, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return { skippedDuplicates, failed, deferred };
}

/** The run fails only when there was at least one candidate and every one failed. */
export function assertNotAllFailed(total, failedCount) {
  if (total > 0 && failedCount === total) {
    throw new Error(`all ${total} candidate(s) failed to fetch — see warnings above.`);
  }
}

// The rest of this file only runs as a CLI entrypoint, never on import (so
// the export above can be unit-tested without a network call / real argv).
if (isMain(import.meta.url, process.argv[1])) {
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
  const seenHashes = existingLibraryHashes(inventory);
  const skippedDuplicates = [];

  const failed = [];
  const deferred = [];
  if (fetchMode) {
    const budgetIndex = args.indexOf('--budget-minutes');
    const budgetMinutes = budgetIndex === -1 ? NaN : Number(args[budgetIndex + 1]);
    const budgetMs = budgetMinutes > 0 ? budgetMinutes * 60_000 : DEFAULT_BUDGET_MS;
    const result = await fetchCandidates(candidates, { write, photosDir: PHOTOS_DIR, seenHashes, budgetMs });
    skippedDuplicates.push(...result.skippedDuplicates);
    failed.push(...result.failed);
    deferred.push(...result.deferred);
    for (const { id, reason } of result.failed) console.log(`::warning::${id}: ${reason}`);
    if (deferred.length) {
      console.log(`::warning::download time budget spent; ${deferred.length} candidate(s) deferred to the next run (not imported).`);
    }
    assertNotAllFailed(candidates.length, result.failed.length);
  }

  const toImport = candidates.filter(
    (c) => !skippedDuplicates.some((d) => d.id === c.id) && !failed.some((x) => x.id === c.id) && !deferred.includes(c.id),
  );
  for (const candidate of toImport) {
    const findings = validatePhotoEntry(candidate);
    if (findings.length) throw new Error(`${candidate?.id ?? '(unknown)'}: ${findings.join('; ')}`);
    // Pre-placed mode always requires the file to already exist; fetch mode
    // sources the bytes itself, so it never needs this check.
    if (!fetchMode) await access(path.join(ROOT, 'apps', 'web', 'public', candidate.mediaPath));
  }

  const merged = [...inventory.photos];
  for (const candidate of toImport) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sourceUrl/minLongEdge are fetch-only plumbing, never stored in the inventory
    const { sourceUrl, minLongEdge, ...entry } = candidate;
    try {
      const bytes = await readFile(path.join(ROOT, 'apps', 'web', 'public', entry.mediaPath));
      const meta = isLfsPointerBuffer(bytes) ? null : imageMeta(bytes);
      if (meta?.width && meta?.height) {
        Object.assign(entry, { width: meta.width, height: meta.height, bytes: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex') });
      }
    } catch {
      // File not on disk (dry run in fetch mode) — dimensions get recorded on the --write run.
    }
    const existing = merged.findIndex((photo) => photo.id === entry.id || photo.mediaPath === entry.mediaPath);
    if (existing === -1) merged.push(entry);
    else merged[existing] = entry;
  }
  merged.sort((a, b) => a.id.localeCompare(b.id));
  const next = { ...inventory, photos: merged };
  if (write) await writeFile(inventoryPath, JSON.stringify(next, null, 2) + '\n');

  console.log(
    `${write ? 'updated' : 'validated'} photo library: ${toImport.length} candidate(s) imported, ` +
      `${skippedDuplicates.length} duplicate(s) skipped, ${failed.length} failed/skipped, ${merged.length} total inventory entries.`,
  );
  if (skippedDuplicates.length) {
    for (const dup of skippedDuplicates) console.log(`  skipped ${dup.id}: content-identical to existing entry "${dup.duplicateOf}"`);
  }
}

// Dedupe against the `sha256` recorded in photo-library.json — existing photos
// are Git LFS pointers in CI checkouts, so their files are never read here.
export function existingLibraryHashes(inventory) {
  const hashes = new Map(); // hash -> id
  for (const photo of inventory.photos) {
    if (typeof photo.sha256 === 'string') hashes.set(photo.sha256, photo.id);
  }
  return hashes;
}
