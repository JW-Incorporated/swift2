#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJevClient } from '../lib/jev.mjs';
import { runMain } from '../lib/cli.mjs';
import { createClaudeCaller } from '../lib/claude-call.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { answerConfidence, callFallback, decisionRow, inspectWithJev } from './cascade.mjs';
import { classifierStore, openJevFallbackAlert } from './classifier-store.mjs';
import { CLASS_BY_OPTION, CLASS_IDS } from './questions.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'tidewatch.json');
export const DEFAULT_ITEM_CAP = 100;
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
const TIER_A_CLASSES = new Set(['critical_breaking', 'critical_personal', 'correction_debunk']);
const isTierA = (classId, config) => Boolean(classId) && (TIER_A_CLASSES.has(classId)
  || ['P0', 'P1'].includes(config.classes[classId]?.priority));
const chunks = (rows, size) => Array.from({ length: Math.ceil(rows.length / size) },
  (_, index) => rows.slice(index * size, (index + 1) * size));
const wrapperReasonToken = (reason) => {
  const token = typeof reason === 'string' ? reason.toLowerCase() : '';
  return /^[a-z_ -]{1,40}$/.test(token) ? token : 'other';
};

export async function classifyItems({ items, candidates, store, config, jev, callClaude,
  random = Math.random, now = Date.now(), log = () => {}, alert = async () => {} }) {
  const existing = await store.existingDecisionIds(items.map((item) => item.id));
  const pending = items.filter((item) => !existing.has(item.id));
  const inspected = [];
  let fallbackOnly = !jev;
  let alertReason = !jev && pending.length > 0 ? 'jev_unavailable' : null;
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
  const requiredFallback = inspected.filter((entry) => entry.inspected.kind === 'fallback'
    && !['below_threshold', 'drift_sample'].includes(entry.inspected.reason));
  const fallbackEntries = inspected.filter((entry) => entry.inspected.kind === 'fallback');
  const rows = direct.map(({ item, inspected: result }) => decisionRow(item, result, null, config));
  const batchSize = config.fallbackBatchSize;
  const maxFallbackCalls = Math.min(
    config.dailyCaps['tidewatch-fallback'].calls,
    Math.ceil(fallbackEntries.length / batchSize),
  );
  let fallbackAttempted = 0;
  let wrapperFailures = 0;
  const wrapperReasons = new Map();
  let fallbackCapHeld = 0;
  let tierAHeld = 0;
  let processedFallback = 0;
  for (const batch of chunks(fallbackEntries, batchSize)) {
    fallbackAttempted += batch.length;
    const response = await callFallback(batch, { callClaude, config, maxCalls: maxFallbackCalls });
    if (!response.ok) {
      if (response.capped) {
        const capHeld = fallbackEntries.slice(processedFallback);
        for (const entry of capHeld.filter((held) => isTierA(held.inspected.result?.class, config))) {
          const held = decisionRow(entry.item, entry.inspected, null, config);
          rows.push(entry.inspected.answers?.injection === true ? held
            : { ...held, action: 'shadow_hold_budget' });
          tierAHeld += 1;
        }
        fallbackCapHeld = capHeld.length - tierAHeld;
        break;
      }
      wrapperFailures += batch.length;
      const reasonToken = wrapperReasonToken(response.reason);
      wrapperReasons.set(reasonToken, (wrapperReasons.get(reasonToken) ?? 0) + batch.length);
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
  // maxEscalationRate is now alert-only (unused here); fallback calls are bounded per run by maxCalls, and items decided by Haiku get a row so are never re-asked; per-day volume is bounded by item intake (no cross-run ledger yet; P0-07).
  const heldForCap = 0;
  const jevFailures = requiredFallback
    .filter((entry) => entry.inspected.reason !== 'jev_run_fallback').length;
  const summary = {
    read: items.length, skipped: existing.size, written: insertedRows.length,
    pending: heldForCap + wrapperFailures + fallbackCapHeld,
    jevAttempts, jevUnavailable: jevFailures, fallbackAttempted, wrapperFailures,
    heldForCap, fallbackCapHeld, wrapperReasons: Object.fromEntries(wrapperReasons),
  };
  if (alertReason) await alert(alertReason);
  log(`tidewatch classify: read=${summary.read} skipped=${summary.skipped} written=${summary.written} pending=${summary.pending} jev=${jevAttempts} jevUnavailable=${jevFailures} fallback=${fallbackAttempted} budgetHeld=${heldForCap} fallbackCapHeld=${fallbackCapHeld} wrapperUnavailable=${wrapperFailures} wrapperReasons=${JSON.stringify(summary.wrapperReasons)}`);
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

const DECIDERS = ['code', 'jev', 'haiku'];
const CRITICAL_CLASSES = [...TIER_A_CLASSES];

// candidate/candidateUrgency come from classes.critical_breaking.thresholds and apply to all Tier A classes.
function jevCandidate(jev, config) {
  const thresholds = config?.classes?.critical_breaking?.thresholds ?? {};
  const jevClass = jev?.q_class?.type === 'choice' ? CLASS_BY_OPTION[jev.q_class.optionId] : null;
  if (TIER_A_CLASSES.has(jevClass) && answerConfidence(jev.q_class) >= (thresholds.candidate ?? 0.3)) return true;
  return typeof jev?.q_urgency?.value === 'number' && jev.q_urgency.value >= (thresholds.candidateUrgency ?? 4);
}

const haikuCandidate = (row) => row?.decider === 'haiku' && TIER_A_CLASSES.has(row.answers?.haiku?.class);

export function isCandidate(row, config) {
  return jevCandidate(row.answers?.jev, config) || haikuCandidate(row);
}

export function evalReport(expected, rows, summary, { config, recorded, jevAnswers } = {}) {
  const predicted = new Map(rows.map((row) => [row.item_id, row.class]));
  const rowById = new Map(rows.map((row) => [row.item_id, row]));
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
  for (const classId of CLASS_IDS) {
    const split = DECIDERS.map((decider) => `${decider}=${rows.filter((row) => row.class === classId
      && row.decider === decider).length}`);
    const pending = expected.filter((entry) => entry.class === classId && !rowById.has(entry.id)).length;
    lines.push(`decider-split ${classId} ${split.join(' ')} pending=${pending}`);
  }
  const combined = { candidates: 0, support: 0 };
  for (const classId of CRITICAL_CLASSES) {
    const members = expected.filter((entry) => entry.class === classId);
    const candidates = members.filter((entry) => jevCandidate(jevAnswers?.get(entry.id)
      ?? rowById.get(entry.id)?.answers?.jev, config) || haikuCandidate(rowById.get(entry.id))).length;
    combined.candidates += candidates;
    combined.support += members.length;
    lines.push(`tier-a-candidate-recall ${classId} candidates=${candidates}/${members.length} recall=${members.length ? (candidates / members.length).toFixed(3) : 'n/a'}`);
  }
  lines.push(`tier-a-candidate-recall combined candidates=${combined.candidates}/${combined.support} recall=${combined.support ? (combined.candidates / combined.support).toFixed(3) : 'n/a'}`);
  const reasonEntries = Object.entries(summary.wrapperReasons ?? {});
  lines.push(`wrapper reasons: ${reasonEntries.length
    ? reasonEntries.map(([reason, count]) => `${reason}=${count}`).join(' ') : 'none'}`);
  if (recorded) {
    const unresolved = expected.length - rows.length;
    lines.push(`recorded-outputs jev=${recorded.jev}/${recorded.total} haiku=${recorded.haiku}/${recorded.total}`);
    lines.push(`pending breakdown: wrapperFailures=${summary.wrapperFailures} fallbackCapHeld=${summary.fallbackCapHeld} heldForCap=${summary.heldForCap}${recorded.haiku === 0 && unresolved > 0 ? ' (no recorded fallback: live Haiku required)' : ''}`);
  }
  for (const entry of expected.filter((member) => CRITICAL_CLASSES.includes(member.class))) {
    const row = rowById.get(entry.id);
    const jevAnswer = jevAnswers?.get(entry.id) ?? row?.answers?.jev;
    if (jevCandidate(jevAnswer, config) || haikuCandidate(row)) continue;
    const jevClass = CLASS_BY_OPTION[jevAnswer?.q_class?.optionId] ?? 'none';
    lines.push(`tier-a-missed ${entry.class} id=${entry.id} predicted=${row?.class ?? 'pending'} decider=${row?.decider ?? 'pending'} jevClass=${jevClass} jevConf=${answerConfidence(jevAnswer?.q_class).toFixed(2)} urgency=${jevAnswer?.q_urgency?.value ?? 'none'} redlineHint=${row?.answers?.redline_hint ?? 'none'}`);
  }
  const expectedById = new Map(expected.map((entry) => [entry.id, entry.class]));
  const privacyRows = rows.filter((row) => row.class === 'privacy_redline');
  const byExpected = new Map();
  for (const row of privacyRows) {
    const expectedClass = expectedById.get(row.item_id) ?? 'unknown';
    byExpected.set(expectedClass, (byExpected.get(expectedClass) ?? 0) + 1);
  }
  const expectedTally = [...byExpected].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => `${name}=${count}`);
  lines.push(`privacy-predicted-by-expected ${expectedTally.join(' ') || 'none'}`);
  const byDecider = (decider) => privacyRows.filter((row) => row.decider === decider).length;
  lines.push(`privacy-predicted-by-decider jev=${byDecider('jev')} haiku=${byDecider('haiku')} with-hint=${privacyRows.filter((row) => row.answers?.redline_hint).length}`);
  return lines.join('\n');
}

export async function evaluateReplay(replay, { config, jev, callClaude, random = () => 1 } = {}) {
  const evalItems = replay.items.filter((entry) => entry.excludeFromEval !== true);
  const excludedCount = replay.items.length - evalItems.length;
  const items = evalItems.map(replayItem);
  const expected = evalItems.map((entry, index) => ({
    id: items[index].id, class: entry.class ?? entry.expectedClass,
  }));
  if (expected.some((entry) => !CLASS_IDS.includes(entry.class))) throw new Error('replay item has no valid class label');
  if (evalItems.every((entry) => entry.modelOutputs?.jev)) {
    ({ jev, callClaude } = recordedModels(evalItems));
  }
  const recorded = {
    total: evalItems.length,
    jev: evalItems.filter((entry) => entry.modelOutputs?.jev).length,
    haiku: evalItems.filter((entry) => entry.modelOutputs?.fallback).length,
  };
  const uncapped = {
    ...config,
    maxEscalationRate: 1,
    dailyCaps: {
      ...config.dailyCaps,
      'tidewatch-fallback': { ...config.dailyCaps['tidewatch-fallback'], calls: Number.MAX_SAFE_INTEGER },
    },
  };
  const jevAnswers = new Map();
  const askJev = jev && {
    ask: async (request) => {
      const response = await jev.ask(request);
      const id = /^item id: (.+)$/m.exec(request.state)?.[1];
      if (id && response?.answers) jevAnswers.set(id, response.answers);
      return response;
    },
  };
  const store = {
    existingDecisionIds: async () => new Set(),
    insertDecisions: async () => undefined,
  };
  const result = await classifyItems({ items, candidates: [], store, config: uncapped, jev: askJev, callClaude,
    random, now: Date.parse('2026-10-15T00:00:00.000Z') });
  const report = evalReport(expected, result.rows, result.summary, { config, recorded, jevAnswers });
  return { ...result, report: `${report}\nexcluded-from-eval n=${excludedCount}` };
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
