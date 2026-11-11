export const MIN_REQUEST_DELAY_MS = 2_000;
export const DEFAULT_REQUEST_DELAY_MS = 6_000;
export const DEFAULT_JITTER_MS = 1_500;

export function createRequestPacer({
  delayMs = DEFAULT_REQUEST_DELAY_MS,
  jitterMs = DEFAULT_JITTER_MS,
  random = Math.random,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
  onWait = () => {},
} = {}) {
  if (!Number.isFinite(delayMs) || delayMs < MIN_REQUEST_DELAY_MS) {
    throw new Error(`request delay must be at least ${MIN_REQUEST_DELAY_MS}ms`);
  }
  if (!Number.isFinite(jitterMs) || jitterMs < 0) {
    throw new Error('request jitter must be zero or greater');
  }

  let lastRequestAt = null;
  return {
    async beforeRequest() {
      if (lastRequestAt != null) {
        const targetGap = delayMs + Math.floor(random() * (jitterMs + 1));
        const waitMs = Math.max(0, targetGap - Math.max(0, now() - lastRequestAt));
        if (waitMs > 0) {
          onWait(waitMs);
          await sleep(waitMs);
        }
      }
      lastRequestAt = now();
    },
  };
}
