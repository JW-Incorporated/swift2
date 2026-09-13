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
// unchanged. `api(path)` returns parsed JSON; callers pass `ghApi` from
// scripts/lib/gh.mjs, which works with or without the gh CLI.
import { URLSearchParams } from 'node:url';
import { gh as ghRun, ghApi } from '../../lib/gh.mjs';

/** Production reads through ghApi (works with or without the gh CLI); an
 * injected test `gh` is adapted so its fake keeps answering `gh api <path>`. */
export function apiFor(gh) {
  if (gh === ghRun) return ghApi;
  return async (path) => JSON.parse((await gh(['api', path.startsWith('/') ? path.slice(1) : path])).stdout || '[]');
}

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
export async function listIssuesByLabels(api, { repo, labels, state = 'open', limit = 200 }) {
  const rows = [];
  for (let page = 1; rows.length < limit; page += 1) {
    const query = new URLSearchParams({
      labels: labels.join(','), state, sort: 'created', direction: 'desc', per_page: '100', page: String(page),
    });
    const batch = (await api(`/repos/${repo}/issues?${query}`)) || [];
    rows.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) break;
  }
  return rows.slice(0, limit).map(toGhShape);
}
