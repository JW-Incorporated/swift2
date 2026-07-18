// Pure logic for the daily growth snapshot — kept separate from the
// network/filesystem code in growth-snapshot.mjs so it's unit-testable.
// See docs/agents/growth.md and the 2026-07-17 growth-snapshot decision
// for what this feeds (the Founders' Brief's Growth bullet).

import { utcDateOnly } from './queue.mjs';

/** Counts social/posted/**.json entries whose postedAt falls on `date` (YYYY-MM-DD, UTC). */
export function countPostsOn(postedItems, date) {
  return postedItems.filter((item) => utcDateOnly(item.postedAt) === date).length;
}

/**
 * Per-platform delta between today's and the most recent prior snapshot's
 * follower counts. A platform missing from either snapshot (API hiccup, or
 * this is day one) yields `null` rather than a misleading 0 — the brief
 * distinguishes "flat" from "unknown".
 */
export function computeDeltas(todayFollowers, previousFollowers) {
  const deltas = {};
  for (const platform of Object.keys(todayFollowers)) {
    const today = todayFollowers[platform];
    const prev = previousFollowers?.[platform];
    deltas[platform] = typeof today === 'number' && typeof prev === 'number' ? today - prev : null;
  }
  return deltas;
}

/** Assembles the snapshot object written to social/metrics/YYYY-MM-DD.json. */
export function buildSnapshot({ date, followers, postsToday }) {
  return { date, followers, postsToday };
}
