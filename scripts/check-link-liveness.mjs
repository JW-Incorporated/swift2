#!/usr/bin/env node
// Link-liveness sweep for every outbound link the site renders — the detection
// half of Karen's link-rot capability (docs/agents/maintenance-bots-research.md
// §3) and Definition of Done item 5 ("every link on the site works", #4324).
//
// Covers four link classes (scripts/lib/link-targets.mjs): `source` citations in
// supabase/seed/**, `shop` product/alt-listing URLs, `community` links
// (data/communities.json) and `app` links hard-coded in apps/** + packages/**.
// Read-only and deterministic. Exits 0 (a reporting tool Karen reasons over)
// unless --fail-on-dead is passed, which the nightly link-sweep workflow uses
// so a newly dead link turns the run red. Karen never edits content; she files
// tickets. "unverified" (network failures that survived retries) and "blocked"
// (bot walls — need a real browser) are never filed as dead links.
//
// Usage:
//   node scripts/check-link-liveness.mjs                    # sweep every class
//   node scripts/check-link-liveness.mjs --class shop,app   # only some classes
//   node scripts/check-link-liveness.mjs --limit 50         # cap (smoke test)
//   node scripts/check-link-liveness.mjs --json             # machine-readable
//   node scripts/check-link-liveness.mjs --json-out f.json  # full report to a file
//   node scripts/check-link-liveness.mjs --fail-on-dead     # exit 1 on dead/soft-404
//   node scripts/check-link-liveness.mjs --products         # merch E1 mode (verify-images input)

import { writeFile } from 'node:fs/promises';
import { runMain } from './lib/cli.mjs';
import { check, confirmDead, createHostGate } from './lib/link-probe.mjs';
import { LINK_CLASSES, enumerateTargets, productTargets, productTargetsFromSeed } from './lib/link-targets.mjs';

export { check, productTargets };

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const JSON_OUT = flag('--json');
const PRODUCTS = flag('--products');
const LIMIT = Number(option('--limit', Infinity));
// #3469: a proxy that chokes on 10 concurrent tunnels looks exactly like a
// false-positive storm from hundreds of hosts, so keep concurrency modest.
const CONCURRENCY = Number(option('--concurrency', 12));
const HOST_GAP_MS = Number(option('--host-gap', 350));
const CLASSES = (option('--class', LINK_CLASSES.join(',')) || '').split(',').filter((c) => LINK_CLASSES.includes(c));
const GOOD = new Set(['ok', 'redirect']);
const DEAD = new Set(['dead', 'soft-404']);

async function pool(items, worker, n) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
}

const tally = (rows, key) => rows.reduce((map, row) => ((map[key(row)] = (map[key(row)] || 0) + 1), map), {});

async function main() {
  let targets = PRODUCTS ? await productTargetsFromSeed(ROOT) : await enumerateTargets(ROOT, CLASSES);
  if (Number.isFinite(LIMIT)) targets = targets.slice(0, LIMIT);
  const gate = createHostGate(HOST_GAP_MS);
  const first = await pool(targets, async (target) => {
    const probe = await gate(new URL(target.url).hostname, () => check(target.url, { product: PRODUCTS }));
    // merch E1/E2 consumers only accept 'ok' for a live listing; a redirect is alive.
    return { ...target, ...(PRODUCTS && probe.verdict === 'redirect' ? { ...probe, verdict: 'ok' } : probe) };
  }, CONCURRENCY);
  const results = await confirmDead(first, { opts: { product: PRODUCTS } });

  const bad = results.filter((r) => !GOOD.has(r.verdict));
  const dead = results.filter((r) => DEAD.has(r.verdict));
  const byVerdict = tally(results, (r) => r.verdict);
  const byClass = PRODUCTS ? {} : results.reduce((map, r) => {
    for (const c of r.classes) (map[c] = map[c] ?? {})[r.verdict] = (map[c][r.verdict] || 0) + 1;
    return map;
  }, {});
  const report = { scanned: results.length, classes: PRODUCTS ? ['product'] : CLASSES, byVerdict, byClass, dead: dead.length, bad, results };
  if (option('--json-out')) await writeFile(option('--json-out'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (JSON_OUT) {
    console.log(JSON.stringify(PRODUCTS ? { scanned: results.length, byVerdict, results, bad } : { ...report, results: undefined }, null, 2));
  } else {
    console.log(`link-liveness: probed ${results.length} unique ${PRODUCTS ? 'product' : CLASSES.join('+')} URLs`);
    console.log('by verdict:', byVerdict);
    for (const [cls, counts] of Object.entries(byClass)) console.log(`  ${cls}:`, counts);
    for (const r of bad) console.log(`  [${r.verdict}] ${r.status || '-'}  ${r.url}${r.reason ? `  (${r.reason})` : ''}${r.files ? `  <- ${r.files[0]}` : ''}`);
    console.log(dead.length ? `\n${dead.length} dead link(s); ${bad.length - dead.length} more need review.` : `\nno dead links (${bad.length} need review: blocked/unverified/suspect).`);
  }
  return flag('--fail-on-dead') && dead.length ? 1 : 0;
}

if (process.argv[1] && process.argv[1].endsWith('check-link-liveness.mjs')) {
  runMain(main, { name: 'check-link-liveness' });
}
