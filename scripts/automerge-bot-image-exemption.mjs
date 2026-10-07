#!/usr/bin/env node
// Narrow carve-out for auto-merge-content.yml's social-image gate
// (docs/decisions.md 2026-10-05, founder decision A). The gate declines any
// apps/web/public/social/** image unless a social/queue/**.json draft rode
// with it. merch-official-sync drop PRs carry a rendered library card plus a
// social/inbox/merch-*.json fact sheet instead, so they were never
// auto-mergeable. An image counts as accompanied ONLY when ALL hold:
//   - the PR head branch is `merch-official-sync/<something>`;
//   - the image path is exactly apps/web/public/social/library/merch-drop-<digits>.png;
//   - the image is newly ADDED by this PR;
//   - the same PR ADDS at least one social/inbox/merch-*.json (top level).
// A second rule (docs/decisions.md 2026-10-06, founder decision "Photos A")
// covers the concert-photo-sourcing bot's photo-library imports. An image
// counts as accompanied ONLY when ALL hold:
//   - the PR head branch is exactly `social/concert-photo-sourcing`;
//   - the image path is apps/web/public/social/library/photos/<id>.(jpg|jpeg|png|webp),
//     directly in that directory (no subdirectory, no traversal);
//   - the image is newly ADDED by this PR;
//   - the same PR ADDS or MODIFIES social/photo-library.json.
// Library photos are not posts; every post still needs the founder's approval.
// Every other image stays fail-closed. The branch/author gate in the workflow
// runs before this and is not weakened by it.
//
// CLI: reads the `status<TAB>filename<TAB>previous` lines of the PR file list
// on stdin, HEAD_REF from the environment, and prints every social image that
// is NOT covered (one per line) — the workflow declines if any is printed
// while check-drafts validated no queue draft.

const BRANCH_PREFIX = 'merch-official-sync/';
const DROP_IMAGE_RE = /^apps\/web\/public\/social\/library\/merch-drop-[0-9]+\.png$/;
const INBOX_RE = /^social\/inbox\/merch-[^/]+\.json$/;
const PHOTO_BRANCH = 'social/concert-photo-sourcing';
const PHOTO_IMAGE_RE = /^apps\/web\/public\/social\/library\/photos\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/;
const PHOTO_LIBRARY_FILE = 'social/photo-library.json';
const SOCIAL_IMAGE_RE = /^apps\/web\/public\/social\/.*\.(png|jpg|jpeg)$/;

/**
 * @param {{ branch: string, files: Array<{ status: string, filename: string }> }} input
 * @returns {string[]} social images this PR adds that are NOT exempt
 */
export function uncoveredSocialImages({ branch, files }) {
  const images = files.filter((f) => SOCIAL_IMAGE_RE.test(f.filename));
  const branchOk = typeof branch === 'string' && branch.startsWith(BRANCH_PREFIX) && branch.length > BRANCH_PREFIX.length;
  const hasInbox = files.some((f) => f.status === 'added' && INBOX_RE.test(f.filename));
  const photoBranchOk = branch === PHOTO_BRANCH;
  const hasPhotoLibrary = files.some((f) => (f.status === 'added' || f.status === 'modified') && f.filename === PHOTO_LIBRARY_FILE);
  return images
    .filter(
      (f) =>
        !(branchOk && hasInbox && f.status === 'added' && DROP_IMAGE_RE.test(f.filename)) &&
        !(photoBranchOk && hasPhotoLibrary && f.status === 'added' && PHOTO_IMAGE_RE.test(f.filename)),
    )
    .map((f) => f.filename);
}

export function parseFilesMeta(text) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [status, filename] = line.split('\t');
      return { status, filename };
    });
}

if (process.argv[1]?.endsWith('automerge-bot-image-exemption.mjs')) {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const files = parseFilesMeta(Buffer.concat(chunks).toString('utf8'));
  const out = uncoveredSocialImages({ branch: process.env.HEAD_REF ?? '', files });
  if (out.length > 0) process.stdout.write(`${out.join('\n')}\n`);
}
