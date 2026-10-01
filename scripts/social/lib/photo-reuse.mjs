// Lesson L001, codified (Bots v2 W8; issue #4601 asked for it "in the checker,
// not a prompt"): a photograph that has shipped, or that another campaign has
// queued, is ineligible. The ONE sanctioned repeat is the pair itself — the
// IG and X halves of a single campaign carry the SAME image by design (the
// owner approves the pair as one post; docs/decisions.md 2026-09-30), so a
// sibling in the same campaign, posted or queued, never counts as reuse.
//
// Deliberately blind to drafts waiting in OTHER open PRs (CI sees one branch):
// the daily pre-compute's photo ledger (prepare-draft-inputs.mjs) is what keeps
// two open drafts off the same tile; this is the merge-time backstop.
import { photoIdOf } from './photo-ledger.mjs';

const campaignOf = (item) => (typeof item?.campaign === 'string' && item.campaign.trim() ? item.campaign.trim() : null);

/**
 * Hard findings for `item` when its photo already shipped or is queued under a
 * DIFFERENT campaign. `allQueue` / `allPosted`: `{ file, data }` entries.
 */
export function checkPhotoReuse(file, item, allQueue, allPosted, library) {
  const id = photoIdOf(item, library);
  if (!id) return [];
  const campaign = campaignOf(item);
  const clashes = (o) => photoIdOf(o.data, library) === id && (campaign === null || campaignOf(o.data) !== campaign);
  const shipped = (allPosted ?? []).find(clashes);
  const queued = (allQueue ?? []).find((o) => o.file !== file && clashes(o));
  const where = shipped
    ? `already shipped in social/posted/${shipped.file}${campaignOf(shipped.data) ? ` (campaign "${campaignOf(shipped.data)}")` : ''}`
    : queued
      ? `already queued in social/queue/${queued.file} (campaign "${campaignOf(queued.data)}")`
      : null;
  if (!where) return [];
  return [
    `media: photoId ${JSON.stringify(id)} was ${where} — lesson L001 (owner: "All re-used pictures will be rejected"): ` +
      'a photo may only repeat across the IG and X halves of the SAME campaign. Take the beat\'s photo from .scratch/tree-inputs.json ' +
      '(or `npm run social:select-photo -- --strict --era <era>`); if no never-used photo fits, defer the beat — never repeat a tile.',
  ];
}
