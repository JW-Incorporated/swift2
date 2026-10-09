// Facebook group comments: validate/normalize the extension's `comments`
// payload (schema v1, see PLAN.md) and store it PRIVATELY under
// `<root>/comments/<week>/<slug>.json` (root = %LOCALAPPDATA%/longlive-fb).
//
// Comments come from private groups: they are never written to the repo,
// never uploaded, and nothing in this module logs or returns comment text
// except normalizeComments itself (to its caller) and the stored file.
import { randomBytes } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const COMMENT_LIMITS = Object.freeze({
  maxPosts: 200,
  maxCommentsPerPost: 50,
  maxRepliesPerComment: 50,
  maxTextChars: 5000,
  maxAuthorChars: 200,
  maxIdChars: 200,
  maxTsChars: 100,
  maxUrlChars: 2000,
  maxKeyChars: 2000,
});

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanString(value, max) {
  if (typeof value !== 'string') return '';
  return value.split(String.fromCharCode(0)).join('').trim().slice(0, max);
}

function cleanId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
  return cleanString(value, COMMENT_LIMITS.maxIdChars);
}

function cleanCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function cleanPostUrl(value) {
  const str = cleanString(value, COMMENT_LIMITS.maxUrlChars);
  if (!str) return null;
  try {
    const url = new URL(str);
    return url.protocol === 'https:' && /(^|\.)facebook\.com$/i.test(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeOne(raw, seen) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = cleanId(raw.id);
  const text = cleanString(raw.text, COMMENT_LIMITS.maxTextChars);
  if (!id || !text || seen.has(id)) return null;
  seen.add(id);
  const ts = cleanString(raw.ts, COMMENT_LIMITS.maxTsChars);
  return {
    id,
    author: cleanString(raw.author, COMMENT_LIMITS.maxAuthorChars),
    text,
    ts: ts || null,
    reactions: cleanCount(raw.reactions),
  };
}

// payload: the `comments` array of a POST /result body (or an object with a
// `comments` or `posts` array). Returns a clean array of
// {postKey, postUrl, comments:[{id, author, text, ts, reactions, replies:[…]}]};
// malformed entries are dropped, text trimmed, sizes capped, ids deduped per
// post (comment and reply ids share one namespace), posts deduped by postKey,
// posts left with no comments dropped.
export function normalizeComments(payload, limits = COMMENT_LIMITS) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.comments)
      ? payload.comments
      : Array.isArray(payload?.posts)
        ? payload.posts
        : [];
  const posts = [];
  const seenPosts = new Set();
  for (const rawPost of list) {
    if (posts.length >= limits.maxPosts) break;
    if (!rawPost || typeof rawPost !== 'object' || !Array.isArray(rawPost.comments)) continue;
    const postKey = cleanString(rawPost.postKey, limits.maxKeyChars ?? COMMENT_LIMITS.maxKeyChars);
    if (!postKey || seenPosts.has(postKey)) continue;
    const seen = new Set();
    const comments = [];
    for (const rawComment of rawPost.comments) {
      if (comments.length >= limits.maxCommentsPerPost) break;
      const comment = normalizeOne(rawComment, seen);
      if (!comment) continue;
      const replies = [];
      for (const rawReply of Array.isArray(rawComment.replies) ? rawComment.replies : []) {
        if (replies.length >= limits.maxRepliesPerComment) break;
        const reply = normalizeOne(rawReply, seen);
        if (reply) replies.push(reply);
      }
      comments.push({ ...comment, replies });
    }
    if (!comments.length) continue;
    seenPosts.add(postKey);
    posts.push({ postKey, postUrl: cleanPostUrl(rawPost.postUrl), comments });
  }
  return posts;
}

// Counts only — never text, authors or ids. Accepts the stored file object
// ({posts}) or a normalized posts array.
export function commentSummary(stored) {
  const posts = Array.isArray(stored) ? stored : Array.isArray(stored?.posts) ? stored.posts : [];
  let comments = 0;
  let replies = 0;
  for (const post of posts) {
    for (const comment of Array.isArray(post?.comments) ? post.comments : []) {
      comments += 1;
      replies += Array.isArray(comment?.replies) ? comment.replies.length : 0;
    }
  }
  return { posts: posts.length, comments, replies };
}

// Writes <root>/comments/<week>/<slug>.json atomically (temp file + rename).
// Returns {path, posts, comments, replies}.
export async function storeComments({ root, week, slug, comments, now = new Date() }) {
  if (typeof root !== 'string' || !root) throw new Error('storeComments: root is required');
  if (!WEEK_RE.test(String(week ?? ''))) throw new Error('storeComments: invalid week');
  if (!SLUG_RE.test(String(slug ?? ''))) throw new Error('storeComments: invalid slug');
  const posts = normalizeComments(comments);
  const dir = join(root, 'comments', week);
  const path = join(dir, `${slug}.json`);
  await mkdir(dir, { recursive: true });
  const body = {
    v: 1,
    week,
    slug,
    storedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    posts,
  };
  const tmp = `${path}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
  try {
    await writeFile(tmp, `${JSON.stringify(body, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(tmp, path);
  } catch (error) {
    await rm(tmp, { force: true }).catch(() => {});
    throw new Error(`storeComments: write failed (${error?.code ?? 'error'})`, { cause: error });
  }
  return { path, ...commentSummary(posts) };
}
