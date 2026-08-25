// Fast-lane social draft — builds a social/queue/*.json draft straight from
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
// Pure (no fs, no network, no `gh`) — unit-testable without a real feed.

import { weightedTweetLength } from '../../social/lib/x-length.mjs';

const X_MAX_WEIGHTED = 280;
// Leaves headroom under check-drafts.mjs's own 270 WARN threshold (and a lot
// more under X's real 280 hard limit) so a normal-length YouTube title never
// even risks the length gate.
const SAFETY_MARGIN_WEIGHTED = 10;
// Posted a few minutes out — long enough for this run's own commit/PR/
// auto-merge cycle to land before the poster's next due-check, without
// adding an artificial review window (docs/decisions.md 2026-08-25: no
// approval gate wanted here, same as every other queue item).
const SCHEDULE_DELAY_MS = 10 * 60 * 1000;

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

function bodyTemplate(title, channel, url) {
  return `"${title}" just dropped from ${channel} — running to go watch this right now!! ${url}`;
}

/** Trims `title` to fit whatever's left of X's weighted budget after the
 * template's own fixed words + channel + url, measured the same weighted
 * way X itself will measure the final post (so an emoji/CJK-heavy title, or
 * an unusually long channel name, can't quietly blow the total). */
function truncateTitle(title, channel, url) {
  const t = sanitize(title);
  const overhead = weightedTweetLength(bodyTemplate('', channel, url));
  const budget = X_MAX_WEIGHTED - overhead - SAFETY_MARGIN_WEIGHTED;
  if (weightedTweetLength(t) <= budget) return t;
  let out = t;
  while (out.length > 0 && weightedTweetLength(`${out}…`) > budget) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/**
 * Builds the fast-lane X draft for one appearance-discovery candidate.
 * Returns `{ filename, item }` — `filename` is the repo-relative basename
 * under `social/queue/`, `item` is the queue JSON payload (see
 * scripts/social/lib/queue-schema.mjs for the shape it must satisfy).
 *
 * The video's own TITLE leads the body deliberately (not a fixed lead-in
 * phrase): scripts/social/check-drafts.mjs's opener rule fails a draft whose
 * first 6 words match any other post from the last 14 days OR any other
 * queue item. A channel-name-first template ("new video from Republic
 * Records…") collides with itself on that channel's very next upload; each
 * video's own distinct title does not, by the same guarantee that keeps
 * dedupe/videoId unique in the first place.
 */
export function buildSocialDraft(c, { now = new Date() } = {}) {
  const channel = toHouseStyle(sanitize(c.channelName));
  const title = toHouseStyle(truncateTitle(c.title, channel, c.url));
  const body = bodyTemplate(title, channel, c.url);
  const measured = weightedTweetLength(body);
  if (measured > X_MAX_WEIGHTED) {
    // Not expected to trip given truncateTitle's own budget math — fail loud
    // here rather than stage something check-drafts.mjs would reject anyway;
    // this pinpoints the cause instead of a downstream PR just silently
    // waiting for a human.
    throw new Error(`social draft over X's weighted ${X_MAX_WEIGHTED}-char limit (${measured}): ${body}`);
  }
  const scheduledAt = new Date(now.getTime() + SCHEDULE_DELAY_MS).toISOString();
  const day = scheduledAt.slice(0, 10);
  return {
    filename: `${day}-appearance-${c.videoId}-x.json`,
    item: {
      platform: 'x',
      body,
      scheduledAt,
      campaign: `appearance:${c.videoId}`,
      why:
        `Auto-drafted by appearance-discovery (fast lane) from a genuinely new, deterministically-matched ` +
        `official upload — rule "${c.rule}", channel ${c.channelName}. Unverified beyond RSS metadata ` +
        `(title/channel/URL only; nobody has watched the video) — see docs/decisions.md 2026-08-25 ` +
        `("Detection-triggered social auto-post"). The slower Vault-authoring lane still gets its own intake issue for the same video.`,
    },
  };
}
