// Every owner comment on the status page gets answered once (Bots v2 W7,
// follow-up from the W4 review). `marjorie-status.yml`'s reply job runs under
// one concurrency group, and GitHub keeps ONE pending run per group — so a
// burst of three owner comments silently dropped the middle one. The job now
// sweeps instead of handling only the comment that woke it: it reads the whole
// thread, and every owner comment not yet acknowledged is handled, oldest
// first. Run N+1 therefore finds nothing left to do, whichever run GitHub
// dropped.
//
// "Acknowledged" is a hidden `<!-- status-ack: <comment id> -->` appended to
// the reply the job posts for that comment — written by the workflow identity
// only (the repo is public: an owner-lookalike's comment is never handled, and
// a forged marker from anyone else is never trusted). Comments older than the
// newest acknowledged one are history: the job predates the marker, and
// re-answering the thread's back catalogue would relay old messages again.
import { isOwnerComment } from './status-reply.mjs';

const ACK_RE = /<!-- status-ack: (\d+) --!?>/g;
const ACK_AUTHORS = new Set(['github-actions[bot]', 'github-actions', 'app/github-actions']);

export const ackMarker = (id) => `<!-- status-ack: ${id} -->`;

const isOwner = (c) => isOwnerComment({ login: c?.user?.login, association: c?.author_association, type: c?.user?.type });

/** Comment ids the workflow identity has acknowledged. */
export function ackedIds(comments) {
  const ids = new Set();
  for (const c of comments || []) {
    if (!ACK_AUTHORS.has(c?.user?.login)) continue;
    for (const m of String(c.body ?? '').matchAll(ACK_RE)) ids.add(Number(m[1]));
  }
  return ids;
}

/**
 * Owner comments still owed an answer, oldest first. `trigger` is the comment
 * that woke the job; it is always included (the list can lag it by seconds)
 * unless already acknowledged.
 */
export function unacknowledged(comments, trigger) {
  const acked = ackedIds(comments);
  const byId = new Map((comments || []).map((c) => [c.id, c]));
  if (trigger?.id !== undefined && !byId.has(trigger.id)) byId.set(trigger.id, trigger);
  const baseline = acked.size ? Math.max(...acked) : null;
  return [...byId.values()]
    .filter(isOwner)
    .filter((c) => !acked.has(c.id))
    .filter((c) => baseline === null ? c.id === trigger?.id : c.id > baseline || c.id === trigger?.id)
    .sort((a, b) => a.id - b.id);
}

/**
 * Handles each owed comment. `handle(event, reply)` is handleComment bound to
 * its dependencies; `reply(text)` posts one comment. Returns one result per
 * comment. Back on `main` before each, so one closing branch never becomes the
 * base of the next.
 */
export async function sweepOwnerComments({ event, comments, handle, reply, run, log = console.log }) {
  const results = [];
  for (const comment of unacknowledged(comments, event.comment)) {
    try {
      run('git', ['checkout', '--force', '--quiet', 'main']);
    } catch (err) {
      log(`status sweep: could not return to main before #${comment.id}: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
    }
    let replied = false;
    try {
      const result = await handle({ ...event, comment }, async (text) => {
        await reply(`${text}\n\n${ackMarker(comment.id)}`);
        replied = true;
      });
      results.push({ ...result, commentId: comment.id, replied });
    } catch (err) {
      log(`status sweep: handling #${comment.id} threw: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
      results.push({ acted: false, failed: true, reason: 'threw', commentId: comment.id, replied });
      if (replied) continue;
      // Acknowledge it as failed so a newer ack can never bury it silently; if
      // even that comment cannot be posted, stop here and let the next run retry
      // from this one rather than skip past it.
      try {
        await reply(`⚠️ I couldn't process that comment automatically — reply again.\n\n${ackMarker(comment.id)}`);
      } catch {
        break;
      }
    }
  }
  return results;
}
