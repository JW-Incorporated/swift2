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

/**
 * @param {{status: string, filename: string}[]} filesMeta
 * @returns {{blocked: boolean, matches: {status: string, filename: string}[]}}
 */
export function evaluateSocialApprovalGate(filesMeta) {
  const matches = (filesMeta ?? []).filter(
    ({ status, filename }) =>
      typeof filename === 'string' &&
      SOCIAL_QUEUE_PATH_RE.test(filename) &&
      TRIPPING_STATUSES.includes(status),
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
  const { matches } = evaluateSocialApprovalGate(filesMeta);
  for (const m of matches) console.log(m.filename);
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'automerge-social-approval-gate.mjs') {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
