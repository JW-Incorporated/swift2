// One-command, one-turn fetch of full comment threads for a label query.
// `gh issue list --json comments` truncates comments per issue at 100 (#4230),
// and one `gh issue view` per issue would cost one agent tool turn each. This
// lists the numbers, then reads each issue with `gh issue view` internally and
// prints ONE JSON array of { number, stateReason, body, comments }.
//
//   node scripts/marjorie/lib/fetch-issue-comments.mjs --label marjorie-filed --state closed
//   node scripts/marjorie/lib/fetch-issue-comments.mjs --label marjorie-triaged --label marjorie-filed --state all
//
// Aborts (exit 1, nothing on stdout) when a label's list returns exactly LIMIT
// items: the cap may be hiding more, and acting on a partial set is worse than
// skipping the pass. The caller notes the abort in its run summary.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LIMIT = 200;

function gh(execImpl, args) {
  return JSON.parse(execImpl('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

export function fetchIssueComments({
  labels,
  state = 'all',
  repo = process.env.GITHUB_REPOSITORY,
  limit = LIMIT,
  execImpl = execFileSync,
  sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)),
  paceMs = 100,
} = {}) {
  if (!labels?.length) throw new Error('at least one --label is required');
  if (!repo) throw new Error('GITHUB_REPOSITORY is not set');
  const seen = new Map();
  for (const label of labels) {
    const rows = gh(execImpl, ['issue', 'list', '--repo', repo, '--label', label, '--state', state, '--json', 'number,stateReason', '--limit', String(limit)]);
    if (rows.length >= limit) throw new Error(`label ${label}: list returned exactly ${limit} items; the cap may hide more. Aborting.`);
    for (const row of rows) if (!seen.has(row.number)) seen.set(row.number, row.stateReason ?? null);
  }
  return (async () => {
    const out = [];
    for (const [number, stateReason] of seen) {
      const issue = gh(execImpl, ['issue', 'view', String(number), '--repo', repo, '--json', 'number,body,comments']);
      out.push({ number, stateReason, body: issue.body, comments: issue.comments });
      await sleepImpl(paceMs);
    }
    return out;
  })();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const labels = [];
  let state = 'all';
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === '--label') labels.push(args[i + 1]);
    else if (args[i] === '--state') state = args[i + 1];
  }
  try {
    const result = await fetchIssueComments({ labels, state });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (err) {
    console.error(`fetch-issue-comments: ${err.message}`);
    process.exit(1);
  }
}
