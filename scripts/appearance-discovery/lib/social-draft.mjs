// Fast-lane social drafts — builds an X-only social/queue draft from
// a deterministic appearance-discovery detection candidate (the same shape
// discover.mjs's `plan.toFile` entries carry — see its issueBody for the
// sibling intake-issue version of this data), per docs/decisions.md
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
// This is content, not a safety gate: the file this produces still runs
// through scripts/social/check-drafts.mjs (the auto-merge-content.yml
// check-drafts job) like every other queue draft before it can land — a bad
// template here fails safe to a human merge, same as any other draft.
//
// X-ONLY, NO REHOSTED THUMBNAIL (2026-09-05, #3584, Fable ruling on kanban
// t_36d74b87): this lane used to also stage an Instagram sibling whose media
// was the video's own YouTube thumbnail declared `mediaKind: "photo"` — but
// a rehosted YouTube/broadcaster thumbnail is not a license-cleared local
// photo of Taylor (docs/decisions.md 2026-08-15's own "photo" definition),
// and docs/marketing/social-strategy.md §2 already bars typography/designed
// cards standing in for real media. #3584 is that checker hole, not a new
// policy call. The binding ruling: appearance-lane posts go X text-only;
// Instagram is skipped entirely unless a genuinely cleared photo exists (the
// calendar's "empty IG slot beats a failed one" rule) — and this lane has no
// such photo to offer, so it no longer manufactures an Instagram draft at
// all. scripts/social/check-drafts.mjs's `checkCampaignPair` carries a
// matching exemption for `appearance:`-family campaigns so this lane's
// X-only shape doesn't trip the otherwise-unconditional pairing gate.
//
// Pair construction is pure.

import { weightedTweetLength } from '../../social/lib/x-length.mjs';

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
function bodyTemplate(title, channel, url, isOfficial) {
  return isOfficial
    ? `"${title}" — official upload, no caption yet, link below. ${url}`
    : `"${title}" — new from ${channel}, no caption yet, link below. ${url}`;
}

/** Trims `title` to fit whatever's left of X's weighted budget after the
 * template's own fixed words + channel + url, measured the same weighted
 * way X itself will measure the final post (so an emoji/CJK-heavy title, or
 * an unusually long channel name, can't quietly blow the total). Budgets
 * against the LONGER of the two isOfficial branches so a swap between them
 * (see bodyTemplate) never surprises the caller with a truncation change. */
function truncateTitle(title, channel, url) {
  const t = sanitize(title);
  const overhead = Math.max(
    weightedTweetLength(bodyTemplate('', channel, url, true)),
    weightedTweetLength(bodyTemplate('', channel, url, false)),
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
 * Builds the fast-lane X-only draft for one appearance-discovery candidate.
 * Returns a single-item `drafts` array (X text-only) — see this file's
 * header for why there is no Instagram sibling: this lane has no
 * license-cleared photo to offer, and #3584's ruling skips Instagram rather
 * than ship a rehosted thumbnail mislabeled as one.
 *
 * The video's own TITLE leads the body deliberately (not a fixed lead-in
 * phrase): scripts/social/check-drafts.mjs's opener rule fails a draft whose
 * first 6 words match any other post from the last 14 days OR any other
 * queue item. A channel-name-first template ("new video from Republic
 * Records…") collides with itself on that channel's very next upload; each
 * video's own distinct title does not, by the same guarantee that keeps
 * dedupe/videoId unique in the first place.
 */
export function buildSocialDraftPair(c, { now = new Date() } = {}) {
  const isOfficial = c.rule === 'all-uploads';
  const channel = toHouseStyle(sanitize(c.channelName));
  const title = toHouseStyle(truncateTitle(c.title, channel, c.url));
  const xBody = bodyTemplate(title, channel, c.url, isOfficial);
  const measured = weightedTweetLength(xBody);
  if (measured > X_MAX_WEIGHTED) {
    // Not expected to trip given truncateTitle's own budget math — fail loud
    // here rather than stage something check-drafts.mjs would reject anyway;
    // this pinpoints the cause instead of a downstream PR just silently
    // waiting for a human.
    throw new Error(`social draft over X's weighted ${X_MAX_WEIGHTED}-char limit (${measured}): ${xBody}`);
  }
  const scheduledAt = new Date(now.getTime() + SCHEDULE_DELAY_MS).toISOString();
  const day = scheduledAt.slice(0, 10);
  const campaign = `appearance:${c.videoId}`;
  const why =
    `Auto-drafted X-only by appearance-discovery (fast lane) from a genuinely new, ` +
    `deterministically-matched official upload — rule "${c.rule}", channel ${c.channelName}. Unverified beyond RSS metadata ` +
    `(title/channel/URL only; nobody has watched the video) — see docs/decisions.md 2026-08-25 ` +
    `("Detection-triggered social auto-post") and the 2026-09-05 #3584 ruling (X text-only; Instagram skipped, no cleared photo ` +
    `for this lane). The slower Vault-authoring lane still gets its own intake issue for the same video.`;
  return {
    drafts: [
      {
        filename: `${day}-appearance-${c.videoId}-x.json`,
        item: { platform: 'x', body: xBody, scheduledAt, campaign, why },
      },
    ],
  };
}
