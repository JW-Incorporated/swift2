#!/usr/bin/env node
// ownerStampCheck - exit 0 only when EVERY listed queue file at a given commit
// carries a VALID owner v3 approval (a Discord ✅ stamped and signed by
// social-approval-poll.yml). Used by social-tree-approve.yml's cleanup step: if
// the PR head moved during the build wait and its new head already holds the
// owner's own stamp, the PR must not be closed - the owner approved it, and the
// poll job merges it. Anything else (no stamp, a tree-auto stamp, a bad
// signature, an unreadable file, an empty list) exits 1, so the caller keeps its
// old behaviour (close the PR).
//
// Reads the files as DATA via `git show <sha>:<path>`; never executes PR code.
//   SOCIAL_APPROVAL_KEY=… node scripts/social/owner-stamp-check.mjs --sha <40-hex> --list <file of paths>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { approvalStatus } from './lib/queue.mjs';

const SHA_RE = /^[0-9a-f]{40}$/;
const SAFE_PATH_RE = /^social\/queue\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;

/** @returns {{ ok: boolean, reason: string }} */
export function ownerStampCheck(paths, { sha, key, approvers = SOCIAL_APPROVERS, showImpl } = {}) {
  if (!SHA_RE.test(String(sha ?? ''))) return { ok: false, reason: 'not a 40-hex commit sha' };
  if (!key) return { ok: false, reason: 'no SOCIAL_APPROVAL_KEY to verify with' };
  const list = (paths ?? []).filter(Boolean);
  if (list.length === 0) return { ok: false, reason: 'no queue files listed' };
  const show = showImpl ?? ((p) => execFileSync('git', ['show', `${sha}:${p}`], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
  for (const p of list) {
    if (!SAFE_PATH_RE.test(p)) return { ok: false, reason: `${p} is not a plain social/queue/*.json path` };
    let item;
    try {
      item = JSON.parse(show(p));
    } catch {
      return { ok: false, reason: `${p} cannot be read at ${sha.slice(0, 7)}` };
    }
    if (item?.approval?.v !== 3) return { ok: false, reason: `${p} carries no owner v3 stamp` };
    const status = approvalStatus(item, { approvers, key });
    if (!status.ok) return { ok: false, reason: `${p}: ${status.reason}` };
  }
  return { ok: true, reason: `all ${list.length} queue file(s) carry a valid owner v3 stamp` };
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let paths = [];
  try {
    paths = readFileSync(arg('list') ?? '', 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  } catch { /* an unreadable list is a refusal below */ }
  const res = ownerStampCheck(paths, { sha: arg('sha'), key: process.env.SOCIAL_APPROVAL_KEY ?? '' });
  console.log(`owner-stamp-check: ${res.ok ? 'YES' : 'no'} - ${res.reason}`);
  process.exit(res.ok ? 0 : 1);
}
