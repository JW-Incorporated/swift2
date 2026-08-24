// Cross-outlet dedup clustering (proposal §4.1.1, PLAN.md Stage 1). Replaces
// LexicalSimilarityProvider as the provider `runCycle` feeds to `clusterBatch`
// — that provider only caught near-identical titles (same outlet's own
// re-publish, or two outlets that happened to phrase a headline the same
// way), which is exactly the digest's own caveat: "dedupe doesn't cluster
// across outlets." Three outlets covering the same event rarely share
// headline vocabulary, so this provider matches on whichever of three
// independent signals fires first:
//
//   1. Canonical URL match — syndication/wire copy, or a resolved Google
//      News redirect landing on a URL another source already carries.
//   2. >=0.85 cosine on a cheap (local, zero-vendor) bag-of-words embedding
//      of title+snippet, but only within a 48h window — cosine alone drifts
//      over time as unrelated stories reuse the same common words.
//   3. Shared named entities (proper-noun phrases) + same calendar date —
//      catches genuinely different phrasing about the same event when the
//      cosine signal doesn't clear 0.85 (e.g. "designers dreaming up
//      wedding gowns" headlines that share few words but the same subject
//      + date).
//
// `similarity()` returns a binary 1/0 (not a graded score) — once any signal
// fires, the match is exactly as certain as an exact URL match; there is no
// meaningful "how similar" between the three heterogeneous signals. Callers
// should pass a `threshold` of 1 to `clusterBatch`'s options.

import type { SimilarityInput, SimilarityProvider } from './news-types';
import { STOPWORDS, tokenize } from './similarity';

const COSINE_THRESHOLD = 0.85;
const COSINE_WINDOW_MS = 48 * 3_600_000;
const ENTITY_DATE_WINDOW_MS = 24 * 3_600_000;

interface Signature {
  /** Canonical URL (scheme/www/query/fragment/trailing-slash stripped), or '' when the item has none. */
  url: string;
  /** Calendar date (UTC, YYYY-MM-DD) the item was published, or undefined when unknown. */
  dateISO?: string;
  /** Epoch ms the item was published, or undefined when unknown — drives the 48h/24h windows. */
  publishedAtMs?: number;
  /** Term-frequency vector over title+snippet tokens (post stopword removal) — the "cheap embedding." */
  vector: Record<string, number>;
  /** Proper-noun phrases pulled from the title, subject terms excluded. */
  entities: string[];
}

export class CrossOutletSimilarityProvider implements SimilarityProvider {
  readonly name = 'cross-outlet';

  computeKey(item: SimilarityInput, subjectTerms: string[] = []): string {
    const sig: Signature = {
      url: canonicalizeUrl(item.url),
      dateISO: toDateISO(item.publishedAt),
      publishedAtMs: toMs(item.publishedAt),
      vector: termVector(`${item.title} ${item.snippet ?? ''}`, subjectTerms),
      entities: extractEntities(item.title, subjectTerms),
    };
    return JSON.stringify(sig);
  }

  similarity(keyA: string, keyB: string): number {
    if (!keyA || !keyB) return 0;
    let a: Signature, b: Signature;
    try {
      a = JSON.parse(keyA);
      b = JSON.parse(keyB);
    } catch {
      return 0;
    }

    // 1. Canonical URL match.
    if (a.url && b.url && a.url === b.url) return 1;

    // 2. Cheap-embedding cosine within a 48h window.
    if (
      a.publishedAtMs !== undefined &&
      b.publishedAtMs !== undefined &&
      Math.abs(a.publishedAtMs - b.publishedAtMs) <= COSINE_WINDOW_MS
    ) {
      if (cosine(a.vector, b.vector) >= COSINE_THRESHOLD) return 1;
    }

    // 3. Shared named entities + same date.
    if (
      a.dateISO &&
      b.dateISO &&
      a.dateISO === b.dateISO &&
      a.publishedAtMs !== undefined &&
      b.publishedAtMs !== undefined &&
      Math.abs(a.publishedAtMs - b.publishedAtMs) <= ENTITY_DATE_WINDOW_MS &&
      a.entities.some((e) => b.entities.includes(e))
    ) {
      return 1;
    }

    return 0;
  }
}

/** Strips scheme/`www.`/query/fragment/trailing slash so syndicated copies of the same link compare equal. */
function canonicalizeUrl(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    return `${host}${path}`.toLowerCase();
  } catch {
    return '';
  }
}

function toMs(iso?: string): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
}

function toDateISO(iso?: string): string | undefined {
  const ms = toMs(iso);
  return ms === undefined ? undefined : new Date(ms).toISOString().slice(0, 10);
}

/**
 * Term-frequency vector — the "cheap embedding": no model, no vendor, just
 * word counts. `subjectTerms` (e.g. "Taylor Swift") are dropped same as the
 * lexical provider: every item in this pipeline mentions the subject, so
 * those tokens would inflate cosine between totally unrelated stories
 * instead of carrying any real signal.
 */
function termVector(text: string, subjectTerms: string[]): Record<string, number> {
  const drop = new Set<string>();
  for (const term of subjectTerms) for (const word of tokenize(term)) drop.add(word);
  const vec: Record<string, number> = {};
  for (const token of tokenize(text)) {
    if (STOPWORDS.has(token) || drop.has(token)) continue;
    vec[token] = (vec[token] ?? 0) + 1;
  }
  return vec;
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const key in a) {
    dot += (a[key] ?? 0) * (b[key] ?? 0);
    magA += (a[key] ?? 0) ** 2;
  }
  for (const key in b) magB += (b[key] ?? 0) ** 2;
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Naive proper-noun phrase extractor: runs of capitalized words. A lone
 * single-word run at the very start of the title is dropped (likely just
 * sentence-initial capitalization, not a proper noun) — a multi-word run at
 * the start is kept, since sentence-initial capitalization alone can't
 * produce a whole run of consecutive capitalized words. `subjectTerms`
 * (e.g. "Taylor Swift") are excluded when a run matches one exactly; a
 * title-case run that merges the subject into a longer phrase (e.g. "Taylor
 * Swift Announces New Album") is not split apart — cheap, not perfect, so
 * it degrades to under-matching (safe) rather than over-matching on those.
 */
function extractEntities(title: string, subjectTerms: string[]): string[] {
  const drop = new Set(subjectTerms.map((t) => t.toLowerCase()));
  const matches = title.match(/\b[A-Z][a-zA-Z'&-]*(?:\s+[A-Z][a-zA-Z'&-]*)*/g) ?? [];
  const entities = new Set<string>();
  matches.forEach((phrase, i) => {
    const normalized = phrase.trim();
    if (normalized.length < 2) return;
    if (drop.has(normalized.toLowerCase())) return;
    // Drop a single-word match at the very start of the title — likely just
    // sentence-initial capitalization, not a proper noun, unless it's a
    // multi-word phrase (which sentence-initial capitalization alone can't produce).
    if (i === 0 && !normalized.includes(' ')) return;
    entities.add(normalized.toLowerCase());
  });
  return [...entities];
}
