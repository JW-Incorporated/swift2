#!/usr/bin/env node
// Tidewatch per-class calibration report (architect #15 item 1). Deterministic and
// read-only: SELECTs watch_decision through shadow-report.mjs's paged fetch, writes a
// JSON report and prints a short markdown summary. Public-repo safe: the output holds
// class ids and numbers only, never item titles, text or URLs.
// Rows are bucketed by the class Jev's own answers imply (classFromAnswers, as the
// cascade derives it); code rows have no Jev answers and bucket under their row class.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { isMain } from '../lib/is-main.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { classFromAnswers } from './cascade.mjs';
import { SHADOW_START, fetchRows } from './shadow-report.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'tidewatch.json');
const DAY = 24 * 3600_000;
const BINS = 10;
const COLUMNS = 'id,class,confidence,decider,answers,decided_at,action';
const HOLD_ACTION = 'shadow_hold_injection';

const bump = (map, key) => { map[key] = (map[key] ?? 0) + 1; };
const sortKeys = (map) => Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
const bucket = () => ({
  deciders: { code: 0, jev: 0, haiku: 0 },
  jevConfidenceHistogram: Array.from({ length: BINS }, (_, i) => ({ from: i / BINS, to: (i + 1) / BINS, count: 0 })),
  agreement: {
    drift_sample: { total: 0, agree: 0, disagree: 0 },
    below_threshold: { total: 0, agree: 0, disagree: 0 },
  },
  haikuClassBelowThreshold: {},
  injectionHolds: 0,
});

function jevOf(row, config) {
  const answers = row.answers?.jev;
  if (!answers || typeof answers !== 'object') return null;
  try {
    return classFromAnswers(answers, config, row.answers?.redline_hint);
  } catch {
    return null;
  }
}

function haikuRate(rows) {
  const haiku = rows.filter((row) => row.decider === 'haiku').length;
  const model = rows.filter((row) => row.decider === 'jev' || row.decider === 'haiku').length;
  return { haiku, model, rate: model ? haiku / model : 0 };
}

export function computeCalibration({ rows, now, config }) {
  const nowMs = now.getTime();
  const classes = {};
  const get = (name) => (classes[name] ??= bucket());
  for (const row of rows) {
    const jev = row.decider === 'code' ? null : jevOf(row, config);
    const b = get(jev ? jev.class : row.decider === 'code' ? row.class : '_no_jev');
    if (row.decider in b.deciders) b.deciders[row.decider] += 1;
    if (row.action === HOLD_ACTION) b.injectionHolds += 1;
    if (!jev) continue;
    const confidence = Number(jev.confidence);
    if (Number.isFinite(confidence)) {
      const bin = Math.min(BINS - 1, Math.max(0, Math.floor(confidence * BINS + 1e-9)));
      b.jevConfidenceHistogram[bin].count += 1;
    }
    const haiku = row.answers?.haiku;
    if (haiku && typeof haiku === 'object') {
      const split = b.agreement[haiku.drift === true ? 'drift_sample' : 'below_threshold'];
      split.total += 1;
      split[haiku.class === jev.class ? 'agree' : 'disagree'] += 1;
      if (haiku.drift !== true && typeof haiku.class === 'string') bump(b.haikuClassBelowThreshold, haiku.class);
    }
  }
  for (const b of Object.values(classes)) b.haikuClassBelowThreshold = sortKeys(b.haikuClassBelowThreshold);
  const last24 = rows.filter((row) => nowMs - Date.parse(row.decided_at) <= DAY);
  return {
    generatedAt: now.toISOString(),
    rows: rows.length,
    classes: sortKeys(classes),
    haikuShare: { h24: haikuRate(last24), cumulative: haikuRate(rows) },
  };
}

const pct = (rate) => `${(rate * 100).toFixed(1)}%`;

export function renderMarkdown(report) {
  const share = report.haikuShare;
  const lines = [
    `**Tidewatch calibration report** (${report.generatedAt.slice(0, 16)}Z, ${report.rows} rows)`,
    `Haiku share of model decisions: 24h ${pct(share.h24.rate)} (${share.h24.haiku}/${share.h24.model}), cumulative ${pct(share.cumulative.rate)} (${share.cumulative.haiku}/${share.cumulative.model})`,
  ];
  for (const [name, b] of Object.entries(report.classes)) {
    const hist = b.jevConfidenceHistogram.map((bin) => bin.count).join(' ');
    const a = b.agreement;
    const agree = (s) => `${s.agree}/${s.total}`;
    const below = Object.entries(b.haikuClassBelowThreshold).map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
    lines.push(`- ${name}: code ${b.deciders.code}, jev ${b.deciders.jev}, haiku ${b.deciders.haiku}, holds ${b.injectionHolds}; `
      + `jev conf bins 0.0-1.0 [${hist}]; agree drift ${agree(a.drift_sample)}, below-threshold ${agree(a.below_threshold)}; haiku below-threshold: ${below}`);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { jsonOut: 'tidewatch-calibration-report.json' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json-out') options.jsonOut = argv[++i];
    else throw new Error('usage: calibration-report.mjs [--json-out file]');
  }
  return options;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const env = deps.env ?? process.env;
  const log = deps.log ?? console.log;
  const now = deps.now ?? new Date();
  const config = deps.config ?? JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const client = deps.client ?? serviceClient(env);
  if (!client) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const rows = await fetchRows(client, env.TIDEWATCH_SHADOW_START || SHADOW_START, COLUMNS);
  const report = computeCalibration({ rows, now, config });
  await (deps.writeFile ?? writeFile)(options.jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  log(renderMarkdown(report));
  return { report };
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'tidewatch-calibration-report' });
