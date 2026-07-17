// The Finding — the single normalized shape every checker (deterministic or
// agent) emits, and the unit the engine dedupes, prioritizes, and turns into a
// GitHub issue. The engine NEVER mutates content; a Finding is a proposal.
import { createHash } from 'node:crypto';

/** Severity ladder. P0 = credibility/safety/legal; P3 = polish. */
export const SEVERITY = ['P0', 'P1', 'P2', 'P3'];

/**
 * @typedef {Object} Finding
 * @property {string} checker    dotted id, e.g. 'fact.source-grounding', 'safety.sexualization', 'image.quality'
 * @property {string} severity   'P0' | 'P1' | 'P2' | 'P3'
 * @property {string} title      one-line summary (becomes the issue title)
 * @property {Object} itemRef    { type, file, era, key, field } — where it lives
 * @property {string} excerpt    the exact span/URL at issue
 * @property {string} evidence   what the source/search/vision/rule actually showed
 * @property {string} suggestedFix  the concrete correction to make (a human/apply-agent acts on it)
 * @property {number} confidence 0..1 — method+model confidence; <0.5 => "review", not "fix"
 * @property {boolean} [escalate] safety P0s only — surfaces at top of report + issue pinned
 * @property {string[]} [sources] URLs the checker consulted (for the reviewer)
 */

/** Build a Finding with defaults + validation. Throws on a malformed finding. */
export function makeFinding(f) {
  if (!f || typeof f !== 'object') throw new Error('finding must be an object');
  if (!f.checker) throw new Error('finding.checker required');
  if (!SEVERITY.includes(f.severity)) throw new Error(`bad severity: ${f.severity}`);
  if (!f.title) throw new Error('finding.title required');
  const ref = f.itemRef ?? {};
  return {
    checker: f.checker,
    severity: f.severity,
    // 'deterministic' = a mechanical rule/size/probe result (bulk; rolls up);
    // 'agent' = a specific human/vision/source-checked judgment (files as its own
    // ticket). Agent findings (loaded from JSON) omit this, so default to 'agent'.
    source: f.source === 'deterministic' ? 'deterministic' : 'agent',
    title: String(f.title).slice(0, 200),
    itemRef: {
      type: ref.type ?? 'unknown',
      file: ref.file ?? null,
      era: ref.era ?? null,
      key: ref.key ?? null,
      field: ref.field ?? null,
    },
    excerpt: (f.excerpt ?? '').slice(0, 800),
    evidence: (f.evidence ?? '').slice(0, 2000),
    suggestedFix: (f.suggestedFix ?? '').slice(0, 1000),
    confidence: typeof f.confidence === 'number' ? Math.max(0, Math.min(1, f.confidence)) : 0.8,
    escalate: Boolean(f.escalate),
    sources: Array.isArray(f.sources) ? f.sources.filter((s) => typeof s === 'string') : [],
  };
}

/**
 * Stable fingerprint for dedup + idempotent issue creation. Same checker + same
 * item + same excerpt => same fingerprint => the issue writer won't open a
 * duplicate on a re-run. Deliberately excludes evidence/fix (those may reword).
 */
export function fingerprint(f) {
  const basis = [f.checker, f.itemRef?.type, f.itemRef?.key ?? f.itemRef?.file, f.itemRef?.field, f.excerpt]
    .map((x) => String(x ?? ''))
    .join('||');
  return createHash('sha1').update(basis).digest('hex').slice(0, 16);
}

/** Order findings most-severe first, escalations always on top. */
export function rank(findings) {
  return [...findings].sort((a, b) => {
    if (a.escalate !== b.escalate) return a.escalate ? -1 : 1;
    const s = SEVERITY.indexOf(a.severity) - SEVERITY.indexOf(b.severity);
    if (s !== 0) return s;
    return b.confidence - a.confidence;
  });
}

/** Collapse exact-duplicate fingerprints (keeps the highest-confidence copy). */
export function dedupe(findings) {
  const byFp = new Map();
  for (const f of findings) {
    const fp = fingerprint(f);
    const prev = byFp.get(fp);
    if (!prev || f.confidence > prev.confidence) byFp.set(fp, f);
  }
  return [...byFp.values()];
}
