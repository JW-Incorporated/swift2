import { JSDOM } from 'jsdom';

const REDDIT_ORIGIN = 'https://www.reddit.com';

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCount(value) {
  const normalized = cleanText(value).toLowerCase().replaceAll(',', '');
  const match = normalized.match(/(-?\d+(?:\.\d+)?)\s*([km])?\b/);
  if (!match) return null;
  const multiplier = match[2] === 'k' ? 1_000 : match[2] === 'm' ? 1_000_000 : 1;
  return Math.round(Number(match[1]) * multiplier);
}

function canonicalPermalink(value) {
  if (!value) return null;
  try {
    const url = new URL(value, REDDIT_ORIGIN);
    if (!/(^|\.)reddit\.com$/i.test(url.hostname)) return null;
    return `${REDDIT_ORIGIN}${url.pathname}`;
  } catch {
    return null;
  }
}

function subredditFrom(permalink, fallback) {
  return fallback || permalink?.match(/\/r\/([^/]+)/i)?.[1] || null;
}

function ageHours(createdAt, now) {
  const created = Date.parse(createdAt);
  return Number.isFinite(created) ? Math.max(0, (now.getTime() - created) / 3_600_000) : null;
}

function booleanAttribute(node, ...names) {
  return names.some((name) => {
    if (!node.hasAttribute(name)) return false;
    const value = node.getAttribute(name);
    return value === '' || value === 'true' || value === '1';
  });
}

function parseShredditPost(node, now) {
  const permalink = canonicalPermalink(node.getAttribute('permalink'));
  const createdAt = node.getAttribute('created-timestamp') || node.getAttribute('created-at');
  const rawId = node.getAttribute('id') || node.getAttribute('thingid');
  const id = rawId?.replace(/^t3_/, '') || permalink?.match(/\/comments\/([^/]+)/)?.[1];
  if (!id || !permalink) return null;
  return {
    id,
    title: cleanText(node.getAttribute('post-title') || node.getAttribute('title')),
    permalink,
    subreddit: subredditFrom(
      permalink,
      node.getAttribute('subreddit-prefixed-name')?.replace(/^r\//, ''),
    ),
    score: parseCount(node.getAttribute('score')),
    numComments: parseCount(node.getAttribute('comment-count')),
    createdAt: createdAt || null,
    ageHours: createdAt ? ageHours(createdAt, now) : null,
    locked: booleanAttribute(node, 'is-locked', 'locked'),
    archived: booleanAttribute(node, 'is-archived', 'archived'),
  };
}

function parseClassicPost(node, now) {
  const link = node.querySelector('a.comments, a[data-event-action="comments"]');
  const permalink = canonicalPermalink(
    node.getAttribute('data-permalink') || link?.getAttribute('href'),
  );
  const rawId = node.getAttribute('data-fullname') || node.getAttribute('id');
  const id =
    rawId?.replace(/^thing_t3_/, '').replace(/^t3_/, '') ||
    permalink?.match(/\/comments\/([^/]+)/)?.[1];
  if (!id || !permalink) return null;
  const createdAt = node.querySelector('time')?.getAttribute('datetime') || null;
  return {
    id,
    title: cleanText(node.querySelector('a.title')?.textContent),
    permalink,
    subreddit: subredditFrom(permalink, node.getAttribute('data-subreddit')),
    score: parseCount(
      node.querySelector('.score.unvoted, .score')?.getAttribute('title') ||
        node.querySelector('.score.unvoted, .score')?.textContent,
    ),
    numComments: parseCount(link?.textContent),
    createdAt,
    ageHours: createdAt ? ageHours(createdAt, now) : null,
    locked: booleanAttribute(node, 'data-locked'),
    archived: booleanAttribute(node, 'data-archived'),
  };
}

export function parseListingHtml(html, { now = new Date() } = {}) {
  const document = new JSDOM(html).window.document;
  const posts = [
    ...[...document.querySelectorAll('shreddit-post')].map((node) => parseShredditPost(node, now)),
    ...[...document.querySelectorAll('.thing.link')].map((node) => parseClassicPost(node, now)),
  ].filter(Boolean);
  return [...new Map(posts.map((post) => [post.id, post])).values()].map((post, index) => ({
    ...post,
    rank: index + 1,
  }));
}

function commentBody(node) {
  const body =
    node.querySelector('[slot="comment"]') ||
    node.querySelector('.md') ||
    node.querySelector('[data-testid="comment"]');
  return cleanText(body?.textContent);
}

function classicCommentDepth(node) {
  let depth = 0;
  let parent = node.parentElement;
  while (parent) {
    if (parent.matches?.('.thing.comment')) depth += 1;
    parent = parent.parentElement;
  }
  return depth;
}

export function parseThreadHtml(html, { now = new Date(), maxComments = 50 } = {}) {
  const document = new JSDOM(html).window.document;
  const postNode = document.querySelector('shreddit-post, .thing.link');
  const post = postNode?.matches('shreddit-post')
    ? parseShredditPost(postNode, now)
    : postNode
      ? parseClassicPost(postNode, now)
      : null;
  const body = cleanText(
    postNode?.querySelector(
      '[slot="text-body"], [data-post-click-location="text-body"], .usertext-body',
    )?.textContent,
  );
  const comments = [...document.querySelectorAll('shreddit-comment, .thing.comment')]
    .map((node) => {
      const text = commentBody(node);
      if (!text) return null;
      const explicitDepth = node.getAttribute('depth') ?? node.getAttribute('data-depth');
      const depth = explicitDepth == null ? classicCommentDepth(node) : Number(explicitDepth);
      const createdAt =
        node.getAttribute('created-timestamp') ||
        node.querySelector('time')?.getAttribute('datetime');
      return {
        author: null,
        body: text,
        score: parseCount(node.getAttribute('score') || node.querySelector('.score')?.textContent),
        depth: Number.isInteger(depth) && depth >= 0 ? depth : null,
        publishedAt: createdAt || null,
      };
    })
    .filter(Boolean)
    .slice(0, maxComments);
  return { post, body: body || null, comments };
}
