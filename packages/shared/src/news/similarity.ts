// LexicalSimilarityProvider — the free, local, default similarity provider
// for news dedup clustering. Ported from the sibling Orbit project's
// production pipeline (apps/worker/src/similarity/lexical.ts) — code, not
// content. Zero I/O, zero dependencies; safe to keep in shared.
//
// Approach: normalized-title token-set Jaccard. Deterministic and debuggable.
// Good enough to cluster the common case — one event reported by many outlets
// with overlapping headline vocabulary.

import type { SimilarityInput, SimilarityProvider } from './news-types';

/** Common English function words — carry no clustering signal. */
const STOPWORDS = new Set<string>([
  'the', 'a', 'an', 'and', 'or', 'nor', 'but', 'yet', 'so', 'of', 'to', 'in',
  'on', 'at', 'by', 'for', 'from', 'with', 'as', 'into', 'onto', 'off', 'out',
  'up', 'down', 'over', 'under', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'am', 'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she',
  'they', 'them', 'his', 'her', 'their', 'you', 'your', 'we', 'our', 'us',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'has', 'have', 'had', 'do', 'does', 'did', 'not', 'than', 'then', 'there',
  'here', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'too', 'very', 'just', 'also', 'about', 'after',
  'before', 'amid', 'amp',
]);

export class LexicalSimilarityProvider implements SimilarityProvider {
  readonly name = 'lexical';

  computeKey(item: SimilarityInput, subjectTerms: string[] = []): string {
    const drop = new Set(STOPWORDS);
    for (const term of subjectTerms) {
      for (const word of tokenize(term)) drop.add(word);
    }
    const tokens = tokenize(item.title).filter((t) => !drop.has(t));
    // Dedupe + sort so the key is a canonical, comparable signature.
    return [...new Set(tokens)].sort().join(' ');
  }

  similarity(keyA: string, keyB: string): number {
    return jaccard(toTokenSet(keyA), toTokenSet(keyB));
  }
}

/** Strip tags/entities so feed-provided HTML fragments compare as plain text. */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ');
}

/** Exported so `CrossOutletSimilarityProvider` (cross-outlet-similarity.ts) reuses the same stopword-aware tokenizer instead of forking one. */
export function tokenize(text: string): string[] {
  return stripHtml(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

export { STOPWORDS };

function toTokenSet(key: string): Set<string> {
  return new Set(key.split(' ').filter((t) => t.length > 0));
}

/** Jaccard index: |intersection| / |union|. Empty sets score 0. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}
