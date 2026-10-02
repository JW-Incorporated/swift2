#!/usr/bin/env node
// OTA size budget check (One UI WP1.1a). Sums the bytes of every file in each
// platform's `expo export` output dir (Hermes bundle, assets, and any DOM
// `www.bundle` assets) except metadata.json, and fails when either platform
// grows more than 15% over e2e/parity/size-baseline.json.
//
//   node scripts/parity/size-check.mjs            compare against baseline
//   node scripts/parity/size-check.mjs --update   rewrite the baseline
//
// Expects `npx expo export --platform <p> --output-dir dist-<p>` in apps/mobile.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_GROWTH = 0.15;
export const PLATFORMS = ['ios', 'android'];

export function dirBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += dirBytes(full);
    else if (entry.name !== 'metadata.json') total += statSync(full).size;
  }
  return total;
}

// Pure. current/baseline: { ios?: {bytes}, android?: {bytes} } or undefined.
export function evaluateSizes(current, baseline, maxGrowth = MAX_GROWTH) {
  if (!baseline) {
    return { ok: false, rows: [], errors: ['baseline missing: run with --update to create it'] };
  }
  const errors = [];
  const rows = [];
  for (const p of PLATFORMS) {
    const cur = current?.[p]?.bytes;
    const base = baseline[p]?.bytes;
    if (typeof cur !== 'number') {
      errors.push(`${p}: no export output found`);
      continue;
    }
    if (typeof base !== 'number' || base <= 0) {
      errors.push(`${p}: no baseline bytes`);
      continue;
    }
    const growth = (cur - base) / base;
    const over = cur > base * (1 + maxGrowth);
    rows.push({ platform: p, current: cur, baseline: base, growth, over });
    if (over) {
      errors.push(
        `${p}: ${cur} bytes is ${(growth * 100).toFixed(1)}% over baseline ${base} (limit ${maxGrowth * 100}%)`,
      );
    }
  }
  return { ok: errors.length === 0, rows, errors };
}

export function formatRows(rows) {
  return rows
    .map(
      (r) =>
        `${r.platform}: ${r.current} B (baseline ${r.baseline} B, ${r.growth >= 0 ? '+' : ''}${(r.growth * 100).toFixed(1)}%) ${r.over ? 'OVER' : 'ok'}`,
    )
    .join(' | ');
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const baselinePath = join(root, 'e2e/parity/size-baseline.json');
  const current = {};
  for (const p of PLATFORMS) {
    const dir = join(root, 'apps/mobile', `dist-${p}`);
    if (existsSync(dir)) current[p] = { bytes: dirBytes(dir) };
  }
  if (process.argv.includes('--update')) {
    const missing = PLATFORMS.filter((p) => !current[p]);
    if (missing.length) {
      console.error(`size-check: cannot update, no export output for ${missing.join(', ')}`);
      process.exit(1);
    }
    let commit = 'unknown';
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim();
    } catch {
      // not a git checkout: keep 'unknown'
    }
    const next = { ...current, updatedAt: new Date().toISOString(), commit };
    writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`size-check: baseline updated: ios ${current.ios.bytes} B, android ${current.android.bytes} B`);
    return;
  }
  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : undefined;
  const result = evaluateSizes(current, baseline);
  if (result.rows.length) console.log(`size-check: ${formatRows(result.rows)}`);
  for (const e of result.errors) console.error(`size-check: ${e}`);
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
