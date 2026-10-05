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
import { SOCIAL_APPROVERS } from './approvers.mjs';
import { approvalStatus } from './queue.mjs';

/** Platforms the poster can actually publish to (post-queue.mjs's postOne). */
export const PLATFORMS = ['x', 'instagram'];

/** Which lane a queue item came down — replaces the free-text `sourceRoutine`
 * (Tree Overhaul T1, 2026-09-12): with one drafter, the routine name carried
 * no information; the lane does. `calendar` is a slot Tree planned in
 * social/calendar.md (the normal path); `merch`/`appearance` are T6 fast-lane
 * items; `reddit` is a Reddit prompt (S6), not a platform post. */
export const LANES = ['calendar', 'merch', 'appearance', 'reddit'];

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
 * "video-thumb" (added 2026-09-05, #3584) was REMOVED 2026-09-10 (kanban
 * t_bac31b1a, founder directive: "there's never a time where we post to
 * only X, or only IG — everything should be the same"): it was a silent
 * standing X-only exception to the otherwise-unconditional pairing rule,
 * and the value is now schema-unrecognized — a draft declaring it hard-fails
 * like any other unknown mediaKind. The appearance-discovery fast lane
 * (scripts/appearance-discovery/lib/social-draft.mjs) now sources a real
 * credited photo from social/photo-library.json for BOTH platforms instead
 * of shipping a rehosted thumbnail X-only. */
export const MEDIA_KINDS = ['photo', 'site-screen', 'era-art'];

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
// Round 5 review: a null prototype, not a plain `{}` — `PLATFORM_RULES[x]`
// is keyed directly by an unvalidated `item.platform`/`draft.platform` in
// two places below and in approval-prompt.mjs, and a plain object literal
// inherits from Object.prototype, so `platform: "constructor"` (or
// "toString"/"valueOf"/etc.) resolves to a REAL, truthy inherited
// property — defeating an `if (!rules)`/`else if (rules)` guard that
// assumed a missing key returns `undefined` — and then crashes on
// `rules.measure(...)`, which doesn't exist on that inherited value. This
// is directly reachable by a plain drafting bug (not just malice): neither
// social-approval-notify.yml's jq projection nor this file's own CI
// backstop guarantees `platform` is one of the two real values BEFORE this
// lookup runs. A null prototype has no inherited properties at all, so
// only an actual own `x`/`instagram` key can ever resolve here.
export const PLATFORM_RULES = Object.assign(Object.create(null), {
  x: { maxBody: 280, media: 'required', maxMedia: MAX_X_IMAGES, measure: weightedTweetLength, unit: 'weighted characters' },
  instagram: { maxBody: 2200, media: 'required', maxMedia: 10, measure: (body) => String(body ?? '').length, unit: 'characters' },
});

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
  // Alt text for the library tile is WRITTEN ONCE on the photo entry itself
  // (the photo never changes per post, so its alt text shouldn't either) —
  // docs/social/RULINGS-SOCIAL.md A3/B2. The draft's altText[] entry at the tile's index
  // must match it exactly, the same attribution-cannot-drift discipline as
  // mediaCredit/mediaSource above.
  const tileIndex = Array.isArray(item.media) ? item.media.indexOf(photo.mediaPath) : -1;
  if (tileIndex !== -1) {
    const draftAlt = Array.isArray(item.altText) ? item.altText[tileIndex] : undefined;
    if (typeof photo.alt !== 'string' || photo.alt.trim() === '') {
      return [`photoId: ${JSON.stringify(item.photoId)} has no "alt" string in social/photo-library.json — add one before this draft can ship (RULINGS-SOCIAL A3).`];
    }
    if (draftAlt !== photo.alt) {
      return [`altText[${tileIndex}]: must match photoId ${JSON.stringify(item.photoId)}'s library "alt" text exactly — copy it from \`select-photo.mjs\`'s output rather than retyping it.`];
    }
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
 * `critique` shape + threshold (Tree Overhaul T2,
 * docs/specs/tree-overhaul/t2-self-critique.md) — the five-dimension rubric
 * a draft must clear before it can queue. `v: 1` is the only schema version
 * this checks; T6 adds `v: 2` (six dimensions, `timely`) for merch/appearance
 * lanes on its own lane-selected path.
 */
export const CRITIQUE_DIMENSIONS = ['onStrategy', 'onVoice', 'specific', 'mediaEarnsItsPlace', 'notEmbarrassed'];
export const CRITIQUE_MIN_DIMENSION_SCORE = 3;
export const CRITIQUE_TOTAL_THRESHOLD = 18;
export const CRITIQUE_NOT_EMBARRASSED_MIN = 4;
export const CRITIQUE_RATIONALE_MAX_CHARS = 320;

/**
 * T6's six-dimension rubric (docs/specs/tree-overhaul/t6-side-doors.md "The
 * fast-lane rubric") — T2's five dimensions plus `timely`, selected by
 * `lane` (`findCritiqueIssues` below): a `merch`/`appearance` item must
 * clear `v: 2` on this rubric, every other lane keeps the `v: 1` five-
 * dimension one above unchanged. `timely` shares `notEmbarrassed`'s higher
 * floor (4, not the plain 3) — a HARD gate independent of `total`, since a
 * fast-lane post displaces a planned slot and a post that isn't genuinely
 * time-sensitive has no claim on it.
 */
export const FAST_LANE_LANES = ['merch', 'appearance'];
export const FAST_LANE_CRITIQUE_DIMENSIONS = [...CRITIQUE_DIMENSIONS, 'timely'];
export const FAST_LANE_CRITIQUE_TOTAL_THRESHOLD = 21;
export const FAST_LANE_CRITIQUE_TIMELY_MIN = 4;
/** Per-dimension score floors that differ from CRITIQUE_MIN_DIMENSION_SCORE's
 * plain 3 — shared by both rubrics above so a dimension's floor can never
 * drift between the two lane-selected paths. */
export const CRITIQUE_DIMENSION_MIN_OVERRIDES = { notEmbarrassed: CRITIQUE_NOT_EMBARRASSED_MIN, timely: FAST_LANE_CRITIQUE_TIMELY_MIN };
/** Newlines and other C0/DEL control characters, PLUS the Unicode line
 * separator (U+2028) and paragraph separator (U+2029) — `rationale`
 * renders as the first line of the approval brief, above the trusted
 * `ref:` line (round 2, MEDIUM 1 — ref-line-injection hardening; U+2028/
 * U+2029 added round 3, LOW: both are real LineTerminators for `^`/`$` in
 * a `/m` regex, same as `\n`/`\r`, so a rationale containing one would
 * still open a fake "line start" even though it's outside the \x00-\x1F
 * C0 range — round 2's whitespace-collapse in approval-prompt.mjs
 * happened to already catch this too (JS's `\s` includes both), but this
 * schema-level check should actually deliver on its own claim rather than
 * relying on that as an accident). The control characters are the whole
 * point of this regex, not an accident.
 */
// eslint-disable-next-line no-control-regex
export const CRITIQUE_RATIONALE_CONTROL_CHAR_RE = /[\x00-\x1F\x7F\u2028\u2029]/;
/** The only mathematically possible range for a real critique total —
 * across BOTH rubrics (five dimensions for calendar/reddit, six for T6's
 * fast lane), each dimension 1-5, so a real fast-lane total (up to 30)
 * isn't misread as implausible by a caller that doesn't itself know which
 * rubric produced the bare integer it's checking (isPlausibleCritiqueTotal
 * below). */
export const CRITIQUE_MIN_POSSIBLE_TOTAL = CRITIQUE_DIMENSIONS.length;
export const CRITIQUE_MAX_POSSIBLE_TOTAL = FAST_LANE_CRITIQUE_DIMENSIONS.length * 5;

/**
 * Whether `value` is a plausible critique total — a bounded integer
 * (CRITIQUE_MIN_POSSIBLE_TOTAL..CRITIQUE_MAX_POSSIBLE_TOTAL). Shared so
 * weekly-scorecard.mjs's calibration() (Codex round 1, MEDIUM 3) doesn't
 * re-derive the bounds independently and drift from the rubric above — a
 * bare integer (a ledger row's `critiqueTotal`, or a live item's
 * `critique.total` read without its `scores` to cross-check) can't be
 * fully validated the way findCritiqueIssues validates a real `critique`
 * object, but a plausibility bound is cheap insurance against a corrupted
 * or fabricated value (e.g. `{ critique: { total: 999 } }`) silently
 * skewing a mean.
 */
export function isPlausibleCritiqueTotal(value) {
  return Number.isInteger(value) && value >= CRITIQUE_MIN_POSSIBLE_TOTAL && value <= CRITIQUE_MAX_POSSIBLE_TOTAL;
}

/**
 * Findings against ONE queue item's `critique` object — required shape
 * (`v`, `scores.*`, `total`, `rationale`, `rulesChecked`, `revision`) and the
 * queueing threshold (every dimension >= 3, `total` >= 18, `notEmbarrassed`
 * >= 4 specifically — independent of the total, since it is the dimension a
 * model is most tempted to inflate). **T6:** `item.lane` selects the rubric
 * before any of that runs — `merch`/`appearance` require `v: 2`/six
 * dimensions/`total` >= 21/`timely` >= 4 (FAST_LANE_* above); every other
 * lane keeps this paragraph's five-dimension `v: 1` numbers exactly as
 * they've always been. Shared by validateQueueItem below (the
 * CI schema gate) and check-drafts.mjs's checkCritique (the PR-time quality
 * gate) so the two can never drift on the rubric's numbers — the same
 * drift concern documented on check-drafts.mjs's re-exported
 * weightedTweetLength. No sentence count is enforced on `rationale`: a
 * terminal-punctuation counter mis-splits the exact prose this field
 * contains ("22 Oct.", "vs.", "No. 1"), so the character cap is the only
 * enforcement (spec §Mechanics).
 *
 * EXEMPT entirely once the item already carries an approval that is
 * shape/id/hash-valid — `approvalStatus(item, { approvers: SOCIAL_APPROVERS
 * })`, no `key`, the exact call validateQueueItem's own `approval` finding
 * below already makes.
 *
 * SECURITY NOTE, stated explicitly and CORRECTLY (Codex round 1, MEDIUM 2;
 * corrected round 2 after a real repro proved the round-1 wording wrong —
 * see below) — verified by forging one: take any real item, recompute its
 * public `contentHash`, pair it with an approver id from the public
 * SOCIAL_APPROVERS list and any string shaped like `hmac-sha256:<hex>`, and
 * this check accepts it, because it CANNOT verify the HMAC signature
 * without `SOCIAL_APPROVAL_KEY` — a secret this module must never hold, since
 * it is a pure, unit-tested validator with no network/fs access, called from
 * plain CI (`validate-queue.mjs`) that never has it either.
 *
 * What the forgery can actually do (corrected): round 1's comment claimed
 * this "buys nothing but a stuck, unpublishable item" — FALSE, proven false
 * by a real repro. A keyless-forged approval passes this exemption, CI goes
 * green, and if a founder then genuinely reacts ✅ in Discord on that item
 * (having no way to know critique was ever skipped — the brief shows the
 * rationale/caption, never critique's pass/fail status), the poll job
 * mints a REAL, validly-signed v3 approval in response to that REAL
 * reaction — overwriting whatever fake `approval` was already there,
 * exactly as it would for any other item — and merges it. The item DOES
 * post, having never been through the self-critique gate at all. The
 * forged approval's only job was to survive CI long enough to reach a real
 * founder's eyes; the founder's own genuine ✅ supplies the real,
 * cryptographically valid signature that actually ships it.
 *
 * What is still true, and still the load-bearing fact: NOTHING can post
 * without a GENUINE founder reaction. `post-queue.mjs` calls
 * `approvalStatus` WITH the real key before ever publishing, and
 * `verifyApprovalSig` (lib/queue.mjs) rejects a non-matching HMAC there,
 * unconditionally — a forged approval that a founder NEVER reacts to
 * really does sit in `social/queue/` and never post. And this exemption
 * only ever touches the critique check specifically: every OTHER gate
 * (length, media/photo binding, campaign pairing, voice, cross-post
 * copy — check-drafts.mjs's whole rule set, and queue-schema.mjs's own
 * shape/platform rules) still fully applies to a critique-exempt item,
 * forged approval or not. So the honest framing is: a forged approval lets
 * a critique-less item skip the self-scoring gate entirely, IF it is good
 * enough (voice, length, sourcing, everything else Tree's other checks and
 * a human eye would catch) to fool a founder into approving it without
 * noticing — not "harmless," but bounded to exactly the same trust
 * boundary this whole pipeline already rests on: the founder's own read of
 * what's in front of them in Discord.
 *
 * Given that corrected picture, shape/hash-valid (option "b" of the three
 * considered — see the PR body) is still the chosen answer, but on the
 * right grounds: critique is a quality aid that grades TREE's drafting
 * (spec: "the founder judges the post; the scores exist to grade Tree"),
 * not itself a safety gate — the founder's own judgment already was, and
 * remains, the actual gate on what ships, forged critique-exemption or
 * not. Losing critique's quality signal on a successfully-fooled item is a
 * real but bounded cost, not a new hole in the thing that was never
 * critique's job to guard. Options considered and rejected: (a) something
 * CI could verify without the secret that still can't be forged — nothing
 * exists that isn't itself either forgeable from public repo content or
 * new git-diff-aware plumbing this pure module was deliberately never
 * given (see its own module docstring).
 *
 * Separately: this is a DIFFERENT question from lib/queue.mjs's "a v1
 * stamp is malformed under v2 — nothing before that date grandfathers":
 * that rule is about signature STRENGTH and deliberately grandfathers
 * nothing; this one is about SCOPE — critique exists to force Tree to
 * self-score BEFORE a human ever sees a draft, and a founder's own
 * approval (real or, per above, forged-but-bounded) is already a later
 * check than a rubric this gate would otherwise retroactively demand of
 * content approved under an earlier rule (four real live queue items
 * predate T2 entirely and can never have a real one — a v1-only stamp is
 * not a live case here since S3's redesign re-stamps every still-live item
 * to v2/v3). Once approved, critique is not checked at all here — present,
 * absent, or malformed makes no difference: the founder's sign-off (or,
 * worst case, a forgery already contained by the paragraph above) is the
 * gate this rule was always downstream of.
 *
 * KNOWN GAP (round 2 review, latent, documented not fixed — see
 * social-approval-poll.mjs's edit-handling loop for the full writeup):
 * an ✏️ edit on an item that was ONLY exempt via this approval check (never
 * had a real critique) voids that approval's contentHash on the very
 * change that's supposed to go through, so the exemption stops applying
 * mid-edit and no replacement caption can ever satisfy this function
 * afterward — a permanent per-target deadlock, not a security hole.
 */
export function findCritiqueIssues(item, { activeLessonIds = [] } = {}) {
  if (approvalStatus(item, { approvers: SOCIAL_APPROVERS }).ok) {
    return [];
  }
  // T6: a fast-lane item (`lane: "merch"|"appearance"`) clears the six-
  // dimension `v: 2` rubric instead of T2's five-dimension `v: 1` one —
  // selected by `lane` alone, per the spec ("validateQueueItem selects the
  // rubric by lane"), so an unrecognized/missing lane (already its own
  // `lane:` finding elsewhere in validateQueueItem) still falls back to the
  // original five-dimension path unchanged.
  const isFastLane = FAST_LANE_LANES.includes(item?.lane);
  const dimensions = isFastLane ? FAST_LANE_CRITIQUE_DIMENSIONS : CRITIQUE_DIMENSIONS;
  const expectedVersion = isFastLane ? 2 : 1;
  const totalThreshold = isFastLane ? FAST_LANE_CRITIQUE_TOTAL_THRESHOLD : CRITIQUE_TOTAL_THRESHOLD;

  const critique = item?.critique;
  const findings = [];
  if (critique === null || typeof critique !== 'object' || Array.isArray(critique)) {
    return ['critique: required — every social/queue/ item carries a self-critique (Tree Overhaul T2).'];
  }
  if (critique.v !== expectedVersion) {
    findings.push(`critique.v: must be ${expectedVersion}, got ${JSON.stringify(critique.v)}.`);
  }
  const scores = critique.scores;
  const hasScoresObject = scores !== null && typeof scores === 'object' && !Array.isArray(scores);
  if (!hasScoresObject) {
    findings.push(`critique.scores: required object with all ${dimensions.length} dimensions.`);
  } else {
    for (const dim of dimensions) {
      if (!Number.isInteger(scores[dim]) || scores[dim] < 1 || scores[dim] > 5) {
        findings.push(`critique.scores.${dim}: must be an integer 1-5, got ${JSON.stringify(scores[dim])}.`);
      }
    }
  }
  const allScoresValid =
    hasScoresObject && dimensions.every((dim) => Number.isInteger(scores[dim]) && scores[dim] >= 1 && scores[dim] <= 5);
  if (allScoresValid) {
    const sum = dimensions.reduce((total, dim) => total + scores[dim], 0);
    if (critique.total !== sum) {
      findings.push(`critique.total: is ${JSON.stringify(critique.total)}, must equal the sum of the ${dimensions.length} scores (${sum}).`);
    }
    for (const dim of dimensions) {
      const min = CRITIQUE_DIMENSION_MIN_OVERRIDES[dim] ?? CRITIQUE_MIN_DIMENSION_SCORE;
      if (scores[dim] < min) {
        findings.push(`critique.${dim} is ${scores[dim]}, needs ${min}`);
      }
    }
    if (sum < totalThreshold) {
      findings.push(`critique.total is ${sum}, needs ${totalThreshold}`);
    }
  }
  if (typeof critique.rationale !== 'string' || critique.rationale.trim() === '') {
    findings.push('critique.rationale: required, non-empty string.');
  } else if (critique.rationale.length > CRITIQUE_RATIONALE_MAX_CHARS) {
    findings.push(`critique.rationale: ${critique.rationale.length} characters exceeds the ${CRITIQUE_RATIONALE_MAX_CHARS}-character cap.`);
  } else if (CRITIQUE_RATIONALE_CONTROL_CHAR_RE.test(critique.rationale)) {
    // Round 2, MEDIUM 1 (ref-line injection): `rationale` renders as the
    // FIRST line of the approval brief, above the trusted trailing `ref:`
    // line (approval-prompt.mjs's formatRationaleLine) — a newline or
    // other control character here could otherwise plant a fake
    // `ref: PR #<n> · <sha> · *`-shaped line earlier in the message and
    // hijack which draft/scope a reaction resolves to. formatRationaleLine
    // also normalizes whitespace defensively, but a malformed rationale
    // should never pass CI in the first place — plain, single-line
    // English prose has no legitimate reason to contain one.
    findings.push('critique.rationale: must not contain newlines or other control characters.');
  }
  if (!Array.isArray(critique.rulesChecked) || !critique.rulesChecked.every((r) => typeof r === 'string')) {
    findings.push('critique.rulesChecked: required, must be an array of strings (e.g. [] before T5 ships).');
  } else if (activeLessonIds.length > 0 && critique.rulesChecked.length === 0) {
    // Tree Overhaul T5: catches the failure mode of the read-the-ledger step
    // being skipped entirely — it cannot (and does not try to) confirm the
    // rules were honestly applied, only that SOME ids were recorded once
    // social/lessons.md has at least one active rule to check against.
    findings.push('critique.rulesChecked: must be non-empty — social/lessons.md has active rules that must be checked and recorded.');
  }
  if (critique.revision !== 1 && critique.revision !== 2) {
    findings.push(`critique.revision: must be 1 or 2, got ${JSON.stringify(critique.revision)}.`);
  }
  return findings;
}

/**
 * Validates one parsed queue item. Returns an array of human-readable
 * findings; an empty array means the item is well-formed. Never throws —
 * callers get every problem at once rather than the first one.
 *
 * `activeLessonIds` (Tree Overhaul T5) — the `social/lessons.md` active rule
 * ids, read from disk by the caller (validate-queue.mjs) and passed in here
 * so this function stays pure (no fs, no network — see the module header).
 * Omitted, it defaults to `[]`, preserving pre-T5 behavior exactly.
 *
 * Deliberately does NOT judge content quality (voice, openers, whether the
 * image is a lazy era-art fallback, cross-post similarity). That is
 * check-drafts.mjs's complementary draft-time gate; this one only answers
 * "can the platform API accept this at all".
 */
export function validateQueueItem(item, { activeLessonIds = [] } = {}) {
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

  // --- lane (Tree Overhaul T1, 2026-09-12 — replaces sourceRoutine) -------
  if (!LANES.includes(item.lane)) {
    findings.push(`lane: ${JSON.stringify(item.lane)} is not one of ${LANES.map((l) => `"${l}"`).join(', ')}.`);
  }

  // --- critique (Tree Overhaul T2, self-critique before queueing) --------
  findings.push(...findCritiqueIssues(item, { activeLessonIds }));

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
  let paths = [];
  if (media !== undefined && !Array.isArray(media)) {
    findings.push('media: must be an array of paths when present.');
  } else {
    paths = media ?? [];
    for (const p of paths) {
      if (typeof p !== 'string' || !p.startsWith('/')) {
        findings.push(
          `media: ${JSON.stringify(p)} must be a site-absolute path starting with "/" — it is appended to the live ` +
            'site origin and fetched from there, so a relative path 404s.',
        );
      }
    }
    if (rules?.media === 'required' && paths.length === 0) {
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

  // --- altText (docs/social/RULINGS-SOCIAL.md A3/B2 — required whenever media ships) --
  // X's 1000-char cap (its media/metadata/create alt_text limit) is the
  // binding constraint here, not Instagram's/Facebook's more generous ones
  // — one field is sent to all three platforms (lib/platforms.mjs), so it
  // must satisfy the tightest of the three.
  const MAX_ALT_TEXT_CHARS = 1000;
  if (paths.length > 0) {
    if (!Array.isArray(item.altText)) {
      findings.push(
        'altText: required whenever `media` is present — one non-empty, descriptive string per image, same length as `media`. ' +
          'Sent to X via media/metadata/create, Instagram via the `alt_text` field, Facebook via `alt_text_custom`.',
      );
    } else {
      if (item.altText.length !== paths.length) {
        findings.push(`altText: has ${item.altText.length} entr(ies) but media has ${paths.length} — must be exactly one alt text per image, in the same order.`);
      }
      item.altText.forEach((alt, i) => {
        if (typeof alt !== 'string' || alt.trim() === '') {
          findings.push(`altText[${i}]: must be a non-empty string.`);
        } else if (alt.length > MAX_ALT_TEXT_CHARS) {
          findings.push(`altText[${i}]: ${alt.length} characters exceeds X's ${MAX_ALT_TEXT_CHARS}-character alt-text limit (media/metadata/create).`);
        } else if (typeof item.body === 'string' && alt === item.body) {
          findings.push(`altText[${i}]: must describe the image, not repeat the post body verbatim.`);
        }
      });
    }
  } else if (item.altText !== undefined) {
    findings.push('altText: must not be present when `media` is empty — nothing to describe.');
  }

  // --- approval (docs/social/RULINGS-SOCIAL-2.md B1, superseding A2) -------------------
  // `approval` (schema v2, signed) is written ONLY by the poll job
  // (.github/workflows/social-approval-poll.yml, reacting to the owner's
  // Discord ✅), never by a drafter and never by a merge — but a drafter
  // could still hand-author one (accidentally or otherwise), so CI
  // validates its SHAPE and CONTENT whenever present, hard-failing a
  // malformed or self-stamped one rather than silently accepting it. CI
  // never passes `key` here (it never holds SOCIAL_APPROVAL_KEY), so this
  // check cannot catch a forged-but-well-formed signature — only the
  // poster's own keyed call is the real boundary. Absence is never a CI
  // failure here — every draft legitimately arrives unstamped;
  // validate-queue.mjs prints that as a warning instead (A6).
  if (item.approval !== undefined) {
    const status = approvalStatus(item, { approvers: SOCIAL_APPROVERS });
    if (!status.ok && status.reason !== 'no approval on file — never reviewed by a founder (or reviewed before the 2026-09-11 approval schema; re-open a PR for it)') {
      findings.push(`approval: ${status.reason}`);
    }
  }

  // --- optional provenance/bookkeeping fields ------------------------------
  // `approvedAt`/`approvedBy` are retired (docs/social/RULINGS-SOCIAL.md A2) — the
  // `approval` object above is the only provenance record now. A queue item
  // still carrying either legacy field is not itself a validation error
  // (old social/posted/ records are never re-validated; validate-queue.mjs
  // only targets social/queue/ where these keys should never reappear), but
  // they are no longer documented or written by any current code path.
  for (const field of ['lastAttemptAt']) {
    if (item[field] !== undefined && !isIsoInstant(item[field])) {
      findings.push(`${field}: present but not an ISO-8601 instant (${JSON.stringify(item[field])}).`);
    }
  }
  if (item.attempts !== undefined && (!Number.isInteger(item.attempts) || item.attempts < 0)) {
    findings.push(`attempts: must be a non-negative integer when present (${JSON.stringify(item.attempts)}).`);
  }
  for (const field of ['campaign', 'why', 'lastError', 'photoId', 'photoEra']) {
    if (item[field] !== undefined && typeof item[field] !== 'string') {
      findings.push(`${field}: must be a string when present.`);
    }
  }

  return findings;
}
