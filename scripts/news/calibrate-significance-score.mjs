// Pure scoring and acceptance for scripts/news/calibrate-significance.mjs. No model calls.

import { significanceRuleHold } from '../../apps/worker/src/extract/significance-rules.ts';
import { isEstablishedName } from '../../packages/shared/src/source-tiers.ts';

export const SIGNIFICANCE_RUNS = 3;
export const NOISE_HELD_MIN = 0.9;
export const IMPORTANT_KEPT_MIN = 0.95;

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Fills what a labeled row may lack (the held-out set has only headline, outlet,
 * url, category and label): status reported, heat 1, no facts, and one source
 * whose tier comes from the existing outlet-name lookup, else unverified.
 */
export function normalizeRow(row) {
  return {
    ...row,
    status: row.status ?? 'reported',
    heat: row.heat ?? 1,
    facts: row.facts ?? [],
    sources: row.sources ?? [{
      name: row.outlet ?? '',
      url: row.url ?? '',
      tier: isEstablishedName(row.outlet) ? 'established' : 'unverified',
    }],
  };
}

/** The layer-1 input for a fixture row. */
export function ruleInputFor(row) {
  return {
    headline: row.headline,
    category: row.category,
    status: row.status,
    facts: row.facts.map((f) => ({ claim: f.claim })),
    sources: row.sources.map((s) => ({ url: s.url, tier: s.tier })),
  };
}

/** The layer-2 (judge) input for a fixture row. */
export function judgeInputFor(row) {
  return {
    headline: row.headline,
    category: row.category,
    status: row.status,
    heat: row.heat,
    facts: row.facts.map((f) => `${f.claim} (${f.attribution})`),
    sources: [...new Set(row.sources.map((s) => s.name || hostOf(s.url)))],
  };
}

/** Layer 1 over every row: the first rule each row trips, or null. */
export function layerOneResults(rows) {
  return rows.map((row) => significanceRuleHold(ruleInputFor(row)) ?? null);
}

/**
 * One pipeline run: a row is held when layer 1 trips or the judge says tier 3;
 * a deferred judge fails closed (held) and is counted separately.
 */
export function runOutcomes(rows, rules, verdicts) {
  return rows.map((row, i) => {
    if (rules[i]) return { label: row.label, held: true, by: `rule:${rules[i]}` };
    const verdict = verdicts[i];
    if (!verdict || verdict.status !== 'ok') return { label: row.label, held: true, deferred: true, by: 'deferred' };
    return { label: row.label, held: verdict.tier === 3, by: `tier${verdict.tier}` };
  });
}

function rate(outcomes, label, held) {
  const group = outcomes.filter((o) => o.label === label);
  return { n: group.filter((o) => o.held === held).length, total: group.length };
}

export function evaluateRuns(runs) {
  const perRun = runs.map((outcomes) => ({
    noiseHeld: rate(outcomes, 'NOISE', true),
    importantKept: rate(outcomes, 'IMPORTANT', false),
    deferred: outcomes.filter((o) => o.deferred).length,
  }));
  const noiseOk = perRun.every((r) => r.noiseHeld.total > 0 && r.noiseHeld.n / r.noiseHeld.total >= NOISE_HELD_MIN);
  const importantOk = perRun.every((r) => r.importantKept.total > 0 && r.importantKept.n / r.importantKept.total >= IMPORTANT_KEPT_MIN);
  const deferredNone = perRun.every((r) => r.deferred === 0);
  return { perRun, noiseOk, importantOk, deferredNone, accepted: noiseOk && importantOk && deferredNone };
}

const NOTE = 'A deferred judge call counts as held (fail closed), so a deferred NOISE row counts as held. Any deferral still fails the run (deferredNone), because it hides what the judge would have said.';

export function evaluateSets(sets) {
  const evaluations = Object.fromEntries(Object.entries(sets).map(([name, runs]) => [name, evaluateRuns(runs)]));
  return { ...evaluations, accepted: Object.values(evaluations).every((e) => e.accepted) };
}

export function renderTable(byModel) {
  const mark = (ok) => (ok ? 'ok' : 'FAIL');
  const fmt = (r) => `${r.n}/${r.total}`;
  const lines = [
    '| Model | Set | NOISE held per run | IMPORTANT kept per run | Deferred per run | Accepted |',
    '|---|---|---|---|---|---|',
  ];
  for (const [model, result] of Object.entries(byModel)) {
    for (const [set, e] of Object.entries(result)) {
      if (set === 'accepted') continue;
      lines.push(`| ${[
        model,
        set,
        `${e.perRun.map((r) => fmt(r.noiseHeld)).join(', ')} ${mark(e.noiseOk)}`,
        `${e.perRun.map((r) => fmt(r.importantKept)).join(', ')} ${mark(e.importantOk)}`,
        `${e.perRun.map((r) => r.deferred).join(', ')} ${mark(e.deferredNone)}`,
        e.accepted ? 'YES' : 'NO',
      ].join(' | ')} |`);
    }
    lines.push(`| ${model} | both sets | | | | ${result.accepted ? 'YES' : 'NO'} |`);
  }
  return [...lines, '', NOTE].join('\n');
}
