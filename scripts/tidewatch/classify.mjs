#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { createJevClient } from '../lib/jev.mjs';
import { runMain } from '../lib/cli.mjs';
import { createClaudeCaller } from '../lib/claude-call.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { callFallback, decisionRow, inspectWithJev } from './cascade.mjs';
import { CLASS_BY_OPTION, CLASS_IDS } from './questions.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'tidewatch.json');
export const DEFAULT_ITEM_CAP = 100;
const PAGE = 500;
const execFileAsync = promisify(execFile);
function parseArgs(argv) {
  const options = { evalPath: null, limit: DEFAULT_ITEM_CAP };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--eval') options.evalPath = path.resolve(argv[++index] ?? '');
    else if (argv[index] === '--limit') options.limit = Number(argv[++index]);
    else throw new Error('usage: classify.mjs [--limit N] [--eval <replay.json>]');
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 1000) {
    throw new Error('--limit must be an integer from 1 to 1000');
  }
  return options;
}
export function classifierStore(client) {
  const existingDecisionIds = async (ids) => {
    const found = new Set();
    for (let offset = 0; offset < ids.length; offset += PAGE) {
      const { data, error } = await client.from('watch_decision').select('item_id')
        .in('item_id', ids.slice(offset, offset + PAGE));
      if (error) throw error;
      for (const row of data) if (row.item_id) found.add(row.item_id);
    }
    return found;
  };
  return {
    async loadItems(limit) {
      const { data, error } = await client.from('watch_item')
        .select('*, watch_decision!left(item_id)')
        .in('status', ['new', 'pending']).is('watch_decision', null)
        .order('first_seen_at').limit(limit);
      if (error) throw error;
      return data;
    },
    existingDecisionIds,
    async loadCandidates(since) {
      const { data, error } = await client.from('watch_item').select('*')
        .gte('last_seen_at', since).order('last_seen_at', { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
    async insertDecisions(rows) {
      const unique = [...new Map(rows.map((row) => [row.item_id, row])).values()];
      const existing = await existingDecisionIds(unique.map((row) => row.item_id));
      const fresh = unique.filter((row) => !existing.has(row.item_id));
      if (fresh.length === 0) return fresh;
      const { error } = await client.from('watch_decision').insert(fresh);
      if (error) throw error;
      return fresh;
    },
    async markClassified(items, rows, classifiedAt) {
      const decided = new Set(rows.map((row) => row.item_id));
      const storyIds = [...new Set(items.filter((item) => decided.has(item.id) && item.story_id)
        .map((item) => item.story_id))];
      if (storyIds.length === 0) return;
      const timelines = storyIds.map((story_id) => ({ story_id, classified_at: classifiedAt }));
      const { error } = await client.from('story_timeline')
        .upsert(timelines, { onConflict: 'story_id' });
      if (error) throw error;
    },
  };
}
export async function openJevFallbackAlert(reason, run = execFileAsync) {
  const directory = await mkdtemp(path.join(tmpdir(), 'tidewatch-alert-'));
  const bodyPath = path.join(directory, 'body.md');
  const title = 'Tidewatch: Jev fallback-only mode';
  await writeFile(bodyPath,
    `Tidewatch switched this classifier run to Haiku-only after ${reason}. One alert is raised per affected run.\n`);
  try {
    await run('bash', [path.join(ROOT, 'scripts/watchdog/upsert-alert.sh'), 'open', title, bodyPath], {
      env: { ...process.env, REPO: process.env.REPO ?? process.env.GITHUB_REPOSITORY },
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
const chunks = (rows, size) => Array.from({ length: Math.ceil(rows.length / size) },
  (_, index) => rows.slice(index * size, (index + 1) * size));

export async function classifyItems({ items, candidates, store, config, jev, callClaude,
  random = Math.random, now = Date.now(), log = () => {}, alert = async () => {} }) {
  const existing = await store.existingDecisionIds(items.map((item) => item.id));
  const pending = items.filter((item) => !existing.has(item.id));
  const inspected = [];
  let fallbackOnly = false;
  let alertReason = null;
  let jevAttempts = 0;
  for (const item of pending) {
    const attemptedJev = !fallbackOnly && Boolean(jev);
    const result = await inspectWithJev(item, candidates, {
      config, jev, random, now, fallbackOnly,
    });
    if (attemptedJev && result.decider !== 'code') jevAttempts += 1;
    if (result.switchToFallbackOnly) {
      fallbackOnly = true;
      alertReason ??= result.reason;
    }
    inspected.push({ item, candidates, inspected: result });
  }
  const direct = inspected.filter((entry) => entry.inspected.kind === 'decision');
  const uncertain = inspected.filter((entry) => entry.inspected.kind === 'fallback'
    && entry.inspected.reason === 'below_threshold');
  const drift = inspected.filter((entry) => entry.inspected.kind === 'fallback'
    && entry.inspected.reason === 'drift_sample');
  const requiredFallback = inspected.filter((entry) => entry.inspected.kind === 'fallback'
    && !['below_threshold', 'drift_sample'].includes(entry.inspected.reason));
  const maxEscalations = uncertain.length + drift.length > 0
    ? Math.max(1, Math.ceil(pending.length * config.maxEscalationRate)) : 0;
  const selectedUncertain = uncertain.slice(0, maxEscalations);
  const driftSlots = Math.max(0, maxEscalations - selectedUncertain.length);
  const selectedDrift = drift.slice(0, driftSlots);
  const selectedFallback = new Set([...requiredFallback, ...selectedUncertain, ...selectedDrift]);
  const fallbackEntries = inspected.filter((entry) => selectedFallback.has(entry));
  const rows = direct.map(({ item, inspected: result }) => decisionRow(item, result, null, config));
  for (const entry of drift.slice(driftSlots)) {
    rows.push(decisionRow(entry.item, entry.inspected, null, config));
  }
  const batchSize = config.fallbackBatchSize;
  const maxFallbackCalls = Math.min(
    config.dailyCaps['tidewatch-fallback'].calls,
    Math.ceil(fallbackEntries.length / batchSize),
  );
  let fallbackAttempted = 0;
  let wrapperFailures = 0;
  let fallbackCapHeld = 0;
  let processedFallback = 0;
  for (const batch of chunks(fallbackEntries, batchSize)) {
    fallbackAttempted += batch.length;
    const response = await callFallback(batch, { callClaude, config, maxCalls: maxFallbackCalls });
    if (!response.ok) {
      if (response.capped) {
        fallbackCapHeld = fallbackEntries.length - processedFallback;
        break;
      }
      wrapperFailures += batch.length;
      processedFallback += batch.length;
      continue;
    }
    for (const entry of batch) {
      rows.push(decisionRow(entry.item, entry.inspected, response.labels.get(entry.item.id), config));
    }
    processedFallback += batch.length;
  }
  const insertedRows = await store.insertDecisions(rows) ?? rows;
  await store.markClassified?.(pending, insertedRows, new Date(now).toISOString());
  const heldForCap = uncertain.length - selectedUncertain.length;
  const jevFailures = requiredFallback
    .filter((entry) => entry.inspected.reason !== 'jev_run_fallback').length;
  const summary = {
    read: items.length, skipped: existing.size, written: insertedRows.length,
    pending: heldForCap + wrapperFailures + fallbackCapHeld,
    jevAttempts, jevUnavailable: jevFailures, fallbackAttempted, wrapperFailures,
    heldForCap, fallbackCapHeld,
  };
  if (alertReason) await alert(alertReason);
  log(`tidewatch classify: read=${summary.read} skipped=${summary.skipped} written=${summary.written} pending=${summary.pending} jev=${jevAttempts} jevUnavailable=${jevFailures} fallback=${fallbackAttempted} budgetHeld=${heldForCap} fallbackCapHeld=${fallbackCapHeld} wrapperUnavailable=${wrapperFailures}`);
  return { rows: insertedRows, summary };
}

function evalSource(kind) {
  if (kind === 'reddit_lead') return 'reddit';
  if (kind === 'facebook_lead') return 'facebook';
  if (kind === 'merch') return 'merch';
  if (kind === 'theory_bundle') return 'theory';
  return 'news';
}

function replayItem(entry, index) {
  const stamp = entry.meta?.firstSeenAt ?? entry.meta?.createdAt ?? '2026-01-01T00:00:00.000Z';
  return {
    id: String(entry.id ?? `replay-${index}`), item_key: `replay:${entry.id ?? index}`,
    source: evalSource(entry.kind), source_ref: String(entry.id ?? index),
    url_norm_hash: null, title_simhash: null, story_id: null,
    first_seen_at: stamp, last_seen_at: stamp, seen_count: 1,
    excerpt: entry.title ?? entry.text?.title ?? entry.text?.summary ?? null, status: 'pending',
  };
}

const OPTION_BY_CLASS = Object.fromEntries(Object.entries(CLASS_BY_OPTION).map(([option, classId]) => [classId, option]));

function recordedAnswer(question, output) {
  const confidence = output.confidence;
  if (question.type === 'score') return { type: 'score', value: 3, confidence };
  if (question.type === 'noul') {
    const yes = question.id === 'q_speculation' ? output.class === 'privacy_redline'
      : question.id === 'q_injection' ? output.injection === true
        : question.id === 'q_theory' ? output.class === 'theory_material' : false;
    return { type: 'noul', probability: yes ? Math.max(confidence, 0.95) : 0.05 };
  }
  let optionId = question.options[0].id;
  if (question.id === 'q_class') optionId = OPTION_BY_CLASS[output.class] ?? 'off_topic_noise';
  if (question.id === 'q_same_story') optionId = 'none';
  if (question.id === 'q_settled') optionId = 'stated_fact';
  if (question.id === 'q_merch_kind') optionId = {
    merch_official: 'official_store', merch_fan: 'fan_original', noise: 'not_product',
  }[output.class] ?? 'not_product';
  if (question.id === 'q_contradicts') optionId = 'UNRELATED';
  return { type: 'choice', optionId, probabilities: { [optionId]: confidence }, confidence };
}

function recordedModels(entries) {
  const byId = new Map(entries.map((entry) => [String(entry.id), entry.modelOutputs]));
  return {
    jev: { ask: async ({ state, questions }) => {
      const id = /^item id: (.+)$/m.exec(state)?.[1];
      const output = byId.get(id)?.jev;
      if (!output) throw new Error('recorded Jev output missing');
      return { answers: Object.fromEntries(questions.map((question) => [question.id, recordedAnswer(question, output)])) };
    } },
    callClaude: async ({ user }) => ({ status: 'ok', data: { labels: [...byId.entries()]
      .filter(([id]) => user.includes(`item id: ${id}`)).map(([id, output]) => ({
        id, class: output.fallback?.class ?? output.jev.class,
        injection: output.fallback?.injection === true ? 'yes' : 'no',
      })) } }),
  };
}

export function evalReport(expected, rows, summary) {
  const predicted = new Map(rows.map((row) => [row.item_id, row.class]));
  const lines = [];
  for (const classId of CLASS_IDS) {
    const actual = expected.filter((entry) => entry.class === classId).length;
    const guesses = [...predicted.values()].filter((value) => value === classId).length;
    const correct = expected.filter((entry) => entry.class === classId
      && predicted.get(entry.id) === classId).length;
    const precision = guesses ? (correct / guesses).toFixed(3) : 'n/a';
    const recall = actual ? (correct / actual).toFixed(3) : 'n/a';
    lines.push(`${classId} precision=${precision} recall=${recall} support=${actual} predicted=${guesses}`);
  }
  const rate = summary.jevAttempts ? summary.fallbackAttempted / summary.jevAttempts : 0;
  lines.push(`jev-to-haiku escalation rate=${rate.toFixed(3)} (${summary.fallbackAttempted}/${summary.jevAttempts})`);
  lines.push(`decisions=${rows.length}/${expected.length} pending=${expected.length - rows.length}`);
  return lines.join('\n');
}

export async function evaluateReplay(replay, { config, jev, callClaude, random = () => 1 } = {}) {
  const items = replay.items.map(replayItem);
  const expected = replay.items.map((entry, index) => ({
    id: items[index].id, class: entry.class ?? entry.expectedClass,
  }));
  if (expected.some((entry) => !CLASS_IDS.includes(entry.class))) throw new Error('replay item has no valid class label');
  if (replay.items.every((entry) => entry.modelOutputs?.jev)) {
    ({ jev, callClaude } = recordedModels(replay.items));
  }
  const store = {
    existingDecisionIds: async () => new Set(),
    insertDecisions: async () => undefined,
  };
  const result = await classifyItems({ items, candidates: [], store, config, jev, callClaude,
    random, now: Date.parse('2026-10-15T00:00:00.000Z') });
  return { ...result, report: evalReport(expected, result.rows, result.summary) };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const config = deps.config ?? JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  let jev = deps.jev;
  if (!jev) {
    try { jev = createJevClient(); } catch { jev = null; }
  }
  const callClaude = deps.callClaude ?? createClaudeCaller();
  if (options.evalPath) {
    const replay = JSON.parse(await readFile(options.evalPath, 'utf8'));
    const result = await evaluateReplay(replay, { config, jev, callClaude, random: deps.random });
    (deps.log ?? console.log)(result.report);
    return result;
  }
  const client = deps.store ? null : deps.client ?? serviceClient();
  if (!deps.store && !client) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const store = deps.store ?? classifierStore(client);
  const loaded = await store.loadItems(options.limit);
  const existing = await store.existingDecisionIds(loaded.map((item) => item.id));
  const items = loaded.filter((item) => !existing.has(item.id)).slice(0, options.limit);
  const since = new Date((deps.now ?? Date.now()) - 72 * 3_600_000).toISOString();
  const candidates = await store.loadCandidates(since);
  return classifyItems({ items, candidates, store, config, jev, callClaude,
    random: deps.random, now: deps.now, log: deps.log ?? console.log,
    alert: deps.alert ?? openJevFallbackAlert });
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-classify' });
