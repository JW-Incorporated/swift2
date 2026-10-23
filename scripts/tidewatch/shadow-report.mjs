#!/usr/bin/env node
// Tidewatch shadow-week monitoring (P1-07b). Deterministic, read-only: reads
// watch_decision (+ watch_item) and tidewatch.yml run history, renders markdown
// to stdout / $GITHUB_STEP_SUMMARY, writes a JSON report and a Discord payload file.
// It never posts: shadow-report-post.mjs delivers the payload with Marjorie's `post`
// helper, so this entry's import graph holds no send API. `--alert` writes a payload
// only for a fresh alert, de-duplicated by a state file.
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { ghApi } from '../lib/gh.mjs';
import { isMain } from '../lib/is-main.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { planActions } from './actions/plan.mjs';
import { disagreementMetric } from './route.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'tidewatch.json');
export const SHADOW_START = '2026-10-16T02:49:00Z';
export const GATE_DECISIONS = 500;
export const GATE_DAYS = 7;
export const MIN_SWEEPS_24H = 22;
export const MAX_SWEEP_MINUTES = 5;
export const STOP_RATE = 0.1;
export const ALERT_MIN_DECISIONS = 50;
export const ALERT_DEDUPE_MS = 6 * 3600_000;
export const DISCORD_LIMIT = 1900;
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const PAGE = 1000;
const MAX_PAGES = 30;

const pct = (rate) => `${(rate * 100).toFixed(1)}%`;
const oneLine = (text, max) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').replace(/[`<>]/g, '').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

// The metric is route.mjs's own disagreementMetric over plan.mjs's planActions, unchanged.
export async function loadRouting() {
  return { planActions, disagreementMetric };
}

export function disagreementFor(rows, config, routing) {
  const { planActions, disagreementMetric } = routing;
  const plans = [];
  for (const row of rows) {
    try {
      plans.push(planActions(row.class, row.answers ?? {}, row.confidence, null, config));
    } catch {
      // A class the config no longer approves cannot be routed; leave it out.
    }
  }
  return disagreementMetric(plans);
}

const isHttp = (value) => typeof value === 'string' && /^https?:\/\/\S+$/i.test(value);

export function urlFromItemKey(itemKey, repo) {
  const youtube = /^yt:([\w-]+)$/.exec(itemKey ?? '');
  if (youtube) return `https://www.youtube.com/watch?v=${youtube[1]}`;
  const issue = /^issue:(\d+)$/.exec(itemKey ?? '');
  return issue && repo ? `https://github.com/${repo}/issues/${issue[1]}` : null;
}

// watch_item keeps only a URL hash, so the readable headline and link come from the
// source tables the collectors read (news_story / news_raw_item / engagement_lead),
// by the id watch_item.source_ref records. Read-only; any failure leaves the line as it was.
export async function enrichSpotCheck(client, items, repo) {
  const out = items.map((item) => ({ ...item, url: urlFromItemKey(item.itemKey, repo) }));
  try {
    const refs = (names) => [...new Set(out.filter((i) => names.includes(i.sourceName) && i.ref).map((i) => i.ref))];
    const group = (rows, key) => rows.reduce((map, row) => (map.has(row[key]) ? map : map.set(row[key], row)), new Map());
    const news = refs(['news']);
    if (news.length) {
      const [stories, byId, byStory] = await Promise.all([
        client.from('news_story').select('id,canonical_title').in('id', news),
        client.from('news_raw_item').select('id,story_id,url,title').in('id', news),
        client.from('news_raw_item').select('id,story_id,url,title').in('story_id', news),
      ]);
      const title = group(stories.data ?? [], 'id');
      const raw = group(byId.data ?? [], 'id');
      const rawByStory = group(byStory.data ?? [], 'story_id');
      for (const item of out.filter((i) => i.sourceName === 'news')) {
        const hit = raw.get(item.ref) ?? rawByStory.get(item.ref);
        const heading = title.get(item.ref)?.canonical_title ?? hit?.title;
        if (heading) item.headline = oneLine(heading, 100);
        if (isHttp(hit?.url)) item.url = hit.url;
      }
    }
    const leads = refs(['reddit', 'facebook']);
    if (leads.length) {
      const { data } = await client.from('engagement_lead').select('id,url,title').in('id', leads);
      const lead = group(data ?? [], 'id');
      for (const item of out.filter((i) => ['reddit', 'facebook'].includes(i.sourceName))) {
        const hit = lead.get(item.ref);
        if (hit?.title) item.headline = oneLine(hit.title, 100);
        if (isHttp(hit?.url)) item.url = hit.url;
      }
    }
  } catch {
    // Enrichment is best effort; the ref stays on the line.
  }
  return out;
}

function countBy(rows) {
  const counts = {};
  for (const row of rows) counts[row.class] = (counts[row.class] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function startedAt(run) {
  return Date.parse(run.run_started_at ?? run.created_at);
}

export function summarizeRuns(runs, nowMs) {
  const started = (ms) => runs.filter((run) => nowMs - startedAt(run) <= ms && startedAt(run) <= nowMs);
  const day = started(DAY);
  const six = started(6 * HOUR);
  const failed = (list) => list.filter((run) => ['failure', 'timed_out'].includes(run.conclusion)).length;
  const durations = day.filter((run) => run.status === 'completed')
    .map((run) => (Date.parse(run.updated_at) - startedAt(run)) / 60_000)
    .filter(Number.isFinite);
  const latest = runs.reduce((max, run) => Math.max(max, startedAt(run)), 0);
  return {
    started24h: day.length,
    succeeded24h: day.filter((run) => run.conclusion === 'success').length,
    failed24h: failed(day),
    failed6h: failed(six),
    maxDurationMin: durations.length ? Math.max(...durations) : 0,
    lastStartedAt: latest ? new Date(latest).toISOString() : null,
  };
}

export function computeReport({ rows, runs, now, config, routing, start = SHADOW_START }) {
  const nowMs = now.getTime();
  const startMs = Date.parse(start);
  const sorted = rows.filter((row) => Date.parse(row.decided_at) >= startMs);
  const last24 = sorted.filter((row) => nowMs - Date.parse(row.decided_at) <= DAY);
  const elapsedDays = Math.max(0, (nowMs - startMs) / DAY);
  const remaining = Math.max(0, GATE_DECISIONS - sorted.length);
  let projected = remaining === 0 ? 'reached' : 'n/a (no decisions in the last 24h)';
  if (remaining > 0 && last24.length > 0) {
    projected = new Date(nowMs + (remaining / last24.length) * DAY).toISOString().slice(0, 10);
  }
  const sweeps = summarizeRuns(runs, nowMs);
  const warm = elapsedDays < 1;
  const flags = [];
  if (!warm && sweeps.started24h < MIN_SWEEPS_24H) flags.push(`only ${sweeps.started24h} sweeps started in 24h (need ${MIN_SWEEPS_24H})`);
  if (sweeps.maxDurationMin > MAX_SWEEP_MINUTES) flags.push(`slowest sweep ${sweeps.maxDurationMin.toFixed(1)} min (limit ${MAX_SWEEP_MINUTES})`);
  const disagreement = { h24: disagreementFor(last24, config, routing), cumulative: disagreementFor(sorted, config, routing) };
  if (disagreement.cumulative.rate > STOP_RATE) flags.push(`cumulative router-vs-classifier disagreement ${pct(disagreement.cumulative.rate)} (stop above ${pct(STOP_RATE)})`);
  const haiku = (list) => list.filter((row) => row.decider === 'haiku').length;
  const spotCheck = last24.filter((row) => row.class === 'critical_breaking'
    || routeOf(row, config, routing) === 'critical_fast_path')
    .map((row) => ({
      decidedAt: row.decided_at,
      class: row.class,
      headline: oneLine(row.watch_item?.excerpt ?? row.watch_item?.item_key ?? row.id, 100),
      source: oneLine(`${row.watch_item?.source ?? 'unknown'}:${row.watch_item?.source_ref ?? row.watch_item?.item_key ?? ''}`, 80),
      sourceName: row.watch_item?.source ?? null,
      ref: row.watch_item?.source_ref ?? null,
      itemKey: row.watch_item?.item_key ?? null,
    }));
  return {
    generatedAt: now.toISOString(),
    shadowStart: start,
    decisions: { total: sorted.length, gate: GATE_DECISIONS, last24h: last24.length, remaining, projectedGateDate: projected },
    days: { elapsed: Number(elapsedDays.toFixed(1)), gate: GATE_DAYS },
    sweeps: { ...sweeps, warmingUp: warm },
    classes: { h24: countBy(last24), cumulative: countBy(sorted) },
    disagreement,
    fallback: {
      h24: { count: haiku(last24), total: last24.length, rate: last24.length ? haiku(last24) / last24.length : 0 },
      cumulative: { count: haiku(sorted), total: sorted.length, rate: sorted.length ? haiku(sorted) / sorted.length : 0 },
    },
    spotCheck,
    flags,
  };
}

function routeOf(row, config, { planActions }) {
  try {
    return planActions(row.class, row.answers ?? {}, row.confidence, null, config).answerRoute;
  } catch {
    return null;
  }
}

function classLine(counts) {
  const entries = Object.entries(counts);
  return entries.length ? entries.map(([name, n]) => `${name} ${n}`).join(', ') : 'none';
}

export function renderMarkdown(report, { maxChars = Infinity } = {}) {
  const { decisions, days, sweeps, disagreement: d, fallback: f } = report;
  const head = [
    `**Tidewatch shadow report** (${report.generatedAt.slice(0, 16)}Z)`,
    report.flags.length ? `FLAGS: ${report.flags.join('; ')}` : 'Flags: none',
    `Gate: ${decisions.total}/${decisions.gate} decisions, day ${days.elapsed}/${days.gate}; 500 projected ${decisions.projectedGateDate} (24h rate ${decisions.last24h})`,
    `Sweeps 24h: ${sweeps.started24h} started, ${sweeps.succeeded24h} ok, ${sweeps.failed24h} failed, max ${sweeps.maxDurationMin.toFixed(1)} min${sweeps.warmingUp ? ' (warming up, <24h since start)' : ''}`,
    `Disagreement (stop >${pct(STOP_RATE)}): 24h ${pct(d.h24.rate)} (${d.h24.count}/${d.h24.total}), cumulative ${pct(d.cumulative.rate)} (${d.cumulative.count}/${d.cumulative.total})`,
    `Haiku fallback decisions: 24h ${pct(f.h24.rate)} (${f.h24.count}/${f.h24.total}), cumulative ${pct(f.cumulative.rate)} (${f.cumulative.count}/${f.cumulative.total}); jev-unavailable is per-run log only`,
    `Classes 24h: ${classLine(report.classes.h24)}`,
    `Classes cumulative: ${classLine(report.classes.cumulative)}`,
  ].join('\n');
  const item = (s) => `- ${s.decidedAt.slice(5, 16)}Z ${s.class}: ${s.headline} [${s.source}]${isHttp(s.url) ? ` <${s.url}>` : ''}`;
  const title = `Spot-check, critical in last 24h (${report.spotCheck.length}); link shown when the source table still has it`;
  for (let shown = report.spotCheck.length; shown >= 0; shown -= 1) {
    const lines = report.spotCheck.slice(0, shown).map(item);
    const more = report.spotCheck.length - shown;
    const text = [head, title, ...lines, ...(more > 0 ? [`+${more} more`] : [])].join('\n');
    if (text.length <= maxChars) return text;
  }
  return head.slice(0, maxChars);
}

export function evaluateAlerts(report, state, nowMs) {
  const triggered = [];
  const last = report.sweeps.lastStartedAt ? Date.parse(report.sweeps.lastStartedAt) : null;
  if (nowMs >= Date.parse(report.shadowStart) + 2 * HOUR && (last === null || nowMs - last > 2 * HOUR)) {
    triggered.push({ key: 'no-run', text: `No tidewatch run started in the last 2h (last: ${report.sweeps.lastStartedAt ?? 'none on record'}).` });
  }
  const cum = report.disagreement.cumulative;
  if (cum.total >= ALERT_MIN_DECISIONS && cum.rate > STOP_RATE) {
    triggered.push({ key: 'disagreement', text: `Router-vs-classifier disagreement ${pct(cum.rate)} (${cum.count}/${cum.total}) is above ${pct(STOP_RATE)}: architect stop signal.` });
  }
  if (report.sweeps.failed6h >= 3) {
    triggered.push({ key: 'failures', text: `${report.sweeps.failed6h} failed tidewatch sweeps in the last 6h.` });
  }
  const fresh = triggered.filter((alert) => !(nowMs - Date.parse(state[alert.key] ?? 0) < ALERT_DEDUPE_MS));
  return { triggered, fresh };
}

async function readState(file) {
  if (!file) return {};
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

const SHADOW_COLUMNS = 'id,class,confidence,decider,answers,decided_at,watch_item(source,source_ref,item_key,excerpt)';

export async function fetchRows(client, start, columns = SHADOW_COLUMNS) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await client.from('watch_decision')
      .select(columns)
      .eq('shadow', true).gte('decided_at', start).order('decided_at', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }
  return rows;
}

async function fetchRuns(repo) {
  const result = await ghApi(`/repos/${repo}/actions/workflows/tidewatch.yml/runs?per_page=100`);
  return result?.workflow_runs ?? [];
}

function parseArgs(argv) {
  const options = { alert: false, jsonOut: 'tidewatch-shadow-report.json', stateFile: null, payloadOut: 'tidewatch-discord-payload.json' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--alert') options.alert = true;
    else if (argv[i] === '--json-out') options.jsonOut = argv[++i];
    else if (argv[i] === '--state-file') options.stateFile = argv[++i];
    else if (argv[i] === '--payload-out') options.payloadOut = argv[++i];
    else throw new Error('usage: shadow-report.mjs [--alert] [--json-out file] [--state-file file] [--payload-out file]');
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
  const repo = env.GITHUB_REPOSITORY;
  if (!repo && !deps.fetchRuns) throw new Error('GITHUB_REPOSITORY not set');
  const start = env.TIDEWATCH_SHADOW_START || SHADOW_START;
  const rows = await fetchRows(client, start);
  const runs = await (deps.fetchRuns ?? fetchRuns)(repo);
  const report = computeReport({ rows, runs, now, config, start, routing: await (deps.loadRouting ?? loadRouting)() });
  if (!options.alert) report.spotCheck = await enrichSpotCheck(client, report.spotCheck, repo);
  await (deps.writeFile ?? writeFile)(options.jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  const writePayload = (payload) => (deps.writeFile ?? writeFile)(options.payloadOut, `${JSON.stringify(payload)}\n`);

  if (options.alert) {
    const state = deps.state ?? await readState(options.stateFile);
    const { triggered, fresh } = evaluateAlerts(report, state, now.getTime());
    log(triggered.length ? `alerts: ${triggered.map((a) => a.key).join(', ')} (${fresh.length} new)` : 'alerts: none');
    if (fresh.length === 0) return { report, payload: null, alerts: triggered };
    const payload = {
      text: `**Tidewatch shadow alert**\n${fresh.map((a) => `- ${a.text}`).join('\n')}`,
      stateUpdate: Object.fromEntries(fresh.map((a) => [a.key, now.toISOString()])),
    };
    await writePayload(payload);
    return { report, payload, alerts: triggered };
  }

  const full = renderMarkdown(report);
  log(full);
  if (env.GITHUB_STEP_SUMMARY) await (deps.appendFile ?? appendFile)(env.GITHUB_STEP_SUMMARY, `${full}\n`);
  const payload = { text: renderMarkdown(report, { maxChars: DISCORD_LIMIT }), stateUpdate: {} };
  await writePayload(payload);
  return { report, payload, alerts: [] };
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'tidewatch-shadow-report' });
