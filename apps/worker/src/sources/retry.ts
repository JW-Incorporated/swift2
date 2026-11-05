// Upstream-failure classification + bounded retry for source fetches. A single
// flaky feed (YouTube emits transient 404s, 429s and 5xx) must not redden the
// whole run; the ingest stage downgrades these to warnings.

const UPSTREAM_ERROR =
  /Status code (404|408|429|5\d\d)|HTTP (404|408|429|5\d\d)|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|fetch failed|timed? ?out/i;

export function isUpstreamError(err: unknown): boolean {
  return UPSTREAM_ERROR.test(err instanceof Error ? err.message : String(err));
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

// YouTube's feed endpoint answers 404 for most requests and 200 for the rest
// (5 sequential fetches measured: 404 404 404 404 200), so it gets a deeper
// budget than other feeds: 5 attempts, 0.5s/1s/2s/4s between them.
export const YOUTUBE_FEED_MAX_ATTEMPTS = 5;
export const YOUTUBE_FEED_BASE_DELAY_MS = 500;

export function isYouTubeFeedUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    return /(^|\.)youtube\.com$/i.test(hostname) && pathname === '/feeds/videos.xml';
  } catch {
    return false;
  }
}

export function retryOptionsFor(url: string): RetryOptions {
  return isYouTubeFeedUrl(url)
    ? { retries: YOUTUBE_FEED_MAX_ATTEMPTS - 1, baseDelayMs: YOUTUBE_FEED_BASE_DELAY_MS }
    : {};
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 2, baseDelayMs = 1000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = opts;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isUpstreamError(err)) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}
