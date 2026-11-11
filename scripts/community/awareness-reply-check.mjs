// Awareness lane — drop threads a reply cannot be posted to (locked, archived,
// restricted/quarantined community). Split out of awareness-scan.mjs. RSS
// carries no such flag, so the would-be-kept threads get one anonymous thread
// JSON read each (awareness-eligibility.mjs); unreadable answers stay
// 'unknown' (delivered, labelled unverified), never dropped.
import { applyCandidateCaps } from './awareness-filters.mjs';

export const MAX_THREAD_CHECKS = 12;
// Only a throttle/bot-challenge stops the checks; a 404, a removed thread or a
// bad URL marks that one thread unknown and the rest are still checked.
const THROTTLED_RE = /^HTTP (?:403|429)$/;
const UNREPLYABLE = new Set(['locked', 'archived', 'no-comment']);

/**
 * Applies the caps, checks the kept threads, drops the unreplyable, refills
 * from the pool and checks only the newcomers. Returns
 * `{ kept, replyStates, dropped }` (`dropped` = count per reason).
 */
export async function keepReplyable(
  candidates,
  capOptions,
  { fetchThread, fetchImpl, sleep, pacingMs, blocked = false },
) {
  const replyStates = new Map();
  const dropped = {};
  let pool = candidates;
  let kept = applyCandidateCaps(pool, capOptions);
  let checksLeft = MAX_THREAD_CHECKS;
  let stopped = blocked;
  for (;;) {
    const todo = kept.filter((c) => !replyStates.has(c.post.id));
    if (todo.length === 0) break;
    let removed = false;
    for (const c of todo) {
      let state = 'unknown';
      if (!stopped && checksLeft > 0) {
        checksLeft -= 1;
        await sleep(pacingMs);
        const res = await fetchThread(c.post.permalink, { fetchImpl });
        state = res.state;
        if (THROTTLED_RE.test(res.error ?? '')) stopped = true;
      }
      replyStates.set(c.post.id, state);
      if (UNREPLYABLE.has(state)) {
        dropped[state] = (dropped[state] ?? 0) + 1;
        removed = true;
      }
    }
    if (!removed) break;
    pool = pool.filter((c) => !UNREPLYABLE.has(replyStates.get(c.post.id)));
    kept = applyCandidateCaps(pool, capOptions);
  }
  return { kept, replyStates, dropped };
}

/** `locked=2 no-comment=1`, or `none`. */
export function formatDropped(dropped) {
  const parts = Object.entries(dropped).map(([reason, n]) => `${reason}=${n}`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}
