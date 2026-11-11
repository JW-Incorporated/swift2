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

// ---- can a reply be posted? (per-thread `<permalink>.json`) -----------------
// RSS carries no locked/archived flag, so a passing candidate gets one polite
// anonymous GET of its thread JSON (never OAuth). Anything unreadable is
// `unknown` — delivered, labelled unverified — never dropped.
export const REPLY_STATES = ['ok', 'locked', 'archived', 'no-comment', 'unknown'];
const NO_COMMENT_SUB_TYPES = new Set(['restricted', 'archived', 'private', 'gold_restricted']);

/** Parses a thread.json body ([listing, listing]) into `{ state }`. Never throws. */
export function parseThreadReplyState(body) {
  const data = Array.isArray(body)
    ? body[0]?.data?.children?.[0]?.data
    : body?.data?.children?.[0]?.data;
  if (!data || typeof data !== 'object') return { state: 'unknown' };
  if (data.locked === true) return { state: 'locked' };
  if (data.archived === true) return { state: 'archived' };
  if (data.quarantine === true || NO_COMMENT_SUB_TYPES.has(data.subreddit_type))
    return { state: 'no-comment' };
  return { state: 'ok' };
}

/** The anonymous JSON URL for a thread permalink, or null when it is not one. */
export function threadJsonUrl(permalink) {
  try {
    const url = new URL(String(permalink), 'https://www.reddit.com');
    if (!/(^|\.)reddit\.com$/i.test(url.hostname)) return null;
    return `https://www.reddit.com${url.pathname.replace(/\/+$/, '')}.json?raw_json=1&limit=1`;
  } catch {
    return null;
  }
}

/** One polite GET of the thread JSON. Never throws: failures give `{ state: 'unknown', error }`. */
export async function fetchThreadReplyState(
  permalink,
  { fetchImpl = fetch, userAgent = DEFAULT_USER_AGENT } = {},
) {
  const target = threadJsonUrl(permalink);
  if (!target) return { state: 'unknown', error: 'bad permalink' };
  try {
    const response = await fetchImpl(target, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
    });
    if (!response.ok) return { state: 'unknown', error: `HTTP ${response.status}` };
    return parseThreadReplyState(await response.json());
  } catch (err) {
    return { state: 'unknown', error: String(err?.message ?? err) };
  }
}

/** Short label shown to the owner next to the sub name. */
export function imageCommentsLabel(state) {
  if (state === 'image') return 'image comments allowed';
  if (state === 'text_only') return 'text-only sub (no image in comments)';
  return "🖼️ image replies unverified — if there's no image button, post the text";
}

/** Delivery order: image-capable first, then unknown, then text-only. */
export function eligibilityRank(state) {
  return state === 'image' ? 0 : state === 'unknown' ? 1 : 2;
}

// ---- per-sub cache (table awareness_sub_cache) ----------------------------
// A successful about.json reading is cached for a week so later runs never
// re-fetch it; a blocked request is remembered for half a day (sub '*blocked*')
// so a bot-blocked CI run does not spend a request on it every time.
export const CACHE_TTL_MS = 7 * 24 * 3_600_000;
export const BLOCKED_TTL_MS = 12 * 3_600_000;
export const BLOCKED_KEY = '*blocked*';

const fresh = (row, ttl, now) => row && now.getTime() - Date.parse(row.fetched_at) < ttl;

/** Map of sub -> cache row; empty when the table is missing or unreadable. */
export async function loadAboutCache(supabase) {
  const { data, error } = await supabase
    .from('awareness_sub_cache')
    .select('sub, image_comments, over18, fetched_at');
  if (error) return new Map();
  return new Map((data ?? []).map((row) => [row.sub, row]));
}

/** The cached reading for a sub, or null when absent or stale. */
export function cachedAbout(cache, subreddit, now = new Date()) {
  const row = cache.get(subreddit);
  return fresh(row, CACHE_TTL_MS, now)
    ? { imageComments: row.image_comments, over18: row.over18 === true }
    : null;
}

export const aboutBlockedRecently = (cache, now = new Date()) =>
  Boolean(fresh(cache.get(BLOCKED_KEY), BLOCKED_TTL_MS, now));

/** Best-effort write; a failed cache write never fails the run. */
export async function saveAbout(supabase, subreddit, about, now = new Date()) {
  const blocked = Boolean(about.error);
  const row = {
    sub: blocked ? BLOCKED_KEY : subreddit,
    image_comments: blocked ? 'unknown' : about.imageComments,
    over18: blocked ? false : about.over18 === true,
    fetched_at: now.toISOString(),
  };
  await supabase.from('awareness_sub_cache').upsert(row, { onConflict: 'sub' });
}
