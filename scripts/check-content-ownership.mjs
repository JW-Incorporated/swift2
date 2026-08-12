// Guards `.github/content-ownership.json` — the CONTENT OWNERSHIP LOCK.
//
// WHY THIS EXISTS (2026-08-11, issue #1954): Joey hand-authors content into
// `supabase/seed/content/<era>.mjs` and the sibling corpora (theories/, tracks/,
// era-secrets/). The automated content fleet (Vault Run + its lanes) writes the
// SAME files daily and is not era-pinned — it roams. A founder and the fleet
// editing the same era file collide by construction. The lock lets a founder
// CLAIM an era so the fleet skips it, in two layers:
//
//   Layer 1 (STRONG, deterministic — the real lock):
//     * THIS validator, wired into `build`: the manifest must parse, every era
//       must be a real era slug, no era may be claimed twice, every owner must
//       be a known founder. A malformed manifest fails the PR here — it is
//       caught before it lands, never at fleet runtime.
//     * A gate in `.github/workflows/auto-merge-content.yml` (pure bash, mirrors
//       `evaluateGate` below): a PR that touches a CLAIMED era's seed files
//       auto-merges only if its author is that era's owner, or a human applied
//       the `ownership-override` label. Otherwise it waits for a human merge.
//
//   Layer 2 (soft, belt-and-suspenders): the Vault Run lane prompts read this
//     manifest and skip claimed eras at target selection. Prompt-compliance is
//     soft, which is exactly why Layer 1 is the real enforcement.
//
// FAIL-SAFE DIRECTION (hard requirement): a MISSING or EMPTY manifest means
// NOTHING is claimed and the fleet runs exactly as before. That is the correct
// default — a missing lock must NEVER halt content. A MALFORMED manifest fails
// THIS check at the PR (fail the PR, not the running fleet), so a broken lock is
// caught before merge. See the unit tests in check-content-ownership.test.ts,
// which prove the empty-manifest no-op.
//
// Exports the pure pieces (`parseManifest`, `validateManifest`, `fileEra`,
// `evaluateGate`, `eraSlugs`) for scripts/check-content-ownership.test.ts.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { eras } from '../supabase/seed/eras-data.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const MANIFEST_FILE = '.github/content-ownership.json';

/** The one label a human applies to let a non-owner PR through the lock. */
export const OVERRIDE_LABEL = 'ownership-override';

/** Canonical era slug set — derived from the real era table so it cannot drift. */
export function eraSlugs(eraTable = eras) {
  return new Set(eraTable.map((e) => e.slug));
}

/** The seed corpora an era claim covers (each is `supabase/seed/<corpus>/<era>*.mjs`). */
export const CLAIMED_CORPORA = ['content', 'theories', 'tracks', 'era-secrets'];

/**
 * The era a changed file belongs to, or null if it is not a per-era seed file.
 *
 * A per-era seed file is `supabase/seed/<corpus>/<era>.mjs` or
 * `supabase/seed/<corpus>/<era>.<suffix>.mjs` (e.g. `tracks/debut.dossiers.mjs`),
 * where <corpus> is one of CLAIMED_CORPORA. The era is the filename up to its
 * first `.`. Cross-era files (`supabase/seed/eras-data.mjs`) and non-seed paths
 * return null — a claim never locks them.
 *
 * This mirrors the shell logic in auto-merge-content.yml; keep them in step.
 */
export function fileEra(path) {
  const m = /^supabase\/seed\/([^/]+)\/([^/]+)\.mjs$/.exec(path);
  if (!m) return null;
  const [, corpus, base] = m;
  if (!CLAIMED_CORPORA.includes(corpus)) return null;
  const era = base.split('.')[0];
  if (!era || era.startsWith('_')) return null; // _example.mjs etc.
  return era;
}

/** Parse the manifest JSON. Throws a readable error on invalid JSON. */
export function parseManifest(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${MANIFEST_FILE} is not valid JSON: ${err.message}`, { cause: err });
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate the manifest SHAPE for `build`. Returns a list of human-readable
 * problems; empty means valid. Never throws on a well-typed-but-wrong manifest —
 * it collects every problem so one CI run reports them all.
 *
 * @param {unknown} manifest  parsed manifest object
 * @param {Set<string>} [slugs]  valid era slugs
 * @returns {string[]}
 */
export function validateManifest(manifest, slugs = eraSlugs()) {
  const problems = [];
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return [`${MANIFEST_FILE} must be a JSON object.`];
  }
  if (manifest.version !== 1) {
    problems.push(`${MANIFEST_FILE}: "version" must be 1 (got ${JSON.stringify(manifest.version)}).`);
  }

  const founders = manifest.founders;
  const founderKeys = new Set();
  if (founders === null || typeof founders !== 'object' || Array.isArray(founders)) {
    problems.push(`${MANIFEST_FILE}: "founders" must be an object mapping a founder key to an array of GitHub logins.`);
  } else {
    for (const [key, logins] of Object.entries(founders)) {
      founderKeys.add(key);
      if (!Array.isArray(logins) || logins.length === 0 || !logins.every((l) => typeof l === 'string' && l.length > 0)) {
        problems.push(`${MANIFEST_FILE}: founders["${key}"] must be a non-empty array of GitHub login strings.`);
      }
    }
    if (founderKeys.size === 0) {
      problems.push(`${MANIFEST_FILE}: "founders" is empty — no owner could ever be valid.`);
    }
  }

  const claims = manifest.claims;
  if (!Array.isArray(claims)) {
    problems.push(`${MANIFEST_FILE}: "claims" must be an array (use [] for "nothing claimed").`);
    return problems;
  }

  const seen = new Map();
  claims.forEach((claim, i) => {
    const at = `claims[${i}]`;
    if (claim === null || typeof claim !== 'object' || Array.isArray(claim)) {
      problems.push(`${MANIFEST_FILE}: ${at} must be an object with "era" and "owner".`);
      return;
    }
    if (typeof claim.era !== 'string' || !slugs.has(claim.era)) {
      problems.push(
        `${MANIFEST_FILE}: ${at}.era ${JSON.stringify(claim.era)} is not a real era slug (see supabase/seed/eras-data.mjs).`,
      );
    } else if (seen.has(claim.era)) {
      problems.push(`${MANIFEST_FILE}: ${at}.era "${claim.era}" is claimed twice (also ${seen.get(claim.era)}).`);
    } else {
      seen.set(claim.era, at);
    }
    if (typeof claim.owner !== 'string' || (founderKeys.size > 0 && !founderKeys.has(claim.owner))) {
      problems.push(
        `${MANIFEST_FILE}: ${at}.owner ${JSON.stringify(claim.owner)} is not a known founder key (${[...founderKeys].join(', ') || 'none defined'}).`,
      );
    }
    if (claim.note !== undefined && typeof claim.note !== 'string') {
      problems.push(`${MANIFEST_FILE}: ${at}.note must be a string when present.`);
    }
    if (claim.claimed !== undefined && (typeof claim.claimed !== 'string' || !ISO_DATE.test(claim.claimed))) {
      problems.push(`${MANIFEST_FILE}: ${at}.claimed must be an ISO date "YYYY-MM-DD" when present.`);
    }
  });

  return problems;
}

/**
 * THE RUNTIME GATE, as a pure function. Mirrors the bash block in
 * auto-merge-content.yml so the workflow and this module cannot drift.
 *
 * Decides whether a PR may auto-merge with respect to the ownership lock ONLY —
 * the caller still applies the path allowlist and every other gate.
 *
 * FAIL-SAFE: an empty/absent `claims` list yields `proceed` for ANY files and
 * ANY author — the empty-manifest no-op. Only a claimed era touched by a
 * non-owner without the override label yields `hold`.
 *
 * @param {object} input
 * @param {string[]} input.changedFiles      PR's changed repo-relative paths
 * @param {object}   input.manifest          parsed manifest (validated shape)
 * @param {string}   input.authorLogin       PR author's GitHub login
 * @param {boolean}  input.hasOverride       whether OVERRIDE_LABEL is applied
 * @returns {{ decision: 'proceed' | 'hold', blocked: {era: string, owner: string, files: string[]}[] }}
 */
export function evaluateGate({ changedFiles, manifest, authorLogin, hasOverride = false }) {
  const claims = manifest && Array.isArray(manifest.claims) ? manifest.claims : [];
  if (claims.length === 0) return { decision: 'proceed', blocked: [] };

  const founders = (manifest && manifest.founders) || {};
  const claimByEra = new Map(claims.map((c) => [c.era, c]));

  const byEra = new Map();
  for (const f of changedFiles) {
    const era = fileEra(f);
    if (era === null || !claimByEra.has(era)) continue;
    const claim = claimByEra.get(era);
    const ownerLogins = Array.isArray(founders[claim.owner]) ? founders[claim.owner] : [];
    if (ownerLogins.includes(authorLogin)) continue; // owner editing their own claim
    if (!byEra.has(era)) byEra.set(era, { era, owner: claim.owner, files: [] });
    byEra.get(era).files.push(f);
  }

  const blocked = [...byEra.values()];
  if (blocked.length === 0) return { decision: 'proceed', blocked: [] };
  if (hasOverride) return { decision: 'proceed', blocked }; // human waved it through
  return { decision: 'hold', blocked };
}

function main() {
  let text;
  try {
    text = readFileSync(join(ROOT, ...MANIFEST_FILE.split('/')), 'utf8');
  } catch (err) {
    // A MISSING manifest is the fail-safe default: nothing claimed. Not an error.
    if (err && err.code === 'ENOENT') {
      console.log(`✓ ${MANIFEST_FILE} absent — nothing claimed, content fleet runs normally.`);
      return;
    }
    throw err;
  }

  let manifest;
  try {
    manifest = parseManifest(text);
  } catch (err) {
    console.error(`\n✗ ${err.message}\n`);
    process.exit(1);
  }

  const problems = validateManifest(manifest);
  const claimCount = Array.isArray(manifest.claims) ? manifest.claims.length : 0;
  console.log(
    `content ownership: version ${JSON.stringify(manifest.version)}; ` +
      `${Object.keys(manifest.founders || {}).length} founder(s); ${claimCount} claim(s).`,
  );

  if (problems.length) {
    console.error(`\n✗ ${problems.length} content-ownership manifest problem(s):\n`);
    for (const p of problems) console.error(`  • ${p}`);
    console.error(
      '\nThis manifest is the CONTENT OWNERSHIP LOCK. A malformed lock is caught\n' +
        'HERE, at the PR — never at fleet runtime. Fix ' +
        MANIFEST_FILE +
        '; an empty\n"claims": [] is always valid and means "nothing claimed".\n',
    );
    process.exit(1);
  }
  console.log(`✓ ${MANIFEST_FILE} is a valid content ownership lock.`);
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-content-ownership.mjs')
) {
  main();
}
