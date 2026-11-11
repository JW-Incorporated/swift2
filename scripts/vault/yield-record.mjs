#!/usr/bin/env node
// Vault Run yield records (P1-18). Each lane appends ONE fenced JSON block to
// the `vault/<date>` PR body: how many items it added, edited, skipped and
// failed, plus a status and the reasons. Re-running a lane replaces its own
// block (idempotent per lane); other lanes' blocks and the rest of the body
// are never touched.
//
//   node scripts/vault/yield-record.mjs append --pr <n> --lane <lane> --status <status> \
//     [--added N] [--edited N] [--skipped N] [--failed N] [--reason "text"]...
//   node scripts/vault/yield-record.mjs --parse <pr>     # per-lane counts
//
// Pure helpers (appendYieldRecord, parseYieldRecords, formatCounts) are
// exported for scripts/vault/yield-record.test.ts.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMain } from '../lib/cli.mjs';

export const LANES = ['content-shift', 'answerer', 'photo-enrichment', 'rumor-desk', 'cross-link', 'stylist'];
export const STATUSES = ['done', 'partial', 'no_op', 'not_due', 'failed'];
export const FENCE_INFO = 'json vault-yield';
const COUNT_KEYS = ['added', 'edited', 'skipped', 'failed'];
const BLOCK_RE = /```json vault-yield[ \t]*\r?\n([\s\S]*?)\r?\n```/g;

/** Validate and normalise one record; throws on anything the PM could not parse later. */
export function normalizeRecord(input) {
  const r = input ?? {};
  if (!LANES.includes(r.lane)) throw new Error(`lane must be one of ${LANES.join(', ')} (got ${JSON.stringify(r.lane)})`);
  if (!STATUSES.includes(r.status)) throw new Error(`status must be one of ${STATUSES.join(', ')} (got ${JSON.stringify(r.status)})`);
  const out = { lane: r.lane, status: r.status };
  for (const k of COUNT_KEYS) {
    const v = r[k] ?? 0;
    if (!Number.isInteger(v) || v < 0) throw new Error(`${k} must be a non-negative integer (got ${JSON.stringify(v)})`);
    out[k] = v;
  }
  const reasons = Array.isArray(r.reasons) ? r.reasons : r.reasons == null ? [] : [r.reasons];
  out.reasons = reasons.map((x) => String(x).trim()).filter(Boolean);
  if (out.failed > 0 && out.reasons.length === 0) throw new Error('a record with failed > 0 needs at least one reason');
  return out;
}

function renderBlock(record) {
  return '```' + FENCE_INFO + '\n' + JSON.stringify(record, null, 2) + '\n```';
}

/**
 * Parse every yield block in a PR body. Never throws: a block that is not
 * valid JSON or fails validation is reported in `malformed` and skipped.
 * If a lane appears twice the LAST valid block wins.
 *
 * @returns {{records: Array<object>, malformed: Array<{index:number, error:string}>}}
 */
export function parseYieldRecords(body) {
  const byLane = new Map();
  const malformed = [];
  let index = 0;
  for (const m of String(body ?? '').matchAll(BLOCK_RE)) {
    try {
      const rec = normalizeRecord(JSON.parse(m[1]));
      byLane.set(rec.lane, rec);
    } catch (e) {
      malformed.push({ index, error: e.message });
    }
    index += 1;
  }
  return { records: [...byLane.values()], malformed };
}

/**
 * Add or replace this lane's block in a PR body. Idempotent per lane: the
 * same record twice yields the same body; a new record for the lane replaces
 * the old block in place. Malformed blocks are left untouched.
 */
export function appendYieldRecord(body, input) {
  const record = normalizeRecord(input);
  const text = String(body ?? '');
  const block = renderBlock(record);
  let replaced = false;
  const next = text.replace(BLOCK_RE, (whole, json) => {
    let lane;
    try {
      lane = JSON.parse(json)?.lane;
    } catch {
      return whole;
    }
    if (lane !== record.lane) return whole;
    if (replaced) return '';
    replaced = true;
    return block;
  });
  if (replaced) return next.replace(/\n{3,}/g, '\n\n');
  const sep = text === '' ? '' : text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  return text + sep + block + '\n';
}

/** One line per due lane plus a line for each lane with no record. */
export function formatCounts({ records, malformed }) {
  const lines = [];
  for (const lane of LANES) {
    const r = records.find((x) => x.lane === lane);
    if (!r) {
      lines.push(`${lane}: NO RECORD`);
      continue;
    }
    lines.push(`${lane}: ${r.status} added=${r.added} edited=${r.edited} skipped=${r.skipped} failed=${r.failed}`);
  }
  for (const m of malformed) lines.push(`malformed block #${m.index}: ${m.error}`);
  return lines.join('\n');
}

function gh(args, opts = {}) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

function readBody(pr) {
  return JSON.parse(gh(['pr', 'view', String(pr), '--json', 'body'])).body ?? '';
}

function writeBody(pr, body) {
  const dir = mkdtempSync(join(tmpdir(), 'vault-yield-'));
  const file = join(dir, 'body.md');
  try {
    writeFileSync(file, body);
    gh(['pr', 'edit', String(pr), '--body-file', file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function parseArgs(argv) {
  const out = { _: [], reason: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) throw new Error(`--${key} needs a value`);
    i += 1;
    if (key === 'reason') out.reason.push(val);
    else out[key] = val;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.parse !== undefined) {
    const parsed = parseYieldRecords(readBody(args.parse));
    console.log(formatCounts(parsed));
    return parsed.malformed.length > 0 ? 1 : 0;
  }
  if (args._[0] === 'append') {
    if (!args.pr) throw new Error('append needs --pr <number>');
    const record = {
      lane: args.lane,
      status: args.status,
      reasons: args.reason,
      ...Object.fromEntries(COUNT_KEYS.filter((k) => args[k] !== undefined).map((k) => [k, Number(args[k])])),
    };
    writeBody(args.pr, appendYieldRecord(readBody(args.pr), record));
    console.log(`yield record for ${args.lane} written to PR #${args.pr}`);
    return 0;
  }
  console.error('usage: yield-record.mjs append --pr N --lane L --status S [--added N ...] | --parse <pr>');
  return 2;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/vault/yield-record.mjs')) {
  runMain(main, { name: 'yield-record' });
}
