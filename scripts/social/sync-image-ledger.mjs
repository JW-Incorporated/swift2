#!/usr/bin/env node
// Rebuilds social/posted-images.json from social/posted/** (idempotent; see
// lib/image-ledger.mjs). Backfill and refresh are the same command:
//
//   node scripts/social/sync-image-ledger.mjs            # report only
//   node scripts/social/sync-image-ledger.mjs --write    # rewrite the ledger
//
// Media whose file was later deleted is recovered from git history. Exits 1 if
// any posted image could not be fingerprinted (so a gap is never silent).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isLfsPointerBuffer } from './lib/lfs-pointer.mjs';
import { buildLedger, fingerprintMedia, readLedger, readRecords, writeLedger } from './lib/image-ledger.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function gitHistoryBytes(mediaPath) {
  const rel = `apps/web/public${mediaPath}`;
  try {
    const sha = execFileSync('git', ['log', '-1', '--format=%H', '--all', '--', rel], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (!sha) return null;
    for (const rev of [`${sha}:${rel}`, `${sha}^:${rel}`]) {
      try {
        const buf = execFileSync('git', ['show', rev], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
        if (buf.length && !isLfsPointerBuffer(buf)) return buf;
      } catch {
        // try the parent revision (the commit that deleted the file)
      }
    }
  } catch {
    // no history available
  }
  return null;
}

/** Rebuilds the ledger from the posted records under `root`. */
export async function syncImageLedger({ root = ROOT, write = false, fallback = gitHistoryBytes, fetchImpl } = {}) {
  const posted = await readRecords(path.join(root, 'social', 'posted'));
  const existing = await readLedger(root);
  const options = { root, fallback, ...(fetchImpl ? { fetchImpl } : {}) };
  const result = await buildLedger(posted, existing, (mediaPath) => fingerprintMedia(mediaPath, options));
  if (write) await writeLedger(root, result.entries);
  return result;
}

async function main() {
  const { entries, unresolved } = await syncImageLedger({ write: process.argv.includes('--write') });
  console.log(`image ledger: ${entries.length} entries${process.argv.includes('--write') ? ' written' : ' (dry run)'}`);
  for (const u of unresolved) console.error(`UNRESOLVED ${u.post}: ${u.file}`);
  if (unresolved.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
