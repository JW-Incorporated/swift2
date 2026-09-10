// Fast-lane social drafts — builds a PAIRED X + Instagram social/queue draft
// from a deterministic appearance-discovery detection candidate (the same
// shape discover.mjs's `plan.toFile` entries carry — see its issueBody for
// the sibling intake-issue version of this data), per docs/decisions.md
// (2026-08-25, "Detection-triggered social auto-post: confirmed live, not
// staged; email on every send").
//
// Deliberately NOT a claim about the video's CONTENT: discover.mjs's own
// invariant (see its header) is "detection is UNVERIFIED — nobody has
// watched this video or checked a single claim." This module only ever
// restates metadata the RSS feed itself already asserts (the channel name,
// the video's own title, its watch URL) — genuine, sourced facts about the
// fact-of-the-drop, never a claim about what's IN it. The caption gushes
// about a new video existing, not about its contents — sourcing stays
// absolute per docs/marketing/social-strategy.md § Voice.
//
// This is content, not a safety gate: the files this produces still run
// through scripts/social/check-drafts.mjs (the auto-merge-content.yml
// check-drafts job) like every other queue draft before either can land —
// a bad template here fails safe to a human merge, same as any other draft.
//
// MANDATORY X+IG PAIRING (2026-09-10, kanban t_bac31b1a, founder directive:
// "there's never a time where we post to only X, or only IG — everything
// should be the same"): this lane used to author an X-only draft with no
// Instagram sibling at all (2026-09-05, #3584 Fable ruling) on the theory
// that it had no license-cleared photo to offer. That was itself the exact
// single-platform exception the founder had already closed unconditionally
// (social/README.md's "no single-platform exception of any kind, for any
// reason"), and scripts/social/check-drafts.mjs's checkCampaignPair carried
// a matching `appearance:`-family exemption that let it slide past the
// otherwise-universal gate. Both are now removed. This lane sources a real
// credited photo from social/photo-library.json (the same rotation every
// other campaign draws from) and stages BOTH platforms, tagged with the same
// `campaign` value, every time. If the photo library is ever exhausted of
// eligible entries this throws rather than silently staging an X-only draft
// — see buildSocialDraftPair below.
//
// Pair construction is pure — the caller (discover.mjs) reads the photo
// library and posted history and passes them in.

import { weightedTweetLength } from '../../social/lib/x-length.mjs';
import { selectSocialPhoto } from '../../social/lib/photo-library.mjs';

const X_MAX_WEIGHTED = 280;
// Leaves headroom under check-drafts.mjs's own 270 WARN threshold (and a lot
// more under X's real 280 hard limit) so a normal-length YouTube title never
// even risks the length gate.
const SAFETY_MARGIN_WEIGHTED = 10;
// 10 minutes -> 72 hours (2026-08-29: two fast-lane pairs, appearance:
// T6iTnTV-Rgw and appearance:ldBrFonU8NA, had their staging PR sit unmerged
// long enough that scheduledAt was already past queue.mjs's 48h isStaleDue
// cutoff the instant they reached main — both retired to social/failed/
// without ever getting a post attempt). 72h exceeds that 48h stale cutoff on
// its own, so it comfortably covers ordinary PR/CI landing delay before a
// fast-lane draft ever reaches main, without touching the no-approval-gate
// posting model (docs/decisions.md 2026-08-25).
const SCHEDULE_DELAY_MS = 72 * 60 * 60 * 1000;

/**
 * Lowercases everything except "Taylor Swift"/"Taylor" — matches the shipped
 * house style (see any social/posted/*.json sample). A real source video
 * title genuinely can carry her full name ("The Icon Sessions with Taylor
 * Swift…"); lowercasing only the bare word "Taylor" and missing the "Swift"
 * right after it produced "Taylor swift" mid-sentence on a real live feed
 * during testing — the alternation tries the two-word phrase FIRST so it
 * matches as a unit, falling back to bare "Taylor" only when "Swift" isn't
 * the very next word.
 */
function toHouseStyle(text) {
  return String(text ?? '')
    .split(/(Taylor Swift|Taylor)/)
    .map((part) => (part === 'Taylor Swift' || part === 'Taylor' ? part : part.toLowerCase()))
    .join('');
}

/** Collapses whitespace and swaps double quotes for single so an embedded
 * `"` in a video title can't visually break the body's own quoting. */
function sanitize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().replace(/"/g, "'");
}

// Wording is conditioned on `c.rule`: 'all-uploads' means the video came
// from Taylor's OWN channel (channels.mjs's allUploads:true entry) — a
// genuine official upload. 'taylor-swift'/'swift-title' mean her NAME
// appeared in a THIRD PARTY channel's title (a talk-show clip, a fan
// reaction, a news channel) — calling that an "official upload" is a false
// claim (Codex review round 1, kanban t_895c2ba8: `emit-official-youtube-
// event.mjs` already draws exactly this distinction for the notifications
// pipeline; the social copy must match it).
function xBodyTemplate(title, channel, url, isOfficial) {
  return isOfficial
    ? `"${title}" — official upload, no caption yet, link below. ${url}`
    : `"${title}" — new from ${channel}, no caption yet, link below. ${url}`;
}

/**
 * The Instagram caption — deliberately a DIFFERENT shape from the X body
 * (longer-form, no raw link — the credited photo tile is what carries the
 * post) so checkCrossPostCopy's near-duplicate gate never trips on this
 * lane. Restates the same sourced facts (title/channel/official-ness) as
 * the X body, never a claim about the video's content.
 */
function igBodyTemplate(title, channel, isOfficial) {
  return isOfficial
    ? `taylor just dropped something new on her own channel: "${title}". no caption from her yet, but we're not waiting to talk about it — link's in the profile.`
    : `${channel} just posted "${title}" and taylor's name is all over it. haven't watched all the way through yet, but you know we had to tell you the second it dropped.`;
}

/** Trims `title` to fit whatever's left of X's weighted budget after the
 * template's own fixed words + channel + url, measured the same weighted
 * way X itself will measure the final post (so an emoji/CJK-heavy title, or
 * an unusually long channel name, can't quietly blow the total). Budgets
 * against the LONGER of the two isOfficial branches so a swap between them
 * (see xBodyTemplate) never surprises the caller with a truncation change. */
function truncateTitle(title, channel, url) {
  const t = sanitize(title);
  const overhead = Math.max(
    weightedTweetLength(xBodyTemplate('', channel, url, true)),
    weightedTweetLength(xBodyTemplate('', channel, url, false)),
  );
  const budget = X_MAX_WEIGHTED - overhead - SAFETY_MARGIN_WEIGHTED;
  if (weightedTweetLength(t) <= budget) return t;
  let out = t;
  while (out.length > 0 && weightedTweetLength(`${out}…`) > budget) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/**
 * Builds the fast-lane X + Instagram draft PAIR for one appearance-discovery
 * candidate — mandatory pairing, no single-platform exception (2026-09-10,
 * kanban t_bac31b1a). Both items share the same `campaign` (`appearance:
 * <videoId>`) and the same credited photo, selected from
 * `social/photo-library.json` via the same deterministic selector every
 * other campaign uses (least-used, then longest-unseen, then a stable id
 * tie-breaker — never made ineligible, so a finite library cannot deadlock
 * this lane either).
 *
 * `photoLibrary` (the parsed `photos` array from social/photo-library.json)
 * is REQUIRED — an empty or missing library throws rather than silently
 * staging an X-only draft; see this file's header for why that carve-out is
 * gone. `postedHistory` (parsed social/posted/*.json records) is optional
 * and only affects which credited photo gets picked first.
 *
 * The video's own TITLE leads the X body deliberately (not a fixed lead-in
 * phrase): scripts/social/check-drafts.mjs's opener rule fails a draft whose
 * first 6 words match any other post from the last 14 days OR any other
 * queue item. A channel-name-first template ("new video from Republic
 * Records…") collides with itself on that channel's very next upload; each
 * video's own distinct title does not, by the same guarantee that keeps
 * dedupe/videoId unique in the first place.
 */
export function buildSocialDraftPair(c, { now = new Date(), photoLibrary = [], postedHistory = [] } = {}) {
  const photo = selectSocialPhoto(photoLibrary, postedHistory);
  if (!photo) {
    throw new Error(
      'no credited photo available in social/photo-library.json — cannot stage a paired appearance draft. ' +
        'Add a credited entry to the library before this lane can file again (no single-platform exception, kanban t_bac31b1a).',
    );
  }

  const isOfficial = c.rule === 'all-uploads';
  const channel = toHouseStyle(sanitize(c.channelName));
  const title = toHouseStyle(truncateTitle(c.title, channel, c.url));
  const xBody = xBodyTemplate(title, channel, c.url, isOfficial);
  const measured = weightedTweetLength(xBody);
  if (measured > X_MAX_WEIGHTED) {
    // Not expected to trip given truncateTitle's own budget math — fail loud
    // here rather than stage something check-drafts.mjs would reject anyway;
    // this pinpoints the cause instead of a downstream PR just silently
    // waiting for a human.
    throw new Error(`social draft over X's weighted ${X_MAX_WEIGHTED}-char limit (${measured}): ${xBody}`);
  }
  const igBody = igBodyTemplate(toHouseStyle(sanitize(c.title)), channel, isOfficial);

  const scheduledAt = new Date(now.getTime() + SCHEDULE_DELAY_MS).toISOString();
  const day = scheduledAt.slice(0, 10);
  const campaign = `appearance:${c.videoId}`;
  const why =
    `Auto-drafted by appearance-discovery (fast lane) from a genuinely new, ` +
    `deterministically-matched official upload — rule "${c.rule}", channel ${c.channelName}. Unverified beyond RSS metadata ` +
    `(title/channel/URL only; nobody has watched the video) — see docs/decisions.md 2026-08-25 ` +
    `("Detection-triggered social auto-post"). Paired X+Instagram, mandatory (2026-09-10, kanban t_bac31b1a: no ` +
    `single-platform exception of any kind) — photo sourced from social/photo-library.json (photoId "${photo.id}"). ` +
    `The slower Vault-authoring lane still gets its own intake issue for the same video.`;

  const mediaFields = {
    media: [photo.mediaPath],
    mediaKind: 'photo',
    photoId: photo.id,
    mediaCredit: photo.credit,
    mediaSource: photo.source,
  };

  return {
    drafts: [
      {
        filename: `${day}-appearance-${c.videoId}-x.json`,
        item: { platform: 'x', body: xBody, scheduledAt, campaign, why, ...mediaFields },
      },
      {
        filename: `${day}-appearance-${c.videoId}-ig.json`,
        item: { platform: 'instagram', body: igBody, scheduledAt, campaign, why, ...mediaFields },
      },
    ],
  };
}
