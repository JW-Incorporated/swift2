// Reddit adapter for plain .mjs scripts (E5 fan-made discovery) — same
// proven no-key posture as apps/worker/src/sources/reddit-rss.ts, extracted
// here so both the TypeScript knowledge-engine adapter and this JS script
// share the verified technical path instead of drifting apart:
//
// - `.json` on `r/<sub>/new` and on a post permalink returns a 403
//   bot-challenge regardless of User-Agent (confirmed 2026-08-24/2026-08-25
//   in reddit-rss.ts's header comment; re-confirmed 2026-09-06 for this
//   script — `fanmade-discovery.mjs`'s old `discoverReddit()` silently
//   `continue`d past that 403 for every run since it shipped).
// - `.rss?limit=N[&t=<range>]` on `r/<sub>/<sort>` (or `.rss?limit=N&sort=top`
//   on a post permalink) returns 200 with a descriptive User-Agent and no
//   auth at all.
// - The feed carries no score/comment-count field — nothing JSON-only to
//   miss — so a rank signal has to come from Reddit's own server-side sort
//   order instead: request `sort: 'top', time: 'week'` and treat feed
//   position as `rank` (1-based, lower is more-hyped this week).
//
// A 429 backs off and returns zero posts rather than retrying — retry-
// storming a 429'd feed is how it gets permanently blocked (same posture as
// the TS adapter). Callers own deciding what "zero posts, no error" means
// for their own run (fanmade-discovery.mjs logs a counted warning).

import Parser from 'rss-parser';

const DEFAULT_USER_AGENT =
  'Swift2FanmadeDiscovery/1.0 (+https://longlivets.com; contact via github.com/JW-Incorporated/swift2/issues)';

const parser = new Parser({ timeout: 10_000 });

function feedUrl(subreddit, { sort, time, limit }) {
  const url = new URL(`https://www.reddit.com/r/${subreddit}/${sort}/.rss`);
  url.searchParams.set('limit', String(limit));
  if (time) url.searchParams.set('t', time);
  return url.href;
}

// A link post's Atom <content> embeds `<span><a href="...">[link]</a></span>`
// pointing at the outbound URL (verified against a live fetch 2026-09-06).
// Self-text posts have no such span, so `outboundUrl` returns null and the
// caller falls back to the post's own permalink — which fails the shop-
// domain allowlist and is dropped, matching the old JSON path's behaviour
// where a self-post's `url` field is just its own permalink.
function outboundUrl(contentHtml) {
  const match =
    typeof contentHtml === 'string'
      ? contentHtml.match(/<span><a href="([^"]+)">\[link\]<\/a><\/span>/)
      : null;
  return match ? match[1].replace(/&amp;/g, '&') : null;
}

function postIdFromAtomId(atomId) {
  const match = typeof atomId === 'string' ? atomId.match(/^t3_([\w-]+)$/) : null;
  return match ? match[1] : null;
}

/**
 * Fetches a subreddit's public RSS/Atom feed. Returns `{ posts, status }` on
 * success (including a 429 back-off, which yields `posts: []`); throws with
 * `error.status` set for any other non-2xx response so callers can decide
 * how to log/count it.
 */
export async function fetchSubredditPosts(
  subreddit,
  { sort = 'new', time, limit = 100, userAgent = DEFAULT_USER_AGENT, fetchImpl = fetch } = {},
) {
  const requestUrl = feedUrl(subreddit, { sort, time, limit });
  const response = await fetchImpl(requestUrl, { headers: { 'User-Agent': userAgent } });
  if (response.status === 429) return { posts: [], status: 429 };
  if (!response.ok) {
    const error = new Error(`reddit-rss fetch failed for r/${subreddit} (${response.status})`);
    error.status = response.status;
    throw error;
  }
  const xml = await response.text();
  const feed = await parser.parseString(xml);
  const posts = (feed.items ?? [])
    .map((item, index) => {
      const id = postIdFromAtomId(item.id);
      if (!id || !item.link) return null;
      return {
        id,
        title: item.title ?? null,
        permalink: item.link,
        url: outboundUrl(item.content) || item.link,
        createdAt: item.isoDate ?? null,
        rank: index + 1,
      };
    })
    .filter((post) => post !== null);
  return { posts, status: response.status };
}

/**
 * Thin, intention-revealing wrapper over `fetchSubredditPosts` for the
 * "give me the top posts of a subreddit" call shape used by the daily
 * hot-thread scan (E2) and the year-deep corpus crawl (C1) — same
 * `{ posts, status }` return, defaulted to `sort: 'top'` since that's the
 * only sort either caller ever wants (community-scan.yml, community-crawl.yml
 * per docs/proposals/2026-09-06-community-engine-plan.md §2.2/§3.2).
 */
export async function topPosts(subreddit, { time, limit = 25, userAgent, fetchImpl } = {}) {
  return fetchSubredditPosts(subreddit, { sort: 'top', time, limit, userAgent, fetchImpl });
}

/**
 * Fetches up to `limit` comments on a single post via the same no-auth
 * `.rss?limit=N&sort=top` mechanism appended to the post's own permalink
 * (verified technical path — apps/worker/src/sources/reddit-rss.ts module
 * header). The feed's first entry is the post itself (`t3_...`); this
 * strips that and returns only the `t1_...` comment entries.
 *
 * Best-effort by design: a 429 backs off (never retry-storms) and returns
 * `{ comments: [], status: 429 }` rather than throwing, since a missing
 * comment thread should degrade a caller's context, not fail its run.
 * Author handles are returned RAW (not hashed) — this is a fetch primitive
 * shared across callers with different storage/redaction needs; hashing
 * happens at the point a caller persists anything, not here.
 */
export async function postComments(
  permalink,
  limit = 15,
  { userAgent = DEFAULT_USER_AGENT, fetchImpl = fetch } = {},
) {
  const base = permalink.endsWith('/') ? permalink : `${permalink}/`;
  const requestUrl = `${base}.rss?limit=${limit}&sort=top`;
  const response = await fetchImpl(requestUrl, { headers: { 'User-Agent': userAgent } });
  if (response.status === 429) return { comments: [], status: 429 };
  if (!response.ok) {
    const error = new Error(
      `reddit-rss comment fetch failed for ${permalink} (${response.status})`,
    );
    error.status = response.status;
    throw error;
  }
  const xml = await response.text();
  const feed = await parser.parseString(xml);
  const comments = (feed.items ?? [])
    .filter((item) => typeof item.id === 'string' && item.id.startsWith('t1_'))
    .slice(0, limit)
    .map((item) => {
      const body = (item.contentSnippet ?? item.content ?? '').trim();
      if (!body) return null;
      return {
        id: item.id,
        author: item.creator ?? item.author ?? null,
        body,
        publishedAt: item.isoDate ?? null,
      };
    })
    .filter((comment) => comment !== null);
  return { comments, status: response.status };
}

// ---------------------------------------------------------------------------
// parseRedditEmail — deterministic, zero-LLM classifier + link extractor for
// Reddit's own notification emails (community-inbox.yml, Flow E1/E3 of
// docs/proposals/2026-09-06-community-engine-plan.md). No mail-parsing
// dependency is added for this: Reddit's notification templates are simple
// enough (single text/plain or text/html part, occasionally
// multipart/alternative with both) that a small purpose-built MIME reader
// below covers them, matching the "zero LLM" cost line in the plan's §4
// workflow table.

const POST_LINK_RE =
  /https?:\/\/(?:www\.)?reddit\.com\/r\/([\w-]+)\/comments\/([\w]+)(?:\/[^\s"'<>)]*)?/gi;

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function splitHeadersAndBody(chunk) {
  const boundaryIndex = chunk.search(/\r?\n\r?\n/);
  if (boundaryIndex === -1) return { headers: chunk, body: '' };
  const headerBlock = chunk.slice(0, boundaryIndex);
  const body = chunk.slice(boundaryIndex).replace(/^\r?\n\r?\n/, '');
  return { headers: headerBlock, body };
}

function parseHeaders(headerBlock) {
  // Unfold continuation lines (RFC 5322: a header continuation starts with
  // whitespace) before splitting on colons, so a wrapped Content-Type with a
  // boundary= on its own indented line still parses.
  const unfolded = headerBlock.replace(/\r?\n[ \t]+/g, ' ');
  const headers = {};
  for (const line of unfolded.split(/\r?\n/)) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) headers[match[1].toLowerCase()] = match[2].trim();
  }
  return headers;
}

function decodePart(rawBody, headers) {
  const encoding = (headers['content-transfer-encoding'] ?? '').toLowerCase();
  if (encoding === 'base64') {
    try {
      return Buffer.from(rawBody.replace(/\s+/g, ''), 'base64').toString('utf8');
    } catch {
      return rawBody;
    }
  }
  if (encoding === 'quoted-printable') return decodeQuotedPrintable(rawBody);
  return rawBody;
}

function contentTypeOf(headers) {
  const raw = headers['content-type'] ?? 'text/plain';
  const type = raw.split(';')[0].trim().toLowerCase();
  const boundaryMatch = raw.match(/boundary="?([^";]+)"?/i);
  return { type, boundary: boundaryMatch ? boundaryMatch[1] : null };
}

/**
 * Walks a (possibly nested multipart) MIME message and returns the best
 * available text parts: prefers text/html (Reddit's templates embed full
 * `/r/<sub>/comments/<id>/...` permalinks as anchor hrefs there; the
 * text/plain alternative sometimes truncates or omits links entirely).
 */
function collectParts(rawMime) {
  const parts = { html: '', text: '' };
  function walk(chunk) {
    const { headers: headerBlock, body } = splitHeadersAndBody(chunk);
    const headers = parseHeaders(headerBlock);
    const { type, boundary } = contentTypeOf(headers);
    if (type.startsWith('multipart/') && boundary) {
      const segments = body.split(`--${boundary}`);
      for (const segment of segments) {
        const trimmed = segment.replace(/^\r?\n/, '');
        if (!trimmed || trimmed.startsWith('--') || trimmed.trim() === '') continue;
        walk(trimmed);
      }
      return;
    }
    const decoded = decodePart(body, headers);
    if (type === 'text/html') parts.html += decoded;
    else if (type === 'text/plain') parts.text += decoded;
  }
  walk(rawMime);
  return parts;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractLinks(html, text) {
  const links = new Set();
  for (const source of [html, text]) {
    if (!source) continue;
    const decoded = decodeHtmlEntities(source);
    for (const match of decoded.matchAll(POST_LINK_RE)) {
      links.add(match[0].replace(/[).,'"]+$/, ''));
    }
  }
  return [...links];
}

function postIdsFromLinks(links) {
  const ids = new Set();
  for (const link of links) {
    const match = link.match(/\/comments\/([\w]+)/);
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

// Order matters: replies-to-us are the most specific and most
// time-sensitive (Flow E3 — drafted first, may trigger a same-day extra
// email), so their patterns are checked before the broader digest catch-all.
const REPLY_PATTERNS = [
  /replied to your comment/i,
  /replied to your post/i,
  /new reply/i,
  /\bu\/[\w-]+ replied\b/i,
];
const DIGEST_PATTERNS = [
  /trending/i,
  /top posts?/i,
  /digest/i,
  /what'?s happening/i,
  /popular in/i,
];

/**
 * Classifies a raw Reddit notification email into `alert | reply_to_us |
 * digest` (docs/proposals/2026-09-06-community-engine-plan.md §2.1 Flow
 * E1's `engagement_lead.kind`) and extracts every
 * `reddit.com/r/.../comments/<id>` permalink it carries. Deterministic,
 * zero LLM — matches the plan's "Zero LLM" cost line for
 * `community-inbox.yml`.
 *
 * @param {string} rawMime full raw email source (headers + body), as read
 *   off an IMAP `BODY.PEEK[]` fetch.
 * @returns {{ subject: string, kind: 'alert'|'reply_to_us'|'digest',
 *   links: string[], postIds: string[] }}
 */
export function parseRedditEmail(rawMime) {
  const { headers: headerBlock } = splitHeadersAndBody(rawMime);
  const headers = parseHeaders(headerBlock);
  const subject = decodeHtmlEntities(headers.subject ?? '');
  const { html, text } = collectParts(rawMime);
  const links = extractLinks(html, text);
  const postIds = postIdsFromLinks(links);

  const haystack = `${subject}\n${text}`;
  let kind = 'alert';
  if (REPLY_PATTERNS.some((re) => re.test(haystack))) kind = 'reply_to_us';
  else if (DIGEST_PATTERNS.some((re) => re.test(subject))) kind = 'digest';

  return { subject, kind, links, postIds };
}

// ---------------------------------------------------------------------------
// parseShreddedditComments — HTML comment-tree parser for Reddit's internal
// server-rendered partial (`/svc/shreddit/comments/r/<sub>/t3_<id>`), the
// endpoint the home-relay skill documents as the only one that returns a
// real comment tree (the `.json` API 403s everywhere; plain post HTML is a
// JS shell). This is a pure string->data parser — it does no fetching
// itself, and is only ever fed HTML that a relay call already retrieved
// (docs/proposals/2026-09-06-community-engine-plan.md's "used only when a
// relay URL is configured").

/**
 * Parses `<shreddit-comment>` blocks out of a shreddit comments-partial HTML
 * page into `{ author, score, depth, body }` rows, in document order (which
 * is the same order the page renders them: top-level first, replies nested
 * immediately after their parent). Best-effort: a block missing an `author`
 * attribute is skipped (not a real comment node — e.g. a leading wrapper
 * fragment); a block whose body couldn't be located gets `body: null` rather
 * than being dropped, so callers can see the comment existed even if its
 * text extraction missed.
 */
export function parseShredditComments(html) {
  const blocks = html.split(/(?=<shreddit-comment\s)/);
  const results = [];
  for (const block of blocks) {
    const authorMatch = block.match(/\bauthor="([^"]*)"/);
    if (!authorMatch) continue;
    const scoreMatch = block.match(/\bscore="([^"]*)"/);
    const depthMatch = block.match(/\bdepth="(\d+)"/);
    const bodyMatch = block.match(/<div[^>]*rtjson-content[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    let body = null;
    if (bodyMatch) {
      const stripped = bodyMatch[1].replace(/<[^>]+>/g, ' ');
      body = decodeHtmlEntities(stripped).replace(/\s+/g, ' ').trim();
    }
    results.push({
      author: authorMatch[1],
      score: scoreMatch ? scoreMatch[1] : null,
      depth: depthMatch ? Number(depthMatch[1]) : null,
      body,
    });
  }
  return results;
}
