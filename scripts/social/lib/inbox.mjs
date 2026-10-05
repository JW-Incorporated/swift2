// social/inbox/ — side-door "fact sheet" intents (Tree Overhaul T6,
// 2026-09-12: merch-official-sync.yml and appearance-discovery.yml stop
// writing captions/queue drafts and write a v:1 intent here instead; Tree's
// own daily draft reads it in its next run and decides whether to post).
//
// Wave 3 kept this deliberately minimal — just enough for those two side
// doors to write a valid, schema-consistent v:1 intent object, and for
// something to read them back. Wave 4 (T6 spec) adds this module's other
// half: `isExpired` and `selectFastLane` (eligibility — which OPEN intent
// the daily run may even consider) and `closeIntent` (the pure declined/
// expired transition). The six-dimension rubric lives in queue-schema.mjs
// and the slot-displacement check in check-drafts.mjs — not here, since
// both are shared with the calendar lane's own schema/checks.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** `lane` matches T1's queue-item lane for the two fast-lane values this
 * module actually writes; `calendar`/`reddit` never produce an inbox intent. */
export const INTENT_LANES = ['merch', 'appearance'];

export const INTENT_STATUSES = ['open', 'drafted', 'declined', 'expired'];

// T6 spec's Data section — the two `facts` shapes, by lane.
const MERCH_FACT_FIELDS = ['name', 'availability', 'productUrl', 'firstSeenAt'];
const APPEARANCE_FACT_FIELDS = ['channelName', 'videoTitle', 'publishedAt', 'videoId', 'url'];

/**
 * Validates one parsed `social/inbox/*.json` intent. Returns an array of
 * human-readable findings; an empty array means the intent is well-formed.
 * Narrow on purpose: shape only, the same "can this even be written" check
 * `queue-schema.mjs`'s `validateQueueItem` does for the queue — no
 * selection/expiry/scoring judgment.
 */
export function validateIntent(intent) {
  if (intent === null || typeof intent !== 'object' || Array.isArray(intent)) {
    return ['not a JSON object'];
  }

  const findings = [];
  if (intent.v !== 1) findings.push(`v: ${JSON.stringify(intent.v)} must be 1.`);
  if (typeof intent.id !== 'string' || intent.id.trim() === '') findings.push('id: required, must be a non-empty string.');
  if (typeof intent.source !== 'string' || intent.source.trim() === '') findings.push('source: required, must be a non-empty string.');
  if (!INTENT_LANES.includes(intent.lane)) {
    findings.push(`lane: ${JSON.stringify(intent.lane)} is not one of ${INTENT_LANES.map((l) => `"${l}"`).join(', ')}.`);
  }
  if (!INTENT_STATUSES.includes(intent.status)) {
    findings.push(`status: ${JSON.stringify(intent.status)} is not one of ${INTENT_STATUSES.map((s) => `"${s}"`).join(', ')}.`);
  }
  for (const field of ['createdAt', 'deadline']) {
    if (typeof intent[field] !== 'string' || Number.isNaN(Date.parse(intent[field]))) {
      findings.push(`${field}: required, must be an ISO-8601 instant.`);
    }
  }

  if (intent.facts === null || typeof intent.facts !== 'object' || Array.isArray(intent.facts)) {
    findings.push('facts: required, must be an object.');
  } else if (intent.lane === 'merch') {
    for (const field of MERCH_FACT_FIELDS) {
      if (intent.facts[field] === undefined) findings.push(`facts.${field}: required for lane "merch".`);
    }
  } else if (intent.lane === 'appearance') {
    for (const field of APPEARANCE_FACT_FIELDS) {
      if (intent.facts[field] === undefined) findings.push(`facts.${field}: required for lane "appearance".`);
    }
  }

  if (intent.media !== undefined && !Array.isArray(intent.media)) {
    findings.push('media: must be an array when present.');
  }
  if (intent.links === null || typeof intent.links !== 'object' || Array.isArray(intent.links)) {
    findings.push('links: required, must be an object (e.g. { pr, issue }).');
  }

  return findings;
}

/**
 * Reads every `*.json` intent in `dir`. Missing directory reads as empty
 * (an inbox nothing has ever written to is not an error); one unparseable
 * file is skipped, not fatal to the rest of the read. Returns
 * `{ file, data }` pairs — selection/expiry/scoring over the result is
 * Wave 4's job, not this function's.
 */
export async function readIntents(dir) {
  let files;
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const intents = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(join(dir, file), 'utf8');
      intents.push({ file, data: JSON.parse(raw) });
    } catch {
      continue; // one corrupt intent must not blind the whole read
    }
  }
  return intents;
}

// T6 spec's slot-displacement caps: at most one fast-lane campaign drafted
// per daily run (satisfied structurally — selectFastLane returns at most
// one intent per call, and the daily run calls it at most once) and at
// most two POSTED in the rolling 7 days.
export const FAST_LANE_ROLLING_WINDOW_DAYS = 7;
export const FAST_LANE_ROLLING_WINDOW_CAP = 2;

/**
 * Whether `intent`'s `deadline` (T6 spec's Deadlines table: merch =
 * createdAt+72h, appearance = createdAt+48h, already baked in by the
 * writer) has passed as of `now`. A missing/unparseable `deadline` reads as
 * NOT expired — shape is `validateIntent`'s job, not this one's, and a bad
 * deadline must not silently vanish an otherwise-open intent.
 */
export function isExpired(intent, now = new Date()) {
  const deadline = new Date(intent?.deadline).getTime();
  if (Number.isNaN(deadline)) return false;
  return new Date(now).getTime() > deadline;
}

/**
 * Picks which intent the daily run may even consider — deadline order
 * (nearest first) among OPEN, non-expired intents, with the rolling-7-day
 * cap applied. This is eligibility only: WHICH intent deserves an actual
 * post is still Tree's own judgement against the six-dimension rubric
 * (queue-schema.mjs), not this function's.
 *
 * `intents` — `readIntents(dir)`'s own `{ file, data }` shape, so a caller
 * can pass that return value straight through.
 * `postedWindow` — ISO timestamps of fast-lane campaigns (`lane: "merch"|
 * "appearance"`) already COMMITTED — posted (`social/posted/`'s
 * `postedAt`) plus any still `status: "drafted"` in `social/inbox/` (its
 * `createdAt`), per the caller (Codex review round 1, MEDIUM 1: a drafted-
 * but-not-yet-approved campaign must also count, or a slow founder
 * approval lets a third campaign queue up inside one 7-day window). Only
 * the entries inside the rolling `FAST_LANE_ROLLING_WINDOW_DAYS` window
 * (from `now`) count against the cap, so a caller may pass a longer
 * lookback without pre-filtering it.
 *
 * Returns the `{ file, data }` entry with the nearest `deadline`, or `null`
 * when nothing is open or the rolling cap is already met.
 */
export function selectFastLane(intents, postedWindow = [], now = new Date()) {
  const nowMs = new Date(now).getTime();
  const windowStartMs = nowMs - FAST_LANE_ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentCount = (postedWindow ?? []).filter((postedAt) => {
    const t = new Date(postedAt).getTime();
    return !Number.isNaN(t) && t > windowStartMs && t <= nowMs;
  }).length;
  if (recentCount >= FAST_LANE_ROLLING_WINDOW_CAP) return null;

  // Codex review round 1, MEDIUM 2: `isExpired` is deliberately lenient on a
  // malformed `deadline` (reads as not-expired, since a bad shape is
  // validateIntent's job, not this filter's job) — but that same leniency
  // let a malformed entry survive INTO the sort below, where a NaN
  // comparison result is stable-sorted as "equal" and can leave the
  // malformed entry ahead of a genuinely nearer-deadline valid one.
  // Selection eligibility is stricter than expiry: a `deadline` that
  // cannot be ordered at all cannot win "nearest deadline first" and is
  // excluded here, not silently favored by sort's NaN-is-equal behavior.
  const open = (intents ?? []).filter(
    (entry) => entry?.data?.status === 'open' && !Number.isNaN(new Date(entry.data?.deadline).getTime()) && !isExpired(entry.data, now),
  );
  if (!open.length) return null;

  return [...open].sort((a, b) => new Date(a.data.deadline).getTime() - new Date(b.data.deadline).getTime())[0];
}

/**
 * Pure transition to `"declined"` or `"expired"` — the two outcomes the T6
 * spec moves to `social/inbox/closed/`. (`"drafted"` stays in `social/
 * inbox/` with a `queueFiles` array, a different shape this function
 * doesn't produce — see the daily-draft prompt.) Returns the updated
 * intent object; this module never touches the filesystem beyond
 * `readIntents`, so writing it under `closed/` and removing the original
 * is the caller's job.
 */
export function closeIntent(intent, status, reason) {
  if (status !== 'declined' && status !== 'expired') {
    throw new Error(`closeIntent: status must be "declined" or "expired", got ${JSON.stringify(status)}`);
  }
  if (status === 'declined' && (typeof reason !== 'string' || reason.trim() === '')) {
    throw new Error('closeIntent: a "declined" intent requires a non-empty declinedReason');
  }
  return status === 'declined' ? { ...intent, status, declinedReason: reason } : { ...intent, status };
}
