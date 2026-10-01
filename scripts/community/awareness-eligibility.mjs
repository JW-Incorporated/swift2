// Awareness lane — can this sub's COMMENTS carry an image? Reads the sub's
// public `https://www.reddit.com/r/<sub>/about.json` once per run.
//
// Field names (Reddit's documented sub-about shape): the comment-media
// switch is `data.comment_contribution_settings.allowed_media_types`, an
// array of media kinds — "static" = still images (what a site card is),
// "animated" = GIF, "giphy", "expression". `allow_images` is a DIFFERENT
// setting (image POSTS) and must not be used here. `data.over18` marks NSFW
// subs, which the lane never touches.
//
// UNVERIFIED LIVE: reddit.com answers every non-browser request from the
// build environment with a 403 bot-challenge (2026-10-01), so these field
// names come from the documented shape, not a captured response. The parser
// is therefore conservative: anything it cannot read is 'unknown' (still
// delivered, labelled), never 'text_only'. The committed config can pin a
// sub with `imageComments: "image" | "text_only"` once the owner has seen
// the sub's comment box.

const DEFAULT_USER_AGENT =
  'Swift2AwarenessScan/1.0 (+https://longlivets.com; contact via github.com/JW-Incorporated/swift2/issues)';

export const IMAGE_COMMENT_STATES = ['image', 'text_only', 'unknown'];

/** Parses a parsed about.json body into `{ imageComments, over18 }`. */
export function parseAbout(about) {
  const data = about?.data ?? about ?? {};
  const types = data?.comment_contribution_settings?.allowed_media_types;
  let imageComments = 'unknown';
  if (Array.isArray(types)) imageComments = types.includes('static') ? 'image' : 'text_only';
  return { imageComments, over18: data?.over18 === true };
}

/** Human override in the committed config wins; otherwise the live reading. */
export function resolveImageComments(sub, live) {
  if (sub?.imageComments === 'image' || sub?.imageComments === 'text_only')
    return sub.imageComments;
  return live?.imageComments ?? 'unknown';
}

/**
 * One polite GET of about.json. Never throws: any failure (403, 429, network,
 * bad JSON) returns `{ imageComments: 'unknown', over18: false, error }` so
 * one blocked request cannot stop discovery.
 */
export async function fetchSubAbout(
  subreddit,
  { fetchImpl = fetch, userAgent = DEFAULT_USER_AGENT } = {},
) {
  try {
    const response = await fetchImpl(
      `https://www.reddit.com/r/${subreddit}/about.json?raw_json=1`,
      {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      },
    );
    if (!response.ok)
      return { imageComments: 'unknown', over18: false, error: `HTTP ${response.status}` };
    return parseAbout(await response.json());
  } catch (err) {
    return { imageComments: 'unknown', over18: false, error: String(err?.message ?? err) };
  }
}

/** Short label shown to the owner next to the sub name. */
export function imageCommentsLabel(state) {
  if (state === 'image') return 'image comments allowed';
  if (state === 'text_only') return 'text-only sub (no image in comments)';
  return 'image comments unverified (look for the image icon in the comment box)';
}

/** Delivery order: image-capable first, then unknown, then text-only. */
export function eligibilityRank(state) {
  return state === 'image' ? 0 : state === 'unknown' ? 1 : 2;
}
