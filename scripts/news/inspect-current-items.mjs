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
       inspect-current-items.mjs --era <eraId>
  Read-only. Each id is a full UUID or an 8-char hex prefix.
  --era        era stats: every row the read path could see (no 500 limit) vs the first 500, with gate failure reason counts
  Prints visibility fields and the read gate verdict per row; never copy text or source URLs.
  --markdown   print a markdown table (also appended to $GITHUB_STEP_SUMMARY when set)
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or INSPECT_IDS instead of --ids, INSPECT_ERA instead of --era).`;

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

const cell = (v) => String(v).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

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

const ERA = /^[a-z0-9-]+$/;
const STATS_PAGE = 1000;
const READ_LIMIT = 500;

export function parseEra(raw) {
  const era = String(raw ?? '').trim();
  if (!ERA.test(era)) throw new Error(`invalid era ${JSON.stringify(era)}: expected ${ERA}`);
  return era;
}

const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const countsOf = (map) => Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));

/** Pure era stats. `entries` are { observedOn, ok, reason, facts } in observed_on desc order. */
export function aggregateEraStats(entries, limit = READ_LIMIT) {
  const head = entries.slice(0, limit);
  const reasons = { head: new Map(), all: new Map() };
  const failFacts = new Map();
  for (const [i, e] of entries.entries()) {
    if (e.ok) continue;
    bump(reasons.all, e.reason);
    if (i < limit) bump(reasons.head, e.reason);
    bump(failFacts, e.facts);
  }
  return {
    total: entries.length,
    limitObservedOn: entries.length >= limit ? entries[limit - 1].observedOn : 'none',
    passHead: head.filter((e) => e.ok).length,
    headSize: head.length,
    passAll: entries.filter((e) => e.ok).length,
    failReasonsHead: countsOf(reasons.head),
    failReasonsAll: countsOf(reasons.all),
    failFacts: countsOf(failFacts),
  };
}

export function formatEraStats(era, s, limit = READ_LIMIT) {
  const kv = (o) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
  return [
    `era: ${era}`,
    `visible rows: ${s.total}`,
    `observed_on of row #${limit}: ${s.limitObservedOn}`,
    `pass gate in first ${limit}: ${s.passHead}/${s.headSize}`,
    `pass gate overall: ${s.passAll}/${s.total}`,
    `fail reasons in first ${limit}: ${kv(s.failReasonsHead)}`,
    `fail reasons overall: ${kv(s.failReasonsAll)}`,
    `failures by facts: ${kv(s.failFacts)}`,
  ].join('\n');
}

async function runEraStats(db, era) {
  const nowIso = new Date().toISOString();
  const rows = [];
  for (let from = 0; ; from += STATS_PAGE) {
    const { data, error } = await db
      .from('current_item')
      .select('*')
      .eq('era_id', era)
      .is('promoted_to', null)
      .is('merged_into', null)
      .is('retracted_at', null)
      .eq('redline_ok', true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('observed_on', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + STATS_PAGE - 1);
    if (error) throw new Error(`era stats load failed: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < STATS_PAGE) break;
  }
  const { mapCurrentItem } = await import('../../packages/core/src/current-map.ts');
  const { evaluateCurrentItemQuality } = await import('../../packages/shared/src/current-item-quality.ts');
  const entries = rows.map((row) => {
    const q = evaluateCurrentItemQuality(mapCurrentItem(row));
    return { observedOn: row.observed_on, ok: q.ok, reason: q.ok ? 'ok' : q.reason, facts: Array.isArray(row.facts) ? 'present' : 'absent' };
  });
  const text = formatEraStats(era, aggregateEraStats(entries));
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## current_item era stats\n\n\`\`\`\n${text}\n\`\`\`\n`);
  }
  return 0;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const eraAt = argv.indexOf('--era');
  const eraRaw = eraAt >= 0 ? argv[eraAt + 1] : process.env.INSPECT_ERA;
  if (eraRaw !== undefined && String(eraRaw).trim() !== '') {
    let era;
    try {
      era = parseEra(eraRaw);
    } catch (err) {
      console.error(`inspect-current-items: ${err.message}\n${USAGE}`);
      return 1;
    }
    const eraDb = serviceClient();
    if (!eraDb) {
      console.log('inspect-current-items: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set, nothing to do.');
      return 0;
    }
    return runEraStats(eraDb, era);
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
