import Parser from 'rss-parser';
import { buildFeeds, communityFromPermalink } from '../../community/awareness-sources.mjs';

const parser = new Parser();

export function buildReaderSources(config, theorySubreddits = [], { subreddit = null } = {}) {
  if (subreddit) {
    return [
      {
        id: `smoke:${subreddit}:hot`,
        url: `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot/.rss?limit=20`,
        subreddit,
        theory: false,
      },
    ];
  }

  const sources = [];
  for (const name of theorySubreddits) {
    sources.push({
      id: `theory:${name}:new`,
      url: `https://www.reddit.com/r/${encodeURIComponent(name)}/new/.rss?limit=20`,
      subreddit: name,
      theory: true,
    });
  }
  for (const feed of buildFeeds(config, 20)) {
    sources.push({
      id: feed.id,
      url: feed.url,
      subreddit: feed.source.kind === 'sub' ? feed.source.sub.name : null,
      theory: theorySubreddits.some(
        (name) => name.toLowerCase() === feed.source.sub?.name?.toLowerCase(),
      ),
    });
  }

  const seen = new Set();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function canonicalPermalink(value) {
  try {
    const url = new URL(value);
    if (!/(^|\.)reddit\.com$/i.test(url.hostname)) return null;
    return `https://www.reddit.com${url.pathname}`;
  } catch {
    return null;
  }
}

export async function parseDiscoveryFeed(xml, source) {
  const feed = await parser.parseString(xml);
  return (feed.items ?? [])
    .map((item, index) => {
      const id = typeof item.id === 'string' ? item.id.match(/^t3_([\w-]+)$/)?.[1] : null;
      const permalink = canonicalPermalink(item.link);
      const subreddit = source.subreddit ?? communityFromPermalink(permalink);
      if (!id || !permalink || !subreddit) return null;
      return {
        id,
        title: item.title ?? null,
        permalink,
        subreddit,
        createdAt: item.isoDate ?? null,
        rank: index + 1,
        theory: source.theory,
      };
    })
    .filter(Boolean);
}

export function selectTopThreads(posts, maxThreads = 20) {
  if (!Number.isInteger(maxThreads) || maxThreads < 1 || maxThreads > 20) {
    throw new Error('maxThreads must be an integer from 1 to 20');
  }
  const deduped = new Map();
  for (const post of posts) {
    const prior = deduped.get(post.id);
    if (!prior || post.rank < prior.rank) {
      deduped.set(post.id, { ...post, theory: Boolean(post.theory || prior?.theory) });
    } else if (post.theory) prior.theory = true;
  }
  const timestamp = (value) => {
    const parsed = Date.parse(value ?? '');
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return [...deduped.values()]
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        timestamp(b.createdAt) - timestamp(a.createdAt) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, maxThreads);
}

export function detailUrl(post) {
  return `https://www.reddit.com/r/${encodeURIComponent(post.subreddit)}/comments/${encodeURIComponent(post.id)}.json?raw_json=1&limit=100&depth=2`;
}
