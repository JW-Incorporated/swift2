#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { isMain } from '../lib/is-main.mjs';
import { runMain } from '../lib/cli.mjs';
import { strictServiceClient } from '../lib/supabase.mjs';

export const DEFAULT_OUTPUT = 'docs/ops/dashboard/scorecard.json';
const DAY = 86_400_000;
const execFileAsync = promisify(execFile);

const ratio = (n, d) => d ? Number((n / d).toFixed(4)) : null;
function median(xs) {
  if (!xs.length) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return Number((sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2).toFixed(2));
}
function percentile(xs, p) {
  if (!xs.length) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  return Number(sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)].toFixed(2));
}
const minutes = (start, end) => start && end ? (Date.parse(end) - Date.parse(start)) / 60_000 : null;
const entry = (goal, metric, value, unit, window, source, reason) => ({
  goal, metric, value, unit, window, source, ...(reason ? { reason } : {}),
});
const pending = (goal, metric, unit, window, source, reason) =>
  entry(goal, metric, 'not measurable yet', unit, window, source, reason);

async function mustQuery(source, query) {
  let result;
  try { result = await query; } catch (error) {
    throw new Error(`${source} unreadable: ${error.message}`, { cause: error });
  }
  if (result.error) throw new Error(`${source} unreadable: ${result.error.message}`);
  return result.data ?? [];
}

async function readJson(file, required = true) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (!required && error.code === 'ENOENT') return null;
    throw new Error(`${file} unreadable: ${error.message}`, { cause: error });
  }
}

async function weeklyDiff(paths, start) {
  try {
    const { stdout } = await execFileAsync('git', ['log', `--since=${start}`, '--format=%H', '--', ...paths], { encoding: 'utf8' });
    const commits = stdout.trim().split(/\r?\n/).filter(Boolean);
    if (!commits.length) return '';
    const base = `${commits.at(-1)}^`;
    return (await execFileAsync('git', ['diff', '--unified=0', base, 'HEAD', '--', ...paths], {
      encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
    })).stdout;
  } catch (error) {
    throw new Error(`seed diffs unreadable: ${error.message}`, { cause: error });
  }
}

export function countSeedChanges(diff, affiliateReport = '') {
  const added = diff.split(/\r?\n/).filter((line) => line.startsWith('+') && !line.startsWith('+++'));
  const fanMade = added.filter((line) => /^\+ {4}discoveredAt\s*:/.test(line)).length;
  const wrappedItems = new Set(affiliateReport.split(/\r?\n/)
    .filter((line) => /^\|.+\|.+\|.+\| wrapped \|/.test(line))
    .map((line) => line.split('|')[1].trim().replace(/^['"]|['"]$/g, '')));
  let item = null;
  const matchedItems = [];
  for (const line of added) {
    const itemMatch = /^\+\s+item\s*:\s*['"](.+?)['"],?\s*$/.exec(line);
    if (itemMatch) item = itemMatch[1];
    if (/^\+\s+matchTier\s*:/.test(line)) matchedItems.push(item);
  }
  return { fanMade, matched: matchedItems.length,
    matchedWithLiveAffiliate: matchedItems.filter((name) => name && wrappedItems.has(name)).length };
}

export async function loadSources({ client, now, root = process.cwd() }) {
  const end = now.toISOString();
  const start = new Date(now.getTime() - 7 * DAY).toISOString();
  const from = (table, columns, dateColumn) => mustQuery(table,
    client.from(table).select(columns).gte(dateColumn, start).lte(dateColumn, end));
  const [timelines, decisions, llm, theories, liveTheories, currentItems, leads, ledgers, outcomes] = await Promise.all([
    from('story_timeline', '*', 'first_public_at'),
    from('watch_decision', 'class,action,decided_at,watch_item(story_id)', 'decided_at'),
    from('llm_usage', 'caller,calls,input_tokens,output_tokens,est_cost_usd,created_at', 'created_at'),
    from('fan_theory_candidate', 'id,created_at', 'created_at'),
    mustQuery('live_theory', client.from('live_theory').select('id,first_seen_on,promoted_to').gte('first_seen_on', start.slice(0, 10)).lte('first_seen_on', end.slice(0, 10))),
    from('current_item', 'id,image_url,quality_hold_reason,created_at', 'created_at'),
    from('engagement_lead', 'id,platform,url,locator,status,created_at', 'created_at'),
    from('community_post_ledger', 'id,lead_id,platform,posted_at', 'posted_at'),
    from('community_outcome', 'post_ledger_id,platform,score,replies,horizon,checked_at', 'checked_at'),
  ]);
  const budget = await readJson(path.join(root, 'docs/ops/dashboard/budget.json'));
  const news = await readJson(path.join(root, 'docs/ops/dashboard/news.json'), false);
  const voice = await readJson(path.join(root, 'docs/ops/dashboard/voice.json'), false);
  const affiliate = await readFile(path.join(root, 'docs/ops/AFFILIATE-COVERAGE.md'), 'utf8')
    .catch((error) => { throw new Error(`merch affiliate coverage unreadable: ${error.message}`); });
  const diff = await weeklyDiff(['supabase/seed/merch/fanmade.mjs', 'supabase/seed/content'], start);
  return { start, end, timelines, decisions, llm, theories, liveTheories, currentItems, leads, ledgers, outcomes,
    budget, news, voice, seedChanges: countSeedChanges(diff, affiliate) };
}

export function buildScorecard(data, now = new Date()) {
  const window = `${data.start}/${data.end}`;
  const criticalIds = new Set(data.decisions.filter((row) => row.class === 'critical_breaking')
    .map((row) => row.watch_item?.story_id ?? row.watch_item?.[0]?.story_id).filter(Boolean));
  const critical = data.timelines.filter((row) => criticalIds.has(row.story_id));
  const stage = (field) => critical.map((row) => minutes(row.first_public_at, row[field]))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const sla = Object.fromEntries(['detected_at', 'classified_at', 'verified_at', 'on_site_at', 'push_at', 'social_at']
    .map((field) => [field.replace('_at', ''), { medianMinutes: median(stage(field)), p90Minutes: percentile(stage(field), 0.9) }]));
  const onTime = (field) => critical.filter((row) => {
    const elapsed = minutes(row.first_public_at, row[field]);
    return Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= 60;
  }).length;
  const recall = data.news?.rows?.at(-1);
  const newestVoice = Array.isArray(data.voice) ? [...data.voice].sort((a, b) => String(a.week).localeCompare(String(b.week))).at(-1) : null;
  const ledgerIds = new Set(data.ledgers.map((row) => row.id));
  const score24 = data.outcomes.filter((row) => ledgerIds.has(row.post_ledger_id) && row.platform === 'reddit' && row.horizon === '24h' && Number.isFinite(row.score));
  const replies = (platform) => data.outcomes.filter((row) => ledgerIds.has(row.post_ledger_id) && row.platform === platform && row.horizon === '7d');
  const direct = data.leads.filter((row) => row.url);
  const totalTurns = (data.budget.routines ?? []).reduce((sum, row) => sum + (Number(row.totalTurns) || 0), 0);
  const llmCalls = data.llm.reduce((sum, row) => sum + (Number(row.calls) || 0), 0);
  const llmCost = Number(data.llm.reduce((sum, row) => sum + (Number(row.est_cost_usd) || 0), 0).toFixed(4));
  const entries = [
    entry(1, 'Critical story delivery within 60 minutes and per-stage latency', { eligible: critical.length,
      siteShare: ratio(onTime('on_site_at'), critical.length), pushShare: ratio(onTime('push_at'), critical.length),
      socialShare: ratio(onTime('social_at'), critical.length), stages: sla }, 'share and minutes', window, 'story_timeline + watch_decision'),
    recall ? entry(2, 'Recall at 48 hours and critical recall at 1 hour', { events: recall.events, hit48h: recall.hit_48h,
      hit1hCritical: recall.hit_1h_critical }, 'share', `${recall.window_start}/${recall.generated_at}`, 'docs/ops/dashboard/news.json')
      : pending(2, 'Recall at 48 hours and critical recall at 1 hour', 'share', window, 'docs/ops/dashboard/news.json', 'No weekly recall audit row exists yet.'),
    entry(3, 'New theory candidates, live theories and seed records', { candidates: data.theories.length,
      live: data.liveTheories.length, promoted: data.liveTheories.filter((row) => row.promoted_to).length }, 'count', window,
    'fan_theory_candidate + live_theory + watch_decision'),
    entry(4, 'Media coverage of new live-feed items and missing-image holds', { items: data.currentItems.length,
      withMediaShare: ratio(data.currentItems.filter((row) => row.image_url).length, data.currentItems.length),
      missingImageHolds: data.currentItems.filter((row) => row.quality_hold_reason === 'missing_image').length }, 'share and count', window,
    'current_item + seed diffs'),
    entry(5, 'Critical stories posted to social', { eligible: critical.length, postedShare: ratio(critical.filter((row) => row.social_at).length, critical.length) },
      'share', window, 'story_timeline + watch_decision'),
    newestVoice ? entry(6, 'Weekly voice critic mean and p10', { sampled: newestVoice.sampled, scored: newestVoice.scored,
      mean: newestVoice.mean, p10: newestVoice.p10 }, '1-5 score', newestVoice.week, 'docs/ops/dashboard/voice.json + llm_usage + turn ledger')
      : pending(6, 'Weekly voice critic mean and p10', '1-5 score', window, 'docs/ops/dashboard/voice.json + llm_usage + turn ledger', 'No weekly voice sample exists yet.'),
    entry(7, 'Cards with direct links and comments posted, by platform', { delivered: data.leads.length,
      directLinkShare: ratio(direct.length, data.leads.length), posted: Object.fromEntries(['reddit', 'facebook'].map((p) => [p, data.ledgers.filter((r) => r.platform === p).length])) },
    'share and count', window, 'engagement_lead + community_post_ledger'),
    score24.length ? entry(8, 'Median 24-hour score of posted Reddit comments', median(score24.map((row) => row.score)), 'score', window, 'community_outcome')
      : pending(8, 'Median 24-hour score of posted Reddit comments', 'score', window, 'community_outcome', 'No eligible 24-hour Reddit outcomes exist yet.'),
    (replies('reddit').length || replies('facebook').length) ? entry(9, 'Posted comments with at least one reply at 7 days, by platform',
      Object.fromEntries(['reddit', 'facebook'].map((p) => [p, ratio(replies(p).filter((r) => r.replies > 0).length, replies(p).length)])), 'share', window, 'community_outcome')
      : pending(9, 'Posted comments with at least one reply at 7 days, by platform', 'share', window, 'community_outcome', 'No eligible 7-day outcomes exist yet.'),
    entry(10, 'New fan-made items merged into the app', data.seedChanges.fanMade, 'items', window, 'git diff: supabase/seed/merch/fanmade.mjs'),
    entry(11, 'New photo-matched products and live affiliate links', { matched: data.seedChanges.matched,
      liveAffiliate: data.seedChanges.matchedWithLiveAffiliate }, 'products', window, 'git diff: supabase/seed/content + docs/ops/AFFILIATE-COVERAGE.md'),
  ];
  return { version: 1, generatedAt: now.toISOString(), window: { start: data.start, end: data.end },
    operations: { routineTurns: totalTurns, llmCalls, estimatedCostUsd: llmCost }, entries };
}

export async function writeWeeklyScorecard({ outputPath = DEFAULT_OUTPUT, now = new Date(), client, root, sourceLoader = loadSources } = {}) {
  const supabase = client ?? strictServiceClient();
  if (!supabase) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required; scorecard was not written');
  const report = buildScorecard(await sourceLoader({ client: supabase, now, root }), now);
  const output = path.resolve(outputPath);
  const temporary = `${output}.tmp-${process.pid}`;
  await mkdir(path.dirname(output), { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await rename(temporary, output);
  } finally { await rm(temporary, { force: true }); }
  return report;
}

export function renderSummary(report) {
  return ['| Goal | Value |', '| ---: | --- |', ...report.entries.map((row) => {
    const value = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
    return `| ${row.goal} | ${value.replaceAll('|', '\\|').slice(0, 240)} |`;
  })].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) {
    console.log('Usage: node scripts/ops/weekly-scorecard.mjs [--output <path>]');
    return 0;
  }
  if (argv.length && (argv.length !== 2 || argv[0] !== '--output' || !argv[1])) {
    throw new Error('usage: weekly-scorecard.mjs [--output <path>]');
  }
  const outputPath = argv[1] ?? DEFAULT_OUTPUT;
  const report = await writeWeeklyScorecard({ outputPath });
  console.log(`weekly-scorecard: wrote ${report.entries.length} goals to ${outputPath}`);
  console.log(renderSummary(report));
  return 0;
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'weekly-scorecard' });
