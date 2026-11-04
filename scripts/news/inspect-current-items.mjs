#!/usr/bin/env node
// Read-only current_item inspector (issue #6604). Given ids (full UUIDs or
// 8-char prefixes) prints, per row, only the visibility fields plus the read
// gate's verdict: never copy text, source URLs or the full image URL (the
// repo is public and so are workflow job summaries). SELECTs only.
//
//   npx tsx scripts/news/inspect-current-items.mjs --ids 43575689,<uuid>
//   INSPECT_IDS=43575689 npx tsx scripts/news/inspect-current-items.mjs --markdown
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (no-op without them).

import { appendFileSync } from 'node:fs';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PREFIX = /^[0-9a-f]{8}$/;
const PREFIX_SCAN_LIMIT = 5000;

export const USAGE = `Usage: inspect-current-items.mjs --ids <id>[,<id>...] [--markdown]
  Read-only. Each id is a full UUID or an 8-char hex prefix.
  Prints visibility fields and the read gate verdict per row; never copy text or source URLs.
  --markdown   print a markdown table (also appended to $GITHUB_STEP_SUMMARY when set)
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or INSPECT_IDS instead of --ids).`;

/** Splits a comma list into lowercase ids; throws on anything that is neither a UUID nor an 8-char prefix. */
export function parseIds(raw) {
  const ids = String(raw ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (ids.length === 0) throw new Error('no ids given (--ids a,b,c)');
  for (const id of ids) {
    if (!UUID.test(id) && !PREFIX.test(id)) throw new Error(`invalid id ${JSON.stringify(id)}: expected a UUID or an 8-char hex prefix`);
  }
  return [...new Set(ids)];
}

/** Resolves each requested id against the known ids. Prefixes with 0 or 2+ matches are reported, never guessed. */
export function resolveIds(requested, knownIds) {
  const resolved = [];
  const unresolved = [];
  for (const want of requested) {
    const matches = knownIds.filter((id) => (want.length === 36 ? id === want : id.startsWith(want)));
    if (matches.length === 1) resolved.push(matches[0]);
    else unresolved.push({ id: want, reason: matches.length === 0 ? 'not_found' : `ambiguous_prefix(${matches.length})` });
  }
  return { resolved: [...new Set(resolved)], unresolved };
}

/** Host only, so no path or query reaches a public log. */
export function imageHost(url) {
  if (!url) return 'none';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return 'unparseable';
  }
}

const flag = (v) => (v ? 'set' : 'null');

/** One public-safe summary of a row. `quality` is the evaluateCurrentItemQuality result for the mapped row. */
export function summarizeRow(row, quality) {
  return {
    id: row.id,
    era: row.era_id,
    observedOn: row.observed_on,
    mergedInto: flag(row.merged_into),
    retractedAt: flag(row.retracted_at),
    promotedTo: flag(row.promoted_to),
    redlineOk: String(row.redline_ok),
    holdReason: row.quality_hold_reason ?? 'none',
    imageHost: imageHost(row.image_url),
    expiresAt: row.expires_at ?? 'none',
    facts: Array.isArray(row.facts) ? 'present' : 'absent',
    gate: quality.ok ? 'ok' : quality.reason,
  };
}

const COLUMNS = [
  ['id', 'id'], ['era', 'era'], ['observed_on', 'observedOn'], ['merged_into', 'mergedInto'],
  ['retracted_at', 'retractedAt'], ['promoted_to', 'promotedTo'], ['redline_ok', 'redlineOk'],
  ['hold_reason', 'holdReason'], ['image_host', 'imageHost'], ['expires_at', 'expiresAt'],
  ['facts', 'facts'], ['gate', 'gate'],
];

const cell = (v) => String(v).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function formatMarkdown(summaries, unresolved = []) {
  const lines = [
    `| ${COLUMNS.map(([h]) => h).join(' | ')} |`,
    `| ${COLUMNS.map(() => '---').join(' | ')} |`,
    ...summaries.map((s) => `| ${COLUMNS.map(([, k]) => cell(s[k])).join(' | ')} |`),
  ];
  if (unresolved.length > 0) {
    lines.push('', 'Unresolved:', ...unresolved.map((u) => `- ${cell(u.id)}: ${cell(u.reason)}`));
  }
  return lines.join('\n');
}

export function formatText(summaries, unresolved = []) {
  const blocks = summaries.map((s) => COLUMNS.map(([h, k]) => `  ${h}: ${s[k]}`).join('\n'));
  const missing = unresolved.map((u) => `unresolved ${u.id}: ${u.reason}`);
  return [...blocks, ...missing].join('\n\n');
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const idsAt = argv.indexOf('--ids');
  let requested;
  try {
    requested = parseIds(idsAt >= 0 ? argv[idsAt + 1] : process.env.INSPECT_IDS);
  } catch (err) {
    console.error(`inspect-current-items: ${err.message}\n${USAGE}`);
    return 1;
  }
  const db = serviceClient();
  if (!db) {
    console.log('inspect-current-items: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set, nothing to do.');
    return 0;
  }

  const full = requested.filter((id) => id.length === 36);
  const prefixes = requested.filter((id) => id.length !== 36);
  let known = [...full];
  if (prefixes.length > 0) {
    const { data, error } = await db
      .from('current_item')
      .select('id')
      .order('observed_on', { ascending: false })
      .limit(PREFIX_SCAN_LIMIT);
    if (error) throw new Error(`id scan failed: ${error.message}`);
    const ids = (data ?? []).map((r) => String(r.id).toLowerCase());
    if (ids.length >= PREFIX_SCAN_LIMIT) console.error(`inspect-current-items: id scan hit the ${PREFIX_SCAN_LIMIT} row bound; older rows may be missing`);
    known = [...new Set([...known, ...ids])];
  }
  const { resolved, unresolved } = resolveIds(requested, known);

  const summaries = [];
  if (resolved.length > 0) {
    const { data, error } = await db.from('current_item').select('*').in('id', resolved);
    if (error) throw new Error(`row load failed: ${error.message}`);
    const rows = data ?? [];
    for (const id of resolved) {
      if (!rows.some((r) => r.id === id)) unresolved.push({ id, reason: 'not_found' });
    }
    const { mapCurrentItem } = await import('../../packages/core/src/current-map.ts');
    const { evaluateCurrentItemQuality } = await import('../../packages/shared/src/current-item-quality.ts');
    for (const row of rows) summaries.push(summarizeRow(row, evaluateCurrentItemQuality(mapCurrentItem(row))));
  }

  const markdown = argv.includes('--markdown') || Boolean(process.env.GITHUB_STEP_SUMMARY);
  console.log(markdown ? formatMarkdown(summaries, unresolved) : formatText(summaries, unresolved));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## current_item inspector\n\n${formatMarkdown(summaries, unresolved)}\n`);
  }
  return 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/news/inspect-current-items.mjs')) {
  runMain(main, { name: 'inspect-current-items' });
}
