// Awareness lane — the one place that talks to Reddit's public RSS. Reddit
// answers anonymous feed requests with 429/403 after only a few in a row
// (community-scan inserted 8 leads/run and community-crawl hit 429 on 3 subs;
// seen again 2026-10-01), so every run gets a small REQUEST BUDGET, spaced out
// with exponential backoff, and a blocked source is skipped, never retried.
// After MAX_STRIKES consecutive failures the run stops asking altogether.
//
// Fallback: when the repo variable HOME_RELAY_URL is set (the same operator
// relay community-crawl uses, a URL-prefix proxy) a failed request gets ONE
// relay attempt, with the relay's mandatory randomized 1-11s pacing, at most
// `relayBudget` per run. Without it the fallback is simply absent.
import { fetchFeedPosts } from '../lib/reddit-rss.mjs';

export const DEFAULT_BUDGET = 6;
export const DEFAULT_PACING_MS = 6000;
export const MAX_STRIKES = 3;
const RELAY_MIN_MS = 1000;
const RELAY_SPAN_MS = 11000;

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function createFeedFetcher({
  budget = DEFAULT_BUDGET,
  pacingMs = DEFAULT_PACING_MS,
  relayUrl = null,
  relayBudget = 3,
  fetchImpl = fetch,
  sleep = wait,
  random = Math.random,
} = {}) {
  let used = 0;
  let strikes = 0;
  let relayUsed = 0;
  let aborted = false;
  const counts = { rateLimited: 0, blocked: 0, skipped: 0, viaRelay: 0 };

  async function attempt(url, label) {
    try {
      return await fetchFeedPosts(url, { label, fetchImpl });
    } catch (error) {
      return { posts: [], status: error?.status ?? 0 };
    }
  }
  const ok = (res) => res.status >= 200 && res.status < 300;

  return {
    stats: () => ({ used, strikes, relayUsed, aborted, ...counts }),
    /** `{ posts, status, via }`, or `{ skipped: true, posts: [] }` once the budget is spent or the run aborted. */
    async get(url, label) {
      if (aborted || used >= budget) {
        counts.skipped += 1;
        return { skipped: true, posts: [], status: null };
      }
      if (used > 0) await sleep(pacingMs * 2 ** strikes);
      used += 1;
      let res = await attempt(url, label);
      if (ok(res)) {
        strikes = Math.max(0, strikes - 1);
        return { ...res, via: 'direct' };
      }
      if (res.status === 429) counts.rateLimited += 1;
      else counts.blocked += 1;
      strikes += 1;
      if (relayUrl && relayUsed < relayBudget && used < budget) {
        await sleep(RELAY_MIN_MS + Math.floor(random() * RELAY_SPAN_MS));
        used += 1;
        relayUsed += 1;
        const viaRelay = await attempt(`${relayUrl.replace(/\/$/, '')}/${url}`, `${label} (relay)`);
        if (ok(viaRelay)) {
          counts.viaRelay += 1;
          strikes = Math.max(0, strikes - 1);
          return { ...viaRelay, via: 'relay' };
        }
        res = viaRelay;
      }
      if (strikes >= MAX_STRIKES) aborted = true;
      return { ...res, posts: [], via: null };
    },
  };
}
