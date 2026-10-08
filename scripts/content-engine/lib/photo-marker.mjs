// Photo-enrichment progress marker — comma-SAFE format + queue logic.
//
// Why this file exists: the photo-enrichment worker (GitHub issue #762) used to
// track progress in a `<!-- photo-done: k1,k2,... -->` HTML comment whose keys
// were joined by COMMAS. But most moment keys *contain* commas
// (`midnights|2024|2|A record fourth Album of the Year Grammy, for Midnights`),
// so any split-on-comma reader shredded them: the tail became its own bogus
// "key", real pages looked un-done and re-queued forever (churn), and the
// marker silently corrupted — the same class of bug as the 2026-07-20
// duplicate-`focalPoint`-key incident. See docs/decisions.md (2026-07-20).
//
// The fix, codified here so no run re-implements fragile parsing by hand
// (CLAUDE.md rule 8):
//   1. The marker is a JSON array of keys — commas, quotes and unicode are all
//      safe inside JSON. `serializeMarker` / `parseMarkerBody`.
//   2. The persisted marker only records the SUBJECTIVE decisions: sparse pages
//      (<2 photos) a run reviewed and deliberately left at their editorial
//      maximum. Whether any *other* page is done is recomputed live from the
//      corpus every run (`isPhotoDone`), so already-enriched pages can never
//      churn back into the queue no matter what the marker says.

/** Minimum verified photos before a page needs no enrichment (protocol 3a). */
export const MIN_PHOTOS = 2;

/** Matches every photo-done marker (legacy comma body OR new JSON body). */
export const MARKER_RE = /<!--\s*photo-done:\s*([\s\S]*?)\s*-->/g;

/** Raw seed photos for a moment (excludes the loader's synthetic thumbnail). */
export function realPhotos(item) {
  return item?.raw?.moment?.photos ?? [];
}

function hasFocalPoint(photo) {
  return typeof photo?.focalPoint === 'string' && photo.focalPoint.trim().length > 0;
}

/**
 * A moment needs no further photo work when it carries >= MIN_PHOTOS verified
 * photos AND every one of them has an individual focalPoint. Computed live from
 * the corpus so it never goes stale.
 */
export function isPhotoDone(item) {
  if (item?.type !== 'moment') return false;
  const photos = realPhotos(item);
  return photos.length >= MIN_PHOTOS && photos.every(hasFocalPoint);
}

/**
 * Parse one marker body into keys.
 *  - New format: a JSON array → returned verbatim.
 *  - Legacy comma format: unrecoverable by splitting (keys contain commas), so
 *    we recover by matching whole `corpusKeys` that appear as substrings. This
 *    only finds keys that were written intact at least once; shredded fragments
 *    match nothing and are correctly dropped.
 */
export function parseMarkerBody(body, corpusKeys = []) {
  const text = (body ?? '').trim();
  if (text.startsWith('[')) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) return arr.filter((k) => typeof k === 'string' && k.length);
    } catch {
      /* fall through to substring recovery */
    }
  }
  // Legacy recovery: match whole keys as substrings, but LONGEST-first while
  // blanking each match out of the haystack. Otherwise a key that is a
  // substring of a longer recorded key (e.g. `1989-bad-blood` ⊂
  // `1989-bad-blood-video-vevo-record`) would be falsely recovered from the
  // longer one's text and silently suppress an unreviewed page. Keys never
  // contain newlines, so `\n` is a safe sentinel.
  const sorted = [...corpusKeys].filter(Boolean).sort((a, b) => b.length - a.length);
  let hay = text;
  const found = [];
  for (const k of sorted) {
    if (hay.includes(k)) {
      found.push(k);
      hay = hay.split(k).join('\n');
    }
  }
  return found;
}

/** Union of the keys recorded across a blob of issue-comment text (all markers). */
export function recoverKeysFromComments(commentsText, corpusKeys = []) {
  const found = new Set();
  for (const match of String(commentsText ?? '').matchAll(MARKER_RE)) {
    for (const key of parseMarkerBody(match[1], corpusKeys)) found.add(key);
  }
  return [...found];
}

/** Serialize keys into the comma-safe marker. Sorted + deduped for stable diffs. */
export function serializeMarker(keys) {
  const uniq = [...new Set((keys ?? []).filter((k) => typeof k === 'string' && k.length))].sort();
  return `<!-- photo-done: ${JSON.stringify(uniq)} -->`;
}

/**
 * The set worth PERSISTING: reviewed sparse pages that are not otherwise done.
 * Objectively-done pages are dropped (recomputed live), which is what shrinks
 * the marker from thousands of chars to just the editorial-max decisions.
 */
export function reviewedSparseKeys(items, recoveredKeys) {
  // Keyed on MOMENTS only. `key` is only unique within a content type — a
  // theory or track can legitimately share a slug with a moment (e.g. both
  // titled "eldest-daughter-track-five") — so indexing every item type in one
  // Map let a same-keyed theory shadow the moment and silently drop a real,
  // reviewed <2-photo decision from the marker every run (found 2026-08-18,
  // #762). Filtering to moments before building the Map keeps the lookup
  // type-safe the way `buildQueue` below already is.
  const byKey = new Map(items.filter((it) => it.type === 'moment').map((it) => [it.key, it]));
  const keep = [];
  for (const key of new Set(recoveredKeys)) {
    const it = byKey.get(key);
    // Keep a recovered key when it maps to a moment that is NOT objectively
    // done (a deliberate <2-photo / 0-photo editorial-max decision). Keys that
    // no longer resolve to a moment are dropped (stale/renamed).
    if (it && !isPhotoDone(it)) keep.push(key);
  }
  return keep;
}

/**
 * Build the work queue: moments that are neither objectively done nor recorded
 * as reviewed, ranked by a caller-supplied visibility score (highest first).
 */
export function buildQueue(items, reviewedKeys, scoreFn, n = 10) {
  const reviewed = new Set(reviewedKeys);
  return items
    .filter((it) => it.type === 'moment' && !isPhotoDone(it) && !reviewed.has(it.key))
    .map((it) => ({ key: it.key, era: it.era, title: it.title, photos: realPhotos(it).length, v: scoreFn ? scoreFn(it) : 0 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n);
}
