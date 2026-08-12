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
import { validateQueueItem } from './lib/queue-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Validates every *.json in `dir`. Returns [{ file, findings }] for failures only. */
export async function validateDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return { checked: 0, failures: [] };
  }

  const failures = [];
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
    const findings = validateQueueItem(data);
    if (findings.length) failures.push({ file, findings });
  }
  return { checked: files.length, failures };
}

async function main() {
  const dirs = process.argv.slice(2).map((d) => (path.isAbsolute(d) ? d : path.resolve(ROOT, d)));
  if (!dirs.length) dirs.push(path.join(ROOT, 'social', 'queue'));

  let checked = 0;
  let failed = 0;
  for (const dir of dirs) {
    const result = await validateDir(dir);
    checked += result.checked;
    failed += result.failures.length;
    for (const { file, findings } of result.failures) {
      console.error(`\nFAIL ${path.relative(ROOT, path.join(dir, file)).replace(/\\/g, '/')}`);
      for (const finding of findings) console.error(`  - ${finding}`);
    }
  }

  if (failed) {
    console.error(`\nvalidate-queue: ${failed} of ${checked} queue item(s) are invalid — see above.`);
    process.exit(1);
  }
  console.log(`validate-queue: ${checked} queue item(s) OK.`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`validate-queue: crashed: ${err.stack ?? err}`);
    process.exit(1);
  });
}
