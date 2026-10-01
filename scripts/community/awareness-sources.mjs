// Awareness lane — what to fetch this run. A run has a small request budget
// (awareness-fetch.mjs), so sources rotate: the `always` subs (the two
// biggest fan subs) every run, the rest in a rotation keyed on the UTC
// 3-hour slot, so every source is touched several times a day. Sources are
// subreddit listings plus Reddit-wide search RSS, which finds Taylor threads
// OUTSIDE the fan subs (r/popculturechat, r/AskReddit, r/Music ...), the best
// awareness targets.

const NSFW_SUB_RE = /nsfw|porn|hentai|gonewild|onlyfans/i;
const SLOTS_PER_DAY = 8;

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

export function buildSources(config) {
  const subs = config.subs.map((sub) => ({
    id: `sub:${sub.name}`,
    kind: 'sub',
    sub,
    always: sub.always === true,
  }));
  const searches = (config.search?.queries ?? []).map((query, i) => ({
    id: `search:${i}`,
    kind: 'search',
    query,
    always: false,
  }));
  return [...subs, ...searches];
}

export const slotOf = (now) => Math.floor(now.getUTCHours() / 3);
export const dayIndexOf = (now) => Math.floor(now.getTime() / 86_400_000);

/** The sources for this run: every `always` one, then a rotating window of the rest, up to `budget`. */
export function pickSources(sources, { slot, dayIndex, budget }) {
  const always = sources.filter((s) => s.always);
  const rest = sources.filter((s) => !s.always);
  const room = Math.max(0, budget - always.length);
  if (rest.length === 0 || room === 0) return always.slice(0, budget);
  const start = ((dayIndex * SLOTS_PER_DAY + slot) * room) % rest.length;
  const window = [];
  for (let i = 0; i < Math.min(room, rest.length); i += 1)
    window.push(rest[(start + i) % rest.length]);
  return [...always, ...window];
}

/** Hot on even slots, new on odd, so repeated runs cover both listings. */
export const sortFor = (slot, index = 0) => ((slot + index) % 2 === 0 ? 'hot' : 'new');

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
