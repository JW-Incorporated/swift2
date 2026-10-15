import { callClaude } from '../lib/claude-call.mjs';
import {
  DIMENSIONS, REWRITE_SCHEMA, REWRITE_SYSTEM, SCORE_SCHEMA,
  rewriteUser, scoreSystem, scoreUser,
} from './critic-prompts.mjs';

export const SCORE_MODEL = 'claude-haiku-5-5';
export const REWRITE_MODEL = 'claude-sonnet-5-5';
export const CALLER = 'voice-critic';
export const PRIORITY = 'P2';
export const BATCH_SIZE = 10;
export const THRESHOLD = 3;
const STOP = new Set(['unavailable', 'capped']);

function defaultLog(event) {
  process.stderr.write(`${JSON.stringify({ voiceCritic: event })}\n`);
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function lowest(scores) {
  return Math.min(...DIMENSIONS.map((d) => scores[d]));
}

function pick(row) {
  const scores = Object.fromEntries(DIMENSIONS.map((d) => [d, row[d]]));
  return { scores, min: lowest(scores), note: row.note ?? '' };
}

function validRow(row, wanted) {
  return row && typeof row.id === 'string' && wanted.has(row.id)
    && DIMENSIONS.every((d) => Number.isInteger(row[d]) && row[d] >= 1 && row[d] <= 5);
}

function call(opts, model, system, user, schema) {
  return (opts.call ?? callClaude)({
    caller: CALLER, priority: PRIORITY, model, system, user, schema,
  });
}

export function notScored(item, reason) {
  return { id: item.id, status: 'not_scored', reason };
}

export async function scoreItems(items, opts = {}) {
  const log = opts.log ?? defaultLog;
  const system = scoreSystem(opts.anchors ?? []);
  const results = new Map();
  let stopped = null;
  for (const batch of chunk(items, opts.batchSize ?? BATCH_SIZE)) {
    if (stopped) {
      for (const item of batch) results.set(item.id, notScored(item, stopped));
      continue;
    }
    const res = await call(opts, SCORE_MODEL, system, scoreUser(batch), SCORE_SCHEMA);
    if (res?.status !== 'ok') {
      const reason = `${res?.status ?? 'no-result'}${res?.reason ? `: ${res.reason}` : ''}`;
      if (STOP.has(res?.status)) stopped = reason;
      log({ event: 'score-not-scored', reason, items: batch.length });
      for (const item of batch) results.set(item.id, notScored(item, reason));
      continue;
    }
    const wanted = new Set(batch.map((i) => i.id));
    const rows = Array.isArray(res.data?.results) ? res.data.results : [];
    for (const row of rows) {
      if (validRow(row, wanted) && !results.has(row.id)) {
        results.set(row.id, { id: row.id, status: 'scored', ...pick(row) });
      }
    }
    for (const item of batch) {
      if (!results.has(item.id)) {
        log({ event: 'score-missing-id', id: item.id });
        results.set(item.id, notScored(item, 'invalid: id missing from critic response'));
      }
    }
  }
  return items.map((item) => results.get(item.id));
}

async function rewriteOnce(weak, opts) {
  const log = opts.log ?? defaultLog;
  const rewrites = new Map();
  for (const batch of chunk(weak, opts.batchSize ?? BATCH_SIZE)) {
    const res = await call(opts, REWRITE_MODEL, REWRITE_SYSTEM, rewriteUser(batch), REWRITE_SCHEMA);
    if (res?.status !== 'ok') {
      log({ event: 'rewrite-failed', reason: `${res?.status}: ${res?.reason ?? ''}` });
      if (STOP.has(res?.status)) break;
      continue;
    }
    const wanted = new Map(batch.map((i) => [i.id, i.text]));
    for (const row of Array.isArray(res.data?.rewrites) ? res.data.rewrites : []) {
      const text = typeof row?.text === 'string' ? row.text.trim() : '';
      if (wanted.has(row?.id) && text && text !== wanted.get(row.id) && !rewrites.has(row.id)) {
        rewrites.set(row.id, text);
      }
    }
  }
  return rewrites;
}

export async function reviewDrafts(items, opts = {}) {
  const before = await scoreItems(items, opts);
  const byId = new Map(items.map((item, i) => [item.id, { item, before: before[i] }]));
  const weak = before
    .filter((s) => s.status === 'scored' && s.min < THRESHOLD)
    .map((s) => ({ id: s.id, text: byId.get(s.id).item.text, note: s.note }));
  const rewrites = weak.length ? await rewriteOnce(weak, opts) : new Map();
  const retry = [...rewrites].map(([id, text]) => ({ id, text }));
  const after = new Map(
    (retry.length ? await scoreItems(retry, opts) : []).map((s) => [s.id, s]),
  );
  return items.map((item, i) => {
    const b = before[i];
    const a = after.get(item.id);
    const accepted = Boolean(a && a.status === 'scored' && a.min > b.min);
    return {
      id: item.id,
      text: accepted ? rewrites.get(item.id) : item.text,
      original: item.text,
      status: b.status,
      before: b.status === 'scored' ? b : null,
      rewriteAttempted: rewrites.has(item.id),
      rewritten: accepted,
      after: a?.status === 'scored' ? a : null,
      ...(b.status === 'not_scored' ? { reason: b.reason } : {}),
    };
  });
}

export function formatReview(results) {
  const scored = results.filter((r) => r.status === 'scored' || r.before);
  const weak = results.filter((r) => r.before && r.before.min < THRESHOLD);
  const lines = [`voice-critic: items=${results.length} scored=${scored.length} `
    + `not_scored=${results.length - scored.length} weak=${weak.length} `
    + `rewritten=${results.filter((r) => r.rewritten).length}`];
  for (const r of weak) {
    lines.push(`item ${r.id}: min=${r.before.min} note: ${r.before.note}`);
    if (r.rewritten) lines.push(`  suggested: ${r.text}`);
  }
  return lines.join('\n');
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'critic.mjs' && process.argv[2] === '--review') {
  const { readFileSync } = await import('node:fs');
  const file = process.argv[3];
  if (!file) {
    process.stderr.write('usage: node scripts/voice/critic.mjs --review <file> (items separated by blank lines)\n');
    process.exitCode = 1;
  } else {
    const items = readFileSync(file, 'utf8').split(/\r?\n\s*\r?\n/).map((t) => t.trim()).filter(Boolean)
      .map((text, i) => ({ id: `${i + 1}`, text }));
    process.stdout.write(`${formatReview(await reviewDrafts(items))}\n`);
  }
}
