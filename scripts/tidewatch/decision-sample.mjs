#!/usr/bin/env node
// Tidewatch decision-precision sample (architect #15 item 4). Samples live shadow
// decisions, labels each with Sonnet through label-replay.mjs's prompt and wrapper,
// and reports how often the live decider's class matches Sonnet's. Public-repo safe:
// the artifact, step summary and logs hold class ids and numbers only. Item text is
// joined in-process for labelling and never written anywhere.
import { createHash } from 'node:crypto';
import { appendFile, writeFile } from 'node:fs/promises';
import { runMain } from '../lib/cli.mjs';
import { isMain } from '../lib/is-main.mjs';
import { createClaudeCaller } from '../lib/claude-call.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { CLASS_MAP, SYSTEM as BASE_SYSTEM, labelAll } from './label-replay.mjs';
import { SHADOW_START, fetchRows } from './shadow-report.mjs';

export const CALLER = 'tidewatch-decision-sample';
export const COLUMNS = 'id,class,decider,watch_item(excerpt)';
export const TIER_A_ALL = ['rumor', 'noise', 'fan_discussion', 'critical_personal', 'critical_breaking'];
export const TIER_C_CLASSES = ['duplicate', 'privacy_redline'];
export const TOTAL = 100;
export const TIER_C_EACH = 30;
// 100 Tier A + 2 x 30 Tier C. The brief said <=140 items, which cannot hold its own
// quotas (160); the item cap is set to the quota sum and the call cap bounds spend.
export const MAX_ITEMS = 160;
export const MAX_CALLS = 16;
const CRITICAL = ['critical_breaking', 'critical_personal'];
const SINCE_SHAPE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z)?$/;
const SONNET_SPACE = new Set([...Object.values(CLASS_MAP), 'privacy_redline']);

// Owner decision D-c, appended for this tool only; label-replay's own prompt is untouched.
export const SYSTEM = `${BASE_SYSTEM}
Category rulings (owner decision D-c): critical_work_news = new music confirmation (including a tracklist reveal), a newly planned tour, or a super-major life event. Premieres, VMAs and other award shows are general_news, not critical. News about her home or property is a private-life matter: set x = true for it.`;

const safeClass = (name) => (typeof name === 'string' && /^[a-z_]{1,40}$/.test(name) ? name : '_other');
const rank = (seed, id) => createHash('sha256').update(`${seed}:${id}`).digest('hex');
const pick = (rows, seed, n) => [...rows].sort((a, b) => rank(seed, a.id).localeCompare(rank(seed, b.id))).slice(0, Math.max(0, n));
const sortKeys = (map) => Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
const textOf = (row) => String(row.watch_item?.excerpt ?? '').trim();

/** Deterministic sample: tierA (non-code) and tierC (code duplicate / privacy_redline) are kept apart. */
export function sampleRows(rows, { seed = '1', total = TOTAL, tierC = TIER_C_EACH } = {}) {
  const usable = rows.filter((row) => textOf(row) !== '');
  const nonCode = usable.filter((row) => row.decider !== 'code');
  const forced = nonCode.filter((row) => TIER_A_ALL.includes(row.class));
  const news = nonCode.filter((row) => row.class === 'normal_news');
  const tierA = [...forced, ...pick(news, seed, total - forced.length)];
  const code = usable.filter((row) => row.decider === 'code');
  const tierCRows = TIER_C_CLASSES.flatMap((name) => pick(code.filter((row) => row.class === name), seed, tierC));
  return { tierA, tierC: tierCRows, skippedNoText: rows.length - usable.length };
}

/** Score decided-vs-Sonnet pairs: [{ decided, decider, sonnet }]. Numbers and class ids only. */
export function scorePairs(pairs) {
  const perClass = {};
  const confusion = {};
  const byDecider = {};
  let missedCritical = 0;
  let falseCritical = 0;
  const cell = (map, key) => (map[key] ??= { n: 0, agree: 0 });
  for (const { decided, decider, sonnet } of pairs) {
    const d = safeClass(decided);
    const s = safeClass(sonnet);
    const hit = d === s;
    for (const c of [cell(perClass, d), cell(byDecider, safeClass(decider))]) { c.n += 1; if (hit) c.agree += 1; }
    (confusion[d] ??= {})[s] = (confusion[d][s] ?? 0) + 1;
    if (!CRITICAL.includes(d) && CRITICAL.includes(s)) missedCritical += 1;
    if (CRITICAL.includes(d) && !CRITICAL.includes(s)) falseCritical += 1;
  }
  const withPrecision = (map, scorable = () => true) => sortKeys(Object.fromEntries(Object.entries(map).map(([k, v]) => [k,
    { n: v.n, sonnetAgree: v.agree, precision: v.n && scorable(k) ? Number((v.agree / v.n).toFixed(3)) : null }])));
  return {
    n: pairs.length,
    perClass: withPrecision(perClass, (k) => SONNET_SPACE.has(k)),
    byDecider: withPrecision(byDecider),
    confusion: sortKeys(Object.fromEntries(Object.entries(confusion).map(([k, v]) => [k, sortKeys(v)]))),
    tierAMisses: { missedCritical, falseCritical },
  };
}

export const LOW_STAKES = ['normal_news', 'noise', 'fan_discussion'];
const collapse = (name) => (LOW_STAKES.includes(name) ? 'low_stakes' : name);

/** Second pass: normal_news, noise and fan_discussion merged into low_stakes on both sides. Numbers and class ids only. */
export function scoreCollapsed(pairs) {
  const perBucket = {};
  let n = 0;
  let agree = 0;
  for (const { decided, sonnet } of pairs) {
    const d = collapse(safeClass(decided));
    const s = collapse(safeClass(sonnet));
    const c = (perBucket[d] ??= { n: 0, agree: 0 });
    c.n += 1;
    if (d === s) c.agree += 1;
    if (d === 'low_stakes' || SONNET_SPACE.has(d)) { n += 1; if (d === s) agree += 1; }
  }
  const prec = (a, b) => (b ? Number((a / b).toFixed(3)) : null);
  return {
    n,
    sonnetAgree: agree,
    precision: prec(agree, n),
    perBucket: sortKeys(Object.fromEntries(Object.entries(perBucket).map(([k, v]) => [k,
      { n: v.n, sonnetAgree: v.agree, precision: k === 'low_stakes' || SONNET_SPACE.has(k) ? prec(v.agree, v.n) : null }]))),
  };
}

export function buildReport({ seed, since = null, tierAPairs, tierCPairs, sample, calls, stopped, unlabelled, now }) {
  return {
    generatedAt: now.toISOString(),
    seed: String(seed),
    since,
    note: 'Precision = share of sampled decisions whose class equals the Sonnet label. Tier A sample is all rumor/noise/fan_discussion/critical_* decisions plus random normal_news; duplicate has no Sonnet equivalent so its precision is null.',
    sample: { tierA: sample.tierA.length, tierC: sample.tierC.length, skippedNoText: sample.skippedNoText, unlabelled },
    calls: { used: calls, cap: MAX_CALLS, stopped: stopped ? 'yes' : 'no' },
    tierA: scorePairs(tierAPairs),
    tierC: scorePairs(tierCPairs),
    collapsed: { lowStakes: LOW_STAKES, tierA: scoreCollapsed(tierAPairs), tierC: scoreCollapsed(tierCPairs) },
  };
}

const pct = (p) => (p === null ? 'n/a' : `${(p * 100).toFixed(1)}%`);

export function renderMarkdown(report) {
  const lines = [
    `**Tidewatch decision-precision sample** (${report.generatedAt.slice(0, 16)}Z, seed ${report.seed}${report.since ? `, since ${report.since}` : ''})`,
    `Sampled Tier A ${report.sample.tierA}, Tier C ${report.sample.tierC}; unlabelled ${report.sample.unlabelled}; calls ${report.calls.used}/${report.calls.cap}`,
  ];
  for (const [title, tier] of [['Tier A (model and rule decisions)', report.tierA], ['Tier C spot-check (code-decided)', report.tierC]]) {
    lines.push('', `${title}: ${tier.n} labelled; missed critical ${tier.tierAMisses.missedCritical}, false critical ${tier.tierAMisses.falseCritical}`);
    lines.push('| decided class | n | Sonnet agree | precision |', '|---|---|---|---|');
    for (const [name, c] of Object.entries(tier.perClass)) lines.push(`| ${name} | ${c.n} | ${c.sonnetAgree} | ${pct(c.precision)} |`);
    lines.push('', 'By decider: ' + (Object.entries(tier.byDecider).map(([name, c]) => `${name} ${c.sonnetAgree}/${c.n} (${pct(c.precision)})`).join(', ') || 'none'));
    lines.push('Confusion (decided -> Sonnet):');
    for (const [d, row] of Object.entries(tier.confusion)) lines.push(`- ${d}: ${Object.entries(row).map(([s, n]) => `${s} ${n}`).join(', ')}`);
  }
  lines.push('', `Collapsed (${LOW_STAKES.join(' + ')} -> low_stakes):`);
  for (const [title, tier] of [['Tier A', report.collapsed.tierA], ['Tier C', report.collapsed.tierC]]) {
    lines.push(`${title}: overall ${tier.sonnetAgree}/${tier.n} (${pct(tier.precision)})`);
    lines.push('| bucket | n | Sonnet agree | precision |', '|---|---|---|---|');
    for (const [name, c] of Object.entries(tier.perBucket)) lines.push(`| ${name} | ${c.n} | ${c.sonnetAgree} | ${pct(c.precision)} |`);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { seed: '1', since: null, jsonOut: 'tidewatch-decision-sample.json', maxCalls: MAX_CALLS };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--seed') options.seed = argv[++i];
    else if (argv[i] === '--since') options.since = argv[++i] ?? '';
    else if (argv[i] === '--json-out') options.jsonOut = argv[++i];
    else if (argv[i] === '--max-calls') options.maxCalls = Number(argv[++i]);
    else throw new Error('usage: decision-sample.mjs [--seed s] [--since ISO] [--json-out file] [--max-calls n]');
  }
  if (!/^[\w-]{1,32}$/.test(String(options.seed ?? ''))) throw new Error('--seed must match /^[\\w-]{1,32}$/');
  if (options.since !== null && !(SINCE_SHAPE.test(options.since) && !Number.isNaN(Date.parse(options.since)))) {
    throw new Error('--since must be an ISO date or timestamp, e.g. 2026-10-20 or 2026-10-20T12:00Z');
  }
  return options;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const env = deps.env ?? process.env;
  const log = deps.log ?? console.log;
  const now = deps.now ?? new Date();
  const client = deps.client ?? serviceClient(env);
  if (!client) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const call = deps.call ?? createClaudeCaller({ timeoutMs: 120_000 });
  const defaultStart = env.TIDEWATCH_SHADOW_START || SHADOW_START;
  const start = options.since !== null && Date.parse(options.since) > Date.parse(defaultStart) ? options.since : defaultStart;
  const rows = await fetchRows(client, start, COLUMNS);
  const sample = sampleRows(rows, { seed: options.seed });
  const all = [...sample.tierA, ...sample.tierC];
  if (all.length > MAX_ITEMS) throw new Error(`sample of ${all.length} exceeds the ${MAX_ITEMS}-item cap`);
  const items = all.map((row) => ({ id: row.id, kind: 'news_story', text: { title: textOf(row), summary: '' }, meta: {} }));
  const progress = { calls: 0, labels: {} };
  let failures = 0;
  const result = await labelAll({ items, progress, call, save: async () => {}, log: () => { failures += 1; },
    maxCalls: Math.min(options.maxCalls, MAX_CALLS), system: SYSTEM, caller: CALLER });
  const pairsOf = (list) => list.filter((row) => progress.labels[row.id])
    .map((row) => ({ decided: row.class, decider: row.decider, sonnet: progress.labels[row.id].class }));
  const report = buildReport({ seed: options.seed, since: options.since, tierAPairs: pairsOf(sample.tierA), tierCPairs: pairsOf(sample.tierC),
    sample, calls: result.calls, stopped: result.stopped, unlabelled: result.remaining, now });
  await (deps.writeFile ?? writeFile)(options.jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  const text = renderMarkdown(report);
  log(text);
  if (failures) log(`failed or invalid labelling attempts: ${failures}`);
  if (env.GITHUB_STEP_SUMMARY) await (deps.appendFile ?? appendFile)(env.GITHUB_STEP_SUMMARY, `${text}\n`);
  return { report };
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'tidewatch-decision-sample' });
