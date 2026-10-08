// Awareness lane — what can be fetched. A run has a tiny request budget
// (awareness-fetch.mjs) and the scan runs every ~20 minutes, so the unit of
// work is one FEED: a subreddit listing in one sort (hot or new) or one
// Reddit-wide search RSS query, which finds Taylor threads OUTSIDE the fan
// subs (r/popculturechat, r/AskReddit, r/Music ...), the best awareness
// targets. Which feeds a run takes is decided by awareness-rotation.mjs
// (least recently fetched first, minus anything cooling down).

const NSFW_SUB_RE = /nsfw|porn|hentai|gonewild|onlyfans/i;

export function subFeedUrl(name, sort, limit = 25) {
  return `https://www.reddit.com/r/${name}/${sort}/.rss?limit=${limit}`;
}

export function searchFeedUrl(query, limit = 25) {
  const url = new URL('https://www.reddit.com/search.rss');
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'new');
  url.searchParams.set('t', 'day');
  url.searchParams.set('limit', String(limit));
  return url.href;
}

/** Every feed the lane knows: every sub hot, every sub new (so neighbours in the rotation are different subs), then each search query. */
export function buildFeeds(config, limit = 25) {
  const feeds = [];
  for (const sort of ['hot', 'new'])
    for (const sub of config.subs) {
      const source = { id: `sub:${sub.name}`, kind: 'sub', sub };
      feeds.push({ id: `${source.id}:${sort}`, source, url: subFeedUrl(sub.name, sort, limit) });
    }
  (config.search?.queries ?? []).forEach((query, i) => {
    const source = { id: `search:${i}`, kind: 'search', query };
    feeds.push({ id: source.id, source, url: searchFeedUrl(query, limit) });
  });
  return feeds;
}

export function communityFromPermalink(link) {
  const match = /\/r\/([^/]+)\/comments\//.exec(String(link ?? ''));
  return match ? match[1] : null;
}

/** Subs the lane never touches: NSFW by name, the config's excluded list, and the search block list. */
export function isBlockedSub(name, config) {
  const lower = String(name ?? '').toLowerCase();
  if (NSFW_SUB_RE.test(lower)) return true;
  const blocked = [
    ...(config.excluded ?? []).map((e) => e.name),
    ...(config.search?.blockSubs ?? []),
  ];
  return blocked.some((b) => b.toLowerCase() === lower);
}

/** Groups fetched posts by the community they belong to, dropping blocked/NSFW subs; best feed rank wins per id. */
export function groupByCommunity(fetched, config) {
  const groups = new Map();
  for (const { source, posts } of fetched) {
    for (const post of posts) {
      const name = source.kind === 'sub' ? source.sub.name : communityFromPermalink(post.permalink);
      if (!name || isBlockedSub(name, config)) continue;
      const group = groups.get(name) ?? new Map();
      const prior = group.get(post.id);
      if (!prior || post.rank < prior.rank) group.set(post.id, post);
      groups.set(name, group);
    }
  }
  return groups;
}
