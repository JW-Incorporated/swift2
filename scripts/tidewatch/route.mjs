#!/usr/bin/env node
import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { encodePlan, planActions } from './actions/plan.mjs';
import { routerStore } from './router-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'tidewatch.json');
function parseArgs(argv) {
  const options = { limit: 600, replayPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--dry-run') continue;
    if (argv[index] === '--replay') options.replayPath = path.resolve(argv[++index] ?? '');
    else if (argv[index] === '--limit') options.limit = Number(argv[++index]);
    else throw new Error('usage: route.mjs [--limit N] [--dry-run --replay <replay.json>]');
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 1000) {
    throw new Error('--limit must be an integer from 1 to 1000');
  }
  return options;
}

export function disagreementMetric(plans) {
  const comparable = plans.filter((plan) => plan.answerRoute !== null);
  const total = comparable.length;
  const count = comparable.filter((plan) => plan.answerRoute !== plan.finalRoute).length;
  return { count, total, rate: total === 0 ? 0 : count / total, stop: total > 0 && count / total > 0.1 };
}

export async function routeDecisions({ decisions, timelines = new Map(), store, config,
  live = false }) {
  if (live) throw new Error('TIDEWATCH_ROUTER_LIVE is reserved; P2-02 is shadow-write only');
  const plans = [];
  let recorded = 0;
  for (const decision of decisions) {
    const storyId = decision.watch_item?.story_id;
    const plan = planActions(decision.class, decision.answers, decision.confidence,
      storyId ? timelines.get(storyId) : null, config);
    plans.push(plan);
    if (await store.record(decision.id, encodePlan(plan))) recorded += 1;
  }
  return { mode: 'shadow-router', read: decisions.length, recorded, plans,
    disagreement: disagreementMetric(plans) };
}

export function summaryMarkdown(summary) {
  const metric = summary.disagreement;
  const percent = (metric.rate * 100).toFixed(1);
  const signal = metric.stop ? 'STOP — above the 10% threshold' : 'within threshold';
  const title = summary.mode === 'route-table-smoke-test'
    ? 'Tidewatch route-table smoke test'
    : 'Tidewatch router (shadow only)';
  return `### ${title}\n\n- decisions evaluated: ${summary.read}\n- plans recorded: ${summary.recorded}\n- answer-implied/final-route conflicts: ${metric.count}/${metric.total} (${percent}%) — ${signal}\n- definition: threshold-qualified classifier question answers imply a different route than the final class; above 10% is architect #11's stop signal\n\n`;
}

export function planReplay(replay, config, limit = 600) {
  const items = replay.items.slice(0, limit);
  const hasRecordedClassifierInput = (item) => Number.isFinite(item.confidence)
    && item.answers?.jev && typeof item.answers.jev === 'object';
  const recordedInputs = items.filter(hasRecordedClassifierInput).length;
  const plans = items.map((item) => planActions(item.class ?? item.expectedClass,
    hasRecordedClassifierInput(item) ? item.answers : {},
    hasRecordedClassifierInput(item) ? item.confidence : 1, null, config));
  const mode = recordedInputs === items.length ? 'classifier-replay' : 'route-table-smoke-test';
  return { mode, read: items.length, recorded: 0, recordedInputs, plans,
    disagreement: disagreementMetric(plans) };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const config = deps.config ?? JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  if (options.replayPath) {
    const replay = JSON.parse(await readFile(options.replayPath, 'utf8'));
    const result = planReplay(replay, config, options.limit);
    (deps.log ?? console.log)(summaryMarkdown(result).trim());
    return result;
  }
  if ((deps.env ?? process.env).TIDEWATCH_FREEZE === 'true') {
    return { frozen: true, read: 0, recorded: 0, plans: [], disagreement: disagreementMetric([]) };
  }
  const live = (deps.env ?? process.env).TIDEWATCH_ROUTER_LIVE === 'true';
  const client = deps.store ? null : deps.client ?? serviceClient();
  if (!deps.store && !client) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const store = deps.store ?? routerStore(client);
  const pending = await store.loadPending(options.limit);
  const result = await routeDecisions({ ...pending, store, config, live });
  const markdown = summaryMarkdown(result);
  (deps.log ?? console.log)(markdown.trim());
  const summaryPath = (deps.env ?? process.env).GITHUB_STEP_SUMMARY;
  if (summaryPath) await (deps.appendSummary ?? appendFile)(summaryPath, markdown);
  return result;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-route' });
