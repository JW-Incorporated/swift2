// Founder decision 2026-10-06: a 96h chase HA that sits open 7 days with no
// founder reply defaults to `defer` instead of waiting forever. Same marker and
// label as a typed `defer` (chase-action.mjs), then the HA closes as `skip`.
import { readFile, writeFile } from 'node:fs/promises';
import { actionMarker } from './chase-action.mjs';
import { closeHumanAction, laToday } from '../ha-close.mjs';

export const AUTO_DEFER_MS = 7 * 24 * 60 * 60 * 1000;
export const AUTO_DEFER_MESSAGE = 'auto-7d';
export const AUTO_DEFER_BRANCH = 'marjorie/chase-auto-defer-ha-';
export const AUTO_DEFER_NOTE = 'auto-deferred after 7 days of silence (founder decision 2026-10-06)';
// Real founder/product decisions are never defaulted: they keep asking.
export const AUTO_DEFER_EXCEPTIONS = {
  'founder-decision': 'needs a founder answer (banked into the Founders Brief)',
  'desk:founder': 'a human founder owes the action (TX items, legal, product intent)',
  'founder-task': 'a human founder must personally act',
};

const HA_BLOCK = /(?=^## #\d+\s)/m;
const BOT_LOGINS = ['app/claude', 'claude[bot]', 'claude'];
const MARKER = /^<!-- marjorie-chase-action: HA=(\d+) issue=(\d+) action=(\w+) message=(\S+) -->$/;
const labelsOf = (issue) => (issue?.labels || []).map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean);

// A typed reply's marker is only trusted from the bot, as chase-action.mjs already() does.
// Our own auto marker is posted under the job's PAT, so it is trusted only from `author` (AUTO_DEFER_AUTHOR).
function actionMarkers(issue, author) {
  return (issue?.comments || []).flatMap((c) => {
    const m = MARKER.exec(String(c.body || '').trimEnd().split(/\r?\n/).at(-1).trim());
    const who = c?.author || c?.user;
    const bot = (who?.type === 'Bot' || who?.__typename === 'Bot') && BOT_LOGINS.includes(who.login);
    return m && (bot || (m[4] === AUTO_DEFER_MESSAGE && Boolean(author) && (c?.author || c?.user)?.login === author)) ? [{ ha: Number(m[1]), issue: Number(m[2]), action: m[3], message: m[4] }] : [];
  });
}

const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

/** Pure eligibility for one chase HA; null = leave it alone. */
export function autoDeferState(issue, ha, author) {
  const markers = actionMarkers(issue, author).filter((m) => m.ha === ha);
  const auto = markers.some((m) => m.message === AUTO_DEFER_MESSAGE && m.action === 'defer');
  const labels = labelsOf(issue);
  if (!auto && (markers.length || labels.includes('deferred') || labels.includes('founder-assigned'))) return null;
  if (labels.some((label) => label in AUTO_DEFER_EXCEPTIONS)) return null;
  return { commented: auto, labeled: labels.includes('deferred') };
}

/** Pure: open chase HAs due for the silence default (7 days, America/Los_Angeles). */
export function planAutoDefers({ issues = [], openActions = '', pendingHaPrs = [], now = Date.now(), author = process.env.AUTO_DEFER_AUTHOR } = {}) {
  const today = laToday(new Date(Number(now)));
  const pending = new Set(pendingHaPrs.flatMap((pr) => {
    const ref = String(pr.headRef || '');
    return ref.startsWith(AUTO_DEFER_BRANCH) ? ref.slice(AUTO_DEFER_BRANCH.length).split('-').map(Number) : [];
  }));
  const due = [];
  for (const block of String(openActions).split(HA_BLOCK)) {
    const ha = /^## #(\d+)\s/m.exec(block);
    const issueNo = /^<!-- marjorie-chase: 96h issue=(\d+) -->$/m.exec(block);
    const filed = /^<!-- ha filed=(\d{4}-\d{2}-\d{2}) -->$/m.exec(block);
    if (!ha || !issueNo || !filed || today < addDays(filed[1], 7)) continue;
    const number = Number(ha[1]);
    if (pending.has(number)) continue;
    const issue = issues.find((item) => Number(item.number) === Number(issueNo[1]));
    const state = issue && autoDeferState(issue, number, author);
    if (state) due.push({ ha: number, issue: Number(issueNo[1]), ...state });
  }
  return due;
}

export function autoDeferComment({ ha, issue }) {
  return `Auto-deferred: no founder reply to the chase (HA #${ha}) in 7 days, so it defaulted to \`defer\` (founder decision 2026-10-06). Marjorie has stopped chasing this issue; it stays open. To re-open the chase, remove the \`deferred\` label and delete this issue's line from HUMAN-ACTIONS-DONE.md.\n\n${actionMarker({ ha, issue, action: 'defer', messageId: AUTO_DEFER_MESSAGE })}`;
}

const text = (result) => String(result?.stdout ?? result ?? '');

/** Fresh labels and comments, read right before any write. */
async function freshIssue(repo, number, exec) {
  const issue = JSON.parse(text(await exec('gh', ['api', `repos/${repo}/issues/${number}`])) || '{}');
  const comments = JSON.parse(text(await exec('gh', ['api', `repos/${repo}/issues/${number}/comments`, '--paginate', '--slurp'])) || '[]').flat();
  return { labels: issue.labels || [], comments: comments.map((c) => ({ body: c.body || '', author: { login: c.user?.login, type: c.user?.type } })) };
}

/** Applies the GitHub half per item, then closes the HAs as skip in one auto-merged PR. */
export async function applyAutoDefers(repo, candidates, { exec, now = Date.now(), readFileImpl = readFile, writeFileImpl = writeFile, author = process.env.AUTO_DEFER_AUTHOR, fetchIssue = (number) => freshIssue(repo, number, exec) }) {
  const applied = [];
  for (const planned of candidates) {
    try {
      const fresh = autoDeferState(await fetchIssue(planned.issue), planned.ha, author);
      if (!fresh) {
        console.log(`::warning::auto-defer HA #${planned.ha}: a reply or exception appeared, skipped`);
        continue;
      }
      const item = { ...planned, ...fresh };
      if (!item.commented) await exec('gh', ['issue', 'comment', String(item.issue), '--repo', repo, '--body', autoDeferComment(item)]);
      if (!item.labeled) await exec('gh', ['issue', 'edit', String(item.issue), '--repo', repo, '--add-label', 'deferred']);
      applied.push(item);
    } catch (error) {
      console.log(`::warning::auto-defer HA #${planned.ha} failed: ${String(error?.message || error).slice(0, 200)}`);
    }
  }
  if (!applied.length) return { status: 'none' };
  const branch = `${AUTO_DEFER_BRANCH}${applied.map((item) => item.ha).sort((a, b) => a - b).join('-')}`;
  await exec('git', ['checkout', '--detach', 'origin/main']);
  await exec('git', ['checkout', '-b', branch]);
  let open = await readFileImpl('HUMAN-ACTIONS.md', 'utf8');
  let done = await readFileImpl('HUMAN-ACTIONS-DONE.md', 'utf8');
  for (const item of applied) {
    const closed = closeHumanAction(open, done, { number: item.ha, date: laToday(new Date(now)), note: AUTO_DEFER_NOTE, by: 'marjorie (auto-defer)', outcome: 'skip' });
    if (!closed.ok) throw new Error(`auto-defer: ${closed.reason}`);
    ({ open, done } = closed);
  }
  await writeFileImpl('HUMAN-ACTIONS.md', open);
  await writeFileImpl('HUMAN-ACTIONS-DONE.md', done);
  await exec('git', ['add', 'HUMAN-ACTIONS.md', 'HUMAN-ACTIONS-DONE.md']);
  await exec('git', ['commit', '-m', `chore(marjorie): auto-defer silent chases ${applied.map((item) => `HA #${item.ha}`).join(', ')}`]);
  await exec('git', ['push', '-u', 'origin', branch]);
  const ids = applied.map((item) => `#${item.issue}`).join(', ');
  const body = `Closes the chase HAs for ${ids} as skip: ${AUTO_DEFER_NOTE}.`;
  const url = text(await exec('gh', ['pr', 'create', '--repo', repo, '--base', 'main', '--head', branch, '--title', `Marjorie: auto-defer chases ${ids}`, '--body', body])).trim();
  if (!/\/pull\/\d+$/.test(url)) throw new Error('auto-defer: PR creation was not confirmed');
  await exec('gh', ['pr', 'merge', branch, '--repo', repo, '--squash', '--auto', '--delete-branch']);
  await exec('git', ['checkout', '--detach', 'origin/main']);
  return { status: 'auto-deferred', branch, ha: applied.map((item) => item.ha) };
}
