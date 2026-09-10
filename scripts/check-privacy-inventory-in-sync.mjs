// `check:privacy-inventory` — fails if
// `apps/mobile/docs/privacy-and-data-safety.md`'s GENERATED block has
// drifted from what `apps/web/lib/longlive/data-inventory.ts` would
// currently produce (someone hand-edited the paste-ready answers, or
// changed the inventory without regenerating). Mirrors the idiom in
// `scripts/check-affiliate-coverage-in-sync.mjs`.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOC_FILE, withRegeneratedBlock } from './generate-mobile-privacy-doc.mjs';
import { runMain } from './lib/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const path = resolve(ROOT, DOC_FILE);
  const committed = readFileSync(path, 'utf8');
  const regenerated = withRegeneratedBlock(committed);
  if (committed !== regenerated) {
    console.error(`✖ ${DOC_FILE}'s GENERATED block is out of sync with the data inventory.`);
    console.error('Fix: run `npm run privacy:mobile-doc` and commit the result.');
    return 1;
  }
  console.log('✓ mobile privacy doc is in sync with the data inventory');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'check-privacy-inventory-in-sync' });
}
