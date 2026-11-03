import { STOPWORDS, tokenize } from '@swift2/shared/news';
import type { ExtractedFact } from './types';

export const MAX_CANDIDATES_TO_LLM = 5;
export const MAX_SHORTLIST_UNION = 10;
export const MIN_SHARED_ENTITIES = 2;
export const FACT_JACCARD_THRESHOLD = 0.8;

const UNIVERSAL_ENTITIES: ReadonlySet<string> = new Set(['taylor swift', 'taylor', 'swift']);

export interface ShortlistRow {
  headline: string;
  summary: string;
  entities?: readonly string[] | null;
  facts?: readonly Pick<ExtractedFact, 'claim'>[] | null;
}

export interface ShortlistSubject {
  headline: string;
  summary: string;
  entities?: readonly string[] | null;
  facts?: readonly Pick<ExtractedFact, 'claim'>[] | null;
}

function fold(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

export function normalizeEntity(value: string): string {
  return fold(value).replace(/['\u2019]s\b/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Lowercase, punctuation stripped, digits and dates kept. */
export function normalizeClaim(value: string): string {
  return fold(value).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function claimJaccard(a: string, b: string): number {
  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  return shared / (aTokens.size + bTokens.size - shared);
}

function digitTokens(normalized: string): string {
  return normalized.split(' ').filter((token) => /\d/.test(token)).sort().join(' ');
}

export function sameClaim(a: string, b: string): boolean {
  const left = normalizeClaim(a);
  const right = normalizeClaim(b);
  if (!left || !right) return false;
  if (digitTokens(left) !== digitTokens(right)) return false;
  return left === right || claimJaccard(left, right) >= FACT_JACCARD_THRESHOLD;
}

export function sharedEntityCount(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined,
): number {
  if (!a?.length || !b?.length) return 0;
  const left = new Set(a.map(normalizeEntity).filter((e) => e && !UNIVERSAL_ENTITIES.has(e)));
  const right = new Set(b.map(normalizeEntity).filter((e) => e && !UNIVERSAL_ENTITIES.has(e)));
  let shared = 0;
  for (const entity of left) {
    if (right.has(entity)) shared += 1;
  }
  return shared;
}

export function sharesFact(
  a: readonly Pick<ExtractedFact, 'claim'>[] | null | undefined,
  b: readonly Pick<ExtractedFact, 'claim'>[] | null | undefined,
): boolean {
  if (!a?.length || !b?.length) return false;
  return a.some((left) => b.some((right) => sameClaim(left.claim, right.claim)));
}

export function overlapScore(a: string, b: string): number {
  const aTokens = new Set(tokenize(a).filter((token) => !STOPWORDS.has(token)));
  const bTokens = new Set(tokenize(b).filter((token) => !STOPWORDS.has(token)));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  return shared / (aTokens.size + bTokens.size - shared);
}

export function sharedTokenCount(a: string, b: string): number {
  const aTokens = new Set(tokenize(a).filter((token) => !STOPWORDS.has(token)));
  const bTokens = new Set(tokenize(b).filter((token) => !STOPWORDS.has(token)));
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  return shared;
}

export function lexicalTop<T extends { headline: string; summary: string }>(
  subject: { headline: string; summary: string },
  rows: readonly T[],
  limit: number,
  minScore = Number.NEGATIVE_INFINITY,
): T[] {
  const text = `${subject.headline} ${subject.summary}`;
  return rows
    .map((row) => ({ row, score: overlapScore(text, `${row.headline} ${row.summary}`) }))
    .filter(({ score }) => score > minScore)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(({ row }) => row);
}

/** Union of lexical top-N, rows sharing >= 2 entities, and rows sharing a
 * normalized fact claim, capped at `cap`. Lexical hits rank first. */
export function buildShortlist<T extends ShortlistRow>(
  subject: ShortlistSubject,
  rows: readonly T[],
  lexicalLimit: number = MAX_CANDIDATES_TO_LLM,
  cap: number = MAX_SHORTLIST_UNION,
): T[] {
  const picked = new Set<T>(lexicalTop(subject, rows, lexicalLimit));
  const byEntities = rows
    .map((row) => ({ row, shared: sharedEntityCount(subject.entities, row.entities) }))
    .filter(({ shared }) => shared >= MIN_SHARED_ENTITIES)
    .sort((x, y) => y.shared - x.shared)
    .map(({ row }) => row);
  const byFacts = rows.filter((row) => sharesFact(subject.facts, row.facts));
  for (const row of [...byEntities, ...byFacts]) picked.add(row);
  return [...picked].slice(0, cap);
}
