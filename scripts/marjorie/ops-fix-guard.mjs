// Pre-merge check for the ops-fixer routine (docs/agents/ops-fixer.md). The
// routine runs this on its own branch before `gh pr merge --squash --auto`
// and stops if it exits 1. It enforces the three of the four rails that a
// diff can show: rail 1 (no `gh secret`/`gh variable` mutation), rail 2 (no
// force-push), rail 3 (no social approval/signing edits, no "approval" key
// in social/queue/**). Rail 4 (merge only via --auto) is the prompt's.
//
//   node scripts/marjorie/ops-fix-guard.mjs [--base origin/main]
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';

const PROTECTED = [
  /^\.github\/workflows\/social-approval-poll\.yml$/,
  /^scripts\/automerge-social-approval-gate\.mjs$/,
  /^scripts\/social\/(?:social-approval-poll|stamp-approval)\.mjs$/,
];
const SECRET_MUTATION = /\bgh\s+(?:secret|variable)\s+(?:set|delete|remove)\b/;
const FORCE_PUSH = /\bgit\b[^\n]*\bpush\b[^\n]*(?:--force\b|--force-with-lease\b|\s-f\b|\s\+\S)/;
const APPROVAL_KEY = /"approval"\s*:/;

export function checkDiff(diff) {
  const violations = [];
  let file = '';
  for (const line of diff.split('\n')) {
    const head = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (head) {
      file = head[2];
      if (PROTECTED.some((re) => re.test(file))) violations.push(`rail 3: edits social approval/signing file ${file}`);
      continue;
    }
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    const added = line.slice(1);
    if (SECRET_MUTATION.test(added)) violations.push(`rail 1: adds a gh secret/variable mutation in ${file}`);
    if (FORCE_PUSH.test(added)) violations.push(`rail 2: adds a force-push in ${file}`);
    if (file.startsWith('social/queue/') && APPROVAL_KEY.test(added)) violations.push(`rail 3: writes an "approval" key in ${file}`);
  }
  return [...new Set(violations)];
}

export function main(argv = process.argv.slice(2), exec = execFileSync) {
  const i = argv.indexOf('--base');
  const base = i >= 0 ? argv[i + 1] : 'origin/main';
  const diff = exec('git', ['diff', `${base}...HEAD`, '--unified=0'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const violations = checkDiff(diff);
  for (const v of violations) console.error(`ops-fix-guard: ${v}`);
  if (violations.length) return 1;
  console.log('ops-fix-guard: ok');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runMain(() => main(), { name: 'ops-fix-guard' });
