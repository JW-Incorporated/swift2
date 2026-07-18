// Pure selection logic for the social poster — kept separate from the
// network/filesystem code in post-queue.mjs so it's unit-testable.

/** Hard per-run and per-platform-per-day backstops (charter rail 3: caps are
 * code, never trust-based). Overridable only by editing this file — a PR,
 * same as any other rail change. */
export const MAX_POSTS_PER_RUN = 5;
export const MAX_POSTS_PER_PLATFORM_PER_DAY = 10;

/** True if the queue item has a founder approval recorded and is due. */
export function isDue(item, now) {
  if (!item.approvedBy || !item.approvedAt) return false;
  return new Date(item.scheduledAt).getTime() <= now.getTime();
}

/**
 * Selects which due, approved queue items to post this run, respecting the
 * per-run cap and each platform's remaining daily budget. `postedToday` is a
 * Map<platform, count> of items already posted today (from social/posted/).
 */
export function selectDuePosts(items, now, postedToday) {
  const remaining = new Map(postedToday);
  const due = items.filter((item) => isDue(item, now)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const selected = [];
  for (const item of due) {
    if (selected.length >= MAX_POSTS_PER_RUN) break;
    const usedToday = remaining.get(item.platform) ?? 0;
    if (usedToday >= MAX_POSTS_PER_PLATFORM_PER_DAY) continue;
    selected.push(item);
    remaining.set(item.platform, usedToday + 1);
  }
  return selected;
}

/** YYYY-MM-DD in UTC, used to bucket social/posted/ files by day. */
export function utcDateOnly(isoOrDate) {
  return new Date(isoOrDate).toISOString().slice(0, 10);
}

/**
 * Ground-truth counts of what's actually sitting in social/queue/, for the
 * brief's Growth line — added 2026-07-18 after a brief asserted "drafts
 * wait on your OK in Slack #social" while the queue was empty. No LLM
 * curation pass should ever describe queue contents from what the charter
 * says *should* happen; this is the deterministic fact to copy instead.
 */
export function summarizeQueueStatus(items) {
  const awaitingApproval = items.filter((item) => !item.approvedBy || !item.approvedAt).length;
  const approved = items.length - awaitingApproval;
  return { total: items.length, awaitingApproval, approved };
}
