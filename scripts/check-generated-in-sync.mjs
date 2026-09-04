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

// One manifest of "which files are generated content, by which script" — also
// read by scripts/check-automerge-allowlist.mjs, which proves the manifest
// matches what is actually on disk and that the auto-merge gate covers all of
// it. Do not re-list these here.
import { GENERATED, OTHER_SYNC_TARGETS, SYNCS } from './lib/generated-content.mjs';
import { runMain } from './lib/cli.mjs';

// A build stamp legitimately changes every run — not content drift.
//
// It ships as a THREE-line block: doc comment, the export, and a blank
// separator. Only `prebuild` emits it, so a vault committed straight from
// `sync:content` has no block at all — and the two forms must normalize to the
// same thing. Filtering just the `export` line does not achieve that: it leaves
// the orphaned comment and blank behind, so a stamped committed vault always
// differed from a freshly synced one and this check failed on EVERY branch,
// regardless of what the branch changed (2026-07-20). Strip the block whole.
const STAMP_BLOCK =
  /\/\*\* Build-time freshness stamp[^\n]*\*\/\nexport const [A-Z_]*GENERATED_AT\b[^\n]*\n\n?/g;
// Fallback for a bare stamp with no doc comment above it.
const VOLATILE = /^export const [A-Z_]*GENERATED_AT\b.*$/;
const normalize = (s) =>
  s
    .replace(/\r/g, '')
    .replace(STAMP_BLOCK, '')
    .split('\n')
    .filter((l) => !VOLATILE.test(l))
    .join('\n')
    .trimEnd();

async function main() {
  for (const s of SYNCS) execSync(`node ${s}`, { stdio: ['ignore', 'ignore', 'inherit'] });
  for (const { sync } of OTHER_SYNC_TARGETS) execSync(`node ${sync}`, { stdio: ['ignore', 'ignore', 'inherit'] });

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
  for (const { out } of OTHER_SYNC_TARGETS) {
    let committed;
    try {
      committed = execSync(`git show HEAD:${out}`, { encoding: 'utf8', maxBuffer: MAX_BUFFER });
    } catch (e) {
      drifted.push(`${out} (${/ENOENT|exists on disk|does not exist/.test(String(e)) ? 'missing from HEAD — commit it' : String(e.message || e).slice(0, 80)})`);
      continue;
    }
    if (normalize(committed) !== normalize(readFileSync(out, 'utf8'))) drifted.push(out);
  }

  if (drifted.length) {
    console.error('\n✖ The built vault is out of sync with the seed files:');
    for (const f of drifted) console.error('    ' + f);
    console.error('\nA seed under supabase/seed/** was edited without regenerating the vault.');
    console.error('Fix: run `npm run sync:content`, then commit the updated *.generated.ts.\n');
    return 1;
  }
  console.log('✓ built vault is in sync with the seeds');
}

runMain(main, { name: 'check-generated-in-sync' });
