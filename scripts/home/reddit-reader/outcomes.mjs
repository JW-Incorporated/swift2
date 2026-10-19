#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { runMain } from '../../lib/cli.mjs';
import { strictServiceClient } from '../../lib/supabase.mjs';
import { DEFAULT_OUTPUT, writeCommunityReport } from '../../community/outcomes-report.mjs';
import { beginCircuitRun, CircuitTripError, closeCircuit } from './breaker.mjs';
import { createRequestPacer } from './pacing.mjs';
import { createRedditTransport } from './transport.mjs';

export const BRAND_ACCOUNT = 'NegativeRest9507';
export const DEFAULT_CIRCUIT_STATE = '.artifacts/home-reddit-circuit.json';
export const COMMENTS_URL = `https://www.reddit.com/user/${BRAND_ACCOUNT}/comments.json?limit=100&raw_json=1`;
const HOUR_MS = 60 * 60_000;
const WEEK_MS = 7 * 24 * HOUR_MS;

function normalizedThreadId(value) {
  return typeof value === 'string' ? value.replace(/^t3_/, '') : null;
}

function canonicalCommentUrl(permalink) {
  if (typeof permalink !== 'string' || !permalink.startsWith('/r/')) return null;
  return new URL(permalink, 'https://www.reddit.com').href;
}

export function parseAccountComments(payload) {
  const children = payload?.data?.children;
  if (!Array.isArray(children)) throw new Error('Reddit account comments listing is malformed');
  return children.flatMap((child) => {
    const row = child?.kind === 't1' ? child.data : null;
    const threadId = normalizedThreadId(row?.link_id);
    const commentUrl = canonicalCommentUrl(row?.permalink);
    const createdAt = Number.isFinite(row?.created_utc)
      ? new Date(row.created_utc * 1_000).toISOString()
      : null;
    if (!row?.id || !threadId || !commentUrl || !createdAt) return [];
    return [{
      id: row.id,
      threadId,
      commentUrl,
      createdAt,
      score: Number.isInteger(row.score) ? row.score : null,
    }];
  });
}

export function matchCommentsToLedgers(comments, ledgers) {
  const unused = new Set(comments.map((comment) => comment.id));
  return ledgers.flatMap((ledger) => {
    const postedAt = new Date(ledger.posted_at).getTime();
    const candidates = comments
      .filter((comment) => unused.has(comment.id) && comment.threadId === normalizedThreadId(ledger.thread_id))
      .sort((a, b) => {
        const aExact = ledger.comment_url === a.commentUrl ? 0 : 1;
        const bExact = ledger.comment_url === b.commentUrl ? 0 : 1;
        return aExact - bExact || Math.abs(new Date(a.createdAt).getTime() - postedAt)
          - Math.abs(new Date(b.createdAt).getTime() - postedAt);
      });
    if (!candidates.length) return [];
    unused.delete(candidates[0].id);
    return [{ ledger, comment: candidates[0] }];
  });
}

export function dueHorizon(createdAt, existingHorizons, now = new Date()) {
  const age = now.getTime() - new Date(createdAt).getTime();
  if (!Number.isFinite(age) || age < HOUR_MS) return null;
  const horizon = age < 24 * HOUR_MS ? '1h' : age < 7 * 24 * HOUR_MS ? '24h' : '7d';
  return existingHorizons.has(horizon) ? null : horizon;
}

export async function refreshWeeklyReport({
  outputPath = process.env.COMMUNITY_OUTCOMES_REPORT || DEFAULT_OUTPUT,
  now = new Date(),
  readFileImpl = readFile,
  writeReport = writeCommunityReport,
} = {}) {
  let generatedAt = null;
  try {
    const current = JSON.parse(await readFileImpl(path.resolve(outputPath), 'utf8'));
    generatedAt = new Date(current.generatedAt).getTime();
  } catch (error) {
    if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  if (Number.isFinite(generatedAt) && now.getTime() - generatedAt < WEEK_MS) return false;
  await writeReport({ outputPath, now });
  return true;
}

function findComment(children, commentId) {
  for (const child of children ?? []) {
    if (child?.kind !== 't1') continue;
    if (child.data?.id === commentId) return child.data;
    const nested = child.data?.replies?.data?.children;
    const found = Array.isArray(nested) ? findComment(nested, commentId) : null;
    if (found) return found;
  }
  return null;
}

export function parseCommentDetail(payload, commentId) {
  const children = payload?.[1]?.data?.children;
  if (!Array.isArray(children)) throw new Error('Reddit comment detail is malformed');
  const comment = findComment(children, commentId);
  if (!comment) throw new Error(`Reddit comment ${commentId} was not found in its thread`);
  const replies = comment.replies?.data?.children;
  return {
    score: Number.isInteger(comment.score) ? comment.score : null,
    replies: Array.isArray(replies) ? replies.filter((child) => child?.kind === 't1').length : 0,
  };
}

function detailUrl(commentUrl) {
  const url = new URL(commentUrl);
  url.pathname = `${url.pathname.replace(/\/$/, '')}.json`;
  url.search = 'raw_json=1';
  return url.href;
}

async function loadLedgers(supabase, now) {
  const since = new Date(now.getTime() - 9 * 24 * HOUR_MS).toISOString();
  const result = await supabase.from('community_post_ledger')
    .select('id,thread_id,comment_url,posted_at')
    .eq('platform', 'reddit').gte('posted_at', since).order('posted_at');
  if (result.error) throw new Error(`Reddit outcome ledger lookup failed: ${result.error.message}`);
  return result.data ?? [];
}

async function loadExistingHorizons(supabase, ledgerIds) {
  if (!ledgerIds.length) return [];
  const result = await supabase.from('community_outcome')
    .select('post_ledger_id,horizon').in('post_ledger_id', ledgerIds);
  if (result.error) throw new Error(`Reddit outcome lookup failed: ${result.error.message}`);
  return result.data ?? [];
}

async function persistCommentUrls(supabase, matches) {
  let updated = 0;
  for (const { ledger, comment } of matches) {
    if (ledger.comment_url) continue;
    const result = await supabase.from('community_post_ledger')
      .update({ comment_url: comment.commentUrl }).eq('id', ledger.id);
    if (result.error) throw new Error(`Reddit comment URL update failed: ${result.error.message}`);
    updated += 1;
  }
  return updated;
}

function statusLogger({ url, status }) {
  console.log(`home-reddit-outcomes: GET ${new URL(url).pathname} HTTP ${status}`);
}

export async function runOutcomes({
  supabase = strictServiceClient(),
  circuitStatePath = process.env.HOME_REDDIT_CIRCUIT_STATE || DEFAULT_CIRCUIT_STATE,
  fetchImpl = fetch,
  pacer = createRequestPacer({ onWait: (ms) => console.log(`home-reddit-outcomes: pacing ${ms}ms before next request`) }),
  now = new Date(),
  onStatus = statusLogger,
  warn = console.warn,
} = {}) {
  if (!supabase) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const circuitFile = path.resolve(circuitStatePath);
  const gate = await beginCircuitRun(circuitFile);
  if (gate.skipped) return { status: 'backoff', remainingSkips: gate.state.remainingSkips };
  try {
    const transport = createRedditTransport({ circuitFile, pacer, fetchImpl, now: () => now, onStatus });
    const comments = parseAccountComments(await transport.json(COMMENTS_URL));
    const ledgers = await loadLedgers(supabase, now);
    const matches = matchCommentsToLedgers(comments, ledgers);
    const urlsUpdated = await persistCommentUrls(supabase, matches);
    const existing = await loadExistingHorizons(supabase, matches.map(({ ledger }) => ledger.id));
    const byLedger = new Map();
    for (const row of existing) {
      if (!byLedger.has(row.post_ledger_id)) byLedger.set(row.post_ledger_id, new Set());
      byLedger.get(row.post_ledger_id).add(row.horizon);
    }
    const rows = [];
    for (const { ledger, comment } of matches) {
      const horizon = dueHorizon(comment.createdAt, byLedger.get(ledger.id) ?? new Set(), now);
      if (!horizon) continue;
      try {
        const detail = parseCommentDetail(await transport.json(detailUrl(comment.commentUrl)), comment.id);
        const score = detail.score ?? comment.score;
        if (!Number.isInteger(score)) {
          warn(`home-reddit-outcomes: score unavailable for comment ${comment.id}; retrying next run`);
          continue;
        }
        rows.push({
          post_ledger_id: ledger.id, platform: 'reddit', comment_url: comment.commentUrl,
          comment_id: comment.id, score, replies: detail.replies,
          horizon, checked_at: now.toISOString(),
        });
      } catch (error) {
        if (error instanceof CircuitTripError) throw error;
        warn(`home-reddit-outcomes: skipping comment ${comment.id} (${error.message})`);
      }
    }
    if (rows.length) {
      const result = await supabase.from('community_outcome')
        .upsert(rows, { onConflict: 'post_ledger_id,horizon' });
      if (result.error) throw new Error(`Reddit outcome write failed: ${result.error.message}`);
    }
    await closeCircuit(circuitFile);
    return { status: 'ok', comments: comments.length, matched: matches.length, urlsUpdated, snapshots: rows.length };
  } catch (error) {
    if (error instanceof CircuitTripError) {
      return { status: 'tripped', reason: error.reason, httpStatus: error.status };
    }
    throw error;
  }
}

async function main() {
  const result = await runOutcomes();
  const reportUpdated = result.status === 'ok' ? await refreshWeeklyReport() : false;
  console.log(`home-reddit-outcomes: ${JSON.stringify(result)}`);
  console.log(`community-outcomes-report: ${reportUpdated ? 'updated' : 'not due'}`);
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'outcomes.mjs') {
  runMain(main, { name: 'home-reddit-outcomes' });
}
