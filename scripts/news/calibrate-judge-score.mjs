// Pure scoring and acceptance for scripts/news/calibrate-judge.mjs. No model calls.

import { JUDGE_DIMENSIONS, JUDGE_MIN_SCORES } from '../../apps/worker/src/extract/judge-prompt.ts';

export const GOLD_RUNS = 3;
/** Legacy copy must fail at this rate (26 of 31 in the original calibration set). */
export const LEGACY_FAIL_NUM = 26;
export const LEGACY_FAIL_DEN = 31;

export function legacyFailTarget(total) {
  return Math.ceil((total * LEGACY_FAIL_NUM) / LEGACY_FAIL_DEN);
}

export function bodyText(row) {
  return row.paragraphs.map((p) => p.sentences.map((s) => s.text).join(' ')).join('\n\n');
}

/**
 * The judge input for a calibration row. Legacy copy carries no refs, so it
 * skips the deterministic gate and goes without a citations block; this is for
 * calibration only and never used in production.
 */
export function judgeInputFor(row, { legacy = false } = {}) {
  const attributions = [...new Set(row.facts.map((f) => f.attribution.trim()).filter(Boolean))];
  return {
    observedOn: row.observedOn,
    lead: row.lead,
    body: bodyText(row),
    facts: row.facts.map((f) => `[${f.id}] ${f.claim} (${f.attribution}, ${f.confidence})`),
    attributions,
    context: row.contextText,
    ...(legacy ? {} : { citations: row.paragraphs.flatMap((p) => p.sentences) }),
  };
}

/** Dimensions scoring below their minimum. */
export function failedDimensions(scores) {
  return JUDGE_DIMENSIONS.filter((d) => scores[d] < JUDGE_MIN_SCORES[d]);
}

const isOk = (r) => r.status === 'ok';

/**
 * @param {{ gold: Array<Array<object>>, negatives: Array<object>, legacy: Array<object> }} results
 *   gold is one array of verdicts per run; negatives carry expectFailOn.
 */
export function evaluateModel({ gold, negatives, legacy }) {
  const goldPassPerRun = gold.map((run) => run.filter((r) => isOk(r) && r.pass).length);
  const goldOk = gold.length === GOLD_RUNS && gold.every((run, i) => run.length > 0 && goldPassPerRun[i] === run.length);
  const negativeHits = negatives.filter((r) => isOk(r) && failedDimensions(r.scores).includes(r.expectFailOn)).length;
  const negativesOk = negatives.length > 0 && negativeHits === negatives.length;
  const legacyFails = legacy.filter((r) => isOk(r) && !r.pass).length;
  const legacyOk = legacy.length > 0 && legacyFails >= legacyFailTarget(legacy.length);
  return {
    goldPassPerRun,
    goldSize: gold[0]?.length ?? 0,
    goldOk,
    negativeHits,
    negativeTotal: negatives.length,
    negativesOk,
    legacyFails,
    legacyTotal: legacy.length,
    legacyTarget: legacyFailTarget(legacy.length),
    legacyOk,
    accepted: goldOk && negativesOk && legacyOk,
  };
}

export function renderTable(byModel) {
  const mark = (ok) => (ok ? 'ok' : 'FAIL');
  return [
    '| Model | Gold pass per run | Negatives fail on target | Legacy failed | Accepted |',
    '|---|---|---|---|---|',
    ...Object.entries(byModel).map(([model, e]) => `| ${[
      model,
      `${e.goldPassPerRun.map((n) => `${n}/${e.goldSize}`).join(', ')} ${mark(e.goldOk)}`,
      `${e.negativeHits}/${e.negativeTotal} ${mark(e.negativesOk)}`,
      `${e.legacyFails}/${e.legacyTotal} (need ${e.legacyTarget}) ${mark(e.legacyOk)}`,
      e.accepted ? 'YES' : 'NO',
    ].join(' | ')} |`),
  ].join('\n');
}
