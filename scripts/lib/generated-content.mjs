// The manifest of Long Live's build-time generated content artifacts.
//
// ONE place names every `apps/web/lib/longlive/*.generated.ts` and the sync
// script that emits it. Everything that needs to know "which files are
// generated content?" imports from here instead of keeping its own copy:
//
//   - scripts/check-generated-in-sync.mjs  — regenerates and diffs them
//   - scripts/check-automerge-allowlist.mjs — proves each one is covered by
//     `.github/content-automerge-allowlist.txt` (or explicitly excluded)
//
// Why: the auto-merge allowlist kept its own hand-typed copy of this list and
// silently fell three files behind (theories / videos / song-moods). PRs
// touching those could never auto-merge, and the workflow said nothing —
// it just exited 0. See docs/decisions.md 2026-08-11.
//
// `listGeneratedOnDisk()` is the ground truth: the checker asserts the
// manifest below matches it exactly, so adding a sixth generated file without
// updating this manifest is a red CI check, not a week of a stuck PR.

import { readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Repo-relative POSIX directory holding the built vault modules. */
export const GENERATED_DIR = 'apps/web/lib/longlive';
export const GENERATED_SUFFIX = '.generated.ts';

/**
 * Every generated content artifact, paired with the script that writes it.
 * Order matters: `check:generated` / `sync:content` run the syncs in this
 * order (song-moods reads the track seeds, so it goes last; clownbot-lore
 * goes after that since it has no seed-order dependency).
 *
 * `clownbot-lore.ts` (added 2026-09, Fable ruling FR-t_2745eb60-1, #3515) is
 * a generated artifact like the rest, but deliberately keeps its pre-existing
 * filename rather than moving to `*.generated.ts` — many display modules
 * already `import ... from './clownbot-lore'`, and the ruling's whole point
 * was "preserve the generated artifact's shape". `listGeneratedOnDisk()`
 * below only globs `*.generated.ts` for that reason, so it does NOT discover
 * this file automatically; `check-automerge-allowlist.mjs`'s "manifest
 * matches disk" check still covers it because it unions `generatedOnDisk`
 * with every `SYNC_TARGETS` `out` path, not just the glob.
 */
export const SYNC_TARGETS = [
  { sync: 'scripts/sync-longlive-content.mjs', out: `${GENERATED_DIR}/content-vault.generated.ts` },
  { sync: 'scripts/sync-longlive-tracks.mjs', out: `${GENERATED_DIR}/tracks.generated.ts` },
  { sync: 'scripts/sync-longlive-theories.mjs', out: `${GENERATED_DIR}/theories.generated.ts` },
  { sync: 'scripts/sync-longlive-videos.mjs', out: `${GENERATED_DIR}/videos.generated.ts` },
  {
    sync: 'scripts/sync-longlive-era-secrets.mjs',
    out: `${GENERATED_DIR}/era-secrets.generated.ts`,
  },
  { sync: 'scripts/sync-song-moods.mjs', out: `${GENERATED_DIR}/song-moods.generated.ts` },
  { sync: 'scripts/sync-clownbot-lore.mjs', out: `${GENERATED_DIR}/clownbot-lore.ts` },
];

/** Repo-relative POSIX paths of the generated artifacts, in sync order. */
export const GENERATED = SYNC_TARGETS.map((t) => t.out);

/** Repo-relative POSIX paths of the sync scripts, in run order. */
export const SYNCS = SYNC_TARGETS.map((t) => t.sync);

/**
 * Ground truth: every `*.generated.ts` actually present in GENERATED_DIR,
 * as repo-relative POSIX paths, sorted. Used to prove SYNC_TARGETS is complete.
 */
export function listGeneratedOnDisk(root = ROOT) {
  const dir = join(root, ...GENERATED_DIR.split('/'));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(GENERATED_SUFFIX))
    .map((f) => `${GENERATED_DIR}/${f}`)
    .sort();
}
