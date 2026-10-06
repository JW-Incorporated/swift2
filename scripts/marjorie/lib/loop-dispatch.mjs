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
//                        bounds a Marjorie → Tree → Marjorie chain. A response
//                        run whose parent is unknown (a backlog drain, a
//                        missing --parent) fails CLOSED: depth MAX_DEPTH + 1,
//                        never dispatched. An ask that is not dispatched still
//                        records its depth (`<!-- loop-depth: N -->`), so a
//                        later run answering it cannot reset the chain.
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
const DEPTH_RE = /<!-- loop-depth: (\d+) -->/g;

export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

export function renderDispatchMarker(direction, depth = 0) {
  return `<!-- loop-dispatched: ${direction} depth=${depth} -->`;
}

export const renderDepthMarker = (depth) => `<!-- loop-depth: ${depth} -->`;

/**
 * Markers on comments the workflow identity wrote; the last one in a comment is
 * the real one. A `loop-dispatched` marker carries its direction; a bare
 * `loop-depth` marker (an ask that was never dispatched) has `direction: null`.
 */
export function dispatchMarkers(comments) {
  const out = [];
  for (const c of comments || []) {
    if (!FILER_LOGINS.has(c?.user?.login ?? c?.author?.login)) continue;
    const body = String(c.body ?? '');
    const m = [...body.matchAll(MARKER_RE)].at(-1);
    const d = [...body.matchAll(DEPTH_RE)].at(-1);
    if (m) out.push({ direction: m[1], depth: Number(m[2]) });
    else if (d) out.push({ direction: null, depth: Number(d[1]) });
  }
  return out;
}

/** The depth an ask's own markers record; 0 for an original ask that has none. */
export const markedDepth = (comments) => Math.max(0, ...dispatchMarkers(comments).map((m) => m.depth));

async function commentsOf(number, { repo, gh }) {
  return (await apiFor(gh)(`/repos/${repo}/issues/${number}/comments?per_page=100`)) || [];
}

/** Runs of the direction's workflow created since UTC midnight (any actor). */
export async function dispatchedToday(direction, { repo = REPO, gh = ghRun, now = Date.now() } = {}) {
  const query = new URLSearchParams({ created: `>=${utcDay(now)}`, per_page: '1' });
  const res = await apiFor(gh)(`/repos/${repo}/actions/workflows/${DIRECTIONS[direction].workflow}/runs?${query}`);
  return Number(res?.total_count) || 0;
}

/**
 * The depth a new ask filed from `parent`'s response run carries. With no
 * parent: 0 for an ordinary filer, but `MAX_DEPTH + 1` (fail closed) when
 * `failClosed` — a response run that cannot say which ask it answers.
 */
export async function childDepth(parent, { repo = REPO, gh = ghRun, failClosed = false } = {}) {
  const n = Number(parent);
  if (!Number.isInteger(n) || n <= 0) return failClosed ? MAX_DEPTH + 1 : 0;
  return markedDepth(await commentsOf(n, { repo, gh })) + 1;
}

const firstLine = (err) => String(err?.message || err).split('\n')[0].slice(0, 200);

/**
 * Starts the other bot's response routine for one freshly created ask. Never
 * throws: every refusal or failure is a `{ dispatched: false, reason }` and a
 * `::warning::` line, because a filing must never be lost to a dispatch.
 * `response` marks a filing made by a response run (parent required). `countToday` replaces the
 * run-list count with the caller's own, so a different filer (bot-failure-triage) can have its own cap.
 */
export async function dispatchResponse(direction, number, { repo = REPO, gh = ghRun, now = Date.now(), parent = null, response = false, cap = DAILY_CAP, countToday = null, log = console.log } = {}) {
  const target = DIRECTIONS[direction];
  if (!target) throw new Error(`unknown loop direction: ${direction}`);
  const skip = (reason) => {
    log(`loop-dispatch: #${number} ${direction} not dispatched (${reason})`);
    return { dispatched: false, reason };
  };
  // A child ask that is not started must still remember its depth, or the next
  // run to answer it would count from zero.
  const skipRecording = async (reason, depth) => {
    if (depth > 0) {
      const body = `Not started automatically (${reason}); the next brief or weekly plan answers it.\n\n${renderDepthMarker(depth)}`;
      await gh(['issue', 'comment', String(number), '--repo', repo, '--body', body]).catch(() => {});
    }
    return skip(reason);
  };
  try {
    if (dispatchMarkers(await commentsOf(number, { repo, gh })).some((m) => m.direction === direction)) return skip('already dispatched');
    const depth = await childDepth(parent, { repo, gh, failClosed: response });
    if (depth > MAX_DEPTH) return await skipRecording(`chain depth ${depth} > ${MAX_DEPTH}`, depth);
    const used = countToday ? await countToday() : await dispatchedToday(direction, { repo, gh, now });
    if (used >= cap) return await skipRecording(`daily cap ${used}/${cap}`, depth);
    await gh(['issue', 'comment', String(number), '--repo', repo, '--body', `Started ${target.responder}'s response routine for this ask.\n\n${renderDispatchMarker(direction, depth)}`]);
    await gh(['workflow', 'run', target.workflow, '--repo', repo, '--ref', 'main', '-f', `issue_number=${number}`]);
    log(`loop-dispatch: #${number} → ${target.workflow} (${used + 1}/${cap} today, depth ${depth})`);
    return { dispatched: true, reason: 'ok', depth };
  } catch (err) {
    log(`::warning::loop-dispatch: #${number} ${direction} failed: ${firstLine(err)}`);
    return { dispatched: false, reason: 'error' };
  }
}
