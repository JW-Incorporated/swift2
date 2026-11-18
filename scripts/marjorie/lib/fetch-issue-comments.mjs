// One-command, one-turn fetch of full comment threads for a label query.
// `gh issue list --json comments` truncates comments per issue at 100 (#4230),
// and one `gh issue view` per issue would cost one agent tool turn each. This
// lists the numbers, then reads each issue with `gh issue view` internally and
// prints ONE JSON array of { number, stateReason, body, comments }.
//
//   node scripts/marjorie/lib/fetch-issue-comments.mjs --label marjorie-filed --state closed
//   node scripts/marjorie/lib/fetch-issue-comments.mjs --label marjorie-triaged --label marjorie-filed --state all
//
// Each label's list pages through the REST issues API (lib/issues-rest.mjs) to
// the end (#6944: a 200-item cap aborted every run once marjorie-filed passed
// 200). A label with more than MAX_PER_LABEL issues keeps the newest
// MAX_PER_LABEL: the function returns { issues, truncated: [label...] } and the
// CLI prints a `TRUNCATED` line on stderr. Stdout stays the bare JSON array
// (pending-overrides.mjs parses it).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { listIssuesByLabels } from './issues-rest.mjs';

export const MAX_PER_LABEL = 1000;

function gh(execImpl, args) {
  return JSON.parse(execImpl('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) || 'null');
}

// REST says `not_planned`; `gh --json stateReason` (what callers compare against) says `NOT_PLANNED`.
const stateReasonOf = (row) => (row.state_reason ? String(row.state_reason).toUpperCase() : null);

export function fetchIssueComments({
  labels,
  state = 'all',
  repo = process.env.GITHUB_REPOSITORY,
  maxPerLabel = MAX_PER_LABEL,
  execImpl = execFileSync,
  sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)),
  paceMs = 100,
} = {}) {
  if (!labels?.length) throw new Error('at least one --label is required');
  if (!repo) throw new Error('GITHUB_REPOSITORY is not set');
  const reasons = new Map();
  const api = async (path) => {
    const rows = gh(execImpl, ['api', path.replace(/^\//, '')]) || [];
    for (const row of rows) reasons.set(row.number, stateReasonOf(row));
    return rows;
  };
  return (async () => {
    const seen = new Map();
    const truncated = [];
    for (const label of labels) {
      const rows = await listIssuesByLabels(api, { repo, labels: [label], state, limit: maxPerLabel + 1 });
      if (rows.length > maxPerLabel) {
        truncated.push(label);
        rows.length = maxPerLabel;
      }
      for (const row of rows) if (!seen.has(row.number)) seen.set(row.number, reasons.get(row.number) ?? null);
    }
    const out = [];
    for (const [number, stateReason] of seen) {
      const issue = gh(execImpl, ['issue', 'view', String(number), '--repo', repo, '--json', 'number,body,comments']);
      out.push({ number, stateReason, body: issue.body, comments: issue.comments });
      await sleepImpl(paceMs);
    }
    return { issues: out, truncated };
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
    const { issues, truncated } = await fetchIssueComments({ labels, state });
    for (const label of truncated) {
      console.error(`fetch-issue-comments: TRUNCATED label ${label}: more than ${MAX_PER_LABEL} ${state} issues, only the newest ${MAX_PER_LABEL} were read; this set is partial.`);
    }
    process.stdout.write(`${JSON.stringify(issues)}\n`);
  } catch (err) {
    console.error(`fetch-issue-comments: ${err.message}`);
    process.exit(1);
  }
}
