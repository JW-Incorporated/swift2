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
 * order (song-moods reads the track seeds, so it goes last).
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
  { sync: 'scripts/sync-clownbot-lore.mjs', out: `${GENERATED_DIR}/clownbot-lore.generated.ts` },
  { sync: 'scripts/sync-longlive-merch.mjs', out: `${GENERATED_DIR}/merch.generated.ts` },
  { sync: 'scripts/sync-longlive-lenses.mjs', out: `${GENERATED_DIR}/lenses.generated.ts` },
];

/** Repo-relative POSIX paths of the generated artifacts, in sync order. */
export const GENERATED = SYNC_TARGETS.map((t) => t.out);

/** Repo-relative POSIX paths of the sync scripts, in run order. */
export const SYNCS = SYNC_TARGETS.map((t) => t.sync);

/**
 * Generated artifacts OUTSIDE the Long Live UI content vault
 * (GENERATED_DIR/GENERATED_SUFFIX above) — deliberately a separate list from
 * SYNC_TARGETS, because that one also drives the content auto-merge
 * allowlist check (scripts/check-automerge-allowlist.mjs), which is scoped
 * to `apps/web/lib/longlive/*.generated.ts` specifically. This list is
 * consumed only by scripts/check-generated-in-sync.mjs (`check:generated`),
 * which regenerates + diffs each entry the same way.
 *
 * - scripts/lib/source-tiers.generated.mjs (scripts/sync-source-tiers.mjs) —
 *   the plain-JS mirror of packages/shared/src/source-tiers.ts's DATA
 *   constants (R9, Fable 5.1 review); scripts/**\/*.mjs run under plain
 *   `node` with no compile step and cannot import the .ts module directly.
 */
export const OTHER_SYNC_TARGETS = [
  { sync: 'scripts/sync-source-tiers.mjs', out: 'scripts/lib/source-tiers.generated.mjs' },
];

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
