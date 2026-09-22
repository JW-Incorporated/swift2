// The decision half of Vercel's Ignored Build Step (see
// scripts/vercel-ignore-build.mjs for the CLI that git-diffs and calls this,
// and apps/web/vercel.json's `ignoreCommand` for the wiring).
//
// WHY: measured 2026-09-21 against Vercel's own deployment list — 240 builds
// in 6.13 days (39/day, ~1,175/month) at a 53s mean, ~980 build-minutes a
// month. 171 of those 240 were PREVIEW builds, and the branches that produce
// them are mostly bots committing files the deployment cannot serve:
// `news-digest` (48 builds, only `docs/content-ops/**`), `social-ledger`
// (16, only `social/**`). Every push to every branch builds by default, so
// the ledger churn alone is most of a thousand builds a month.
//
// THE ASYMMETRY THAT DICTATES THE SHAPE: this is a DENY-LIST that FAILS
// OPEN, never an allow-list. An allow-list would have to mirror the build's
// real input set (supabase/seed/**, packages/**, scripts/**, apps/web/**,
// package*.json — see the prebuild chain in apps/web/package.json), and the
// moment it drifts it silently stops deploying a file that has started
// mattering: a production 404 nobody sees until a user hits it. A deny-list
// that drifts merely costs a build nobody needed. So: only paths PROVEN
// inert are listed, and anything unrecognised builds.
//
// The inert set was verified, not assumed: no code on the build path reads
// `docs/**` or `social/**` (the prebuild sync scripts read `supabase/seed/**`
// and `packages/shared/src/source-tiers.ts`; `apps/web/lib/longlive/
// read-bundle-artifact.ts` reads `apps/web/public/content/**`), and
// `apps/web` references `apps/mobile` only inside comments.

/**
 * Paths whose contents cannot change what Vercel serves. Each entry is a
 * directory prefix (matched on a `/` boundary, so `docsite/x` never matches
 * `docs`) or an exact file path.
 */
export const INERT_PREFIXES = Object.freeze([
  'docs/',
  'social/',
  'apps/mobile/',
  '.github/',
  '.claude/',
  'e2e/',
]);

/** Root-level files that are documentation or agent scaffolding only. */
export const INERT_ROOT_FILE = /^[A-Za-z0-9._-]+\.md$/;

export const BUILD = { build: true };

/** A changed path is inert only if it matches the deny-list exactly. */
export function isInertPath(file) {
  if (typeof file !== 'string' || file.trim() === '') return false;
  const path = file.replace(/\\/g, '/').replace(/^\.\//, '');
  if (path.startsWith('/') || path.includes('..')) return false;
  if (!path.includes('/')) return INERT_ROOT_FILE.test(path);
  return INERT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * The whole decision, as a pure function so every fail-open case is testable
 * without a git repo.
 *
 * @param {object} input
 * @param {string|null|undefined} input.vercelEnv - VERCEL_ENV.
 * @param {string[]|null|undefined} input.files - changed paths, or null when
 *   the diff could not be taken at all (no git, unknown base, shallow clone).
 * @param {string|null|undefined} input.diffError - why the diff failed.
 * @returns {{build: boolean, reason: string}}
 */
export function decide({ vercelEnv, files, diffError } = {}) {
  if (vercelEnv === 'production') {
    return { build: true, reason: 'production always builds' };
  }
  if (diffError) {
    return { build: true, reason: `diff unavailable (${diffError}) — failing open` };
  }
  if (!Array.isArray(files)) {
    return { build: true, reason: 'no file list — failing open' };
  }
  if (files.some((f) => typeof f !== 'string')) {
    return { build: true, reason: 'file list held a non-string entry — failing open' };
  }
  // git diff --name-only always ends in a newline, so a trailing '' is normal.
  const changed = files.map((f) => f.trim()).filter(Boolean);
  if (changed.length === 0) {
    return { build: true, reason: 'empty diff — failing open' };
  }
  const live = changed.filter((f) => !isInertPath(f));
  if (live.length > 0) {
    return { build: true, reason: `${live.length} of ${changed.length} changed paths can affect the deployment (e.g. ${live[0]})` };
  }
  return { build: false, reason: `all ${changed.length} changed paths are documentation/ledger/mobile-only` };
}
