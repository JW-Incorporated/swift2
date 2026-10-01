// W7 — the live Tree/Marjorie loop (docs/plans/bots-v2/PLAN.md, W7;
// docs/specs/marjorie-overhaul/l1-loop.md § Live loop). A filer that CREATES a
// loop ask starts the other bot's response routine at once. Issues made with
// GITHUB_TOKEN fire no `issues` event, so the dispatch is explicit — and
// guarded, because two bots that can wake each other can also wake each other
// forever:
//
//   1. creation only   — callers dispatch for a filing with `created: true`,
//                        never for a re-found one and never for a comment;
//   2. one per issue   — a `<!-- loop-dispatched: <direction> depth=N -->`
//                        comment, written BEFORE the dispatch (a crash errs
//                        toward under-dispatching) and trusted only from the
//                        workflow identity (the repo is public);
//   3. daily cap       — at most DAILY_CAP dispatches per direction per UTC
//                        day, counted from GitHub's own run list for the
//                        target workflow, so the counter is durable without a
//                        ledger file (an Action cannot push to protected main);
//   4. depth cap       — an ask filed by a response run carries its parent's
//                        depth + 1 and is not dispatched past MAX_DEPTH, which
//                        bounds a Marjorie → Tree → Marjorie chain.
//
// Bot comments never start anything: the response workflows are dispatch-only,
// so no comment, label or close an agent writes can wake a routine.
import { URLSearchParams } from 'node:url';
import { gh as ghRun } from '../../lib/gh.mjs';
import { FILER_LOGINS, REPO } from './loop-asks.mjs';
import { apiFor } from './issues-rest.mjs';

export const DIRECTIONS = {
  'to-marjorie': { workflow: 'routine-marjorie-ask-response.yml', responder: 'Marjorie' },
  'to-tree': { workflow: 'routine-tree-ask-response.yml', responder: 'Tree' },
};
export const DAILY_CAP = 6;
export const MAX_DEPTH = 2;
const MARKER_RE = /<!-- loop-dispatched: (to-marjorie|to-tree) depth=(\d+) -->/g;

export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

export function renderDispatchMarker(direction, depth = 0) {
  return `<!-- loop-dispatched: ${direction} depth=${depth} -->`;
}

/** Markers on comments the workflow identity wrote; the last one in a comment is the real one. */
export function dispatchMarkers(comments) {
  const out = [];
  for (const c of comments || []) {
    if (!FILER_LOGINS.has(c?.user?.login ?? c?.author?.login)) continue;
    const m = [...String(c.body ?? '').matchAll(MARKER_RE)].at(-1);
    if (m) out.push({ direction: m[1], depth: Number(m[2]) });
  }
  return out;
}

async function commentsOf(number, { repo, gh }) {
  return (await apiFor(gh)(`/repos/${repo}/issues/${number}/comments?per_page=100`)) || [];
}

/** Runs of the direction's workflow created since UTC midnight (any actor). */
export async function dispatchedToday(direction, { repo = REPO, gh = ghRun, now = Date.now() } = {}) {
  const query = new URLSearchParams({ created: `>=${utcDay(now)}`, per_page: '1' });
  const res = await apiFor(gh)(`/repos/${repo}/actions/workflows/${DIRECTIONS[direction].workflow}/runs?${query}`);
  return Number(res?.total_count) || 0;
}

/** The depth a new ask filed from `parent`'s response run carries; 0 with no parent. */
export async function childDepth(parent, { repo = REPO, gh = ghRun } = {}) {
  const n = Number(parent);
  if (!Number.isInteger(n) || n <= 0) return 0;
  const markers = dispatchMarkers(await commentsOf(n, { repo, gh }));
  return markers.length ? Math.max(...markers.map((m) => m.depth)) + 1 : 1;
}

const firstLine = (err) => String(err?.message || err).split('\n')[0].slice(0, 200);

/**
 * Starts the other bot's response routine for one freshly created ask. Never
 * throws: every refusal or failure is a `{ dispatched: false, reason }` and a
 * `::warning::` line, because a filing must never be lost to a dispatch.
 */
export async function dispatchResponse(direction, number, { repo = REPO, gh = ghRun, now = Date.now(), parent = null, cap = DAILY_CAP, log = console.log } = {}) {
  const target = DIRECTIONS[direction];
  if (!target) throw new Error(`unknown loop direction: ${direction}`);
  const skip = (reason) => {
    log(`loop-dispatch: #${number} ${direction} not dispatched (${reason})`);
    return { dispatched: false, reason };
  };
  try {
    if (dispatchMarkers(await commentsOf(number, { repo, gh })).some((m) => m.direction === direction)) return skip('already dispatched');
    const depth = await childDepth(parent, { repo, gh });
    if (depth > MAX_DEPTH) return skip(`chain depth ${depth} > ${MAX_DEPTH}`);
    const used = await dispatchedToday(direction, { repo, gh, now });
    if (used >= cap) return skip(`daily cap ${used}/${cap}`);
    await gh(['issue', 'comment', String(number), '--repo', repo, '--body', `Started ${target.responder}'s response routine for this ask.\n\n${renderDispatchMarker(direction, depth)}`]);
    await gh(['workflow', 'run', target.workflow, '--repo', repo, '--ref', 'main', '-f', `issue_number=${number}`]);
    log(`loop-dispatch: #${number} → ${target.workflow} (${used + 1}/${cap} today, depth ${depth})`);
    return { dispatched: true, reason: 'ok', depth };
  } catch (err) {
    log(`::warning::loop-dispatch: #${number} ${direction} failed: ${firstLine(err)}`);
    return { dispatched: false, reason: 'error' };
  }
}
