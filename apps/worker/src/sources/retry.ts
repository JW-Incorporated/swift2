// Upstream-failure classification + bounded retry for source fetches. A single
// flaky feed (YouTube emits transient 404s, 429s and 5xx) must not redden the
// whole run; the ingest stage downgrades these to warnings.

const UPSTREAM_ERROR =
  /Status code (404|408|429|5\d\d)|HTTP (404|408|429|5\d\d)|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|fetch failed|timed? ?out/i;

export function isUpstreamError(err: unknown): boolean {
  return UPSTREAM_ERROR.test(err instanceof Error ? err.message : String(err));
}

// A 403 is a block, not a blip: never retried, but still a source-level failure.
export function isBlockedError(err: unknown): boolean {
  return /Status code 403|HTTP 403/i.test(err instanceof Error ? err.message : String(err));
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  /** Explicit waits between attempts; overrides retries/baseDelayMs. */
  delaysMs?: readonly number[];
  sleep?: (ms: number) => Promise<void>;
}

// YouTube's feed endpoint answers 404 for most requests and 200 for the rest
// (5 sequential fetches measured: 404 404 404 404 200). Keyless, so the fix is
// patience rather than a key: 3 attempts at
// 0s / 20s / 60s, well inside the hourly run's time limit.
export const YOUTUBE_FEED_RETRY_DELAYS_MS: readonly number[] = [20_000, 40_000];

export function isYouTubeFeedUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    return /(^|\.)youtube\.com$/i.test(hostname) && pathname === '/feeds/videos.xml';
  } catch {
    return false;
  }
}

// The uploads-playlist feed (UC… -> UU…) carries the same entries in the same
// Atom shape as the channel feed, behind a separate backend path.
export function youtubePlaylistFallbackUrl(url: string): string | null {
  if (!isYouTubeFeedUrl(url)) return null;
  const channelId = new URL(url).searchParams.get('channel_id');
  if (!channelId || !/^UC[\w-]+$/.test(channelId)) return null;
  return `https://www.youtube.com/feeds/videos.xml?playlist_id=UU${channelId.slice(2)}`;
}

// Only YouTube-side failures (404/5xx) justify the fallback; a 403 or a parse
// error would fail the same way on the playlist feed.
export function isFeedOutageError(err: unknown): boolean {
  return /Status code (404|5\d\d)|HTTP (404|5\d\d)/i.test(err instanceof Error ? err.message : String(err));
}

export function retryOptionsFor(url: string): RetryOptions {
  return isYouTubeFeedUrl(url)
    ? { delaysMs: YOUTUBE_FEED_RETRY_DELAYS_MS }
    : {};
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { baseDelayMs = 1000, delaysMs, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = opts;
  const retries = delaysMs ? delaysMs.length : (opts.retries ?? 2);
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isUpstreamError(err)) throw err;
      await sleep(delaysMs ? delaysMs[attempt]! : baseDelayMs * 2 ** attempt);
    }
  }
}
