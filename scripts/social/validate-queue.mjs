#!/usr/bin/env node
// Schema gate for social/queue/**.json. Runs in CI (npm run validate:social,
// wired into .github/workflows/ci.yml's `build` job, which is the required
// check on main), so a malformed queue item fails on the PR that adds it
// instead of on the timeline at 23:00 UTC three attempts later.
//
// See lib/queue-schema.mjs for the rules and — importantly — for the
// evidence behind the X 280-character rule, which retroactively explains all
// eleven X items sitting in social/failed/.
//
// Also parses every file, so an unparseable JSON draft (a truncated write, a
// trailing comma) is caught here rather than crashing post-queue.mjs mid-run
// and taking the whole run's other posts down with it.
//
//   node scripts/social/validate-queue.mjs            # social/queue/
//   node scripts/social/validate-queue.mjs <dir>…     # explicit dirs
//
// Exits non-zero with a readable findings list if anything fails.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validatePhotoInventoryBinding, validateQueueItem } from './lib/queue-schema.mjs';
import { approvalStatus } from './lib/queue.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const photoLibrary = JSON.parse(await readFile(path.join(ROOT, 'social', 'photo-library.json'), 'utf8')).photos;

/** Validates every *.json in `dir`. `failures` are hard CI failures;
 * `warnings` (unstamped drafts — see below) never are. */
export async function validateDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return { checked: 0, failures: [], warnings: [] };
  }

  const failures = [];
  const warnings = [];
  for (const file of files.sort()) {
    const full = path.join(dir, file);
    const raw = await readFile(full, 'utf-8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      failures.push({ file, findings: [`unparseable JSON: ${err.message ?? err}`] });
      continue;
    }
    const findings = [...validateQueueItem(data), ...validatePhotoInventoryBinding(data, photoLibrary)];
    if (findings.length) failures.push({ file, findings });
    // docs/social/RULINGS-SOCIAL.md A6 ("validate-queue prints unstamped drafts as
    // warnings") — every draft legitimately arrives with no `approval` at
    // all (it's only written by the merge-triggered stamper, AFTER this
    // PR merges), so this is a WARNING, never a hard failure; it never adds
    // to `failures`/the non-zero exit. This is exactly the list that would
    // have named the four pre-gate drafts on #4090 before A1 deleted them.
    const approval = approvalStatus(data, { approvers: SOCIAL_APPROVERS });
    if (!approval.ok) warnings.push({ file, reason: approval.reason });
  }
  return { checked: files.length, failures, warnings };
}

async function main() {
  const dirs = process.argv.slice(2).map((d) => (path.isAbsolute(d) ? d : path.resolve(ROOT, d)));
  if (!dirs.length) dirs.push(path.join(ROOT, 'social', 'queue'));

  let checked = 0;
  let failed = 0;
  let unstamped = 0;
  for (const dir of dirs) {
    const result = await validateDir(dir);
    checked += result.checked;
    failed += result.failures.length;
    unstamped += result.warnings.length;
    for (const { file, findings } of result.failures) {
      console.error(`\nFAIL ${path.relative(ROOT, path.join(dir, file)).replace(/\\/g, '/')}`);
      for (const finding of findings) console.error(`  - ${finding}`);
    }
    for (const { file, reason } of result.warnings) {
      console.warn(`WARN ${path.relative(ROOT, path.join(dir, file)).replace(/\\/g, '/')} — unstamped draft (will not post until a founder merge stamps it): ${reason}`);
    }
  }

  if (failed) {
    console.error(`\nvalidate-queue: ${failed} of ${checked} queue item(s) are invalid — see above.`);
    process.exit(1);
  }
  console.log(`validate-queue: ${checked} queue item(s) OK (${unstamped} unstamped — see warnings above).`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`validate-queue: crashed: ${err.stack ?? err}`);
    process.exit(1);
  });
}
