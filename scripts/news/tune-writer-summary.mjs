// Pure summarising for scripts/news/tune-writer.mjs: pass count, hold-reason
// and gate-reason histograms, judge score histogram per dimension, and the
// markdown table shown in PR bodies.

const DIMENSIONS = ['voice', 'context', 'grounding', 'non_repetition'];

function bump(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

/** @param {Array<{ status: string, reason?: string, gateReasons?: string[], judgeScores?: Record<string, number> }>} results */
export function summarizeRuns(results) {
  const holds = {};
  const gateReasons = {};
  const scores = Object.fromEntries(DIMENSIONS.map((d) => [d, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }]));
  let passed = 0;
  for (const r of results) {
    if (r.status === 'ok') passed += 1;
    else bump(holds, r.reason ?? 'unknown');
    for (const code of r.gateReasons ?? []) bump(gateReasons, code.split(':')[0].trim());
    if (r.judgeScores) for (const d of DIMENSIONS) bump(scores[d], r.judgeScores[d]);
  }
  const total = results.length;
  return { total, passed, passRate: total > 0 ? passed / total : 0, holds, gateReasons, scores };
}

export function renderSummary(summary) {
  const lines = [
    `Pass: ${summary.passed}/${summary.total} (${(summary.passRate * 100).toFixed(1)}%)`,
    '',
    '| Hold reason | Count |',
    '|---|---|',
    ...Object.entries(summary.holds).sort(([, a], [, b]) => b - a).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '| Judge score | 1 | 2 | 3 | 4 | 5 |',
    '|---|---|---|---|---|---|',
    ...DIMENSIONS.map((d) => `| ${d} | ${[1, 2, 3, 4, 5].map((n) => summary.scores[d][n]).join(' | ')} |`),
  ];
  return lines.join('\n');
}

/** Parses writer-eval-kit.jsonl text into rows; `n` takes an evenly spaced sample. */
export function sampleRows(text, n) {
  const rows = text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  if (!n || n >= rows.length) return rows;
  return Array.from({ length: n }, (_, i) => rows[Math.floor((i * rows.length) / n)]);
}

/** Rebuilds the context pack the writer saw from the kit's `[cN] ...` text. */
export function contextFromText(text) {
  const items = (text ?? '').split(/\n(?=\[c\d+\] )/).filter(Boolean).map((line) => {
    const m = /^\[(c\d+)\] ([\s\S]*)$/.exec(line);
    return m ? { id: m[1], kind: 'prior', text: m[2] } : null;
  }).filter(Boolean);
  return { items, text: text ?? '' };
}
