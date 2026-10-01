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
import { validatePhotoEntry } from './photo-library.mjs';

/** Tags that describe a venue/format/year rather than an era. */
const NON_ERA_TAGS = new Set(['eras-tour', 'fan-photo', 'concert', 'inglewood', 'minneapolis', 'arlington', 'acoustic', '2007', '2009']);

/** A credit that names no real uploader is not a credit (calendar, 2026-09-28; rights are the owner's call, #4607). */
export const WEAK_CREDIT_RE = /\bunknown\b/i;

export function eraTagsOf(entry) {
  return (Array.isArray(entry?.tags) ? entry.tags : []).filter((tag) => !NON_ERA_TAGS.has(tag));
}

/** The library id a queue/posted item is bound to, by `photoId` or by its media path. */
export function photoIdOf(item, library) {
  if (typeof item?.photoId === 'string' && item.photoId.trim()) return item.photoId.trim();
  const media = Array.isArray(item?.media) ? item.media : [];
  return library.find((entry) => media.includes(entry.mediaPath))?.id ?? null;
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
  const unused = valid.filter((entry) => !used.has(entry.id));
  const eligible = igUsable ? unused.filter((entry) => igUsable.has(entry.id)) : unused;
  return { used, eligible, total: valid.length, igBlockedUnused: unused.length - eligible.length };
}

const toPick = (entry) => ({
  photoId: entry.id,
  media: [entry.mediaPath],
  mediaCredit: entry.credit,
  mediaSource: entry.source,
  altText: [entry.alt],
  creditWeak: WEAK_CREDIT_RE.test(entry.credit),
  eraTags: eraTagsOf(entry),
});

/**
 * Best-first order for an unconstrained (non-themed) beat: a real credit
 * before a weak one (the charter's no-uncredited-media boundary outranks a
 * calendar hint), then the calendar's own hint, then a photo with NO era tag
 * (era-tagged photos are the scarce ones themed beats need), then stable id.
 */
function rankForBeat(entries, hintId) {
  return [...entries].sort(
    (a, b) =>
      Number(WEAK_CREDIT_RE.test(a.credit)) - Number(WEAK_CREDIT_RE.test(b.credit)) ||
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
    const [best] = rankForBeat(pool, beat.hintId);
    if (best) taken.add(best.id);
    return { date: beat.date, photo: best ? toPick(best) : null, ...(beat.hintId && best?.id === beat.hintId ? { fromCalendar: true } : {}) };
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
    const all = library.filter((entry) => eraTagsOf(entry).includes(tag));
    const free = ledger.eligible.filter((entry) => eraTagsOf(entry).includes(tag) && !assignedIds.includes(entry.id));
    const [next] = rankForBeat(free);
    out[tag] = { total: all.length, unused: free.length, exhausted: free.length === 0, next: next ? toPick(next) : null };
  }
  return out;
}
