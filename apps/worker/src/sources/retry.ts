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
