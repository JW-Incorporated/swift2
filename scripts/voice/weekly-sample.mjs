import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callClaude } from '../lib/claude-call.mjs';
import { routedPost } from '../lib/discord-route.mjs';
import { scoreItems } from './critic.mjs';
import { DIMENSIONS } from './critic-prompts.mjs';

export const SAMPLE_SIZE = 20;
export const POST_SIZE = 10;
export const CALL_CAP = 4;
export const POST_FLAG = 'VOICE_SAMPLE_POST_ENABLED';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const POSTED_DIR = `${ROOT}social/posted/`;
export const VOICE_JSON = `${ROOT}docs/ops/dashboard/voice.json`;

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n) => (n === null ? null : Math.round(n * 100) / 100);

export function loadShipped(dir = POSTED_DIR) {
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().flatMap((f) => {
    try {
      const body = JSON.parse(readFileSync(`${dir}${f}`, 'utf8')).body;
      return typeof body === 'string' && body.trim() ? [{ id: f.replace(/\.json$/, ''), text: body.trim() }] : [];
    } catch {
      return [];
    }
  });
}

export function pickSample(items, n, seed) {
  const out = [...items];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

const overall = (r) => mean(DIMENSIONS.map((d) => r.scores[d]));

export function buildRow(week, rows) {
  const scored = rows.filter((r) => r.status === 'scored');
  const totals = scored.map(overall);
  return {
    week, sampled: rows.length, scored: scored.length, notScored: rows.length - scored.length,
    mean: round(mean(totals)), p10: round(percentile(totals, 0.1)),
    dimensions: Object.fromEntries(DIMENSIONS.map((d) => [d, round(mean(scored.map((r) => r.scores[d])))])),
    ownerRatings: null, drift: null,
  };
}

export function recordRatings(row, modelScores, ratings) {
  const ids = Object.keys(ratings).filter((id) => modelScores[id] !== undefined
    && Number.isFinite(ratings[id]) && ratings[id] >= 1 && ratings[id] <= 5);
  if (!ids.length) return row;
  const owner = mean(ids.map((id) => ratings[id]));
  const model = mean(ids.map((id) => modelScores[id]));
  return { ...row, ownerRatings: { n: ids.length, mean: round(owner) }, drift: round(model - owner) };
}

export function postEnabled(env = process.env) {
  return String(env[POST_FLAG] ?? '').trim().toLowerCase() === 'true';
}

export async function postSample(picks, { env = process.env, fetchImpl = fetch } = {}) {
  if (!postEnabled(env)) return { posted: false, reason: `${POST_FLAG} is not true` };
  const lines = picks.map((p, i) => `**${i + 1}.** (${p.id})\n${p.text.slice(0, 280)}`);
  const content = `Weekly voice sample: react 1-5 on any you like (optional).\n\n${lines.join('\n\n')}`.slice(0, 1900);
  const res = await routedPost('marjorie', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }),
  }, { env, fetchImpl });
  return { posted: res.ok !== false, status: res.status };
}

export async function runWeekly({
  call = callClaude, env = process.env, fetchImpl = fetch, dir = POSTED_DIR, file = VOICE_JSON,
  now = new Date(), ratings = null,
} = {}) {
  const week = now.toISOString().slice(0, 10);
  const seed = Math.floor(now.getTime() / 604_800_000);
  const sample = pickSample(loadShipped(dir), SAMPLE_SIZE, seed);
  let calls = 0;
  const capped = async (input) => {
    if (calls >= CALL_CAP) return { status: 'capped', reason: 'weekly sample call cap reached' };
    calls += 1;
    return call(input);
  };
  const rows = await scoreItems(sample, { call: capped });
  let row = buildRow(week, rows);
  if (ratings) {
    const model = Object.fromEntries(rows.filter((r) => r.status === 'scored').map((r) => [r.id, overall(r)]));
    row = recordRatings(row, model, ratings);
  }
  const history = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify([...history.filter((h) => h.week !== week), row], null, 2)}\n`);
  const post = await postSample(sample.slice(0, POST_SIZE), { env, fetchImpl });
  return { row, post, calls };
}

if (process.argv[1]?.endsWith('weekly-sample.mjs')) {
  const ratingsFile = process.argv[2] === '--ratings' ? process.argv[3] : null;
  const ratings = ratingsFile ? JSON.parse(readFileSync(ratingsFile, 'utf8')) : null;
  const { row, post } = await runWeekly({ ratings });
  process.stdout.write(`voice-sample: ${JSON.stringify(row)} post=${post.posted ? 'sent' : post.reason}\n`);
  if (row.scored === 0) process.exitCode = 1;
}
