#!/usr/bin/env node
/**
 * Writing eval (docs/decisions.md 2026-11-03 "News post quality engine") —
 * scores the live news posts against the deterministic writing checks in
 * packages/shared/src/current-item-writing.ts. Informational only: it exits 0
 * on success, it is NOT a CI gate.
 *
 * WHY THIS EXISTS: the writing checks are not enforced yet. Before they are,
 * the thresholds need calibrating against what is live today, and the
 * backfill needs a before/after number. Legacy rows carry no citations, so
 * `uncited_sentence` never fires here.
 *
 * USAGE (from the repo root):
 *   npx tsx scripts/news/eval-writing.mjs                  markdown report
 *   npx tsx scripts/news/eval-writing.mjs --json           JSON report
 *   npx tsx scripts/news/eval-writing.mjs --file <path>    saved {items:[...]} instead of fetching
 *
 * Exit 1 only when the fetch or file read fails (runMain).
 */

import { readFile } from 'node:fs/promises';
import { evaluateCurrentItemWriting } from '../../packages/shared/src/current-item-writing.ts';
import { runMain } from '../lib/cli.mjs';

// The public route the site itself reads — no Supabase env needed.
export const LIVE_URL = 'https://www.longlivets.com/vault/live/tloas';

/**
 * Score each live item against the writing evaluator.
 *
 * @param {Array<{ id?: string, headline?: string, summary?: string, detail?: string, sources?: unknown }>} items
 * @returns {Array<{ id: string | null, headline: string, ok: boolean, reasons: string[] }>}
 */
export function scoreItems(items) {
  return items.map((item) => {
    const headline = item.headline ?? '';
    const result = evaluateCurrentItemWriting({
      headline,
      lead: item.summary ?? '',
      body: item.detail ?? '',
      sources: Array.isArray(item.sources) ? item.sources : [],
      ...(Array.isArray(item.citations) ? { citations: item.citations } : {}),
    }, { legacy: !Array.isArray(item.facts) });
    return { id: item.id ?? null, headline, ok: result.ok, reasons: result.ok ? [] : result.reasons };
  });
}

/**
 * Summarize scored results: totals, reason counts (count desc, then code asc)
 * and the 10 worst failing items (most reasons first, input order on ties).
 *
 * @param {Array<{ id: string | null, headline?: string, ok: boolean, reasons: string[] }>} results
 * @returns {{ total: number, passed: number, passRate: number, reasons: Record<string, number>, worst: Array<{ id: string | null, headline: string, reasons: string[] }> }}
 */
export function summarize(results) {
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  const passRate = total > 0 ? passed / total : 0;

  const counts = new Map();
  for (const r of results) {
    for (const code of r.reasons) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const reasons = Object.fromEntries(
    [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)),
  );

  // Array.prototype.sort is stable, so ties keep input order.
  const worst = results
    .filter((r) => !r.ok)
    .sort((a, b) => b.reasons.length - a.reasons.length)
    .slice(0, 10)
    .map((r) => ({ id: r.id, headline: r.headline ?? '', reasons: r.reasons }));

  return { total, passed, passRate, reasons, worst };
}

/**
 * Load the items from `--file <path>` or the live endpoint.
 *
 * @param {string[]} args
 * @returns {Promise<Array<object>>}
 */
async function loadItems(args) {
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1) {
    const filePath = args[fileIdx + 1];
    if (!filePath || filePath.startsWith('--')) throw new Error('--file needs a path');
    return JSON.parse(await readFile(filePath, 'utf8')).items ?? [];
  }
  const res = await fetch(LIVE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${LIVE_URL}`);
  return (await res.json()).items ?? [];
}

function cell(text) {
  const cut = text.length > 60 ? `${text.slice(0, 60)}…` : text;
  return cut.replace(/\|/g, '\\|');
}

async function main() {
  const args = process.argv.slice(2);
  const results = scoreItems(await loadItems(args));
  const { total, passed, passRate, reasons, worst } = summarize(results);

  if (args.includes('--json')) {
    const items = results.map(({ id, ok, reasons: r }) => ({ id, ok, reasons: r }));
    console.log(JSON.stringify({ total, passed, reasons, items }, null, 2));
    return 0;
  }

  const lines = [
    '# Writing eval: live posts',
    '',
    `Total: ${total} · Passed: ${passed} (${(passRate * 100).toFixed(1)}%)`,
    '',
    '| Reason | Count |',
    '|---|---|',
    ...Object.entries(reasons).map(([code, count]) => `| ${code} | ${count} |`),
    '',
    '## Worst 10',
    '',
  ];
  if (worst.length === 0) {
    lines.push('(none)');
  } else {
    lines.push('| id | headline | reasons |', '|---|---|---|');
    for (const w of worst) lines.push(`| ${w.id} | ${cell(w.headline)} | ${w.reasons.join(', ')} |`);
  }
  console.log(lines.join('\n'));
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/news/eval-writing.mjs')
) {
  runMain(main, { name: 'eval-writing' });
}
