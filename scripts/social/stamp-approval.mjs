// stampFiles — writes the B1 v2 approval stamp into each queue file the
// owner's Discord ✅ covers. This is a pure LIBRARY now (RULINGS-SOCIAL-2.md
// B3): the CLI, the `--merge-sha` blob-at-merge comparison, and the
// merge-triggered workflow that used to call it are all deleted. The only
// caller is scripts/social/social-approval-poll.mjs, which stamps the PR
// HEAD it is looking at right now — there is no merge event to compare
// against any more, because stamping happens BEFORE the merge (the poll
// job stamps, then merges, in that order).
//
// Refuses to write anything unless `by` is already in SOCIAL_APPROVERS
// (belt-and-suspenders: the poll job only ever calls this with a discord:
// id it just verified reacted ✅, but this function does not trust its
// caller) and signs every stamp it writes with `signApproval` — a
// hand-written `approval` object is inert at the poster regardless of who
// wrote it, because the poster also verifies the signature
// (lib/queue.mjs's `approvalStatus` with `key` passed).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { contentHash, signApproval } from './lib/queue.mjs';

/**
 * @param {string[]} files - social/queue/**.json relative (or basename)
 *   paths to stamp.
 * @param {{ by: string, at: string, pr: number, message: string, key: string,
 *   root?: string, readFileImpl?: Function, writeFileImpl?: Function }} opts
 * @returns {{ ok: boolean, reason?: string, stamped: string[] }}
 */
export function stampFiles(
  files,
  { by, at, pr, message, key, root = process.cwd(), readFileImpl = readFileSync, writeFileImpl = writeFileSync } = {},
) {
  if (!SOCIAL_APPROVERS.includes(by)) {
    return {
      ok: false,
      reason: `refused — "${by}" is not in SOCIAL_APPROVERS; nothing stamped (SOCIAL_APPROVERS=${JSON.stringify(SOCIAL_APPROVERS)})`,
      stamped: [],
    };
  }
  if (!key) {
    return { ok: false, reason: 'refused — no SOCIAL_APPROVAL_KEY available to sign with; nothing stamped', stamped: [] };
  }
  const stamped = [];
  for (const file of files) {
    if (!file) continue;
    const relPath = path.posix.join('social', 'queue', path.basename(file));
    const absPath = path.join(root, relPath);
    const raw = readFileImpl(absPath, 'utf8');
    const item = JSON.parse(raw);
    const approvalWithoutSig = { v: 2, by, at, pr, message, contentHash: contentHash(item) };
    const approval = { ...approvalWithoutSig, sig: signApproval(approvalWithoutSig, key) };
    const stampedItem = { ...item, approval };
    writeFileImpl(absPath, JSON.stringify(stampedItem, null, 2) + '\n');
    stamped.push(relPath);
  }
  return { ok: true, stamped };
}
