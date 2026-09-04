import { CONTENT } from './content';
import { ERAS } from './eras';
import { EGG_NODES, motifOf, THREADS } from './lenses';
import { tracksForEra, trackKey } from './tracks';
import { theoriesForEra } from './theories';
import { allVideoRecordsForEra } from './videos';
import type { EraId, LensId, MotifId } from './types';

/**
 * Long Live — client-side search (audit T7 / §E.11).
 *
 * A static in-memory index over content that is ALREADY shipped to the client
 * (moments, eras, threads, tracks, theories, videos, Clue Web eggs).
 * No backend, no per-user request, no fetch — the index is built lazily once
 * per session from the same modules the UI renders from, so it can never
 * drift from what is on screen (and respects the repo's cost-discipline
 * rule: search costs zero server work).
 *
 * The query/ranking half is pure over an injected doc list so it is unit-
 * testable without touching the real datasets.
 */

// ── Model ───────────────────────────────────────────────────────────────────

/**
 * Where selecting a result takes you — mapped 1:1 onto existing store
 * actions by the SearchOverlay (openItem / openEra / openSong /
 * openTheoryGuide / openClueWebTrail / openThread / openVideo). Search
 * introduces no new navigation surface of its own.
 */
export type SearchTarget =
  | { kind: 'moment'; itemId: string }
  | { kind: 'era'; eraId: EraId }
  | { kind: 'track'; eraId: EraId; trackKey: string }
  | { kind: 'theory-guide'; eraId: EraId }
  | { kind: 'trail'; motifId: MotifId }
  | { kind: 'thread'; lensId: LensId }
  | { kind: 'video'; eraId: EraId; videoId: string };

export type SearchDocType = 'moment' | 'era' | 'track' | 'theory' | 'video' | 'egg' | 'thread';

export interface SearchDoc {
  /** Unique across the whole index (`<type>:<id>`). */
  key: string;
  type: SearchDocType;
  title: string;
  /** One-line context rendered under the title in the results list. */
  snippet: string;
  /** Era the doc belongs to, for the era chip in results. Null = cross-era. */
  eraId: EraId | null;
  target: SearchTarget;
  /** Precomputed normalized title (ranking reads these, never re-normalizes). */
  titleNorm: string;
  /** Precomputed normalized full-text haystack (title included). */
  bodyNorm: string;
  /**
   * Editorial importance, folded into ranking as a tie-breaker.
   *
   * Without this, relevance was purely lexical and the results were wrong in
   * a way users notice immediately: searching "wedding" put the actual MSG
   * wedding page 20th of 26 matches (so, past the 5-per-type cap, invisible),
   * because its title is "Taylor and Travis marry at Madison Square Garden"
   * and does not contain the word. A chat-show anecdote titled "Wedding
   * plans, teased from a British chat-show couch" outranked it purely on
   * having the term in its title.
   *
   * 0 for everything that carries no explicit signal — the default, so this
   * only ever promotes, never demotes.
   */
  weight: number;
}

export interface SearchResult {
  doc: SearchDoc;
  score: number;
}

export interface SearchGroup {
  type: SearchDocType;
  label: string;
  results: SearchResult[];
  /** Matches BEFORE any per-type cap, so the UI can say what it is hiding. */
  totalMatches: number;
}

// ── Normalization ───────────────────────────────────────────────────────────

/**
 * Fold text for matching: lowercase, straighten smart quotes/dashes, strip
 * diacritics, collapse whitespace. Content titles use “curly” quotes and
 * ’apostrophes’ throughout — a query typed with straight quotes must match.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Query terms: normalized, whitespace-split, empties dropped. */
export function tokenize(query: string): string[] {
  return normalize(query).split(' ').filter(Boolean);
}

// ── Ranking (pure) ──────────────────────────────────────────────────────────

// Score weights, roughly: whole-title match ≫ title word prefix > substring
// in title > word in body. Every query term must match somewhere (AND), so
// weights only order results — they never admit non-matches.
const SCORE_TITLE_EXACT = 100;
const SCORE_TITLE_PREFIX = 40;
const SCORE_TITLE_WORD_PREFIX = 25;
const SCORE_TITLE_SUBSTRING = 12;
const SCORE_BODY_WORD_PREFIX = 6;
const SCORE_BODY_SUBSTRING = 3;

/**
 * Editorial-importance bonus, added ONCE per doc rather than per term.
 *
 * Sized against the real failing case rather than picked round: the canonical
 * wedding page matches "wedding" only in its body (6), while the tangential
 * "Wedding plans, teased from a British chat-show couch" gets a title-PREFIX
 * hit (40). So the bonus has to clear 34 for importance to win at all —
 * 45 puts the defining page at 51 and comfortably ahead.
 *
 * It still loses to an exact title match (100), which is the property that
 * keeps this honest: searching a page by its actual name always finds that
 * page first, and importance only reorders pages that are otherwise
 * competing on weak lexical signal.
 */
export const WEIGHT_DEFINING = 45;
export const WEIGHT_NOTABLE = 18;

/** Does `text` contain `term` starting at a word boundary? */
function hasWordPrefix(text: string, term: string): boolean {
  let i = text.indexOf(term);
  while (i !== -1) {
    if (i === 0 || !/[a-z0-9]/.test(text[i - 1])) return true;
    i = text.indexOf(term, i + 1);
  }
  return false;
}

/** Score one doc against pre-tokenized terms. 0 = not a match. */
export function scoreDoc(doc: SearchDoc, terms: string[]): number {
  if (terms.length === 0) return 0;
  let score = 0;
  for (const term of terms) {
    let termScore = 0;
    if (doc.titleNorm === term) termScore = SCORE_TITLE_EXACT;
    else if (doc.titleNorm.startsWith(term)) termScore = SCORE_TITLE_PREFIX;
    else if (hasWordPrefix(doc.titleNorm, term)) termScore = SCORE_TITLE_WORD_PREFIX;
    else if (doc.titleNorm.includes(term)) termScore = SCORE_TITLE_SUBSTRING;
    else if (hasWordPrefix(doc.bodyNorm, term)) termScore = SCORE_BODY_WORD_PREFIX;
    else if (doc.bodyNorm.includes(term)) termScore = SCORE_BODY_SUBSTRING;
    if (termScore === 0) return 0; // AND semantics: every term must hit.
    score += termScore;
  }
  // Multi-word queries: a doc whose title contains the whole phrase beats
  // docs that merely contain every word somewhere.
  if (terms.length > 1 && doc.titleNorm.includes(terms.join(' '))) {
    score += SCORE_TITLE_PREFIX;
  }
  // Once per doc, not per term: a two-word query must not double the bonus
  // and let importance swamp lexical relevance.
  return score + doc.weight;
}

// ── Posting list (candidate lookup) ─────────────────────────────────────────

/**
 * `bodyNorm` is a space-joined string (titleNorm followed by normalized
 * extra text — see `makeDoc`), and query terms (from `tokenize`) never
 * contain a space. So a term can only ever match *inside* one space-
 * delimited word of `bodyNorm`, never across two — "does some word contain
 * `term` as a substring" is an exact stand-in for `bodyNorm.includes(term)`
 * (and `titleNorm.includes(term)`, since titleNorm is that string's first
 * word(s)).
 *
 * To answer "does some word contain `term`" without scanning every word for
 * every query (which is no better than scanning every doc — this corpus has
 * far more distinct words than docs), each word is expanded into all of its
 * suffixes and every suffix is stored as its own entry, sorted lexically.
 * `term` is a substring of a word starting at position i exactly when the
 * suffix starting at i begins with `term` — so "words containing term"
 * becomes "sorted suffixes with this prefix", found by one binary search
 * plus a scan of just the matches, instead of a scan of the whole
 * vocabulary.
 */
interface SuffixEntry {
  suffix: string;
  doc: SearchDoc;
}

const suffixIndexCache = new WeakMap<readonly SearchDoc[], SuffixEntry[]>();

function buildSuffixIndex(docs: readonly SearchDoc[]): SuffixEntry[] {
  const entries: SuffixEntry[] = [];
  for (const doc of docs) {
    // Dedupe per doc: a repeated word (or overlapping occurrence, e.g. "aa"
    // in "aaa") must only ever contribute one candidate entry per doc per
    // suffix, or a later intersection step could double-count it.
    const suffixes = new Set<string>();
    for (const word of doc.bodyNorm.split(' ')) {
      if (!word) continue;
      for (let i = 0; i < word.length; i++) suffixes.add(word.slice(i));
    }
    for (const suffix of suffixes) entries.push({ suffix, doc });
  }
  entries.sort((a, b) => (a.suffix < b.suffix ? -1 : a.suffix > b.suffix ? 1 : 0));
  return entries;
}

// Keyed by the doc array's identity: `getSearchIndex()` returns the same
// cached array on every call, so its suffix index is built once and reused;
// a fresh array (as in tests, or a future non-singleton caller) just builds
// its own the first time it's searched.
function getSuffixIndex(docs: readonly SearchDoc[]): SuffixEntry[] {
  let entries = suffixIndexCache.get(docs);
  if (!entries) {
    entries = buildSuffixIndex(docs);
    suffixIndexCache.set(docs, entries);
  }
  return entries;
}

/** First index in the (sorted) entries whose suffix is >= `term`. */
function lowerBound(entries: readonly SuffixEntry[], term: string): number {
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (entries[mid].suffix < term) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * A term whose candidate scan would touch more entries than there are docs
 * is not selective enough to be worth indexing — a full scan is already
 * cheaper, and returning `null` (meaning "no useful narrowing, treat every
 * doc as a candidate for this term") lets the caller fall back cleanly
 * instead of paying for a long scan anyway.
 */
type TermCandidates = Set<SearchDoc> | null;

// Below this length a term is too short to be selective: real corpora have
// enough words containing any 1-2 character substring that scanning for
// candidates costs about as much as just checking every doc directly, and
// skipping the scan entirely (rather than running it and giving up midway)
// avoids paying for that scan on top of the eventual full-scan fallback.
const MIN_TERM_LENGTH_TO_INDEX = 3;

/**
 * Every doc with at least one indexed word containing `term`, or `null` if
 * the term is too short/common to narrow usefully (see `TermCandidates`).
 */
function candidatesForTerm(entries: readonly SuffixEntry[], term: string): TermCandidates {
  if (term.length < MIN_TERM_LENGTH_TO_INDEX) return null;
  const candidates = new Set<SearchDoc>();
  for (let i = lowerBound(entries, term); i < entries.length; i++) {
    if (!entries[i].suffix.startsWith(term)) break; // sorted: no more possible matches
    candidates.add(entries[i].doc);
  }
  return candidates;
}

/**
 * Docs that could possibly score against every term (AND semantics), found
 * via the suffix index instead of a full scan. `scoreDoc` still does the
 * real, authoritative scoring — this only narrows which docs it has to run
 * on, so ranking/output is unchanged. Falls back to the full doc list (same
 * cost as the pre-refactor scan, never worse) when no term narrows usefully.
 */
function candidateDocs(docs: readonly SearchDoc[], terms: readonly string[]): Iterable<SearchDoc> {
  const entries = getSuffixIndex(docs);
  let candidates: Set<SearchDoc> | undefined;
  for (const term of terms) {
    const termCandidates = candidatesForTerm(entries, term);
    if (termCandidates === null) continue; // this term doesn't narrow; rely on the others
    if (candidates === undefined) {
      candidates = new Set(termCandidates);
    } else {
      for (const existing of candidates) {
        if (!termCandidates.has(existing)) candidates.delete(existing);
      }
    }
    if (candidates.size === 0) return [];
  }
  return candidates ?? docs; // no term narrowed usefully: fall back to a full scan
}

export const MAX_RESULTS_PER_TYPE = 5;

/** Presentation order + labels for result groups. */
const GROUP_META: { type: SearchDocType; label: string }[] = [
  { type: 'era', label: 'Eras' },
  { type: 'thread', label: 'Threads' },
  { type: 'moment', label: 'Moments' },
  { type: 'egg', label: 'Clue Web' },
  { type: 'theory', label: 'Theories & eggs' },
  { type: 'track', label: 'Songs' },
  { type: 'video', label: 'Videos' },
];

/**
 * Rank `docs` against `query`, grouped by type in a stable presentation
 * order. Empty/blank queries and no-hit queries both return [] — the UI
 * renders its own empty states.
 *
 * `limitPerType` defaults to MAX_RESULTS_PER_TYPE, which is right for the
 * type-ahead dropdown: it is a shortlist, not an answer. Pass `Infinity` for
 * the full results view, where truncating is the bug rather than the feature —
 * "wedding" matches 26 moments and a reader who pressed Enter asked to see
 * them, not the best five (Wyatt, 2026-07-20).
 */
export function searchDocs(
  docs: readonly SearchDoc[],
  query: string,
  limitPerType: number = MAX_RESULTS_PER_TYPE,
): SearchGroup[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const byType = new Map<SearchDocType, SearchResult[]>();
  for (const doc of candidateDocs(docs, terms)) {
    const score = scoreDoc(doc, terms);
    if (score <= 0) continue;
    const bucket = byType.get(doc.type);
    if (bucket) bucket.push({ doc, score });
    else byType.set(doc.type, [{ doc, score }]);
  }

  const groups: SearchGroup[] = [];
  for (const { type, label } of GROUP_META) {
    const results = byType.get(type);
    if (!results || results.length === 0) continue;
    results.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
    groups.push({
      type,
      label,
      results: Number.isFinite(limitPerType) ? results.slice(0, limitPerType) : results.slice(),
      // The pre-cap total, so the dropdown can honestly say how much it is
      // hiding ("Moments 5 of 26") instead of implying five is all there is.
      totalMatches: results.length,
    });
  }
  return groups;
}

/** Flatten grouped results in display order (keyboard navigation walks this). */
export function flattenGroups(groups: readonly SearchGroup[]): SearchResult[] {
  return groups.flatMap((g) => g.results);
}

// ── Index construction ──────────────────────────────────────────────────────

function makeDoc(
  type: SearchDocType,
  id: string,
  title: string,
  snippet: string,
  eraId: EraId | null,
  target: SearchTarget,
  extraText: readonly string[],
  weight = 0,
): SearchDoc {
  const titleNorm = normalize(title);
  return {
    key: `${type}:${id}`,
    type,
    title,
    snippet,
    eraId,
    target,
    titleNorm,
    bodyNorm: [titleNorm, ...extraText.map(normalize)].join(' '),
    weight,
  };
}

/**
 * Assemble the full index from the already-loaded static datasets. Pure and
 * deterministic (all inputs are module constants); exported for tests, but
 * app code should read the lazy `getSearchIndex()` singleton.
 */
export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const era of ERAS) {
    docs.push(
      makeDoc('era', era.id, era.name, era.tagline, era.id, { kind: 'era', eraId: era.id }, [
        era.album,
        era.shortName,
        era.yearLabel,
        era.tagline,
        era.intro,
      ]),
    );
  }

  for (const item of CONTENT) {
    docs.push(
      makeDoc(
        'moment',
        item.id,
        item.title,
        item.summary,
        item.eraId,
        { kind: 'moment', itemId: item.id },
        [item.summary, ...item.body, item.tags.join(' '), item.dateLabel],
        item.significance === 'defining'
          ? WEIGHT_DEFINING
          : item.significance === 'notable'
            ? WEIGHT_NOTABLE
            : 0,
      ),
    );
  }

  for (const node of EGG_NODES) {
    const motifId = motifOf(node.id);
    // Every egg lives on a motif trail (dev-guarded in lenses.ts); if one
    // ever doesn't, fall back to its era rather than a dead link.
    const target: SearchTarget = motifId
      ? { kind: 'trail', motifId }
      : { kind: 'era', eraId: node.eraId };
    docs.push(
      makeDoc('egg', node.id, node.label, node.detail, node.eraId, target, [
        node.detail,
        String(node.year),
      ]),
    );
  }

  for (const thread of THREADS) {
    docs.push(
      makeDoc('thread', thread.id, thread.title, thread.kicker, null, { kind: 'thread', lensId: thread.id }, [
        thread.kicker,
        thread.what,
      ]),
    );
  }

  for (const era of ERAS) {
    for (const track of tracksForEra(era.id)) {
      docs.push(
        makeDoc(
          'track',
          `${era.id}:${track.trackNumber ?? 'x'}:${track.title}`,
          track.title,
          `${era.album} · ${track.note}`,
          era.id,
          { kind: 'track', eraId: era.id, trackKey: trackKey(era.id, track) },
          [track.note, era.album],
        ),
      );
    }
    for (const theory of theoriesForEra(era.id)) {
      docs.push(
        makeDoc(
          'theory',
          `${era.id}:${theory.slug}`,
          theory.title,
          theory.claim,
          era.id,
          { kind: 'theory-guide', eraId: era.id },
          [theory.claim, theory.evidence ?? ''],
        ),
      );
    }
    // Deliberately the FULL record set, including the ones the rail hides for
    // having no playable embed (playable-first, docs/decisions.md 2026-08-13).
    // That rule is about not rendering a video CARD the reader can't play; a
    // search hit is not a card, and its failure mode is the opposite one —
    // filtering here would make the app look like it has never heard of
    // Miss Americana or The Eras Tour film, which reads as a content gap
    // rather than a curation choice. The target still carries `videoId`
    // (#652): SearchOverlay's openVideo scrolls straight to that video's own
    // card when one is mounted, and falls back to landing on the era (still
    // somewhere real) when it isn't — an unplayable record has no card at
    // all, and a playable one already embedded inline in a moment doesn't
    // get a second standalone card (era-feed.ts's de-dupe).
    for (const video of allVideoRecordsForEra(era.id)) {
      docs.push(
        makeDoc(
          'video',
          `${era.id}:${video.slug}`,
          video.title,
          video.summary ?? `${era.album} era video`,
          era.id,
          { kind: 'video', eraId: era.id, videoId: video.slug },
          [video.summary ?? '', video.relatedSongs.join(' '), video.easterEggs.join(' ')],
        ),
      );
    }
  }

  return docs;
}

let cachedIndex: SearchDoc[] | null = null;

/** The app's index — built once, on first search, from already-loaded data. */
export function getSearchIndex(): SearchDoc[] {
  cachedIndex ??= buildSearchIndex();
  return cachedIndex;
}
