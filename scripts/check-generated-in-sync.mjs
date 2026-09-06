// Fails if a sync script errors, or if one of the still-COMMITTED generated
// artifacts (OTHER_SYNC_TARGETS) drifts from its seed files.
//
// OS-014 (2026-09-05, docs/specs/2026-09-05-one-source-three-surfaces.md §6):
// the eight `apps/web/lib/longlive/*.generated.ts` vault files (SYNC_TARGETS/
// GENERATED — content/tracks/theories/videos/era-secrets/song-moods/
// clownbot-lore/merch) are no longer committed to git (see .gitignore and
// docs/longlive-experience.md §9), so there is no committed copy for them to
// drift FROM any more — the "stale committed vault" bug this check used to
// guard against (the Photo Enrichment worker's seeds reaching the built
// vault) cannot happen when the vault is never committed: `prebuild` and CI
// both regenerate it fresh from supabase/seed/** on every build. This check
// still RUNS every sync script (SYNCS below), so a script that throws or
// hangs on the current seed data is still caught here rather than only at
// `next build` time.
//
// OTHER_SYNC_TARGETS (scripts/lib/source-tiers.generated.mjs,
// apps/web/app/tokens.generated.css) ARE still committed — plain-JS/CSS
// mirrors consumed by tooling that cannot import TypeScript directly — so
// those two keep the original drift check: regenerate, diff against HEAD,
// fail loudly on any difference.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// One manifest of "which files are generated content, by which script" — also
// read by scripts/check-automerge-allowlist.mjs, which proves the manifest
// matches what is actually on disk and that the auto-merge gate covers all of
// it. Do not re-list these here.
import { OTHER_SYNC_TARGETS, SYNCS } from './lib/generated-content.mjs';
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
  // Run every generator so a throwing/erroring sync script (bad seed data,
  // a broken generator) is still caught here, even though the longlive
  // *.generated.ts outputs themselves are no longer diffed against a
  // committed copy (there isn't one — see module doc above).
  for (const s of SYNCS) execSync(`node ${s}`, { stdio: ['ignore', 'ignore', 'inherit'] });
  for (const { sync } of OTHER_SYNC_TARGETS) execSync(`node ${sync}`, { stdio: ['ignore', 'ignore', 'inherit'] });

  // These outputs are multi-MB, so give git room past execSync's 1MB default.
  const MAX_BUFFER = 256 * 1024 * 1024;

  const drifted = [];
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
    console.error('\n✖ A committed generated artifact is out of sync with its source:');
    for (const f of drifted) console.error('    ' + f);
    console.error('\nA source under supabase/seed/** or packages/experience/src/tokens.ts was');
    console.error('edited without regenerating this artifact.');
    console.error('Fix: run `npm run sync:content`, then commit the updated file(s).\n');
    return 1;
  }
  console.log(
    '✓ every sync script ran clean; committed generated artifacts (tokens.generated.css, ' +
      'source-tiers.generated.mjs) are in sync with their sources',
  );
}

runMain(main, { name: 'check-generated-in-sync' });
