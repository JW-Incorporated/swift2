// W7 — which loop asks still need a response, and the caps on filing new ones
// (docs/specs/marjorie-overhaul/l1-loop.md § Live loop). Pure selection plus
// the thin GitHub reads around it; the response routines receive the result
// as a JSON file and never judge a marker or a label themselves.
//
// "Responded" is one thing: a comment by the routine's own identity with a
// line that is `Disposition: <WORD>` (the prompt's one fixed format). The
// repo is public, so only `claude`/`claude[bot]` comments count — a human who
// types the same line cannot mark an ask handled, and cannot un-handle one.
//
// Prompt-injection boundary: the response agent reads ONLY this queue file. It
// holds the body of each bot-filed ask (a loop filing is the workflow identity's
// by construction) and the comments of trusted authors — the workflow and Claude
// bot identities and the owner's own account — and its prompt forbids fetching
// issues or comments itself. A stranger's comment on a public issue never
// reaches the agent.
import { gh as ghRun } from '../../lib/gh.mjs';
import { ERROR_MARKER, FILER_LOGINS, REPO, askKey, fetchAsksFor, parseMarker, selectAsksFor } from './loop-asks.mjs';
import { apiFor, listIssuesByLabels } from './issues-rest.mjs';
import { markedDepth, utcDay } from './loop-dispatch.mjs';

export const DISPOSITIONS = {
  marjorie: ['ACCEPT-NOW', 'SCHEDULE', 'DECLINE', 'REROUTE'],
  tree: ['DOING IT', "CAN'T", 'NEEDS HELP'],
};
export const LOOP_LABELS = [
  ['loop:accepted', '0E8A16', 'Ask accepted — being done now (Marjorie ACCEPT-NOW / Tree DOING IT)'],
  ['loop:scheduled', 'FBCA04', 'Ask scheduled into a named week of the plan'],
  ['loop:declined', 'B60205', 'Ask declined or not doable — the reason is in the Disposition comment'],
  ['loop:rerouted', '1D76DB', 'Ask handed to an engineering issue or to bot1'],
  ['loop:needs-help', 'D93F0B', 'Responder needs something back — a counter-ask was filed'],
];
// How many NEW help asks each side may file per UTC day (Monday's plan asks count too).
export const HELP_DAILY_CAP = { tree: 2, marjorie: 4 };
// Errors and blockers are not discretionary asks: they never use the cap above, only this runaway backstop.
export const ERROR_DAILY_CAP = { tree: 6, marjorie: 6 };
export const RESPONDER_LOGINS = new Set(['claude', 'claude[bot]']);
/** The post-run guard's fallback comment carries this; only the workflow identity's copy counts as an answer. */
export const FALLBACK_MARKER = '<!-- loop-fallback-disposition -->';
const BOT_LOGINS = new Set(['github-actions[bot]', 'github-actions', 'app/github-actions', 'claude', 'claude[bot]']);
const OWNER_LOGIN = 'sffan15-sys';
const OWNER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const COMMENT_CAP = 1000;
const PLAN_CAP = 4000;
const COMMENTS_PER_ASK = 10;
const MARKER_ONLY_RE = /<!-- (?:loop-dispatched|loop-depth)/;
const DISPOSITION_RE = /^\s*\**Disposition:\**\s*(ACCEPT-NOW|SCHEDULE|DECLINE|REROUTE|DOING IT|CAN['’]?T|NEEDS HELP)\b/im;
const BODY_CAP = 1200;
const DAY_MS = 86_400_000;

/**
 * The responder's latest Disposition, or null. `bot` is who is responding. The
 * workflow's own fallback comment (lib/loop-fallback.mjs, marker-bearing, workflow
 * identity only) counts as `NEEDS HELP`, so an ask the agent dropped leaves the queue.
 */
export function parseDisposition(comments, bot) {
  const allowed = new Set(DISPOSITIONS[bot].map((d) => d.replace(/['’]/g, '')));
  let found = null;
  for (const c of comments || []) {
    const login = c?.user?.login ?? c?.author?.login;
    if (FILER_LOGINS.has(login) && String(c.body ?? '').includes(FALLBACK_MARKER)) {
      found = { disposition: 'NEEDS HELP', commentId: c.id ?? null, fallback: true };
      continue;
    }
    if (!RESPONDER_LOGINS.has(login)) continue;
    const word = DISPOSITION_RE.exec(String(c.body ?? ''))?.[1]?.toUpperCase().replace(/['’]/g, '');
    if (word && allowed.has(word)) found = { disposition: word, commentId: c.id ?? null };
  }
  return found;
}

/** Is this comment's author one the response agent may read? */
export function isTrustedAuthor(c) {
  const login = c?.user?.login ?? c?.author?.login;
  if (BOT_LOGINS.has(login)) return true;
  return login === OWNER_LOGIN && c?.user?.type !== 'Bot' && OWNER_ASSOCIATIONS.has(String(c?.author_association ?? '').toUpperCase());
}

/** The last few trusted comments, trimmed, minus the loop's own bookkeeping markers. */
export function trustedComments(comments) {
  return (comments || [])
    .filter((c) => isTrustedAuthor(c) && !MARKER_ONLY_RE.test(String(c.body ?? '')))
    .slice(-COMMENTS_PER_ASK)
    .map((c) => ({ author: c.user?.login ?? c.author?.login, at: c.created_at ?? null, body: String(c.body ?? '').slice(0, COMMENT_CAP) }));
}

const isHeld = (i) => Boolean(parseMarker(i.body)?.contradicts);

/**
 * Open asks addressed to `bot` that have no Disposition yet, `primary` first
 * (when it is still unanswered), then oldest first, at most `limit`.
 * `commentsByNumber` maps issue number → comments. A `⚠️ Contradicts` ask is
 * dropped BEFORE the limit (only a founder settles those; it must not use up a
 * slot). Each item carries its own `depth` (from its markers) and the trusted
 * comments only.
 */
export function selectPending(bot, issues, commentsByNumber, { primary = null, limit = 4, now = Date.now() } = {}) {
  const open = selectAsksFor(bot, issues, { now });
  const pending = open.filter((i) => !isHeld(i) && !parseDisposition(commentsByNumber[i.number], bot));
  const first = pending.filter((i) => i.number === primary);
  const rest = pending.filter((i) => i.number !== primary);
  return [...first, ...rest].slice(0, limit).map((i) => ({
    number: i.number,
    url: i.url,
    title: i.title,
    labels: (i.labels || []).map((l) => l.name),
    createdAt: i.createdAt,
    ageDays: Math.max(0, Math.floor((now - Date.parse(i.createdAt)) / DAY_MS)),
    primary: i.number === primary,
    depth: markedDepth(commentsByNumber[i.number]),
    body: String(i.body ?? '').slice(0, BODY_CAP),
    comments: trustedComments(commentsByNumber[i.number]),
  }));
}

/** The open `weekly-plan` issue, when a trusted identity wrote it (Marjorie's own), else null. */
export async function currentPlan({ repo = REPO, gh = ghRun } = {}) {
  const [plan] = await listIssuesByLabels(apiFor(gh), { repo, labels: ['weekly-plan'], state: 'open', limit: 1 });
  if (!plan || !isTrustedAuthor({ user: plan.author })) return null;
  return { number: plan.number, url: plan.url, title: plan.title, body: String(plan.body ?? '').slice(0, PLAN_CAP) };
}

/** The queue file: reads open asks and the comments of the oldest candidates. */
export async function buildQueue(bot, { primary = null, limit = 4, repo = REPO, gh = ghRun, now = Date.now(), scan = 15 } = {}) {
  const issues = await fetchAsksFor(bot, { repo, gh, state: 'open' });
  // Routine failures (routine-failure-triage.mjs) are loop-ask filings for Marjorie too, labelled `routine-failure` rather than `tree-filed`.
  if (bot === 'marjorie') {
    const failures = await listIssuesByLabels(apiFor(gh), { repo, labels: ['routine-failure', 'desk:ops'], state: 'open' });
    for (const f of failures) if (!issues.some((i) => i.number === f.number)) issues.push(f);
  }
  const candidates = selectAsksFor(bot, issues, { now }).filter((i) => !isHeld(i));
  const ordered = [...candidates.filter((i) => i.number === primary), ...candidates.filter((i) => i.number !== primary)].slice(0, scan);
  const api = apiFor(gh);
  const commentsByNumber = {};
  for (const issue of ordered) commentsByNumber[issue.number] = (await api(`/repos/${repo}/issues/${issue.number}/comments?per_page=100`)) || [];
  return { bot, generatedAt: new Date(now).toISOString(), plan: await currentPlan({ repo, gh }), items: selectPending(bot, ordered, commentsByNumber, { primary, limit, now }) };
}

/** Idempotent: `--force` updates a label that already exists. Never throws. */
export async function ensureLoopLabels({ repo = REPO, gh = ghRun, log = console.log } = {}) {
  for (const [name, color, description] of LOOP_LABELS) {
    try {
      await gh(['label', 'create', name, '--repo', repo, '--color', color, '--description', description, '--force']);
    } catch (err) {
      log(`::warning::loop-queue: could not ensure label ${name}: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
    }
  }
}

/**
 * How many new asks `side` ('tree' | 'marjorie') may still file today, and
 * which of the given asks are already open under the same text.
 */
export async function helpBudget(side, asks, { repo = REPO, gh = ghRun, now = Date.now() } = {}) {
  const addressee = side === 'tree' ? 'marjorie' : 'tree';
  const rows = await fetchAsksFor(addressee, { repo, gh, state: 'all' });
  const today = utcDay(now);
  const filedTodayRows = selectAsksFor(addressee, rows, { now, closedWithinDays: 2 }).filter((i) => utcDay(Date.parse(i.createdAt)) === today);
  const isError = (i) => String(i.body ?? '').includes(ERROR_MARKER);
  const filedToday = filedTodayRows.filter((i) => !isError(i)).length;
  const errorsToday = filedTodayRows.filter(isError).length;
  const openHashes = new Map(selectAsksFor(addressee, rows, { now }).map((i) => [String(parseMarker(i.body)?.key ?? '').split('-').pop(), i.number]));
  const fresh = [];
  const duplicates = [];
  for (const ask of asks) {
    const open = openHashes.get(askKey(side, 0, ask.ask).split('-').pop());
    if (open) duplicates.push({ ask, number: open });
    else fresh.push(ask);
  }
  return { remaining: Math.max(HELP_DAILY_CAP[side] - filedToday, 0), errorRemaining: Math.max(ERROR_DAILY_CAP[side] - errorsToday, 0), filedToday, fresh, duplicates };
}
