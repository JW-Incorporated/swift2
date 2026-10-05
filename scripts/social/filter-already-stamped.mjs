#!/usr/bin/env node
// Drops any draft from a notify manifest whose stamp still COVERS the PR
// head (docs/social/RULINGS-SOCIAL-2.md B1 + docs/decisions.md 2026-09-12)
// — a `synchronize` re-run of social-approval-notify.yml must not re-brief
// a file the owner already reacted ✅ to, but it MUST re-brief a file whose
// stamp no longer covers the branch (a `why`-only drift, changed image
// bytes, a v2 stamp): a fresh header ✅ is how the poll re-mints after
// drift, and the founder can only react to a header they were sent.
// Checked WITHOUT the signing key (this workflow never holds
// SOCIAL_APPROVAL_KEY) — shape+id+hash for the stamp itself, plus the same
// `cleanSince`/`selfClean` git predicate the poll merges on
// (lib/stamp-health.mjs, one implementation for both). Git is read-only
// plumbing here (fetch of the PR's head ref, show, diff) — data, never PR
// code.
//
// Usage: node filter-already-stamped.mjs <manifest.json> --pr <n> --head <sha>
// Overwrites the manifest file in place with the filtered array and
// prints how many were dropped; exits 0 either way. If every draft was
// already stamped, prints `already-stamped: all N draft(s) filtered` so
// the calling step can flip its own has_drafts output to false. Without
// --pr/--head it falls back (with a warning) to the content-only check.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { filterAlreadyStamped, makeGitState } from './lib/stamp-health.mjs';

let manifestPath;
let pr;
let head;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--pr') pr = Number(args[++i]);
  else if (args[i] === '--head') head = args[++i];
  else if (!manifestPath) manifestPath = args[i];
}
if (!manifestPath) {
  console.error('::error::filter-already-stamped: usage: node filter-already-stamped.mjs <manifest.json> --pr <n> --head <sha>');
  process.exit(1);
}

const drafts = JSON.parse(readFileSync(manifestPath, 'utf8'));
let gitState = null;
if (Number.isInteger(pr) && pr > 0 && typeof head === 'string' && /^[0-9a-f]{40}$/.test(head)) {
  gitState = makeGitState((gitArgs) => execFileSync('git', gitArgs, { encoding: 'utf8', env: process.env }).trim(), pr);
} else {
  console.error('::warning::filter-already-stamped: no --pr/--head given — content-only check; a stamp that no longer covers the branch cannot be detected this way');
}
const pending = filterAlreadyStamped(drafts, { head: gitState ? head : null, gitState, approvers: SOCIAL_APPROVERS });
writeFileSync(manifestPath, JSON.stringify(pending));
console.log(`social-approval-notify: ${drafts.length - pending.length} already-stamped file(s) filtered out of the brief (${pending.length} remain).`);
if (pending.length === 0) {
  console.log('already-stamped: all drafts filtered');
}
