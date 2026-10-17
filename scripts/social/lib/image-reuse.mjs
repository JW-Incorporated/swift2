// "We can never post the same picture twice" (issue #5990): the shared check
// behind check-drafts (merge time) and guard-image-reuse.mjs (the poster's
// last-line pre-step). It matches by perceptual fingerprint, so a photo saved
// under another name, re-downloaded, resized or re-encoded is still the same
// picture. photo-reuse.mjs keeps the cheap path-based check and its strategy
// knobs; this one is not tunable.
//
// The only sanctioned repeat is the IG and X halves of ONE campaign (same
// `campaign` string), exactly as in photo-reuse.mjs.
import { samePhotoPaths } from './photo-library.mjs';
import { describeEntry, findLedgerMatch } from './image-ledger.mjs';
import { fingerprintsMatch } from './image-fingerprint.mjs';

const campaignOf = (item) => (typeof item?.campaign === 'string' && item.campaign.trim() ? item.campaign.trim() : null);

/**
 * `{ findings, unreadable }` for `item` (queue file name `file`).
 * `ledger`: posted-image entries; `queue`: `{ file, data }[]` (all queued items);
 * `fingerprintOf(mediaPath)`: async, fingerprint or null; `library`: photo-library `photos`.
 * `unreadable` lists media paths that could not be fingerprinted — callers on a
 * posting path must treat any as a refusal.
 */
export async function checkImageReuse(file, item, { ledger, queue = [], fingerprintOf, library = [] }) {
  const findings = [];
  const unreadable = [];
  const campaign = campaignOf(item);
  for (const mediaPath of [...new Set(item.media ?? [])]) {
    const fp = await fingerprintOf(mediaPath);
    if (!fp) unreadable.push(mediaPath);
    const paths = samePhotoPaths(mediaPath, library);
    const earlier = findLedgerMatch(fp, ledger, { campaign, ownPost: file, paths });
    if (earlier) {
      findings.push(
        `media: "${mediaPath}" is the same picture as an image already posted — ${describeEntry(earlier)}. ` +
          'Founder rule (#5990): the same picture is never posted twice; only the IG and X halves of ONE campaign may share an image. Choose a never-used photo.',
      );
      continue;
    }
    if (!fp) continue;
    for (const other of queue) {
      if (other.file === file || (campaign && campaignOf(other.data) === campaign)) continue;
      for (const otherPath of other.data?.media ?? []) {
        const otherFp = paths.includes(otherPath) ? { hash: fp.hash, crops: fp.crops } : await fingerprintOf(otherPath);
        if (otherFp && (paths.includes(otherPath) || fingerprintsMatch(fp, otherFp))) {
          findings.push(
            `media: "${mediaPath}" is the same picture as "${otherPath}" queued in social/queue/${other.file}` +
              `${campaignOf(other.data) ? ` (campaign "${campaignOf(other.data)}")` : ''} — founder rule (#5990): never post the same picture twice; only the two halves of ONE campaign may share an image.`,
          );
          break;
        }
      }
    }
  }
  return { findings, unreadable };
}
