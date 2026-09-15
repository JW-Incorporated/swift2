import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../../lib/cli.mjs';

export const STALE_48_MS = 48 * 60 * 60 * 1000;
export const STALE_96_MS = 96 * 60 * 60 * 1000;
export const MAX_NUDGES = 5;
export const MAX_HUMAN_ACTIONS = 2;

const CHASE_48 = /<!--\s*marjorie-chase:\s*48h\s*-->/i;
const CHASE_96 = /<!--\s*marjorie-chase:\s*96h\s+issue=(\d+)\b[^>]*-->/i;
const CLOSES_ISSUE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;
const FOUNDER_ADDRESS = /@sffan15-sys|\b(?:founder|joey)\b/i;

function time(value) {
  const result = new Date(value || 0).getTime();
  return Number.isFinite(result) ? result : 0;
}

function labels(item) {
  return (item.labels || [])
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter(Boolean);
}

function commentsOf(item) {
  return [...(item?.comments || []), ...(item?.reviews || [])];
}

function ownComment(comment, ownAuthors) {
  const login = String(
    comment?.author?.login || comment?.author || comment?.login || '',
  ).toLowerCase();
  return Boolean(
    comment?.viewerDidAuthor ||
    comment?.isMarjorie ||
    ownAuthors.has(login) ||
    /<!--\s*marjorie-(?:chase|approval|ops|triage|filed)\b/i.test(String(comment?.body || '')),
  );
}

function hasMarker(item, marker) {
  return commentsOf(item).some((comment) => marker.test(String(comment.body || '')));
}

function latestActivity(item, ownAuthors) {
  const ownAt = Math.max(
    0,
    ...commentsOf(item)
      .filter((comment) => ownComment(comment, ownAuthors))
      .flatMap((comment) => [
        time(comment.createdAt || comment.submittedAt),
        time(comment.updatedAt),
      ]),
  );
  const activity = [time(item.createdAt)];
  const updatedAt = time(item.updatedAt);
  if (!(updatedAt && ownAt && Math.abs(updatedAt - ownAt) < 1000)) activity.push(updatedAt);
  for (const comment of commentsOf(item)) {
    if (!ownComment(comment, ownAuthors))
      activity.push(time(comment.createdAt || comment.submittedAt), time(comment.updatedAt));
  }
  for (const event of [
    ...(item.events || []),
    ...(item.labelEvents || []),
    ...(item.assigneeEvents || []),
  ])
    activity.push(time(event.createdAt));
  for (const commit of item.commits || [])
    activity.push(time(commit.committedDate || commit.createdAt));
  activity.push(time(item.lastCommitDate || item.lastCommit?.committedDate));
  return Math.max(...activity);
}

function linkedIssueNumbers(pr) {
  const numbers = new Set();
  for (const match of String(pr.body || '').matchAll(CLOSES_ISSUE)) numbers.add(Number(match[1]));
  return numbers;
}

function humanQuestion(item, ownAuthors) {
  const latest = commentsOf(item)
    .filter(
      (comment) =>
        !ownComment(comment, ownAuthors) &&
        String(comment?.author?.type || '').toLowerCase() !== 'bot',
    )
    .sort((a, b) => time(b.createdAt || b.submittedAt) - time(a.createdAt || a.submittedAt))[0];
  const body = String(latest?.body || '');
  return Boolean(latest && /\?/.test(body) && FOUNDER_ADDRESS.test(body));
}

function holder(issue, prs) {
  const pr = [...prs].sort((a, b) => Number(b.number) - Number(a.number))[0];
  if (pr)
    return `${labels(pr).includes('austin-built') ? 'Austin ' : ''}PR #${pr.number} awaiting review`;
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
  if (!commentsOf(issue).some((comment) => /\bPlan approved\b/i.test(String(comment.body || ''))))
    return 'a founder comment "Plan approved"';
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
      if (header) {
        actionNumber = Number(header[1]);
        status = archived ? 'closed' : 'open';
      }
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
    if (item && action)
      held.set(Number(item[1]), { number: Number(action[1]), status: action[2].toLowerCase() });
  }
  return { active, held };
}

function clip(value, max) {
  const text = String(value || '');
  return text.length <= max ? text : `${text.slice(0, max - 1)}\u2026`;
}

/** Materialize a previously-planned candidate only after fresh HA allocation. */
export function renderHumanAction({ number, issue, title, createdAt, now, holder: currentHolder, activityAt }) {
  const source = typeof issue === 'object' ? issue : { number: issue, title, createdAt };
  const started = new Date(source.createdAt || now).toISOString().slice(0, 10);
  const silentSince = new Date(activityAt || now).toISOString().slice(0, 10);
  const why = clip(
    `Marjorie dispatched it on ${started} (${clip(source.title, 90)}). Nothing has moved since ${silentSince}. Holder: ${clip(currentHolder, 90)}.`,
    300,
  );
  const step = clip(
    '1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.',
    200,
  );
  return {
    number,
    issue: source.number,
    body: `## #${number} \u{1F7E1} [DECIDE] #${source.number} has had no activity for 4 days (~2 min)\n<!-- ha filed=${new Date(now).toISOString().slice(0, 10)} -->\n<!-- marjorie-chase: 96h issue=${source.number} -->\n\n**Why:** ${why}\n\n**Steps:**\n${step}\n\n**Worked if:** the next brief no longer lists #${source.number} under stalled.`,
  };
}

/** Pure planner: classifies every dispatched item and returns bounded writes. */
export function evaluateDispatchChase({
  issues = [],
  prs = [],
  openActions = '',
  doneActions = '',
  pendingHaPrs = [],
  now = Date.now(),
  ownAuthors = [],
} = {}) {
  const nowMs = time(now);
  const own = new Set(ownAuthors.map((author) => String(author).toLowerCase()));
  const chaseActions = readChaseActions([openActions, ...pendingHaPrs.map((pr) => pr.actionsText)].join('\n'), doneActions);
  const items = issues
    .map((issue) => {
      const linkedPrs = prs.filter((pr) => linkedIssueNumbers(pr).has(Number(issue.number)));
      const activityAt = Math.max(
        latestActivity(issue, own),
        ...linkedPrs.map((pr) => latestActivity(pr, own)),
      );
      const silenceMs = Math.max(0, nowMs - activityAt);
      const held =
        chaseActions.held.get(Number(issue.number)) ||
        (labels(issue).includes('deferred') ? { status: 'deferred' } : null);
      const blocked =
        humanQuestion(issue, own) ||
        linkedPrs.some((pr) => labels(pr).includes('needs-human-review') || humanQuestion(pr, own));
      const verdict = held
        ? 'held'
        : blocked
          ? 'blocked-on-founder'
          : silenceMs >= STALE_96_MS
            ? 'stale-96'
            : silenceMs >= STALE_48_MS
              ? 'stale-48'
              : 'fresh';
      return {
        issue,
        linkedPrs,
        number: Number(issue.number),
        verdict,
        silenceMs,
        activityAt,
        holder: holder(issue, linkedPrs),
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

  const humanActions = [];
  for (const item of items.filter(
    (item) => item.verdict === 'stale-96' && !item.existingHumanAction,
  )) {
    if (humanActions.length >= MAX_HUMAN_ACTIONS) break;
    // Number allocation is intentionally deferred until the mutation pass.
    // A snapshot can be stale while another HA PR is waiting to merge.
    humanActions.push({
      issue: item.number,
      title: item.issue.title,
      createdAt: item.issue.createdAt,
      activityAt: item.activityAt,
      holder: item.holder,
    });
  }
  return {
    items,
    nudges,
    humanActions,
    pendingHumanActions: pendingHaPrs.filter((pr) => /^marjorie\/chase-ha-\d+(?:-\d+)*$/.test(pr.headRef || '')).map((pr) => pr.number),
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  runMain(main, { name: 'dispatch-chase' });
