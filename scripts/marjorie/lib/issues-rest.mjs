// Issues by label from the REST issues list — the primary store, not the
// search index (docs/specs/marjorie-overhaul/l1-loop.md).
//
// `gh issue list --label` answers through GraphQL `search(type:
// ISSUE_ADVANCED)` in gh 2.95, for one label as much as two, and the search
// index lags a fresh create by seconds. L1's live smoke run hit exactly
// that: a lookup 1.2 s after filing #4252 missed it and filed duplicate
// #4253 (run 34769463519). `GET /repos/{repo}/issues` reads the issues
// themselves, and `labels=a,b` ANDs.
//
// Rows come back in `gh --json` shape so every caller's matching code is
// unchanged. Goes through `gh api`, so it needs the gh CLI — present on
// every Actions runner these routines use.
import { URLSearchParams } from 'node:url';

export function toGhShape(issue) {
  return {
    number: issue.number,
    title: issue.title,
    url: issue.html_url ?? issue.url,
    body: issue.body ?? '',
    author: issue.author ?? { login: issue.user?.login },
    labels: (issue.labels || []).map((l) => ({ name: l.name })),
    state: String(issue.state ?? '').toUpperCase(),
    createdAt: issue.created_at ?? issue.createdAt,
    closedAt: issue.closed_at ?? issue.closedAt ?? null,
  };
}

/** Newest first, pull requests dropped, at most `limit` rows. */
export async function listIssuesByLabels(gh, { repo, labels, state = 'open', limit = 200 }) {
  const rows = [];
  for (let page = 1; rows.length < limit; page += 1) {
    const query = new URLSearchParams({
      labels: labels.join(','), state, sort: 'created', direction: 'desc', per_page: '100', page: String(page),
    });
    const { stdout } = await gh(['api', `repos/${repo}/issues?${query}`]);
    const batch = JSON.parse(stdout || '[]');
    rows.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) break;
  }
  return rows.slice(0, limit).map(toGhShape);
}
