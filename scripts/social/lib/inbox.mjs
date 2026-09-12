// social/inbox/ — side-door "fact sheet" intents (Tree Overhaul T6,
// 2026-09-12: merch-official-sync.yml and appearance-discovery.yml stop
// writing captions/queue drafts and write a v:1 intent here instead; Tree's
// own daily draft reads it in its next run and decides whether to post).
//
// Deliberately minimal — just enough for those two side doors to write a
// valid, schema-consistent v:1 intent object, and for something (a test, a
// future Wave 4 routine) to read them back. Selection (`selectFastLane`),
// expiry (`isExpired`), the six-dimension rubric, and slot-displacement
// checks are explicitly NOT here — Wave 4's job (T6 spec, PLAN.md T1 step 9).

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
