import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const COVERAGE_FILE = 'docs/ops/AFFILIATE-COVERAGE.md';

export function isCoverageInSync(committed, generated) {
  return committed.replace(/\r/g, '') === generated.replace(/\r/g, '');
}

function main() {
  const output = resolve(ROOT, COVERAGE_FILE);
  const committed = readFileSync(output, 'utf8');
  execFileSync('npm', ['run', 'merch:coverage', '--silent'], { cwd: ROOT, stdio: 'inherit' });
  const generated = readFileSync(output, 'utf8');
  if (!isCoverageInSync(committed, generated)) {
    console.error(`✖ ${COVERAGE_FILE} is out of sync with the merchandise catalogue.`);
    console.error('Fix: run `npm run merch:coverage` and commit the regenerated report.');
    process.exit(1);
  }
  console.log('✓ affiliate coverage report is in sync with the catalogue');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
