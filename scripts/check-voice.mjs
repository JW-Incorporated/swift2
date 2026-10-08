// Voice gate — BLOCKING merge-time check for the house naming rule (#461,
// #1917, #1918).
//
// WHY THIS EXISTS. The VOICE launch gate (docs/launch-readiness.md) was closed
// 🟢 on 2026-08-06 on a fresh 0-findings run of the deterministic voice checker
// (scripts/content-engine/checkers/voice.mjs), and declared "self-enforcing" on
// the sentence: "Karen's nightly scan now enforces this permanently — any
// future item authored in wire-voice gets caught the next night automatically."
// That sentence was already false when it was written. Karen's cron had gone
// WEEKLY on 2026-07-25, twelve days earlier, and `cie` issue filing was broken
// 2026-08-02 → 08-12 (#1869). Both safety nets were silently off, and the
// corpus drifted back to 19 findings by 2026-08-12 — 0 on 08-08, 4 on 08-09,
// 6 on 08-11, 19 at merge on 08-12. The regression compounded because nothing
// looked at content until AFTER it had already landed on `main`.
//
// A CADENCE IS NOT A GATE. Anything enforced by "a scan runs later" degrades
// silently the moment the schedule slips, the runner is throttled, or the
// filing path breaks — none of which turn anything red. The only enforcement
// that cannot rot this way is one that runs on the PR, before the merge, as a
// required check. That is this script. Karen's scan stays useful as the corpus
// -wide sweep; it is no longer the thing standing between wire voice and
// `main`.
//
// SCOPE: THE PR'S OWN CONTENT, NOT THE WHOLE CORPUS (default). A corpus-wide
// blocking gate turns one stale finding anywhere in 1,148 items into a
// repo-wide merge freeze for authors who touched none of it — which is exactly
// how a gate earns a `--no-verify` habit and gets routed around. So the default
// scans only items whose seed file the PR actually changed. Two escalations keep
// that from being a loophole:
//   * changing the voice checker itself (or this script) scans the FULL corpus,
//     so a rule can never be loosened without proving the whole corpus still
//     passes under the new rule; and
//   * because every change reaches `main` through a PR, and every PR is scanned
//     over the files it touches, content that is clean on `main` cannot become
//     unclean without some PR's own scope going red first.
//
// FALSE POSITIVES ARE THE REAL FAILURE MODE. A blocking check people distrust
// is worse than no check. The underlying checker already excludes double-quoted
// spans (a direct quote is someone else's words, never the item's voice),
// already excludes any "[Name] Swift" (Austin/Andrea/Scott Swift, "Nicki
// Swift"), already requires enough running prose to judge, and — added
// alongside this gate — no longer reads "the Us Weekly report" as an outlet
// acting as a subject. Legal names, credits, award titles and quoted material
// all keep the surname untouched by construction. See scripts/check-voice.test.ts
// for the false-positive battery this is held to.
//
// Exit codes: 0 = clean; 1 = voice findings in scope (blocks `build`);
// 2 = BROKEN GATE (could not read git / load the corpus) — kept distinct from a
// clean pass so "the check broke" can never be reported as "the content is fine".
//
// Exports the pure core (`selectScope`, `itemsInScope`, `formatFindings`) for
// scripts/check-voice.test.ts.

import { execFileSync } from 'node:child_process';
import { loadCorpus } from './content-engine/lib/corpus.mjs';
import * as voice from './content-engine/checkers/voice.mjs';
import { runMain } from './lib/cli.mjs';

/** Every reviewable content file lives under this prefix. */
export const CONTENT_PREFIX = 'supabase/seed/';

/**
 * Touching the rule itself escalates to a full-corpus scan: a weakened regex
 * must prove the WHOLE corpus still passes, not just the files in that PR.
 */
export const RULE_PATHS = [
  'scripts/check-voice.mjs',
  'scripts/content-engine/checkers/voice.mjs',
];

class BrokenGate extends Error {}

/**
 * Decide what to scan from the PR's changed-file list.
 *
 * `supabase/seed/tracks/<era>.dossiers.mjs` is a side file whose prose reaches
 * the corpus through its sibling `<era>.mjs` (the corpus loader attributes the
 * item to the parent), so a dossier-only edit must pull the parent into scope
 * or its text would be invisible to the gate.
 *
 * @param {string[]} changed repo-relative POSIX paths changed by the PR
 * @returns {{mode: 'all'|'changed', files: Set<string>, reason: string}}
 */
export function selectScope(changed) {
  const paths = (changed ?? []).filter((p) => typeof p === 'string' && p.length);
  const ruleTouched = paths.filter((p) => RULE_PATHS.includes(p));
  if (ruleTouched.length) {
    return {
      mode: 'all',
      files: new Set(),
      reason: `the voice rule itself changed (${ruleTouched.join(', ')}) — scanning the full corpus`,
    };
  }
  const files = new Set();
  for (const p of paths) {
    if (!p.startsWith(CONTENT_PREFIX) || !p.endsWith('.mjs')) continue;
    files.add(p);
    if (p.endsWith('.dossiers.mjs')) files.add(p.replace(/\.dossiers\.mjs$/, '.mjs'));
  }
  return {
    mode: 'changed',
    files,
    reason: files.size
      ? `${files.size} changed content file(s)`
      : 'no content files changed',
  };
}

/** Narrow the loaded corpus to the items this run is responsible for. */
export function itemsInScope(items, scope) {
  if (scope.mode === 'all') return items;
  return items.filter((it) => scope.files.has(it.file));
}

/** Human-readable failure body, grouped by file. */
export function formatFindings(findings) {
  const byFile = new Map();
  for (const f of findings) {
    const file = f.itemRef?.file ?? '(unknown file)';
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(f);
  }
  const lines = [];
  for (const [file, fs] of [...byFile.entries()].sort()) {
    lines.push(`  ${file}`);
    for (const f of fs) {
      lines.push(`    ✗ [${f.checker}] ${f.itemRef?.key ?? '?'} · \`${f.itemRef?.field ?? '?'}\``);
      lines.push(`        ${f.evidence}`);
      lines.push(`        fix: ${f.suggestedFix}`);
    }
  }
  return lines.join('\n');
}

/**
 * Files changed versus a base ref. Two-dot (tree-to-tree) on purpose: it works
 * in a `--depth=1` CI checkout where no merge base is available, the same
 * constraint scripts/check-no-downgrade.mjs is written against. Over-inclusion
 * (a file another PR changed on `main` since this branch forked) is harmless —
 * `main` is clean by construction, so an extra file only costs microseconds.
 */
function changedFilesFromGit(baseRef) {
  let out;
  try {
    out = execFileSync('git', ['diff', '--name-only', baseRef, 'HEAD'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (e) {
    throw new BrokenGate(
      `could not diff against base ref '${baseRef}': ${e.message}. ` +
        "In CI, fetch the base first: `git fetch --no-tags --depth=1 origin main` then pass `--base-ref FETCH_HEAD`.",
    );
  }
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

async function main(argv) {
  let baseRef = 'origin/main';
  let all = false;
  let changedOverride = null; // --changed a,b,c (tests / manual runs)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base-ref') baseRef = argv[++i];
    else if (a === '--all') all = true;
    else if (a === '--changed') changedOverride = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else {
      console.error(`Unknown argument: ${a}`);
      return 2;
    }
  }

  try {
    const scope = all
      ? { mode: 'all', files: new Set(), reason: '--all requested' }
      : selectScope(changedOverride ?? changedFilesFromGit(baseRef));

    if (scope.mode === 'changed' && scope.files.size === 0) {
      console.log(`check:voice — OK. Nothing to scan (${scope.reason} vs ${baseRef}).`);
      return 0;
    }

    let items;
    try {
      items = await loadCorpus();
    } catch (e) {
      throw new BrokenGate(`could not load the seed corpus: ${e.message}`);
    }
    const scoped = itemsInScope(items, scope);
    const findings = await voice.check(scoped);

    console.log(
      `check:voice — scanned ${scoped.length} item(s) across ${
        scope.mode === 'all' ? 'the full corpus' : `${scope.files.size} file(s)`
      } (${scope.reason}).`,
    );

    if (findings.length === 0) {
      console.log('✓ house voice holds: "Taylor," not "Swift" — no voice findings in scope.');
      return 0;
    }

    console.error(`\ncheck:voice — FAIL. ${findings.length} voice finding(s) in changed content:\n`);
    console.error(formatFindings(findings));
    console.error(
      '\nHouse style is "Taylor," not "Swift" — wire-service surname style reads wrong on a fan site\n' +
        '(#461; tracked as the VOICE launch gate). This runs at merge time on purpose: the gate used to\n' +
        "depend on Karen's scan cadence, the cadence slipped, and 19 findings landed before anyone looked.\n" +
        '\nThe rule already leaves alone, by construction: text inside double quotes (a direct quote is\n' +
        'someone else\'s words), any "[Name] Swift" (Austin/Andrea/Scott Swift, an outlet\'s own name), and\n' +
        'prose that already defaults to "Taylor". If a finding here is genuinely a quote, a legal name, or\n' +
        'a formal credit/award title that the rule mis-reads, fix the RULE (with a test) in\n' +
        'scripts/content-engine/checkers/voice.mjs — do not weaken the gate for one file.',
    );
    return 1;
  } catch (e) {
    if (e instanceof BrokenGate) {
      console.error(`check:voice — BROKEN GATE: ${e.message}`);
      return 2;
    }
    console.error(`check:voice — BROKEN GATE (unexpected): ${e.stack || e.message}`);
    return 2;
  }
}

// Only run when executed directly, never on import (tests import the pure fns).
// Same suffix-match pattern the sibling checks use (Windows-path safe).
if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/check-voice.mjs')) {
  runMain(() => main(process.argv.slice(2)), { name: 'check-voice' });
}
