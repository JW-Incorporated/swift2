// Dependency-downgrade guard — fails CI if any dependency version DECREASES
// versus the base branch (`main`).
//
// THE BUG THIS EXISTS FOR (2026-08-11, PR #1903). #1903 branched from a base
// that predated #1893's `brace-expansion 5.0.7 -> 5.0.9` security bump, then
// regenerated `package-lock.json` from that stale tree. Its own CI was green.
// When it squash-merged, it silently rewrote `brace-expansion` back to `5.0.7`
// on `main` — reverting the fix and re-opening the CVE — with a green check and
// nobody looking (#1933 is the cleanup). nanoid regressed the same way.
//
// A per-PR check that only looks at the PR's own diff cannot catch this: #1903's
// diff was internally consistent. The regression only exists RELATIVE TO what
// `main` had grown to while the PR sat open. So this guard compares the merge
// result's lockfile against the CURRENT base branch and fails if any package's
// highest resolved version went DOWN. That is the exact guarantee that makes
// auto-merge safe against merge-order regressions: a stale lockfile can no
// longer land a silent downgrade the moment `build` goes green.
//
// WHY "highest version per package name": a security fix raises a version. If a
// package name still resolves in the head tree but its greatest version is lower
// than on `main`, a fix present on `main` is missing from the merge result —
// which is precisely the #1903 failure. New packages (absent on `main`) and
// fully-removed packages (absent in head) are ignored; only a genuine decrease
// of something that exists on both sides trips the guard.
//
// INTENTIONAL downgrades (e.g. reverting a bad major that broke the build) are
// legitimate but must never be silent: add an entry to
// `.github/dependency-downgrade-allowlist.json` with a reason and approver. That
// file lives under `.github/`, which `NEVER_ALLOWLIST` bars from content
// auto-merge — so a downgrade exception itself always gets a human, by
// construction. That is the fail-safe direction: the guard blocks by default and
// a human is the only way to say "yes, down is correct here".
//
// Exit codes: 0 = no downgrades; 1 = downgrade(s) found (blocks `build`);
// 2 = BROKEN GATE (could not read/parse a lockfile or the allowlist) — a
// malfunction, kept distinct from a clean pass so "the check broke" can never be
// reported as "nothing regressed".
//
// Exports the pure core (`parseLockVersions`, `parseVersion`, `compareVersions`,
// `findDowngrades`) for scripts/check-no-downgrade.test.ts.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export const LOCKFILE = 'package-lock.json';
export const ALLOWLIST_FILE = '.github/dependency-downgrade-allowlist.json';

/**
 * Parse a semver string into comparable parts. Lockfile versions are always
 * concrete (`1.2.3`, `1.2.3-beta.1`, `1.2.3+build`), but we tolerate a leading
 * `v` and build metadata (ignored for ordering, per semver §10).
 *
 * @param {string} v
 * @returns {{release: number[], pre: (string|number)[]} | null} null if unparseable
 */
export function parseVersion(v) {
  if (typeof v !== 'string') return null;
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(v.trim());
  if (!m) return null;
  const release = [Number(m[1]), Number(m[2]), Number(m[3])];
  const pre = m[4]
    ? m[4].split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id))
    : [];
  return { release, pre };
}

/**
 * Semver precedence. Returns <0 if a<b, 0 if equal, >0 if a>b. Throws if either
 * side is unparseable, so a malformed lockfile is a BROKEN GATE rather than a
 * silently-wrong comparison.
 */
export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa) throw new Error(`unparseable version: ${JSON.stringify(a)}`);
  if (!pb) throw new Error(`unparseable version: ${JSON.stringify(b)}`);
  for (let i = 0; i < 3; i++) {
    if (pa.release[i] !== pb.release[i]) return pa.release[i] - pb.release[i];
  }
  // A version WITH a prerelease has lower precedence than one without (§11.3).
  if (pa.pre.length === 0 && pb.pre.length === 0) return 0;
  if (pa.pre.length === 0) return 1;
  if (pb.pre.length === 0) return -1;
  const n = Math.min(pa.pre.length, pb.pre.length);
  for (let i = 0; i < n; i++) {
    const x = pa.pre[i];
    const y = pb.pre[i];
    if (x === y) continue;
    const xNum = typeof x === 'number';
    const yNum = typeof y === 'number';
    if (xNum && yNum) return x - y;
    if (xNum) return -1; // numeric identifiers are lower than alphanumeric
    if (yNum) return 1;
    return x < y ? -1 : 1;
  }
  return pa.pre.length - pb.pre.length;
}

/** Package name from a lockfile-v3 key: the segment after the LAST `node_modules/`. */
function nameFromKey(key) {
  const idx = key.lastIndexOf('node_modules/');
  if (idx === -1) return null; // a local workspace dir (e.g. `apps/web`), not a dep
  return key.slice(idx + 'node_modules/'.length);
}

/**
 * Map every dependency NAME to the HIGHEST concrete version present in a
 * lockfile-v3 `packages` object. Unparseable/missing versions are collected
 * separately so the caller can decide whether to treat them as a broken gate.
 *
 * @param {object} lock  parsed package-lock.json
 * @returns {{versions: Map<string,string>, unparsed: {name:string, version:string}[]}}
 */
export function parseLockVersions(lock) {
  if (!lock || typeof lock !== 'object' || typeof lock.packages !== 'object' || !lock.packages) {
    throw new Error('lockfile has no `packages` map (expected lockfileVersion 2/3)');
  }
  const versions = new Map();
  const unparsed = [];
  for (const [key, meta] of Object.entries(lock.packages)) {
    if (key === '') continue; // the root project
    const name = nameFromKey(key);
    if (!name) continue; // local workspace, not a registry dependency
    const version = meta && meta.version;
    if (version == null) continue; // link:/file: entries carry no version
    if (!parseVersion(version)) {
      unparsed.push({ name, version: String(version) });
      continue;
    }
    const prev = versions.get(name);
    if (prev === undefined || compareVersions(version, prev) > 0) {
      versions.set(name, version);
    }
  }
  return { versions, unparsed };
}

/**
 * Core comparison. Pure — no I/O — so tests drive it directly.
 *
 * @param {object} baseLock  parsed lockfile from the base branch (`main`)
 * @param {object} headLock  parsed lockfile from the merge result / working tree
 * @param {{name:string, to:string, reason?:string}[]} [allowlist]
 * @returns {{name:string, from:string, to:string, allowed:boolean, reason?:string}[]}
 *          every DECREASE, each flagged allowed/blocked. Sorted by name.
 */
export function findDowngrades(baseLock, headLock, allowlist = []) {
  const base = parseLockVersions(baseLock).versions;
  const head = parseLockVersions(headLock).versions;
  const allowByName = new Map();
  for (const e of allowlist) {
    if (e && typeof e.name === 'string') allowByName.set(e.name, e);
  }
  const out = [];
  for (const [name, baseVer] of base) {
    const headVer = head.get(name);
    if (headVer === undefined) continue; // removed entirely — not a downgrade
    if (compareVersions(headVer, baseVer) < 0) {
      const ex = allowByName.get(name);
      // An exception applies only if it names this exact landing version, so a
      // stale exception can't wave through a DIFFERENT downgrade of the same dep.
      const allowed = !!ex && typeof ex.to === 'string' && compareVersions(headVer, ex.to) === 0;
      out.push({ name, from: baseVer, to: headVer, allowed, reason: ex && ex.reason });
    }
  }
  out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return out;
}

// ── I/O edge (only runs when invoked as a script) ───────────────────────────

function readJson(path, label) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    throw new BrokenGate(`could not read ${label} (${path}): ${e.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new BrokenGate(`could not parse ${label} (${path}): ${e.message}`);
  }
}

function readBaseLockFromGit(ref) {
  let raw;
  try {
    raw = execFileSync('git', ['show', `${ref}:${LOCKFILE}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    throw new BrokenGate(
      `could not read ${LOCKFILE} from base ref '${ref}': ${e.message}. ` +
        `In CI, fetch the base first: \`git fetch --no-tags --depth=1 origin main\` then pass \`--base-ref FETCH_HEAD\`.`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new BrokenGate(`could not parse ${LOCKFILE} from base ref '${ref}': ${e.message}`);
  }
}

class BrokenGate extends Error {}

function loadAllowlist() {
  let text;
  try {
    text = readFileSync(ALLOWLIST_FILE, 'utf8');
  } catch {
    return []; // absent allowlist == no exceptions, which is the safe default
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new BrokenGate(`could not parse ${ALLOWLIST_FILE}: ${e.message}`);
  }
  const entries = Array.isArray(json) ? json : json && json.exceptions;
  if (!Array.isArray(entries)) {
    throw new BrokenGate(`${ALLOWLIST_FILE} must be a JSON array (or {"exceptions": [...]})`);
  }
  for (const e of entries) {
    if (!e || typeof e.name !== 'string' || typeof e.to !== 'string' || !e.reason) {
      throw new BrokenGate(
        `${ALLOWLIST_FILE}: every entry needs { "name", "to", "reason" } (got ${JSON.stringify(e)})`,
      );
    }
  }
  return entries;
}

function main(argv) {
  let baseRef = 'origin/main';
  let baseFile = null;
  let headFile = LOCKFILE;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base-ref') baseRef = argv[++i];
    else if (a === '--base-file') baseFile = argv[++i];
    else if (a === '--head-file') headFile = argv[++i];
    else {
      console.error(`Unknown argument: ${a}`);
      return 2;
    }
  }

  try {
    const baseLock = baseFile ? readJson(baseFile, 'base lockfile') : readBaseLockFromGit(baseRef);
    const headLock = readJson(headFile, 'head lockfile');
    const allowlist = loadAllowlist();
    const downgrades = findDowngrades(baseLock, headLock, allowlist);

    const blocked = downgrades.filter((d) => !d.allowed);
    const waved = downgrades.filter((d) => d.allowed);

    if (waved.length) {
      console.log(`Allowed (documented in ${ALLOWLIST_FILE}):`);
      for (const d of waved) console.log(`  ~ ${d.name}: ${d.from} -> ${d.to} — ${d.reason}`);
    }

    if (blocked.length === 0) {
      console.log(`check:no-downgrade — OK. No un-allowlisted dependency version decreased vs ${baseFile ?? baseRef}.`);
      return 0;
    }

    console.error(
      `\ncheck:no-downgrade — FAIL. ${blocked.length} dependency version(s) DECREASED vs ${baseFile ?? baseRef}:\n`,
    );
    for (const d of blocked) console.error(`  ✗ ${d.name}: ${d.from} -> ${d.to}`);
    console.error(
      `\nThis is the #1903 failure class: a lockfile regenerated from a stale base can silently\n` +
        `revert a version bump (a security fix among them). If the decrease is INTENTIONAL, add an\n` +
        `entry to ${ALLOWLIST_FILE} with a reason and approver — it will get a human review, because\n` +
        `${ALLOWLIST_FILE} is barred from auto-merge. Otherwise, rebase on main and regenerate the lockfile.`,
    );
    return 1;
  } catch (e) {
    if (e instanceof BrokenGate) {
      console.error(`check:no-downgrade — BROKEN GATE: ${e.message}`);
      return 2;
    }
    console.error(`check:no-downgrade — BROKEN GATE (unexpected): ${e.stack || e.message}`);
    return 2;
  }
}

// Only run when executed directly, never on import (tests import the pure fns).
// Same suffix-match pattern the sibling checkers use (Windows-path safe).
if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-no-downgrade.mjs')
) {
  process.exit(main(process.argv.slice(2)));
}
