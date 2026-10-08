#!/usr/bin/env node
// Writes an Instagram-ready variant next to every library photo whose aspect
// falls outside Instagram's 0.8-1.91 window, and adds its library entry (Bots
// v2 W10; design in lib/photo-variants.mjs). Local-only: never posts, never
// touches the queue. Idempotent — a variant whose file and entry both exist is
// left alone, so a re-run changes nothing.
//
//   node scripts/social/make-ig-variants.mjs            # dry run (default): report only
//   node scripts/social/make-ig-variants.mjs --write    # write files + social/photo-library.json
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { imageMeta } from '../content-engine/checkers/image-liveness.mjs';
import { isLfsPointerBuffer } from './lib/lfs-pointer.mjs';
import { renderVariant, variantEntry, variantPlan } from './lib/photo-variants.mjs';
import { isMain } from '../lib/is-main.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Animated or vector sources cannot be padded without changing their content. */
const SKIP_EXTENSIONS = new Set(['gif', 'webp', 'svg']);
const exists = (file) => readFile(file).then(() => true, () => false);

/**
 * `{ made, skipped, entries }` — `made`: variants written (or that a --write would write);
 * `skipped`: `{ id, reason }`. `root` is the repo root (injectable for tests).
 */
export async function makeIgVariants({ root = ROOT, write = false } = {}) {
  const inventoryPath = path.join(root, 'social', 'photo-library.json');
  const publicDir = path.join(root, 'apps', 'web', 'public');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const byId = new Map(inventory.photos.map((p) => [p.id, p]));
  const made = [];
  const skipped = [];
  const additions = new Map(); // original id -> variant entry
  for (const original of inventory.photos) {
    if (original.variantOf) continue;
    const ext = original.mediaPath.split('.').pop().toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) {
      const bytes = await readFile(path.join(publicDir, original.mediaPath)).catch(() => null);
      const meta = bytes ? imageMeta(bytes) : null;
      if (meta && variantPlan(meta.width, meta.height)) skipped.push({ id: original.id, reason: `${ext} source may be animated — not padded` });
      continue;
    }
    let bytes;
    try {
      bytes = await readFile(path.join(publicDir, original.mediaPath));
    } catch {
      skipped.push({ id: original.id, reason: 'source file not found locally' });
      continue;
    }
    // Library photos are Git LFS pointers in CI checkouts (docs/decisions.md 2026-10-07).
    if (isLfsPointerBuffer(bytes)) {
      console.log(`::warning::make-ig-variants: ${original.id} is a Git LFS pointer, not an image — skipped (run git lfs pull for it locally)`);
      skipped.push({ id: original.id, reason: 'Git LFS pointer, not an image' });
      continue;
    }
    const meta = imageMeta(bytes);
    const plan = meta ? variantPlan(meta.width, meta.height) : null;
    if (!plan) continue;
    const entry = variantEntry(original, plan);
    const file = path.join(publicDir, entry.mediaPath);
    const haveFile = await exists(file);
    const haveEntry = byId.has(entry.id);
    if (haveFile && haveEntry) continue;
    let size = null;
    if (!haveFile) {
      const out = await renderVariant(bytes, plan);
      size = out.buffer.byteLength;
      Object.assign(entry, { width: out.width, height: out.height, bytes: size, sha256: createHash('sha256').update(out.buffer).digest('hex') });
      if (write) {
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, out.buffer);
      }
    }
    if (haveFile && !haveEntry) {
      const existing = await readFile(file);
      if (!isLfsPointerBuffer(existing)) Object.assign(entry, { width: plan.width, height: plan.height, bytes: existing.byteLength, sha256: createHash('sha256').update(existing).digest('hex') });
    }
    if (!haveEntry) additions.set(original.id, entry);
    made.push({ id: entry.id, from: original.id, canvas: `${plan.width}x${plan.height}`, bytes: size, file: entry.mediaPath, wroteFile: !haveFile, addedEntry: !haveEntry });
  }
  if (write && additions.size) {
    const photos = inventory.photos.flatMap((p) => (additions.has(p.id) ? [p, additions.get(p.id)] : [p]));
    await writeFile(inventoryPath, `${JSON.stringify({ ...inventory, photos }, null, 2)}\n`, 'utf8');
  }
  return { made, skipped, entries: additions.size };
}

async function main() {
  const argv = process.argv.slice(2);
  const unknown = argv.filter((a) => a !== '--write' && a !== '--dry-run');
  if (unknown.length) throw new Error(`Usage: node scripts/social/make-ig-variants.mjs [--dry-run | --write] — unrecognized ${unknown.join(' ')}`);
  const write = argv.includes('--write') && !argv.includes('--dry-run');
  const { made, skipped, entries } = await makeIgVariants({ write });
  for (const m of made) console.log(`${write ? 'wrote' : 'would write'} ${m.file} (${m.canvas}, ${m.bytes === null ? 'file exists' : `${m.bytes} bytes`}) <- ${m.from}`);
  for (const s of skipped) console.log(`skipped ${s.id}: ${s.reason}`);
  const bytes = made.reduce((sum, m) => sum + (m.bytes ?? 0), 0);
  console.log(`${write ? 'produced' : 'would produce'} ${made.length} variant(s), ${bytes} bytes, ${entries} library entr${entries === 1 ? 'y' : 'ies'} ${write ? 'added' : 'to add'}; ${skipped.length} skipped.${write ? '' : ' (dry run — pass --write to apply)'}`);
  return 0;
}

if (isMain(import.meta.url, process.argv[1]) || process.argv[1]?.endsWith('make-ig-variants.mjs')) {
  runMain(main, { name: 'make-ig-variants' });
}
