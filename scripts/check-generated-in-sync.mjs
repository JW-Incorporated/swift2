// Fails if any Long Live *.generated.ts drifts from its seed files.
//
// The built vault the app imports (apps/web/lib/longlive/*.generated.ts) is
// DERIVED from supabase/seed/** by the sync scripts. Editing a seed without
// regenerating leaves the committed/deployed data stale — the bug where the
// Photo Enrichment worker added photos and focal points to seeds that never
// reached the built vault. This guard makes that a red CI check for everyone,
// bot or human, so a stale-vault PR can't merge.
//
// The comparison ignores two non-signal differences: the CONTENT_GENERATED_AT
// build timestamp (changes every run by design; freshness.ts reads it) and
// CR line endings (Windows checkouts) — everything else must match.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const GENERATED = [
  'apps/web/lib/longlive/content-vault.generated.ts',
  'apps/web/lib/longlive/tracks.generated.ts',
  'apps/web/lib/longlive/theories.generated.ts',
  'apps/web/lib/longlive/videos.generated.ts',
];
const SYNCS = [
  'scripts/sync-longlive-content.mjs',
  'scripts/sync-longlive-tracks.mjs',
  'scripts/sync-longlive-theories.mjs',
  'scripts/sync-longlive-videos.mjs',
];

// A build stamp legitimately changes every run — not content drift.
const VOLATILE = /^export const [A-Z_]*GENERATED_AT\b.*$/;
const normalize = (s) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => !VOLATILE.test(l))
    .join('\n');

for (const s of SYNCS) execSync(`node ${s}`, { stdio: ['ignore', 'ignore', 'inherit'] });

// The generated vault is multi-MB, so give git room past execSync's 1MB default.
const MAX_BUFFER = 256 * 1024 * 1024;

const drifted = [];
for (const f of GENERATED) {
  let committed;
  try {
    committed = execSync(`git show HEAD:${f}`, { encoding: 'utf8', maxBuffer: MAX_BUFFER });
  } catch (e) {
    drifted.push(`${f} (${/ENOENT|exists on disk|does not exist/.test(String(e)) ? 'missing from HEAD — commit it' : String(e.message || e).slice(0, 80)})`);
    continue;
  }
  if (normalize(committed) !== normalize(readFileSync(f, 'utf8'))) drifted.push(f);
}

if (drifted.length) {
  console.error('\n✖ The built vault is out of sync with the seed files:');
  for (const f of drifted) console.error('    ' + f);
  console.error('\nA seed under supabase/seed/** was edited without regenerating the vault.');
  console.error('Fix: run `npm run sync:content`, then commit the updated *.generated.ts.\n');
  process.exit(1);
}
console.log('✓ built vault is in sync with the seeds');
