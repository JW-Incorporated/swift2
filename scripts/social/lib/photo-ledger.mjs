// The photo ledger behind lesson L001 ("a photograph that has shipped is
// ineligible"), computed deterministically BEFORE Tree's model starts (Bots v2
// W8, docs/decisions.md 2026-09-30).
//
// Why this exists: `select-photo.mjs` ranks by `social/posted/` alone, so a
// draft waiting in an open PR is invisible to it — and its tie-break is a
// stable id sort, so every day's draft got the SAME photo (six open draft PRs
// held `fearless-inglewood-2023` x3 and `reputation-inglewood-2023` x2, which
// is exactly the "re-used picture" the owner rejected). The model could only
// find the truth by diffing every open PR, a turn-burning loop. Here the
// ledger is posted + queued + open-PR drafts, and the pick is handed over.
import { canonicalPhotoId, isUnknownCredit, validatePhotoEntry } from './photo-library.mjs';

/** Tags that describe a venue/format/year rather than an era. */
const NON_ERA_TAGS = new Set(['eras-tour', 'fan-photo', 'concert', 'inglewood', 'minneapolis', 'arlington', 'acoustic', '2007', '2009']);

export function eraTagsOf(entry) {
  return (Array.isArray(entry?.tags) ? entry.tags : []).filter((tag) => !NON_ERA_TAGS.has(tag));
}

/**
 * The library id a queue/posted item is bound to, by `photoId` or by its media path.
 * An Instagram-ready variant resolves to its ORIGINAL's id (make-ig-variants.mjs):
 * the two are one photograph, so using either counts as using both (L001).
 */
export function photoIdOf(item, library) {
  if (typeof item?.photoId === 'string' && item.photoId.trim()) {
    const id = item.photoId.trim();
    return canonicalPhotoId(library.find((entry) => entry.id === id)) ?? id;
  }
  const media = Array.isArray(item?.media) ? item.media : [];
  const entry = library.find((e) => media.includes(e.mediaPath));
  return entry ? canonicalPhotoId(entry) : null;
}

/**
 * `sources`: `{ posted, queue, openDrafts }`, each an array of `{ ref, data }`
 * (`data` = the parsed queue/posted item). Returns the ineligible ids with
 * where each is held, and the eligible library entries (valid, never used and,
 * when `igUsable` (a Set of ids) is given, Instagram-acceptable — see
 * photo-dimensions.mjs; every pair needs an IG half).
 */
export function buildPhotoLedger(library, { posted = [], queue = [], openDrafts = [] } = {}, { igUsable = null } = {}) {
  const used = new Map();
  for (const [kind, list] of [['posted', posted], ['queue', queue], ['open-pr', openDrafts]]) {
    for (const { ref, data } of list) {
      const id = photoIdOf(data, library);
      if (!id) continue;
      if (!used.has(id)) used.set(id, []);
      used.get(id).push({ kind, ref });
    }
  }
  const valid = library.filter((entry) => validatePhotoEntry(entry).length === 0);
  const unused = valid.filter((entry) => !used.has(canonicalPhotoId(entry)));
  const eligible = igUsable ? unused.filter((entry) => igUsable.has(entry.id)) : unused;
  // An original outside the IG window whose variant is drawable is not blocked — the variant stands in for it.
  const hasDrawableVariant = (entry) => eligible.some((e) => e.variantOf === entry.id);
  const igBlockedUnused = unused.filter((entry) => !eligible.includes(entry) && !hasDrawableVariant(entry)).length;
  return { used, eligible, total: valid.filter((entry) => !entry.variantOf).length, igBlockedUnused, byId: new Map(library.map((entry) => [entry.id, entry])) };
}

const toPick = (entry, byId) => ({
  photoId: entry.id,
  media: [entry.mediaPath],
  ...(isUnknownCredit(entry.credit) ? {} : { mediaCredit: entry.credit }),
  mediaSource: entry.source,
  altText: [entry.alt],
  eraTags: eraTagsOf(entry),
  // An IG-ready variant: the pair may share it, or the X half may use the original (X has no aspect gate).
  ...(entry.variantOf ? { variantOf: entry.variantOf, ...(byId?.get(entry.variantOf) ? { xOriginal: { photoId: entry.variantOf, media: [byId.get(entry.variantOf).mediaPath] } } : {}) } : {}),
});

/**
 * Best-first order for an unconstrained (non-themed) beat: the calendar's own
 * hint (a missing credit never ranks a photo down — owner rule 2026-10-01), then a photo with NO era tag
 * (era-tagged photos are the scarce ones themed beats need), then stable id.
 */
function rankForBeat(entries, hintId) {
  return [...entries].sort(
    (a, b) =>
      Number(b.id === hintId) - Number(a.id === hintId) ||
      eraTagsOf(a).length - eraTagsOf(b).length ||
      a.id.localeCompare(b.id),
  );
}

/**
 * One distinct, never-used photo per beat (`beats`: `{ date, hintId? }`),
 * chronological. A beat with none left gets `photo: null` — the drafter
 * reports it rather than repeating a tile.
 */
export function assignBeatPhotos(beats, ledger) {
  const taken = new Set();
  return beats.map((beat) => {
    const pool = ledger.eligible.filter((entry) => !taken.has(entry.id));
    // A hint naming an out-of-window original applies to its IG-ready variant (the original is never drawable).
    const hintId = beat.hintId ? (pool.find((entry) => entry.id === beat.hintId || entry.variantOf === beat.hintId)?.id ?? beat.hintId) : undefined;
    const [best] = rankForBeat(pool, hintId);
    if (best) taken.add(best.id);
    return { date: beat.date, photo: best ? toPick(best, ledger.byId) : null, ...(hintId && best?.id === hintId ? { fromCalendar: true } : {}) };
  });
}

/**
 * Per era tag in the library: how many photos exist / are still unused, and
 * the next one for a THEMED beat (`photoEra` required there), skipping ids
 * already handed to a calendar beat. `exhausted: true` = the beat cannot be
 * drafted without repeating a tile — defer it (L001), never reuse.
 */
export function eraAvailability(library, ledger, assignedIds = []) {
  const eras = new Map();
  for (const entry of library) for (const tag of eraTagsOf(entry)) eras.set(tag, true);
  const out = {};
  for (const tag of [...eras.keys()].sort()) {
    const all = library.filter((entry) => !entry.variantOf && eraTagsOf(entry).includes(tag));
    const free = ledger.eligible.filter((entry) => eraTagsOf(entry).includes(tag) && !assignedIds.includes(entry.id));
    const [next] = rankForBeat(free);
    out[tag] = { total: all.length, unused: free.length, exhausted: free.length === 0, next: next ? toPick(next, ledger.byId) : null };
  }
  return out;
}
