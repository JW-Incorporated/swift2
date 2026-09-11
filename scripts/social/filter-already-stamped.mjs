#!/usr/bin/env node
// Drops any draft from a notify manifest that the poll job has already
// stamped (RULINGS-SOCIAL-2.md B1) — a `synchronize` re-run of
// social-approval-notify.yml must not re-brief a file the owner already
// reacted ✅ to. Checked WITHOUT the signing key (this workflow never
// holds SOCIAL_APPROVAL_KEY) — shape+id+hash is enough to tell "already
// has a stamp that still matches this content" from "needs a brief."
//
// Usage: node filter-already-stamped.mjs <manifest.json>
// Overwrites the manifest file in place with the filtered array and
// prints how many were dropped; exits 0 either way. If every draft was
// already stamped, prints `already-stamped: all N draft(s) filtered` so
// the calling step can flip its own has_drafts output to false.
import { readFileSync, writeFileSync } from 'node:fs';
import { approvalStatus } from './lib/queue.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('::error::filter-already-stamped: usage: node filter-already-stamped.mjs <manifest.json>');
  process.exit(1);
}

const drafts = JSON.parse(readFileSync(manifestPath, 'utf8'));
const pending = drafts.filter((d) => !approvalStatus(d, { approvers: SOCIAL_APPROVERS }).ok);
writeFileSync(manifestPath, JSON.stringify(pending));
console.log(`social-approval-notify: ${drafts.length - pending.length} already-stamped file(s) filtered out of the brief (${pending.length} remain).`);
if (pending.length === 0) {
  console.log('already-stamped: all drafts filtered');
}
