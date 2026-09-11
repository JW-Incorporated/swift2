// Deterministic, attribution-preserving selection for the social photo corpus.
// A photo that has been used recently is ranked behind less-used options, but
// never made ineligible: a finite library must still be able to serve a valid
// paired campaign after every entry has appeared.

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validatePhotoEntry(entry) {
  const findings = [];
  if (!entry || typeof entry !== 'object') return ['entry must be an object'];
  if (typeof entry.id !== 'string' || entry.id.trim() === '') findings.push('id is required');
  if (typeof entry.mediaPath !== 'string' || !entry.mediaPath.startsWith('/social/library/photos/')) {
    findings.push('mediaPath must point to /social/library/photos/');
  }
  if (typeof entry.credit !== 'string' || entry.credit.trim() === '') findings.push('credit is required');
  if (!isHttpUrl(entry.source)) findings.push('source must be an http(s) URL');
  // docs/social/RULINGS-SOCIAL.md A3/B2 — alt text is written ONCE per library entry
  // (the photo never changes per post), never per draft, so it must exist
  // here before any draft can bind to this entry at all.
  if (typeof entry.alt !== 'string' || entry.alt.trim() === '') findings.push('alt is required — write the accessibility description once here (RULINGS-SOCIAL A3)');
  // Fable ruling, kanban t_75ec7106 (2026-09-10, PR #4062 review round 2): a
  // library entry carrying a blank/whitespace-only tags[] entry would let a
  // caller-supplied blank requiredTags value in selectSocialPhoto's
  // era-filtering ACCIDENTALLY match it — the fail-closed guarantee that fix
  // depends on ("real photo tags are never blank") was an asserted, unchecked
  // invariant. Enforcing it here, at the source, means it can never reach
  // `eligible` in the first place, so selectSocialPhoto itself needs no
  // defensive change.
  if (entry.tags !== undefined) {
    if (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string' || tag.trim() === '')) {
      findings.push('tags entries must be non-blank strings');
    }
  }
  return findings;
}

function historyFor(entry, history) {
  return history.filter((record) => record?.photoId === entry.id || record?.media?.includes(entry.mediaPath));
}

function timestamp(value) {
  const valueMs = new Date(value).getTime();
  return Number.isFinite(valueMs) ? valueMs : 0;
}

/**
 * True when a photo entry is thematically eligible for a draft that requires
 * one of `requiredTags` (e.g. the post's era). A photo qualifies when its own
 * `tags` array contains ANY of the required tags — a photo can legitimately
 * carry more than one (`["lover", "eras-tour", "minneapolis"]`), and a themed
 * draft only needs the era/theme tag to be among them, not an exact match.
 */
export function photoMatchesRequiredTags(entry, requiredTags) {
  if (!requiredTags.length) return true;
  return Array.isArray(entry.tags) && entry.tags.some((tag) => requiredTags.includes(tag));
}

/**
 * Picks the least-used credited photo, then the longest-unseen, then a stable
 * id tie-breaker. This is deliberately total over a non-empty valid library:
 * reuse improves diversity but can never halt an otherwise valid calendar —
 * AS LONG AS the theme/era is not constrained (see `requiredTags` below).
 *
 * `options.requiredTags` (2026-09-10, kanban t_75ec7106 — the 2026-09-09
 * reputation/snake post that shipped a Lover-era tour photo): when the
 * caller names the draft's target era/theme (from the post's `campaign` or
 * lens/egg node, e.g. `["reputation"]`), selection is FIRST filtered to only
 * photos whose `tags` include one of those values — least-used/longest-unseen
 * then breaks ties only WITHIN that matching set. A picture with nothing to
 * do with the post is worse than no picture at all, so this is a real filter,
 * not a soft preference: if the filtered pool is empty, this returns `null`
 * (distinct from an empty *library*, which is also `null` — callers that
 * care about the difference should check `library.length` themselves) and
 * the caller MUST treat that as a hard failure to source/queue the draft,
 * never silently fall back to an off-era photo. See check-drafts.mjs and
 * select-photo.mjs for the two call sites that enforce this.
 */
export function selectSocialPhoto(library, history = [], options = {}) {
  const eligible = library.filter((entry) => validatePhotoEntry(entry).length === 0);
  if (!eligible.length) return null;

  const requiredTags = Array.isArray(options.requiredTags)
    ? options.requiredTags.map((tag) => (typeof tag === 'string' ? tag.trim() : tag)).filter((tag) => tag !== undefined && tag !== null)
    : [];

  // A caller that explicitly passes a blank/whitespace-only tag (as opposed
  // to omitting requiredTags entirely) meant to constrain selection and got
  // it wrong — treat it as "no photo can satisfy this" (fail closed, same as
  // any other unmatched era) rather than silently discarding it and falling
  // through to the unconstrained, match-everything behavior (Codex review
  // round 1, kanban t_75ec7106: `--era '   '` was quietly selecting from the
  // whole library). Real photo tags are never blank, so a blank required tag
  // can never match and the pool below will correctly come up empty.
  const pool = requiredTags.length ? eligible.filter((entry) => photoMatchesRequiredTags(entry, requiredTags)) : eligible;
  if (!pool.length) return null;

  const ranked = pool
    .map((entry) => {
      const uses = historyFor(entry, history);
      const lastUsedAt = uses.reduce((latest, use) => Math.max(latest, timestamp(use.postedAt)), 0);
      return { entry, useCount: uses.length, lastUsedAt };
    })
    .sort((a, b) => a.useCount - b.useCount || a.lastUsedAt - b.lastUsedAt || a.entry.id.localeCompare(b.entry.id));

  const selected = ranked[0];
  return {
    ...selected.entry,
    reused: selected.useCount > 0,
    useCount: selected.useCount,
    lastUsedAt: selected.lastUsedAt ? new Date(selected.lastUsedAt).toISOString() : null,
  };
}
