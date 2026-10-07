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
const labelsOf = (issue) => (issue?.labels || []).map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean);

function actionMarkers(issue) {
  return (issue?.comments || []).flatMap((c) => [...String(c.body || '').matchAll(/<!-- marjorie-chase-action: HA=(\d+) issue=(\d+) action=(\w+) message=(\S+) -->/g)]
    .map((m) => ({ ha: Number(m[1]), issue: Number(m[2]), action: m[3], message: m[4] })));
}

/** Pure: open chase HAs due for the silence default. */
export function planAutoDefers({ issues = [], openActions = '', now = Date.now() } = {}) {
  const due = [];
  for (const block of String(openActions).split(HA_BLOCK)) {
    const ha = /^## #(\d+)\s/m.exec(block);
    const issueNo = /^<!-- marjorie-chase: 96h issue=(\d+) -->$/m.exec(block);
    const filed = /^<!-- ha filed=(\d{4}-\d{2}-\d{2}) -->$/m.exec(block);
    if (!ha || !issueNo || !filed) continue;
    if (Number(now) - Date.parse(`${filed[1]}T00:00:00Z`) < AUTO_DEFER_MS) continue;
    const number = Number(ha[1]);
    const issue = issues.find((item) => Number(item.number) === Number(issueNo[1]));
    if (!issue) continue;
    const markers = actionMarkers(issue).filter((m) => m.ha === number);
    const auto = markers.some((m) => m.message === AUTO_DEFER_MESSAGE && m.action === 'defer');
    const labels = labelsOf(issue);
    if (!auto) {
      if (markers.length || labels.includes('deferred') || labels.includes('founder-assigned')) continue;
      if (labels.some((label) => label in AUTO_DEFER_EXCEPTIONS)) continue;
    }
    due.push({ ha: number, issue: Number(issueNo[1]), commented: auto, labeled: labels.includes('deferred') });
  }
  return due;
}

export function autoDeferComment({ ha, issue }) {
  return `Auto-deferred: no founder reply to the chase (HA #${ha}) in 7 days, so it defaulted to \`defer\` (founder decision 2026-10-06). Marjorie has stopped chasing this issue; it stays open. To re-open the chase, remove the \`deferred\` label and delete this issue's line from HUMAN-ACTIONS-DONE.md.\n\n${actionMarker({ ha, issue, action: 'defer', messageId: AUTO_DEFER_MESSAGE })}`;
}

const text = (result) => String(result?.stdout ?? result ?? '');

/** Applies the GitHub half, then closes the HAs as skip in one auto-merged PR. */
export async function applyAutoDefers(repo, candidates, { exec, pendingHaPrs = [], now = Date.now(), readFileImpl = readFile, writeFileImpl = writeFile }) {
  if (!candidates.length) return { status: 'none' };
  for (const item of candidates) {
    if (!item.commented) await exec('gh', ['issue', 'comment', String(item.issue), '--repo', repo, '--body', autoDeferComment(item)]);
    if (!item.labeled) await exec('gh', ['issue', 'edit', String(item.issue), '--repo', repo, '--add-label', 'deferred']);
  }
  if (pendingHaPrs.some((pr) => String(pr.headRef || '').startsWith(AUTO_DEFER_BRANCH))) return { status: 'close-pending' };
  const branch = `${AUTO_DEFER_BRANCH}${candidates.map((item) => item.ha).sort((a, b) => a - b).join('-')}`;
  await exec('git', ['checkout', '--detach', 'origin/main']);
  await exec('git', ['checkout', '-b', branch]);
  let open = await readFileImpl('HUMAN-ACTIONS.md', 'utf8');
  let done = await readFileImpl('HUMAN-ACTIONS-DONE.md', 'utf8');
  for (const item of candidates) {
    const closed = closeHumanAction(open, done, { number: item.ha, date: laToday(new Date(now)), note: AUTO_DEFER_NOTE, by: 'marjorie (auto-defer)', outcome: 'skip' });
    if (!closed.ok) throw new Error(`auto-defer: ${closed.reason}`);
    ({ open, done } = closed);
  }
  await writeFileImpl('HUMAN-ACTIONS.md', open);
  await writeFileImpl('HUMAN-ACTIONS-DONE.md', done);
  await exec('git', ['add', 'HUMAN-ACTIONS.md', 'HUMAN-ACTIONS-DONE.md']);
  await exec('git', ['commit', '-m', `chore(marjorie): auto-defer silent chases ${candidates.map((item) => `HA #${item.ha}`).join(', ')}`]);
  await exec('git', ['push', '-u', 'origin', branch]);
  const ids = candidates.map((item) => `#${item.issue}`).join(', ');
  const body = `Closes the chase HAs for ${ids} as skip: ${AUTO_DEFER_NOTE}.`;
  const url = text(await exec('gh', ['pr', 'create', '--repo', repo, '--base', 'main', '--head', branch, '--title', `Marjorie: auto-defer chases ${ids}`, '--body', body])).trim();
  if (!/\/pull\/\d+$/.test(url)) throw new Error('auto-defer: PR creation was not confirmed');
  await exec('gh', ['pr', 'merge', branch, '--repo', repo, '--squash', '--auto', '--delete-branch']);
  await exec('git', ['checkout', '--detach', 'origin/main']);
  return { status: 'auto-deferred', branch, ha: candidates.map((item) => item.ha) };
}
