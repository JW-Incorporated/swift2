// W7 — which loop asks still need a response, and the caps on filing new ones
// (docs/specs/marjorie-overhaul/l1-loop.md § Live loop). Pure selection plus
// the thin GitHub reads around it; the response routines receive the result
// as a JSON file and never judge a marker or a label themselves.
//
// "Responded" is one thing: a comment by the routine's own identity with a
// line that is `Disposition: <WORD>` (the prompt's one fixed format). The
// repo is public, so only `claude`/`claude[bot]` comments count — a human who
// types the same line cannot mark an ask handled, and cannot un-handle one.
import { gh as ghRun } from '../../lib/gh.mjs';
import { REPO, askKey, fetchAsksFor, parseMarker, selectAsksFor } from './loop-asks.mjs';
import { apiFor } from './issues-rest.mjs';
import { utcDay } from './loop-dispatch.mjs';

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
const RESPONDER_LOGINS = new Set(['claude', 'claude[bot]']);
const DISPOSITION_RE = /^\s*\**Disposition:\**\s*(ACCEPT-NOW|SCHEDULE|DECLINE|REROUTE|DOING IT|CAN['’]?T|NEEDS HELP)\b/im;
const BODY_CAP = 1200;
const DAY_MS = 86_400_000;

/** The responder's latest Disposition, or null. `bot` is who is responding. */
export function parseDisposition(comments, bot) {
  const allowed = new Set(DISPOSITIONS[bot].map((d) => d.replace(/['’]/g, '')));
  let found = null;
  for (const c of comments || []) {
    if (!RESPONDER_LOGINS.has(c?.user?.login ?? c?.author?.login)) continue;
    const word = DISPOSITION_RE.exec(String(c.body ?? ''))?.[1]?.toUpperCase().replace(/['’]/g, '');
    if (word && allowed.has(word)) found = { disposition: word, commentId: c.id ?? null };
  }
  return found;
}

/**
 * Open asks addressed to `bot` that have no Disposition yet, `primary` first
 * (when it is still unanswered), then oldest first, at most `limit`.
 * `commentsByNumber` maps issue number → comments. A `⚠️ Contradicts` ask is
 * listed as `held` — only a founder settles those.
 */
export function selectPending(bot, issues, commentsByNumber, { primary = null, limit = 4, now = Date.now() } = {}) {
  const open = selectAsksFor(bot, issues, { now });
  const pending = open.filter((i) => !parseDisposition(commentsByNumber[i.number], bot));
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
    held: Boolean(parseMarker(i.body)?.contradicts),
    body: String(i.body ?? '').slice(0, BODY_CAP),
  }));
}

/** The queue file: reads open asks and the comments of the oldest candidates. */
export async function buildQueue(bot, { primary = null, limit = 4, repo = REPO, gh = ghRun, now = Date.now(), scan = 15 } = {}) {
  const issues = await fetchAsksFor(bot, { repo, gh, state: 'open' });
  const candidates = selectAsksFor(bot, issues, { now });
  const ordered = [...candidates.filter((i) => i.number === primary), ...candidates.filter((i) => i.number !== primary)].slice(0, scan);
  const api = apiFor(gh);
  const commentsByNumber = {};
  for (const issue of ordered) commentsByNumber[issue.number] = (await api(`/repos/${repo}/issues/${issue.number}/comments?per_page=100`)) || [];
  return { bot, generatedAt: new Date(now).toISOString(), items: selectPending(bot, ordered, commentsByNumber, { primary, limit, now }) };
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
  const filedToday = selectAsksFor(addressee, rows, { now, closedWithinDays: 2 }).filter((i) => utcDay(Date.parse(i.createdAt)) === today).length;
  const openHashes = new Map(selectAsksFor(addressee, rows, { now }).map((i) => [String(parseMarker(i.body)?.key ?? '').split('-').pop(), i.number]));
  const fresh = [];
  const duplicates = [];
  for (const ask of asks) {
    const open = openHashes.get(askKey(side, 0, ask.ask).split('-').pop());
    if (open) duplicates.push({ ask, number: open });
    else fresh.push(ask);
  }
  return { remaining: Math.max(HELP_DAILY_CAP[side] - filedToday, 0), filedToday, fresh, duplicates };
}
