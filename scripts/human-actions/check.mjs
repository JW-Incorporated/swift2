// `npm run check:human-actions` — a WARNING-only lint (always exits 0) over the
// open HUMAN-ACTIONS.md: an entry whose **Worked if** reads machine-checkable
// but carries no `<!-- ha verify: ... -->` line, or a verify line that is not
// one of the safe kinds (see auto-close.mjs). Founder decision 2026-10-06:
// checkable asks close themselves, so the check line is how they do.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HUMAN_ACTIONS_PATH } from '../marjorie/human-actions.mjs';
import { entriesWithVerify } from './auto-close.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECKABLE = /\b(secret|variable)\b.*\b(exists?|set|present|added|equals?)\b|\b(PR|pull request|issue)\s*#?\d+\b.*\b(merged|closed)\b|\bworkflow\b.*\b(green|passes|succeeds|succeeded)\b|\b[\w-]+\.ya?ml\b.*\b(green|passes|succeeds)\b/i;

/** Pure: warning strings for an open file's text. */
export function warnings(openMd) {
  const out = [];
  for (const e of entriesWithVerify(openMd)) {
    if (e.verifyText !== null && !e.verify) {
      out.push(`#${e.number}: verify line is not a recognized kind (secret-exists, variable-equals, pr-merged, issue-closed, workflow-green)`);
      continue;
    }
    const worked = e.block.find((l) => /^\*\*Worked if:\*\*/.test(l)) || '';
    if (e.verifyText === null && CHECKABLE.test(worked)) {
      out.push(`#${e.number}: "Worked if" looks machine-checkable but has no <!-- ha verify: ... --> line`);
    }
  }
  return out;
}

export function main({ root = ROOT, log = console.log } = {}) {
  const found = warnings(readFileSync(path.join(root, HUMAN_ACTIONS_PATH), 'utf8'));
  for (const w of found) log(process.env.GITHUB_ACTIONS ? `::warning::${w}` : `warn ${w}`);
  log(`check:human-actions — ${found.length} warning(s) (never fails)`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
