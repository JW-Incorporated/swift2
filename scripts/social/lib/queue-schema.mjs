// Schema validation for social/queue/**.json — the CI backstop layer
// (2026-08-11). `npm run validate:content` covers supabase/seed/** and
// nothing else, and check-drafts.mjs (the draft-time quality gate) runs on
// the files a PR touches — so an item already sitting in the queue when a
// rule tightens, or one that lands via a path that skips the draft checker,
// used to meet its FIRST validator at the live platform API, at post time,
// with three retries and then social/failed/. There is no cheaper place to
// catch a malformed draft than CI's required `build` job.
//
// WHY THIS EXISTS, CONCRETELY — the X body-length rule below is not
// hypothetical. Of the 12 items in social/failed/ as of 2026-08-11, eleven
// are X posts that died on a 403 "You are not permitted to perform this
// action." Every one measured over X's real 280-character *weighted* limit
// (raw lengths 294-373); every X post that ever succeeded was under it.
// X returns 403 (not 400) for an over-length tweet on the v2 endpoint,
// which is why this read as a permissions/duplicate-content problem for two
// weeks. It was neither: the drafts were simply too long. The counting rule
// lives in lib/x-length.mjs (URLs always weigh 23, most emoji/CJK weigh 2)
// and is shared verbatim with check-drafts.mjs's draft-time gate.
//
// This module is pure (no fs, no network) so it is unit-testable and can be
// called from anywhere: scripts/social/validate-queue.mjs (CI), and
// check-drafts.mjs if the two gates ever fold into one.

import { weightedTweetLength } from './x-length.mjs';
import { MAX_X_IMAGES } from './platforms.mjs';

/** Platforms the poster can actually publish to (post-queue.mjs's postOne). */
export const PLATFORMS = ['x', 'instagram'];

/**
 * Campaign-family prefixes whose posts are inherently ABOUT one specific
 * era — the "easter eggs" thread ties every node to a lens/egg id with its
 * own `eraId` (packages/experience/src/lenses.ts), and `heartbeat:era-deep-cut`
 * names the era right in the campaign value (social/README.md's example,
 * social/calendar.md 2026-09-10: "target speak-now ... mint
 * era-deep-cut:speak-now-<slug>"). A `mediaKind: "photo"` draft in one of
 * these families is exactly the shape of the founder-reported bug (kanban
 * t_75ec7106: 2026-09-09-clue-web-reputation-snake-x.json, campaign
 * `thread:easter-eggs:interactive-challenge:2026-09-find`, no `photoEra` set,
 * shipped a Lover-era photo) — see validatePhotoInventoryBinding below,
 * where a themed draft with no `photoEra` is now a hard fail instead of a
 * silently-passing opt-in check.
 *
 * NOT a general "derive the era from content data" mechanism — that would
 * require importing packages/experience/src/lenses.ts's EGG_NODES into
 * these validators, a separate wiring change out of this card's scope (see
 * the follow-up issue linked from social/README.md's photoEra section).
 * This is a static, mechanical family list: it forces the AUTHOR (who
 * already knows the target lens/egg node when minting the campaign) to
 * declare `photoEra`, it does not itself determine which era is correct.
 * A non-themed family (`launch:*`, `heartbeat:on-this-day`/other heartbeat
 * subfamilies, `appearance:*`, `mood:*`) is unaffected — those posts may
 * legitimately use any era's photo.
 */
export const THEMED_CAMPAIGN_PREFIXES = ['thread:easter-eggs:', 'heartbeat:era-deep-cut:'];

function isThemedCampaign(campaign) {
  return typeof campaign === 'string' && THEMED_CAMPAIGN_PREFIXES.some((prefix) => campaign.startsWith(prefix));
}

/** Declared media kinds — see the mediaKind section of validateQueueItem.
 * "video-thumb" added 2026-09-05 (#3584, Fable ruling): a rehosted YouTube/
 * broadcaster thumbnail is not a "photo" — see check-drafts.mjs's
 * VIDEO_THUMBNAIL_CREDIT_RE / CLEARED_PHOTO_ALLOWLIST for the full story. */
export const MEDIA_KINDS = ['photo', 'site-screen', 'era-art', 'video-thumb'];

/**
 * Per-platform hard limits, enforced by the platform, not by taste.
 *
 * `maxBody` for X is the standard 280 *weighted*-character tweet limit
 * (see lib/x-length.mjs — URLs count 23, most emoji/CJK count 2). If the
 * account is ever upgraded to X Premium (25,000 chars) this becomes wrong in
 * the safe direction — it would reject posts that would now succeed — so
 * raise it deliberately, in a PR, with the upgrade (and check-drafts.mjs's
 * copy of the threshold with it).
 *
 * Instagram's caption limit is 2,200 characters; it also caps hashtags at 30
 * (not checked here — no draft has ever come close).
 *
 * `media`: every normal paired X/Instagram campaign requires at least one
 * credited image. The named `appearance:` video-discovery exception remains
 * X-only and link-preview-only; X otherwise supports up to MAX_X_IMAGES
 * images (uploaded via the v1.1 media endpoint — see lib/platforms.mjs's
 * postToX). Instagram requires at least one and supports a 10-image carousel.
 */
export const PLATFORM_RULES = {
  x: { maxBody: 280, media: 'required', maxMedia: MAX_X_IMAGES, measure: weightedTweetLength, unit: 'weighted characters' },
  instagram: { maxBody: 2200, media: 'required', maxMedia: 10, measure: (body) => String(body ?? '').length, unit: 'characters' },
};

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isIsoInstant(value) {
  return typeof value === 'string' && ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Validates that every queued Taylor photo preserves the inventory's exact
 * provenance. A launch `site-screen` carousel is included when any slide is
 * a Taylor-photo grid tile; a genuine UI-only screen has no photo-prefix slide
 * and remains outside this binding.
 *
 * `photoEra` (2026-09-10, kanban t_75ec7106 — the 2026-09-09 reputation/snake
 * X post that shipped a Lover-era tour photo, docs/decisions.md): a string
 * naming the draft's target era/theme (the value passed to
 * `scripts/social/select-photo.mjs --era`, or the lens/egg node's `eraId` for
 * an easter-eggs/thread post). When present, the bound photo's `tags` MUST
 * include it — a themed draft whose photo doesn't match its own declared era
 * is exactly the bug this field exists to catch. `photoEra` is REQUIRED (not
 * optional) for a `mediaKind: "photo"` draft whose `campaign` belongs to a
 * THEMED_CAMPAIGN_PREFIXES family (see above) — those campaigns are
 * inherently about one specific era, so nothing may silently ship without
 * declaring which. It stays optional for every other family (a launch/mood/
 * merch post has no single target era). Full automatic era derivation from
 * lens/egg content data (packages/experience/src/lenses.ts) is intentionally
 * out of scope here — that needs a separate wiring change to import content
 * data into these validators; this static campaign-family check is the
 * bounded fix (Fable ruling, kanban t_75ec7106, PR #4062 review round 4).
 */
export function validatePhotoInventoryBinding(item, photoLibrary) {
  const photoTiles = Array.isArray(item?.media)
    ? item.media.filter((media) => typeof media === 'string' && media.startsWith('/social/library/photos/'))
    : [];
  if (item?.mediaKind !== 'photo' && photoTiles.length === 0) return [];
  if (typeof item.photoId !== 'string' || item.photoId.trim() === '') {
    return ['photoId: required when queued media contains a Taylor photo — bind the draft to social/photo-library.json.'];
  }
  const photo = photoLibrary.find((entry) => entry.id === item.photoId);
  if (!photo) return [`photoId: ${JSON.stringify(item.photoId)} is not in social/photo-library.json.`];
  if (photoTiles.length !== 1 || photoTiles[0] !== photo.mediaPath || item.mediaCredit !== photo.credit || item.mediaSource !== photo.source) {
    return ['photoId: must use its inventory media path, exact credit, and exact source so attribution cannot drift.'];
  }
  if (typeof item.photoEra === 'string' && item.photoEra.trim() !== '') {
    const era = item.photoEra.trim();
    if (!Array.isArray(photo.tags) || !photo.tags.includes(era)) {
      return [
        `photoEra: this draft declares "${era}" as its target era, but photoId ${JSON.stringify(item.photoId)}'s tags ` +
          `(${JSON.stringify(photo.tags ?? [])}) do not include it — an off-era photo is worse than no photo (Joey, 2026-09-10: ` +
          '"never again do I want to see a great picture with dumb text that has nothing to do with the image"). Re-run ' +
          `\`node scripts/social/select-photo.mjs --era ${era}\` for a matching photo, or add one to social/photo-library.json first.`,
      ];
    }
  } else if (isThemedCampaign(item.campaign)) {
    return [
      `photoEra: campaign ${JSON.stringify(item.campaign)} belongs to a themed family (${THEMED_CAMPAIGN_PREFIXES.join(', ')}) — ` +
        'these posts are inherently about one specific era, so `photoEra` is required, not optional, for this campaign shape ' +
        '(kanban t_75ec7106: this is exactly the campaign shape that shipped a Lover-era photo on a reputation-era post). ' +
        `Set \`photoEra\` to the target era and run \`node scripts/social/select-photo.mjs --era <era>\` for a matching photo.`,
    ];
  }
  return [];
}

/**
 * Validates one parsed queue item. Returns an array of human-readable
 * findings; an empty array means the item is well-formed. Never throws —
 * callers get every problem at once rather than the first one.
 *
 * Deliberately does NOT judge content quality (voice, openers, whether the
 * image is a lazy era-art fallback, cross-post similarity). That is
 * check-drafts.mjs's complementary draft-time gate; this one only answers
 * "can the platform API accept this at all".
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
  } else if (rules) {
    const measured = rules.measure(item.body);
    if (measured > rules.maxBody) {
      findings.push(
        `body: ${measured} ${rules.unit} exceeds ${item.platform}'s ${rules.maxBody}-${rules.unit.replace(/s$/, '')} limit by ` +
          `${measured - rules.maxBody}. ` +
          (item.platform === 'x'
            ? 'X answers an over-length tweet with a 403 "You are not permitted to perform this action" — ' +
              'the exact error that killed all eleven X items in social/failed/. URLs always weigh 23, most emoji/CJK weigh 2 ' +
              '(lib/x-length.mjs). Trim it.'
            : 'The platform will reject it.'),
      );
    }
  }

  // --- scheduledAt --------------------------------------------------------
  if (!isIsoInstant(item.scheduledAt)) {
    findings.push(
      `scheduledAt: required, must be an ISO-8601 instant with a timezone (e.g. "2026-08-12T23:00:00Z"); got ` +
        `${JSON.stringify(item.scheduledAt)}. This field is what ships the post — post-queue.mjs quarantines an ` +
        'unparseable value to social/failed/ at run time, but the cheap place to catch it is here, on the PR.',
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
            'site origin and fetched from there, so a relative path 404s.',
        );
      }
    }
    const isAppearanceException = item.platform === 'x' && typeof item.campaign === 'string' && item.campaign.startsWith('appearance:');
    if (rules?.media === 'required' && !isAppearanceException && paths.length === 0) {
      findings.push(`media: ${item.platform} posts require at least one image.`);
    }
    if (rules && paths.length > rules.maxMedia) {
      findings.push(`media: ${paths.length} items exceeds ${item.platform}'s limit of ${rules.maxMedia}.`);
    }
  }

  // --- mediaKind + photo provenance (2026-08-12, the Taylor-photo standard) --
  // Three declared kinds (see social/README.md's mediaKind section):
  //   "photo"       — a real photograph of Taylor Swift, rehosted from a
  //                   sourced corpus entry. REQUIRES `mediaCredit` (the
  //                   photographer/agency line that ships with the post) and
  //                   should carry `mediaSource` (where it came from).
  //   "site-screen" — a screenshot of the product itself (feature launches).
  //   "era-art"     — the legacy generic era tile. Still schema-valid so old
  //                   records parse, but check-drafts.mjs HARD-FAILS any new
  //                   or edited draft using one — the 2026-08-06..12 era-tile
  //                   grid is what this standard exists to end.
  // Only the shape is checked here; which kinds are ALLOWED per draft is
  // check-drafts.mjs's context-aware call (it sees history and files).
  if (item.mediaKind !== undefined && !MEDIA_KINDS.includes(item.mediaKind)) {
    findings.push(
      `mediaKind: ${JSON.stringify(item.mediaKind)} is not recognized — defined values are ${MEDIA_KINDS.map((k) => `"${k}"`).join(', ')}.`,
    );
  }
  if (item.platform === 'x' && item.mediaKind === 'site-screen') {
    findings.push('mediaKind: X site-screen posts are permanently prohibited. Use text-only or a real credited photo instead.');
  }
  // #3584 (Fable ruling, 2026-09-05): Instagram is skipped unless a cleared
  // photo exists — "video-thumb" (a rehosted YouTube/broadcaster thumbnail)
  // never qualifies, so it is never allowed on an Instagram item at all.
  if (item.platform === 'instagram' && item.mediaKind === 'video-thumb') {
    findings.push('mediaKind: Instagram drafts may not use mediaKind "video-thumb" — Instagram is skipped unless a cleared photo exists (Fable ruling, #3584).');
  }
  // X's "video-thumb" ships as a bare link preview only — never an attached
  // image (see check-drafts.mjs's mirror of this rule for the full story).
  if (item.platform === 'x' && item.mediaKind === 'video-thumb' && Array.isArray(item.media) && item.media.length > 0) {
    findings.push('mediaKind: X "video-thumb" drafts may not attach an image via `media` — it ships as a bare link preview only.');
  }
  for (const field of ['mediaCredit', 'mediaSource']) {
    if (item[field] !== undefined && (typeof item[field] !== 'string' || item[field].trim() === '')) {
      findings.push(`${field}: must be a non-empty string when present.`);
    }
  }
  if (item.mediaKind === 'photo' && (typeof item.mediaCredit !== 'string' || item.mediaCredit.trim() === '')) {
    findings.push(
      'mediaCredit: required when mediaKind is "photo" — a real photograph of Taylor ships with its photographer/agency credit, always (docs/decisions.md 2026-07-09 media policy).',
    );
  }
  if (item.mediaKind === 'photo' && (typeof item.mediaSource !== 'string' || item.mediaSource.trim() === '')) {
    findings.push(
      'mediaSource: required when mediaKind is "photo" — the credit must be auditable back to where the photo came from. (Mirrors check-drafts; this gate exists for items that arrive via a path the draft checker never saw.)',
    );
  }
  // A QUEUE item carrying media must declare what that media is — the
  // undeclared default is how the Taylor-free grid happened. Applies to the
  // queue only (validate-queue.mjs targets social/queue/); historical
  // posted/failed records predate the standard and are never re-validated.
  if (Array.isArray(media) && media.length > 0 && item.mediaKind === undefined) {
    findings.push(
      'mediaKind: required whenever `media` is present — declare "photo" (real credited photograph of Taylor) or "site-screen" (deliberate product screenshot). See social/README.md (2026-08-12 standard).',
    );
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
  for (const field of ['campaign', 'why', 'approvedBy', 'lastError', 'photoId', 'photoEra']) {
    if (item[field] !== undefined && typeof item[field] !== 'string') {
      findings.push(`${field}: must be a string when present.`);
    }
  }

  return findings;
}
