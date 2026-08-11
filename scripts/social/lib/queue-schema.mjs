// Schema validation for social/queue/**.json — the layer that was entirely
// missing (2026-08-11). `npm run validate:content` covers supabase/seed/**
// and nothing else, so until now the FIRST validator a queue item ever met
// was the live platform API, at 23:00 UTC, with three retries and then
// social/failed/. There is no cheaper place to catch a malformed draft than
// the PR that adds it.
//
// WHY THIS EXISTS, CONCRETELY — the X body-length rule below is not
// hypothetical. Of the 12 items in social/failed/, eleven are X posts that
// died on a 403 "You are not permitted to perform this action." Lengths:
//
//   posted OK (13 items):  84, 219, 246, 247, 260, 268, 270, 271, 272,
//                          272, 274, 275, 276
//   failed 403 (11 items): 294, 302, 310, 321, 322, 338, 341, 342, 352,
//                          358, 373
//
// A clean separation at 280 — X's standard character limit for a non-Premium
// account. Every X post ever attempted at <=276 chars landed; every one at
// >=294 got a 403. X returns 403 (not 400) for an over-length tweet on the
// v2 endpoint, which is why this read as a permissions problem for two weeks
// and why "X is dark" was diagnosed as a credentials/duplicate-content
// issue. It was neither: the drafts were simply too long.
//
// This module is pure (no fs, no network) so it is unit-testable and can be
// called from anywhere: scripts/social/validate-queue.mjs (CI), and — when
// #1900's draft-time gate lands — from check-drafts.mjs, which today does
// voice/opener/media quality but no schema at all.

/** Platforms the poster can actually publish to (post-queue.mjs's postOne). */
export const PLATFORMS = ['x', 'instagram'];

/**
 * Per-platform hard limits, enforced by the platform, not by taste.
 *
 * `maxBody` for X is the standard 280-character tweet limit. If the account
 * is ever upgraded to X Premium (25,000 chars) this becomes wrong in the
 * safe direction — it would reject posts that would now succeed — so raise
 * it deliberately, in a PR, with the upgrade.
 *
 * Instagram's caption limit is 2,200 characters; it also caps hashtags at 30
 * (not checked here — no draft has ever come close).
 *
 * `media`: 'forbidden' means the poster rejects it outright rather than
 * silently posting text-only (see postToX). If X image posting lands (PR
 * #1900), change this to 'optional' with maxMedia 4 — the rest of the rules
 * already work unchanged.
 */
export const PLATFORM_RULES = {
  x: { maxBody: 280, media: 'forbidden', maxMedia: 0 },
  instagram: { maxBody: 2200, media: 'required', maxMedia: 10 },
};

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isIsoInstant(value) {
  return typeof value === 'string' && ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Validates one parsed queue item. Returns an array of human-readable
 * findings; an empty array means the item is well-formed. Never throws —
 * callers get every problem at once rather than the first one.
 *
 * Deliberately does NOT judge content quality (voice, openers, whether the
 * image is a lazy era-art fallback). That is a separate, complementary gate;
 * this one only answers "can the platform API accept this at all".
 */
export function validateQueueItem(item) {
  const findings = [];

  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return ['not a JSON object'];
  }

  // --- platform -----------------------------------------------------------
  if (!PLATFORMS.includes(item.platform)) {
    findings.push(
      `platform: ${JSON.stringify(item.platform)} is not one of ${PLATFORMS.map((p) => `"${p}"`).join(', ')} — ` +
        'post-queue.mjs throws `Unknown platform` and burns all 3 attempts on it.',
    );
  }
  const rules = PLATFORM_RULES[item.platform];

  // --- body ---------------------------------------------------------------
  if (typeof item.body !== 'string' || item.body.trim() === '') {
    findings.push('body: required, must be a non-empty string.');
  } else if (rules && item.body.length > rules.maxBody) {
    findings.push(
      `body: ${item.body.length} characters exceeds ${item.platform}'s ${rules.maxBody}-character limit by ` +
        `${item.body.length - rules.maxBody}. ` +
        (item.platform === 'x'
          ? 'X answers an over-length tweet with a 403 "You are not permitted to perform this action" — ' +
            'the exact error that killed all eleven X items in social/failed/. Trim it.'
          : 'The platform will reject it.'),
    );
  }

  // --- scheduledAt --------------------------------------------------------
  if (!isIsoInstant(item.scheduledAt)) {
    findings.push(
      `scheduledAt: required, must be an ISO-8601 instant with a timezone (e.g. "2026-08-12T23:00:00Z"); got ` +
        `${JSON.stringify(item.scheduledAt)}. This field is what ships the post — a value \`new Date()\` can't parse ` +
        'makes isDue() NaN-compare to false and the item never posts, silently, forever.',
    );
  }

  // --- media --------------------------------------------------------------
  const media = item.media;
  if (media !== undefined && !Array.isArray(media)) {
    findings.push('media: must be an array of paths when present.');
  } else {
    const paths = media ?? [];
    for (const p of paths) {
      if (typeof p !== 'string' || !p.startsWith('/')) {
        findings.push(
          `media: ${JSON.stringify(p)} must be a site-absolute path starting with "/" — it is appended to the live ` +
            'site origin and fetched by the platform, so a relative path 404s.',
        );
      }
    }
    if (rules?.media === 'required' && paths.length === 0) {
      findings.push(`media: ${item.platform} posts require at least one image.`);
    }
    if (rules?.media === 'forbidden' && paths.length > 0) {
      findings.push(
        `media: ${item.platform} posting does not support media yet — postToX throws on a media-bearing item, so this ` +
          'would fail 3 times and land in social/failed/. Remove `media` or post it manually.',
      );
    }
    if (rules && paths.length > rules.maxMedia && rules.media !== 'forbidden') {
      findings.push(`media: ${paths.length} items exceeds ${item.platform}'s limit of ${rules.maxMedia}.`);
    }
  }

  // --- optional provenance/bookkeeping fields ------------------------------
  for (const field of ['approvedAt', 'lastAttemptAt']) {
    if (item[field] !== undefined && !isIsoInstant(item[field])) {
      findings.push(`${field}: present but not an ISO-8601 instant (${JSON.stringify(item[field])}).`);
    }
  }
  if (item.attempts !== undefined && (!Number.isInteger(item.attempts) || item.attempts < 0)) {
    findings.push(`attempts: must be a non-negative integer when present (${JSON.stringify(item.attempts)}).`);
  }
  for (const field of ['campaign', 'why', 'approvedBy']) {
    if (item[field] !== undefined && typeof item[field] !== 'string') {
      findings.push(`${field}: must be a string when present.`);
    }
  }

  return findings;
}
