#!/usr/bin/env node
// Imports the website's own content-seed photos (era moments, runway looks,
// candidate thumbnails) into social/photo-library.json. Never posts, never
// touches social/queue/. Founder request 2026-10-07; rights basis:
// docs/social/guardrails.md Guardrail 2 + docs/decisions.md 2026-10-01.
//
//   node scripts/social/import-site-photos.mjs                 dry run: enumerate + exclusion counts only
//   node scripts/social/import-site-photos.mjs --dry-run       also prints era/kind/url/alt per candidate, to audit before downloading
//   node scripts/social/import-site-photos.mjs --write [--max-import 500] [--max-mb 2000]
//
// Download policy: serial, ~1 req/s, browser-like UA, 20s timeout, any error is a
// ::warning:: and a skip. Kept only when the REAL decoded image is jpeg/png/webp
// with a long edge >= 800px; content-identical files (sha256) are dropped. Files
// are ALWAYS normalized (repo size, architect storage ruling 2026-10-07): long edge
// <= 2048px (never upscaled), orientation applied, EXIF/metadata stripped, JPEG
// q85 (PNG only when it has real transparency). Commons files are fetched as the
// 1920px thumbnail (Wikimedia asks bots to use thumbnail sizes), falling back to the
// original when it is smaller. Entries record width/height/bytes.
// Watermark heuristic: host denylist (Getty/stock comps) + url-path hints
// (watermark, comp, sample, placeholder) — see lib/site-photos.mjs.
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { MAX_PHOTO_BYTES, existingLibraryHashes, resolvePhotoDestPath } from './import-photo-library.mjs';
import { buildEntry, enumerateSitePhotoRefs, selectCandidates, sha256 } from './lib/site-photos.mjs';
import { validatePhotoEntry } from './lib/photo-library.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PHOTOS_DIR = path.join(ROOT, 'apps', 'web', 'public', 'social', 'library', 'photos');
const SEED_DIRS = ['content', 'lenses', 'candidates']; // never supabase/seed/merch
const MIN_LONG_EDGE = 800;
const MAX_EDGE = 2048;
const MAX_ENTRY_BYTES = 1.5 * 1024 * 1024; // library per-photo cap (LFS ruling 2026-10-07)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const DECODABLE = new Set(['jpeg', 'png', 'webp']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const argValue = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};

async function loadSeedModules() {
  const modules = [];
  for (const dir of SEED_DIRS) {
    const base = path.join(ROOT, 'supabase', 'seed', dir);
    for (const name of (await readdir(base)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))) {
      modules.push({ file: `${dir}/${name}`, mod: await import(pathToFileURL(path.join(base, name)).href) });
    }
  }
  return modules;
}

/** Normalized bytes: <= MAX_EDGE long edge, orientation applied, metadata stripped, JPEG q85 (PNG only with real transparency). */
export async function normalize(buf) {
  const base = sharp(buf).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true });
  const meta = await sharp(buf).metadata();
  const transparent = meta.hasAlpha && !(await sharp(buf).stats()).isOpaque;
  const out = await (transparent ? base.png({ compressionLevel: 9 }) : base.flatten({ background: '#ffffff' }).jpeg({ quality: 85, mozjpeg: true })).toBuffer();
  const { width, height } = await sharp(out).metadata();
  return { out, ext: transparent ? 'png' : 'jpg', width, height };
}

const COMMONS_ORIGINAL = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f]\/[0-9a-f]{2})\/([^/]+)$/;

async function download(url) {
  const m = COMMONS_ORIGINAL.exec(url);
  if (m) {
    try {
      return await downloadOnce(`${m[1]}/thumb/${m[2]}/${m[3]}/1920px-${m[3]}`);
    } catch {
      // thumbnail refused (original narrower than 1920px): fall through to the original
    }
  }
  return downloadOnce(url);
}

async function downloadOnce(url) {
  let res;
  for (let attempt = 0; ; attempt += 1) {
    res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*' }, signal: globalThis.AbortSignal.timeout(20_000) });
    if ((res.status !== 429 && res.status !== 503) || attempt >= 2) break;
    await sleep(Math.min(60, Number(res.headers.get('retry-after')) || 30) * 1000);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (!/^image\/(jpeg|png|webp)/i.test(res.headers.get('content-type') ?? '')) throw new Error(`not jpeg/png/webp (${res.headers.get('content-type')})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PHOTO_BYTES) throw new Error(`over the ${MAX_PHOTO_BYTES / 1024 / 1024}MB cap`);
  return buf;
}

async function main() {
  const write = process.argv.includes('--write');
  const maxImport = argValue('--max-import', 500);
  const maxBytes = argValue('--max-mb', 2000) * 1024 * 1024;
  const inventoryPath = path.join(ROOT, 'social', 'photo-library.json');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const libraryUrls = new Set(inventory.photos.map((p) => p.source));
  const libraryPaths = new Set(inventory.photos.map((p) => p.mediaPath));
  const libraryIds = new Set(inventory.photos.map((p) => p.id));

  const refs = enumerateSitePhotoRefs(await loadSeedModules());
  const { candidates, excluded } = selectCandidates(refs, { libraryUrls });
  const stats = { refs: refs.length, candidates: candidates.length, excluded, failed: 0, tooSmall: 0, duplicates: 0, imported: 0, bytes: 0, deferred: 0 };
  console.log(`enumerated ${refs.length} refs -> ${candidates.length} candidates`, JSON.stringify(excluded));
  if (process.argv.includes('--dry-run')) {
    for (const c of candidates) console.log(`${c.era ?? '-'}	${c.kind ?? '-'}	${c.url}	${buildEntry(c, 'jpg').alt}`);
  }
  if (!write) return;
  if (process.argv.includes('--renormalize')) await renormalizeExisting(inventory, inventoryPath);

  const seenHashes = await existingLibraryHashes(inventory);
  const entries = [];
  await mkdir(PHOTOS_DIR, { recursive: true });
  for (const [index, ref] of candidates.entries()) {
    if (stats.imported >= maxImport || stats.bytes >= maxBytes) {
      stats.deferred = candidates.length - index;
      break;
    }
    const id = buildEntry(ref, 'jpg').id;
    if (libraryIds.has(id)) {
      stats.duplicates += 1;
      continue;
    }
    try {
      await sleep(1000);
      const buf = await download(ref.url);
      const hash = sha256(buf);
      if (seenHashes.has(hash)) {
        stats.duplicates += 1;
        continue;
      }
      seenHashes.set(hash, id);
      const meta = await sharp(buf).metadata();
      if (!DECODABLE.has(meta.format)) throw new Error(`unsupported decoded format ${meta.format}`);
      if (Math.max(meta.width ?? 0, meta.height ?? 0) < MIN_LONG_EDGE) {
        stats.tooSmall += 1;
        continue;
      }
      const norm = await normalize(buf);
      const outHash = sha256(norm.out);
      if (seenHashes.has(outHash)) {
        stats.duplicates += 1;
        continue;
      }
      seenHashes.set(outHash, id);
      const entry = { ...buildEntry(ref, norm.ext), width: norm.width, height: norm.height, bytes: norm.out.byteLength, sha256: outHash };
      if (norm.out.byteLength > MAX_ENTRY_BYTES) throw new Error(`normalized file is ${norm.out.byteLength} bytes, over the library cap`);
      const findings = validatePhotoEntry(entry);
      if (findings.length) throw new Error(findings.join('; '));
      if (libraryPaths.has(entry.mediaPath)) continue;
      await writeFile(resolvePhotoDestPath(entry.mediaPath, PHOTOS_DIR), norm.out);
      entries.push(entry);
      libraryIds.add(id);
      stats.imported += 1;
      stats.bytes += norm.out.byteLength;
    } catch (err) {
      stats.failed += 1;
      console.log(`::warning::${ref.url}: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (entries.length && entries.length % 50 === 0) await saveInventory(inventoryPath, inventory, entries);
  }
  await saveInventory(inventoryPath, inventory, entries);
  console.log(JSON.stringify({ ...stats, megabytes: +(stats.bytes / 1024 / 1024).toFixed(1) }));
}

/** Re-applies normalize() to site-* entries imported before the 2026-10-07 storage rules (idempotent). */
async function renormalizeExisting(inventory, inventoryPath) {
  let count = 0;
  for (const entry of inventory.photos.filter((p) => p.id.startsWith('site-'))) {
    const oldPath = resolvePhotoDestPath(entry.mediaPath, PHOTOS_DIR);
    const norm = await normalize(await readFile(oldPath));
    entry.mediaPath = `/social/library/photos/${entry.id}.${norm.ext}`;
    const newPath = resolvePhotoDestPath(entry.mediaPath, PHOTOS_DIR);
    await writeFile(newPath, norm.out);
    if (newPath !== oldPath) await unlink(oldPath);
    Object.assign(entry, { width: norm.width, height: norm.height, bytes: norm.out.byteLength, sha256: sha256(norm.out) });
    count += 1;
  }
  await saveInventory(inventoryPath, inventory, []);
  console.log(`renormalized ${count} existing site-* entries`);
}

async function saveInventory(inventoryPath, inventory, entries) {
  const photos = [...inventory.photos.filter((p) => !entries.some((e) => e.id === p.id)), ...entries].sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(inventoryPath, JSON.stringify({ ...inventory, photos }, null, 2) + '\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
