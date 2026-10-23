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
export const MAX_ACTION_ATTEMPTS = 3;
async function publishCriticalSite(...args) {
  const site = await import('./actions/site.mjs');
  return site.publishCriticalSite(...args);
}
async function queueDuplicateHarvest({ decision, ...context }) {
  const harvest = await import('./actions/harvest.mjs');
  return harvest.runHarvestAction(decision, { ...context, live: true });
}
export const ACTION_HANDLERS = Object.freeze({
  critical_fast_path: publishCriticalSite,
  harvest_then_discard: queueDuplicateHarvest,
});
const runMerchAction = async (...args) => (await import('./actions/merch.mjs')).runMerchAction(...args);
export const ACTION_RUNNERS = Object.freeze({
  store_drop_draft: runMerchAction,
  fan_merch_curation: runMerchAction,
  outfit_matcher_queue: runMerchAction,
});

function actionAttempt(actionRef) {
  if (typeof actionRef !== 'string') return 0;
  try {
    const parsed = JSON.parse(actionRef);
    return parsed.routerStatus === 'retryable' && Number.isInteger(parsed.attempts)
      ? parsed.attempts : 0;
  } catch {
    return 0;
  }
}

function encodeActionState(plan, routerStatus, attempts, reason) {
  return JSON.stringify({ routerStatus, attempts, ...JSON.parse(encodePlan(plan)),
    ...(reason ? { reason } : {}) });
}

function failedResult(action, result) {
  if (result === false) return `${action}:returned-false`;
  if (!result || typeof result !== 'object') return null;
  for (const field of ['ok', 'success', 'published', 'acted']) {
    if (result[field] === false) return `${action}:${result.reason ?? `${field}-false`}`;
  }
  return null;
}

async function executeAction(action, decision, timeline, actionHandlers, actionRunners,
  actionContext) {
  const handler = actionHandlers[action];
  if (handler) return handler({ decision, timeline, ...actionContext });
  const runner = actionRunners[action];
  if (!runner) return undefined;
  return runner(decision, { ...actionContext, live: true, recordAction: async () => true });
}
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
  live = false, actionHandlers = ACTION_HANDLERS, actionRunners = ACTION_RUNNERS,
  actionContext = {}, warn = console.warn }) {
  const plans = [];
  const failures = [];
  let recorded = 0;
  for (const decision of decisions) {
    const storyId = decision.watch_item?.story_id;
    const timeline = storyId ? timelines.get(storyId) : null;
    const plan = String(decision.action ?? '').startsWith('shadow_hold')
      ? { ...planActions(decision.class, decision.answers, 0, timeline, config),
        state: 'held', actions: ['hold_shadow'] }
      : planActions(decision.class, decision.answers, decision.confidence, timeline, config);
    plans.push(plan);
    const enabled = live && config.classes[decision.class]?.enabled === true;
    const executable = plan.actions.filter((action) => actionHandlers[action] || actionRunners[action]);
    const attempts = actionAttempt(decision.action_ref) + 1;
    const claimRef = enabled && executable.length > 0
      ? encodeActionState(plan, 'claimed', attempts)
      : encodePlan(plan);
    const claimed = await store.record(decision.id, claimRef, decision.action_ref ?? null);
    if (!claimed) continue;
    recorded += 1;
    if (!enabled || executable.length === 0) continue;
    let activeAction = executable[0];
    try {
      for (const action of executable) {
        activeAction = action;
        const result = await executeAction(action, decision, timeline, actionHandlers,
          actionRunners, actionContext);
        const reason = failedResult(action, result);
        if (reason) throw Object.assign(new Error(`Tidewatch action failed: ${reason}`),
          { actionFailureReason: reason });
      }
      const successRef = encodeActionState(plan, 'succeeded', attempts);
      if (!await store.replace(decision.id, claimRef, successRef)) {
        throw new Error(`failed to settle Tidewatch action claim for ${decision.id}`);
      }
    } catch (error) {
      const reason = error?.actionFailureReason
        ?? `${activeAction}:threw:${error?.name ?? 'Error'}`;
      const status = attempts >= MAX_ACTION_ATTEMPTS ? 'parked' : 'retryable';
      const failureRef = encodeActionState(plan, status, attempts, reason);
      await store.replace(decision.id, claimRef, failureRef);
      failures.push({ decisionId: decision.id, action: activeAction, status, attempts });
      warn(`[tidewatch-route] warning: decision ${decision.id} action ${activeAction} failed; ${status} attempt ${attempts}/${MAX_ACTION_ATTEMPTS}`);
    }
  }
  return { mode: 'shadow-router', read: decisions.length, recorded, plans,
    disagreement: disagreementMetric(plans), failures };
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
  const store = deps.store ?? routerStore(client, { includeRetries: live });
  const pending = await store.loadPending(options.limit);
  const result = await routeDecisions({ ...pending, store, config, live,
    actionHandlers: deps.actionHandlers ?? ACTION_HANDLERS,
    actionRunners: deps.actionRunners ?? ACTION_RUNNERS,
    actionContext: { db: deps.client ?? client, env: deps.env ?? process.env,
      fetchImpl: deps.fetchImpl },
    warn: deps.warn ?? console.warn });
  const markdown = summaryMarkdown(result);
  (deps.log ?? console.log)(markdown.trim());
  const summaryPath = (deps.env ?? process.env).GITHUB_STEP_SUMMARY;
  if (summaryPath) await (deps.appendSummary ?? appendFile)(summaryPath, markdown);
  if (result.failures.length > 0) {
    throw new Error(`${result.failures.length} Tidewatch decision action(s) failed`);
  }
  return result;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-route' });
