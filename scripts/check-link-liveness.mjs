#!/usr/bin/env node
// Link-liveness sweep for the content corpus — the detection half of Karen's
// link-rot capability (docs/agents/maintenance-bots-research.md §3).
//
// Scans every URL in supabase/seed/**, checks it resolves, and classifies the
// failures (404/410, 403, SSL/connection, soft-404). Read-only, deterministic,
// ALWAYS exits 0 — it is a reporting tool Karen runs and reasons over (adding
// Wayback-fallback suggestions and filing tickets), NOT a CI gate. Karen never
// edits content; she files tickets from this report.
//
// Usage:
//   node scripts/check-link-liveness.mjs            # sweep all seed URLs
//   node scripts/check-link-liveness.mjs --limit 50 # cap (smoke test)
//   node scripts/check-link-liveness.mjs --json     # machine-readable output

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const SEED_DIR = join(ROOT, 'supabase', 'seed');
const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? Number(args[i + 1]) : Infinity;
})();
const CONCURRENCY = 10;
const TIMEOUT_MS = 15000;
const SOFT_404 = /\b(page|file)?\s*not\s*found\b|\bhttp\s*410\b|\bno longer (?:available|exists)\b/i;

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

function extractUrls(text) {
  const raw = text.match(/https?:\/\/[^\s"'`)\]<>]+/g) || [];
  return raw.map((u) => u.replace(/[.,;]+$/, ''));
}

// AbortSignal is a Node 18+ / browser global; declare it for eslint's no-undef.
/* global AbortSignal */
async function check(url) {
  const ac = AbortSignal.timeout(TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ac });
    // Some hosts reject HEAD — retry with a ranged GET.
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ac, headers: { Range: 'bytes=0-2048' } });
    }
    const status = res.status;
    if (status >= 200 && status < 300) {
      // Soft-404 sniff on HTML bodies.
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        try {
          const body = (await res.text()).slice(0, 4000);
          if (SOFT_404.test(body)) return { url, status, verdict: 'soft-404' };
        } catch { /* body read failed — treat as OK by status */ }
      }
      return { url, status, verdict: 'ok' };
    }
    if (status === 404 || status === 410) return { url, status, verdict: 'dead' };
    if (status === 403 || status === 401) return { url, status, verdict: 'blocked' };
    return { url, status, verdict: 'suspect' };
  } catch (err) {
    const msg = String(err && err.message || err);
    const kind = /certificate|SSL|TLS/i.test(msg) ? 'ssl'
      : /timed out|timeout|abort/i.test(msg) ? 'timeout'
      : 'connection';
    return { url, status: 0, verdict: kind };
  }
}

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

const files = await walk(SEED_DIR);
const urlSet = new Set();
for (const f of files) {
  try { for (const u of extractUrls(await readFile(f, 'utf8'))) urlSet.add(u); }
  catch { /* skip unreadable */ }
}
let urls = [...urlSet];
if (Number.isFinite(LIMIT)) urls = urls.slice(0, LIMIT);

const results = await pool(urls, check, CONCURRENCY);
const bad = results.filter((r) => r.verdict !== 'ok');
const byVerdict = bad.reduce((m, r) => ((m[r.verdict] = (m[r.verdict] || 0) + 1), m), {});

if (JSON_OUT) {
  console.log(JSON.stringify({ scanned: urls.length, files: files.length, byVerdict, bad }, null, 2));
} else {
  console.log(`link-liveness: scanned ${urls.length} unique URLs across ${files.length} seed files`);
  console.log(`summary:`, byVerdict);
  for (const r of bad) console.log(`  [${r.verdict}] ${r.status || '-'}  ${r.url}`);
  console.log(bad.length
    ? `\n${bad.length} link(s) need review. For dead/soft-404 sources, prefer the archive.org/Wayback snapshot of the original.`
    : `\nall links live.`);
}
process.exit(0); // never gate — reporting only
