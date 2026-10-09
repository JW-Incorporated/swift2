#!/usr/bin/env node
// stampTreeAuto — mints the v4 `tree-auto` approval stamp: Tree posting its own
// drafts without the owner's Discord ✅. The only caller is
// .github/workflows/social-tree-approve.yml, which runs THIS file from `main`
// against a PR's queue files read as data (never PR code).
//
// The stamp does not weaken any post-time guard: the poster still verifies the
// HMAC (SOCIAL_APPROVAL_KEY, held only in the main-only `social` environment),
// the content hash, the 48h staleness rule, MAX_POSTS_PER_RUN,
// MAX_POSTS_PER_PLATFORM_PER_DAY and SOCIAL_FREEZE exactly as for a v3 stamp.
// What changes is only WHO may sign: this function, and only after the trusted
// draft-time gate (check-drafts.mjs, run over ALL the given files together so
// the campaign-pair rule sees both halves) passes. If the gate fails — or
// cannot run — nothing is written.
//
// Usage: SOCIAL_APPROVAL_KEY=… node scripts/social/stamp-tree-auto.mjs \
//          --pr <number> [--message <audit text>] <social/queue/file.json …>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TREE_AUTO_BY, TREE_AUTO_KIND, approvalStatus, contentHash, mediaDigest, signApproval } from './lib/queue.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SAFE_QUEUE_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;

const MAX_SCHEDULE_AHEAD_MS = 48 * 60 * 60 * 1000;
const SECRETISH_ENV = /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|^GH_|^GITHUB_PAT|PAT$/i;

/** process.env minus every credential-looking variable: check-drafts runs checkers over PR-provided data and
 * must never see the signing key or the PAT. Keeps what node/git need (PATH, HOME, RUNNER_*, ...). */
export function scrubbedEnv(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([name]) => !SECRETISH_ENV.test(name)));
}

/** Runs the trusted check-drafts over `relPaths` with a scrubbed env; returns { ok, output }. */
export function runCheckDrafts(relPaths, { root = ROOT, spawnImpl = spawnSync, env = process.env } = {}) {
  const result = spawnImpl(process.execPath, [path.join(HERE, 'check-drafts.mjs'), ...relPaths], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: scrubbedEnv(env),
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return { ok: result.status === 0 && !result.error, output };
}

/**
 * @param {string[]} files - social/queue/*.json paths (basename is what counts).
 * @param {{ pr: number, at: string, message: string, key: string, root?: string,
 *   checkDraftsImpl?: Function, readFileImpl?: Function, writeFileImpl?: Function }} opts
 * @returns {{ ok: boolean, reason?: string, stamped: string[] }}
 */
export function stampTreeAuto(
  files,
  { pr, at, message = '', key, root = ROOT, checkDraftsImpl = runCheckDrafts, readFileImpl = readFileSync, writeFileImpl = writeFileSync, readMediaImpl } = {},
) {
  const refuse = (reason) => ({ ok: false, reason: `refused — ${reason}; nothing stamped`, stamped: [] });
  if (!key) return refuse('no SOCIAL_APPROVAL_KEY available to sign with');
  if (!Number.isInteger(pr) || pr <= 0) return refuse(`"${pr}" is not a PR number`);
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return refuse(`"${at}" is not a timestamp`);
  const list = (files ?? []).filter(Boolean);
  if (list.length === 0) return refuse('no queue files given');

  const relPaths = [];
  for (const file of list) {
    const base = String(file).startsWith('social/queue/') ? String(file).slice('social/queue/'.length) : String(file);
    if (!SAFE_QUEUE_FILE_RE.test(base)) return refuse(`"${file}" is not a plain social/queue/*.json file name`);
    relPaths.push(path.posix.join('social', 'queue', base));
  }

  // Read and screen everything BEFORE the gate, then gate, then write — a
  // failure at any point leaves every file untouched.
  const items = [];
  for (const relPath of relPaths) {
    let item;
    try {
      item = JSON.parse(readFileImpl(path.join(root, relPath), 'utf8'));
    } catch (err) {
      return refuse(`${relPath} could not be read as JSON (${err.message})`);
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return refuse(`${relPath} is not a JSON object`);
    if (item.approval !== undefined) {
      const prior = approvalStatus(item, { approvers: [], key });
      return refuse(`${relPath} already carries an approval (${prior.ok ? 'valid' : prior.reason}) — only unstamped drafts are tree-auto stamped`);
    }
    // M6: a stamp is good for 48h from NOW (the poster's staleness clock runs from the stamp time). A draft
    // scheduled further out than that would be stamped, go stale-looking later, or sit signed for days.
    const scheduled = Date.parse(item.scheduledAt);
    if (Number.isNaN(scheduled)) return refuse(`${relPath} has no valid scheduledAt`);
    if (scheduled - Date.parse(at) > MAX_SCHEDULE_AHEAD_MS) {
      return refuse(`${relPath} is scheduled more than 48h after the stamp time (${item.scheduledAt}) — a tree-auto stamp must not outlive the 48h window`);
    }
    items.push(item);
  }

  // Digest of the media BYTES, signed into the stamp (the content hash only covers the path strings).
  const readMedia =
    readMediaImpl ??
    ((media) => {
      try {
        return readFileSync(path.join(root, 'apps', 'web', 'public', media));
      } catch {
        return null;
      }
    });
  const digests = [];
  for (let i = 0; i < items.length; i += 1) {
    const digest = mediaDigest(items[i], readMedia);
    if (digest === null) return refuse(`${relPaths[i]} names a media file that cannot be read`);
    digests.push(digest);
  }

  const gate = checkDraftsImpl(relPaths, { root });
  if (!gate?.ok) return refuse(`trusted check-drafts did not pass${gate?.output ? `:\n${String(gate.output).trim()}` : ''}`);

  const stamped = [];
  relPaths.forEach((relPath, i) => {
    const unsigned = { v: 4, kind: TREE_AUTO_KIND, by: TREE_AUTO_BY, at, pr, message, contentHash: contentHash(items[i]), mediaDigest: digests[i] };
    const approval = { ...unsigned, sig: signApproval(unsigned, key) };
    writeFileImpl(path.join(root, relPath), JSON.stringify({ ...items[i], approval }, null, 2) + '\n');
    stamped.push(relPath);
  });
  return { ok: true, stamped };
}

function parseArgs(argv) {
  const out = { files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--pr') out.pr = Number(argv[++i]);
    else if (argv[i] === '--message') out.message = argv[++i];
    else out.files.push(argv[i]);
  }
  return out;
}

function main() {
  const { pr, message, files } = parseArgs(process.argv.slice(2));
  const result = stampTreeAuto(files, { pr, message, at: new Date().toISOString(), key: process.env.SOCIAL_APPROVAL_KEY });
  if (!result.ok) {
    console.error(`::error::stamp-tree-auto: ${result.reason}`);
    process.exit(1);
  }
  console.log(`stamp-tree-auto: stamped ${result.stamped.join(', ')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
