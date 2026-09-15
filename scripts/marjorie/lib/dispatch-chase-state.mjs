// One complete read-only snapshot shared by the ops sweep and the brief.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh as ghRun } from '../../lib/gh.mjs';

const REPO = 'JW-Incorporated/swift2';
const ACTIVITY_EVENTS = new Set(['labeled', 'unlabeled', 'assigned', 'unassigned', 'renamed', 'reopened', 'closed', 'milestoned', 'demilestoned']);

function comment(row) {
  return {
    body: row.body || '', createdAt: row.created_at || row.submitted_at,
    updatedAt: row.updated_at, submittedAt: row.submitted_at,
    author: { login: row.user?.login, type: row.user?.type },
  };
}

function item(row) {
  if (!Number.isSafeInteger(row?.number) || !Number.isFinite(Date.parse(row.created_at)) || !Number.isFinite(Date.parse(row.updated_at))) {
    throw new Error('dispatch chase: invalid item metadata');
  }
  return {
    number: row.number, title: row.title, body: row.body || '',
    createdAt: row.created_at, updatedAt: row.updated_at,
    labels: row.labels || [], assignees: row.assignees || [],
  };
}

export async function fetchDispatchChaseState(repo = REPO, {
  now = Date.now(), ghImpl = ghRun, readFileImpl = readFile,
} = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('dispatch chase: invalid repository');
  async function pages(endpoint) {
    const rows = [];
    for (let page = 1; page <= 20; page += 1) {
      const response = await ghImpl(['api', `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`]);
      if (response.capExhausted) throw new Error('dispatch chase: incomplete history');
      const batch = JSON.parse(response.stdout);
      if (!Array.isArray(batch)) throw new Error('dispatch chase: invalid history');
      rows.push(...batch);
      if (batch.length < 100) return rows;
    }
    throw new Error('dispatch chase: history page cap reached');
  }
  const base = `repos/${repo}`;
  const [rawIssues, rawPRs, openActions, doneActions] = await Promise.all([
    pages(`${base}/issues?state=open&labels=marjorie-filed`),
    pages(`${base}/pulls?state=open`),
    readFileImpl('HUMAN-ACTIONS.md', 'utf8'),
    readFileImpl('HUMAN-ACTIONS-DONE.md', 'utf8'),
  ]);
  const issues = rawIssues.filter((row) => !row.pull_request).map(item);
  const numbers = new Set(issues.map((row) => row.number));
  const prs = rawPRs.filter((row) => [...String(row.body || '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi)]
    .some((match) => numbers.has(Number(match[1])))).map(item);
  async function history(row, isPR) {
    const [comments, events, reviews, commits] = await Promise.all([
      pages(`${base}/issues/${row.number}/comments`),
      pages(`${base}/issues/${row.number}/timeline`),
      isPR ? pages(`${base}/pulls/${row.number}/reviews`) : [],
      isPR ? pages(`${base}/pulls/${row.number}/commits`) : [],
    ]);
    return {
      ...row, comments: comments.map(comment), reviews: reviews.map(comment),
      events: events.filter((event) => ACTIVITY_EVENTS.has(event.event)).map((event) => ({ createdAt: event.created_at })),
      commits: commits.map((commit) => ({ committedDate: commit.commit?.committer?.date })),
    };
  }
  // Bound concurrent network work while retaining every page for each item.
  async function enrich(rows, isPR) {
    const result = [];
    for (const row of rows) result.push(await history(row, isPR));
    return result;
  }
  const [fullIssues, fullPRs] = await Promise.all([enrich(issues, false), enrich(prs, true)]);
  return { issues: fullIssues, prs: fullPRs, openActions, doneActions, now };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fetchDispatchChaseState(process.argv[2] || REPO).then((state) => console.log(JSON.stringify(state))).catch(() => {
    console.error('dispatch chase: snapshot unavailable; no chase authorized');
    process.exitCode = 1;
  });
}
