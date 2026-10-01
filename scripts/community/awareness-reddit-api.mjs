// Awareness lane — authenticated Reddit API access (app-only OAuth). Anonymous
// RSS from GitHub runners is throttled hard (community-awareness-scan run
// 36908472939: HTTP 429 on 4 of 6 requests, 3 opportunities found), so when
// the secrets REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET exist the scan asks
// oauth.reddit.com instead (~100 requests/min per client). Without them the
// scan keeps the anonymous path in awareness-fetch.mjs, unchanged.
//
// Read-only: client_credentials grant, GET listings/search/about only. Nothing
// here (or anywhere in the lane) writes to Reddit. The token and the secret are
// never logged, never put in an error message, and never leave this module
// except as the Authorization header on a request to reddit.com.
import { parseAbout } from './awareness-eligibility.mjs';
import { buildSources } from './awareness-sources.mjs';

export const API_BASE = 'https://oauth.reddit.com';
export const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
export const DEFAULT_API_BUDGET = 40;
export const DEFAULT_API_PACING_MS = 700;
export const MAX_API_STRIKES = 3;
const MAX_WAIT_MS = 60_000;
const DEFAULT_USERNAME = 'longlivets';

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** `{ clientId, clientSecret, username }` when both secrets are set, else null (anonymous mode). */
export function redditAuthFromEnv(env = process.env) {
  const clientId = String(env.REDDIT_CLIENT_ID ?? '').trim();
  const clientSecret = String(env.REDDIT_CLIENT_SECRET ?? '').trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, username: env.REDDIT_USERNAME };
}

export function userAgentFor(username) {
  const name =
    String(username ?? '')
      .trim()
      .replace(/^\/?u\//i, '')
      .replace(/[^\w-]/g, '') || DEFAULT_USERNAME;
  return `longlive-awareness/1.0 (by u/${name})`;
}

export function apiListingUrl(name, sort, limit = 25) {
  return `${API_BASE}/r/${name}/${sort}?limit=${limit}&raw_json=1`;
}

export function apiSearchUrl(query, limit = 25) {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'new');
  url.searchParams.set('t', 'day');
  url.searchParams.set('type', 'link');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('raw_json', '1');
  return url.href;
}

export const apiAboutUrl = (name) => `${API_BASE}/r/${name}/about?raw_json=1`;

/** Listing JSON -> the candidate shape the RSS path yields (id/title/permalink/url/author/createdAt/rank), plus locked/archived. */
export function mapListing(json, { rankOffset = 0 } = {}) {
  const children = Array.isArray(json?.data?.children) ? json.data.children : [];
  const posts = [];
  for (const child of children) {
    const data = child?.data;
    if (child?.kind !== 't3' || !data?.id || !data.permalink) continue;
    if (data.over_18 === true) continue;
    posts.push({
      id: String(data.id),
      title: data.title ?? null,
      permalink: `https://www.reddit.com${data.permalink}`,
      url: data.url || `https://www.reddit.com${data.permalink}`,
      author: data.author ?? null,
      createdAt:
        typeof data.created_utc === 'number'
          ? new Date(data.created_utc * 1000).toISOString()
          : null,
      locked: data.locked === true,
      archived: data.archived === true,
      rank: rankOffset + posts.length + 1,
    });
  }
  return posts;
}

const ok = (status) => status >= 200 && status < 300;

/** Seconds Reddit asks us to wait: Retry-After, else x-ratelimit-reset; null when neither is readable. */
function waitHint(headers) {
  for (const name of ['retry-after', 'x-ratelimit-reset']) {
    const value = Number(headers?.get?.(name));
    if (Number.isFinite(value) && value >= 0) return Math.min(value * 1000, MAX_WAIT_MS);
  }
  return null;
}

export function createRedditApi({
  clientId,
  clientSecret,
  username,
  budget = DEFAULT_API_BUDGET,
  pacingMs = DEFAULT_API_PACING_MS,
  fetchImpl = fetch,
  sleep = wait,
} = {}) {
  const userAgent = userAgentFor(username);
  let token = null;
  let used = 0;
  let strikes = 0;
  let aborted = false;
  let remaining = null;
  let resetMs = 0;
  const counts = { rateLimited: 0, blocked: 0, skipped: 0 };

  async function authenticate() {
    token = null;
    try {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetchImpl(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent,
        },
        body: 'grant_type=client_credentials',
      });
      if (!ok(response.status)) return { ok: false, error: `token HTTP ${response.status}` };
      const body = await response.json();
      if (typeof body?.access_token !== 'string' || !body.access_token)
        return { ok: false, error: 'token response had no access_token' };
      token = body.access_token;
      return { ok: true };
    } catch (err) {
      return { ok: false, error: `token request failed: ${err?.name ?? 'error'}` };
    }
  }

  function readLimits(headers) {
    const left = Number(headers?.get?.('x-ratelimit-remaining'));
    const reset = Number(headers?.get?.('x-ratelimit-reset'));
    remaining = Number.isFinite(left) ? left : null;
    resetMs = Number.isFinite(reset) ? Math.min(reset * 1000, MAX_WAIT_MS) : 0;
  }

  /** One budgeted GET. `{ json, status }`, `{ skipped: true }` or `{ status, error }`; never throws. */
  async function request(url, label) {
    if (aborted || used >= budget || !token) {
      counts.skipped += 1;
      return { skipped: true, json: null, status: null };
    }
    if (used > 0) await sleep(remaining !== null && remaining <= 1 ? resetMs : pacingMs);
    for (let tries = 0; tries < 2; tries += 1) {
      if (used >= budget) {
        counts.skipped += 1;
        return { skipped: true, json: null, status: null };
      }
      used += 1;
      let response;
      try {
        response = await fetchImpl(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': userAgent,
            Accept: 'application/json',
          },
        });
      } catch {
        counts.blocked += 1;
        strikes += 1;
        if (strikes >= MAX_API_STRIKES) aborted = true;
        return { json: null, status: 0, error: `${label}: network error` };
      }
      readLimits(response.headers);
      if (ok(response.status)) {
        try {
          const json = await response.json();
          strikes = Math.max(0, strikes - 1);
          return { json, status: response.status };
        } catch {
          return { json: null, status: response.status, error: `${label}: bad JSON` };
        }
      }
      if (response.status === 429 && tries === 0) {
        counts.rateLimited += 1;
        await sleep(waitHint(response.headers) ?? pacingMs * 2 ** (strikes + 1));
        continue;
      }
      if (response.status === 429) counts.rateLimited += 1;
      else counts.blocked += 1;
      strikes += 1;
      if (strikes >= MAX_API_STRIKES) aborted = true;
      return { json: null, status: response.status, error: `${label}: HTTP ${response.status}` };
    }
    return { json: null, status: 429, error: `${label}: HTTP 429` };
  }

  return {
    authenticate,
    stats: () => ({ used, strikes, aborted, budget, ...counts }),
    /** `{ posts, status, via }` like createFeedFetcher().get, from a listing/search JSON URL. */
    async get(url, label, { rankOffset = 0 } = {}) {
      const res = await request(url, label);
      if (res.skipped) return { skipped: true, posts: [], status: null };
      if (!res.json) return { posts: [], status: res.status, via: null };
      return { posts: mapListing(res.json, { rankOffset }), status: res.status, via: 'oauth' };
    },
    /** `{ imageComments, over18 }` from /r/<sub>/about, or `{ ..., error }` (never throws). */
    async about(name) {
      const res = await request(apiAboutUrl(name), `about r/${name}`);
      if (!res.json)
        return {
          imageComments: 'unknown',
          over18: false,
          error: res.skipped ? 'budget spent' : (res.error ?? `HTTP ${res.status}`),
        };
      return parseAbout(res.json);
    },
  };
}

/** Authenticated listing requests: every sub hot + new, every search query; no rotation. */
export function oauthRequests(config, limit = 25) {
  const out = [];
  for (const source of buildSources(config)) {
    if (source.kind === 'sub') {
      for (const sort of ['hot', 'new'])
        out.push({
          source,
          label: `${source.id}/${sort}`,
          url: apiListingUrl(source.sub.name, sort, limit),
          rankOffset: sort === 'new' ? limit : 0,
        });
    } else {
      out.push({ source, label: source.id, url: apiSearchUrl(source.query, limit), rankOffset: 0 });
    }
  }
  return out;
}

/** `{ api, auth: 'oauth' }` once a token is held; otherwise `{ api: null, auth: 'anonymous', authError? }`. */
export async function connectRedditApi(redditAuth, { defaults = {}, fetchImpl, sleep } = {}) {
  if (!redditAuth) return { api: null, auth: 'anonymous', authError: null };
  const api = createRedditApi({
    ...redditAuth,
    budget: defaults.authedRequestsPerRun ?? DEFAULT_API_BUDGET,
    pacingMs: defaults.authedPacingMs ?? DEFAULT_API_PACING_MS,
    fetchImpl,
    sleep,
  });
  const token = await api.authenticate();
  if (!token.ok) return { api: null, auth: 'anonymous', authError: token.error };
  return { api, auth: 'oauth', authError: null };
}
