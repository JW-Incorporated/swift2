/**
 * Clownbot (build B) — deterministic retrieval over the `ClownDoc` index.
 *
 * Pure functions over an injected doc list and an injected `now`: same
 * corpus + same query (+ same `now`, for the recency path) always produces
 * the same results in the same order. No model calls anywhere in this file
 * — retrieval decides what the model is ALLOWED to see, before any spend.
 *
 * Studied `clownbot-receipts.ts` (build A) for the term-overlap scoring shape
 * this repo already trusts, but does not extend it — build A is retiring.
 */

import { normalize, tokenize } from './search';
import type { ClownDoc } from './clown-index';

/**
 * Fixed phrase list for "what's happening right now" style questions. A
 * substring match on the normalized query — deliberately simple and
 * deterministic, not a classifier.
 */
const RECENCY_PHRASES: readonly string[] = [
  'this week',
  'this month',
  'right now',
  'currently',
  'these days',
  'lately',
  'recently',
  'as of now',
  'what is new',
  "what's new",
  'whats new',
  'today',
];

/** True when the query reads as a "what's live right now" question. */
export function detectRecencyIntent(query: string): boolean {
  const q = normalize(query);
  return RECENCY_PHRASES.some((phrase) => q.includes(phrase));
}

/**
 * Function words and question scaffolding dropped before scoring — a lone
 * stopword must never carry a match. Not the exhaustive list build A grew
 * over several red-team rounds (`clownbot-receipts.ts`); a smaller,
 * independent set scoped to this file.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'into', 'on', 'onto', 'at', 'for',
  'with', 'about', 'from', 'by', 'as', 'than', 'then', 'up', 'down',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'do', 'does', 'did', 'done', 'has', 'have',
  'had', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
  'this', 'that', 'these', 'those', 'there', 'here',
  'what', 'whats', 'which', 'who', 'whom', 'whose', 'why', 'how', 'when', 'where',
  'not', 'no', 'nope', 'yes', 'yeah', 'so', 'just', 'really', 'ever', 'even', 'still',
  'also', 'too', 'very', 'much', 'more', 'most', 'some', 'any', 'all',
  'ok', 'okay', 'hi', 'hey', 'hello', 'please', 'thanks',
]);

/** Meaningful query terms: normalised, de-duplicated, stopwords + single characters dropped. */
function meaningfulTerms(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of tokenize(query)) {
    if (term.length < 2 || STOPWORDS.has(term)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    out.push(term);
  }
  return out;
}

/**
 * Minimum meaningful-term overlap a doc must clear to be surfaced. A single
 * weak body-word hit is not enough — below this line the honest answer is an
 * empty result, never a padded one.
 */
export const RELEVANCE_THRESHOLD = 8;

export const DEFAULT_CLOWN_RETRIEVAL_LIMIT = 8;

/** How far back a doc's `recencyDate` counts as "fresh" for a recency query. */
const RECENCY_WINDOW_DAYS = 14;

/**
 * Letters/digits only — the compact form of a token, for comparing a
 * hyphenated query compound against corpus text that renders the same
 * compound with no delimiter at all (a hashtag, camelCase). `tokenize`
 * (search.ts) preserves hyphens as-is on both sides, so "swifties-against-ai"
 * never matches a title word like "#SwiftiesAgainstAI:" through ordinary
 * word/prefix comparison — this is a last-resort fallback, not a
 * replacement for it.
 */
function compactForm(text: string): string {
  return text.replace(/[^a-z0-9]/g, '');
}

/** Title hits outrank body hits; whole-word beats prefix. */
function scoreDoc(doc: ClownDoc, terms: readonly string[]): number {
  if (terms.length === 0) return 0;
  const titleWords = normalize(doc.title).split(' ');
  const bodyWords = normalize(`${doc.title} ${doc.text}`).split(' ');

  let score = 0;
  for (const term of terms) {
    // Only a hyphenated compound gets the compact-form fallback below — every
    // other term's scoring is untouched.
    const compactTerm = term.includes('-') ? compactForm(term) : '';
    if (titleWords.includes(term)) score += 12;
    else if (term.length >= 3 && titleWords.some((w) => w.startsWith(term))) score += 7;
    else if (bodyWords.includes(term)) score += 5;
    else if (term.length >= 4 && bodyWords.some((w) => w.startsWith(term))) score += 2;
    else if (compactTerm.length >= 3 && titleWords.some((w) => compactForm(w) === compactTerm)) score += 12;
    else if (compactTerm.length >= 3 && bodyWords.some((w) => compactForm(w) === compactTerm)) score += 5;
  }
  return score;
}

/**
 * Pure relevance check, deliberately bypassing the recency-intent shortcut
 * below — used by scope resolution (`clown-agent-tools.ts`'s
 * `resolveScopeSignal`, Codex review MAJOR 6) so recency language
 * ("today"/"currently"/"right now"/etc.) can never resolve scope on its
 * own: it must co-occur with an actual term overlap, never substitute for
 * one. `retrieveClownDocs` itself is UNCHANGED — its recency shortcut still
 * legitimately surfaces "what's new" style questions with no other topic
 * word for chip taps and the agent's own `search` tool.
 */
export function hasRelevantTopic(query: string, docs: readonly ClownDoc[]): boolean {
  return relevanceRank(docs, meaningfulTerms(query), 1).length > 0;
}

/** Plain lexical ranking. Empty when no term clears the threshold — never padded. */
function relevanceRank(docs: readonly ClownDoc[], terms: readonly string[], limit: number): ClownDoc[] {
  if (terms.length === 0) return [];
  return docs
    .map((doc) => ({ doc, score: scoreDoc(doc, terms) }))
    .filter((r) => r.score >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id))
    .slice(0, limit)
    .map((r) => r.doc);
}

/** ISO date `days` before `now`. */
function isoDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Recency-intent ranking: open docs (§ clown-index.ts) whose `recencyDate`
 * falls inside the freshness window rank first, newest first; other open
 * docs (mostly undated pending theories) follow, in a stable id order. Docs
 * that are not `open` never appear here at all — "current" material is
 * exactly the open tier, so this can never reach for an unrelated confirmed
 * fact to pad the list (the rumor tier is small; a short list is correct).
 */
function recencyRank(docs: readonly ClownDoc[], now: Date, limit: number): ClownDoc[] {
  const openDocs = docs.filter((d) => d.open);
  const cutoff = isoDaysAgo(now, RECENCY_WINDOW_DAYS);

  const fresh = openDocs
    .filter((d) => d.recencyDate !== null && d.recencyDate >= cutoff)
    .sort((a, b) => b.recencyDate!.localeCompare(a.recencyDate!) || a.id.localeCompare(b.id));
  const rest = openDocs
    .filter((d) => !(d.recencyDate !== null && d.recencyDate >= cutoff))
    .sort((a, b) => a.id.localeCompare(b.id));

  return [...fresh, ...rest].slice(0, limit);
}

export interface RetrieveOptions {
  /** Injected clock for the recency path. Callers should pass this for determinism. */
  now?: Date;
  limit?: number;
}

/**
 * Retrieve the top-K docs for a reader's words. Deterministic and free — the
 * only way corpus material reaches the model.
 *
 *   1. A recency-intent query (`detectRecencyIntent`) ranks the open tier by
 *      freshness. If nothing open exists at all, this falls through to plain
 *      relevance so a specific "what's the word on X this week" question can
 *      still land on a known (non-open) receipt — point 5's honest-empty is
 *      the RELEVANCE_THRESHOLD floor underneath that fallback, not a second
 *      unconditional empty.
 *   2. Otherwise, meaningful-term overlap decides — below the threshold, the
 *      result is an empty array, never a guess.
 */
export function retrieveClownDocs(
  query: string,
  docs: readonly ClownDoc[],
  options: RetrieveOptions = {},
): ClownDoc[] {
  const limit = options.limit ?? DEFAULT_CLOWN_RETRIEVAL_LIMIT;
  const now = options.now ?? new Date();

  if (detectRecencyIntent(query)) {
    const byRecency = recencyRank(docs, now, limit);
    if (byRecency.length > 0) return byRecency;
  }

  return relevanceRank(docs, meaningfulTerms(query), limit);
}
