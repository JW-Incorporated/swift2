// Measure a Tier 0 payload against the budget (spec's hard performance gate).
// Run with tsx so it can import the shared verdict logic:
//
//   npm run check:budget                       # fetches localhost:3000/vault/tier0
//   npm run check:budget -- --url https://…/vault/tier0
//   npm run check:budget -- --file tier0.json
//
// Exits non-zero if Tier 0 is over budget, so it can gate a deploy.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { evaluateTier0Budget } from '@swift2/shared';
import { runMain } from './lib/cli.mjs';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const file = arg('file', null);
  const url = arg('url', 'http://localhost:3000/vault/tier0');

  let body;
  if (file) {
    body = readFileSync(file, 'utf8');
    console.log(`Tier 0 source: file ${file}`);
  } else {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`fetch ${url} failed: ${res.status}`);
      return 2;
    }
    body = await res.text();
    console.log(`Tier 0 source: ${url}`);
  }

  const parsedBytes = Buffer.byteLength(body, 'utf8');
  const gzipBytes = gzipSync(body).length;
  const r = evaluateTier0Budget({ gzipBytes, parsedBytes });

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const pct = (n) => `${(n * 100).toFixed(1)}%`;
  console.log(`  gzipped: ${kb(r.gzipBytes)} / ${kb(r.gzipBudget)} budget  (${pct(r.gzipRatio)})`);
  console.log(`  parsed:  ${kb(r.parsedBytes)} / ${kb(r.parsedBudget)} budget  (${pct(r.parsedRatio)})`);

  if (r.withinBudget) {
    console.log('✓ within Tier 0 budget');
  } else {
    console.error(`✗ OVER budget — gzip +${kb(r.overBy.gzipBytes)}, parsed +${kb(r.overBy.parsedBytes)}`);
    return 1;
  }
}

runMain(main, { name: 'check-tier0-budget' });
