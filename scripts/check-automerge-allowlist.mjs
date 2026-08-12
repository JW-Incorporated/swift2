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
// auto-mergeable. Widening the allowlist to ordinary app code still passes this
// check — that is a human policy call, see the warning header in the allowlist
// file.
//
// ONE EXCEPTION, added 2026-08-11: `NEVER_ALLOWLIST` below. Paths that can
// change *what merges with nobody looking, or what agents are permitted to do*
// — the workflows, this allowlist, the checker scripts, the charters,
// CLAUDE.md, the decision log — are refused outright. Everything else is
// policy; that class is structural, because allowlisting it would let a bot PR
// widen its own authority and land the widening unreviewed.
//
// `NEVER_ALLOWLIST_EXCEPTIONS` is the one narrowing: `apps/web/public/` is
// barred, but the founder-approved `apps/web/public/social/` carve-out
// (docs/decisions.md 2026-08-11) is a more-specific grant that survives the
// bar. The exception is deliberately shaped so it can ONLY narrow the exact bar
// it names and can never let a broader entry (or a different barred prefix)
// through — see the block comment on it below.
//
// Exports the pure pieces (`parseAllowlist`, `checkAllowlist`, `EXCLUDED`,
// `NEVER_ALLOWLIST`, `NEVER_ALLOWLIST_EXCEPTIONS`, `overlaps`) for
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

/**
 * THE SELF-AMENDMENT BAR (2026-08-11).
 *
 * Paths that may NEVER appear in the allowlist, keyed by prefix with the reason.
 * This is the one rule that has to hold no matter how far merge delegation is
 * widened later, so it is code rather than a sentence in a header.
 *
 * The header of `.github/content-automerge-allowlist.txt` already warns humans
 * to keep the list narrow, and this checker's own "known gap" note says the
 * quiet part out loud: *"it cannot judge whether a path deserves to be
 * auto-mergeable — adding `apps/web/` to that file would pass CI."* For most
 * paths that is correct; deciding what content may merge unreviewed is a human
 * policy call and CI should not pretend to make it.
 *
 * But one class is different in kind. A PR that edits this allowlist, a
 * workflow, a checker script, a charter, `CLAUDE.md`, or the decision log does
 * not just change the product — it changes **what may merge with nobody
 * looking, and what agents are permitted to do**. If any of those were ever
 * allowlisted, a bot PR could widen its own authority and land that widening
 * unreviewed, and every downstream control would inherit the change. One
 * mistaken line in a policy file would be self-ratifying.
 *
 * So: the mechanism that decides what merges without a human must itself
 * always need a human. That is not a judgement call and it does not get
 * relaxed, which is why it lives here and not in a prose header.
 *
 * The match is deliberately bidirectional — an entry is refused both when it
 * sits INSIDE a barred area (`docs/agents/`) and when it is broad enough to
 * COVER one (`docs/`, `apps/`, or a bare `.`).
 *
 * @type {Record<string, string>}
 */
export const NEVER_ALLOWLIST = {
  '.github/': 'Workflows, this allowlist, dependabot config and CODEOWNERS ARE the gate. A gate that can widen itself unreviewed is not a gate.',
  'CODEOWNERS': 'Decides who must review. Self-ratifying if it could merge itself.',
  'CLAUDE.md': 'The standing instruction set for every AI session in this repo.',
  'AGENTS.md': "Codex's instruction set — the independent reviewer's own rules.",
  'docs/agents/': 'Desk charters. `docs/agents/README.md`: "no agent may edit any charter, including its own."',
  'docs/decisions.md': 'The authority trail. A grant that could record itself is not a grant.',
  'docs/cto-role.md': 'Role and authority limits.',
  'docs/architecture.md': 'The hard boundaries daily work is judged against.',
  'docs/proposals/': 'Specs and operating-model design, including the tier/authority model.',
  'docs/specs/': 'Approved specs — the thing "implement the approved spec exactly" refers to.',
  'docs/content-ops/': 'Holds privacy-redlines.md, which by its own text overrides everything else.',
  'docs/launch-readiness.md': 'The go/no-go artifact. Marjorie opens PRs against it; those get read.',
  'scripts/': 'The checkers themselves — validate:content, check:generated, check:content-inert, this file. A PR that can weaken its own gate while being judged by it.',
  'package.json': 'Defines which checks `build` actually runs.',
  'package-lock.json': 'Dependency resolution; a lockfile edit can swap what any check executes.',
  '.gitignore': 'Can hide files from the very diff a reviewer or checker inspects.',
  'tsconfig.json': 'Can disable typecheck coverage.',
  'vitest.config.ts': 'Can silence the test suite that gates every merge.',
  'supabase/migrations/': 'A schema migration is not revertable by `git revert`; undoing one is a new migration, and data may already be gone.',
  'apps/web/public/': 'Bot-picked media reaching a public surface gets human eyes (docs/decisions.md 2026-07-28, reaffirmed 2026-08-06) — EXCEPT the narrower apps/web/public/social/ grant, see NEVER_ALLOWLIST_EXCEPTIONS.',
  // App code is auto-mergeable (docs/decisions.md 2026-08-11), but these three
  // sub-paths are NOT. They are barred here so a broad `apps/web/app/` allow can
  // only clear the self-amendment check when a DENY (`!`) prefix covers each —
  // which is exactly how the allowlist reinstates the human gate for them. To
  // ever auto-merge one, a founder edits THIS map first, in its own reviewed PR.
  'apps/web/app/api/': 'The request-handling / data layer. Held while E2E is red (#669): app-code auto-merge has no behavioural regression net beyond unit+typecheck+build.',
  'apps/web/app/privacy/': 'Legal surface — needs counsel, not a code review.',
  'apps/web/app/terms/': 'Legal surface — needs counsel, not a code review.',
  // Server/deploy/security surface barred by P0 fix #1972 (2026-08-12). These
  // execute server-side or configure the deploy, so they must never be
  // re-allowlisted without a reviewed change to THIS map. The `apps/web/lib/`
  // grant was also narrowed to `apps/web/lib/longlive/` in the allowlist, but
  // barring the specific server files here makes that permanent: a future PR
  // that re-broadened the lib allow to `apps/web/lib/` would fail this check,
  // because that allow overlaps these bars with no deny covering them.
  'apps/web/lib/vault.ts': 'The server-side vault data layer — constructs the data client and is the server read path. Not a view module.',
  'apps/web/lib/security-headers.': 'The CSP / security-headers module — changes what the browser is allowed to load; a security control, not content.',
  'apps/web/next.config.': 'Next.js deploy configuration — headers, redirects, build behaviour. A deploy-config change, human-only.',
  'apps/web/middleware.': 'Next.js middleware runs on every request (auth, redirects, headers) — server-executing and security-relevant. Forward-looking guard.',
};

/**
 * THE ONE NARROWING of the self-amendment bar (2026-08-11).
 *
 * `apps/web/public/` is barred above, but the founder-approved social-image
 * carve-out (docs/decisions.md 2026-08-11, "Auto-merge allowlist extended to
 * `apps/web/public/social/**`", Joey + Wyatt) is a MORE-SPECIFIC grant that has
 * to survive the bar. Rather than punch a hole in `NEVER_ALLOWLIST` (which would
 * weaken the general rule), this map lists the exact sub-prefixes that a bar may
 * be narrowed by, each with its authority trail.
 *
 * The narrowing is intentionally minimal and fail-closed. An allowlist `entry`
 * that overlaps a barred prefix `p` is exempted for `p` ONLY when some exception
 * `x` here satisfies BOTH:
 *   - `x.startsWith(p)`  — the exception lies *inside* that exact bar, so it can
 *                          only ever narrow the bar it belongs to, never a
 *                          different one (e.g. it can't smuggle a `.github/`
 *                          entry through); and
 *   - `entry.startsWith(x)` — the entry lies *inside* the granted sub-prefix, so
 *                          a broader entry (`apps/web/public/`, `apps/`) or a
 *                          sibling (`apps/web/public/socialite/`) is NOT exempt.
 * Anything not matching both stays barred. Adding a key here is itself a change
 * to `.github/**` and therefore always needs a founder — the exception list
 * cannot be widened by an auto-merged PR.
 *
 * @type {Record<string, string>}
 */
export const NEVER_ALLOWLIST_EXCEPTIONS = {
  'apps/web/public/social/':
    'Founder-approved carve-out (docs/decisions.md 2026-08-11): a queue item\'s own dedicated photo, gated at PR time by scripts/social/check-drafts.mjs plus the per-file constraints in auto-merge-content.yml. Only this subtree; the rest of apps/web/public/** stays human (2026-07-28).',
};

/** True when two path prefixes overlap in EITHER direction. */
export const overlaps = (a, b) => a.startsWith(b) || b.startsWith(a);

/**
 * The barred prefixes an entry still trips after the exceptions are applied.
 * Empty means the entry is clear of the self-amendment bar.
 *
 * @param {string} entry            an allowlist entry
 * @param {Record<string,string>} neverAllowlist
 * @param {Record<string,string>} exceptions
 * @returns {string[]} barred prefixes that are NOT narrowed away for this entry
 */
export function barredPrefixes(entry, neverAllowlist, exceptions, denies = []) {
  return Object.keys(neverAllowlist).filter(
    (p) =>
      overlaps(entry, p) &&
      // exempt only when a listed exception lies inside THIS bar and also
      // covers the entry — both directions, so nothing broader slips through.
      !Object.keys(exceptions).some((x) => x.startsWith(p) && entry.startsWith(x)) &&
      // ── or when a DENY (`!`) prefix fully covers the barred area ──────────
      // `p.startsWith(d)` means EVERY path under the barred prefix `p` is denied,
      // so no file there can auto-merge no matter how broad this allow is. This
      // is what lets `apps/web/app/` be allowed while `apps/web/app/api/` (etc.)
      // stay human: the deny reinstates the gate for exactly that subtree. A
      // deny that only covers PART of `p` (e.g. `!apps/web/public/social/` vs a
      // barred `apps/web/public/`) does NOT satisfy the bar — the rest of `p`
      // would still slip through — so the broad allow stays refused.
      !denies.some((d) => p.startsWith(d)),
  );
}

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
    const stripped = raw.replace(/#.*$/, '').trim();
    if (!stripped) return;
    const deny = stripped.startsWith('!');
    const entry = deny ? stripped.slice(1).trim() : stripped;
    out.push({ entry, line: i + 1, deny });
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
  neverAllowlist = NEVER_ALLOWLIST,
  neverExceptions = NEVER_ALLOWLIST_EXCEPTIONS,
}) {
  const problems = [];
  const parsed = parseAllowlist(allowlistText);
  const allowParsed = parsed.filter((p) => !p.deny);
  const denyParsed = parsed.filter((p) => p.deny);
  const entries = allowParsed.map((p) => p.entry);
  const denies = denyParsed.map((p) => p.entry);

  if (entries.length === 0) {
    problems.push(
      `${ALLOWLIST_FILE} has no allow entries — that would disable content auto-merge entirely.`,
    );
  }

  // ── 0. DENY (`!`) entries are well-formed, unique, and not also an allow ──
  // Deny entries only RESTRICT, so they skip the self-amendment bar and the
  // existence check (a deny may be forward-looking, e.g. `!apps/web/app/terms/`
  // before that route exists).
  const seenDeny = new Map();
  for (const { entry, line } of denyParsed) {
    if (!SAFE_ENTRY.test(entry) || entry.startsWith('/') || entry.split('/').includes('..')) {
      problems.push(
        `${ALLOWLIST_FILE}:${line}: deny \`!${entry}\` — must be a plain repo-relative path ([A-Za-z0-9._/-]), no leading \`/\` or \`..\`.`,
      );
      continue;
    }
    if (seenDeny.has(entry)) {
      problems.push(`${ALLOWLIST_FILE}:${line}: deny \`!${entry}\` duplicates line ${seenDeny.get(entry)}.`);
      continue;
    }
    seenDeny.set(entry, line);
    if (entries.includes(entry)) {
      problems.push(
        `${ALLOWLIST_FILE}:${line}: \`${entry}\` is listed as BOTH an allow and a deny (\`!\`). Pick one — a deny always wins, so this would just never auto-merge.`,
      );
    }
  }

  // ── 1. Allow entries are well-formed, unique, and real ──────────────────
  const seen = new Map();
  for (const { entry, line } of allowParsed) {
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

    // ── 1b. The self-amendment bar ────────────────────────────────────────
    // Checked before existence, so the message is about authority rather than
    // a typo, and so a barred entry is refused even if the path is real. The
    // one narrowing is NEVER_ALLOWLIST_EXCEPTIONS (the social-image carve-out).
    const barred = barredPrefixes(entry, neverAllowlist, neverExceptions, denies);
    if (barred.length) {
      for (const prefix of barred) {
        problems.push(
          `${ALLOWLIST_FILE}:${line}: \`${entry}\` overlaps \`${prefix}\`, which may NEVER be auto-merged. ${neverAllowlist[prefix]} ` +
            'The mechanism that decides what merges without a human must itself always need a human — ' +
            'see NEVER_ALLOWLIST in scripts/check-automerge-allowlist.mjs. Either narrow this allow, add a ' +
            `deny (\`!${prefix}\`) that fully covers the barred area, or — if genuinely intended — change ` +
            'NEVER_ALLOWLIST (or NEVER_ALLOWLIST_EXCEPTIONS) first, in its own reviewed PR.',
        );
      }
      continue;
    }

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
    const isCovered = entries.some((e) => covers(e, f)) && !denies.some((d) => covers(d, f));
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

  // ── 5. If the allowlist uses DENY (`!`) prefixes, the workflow must enforce
  //      them. `deny_prefixes` is the variable the enable job splits them into;
  //      its absence would mean deny lines are silently ignored at merge time —
  //      a file under a deny prefix would auto-merge. Fail loudly instead.
  if (denies.length > 0 && !workflowText.includes('deny_prefixes')) {
    problems.push(
      `${ALLOWLIST_FILE} has deny (\`!\`) entries but ${WORKFLOW_FILE} has no \`deny_prefixes\` handling — the workflow would ignore them and auto-merge denied paths. Wire the deny check into the enable job.`,
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

  const parsedForCount = parseAllowlist(read(ALLOWLIST_FILE));
  console.log(
    `automerge allowlist: ${parsedForCount.filter((p) => !p.deny).length} allow + ` +
      `${parsedForCount.filter((p) => p.deny).length} deny entr(ies); ` +
      `${generatedOnDisk.length} generated artifact(s) on disk; ${Object.keys(EXCLUDED).length} explicit exclusion(s); ` +
      `${Object.keys(NEVER_ALLOWLIST).length} path(s) barred outright (self-amendment bar), ${Object.keys(NEVER_ALLOWLIST_EXCEPTIONS).length} narrowing exception(s).`,
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
