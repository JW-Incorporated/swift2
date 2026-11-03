// Writing-quality checks for current-item copy (docs/decisions.md 2026-11-03
// "News post quality engine"). Portable, zero I/O, pure predicates over the
// three prose fields. NOT yet called from `evaluateCurrentItemQuality` or the
// worker: enforcement is wired later, only for rows written by the new
// two-pass engine, so the existing live rows are not hidden.
//
// Every tunable number lives in `WRITING_THRESHOLDS`. The AI-tell list
// mirrors `AI_TELLS` in scripts/content-engine/checkers/voice.mjs and the
// "Cut on sight" list in docs/content-ops/editorial-voice-and-pipeline.md.
// MIRROR, NOT IMPORT (same boundary rule as current-item-quality.ts: shared
// cannot depend on a scripts/ .mjs).

export const WRITING_THRESHOLDS = {
  bodyMaxHedges: 2,
  leadMaxHedges: 0,
  leadBodyOverlapMax: 0.25,
  headlineLeadOverlapMax: 0.7,
  bodySelfRepeatMax: 0.5,
  shingleSize: 4,
  minSentenceWordsForRepeat: 4,
  outletMaxMentionsInBody: 1,
  bodyMinWords: 120,
  leadMinChars: 200,
  leadMaxChars: 400,
  minDistinctEntities: 2,
} as const;

export interface WritingSource {
  name?: string;
  outletName?: string;
  url?: string;
}

export interface WritingInput {
  headline: string;
  lead: string;
  body: string;
  sources: readonly WritingSource[];
  /** Body sentence indexes (0-based) that cite a fact or context item. */
  citations?: readonly number[];
  bodySentenceCount?: number;
}

export type WritingResult = { ok: true } | { ok: false; reasons: string[] };

const HEDGE_WORDS = /\b(?:reportedly|according to|allegedly|sources say|it is said|rumou?red)\b/gi;
const HEDGE_PER = /\b[Pp]er [A-Z]\w+/g;

/** Mirror of voice.mjs `AI_TELLS` plus the doc's "exclamation-stacked hype". */
export const AI_TELL_PATTERNS: readonly { phrase: string; re: RegExp }[] = [
  { phrase: 'in this article', re: /\bin this article\b/i },
  { phrase: 'it is worth noting that', re: /\bit is worth noting that\b/i },
  {
    phrase: 'taylor swift, the american singer-songwriter',
    re: /\bTaylor Swift,\s*the\s+(?:American\s+)?(?:singer(?:-songwriter)?|musician|artist|pop star)\b/i,
  },
  { phrase: 'it seems', re: /\bit seems\b/i },
  { phrase: 'reportedly appears to', re: /\breportedly appears to\b/i },
  { phrase: 'we will explore', re: /\bwe will explore\b/i },
  { phrase: 'exclamation-stacked hype', re: /!\s*!|(?:[^!]*!){3,}/ },
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'that',
  'this', 'their', 'her', 'his', 'she', 'he', 'they', 'is', 'are', 'was', 'were', 'be', 'by',
  'as', 'from', 'it', 'its', 'has', 'have', 'had', 'up', 'out', 'about', 'who', 'which',
]);

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const DATE_RE = new RegExp(`\\b(?:${MONTHS})\\s+\\d{1,2}\\b|\\b(?:19|20)\\d{2}\\b`);

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])["')\]]?\s+(?=["'([]?[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function shingles(text: string, size: number = WRITING_THRESHOLDS.shingleSize): Set<string> {
  const tokens = words(text);
  const out = new Set<string>();
  for (let i = 0; i + size <= tokens.length; i++) out.add(tokens.slice(i, i + size).join(' '));
  return out;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  return shared / (a.size + b.size - shared);
}

/** Share of a's shingles that also occur in b. Jaccard is diluted when the lead is far shorter than the body, so the lead/body check uses this. */
export function containment(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  return shared / a.size;
}

export function countHedges(text: string): number {
  return (text.match(HEDGE_WORDS) ?? []).length + (text.match(HEDGE_PER) ?? []).length;
}

export function headlineLeadOverlap(headline: string, lead: string): number {
  const tokens = words(headline).filter((token) => !STOPWORDS.has(token));
  if (tokens.length === 0) return 0;
  const first = new Set(words(splitSentences(lead)[0] ?? ''));
  return tokens.filter((token) => first.has(token)).length / tokens.length;
}

export function hasBodySelfRepeat(body: string): boolean {
  const sets = splitSentences(body)
    .filter((sentence) => words(sentence).length >= WRITING_THRESHOLDS.minSentenceWordsForRepeat)
    .map((sentence) => shingles(sentence));
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      if (jaccard(sets[i]!, sets[j]!) >= WRITING_THRESHOLDS.bodySelfRepeatMax) return true;
    }
  }
  return false;
}

export function findAiTells(text: string): string[] {
  return AI_TELL_PATTERNS.filter(({ re }) => re.test(text)).map(({ phrase }) => phrase);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Per outlet (name or host, case-sensitive for names), mentions in the body. */
export function outletMentionCounts(
  body: string,
  sources: readonly WritingSource[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const source of sources) {
    const name = (source.name ?? source.outletName ?? '').trim();
    let host: string;
    try {
      host = source.url ? new URL(source.url).hostname.replace(/^www\./, '') : '';
    } catch {
      host = '';
    }
    const alternatives = [name, host]
      .filter((term) => term.length >= 3)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    if (alternatives.length === 0) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}])`, 'gu');
    counts.set(name || host, (body.match(re) ?? []).length);
  }
  return counts;
}

export function countDistinctEntities(body: string): number {
  const entities = new Set<string>();
  for (const sentence of splitSentences(body)) {
    const tokens = sentence.split(/\s+/).slice(1);
    for (const token of tokens) {
      const clean = token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
      if (/^[A-Z][\p{L}]{2,}/u.test(clean)) entities.add(clean.replace(/'s$/, ''));
    }
  }
  return entities.size;
}

export function hasDate(body: string): boolean {
  return DATE_RE.test(body);
}

export function evaluateCurrentItemWriting(input: WritingInput): WritingResult {
  const reasons: string[] = [];
  const t = WRITING_THRESHOLDS;
  const { headline, lead, body } = input;

  if (countHedges(body) > t.bodyMaxHedges || countHedges(lead) > t.leadMaxHedges) {
    reasons.push('hedge_overuse');
  }

  if (containment(shingles(lead), shingles(body)) >= t.leadBodyOverlapMax) {
    reasons.push('lead_body_overlap');
  }
  if (headlineLeadOverlap(headline, lead) >= t.headlineLeadOverlapMax) {
    reasons.push('headline_lead_overlap');
  }
  if (hasBodySelfRepeat(body)) reasons.push('body_self_repeat');

  for (const phrase of new Set([...findAiTells(lead), ...findAiTells(body)])) {
    reasons.push(`ai_tell:${phrase}`);
  }

  for (const count of outletMentionCounts(body, input.sources).values()) {
    if (count > t.outletMaxMentionsInBody) {
      reasons.push('attribution_repeat');
      break;
    }
  }

  if (words(body).length < t.bodyMinWords) reasons.push('body_too_short');
  if (lead.length < t.leadMinChars || lead.length > t.leadMaxChars) reasons.push('lead_length');
  if (countDistinctEntities(body) < t.minDistinctEntities && !hasDate(body)) {
    reasons.push('thin_substance');
  }

  if (input.citations) {
    const count = input.bodySentenceCount ?? splitSentences(body).length;
    const cited = new Set(input.citations);
    for (let i = 0; i < count; i++) {
      if (!cited.has(i)) {
        reasons.push('uncited_sentence');
        break;
      }
    }
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
