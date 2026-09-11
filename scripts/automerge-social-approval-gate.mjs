// Pure logic mirror of the "SOCIAL APPROVAL GATE" block in
// .github/workflows/auto-merge-content.yml's `enable` job (2026-09-10
// decision, docs/decisions.md). Kept here, unit-tested directly, and
// mirrored inline in the workflow (that job cannot `import` this file — it
// runs a raw `gh`+bash step, not Node) — automerge-social-approval-gate.test.ts's
// "workflow mirrors this" case keeps the two from drifting apart, same
// contract automerge-branch-author-gate.mjs already documents for itself.

export const SOCIAL_QUEUE_PATH_RE = /^social\/queue\/.*\.json$/;

// A file changed under social/queue/** in any of these ways is a draft the
// PR is adding or altering — that's the thing that now needs a founder's
// merge as its approval. `removed` is deliberately excluded: the poster's
// own fold-back PRs delete queue files as they move to social/posted/
// (social-poster.yml), and declining those would strand them exactly like
// the 2026-08-11/12 Instagram triple-post (issue #2031).
export const TRIPPING_STATUSES = ['added', 'modified', 'renamed', 'copied', 'changed'];

// The poster's own fold-back PRs (branch prefix `social-poster/state-*`,
// opened via .github/actions/commit-and-pr/action.yml) write `attempts+1`
// retry bookkeeping back into an existing social/queue/*.json file — a
// `modified` status, not a new draft. Declining those PRs strands the retry
// counter forever (it never reaches main) and spams #longlive-social asking
// a founder to "approve" internal bookkeeping. Only `modified` is exempted,
// and only on this exact branch prefix — `added` never is, on any branch,
// so a state-update branch can never smuggle in a brand-new draft.
export const STATE_BRANCH_PREFIX = 'social-poster/state-';

/**
 * @param {{status: string, filename: string}[]} filesMeta
 * @param {string} [headRef] - the PR's head branch name
 * @returns {{blocked: boolean, matches: {status: string, filename: string}[]}}
 */
export function evaluateSocialApprovalGate(filesMeta, headRef) {
  // RULINGS-SOCIAL-2.md B3: the merge-triggered stamper (and its
  // STAMP_BRANCH_PREFIX exemption) is deleted — stamping now happens
  // BEFORE the merge, via social-approval-poll.yml, so there is no
  // separate "stamp PR" whose modify needs exempting any more. Only the
  // poster's own state-update branch is exempt.
  const isExemptModifyBranch = typeof headRef === 'string' && headRef.startsWith(STATE_BRANCH_PREFIX);
  const matches = (filesMeta ?? []).filter(
    ({ status, filename }) =>
      typeof filename === 'string' &&
      SOCIAL_QUEUE_PATH_RE.test(filename) &&
      TRIPPING_STATUSES.includes(status) &&
      !(isExemptModifyBranch && status === 'modified'),
  );
  return { blocked: matches.length > 0, matches };
}

// CLI mode (2026-09-10, social-approval-notify.yml — that workflow DOES
// checkout + setup-node, unlike auto-merge-content.yml's `enable` job, which
// has no checkout step at all and so must mirror this logic inline in bash
// instead of importing it). Reads `status<TAB>filename` lines from stdin
// (the same @tsv shape gh api --jq already produces) and prints every
// matching filename, one per line — a thin CLI wrapper, not a second
// implementation, so notify-new and digest can both call it instead of
// duplicating a `node -e` snippet (and the ESM/require bug that caused).
async function main() {
  const { readFileSync } = await import('node:fs');
  const input = readFileSync(0, 'utf8').trim();
  const filesMeta = input
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, filename] = line.split('\t');
      return { status, filename };
    });
  const { matches } = evaluateSocialApprovalGate(filesMeta, process.env.HEAD_REF);
  for (const m of matches) console.log(m.filename);
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'automerge-social-approval-gate.mjs') {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
