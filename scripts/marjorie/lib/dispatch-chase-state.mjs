// One complete read-only snapshot shared by the ops sweep and the brief.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh as ghRun } from '../../lib/gh.mjs';
import { readHeldMarkers } from './status-held.mjs';

const REPO = 'JW-Incorporated/swift2';
const PAGE_CAP = 20;
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

function isNotFound(err) {
  return err?.status === 404 || /\b404\b|Not Found/i.test(`${err?.message || ''} ${err?.stderr || ''}`);
}

export async function fetchDispatchChaseState(repo = REPO, {
  now = Date.now(), ghImpl = ghRun, readFileImpl = readFile,
} = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('dispatch chase: invalid repository');
  // Reads up to the page cap and reports whether the list ended inside it, so a
  // caller can choose between failing closed and skipping one oversized list.
  async function boundedPages(endpoint) {
    const rows = [];
    for (let page = 1; page <= PAGE_CAP; page += 1) {
      const response = await ghImpl(['api', `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`]);
      if (response.capExhausted) throw new Error('dispatch chase: incomplete history');
      const batch = JSON.parse(response.stdout);
      if (!Array.isArray(batch)) throw new Error('dispatch chase: invalid history');
      rows.push(...batch);
      if (batch.length < 100) return { rows, complete: true };
    }
    return { rows, complete: false };
  }
  // Every verdict below depends on complete history: truncation fails closed.
  async function pages(endpoint) {
    const { rows, complete } = await boundedPages(endpoint);
    if (!complete) throw new Error('dispatch chase: history page cap reached');
    return rows;
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
  const pendingHaPrs = [];
  const skippedHaPrs = [];
  for (const pr of rawPRs) {
    // One oversized PR must not take the whole sweep down: its file list is
    // unreadable, so record the skip loudly instead of failing the snapshot.
    const { rows: files, complete } = await boundedPages(`${base}/pulls/${pr.number}/files`);
    if (!complete) {
      skippedHaPrs.push({ number: pr.number, reason: 'file-list-over-cap', url: `https://github.com/${repo}/pull/${pr.number}` });
      console.warn(`dispatch chase: PR #${pr.number} changed more than ${PAGE_CAP * 100} files; its HUMAN-ACTIONS.md status is unknown and it is skipped from pendingHaPrs`);
      continue;
    }
    if (!files.some((file) => file.filename === 'HUMAN-ACTIONS.md' && file.status !== 'removed')) continue;
    if (!/^[a-f0-9]{40}$/i.test(pr.head?.sha || '')) throw new Error('dispatch chase: invalid pending head');
    let response;
    try {
      response = await ghImpl(['api', `${base}/contents/HUMAN-ACTIONS.md?ref=${pr.head.sha}`]);
    } catch (err) {
      if (!isNotFound(err)) throw new Error(`dispatch chase: PR #${pr.number} pending actions fetch failed: ${err?.message || err}`, { cause: err });
      console.warn(`dispatch chase: PR #${pr.number} has no HUMAN-ACTIONS.md at its head (404); treating as no pending HA content`);
      continue;
    }
    const content = JSON.parse(response.stdout);
    if (response.capExhausted || content.encoding !== 'base64' || typeof content.content !== 'string') {
      throw new Error('dispatch chase: unreadable pending actions');
    }
    pendingHaPrs.push({ number: pr.number, headRef: pr.head.ref, headSha: pr.head.sha,
      safeChaseHead: files.length === 1 && pr.head.repo?.full_name === repo && pr.base?.ref === 'main',
      body: pr.body || '', url: `https://github.com/${repo}/pull/${pr.number}`, actionsText: Buffer.from(content.content, 'base64').toString('utf8') });
  }
  const reportedHeld = [];
  const briefs = await pages(`${base}/issues?state=all&labels=founders-brief`);
  for (const brief of briefs.filter((row) => !row.pull_request)) {
    const markers = [...String(brief.body || '').matchAll(/<!--\s*marjorie-held:\s*issue=(\d+)\s+ha=(\d+)\s*-->/g)];
    if (!markers.length) continue;
    const delivered = /<!--\s*discord-message-id:\s*\d+\s*-->/;
    const comments = delivered.test(brief.body) ? [] : await pages(`${base}/issues/${brief.number}/comments`);
    if (comments.some((row) => typeof row.body !== 'string')) throw new Error('dispatch chase: unreadable delivery');
    if (delivered.test(brief.body) || comments.some((row) => delivered.test(row.body))) {
      reportedHeld.push(...markers.map((match) => ({ issue: Number(match[1]), ha: Number(match[2]) })));
    }
  }
  // Bots v2 W4: held items are reported on the status page, whose body carries the same markers.
  for (const page of (await pages(`${base}/issues?state=open&labels=status-page`)).filter((row) => !row.pull_request)) {
    reportedHeld.push(...readHeldMarkers(page.body));
  }
  const [fullIssues, fullPRs] = await Promise.all([enrich(issues, false), enrich(prs, true)]);
  return { issues: fullIssues, prs: fullPRs, openActions, doneActions, pendingHaPrs, skippedHaPrs, reportedHeld, now };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fetchDispatchChaseState(process.argv[2] || REPO).then((state) => console.log(JSON.stringify(state))).catch((err) => {
    console.error(`dispatch chase: snapshot unavailable; no chase authorized (${err?.message || err})`);
    process.exitCode = 1;
  });
}
