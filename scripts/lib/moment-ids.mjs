// Site id of a vault moment: `vault-<eraId>-<slugify(title)>`, with `-2`, `-3`
// suffixes when titles collide within an era. Shared by
// scripts/sync-longlive-content.mjs (which writes the ids) and
// scripts/social/new-on-site.mjs (which must predict them exactly).
import { SLUG_TO_ERA_ID, slugify } from './longlive-sync-shared.mjs';

/** Unsuffixed id for a title in an era (`eraSlug` may be a slug or an era id). */
export const baseMomentId = (eraSlug, title) => `vault-${SLUG_TO_ERA_ID[eraSlug] ?? eraSlug}-${slugify(title)}`;

/** Returns `baseId` or the first free `baseId-N` (N from 2), and records it in `seen`. */
export function claimMomentId(baseId, seen) {
  let id = baseId;
  let n = 2;
  while (seen.has(id)) {
    id = `${baseId}-${n++}`;
  }
  seen.add(id);
  return id;
}

/** Ids of an era's items, in order, with collision suffixes. */
export function momentIds(eraSlug, items) {
  const seen = new Set();
  return (items ?? []).map((item) => claimMomentId(baseMomentId(eraSlug, item.title), seen));
}
