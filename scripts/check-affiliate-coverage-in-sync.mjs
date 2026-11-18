import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from './lib/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const COVERAGE_FILE = 'docs/ops/AFFILIATE-COVERAGE.md';

export function isCoverageInSync(committed, generated) {
  return committed.replace(/\r/g, '') === generated.replace(/\r/g, '');
}

/**
 * The baseline comes from git, NOT from the working copy — issue #6950.
 *
 * #6948 fixed the staleness of this report by making its generator the last
 * step of `sync:content`. That also silently neutered this gate: ci.yml's
 * `build-full` runs `sync:content` (:85) long before `check:affiliate-coverage`
 * (:135), and routine-vault-run.yml's publish job syncs before its gate too,
 * so by the time this script ran the "committed" file it read off disk had
 * ALREADY been regenerated. It diffed the fresh report against itself and
 * could never fail, however stale the commit was. Read what is actually
 * committed instead — the same `git show HEAD:` idiom check:generated uses,
 * which is immune to any earlier in-place regeneration.
 */
export function readCommittedCoverage(show = gitShow) {
  try {
    return show(`HEAD:${COVERAGE_FILE}`);
  } catch (error) {
    throw new Error(
      `${COVERAGE_FILE} is missing from HEAD — commit it (${String(error?.message ?? error).slice(0, 120)})`,
      { cause: error },
    );
  }
}

function gitShow(ref) {
  return execFileSync('git', ['show', ref], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function main() {
  const committed = readCommittedCoverage();
  execFileSync('npm', ['run', 'merch:coverage', '--silent'], { cwd: ROOT, stdio: 'inherit' });
  const generated = readFileSync(resolve(ROOT, COVERAGE_FILE), 'utf8');
  if (!isCoverageInSync(committed, generated)) {
    console.error(`✖ ${COVERAGE_FILE} is out of sync with the merchandise catalogue.`);
    console.error('Fix: run `npm run merch:coverage` and commit the regenerated report.');
    return 1;
  }
  console.log('✓ affiliate coverage report is in sync with the catalogue');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'check-affiliate-coverage-in-sync' });
}
