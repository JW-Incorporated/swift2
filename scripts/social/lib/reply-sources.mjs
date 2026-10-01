// Read-only Graph API collectors for the reply notifier (scripts/social/
// reply-notifier.mjs): comments + replies on our recent Instagram media,
// Instagram mentions/tags, and comments on our Facebook Page posts. Nothing
// here writes to a platform, and nothing here is on the posting path — it only
// imports GRAPH_VERSION from platforms.mjs so the API version stays one number.
//
// Every collector returns normalized items:
//   { id, source, kind, username, text, permalink, postSnippet, timestamp }
// `source` is the per-source ledger key (ig_comments | ig_mentions |
// fb_comments); `kind` is the message wording (ig_comment | ig_reply |
// ig_mention | fb_comment). A collector throws only when its whole source is
// unusable; one media/post failing is reported through `onWarn` and skipped.
// Tokens ride in the query string like the rest of the repo's Graph calls and
// never reach a log line: every error message is scrubbed.
import { URLSearchParams } from 'node:url';
import { GRAPH_VERSION } from './platforms.mjs';

export const MAX_RECENT_POSTS = 30;
export const RECENT_POST_DAYS = 30;
const MAX_PAGES = 4;
const COMMENT_PAGE_LIMIT = 50;
const DAY_MS = 86_400_000;

export function scrub(message, token) {
  let out = String(message ?? '');
  if (token) out = out.split(token).join('[token]');
  return out.replace(/access_token=[^&\s"']+/g, 'access_token=[token]');
}

/** Graph permission/scope failure: codes 3, 10, 200-299, or a message naming the scope. */
export function isPermissionError(err) {
  const code = Number(err?.graphCode);
  if (code === 3 || code === 10 || (code >= 200 && code < 300)) return true;
  return /instagram_manage_messages|requires .*permission|does not have permission/i.test(
    String(err?.graphDetail ?? ''),
  );
}

export function makeGraph({ token, fetchImpl = fetch, version = GRAPH_VERSION }) {
  const root = `https://graph.facebook.com/${version}`;

  async function request(url) {
    let res;
    try {
      res = await fetchImpl(url);
    } catch (err) {
      // eslint-disable-next-line preserve-caught-error -- the cause can carry the request URL (and so the token)
      throw new Error(`Graph request failed: ${scrub(err?.message ?? err, token)}`);
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error page */
    }
    if (!res.ok) {
      const detail = body?.error?.message ?? 'no error detail';
      throw Object.assign(new Error(`Graph HTTP ${res.status}: ${scrub(detail, token)}`), {
        graphCode: body?.error?.code ?? null,
        graphDetail: scrub(detail, token),
      });
    }
    return body ?? {};
  }

  function urlFor(pathPart, params = {}) {
    const qs = new URLSearchParams({ ...params, access_token: token });
    return `${root}/${pathPart}?${qs.toString()}`;
  }

  /** One object (no paging). */
  const get = (pathPart, params) => request(urlFor(pathPart, params));

  /**
   * Follows `paging.next` up to `maxPages`, collecting `data`. `stop(items)`
   * is checked after each page so a caller can quit once it has enough.
   */
  async function list(pathPart, params, { maxPages = MAX_PAGES, stop = () => false } = {}) {
    let url = urlFor(pathPart, params);
    const out = [];
    for (let page = 0; page < maxPages && url; page += 1) {
      const body = await request(url);
      out.push(...(Array.isArray(body.data) ? body.data : []));
      url = body.paging?.next ?? null;
      if (stop(out)) break;
    }
    return out;
  }

  /** Continue a nested edge (e.g. `replies`) from the body Graph embedded. */
  async function continueEdge(edge, { maxPages = MAX_PAGES } = {}) {
    const out = Array.isArray(edge?.data) ? [...edge.data] : [];
    let url = edge?.paging?.next ?? null;
    for (let page = 1; page < maxPages && url; page += 1) {
      const body = await request(url);
      out.push(...(Array.isArray(body.data) ? body.data : []));
      url = body.paging?.next ?? null;
    }
    return out;
  }

  return { get, list, continueEdge };
}

function snippet(text, max = 60) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!flat) return 'a post';
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function inWindow(timestamp, now, days) {
  const t = Date.parse(timestamp ?? '');
  return Number.isNaN(t) || now - t <= days * DAY_MS;
}

/** The most recent posts: at most `max`, none older than `days`. */
async function recentPosts(graph, pathPart, params, { now, max, days, timeKey }) {
  const old = (items) => {
    const last = items[items.length - 1];
    return items.length >= max || !inWindow(last?.[timeKey], now, days);
  };
  const posts = await graph.list(pathPart, params, { stop: old });
  return posts.filter((p) => inWindow(p[timeKey], now, days)).slice(0, max);
}

function igCommentLink(mediaPermalink, commentId, parentId) {
  if (!mediaPermalink) return '';
  const base = mediaPermalink.endsWith('/') ? mediaPermalink : `${mediaPermalink}/`;
  return parentId ? `${base}c/${parentId}/r/${commentId}/` : `${base}c/${commentId}/`;
}

export async function collectInstagramComments(
  graph,
  { igUserId, now = Date.now(), onWarn = () => {}, max = MAX_RECENT_POSTS, days = RECENT_POST_DAYS },
) {
  const own = await graph.get(igUserId, { fields: 'username' }).catch((err) => {
    onWarn(`IG own username unavailable (our own replies may be reported): ${err.message}`);
    return {};
  });
  const ownUsername = String(own?.username ?? '').toLowerCase();
  const media = await recentPosts(
    graph,
    `${igUserId}/media`,
    { fields: 'id,caption,permalink,timestamp', limit: String(max) },
    { now, max, days, timeKey: 'timestamp' },
  );
  const items = [];
  for (const post of media) {
    try {
      const comments = await graph.list(`${post.id}/comments`, {
        fields: 'id,text,username,timestamp,replies{id,text,username,timestamp}',
        limit: String(COMMENT_PAGE_LIMIT),
      });
      for (const comment of comments) {
        const push = (c, parentId) => {
          if (!c?.id || (ownUsername && String(c.username ?? '').toLowerCase() === ownUsername)) return;
          items.push({
            id: `ig-comment:${c.id}`,
            source: 'ig_comments',
            kind: parentId ? 'ig_reply' : 'ig_comment',
            username: c.username ?? 'someone',
            text: c.text ?? '',
            permalink: igCommentLink(post.permalink, c.id, parentId),
            postSnippet: snippet(post.caption),
            timestamp: c.timestamp ?? null,
          });
        };
        push(comment, null);
        for (const reply of await graph.continueEdge(comment.replies)) push(reply, comment.id);
      }
    } catch (err) {
      onWarn(`IG comments for media ${post.id} failed: ${err.message}`);
    }
  }
  return items;
}

export async function collectInstagramMentions(
  graph,
  { igUserId, now = Date.now(), onWarn = () => {}, days = RECENT_POST_DAYS },
) {
  const own = await graph.get(igUserId, { fields: 'username' }).catch((err) => {
    onWarn(`IG own username unavailable for mentions: ${err.message}`);
    return {};
  });
  const ownUsername = String(own?.username ?? '').toLowerCase();
  const tagged = await graph.list(
    `${igUserId}/tags`,
    { fields: 'id,caption,username,permalink,timestamp', limit: '25' },
    { maxPages: 2 },
  );
  return tagged
    .filter((t) => t?.id && inWindow(t.timestamp, now, days))
    .filter((t) => !ownUsername || String(t.username ?? '').toLowerCase() !== ownUsername)
    .map((t) => ({
      id: `ig-mention:${t.id}`,
      source: 'ig_mentions',
      kind: 'ig_mention',
      username: t.username ?? 'someone',
      text: t.caption ?? '',
      permalink: t.permalink ?? '',
      postSnippet: '',
      timestamp: t.timestamp ?? null,
    }));
}

export async function collectFacebookComments(
  graph,
  { pageId, now = Date.now(), onWarn = () => {}, max = MAX_RECENT_POSTS, days = RECENT_POST_DAYS },
) {
  const posts = await recentPosts(
    graph,
    `${pageId}/posts`,
    { fields: 'id,message,permalink_url,created_time', limit: '25' },
    { now, max, days, timeKey: 'created_time' },
  );
  const items = [];
  for (const post of posts) {
    try {
      const comments = await graph.list(`${post.id}/comments`, {
        filter: 'stream',
        order: 'reverse_chronological',
        fields: 'id,message,from{id,name},created_time,permalink_url',
        limit: String(COMMENT_PAGE_LIMIT),
      });
      for (const c of comments) {
        if (!c?.id || (c.from?.id && String(c.from.id) === String(pageId))) continue;
        items.push({
          id: `fb-comment:${c.id}`,
          source: 'fb_comments',
          kind: 'fb_comment',
          username: c.from?.name ?? 'someone',
          text: c.message ?? '',
          permalink: c.permalink_url ?? post.permalink_url ?? '',
          postSnippet: snippet(post.message),
          timestamp: c.created_time ?? null,
        });
      }
    } catch (err) {
      onWarn(`FB comments for post ${post.id} failed: ${err.message}`);
    }
  }
  return items;
}
