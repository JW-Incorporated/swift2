#!/usr/bin/env node
// Writes the A2 approval stamp into each queue file a just-merged PR
// touched. Invoked ONLY by .github/workflows/social-approval-stamp.yml,
// triggered on `pull_request_target: closed` with `merged == true`, via
// `gh api repos/$REPO/pulls/$PR` — the full PR schema, which (unlike
// `commits/{sha}/pulls`, the dead endpoint git-provenance.mjs used) really
// does carry `merged_by`/`merged_at`. This script itself never calls the
// GitHub API — everything it needs comes in as CLI flags and stdin, so it
// stays unit-testable with injected git calls, same discipline as the rest
// of scripts/social/.
//
// Usage:
//   node scripts/social/stamp-approval.mjs --by <login> --at <iso> \
//     --pr <number> --merge-sha <sha> < filenames.txt
//
// stdin: one social/queue/**.json relative path per line (the same set the
// SOCIAL APPROVAL GATE tripped on for this PR — see
// scripts/automerge-social-approval-gate.mjs).
//
// Exit 1 with ::error:: in two shapes:
//   - `by` not in SOCIAL_APPROVERS at all: aborts the WHOLE run before
//     touching any file — "merged by a non-approver; nothing stamped."
//     This is the real fence: GitHub cannot tell the owner's own "Merge"
//     tap from an agent's `gh pr merge` (RULINGS-SOCIAL.md A2 finding #2),
//     so SOCIAL_APPROVERS plus this refusal is what actually stops a
//     non-owner merge from ever producing a usable stamp, however it
//     happened.
//   - a file's blob at HEAD no longer matches the blob the PR actually
//     merged (another PR changed it since — that PR's own stamp run, not
//     this one, owns the file): that ONE file is skipped with its own
//     ::error::, everything else still gets stamped. Never silently drops
//     a file — a skipped file stays unapproved and loud in validate-queue's
//     warnings and the poster's `unapproved` outcome.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { contentHash } from './lib/queue.mjs';

function flag(args, name) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}

/** Blob contents of `relPath` as of `sha`, or null if the path didn't exist
 * at that commit (treated as "changed since" — never a stamp target). */
function blobAt(sha, relPath, { cwd, exec = execFileSync } = {}) {
  try {
    return exec('git', ['show', `${sha}:${relPath}`], { cwd, encoding: 'utf8' });
  } catch {
    return null;
  }
}

export function stampFiles(
  files,
  { by, at, pr, mergeSha, cwd = process.cwd(), exec = execFileSync, readFileImpl = readFileSync, writeFileImpl = writeFileSync } = {},
) {
  if (!SOCIAL_APPROVERS.includes(by)) {
    return { ok: false, reason: `merged by a non-approver; nothing stamped (merged_by="${by}", SOCIAL_APPROVERS=${JSON.stringify(SOCIAL_APPROVERS)})`, stamped: [], skipped: [] };
  }
  const stamped = [];
  const skipped = [];
  for (const file of files) {
    if (!file) continue;
    const relPath = path.posix.join('social', 'queue', path.basename(file));
    const atMergeSha = blobAt(mergeSha, relPath, { cwd, exec });
    const atHead = (() => {
      try {
        return readFileImpl(path.join(cwd, relPath), 'utf8');
      } catch {
        return null;
      }
    })();
    if (atHead === null || atMergeSha === null || atHead !== atMergeSha) {
      skipped.push({ file: relPath, reason: 'blob at HEAD no longer matches the blob merged by this PR — another PR changed it since; that PR\'s own stamp run owns this file.' });
      continue;
    }
    const item = JSON.parse(atHead);
    const approval = { v: 1, by, at, pr, contentHash: contentHash(item) };
    const stampedItem = { ...item, approval };
    writeFileImpl(path.join(cwd, relPath), JSON.stringify(stampedItem, null, 2) + '\n');
    stamped.push(relPath);
  }
  return { ok: true, stamped, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const by = flag(args, 'by');
  const at = flag(args, 'at');
  const prRaw = flag(args, 'pr');
  const mergeSha = flag(args, 'merge-sha');
  if (!by || !at || !prRaw || !mergeSha) {
    throw new Error('Usage: stamp-approval.mjs --by <login> --at <iso> --pr <number> --merge-sha <sha> < filenames.txt');
  }
  const pr = Number(prRaw);
  const input = readFileSync(0, 'utf8');
  const files = input.split('\n').map((l) => l.trim()).filter(Boolean);

  const result = stampFiles(files, { by, at, pr, mergeSha });
  if (!result.ok) {
    console.error(`::error::stamp-approval: ${result.reason}`);
    process.exitCode = 1;
    return;
  }
  for (const f of result.stamped) console.log(`stamp-approval: stamped ${f} (by ${by}, PR #${pr})`);
  for (const s of result.skipped) {
    console.error(`::error::stamp-approval: ${s.file} — ${s.reason}`);
  }
  if (result.skipped.length) process.exitCode = 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'stamp-approval.mjs') {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
