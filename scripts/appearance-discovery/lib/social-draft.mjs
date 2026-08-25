// Fast-lane social drafts — builds an X + Instagram social/queue pair from
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
// Pair construction is pure; the separate thumbnail fetch is injectable and
// unit-testable without a real feed.

import { weightedTweetLength } from '../../social/lib/x-length.mjs';
import { imageMeta } from '../../content-engine/checkers/image-liveness.mjs';

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

const INSTAGRAM_HOOKS = [
  (title) => `${title} has me dropping everything!!`,
  (title) => `i am RUNNING to watch ${title}!!`,
  (title) => `new obsession unlocked: ${title}!!`,
  (title) => `Taylor really just gave us ${title}!!`,
  (title) => `the way ${title} just appeared on my screen!!`,
  (title) => `please tell me everyone else saw ${title}!!`,
  (title) => `my whole day is now about ${title}!!`,
  (title) => `i hit play SO fast on ${title}!!`,
  (title) => `drop everything because ${title} is here!!`,
  (title) => `nothing prepared me for ${title} showing up today!!`,
];

function instagramBodyTemplate(title, channel, url, videoId) {
  let hash = 2166136261;
  for (const char of String(videoId)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const hookIndex = hash % INSTAGRAM_HOOKS.length;
  return `${INSTAGRAM_HOOKS[hookIndex](title)}\n\n` +
    `a fresh official Taylor upload just landed from ${channel}. i haven't watched yet — come watch with me!!\n\n` +
    `${url}\n\nvideo thumbnail: ${channel}`;
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
 * Builds the fast-lane X + Instagram pair for one appearance-discovery
 * candidate. Both queue items share one story-unique campaign and schedule;
 * the Instagram item rides the poster's existing Facebook cross-post.
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
  const channel = toHouseStyle(sanitize(c.channelName));
  const title = toHouseStyle(truncateTitle(c.title, channel, c.url));
  const xBody = bodyTemplate(title, channel, c.url);
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
  const mediaFilename = `appearance-${c.videoId}.jpg`;
  const mediaPath = `/social/library/photos/${mediaFilename}`;
  const why =
    `Auto-drafted as an X + Instagram pair by appearance-discovery (fast lane) from a genuinely new, ` +
    `deterministically-matched official upload — rule "${c.rule}", channel ${c.channelName}. Unverified beyond RSS metadata ` +
    `(title/channel/URL only; nobody has watched the video) — see docs/decisions.md 2026-08-25 ` +
    `("Detection-triggered social auto-post" and "X + Instagram pairing"). The slower Vault-authoring lane still gets its own intake issue for the same video.`;
  return {
    drafts: [
      {
        filename: `${day}-appearance-${c.videoId}-x.json`,
        item: { platform: 'x', body: xBody, scheduledAt, campaign, why },
      },
      {
        filename: `${day}-appearance-${c.videoId}-ig.json`,
        item: {
          platform: 'instagram',
          body: instagramBodyTemplate(toHouseStyle(sanitize(c.title)), channel, c.url, c.videoId),
          media: [mediaPath],
          mediaKind: 'photo',
          mediaCredit: `Video thumbnail: ${c.channelName}`,
          mediaSource: c.url,
          scheduledAt,
          campaign,
          why,
        },
      },
    ],
    media: {
      repoPath: `apps/web/public${mediaPath}`,
      sitePath: mediaPath,
    },
  };
}

/** Fetch the official YouTube thumbnail used by the Instagram sibling.
 * maxresdefault is preferred; hqdefault is a real 480px fallback when a video
 * has no max-resolution upload. Tiny YouTube placeholders are rejected. */
export async function fetchAppearanceThumbnail(c, { fetchImpl = fetch } = {}) {
  const urls = [
    `https://i.ytimg.com/vi/${c.videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${c.videoId}/hqdefault.jpg`,
  ];
  for (const url of urls) {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok || !String(response.headers.get('content-type')).toLowerCase().startsWith('image/')) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    const meta = imageMeta(bytes);
    const ratio = meta?.width && meta?.height ? meta.width / meta.height : 0;
    if (meta?.width >= 400 && meta?.height >= 300 && ratio >= 0.8 && ratio <= 1.91) {
      return { bytes, sourceUrl: url };
    }
  }
  throw new Error(`no Instagram-safe YouTube thumbnail found for ${c.videoId}`);
}
