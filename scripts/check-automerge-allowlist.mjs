// Guards `.github/content-automerge-allowlist.txt` — the list of paths a bot PR
// may touch and still merge with no human review.
//
// THE BUG THIS EXISTS FOR (2026-08-11): the allowlist used to be typed inline in
// `.github/workflows/auto-merge-content.yml`. `apps/web/lib/longlive/` grew from
// two generated files to five; nobody updated the workflow. Every content PR
// touching theories / videos / song-moods therefore hit the "non-content path"
// branch — which prints a line and `exit 0`s, so the check reported SUCCESS and
// nothing looked broken. PRs #1891 and #1762 sat open for a week.
//
// The missing entries were the symptom. The defect was a hand-maintained list
// that could desync from what the generators emit with no signal at all. So:
//
//   1. The allowlist now lives in ONE file, which the workflow reads at runtime
//      (from `main`, via the API — a PR cannot widen its own gate). No copy.
//   2. This check proves that file stays honest, and FAILS LOUDLY in `build`:
//      every generated artifact must be listed here or explicitly excluded,
//      every entry must point at something real, and the workflow must still be
//      reading the file rather than a re-inlined copy.
//
// What it deliberately does NOT do: decide whether a path *deserves* to be
// auto-mergeable. Widening the allowlist to app code would pass this check.
// That is a human policy call — see the warning header in the allowlist file.
//
// Exports the pure pieces (`parseAllowlist`, `checkAllowlist`, `EXCLUDED`) for
// scripts/check-automerge-allowlist.test.ts.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SYNC_TARGETS, listGeneratedOnDisk } from './lib/generated-content.mjs';

export const ALLOWLIST_FILE = '.github/content-automerge-allowlist.txt';
export const WORKFLOW_FILE = '.github/workflows/auto-merge-content.yml';

/**
 * Generated artifacts deliberately kept OUT of the allowlist, keyed by
 * repo-relative POSIX path with the reason. Empty today: all five generated
 * vault modules are pure functions of supabase/seed/**, so a content PR that
 * regenerates one is exactly as reviewed as the seed edit that caused it.
 *
 * Add an entry here (never just omit a file) if some future generated artifact
 * should keep needing a human — e.g. one derived from something other than the
 * seeds. Every entry must name a file that exists, so this cannot rot.
 *
 * @type {Record<string, string>}
 */
export const EXCLUDED = {};

/** Entries must be plain repo-relative paths — no shell metacharacters. */
const SAFE_ENTRY = /^[A-Za-z0-9._/-]+$/;

/**
 * Parse the allowlist file: strip `#` comments and blank lines, trim each
 * remaining line. Returns `{ entry, line }` records so errors can cite a line
 * number. Whitespace inside an entry is preserved here and rejected by
 * `checkAllowlist` (a path with a space is far more likely a typo than intent,
 * and the workflow's shell splitting cannot represent one safely).
 */
export function parseAllowlist(text) {
  const out = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const entry = raw.replace(/#.*$/, '').trim();
    if (entry) out.push({ entry, line: i + 1 });
  });
  return out;
}

/** Mirrors the workflow's `case "$f" in "$prefix"*)` — a literal prefix match. */
export const covers = (prefix, file) => file.startsWith(prefix);

/**
 * The whole check, as a pure function over injected state so tests can drive
 * it without touching the repo.
 *
 * @param {object} input
 * @param {string} input.allowlistText   contents of the allowlist file
 * @param {string} input.workflowText    contents of the auto-merge workflow
 * @param {string[]} input.generatedOnDisk  repo-relative *.generated.ts present
 * @param {{sync: string, out: string}[]} input.syncTargets  the manifest
 * @param {Record<string, string>} [input.excluded]
 * @param {(p: string) => 'file' | 'dir' | null} input.pathKind  resolves a
 *        repo-relative path to what it is on disk, or null if absent
 * @returns {string[]} human-readable problems; empty means pass
 */
export function checkAllowlist({
  allowlistText,
  workflowText,
  generatedOnDisk,
  syncTargets,
  excluded = {},
  pathKind,
}) {
  const problems = [];
  const parsed = parseAllowlist(allowlistText);
  const entries = parsed.map((p) => p.entry);

  if (entries.length === 0) {
    problems.push(
      `${ALLOWLIST_FILE} has no entries — that would disable content auto-merge entirely.`,
    );
  }

  // ── 1. Entries are well-formed, unique, and real ────────────────────────
  const seen = new Map();
  for (const { entry, line } of parsed) {
    if (!SAFE_ENTRY.test(entry)) {
      problems.push(
        `${ALLOWLIST_FILE}:${line}: \`${entry}\` — entries must be plain repo-relative paths ([A-Za-z0-9._/-]); no spaces, globs, or shell metacharacters.`,
      );
      continue;
    }
    if (entry.startsWith('/') || entry.split('/').includes('..')) {
      problems.push(
        `${ALLOWLIST_FILE}:${line}: \`${entry}\` — must be repo-relative, with no \`..\` segment.`,
      );
      continue;
    }
    if (seen.has(entry)) {
      problems.push(`${ALLOWLIST_FILE}:${line}: \`${entry}\` duplicates line ${seen.get(entry)}.`);
      continue;
    }
    seen.set(entry, line);

    const kind = pathKind(entry.replace(/\/$/, ''));
    if (kind === null) {
      problems.push(
        `${ALLOWLIST_FILE}:${line}: \`${entry}\` does not exist — a renamed or mistyped path silently stops matching, which is how this gate rots.`,
      );
    } else if (kind === 'dir' && !entry.endsWith('/')) {
      problems.push(
        `${ALLOWLIST_FILE}:${line}: \`${entry}\` is a directory and must end with \`/\` — as a bare prefix it would also match \`${entry}-other/\`.`,
      );
    } else if (kind === 'file' && entry.endsWith('/')) {
      problems.push(`${ALLOWLIST_FILE}:${line}: \`${entry}\` is a file; drop the trailing \`/\`.`);
    }
  }

  // ── 2. The manifest matches what is actually on disk ────────────────────
  const manifestOuts = syncTargets.map((t) => t.out);
  for (const f of generatedOnDisk) {
    if (!manifestOuts.includes(f)) {
      problems.push(
        `${f} exists but is not in SYNC_TARGETS (scripts/lib/generated-content.mjs) — add it with the sync script that emits it, so check:generated and the auto-merge gate both know about it.`,
      );
    }
  }
  for (const { sync, out } of syncTargets) {
    if (!generatedOnDisk.includes(out)) {
      problems.push(
        `SYNC_TARGETS lists ${out}, which does not exist on disk — remove the stale entry or commit the file.`,
      );
    }
    if (pathKind(sync) !== 'file') {
      problems.push(`SYNC_TARGETS lists sync script ${sync}, which does not exist.`);
    }
  }

  // ── 3. Every generated artifact is covered, or explicitly excluded ──────
  const allFiles = [...new Set([...generatedOnDisk, ...manifestOuts])].sort();
  for (const f of allFiles) {
    const isCovered = entries.some((e) => covers(e, f));
    const isExcluded = Object.prototype.hasOwnProperty.call(excluded, f);
    if (isCovered && isExcluded) {
      problems.push(
        `${f} is both allowlisted and listed in EXCLUDED — pick one. (EXCLUDED reason: ${excluded[f]})`,
      );
    } else if (!isCovered && !isExcluded) {
      problems.push(
        `${f} is a generated content artifact that no ${ALLOWLIST_FILE} entry covers. A PR that regenerates it can NEVER auto-merge, and auto-merge-content will say nothing. Add the path to ${ALLOWLIST_FILE}, or add it to EXCLUDED in scripts/check-automerge-allowlist.mjs with a reason.`,
      );
    }
  }
  for (const [f, reason] of Object.entries(excluded)) {
    if (!reason || typeof reason !== 'string') {
      problems.push(`EXCLUDED entry ${f} needs a non-empty reason string.`);
    }
    if (!allFiles.includes(f)) {
      problems.push(
        `EXCLUDED entry ${f} is not a known generated artifact — remove the stale entry.`,
      );
    }
  }

  // ── 4. The workflow still reads the file (nobody re-inlined the list) ───
  if (!workflowText.includes(ALLOWLIST_FILE)) {
    problems.push(
      `${WORKFLOW_FILE} no longer references ${ALLOWLIST_FILE}. The allowlist must have exactly one source of truth — do not re-inline it into the workflow.`,
    );
  }
  const inlined = [
    ...workflowText.matchAll(/^\s*(apps\/web\/lib\/longlive\/\S*\.generated\.ts)\s*$/gm),
  ].map((m) => m[1]);
  if (inlined.length) {
    problems.push(
      `${WORKFLOW_FILE} contains an inline copy of generated-file paths (${inlined.join(', ')}). Delete them; the workflow reads ${ALLOWLIST_FILE}.`,
    );
  }

  return problems;
}

function pathKindFromDisk(rel) {
  const abs = join(ROOT, ...rel.split('/'));
  if (!existsSync(abs)) return null;
  return statSync(abs).isDirectory() ? 'dir' : 'file';
}

function main() {
  const read = (rel) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');
  const generatedOnDisk = listGeneratedOnDisk();

  const problems = checkAllowlist({
    allowlistText: read(ALLOWLIST_FILE),
    workflowText: read(WORKFLOW_FILE),
    generatedOnDisk,
    syncTargets: SYNC_TARGETS,
    excluded: EXCLUDED,
    pathKind: pathKindFromDisk,
  });

  console.log(
    `automerge allowlist: ${parseAllowlist(read(ALLOWLIST_FILE)).length} entr(ies); ` +
      `${generatedOnDisk.length} generated artifact(s) on disk; ${Object.keys(EXCLUDED).length} explicit exclusion(s).`,
  );

  if (problems.length) {
    console.error(`\n✗ ${problems.length} content auto-merge allowlist problem(s):\n`);
    for (const p of problems) console.error(`  • ${p}`);
    console.error(
      '\nThis gate decides what merges to `main` with no human review. It is a\n' +
        'POLICY file, not config: read the header of ' +
        ALLOWLIST_FILE +
        '\nbefore widening it.\n',
    );
    process.exit(1);
  }
  console.log('✓ every generated content artifact is covered by the auto-merge allowlist');
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-automerge-allowlist.mjs')
) {
  main();
}
