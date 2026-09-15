import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextHumanActionNumber } from '../human-actions.mjs';
import { runMain } from '../../lib/cli.mjs';

export const STALE_48_MS = 48 * 60 * 60 * 1000;
export const STALE_96_MS = 96 * 60 * 60 * 1000;
export const MAX_NUDGES = 5;
export const MAX_HUMAN_ACTIONS = 2;

const CHASE_48 = /<!--\s*marjorie-chase:\s*48h\s*-->/i;
const CHASE_96 = /<!--\s*marjorie-chase:\s*96h\s+issue=(\d+)\s*-->/i;
const CLOSES_ISSUE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;
const FOUNDER_QUESTION = /\?|\b(?:founder|joey|@sffan15-sys|please decide|can you|could you)\b/i;

function time(value) {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function labels(item) {
  return (item.labels || [])
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter(Boolean);
}

function authorLogin(comment) {
  return String(comment?.author?.login || comment?.author || comment?.login || '').toLowerCase();
}

function isOwnComment(comment, ownAuthors) {
  if (comment?.viewerDidAuthor || comment?.isMarjorie) return true;
  if (ownAuthors.has(authorLogin(comment))) return true;
  return /<!--\s*marjorie-(?:chase|approval|ops|triage|filed)\b/i.test(String(comment?.body || ''));
}

function commentsOf(item) {
  return [...(item?.comments || []), ...(item?.reviews || [])];
}

function hasMarker(item, marker) {
  return commentsOf(item).some((comment) => marker.test(String(comment.body || '')));
}

function latestOwnCommentAt(item, ownAuthors) {
  return Math.max(
    0,
    ...commentsOf(item)
      .filter((comment) => isOwnComment(comment, ownAuthors))
      .flatMap((comment) => [
        time(comment.createdAt || comment.submittedAt),
        time(comment.updatedAt),
      ]),
  );
}

function sameInstant(a, b) {
  return a > 0 && b > 0 && Math.abs(a - b) < 1000;
}

function latestActivity(item, ownAuthors) {
  const ownAt = latestOwnCommentAt(item, ownAuthors);
  const activity = [time(item.createdAt)];
  const updatedAt = time(item.updatedAt);
  if (!sameInstant(updatedAt, ownAt)) activity.push(updatedAt);
  for (const comment of commentsOf(item)) {
    if (!isOwnComment(comment, ownAuthors)) {
      activity.push(time(comment.createdAt || comment.submittedAt), time(comment.updatedAt));
    }
  }
  for (const event of [
    ...(item.events || []),
    ...(item.labelEvents || []),
    ...(item.assigneeEvents || []),
  ]) {
    activity.push(time(event.createdAt));
  }
  for (const commit of item.commits || [])
    activity.push(time(commit.committedDate || commit.createdAt));
  activity.push(time(item.lastCommitDate || item.lastCommit?.committedDate));
  return Math.max(...activity);
}

function linkedIssues(pr) {
  const found = new Set();
  for (const match of String(pr.body || '').matchAll(CLOSES_ISSUE)) found.add(Number(match[1]));
  return found;
}

function latestHumanQuestion(item, ownAuthors) {
  const human = commentsOf(item)
    .filter((comment) => !isOwnComment(comment, ownAuthors))
    .filter((comment) => String(comment?.author?.type || '').toLowerCase() !== 'bot')
    .sort((a, b) => time(b.createdAt || b.submittedAt) - time(a.createdAt || a.submittedAt))[0];
  return Boolean(human && FOUNDER_QUESTION.test(String(human.body || '')));
}

function linkedPrs(issue, prs) {
  return prs.filter((pr) => linkedIssues(pr).has(Number(issue.number)));
}

function hasFounderBlock(issue, prs, ownAuthors) {
  return (
    latestHumanQuestion(issue, ownAuthors) ||
    prs.some(
      (pr) => labels(pr).includes('needs-human-review') || latestHumanQuestion(pr, ownAuthors),
    )
  );
}

function holder(issue, prs) {
  const pr = [...prs].sort((a, b) => Number(b.number) - Number(a.number))[0];
  if (pr) {
    const prefix = labels(pr).includes('austin-built') ? 'Austin ' : '';
    return `${prefix}PR #${pr.number} awaiting review`;
  }
  const assignee = Array.isArray(issue.assignees) ? issue.assignees[0] : issue.assignee;
  const login = typeof assignee === 'string' ? assignee : assignee?.login;
  if (login) return `assignee @${login}`;
  const bucket = labels(issue).find((label) =>
    /^(ready\/greenlit|bug \(small\/pre-diagnosed\)|bucket:)/i.test(label),
  );
  return bucket ? `Kevin bucket "${bucket.replace(/^bucket:/, '')}"` : 'unclaimed';
}

function nextStep(issue, prs) {
  if (prs.length) return `merge/review #${prs[0].number}`;
  if (!commentsOf(issue).some((comment) => /\bPlan approved\b/i.test(String(comment.body || '')))) {
    return 'a founder comment "Plan approved"';
  }
  return 'pick up or close';
}

function readChaseActions(openActions, doneActions) {
  const active = new Map();
  const held = new Map();
  const scan = (markdown, archived) => {
    let actionNumber = null;
    let status = archived ? 'closed' : 'open';
    for (const line of String(markdown || '').split('\n')) {
      const header = /^##\s+#(\d+)\b/.exec(line);
      const closed = /^-\s+#(\d+)\b.*?\b(skip|done|closed)\b/i.exec(line);
      if (header) actionNumber = Number(header[1]);
      if (closed) {
        actionNumber = Number(closed[1]);
        status = closed[2].toLowerCase();
      }
      const marker = CHASE_96.exec(line);
      if (!marker || !actionNumber) continue;
      if (archived || status !== 'open')
        held.set(Number(marker[1]), { number: actionNumber, status });
      else active.set(Number(marker[1]), actionNumber);
    }
  };
  scan(openActions, false);
  scan(doneActions, true);
  for (const line of String(doneActions || '').split('\n')) {
    const item = /\[DECIDE\]\s+#(\d+)\s+has had no activity/i.exec(line);
    const action = /^-\s+#(\d+)\b.*?\b(skip|done|closed)\b/i.exec(line);
    if (item && action) {
      held.set(Number(item[1]), { number: Number(action[1]), status: action[2].toLowerCase() });
    }
  }
  for (const line of String(doneActions || '').split('\n')) {
    const item = /\[DECIDE\]\s+#(\d+)\s+has had no activity/i.exec(line);
    const action = /^-\s+#(\d+)\s*Â·[^Â·]*Â·\s*(skip|done)\b/i.exec(line);
    if (item && action)
      held.set(Number(item[1]), { number: Number(action[1]), status: action[2].toLowerCase() });
  }
  return { active, held };
}

function humanAction({ number, issue, now, holder: currentHolder }) {
  const started = new Date(issue.createdAt || now).toISOString().slice(0, 10);
  const silentSince = new Date(latestActivity(issue, new Set())).toISOString().slice(0, 10);
  return {
    number,
    issue: issue.number,
    body: `## #${number} ðŸŸ¡ [DECIDE] #${issue.number} has had no activity for 4 days (~2 min)\n<!-- ha filed=${new Date(now).toISOString().slice(0, 10)} -->\n<!-- marjorie-chase: 96h issue=${issue.number} -->\n\n**Why:** Marjorie dispatched it on ${started} (${issue.title}). Nothing has moved since ${silentSince}. Holder: ${currentHolder}.\n\n**Steps:**\n1. Reply in #longlive-marjorie with one word: \`assign\` (a session takes it this week), \`defer\` (she stops chasing; it stays open), or \`close\`.\n\n**Worked if:** the next brief no longer lists #${issue.number} under stalled.`,
  };
}

/**
 * Pure dispatch-chase planner. It returns every item verdict plus the bounded
 * comments and HUMAN-ACTIONS.md blocks that the ops routine must write.
 */
export function evaluateDispatchChase({
  issues = [],
  prs = [],
  openActions = '',
  doneActions = '',
  now = Date.now(),
  ownAuthors = [],
} = {}) {
  const nowMs = time(now);
  const own = new Set(ownAuthors.map((author) => String(author).toLowerCase()));
  const chaseActions = readChaseActions(openActions, doneActions);
  const items = issues
    .map((issue) => {
      const linked = linkedPrs(issue, prs);
      const currentHolder = holder(issue, linked);
      const activityAt = Math.max(
        latestActivity(issue, own),
        ...linked.map((pr) => latestActivity(pr, own)),
      );
      const silenceMs = Math.max(0, nowMs - activityAt);
      const held =
        chaseActions.held.get(Number(issue.number)) ||
        (labels(issue).includes('deferred') ? { status: 'deferred' } : null);
      let verdict = 'fresh';
      if (held) verdict = 'held';
      else if (hasFounderBlock(issue, linked, own)) verdict = 'blocked-on-founder';
      else if (silenceMs >= STALE_96_MS) verdict = 'stale-96';
      else if (silenceMs >= STALE_48_MS) verdict = 'stale-48';
      return {
        issue,
        linkedPrs: linked,
        number: Number(issue.number),
        verdict,
        silenceMs,
        activityAt,
        holder: currentHolder,
        held,
        existingHumanAction: chaseActions.active.get(Number(issue.number)) || null,
      };
    })
    .sort((a, b) => b.silenceMs - a.silenceMs || a.number - b.number);

  const nudges = [];
  for (const item of items.filter((item) => item.verdict === 'stale-48')) {
    if (nudges.length >= MAX_NUDGES) break;
    const targets = [item.issue, ...item.linkedPrs].filter(
      (target) => !hasMarker(target, CHASE_48),
    );
    if (!targets.length) continue;
    const body = `No activity for 2 days. Holder: ${item.holder}. Next: ${nextStep(item.issue, item.linkedPrs)}.\n<!-- marjorie-chase: 48h -->`;
    nudges.push({
      issue: item.number,
      targets: targets.map((target) => ({
        type: target === item.issue ? 'issue' : 'pr',
        number: target.number,
      })),
      body,
    });
  }

  let nextNumber = nextHumanActionNumber(openActions, doneActions);
  const humanActions = [];
  for (const item of items.filter(
    (item) => item.verdict === 'stale-96' && !item.existingHumanAction,
  )) {
    if (humanActions.length >= MAX_HUMAN_ACTIONS) break;
    humanActions.push(
      humanAction({ number: nextNumber, issue: item.issue, now: nowMs, holder: item.holder }),
    );
    nextNumber += 1;
  }

  return {
    items,
    nudges,
    humanActions,
    brief: {
      stalled: items.filter((item) => /^stale-/.test(item.verdict)),
      held: items.filter((item) => item.verdict === 'held'),
    },
  };
}

async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function main(argv = process.argv.slice(2)) {
  if (argv[0] !== 'plan') {
    console.error('Usage: dispatch-chase.mjs plan (stdin JSON)');
    return 2;
  }
  console.log(JSON.stringify(evaluateDispatchChase(await readStdinJson())));
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'dispatch-chase' });
}
