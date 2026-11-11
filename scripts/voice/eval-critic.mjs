import { appendFileSync } from 'node:fs';
import { callClaude } from '../lib/claude-call.mjs';
import { scoreItems } from './critic.mjs';
import { loadCorpus } from './corpus.mjs';

export const CALL_CAP = 15;
export const MIN_GAP = 1.0;

function shuffle(list, seed) {
  const out = [...list];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const overall = (r) => mean(Object.values(r.scores));

export function summarize(rows, labels) {
  const pickSet = (...names) => rows.filter((r) => names.includes(labels.get(r.id)) && r.status === 'scored');
  const ex = pickSet('exemplar');
  const cx = pickSet('blatant', 'subtle');
  const sub = pickSet('subtle');
  const subMean = mean(sub.map(overall));
  const exMean = mean(ex.map(overall));
  const cxMean = mean(cx.map(overall));
  return {
    exemplarN: ex.length, counterN: cx.length, exemplarMean: exMean, counterMean: cxMean,
    gap: exMean - cxMean,
    subtleN: sub.length, subtleMean: subMean, subtleGap: exMean - subMean,
    notScored: rows.filter((r) => r.status !== 'scored').length,
  };
}

export async function runEval({ call = callClaude, seed = 24 } = {}) {
  const { exemplars, counterExamples } = loadCorpus();
  const labels = new Map();
  const mixed = shuffle([
    ...exemplars.map((e) => ({ label: 'exemplar', text: e.text })),
    ...counterExamples.map((e) => ({ label: e.kind === 'subtle' ? 'subtle' : 'blatant', text: e.text })),
  ], seed).map((item, i) => {
    const id = `i${String(i + 1).padStart(2, '0')}`;
    labels.set(id, item.label);
    return { id, text: item.text };
  });
  let calls = 0;
  const counted = async (input) => {
    if (calls >= CALL_CAP) return { status: 'capped', reason: 'eval call cap reached' };
    calls += 1;
    return call(input);
  };
  const rows = await scoreItems(mixed, { call: counted });
  return { calls, ...summarize(rows, labels) };
}

if (process.argv[1]?.endsWith('eval-critic.mjs')) {
  const r = await runEval();
  const f = (n) => (Number.isFinite(n) ? n.toFixed(2) : 'n/a');
  const pass = r.gap >= MIN_GAP && r.notScored === 0;
  const line = `voice-critic eval: exemplars n=${r.exemplarN} mean=${f(r.exemplarMean)}; `
    + `counter-examples n=${r.counterN} mean=${f(r.counterMean)}; gap=${f(r.gap)}; `
    + `subtle-only n=${r.subtleN} mean=${f(r.subtleMean)} gap=${f(r.subtleGap)}; `
    + `not_scored=${r.notScored}; wrapper_calls=${r.calls}/${CALL_CAP}; `
    + `${pass ? 'PASS' : 'FAIL'} (need overall gap>=${MIN_GAP})`;
  process.stdout.write(`${line}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Voice critic eval\n\n${line}\n\n`
      + '| Set | n | Mean | Gap vs exemplars |\n|---|---|---|---|\n'
      + `| Exemplars | ${r.exemplarN} | ${f(r.exemplarMean)} | |\n`
      + `| Counter-examples (all) | ${r.counterN} | ${f(r.counterMean)} | ${f(r.gap)} |\n`
      + `| Counter-examples (subtle) | ${r.subtleN} | ${f(r.subtleMean)} | ${f(r.subtleGap)} |\n`);
  }
  process.exitCode = pass ? 0 : 1;
}
