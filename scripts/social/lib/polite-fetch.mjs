// Polite downloader for the photo importer: identifies itself per Wikimedia's
// User-Agent policy, paces requests serially per host, honors Retry-After on
// 429/503, gives up on a host that keeps throttling, and stops starting new
// downloads once a total time budget is spent (2026-10-07: 146 of 150
// Wikimedia downloads got 429 in concert-photo-sourcing run 37635582323).

export const PHOTO_BOT_USER_AGENT = 'longlivets-photo-sourcing/1.0 (https://longlivets.com; social photo pipeline)';

export const DEFAULT_HOST_GAP_MS = 250;
export const HOST_GAPS_MS = { 'upload.wikimedia.org': 1000 };
export const MAX_RETRIES = 3;
export const MAX_RETRY_AFTER_MS = 60_000;
export const DEFAULT_BUDGET_MS = 30 * 60 * 1000;

export class HostSkippedError extends Error {}
export class BudgetExhaustedError extends Error {}

const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryDelayMs(res, attempt) {
  const header = Number(res.headers?.get?.('retry-after'));
  const base = Number.isFinite(header) && header > 0 ? header * 1000 : 2000 * 2 ** attempt;
  return Math.min(base, MAX_RETRY_AFTER_MS);
}

/** Strips tracking params (utm_*) that Commons appends to upload URLs. */
export function stripUtmParams(url) {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith('utm_')) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function createPoliteFetcher({
  fetchImpl = fetch,
  sleepImpl = realSleep,
  nowImpl = () => Date.now(),
  warn = (message) => console.log(`::warning::${message}`),
  budgetMs = DEFAULT_BUDGET_MS,
} = {}) {
  const startedAt = nowImpl();
  const lastStart = new Map();
  const blocked = new Set();

  const budgetSpent = () => nowImpl() - startedAt >= budgetMs;

  async function politeFetch(url) {
    const host = new URL(url).host;
    const gap = HOST_GAPS_MS[host] ?? DEFAULT_HOST_GAP_MS;
    for (let attempt = 0; ; attempt++) {
      if (blocked.has(host)) throw new HostSkippedError(`skipped ${url}: ${host} keeps rate-limiting this run`);
      if (budgetSpent()) throw new BudgetExhaustedError('download time budget spent');
      const wait = (lastStart.get(host) ?? -Infinity) + gap - nowImpl();
      if (wait > 0) await sleepImpl(wait);
      lastStart.set(host, nowImpl());
      const res = await fetchImpl(url, { headers: { 'User-Agent': PHOTO_BOT_USER_AGENT } });
      if (res.status !== 429 && res.status !== 503) return res;
      if (attempt >= MAX_RETRIES) {
        blocked.add(host);
        warn(`${host} still returned ${res.status} after ${MAX_RETRIES} retries; skipping this host for the rest of the run`);
        return res;
      }
      await sleepImpl(retryDelayMs(res, attempt));
    }
  }

  return { fetch: politeFetch, budgetSpent };
}
